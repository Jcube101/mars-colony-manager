/**
 * Optional ambient bed — soft procedural drone (no audio assets).
 * Muted by default; player must opt in (autoplay policies + courtesy).
 */

const STORAGE_KEY = 'mcm:ambient';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;

export function isAmbientPreferred(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function setAmbientPreferred(on: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
}

function ensureGraph(): void {
  if (ctx) return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;

  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Two slow detuned oscillators → soft industrial hum
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g1 = ctx.createGain();
  const g2 = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  o1.type = 'sine';
  o2.type = 'sine';
  o1.frequency.value = 55;
  o2.frequency.value = 82.5;
  g1.gain.value = 0.04;
  g2.gain.value = 0.025;
  filter.type = 'lowpass';
  filter.frequency.value = 280;

  o1.connect(g1);
  o2.connect(g2);
  g1.connect(filter);
  g2.connect(filter);
  filter.connect(master);

  o1.start();
  o2.start();
  started = true;
}

/** Start or resume ambient (call from a user gesture). */
export async function startAmbient(): Promise<void> {
  ensureGraph();
  if (!ctx || !master) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0.35, now + 1.2);
  setAmbientPreferred(true);
}

export async function stopAmbient(): Promise<void> {
  if (!ctx || !master) {
    setAmbientPreferred(false);
    return;
  }
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + 0.6);
  setAmbientPreferred(false);
}

export function isAmbientRunning(): boolean {
  return Boolean(started && ctx && ctx.state === 'running' && isAmbientPreferred());
}

export function renderAmbientToggle(): string {
  const on = isAmbientPreferred();
  return `
    <button type="button" class="btn btn-sm ambient-toggle" id="btn-ambient" aria-pressed="${on}">
      ${on ? '🔊 Ambient on' : '🔇 Ambient off'}
    </button>
  `;
}

export function bindAmbientToggle(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('#btn-ambient');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (isAmbientPreferred() && isAmbientRunning()) {
      await stopAmbient();
    } else {
      await startAmbient();
    }
    // Refresh label without full re-render if possible
    const on = isAmbientPreferred();
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '🔊 Ambient on' : '🔇 Ambient off';
  });
}
