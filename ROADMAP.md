# ROADMAP.md — Mars Colony Manager

Phased build plan. Design is locked (GDD v0.3). Implementation proceeds on **feature branches** (no worktrees for this project).

---

## Phase 0 — Project docs & design lock ✅

- [x] GDD v0.3 (systems + loop closed)
- [x] Design Q&A trails (`QandA.md`, `QandA-systems.md`)
- [x] Seed `README.md`, `AGENTS.md`, `ROADMAP.md`, `LEARNINGS.md`, `SPEC.md`
- [x] Commit docs on main
- [x] Open `feat/phase-1-scaffold` (or equivalent) for implementation

---

## Phase 1 — Scaffold & skeleton

*Goal: empty app boots; folders and tooling match SPEC; no real game yet.*

- [x] Vite + TypeScript (strict) project
- [x] Folder layout: `src/sim`, `src/data`, `src/ui`, `src/save`, `tests/sim`
- [x] Vitest wired (`npm test`)
- [x] Path aliases if useful (`@/sim`, `@/data`)
- [x] Placeholder `main.ts` + minimal HTML shell
- [x] ESLint/Prettier optional — only if low friction *(skipped for Phase 1)*
- [x] Update README quick start with real commands

**Exit criteria:** `npm run dev` and `npm test` succeed on a trivial assert.

---

## Phase 2 — Domain model & data tables

*Goal: types and balance knobs exist; numbers may be placeholders.*

- [ ] Core types: `GameState`, colony, biome, shipments, report, actions
- [ ] `data/species.ts` — 8 species cards (rates marked `// BALANCE`)
- [ ] `data/resources.ts` — O₂ / water / nutrients / power packages
- [ ] `data/events.ts` — dust, cold, blight, quiet, solar flare, illness weights
- [ ] `data/copy.ts` — starter headline strings
- [ ] Initial state factory (starting colony + barren-ish biome per GDD)
- [ ] Seeded RNG module (`rng.ts`) — no `Math.random()` in sim

**Exit criteria:** can construct a valid initial `GameState` in tests.

---

## Phase 3 — Pure month pipeline (headless)

*Goal: the game exists without UI.*

- [ ] `startMonth` — deliver arrivals, expose decision view model
- [ ] `applyAction` / queue shipments (species, resource, emergency, stand by)
- [ ] `endMonth` choke point — fixed GDD order:
  - queue order → 10 ecosystem ticks → events → harvest → upkeep → attrition/growth → win/loss → report
- [ ] Ecosystem stock-and-flow (all 8 species, soil/water/power/O₂ hooks)
- [ ] Auto-harvest policy + sustainability floors + satiation / FU
- [ ] Colonist labor, morale, attrition, +1/6 mo growth gates
- [ ] Earth window (1–18 full, 19–24 resource-only)
- [ ] Win/loss evaluation (24 months, ≥4 species, 3-month self-sufficiency)
- [ ] Report model with cause tags (causality law)
- [ ] Vitest: lag timing, emergency rush, harvest floors, win checks, determinism (seed)

**Exit criteria:** scripted action list can run a full 24-month headless game; tests green.

---

## Phase 4 — Vertical slice UI

*Goal: a human can play the real loop in the browser (ugly is fine).*

- [ ] Bind UI to sim state + report (vanilla TS + CSS)
- [ ] Monthly report sections per GDD (vitals, ecosystem, events, arrivals, outlook, action)
- [ ] Action chooser: species / resource / emergency / stand by
- [ ] Pending shipments + months remaining + Earth support status
- [ ] Status chips: Stable / Watch / Critical
- [ ] New game (name colony, optional seed display)
- [ ] End-run summary + seed display
- [ ] `?debug=1` basics: force event, set population, jump month (dev only)

**Exit criteria:** stranger can complete or fail a run without opening devtools.

---

## Phase 5 — Persistence & seed UX

- [ ] Autosave on month boundary (`localStorage`)
- [ ] 3 save slots + load
- [ ] JSON export / import
- [ ] Seed shown on new game and game over
- [ ] Tests or manual checklist for save/load round-trip

**Exit criteria:** close tab mid-run, resume from slot; export works on another browser profile.

---

## Phase 6 — Tutorial, copy, first balance pass

- [ ] Scripted months 1–2 (guided first producer + pending shipment teaching)
- [ ] Expand report headlines / failure timeline copy
- [ ] Playtest-driven balance in `data/` only
- [ ] Soft event forecasts (~50% major weather)
- [ ] Polish readability (trends, harvest line, empty states)

**Exit criteria:** playtester describes planning 2+ months ahead unprompted at least once.

---

## Phase 7 — Polish & package (post-prototype)

*Only after the loop feels fair and legible.*

- [ ] Visual pass (icons, light illustration optional)
- [ ] Ambient audio (optional loop)
- [ ] Performance pass if needed (should be unnecessary at this scale)
- [ ] itch.io / static deploy
- [ ] Optional letter grade on win
- [ ] Optional achievements / light telemetry

---

## Later / not in prototype

- Habitat modules, multi-colony, map view  
- Tech tree UI, multiplayer, cloud saves  
- React/other SPA framework (unless chosen deliberately later)  
- Full art pipeline, Steam release polish  
- Earth food crates, complex social sim  

---

## How to change this roadmap

1. Prefer moving checklist items between phases over inventing new systems.  
2. New mechanics require GDD update + LEARNINGS entry.  
3. Balance tweaks stay in Phase 6 / data files — not a new phase.  
