/**
 * Species catalog — 8 cards per GDD §5.6.
 * Rates marked // BALANCE are placeholders for Phase 6 tuning.
 */

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

export type SpeciesKind = 'plant' | 'animal' | 'fungus';

export type FoodTier = '++++' | '+++' | '++' | '+';

export type SpeciesCard = {
  id: SpeciesId;
  name: string;
  kind: SpeciesKind;
  role: string;
  notes: string;
  /** Relative seed strength on arrival (// BALANCE). */
  seedSize: number;
  /**
   * Baseline growth / reproduction rate per ecosystem tick (// BALANCE).
   * Interpreted by Phase 3 pipeline — not applied here.
   */
  growthRate: number;
  /** Harvest food tier when edible; undefined if not a direct food source. */
  harvestTier?: FoodTier;
  /**
   * FU yield per harvest unit (// BALANCE).
   * Plants use fruit density units; animals use head count.
   */
  harvestYieldFu?: number;
  /** Min density/count treated as "established" for win checks (// BALANCE). */
  establishmentFloor: number;
  /** Soft dependency notes for UI/tooltips. */
  requires?: string[];
};

export const SPECIES: Record<SpeciesId, SpeciesCard> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    kind: 'plant',
    role: 'Base forage / plant biomass',
    notes: 'Required for rabbits/deer; needs water + light/power',
    seedSize: 40, // BALANCE — large mat
    growthRate: 0.08, // BALANCE
    establishmentFloor: 10, // BALANCE
    requires: ['water', 'power'],
  },
  algae: {
    id: 'algae',
    name: 'Algae',
    kind: 'plant',
    role: 'O₂ + soft biomass',
    notes: 'Water + light; cold-fragile',
    seedSize: 22, // BALANCE — medium
    growthRate: 0.07, // BALANCE
    establishmentFloor: 8, // BALANCE
    requires: ['water', 'power'],
  },
  insects: {
    id: 'insects',
    name: 'Insects',
    kind: 'animal',
    role: 'Fast ++ food',
    notes: 'Waste/nutrients/soft plants; boom risk',
    seedSize: 80, // BALANCE — medium-high head count
    growthRate: 0.12, // BALANCE
    harvestTier: '++',
    harvestYieldFu: 0.05, // BALANCE — FU per head harvested
    establishmentFloor: 15, // BALANCE
    requires: ['nutrients', 'plants'],
  },
  rabbits: {
    id: 'rabbits',
    name: 'Rabbits',
    kind: 'animal',
    role: '+++ food; grazers',
    notes: 'Need grass; can overgraze',
    seedSize: 18, // BALANCE — medium
    growthRate: 0.09, // BALANCE
    harvestTier: '+++',
    harvestYieldFu: 0.8, // BALANCE
    establishmentFloor: 6, // BALANCE
    requires: ['grass'],
  },
  deer: {
    id: 'deer',
    name: 'Deer',
    kind: 'animal',
    role: '++++ food; heavy grazers',
    notes: 'Need grass/plant biomass; hard overgraze',
    seedSize: 8, // BALANCE — small-medium
    growthRate: 0.05, // BALANCE
    harvestTier: '++++',
    harvestYieldFu: 2.5, // BALANCE
    establishmentFloor: 4, // BALANCE
    requires: ['grass'],
  },
  wolves: {
    id: 'wolves',
    name: 'Wolves',
    kind: 'animal',
    role: 'Prey control; + emergency food',
    notes: 'Eat rabbits/deer; crash if prey thin',
    seedSize: 4, // BALANCE — small
    growthRate: 0.04, // BALANCE
    harvestTier: '+',
    harvestYieldFu: 1.0, // BALANCE
    establishmentFloor: 2, // BALANCE
    requires: ['rabbits', 'deer'],
  },
  tree: {
    id: 'tree',
    name: 'Trees',
    kind: 'plant',
    role: 'O₂ + fruit',
    notes: 'Cold-resistant; fruit from cohort age 9+; O₂ earlier',
    seedSize: 12, // BALANCE — small cohort density
    growthRate: 0.03, // BALANCE
    harvestTier: '+++', // fruit
    harvestYieldFu: 0.15, // BALANCE — FU per fruit density unit
    establishmentFloor: 5, // BALANCE
    requires: ['water', 'soil'],
  },
  mycelium: {
    id: 'mycelium',
    name: 'Mycelium',
    kind: 'fungus',
    role: 'Soil buffer',
    notes: 'Slow soil +; weak/declines without trees',
    seedSize: 20, // BALANCE — medium
    growthRate: 0.04, // BALANCE
    establishmentFloor: 8, // BALANCE
    requires: ['tree'],
  },
};

export const SPECIES_LIST: SpeciesCard[] = SPECIES_IDS.map((id) => SPECIES[id]);
