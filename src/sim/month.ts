/**
 * Month orchestration — single choke point matching GDD resolution order.
 *
 * Player-facing: startMonth (arrivals + decision view) → action → endMonth.
 *
 * endMonth order:
 * 1. Queue player order
 * 2. Ecosystem ×10 ticks
 * 3. Events
 * 4. Harvest
 * 5. Colony upkeep
 * 6. Attrition / growth checkpoint
 * 7. Win/loss
 * 8. Report model
 */

import { RESOURCE_IDS } from '@/data/resources';
import { SPECIES_IDS } from '@/data/species';
import { cloneState } from '@/sim/clone';
import { runColonyUpkeep } from '@/sim/colony';
import { runEcosystemMonth } from '@/sim/ecosystem';
import { resolveEvents } from '@/sim/events';
import { runHarvest } from '@/sim/harvest';
import { rngFromState } from '@/sim/rng';
import { buildMonthReport } from '@/sim/report';
import { applyAction, deliverArrivals } from '@/sim/shipments';
import { evaluateWinLoss } from '@/sim/winLoss';
import {
  RUN_MONTHS,
  type CauseTag,
  type DecisionView,
  type GameState,
  type MonthReport,
  type PendingShipment,
  type PlayerAction,
} from '@/sim/types';

export type StartMonthResult = {
  state: GameState;
  view: DecisionView;
  arrivals: PendingShipment[];
};

export type EndMonthResult = {
  state: GameState;
  report: MonthReport;
};

function earthWindow(month: number): DecisionView['earthWindow'] {
  if (month > RUN_MONTHS) return 'closed';
  if (month >= 19) return 'resource_only';
  return 'full';
}

function buildDecisionView(
  state: GameState,
  arrivals: PendingShipment[],
): DecisionView {
  const month = state.calendar.month;
  const locked = month >= 19;
  state.flags.earthSpeciesLocked = locked;

  const emergencyTargets = state.shipments.filter(
    (s) => s.arrivesMonth > month + 1,
  );

  return {
    month,
    monthsRemaining: Math.max(0, RUN_MONTHS - month + 1),
    earthSpeciesLocked: locked,
    earthWindow: earthWindow(month),
    colony: structuredClone(state.colony),
    biome: structuredClone(state.biome),
    pendingShipments: structuredClone(state.shipments),
    arrivals: structuredClone(arrivals),
    lastEvents: [...state.flags.lastEvents],
    forecast: state.forecast,
    availableActions: {
      species: locked ? [] : [...SPECIES_IDS],
      resources: [...RESOURCE_IDS],
      emergencyTargets: structuredClone(emergencyTargets),
      canStandBy: true,
    },
  };
}

/**
 * Start of month: deliver due shipments, expose decision view.
 * No-op for resolution if run already ended.
 */
export function startMonth(state: GameState): StartMonthResult {
  if (state.outcome !== 'ongoing' || state.calendar.phase === 'ended') {
    const view = buildDecisionView(state, state.lastArrivals);
    return { state, view, arrivals: state.lastArrivals };
  }

  const next = cloneState(state);
  const delivered = deliverArrivals(next);
  next.calendar.phase = 'decision';

  // Earth window flag for decision
  next.flags.earthSpeciesLocked = next.calendar.month >= 19;

  const view = buildDecisionView(next, delivered.arrivals);
  return { state: next, view, arrivals: delivered.arrivals };
}

/**
 * Validate / normalize action against Earth window (species lock).
 */
export function normalizeAction(
  state: GameState,
  action: PlayerAction,
): PlayerAction {
  if (action.type === 'request_species' && state.flags.earthSpeciesLocked) {
    return { type: 'stand_by' };
  }
  return action;
}

/**
 * End month choke point: queue action then full GDD resolution pipeline.
 */
