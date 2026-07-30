/**
 * Named balance constants (Phase 6 first pass).
 * Sim modules read these; retune here without inventing systems.
 */

/** Starting colony / biome (GDD anchors + soft buffers). */
export const START = {
  population: 12,
  habitat: 20,
  foodFu: 36,
  morale: 60,
  /** Months of O₂ without production → pop × this. */
  o2Months: 2,
  /** Slightly larger power buffer so month 1–4 dust is survivable. */
  powerBuffer: 48, // BALANCE
  waterReserve: 45, // BALANCE
  soil: 42, // BALANCE — Fair
  biomeWater: 58, // BALANCE — Adequate
  /** Small algae trickle (O₂ drip). */
  algae: 12, // BALANCE
} as const;

/** Ecosystem rates per tick / month (// BALANCE). */
export const ECO = {
  grassGrowth: 0.09,
  algaeGrowth: 0.085,
  treeGrowth: 0.035,
  insectGrowth: 0.13,
  rabbitGrowth: 0.1,
  deerGrowth: 0.055,
  wolfGrowth: 0.045,
  /** O₂ units per month from density. */
  algaeO2PerDensity: 0.15,
  treeO2PerDensity: 0.2,
  /** Baseline solar power recharge per month. */
  solarRecharge: 14,
  solarRechargeDust: 5,
} as const;

/** Harvest labor scale. */
export const HARVEST = {
  laborPerColonist: 1.6, // BALANCE
  maxFraction: 0.25,
  emergencyFraction: 0.5,
} as const;
