/**
 * Status chips: Stable / Watch / Critical (GDD presentation).
 * UI-only derivation from colony buffers — not sim rules.
 */

import type { ColonyState, StatusBand } from '@/sim/types';

export type ChipLevel = 'stable' | 'watch' | 'critical';

function foodTotal(colony: ColonyState): number {
  return colony.food.units.reduce((s, u) => s + u.amount, 0);
}

export function monthsOfSupply(amount: number, pop: number): number {
  if (pop <= 0) return amount > 0 ? 99 : 0;
  return amount / pop;
}

export function foodChip(colony: ColonyState): ChipLevel {
  const months = monthsOfSupply(foodTotal(colony), colony.population);
  if (months < 0.5) return 'critical';
  if (months < 1.5) return 'watch';
  return 'stable';
}

export function o2Chip(colony: ColonyState): ChipLevel {
  const months = monthsOfSupply(colony.o2Buffer, colony.population);
  if (months < 0.5) return 'critical';
  if (months < 1.5) return 'watch';
  return 'stable';
}

export function powerChip(colony: ColonyState): ChipLevel {
  // Rough: pop*0.6 + 2 draw per month from colony.ts
  const monthlyDraw = colony.population * 0.6 + 2;
  const months = monthlyDraw > 0 ? colony.powerBuffer / monthlyDraw : 99;
  if (months < 0.5 || colony.powerBuffer < colony.population) return 'critical';
  if (months < 1.5) return 'watch';
  return 'stable';
}

export function moraleChip(morale: number): ChipLevel {
  if (morale <= 25) return 'critical';
  if (morale <= 45) return 'watch';
  return 'stable';
}

export function waterChip(biomeWater: number, reserve: number): ChipLevel {
  if (biomeWater < 20 || reserve < 5) return 'critical';
  if (biomeWater < 35 || reserve < 15) return 'watch';
  return 'stable';
}

export function chipLabel(level: ChipLevel): string {
  if (level === 'critical') return 'Critical';
  if (level === 'watch') return 'Watch';
  return 'Stable';
}

/** Map to CSS modifier; red reserved for Critical. */
export function chipClass(level: ChipLevel): string {
  return `chip chip--${level}`;
}

export function bandFromChip(level: ChipLevel): StatusBand {
  if (level === 'critical') return 'critical';
  if (level === 'watch') return 'watch';
  return 'stable';
}
