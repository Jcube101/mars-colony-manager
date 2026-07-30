/**
 * Earth resource packages (GDD §5.2).
 * Magnitudes marked // BALANCE — exact pipeline application in Phase 3.
 */

export const RESOURCE_IDS = ['o2', 'water', 'nutrients', 'power'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];

export type ResourcePackage = {
  id: ResourceId;
  name: string;
  description: string;
  /**
   * Package payload in domain units (// BALANCE).
   * - o2: colonist-months of O₂ (scaled by pop at delivery in Phase 3)
   * - water: water reserve / biome top-up points
   * - nutrients: soil quality points
   * - power: power buffer units
   */
  packageAmount: number;
  /** Human-facing package summary for catalog UI. */
  packageSummary: string;
};

export const RESOURCES: Record<ResourceId, ResourcePackage> = {
  o2: {
    id: 'o2',
    name: 'O₂ tanks',
    description: 'Pressurized oxygen for the habitat life-support buffer.',
    // BALANCE: ~+2 months O₂ at current pop (pop × 2 applied at delivery)
    packageAmount: 2,
    packageSummary: '~+2 months O₂ buffer at current population',
  },
  water: {
    id: 'water',
    name: 'Water ice',
    description: 'Ice shipment for colony reserve and biome top-up.',
    packageAmount: 35, // BALANCE — significant reserve / top-up
    packageSummary: 'Significant water reserve / biome top-up',
  },
  nutrients: {
    id: 'nutrients',
    name: 'Soil nutrients',
    description: 'Amendments that raise dome soil quality.',
    packageAmount: 25, // BALANCE — roughly one band step on 0–100 soil
    packageSummary: 'Noticeable soil quality step up',
  },
  power: {
    id: 'power',
    name: 'Power cells',
    description: 'Stored energy for life support and grow-lights.',
    packageAmount: 34, // BALANCE — ~2–3 months normal buffer
    packageSummary: '~2–3 months of normal power buffer',
  },
};

export const RESOURCE_LIST: ResourcePackage[] = RESOURCE_IDS.map(
  (id) => RESOURCES[id],
);

/** Shipment loss chances (GDD). */
export const SHIPMENT_LOSS = {
  normal: 0.02, // BALANCE locked by GDD
  emergency: 0.12, // BALANCE locked by GDD
} as const;

/** Emergency Priority costs (GDD §5.3). */
export const EMERGENCY_COST = {
  powerFraction: 0.4, // BALANCE — ~one status step / −40% buffer
  moraleMin: 10, // BALANCE
  moraleMax: 15, // BALANCE
} as const;
