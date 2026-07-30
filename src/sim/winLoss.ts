/**
 * Win/loss evaluation (GDD §5.12).
 */

import { SPECIES, type SpeciesId } from '@/data/species';
import { RUN_MONTHS, type CauseTag, type GameState, type RunOutcome } from '@/sim/types';

export type WinLossResult = {
  outcome: RunOutcome;
  lossReason?: string;
  establishedSpecies: SpeciesId[];
  foodSelfSufficient: boolean;
  o2SelfSufficient: boolean;
  causes: CauseTag[];
};

function totalFood(state: GameState): number {
  return state.colony.food.units.reduce((s, u) => s + u.amount, 0);
}

/** Species above establishment floor (grass and mycelium count). */
export function listEstablishedSpecies(state: GameState): SpeciesId[] {
  const b = state.biome;
  const out: SpeciesId[] = [];

  if (b.plants.grass >= SPECIES.grass.establishmentFloor) out.push('grass');
  if (b.plants.algae >= SPECIES.algae.establishmentFloor) out.push('algae');
  if (b.animals.insects >= SPECIES.insects.establishmentFloor) out.push('insects');
  if (b.animals.rabbits >= SPECIES.rabbits.establishmentFloor) out.push('rabbits');
  if (b.animals.deer >= SPECIES.deer.establishmentFloor) out.push('deer');
  if (b.animals.wolves >= SPECIES.wolves.establishmentFloor) out.push('wolves');
  const treeD = b.plants.trees.reduce((s, t) => s + t.density, 0);
  if (treeD >= SPECIES.tree.establishmentFloor) out.push('tree');
  if (b.mycelium >= SPECIES.mycelium.establishmentFloor) out.push('mycelium');

  return out;
}

export function evaluateWinLoss(
  state: GameState,
  monthStats: {
    ecosystemFoodHarvested: number;
    o2Produced: number;
    o2Consumed: number;
  },
): WinLossResult {
  const causes: CauseTag[] = [];
  const established = listEstablishedSpecies(state);

  const foodSelf =
    monthStats.ecosystemFoodHarvested >= state.colony.population &&
    state.colony.population > 0;
  const o2Self =
    monthStats.o2Produced >= monthStats.o2Consumed && state.colony.population > 0;

  // Record history for this resolved month
  state.history.foodSelfSufficient.push(foodSelf);
  state.history.o2SelfSufficient.push(o2Self);

  // Loss: population 0
  if (state.colony.population <= 0) {
    causes.push({ type: 'system', description: 'Colony population reached zero.' });
    return {
      outcome: 'lost',
      lossReason: 'population_zero',
      establishedSpecies: established,
      foodSelfSufficient: foodSelf,
      o2SelfSufficient: o2Self,
      causes,
    };
  }

  // Loss: food or O₂ buffer ≤ 0 after upkeep
  if (totalFood(state) <= 0) {
    causes.push({ type: 'system', description: 'Food buffer depleted — colony lost.' });
    return {
      outcome: 'lost',
      lossReason: 'food_depleted',
      establishedSpecies: established,
      foodSelfSufficient: foodSelf,
      o2SelfSufficient: o2Self,
      causes,
    };
  }
  if (state.colony.o2Buffer <= 0) {
    causes.push({ type: 'system', description: 'O₂ buffer depleted — colony lost.' });
    return {
      outcome: 'lost',
      lossReason: 'o2_depleted',
      establishedSpecies: established,
      foodSelfSufficient: foodSelf,
      o2SelfSufficient: o2Self,
      causes,
    };
  }

  // Win only at month 24
  if (state.calendar.month >= RUN_MONTHS) {
    const foodHist = state.history.foodSelfSufficient;
    const o2Hist = state.history.o2SelfSufficient;
    const last3Food = foodHist.slice(-3);
    const last3O2 = o2Hist.slice(-3);
    const threeFood = last3Food.length === 3 && last3Food.every(Boolean);
    const threeO2 = last3O2.length === 3 && last3O2.every(Boolean);
    const fourSpecies = established.length >= 4;

    if (
      state.colony.population > 0 &&
      threeFood &&
      threeO2 &&
      fourSpecies
    ) {
      causes.push({
        type: 'system',
        description: `Victory: ${established.length} established species; 3-month food+O₂ self-sufficiency.`,
      });
      return {
        outcome: 'won',
        establishedSpecies: established,
        foodSelfSufficient: foodSelf,
        o2SelfSufficient: o2Self,
        causes,
      };
    }

    // Finished 24 months without win conditions
    const reasons: string[] = [];
    if (!threeFood) reasons.push('food self-sufficiency');
    if (!threeO2) reasons.push('O₂ self-sufficiency');
    if (!fourSpecies) reasons.push(`species (${established.length}/4)`);
    causes.push({
      type: 'system',
      description: `Month 24 failed: ${reasons.join(', ')}.`,
    });
    return {
      outcome: 'lost',
      lossReason: 'failed_win_conditions',
      establishedSpecies: established,
      foodSelfSufficient: foodSelf,
      o2SelfSufficient: o2Self,
      causes,
    };
  }

  return {
    outcome: 'ongoing',
    establishedSpecies: established,
    foodSelfSufficient: foodSelf,
    o2SelfSufficient: o2Self,
    causes,
  };
}
