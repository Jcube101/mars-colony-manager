# Mars Colony Manager — Design Q&A

**Purpose:** Force the decisions the GDD leaves open so the first prototype has a clear north star.  
**How to use:** For each question, keep or edit **Your Answer**. **Recommended** is a proposal aligned with the four pillars (limited agency, living ecosystem, foresight, clean separation) — replace it whenever you disagree.

**Legend**
- **Your Answer:** blank or your override — this is the source of truth once filled.
- **Recommended:** suggested default if you like the direction.
- *Why this question matters:* short note on what breaks if we leave it vague.

---

## 1. High Concept

### Q1.1 — One-sentence pitch (outside the GDD wording)
What is the single sentence you’d put on a store page or itch.io header?

**Your Answer:**  Settle the uncharted frontier of the Mars landscape. 
_______________________________________________

**Recommended:**  
“One request per month. Two months until it lands. On Mars, the ecosystem doesn’t wait for Earth.”

*Why this question matters:* Every UI label, tutorial line, and feature cut should support this sentence.

---

### Q1.2 — Emotional fantasy
What feeling should a good turn produce? (e.g. dread, clever planning, quiet pride, scientific curiosity)

**Your Answer:**  Quiet dread → deliberate plan → quiet pride
_______________________________________________

**Recommended:**  
Quiet dread → deliberate plan → delayed relief or “I should have seen that coming.” The fantasy is **foresight under uncertainty**, not crisis micromanagement.

*Why this question matters:* If the fantasy is “clever planner,” the monthly report must reward reading history; if it’s “firefighter,” the lag mechanic will feel punishing instead of interesting.

---

### Q1.3 — What the player is *not*
In one line: what popular game fantasy are we explicitly refusing?

**Your Answer:**  
_______________________________________________

**Recommended:**  
We are not RimWorld drama, not Surviving Mars real-time building, not a city-builder, and not a combat survival game. We are a **lagged systems puzzle** with a colony life-support skin.

---

### Q1.4 — Tone of the fiction
Hard sci-fi, soft sci-fi, dark comedy, bureaucratic satire, hopeful exploration?

**Your Answer:** 
_______________________________________________

**Recommended:**  
Grounded soft sci-fi with bureaucratic texture (“Earth supply window,” liaison reports). Serious enough that death of the colony stings; light enough that a rabbit explosion is darkly funny, not traumatic.

---

## 2. Design Pillars

### Q2.1 — Pillar ranking when they conflict
If two pillars fight (e.g. living ecosystem wants chaos; limited agency wants clarity), which wins?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Priority order:  
1. **Limited Agency, High Consequence**  
2. **Foresight Over Reaction**  
3. **Clean Separation**  
4. **Living Ecosystem** (surprise is good; opaque unfairness is not)

Surprise must still be *legible in hindsight*.

---

### Q2.2 — What “high consequence” means in practice
Should a single bad month be able to doom a run, or only a chain of mistakes?

**Your Answer:**  
_______________________________________________

**Recommended:**  
A single bad month can **put you on a death spiral**, but pure RNG should rarely wipe a healthy colony in one step. Instant wipe only if the player was already near a critical threshold. Agency stays meaningful; lag stays fair.

---

### Q2.3 — How much the ecosystem can “ignore” the player
Can the background sim create wins or losses the player never touched with an action?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Yes — populations and weather can shift without a player action — but **win/loss should still feel connected to the chain of monthly choices**. Pure “sim kills you while you played well” is a design failure; pure “sim is decorative” kills the living-ecosystem pillar.

---

### Q2.4 — Clean separation boundary
What must *never* appear as a real-time or sub-month player decision?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Never: assign jobs, move colonists, micromanage feeding, pause the daily sim, or issue mid-month emergency orders (except the already-planned **Emergency Priority** as a monthly action). Player only acts at month boundary.

---

## 3. Target Audience & Platform

### Q3.1 — Primary player persona
Who is the first player we design for (one sentence)?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Someone who finished a run of *Surviving Mars* or *Banished* and wanted fewer clicks and more “I planned three months ahead,” not more panels.

