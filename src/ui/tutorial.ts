/**
 * Scripted months 1–2 guidance (GDD tutorial).
 * Soft guide — does not block other actions.
 */

import { COPY } from '@/data/copy';
import type { DecisionView } from '@/sim/types';

export function isTutorialMonth(month: number): boolean {
  return month === 1 || month === 2;
}

export function renderTutorialPanel(view: DecisionView): string {
  if (!isTutorialMonth(view.month)) return '';

  if (view.month === 1) {
    const lines = COPY.tutorial.month1Body.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
    return `
      <section class="panel tutorial" aria-labelledby="tut-heading">
        <h2 id="tut-heading">${COPY.tutorial.month1Title}</h2>
        <ol class="tutorial-steps">${lines}</ol>
        <p class="muted">${COPY.tutorial.dismissHint}</p>
      </section>
    `;
  }

  // Month 2 — pending shipment teaching
  const pending = view.pendingShipments;
  const pendingBlock =
    pending.length > 0
      ? `<p class="tutorial-callout">In flight: <strong>${pending.length}</strong> shipment(s). First ETA month <strong>${Math.min(...pending.map((p) => p.arrivesMonth))}</strong> — that is the two-month lag in action.</p>`
      : `<p class="tutorial-callout">No pending cargo. If you stood by or lost a shipment in month 1, order a producer now so something lands on month 4.</p>`;

  const lines = COPY.tutorial.month2Body.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
  return `
    <section class="panel tutorial" aria-labelledby="tut-heading">
      <h2 id="tut-heading">${COPY.tutorial.month2Title}</h2>
      ${pendingBlock}
      <ol class="tutorial-steps">${lines}</ol>
      <p class="muted">${COPY.tutorial.dismissHint}</p>
    </section>
  `;
}

/** Default species selection for tutorial month 1. */
export function tutorialDefaultSpecies(month: number): 'algae' | 'grass' | null {
  if (month === 1) return 'algae';
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
