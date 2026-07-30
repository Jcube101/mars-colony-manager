/**
 * Action chooser: species / resource / emergency / stand by.
 */

import { RESOURCES } from '@/data/resources';
import { SPECIES } from '@/data/species';
import type { DecisionView, PlayerAction } from '@/sim/types';
import { shipmentLabel } from '@/ui/format';

export type ActionSubmit = (action: PlayerAction) => void;

export function renderActionChooser(view: DecisionView): string {
  const speciesOpts = view.availableActions.species
    .map((id) => {
      const card = SPECIES[id];
      return `<option value="${id}">${card.name} — ${card.role}</option>`;
    })
    .join('');

  const resourceOpts = view.availableActions.resources
    .map((id) => {
      const pkg = RESOURCES[id];
      return `<option value="${id}">${pkg.name} — ${pkg.packageSummary}</option>`;
    })
    .join('');

  const emergencyOpts = view.availableActions.emergencyTargets
    .map(
      (s) =>
        `<option value="${s.id}">${shipmentLabel(s)} → M${s.arrivesMonth} (${s.id})</option>`,
    )
    .join('');

  const speciesDisabled = view.availableActions.species.length === 0;
  const emergencyDisabled = view.availableActions.emergencyTargets.length === 0;

  return `
    <section class="panel actions" aria-labelledby="action-heading">
      <h2 id="action-heading">Monthly action</h2>
      <p class="muted">One action per month. Shipments take two months (Emergency → one).</p>

      <fieldset class="action-fieldset">
        <legend class="sr-only">Choose action type</legend>
        <label class="radio-row">
          <input type="radio" name="action-type" value="species" ${speciesDisabled ? 'disabled' : 'checked'} />
          Request species
          ${speciesDisabled ? '<span class="chip chip--watch">Locked</span>' : ''}
        </label>
        <select id="action-species" ${speciesDisabled ? 'disabled' : ''}>
          ${speciesOpts || '<option value="">—</option>'}
        </select>

        <label class="radio-row">
          <input type="radio" name="action-type" value="resource" ${speciesDisabled ? 'checked' : ''} />
          Request resource
        </label>
        <select id="action-resource">
          ${resourceOpts}
        </select>

        <label class="radio-row">
          <input type="radio" name="action-type" value="emergency" ${emergencyDisabled ? 'disabled' : ''} />
          Emergency Priority
          ${emergencyDisabled ? '<span class="muted">(no eligible shipment)</span>' : '<span class="muted">−power, −morale, 12% loss</span>'}
        </label>
        <select id="action-emergency" ${emergencyDisabled ? 'disabled' : ''}>
          ${emergencyOpts || '<option value="">—</option>'}
        </select>

        <label class="radio-row">
          <input type="radio" name="action-type" value="stand_by" />
          Stand by (no request)
        </label>
      </fieldset>

      <button type="button" class="btn btn-primary" id="btn-end-month">
        Confirm &amp; end month
      </button>
    </section>
  `;
}

export function bindActionChooser(
  root: HTMLElement,
  view: DecisionView,
  onSubmit: ActionSubmit,
): void {
  const btn = root.querySelector<HTMLButtonElement>('#btn-end-month');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const type =
      root.querySelector<HTMLInputElement>('input[name="action-type"]:checked')
        ?.value ?? 'stand_by';

    let action: PlayerAction = { type: 'stand_by' };

    if (type === 'species') {
      const id = root.querySelector<HTMLSelectElement>('#action-species')?.value;
      if (id && view.availableActions.species.includes(id as never)) {
        action = { type: 'request_species', speciesId: id as never };
      }
    } else if (type === 'resource') {
      const id = root.querySelector<HTMLSelectElement>('#action-resource')?.value;
      if (id) {
        action = { type: 'request_resource', resourceId: id as never };
      }
    } else if (type === 'emergency') {
      const id = root.querySelector<HTMLSelectElement>('#action-emergency')?.value;
      if (id) {
        action = { type: 'emergency', shipmentId: id };
      }
    }

    // Prevent double-submit
    btn.disabled = true;
    btn.textContent = 'Resolving…';
    onSubmit(action);
  });
}

