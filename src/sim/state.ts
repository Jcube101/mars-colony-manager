/**
 * GameState factory — starting colony + barren-ish biome (GDD §5.5, §5.7).
 */

import { createRng } from '@/sim/rng';
import {
  DEFAULT_COLONY_NAME,
  STATE_VERSION,
  type GameState,
  type SoilBand,
  soilBandFromValue,
} from '@/sim/types';

export type { GameState } from '@/sim/types';
export {
  DEFAULT_COLONY_NAME,
  RUN_MONTHS,
  STATE_VERSION,
  soilBandFromValue,
} from '@/sim/types';
export type {
  BiomeState,
  CalendarPhase,
  CauseTag,
  ColonyState,
  DecisionView,
  FoodSource,
  FoodStack,
  FoodTier,
  GameFlags,
  GameMeta,
  HistoryState,
  MonthReport,
  PendingShipment,
  PlayerAction,
  RunOutcome,
  ShipmentPayload,
  SoilBand,
  StatusBand,
  TimelineEntry,
  TreeCohort,
} from '@/sim/types';

export type CreateInitialStateOptions = {
  seed: number;
  colonyName?: string;
  playerName?: string;
  playerTitle?: string;
  /** ISO-8601; defaults to current time (cosmetic only). */
  createdAt?: string;
};

// --- Starting values (GDD tables; magnitudes // BALANCE where noted) ---

/** GDD: 12 colonists. */
const START_POPULATION = 12;
/** GDD: habitat capacity 20. */
const START_HABITAT = 20;
/** GDD: 36 FU Earth dry rations at ++. */
const START_FOOD_FU = 36;
/** GDD: morale 60/100. */
const START_MORALE = 60;
/**
 * GDD: ~2 months O₂ without production.
 * Unit = colonist-month → pop × 2.
 */
const START_O2_MONTHS = 2;
/**
 * Power: stable, small surplus (// BALANCE absolute units).
 * Roughly a few months of light life-support draw.
 */
const START_POWER_BUFFER = 40; // BALANCE
/** Colony water ice reserve (// BALANCE). */
const START_WATER_RESERVE = 40; // BALANCE

/** GDD: soil Fair → mid of Fair band on 0–100. */
const START_SOIL = 40; // BALANCE — Fair
/** GDD: water Adequate. */
const START_BIOME_WATER = 55; // BALANCE
/**
 * GDD: small algae trickle so month 1–2 are not pure tank panic.
 * Density index 0–100.
 */
const START_ALGAE = 10; // BALANCE

export function createInitialState(options: CreateInitialStateOptions): GameState {
  const seed = options.seed >>> 0;
  const rng = createRng(seed);

  const population = START_POPULATION;
  const o2Buffer = population * START_O2_MONTHS;

  return {
    meta: {
      version: STATE_VERSION,
      seed,
      colonyName: options.colonyName?.trim() || DEFAULT_COLONY_NAME,
      playerName: options.playerName,
      playerTitle: options.playerTitle,
      createdAt: options.createdAt ?? new Date().toISOString(),
    },
    calendar: {
      month: 1,
      phase: 'decision',
    },
    colony: {
      population,
      habitatCapacity: START_HABITAT,
      food: {
        units: [
          {
            amount: START_FOOD_FU,
            tier: '++',
            source: 'earth_rations',
          },
        ],
      },
      o2Buffer,
      powerBuffer: START_POWER_BUFFER,
      waterReserve: START_WATER_RESERVE,
      morale: START_MORALE,
    },
    biome: {
      soil: START_SOIL,
      water: START_BIOME_WATER,
      plants: {
        grass: 0,
        algae: START_ALGAE,
        trees: [],
      },
      animals: {
        insects: 0,
        rabbits: 0,
        deer: 0,
        wolves: 0,
      },
      mycelium: 0,
      o2ProductionLastMonth: 0,
    },
    shipments: [],
    flags: {
      earthSpeciesLocked: false,
      workStoppage: false,
      lastEvents: [],
      nextRequestDelayMonths: 0,
    },
    history: {
      foodSelfSufficient: [],
      o2SelfSufficient: [],
      timeline: [],
    },
    rngState: rng.getState(),
    outcome: 'ongoing',
    lastArrivals: [],
    nextShipmentSeq: 1,
  };
}

/** Convenience: soil band for a state (derived, not stored). */
export function biomeSoilBand(state: GameState): SoilBand {
  return soilBandFromValue(state.biome.soil);
}

/** Total food FU across stacks. */
export function totalFoodFu(state: GameState): number {
  return state.colony.food.units.reduce((sum, stack) => sum + stack.amount, 0);
}
