/**
 * App boot: wire UI ↔ sim (Phase 4 vertical slice).
 */
import { mountApp } from '@/ui/app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('Missing #app root element');
}

mountApp(root);