---

### Q3.2 — Accessibility of systems literacy
Do we assume the player will reverse-engineer the sim, or must the game teach cause-and-effect explicitly?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Teach lightly, then let systems speak.** Tutorial + first 6 months explain lag and report structure; after that, learning interactions is part of the fun. No full formula dump in v1.

---

### Q3.3 — Mobile vs desktop priority for prototype
Is the first playable optimized for phone thumbs or desktop keyboard/mouse?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Desktop-first layout that still works on mobile** (large tap targets, single-column report). Don’t block phone play, but don’t delay prototype for mobile polish.

---

### Q3.4 — Session length reality check
Is “15–40 minutes” a full run, or one sitting that might continue later?

**Your Answer:**  
_______________________________________________

**Recommended:**  
A **full run** targets ~20–35 minutes once the player knows the game. First run may be 40–60. Save between months is required so sessions can split.

---

### Q3.5 — Difficulty identity
Is this a puzzle with a “correct” path, a roguelike with variance, or a sandbox?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Short roguelike-adjacent campaign**: fixed month horizon, seeded events + species interactions, enough variance that second runs teach new interactions, not pure puzzle solution.

---

## 4. Core Gameplay Loop

### Q4.1 — What the player reviews *before* choosing
Exact list of information available at decision time.

**Your Answer:**  
_______________________________________________

**Recommended:**  
Always visible at decision time:  
- Colony vitals (pop, food, O₂ capacity, power, morale, habitat)  
- Species populations (simple counts + trend arrows)  
- Pending shipments (what arrives next month / in two months)  
- Last month’s event summary (1–3 lines)  
- Months remaining / Earth support status  

Optional later: “forecast hints” (not full prediction).

---

### Q4.2 — Must the player always take an action?
Can they “pass” / request nothing?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Yes — “Stand by / no request” is a valid action.** Sometimes the right play is to wait for last shipment to land and not flood the ecosystem. Opportunity cost is still real (you burned a month of Earth window).

---

### Q4.3 — Order of resolution at month end
Exact sequence when the player ends the month.

**Your Answer:**  
_______________________________________________

**Recommended:**  
1. Deliver any shipment due this month (after sim, so arrival faces current conditions).  
2. Lock player action (queue shipment or emergency or pass).  
3. Run ecosystem sim for the month (N internal ticks).  
4. Apply environmental events that fired this month.  
5. Consume colony upkeep from ecosystem + stores.  
6. Evaluate win/loss.  
7. Show monthly report.

*Shipments arrive before the month’s ecology has run* so “I ordered rabbits into a storm month” is not a possiblilty. The liason should make all decisions once they are aware of all the resources available to them. 

---

### Q4.4 — Can the player undo after seeing the report?
Undo last action before next month?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**No undo after End Month.** Optional “review choice” confirmation before commit. Ironman-friendly; teaches foresight.

---

### Q4.5 — How many pending requests can be in flight?
Only one pipeline, or can you stack monthly requests?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**One new request per month, multiple can be in flight** (month N request lands at N+2; month N+1 request lands at N+3). That’s the core planning board: what you’ve already ordered still shapes the future.

---

## 5. Core Mechanics & Systems

### 5.A Monthly Actions

### Q5.A1 — Action categories for prototype (locked list)
What can the player choose in v1?

**Your Answer:**  
_______________________________________________

**Recommended:**  
v1 actions:  
1. Request Species (from unlocked list)  
2. Request Resource (O₂ / water / nutrients / power cells)  
3. Emergency Priority (rush one pending shipment)  
4. Stand by (no request)  

No building placement in v1.

---

### Q5.A2 — Is Emergency Priority worth the complexity for prototype?
Keep, cut, or simplify?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Keep, but simple:** costs a chunk of power + morale (or food), arrives next month instead of +2, small fail chance (10–15%) to lose the shipment entirely. Teaches risk under lag without a second systems layer.

---

