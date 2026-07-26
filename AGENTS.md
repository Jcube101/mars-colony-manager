# AGENTS.md — Context for AI coding agents

This file helps AI agents work effectively in the Mars Colony Manager codebase.

## What this project is

A **browser-based, turn-based Mars colony systems game**. The player is an Earth liaison who makes **one action per month**; shipments take **two months**. A background ecosystem simulation creates boom/bust stories. Design is locked in **GDD v0.3**.

**Philosophy:** sim-first, data-driven balance, UI as a report renderer. Not a city-builder and not a real-time survival game.

**Current version:** design-complete prototype planning (implementation not started).

## Read order (mandatory before coding)

1. `GDD.md` — game rules (do not invent mechanics that contradict it)  
2. `SPEC.md` — stack, folders, data model, architecture  
3. `ROADMAP.md` — which phase you are implementing  
4. `LEARNINGS.md` — prior decisions (do not re-litigate without cause)  
5. This file  

## Tech stack (planned)

| Layer | Choice |
|-------|--------|
| Tooling | Vite + TypeScript (strict) |
| UI | Vanilla TS + CSS first (no React unless explicitly requested) |
| Sim | Pure TypeScript modules — **no DOM, no localStorage inside sim** |
| Persistence | `localStorage` (3 slots) + JSON export/import — **no database server** |
| RNG | Seeded PRNG only inside sim (no bare `Math.random()` in rules) |
| Tests | Vitest, focused on pure sim / month pipeline |
| Deploy target | Static browser app (later: itch/Steam optional) |

## Hard architecture rules

1. **`sim/**` must not import `ui/**`.** Simulation is pure functions over state.  
2. **Single choke point for a month:** `startMonth` / `applyAction` / `endMonth` (or equivalent) matching GDD resolution order.  
3. **Data-driven entities:** species, events, resource packages live in `data/` tables with named balance constants.  
4. **Determinism:** same seed + same actions ⇒ same run (given stored state continuity).  
5. **Causality:** major report swings should carry a cause (order / event / species interaction).  
6. **Design is closed:** retune numbers in data; do not invent new systems without updating GDD + LEARNINGS.  

## GDD resolution order (do not reorder casually)

End-month pipeline:

1. Queue player order (arrival = +2 months, or Emergency +1)  
2. Ecosystem ticks (×10)  
3. Events  
4. Harvest (auto policy)  
5. Colony upkeep (food, O₂, power, water, morale)  
6. Attrition / growth checkpoint  
7. Win/loss  
8. Report model  

Player-facing month is **knowledge-first:** deliver arrivals → report → decide → resolve.

## Key design facts (cheat sheet)

- 24-month run; win needs 3 months food+O₂ self-sufficiency + ≥4 established species  
- 8 species: grass, algae, insects, rabbits, deer, wolves, tree, mycelium  
- Food tiers: insects ++, rabbits/fruit +++, deer ++++, wolves +; colonists need ++  
- Earth: full catalog months 1–18; resource-only 19–24  
- Colonists = aggregate labor + mouths; no job UI  
- No Earth food crates in v1  

## Planned layout (see SPEC for detail)

```
src/sim/     pure rules
src/data/    balance tables
src/ui/      DOM / report rendering
src/save/    localStorage + export
tests/sim/   pipeline tests
```

## Common tasks (once code exists)

### Change a growth rate or yield

Edit `src/data/*` only. Add/adjust a Vitest case if behavior changes.

### Change month order or win rules

Update `GDD.md` + `LEARNINGS.md` first, then `src/sim/*`, then tests.

### Add UI chrome

Only in `src/ui/**`. Read state from the sim/report model; do not reimplement rules in the DOM.

### Run tests

```bash
npm test
```

## What NOT to do

- Do not add React/Vue/Svelte unless the human explicitly asks.  
- Do not add a backend, database server, or auth.  
- Do not put `Math.random()` inside sim logic.  
- Do not implement map exploration, multi-colony, combat, or colonist personalities in the prototype.  
- Do not “improve” design by expanding scope mid-phase — check ROADMAP.  
- Do not commit secrets or large binary art dumps without ask.  

## Documentation map

- `GDD.md` — game design source of truth  
- `SPEC.md` — technical specification  
- `ROADMAP.md` — phases and checklists  
- `LEARNINGS.md` — major decision Q&A only  
- `CONTRIBUTING.md` — human/agent contribution workflow  
- `QandA.md` / `QandA-systems.md` — historical design trails  
- This file — agent rules + Playbook  

## Working with the human

- Prefer vertical slice of the **real loop** over empty shells.  
- Prefer headless/sim tests before heavy UI polish.  
- When uncertain, match GDD pillars: limited agency, foresight, clean separation, legible ecosystem.  

---

## Playbook (how we build)

Short operating manual for humans and agents. More narrative context lives in chat history; **this is the durable process**.

### Branch vs worktree

| | Branch | Worktree |
|--|--------|----------|
| **Is** | A movable label on commits (`feat/sim-pipeline`) | A **separate directory** attached to a branch |
| **Solves** | Isolating history / PRs | Isolating *files on disk* so two checkouts don’t overwrite each other |
| **Typical** | Always create a branch for work | Add a worktree when you need parallel folders (you on `main`, agent on `feat/…`) |

**Rule:** every unit of work gets a **branch**. Use a **worktree** when you (or an agent) need a second working copy at the same time. One mission per worktree; remove it after merge.

### Standard delivery loop

1. Pick one **ROADMAP** phase / checkbox set.  
2. `git checkout -b feat/<phase-or-topic>` (optional: `git worktree add …` for isolation).  
3. Implement **only** that scope; do not invent systems outside GDD.  
4. Prove it: `npm test` and `npm run build` (once scaffold exists).  
5. Open a **PR into `main`** (even solo).  
6. When CI exists, require green checks before merge.  
7. Merge → delete branch/worktree → add a LEARNINGS entry **only if** the decision is major (architecture, pipeline, player fantasy).  

### Agent use (Grok Build)

You are the tech lead; agents are fast juniors. Constrain them.

| Situation | Prefer |
|-----------|--------|
| Main chat implementing a phase | Default session; keep prompt scoped to one ROADMAP phase |
| “What’s in the repo / where is X?” | **explore** subagent (read-only investigation) |
| “How should we implement X?” before coding | **plan** subagent (read-only plan; no edits) |
| Multi-step implement/fix in parallel | **general-purpose** subagent; better in its **own branch/worktree** |
| Large or risky edits | Worktree isolation so `main` stays clean until review |

**Prompt shape for any implement session:**

- Phase + acceptance criteria from ROADMAP  
- Files/areas allowed to touch  
- Commands that must pass  
- Explicit non-goals (`no React`, `no new species`, `no backend`)  
- “Update LEARNINGS only for major decisions”  

**Do not:** run multiple write-capable agents in the **same** folder on the same files; let agents expand design; commit straight to `main` without review.

### CI/CD (when code exists)

| Stage | Do |
|-------|-----|
| **CI (early)** | On PR/push: install, test, production build |
| **CD (later)** | Deploy `dist/` only from green `main` (Pages/itch/etc.) |

CI protects the **sim contract**. CD is for sharing a build—not a day-one requirement.

### Definition of done (any phase)

- [ ] ROADMAP checkboxes for that phase addressed  
- [ ] GDD resolution order / architecture rules still hold  
- [ ] Tests (or agreed manual checklist) pass  
- [ ] No drive-by refactors outside scope  
- [ ] Docs updated only if stack or behavior changed  
