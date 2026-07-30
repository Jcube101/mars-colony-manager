/**
 * Auto-harvest policy + sustainability floors + FU yields (GDD §5.8–5.9).
 * Prefer: Deer → Fruit → Rabbits → Insects → Wolves.
 */

import { SPECIES } from '@/data/species';
import { addHarvestFood, isFoodCritical } from '@/sim/shipments';
import { fruitAvailable } from '@/sim/ecosystem';
import type { CauseTag, GameState } from '@/sim/types';

export type HarvestResult = {
  state: GameState;
  harvestLine: string;
  ecosystemFoodHarvested: number;
  causes: CauseTag[];
  floorsRespected: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Max heads/units harvestable under floors.
 * GDD: ≤ ~25% of population; never below reserve unless food Critical.
 */
export function maxHarvestable(
  population: number,
  foodCritical: boolean,
  reserveFloor = 5,
): number {
  if (population <= 0) return 0;
  if (foodCritical) {
    // Emergency harvest may include wolves and cut deeper
    return Math.max(0, Math.floor(population * 0.5));
  }
  const reserve = Math.max(reserveFloor, Math.floor(population * 0.1));
  const byPct = Math.floor(population * 0.25);
  return Math.max(0, Math.min(byPct, population - reserve));
}

/** Labor capacity from colonists × morale (halved under work stoppage / illness). */
export function harvestLabor(
  state: GameState,
  illness: boolean,
): number {
  const moraleF = clamp(state.colony.morale / 100, 0.25, 1.2);
  let labor = state.colony.population * moraleF * 1.5; // BALANCE
  if (state.flags.workStoppage) labor *= 0.5;
  if (illness) labor *= 0.7;
  return labor;
}

export function runHarvest(
  state: GameState,
  illness: boolean,
): HarvestResult {
  const causes: CauseTag[] = [];
  const foodCritical = isFoodCritical(state);
  let labor = harvestLabor(state, illness);
  let harvested = 0;
  let floorsRespected = !foodCritical;
  const parts: string[] = [];

  // Order: Deer → Fruit → Rabbits → Insects → Wolves
  // Deer
  {
    const max = maxHarvestable(state.biome.animals.deer, foodCritical);
    const take = Math.min(max, Math.floor(labor));
    if (take > 0) {
      state.biome.animals.deer -= take;
      const fu = take * (SPECIES.deer.harvestYieldFu ?? 2.5);
      addHarvestFood(state, fu, '++++', 'deer');
      harvested += fu;
      labor -= take;
      parts.push(`${take} deer (+${fu.toFixed(1)} FU)`);
      causes.push({
        type: 'species',
        speciesId: 'deer',
        description: `Harvested ${take} deer.`,
      });
    }
  }

  // Fruit (trees age ≥ 9) — never fell cohorts
  {
    const fruit = fruitAvailable(state);
    const maxUnits = foodCritical
      ? fruit
      : Math.min(fruit, fruit * 0.25 + 0.01);
    const take = Math.min(maxUnits, labor * 2);
    if (take > 0.05) {
      const fu = take * (SPECIES.tree.harvestYieldFu ?? 0.15);
      // Reduce density slightly on fruiting cohorts only (fruit pull, not felling)
      let remaining = take;
      for (const c of state.biome.plants.trees) {
        if (c.ageMonths < 9 || remaining <= 0) continue;
        const pull = Math.min(c.density * 0.05, remaining * 0.5);
        c.density = clamp(c.density - pull, 0, 100);
        remaining -= pull;
      }
      addHarvestFood(state, fu, '+++', 'fruit');
      harvested += fu;
      labor -= take / 2;
      parts.push(`fruit (+${fu.toFixed(1)} FU)`);
      causes.push({
        type: 'species',
        speciesId: 'tree',
        description: `Harvested fruit (+${fu.toFixed(1)} FU).`,
      });
    }
  }

  // Rabbits
  {
    const max = maxHarvestable(state.biome.animals.rabbits, foodCritical);
    const take = Math.min(max, Math.floor(labor));
    if (take > 0) {
      state.biome.animals.rabbits -= take;
      const fu = take * (SPECIES.rabbits.harvestYieldFu ?? 0.8);
      addHarvestFood(state, fu, '+++', 'rabbits');
      harvested += fu;
      labor -= take;
      parts.push(`${take} rabbits (+${fu.toFixed(1)} FU)`);
      causes.push({
        type: 'species',
        speciesId: 'rabbits',
        description: `Harvested ${take} rabbits.`,
      });
    }
  }

  // Insects
  {
    const max = maxHarvestable(state.biome.animals.insects, foodCritical, 10);
    const take = Math.min(max, Math.floor(labor * 8)); // cheap labor
    if (take > 0) {
      state.biome.animals.insects -= take;
      const fu = take * (SPECIES.insects.harvestYieldFu ?? 0.05);
      addHarvestFood(state, fu, '++', 'insects');
      harvested += fu;
      labor -= take / 8;
      parts.push(`${take} insects (+${fu.toFixed(1)} FU)`);
      causes.push({
        type: 'species',
        speciesId: 'insects',
        description: `Harvested ${take} insects.`,
      });
    }
  }

  // Wolves — only if food critical or policy allows emergency
  if (foodCritical || labor > 2) {
    const max = maxHarvestable(state.biome.animals.wolves, true, 2);
    // Prefer not to harvest wolves unless critical
    const take = foodCritical
      ? Math.min(max, Math.floor(labor))
      : 0;
    if (take > 0) {
      state.biome.animals.wolves -= take;
      const fu = take * (SPECIES.wolves.harvestYieldFu ?? 1);
      addHarvestFood(state, fu, '+', 'wolves');
      harvested += fu;
      floorsRespected = false;
      parts.push(`${take} wolves emergency (+${fu.toFixed(1)} FU)`);
      causes.push({
        type: 'species',
        speciesId: 'wolves',
        description: `Emergency harvested ${take} wolves.`,
      });
    }
  }

  const harvestLine =
    parts.length > 0
      ? `Harvest: ${parts.join('; ')}. Floors ${floorsRespected ? 'respected' : 'relaxed (critical/emergency)'}.`
      : 'Harvest: none (no eligible biomass or no labor). Floors respected.';

  return {
    state,
    harvestLine,
    ecosystemFoodHarvested: harvested,
    causes,
    floorsRespected,
  };
}
