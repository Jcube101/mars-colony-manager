/**
 * GameState factory — starting colony + barren-ish biome (GDD §5.5, §5.7).
 */

import { START } from '@/data/balance';
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

export function createInitialState(options: CreateInitialStateOptions): GameState {
  const seed = options.seed >>> 0;
  const rng = createRng(seed);

  const population = START.population;
  const o2Buffer = population * START.o2Months;

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
      habitatCapacity: START.habitat,
      food: {
        units: [
          {
            amount: START.foodFu,
            tier: '++',
            source: 'earth_rations',
          },
        ],
      },
      o2Buffer,
      powerBuffer: START.powerBuffer,
      waterReserve: START.waterReserve,
      morale: START.morale,
    },
    biome: {
      soil: START.soil,
      water: START.biomeWater,
      plants: {
        grass: 0,
        algae: START.algae,
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
