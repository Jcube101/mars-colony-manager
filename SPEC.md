# SPEC.md — Mars Colony Manager Technical Specification

## 1. Overview

| Field | Value |
|-------|--------|
| **Product** | Mars Colony Manager |
| **Type** | Single-player browser game (turn-based systems / management) |
| **Design ref** | [GDD.md](GDD.md) v0.3 |
| **Spec version** | 0.1.1 (scaffold landed; folder tree active) |
| **Goal** | Implement the locked GDD loop: monthly Earth requests, 2-month lag, ecosystem sim, report-centric UI, local saves |

## 2. Philosophy

1. **Sim-first** — pure game rules before UI polish.  
2. **Data-driven balance** — rates and yields in tables, not buried in render code.  
3. **Deterministic core** — seeded RNG; reproducible runs.  
4. **Local-first** — no required server; privacy-simple.  
5. **Report clarity over spectacle** — UI serves the monthly brief.  
6. **Design closed** — GDD v0.3; numbers tune, systems do not sprawl.

## 3. Tech stack

### Tooling & language

| Layer | Choice | Notes |
|-------|--------|--------|
| Language | **TypeScript** (strict) | Shared types across sim and UI |
| Bundler / dev | **Vite** | Fast dev server, static build |
| Dev / preview port | **3004** (`strictPort`) | Frontend range 3001–3099; avoids Vite default 5173 |
| Production host | **https://mars.job-joseph.com** | jobpi self-host via Cloudflare Tunnel |
| Production port | **8018** → `127.0.0.1` only | Static `dist/`; never bind `0.0.0.0` in prod |
| Package manager | **npm** (default) | Lockfile committed once scaffold exists |
| Unit tests | **Vitest** | Prefer pure sim tests |
| Lint/format | Optional ESLint + Prettier | Add only if low friction |

### Runtime & UI

| Layer | Choice | Notes |
|-------|--------|--------|
| Runtime | Modern evergreen browsers | Desktop-first; mobile-friendly layout later |
| UI framework | **None (vanilla TS + CSS)** for prototype | Revisit React/Preact only if report UI complexity demands it |
| Markup | HTML entry (`index.html`) + DOM APIs | Report rendered from a pure report model |
| Styling | Custom CSS (variables for theme) | Clarity, status chips; no design-system dependency |
| Audio | Optional later | Ambient loop; not required for Phase 4 exit |

### Simulation

| Layer | Choice | Notes |
|-------|--------|--------|
| Architecture | Pure functions / modules | `sim/**` imports no DOM |
| Time model | Discrete months + 10 internal ticks | Per GDD |
| RNG | Seeded PRNG (e.g. mulberry32) | Injected; no bare `Math.random()` in rules |
| State | Single `GameState` object graph | Serializable JSON for saves |

### Persistence (“database”)

**No SQL/server database in v1.**

| Store | Technology | Purpose |
|-------|------------|---------|
| Active saves | **`localStorage`** | 3 slots + autosave blob |
| Portability | **JSON file export/import** | Backup / share / migrate browser |
| Optional later | IndexedDB | Only if payloads exceed localStorage comfort |

Schema is application-level JSON (see §5), not relational tables.

### Backend / network

| Item | v1 choice |
|------|-----------|
| Game server | **None** (static SPA only) |
| Auth | **None** |
| Analytics | Optional, non-blocking, later |
| CDN fonts | Acceptable; self-host later if offline matters |
| Production hosting | **jobpi** + Cloudflare Tunnel **pi-home** (see [DEPLOY.md](DEPLOY.md)) |

### Production ops (Phase 8)

| Item | Value |
|------|--------|
| URL | `https://mars.job-joseph.com` |
| Path on Pi | `~/projects/mars-colony-manager` |
| Process | systemd user unit `mars-colony-manager` (or system unit / optional Nginx) |
| Bind | `127.0.0.1:8018` — tunnel only; no public bind |
| Build | On Pi: `npm ci && npm run build` → `dist/` |
| Redeploy | `bash scripts/deploy-jobpi.sh` |
| Vite base | `./` (relative assets; domain root) |
| Port registry | dev-meta `PORTS.md` — **8018** = mars-colony-manager |

