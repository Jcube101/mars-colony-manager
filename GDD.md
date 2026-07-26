# Mars Colony Manager — Game Design Document
**Version:** 0.3  
**Last Updated:** 2026-07-24  
**Owner:** Job Joseph  
**Source decisions:** `QandA.md` + `QandA-systems.md` (all recommended accepted) + design lock-ins

**Design status:** Closed for prototype. Remaining work is **balance numbers and copy**, not open design questions.

---

## 1. High Concept

You are the off-world liaison for a fragile Mars colony. Each month you request one species or critical resource from Earth. The shipment takes two months to arrive. While you wait, the ecosystem runs on its own fast internal clock—growth, predation, dust storms, cold snaps—and you only act again when the month is over and the new report is in.

**Pitch:** Settle the uncharted frontier of the Mars landscape.

**Pitch meaning:** You are not exploring the frontier—you are **settling and taming** it. The fantasy is establishing a stable living system under lag and uncertainty, not scouting a map.

**Emotional fantasy (a good turn):** Quiet dread → deliberate plan → quiet pride.

**What this game is not:** RimWorld drama, Surviving Mars real-time building, city-builder spam, combat/raiders, or map exploration. It is a **lagged systems puzzle** with a colony life-support skin.

**Tone:** Grounded soft sci-fi with bureaucratic texture (Earth supply window, liaison reports). Serious enough that colony death stings; light enough that a rabbit explosion is darkly funny, not traumatic.

---

## 2. Design Pillars

1. **Limited Agency, High Consequence** — One meaningful action per month, with delayed payoff.
2. **Foresight Over Reaction** — Because of the two-month lag, good play is planning ahead, not firefighting.
3. **Clean Separation** — Colony decisions and ecosystem simulation stay distinct; no real-time micromanagement.
4. **Living Ecosystem** — Background simulation creates surprises and ripple effects.

### Pillar priority when they conflict
1. Limited Agency, High Consequence  
2. Foresight Over Reaction  
3. Clean Separation  
4. Living Ecosystem (surprise is good; opaque unfairness is not)

Surprise must still be **legible in hindsight**.

### Consequence rule
A single bad month can put the colony on a **death spiral**, but pure RNG should rarely wipe a healthy colony in one step. Instant wipe only if the player was already near a critical threshold.

### Ecosystem agency
Populations and weather can shift without a player action, but win/loss should still feel connected to the chain of monthly choices.

### Hard boundary (never player-controlled mid-month)
No job assignment, colonist movement, feeding micromanagement, pausing the daily sim, or mid-month emergency orders. The only exception is **Emergency Priority** as a full monthly action. Player acts only at the month decision phase.

### Non-Goals
- Real-time colony management
- Complex individual colonist personalities and drama (RimWorld style)
- Full terraforming or planetary-scale building
- Combat or raiders
- Map exploration / multi-site colonies (prototype)
- Tech tree UI, multiplayer, monetization meta

### Causality law
Every major swing in the report must be attributable to (a) a past player order, (b) a named event, or (c) a visible species interaction. If the player cannot form a hypothesis, fix the report or the rules.

---

## 3. Target Audience & Platform

- **Audience:** Players who enjoy systemic colony/management games (Surviving Mars, Of Life and Land, Banished) but want turn-based decisions and clear cause-and-effect over constant real-time pressure.
- **Difficulty identity:** Short roguelike-adjacent campaign — fixed month horizon, seeded variance, second runs teach interactions.
- **Systems literacy:** Teach lightly (tutorial + early months), then let systems speak. No full formula dump in v1.
- **Platform:** Browser first; desktop-first layout that still works on mobile. Later possible Steam release.
- **Session length:** Full run ~20–35 minutes once learned; first run may be 40–60. Saves between months required.
- **Player identity:** Name + cosmetic title only (no RPG stats). Role: Earth liaison / settler authority.

---

## 4. Core Gameplay Loop

### Player-facing monthly flow (knowledge-first)

1. **Start of month — Arrivals**  
   Deliver any shipments due this month. Player sees them before acting.
