# Contributing to Mars Colony Manager

This repo is a **design-locked prototype** of a turn-based Mars colony systems game. Contributions (human or agent) should follow the docs, not invent parallel designs.

## Before you start

1. Read **[GDD.md](GDD.md)** — what the game is.  
2. Read **[SPEC.md](SPEC.md)** — stack, folders, data shape.  
3. Read **[ROADMAP.md](ROADMAP.md)** — pick a phase; don’t skip ahead without reason.  
4. Read **[AGENTS.md](AGENTS.md)** — hard rules + playbook.  
5. Skim **[LEARNINGS.md](LEARNINGS.md)** — major “why” decisions only.  

## Branches only

This project uses **feature branches in one working directory**. Do **not** use git worktrees here for now.

```bash
git checkout main
git pull origin main
git checkout -b feat/phase-1-scaffold
# … work …
# open PR → merge → then:
git checkout main
git pull origin main
git branch -d feat/phase-1-scaffold
```

Switch missions by switching branches (commit or stash first). One branch per ROADMAP phase or focused fix.

## Workflow (solo or with agents)

1. From `main`, create a branch named for the ROADMAP phase or feature (`feat/phase-1-scaffold`).  
2. Implement only that phase’s checklist on that branch (never on `main`).  
3. Locally: `npm test` and `npm run build` (once scaffold exists).  
4. Open a PR into `main` (even solo — good habit).  
5. CI should pass when it exists; until then, don’t merge red local tests.  
6. Merge → delete the feature branch → log only **major** decisions in LEARNINGS.  

Detail: **Playbook** in [AGENTS.md](AGENTS.md).

## Pull requests

- **One phase or one concern per PR** (scaffold ≠ full sim ≠ UI polish).  
- Match architecture: `sim/**` pure; no React/backend unless discussed.  
- Update docs if behavior or stack changes (`SPEC.md`, `GDD.md`, `AGENTS.md` as needed).  
- Prefer tests for month pipeline, lag, harvest floors, win checks.  
- Do not “improve” design with new systems mid-PR — open a discussion and update GDD first.

## Commit messages

Imperative, clear subjects:

```
Add Vite TypeScript scaffold and folder layout
Implement endMonth pipeline with seeded RNG
Wire monthly report UI to sim report model
```

## Code style (once code exists)

- TypeScript strict; named balance constants with `// BALANCE` where rates live.  
- No `Math.random()` inside `sim/**`.  
- Comments explain *why*, not narrate *what*.  
- Vanilla UI unless the project explicitly adopts a framework.

## Issues

- **Bugs:** steps, expected vs actual, seed/save if relevant.  
- **Features:** check ROADMAP first; describe the player problem, not only a solution.  
- **Design changes:** rare; require GDD + LEARNINGS updates.

## Scope guardrails

Out of prototype scope unless ROADMAP says otherwise: multiplayer, map exploration, multi-colony, combat, colonist personalities, server auth, heavy game engines.

## Questions?

Start from GDD/SPEC. If still stuck, open an issue or note the decision in a PR description before merging.
