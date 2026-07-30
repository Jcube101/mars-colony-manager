import { describe, expect, it } from 'vitest';
import { SPECIES_IDS, SPECIES_LIST } from '@/data/species';
import { RESOURCE_IDS, RESOURCE_LIST } from '@/data/resources';
import { EVENT_IDS, EVENT_LIST } from '@/data/events';
import { COPY } from '@/data/copy';
import {
  biomeSoilBand,
  createInitialState,
  totalFoodFu,
} from '@/sim/state';
import { createRng, rngFromState } from '@/sim/rng';

describe('createInitialState (Phase 2)', () => {
  it('constructs a valid initial GameState from seed', () => {
    const state = createInitialState({
      seed: 42,
      colonyName: 'Hephaestus',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(state.meta.version).toBe(1);
    expect(state.meta.seed).toBe(42);
    expect(state.meta.colonyName).toBe('Hephaestus');
    expect(state.meta.createdAt).toBe('2026-01-01T00:00:00.000Z');

    expect(state.calendar.month).toBe(1);
    expect(state.calendar.phase).toBe('decision');

    // GDD starting colony
    expect(state.colony.population).toBe(12);
    expect(state.colony.habitatCapacity).toBe(20);
    expect(state.colony.morale).toBe(60);
    expect(totalFoodFu(state)).toBe(36);
    expect(state.colony.food.units).toEqual([
      { amount: 36, tier: '++', source: 'earth_rations' },
    ]);
    // ~2 months O₂ without production → 12 × 2
    expect(state.colony.o2Buffer).toBe(24);
    expect(state.colony.powerBuffer).toBeGreaterThan(0);
    expect(state.colony.waterReserve).toBeGreaterThan(0);

    // GDD barren-ish biome: fair soil, adequate water, small algae, nothing else
    expect(biomeSoilBand(state)).toBe('fair');
    expect(state.biome.water).toBeGreaterThan(0);
    expect(state.biome.plants.algae).toBeGreaterThan(0);
    expect(state.biome.plants.grass).toBe(0);
    expect(state.biome.plants.trees).toEqual([]);
    expect(state.biome.animals).toEqual({
      insects: 0,
      rabbits: 0,
      deer: 0,
      wolves: 0,
    });
    expect(state.biome.mycelium).toBe(0);
    expect(state.biome.o2ProductionLastMonth).toBe(0);

    expect(state.shipments).toEqual([]);
    expect(state.flags.earthSpeciesLocked).toBe(false);
    expect(state.flags.workStoppage).toBe(false);
    expect(state.flags.lastEvents).toEqual([]);
    expect(state.history.foodSelfSufficient).toEqual([]);
    expect(state.history.o2SelfSufficient).toEqual([]);
    expect(typeof state.rngState).toBe('number');
    expect(state.outcome).toBe('ongoing');
    expect(state.lastArrivals).toEqual([]);
    expect(state.nextShipmentSeq).toBe(1);
  });

  it('defaults colony name to Hephaestus', () => {
    const state = createInitialState({ seed: 1, createdAt: '2026-01-01T00:00:00.000Z' });
    expect(state.meta.colonyName).toBe('Hephaestus');
  });

  it('same seed yields identical structural state (modulo createdAt)', () => {
    const a = createInitialState({ seed: 99, createdAt: 't0' });
    const b = createInitialState({ seed: 99, createdAt: 't0' });
    expect(a).toEqual(b);
  });
});

describe('data tables (Phase 2)', () => {
  it('defines all eight GDD species cards', () => {
    expect(SPECIES_IDS).toHaveLength(8);
    expect(SPECIES_LIST).toHaveLength(8);
    for (const id of SPECIES_IDS) {
      const card = SPECIES_LIST.find((c) => c.id === id);
      expect(card).toBeDefined();
      expect(card!.seedSize).toBeGreaterThan(0);
      expect(card!.growthRate).toBeGreaterThan(0);
    }
  });

  it('defines O₂ / water / nutrients / power packages', () => {
    expect(RESOURCE_IDS).toEqual(['o2', 'water', 'nutrients', 'power']);
    expect(RESOURCE_LIST).toHaveLength(4);
    for (const pkg of RESOURCE_LIST) {
      expect(pkg.packageAmount).toBeGreaterThan(0);
    }
  });

  it('defines event weights including dust, cold, blight, quiet, solar flare, illness', () => {
    expect(EVENT_IDS).toEqual(
      expect.arrayContaining([
        'dust',
        'cold',
        'blight',
        'quiet',
        'solar_flare',
        'illness',
      ]),
    );
    expect(EVENT_LIST).toHaveLength(6);
    const weightSum = EVENT_LIST.reduce((s, e) => s + e.weight, 0);
    expect(weightSum).toBeGreaterThan(0);
  });

  it('provides starter headline copy', () => {
    expect(COPY.headlines.length).toBeGreaterThanOrEqual(10);
    expect(COPY.defaultColonyName).toBe('Hephaestus');
  });
});

describe('seeded RNG (Phase 2)', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = [a.next(), a.next(), a.next(), a.nextInt(100), a.chance(0.5)];
    const seqB = [b.next(), b.next(), b.next(), b.nextInt(100), b.chance(0.5)];
    expect(seqA).toEqual(seqB);
  });

  it('diverges for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect([a.next(), a.next()]).not.toEqual([b.next(), b.next()]);
  });

  it('resumes from stored state', () => {
    const rng = createRng(7);
    rng.next();
    rng.next();
    const saved = rng.getState();
    const resumed = rngFromState(saved);
    expect(resumed.next()).toBe(rng.next());
  });

  it('returns floats in [0, 1)', () => {
    const rng = createRng(999);
    for (let i = 0; i < 50; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
