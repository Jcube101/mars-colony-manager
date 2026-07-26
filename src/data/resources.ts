/** Resource package catalog (placeholder — Phase 2). */

export const RESOURCE_IDS = ['o2', 'water', 'nutrients', 'power'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];
