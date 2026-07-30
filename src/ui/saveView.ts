/**
 * Save slots, load, export / import UI.
 */

import {
  autosaveSummary,
  clearSlot,
  downloadSaveJson,
  exportFilename,
  listSlots,
  parseSave,
  readAutosave,
  readSlot,
  serializeSave,
  writeSlot,
  type SaveSlotId,
  type SlotSummary,
} from '@/save/index';
import type { GameState, MonthReport } from '@/sim/types';

export type SaveLoadHandlers = {
  onLoad: (state: GameState, lastReport: MonthReport | null) => void;
  onMessage: (msg: string, kind?: 'ok' | 'err') => void;
  /** Current live state when playing (for save/export). */
  getLive?: () => {
    state: GameState;
    lastReport: MonthReport | null;
  } | null;
};

function fmtSummary(s: SlotSummary): string {
  if (s.empty) return 'Empty';
  const when = s.savedAt ? new Date(s.savedAt).toLocaleString() : 'unknown time';
  return `${s.colonyName ?? '?'} · M${s.month ?? '?'} · seed ${s.seed ?? '?'} · ${s.outcome ?? '?'} · ${when}`;
}

export function renderSavePanel(opts: {
  /** Show active-game save/export controls */
  inGame: boolean;
}): string {
  const slots = listSlots();
  const auto = autosaveSummary();

  const slotRows = slots
    .map((s) => {
      const n = s.slot + 1;
      return `
        <div class="save-row" data-slot="${s.slot}">
          <div class="save-meta">
            <strong>Slot ${n}</strong>
            <span class="muted">${fmtSummary(s)}</span>
          </div>
          <div class="save-btns">
            ${
              opts.inGame
                ? `<button type="button" class="btn btn-sm" data-act="save" data-slot="${s.slot}">Save</button>`
                : ''
            }
            <button type="button" class="btn btn-sm" data-act="load" data-slot="${s.slot}" ${s.empty ? 'disabled' : ''}>Load</button>
            <button type="button" class="btn btn-sm" data-act="clear" data-slot="${s.slot}" ${s.empty ? 'disabled' : ''}>Clear</button>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <section class="panel saves" aria-labelledby="saves-heading">
      <h2 id="saves-heading">Saves</h2>
      ${
        auto
          ? `<p class="meta-line">Autosave: <strong>${fmtSummary(auto)}</strong>
              <button type="button" class="btn btn-sm" id="btn-load-auto">Continue autosave</button>
            </p>`
          : `<p class="muted">No autosave yet (writes after each month boundary).</p>`
      }
      <div class="save-list">${slotRows}</div>
      <div class="save-io">
        ${
          opts.inGame
            ? `<button type="button" class="btn btn-sm" id="btn-export">Export JSON</button>`
            : ''
        }
        <label class="btn btn-sm file-label">
          Import JSON
          <input type="file" id="import-file" accept="application/json,.json" hidden />
        </label>
      </div>
      <p class="muted small">Export is portable across browsers/profiles. Import validates format before load.</p>
    </section>
  `;
}

export function bindSavePanel(root: HTMLElement, handlers: SaveLoadHandlers): void {
  const live = () => handlers.getLive?.() ?? null;

  root.querySelectorAll<HTMLButtonElement>('[data-act="save"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = live();
      if (!cur) {
        handlers.onMessage('Nothing to save.', 'err');
        return;
      }
      const slot = Number(btn.dataset.slot) as SaveSlotId;
      const result = writeSlot(slot, cur.state, cur.lastReport);
      if (!result.ok) {
        handlers.onMessage(result.error, 'err');
        return;
      }
      handlers.onMessage(`Saved to slot ${slot + 1}.`, 'ok');
      // Re-render caller responsibility — signal via message and optional reload panel
      refreshSlotLabels(root);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-act="load"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = Number(btn.dataset.slot) as SaveSlotId;
      const result = readSlot(slot);
      if (!result.ok) {
        handlers.onMessage(result.error, 'err');
        return;
      }
      handlers.onLoad(result.save.state, result.save.lastReport ?? null);
      handlers.onMessage(`Loaded slot ${slot + 1}.`, 'ok');
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-act="clear"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = Number(btn.dataset.slot) as SaveSlotId;
      clearSlot(slot);
      handlers.onMessage(`Cleared slot ${slot + 1}.`, 'ok');
      refreshSlotLabels(root);
    });
  });

  root.querySelector('#btn-load-auto')?.addEventListener('click', () => {
    const result = readAutosave();
    if (!result.ok) {
      handlers.onMessage(result.error, 'err');
      return;
    }
    handlers.onLoad(result.save.state, result.save.lastReport ?? null);
    handlers.onMessage('Continued from autosave.', 'ok');
  });

  root.querySelector('#btn-export')?.addEventListener('click', () => {
    const cur = live();
    if (!cur) {
      handlers.onMessage('Nothing to export.', 'err');
      return;
    }
    const json = serializeSave({
      state: cur.state,
      slot: null,
      lastReport: cur.lastReport,
    });
    downloadSaveJson(exportFilename(cur.state), json);
    handlers.onMessage('Export downloaded.', 'ok');
  });

  const fileInput = root.querySelector<HTMLInputElement>('#import-file');
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSave(text);
      if (!parsed.ok) {
        handlers.onMessage(parsed.error, 'err');
        return;
      }
      handlers.onLoad(parsed.save.state, parsed.save.lastReport ?? null);
      handlers.onMessage(`Imported “${file.name}”.`, 'ok');
    } catch {
      handlers.onMessage('Failed to read import file.', 'err');
    }
  });
}

function refreshSlotLabels(root: HTMLElement): void {
  const slots = listSlots();
  for (const s of slots) {
    const row = root.querySelector(`.save-row[data-slot="${s.slot}"] .muted`);
    if (row) row.textContent = fmtSummary(s);
    const loadBtn = root.querySelector<HTMLButtonElement>(
      `button[data-act="load"][data-slot="${s.slot}"]`,
    );
    const clearBtn = root.querySelector<HTMLButtonElement>(
      `button[data-act="clear"][data-slot="${s.slot}"]`,
    );
    if (loadBtn) loadBtn.disabled = s.empty;
    if (clearBtn) clearBtn.disabled = s.empty;
  }
}
