/**
 * Monthly report sections per GDD §8 — trends, harvest line, empty states.
 */

import { COPY } from '@/data/copy';
import type { DecisionView, GameState, MonthReport } from '@/sim/types';
import { listEstablishedSpecies } from '@/sim/winLoss';
import { failureCopy } from '@/sim/report';
import {
  earthWindowLabel,
  eventName,
  foodBreakdown,
  fmt,
  shipmentLabel,
  soilLabel,
  speciesName,
} from '@/ui/format';
import { ICONS } from '@/ui/icons';
import {
  chipClass,
  chipLabel,
  foodChip,
  moraleChip,
  o2Chip,
  powerChip,
  waterChip,
} from '@/ui/status';

/** Snapshot for simple month-over-month trends (UI only). */
export type VitalsSnapshot = {
  food: number;
  o2: number;
  power: number;
  morale: number;
  grass: number;
  algae: number;
  insects: number;
  rabbits: number;
};

export function snapshotFromState(state: GameState): VitalsSnapshot {
  const c = state.colony;
  const b = state.biome;
  return {
    food: c.food.units.reduce((s, u) => s + u.amount, 0),
    o2: c.o2Buffer,
    power: c.powerBuffer,
    morale: c.morale,
    grass: b.plants.grass,
    algae: b.plants.algae,
    insects: b.animals.insects,
    rabbits: b.animals.rabbits,
  };
}

function trend(cur: number, prev: number | undefined, digits = 0): string {
  if (prev === undefined) return '';
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return ' →';
  const arrow = d > 0 ? '↑' : '↓';
  const sign = d > 0 ? '+' : '';
  return ` ${arrow}${sign}${fmt(d, digits)}`;
}

function chip(
  level: ReturnType<typeof foodChip>,
  icon: string,
  text: string,
): string {
  return `<span class="${chipClass(level)}" title="${chipLabel(level)}"><span aria-hidden="true">${icon}</span> ${text} · ${chipLabel(level)}</span>`;
}

