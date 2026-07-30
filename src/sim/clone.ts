import type { GameState } from '@/sim/types';

/** Deep-clone game state for pure pipeline steps (structuredClone). */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}
