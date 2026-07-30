# Deploy / shareable build

Mars Colony Manager is a **static** Vite app. Production output is `dist/`.

**Do not deploy publicly without an explicit request from the project owner.**

## Local production check

```bash
npm install
npm test
npm run build
npm run preview   # http://localhost:3004
```

`vite.config.ts` uses `base: './'` so asset paths work from itch zip folders and most static hosts.

## itch.io (HTML5)

1. `npm run build`
2. Zip the **contents** of `dist/` (not the parent folder), or zip `dist` and point itch at `index.html` inside.
3. itch project → **HTML** / playable in browser → upload zip.
4. Set “This file will be played in the browser”.

## GitHub Pages (optional)

1. Build with `npm run build`.
2. Publish `dist/` via Actions or `gh-pages` branch.
3. If the site is at `https://user.github.io/repo/`, you may need `base: '/repo/'` in `vite.config.ts` instead of `./` — only change if Pages path requires it.

## What not to ship

- No secrets (there are none).
- Debug tools only when `?debug=1` — fine for prototype.
- Ambient audio starts **off** (user gesture / toggle).

## Version

See `package.json` version (prototype series `0.7.x` = Phase 7 polish).
