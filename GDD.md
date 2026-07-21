# Mars Colony Manager — Game Design Document
**Version:** 0.1  
**Last Updated:** 2026-07-21  
**Owner:** Job Joseph  

## 1. High Concept
You are the off-world liaison for a fragile Mars colony. Each month you request one species or critical resource from Earth. The shipment takes two turns to arrive. While you wait, the ecosystem runs on its own fast internal clock—daily growth, interactions, dust storms, cold snaps—and only shows you the net results at the end of the month. Survive and grow the colony through a fixed number of months by making careful, lag-delayed choices.

## 2. Design Pillars
- **Limited Agency, High Consequence** — One meaningful action per month, with delayed payoff.
- **Living Ecosystem** — The background simulation creates real surprises and ripple effects you cannot fully control.
- **Foresight Over Reaction** — Because of the two-turn lag, good play requires planning ahead rather than constant firefighting.
- **Clean Separation** — Colony decisions and ecosystem simulation stay distinct so the player never feels overwhelmed by real-time micromanagement.

### Non-Goals
- Real-time colony management
- Complex individual colonist personalities and drama (RimWorld style)
- Full terraforming or planetary-scale building
- Combat or raiders

## 3. Target Audience & Platform
- **Audience:** Players who enjoy systemic colony/management games (Surviving Mars, Of Life and Land, Banished) but prefer turn-based decision-making and clear cause-and-effect over constant real-time pressure.
- **Platform:** Browser first (desktop + mobile-friendly), later possible Steam release.
- **Session Length:** 15–40 minutes per run.

## 4. Core Gameplay Loop
1. Review current colony status and ecosystem report (net results of the previous month).
2. Choose one action: request a species shipment or critical resource from Earth.
3. End the month.
4. Ecosystem simulation advances on its fast internal clock (daily/hourly steps).
5. Receive the delayed shipment (if any) and see the new net results.
6. Repeat until the win or loss condition is met.

## 5. Core Mechanics & Systems

### Monthly Action
- Player has exactly one action per month.
- Action types (starting set):
  - Request Species Shipment (Rabbits, Algae, Insects, later more complex life)
  - Request Resource (Oxygen tanks, Water ice, Soil nutrients, Power cells)
  - Emergency Priority (rush a previous request — costs resources and has risk)
- Shipment arrives at the start of the turn two months later.

### Ecosystem Simulation (Background)
- Runs on a fast internal clock (multiple steps per player month).
- Tracks:
  - Species populations (growth, death, predation, competition)
  - Resources (oxygen, food biomass, water, soil quality)
  - Environmental events (dust storms, cold snaps, solar flares)
- Only the net change is shown to the player at month end.
- Uses agent-based or probabilistic rules so emergent behaviour appears (population explosions, crashes, unexpected interactions).

### Colony Status
- Population (colonists)
- Food stores
- Oxygen / life support capacity
- Power
- Morale / stability (simple aggregate)
- Habitat space

### Win / Loss Conditions
- **Win:** Keep the colony alive and growing for X months (starting target: 24–36 months) and reach a self-sufficiency threshold.
- **Loss:** Population reaches zero, or critical life-support systems collapse for a full month.

## 6. Progression & Economy
- Early game: basic survival species and resources.
- Mid game: more complex introductions (predators, plants that improve soil, oxygen-producing organisms).
- Late game: self-sustaining loops and larger milestones.
- Limited Earth support window — after a certain number of months, shipments become rarer or more expensive, forcing greater self-reliance.

## 7. Random Events & Failure States
- Dust storms reduce solar power and damage habitats.
- Cold snaps increase energy and food consumption.
- Species shipments can fail, arrive late, or establish poorly due to local conditions.
- Overpopulation of one species can crash others or degrade soil/oxygen.

## 8. Art Style & Presentation
- Clean, readable UI focused on numbers, simple icons, and short status reports.
- Optional light pixel-art or flat illustration for species and habitats (can start text-only).
- Emphasis on clarity over spectacle so the player can quickly understand the monthly report.

## 9. Technical Approach
- Browser-based (HTML/JS or lightweight framework).
- Text-first prototype for the core loop.
- Ecosystem simulation runs as a background process between player turns.
- Simple save system (local storage or file export).

## 10. Scope & Priority
**Must-have for first playable prototype**
- One action per month
- Two-turn shipment delay
- Basic ecosystem simulation with 3–4 species
- Clear monthly report
- Win/loss conditions

**Later**
- More species and interactions
- Multiple colony sites
- Deeper event system
- Visual map or habitat view

## 11. Open Questions
- Exact number of months for a full run?
- Starting colony size and resources?
- First three species and what they provide?
- How detailed should the monthly report be?
- How transparent should the background simulation be to the player?

---

This document is a living draft. Update it as decisions are made.