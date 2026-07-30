import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearMemoryDriver,
  listSlots,
  memoryDriver,
  parseSave,
  readAutosave,
  readSlot,
  serializeSave,
  writeAutosave,
  writeSlot,
} from '@/save/index';
import {
  createInitialState,
  endMonth,
  startMonth,
} from '@/sim/index';

describe('save serialize / parse', () => {
  it('round-trips a fresh GameState', () => {
    const state = createInitialState({
      seed: 42,
      colonyName: 'Hephaestus',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const json = serializeSave({ state, slot: 1 });
    const parsed = parseSave(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.save.format).toBe('mars-colony-manager-save');
    expect(parsed.save.formatVersion).toBe(1);
    expect(parsed.save.slot).toBe(1);
    expect(parsed.save.state.meta.seed).toBe(42);
    expect(parsed.save.state.meta.colonyName).toBe('Hephaestus');
    expect(parsed.save.state.colony.population).toBe(12);
    expect(parsed.save.state.rngState).toBe(state.rngState);
  });

  it('round-trips mid-run state after months of play', () => {
    let state = createInitialState({
      seed: 99,
      createdAt: 't0',
    });
    state = startMonth(state).state;
    state = endMonth(state, {
      type: 'request_species',
      speciesId: 'grass',
    }).state;
    state = startMonth(state).state;
    state = endMonth(state, { type: 'stand_by' }).state;
    state = startMonth(state).state;

    const json = serializeSave({
      state,
      slot: 0,
      lastReport: {
        month: 2,
        headline: 'test',
        causes: [],
        events: [],
        arrivals: [],
        losses: [],
        ecosystemFoodHarvested: 0,
        o2Produced: 1,
        o2Consumed: 12,
        foodSelfSufficient: false,
        o2SelfSufficient: false,
        establishedSpecies: [],
        outcome: 'ongoing',
      },
    });

    const parsed = parseSave(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.save.state.calendar.month).toBe(state.calendar.month);
    expect(parsed.save.state.shipments).toEqual(state.shipments);
    expect(parsed.save.state.history.foodSelfSufficient.length).toBe(
      state.history.foodSelfSufficient.length,
    );
    expect(parsed.save.lastReport?.headline).toBe('test');
  });

  it('rejects corrupt or wrong-format JSON', () => {
    expect(parseSave('not json').ok).toBe(false);
    expect(parseSave('{}').ok).toBe(false);
    expect(
      parseSave(
        JSON.stringify({
          format: 'other',
          formatVersion: 1,
          savedAt: 't',
          slot: 0,
          state: {},
        }),
      ).ok,
    ).toBe(false);
    expect(
      parseSave(
        JSON.stringify({
          format: 'mars-colony-manager-save',
          formatVersion: 99,
          savedAt: 't',
          slot: 0,
          state: createInitialState({ seed: 1, createdAt: 't' }),
        }),
      ).ok,
    ).toBe(false);
  });
});

describe('slot + autosave storage (memory driver)', () => {
  beforeEach(() => {
    clearMemoryDriver();
  });

  it('writes and reads three slots', () => {
    const a = createInitialState({ seed: 1, colonyName: 'A', createdAt: 't' });
    const b = createInitialState({ seed: 2, colonyName: 'B', createdAt: 't' });
    const c = createInitialState({ seed: 3, colonyName: 'C', createdAt: 't' });

    expect(writeSlot(0, a, null, memoryDriver).ok).toBe(true);
    expect(writeSlot(1, b, null, memoryDriver).ok).toBe(true);
    expect(writeSlot(2, c, null, memoryDriver).ok).toBe(true);

    const slots = listSlots(memoryDriver);
    expect(slots.every((s) => !s.empty)).toBe(true);
    expect(slots[0]?.colonyName).toBe('A');
    expect(slots[1]?.seed).toBe(2);
    expect(slots[2]?.colonyName).toBe('C');

    const loaded = readSlot(1, memoryDriver);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.save.state.meta.seed).toBe(2);
  });

  it('autosave survives “close tab” (same driver) for resume', () => {
    let state = createInitialState({
      seed: 2026,
      colonyName: 'ResumeTest',
      createdAt: 't0',
    });
    state = startMonth(state).state;
    state = endMonth(state, {
      type: 'request_resource',
      resourceId: 'o2',
    }).state;
    state = startMonth(state).state;

    const written = writeAutosave(state, null, memoryDriver);
    expect(written.ok).toBe(true);

    // Simulate new session: only memory driver retained (like localStorage)
    const loaded = readAutosave(memoryDriver);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    expect(loaded.save.state.meta.colonyName).toBe('ResumeTest');
    expect(loaded.save.state.meta.seed).toBe(2026);
    expect(loaded.save.state.calendar.month).toBe(state.calendar.month);
    expect(loaded.save.state.shipments.length).toBe(state.shipments.length);

    // Resume path: startMonth + continue play remains deterministic with same seed stream
    const resumed = startMonth(loaded.save.state);
    expect(resumed.state.outcome).toBe('ongoing');
    expect(resumed.view.month).toBe(loaded.save.state.calendar.month);
  });

  it('export string can be imported in another “profile” (fresh memory)', () => {
    const state = createInitialState({
      seed: 7,
      colonyName: 'ExportMe',
      createdAt: 't',
    });
    const portable = serializeSave({ state, slot: null });

    clearMemoryDriver(); // other profile
    const parsed = parseSave(portable);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    writeSlot(0, parsed.save.state, null, memoryDriver);
    const again = readSlot(0, memoryDriver);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.save.state.meta.colonyName).toBe('ExportMe');
    expect(again.save.state.meta.seed).toBe(7);
  });
});
