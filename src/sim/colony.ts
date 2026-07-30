/**
 * Colony upkeep, morale, attrition, growth checkpoints (GDD §5.7, §5.9–5.11).
 */

import type { CauseTag, FoodStack, FoodTier, GameState } from '@/sim/types';

export type UpkeepResult = {
  state: GameState;
  causes: CauseTag[];
  o2Consumed: number;
  foodConsumed: number;
  worstTierEaten: FoodTier | 'none' | 'shortfall';
  attrition: number;
  grew: boolean;
};

const TIER_RANK: Record<FoodTier, number> = {
  '++++': 4,
  '+++': 3,
  '++': 2,
  '+': 1,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function totalFood(units: FoodStack[]): number {
  return units.reduce((s, u) => s + u.amount, 0);
}

/** Consume required FU best-tier-first; return worst tier used. */
export function consumeFood(
  units: FoodStack[],
  need: number,
): { units: FoodStack[]; eaten: number; worst: FoodTier | 'none' | 'shortfall' } {
  const sorted = [...units].sort(
    (a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier],
  );
  let remaining = need;
  let worstRank = 5;
  let worst: FoodTier | 'none' | 'shortfall' = 'none';
  let eaten = 0;

  for (const stack of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(stack.amount, remaining);
    stack.amount -= take;
    remaining -= take;
    eaten += take;
    if (take > 0 && TIER_RANK[stack.tier] < worstRank) {
      worstRank = TIER_RANK[stack.tier];
      worst = stack.tier;
    }
  }

  if (remaining > 0.001) {
    worst = 'shortfall';
  }

  return {
    units: sorted.filter((u) => u.amount > 0.001),
    eaten,
    worst,
  };
}

export function runColonyUpkeep(
  state: GameState,
  opts: { cold: boolean; illness: boolean },
): UpkeepResult {
  const causes: CauseTag[] = [];
  const pop = state.colony.population;
  if (pop <= 0) {
    return {
      state,
      causes,
      o2Consumed: 0,
      foodConsumed: 0,
      worstTierEaten: 'none',
      attrition: 0,
      grew: false,
    };
  }

  // Food need: 1 FU/colonist; low morale or cold/illness raises it
  let foodNeed = pop;
  if (state.colony.morale < 40) foodNeed *= 1.15; // BALANCE
  if (opts.cold) foodNeed *= 1.1;
  if (opts.illness) foodNeed *= 1.15;

  const meal = consumeFood(state.colony.food.units, foodNeed);
  state.colony.food.units = meal.units;

  // O₂: 1 unit per colonist
  const o2Consumed = pop;
  state.colony.o2Buffer = Math.max(0, state.colony.o2Buffer - o2Consumed);

  // Power draw scales lightly with pop
  const powerDraw = pop * 0.6 + 2; // BALANCE
  state.colony.powerBuffer = Math.max(0, state.colony.powerBuffer - powerDraw);

  // Light water use
  state.colony.waterReserve = Math.max(0, state.colony.waterReserve - pop * 0.05);

  // Morale from satiation
  let moraleDelta = 0;
  switch (meal.worst) {
    case '++++':
    case '+++':
      moraleDelta += 3;
      causes.push({
        type: 'system',
        description: 'Well fed — morale up, waste down.',
      });
      break;
    case '++':
      moraleDelta += 0;
      break;
    case '+':
      moraleDelta -= 6;
      causes.push({
        type: 'system',
        description: 'Poor satiation (wolf-tier or thin rations).',
      });
      break;
    case 'shortfall':
      moraleDelta -= 12;
      causes.push({
        type: 'system',
        description: 'Food shortfall — rationing failures.',
      });
      break;
    default:
      break;
  }

  // Power / O₂ pressure
  const o2Months = state.colony.o2Buffer / Math.max(1, pop);
  if (o2Months < 0.5) moraleDelta -= 8;
  else if (o2Months < 1) moraleDelta -= 3;

  if (state.colony.powerBuffer < pop) moraleDelta -= 5;

  // Overcrowd
  if (pop > state.colony.habitatCapacity) {
    moraleDelta -= 5;
    causes.push({ type: 'system', description: 'Overcrowding stresses morale.' });
  }

  state.colony.morale = clamp(state.colony.morale + moraleDelta, 0, 100);

  // Work stoppage if critical morale full month
  if (state.colony.morale <= 25) {
    state.flags.workStoppage = true;
  } else {
    state.flags.workStoppage = false;
  }

  // Attrition: short food/O₂ but not zero → lose 1–2
  let attrition = 0;
  const foodEmpty = totalFood(state.colony.food.units) <= 0 && meal.worst === 'shortfall';
  const o2Empty = state.colony.o2Buffer <= 0;
  const foodShort = meal.worst === 'shortfall' && !foodEmpty;
  const o2Short = o2Months < 0.25 && state.colony.o2Buffer > 0;

  if (foodShort || o2Short) {
    attrition = foodShort && o2Short ? 2 : 1;
    state.colony.population = Math.max(0, state.colony.population - attrition);
    causes.push({
      type: 'system',
      description: `Rationing failures — ${attrition} colonist(s) lost.`,
    });
  }

  // Immediate total failure conditions checked in winLoss; if completely empty after upkeep:
  if (foodEmpty || o2Empty) {
    causes.push({
      type: 'system',
      description: foodEmpty
        ? 'Food buffer empty after upkeep.'
        : 'O₂ buffer empty after upkeep.',
    });
  }

  // Growth checkpoint months 6, 12, 18, 24
  let grew = false;
  const m = state.calendar.month;
  if ([6, 12, 18, 24].includes(m) && state.colony.population > 0) {
    const foodStores = totalFood(state.colony.food.units);
    const healthy =
      state.colony.morale >= 50 &&
      foodStores >= state.colony.population &&
      state.colony.population <= state.colony.habitatCapacity &&
      o2Months >= 0.5;
    if (healthy) {
      state.colony.population += 1;
      grew = true;
      causes.push({
        type: 'system',
        description: `Crew rotation: +1 colonist (checkpoint month ${m}).`,
      });
    }
  }

  // Waste → soil (imperfect; worse when morale low)
  const waste = meal.eaten * (state.colony.morale < 40 ? 0.05 : 0.12);
  state.biome.soil = clamp(state.biome.soil + waste * 0.1, 0, 100);
  if (state.biome.animals.insects > 0) {
    state.biome.animals.insects += Math.round(waste * 2);
  }

  return {
    state,
    causes,
    o2Consumed,
    foodConsumed: meal.eaten,
    worstTierEaten: meal.worst,
    attrition,
    grew,
  };
}
