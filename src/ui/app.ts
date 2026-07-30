/**
 * Screen orchestration: new game → monthly loop → end summary.
 * Binds UI to sim + save layer; no rules reimplemented here.
 */

import { COPY } from '@/data/copy';
import { writeAutosave } from '@/save/index';
import {
  createInitialState,
  endMonth,
  startMonth,
  type DecisionView,
  type GameState,
  type MonthReport,
  type PlayerAction,
} from '@/sim/index';
import { RUN_MONTHS } from '@/sim/types';
import { bindActionChooser, renderActionChooser } from '@/ui/actionView';
import { bindDebugPanel, isDebugEnabled, renderDebugPanel } from '@/ui/debug';
import {
  renderDecisionBrief,
  renderGameOver,
  renderLastReport,
  snapshotFromState,
  type VitalsSnapshot,
} from '@/ui/reportView';
import { bindSavePanel, renderSavePanel } from '@/ui/saveView';
import { renderTutorialPanel } from '@/ui/tutorial';

type Screen = 'new_game' | 'play' | 'ended';

type AppModel = {
  screen: Screen;
  state: GameState | null;
  view: DecisionView | null;
  lastReport: MonthReport | null;
  /** Prior decision brief vitals for trend arrows. */
  prevSnapshot: VitalsSnapshot | null;
  flashMsg: string | null;
  flashKind: 'ok' | 'err' | null;
};

const model: AppModel = {
  screen: 'new_game',
  state: null,
  view: null,
  lastReport: null,
  prevSnapshot: null,
  flashMsg: null,
  flashKind: null,
};

export function mountApp(root: HTMLElement): void {
  render(root);
}

