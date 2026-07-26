# LEARNINGS.md

Decision log for Mars Colony Manager. Written so a human can answer **“why did we do it this way?”** without rehashing old debates.

**Format:** Question → Answer → Context (when useful).

Add new entries when a significant decision is made during design or implementation. Do not delete history; mark superseded answers with a date.

---

## Design process

### Q: Why lock design in GDD/Q&A before scaffolding code?

**A:** The game’s difficulty is systems fairness and legibility under lag—not UI chrome. Coding before colonist/harvest/turn-order rules were fixed would force rewrites of the month pipeline (the most expensive core).

**Context:** Two Q&A rounds closed loop, species web, colonists, and resource layers. GDD v0.3 marks design closed for prototype; only balance numbers stay open.

---

### Q: Why keep `QandA.md` / `QandA-systems.md` instead of only the GDD?

**A:** The GDD is the clean source of truth. The Q&A files preserve *how* we got there (rejected alternatives, recommended defaults). Useful when someone asks “did we consider X?”

---

## Product & fantasy

### Q: Why “settle/tame the frontier” instead of “explore Mars”?

**A:** There is no map, scouting, or multi-site travel in v1. The fantasy is establishing a stable living system under supply lag—not exploration. Pitch language must match non-goals so marketing doesn’t promise a different game.

---

### Q: Why one action per month with a two-month shipment delay?

**A:** That *is* the game. Limited agency + foresight under uncertainty differentiates us from Surviving Mars / Banished-style continuous management. Variable delays were rejected for the prototype so players learn one hard rule.

---

### Q: Why fixed 2-month delay (no random “5% late”)?

**A:** Random lateness stacks unfairly with ecosystem noise and Emergency Priority. We keep a small **2% lost** shipment chance and event-based delay (solar flare) so buffers matter without teaching “the universe hates schedules.”

---

## Loop & information

### Q: Why knowledge-first turn order (deliver → report → decide → resolve)?

**A:** The liaison should never choose blind to cargo that just landed. Arrivals are known before the monthly decision. Ecology still runs *after* the decision is locked, so the month remains consequential.

**Rejected:** Deliver-after-sim as the default “gotcha” for arrival-into-storm; foresight remains via lag and forecasts, not hidden inventory.

---

### Q: Why no undo after End Month?

**A:** Undo collapses foresight into trial-and-error. Confirmation before commit is enough. Ironman-friendly and aligned with high consequence.

---

### Q: Why is the report fully accurate for vitals (no fog of war on last month)?

**A:** Uncertainty comes from **future state while orders are in flight**, not from hiding what already happened. Opaque present-state fights the causality law (“I should understand deaths in hindsight”).

---

## Systems & colonists

### Q: Why are colonists an aggregate, not individuals?

**A:** Individual colonist drama (RimWorld) is an explicit non-goal. Aggregate **labor + mouths + morale** gives meaningful pop growth tradeoffs without job UI or personality sims.

---

### Q: What do colonists actually do?

**A:** Each month they (1) consume food/O₂, (2) provide harvest labor, (3) draw light power/water, (4) generate imperfect waste, (5) can attrit or grow. They do not get job assignments or mid-month orders.

---

### Q: Why automatic harvest instead of player-set quotas?

**A:** Clean separation pillar: no feeding micromanagement. Policy is fixed—prefer better satiation, protect breeding floors unless food is Critical—and is shown on the report so causality stays visible.

---

### Q: Why can the colony eat wolves if they’re “bad food”?

**A:** Wolves are **+** satiation emergency calories. They can stave off starvation but punish morale/efficiency so the correct strategy remains building a proper food web—not ranching predators for meat.

---

### Q: Why no Earth food crate shipment in v1?

**A:** If Earth can feed you forever, the ecosystem is decorative. Earth may send O₂, water, nutrients, and power; **calories must come from the web** long-term (starting dry rations only).

---

### Q: Why gradual attrition before hard loss at buffer 0?

**A:** Pure 12→0 in one step feels like a gotcha. Losing 1–2 colonists while buffers are short creates a readable death spiral; hitting 0 food or O₂ after upkeep is still a hard collapse.

---

## Ecosystem & content

### Q: Why 8 species in the first playable (not a 3-species slice only)?

**A:** The intended story is a full short food web (producers → grazers → predator → soil). Data for all 8 ships in v1; balance can still soft-fail bad orders (rabbits without grass die). A tiny slice can be used as an *engineering* milestone, but content target remains the full catalog.

---

### Q: Why is grass a shippable species?

**A:** Rabbits/deer need a base forage producer. Algae alone is O₂-forward; trees fruit too late (9 months) to be the only plant base. Grass is the explicit graze layer.

---

### Q: Why all species available from month 1 (no tech tree)?

**A:** The skill gate is ecological, not bureaucratic. Ordering wolves first is allowed and punished by the sim—teaches foresight without a unlock UI.

---

### Q: Why stock-and-flow instead of agent-based individuals?

**A:** Faster to balance, easier to report, enough emergence with noise + interactions. Agent-based can wait until a species truly needs it.

---

## Progression & win

### Q: Why 24 months and Earth cutoff at 19–24?

**A:** ~2 Earth years narrative; fits a 20–35 minute learned run. Closing the species catalog for the last 6 months forces living on the web you built.

---

### Q: Why win requires ≥4 established species (not 2)?

**A:** With an 8-species web, 2 is a trivial bar (e.g. algae + insects). Four pushes a real community without demanding the entire catalog.

---

### Q: Why production self-sufficiency checks ignore Earth tank drawdown?

**A:** Buffers are for emergencies; win means the **biome** feeds and oxygenates the colony. You may still hold tanks on victory day.

---

## Technical direction (pre-code)

### Q: Why Vite + TypeScript, not a game engine?

**A:** The product is a monthly report + pure simulation. Engines (Phaser, Unity) optimize scenes, sprites, and frame loops we do not need in v1. Browser + TS keeps deploy simple and sim testable.

---

### Q: Why vanilla UI first (not React)?

**A:** Report-centric UI is mostly render-from-state. A framework is optional complexity until the report UX proves painful. SPEC allows revisiting later; default is vanilla TS + CSS.

---

### Q: Why no backend or database?

**A:** Single-player, session/local game. `localStorage` + JSON export covers 3 save slots without ops burden. Server auth would delay the only thing that matters: the loop.

---

### Q: Why sim/UI hard separation and seeded RNG from day one?

**A:** Balance and bugfix require replaying months. Pure `endMonth(state, action, rng)` with a seed makes “month 14 rabbit crash” debuggable. DOM-coupled rules become untestable spaghetti.

---

### Q: Why headless month pipeline before pretty UI?

**A:** If a scripted 24-month run cannot complete in tests, the game does not exist yet—only a menu. Systemic games fail when economy only “works” through UI accidents.

---

## Implementation learnings

*None yet — fill as the worktree build proceeds.*

### Template for new entries

```markdown
### Q: Why …?

**A:** …

**Context:** … (optional)

**Date:** YYYY-MM-DD
```

---

## Open questions (implementation only — not design blockers)

- Exact numeric balance for growth, yields, and packages (tune in `data/`)  
- Whether ambient audio ships with first public build  
- Deploy target for first share (local only vs itch static host)  
