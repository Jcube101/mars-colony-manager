/**
 * Shipment queue, delivery, emergency rush, loss rolls (GDD §5.1–5.3).
 */

import { EMERGENCY_COST, RESOURCES, SHIPMENT_LOSS } from '@/data/resources';
import { SPECIES } from '@/data/species';
import type { ResourceId } from '@/data/resources';
import type { SpeciesId } from '@/data/species';
import type { Rng } from '@/sim/rng';
import type {
  CauseTag,
  FoodSource,
  FoodStack,
  GameState,
  PendingShipment,
  PlayerAction,
} from '@/sim/types';

export type ShipmentStepResult = {
  state: GameState;
  arrivals: PendingShipment[];
  losses: string[];
  causes: CauseTag[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function mergeFoodStack(units: FoodStack[], stack: FoodStack): FoodStack[] {
  const next = units.map((u) => ({ ...u }));
  const existing = next.find((u) => u.tier === stack.tier && u.source === stack.source);
  if (existing) {
    existing.amount += stack.amount;
  } else {
    next.push({ ...stack });
  }
  return next.filter((u) => u.amount > 0.001);
}

function applySpeciesSeed(state: GameState, speciesId: SpeciesId, causes: CauseTag[]): void {
  const card = SPECIES[speciesId];
  const seed = card.seedSize;
  const b = state.biome;

  switch (speciesId) {
    case 'grass':
      b.plants.grass = clamp(b.plants.grass + seed, 0, 100);
      break;
    case 'algae':
      b.plants.algae = clamp(b.plants.algae + seed, 0, 100);
      break;
    case 'insects':
      b.animals.insects += Math.round(seed);
      break;
    case 'rabbits':
      b.animals.rabbits += Math.round(seed);
      break;
    case 'deer':
      b.animals.deer += Math.round(seed);
      break;
    case 'wolves':
      b.animals.wolves += Math.round(seed);
      break;
    case 'tree': {
      const id = `tree-${state.nextShipmentSeq++}`;
      b.plants.trees.push({ id, ageMonths: 0, density: seed });
      break;
    }
    case 'mycelium':
      b.mycelium = clamp(b.mycelium + seed, 0, 100);
      break;
  }

  causes.push({
    type: 'order',
    description: `${card.name} shipment established (seed ~${seed}).`,
  });
}

function applyResourcePackage(
  state: GameState,
  resourceId: ResourceId,
  causes: CauseTag[],
): void {
  const pkg = RESOURCES[resourceId];
  const c = state.colony;
  const b = state.biome;

  switch (resourceId) {
    case 'o2':
      // ~+2 months at current pop
      c.o2Buffer += c.population * pkg.packageAmount;
      break;
    case 'water':
      c.waterReserve += pkg.packageAmount;
      b.water = clamp(b.water + pkg.packageAmount * 0.35, 0, 100);
      break;
    case 'nutrients':
      b.soil = clamp(b.soil + pkg.packageAmount, 0, 100);
      break;
    case 'power':
      c.powerBuffer += pkg.packageAmount;
      break;
  }

  causes.push({
    type: 'order',
    description: `${pkg.name} delivered (${pkg.packageSummary}).`,
  });
}

/** Deliver shipments due this calendar month. */
export function deliverArrivals(state: GameState): ShipmentStepResult {
  const causes: CauseTag[] = [];
  const losses: string[] = [];
  const month = state.calendar.month;
  const due = state.shipments.filter((s) => s.arrivesMonth === month);
  const remaining = state.shipments.filter((s) => s.arrivesMonth !== month);

  for (const ship of due) {
    if (ship.payload.kind === 'species') {
      applySpeciesSeed(state, ship.payload.speciesId, causes);
    } else {
      applyResourcePackage(state, ship.payload.resourceId, causes);
    }
  }

  state.shipments = remaining;
  state.lastArrivals = due;

  return { state, arrivals: due, losses, causes };
}

function nextShipmentId(state: GameState): string {
  const id = `ship-${state.nextShipmentSeq}`;
  state.nextShipmentSeq += 1;
  return id;
}

/**
 * Queue player action: species / resource / emergency / stand by.
 * Normal lag +2 months; emergency rushes an existing shipment to +1.
 * Loss rolls at queue time (2% normal, 12% emergency).
 */
export function applyAction(
  state: GameState,
  action: PlayerAction,
  rng: Rng,
): { state: GameState; losses: string[]; causes: CauseTag[] } {
  const causes: CauseTag[] = [];
  const losses: string[] = [];
  const month = state.calendar.month;
  const delay = state.flags.nextRequestDelayMonths;
  state.flags.nextRequestDelayMonths = 0;

  if (action.type === 'stand_by') {
    causes.push({ type: 'order', description: 'Stood by — no Earth request this month.' });
    return { state, losses, causes };
  }

  if (action.type === 'emergency') {
    const target = state.shipments.find((s) => s.id === action.shipmentId);
    if (!target) {
      causes.push({
        type: 'system',
        description: 'Emergency Priority failed — target shipment not found.',
      });
      return { state, losses, causes };
    }
    if (target.arrivesMonth <= month + 1) {
      causes.push({
        type: 'system',
        description: 'Emergency Priority refused — shipment already due next month or sooner.',
      });
      return { state, losses, causes };
    }

    // Costs
    state.colony.powerBuffer = Math.max(
      0,
      state.colony.powerBuffer * (1 - EMERGENCY_COST.powerFraction),
    );
    const moraleHit =
      EMERGENCY_COST.moraleMin +
      rng.nextInt(EMERGENCY_COST.moraleMax - EMERGENCY_COST.moraleMin + 1);
    state.colony.morale = clamp(state.colony.morale - moraleHit, 0, 100);

    if (rng.chance(SHIPMENT_LOSS.emergency)) {
      state.shipments = state.shipments.filter((s) => s.id !== target.id);
      const msg = `Emergency rush lost shipment ${target.id} in transit.`;
      losses.push(msg);
      causes.push({ type: 'order', description: msg, shipmentId: target.id });
    } else {
      target.arrivesMonth = month + 1;
      target.rushed = true;
      causes.push({
        type: 'order',
        description: `Emergency Priority: ${target.id} now arrives month ${target.arrivesMonth} (morale −${moraleHit}).`,
        shipmentId: target.id,
      });
    }
    return { state, losses, causes };
  }

  // Earth window: months 19–24 resource-only
  if (action.type === 'request_species' && state.flags.earthSpeciesLocked) {
    causes.push({
      type: 'system',
      description: 'Species catalog locked (Earth window resource-only). Request ignored.',
    });
    return { state, losses, causes };
  }

  const arrivesMonth = month + 2 + delay;
  const id = nextShipmentId(state);

  if (rng.chance(SHIPMENT_LOSS.normal)) {
    const label =
      action.type === 'request_species'
        ? SPECIES[action.speciesId].name
        : RESOURCES[action.resourceId].name;
    const msg = `Shipment lost in transit: ${label} (${id}).`;
    losses.push(msg);
    causes.push({ type: 'order', description: msg, shipmentId: id });
    return { state, losses, causes };
  }

  const payload =
    action.type === 'request_species'
      ? ({ kind: 'species', speciesId: action.speciesId } as const)
      : ({ kind: 'resource', resourceId: action.resourceId } as const);

  const ship: PendingShipment = {
    id,
    payload,
    arrivesMonth,
    rushed: false,
  };
  state.shipments.push(ship);

  const label =
    action.type === 'request_species'
      ? SPECIES[action.speciesId].name
      : RESOURCES[action.resourceId].name;
  const delayNote = delay > 0 ? ` (flare delay +${delay})` : '';
  causes.push({
    type: 'order',
    description: `Queued ${label} — arrives month ${arrivesMonth}${delayNote}.`,
    shipmentId: id,
  });

  return { state, losses, causes };
}

/** Food-critical if stores cover less than ~0.5 months of baseline need. */
export function isFoodCritical(state: GameState): boolean {
  const need = state.colony.population;
  const food = state.colony.food.units.reduce((s, u) => s + u.amount, 0);
  return food < need * 0.5;
}

export function addHarvestFood(
  state: GameState,
  amount: number,
  tier: FoodStack['tier'],
  source: FoodSource,
): void {
  if (amount <= 0) return;
  state.colony.food.units = mergeFoodStack(state.colony.food.units, {
    amount,
    tier,
    source,
  });
}