### Q5.A3 — Shipment delay: always exactly 2 months?
Fixed, or variable 1–3?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Fixed 2 months** for the prototype. Variable delay adds unfairness before players learn the core rule. Flavor text can say “~2 months transit”; rules stay fixed.

---

### Q5.A4 — Do resources and species share the same delay rules?
Any difference?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Same delay.** Consistency > realism. Emergency Priority can apply to either.

---

### Q5.A5 — Costs: do requests cost anything immediately?
Or only “use a month’s action”?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Action slot is the main cost.** Optional light Earth-credit budget later. For v1: no money system — scarcity comes from **one action + lag + Earth support window**. Resources you request still occupy cargo realism via “you can’t request two things.”

---

### 5.B Ecosystem Simulation

### Q5.B1 — Simulation fidelity for prototype
Agent-based individuals vs stock-and-flow (aggregate populations)?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Stock-and-flow with stochastic noise** for v1 (populations as numbers + probabilistic growth/death). Agent-based only if a species needs it later. Faster to balance, easier to report, still emergent enough with noise + interactions.

---

### Q5.B2 — Internal clock resolution
How many sim ticks per player month?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**~30 ticks (daily)** or **10 ticks (roughly every 3 days)**. Prefer **10 ticks** first: enough for mid-month spikes/crashes to form, cheap to run, easy to summarize as “early / mid / late month” if we ever show a sparkline.

---

### Q5.B3 — First species set
Name them and their ecological role.

**Your Answer:**  
_______________________________________________

**Recommended:**  
1. **Cyanobacteria / Algae mats** — O₂ production, needs water + light (power proxy), fragile in cold.  
2. **Insects (crickets)** — fast food biomass, eats plant/algae waste or nutrients, can boom.  
3. **Rabbits** — mid food, eats plant biomass (or insects in simplified chain), can overgraze.
4. **Deer**  — great food, eats more plant biomass, can overgraze 
5. **Wolves**  — bad food, eats animal biomass (only rabbits and deer for now), 
6. **Tree** — O₂ production, food biomass (fruits 9 months after planting), needs water + light (power proxy), resistant to cold.
7. **Mycelium / soil fungi** — improves soil quality slowly, buffers nutrient crash; weak alone (needs trees)

Food chain sketch: Nutrients/Soil → Algae/Plants → Insects → Rabbits/Deer → Wolves → (waste back to soil, imperfectly).

---

### Q5.B4 — What “establishes poorly” means mechanically
When a species shipment arrives, how does establishment work?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Arrival adds a **seed population**. Survival of seed depends on: habitat capacity, matching resource (food/water/O₂), and active events. Bad conditions → seed dies or starts at 25–50% of normal. Player sees “Shipment arrived — establishment: Poor / Fair / Strong.”

---

### Q5.B5 — Player-visible ecosystem resources vs colony resources
Are “oxygen” in the biome and “life support O₂ tanks” the same pool?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Two linked pools:**  
- **Biome O₂ production** (from species) feeds into  
- **Colony life-support buffer** (tanks + habitat capacity).  

Same for food: biomass → harvestable food stores. Clean separation in UI: *Ecosystem* column vs *Colony* column, with a transfer rate each month.

---

### Q5.B6 — How aggressive should boom/bust be?
Subtle drifts or dramatic crashes?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Readable drama:** populations can double or half within a month if unbalanced, but not go 100→0 without warning trends the prior month when possible. Use soft floors (remnant populations) unless habitat is truly lethal.

---

### Q5.B7 — Can species go extinct permanently in a run?
Or can they re-establish only via shipment?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Local extinction is real.** Recovery only via new shipment (or rare “dormant spore” for algae/fungi). Makes overgrazing and bad timing permanent scars — high consequence.

---

### 5.C Colony Status

### Q5.C1 — Starting colony (numbers)
Population, food months, O₂, power, morale, habitat.

**Your Answer:**  
_______________________________________________

