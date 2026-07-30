/**
 * Screen orchestration (placeholder — Phase 4).
 */
import { COPY } from '@/data/copy';

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <main class="shell">
      <h1>${COPY.appTitle}</h1>
      <p class="tagline">${COPY.scaffoldHeadline}</p>
      <p class="status">Phase 3 — headless sim pipeline</p>
    </main>
  `;
}
