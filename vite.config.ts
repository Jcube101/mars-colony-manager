import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  // Relative base so dist/ is portable (itch.io zip, file hosts, subpaths).
  base: './',
  resolve: {
    alias: {
      '@': src,
    },
  },
  // Port registry (dev-meta): 3001–3099 frontend. This app uses 3004.
  server: {
    port: 3004,
    strictPort: true,
  },
  preview: {
    port: 3004,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