**Recommended:**  
- Colonists: **12**  
- Food: **3 months** of stores at current consumption  
- O₂ buffer: **2 months** without production  
- Power: **stable** (small surplus)  
- Morale: **60/100** (stable)  
- Habitat capacity: **20** colonists  

Tight enough that month 1–4 matter; not so tight that one storm ends the run.

---

### Q5.C2 — How colonists grow
Natural birth, immigration only, or milestones?

**Your Answer:** Flat pop until self-sufficiency thresholds unlock a small crew expansion event. +1 colonist every 6 months if morale + food + habitat all healthy.
_______________________________________________

**Recommended:**  
**v1: no natural births.** Population grows only via rare “crew rotation / Earth transfer” events or mid-game milestone rewards — or stays flat and **self-sufficiency** is about life support, not pop growth. Simpler.  
Alt if you want growth fantasy: +1 colonist every 6 months if morale + food + habitat all healthy.

**Recommended default:** flat pop until self-sufficiency thresholds unlock a small crew expansion event.

---

### Q5.C3 — Morale: meaningful or flavor?
Does morale do anything mechanical?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Light mechanical:** low morale increases food waste and reduces “harvest efficiency” from ecosystem; critical morale for a full month risks a **work stoppage** (one month of halved production); medium/okay morale for business as usual; high morale decreases food waste and increases “harvest efficiency” from ecosystem. Not a full social sim.

---

### Q5.C4 — Habitat space role
Just a soft cap, or building system?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Soft cap only in v1.** Over capacity → morale down + disease risk event weight up. Habitat expansion is a **resource request** (“Habitat modules”) later, not a build menu.

---

### 5.D Win / Loss

### Q5.D1 — Run length (months)
Exact number for v1.

**Your Answer:**  
_______________________________________________

**Recommended:**  
**24 months** for standard run. Optional long run 36 later. 24 matches ~2 Earth years narrative and fits 20–35 min once learned.

---

### Q5.D2 — Self-sufficiency threshold (win condition detail)
What exact checks at month X?

**Your Answer:**  Binary win + a simple grade later (A–D based on buffer margins).
_______________________________________________

**Recommended:**  
At month **24**, win if **all** are true:  
- Population > 0 and not in critical life-support failure  
- Food production ≥ consumption for the last **3 consecutive months** (using ecosystem harvest, not Earth tanks alone)  
- O₂ production ≥ consumption for last **3 consecutive months**  
- At least **2 species** still established  

No score ranking required for v1 — binary win + a simple grade later (A–D based on buffer margins).

---

### Q5.D3 — Loss conditions (precise)
What triggers immediate loss vs “you have one month to fix”?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Immediate loss:** colonists = 0.  
**Collapse loss:** O₂ buffer ≤ 0 **or** food stores ≤ 0 for the **entire month** after upkeep (i.e. you finish a month with no food or no O₂).  
**Soft fail warnings:** one month of “critical” flags before that if buffers are near zero.

---

### Q5.D4 — Partial success?
Any non-binary outcomes?

**Your Answer:**  
_______________________________________________

**Recommended:**  
v1 binary win/loss. Post-run summary: months survived, peak biomass, extinctions caused, shipments used. Grades later.

---

## 6. Progression & Economy

### Q6.1 — Unlock structure
Are all v1 species available month 1, or gated?

**Your Answer:**  All v1 species available from month 1. But rabbits cannot survive without grass, so they'll die out anyway. Player can figure this out themselves.
_______________________________________________

**Recommended:**  
**Soft gate by month + risk:**  
- Month 1–6: Algae, Insects, basic resources  
- Month 7+: Rabbits, Fungi, better resources  
- No tech tree UI — just “Earth catalog expands” flavor.

---

### Q6.2 — Earth support window
When do shipments get worse, and how?

**Your Answer:**  Months 1–18 full support; 19–24 resources only, species locked
_______________________________________________

**Recommended:**  
- Months **1–12:** normal catalog, free action economy  
- Months **13–18:** **every other month** you may request (forced stand-by alternate months) *or* requests cost emergency-level risk  
- Months **19–24:** **no new species**; resources only every other month  