2. **Report**  
   Colony vitals, ecosystem, last resolution events, arrivals, pending inbound, optional forecasts.
3. **Decision**  
   Exactly one action (or Stand By), with full knowledge of current resources and what just landed.
4. **End month — Resolution (fixed order)**  
   1. Queue the new order (arrival = current + 2, unless Emergency Priority → +1).  
   2. Run ecosystem simulation (**10 ticks**): growth, predation, competition, noise.  
   3. Apply environmental events that fire this month.  
   4. **Harvest** (labor pulls from post-sim populations into colony food).  
   5. **Colony upkeep** (eat, breathe, power, water net, morale update).  
   6. Population attrition / growth checkpoint if applicable.  
   7. Evaluate win/loss.  
5. Advance calendar; repeat.

**Design intent:** The liaison never chooses blind to what just arrived. Ecology still runs after the decision is locked.

### Information at decision time
- Colony vitals with Δ (pop, food FU + quality mix, O₂, power, morale, habitat)
- Species / plant indices + trend arrows
- Pending shipments
- Last month’s event summary (1–3 lines)
- Months remaining / Earth support status
- Soft forecasts when available

### Loop rules
- **Stand By** is valid.
- **One new request per month**; multiple shipments may be in flight.
- Same species may be requested multiple times across the run.
- **No undo** after End Month (optional confirm before commit).
- Report is complete for colony vitals; ecosystem accurate but summarized. Formulas hidden.

---

## 5. Core Mechanics & Systems

### 5.1 Monthly Actions (v1)

| Action | Effect |
|--------|--------|
| Request Species | Queue one species from the full catalog |
| Request Resource | O₂ tanks, water ice, soil nutrients, or power cells |
| Emergency Priority | Rush one pending shipment to +1 month; costs power + morale; **12% lost** |
| Stand By | No request; month still resolves |

- **Delay:** Fixed **2 months** (Emergency → 1 month if not lost).
- **Normal request cost:** action slot only (no money).
- **Normal shipment loss:** **2% lost**. No random late on normal shipments.
- **Solar flare** may delay the *next* request by +1 month (event, not baseline noise).
- **Habitat modules:** not in v1 (capacity 20 is enough).

### 5.2 Resource shipment packages (relative)

| Resource | Package effect |
|----------|----------------|
| O₂ tanks | ~+2 months O₂ buffer at current pop |
| Water ice | Significant water reserve / biome top-up |
| Soil nutrients | Noticeable soil quality step up |
| Power cells | ~2–3 months of normal power buffer |

Exact magnitudes are balance data.

### 5.3 Emergency Priority costs
When declared: power drops sharply (about one status step or ~−40% buffer), morale **−10 to −15**, **12%** chance the rushed shipment is lost. Requires a pending shipment not already due next month.

### 5.4 Ecosystem simulation

- **Model:** Stock-and-flow with stochastic noise.
- **Ticks:** 10 per player month.
- **Layers:**
  - **Biome:** plant densities, animal counts, water, soil, O₂ production
  - **Colony:** food stores (tagged by tier), O₂ buffer, power buffer, morale, habitat, population
- **Establishment:** Seed population on arrival; depends on conditions; **Poor / Fair / Strong**; seed may be ~25–50% of nominal if strained.
- **Boom/bust:** Readable drama (roughly ×2 or ×0.5 in a month possible); soft floors unless habitat lethal.
- **Extinction:** Local and permanent until a new shipment reintroduces the species.

### 5.5 Starting biome
Nearly barren greenhouse with:
- **Small algae trickle** (early O₂ drip so month 1–2 are not pure tank panic)
- Soil: **Fair**
- Water: **Adequate**
- No grass, animals, trees, or mycelium yet

### 5.6 Species catalog (v1 — all month 1)

Ecological skill gate only (bad orders die; no UI lock).