function render(root: HTMLElement): void {
  if (model.screen === 'new_game') {
    root.innerHTML = renderNewGame();
    bindNewGame(root);
    bindSavePanel(root, {
      onLoad: (state, lastReport) => resumeFromSave(root, state, lastReport),
      onMessage: (msg, kind) => {
        setFlash(msg, kind ?? 'ok');
        render(root);
      },
    });
    return;
  }

  if (model.screen === 'ended' && model.state) {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <h1>${COPY.appTitle}</h1>
        </header>
        ${flashHtml()}
        ${renderGameOver(model.state, model.lastReport)}
        <section class="panel">
          <h2>Seed</h2>
          <p>Run seed: <strong class="seed-display">${model.state.meta.seed}</strong></p>
          <p class="muted">Copy this seed on new game to replay the same RNG stream (actions still matter).</p>
        </section>
        ${renderSavePanel({ inGame: true })}
        <p class="center">
          <button type="button" class="btn btn-primary" id="btn-new-run">New run</button>
        </p>
      </div>
    `;
    root.querySelector('#btn-new-run')?.addEventListener('click', () => {
      model.screen = 'new_game';
      model.state = null;
      model.view = null;
      model.lastReport = null;
      model.prevSnapshot = null;
      clearFlash();
      render(root);
    });
    bindSavePanel(root, {
      onLoad: (state, lastReport) => resumeFromSave(root, state, lastReport),
      onMessage: (msg, kind) => {
        setFlash(msg, kind ?? 'ok');
        render(root);
      },
      getLive: () =>
        model.state
          ? { state: model.state, lastReport: model.lastReport }
          : null,
    });
    return;
  }

  // play
  if (!model.state || !model.view) {
    model.screen = 'new_game';
    render(root);
    return;
  }

  const reportHtml = model.lastReport
    ? renderLastReport(model.lastReport)
    : `
      <section class="panel">
        <h2>Month ${model.view.month} — Opening brief</h2>
        <p class="muted">No prior resolution. Review vitals, then choose your first Earth request (tutorial suggests a producer).</p>
      </section>
    `;

  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <h1>${COPY.appTitle}</h1>
        <p class="tagline">${COPY.tagline}</p>
      </header>
      ${flashHtml()}
      ${renderTutorialPanel(model.view)}
      ${reportHtml}
      ${renderDecisionBrief(model.state, model.view, model.prevSnapshot)}
      ${renderActionChooser(model.view)}
      ${renderSavePanel({ inGame: true })}
      ${renderDebugPanel(model.state)}
    </div>
  `;

  bindActionChooser(root, model.view, (action) => {
    submitAction(root, action);
  });

  bindSavePanel(root, {
    onLoad: (state, lastReport) => resumeFromSave(root, state, lastReport),
    onMessage: (msg, kind) => {
      setFlash(msg, kind ?? 'ok');
      render(root);
    },
    getLive: () =>
      model.state
        ? { state: model.state, lastReport: model.lastReport }
        : null,
  });

  bindDebugPanel(root, {
    onForceEvent: (eventId) => {
      if (!model.state) return;
      model.state.flags.debugForceEvent = eventId;
      setFlash(`Next event armed: ${eventId}`, 'ok');
      render(root);
    },
    onSetPopulation: (pop) => {
      if (!model.state) return;
      model.state.colony.population = pop;
      if (model.view) {
        model.view = {
          ...model.view,
          colony: structuredClone(model.state.colony),
        };
      }
      render(root);
    },
    onJumpMonth: (month) => {
      if (!model.state) return;
      const m = Math.max(1, Math.min(RUN_MONTHS, month));
      model.state.calendar.month = m;
      model.state.flags.earthSpeciesLocked = m >= 19;
      const started = startMonth(model.state);
      model.state = started.state;
      model.view = started.view;
      persistBoundary();
      render(root);
    },
  });
}

function renderNewGame(): string {
  const defaultSeed = Math.floor(Date.now() % 1_000_000_000);
  return `
    <div class="app">
      <header class="app-header">
        <h1>${COPY.appTitle}</h1>
        <p class="tagline">${COPY.tagline}</p>
      </header>
      ${flashHtml()}
      <section class="panel new-game" aria-labelledby="new-heading">
        <h2 id="new-heading">New game</h2>
        <label class="field">
          Colony name
          <input type="text" id="ng-name" maxlength="40" value="${COPY.defaultColonyName}" />
        </label>
        <label class="field">
          Seed <span class="muted">(shown on brief and game over; blank = random)</span>
          <input type="number" id="ng-seed" placeholder="${defaultSeed}" />
        </label>
        <p class="muted">24-month run. Months 1–2 are guided. Win: ≥4 established species and 3 months food+O₂ self-sufficiency.</p>
        <button type="button" class="btn btn-primary" id="btn-start">Begin liaison duty</button>
        ${isDebugEnabled() ? '<p class="chip chip--watch">Debug mode on (?debug=1)</p>' : ''}
      </section>
      ${renderSavePanel({ inGame: false })}
    </div>
  `;
}

function bindNewGame(root: HTMLElement): void {
  root.querySelector('#btn-start')?.addEventListener('click', () => {
    const nameInput = root.querySelector<HTMLInputElement>('#ng-name');
    const seedInput = root.querySelector<HTMLInputElement>('#ng-seed');
    const name = nameInput?.value.trim() || COPY.defaultColonyName;
    const seedRaw = seedInput?.value.trim();
    const seed = seedRaw
      ? Number(seedRaw) >>> 0
      : (Date.now() ^ (Math.floor(Math.random() * 0xffffffff) >>> 0)) >>> 0;

    const initial = createInitialState({
      seed,
      colonyName: name,
      createdAt: new Date().toISOString(),
    });
    const started = startMonth(initial);
    model.state = started.state;
    model.view = started.view;
    model.lastReport = null;
    model.prevSnapshot = null;
    model.screen = 'play';
    clearFlash();
    persistBoundary();
    render(root);
  });
}

function submitAction(root: HTMLElement, action: PlayerAction): void {
  if (!model.state) return;

  // Capture pre-resolution snapshot for next brief trends
  model.prevSnapshot = snapshotFromState(model.state);

  const ended = endMonth(model.state, action);
  model.state = ended.state;
  model.lastReport = ended.report;

  if (ended.report.outcome !== 'ongoing') {
    model.screen = 'ended';
    model.view = null;
    persistBoundary();
    render(root);
    return;
  }

  const started = startMonth(model.state);
  model.state = started.state;
  model.view = started.view;
  persistBoundary();
  render(root);
}

function resumeFromSave(
  root: HTMLElement,
  state: GameState,
  lastReport: MonthReport | null,
): void {
  model.lastReport = lastReport;
  model.prevSnapshot = null;

  if (state.outcome === 'won' || state.outcome === 'lost') {
    model.state = state;
    model.view = null;
    model.screen = 'ended';
    render(root);
    return;
  }

  const started = startMonth(state);
  model.state = started.state;
  model.view = started.view;
  model.screen = 'play';
  persistBoundary();
  render(root);
}

/** Autosave decision-ready (or ended) state at month boundary. */
function persistBoundary(): void {
  if (!model.state) return;
  writeAutosave(model.state, model.lastReport);
}

function setFlash(msg: string, kind: 'ok' | 'err'): void {
  model.flashMsg = msg;
  model.flashKind = kind;
}

function clearFlash(): void {
  model.flashMsg = null;
  model.flashKind = null;
}

function flashHtml(): string {
  if (!model.flashMsg) return '';
  const cls = model.flashKind === 'err' ? 'flash flash--err' : 'flash';
  return `<p class="${cls}">${escapeHtml(model.flashMsg)}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
