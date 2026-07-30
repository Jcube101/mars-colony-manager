import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  endMonth,
  runHeadlessGame,
  startMonth,
} from '@/sim/index';
import type { PlayerAction } from '@/sim/types';
import { maxHarvestable } from '@/sim/harvest';
import { listEstablishedSpecies } from '@/sim/winLoss';
import { cloneState } from '@/sim/clone';
import { applyAction } from '@/sim/shipments';
import { createRng } from '@/sim/rng';

function fixedState(seed = 42) {
  return createInitialState({
    seed,
    colonyName: 'Hephaestus',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
}

/** RNG that never fails chance() — for lag tests that need a guaranteed queue. */
function safeRng() {
  return {
    next: () => 0.99,
    nextInt: (max: number) => (max > 0 ? max - 1 : 0),
    chance: () => false,
    getState: () => 1,
  };
}

describe('shipment lag (GDD +2 months)', () => {
  it('queues species for arrival at currentMonth + 2', () => {
    let state = fixedState(7);
    state = startMonth(state).state;
    expect(state.calendar.month).toBe(1);

    // Queue without loss roll noise
    const queued = applyAction(
      state,
      { type: 'request_species', speciesId: 'grass' },
      safeRng(),
    );
    state = queued.state;
    const pending = state.shipments.find((s) => s.payload.kind === 'species');
    expect(pending).toBeDefined();
    expect(pending!.arrivesMonth).toBe(3);

    // Resolve rest of month 1 with stand_by so calendar advances cleanly
    // (already queued — use endMonth stand_by would double-queue; advance via full months)
    // Re-build: endMonth from fresh start with forced no-loss path is harder;
    // continue delivery test by manually setting calendar.
    state.calendar.month = 2;
    state.calendar.phase = 'decision';
    const m2 = startMonth(state);
    state = m2.state;
    expect(m2.arrivals).toHaveLength(0);

    state.calendar.month = 3;
    const m3 = startMonth(state);
    expect(m3.arrivals.some((a) => a.payload.kind === 'species')).toBe(true);
    expect(m3.state.biome.plants.grass).toBeGreaterThan(0);
  });

  it('resource requests lag by +2 as well', () => {
    let state = fixedState(8);
    state = startMonth(state).state;
    const queued = applyAction(
      state,
      { type: 'request_resource', resourceId: 'power' },
      safeRng(),
    );
    const ship = queued.state.shipments[0];
    expect(ship?.arrivesMonth).toBe(3);
  });
});

describe('emergency priority', () => {
  it('applies emergency costs and rushes a shipment due later than next month', () => {
    let state = fixedState(13);
    state = startMonth(state).state;
    const queued = applyAction(
      state,
      { type: 'request_resource', resourceId: 'o2' },
      safeRng(),
    );
    state = queued.state;

    // Force shipment further out so emergency is legal (must be > month+1)
    expect(state.shipments.length).toBeGreaterThan(0);
    state.shipments[0]!.arrivesMonth = state.calendar.month + 3;
    const id = state.shipments[0]!.id;
    const powerBefore = state.colony.powerBuffer;
    const moraleBefore = state.colony.morale;
    const decisionMonth = state.calendar.month;

    // Apply emergency with rng that does not lose the rush
    const rushed = applyAction(
      state,
      { type: 'emergency', shipmentId: id },
      safeRng(),
    );
    state = rushed.state;

    expect(state.colony.powerBuffer).toBeLessThan(powerBefore);
    expect(state.colony.morale).toBeLessThan(moraleBefore);

    const still = state.shipments.find((s) => s.id === id);
    expect(still).toBeDefined();
    expect(still!.arrivesMonth).toBe(decisionMonth + 1);
    expect(still!.rushed).toBe(true);
  });

  it('can lose an emergency rush (12% path via rng)', () => {
    let state = fixedState(14);
    state = startMonth(state).state;
    state = applyAction(
      state,
      { type: 'request_resource', resourceId: 'water' },
      safeRng(),
    ).state;
    state.shipments[0]!.arrivesMonth = state.calendar.month + 4;
    const id = state.shipments[0]!.id;

    // chance() always true → emergency loss
    const loseRng = {
      next: () => 0.01,
      nextInt: () => 0,
      chance: () => true,
      getState: () => 1,
    };
    const result = applyAction(state, { type: 'emergency', shipmentId: id }, loseRng);
    expect(result.losses.length).toBeGreaterThan(0);
    expect(result.state.shipments.find((s) => s.id === id)).toBeUndefined();
  });
});

describe('harvest floors', () => {
  it('caps harvestable amount at ~25% and reserve floor', () => {
    expect(maxHarvestable(100, false)).toBe(25);
    expect(maxHarvestable(20, false)).toBe(5);
    expect(maxHarvestable(10, false)).toBe(2);
    expect(maxHarvestable(8, false)).toBe(2);
    expect(maxHarvestable(4, false)).toBe(0);
    expect(maxHarvestable(100, true)).toBe(50);
  });

  it('does not wipe a large rabbit population in one harvest', () => {
    let state = fixedState(21);
    state.biome.animals.rabbits = 40;
    state.biome.plants.grass = 50;
    state.colony.food.units = [
      { amount: 100, tier: '++', source: 'earth_rations' },
    ];
    state = startMonth(state).state;
    state = endMonth(state, { type: 'stand_by' }).state;
    expect(state.biome.animals.rabbits).toBeGreaterThan(0);
  });
});

describe('earth window', () => {
  it('locks species requests in months 19–24', () => {
    let state = fixedState(30);
    state.calendar.month = 19;
    state = startMonth(state).state;
    expect(state.flags.earthSpeciesLocked).toBe(true);
    const view = startMonth(state).view;
    expect(view.availableActions.species).toHaveLength(0);
    expect(view.earthWindow).toBe('resource_only');

    const ended = endMonth(state, {
      type: 'request_species',
      speciesId: 'grass',
    });
    const speciesShips = ended.state.shipments.filter(
      (s) => s.payload.kind === 'species',
    );
    expect(speciesShips).toHaveLength(0);
  });
});

describe('win/loss helpers', () => {
  it('counts established species from biome floors', () => {
    const state = fixedState(1);
    expect(listEstablishedSpecies(state)).toEqual(
      expect.arrayContaining(['algae']),
    );

    state.biome.plants.grass = 20;
    state.biome.animals.insects = 20;
    state.biome.animals.rabbits = 10;
    const est = listEstablishedSpecies(state);
    expect(est.length).toBeGreaterThanOrEqual(4);
  });

  it('loses when food is depleted after upkeep', () => {
    let state = fixedState(99);
    state.colony.food.units = [];
    state.calendar.month = 2;
    state.outcome = 'ongoing';
    state = startMonth(state).state;
    const ended = endMonth(state, { type: 'stand_by' });
    expect(ended.report.outcome).toBe('lost');
    expect(ended.report.lossReason).toMatch(/food|population/);
  });
});

describe('seed determinism', () => {
  it('same seed + same actions ⇒ identical reports and state', () => {
    const actions: PlayerAction[] = [
      { type: 'request_species', speciesId: 'grass' },
      { type: 'request_resource', resourceId: 'power' },
      { type: 'request_species', speciesId: 'insects' },
      { type: 'stand_by' },
      { type: 'request_resource', resourceId: 'o2' },
    ];

    const a = runHeadlessGame(
      createInitialState({ seed: 1234, createdAt: 't0' }),
      actions,
    );
    const b = runHeadlessGame(
      createInitialState({ seed: 1234, createdAt: 't0' }),
      actions,
    );

    expect(a.reports.length).toBe(b.reports.length);
    expect(a.reports.map((r) => r.headline)).toEqual(
      b.reports.map((r) => r.headline),
    );
    expect(a.reports.map((r) => r.outcome)).toEqual(
      b.reports.map((r) => r.outcome),
    );
    expect(a.state.colony.population).toBe(b.state.colony.population);
    expect(a.state.colony.o2Buffer).toBe(b.state.colony.o2Buffer);
    expect(a.state.biome.plants.grass).toBe(b.state.biome.plants.grass);
    expect(a.state.rngState).toBe(b.state.rngState);
    expect(a.state.shipments).toEqual(b.state.shipments);
  });
});

describe('24-month headless run', () => {
  it('can execute a full scripted 24-month game', () => {
    const plan: PlayerAction[] = [
      { type: 'request_species', speciesId: 'grass' },
      { type: 'request_resource', resourceId: 'o2' },
      { type: 'request_species', speciesId: 'insects' },
      { type: 'request_resource', resourceId: 'power' },
      { type: 'request_species', speciesId: 'rabbits' },
      { type: 'request_resource', resourceId: 'water' },
      { type: 'request_species', speciesId: 'algae' },
      { type: 'request_resource', resourceId: 'nutrients' },
      { type: 'request_species', speciesId: 'deer' },
      { type: 'request_resource', resourceId: 'o2' },
      { type: 'request_species', speciesId: 'tree' },
      { type: 'request_resource', resourceId: 'power' },
      { type: 'request_species', speciesId: 'mycelium' },
      { type: 'request_resource', resourceId: 'water' },
      { type: 'request_species', speciesId: 'insects' },
      { type: 'request_resource', resourceId: 'o2' },
      { type: 'request_species', speciesId: 'rabbits' },
      { type: 'request_resource', resourceId: 'power' },
      { type: 'request_resource', resourceId: 'o2' },
      { type: 'request_resource', resourceId: 'power' },
      { type: 'request_resource', resourceId: 'water' },
      { type: 'request_resource', resourceId: 'nutrients' },
      { type: 'stand_by' },
      { type: 'stand_by' },
    ];

    const { state, reports } = runHeadlessGame(
      createInitialState({ seed: 2026, createdAt: 't0' }),
      plan,
    );

    expect(reports.length).toBeGreaterThanOrEqual(1);
    expect(reports.length).toBeLessThanOrEqual(24);

    if (reports.length === 24) {
      expect(['won', 'lost']).toContain(reports[23]!.outcome);
      expect(state.calendar.phase).toBe('ended');
    } else {
      expect(state.outcome).toBe('lost');
    }

    for (const r of reports) {
      expect(r.causes.length).toBeGreaterThan(0);
      expect(r.month).toBeGreaterThanOrEqual(1);
      expect(r.month).toBeLessThanOrEqual(24);
    }
  });

  it('stand-by-only run progresses until loss or month 24', () => {
    const actions = Array.from(
      { length: 24 },
      () => ({ type: 'stand_by' }) as PlayerAction,
    );
    const { reports } = runHeadlessGame(
      createInitialState({ seed: 1, createdAt: 't0' }),
      actions,
    );
    expect(reports.length).toBeGreaterThanOrEqual(1);
  });
});

describe('startMonth / endMonth API', () => {
  it('startMonth delivers and endMonth returns a report with outcome', () => {
    let state = fixedState(5);
    const { state: s1, view } = startMonth(state);
    expect(view.month).toBe(1);
    expect(view.availableActions.canStandBy).toBe(true);
    const { state: s2, report } = endMonth(s1, { type: 'stand_by' });
    expect(report.month).toBe(1);
    expect(report.headline.length).toBeGreaterThan(0);
    expect(s2.calendar.month).toBe(2);
    expect(cloneState(s2).meta.seed).toBe(5);
  });

  it('createRng is available for external tooling', () => {
    const rng = createRng(1);
    expect(rng.next()).toBeGreaterThanOrEqual(0);
  });
});
