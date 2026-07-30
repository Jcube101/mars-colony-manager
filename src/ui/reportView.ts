/**
 * Monthly report sections per GDD §8.
 */

import type { DecisionView, GameState, MonthReport } from '@/sim/types';
import { listEstablishedSpecies } from '@/sim/winLoss';
import {
  earthWindowLabel,
  eventName,
  foodBreakdown,
  fmt,
  shipmentLabel,
  soilLabel,
  speciesName,
} from '@/ui/format';
import {
  chipClass,
  chipLabel,
  foodChip,
  moraleChip,
  o2Chip,
  powerChip,
  waterChip,
} from '@/ui/status';

function chip(level: ReturnType<typeof foodChip>, text: string): string {
  return `<span class="${chipClass(level)}" title="${chipLabel(level)}">${text} · ${chipLabel(level)}</span>`;
}

export function renderLastReport(report: MonthReport): string {
  const causes = report.causes
    .slice(0, 12)
    .map((c) => `<li>${escapeHtml(c.description)}</li>`)
    .join('');
  const events =
    report.events.length > 0
      ? report.events.map((e) => eventName(e)).join(', ')
      : 'Quiet month';
  const losses =
    report.losses.length > 0
      ? report.losses.map((l) => `<li>${escapeHtml(l)}</li>`).join('')
      : '<li>None</li>';
  const arrivals =
    report.arrivals.length > 0
      ? report.arrivals
          .map((a) => `<li>${escapeHtml(shipmentLabel(a))} (${a.id})</li>`)
          .join('')
      : '<li>None</li>';

  return `
    <section class="panel report" aria-labelledby="report-heading">
      <h2 id="report-heading">Month ${report.month} — Resolution</h2>
      <p class="headline">${escapeHtml(report.headline)}</p>
      <div class="grid-2">
        <div>
          <h3>Events</h3>
          <p>${escapeHtml(events)}</p>
        </div>
        <div>
          <h3>Harvest</h3>
          <p>${escapeHtml(report.harvestLine ?? '—')}</p>
        </div>
      </div>
      <div class="grid-2">
        <div>
          <h3>Arrivals (that month)</h3>
          <ul>${arrivals}</ul>
        </div>
        <div>
          <h3>Losses</h3>
          <ul>${losses}</ul>
        </div>
      </div>
      <h3>Causes</h3>
      <ul class="causes">${causes || '<li>No tagged causes</li>'}</ul>
      <p class="meta-line">
        Eco food +${fmt(report.ecosystemFoodHarvested)} FU ·
        O₂ prod ${fmt(report.o2Produced)} / use ${fmt(report.o2Consumed)} ·
        Self-suff food ${report.foodSelfSufficient ? 'yes' : 'no'} ·
        O₂ ${report.o2SelfSufficient ? 'yes' : 'no'} ·
        Species: ${report.establishedSpecies.map(speciesName).join(', ') || 'none'}
      </p>
    </section>
  `;
}

