/**
 * Pure report model + causes (GDD causality law).
 */

import { COPY } from '@/data/copy';
import type {
  CauseTag,
  GameState,
  MonthReport,
  PendingShipment,
  RunOutcome,
  SpeciesId,
} from '@/sim/types';
import type { EventId } from '@/data/events';

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
  const headline = pickHeadline(input);

  return {
    month: input.month,
    headline,
    causes: input.causes,
    harvestLine: input.harvestLine,
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

function pickHeadline(input: BuildReportInput): string {
  if (input.outcome === 'won') {
    return `${input.state.meta.colonyName}: self-sufficient — Earth will toast you.`;
  }
  if (input.outcome === 'lost') {
    return `${input.state.meta.colonyName}: colony life support failed.`;
  }
  if (input.events.includes('dust')) {
    return 'Dust storm month — power and O₂ stressed.';
  }
  if (input.events.includes('cold')) {
    return 'Cold snap across the dome — algae complains.';
  }
  if (input.losses.length > 0) {
    return 'Transit loss reported — cargo did not arrive.';
  }
  if (input.arrivals.length > 0) {
    return 'Arrivals processed — greenhouse composition shifted.';
  }
  if (input.ecosystemFoodHarvested > 0) {
    return 'Local harvest on the table — web is feeding someone.';
  }
  // Deterministic pick from starter headlines by month
  const idx = (input.month - 1) % COPY.headlines.length;
  return COPY.headlines[idx]!;
}
