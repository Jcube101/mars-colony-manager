/**
 * Public sim surface for UI / tests.
 */

export { createInitialState, totalFoodFu, biomeSoilBand } from '@/sim/state';
export {
  startMonth,
  endMonth,
  normalizeAction,
  runHeadlessGame,
} from '@/sim/month';
export { createRng, rngFromState } from '@/sim/rng';
export { maxHarvestable, harvestLabor } from '@/sim/harvest';
export { listEstablishedSpecies, evaluateWinLoss } from '@/sim/winLoss';
export { applyAction, deliverArrivals } from '@/sim/shipments';
export type {
  GameState,
  PlayerAction,
  MonthReport,
  DecisionView,
  RunOutcome,
  CauseTag,
} from '@/sim/types';
