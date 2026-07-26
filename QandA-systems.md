# Mars Colony Manager — Systems Q&A (Round 2)

**Status:** LOCKED 2026-07-24 — all Recommended answers accepted. Folded into **GDD v0.3**.  
**Purpose:** Close the remaining design holes before coding — especially **what colonists do**, how harvest/upkeep works, and how biome resources actually cycle.  
**How to use:** Historical record; do not re-open unless playtests break a pillar.  
**Depends on:** GDD v0.2 → now superseded by v0.3

---

## A. Colonists — What do they actually do?

Colonists are currently only consumers (food, O₂, habitat) plus a growth rule. That is not enough. We need their **effects on the system**.

### QA1 — Colonist roles (aggregate, not individuals)
Do colonists provide labor that changes ecosystem → colony transfer, or only consume?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Colonists are an **aggregate workforce + mouths**, not named people.

Each month they automatically:
1. **Consume** food (with satiation rules) and O₂  
2. **Occupy** habitat  
3. **Harvest** from the ecosystem (labor enables biome → colony transfer)  
4. **Maintain** life support (power draw scales lightly with pop)  
5. **Generate waste** that can feed soil/insects imperfectly  

They do **not**: get jobs assigned, walk around, have moods as individuals, or require micromanagement.

---

### QA2 — Does more population help or only hurt?
Is “grow the colony” always good, or a tradeoff?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Tradeoff.**

| More colonists | Benefit | Cost |
|----------------|---------|------|
| Harvest labor | Higher max harvest capacity from biome | — |
| Upkeep | — | More food, O₂, power, habitat pressure |
| Morale | Slight pride bonus if buffers healthy | Stress if overcrowded or hungry |

**Rule of thumb:**  
- Harvest capacity scales with pop (diminishing returns after a point).  
- Consumption scales roughly linearly with pop.  
- Early game: 12 is enough labor for a small ecosystem.  
- Mid/late: +1 every 6 months helps you *use* a rich biome — or starves you if the web is weak.

Growing is optional power, not a pure win condition (win is self-sufficiency, not max pop).

---

### QA3 — Harvest: automatic policy
How is food taken from the ecosystem each month? (Player cannot micromanage feeding.)

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Automatic harvest policy** each resolution phase:

1. Compute **labor capacity** from colonist count × morale modifier.  
2. Prefer harvest sources in this order (best food first, emergency last):  
   **Deer → Fruit → Rabbits → Insects → Wolves**  
3. Never harvest a species below a **sustainability floor** unless the colony is in **Critical food** (then emergency harvest, including wolves).  
4. Plants (grass/algae/trees) are **not directly eaten** by colonists except **fruit** from mature trees. Grazers convert plants → meat.  
5. Harvest removes population/biomass from the biome and adds **colony food units** tagged with that source’s satiation tier.

Player sees: “Harvested: 40 insect, 12 rabbit (policy: prefer higher satiation; floors respected).”

---

### QA4 — Sustainability floor (don’t eat the breeding stock)
What stops the auto-harvester from wiping rabbits?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Default: harvest at most **~25% of a species’ current population** per month, and never reduce a species below a small **reserve** (e.g. 5–10 individuals or 10% of peak, whichever is higher) unless Critical food emergency.

Trees: only fruit is harvested, not the trees themselves.  
Grass/algae: colonists don’t mow the whole biome; grazers and insects do the eating. Soil nutrients/water still limit plant growth.

---

### QA5 — Partial colonist death vs binary colony death
Can population drop gradually (starvation/asphyxiation), or only total loss?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Gradual attrition, then collapse.**

- If food or O₂ is short but not zero: lose **1–2 colonists** that month (report: “Rationing failures — 1 colonist lost”), morale tanks.  
- If food stores **or** O₂ buffer hits **0** after upkeep: **collapse loss** (GDD) — run over.  
- Attrition is the death spiral; zero buffer is the cliff.

This makes “high consequence” feel fairer than only 12→0 in one step.

---

### QA6 — What “healthy” means for the +1 colonist / 6 months check
Exact gates?

**Your Answer:**  
_______________________________________________

**Recommended:**  
At month 6, 12, 18, 24 (checkpoint months), gain +1 if **all** true for that month:
- Morale ≥ 50  
- Food stores ≥ 1 month of consumption **after** upkeep  
- Habitat used ≤ capacity  
- Not Critical on O₂  

If failed, no growth (no death from the check itself).

---

## B. Food, satiation, and stores

