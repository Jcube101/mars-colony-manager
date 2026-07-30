/**
 * Small formatting helpers for report / action labels.
 */

import { RESOURCES, type ResourceId } from '@/data/resources';
import { SPECIES, type SpeciesId } from '@/data/species';
import { EVENTS, type EventId } from '@/data/events';
import type { FoodStack, PendingShipment } from '@/sim/types';
import { soilBandFromValue } from '@/sim/types';

export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return n.toFixed(digits);
}

export function speciesName(id: SpeciesId): string {
  return SPECIES[id]?.name ?? id;
}

export function resourceName(id: ResourceId): string {
  return RESOURCES[id]?.name ?? id;
}

export function eventName(id: EventId): string {
  return EVENTS[id]?.name ?? id;
}

export function shipmentLabel(ship: PendingShipment): string {
  if (ship.payload.kind === 'species') {
    return `${speciesName(ship.payload.speciesId)} seed`;
  }
  return resourceName(ship.payload.resourceId);
}

export function foodBreakdown(units: FoodStack[]): string {
  if (units.length === 0) return '0 FU';
  const total = units.reduce((s, u) => s + u.amount, 0);
  const parts = units
    .map((u) => `${fmt(u.amount)} ${u.tier} (${u.source.replace(/_/g, ' ')})`)
    .join(', ');
  return `${fmt(total)} FU — ${parts}`;
}

export function soilLabel(soil: number): string {
  const band = soilBandFromValue(soil);
  return `${band} (${fmt(soil, 0)})`;
}

export function earthWindowLabel(
  window: 'full' | 'resource_only' | 'closed',
): string {
  if (window === 'full') return 'Full support (species + resources)';
  if (window === 'resource_only') return 'Resource-only (species locked)';
  return 'Closed';
}
