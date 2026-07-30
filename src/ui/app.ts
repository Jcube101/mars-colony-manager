/**
 * Screen orchestration: new game → monthly loop → end summary.
 * Binds UI to sim only; no rules reimplemented here.
 */

import { COPY } from '@/data/copy';
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
} from '@/ui/reportView';

type Screen = 'new_game' | 'play' | 'ended';

type AppModel = {
  screen: Screen;
  state: GameState | null;
  view: DecisionView | null;
  lastReport: MonthReport | null;
};

const model: AppModel = {
  screen: 'new_game',
  state: null,
  view: null,
  lastReport: null,
};

export function mountApp(root: HTMLElement): void {
  render(root);
}

function render(root: HTMLElement): void {
  if (model.screen === 'new_game') {
    root.innerHTML = renderNewGame();
    bindNewGame(root);
    return;
  }

  if (model.screen === 'ended' && model.state) {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <h1>${COPY.appTitle}</h1>
        </header>
        ${renderGameOver(model.state, model.lastReport)}
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
      render(root);
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
        <p class="muted">No prior resolution. Review vitals, then choose your first Earth request (or stand by).</p>
      </section>
    `;

  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <h1>${COPY.appTitle}</h1>
        <p class="tagline">One action per month. Two months until it lands.</p>
      </header>
      ${reportHtml}
      ${renderDecisionBrief(model.state, model.view)}
      ${renderActionChooser(model.view)}
      ${renderDebugPanel(model.state)}
    </div>
  `;

  bindActionChooser(root, model.view, (action) => {
    submitAction(root, action);
  });

  bindDebugPanel(root, {
    onForceEvent: (eventId) => {
      if (!model.state) return;
      model.state.flags.debugForceEvent = eventId;
      flash(root, `Next event armed: ${eventId}`);
    },
    onSetPopulation: (pop) => {
      if (!model.state) return;
      model.state.colony.population = pop;
      // refresh view snapshot
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
        <p class="tagline">Settle and tame a fragile Mars outpost — lagged Earth requests, living ecosystem.</p>
      </header>
      <section class="panel new-game" aria-labelledby="new-heading">
        <h2 id="new-heading">New game</h2>
        <label class="field">
          Colony name
          <input type="text" id="ng-name" maxlength="40" value="${COPY.defaultColonyName}" />
        </label>
        <label class="field">
          Seed <span class="muted">(optional — leave blank for random)</span>
          <input type="number" id="ng-seed" placeholder="${defaultSeed}" />
        </label>
        <p class="muted">24-month run. Win needs ≥4 established species and 3 months food+O₂ self-sufficiency.</p>
        <button type="button" class="btn btn-primary" id="btn-start">Begin liaison duty</button>
        ${isDebugEnabled() ? '<p class="chip chip--watch">Debug mode on (?debug=1)</p>' : ''}
      </section>
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
    model.screen = 'play';
    render(root);
  });
}

function submitAction(root: HTMLElement, action: PlayerAction): void {
  if (!model.state) return;

  const ended = endMonth(model.state, action);
  model.state = ended.state;
  model.lastReport = ended.report;

  if (ended.report.outcome !== 'ongoing') {
    model.screen = 'ended';
    model.view = null;
    render(root);
    return;
  }

  const started = startMonth(model.state);
  model.state = started.state;
  model.view = started.view;
  render(root);
}

function flash(root: HTMLElement, msg: string): void {
  let el = root.querySelector<HTMLElement>('.flash');
  if (!el) {
    el = document.createElement('p');
    el.className = 'flash';
    root.querySelector('.app')?.prepend(el);
  }
  el.textContent = msg;
}