### QB1 — How satiation tiers combine
If half the food is insects (++) and half is deer (++++), what does the colony “feel”?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Track **food units** in the store, each unit tagged with tier.

**Monthly eat order:** colonists consume required units, always eating **best remaining tier first** (deer → fruit → rabbit → insect → wolf).

**Satiation outcome for the month** = tier of the *worst* unit they had to eat to finish the meal (or weighted average — prefer **worst-unit rule** for clarity):

| Worst tier needed this month | Result |
|------------------------------|--------|
| ++++ or +++ | Well fed → small morale + and waste − |
| ++ | Adequate → no morale change from food |
| + (wolves) or shortfall | Poor → morale −; if shortfall, attrition risk |

Colonists **require ++ minimum**. Meeting demand only with + (wolves) counts as **technically alive but poorly fed** (morale hit, higher waste). Shortfall below required units → hunger.

---

### QB2 — How much food does one colonist need per month?
Unit definition.

**Your Answer:**  
_______________________________________________

**Recommended:**  
Define **1 Food Unit (FU)** = one colonist-month at ++ quality.

- Each colonist needs **1 FU** per month.  
- 12 colonists → 12 FU/month baseline.  
- Waste can increase effective need (low morale: e.g. 1.1–1.2×).

Shipment “food-equivalent” resources: if we only ship O₂/water/nutrients/power in v1, **no direct Earth food crates** unless you want them as a resource type — **Recommended: no Earth food crates in v1** so ecosystem must feed the colony long-term (Earth tanks cover O₂/water/power emergencies only).

---

### QB3 — Starting food stores: what tier?
3 months of stores — of what quality?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Starting stores = **36 FU of generic Earth rations at ++** (counts as insects-tier / adequate). Flavor: “Earth dry rations.” Once ecosystem harvest begins, mixed tiers enter the pool. Earth rations do **not** count toward the win condition’s “ecosystem harvest ≥ consumption” check.

---

### QB4 — Do harvested animals reduce breeding that month?
Timing of harvest vs population sim.

**Your Answer:**  
_______________________________________________

**Recommended:**  
Order inside resolution:  
1. Ecosystem ticks (growth, predation, events)  
2. Harvest (labor pulls from post-sim populations)  
3. Colony upkeep (eat, breathe, power)  

So animals can breed/get eaten by wolves *before* colonists harvest leftovers. Clear and simulation-friendly.

---

## C. Oxygen, power, water, soil

### QC1 — O₂ production and consumption
What produces/consumes O₂?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Produce (biome → life support):** Algae (primary early), Trees (stronger once established).  
**Consume:** Colonists (linear per pop). Animals have negligible colony O₂ cost (they live in habitat domes/greenhouse abstraction — keep simple: **only colonists drain colony O₂ buffer**).  
**Buffer:** Colony O₂ tanks store surplus production.  
**Win check:** last 3 months biome O₂ production ≥ colonist consumption (not tank drawdown alone).

---

### QC2 — Power: what is it for?
Power is listed but underspecified.

**Your Answer:**  
_______________________________________________

**Recommended:**  
Power is the **colony industrial/life-support backbone** and a **proxy for grow-light / greenhouse energy**.

**Consumes power:**
- Base life support (scales with pop)
- Greenhouse lighting for grass/algae/trees (if power Critical, plant growth crashes)
- Emergency Priority action (lump cost)

**Produces power:**
- Baseline solar (reduced by dust storms)
- Power cell shipments top up a **power buffer**

**No player power micro.** Status: Surplus / Stable / Tight / Critical.

If Critical for a full month: plant growth severely reduced + morale − + risk of life-support strain (O₂ recycle less efficient).

---

### QC3 — Water cycle
How does water work?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Single **biome water** pool + optional **colony water ice reserve**.

- Plants and algae consume water to grow.  
- Colonists consume a small amount (recycled heavily — low net drain if systems Stable).  
- Dust/cold can increase losses.  
- **Water ice shipment** adds to colony reserve, which slowly tops up biome water.  
- If water Critical: plant growth collapses → food web fails next.

Keep player-facing water as: **Adequate / Low / Critical** plus a numeric reserve if easy.

---

### QC4 — Soil quality
How does soil change?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Soil is a **qualitative meter**: Poor / Fair / Good / Rich (internal 0–100).