**Simpler alt for prototype:** months 1–18 full support; 19–24 resources only, species locked. Prefer the simpler alt for v1.

**Recommended v1:** Full support months 1–18; months 19–24 **resource-only** requests (species catalog closed). Forces living off the ecosystem you built.

---

### Q6.3 — Is there a score or meta-progression between runs?
Unlocks, achievements, nothing?

**Your Answer:**  Achievements can be unlocked at a player level per game. 
_______________________________________________

**Recommended:**  
**Nothing between runs for prototype.** Pure session game. Optional “best months survived” local high score later.

---

### Q6.4 — Mid-game “more complex introductions”
What is the first *complex* thing after the base 4 species?

**Your Answer:**  
_______________________________________________

**Recommended:**  
After prototype: **a plant that fixes soil but attracts pests**, or a **predator insect** that controls rabbit/insect booms but can wipe prey if over-introduced. One “double-edged” species teaches foresight better than five mild ones.

---

## 7. Random Events & Failure States

### Q7.1 — Event frequency
How often does a named event fire?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Roughly **1 minor event every 2–3 months**, **1 major every 6–8 months**, plus small weather noise every month. Player should not feel RNG slap every single turn.

---

### Q7.2 — Event list for prototype (max 5)
Which events ship in v1?

**Your Answer:**  
_______________________________________________

**Recommended:**  
1. **Dust storm** — power −, O₂ production −, outdoor species growth −  
2. **Cold snap** — food consumption +, algae growth −  
3. **Solar flare** — temporary comms: next request delayed +1 month
4. **Blight** — one species population hard cut  
5. **Quiet month** — no event (explicitly possible)

---

### Q7.3 — Event forecasting
Does the player get any warning?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**One-month soft forecast** for some events (“Sensors: elevated dust risk next month”) ~50% of the time for major weather. Not guaranteed. Supports foresight without removing surprise.

---

### Q7.4 — Shipment failure rates
How often does Earth fail the player?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Normal shipment: **5% late (+1 month)**, **2% lost**. Emergency Priority: **12% lost**. Low enough that planning is rational; high enough that buffers matter.

---

### Q7.5 — Failure fantasy
When the colony dies, what should the player feel?

**Your Answer:**  
_______________________________________________

**Recommended:**  
“I see which month I overcommitted / underbuffered” — not “the game cheated.” End screen must show a **causal timeline** (3–5 key moments).

---

## 8. Art Style & Presentation

### Q8.1 — Prototype presentation mode
Text-only, text + icons, or light illustrations from day one?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Text + simple icons + sparklines/trend arrows.** No map required. Art is secondary to report clarity.

---

### Q8.2 — Monthly report structure
What sections, in what order?

**Your Answer:**  
_______________________________________________

**Recommended:**  
1. **Headline** (1 line: “Colony stable — insect bloom underway”)  
2. **Colony vitals** (table with Δ from last month)  
3. **Ecosystem** (species + biome resources + trends)  
4. **Events** (what happened)  
5. **Arrivals / losses** (shipments)  
6. **Outlook** (pending inbound + optional forecast)  
7. **Action prompt**

---

### Q8.3 — How transparent is the sim? (critical)
What numbers are exact vs qualitative?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Exact:** colony stores, pending shipments, species headcounts (rounded).  
**Qualitative:** soil quality (Poor/Fair/Good/Rich), establishment strength, event severity.  
**Hidden:** exact growth formulas, tick-by-tick logs (optional debug for you, not player).

Player should reverse-engineer *relationships*, not spreadsheets.

---

### Q8.4 — Narrative voice of the report
Who is speaking?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Colony systems officer / automated liaison brief** — dry, slightly human (“Algae mats underperformed. Again.”). Short sentences. No novel.

---

### Q8.5 — Color / urgency language
How do we show danger without real-time alarms?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Status chips: **Stable / Watch / Critical** on each vital. Red only for Critical. Avoid constant red so Critical means something.

---

## 9. Technical Approach