### Out-of-scope engines

Do **not** adopt Phaser, Unity, Godot, or full ECS frameworks for the prototype without an explicit decision + LEARNINGS entry.

## 4. Repository & folder structure

### Docs (repo root — current)

```
mars-colony-manager/
├── README.md
├── AGENTS.md
├── ROADMAP.md
├── LEARNINGS.md
├── SPEC.md
├── GDD.md
├── QandA.md
├── QandA-systems.md
└── .gitignore
```

### Application tree (planned at scaffold)

```
mars-colony-manager/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts          # or vite test config
├── public/                   # static assets (icons later)
├── src/
│   ├── main.ts               # boot: wire UI ↔ sim
│   ├── sim/
│   │   ├── state.ts          # types, initial state
│   │   ├── rng.ts            # seeded PRNG
│   │   ├── month.ts          # startMonth / endMonth orchestration
│   │   ├── ecosystem.ts      # ticks, food web
│   │   ├── harvest.ts        # auto policy, floors
│   │   ├── colony.ts         # upkeep, morale, attrition, growth
│   │   ├── events.ts         # event roll + apply
│   │   ├── shipments.ts      # queue, deliver, emergency, loss roll
│   │   ├── winLoss.ts
│   │   └── report.ts         # pure report model + causes
│   ├── data/
│   │   ├── species.ts
│   │   ├── resources.ts
│   │   ├── events.ts
│   │   └── copy.ts
│   ├── ui/
│   │   ├── app.ts            # screen orchestration
│   │   ├── reportView.ts
│   │   ├── actionView.ts
│   │   ├── styles.css
│   │   └── debug.ts          # ?debug=1
│   └── save/
│       ├── storage.ts        # 3 slots, autosave
│       └── serialize.ts      # versioned JSON
└── tests/
    └── sim/
        ├── month.test.ts
        ├── lag.test.ts
        ├── harvest.test.ts
        └── winLoss.test.ts
```

**Import rule:** `sim/**` → may use `data/**` + `rng`; must **not** import `ui/**` or `save/**` (save may sit above sim). `ui/**` calls sim API only.

## 5. Data model (logical)

### 5.1 `GameState` (conceptual)

```text
GameState
  meta: { version, seed, colonyName, playerName?, playerTitle?, createdAt }
  calendar: { month: 1..24, phase: 'decision' | 'ended' }
  colony: {
    population, habitatCapacity,
    food: { units: FoodStack[] },  // tagged by tier/source
    o2Buffer, powerBuffer, waterReserve,
    morale,   // 0..100
  }
  biome: {
    soil, water,                 // qualitative + internal numeric
    plants: { grass, algae, trees: TreeCohort[] },
    animals: { insects, rabbits, deer, wolves },
    mycelium,
    o2ProductionLastMonth,       // for win checks
  }
  shipments: PendingShipment[]   // { id, kind, payload, arrivesMonth, rushed? }
  flags: { earthSpeciesLocked, workStoppage?, lastEvents[] }
  history: { foodSelfSufficient: boolean[], o2SelfSufficient: boolean[], timeline[] }
  rngState: number               // or reconstruct from seed + call count
```

Exact field names are implementation detail; this is the required shape.

### 5.2 Food stacks

- Unit: **FU** (1 colonist-month baseline need).  
- Each stack: `{ amount, tier, source }` where tier ∈ `++++ | +++ | ++ | +`.  
- Earth rations: tier `++`, excluded from win production checks.

### 5.3 Save file JSON

```text
{
  "format": "mars-colony-manager-save",
  "formatVersion": 1,
  "savedAt": "ISO-8601",
  "slot": 0,
  "state": { /* GameState */ }
}
```

Migrations: bump `formatVersion` and write adapters in `serialize.ts`.

### 5.4 localStorage keys (planned)