| Pressure | Effect |
|----------|--------|
| Overgrazing (rabbits/deer high vs grass) | Soil − |
| Insect blooms without plants | Soil − (waste imbalance) |
| Mycelium + trees present | Soil + slowly |
| Nutrient shipment | Soil + lump |
| Blight / neglect | Soil − |

Soil multiplies grass/tree growth. Poor soil = thin plants = grazers crash = food crisis. This is a main mid-game story engine.

---

### QC5 — Starting biome state
Is the dome empty on month 1?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Nearly barren starter greenhouse:**
- No algae presence  
- Soil: Fair  
- Water: Adequate  
- No grass, animals, trees, fungi  

Player must build the web via shipments. Tutorial pushes first producer (grass or algae).

**Alt (softer):** small established algae mat already producing a trickle of O₂ so month 1–2 aren’t pure tank drain.  
**Recommended default:** **small algae trickle + Fair soil + Adequate water**, no animals/grass/trees yet — teaches “expand the web” without instant O₂ death.

---

## D. Species behavior (design-level, not final numbers)

### QD1 — Predation: wolves
How aggressive?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Wolves need a minimum prey base (rabbits + deer).  
- If prey abundant: wolves grow; prey capped (good control).  
- If prey scarce: wolves crash or turn into “emergency harvest” pressure.  
- If wolves >> prey: prey local extinction risk, then wolf crash.  

Ordering wolves before prey is a **player mistake** the game allows (establishment Poor / rapid die-off).

---

### QD2 — Insects: boom risk
What do they eat if not controlled?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Insects eat **plant waste + nutrients + soft plant biomass**.  
Boom if nutrients high and predators (none in v1 except indirect harvest) low.  
Extreme boom: damages grass/algae (competition), soil stress, possible morale flavor (“infestation”) but not horror.  
Colonists happily harvest insect booms for ++ food.

---

### QD3 — Trees and the 9-month fruit clock
Does each shipment have its own age?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Yes. Track **tree cohort age** (months since strong establishment). Fruit production starts at age 9 for that cohort. O₂ production starts earlier (from establishment). Multiple tree shipments = multiple cohorts.

---

### QD4 — Mycelium dependency on trees
Hard requirement or soft?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Soft but strong:** without trees, mycelium grows ~0 / declines. With trees, slow soil improvement. Ordering mycelium first is a weak move (teaches dependency), not a hard UI lock.

---

### QD5 — Shipment seed sizes (relative)
How big is one “species shipment”?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Design in relative seed strength, not realism:

| Species | Seed size intent |
|---------|------------------|
| Grass | Large mat — establishes quickly if water/soil OK |
| Algae | Medium — O₂ helps fast |
| Insects | Medium-high — can boom from small seed |
| Rabbits | Medium |
| Deer | Small-medium — slower, bigger impact later |
| Wolves | Small — dangerous if prey thin |
| Trees | Small cohort — long game |
| Mycelium | Medium — slow effect |

Exact numbers in data tables later.

---

## E. Resource shipments (Earth cargo)

### QE1 — What does one resource shipment grant?
Magnitudes (relative).

**Your Answer:**  
_______________________________________________

**Recommended:**  
Each resource action delivers **one cargo package**:

| Resource | Package effect |
|----------|----------------|
| O₂ tanks | +~2 months O₂ buffer at current pop |
| Water ice | + significant water reserve / biome top-up |
| Soil nutrients | + soil quality step (e.g. Fair→Good) or +25 soil points |
| Power cells | + power buffer through ~2–3 months normal use |
| Habitat modules | **Defer to post-v1** unless needed; capacity 20 is enough for 12→16 max growth in 24 months (+1×4 checkpoints = +4 → 16) |

**Recommended v1 resource list:** O₂, Water ice, Soil nutrients, Power cells only (no habitat modules yet).

---

### QE2 — Emergency Priority costs
Exact-ish costs.

**Your Answer:**  
_______________________________________________

**Recommended:**  
On use (when declaring Emergency Priority):  
- Power: drop one full status step or −40% of buffer  
- Morale: −10 to −15  
- Risk: 12% lose shipment  

Cannot emergency if no pending shipment. Cannot emergency a shipment already due next month.

---

## F. Morale, habitat, events (edge rules)

### QF1 — Morale drivers (what moves the number)
**Your Answer:**  
_______________________________________________

**Recommended:**  
| Up | Down |
|----|------|
| Well-fed (+++ / ++++) | Hunger, wolf-only meals |
| Stable O₂ / power | Critical O₂ / power |
| Quiet month / rising biomass | Deaths, blight, dust storms |
| Habitat comfortable | Overcrowding |