| Species | Role | Notes |
|---------|------|--------|
| **Grass** | Base forage / plant biomass | Required for rabbits/deer; needs water + light/power |
| **Algae** | O₂ + soft biomass | Water + light; cold-fragile |
| **Insects** | Fast ++ food | Waste/nutrients/soft plants; boom risk |
| **Rabbits** | +++ food; grazers | Need grass; can overgraze |
| **Deer** | ++++ food; heavy grazers | Need grass/plant biomass; hard overgraze |
| **Wolves** | Prey control; + emergency food | Eat rabbits/deer; crash if prey thin |
| **Tree** | O₂ + fruit | Cold-resistant; **fruit from cohort age 9+**; O₂ earlier |
| **Mycelium** | Soil buffer | Slow soil +; weak/declines without trees |

**Food web:** Soil/Nutrients → Grass / Algae / Trees → Insects → Rabbits / Deer → Wolves → waste → soil (imperfect).

**Seed intent (relative):** grass large; algae medium; insects medium-high; rabbits medium; deer small-medium; wolves small; trees small cohort; mycelium medium.

**Trees:** track **cohort age** (months since strong establishment). Fruit only from cohorts age ≥ 9. Multiple shipments = multiple cohorts.

**Mycelium:** soft dependency — without trees, ~no growth / decline.

**Wolves:** need prey base; over-order before prey is a legal mistake (poor establishment / die-off).

### 5.7 Colonists (aggregate workforce + mouths)

No individuals, names, or job UI.

| Function | Rule |
|----------|------|
| **Consume** | 1 Food Unit (FU) + O₂ per colonist per month; light power/water scaling |
| **Labor** | Harvest capacity scales with pop × morale (diminishing returns) |
| **Auto-harvest** | Automatic policy every month (see §5.8) |
| **Waste** | Imperfect return toward soil/insect food; worse when morale low |
| **Morale** | Aggregate 0–100; modulates waste + harvest efficiency |
| **Attrition** | Short food/O₂ but not zero → lose 1–2 colonists that month |
| **Growth** | +1 every 6 months if healthy gates pass |
| **Overcrowd** | Used > capacity → morale −, illness event weight up |

**More population is a tradeoff:** more harvest labor, more upkeep. Growth is not required to win.

**Healthy growth checkpoints** (months 6, 12, 18, 24): +1 colonist if all true that month:
- Morale ≥ 50  
- Food stores ≥ 1 month of consumption after upkeep  
- Population ≤ habitat capacity  
- O₂ not Critical  

**Starting colony**

| Stat | Value |
|------|--------|
| Colonists | 12 |
| Food | 36 FU Earth dry rations at ++ (~3 months) |
| O₂ buffer | ~2 months without production |
| Power | Stable, small surplus |
| Morale | 60/100 |
| Habitat capacity | 20 |

Earth rations are ++ quality. They **do not** count toward win-condition ecosystem food production.

**No Earth food crates** as a request type in v1 — ecosystem must feed the colony long-term. Earth covers O₂ / water / nutrients / power emergencies.

### 5.8 Harvest policy (automatic)

Resolution order: ecosystem ticks → events → **harvest** → upkeep.

1. Labor capacity from colonists × morale (halved under work stoppage).
2. Prefer sources: **Deer → Fruit → Rabbits → Insects → Wolves**.
3. Colonists do **not** directly eat grass/algae; only **fruit**, animal harvest, and starting rations.
4. **Sustainability floor:** harvest at most ~25% of a species population per month; never below a small reserve (e.g. max(5–10 head, ~10% of recent peak)) unless colony food is **Critical** (emergency harvest, including wolves).
5. Trees: fruit only, never fell the cohort for food.
6. Report line explains what was taken and whether floors were respected.

### 5.9 Food units and satiation

**1 FU** = one colonist-month of food need at baseline.  
12 colonists → 12 FU/month before waste. Low morale can raise effective need (~1.1–1.2×).

| Source | Tier | Role |
|--------|------|------|
| Insects | ++ | Baseline viable |
| Rabbits | +++ | Solid staple |
| Fruit | +++ | Delayed plant staple |
| Deer | ++++ | Best staple |
| Wolves | + | Emergency only |
| Earth rations | ++ | Starting buffer only |

**Monthly eating:** consume required FU, **best tier first**.  
**Month’s satiation result** = **worst tier** that had to be eaten to finish the meal:

