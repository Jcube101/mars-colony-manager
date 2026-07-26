/**
 * Seeded PRNG (placeholder — Phase 2).
 * No bare Math.random() in sim rules.
 */

export type Rng = {
  next(): number;
};

/** Stub — real mulberry32 (or equiv) in Phase 2. */
export function createRng(_seed: number): Rng {
  return {
    next(): number {
      return 0;
    },
  };
}