| Key | Purpose |
|-----|---------|
| `mcm:slot:0` … `mcm:slot:2` | Three save slots |
| `mcm:autosave` | Last month boundary snapshot |
| `mcm:settings` | Optional UI prefs (later) |

## 6. Core APIs (sim surface)

Pure functions (names indicative):

```text
createInitialState(options: { seed, colonyName, ... }): GameState

startMonth(state): { state, view: DecisionView }
// delivers arrivals; builds decision-time view model

applyEndMonth(state, action: PlayerAction): { state, report: MonthReport }
// queues action, runs full resolution pipeline, returns report

// PlayerAction =
//   | { type: 'request_species', speciesId }
//   | { type: 'request_resource', resourceId }
//   | { type: 'emergency', shipmentId }
//   | { type: 'stand_by' }
```

UI never reimplements harvest, upkeep, or win math.

## 7. Month resolution pipeline

Must match GDD (do not reorder without design change):

1. Queue order from player action (arrival month rules + loss rolls)  
2. Ecosystem: 10 ticks (growth, predation, competition, noise)  
3. Apply fired events  
4. Harvest (labor × morale; policy order; floors)  
5. Colony upkeep (eat best-first, O₂, power, water, morale)  
6. Attrition / +1 growth on checkpoint months if healthy  
7. Win/loss evaluation  
8. Build `MonthReport` with causes  

## 8. UI surfaces (prototype)

1. **New game** — colony name (default Hephaestus), cosmetic player name/title, seed display  
2. **Monthly report** — headline, vitals+Δ, ecosystem, events, arrivals, outlook, harvest line  
3. **Action panel** — species catalog, resources, emergency target, stand by, confirm end month  
4. **Save/load** — 3 slots + export/import  
5. **Game over** — win/loss, summary stats, causal timeline, seed  
6. **Debug** (`?debug=1`) — force event, edit populations, jump month  

No map view in v1.

## 9. Testing strategy

| Layer | What |
|-------|------|
| Unit | RNG stream, harvest floors, satiation worst-tier rule, shipment lag math |
| Integration | Full `applyEndMonth` sequences; 24-month scripted runs |
| Determinism | Same seed + actions ⇒ identical serialized state |
| Manual | Vertical slice playtest checklist (Phase 4–6) |

CI: optional later (GitHub Actions: `npm test`).

## 10. Non-functional requirements

| Concern | Target |
|---------|--------|
| Performance | Month resolve ≪ 50ms on mid laptop (10 ticks, tiny state) |
| Accessibility | Keyboard-usable actions; status not color-only |
| Privacy | No required network calls for core play |
| Save safety | Autosave each month boundary; export always available |
| Clarity | Status chips Stable/Watch/Critical; red reserved for Critical |

## 11. Security

- No auth surface in v1.  
- Treat import JSON as untrusted: validate shape/version before load; reject corrupt saves safely.  
- Debug tools must not ship enabled by default in production builds (query-flag gated).

## 12. Out of scope (v1 / prototype)

- Backend, multiplayer, accounts, cloud sync  
- SQL databases  
- Map / multi-colony / habitat modules  
- Tech tree UI, combat, colonist personalities  
- Native mobile apps  
- Achievements/telemetry as blockers  

## 13. Future considerations

See [ROADMAP.md](ROADMAP.md) Phase 8+ (self-host is primary). Possible later: IndexedDB, PWA shell, richer art, Steam wrap, light meta progression, optional itch/Pages mirror.

## 14. Open technical choices (non-blocking)

| Topic | Default | May revisit |
|-------|---------|-------------|
| UI framework | Vanilla | React/Preact if UI pain is real |
| CSS approach | Hand-written variables | Utility library if desired |
| PRNG algorithm | mulberry32 or equiv | Any seeded 32-bit stream |
| State mutation style | Immutable copy vs careful mutate | Pick one in Phase 3 and document in LEARNINGS |

---

*Update this SPEC when stack or folder structure actually lands in the scaffold PR.*
