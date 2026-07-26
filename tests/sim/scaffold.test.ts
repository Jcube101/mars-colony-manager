import { describe, expect, it } from 'vitest';
import { createPlaceholderState } from '@/sim/state';
import { SPECIES_IDS } from '@/data/species';

describe('phase 1 scaffold', () => {
  it('boots a placeholder game state', () => {
    const state = createPlaceholderState();
    expect(state.scaffold).toBe(true);
  });

  it('exposes the eight GDD species ids', () => {
    expect(SPECIES_IDS).toHaveLength(8);
  });
});
