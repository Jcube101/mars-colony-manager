# Mars Colony Manager

**Settle and tame a fragile Mars outpost — one Earth request per month, two months until it lands.**

You are the off-world liaison. Each month you choose a single action (species, resource, emergency rush, or stand by). Shipments take two months. The ecosystem keeps running on its own clock. Plan ahead, read the report, and build a self-sustaining web before Earth support dries up.

This is a **browser, turn-based systems game** — lagged decisions over a living ecosystem, not real-time colony micromanagement.

## Play

| | |
|--|--|
| **Production** | **https://mars.job-joseph.com** |
| Local dev | `npm run dev` → http://localhost:3004 |

## Status

| Item | State |
|------|--------|
| Design (GDD) | **v0.3 — locked for prototype** |
| Implementation | **Playable prototype** (Phases 1–7 polish) |
| Production host | jobpi self-host — see [DEPLOY.md](DEPLOY.md) |
| Target stack | Vite + TypeScript, pure sim core, local saves |

## Design pillars

1. **Limited Agency, High Consequence** — one meaningful action per month  
2. **Foresight Over Reaction** — two-month lag rewards planning  
3. **Clean Separation** — no mid-month micromanagement  
4. **Living Ecosystem** — surprises that stay legible in hindsight  

## Documentation map

| Doc | Purpose |
|-----|---------|
| [GDD.md](GDD.md) | Game design (rules, systems, win/loss) — source of truth for *what the game is* |
| [SPEC.md](SPEC.md) | Technical specification — stack, folders, data, architecture |
| [ROADMAP.md](ROADMAP.md) | Phased build plan and checklists |
| [AGENTS.md](AGENTS.md) | Context for AI coding agents + **Playbook** (branches, agents, CI) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute (humans + agents) |
| `PROMPTS.md` (local, gitignored) | Personal copy-paste prompts; not versioned |
| [LEARNINGS.md](LEARNINGS.md) | Major decision log only (Q&A) |
| [QandA.md](QandA.md) | Design Q&A trail (round 1) |
| [QandA-systems.md](QandA-systems.md) | Systems Q&A trail (round 2, locked) |
| [PLAYTEST.md](PLAYTEST.md) | Playtest notes |
| [DEPLOY.md](DEPLOY.md) | **Primary:** jobpi self-host; optional itch/Pages |

## Quick start

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev      # Vite dev server (http://localhost:3004)
npm test         # Vitest (sim / unit tests)
npm run build    # production build → dist/
npm run preview  # serve the production build (also :3004)
```

Dev port is **3004** (fixed; see `vite.config.ts`). Vite’s default 5173 is left free for other projects.

Production redeploy on jobpi: `bash scripts/deploy-jobpi.sh` (see [DEPLOY.md](DEPLOY.md)).

See [SPEC.md](SPEC.md) for toolchain and folders, [ROADMAP.md](ROADMAP.md) for phases.

## High-level game loop

1. **Arrivals** — deliver due shipments  
2. **Report** — colony + ecosystem + events  
3. **Decision** — one action (or stand by)  
4. **Resolve** — queue order → 10 sim ticks → events → harvest → upkeep → win/loss  

Full rules live in [GDD.md](GDD.md).

## Non-goals (prototype)

- Real-time management, RimWorld-style drama, combat  
- Map exploration / multi-colony  
- Backend server, accounts, or cloud saves  
- Heavy game engines (Phaser, Unity, etc.)  

## License

TBD.