### Q9.1 — Stack for prototype
Vanilla HTML/JS, React, something else?

**Your Answer:**  Vite + TS
_______________________________________________

**Recommended:**  
**Vanilla HTML + CSS + JS** (or minimal Vite + TS if you want types). No backend. One page. Fastest path to the loop.

---

### Q9.2 — Determinism
Should the same seed replay the same run?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Yes — seeded RNG.** Essential for balancing and for “share this seed” later. Show seed on end screen.

---

### Q9.3 — Save model
When and how?

**Your Answer:**  Multiple (10) slot for v1 + “export JSON” for backup. Autosave to **localStorage** at each month boundary.
_______________________________________________

**Recommended:**  
Autosave to **localStorage** at each month boundary. One slot for v1 + “export JSON” for backup. Resume from last completed report.

---

### Q9.4 — Sim architecture principle
Any hard rule for code structure?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Strict modules: `colony`, `ecosystem`, `events`, `shipments`, `report`, `rng`. Player input only mutates an `orders` queue; sim never reads DOM. Makes balance and tests possible.

---

### Q9.5 — Debug / designer tools in prototype?
What do *you* need while building?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Hidden `?debug=1`: show tick log, force event, jump month, set populations. Not for players.

---

## 10. Scope & Priority

### Q10.1 — Definition of “first playable”
What must be true to call prototype done?

**Your Answer:**  
_______________________________________________

**Recommended:**  
A stranger can: start a run, understand lag in ≤5 minutes, make 24 monthly decisions, win or lose for legible reasons, and say whether the ecosystem felt alive. No art pass required.

---

### Q10.2 — Explicit non-goals for prototype (expand the GDD list)
What will we refuse even if it’s “easy”?

**Your Answer:**  
_______________________________________________

**Recommended:**  
No multiplayer, no tutorial video, no tech tree UI, no 2D base map, no colonist names, no combat, no real money/meta shop, no mobile-only gestures, no multi-colony.

---

### Q10.3 — First vertical slice before full 24-month content
What’s the smallest fun slice?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**6-month vertical slice:** 3 species, 2 resources, dust + cold events, full lag pipeline, report UI, loss possible, no win screen yet. Validate “does lag feel good?” before writing 24 months of balance.

---

### Q10.4 — Success metric for you as designer
How do you know the vision worked?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Playtesters describe planning 2+ months ahead unprompted, and blame a death on their own shipment timing at least once — not on “I couldn’t click fast enough” or “I didn’t know what anything did.”

---

## 11. Deeper Open Questions

### Q11.1 — Information delay vs action delay
The shipment is delayed; is the **report** also incomplete on purpose?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Report is **complete for colony vitals** and **accurate but summarized** for ecosystem. No fog-of-war on last month’s numbers — the lag already supplies the core uncertainty (future state while orders are in flight).

---

### Q11.2 — Multiplicative difficulty
Should later months get harder via entropy alone, or scripted pressure?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Mostly entropy + Earth window tightening.** Light scripted beats optional (month 12 dust season). Avoid fixed story missions in v1.

---

### Q11.3 — Player character identity
Is the player a named character, a role, or an abstract authority?

**Your Answer:**  Let player name their character but and give them the option to choose a title among many (does not affect gameplay)
_______________________________________________

**Recommended:**  
**Role only:** “Earth Liaison.” No RPG stats. Keeps focus on system decisions.

---

### Q11.4 — Ethical / thematic line
Any topics we will not gamify (e.g. colonist starvation detail, body horror)?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Keep death abstract: “Colony life support failed — population lost.” No graphic starvation. Species die as numbers. Tone stays systems-serious, not cruel.

---

### Q11.5 — Name of the colony / setting specificity
Named site on Mars? Fictional company?

**Your Answer:**  Default name is Hephaestus but player can rename at the beginning of the game only.  
_______________________________________________

**Recommended:**  
**Outpost Hephaestus** (or player-named in v2), under a thin fictional authority (“Ares Logistics Compact”). Specific enough for flavor text; not lore-heavy.

---

