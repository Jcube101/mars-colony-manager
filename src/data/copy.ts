/**
 * Report / UI / tutorial copy (GDD dry liaison voice).
 */

export const COPY = {
  appTitle: 'Mars Colony Manager',
  defaultColonyName: 'Hephaestus',
  tagline: 'One action per month. Two months until it lands. Plan past the next report.',

  /** Generic report headlines (rotate + situational overrides in report.ts). */
  headlines: [
    'Systems nominal. The web is still writing its own story.',
    'Liaison brief: Earth window open — spend the action wisely.',
    'Buffers holding. Opportunity cost ticks with every stand-by.',
    'Quiet greenhouse. Cargo ETA is the only certainty.',
    'Food is still Earth-deep; local harvest remains the long game.',
    'O₂ trickle from algae — tanks still carry the hard months.',
    'Soil fair, water adequate. Expand the web or starve later.',
    'One request. Two months of lag. Look at pending, then decide.',
    'Stand by is still an action — sometimes the right one.',
    'Emergency Priority burns power and morale. Use sparingly.',
    'No named event this period. Enjoy the silence.',
    'Shipment window: full catalog months 1–18; resources after.',
    'Win path: four established species, three clean months of food and O₂.',
    'Earth will not feed you forever. Grow producers before the window closes.',
    'Morale steady. Work stoppage is a future problem — until it is not.',
    'Causal chain intact: order, event, or species — nothing unexplained.',
    'Dust risk lives in the sensors. Power cells are not vanity cargo.',
    'Cold front weather can tax food need. Algae will not thank you.',
    'Insects boom if plants and nutrients allow — harvest floors still apply.',
    'Trees are a long bet: O₂ early, fruit only after cohort age 9.',
    'Mycelium without trees is a weak move. Soft dependency, hard lesson.',
    'Wolves before prey is legal and usually fatal to the pack.',
    'Months 19–24: species catalog locked. Finish the web early.',
    'End of brief. Awaiting your monthly request.',
  ],

  failure: {
    population_zero: 'Population reached zero — the outpost went dark.',
    food_depleted: 'Food buffer empty after upkeep — rationing failed.',
    o2_depleted: 'O₂ buffer empty after upkeep — life support failed.',
    failed_win_conditions:
      'Month 24 without self-sufficiency: need 3 clean food+O₂ months and ≥4 established species.',
    unknown: 'Colony life support failed.',
  } as Record<string, string>,

  lossHeadlines: {
    population_zero: 'Final transmission: no remaining crew.',
    food_depleted: 'Stores empty. The last meal was not enough.',
    o2_depleted: 'Atmosphere failed. Tanks and biome both fell short.',
    failed_win_conditions: 'Earth closed the book — self-sufficiency not proven.',
    default: 'Colony life support failed.',
  } as Record<string, string>,

  tutorial: {
    month1Title: 'Tutorial — Month 1: First producer',
    month1Body: [
      'You get one Earth request per month. It takes two months to arrive.',
      'The dome is nearly barren. Order a producer now so it lands on month 3.',
      'Recommended: Algae (O₂) or Grass (forage base for later animals).',
      'Watch Food and O₂ chips — Earth rations and tanks will not last forever.',
    ],
    month2Title: 'Tutorial — Month 2: Pending cargo',
    month2Body: [
      'Your month-1 order is in transit. Check Outlook → Pending shipments.',
      'ETA is month 3 (two-month lag). Plan the next request around that arrival.',
      'You can order a second species, a resource buffer (O₂ / power), or stand by.',
      'Emergency Priority can rush a shipment not due next month — it costs power and morale.',
    ],
    dismissHint: 'Guidance fades after month 2. The report is your teacher.',
  },

  empty: {
    noPending: 'No cargo in flight — every month without an order is a month of lag you cannot recover.',
    noArrivals: 'No landings this morning.',
    noHarvest: 'No harvest — no eligible biomass or labor. Floors respected.',
    noEvents: 'Quiet month — no named event.',
    noCauses: 'No major swings tagged this period.',
    noTimeline: 'No major beats recorded yet.',
  },

  forecastPrefix: 'Soft forecast (~50% on major weather):',
} as const;

export type HeadlineId = number;