Morale is 0–100, shown as Stable/Watch/Critical bands (e.g. Critical ≤ 25, Watch ≤ 45).

---

### QF2 — Disease (mentioned with overcrowding)
Is disease a full event type?

**Your Answer:**  
_______________________________________________

**Recommended:**  
Not a separate complex system. If overcrowded **or** morale Critical, increase weight of a simple **Illness** minor event: +food consumption, −labor harvest that month. No graphic detail.

---

### QF3 — Work stoppage
When morale is Critical for a full month?

**Your Answer:**  
_______________________________________________

**Recommended:**  
**Halve harvest labor** next month (or same resolution if Critical at start of harvest step). Life support still consumes. Report: “Work stoppage — harvest halved.” One of the death-spiral gears.

---

## G. Win condition edge cases

### QG1 — Do Earth resource shipments block “self-sufficiency”?
**Your Answer:**  
_______________________________________________

**Recommended:**  
Win checks **production ≥ consumption** from ecosystem for food and O₂.  
You may still *hold* Earth tanks as buffer; buffers don’t fail the check.  
If you only survive on tank drawdown with no production, you fail the 3-month production test.

---

### QG2 — Which species count as “established” for the ≥4 rule?
**Your Answer:**  
_______________________________________________

**Recommended:**  
Any catalog species with population **above a minimum viable threshold** (e.g. > reserve floor) at month 24.  
Mycelium and grass count.  
Extinct or “trace only” do not.

---

### QG3 — Month 24 growth checkpoint vs win eval order
**Your Answer:**  
_______________________________________________

**Recommended:**  
On month 24 resolution: sim → harvest → upkeep → growth checkpoint (if eligible) → win/loss eval.  
A +1 pop on month 24 is flavor; win is about production stability, not the extra body.

---

## H. Presentation / UX leftovers

### QH1 — Units in the UI
Populations as raw counts or abstract?

**Your Answer:**  
_______________________________________________

**Recommended:**  
- Animals: integer counts (or rounded tens when huge)  
- Grass/algae/mycelium/trees: **biomass index** or density 0–100 + trend, not “3 million blades”  
- Food: FU number + quality breakdown (stacked bar: deer/fruit/rabbit/insect/wolf/rations)  
- O₂ / power / water: numeric buffer + status chip  

---

### QH2 — Should the player see harvest policy?
**Your Answer:**  
_______________________________________________

**Recommended:**  
Yes, as a short report line + glossary tooltip. Not a setting in v1 (no toggle). Transparency supports the causality law.

---

## I. Colonist effects — summary proposal (accept as a block?)

If you accept this block, colonists are fully specified enough to implement:

1. **Aggregate only** — no individuals.  
2. **Consume** 1 FU + O₂ (+ light power/water) per colonist-month.  
3. **Provide labor** that caps how much biome food can be harvested.  
4. **Auto-harvest policy** prefers better satiation; protects breeding floors unless Critical.  
5. **Morale** modulates waste + harvest efficiency; Critical → work stoppage.  
6. **Attrition** if short on food/O₂; **collapse** if a buffer hits 0.  
7. **Growth** +1 every 6 months when healthy gates pass.  
8. **Overcrowd** → morale − and illness weight up.  
9. **Do not** directly eat grass/algae; eat animals + fruit (+ emergency wolves).  
10. **More pop** = more labor and more upkeep (tradeoff).

**Your Answer (accept block / edits):**  
_______________________________________________

---

## Answer priority (what to decide first)

1. **QA1–QA5** — colonist model, harvest, death  
2. **QB1–QB3** — satiation combining + FU definition + starting rations  
3. **QC1–QC5** — O₂, power, water, soil, starting biome  
4. **QE1–QE2** — shipment package sizes + emergency costs  
5. Rest can default to recommended if blank  

---

## Consistency check against GDD v0.2

| GDD v0.2 | This round fills |
|----------|------------------|
| Harvest efficiency mentioned | How harvest works + labor |
| Morale affects harvest | Drivers + work stoppage |
| Satiation tiers | How they combine monthly |
| Power / water listed | What they do |
| Soil / mycelium | How soil moves |
| +1 / 6 months | Exact healthy gates |
| Loss at buffer 0 | Attrition before the cliff |
| Clean separation | Still no job UI — policy is automatic |

---

*When this file is locked, fold into GDD v0.3 (systems chapter), then species cards, then code.*