### Q11.6 — Tutorial form
Modal steps, scripted first months, or glossary only?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Scripted first two months:** Month 1 forced “request algae,” month 2 free choice with tooltips; highlight pending shipment UI. Then release into full agency. Skip long manuals.

---

### Q11.7 — What “living” means for marketing vs design
Is emergence a promise we must hit in v1?

**Your Answer:**  
_______________________________________________

**Recommended:**  
v1 promise: **one clear emergent story per run** (e.g. insect bloom → rabbit request → overgraze → soil crash). Not infinite sandbox ecology. Market as “every run tells a short ecological story,” not “full Mars biosphere.”

---

### Q11.8 — Competitive comparison (positioning)
Closest game, and how we differ in one line each?

**Your Answer:**  
_______________________________________________

**Recommended:**  
- vs *Surviving Mars*: turn-based, no build spam  
- vs *Of Life and Land*: smaller scope, decision lag is the hook  
- vs *Frostpunk*: fewer crisis levers, more ecological delay  
- vs *Banished*: one action economy, not villager micromanagement  

---

### Q11.9 — Audio
Any sound for prototype?

**Your Answer:**  Some ambient sound would be great.
_______________________________________________

**Recommended:**  
**Silent or one ambient loop + UI ticks** later. No audio requirement for prototype.

---

### Q11.10 — Analytics / telemetry
Track anything?

**Your Answer:**  Track what is necessary for improving the next version
_______________________________________________

**Recommended:**  
Not in v1. Optional later: anonymous month reached + win rate for balance.

---

## 12. Cross-Cutting Balance Principles (decide once)

### Q12.1 — Primary scarce resource
What is the player *really* managing?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Time-under-uncertainty** (actions × lag), not money. Secondary: food buffer and O₂ buffer. If we add currency, we’ve probably diluted the pillar.

---

### Q12.2 — Forgiveness budget
How many “free mistakes” early?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Months 1–4 are **hard to die** (generous starting buffers + milder events). Months 5–12 teach consequence. Months 13–24 punish weak ecosystems. Onboarding via difficulty curve, not a long tutorial.

---

### Q12.3 — Clarity of causality rule
One sentence design law for reports and events.

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Every major swing in the report must be attributable to (a) a past player order, (b) a named event, or (c) a visible species interaction.** If the player can’t form a hypothesis, the sim is too opaque — fix the report or the rules.

---

### Q12.4 — Prototype data needs
What content must be written before code feels real?

**Your Answer:**  
_______________________________________________

**Recommended:**  
- 4 species definition cards (inputs, outputs, failure modes)  
- 4 resource types  
- 3 events  
- Report templates (~20 headline strings)  
- Win/loss copy  

Code without these will feel empty even if the loop works.

---

## Answer Tracker

| Section | Questions | Your overrides pending |
|--------|-----------|-------------------------|
| 1 High Concept | Q1.1–1.4 | |
| 2 Pillars | Q2.1–2.4 | |
| 3 Audience & Platform | Q3.1–3.5 | |
| 4 Core Loop | Q4.1–4.5 | |
| 5 Mechanics | Q5.A–D | |
| 6 Progression | Q6.1–6.4 | |
| 7 Events | Q7.1–7.5 | |
| 8 Presentation | Q8.1–8.5 | |
| 9 Technical | Q9.1–9.5 | |
| 10 Scope | Q10.1–10.4 | |
| 11 Deeper | Q11.1–11.10 | |
| 12 Balance laws | Q12.1–12.4 | |

**Suggested review order for you:**  
1. Pillars conflict order (Q2.1)  
2. Run length + win/loss (Q5.D1–D3)  
3. Species set (Q5.B3)  
4. Sim transparency (Q8.3)  
5. Earth support window (Q6.2)  
6. Everything else  

When you’ve filled **Your Answer** lines (or written “accept recommended”), we can fold decisions back into `GDD.md` as Version 0.2.

---

*Generated from GDD v0.1 vision pass. Recommendations are arguments, not canon — correct freely.*
