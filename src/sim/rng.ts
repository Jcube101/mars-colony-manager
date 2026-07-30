/**
 * Seeded PRNG for the sim core.
 * No bare Math.random() in rules — inject this stream only.
 *
 * Algorithm: mulberry32 (fast 32-bit, good enough for game noise).
 */

export type Rng = {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  /** True with probability p (clamped to [0, 1]). */
  chance(p: number): boolean;
  /** Current internal state (persist on GameState.rngState). */
  getState(): number;
};

function mulberry32Step(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value: result, state: t >>> 0 };
}

/**
 * Create a PRNG from a numeric seed.
 * Seed is coerced to uint32; identical seeds ⇒ identical streams.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  // Avoid the all-zero trap feeling "stuck" on first call for seed 0.
  if (state === 0) {
    state = 0xdeadbeef;
  }

  return {
    next(): number {
      const stepped = mulberry32Step(state);
      state = stepped.state;
      return stepped.value;
    },
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.floor(this.next() * maxExclusive);
    },
    chance(p: number): boolean {
      if (p <= 0) return false;
      if (p >= 1) return true;
      return this.next() < p;
    },
    getState(): number {
      return state;
    },
  };
}

/** Resume a PRNG from a previously stored state word. */
export function rngFromState(rngState: number): Rng {
  let state = rngState >>> 0;
  return {
    next(): number {
      const stepped = mulberry32Step(state);
      state = stepped.state;
      return stepped.value;
    },
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.floor(this.next() * maxExclusive);
    },
    chance(p: number): boolean {
      if (p <= 0) return false;
      if (p >= 1) return true;
      return this.next() < p;
    },
    getState(): number {
      return state;
    },
  };
}
