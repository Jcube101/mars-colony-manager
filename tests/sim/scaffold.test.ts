import { describe, expect, it } from 'vitest';
import { SPECIES_IDS } from '@/data/species';
import { createInitialState } from '@/sim/state';

describe('phase 1 scaffold (still green)', () => {
  it('exposes the eight GDD species ids', () => {
    expect(SPECIES_IDS).toHaveLength(8);
  });

  it('boots a real initial game state (replaces scaffold placeholder)', () => {
    const state = createInitialState({
      seed: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(state.calendar.month).toBe(1);
    expect(state.colony.population).toBe(12);
  });
});
