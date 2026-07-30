/**
 * Pure report model + causes (GDD causality law).
 */

import { COPY } from '@/data/copy';
import type { EventId } from '@/data/events';
import type {
  CauseTag,
  GameState,
  MonthReport,
  PendingShipment,
  RunOutcome,
  SpeciesId,
} from '@/sim/types';

export type { CauseTag, MonthReport } from '@/sim/types';

export function emptyMonthReport(month: number): MonthReport {
  return {
    month,
    headline: '',
    causes: [],
    events: [],
    arrivals: [],
    losses: [],
    ecosystemFoodHarvested: 0,
    o2Produced: 0,
    o2Consumed: 0,
    foodSelfSufficient: false,
    o2SelfSufficient: false,
    establishedSpecies: [],
    outcome: 'ongoing',
  };
}

export type BuildReportInput = {
  month: number;
  causes: CauseTag[];
  events: EventId[];
  arrivals: PendingShipment[];
  losses: string[];
  harvestLine: string;
  ecosystemFoodHarvested: number;
  o2Produced: number;
  o2Consumed: number;
  foodSelfSufficient: boolean;
  o2SelfSufficient: boolean;
  establishedSpecies: SpeciesId[];
  outcome: RunOutcome;
  lossReason?: string;
  state: GameState;
};

export function buildMonthReport(input: BuildReportInput): MonthReport {
  return {
    month: input.month,
    headline: pickHeadline(input),
    causes: input.causes,
    harvestLine: input.harvestLine || COPY.empty.noHarvest,
    events: input.events,
    arrivals: input.arrivals,
    losses: input.losses,
    ecosystemFoodHarvested: input.ecosystemFoodHarvested,
    o2Produced: input.o2Produced,
    o2Consumed: input.o2Consumed,
    foodSelfSufficient: input.foodSelfSufficient,
    o2SelfSufficient: input.o2SelfSufficient,
    establishedSpecies: input.establishedSpecies,
    outcome: input.outcome,
    lossReason: input.lossReason,
  };
}

export function failureCopy(lossReason?: string): string {
  if (!lossReason) return COPY.failure.unknown;
  return COPY.failure[lossReason] ?? COPY.failure.unknown;
}

function pickHeadline(input: BuildReportInput): string {
  const name = input.state.meta.colonyName;

  if (input.outcome === 'won') {
    return `${name}: self-sufficient — Earth will toast you.`;
  }
  if (input.outcome === 'lost') {
    const key = input.lossReason ?? 'default';
    return (
      COPY.lossHeadlines[key] ??
      COPY.lossHeadlines.default ??
      `${name}: colony life support failed.`
    );
  }
  if (input.events.includes('dust')) {
    return 'Dust storm month — power and O₂ production stressed.';
  }
  if (input.events.includes('cold')) {
    return 'Cold snap across the dome — algae and food need under pressure.';
  }
  if (input.events.includes('solar_flare')) {
    return 'Solar flare: next Earth request will ship a month late.';
  }
  if (input.events.includes('blight')) {
    return 'Blight struck the web — check which population was cut.';
  }
  if (input.events.includes('illness')) {
    return 'Illness aboard — elevated food need, thinner harvest labor.';
  }
  if (input.losses.length > 0) {
    return 'Transit loss reported — cargo did not arrive. Re-plan the lag.';
  }
  if (input.arrivals.length > 0) {
    return 'Arrivals processed — greenhouse composition shifted. Look two months ahead.';
  }
  if (input.ecosystemFoodHarvested > 0) {
    return 'Local harvest on the table — the web is starting to feed you.';
  }
  if (input.foodSelfSufficient && input.o2SelfSufficient) {
    return 'Clean month: ecosystem food and O₂ covered demand. Streak matters.';
  }
  const idx = (input.month - 1) % COPY.headlines.length;
  return COPY.headlines[idx]!;
}
