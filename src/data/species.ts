/** Species balance table (placeholder — Phase 2). 8 species per GDD. */

export const SPECIES_IDS = [
  'grass',
  'algae',
  'insects',
  'rabbits',
  'deer',
  'wolves',
  'tree',
  'mycelium',
] as const;

export type SpeciesId = (typeof SPECIES_IDS)[number];
