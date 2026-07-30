/**
 * Core domain types (SPEC §5, GDD v0.3).
 * Simulation-only — no DOM / UI / save imports.
 */

import type { EventId } from '@/data/events';
import type { ResourceId } from '@/data/resources';
import type { SpeciesId } from '@/data/species';

export type { EventId, ResourceId, SpeciesId };

// --- Food ---

/** Satiation / food quality tier (GDD §5.9). */
export type FoodTier = '++++' | '+++' | '++' | '+';

export type FoodSource =
  | 'earth_rations'
  | 'insects'
  | 'rabbits'
  | 'deer'
  | 'wolves'
  | 'fruit';

/** 1 FU = one colonist-month baseline food need. */
export type FoodStack = {
  amount: number;
  tier: FoodTier;
  source: FoodSource;
};

// --- Qualitative bands ---

/** Soil quality bands (internal 0–100 maps to these). */
export type SoilBand = 'poor' | 'fair' | 'good' | 'rich';

/** Player-facing buffer status chips. */
export type StatusBand = 'surplus' | 'stable' | 'tight' | 'critical' | 'watch';

// --- Meta & calendar ---

export type CalendarPhase = 'decision' | 'ended';

export type GameMeta = {
  /** Save / state schema version. */
  version: number;
  seed: number;
  colonyName: string;
  playerName?: string;
  playerTitle?: string;
  /** ISO-8601; cosmetic (not part of sim determinism). */
  createdAt: string;
};

export type CalendarState = {
  /** 1..24 */
  month: number;
  phase: CalendarPhase;
};

// --- Colony ---

export type ColonyState = {
  population: number;
  habitatCapacity: number;
  food: { units: FoodStack[] };
  /** Colonist-months of O₂ buffer (1 unit ≈ 1 colonist × 1 month). */
  o2Buffer: number;
  /** Abstract power buffer units (// BALANCE scale in pipeline). */
  powerBuffer: number;
  /** Colony ice reserve that can top up biome water. */
  waterReserve: number;
  /** Aggregate morale 0–100. */
  morale: number;
};

// --- Biome ---

export type TreeCohort = {
  id: string;
  /** Months since strong establishment; fruit at age ≥ 9. */
  ageMonths: number;
  /** Density / biomass index 0–100. */
  density: number;
};

export type BiomeState = {
  /** Soil quality 0–100. */
  soil: number;
  /** Biome water pool 0–100. */
  water: number;
  plants: {
    /** Density index 0–100. */
    grass: number;
    algae: number;
    trees: TreeCohort[];
  };
  animals: {
    /** Integer head counts. */
    insects: number;
    rabbits: number;
    deer: number;
    wolves: number;
  };
  /** Density index 0–100. */
  mycelium: number;
  /** Last month biome O₂ production (for win checks). */
  o2ProductionLastMonth: number;
};

// --- Shipments ---

export type ShipmentPayload =
  | { kind: 'species'; speciesId: SpeciesId }
  | { kind: 'resource'; resourceId: ResourceId };

export type PendingShipment = {
  id: string;
  payload: ShipmentPayload;
  arrivesMonth: number;
  rushed: boolean;
};

// --- Flags & history ---

export type GameFlags = {
  /** True during months 19–24 (species catalog closed). */
  earthSpeciesLocked: boolean;
  /** Critical morale full month → harvest labor halved. */
  workStoppage: boolean;
  lastEvents: EventId[];
  /** Extra months before next request ships (solar flare). */
  nextRequestDelayMonths: number;
  /**
   * Debug only (`?debug=1`): force next event id, then cleared.
   * Not used by normal play.
   */
  debugForceEvent?: EventId;
};

export type TimelineEntry = {
  month: number;
  kind: string;
  summary: string;
};

export type HistoryState = {
  foodSelfSufficient: boolean[];
  o2SelfSufficient: boolean[];
  timeline: TimelineEntry[];
};

// --- Causality / report ---

export type CauseTag =
  | { type: 'order'; description: string; shipmentId?: string }
  | { type: 'event'; description: string; eventId: EventId }
  | { type: 'species'; description: string; speciesId: SpeciesId }
  | { type: 'system'; description: string };

export type RunOutcome = 'ongoing' | 'won' | 'lost';

export type MonthReport = {
  month: number;
  headline: string;
  causes: CauseTag[];
  harvestLine?: string;
  events: EventId[];
  arrivals: PendingShipment[];
  losses: string[];
  /** Ecosystem food harvested this month (excludes Earth rations). */
  ecosystemFoodHarvested: number;
  /** Biome O₂ production this month. */
  o2Produced: number;
  /** Colonist O₂ consumed this month. */
  o2Consumed: number;
  foodSelfSufficient: boolean;
  o2SelfSufficient: boolean;
  establishedSpecies: SpeciesId[];
  outcome: RunOutcome;
  lossReason?: string;
};

/** Decision-time view after arrivals (knowledge-first). */
export type DecisionView = {
  month: number;
  monthsRemaining: number;
  earthSpeciesLocked: boolean;
  earthWindow: 'full' | 'resource_only' | 'closed';
  colony: ColonyState;
  biome: BiomeState;
  pendingShipments: PendingShipment[];
  arrivals: PendingShipment[];
  lastEvents: EventId[];
  forecast?: string;
  availableActions: {
    species: SpeciesId[];
    resources: ResourceId[];
    emergencyTargets: PendingShipment[];
    canStandBy: true;
  };
};

// --- Player actions (one per month) ---

export type PlayerAction =
  | { type: 'request_species'; speciesId: SpeciesId }
  | { type: 'request_resource'; resourceId: ResourceId }
  | { type: 'emergency'; shipmentId: string }
  | { type: 'stand_by' };

// --- Root state ---

export type GameState = {
  meta: GameMeta;
  calendar: CalendarState;
  colony: ColonyState;
  biome: BiomeState;
  shipments: PendingShipment[];
  flags: GameFlags;
  history: HistoryState;
  /** Seeded PRNG state (mulberry32). */
  rngState: number;
  /** Set when run ends. */
  outcome: RunOutcome;
  lossReason?: string;
  /** Arrivals delivered at the start of the current decision month. */
  lastArrivals: PendingShipment[];
  /** Soft forecast line for next month (optional). */
  forecast?: string;
  /** Monotonic shipment id counter. */
  nextShipmentSeq: number;
};

// --- Helpers ---

export function soilBandFromValue(soil: number): SoilBand {
  if (soil < 25) return 'poor';
  if (soil < 50) return 'fair';
  if (soil < 75) return 'good';
  return 'rich';
}

export const RUN_MONTHS = 24;
export const STATE_VERSION = 1;
export const DEFAULT_COLONY_NAME = 'Hephaestus';
