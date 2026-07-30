/**
 * Debug tools — only when `?debug=1`.
 * force event, set population, jump month.
 */

import { EVENT_IDS, type EventId } from '@/data/events';
import type { GameState } from '@/sim/types';
import { RUN_MONTHS } from '@/sim/types';

export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

export type DebugHandlers = {
  onForceEvent: (eventId: EventId) => void;
  onSetPopulation: (pop: number) => void;
  onJumpMonth: (month: number) => void;
};

export function renderDebugPanel(state: GameState): string {
  if (!isDebugEnabled()) return '';

  const eventOpts = EVENT_IDS.map(
    (id) => `<option value="${id}">${id}</option>`,
  ).join('');

  return `
    <section class="panel debug" aria-label="Debug tools">
      <h2>Debug <span class="chip chip--watch">?debug=1</span></h2>
      <p class="muted">Dev only. Mutates live state; may break win fairness.</p>
      <div class="debug-row">
        <label>Force next event
          <select id="debug-event">${eventOpts}</select>
        </label>
        <button type="button" class="btn" id="debug-force-event">Arm</button>
      </div>
      <div class="debug-row">
        <label>Population
          <input type="number" id="debug-pop" min="0" max="40" value="${state.colony.population}" />
        </label>
        <button type="button" class="btn" id="debug-set-pop">Set</button>
      </div>
      <div class="debug-row">
        <label>Jump to month
          <input type="number" id="debug-month" min="1" max="${RUN_MONTHS}" value="${state.calendar.month}" />
        </label>
        <button type="button" class="btn" id="debug-jump">Jump</button>
      </div>
      <p class="meta-line muted">rngState ${state.rngState} · phase ${state.calendar.phase} · outcome ${state.outcome}</p>
    </section>
  `;
}

export function bindDebugPanel(root: HTMLElement, handlers: DebugHandlers): void {
  if (!isDebugEnabled()) return;

  root.querySelector('#debug-force-event')?.addEventListener('click', () => {
    const id = root.querySelector<HTMLSelectElement>('#debug-event')?.value as
      | EventId
      | undefined;
    if (id) handlers.onForceEvent(id);
  });

  root.querySelector('#debug-set-pop')?.addEventListener('click', () => {
    const raw = root.querySelector<HTMLInputElement>('#debug-pop')?.value;
    const pop = Number(raw);
    if (Number.isFinite(pop) && pop >= 0) handlers.onSetPopulation(Math.floor(pop));
  });

  root.querySelector('#debug-jump')?.addEventListener('click', () => {
    const raw = root.querySelector<HTMLInputElement>('#debug-month')?.value;
    const month = Number(raw);
    if (Number.isFinite(month)) handlers.onJumpMonth(Math.floor(month));
  });
}