export function endMonth(
  state: GameState,
  action: PlayerAction,
): EndMonthResult {
  if (state.outcome !== 'ongoing') {
    return {
      state,
      report: buildMonthReport({
        month: state.calendar.month,
        causes: [],
        events: [],
        arrivals: state.lastArrivals,
        losses: [],
        harvestLine: '',
        ecosystemFoodHarvested: 0,
        o2Produced: 0,
        o2Consumed: 0,
        foodSelfSufficient: false,
        o2SelfSufficient: false,
        establishedSpecies: [],
        outcome: state.outcome,
        lossReason: state.lossReason,
        state,
      }),
    };
  }

  const next = cloneState(state);
  const rng = rngFromState(next.rngState);
  const month = next.calendar.month;
  const arrivalsThisMonth = [...next.lastArrivals];
  const allCauses: CauseTag[] = [];
  const allLosses: string[] = [];

  // Snapshot arrivals as order causes already applied at startMonth;
  // re-tag lightly for report continuity
  for (const a of arrivalsThisMonth) {
    allCauses.push({
      type: 'order',
      description: `Arrival ${a.id} applied at start of month ${month}.`,
      shipmentId: a.id,
    });
  }

  // 1. Queue player order
  const act = normalizeAction(next, action);
  const queued = applyAction(next, act, rng);
  allCauses.push(...queued.causes);
  allLosses.push(...queued.losses);

  // 2. Ecosystem ×10
  const eco = runEcosystemMonth(next, rng);
  allCauses.push(...eco.causes);
  let o2Produced = eco.o2Produced;

  // 3. Events
  const ev = resolveEvents(next, rng, o2Produced);
  allCauses.push(...ev.causes);
  o2Produced = Math.max(0, o2Produced + ev.o2ProducedAdjust);

  // 4. Harvest
  const harv = runHarvest(next, ev.mods.illness);
  allCauses.push(...harv.causes);

  // 5–6. Upkeep + attrition / growth
  const up = runColonyUpkeep(next, {
    cold: ev.mods.cold,
    illness: ev.mods.illness,
  });
  allCauses.push(...up.causes);

  // 7. Win/loss
  const wl = evaluateWinLoss(next, {
    ecosystemFoodHarvested: harv.ecosystemFoodHarvested,
    o2Produced,
    o2Consumed: up.o2Consumed,
  });
  allCauses.push(...wl.causes);

  next.outcome = wl.outcome;
  next.lossReason = wl.lossReason;
  next.rngState = rng.getState();

  // Timeline beats
  if (wl.outcome !== 'ongoing' || allLosses.length > 0 || ev.events.length > 0) {
    next.history.timeline.push({
      month,
      kind: wl.outcome === 'ongoing' ? 'month' : wl.outcome,
      summary:
        wl.outcome === 'won'
          ? 'Victory'
          : wl.outcome === 'lost'
            ? (wl.lossReason ?? 'lost')
            : ev.events[0] ?? (allLosses[0] ?? 'resolved'),
    });
  }

  // 8. Report
  const report = buildMonthReport({
    month,
    causes: allCauses,
    events: ev.events,
    arrivals: arrivalsThisMonth,
    losses: allLosses,
    harvestLine: harv.harvestLine,
    ecosystemFoodHarvested: harv.ecosystemFoodHarvested,
    o2Produced,
    o2Consumed: up.o2Consumed,
    foodSelfSufficient: wl.foodSelfSufficient,
    o2SelfSufficient: wl.o2SelfSufficient,
    establishedSpecies: wl.establishedSpecies,
    outcome: wl.outcome,
    lossReason: wl.lossReason,
    state: next,
  });

  // Advance calendar
  if (wl.outcome === 'ongoing' && month < RUN_MONTHS) {
    next.calendar.month = month + 1;
    next.calendar.phase = 'decision';
    next.lastArrivals = [];
  } else {
    next.calendar.phase = 'ended';
    if (wl.outcome === 'ongoing' && month >= RUN_MONTHS) {
      // evaluateWinLoss should have set won/lost at 24
      next.calendar.phase = 'ended';
    }
  }

  return { state: next, report };
}

/**
 * Run a full scripted game: for each month, startMonth → endMonth(action).
 * Actions array is consumed in order; missing actions default to stand_by.
 */
export function runHeadlessGame(
  initial: GameState,
  actions: PlayerAction[],
): { state: GameState; reports: MonthReport[] } {
  let state = initial;
  const reports: MonthReport[] = [];

  for (let i = 0; i < RUN_MONTHS; i++) {
    if (state.outcome !== 'ongoing') break;

    const started = startMonth(state);
    state = started.state;

    const action = actions[i] ?? { type: 'stand_by' };
    const ended = endMonth(state, action);
    state = ended.state;
    reports.push(ended.report);

    if (ended.report.outcome !== 'ongoing') break;
  }

  return { state, reports };
}