export function renderDecisionBrief(
  state: GameState,
  view: DecisionView,
): string {
  const c = view.colony;
  const b = view.biome;
  const foodTotal = c.food.units.reduce((s, u) => s + u.amount, 0);
  const pop = c.population;
  const treeD = b.plants.trees.reduce((s, t) => s + t.density, 0);
  const established = listEstablishedSpecies(state);

  const pending =
    view.pendingShipments.length > 0
      ? view.pendingShipments
          .map((s) => {
            const eta = s.arrivesMonth - view.month;
            return `<li><strong>${escapeHtml(shipmentLabel(s))}</strong> — arrives month ${s.arrivesMonth} (${eta} mo)${s.rushed ? ' · rushed' : ''} <span class="muted">[${s.id}]</span></li>`;
          })
          .join('')
      : '<li>No pending shipments</li>';

  const arrivals =
    view.arrivals.length > 0
      ? view.arrivals
          .map((a) => `<li>${escapeHtml(shipmentLabel(a))} delivered</li>`)
          .join('')
      : '<li>None this morning</li>';

  return `
    <section class="panel brief" aria-labelledby="brief-heading">
      <header class="brief-header">
        <div>
          <h2 id="brief-heading">${escapeHtml(state.meta.colonyName)} — Month ${view.month}</h2>
          <p class="muted">
            ${view.monthsRemaining} month(s) remaining ·
            Earth: ${earthWindowLabel(view.earthWindow)} ·
            Seed ${state.meta.seed}
          </p>
        </div>
      </header>

      <h3>Colony vitals</h3>
      <div class="chips">
        ${chip(foodChip(c), `Food ${fmt(foodTotal)} FU`)}
        ${chip(o2Chip(c), `O₂ ${fmt(c.o2Buffer)}`)}
        ${chip(powerChip(c), `Power ${fmt(c.powerBuffer)}`)}
        ${chip(moraleChip(c.morale), `Morale ${fmt(c.morale, 0)}`)}
        ${chip(waterChip(b.water, c.waterReserve), `Water ${fmt(b.water, 0)} / res ${fmt(c.waterReserve, 0)}`)}
      </div>
      <p class="meta-line">
        Pop ${pop} / habitat ${c.habitatCapacity}
        ${c.population > c.habitatCapacity ? ' · <span class="chip chip--watch">Overcrowd</span>' : ''}
        ${state.flags.workStoppage ? ' · <span class="chip chip--critical">Work stoppage</span>' : ''}
      </p>
      <p class="meta-line">${escapeHtml(foodBreakdown(c.food.units))}</p>

      <h3>Ecosystem</h3>
      <ul class="eco-list">
        <li>Soil ${soilLabel(b.soil)} · Biome water ${fmt(b.water, 0)}</li>
        <li>Grass ${fmt(b.plants.grass, 0)} · Algae ${fmt(b.plants.algae, 0)} · Trees ${fmt(treeD, 0)} (${b.plants.trees.length} cohort)</li>
        <li>Insects ${b.animals.insects} · Rabbits ${b.animals.rabbits} · Deer ${b.animals.deer} · Wolves ${b.animals.wolves}</li>
        <li>Mycelium ${fmt(b.mycelium, 0)} · O₂ last month ${fmt(b.o2ProductionLastMonth)}</li>
        <li>Established: ${established.map(speciesName).join(', ') || 'none'} (${established.length}/4 for win)</li>
      </ul>

      <div class="grid-2">
        <div>
          <h3>Arrivals (today)</h3>
          <ul>${arrivals}</ul>
        </div>
        <div>
          <h3>Outlook</h3>
          <ul>${pending}</ul>
          ${view.forecast ? `<p class="forecast">${escapeHtml(view.forecast)}</p>` : '<p class="muted">No soft forecast.</p>'}
          ${view.lastEvents.length ? `<p class="muted">Prior events: ${view.lastEvents.map(eventName).join(', ')}</p>` : ''}
        </div>
      </div>
    </section>
  `;
}

export function renderGameOver(state: GameState, report: MonthReport | null): string {
  const won = state.outcome === 'won';
  const established = listEstablishedSpecies(state);
  const timeline = state.history.timeline
    .slice(-8)
    .map((t) => `<li>M${t.month}: ${escapeHtml(t.summary)}</li>`)
    .join('');

  return `
    <section class="panel game-over" aria-labelledby="end-heading">
      <h2 id="end-heading">${won ? 'Victory' : 'Colony lost'}</h2>
      <p class="headline">
        ${won
          ? `${escapeHtml(state.meta.colonyName)} reached self-sufficiency.`
          : `${escapeHtml(state.meta.colonyName)} failed — ${escapeHtml(state.lossReason ?? report?.lossReason ?? 'unknown')}.`}
      </p>
      <p class="meta-line">
        Final month ${state.calendar.month} · Seed <strong>${state.meta.seed}</strong> ·
        Pop ${state.colony.population} · Established ${established.length}: ${established.map(speciesName).join(', ') || 'none'}
      </p>
      ${report ? `<p class="muted">${escapeHtml(report.headline)}</p>` : ''}
      <h3>Timeline</h3>
      <ul>${timeline || '<li>No major beats recorded</li>'}</ul>
      <p class="muted">Share the seed to replay this run.</p>
    </section>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
