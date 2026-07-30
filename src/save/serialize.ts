/**
 * Versioned JSON save format (SPEC §5.3).
 * Treat import as untrusted — validate before load.
 */

import type { GameState, MonthReport } from '@/sim/types';

export const SAVE_FORMAT = 'mars-colony-manager-save' as const;
export const SAVE_FORMAT_VERSION = 1;

export type SaveSlotId = 0 | 1 | 2;

export type SaveFile = {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  savedAt: string;
  /** Slot index, or null for export / autosave envelope. */
  slot: number | null;
  state: GameState;
  /** Optional UI resume aid (not required by SPEC). */
  lastReport?: MonthReport | null;
};

export type ParseSaveResult =
  | { ok: true; save: SaveFile }
  | { ok: false; error: string };

export function serializeSave(input: {
  state: GameState;
  slot?: number | null;
  lastReport?: MonthReport | null;
  savedAt?: string;
}): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    savedAt: input.savedAt ?? new Date().toISOString(),
    slot: input.slot ?? null,
    state: structuredClone(input.state),
    lastReport: input.lastReport ?? null,
  };
  return JSON.stringify(file, null, 2);
}

export function parseSave(raw: string): ParseSaveResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Save root must be an object.' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.format !== SAVE_FORMAT) {
    return {
      ok: false,
      error: `Unknown save format (expected ${SAVE_FORMAT}).`,
    };
  }

  if (typeof obj.formatVersion !== 'number') {
    return { ok: false, error: 'Missing formatVersion.' };
  }

  if (obj.formatVersion !== SAVE_FORMAT_VERSION) {
    // Future: migrations. v1 only for now.
    return {
      ok: false,
      error: `Unsupported formatVersion ${obj.formatVersion} (need ${SAVE_FORMAT_VERSION}).`,
    };
  }

  if (typeof obj.savedAt !== 'string') {
    return { ok: false, error: 'Missing savedAt.' };
  }

  const slot = obj.slot;
  if (!(slot === null || slot === undefined || typeof slot === 'number')) {
    return { ok: false, error: 'Invalid slot field.' };
  }

  const stateCheck = validateGameState(obj.state);
  if (!stateCheck.ok) {
    return stateCheck;
  }

  let lastReport: MonthReport | null | undefined;
  if ('lastReport' in obj) {
    if (obj.lastReport === null) {
      lastReport = null;
    } else if (obj.lastReport && typeof obj.lastReport === 'object') {
      lastReport = obj.lastReport as MonthReport;
    } else {
      return { ok: false, error: 'Invalid lastReport.' };
    }
  }

  return {
    ok: true,
    save: {
      format: SAVE_FORMAT,
      formatVersion: obj.formatVersion,
      savedAt: obj.savedAt,
      slot: typeof slot === 'number' ? slot : null,
      state: stateCheck.state,
      lastReport,
    },
  };
}

type ValidateStateResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string };

/**
 * Structural validation — enough to reject obvious corruption.
 * Not a full schema; trusts JSON shape for nested fields once anchors exist.
 */
export function validateGameState(raw: unknown): ValidateStateResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Missing game state.' };
  }
  const s = raw as Record<string, unknown>;

  if (!s.meta || typeof s.meta !== 'object') {
    return { ok: false, error: 'State missing meta.' };
  }
  const meta = s.meta as Record<string, unknown>;
  if (typeof meta.seed !== 'number' || typeof meta.colonyName !== 'string') {
    return { ok: false, error: 'State meta.seed / colonyName invalid.' };
  }

  if (!s.calendar || typeof s.calendar !== 'object') {
    return { ok: false, error: 'State missing calendar.' };
  }
  const cal = s.calendar as Record<string, unknown>;
  if (typeof cal.month !== 'number' || cal.month < 1 || cal.month > 24) {
    return { ok: false, error: 'State calendar.month out of range.' };
  }

  if (!s.colony || typeof s.colony !== 'object') {
    return { ok: false, error: 'State missing colony.' };
  }
  const col = s.colony as Record<string, unknown>;
  if (typeof col.population !== 'number' || typeof col.morale !== 'number') {
    return { ok: false, error: 'State colony fields invalid.' };
  }
  if (!col.food || typeof col.food !== 'object') {
    return { ok: false, error: 'State colony.food missing.' };
  }

  if (!s.biome || typeof s.biome !== 'object') {
    return { ok: false, error: 'State missing biome.' };
  }
  if (!Array.isArray(s.shipments)) {
    return { ok: false, error: 'State shipments must be an array.' };
  }
  if (!s.flags || typeof s.flags !== 'object') {
    return { ok: false, error: 'State missing flags.' };
  }
  if (!s.history || typeof s.history !== 'object') {
    return { ok: false, error: 'State missing history.' };
  }
  if (typeof s.rngState !== 'number') {
    return { ok: false, error: 'State missing rngState.' };
  }
  if (
    s.outcome !== 'ongoing' &&
    s.outcome !== 'won' &&
    s.outcome !== 'lost'
  ) {
    return { ok: false, error: 'State outcome invalid.' };
  }
  if (typeof s.nextShipmentSeq !== 'number') {
    return { ok: false, error: 'State missing nextShipmentSeq.' };
  }
  if (!Array.isArray(s.lastArrivals)) {
    // tolerate older drafts by normalizing
    s.lastArrivals = [];
  }

  return { ok: true, state: structuredClone(s) as GameState };
}