| Worst tier used | Result |
|-----------------|--------|
| ++++ or +++ | Well fed → small morale +, less waste |
| ++ | Adequate → neutral |
| + only, or shortfall | Poor → morale −; shortfall → attrition risk |

Colonists require **++ minimum** as the design standard. Surviving on wolves alone is possible but punished.

### 5.10 O₂, power, water, soil

**Oxygen**
- Produce: algae (early), trees (stronger later) → into colony O₂ buffer.
- Consume: **colonists only** (animals abstracted; no separate animal O₂ drain).
- Win: last 3 months **biome O₂ production ≥ colonist consumption** (not tank drawdown alone).

**Power**
- Backbone for life support + **greenhouse light** (plant growth proxy).
- Baseline solar; dust storms reduce it; power cell shipments refill buffer.
- Consumes with pop; Emergency Priority lump cost.
- **Critical for a full month:** plant growth collapses, morale −, O₂ recycle less efficient.
- Player-facing: Surplus / Stable / Tight / Critical (plus numeric buffer as needed).

**Water**
- Biome water pool + colony ice reserve that tops biome up.
- Plants need water to grow; colonists have low net drain if systems stable.
- Water ice shipment refills reserve.
- **Critical:** plant growth collapses → food web fails next.

**Soil**
- Qualitative **Poor / Fair / Good / Rich** (internal 0–100).
- Down: overgrazing, unbalanced insect blooms, blight/neglect.
- Up: mycelium + trees, nutrient shipments.
- Multiplies grass/tree growth. Main mid-game story engine.

### 5.11 Morale

Range 0–100. Bands e.g. Critical ≤ 25, Watch ≤ 45, else Stable/high.

| Up | Down |
|----|------|
| Well-fed (+++ / ++++) | Hunger, wolf-only meals |
| Stable O₂ / power | Critical O₂ / power |
| Rising biomass / quiet month | Deaths, blight, dust storms |
| Habitat OK | Overcrowding |

- Low: waste up, harvest efficiency down.  
- Critical full month → **work stoppage** (harvest labor halved).  
- High: waste down, harvest efficiency up.

**Illness (simple):** not a deep system. Overcrowd or Critical morale increases weight of a minor **Illness** event (+food need, −labor that month). Abstract only.

### 5.12 Win / Loss

**Run length:** 24 months.

**Win at month 24 — all required:**
- Population > 0, not in critical life-support failure
- Ecosystem **food harvest ≥ consumption** for last **3 consecutive months** (not Earth rations alone)
- Ecosystem **O₂ production ≥ consumption** for last **3 consecutive months**
- At least **4 species established** (population above minimum viable / reserve floor; grass and mycelium count; trace/extinct do not)

Earth tanks may still be held as buffers; **production** must clear the checks.

**Month 24 order:** sim → harvest → upkeep → growth checkpoint → win/loss.

**Loss**
- Colonists = 0  
- Finish month with food **or** O₂ buffer ≤ 0 after upkeep  

**Presentation:** Binary win/loss; letter grade later; post-run summary + **causal timeline** (3–5 beats).

### 5.13 Difficulty curve
- Months 1–4: hard to die  
- Months 5–12: teach consequence  
- Months 13–24: weak webs punished; months 19–24 species catalog closed  

---

## 6. Progression & Economy

- **Catalog:** All species month 1.
- **Earth window:** Months **1–18** full (species + resources); **19–24** resource-only.
- **Primary scarce resource:** Time-under-uncertainty (actions × lag). Secondary: food and O₂ buffers.
- **Meta:** Optional achievements/telemetry later; not required for prototype.
- **Later:** more species, deeper events, multi-colony, map/habitat view, habitat module requests.

---

## 7. Random Events & Failure States

**Frequency:** ~1 minor / 2–3 months; ~1 major / 6–8 months; quiet months allowed.

| Event | Effect (summary) |
|-------|------------------|
| Dust storm | Power −, O₂ production −, outdoor growth − |
| Cold snap | Food need +, algae growth − |
| Solar flare | Next request delayed +1 month |
| Blight | Hard cut to one species |
| Quiet month | No named event |
| Illness | Minor; overcrowding/low morale weighted; +food need, −labor |

