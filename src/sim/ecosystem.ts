/**
 * Ecosystem stock-and-flow — 10 ticks per player month (GDD §5.4).
 * Magnitudes are // BALANCE placeholders.
 *
 * Events apply *after* ticks (GDD resolution order); this module is pure biome flow.
 */

import { ECO } from '@/data/balance';
import type { Rng } from '@/sim/rng';
import type { CauseTag, GameState } from '@/sim/types';

export type EcosystemResult = {
  state: GameState;
  o2Produced: number;
  causes: CauseTag[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function noise(rng: Rng, amplitude = 0.15): number {
  return 1 + (rng.next() * 2 - 1) * amplitude;
}

function totalTreeDensity(b: GameState['biome']): number {
  return b.plants.trees.reduce((s, t) => s + t.density, 0);
}

/**
 * Run 10 internal ticks, then age tree cohorts once.
 * Writes monthly O₂ production into biome + colony buffer.
 */
export function runEcosystemMonth(state: GameState, rng: Rng): EcosystemResult {
  const causes: CauseTag[] = [];
  let o2Produced = 0;

  const powerCritical = state.colony.powerBuffer <= state.colony.population * 0.5;
  const light = powerCritical ? 0.25 : 1; // BALANCE

  for (let tick = 0; tick < 10; tick++) {
    const b = state.biome;
    const soilF = clamp(b.soil / 50, 0.2, 1.6);
    const waterF = clamp(b.water / 50, 0.2, 1.6);
    const plantBiomass = b.plants.grass + b.plants.algae + totalTreeDensity(b);

    if (b.plants.grass > 0) {
      const g =
        b.plants.grass * ECO.grassGrowth * soilF * waterF * light * noise(rng, 0.1);
      b.plants.grass = clamp(b.plants.grass + g - b.plants.grass * 0.01, 0, 100);
    }

    if (b.plants.algae > 0) {
      const a =
        b.plants.algae * ECO.algaeGrowth * waterF * light * noise(rng, 0.1);
      b.plants.algae = clamp(b.plants.algae + a - b.plants.algae * 0.015, 0, 100);
    }

    for (const cohort of b.plants.trees) {
      if (cohort.density <= 0) continue;
      const t =
        cohort.density * ECO.treeGrowth * soilF * waterF * light * noise(rng, 0.08);
      cohort.density = clamp(cohort.density + t - cohort.density * 0.005, 0, 100);
    }

    const treeD = totalTreeDensity(b);
    if (b.mycelium > 0 || treeD > 5) {
      if (treeD > 3) {
        b.mycelium = clamp(
          b.mycelium + 0.04 * Math.max(b.mycelium, 1) * noise(rng, 0.1) + 0.15,
          0,
          100,
        );
        b.soil = clamp(b.soil + 0.02 * (b.mycelium / 20), 0, 100);
      } else if (b.mycelium > 0) {
        b.mycelium = clamp(b.mycelium * 0.97, 0, 100);
      }
    }

    if (b.animals.insects > 0 || plantBiomass > 5) {
      const foodBase = b.soil * 0.5 + plantBiomass * 0.3;
      const base = Math.max(b.animals.insects, plantBiomass > 5 ? 2 : 0);
      const growth = base * ECO.insectGrowth * (foodBase / 40) * noise(rng, 0.2);
      b.animals.insects = Math.max(0, Math.round(b.animals.insects + growth));
      if (b.animals.insects > 200) {
        b.plants.grass = clamp(b.plants.grass - 0.3, 0, 100);
        b.plants.algae = clamp(b.plants.algae - 0.2, 0, 100);
        b.soil = clamp(b.soil - 0.1, 0, 100);
      }
    }

    if (b.animals.rabbits > 0) {
      if (b.plants.grass < 3) {
        b.animals.rabbits = Math.max(0, Math.round(b.animals.rabbits * 0.85));
      } else {
        const g =
          b.animals.rabbits * ECO.rabbitGrowth * (b.plants.grass / 30) * noise(rng, 0.15);
        b.animals.rabbits = Math.max(0, Math.round(b.animals.rabbits + g));
        b.plants.grass = clamp(b.plants.grass - b.animals.rabbits * 0.02, 0, 100);
      }
    }

    if (b.animals.deer > 0) {
      if (b.plants.grass < 5) {
        b.animals.deer = Math.max(0, Math.round(b.animals.deer * 0.88));
      } else {
        const g =
          b.animals.deer * ECO.deerGrowth * (b.plants.grass / 35) * noise(rng, 0.12);
        b.animals.deer = Math.max(0, Math.round(b.animals.deer + g));
        b.plants.grass = clamp(b.plants.grass - b.animals.deer * 0.05, 0, 100);
      }
    }

    if (b.animals.wolves > 0) {
      const prey = b.animals.rabbits + b.animals.deer * 2;
      if (prey < b.animals.wolves * 3) {
        b.animals.wolves = Math.max(0, Math.round(b.animals.wolves * 0.8));
      } else {
        const g = b.animals.wolves * ECO.wolfGrowth * noise(rng, 0.1);
        b.animals.wolves = Math.max(0, Math.round(b.animals.wolves + g));
        const rabbitKill = Math.min(
          b.animals.rabbits,
          Math.round(b.animals.wolves * 0.4 * noise(rng, 0.2)),
        );
        const deerKill = Math.min(
          b.animals.deer,
          Math.round(b.animals.wolves * 0.15 * noise(rng, 0.2)),
        );
        b.animals.rabbits -= rabbitKill;
        b.animals.deer -= deerKill;
        if (rabbitKill + deerKill > 0) {
          b.soil = clamp(b.soil + 0.05, 0, 100);
        }
      }
    }

    b.water = clamp(b.water - plantBiomass * 0.002 + 0.05, 0, 100);
    if (b.water < 30 && state.colony.waterReserve > 0) {
      const take = Math.min(5, state.colony.waterReserve, 50 - b.water);
      state.colony.waterReserve -= take;
      b.water += take * 0.8;
    }
  }

  for (const cohort of state.biome.plants.trees) {
    cohort.ageMonths += 1;
  }

  const algae = state.biome.plants.algae;
  const trees = totalTreeDensity(state.biome);
  o2Produced =
    algae * ECO.algaeO2PerDensity + trees * ECO.treeO2PerDensity;
  state.biome.o2ProductionLastMonth = o2Produced;
  state.colony.o2Buffer += o2Produced;

  state.colony.powerBuffer += ECO.solarRecharge;

  if (algae > 15 || trees > 10) {
    causes.push({
      type: 'species',
      speciesId: algae >= trees ? 'algae' : 'tree',
      description: `Biome O₂ production ~${o2Produced.toFixed(1)} this month.`,
    });
  }

  return { state, o2Produced, causes };
}

export function fruitAvailable(state: GameState): number {
  return state.biome.plants.trees
    .filter((t) => t.ageMonths >= 9)
    .reduce((s, t) => s + t.density * 0.2, 0);
}
