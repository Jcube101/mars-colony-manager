/** Debug tools (?debug=1) — placeholder (Phase 4). */

export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}
