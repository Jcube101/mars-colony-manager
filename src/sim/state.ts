/**
 * Core types and initial state factory (placeholder — Phase 2).
 * GameState shape lives in SPEC.md §5.
 */

/** Placeholder until Phase 2 domain model. */
export type GameState = {
  readonly scaffold: true;
};

export function createPlaceholderState(): GameState {
  return { scaffold: true };
}