export function renderLastReport(report: MonthReport): string {
  const causes = report.causes
    .slice(0, 12)
    .map((c) => `<li>${escapeHtml(c.description)}</li>`)
    .join('');
  const events =
    report.events.length > 0
      ? report.events.map((e) => eventName(e)).join(', ')
      : COPY.empty.noEvents;
  const lossesHtml =
    report.losses.length > 0
      ? report.losses.map((l) => `<li>${escapeHtml(l)}</li>`).join('')
      : `<li class="empty-state">None</li>`;
  const arrivals =
    report.arrivals.length > 0
      ? report.arrivals
          .map((a) => `<li>${escapeHtml(shipmentLabel(a))} (${a.id})</li>`)
          .join('')
      : `<li class="empty-state">None</li>`;

  const harvest =
    report.harvestLine && report.harvestLine.length > 0
      ? report.harvestLine
      : COPY.empty.noHarvest;

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
          <p class="harvest-line">${escapeHtml(harvest)}</p>
        </div>
      </div>
      <div class="grid-2">
        <div>
          <h3>Arrivals (that month)</h3>
          <ul>${arrivals}</ul>
        </div>
        <div>
          <h3>Losses</h3>
          <ul>${lossesHtml}</ul>
        </div>
      </div>
      <h3>Causes</h3>
      <ul class="causes">${causes || `<li class="empty-state">${COPY.empty.noCauses}</li>`}</ul>
      <p class="meta-line">
        Eco food +${fmt(report.ecosystemFoodHarvested)} FU ·
        O₂ prod ${fmt(report.o2Produced)} / use ${fmt(report.o2Consumed)}
        ${report.o2Produced >= report.o2Consumed && report.o2Consumed > 0 ? ' · <span class="chip chip--stable">O₂ covered</span>' : ''}
        · Self-suff food ${report.foodSelfSufficient ? 'yes' : 'no'} ·
        O₂ ${report.o2SelfSufficient ? 'yes' : 'no'} ·
        Species: ${report.establishedSpecies.map(speciesName).join(', ') || 'none'}
      </p>
    </section>
  `;
}

export function renderDecisionBrief(
  state: GameState,
  view: DecisionView,
  prev?: VitalsSnapshot | null,
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
            const etaLabel =
              eta <= 0
                ? 'due'
                : eta === 1
                  ? 'next month'
                  : `in ${eta} months`;
            return `<li><strong>${escapeHtml(shipmentLabel(s))}</strong> — arrives month ${s.arrivesMonth} (${etaLabel})${s.rushed ? ' · rushed' : ''} <span class="muted">[${s.id}]</span></li>`;
          })
          .join('')
      : `<li class="empty-state">${COPY.empty.noPending}</li>`;

  const arrivals =
    view.arrivals.length > 0
      ? view.arrivals
          .map((a) => `<li>${escapeHtml(shipmentLabel(a))} delivered</li>`)
          .join('')
      : `<li class="empty-state">${COPY.empty.noArrivals}</li>`;

  const foodTrend = trend(foodTotal, prev?.food, 1);
  const o2Trend = trend(c.o2Buffer, prev?.o2, 1);
  const powerTrend = trend(c.powerBuffer, prev?.power, 1);
  const moraleTrend = trend(c.morale, prev?.morale, 0);
  const grassTrend = trend(b.plants.grass, prev?.grass, 0);
  const algaeTrend = trend(b.plants.algae, prev?.algae, 0);
  const insectTrend = trend(b.animals.insects, prev?.insects, 0);
  const rabbitTrend = trend(b.animals.rabbits, prev?.rabbits, 0);

  return `
    <section class="panel brief" aria-labelledby="brief-heading">
      <header class="brief-header">
        <div>
          <h2 id="brief-heading">${escapeHtml(state.meta.colonyName)} — Month ${view.month}</h2>
          <p class="muted">
            ${view.monthsRemaining} month(s) remaining ·
            Earth: ${earthWindowLabel(view.earthWindow)} ·
            Seed <strong>${state.meta.seed}</strong>
          </p>
        </div>
      </header>

      <h3>Colony vitals${prev ? ' <span class="muted">(Δ vs last brief)</span>' : ''}</h3>
      <div class="chips">
        ${chip(foodChip(c), ICONS.food, `Food ${fmt(foodTotal)} FU${foodTrend}`)}
        ${chip(o2Chip(c), ICONS.o2, `O₂ ${fmt(c.o2Buffer)}${o2Trend}`)}
        ${chip(powerChip(c), ICONS.power, `Power ${fmt(c.powerBuffer)}${powerTrend}`)}
        ${chip(moraleChip(c.morale), ICONS.morale, `Morale ${fmt(c.morale, 0)}${moraleTrend}`)}
        ${chip(waterChip(b.water, c.waterReserve), ICONS.water, `Water ${fmt(b.water, 0)} / res ${fmt(c.waterReserve, 0)}`)}
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
        <li>Grass ${fmt(b.plants.grass, 0)}${grassTrend} · Algae ${fmt(b.plants.algae, 0)}${algaeTrend} · Trees ${fmt(treeD, 0)} (${b.plants.trees.length} cohort)</li>
        <li>Insects ${b.animals.insects}${insectTrend} · Rabbits ${b.animals.rabbits}${rabbitTrend} · Deer ${b.animals.deer} · Wolves ${b.animals.wolves}</li>
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
          ${
            view.forecast
              ? `<p class="forecast">${escapeHtml(view.forecast)}</p>`
              : `<p class="muted empty-state">No soft forecast this month.</p>`
          }
          ${view.lastEvents.length ? `<p class="muted">Prior events: ${view.lastEvents.map(eventName).join(', ')}</p>` : ''}
        </div>
      </div>
    </section>
  `;
}

export function renderGameOver(state: GameState, report: MonthReport | null): string {
  const won = state.outcome === 'won';
  const established = listEstablishedSpecies(state);
  const reason = state.lossReason ?? report?.lossReason;
  const timeline = state.history.timeline
    .slice(-8)
    .map((t) => `<li>M${t.month}: ${escapeHtml(t.summary)}</li>`)
    .join('');

  const failureDetail = won
    ? ''
    : `<p class="failure-detail">${escapeHtml(failureCopy(reason))}</p>`;

  return `
    <section class="panel game-over ${won ? 'game-over--win' : 'game-over--loss'}" aria-labelledby="end-heading">
      <h2 id="end-heading">${won ? `${ICONS.win} Victory` : `${ICONS.loss} Colony lost`}</h2>
      <p class="headline">
        ${won
          ? `${escapeHtml(state.meta.colonyName)} reached self-sufficiency.`
          : `${escapeHtml(state.meta.colonyName)} failed.`}
      </p>
      ${failureDetail}
      <p class="meta-line">
        Final month ${state.calendar.month} · Seed <strong class="seed-display">${state.meta.seed}</strong> ·
        Pop ${state.colony.population} · Established ${established.length}: ${established.map(speciesName).join(', ') || 'none'}
      </p>
      ${report ? `<p class="muted">${escapeHtml(report.headline)}</p>` : ''}
      <h3>Timeline</h3>
      <ul>${timeline || `<li class="empty-state">${COPY.empty.noTimeline}</li>`}</ul>
      <p class="muted">Share the seed to replay this run. Actions still decide the story.</p>
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
