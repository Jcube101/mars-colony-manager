import { describe, expect, it } from 'vitest';
import {
  parseSave,
  serializeSave,
  validateGameState,
  writeAutosave,
  type StorageDriver,
} from '@/save/index';
import { createInitialState, endMonth, startMonth } from '@/sim/index';
import type { GameState, MonthReport } from '@/sim/types';

function envelope(
  state: unknown,
  extra: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    format: 'mars-colony-manager-save',
    formatVersion: 1,
    savedAt: 't',
    slot: 0,
    state,
    ...extra,
  });
}

function sampleState(): GameState {
  return createInitialState({
    seed: 42,
    colonyName: 'Hephaestus',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
}

const sampleReport: MonthReport = {
  month: 1,
  headline: 'Dust settles.',
  causes: [{ type: 'system', description: 'Opening month.' }],
  events: ['quiet'],
  arrivals: [],
  losses: [],
  ecosystemFoodHarvested: 0,
  o2Produced: 1,
  o2Consumed: 12,
  foodSelfSufficient: false,
  o2SelfSufficient: false,
  establishedSpecies: ['algae'],
  outcome: 'ongoing',
};

describe('validateGameState (untrusted JSON)', () => {
  it('accepts a factory initial state and drops unknown keys', () => {
    const state = sampleState();
    const withJunk = {
      ...state,
      extra: 'nope',
      colony: { ...state.colony, leftover: true },
    };
    const result = validateGameState(withJunk);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.meta.seed).toBe(42);
    expect(result.state.colony.population).toBe(12);
    expect('extra' in result.state).toBe(false);
    expect('leftover' in result.state.colony).toBe(false);
  });

  it('rejects missing nested biome plants', () => {
    const state = sampleState() as unknown as Record<string, unknown>;
    const biome = { ...(state.biome as object), plants: undefined };
    const result = validateGameState({ ...state, biome });
    expect(result.ok).toBe(false);
  });

  it('rejects a bad food tier', () => {
    const state = sampleState();
    state.colony.food.units[0] = {
      amount: 10,
      tier: 'legendary' as never,
      source: 'earth_rations',
    };
    const result = validateGameState(state);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/tier/);
  });

  it('rejects NaN / non-finite colony buffers', () => {
    const state = sampleState();
    state.colony.o2Buffer = Number.NaN;
    expect(validateGameState(state).ok).toBe(false);
  });

  it('rejects a shipment with an unknown species', () => {
    const state = sampleState();
    state.shipments.push({
      id: 's1',
      payload: { kind: 'species', speciesId: 'xenomorph' as never },
      arrivesMonth: 3,
      rushed: false,
    });
    const result = validateGameState(state);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/speciesId/);
  });

  it('rejects a non-integer animal count', () => {
    const state = sampleState();
    state.biome.animals.rabbits = 1.5;
    expect(validateGameState(state).ok).toBe(false);
  });
});

describe('parseSave lastReport', () => {
  it('accepts a valid lastReport', () => {
    const parsed = parseSave(envelope(sampleState(), { lastReport: sampleReport }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.save.lastReport?.headline).toBe('Dust settles.');
    expect(parsed.save.lastReport?.causes[0]?.type).toBe('system');
  });

  it('rejects a lastReport that is not an object', () => {
    const parsed = parseSave(envelope(sampleState(), { lastReport: 'nope' }));
    expect(parsed.ok).toBe(false);
  });

  it('rejects a lastReport missing headline', () => {
    const { headline: _, ...rest } = sampleReport;
    const parsed = parseSave(envelope(sampleState(), { lastReport: rest }));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/headline/);
  });

  it('rejects a lastReport with an unknown event id', () => {
    const parsed = parseSave(
      envelope(sampleState(), {
        lastReport: { ...sampleReport, events: ['meteor'] },
      }),
    );
    expect(parsed.ok).toBe(false);
  });

  it('still round-trips a mid-run save that includes a real report', () => {
    let state = sampleState();
    state = startMonth(state).state;
    const ended = endMonth(state, { type: 'stand_by' });
    const json = serializeSave({
      state: ended.state,
      slot: 0,
      lastReport: ended.report,
    });
    const parsed = parseSave(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.save.lastReport?.month).toBe(ended.report.month);
    expect(parsed.save.lastReport?.outcome).toBe(ended.report.outcome);
    expect(parsed.save.state.calendar.month).toBe(ended.state.calendar.month);
  });
});

describe('autosave write failures', () => {
  it('returns an error when the driver throws (quota / private mode)', () => {
    const throwing: StorageDriver = {
      getItem: () => null,
      setItem: () => {
        const e = new Error('boom');
        e.name = 'QuotaExceededError';
        throw e;
      },
      removeItem: () => {},
    };
    const result = writeAutosave(sampleState(), null, throwing);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/quota/i);
  });
});
