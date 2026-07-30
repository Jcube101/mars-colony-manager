/**
 * Lightweight inline SVG icons for status / sections (no asset pipeline).
 */

export const ICONS = {
  food: '🍽',
  o2: '🫧',
  power: '⚡',
  morale: '♡',
  water: '💧',
  mars: '◉',
  cargo: '📦',
  report: '📋',
  win: '✦',
  loss: '△',
} as const;

export function sectionIcon(emoji: string, label: string): string {
  return `<span class="icon" aria-hidden="true">${emoji}</span><span class="icon-label">${label}</span>`;
}
