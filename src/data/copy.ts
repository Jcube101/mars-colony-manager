/**
 * Starter report / UI headline strings (GDD asks ~20).
 * Expand in Phase 6; Phase 2 only needs a usable set.
 */

export const COPY = {
  appTitle: 'Mars Colony Manager',
  defaultColonyName: 'Hephaestus',
  scaffoldHeadline: 'Playable vertical slice — one action per month.',

  /** Generic / starter report headlines. */
  headlines: [
    'Hephaestus reports: systems nominal, web still thin.',
    'Liaison brief: Earth window open — choose carefully.',
    'Monthly summary: buffers holding, biome nearly barren.',
    'Quiet greenhouse. Opportunity cost ticks with every month.',
    'Cargo ETA known. Ecosystem still writing its own story.',
    'Food stores are Earth-deep; local harvest remains zero.',
    'O₂ trickle from starter algae — tanks still carry the month.',
    'Soil fair, water adequate. No grass, no grazers, no fruit.',
    'One action. Two months of lag. Plan past the next report.',
    'Stand by is still an action — sometimes the right one.',
    'Emergency Priority burns power and morale. Use sparingly.',
    'Dust risk elevated in long-range sensors (unconfirmed).',
    'Cold front possible next cycle. Algae will not thank you.',
    'No named event this period. Enjoy the silence.',
    'Shipment window: full catalog months 1–18; resources after.',
    'Win path: four established species, three clean months of food and O₂.',
    'Earth will not feed you forever. Grow the web or starve later.',
    'Morale steady. Work stoppage is still a future problem.',
    'Causal chain intact: order, event, or species — nothing unexplained.',
    'End of brief. Awaiting your monthly request.',
  ],
} as const;

export type HeadlineId = number;
