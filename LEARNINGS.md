# LEARNINGS.md

Major decisions only — enough that you can answer “why did we do it this way?” without re-litigating the whole design.

**Rule of thumb:** log a question if getting it wrong would force a rewrite of architecture, the month pipeline, or the player fantasy. Do **not** log routine balance numbers, copy tweaks, or every brainstorm alternative.

**Format:** Question → Answer. Add a date when something is superseded.

---

### Q: Why one action per month and a fixed two-month shipment delay?

**A:** That *is* the game. Limited agency plus foresight under lag is what separates this from real-time colony managers. Fixed delay (not random lateness) lets players learn one hard rule; a small shipment-loss chance and rare event delays are enough uncertainty.

---

### Q: Why knowledge-first turns (deliver → report → decide → resolve)?

**A:** The liaison should never choose blind to cargo that just landed. Arrivals are known before the decision; the ecosystem still runs *after* the decision is locked, so the month stays consequential.

---

### Q: Why a pure sim core (no DOM/localStorage in rules) and no backend?

**A:** Balance and bugs live in the month pipeline. Pure `endMonth(state, action, rng)` with a seeded PRNG is testable and replayable. A server/DB would not help a single-player local game and would delay the only thing that matters: a fair loop. UI is a renderer; `localStorage` + JSON export is enough persistence.

---

### Q: Why no Earth food crates in v1?

**A:** If Earth can feed the colony forever, the ecosystem is decorative. Earth may send O₂, water, nutrients, and power; long-term calories must come from the web (starting dry rations only).

---

### Q: Immutable vs mutable sim state in the month pipeline?

**A (2026-07-31):** Clone-then-mutate. Each `startMonth` / `endMonth` deep-clones `GameState` (`structuredClone`), mutates the working copy through pure step functions, and returns the new state. Avoids accidental shared mutation across UI/tests while keeping step code readable. Not full persistent immutable updates (no structural sharing).

---

## Later entries

Add new major Q/As below as implementation forces real choices (e.g. first CI setup). Skip anything already obvious from GDD/SPEC.
