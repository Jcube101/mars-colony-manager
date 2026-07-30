/**
 * localStorage slots + autosave (SPEC §5.4).
 * The sim package must not import this module — UI / boot only.
 */

import {
  parseSave,
  serializeSave,
  type SaveFile,
  type SaveSlotId,
} from '@/save/serialize';
import type { GameState, MonthReport } from '@/sim/types';

export const SAVE_SLOT_COUNT = 3 as const;

export const STORAGE_KEYS = {
  slot: (i: number) => `mcm:slot:${i}`,
  autosave: 'mcm:autosave',
  settings: 'mcm:settings',
} as const;

/** Minimal storage surface so tests can use memory. */
export type StorageDriver = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const memoryStore = new Map<string, string>();

export const memoryDriver: StorageDriver = {
  getItem: (k) => memoryStore.get(k) ?? null,
  setItem: (k, v) => {
    memoryStore.set(k, v);
  },
  removeItem: (k) => {
    memoryStore.delete(k);
  },
};

/** Clear in-memory driver (tests). */
export function clearMemoryDriver(): void {
  memoryStore.clear();
}

export function browserDriver(): StorageDriver {
  if (typeof localStorage === 'undefined') {
    return memoryDriver;
  }
  return {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => {
      localStorage.setItem(k, v);
    },
    removeItem: (k) => {
      localStorage.removeItem(k);
    },
  };
}

export type SlotSummary = {
  slot: SaveSlotId;
  empty: boolean;
  savedAt?: string;
  colonyName?: string;
  month?: number;
  seed?: number;
  outcome?: string;
};

export type LoadResult =
  | { ok: true; save: SaveFile }
  | { ok: false; error: string };

function defaultDriver(): StorageDriver {
  return browserDriver();
}

export function writeSlot(
  slot: SaveSlotId,
  state: GameState,
  lastReport?: MonthReport | null,
  driver: StorageDriver = defaultDriver(),
): { ok: true } | { ok: false; error: string } {
  if (slot < 0 || slot >= SAVE_SLOT_COUNT) {
    return { ok: false, error: 'Slot out of range.' };
  }
  try {
    const json = serializeSave({ state, slot, lastReport });
    driver.setItem(STORAGE_KEYS.slot(slot), json);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to write slot.',
    };
  }
}

export function readSlot(
  slot: SaveSlotId,
  driver: StorageDriver = defaultDriver(),
): LoadResult {
  const raw = driver.getItem(STORAGE_KEYS.slot(slot));
  if (!raw) {
    return { ok: false, error: `Slot ${slot + 1} is empty.` };
  }
  return parseSave(raw);
}

export function clearSlot(
  slot: SaveSlotId,
  driver: StorageDriver = defaultDriver(),
): void {
  driver.removeItem(STORAGE_KEYS.slot(slot));
}

/** Autosave at month boundary (decision-ready state). */
export function writeAutosave(
  state: GameState,
  lastReport?: MonthReport | null,
  driver: StorageDriver = defaultDriver(),
): { ok: true } | { ok: false; error: string } {
  try {
    const json = serializeSave({ state, slot: null, lastReport });
    driver.setItem(STORAGE_KEYS.autosave, json);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to autosave.',
    };
  }
}

export function readAutosave(
  driver: StorageDriver = defaultDriver(),
): LoadResult {
  const raw = driver.getItem(STORAGE_KEYS.autosave);
  if (!raw) {
    return { ok: false, error: 'No autosave found.' };
  }
  return parseSave(raw);
}

export function clearAutosave(driver: StorageDriver = defaultDriver()): void {
  driver.removeItem(STORAGE_KEYS.autosave);
}

export function listSlots(
  driver: StorageDriver = defaultDriver(),
): SlotSummary[] {
  const out: SlotSummary[] = [];
  for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
    const slot = i as SaveSlotId;
    const raw = driver.getItem(STORAGE_KEYS.slot(slot));
    if (!raw) {
      out.push({ slot, empty: true });
      continue;
    }
    const parsed = parseSave(raw);
    if (!parsed.ok) {
      out.push({ slot, empty: false, colonyName: '(corrupt)' });
      continue;
    }
    const { state, savedAt } = parsed.save;
    out.push({
      slot,
      empty: false,
      savedAt,
      colonyName: state.meta.colonyName,
      month: state.calendar.month,
      seed: state.meta.seed,
      outcome: state.outcome,
    });
  }
  return out;
}

export function autosaveSummary(
  driver: StorageDriver = defaultDriver(),
): SlotSummary | null {
  const loaded = readAutosave(driver);
  if (!loaded.ok) return null;
  const { state, savedAt } = loaded.save;
  return {
    slot: 0,
    empty: false,
    savedAt,
    colonyName: state.meta.colonyName,
    month: state.calendar.month,
    seed: state.meta.seed,
    outcome: state.outcome,
  };
}

/** Download helper for browser export. */
export function downloadSaveJson(filename: string, json: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFilename(state: GameState): string {
  const safe = state.meta.colonyName.replace(/[^\w-]+/g, '_').slice(0, 24);
  return `mcm-${safe}-m${state.calendar.month}-seed${state.meta.seed}.json`;
}
