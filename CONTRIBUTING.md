# Contributing to Mars Colony Manager

This repo is a **design-locked prototype** of a turn-based Mars colony systems game. Contributions (human or agent) should follow the docs, not invent parallel designs.

## Before you start

1. Read **[GDD.md](GDD.md)** — what the game is.  
2. Read **[SPEC.md](SPEC.md)** — stack, folders, data shape.  
3. Read **[ROADMAP.md](ROADMAP.md)** — pick a phase; don’t skip ahead without reason.  
4. Read **[AGENTS.md](AGENTS.md)** — hard rules + playbook.  
5. Skim **[LEARNINGS.md](LEARNINGS.md)** — major “why” decisions only.  

## Branch vs worktree (short)

| | **Branch** | **Worktree** |
|--|------------|--------------|
| What | A named line of commits (pointer in git) | A **second folder** checked out to a branch |
| Use when | Always — every feature needs a branch | Parallel work without stashing (e.g. agent on feature A, you on `main`) |
| Command sketch | `git checkout -b feat/…` | `git worktree add ../mcm-feat-x feat/x` |

You can have many branches and only one folder. Worktrees = many folders, each on a branch, **sharing one repo history**. Prefer **one mission per worktree**, then remove it after merge.

## Workflow (solo or with agents)

1. Create a branch named for the ROADMAP phase or feature (`feat/phase-1-scaffold`).  
2. Optional: add a worktree if an agent or second task needs isolation.  
3. Implement only that phase’s checklist.  
4. Locally: `npm test` and `npm run build` (once scaffold exists).  
5. Open a PR into `main` (even solo — good habit).  
6. CI should pass when it exists; until then, don’t merge red local tests.  
7. Merge → delete branch/worktree → log only **major** decisions in LEARNINGS.  

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