**Forecasts:** ~50% chance of one-month soft warning on some major weather.

**Shipments:** 2% lost normal; Emergency 12% lost; no random late.

---

## 8. Art Style & Presentation

- Text + icons + trend arrows/sparklines; clarity over spectacle; no map in v1.
- **Animals:** integer counts (round when huge).  
- **Plants / fungi:** density or index 0–100 + trend.  
- **Food:** FU total + stacked quality breakdown.  
- **O₂ / power / water:** numeric buffer + Stable/Watch/Critical chips.

### Monthly report structure
1. Headline  
2. Colony vitals (Δ)  
3. Ecosystem  
4. Events  
5. Arrivals / losses  
6. Outlook (pending + forecast)  
7. Action prompt  

Include a short **harvest policy** line for transparency.

**Voice:** Dry liaison / systems brief.  
**Audio:** Ambient nice-to-have, not a blocker.  
**Setting:** Default name **Hephaestus** (rename once at start).

---

## 9. Technical Approach

- **Stack:** Vite + TypeScript, browser, no backend required.
- **Modules:** `colony`, `ecosystem`, `events`, `shipments`, `report`, `rng`. Sim never reads DOM.
- **RNG:** Seeded; show seed on end screen.
- **Save:** Autosave each month boundary; **3 slots** + JSON export/import.
- **Debug:** `?debug=1` (tick log, force event, jump month, set populations).
- **Tutorial:** Months 1–2 scripted (guide first producer request + pending shipment UI), then free.

---

## 10. Scope & Priority

### Must-have for first playable
- Full loop (knowledge-first) + Stand By + Emergency Priority  
- 8 species + satiation + auto-harvest + colonist labor/attrition/growth  
- O₂ / power / water / soil  
- 24-month win/loss  
- Events (dust, cold, blight, quiet; solar flare if ETA clear)  
- Seeded runs, 3-slot save + export  
- Clear monthly report  

### Non-goals for prototype
No multiplayer, tech tree, 2D map, colonist personalities, combat, shop, multi-colony, habitat modules.

### Success metric
Playtesters plan 2+ months ahead unprompted; blame deaths on their own timing, not opacity or click-speed.

### Implementation data (not open design)
Tune in code/data files, not more GDD rounds:
- Growth rates, predation rates, seed sizes  
- FU yields per harvested animal/fruit  
- Exact package magnitudes  
- Event weights and severities  
- Report headline strings (~20)  
- Win/loss copy  

---

## 11. Decision log (closed)

| Topic | Decision |
|-------|----------|
| Pitch | Settle/tame frontier (not explore) |
| Turn order | Knowledge-first |
| Species | 8 including grass; all month 1 |
| Food tiers | ++ insects; +++ rabbit/fruit; ++++ deer; + wolves |
| Win | 24 mo; ≥4 species; 3 mo food+O₂ self-sufficiency |
| Earth window | Full 1–18; resources 19–24 |
| Shipments | 2% lost; no random late; Emergency 12% |
| Saves | 3 slots |
| Colonists | Labor + consumption; auto-harvest; attrition; +1/6 mo |
| Harvest | Best food first; sustainability floors; emergency wolves |
| Starting biome | Small algae + fair soil + adequate water |
| Earth food crates | None in v1 |
| Habitat modules | Not in v1 |

---

## 12. Changelog

### v0.3 — 2026-07-24
- Folded full systems Q&A (colonists, harvest, FU/satiation, O₂/power/water/soil, packages, morale, win edges).
- Locked resolution order: sim → events → harvest → upkeep.
- Design marked **closed for prototype**; balance numbers deferred to data.

### v0.2 — 2026-07-24
- Knowledge-first loop, full species web, satiation tiers, Earth window, win/loss, tech stack.

### v0.1 — 2026-07-21
- Initial draft.

---

*Living document. Reopen design only if playtests break a pillar—not for routine number tuning.*
