/**
 * Versioned JSON save format (SPEC §5.3).
 * Treat import as untrusted — validate nested fields before load.
 * Rebuilds GameState from checked values so extra keys are dropped.
 */

import { EVENT_IDS, type EventId } from '@/data/events';
import { RESOURCE_IDS, type ResourceId } from '@/data/resources';
import { SPECIES_IDS, type SpeciesId } from '@/data/species';
import type {
  BiomeState,
  CalendarPhase,
  CauseTag,
  ColonyState,
  FoodSource,
  FoodStack,
  FoodTier,
  GameFlags,
  GameMeta,
  GameState,
  HistoryState,
  MonthReport,
  PendingShipment,
  RunOutcome,
  ShipmentPayload,
  TimelineEntry,
  TreeCohort,
} from '@/sim/types';
import { RUN_MONTHS } from '@/sim/types';

export const SAVE_FORMAT = 'mars-colony-manager-save' as const;
export const SAVE_FORMAT_VERSION = 1;

export type SaveSlotId = 0 | 1 | 2;

export type SaveFile = {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  savedAt: string;
  /** Slot index, or null for export / autosave envelope. */
  slot: number | null;
  state: GameState;
  /** Optional UI resume aid (not required by SPEC). */
  lastReport?: MonthReport | null;
};

export type ParseSaveResult =
  | { ok: true; save: SaveFile }
  | { ok: false; error: string };

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };
type Res<T> = Ok<T> | Err;

const FOOD_TIERS: readonly FoodTier[] = ['++++', '+++', '++', '+'];
const FOOD_SOURCES: readonly FoodSource[] = [
  'earth_rations',
  'insects',
  'rabbits',
  'deer',
  'wolves',
  'fruit',
];
const PHASES: readonly CalendarPhase[] = ['decision', 'ended'];
const OUTCOMES: readonly RunOutcome[] = ['ongoing', 'won', 'lost'];
const CAUSE_TYPES = ['order', 'event', 'species', 'system'] as const;

function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

function err(error: string): Err {
  return { ok: false, error };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isOneOf<T extends string>(
  v: unknown,
  allowed: readonly T[],
): v is T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

function finite(v: unknown, path: string): Res<number> {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return err(`${path} must be a finite number.`);
  }
  return ok(v);
}

function int(v: unknown, path: string): Res<number> {
  const n = finite(v, path);
  if (!n.ok) return n;
  if (!Number.isInteger(n.value)) {
    return err(`${path} must be an integer.`);
  }
  return n;
}

function str(v: unknown, path: string): Res<string> {
  if (typeof v !== 'string') {
    return err(`${path} must be a string.`);
  }
  return ok(v);
}

function bool(v: unknown, path: string): Res<boolean> {
  if (typeof v !== 'boolean') {
    return err(`${path} must be a boolean.`);
  }
  return ok(v);
}

function arr(v: unknown, path: string): Res<unknown[]> {
  if (!Array.isArray(v)) {
    return err(`${path} must be an array.`);
  }
  return ok(v);
}

function rec(v: unknown, path: string): Res<Record<string, unknown>> {
  if (!isRecord(v)) {
    return err(`${path} must be an object.`);
  }
  return ok(v);
}

function mapArr<T>(
  raw: unknown,
  path: string,
  each: (item: unknown, path: string) => Res<T>,
): Res<T[]> {
  const a = arr(raw, path);
  if (!a.ok) return a;
  const out: T[] = [];
  for (let i = 0; i < a.value.length; i++) {
    const item = each(a.value[i], `${path}[${i}]`);
    if (!item.ok) return item;
    out.push(item.value);
  }
  return ok(out);
}

export function serializeSave(input: {
  state: GameState;
  slot?: number | null;
  lastReport?: MonthReport | null;
  savedAt?: string;
}): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    savedAt: input.savedAt ?? new Date().toISOString(),
    slot: input.slot ?? null,
    state: structuredClone(input.state),
    lastReport: input.lastReport ?? null,
  };
  return JSON.stringify(file, null, 2);
}

export function parseSave(raw: string): ParseSaveResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }

  if (!isRecord(data)) {
    return { ok: false, error: 'Save root must be an object.' };
  }

  if (data.format !== SAVE_FORMAT) {
    return {
      ok: false,
      error: `Unknown save format (expected ${SAVE_FORMAT}).`,
    };
  }

  if (typeof data.formatVersion !== 'number') {
    return { ok: false, error: 'Missing formatVersion.' };
  }

  if (data.formatVersion !== SAVE_FORMAT_VERSION) {
    return {
      ok: false,
      error: `Unsupported formatVersion ${data.formatVersion} (need ${SAVE_FORMAT_VERSION}).`,
    };
  }

  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Missing savedAt.' };
  }

  const slot = data.slot;
  if (!(slot === null || slot === undefined || typeof slot === 'number')) {
    return { ok: false, error: 'Invalid slot field.' };
  }

  const stateCheck = validateGameState(data.state);
  if (!stateCheck.ok) {
    return stateCheck;
  }

  let lastReport: MonthReport | null | undefined;
  if ('lastReport' in data) {
    if (data.lastReport === null) {
      lastReport = null;
    } else {
      const report = validateMonthReport(data.lastReport, 'lastReport');
      if (!report.ok) {
        return { ok: false, error: report.error };
      }
      lastReport = report.value;
    }
  }

  return {
    ok: true,
    save: {
      format: SAVE_FORMAT,
      formatVersion: data.formatVersion,
      savedAt: data.savedAt,
      slot: typeof slot === 'number' ? slot : null,
      state: stateCheck.state,
      lastReport,
    },
  };
}

type ValidateStateResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string };

/**
 * Structural validation of untrusted JSON.
 * Rebuilds a GameState so unknown keys cannot leak into the sim.
 */
export function validateGameState(raw: unknown): ValidateStateResult {
  const parsed = parseGameState(raw, 'state');
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, state: parsed.value };
}

function parseGameState(raw: unknown, path: string): Res<GameState> {
  const s = rec(raw, path);
  if (!s.ok) return err(s.error === `${path} must be an object.` ? 'Missing game state.' : s.error);

  const meta = parseMeta(s.value.meta, `${path}.meta`);
  if (!meta.ok) return meta;

  const calendar = parseCalendar(s.value.calendar, `${path}.calendar`);
  if (!calendar.ok) return calendar;

  const colony = parseColony(s.value.colony, `${path}.colony`);
  if (!colony.ok) return colony;

  const biome = parseBiome(s.value.biome, `${path}.biome`);
  if (!biome.ok) return biome;

  const shipments = mapArr(s.value.shipments, `${path}.shipments`, parseShipment);
  if (!shipments.ok) return shipments;

  const flags = parseFlags(s.value.flags, `${path}.flags`);
  if (!flags.ok) return flags;

  const history = parseHistory(s.value.history, `${path}.history`);
  if (!history.ok) return history;

  const rngState = finite(s.value.rngState, `${path}.rngState`);
  if (!rngState.ok) return rngState;

  if (!isOneOf(s.value.outcome, OUTCOMES)) {
    return err('State outcome invalid.');
  }

  const nextShipmentSeq = int(s.value.nextShipmentSeq, `${path}.nextShipmentSeq`);
  if (!nextShipmentSeq.ok) return nextShipmentSeq;

  let lastArrivals: PendingShipment[] = [];
  if ('lastArrivals' in s.value && s.value.lastArrivals !== undefined) {
    const arrivals = mapArr(
      s.value.lastArrivals,
      `${path}.lastArrivals`,
      parseShipment,
    );
    if (!arrivals.ok) return arrivals;
    lastArrivals = arrivals.value;
  }

  const state: GameState = {
    meta: meta.value,
    calendar: calendar.value,
    colony: colony.value,
    biome: biome.value,
    shipments: shipments.value,
    flags: flags.value,
    history: history.value,
    rngState: rngState.value,
    outcome: s.value.outcome,
    lastArrivals,
    nextShipmentSeq: nextShipmentSeq.value,
  };

  if (s.value.lossReason !== undefined) {
    const reason = str(s.value.lossReason, `${path}.lossReason`);
    if (!reason.ok) return reason;
    state.lossReason = reason.value;
  }

  if (s.value.forecast !== undefined) {
    const forecast = str(s.value.forecast, `${path}.forecast`);
    if (!forecast.ok) return forecast;
    state.forecast = forecast.value;
  }

  return ok(state);
}

function parseMeta(raw: unknown, path: string): Res<GameMeta> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing meta.');

  const version = finite(o.value.version, `${path}.version`);
  if (!version.ok) return version;
  const seed = finite(o.value.seed, `${path}.seed`);
  if (!seed.ok) return err('State meta.seed / colonyName invalid.');
  const colonyName = str(o.value.colonyName, `${path}.colonyName`);
  if (!colonyName.ok) return err('State meta.seed / colonyName invalid.');
  const createdAt = str(o.value.createdAt, `${path}.createdAt`);
  if (!createdAt.ok) return createdAt;

  const meta: GameMeta = {
    version: version.value,
    seed: seed.value,
    colonyName: colonyName.value,
    createdAt: createdAt.value,
  };

  if (o.value.playerName !== undefined) {
    const n = str(o.value.playerName, `${path}.playerName`);
    if (!n.ok) return n;
    meta.playerName = n.value;
  }
  if (o.value.playerTitle !== undefined) {
    const t = str(o.value.playerTitle, `${path}.playerTitle`);
    if (!t.ok) return t;
    meta.playerTitle = t.value;
  }
  return ok(meta);
}

function parseCalendar(
  raw: unknown,
  path: string,
): Res<GameState['calendar']> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing calendar.');
  const month = int(o.value.month, `${path}.month`);
  if (!month.ok) return month;
  if (month.value < 1 || month.value > RUN_MONTHS) {
    return err('State calendar.month out of range.');
  }
  if (!isOneOf(o.value.phase, PHASES)) {
    return err(`${path}.phase must be decision or ended.`);
  }
  return ok({ month: month.value, phase: o.value.phase });
}

function parseColony(raw: unknown, path: string): Res<ColonyState> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing colony.');

  const population = int(o.value.population, `${path}.population`);
  if (!population.ok) return err('State colony fields invalid.');
  const morale = finite(o.value.morale, `${path}.morale`);
  if (!morale.ok) return err('State colony fields invalid.');

  const habitatCapacity = int(o.value.habitatCapacity, `${path}.habitatCapacity`);
  if (!habitatCapacity.ok) return habitatCapacity;
  const o2Buffer = finite(o.value.o2Buffer, `${path}.o2Buffer`);
  if (!o2Buffer.ok) return o2Buffer;
  const powerBuffer = finite(o.value.powerBuffer, `${path}.powerBuffer`);
  if (!powerBuffer.ok) return powerBuffer;
  const waterReserve = finite(o.value.waterReserve, `${path}.waterReserve`);
  if (!waterReserve.ok) return waterReserve;

  const foodObj = rec(o.value.food, `${path}.food`);
  if (!foodObj.ok) return err('State colony.food missing.');
  const units = mapArr(foodObj.value.units, `${path}.food.units`, parseFoodStack);
  if (!units.ok) return units;

  if (population.value < 0) {
    return err(`${path}.population must be >= 0.`);
  }

  return ok({
    population: population.value,
    habitatCapacity: habitatCapacity.value,
    food: { units: units.value },
    o2Buffer: o2Buffer.value,
    powerBuffer: powerBuffer.value,
    waterReserve: waterReserve.value,
    morale: morale.value,
  });
}

function parseFoodStack(raw: unknown, path: string): Res<FoodStack> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  const amount = finite(o.value.amount, `${path}.amount`);
  if (!amount.ok) return amount;
  if (!isOneOf(o.value.tier, FOOD_TIERS)) {
    return err(`${path}.tier is not a known food tier.`);
  }
  if (!isOneOf(o.value.source, FOOD_SOURCES)) {
    return err(`${path}.source is not a known food source.`);
  }
  return ok({
    amount: amount.value,
    tier: o.value.tier,
    source: o.value.source,
  });
}

function parseBiome(raw: unknown, path: string): Res<BiomeState> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing biome.');

  const soil = finite(o.value.soil, `${path}.soil`);
  if (!soil.ok) return soil;
  const water = finite(o.value.water, `${path}.water`);
  if (!water.ok) return water;
  const mycelium = finite(o.value.mycelium, `${path}.mycelium`);
  if (!mycelium.ok) return mycelium;
  const o2 = finite(o.value.o2ProductionLastMonth, `${path}.o2ProductionLastMonth`);
  if (!o2.ok) return o2;

  const plants = rec(o.value.plants, `${path}.plants`);
  if (!plants.ok) return plants;
  const grass = finite(plants.value.grass, `${path}.plants.grass`);
  if (!grass.ok) return grass;
  const algae = finite(plants.value.algae, `${path}.plants.algae`);
  if (!algae.ok) return algae;
  const trees = mapArr(plants.value.trees, `${path}.plants.trees`, parseTree);
  if (!trees.ok) return trees;

  const animals = rec(o.value.animals, `${path}.animals`);
  if (!animals.ok) return animals;
  const insects = int(animals.value.insects, `${path}.animals.insects`);
  if (!insects.ok) return insects;
  const rabbits = int(animals.value.rabbits, `${path}.animals.rabbits`);
  if (!rabbits.ok) return rabbits;
  const deer = int(animals.value.deer, `${path}.animals.deer`);
  if (!deer.ok) return deer;
  const wolves = int(animals.value.wolves, `${path}.animals.wolves`);
  if (!wolves.ok) return wolves;

  return ok({
    soil: soil.value,
    water: water.value,
    plants: {
      grass: grass.value,
      algae: algae.value,
      trees: trees.value,
    },
    animals: {
      insects: insects.value,
      rabbits: rabbits.value,
      deer: deer.value,
      wolves: wolves.value,
    },
    mycelium: mycelium.value,
    o2ProductionLastMonth: o2.value,
  });
}

function parseTree(raw: unknown, path: string): Res<TreeCohort> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  const id = str(o.value.id, `${path}.id`);
  if (!id.ok) return id;
  const ageMonths = int(o.value.ageMonths, `${path}.ageMonths`);
  if (!ageMonths.ok) return ageMonths;
  const density = finite(o.value.density, `${path}.density`);
  if (!density.ok) return density;
  return ok({
    id: id.value,
    ageMonths: ageMonths.value,
    density: density.value,
  });
}

function parseShipment(raw: unknown, path: string): Res<PendingShipment> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  const id = str(o.value.id, `${path}.id`);
  if (!id.ok) return id;
  const arrivesMonth = int(o.value.arrivesMonth, `${path}.arrivesMonth`);
  if (!arrivesMonth.ok) return arrivesMonth;
  const rushed = bool(o.value.rushed, `${path}.rushed`);
  if (!rushed.ok) return rushed;
  const payload = parsePayload(o.value.payload, `${path}.payload`);
  if (!payload.ok) return payload;
  return ok({
    id: id.value,
    payload: payload.value,
    arrivesMonth: arrivesMonth.value,
    rushed: rushed.value,
  });
}

function parsePayload(raw: unknown, path: string): Res<ShipmentPayload> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  if (o.value.kind === 'species') {
    if (!isOneOf(o.value.speciesId, SPECIES_IDS)) {
      return err(`${path}.speciesId is not a known species.`);
    }
    return ok({ kind: 'species', speciesId: o.value.speciesId as SpeciesId });
  }
  if (o.value.kind === 'resource') {
    if (!isOneOf(o.value.resourceId, RESOURCE_IDS)) {
      return err(`${path}.resourceId is not a known resource.`);
    }
    return ok({ kind: 'resource', resourceId: o.value.resourceId as ResourceId });
  }
  return err(`${path}.kind must be species or resource.`);
}

function parseFlags(raw: unknown, path: string): Res<GameFlags> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing flags.');
  const earthSpeciesLocked = bool(
    o.value.earthSpeciesLocked,
    `${path}.earthSpeciesLocked`,
  );
  if (!earthSpeciesLocked.ok) return earthSpeciesLocked;
  const workStoppage = bool(o.value.workStoppage, `${path}.workStoppage`);
  if (!workStoppage.ok) return workStoppage;
  const lastEvents = mapArr(o.value.lastEvents, `${path}.lastEvents`, (item, p) => {
    if (!isOneOf(item, EVENT_IDS)) {
      return err(`${p} is not a known event id.`);
    }
    return ok(item as EventId);
  });
  if (!lastEvents.ok) return lastEvents;
  const delay = int(
    o.value.nextRequestDelayMonths,
    `${path}.nextRequestDelayMonths`,
  );
  if (!delay.ok) return delay;

  const flags: GameFlags = {
    earthSpeciesLocked: earthSpeciesLocked.value,
    workStoppage: workStoppage.value,
    lastEvents: lastEvents.value,
    nextRequestDelayMonths: delay.value,
  };

  if (o.value.debugForceEvent !== undefined) {
    if (!isOneOf(o.value.debugForceEvent, EVENT_IDS)) {
      return err(`${path}.debugForceEvent is not a known event id.`);
    }
    flags.debugForceEvent = o.value.debugForceEvent as EventId;
  }
  return ok(flags);
}

function parseHistory(raw: unknown, path: string): Res<HistoryState> {
  const o = rec(raw, path);
  if (!o.ok) return err('State missing history.');
  const food = mapArr(
    o.value.foodSelfSufficient,
    `${path}.foodSelfSufficient`,
    (item, p) => bool(item, p),
  );
  if (!food.ok) return food;
  const o2 = mapArr(
    o.value.o2SelfSufficient,
    `${path}.o2SelfSufficient`,
    (item, p) => bool(item, p),
  );
  if (!o2.ok) return o2;
  const timeline = mapArr(o.value.timeline, `${path}.timeline`, parseTimeline);
  if (!timeline.ok) return timeline;
  return ok({
    foodSelfSufficient: food.value,
    o2SelfSufficient: o2.value,
    timeline: timeline.value,
  });
}

function parseTimeline(raw: unknown, path: string): Res<TimelineEntry> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  const month = int(o.value.month, `${path}.month`);
  if (!month.ok) return month;
  const kind = str(o.value.kind, `${path}.kind`);
  if (!kind.ok) return kind;
  const summary = str(o.value.summary, `${path}.summary`);
  if (!summary.ok) return summary;
  return ok({ month: month.value, kind: kind.value, summary: summary.value });
}

function validateMonthReport(raw: unknown, path: string): Res<MonthReport> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  const month = int(o.value.month, `${path}.month`);
  if (!month.ok) return month;
  if (month.value < 1 || month.value > RUN_MONTHS) {
    return err(`${path}.month out of range.`);
  }
  const headline = str(o.value.headline, `${path}.headline`);
  if (!headline.ok) return headline;
  const causes = mapArr(o.value.causes, `${path}.causes`, parseCause);
  if (!causes.ok) return causes;
  const events = mapArr(o.value.events, `${path}.events`, (item, p) => {
    if (!isOneOf(item, EVENT_IDS)) {
      return err(`${p} is not a known event id.`);
    }
    return ok(item as EventId);
  });
  if (!events.ok) return events;
  const arrivals = mapArr(o.value.arrivals, `${path}.arrivals`, parseShipment);
  if (!arrivals.ok) return arrivals;
  const losses = mapArr(o.value.losses, `${path}.losses`, (item, p) => str(item, p));
  if (!losses.ok) return losses;
  const harvested = finite(
    o.value.ecosystemFoodHarvested,
    `${path}.ecosystemFoodHarvested`,
  );
  if (!harvested.ok) return harvested;
  const o2Produced = finite(o.value.o2Produced, `${path}.o2Produced`);
  if (!o2Produced.ok) return o2Produced;
  const o2Consumed = finite(o.value.o2Consumed, `${path}.o2Consumed`);
  if (!o2Consumed.ok) return o2Consumed;
  const foodSS = bool(o.value.foodSelfSufficient, `${path}.foodSelfSufficient`);
  if (!foodSS.ok) return foodSS;
  const o2SS = bool(o.value.o2SelfSufficient, `${path}.o2SelfSufficient`);
  if (!o2SS.ok) return o2SS;
  const established = mapArr(
    o.value.establishedSpecies,
    `${path}.establishedSpecies`,
    (item, p) => {
      if (!isOneOf(item, SPECIES_IDS)) {
        return err(`${p} is not a known species.`);
      }
      return ok(item as SpeciesId);
    },
  );
  if (!established.ok) return established;
  if (!isOneOf(o.value.outcome, OUTCOMES)) {
    return err(`${path}.outcome invalid.`);
  }

  const report: MonthReport = {
    month: month.value,
    headline: headline.value,
    causes: causes.value,
    events: events.value,
    arrivals: arrivals.value,
    losses: losses.value,
    ecosystemFoodHarvested: harvested.value,
    o2Produced: o2Produced.value,
    o2Consumed: o2Consumed.value,
    foodSelfSufficient: foodSS.value,
    o2SelfSufficient: o2SS.value,
    establishedSpecies: established.value,
    outcome: o.value.outcome,
  };

  if (o.value.harvestLine !== undefined) {
    const line = str(o.value.harvestLine, `${path}.harvestLine`);
    if (!line.ok) return line;
    report.harvestLine = line.value;
  }
  if (o.value.lossReason !== undefined) {
    const reason = str(o.value.lossReason, `${path}.lossReason`);
    if (!reason.ok) return reason;
    report.lossReason = reason.value;
  }
  return ok(report);
}

function parseCause(raw: unknown, path: string): Res<CauseTag> {
  const o = rec(raw, path);
  if (!o.ok) return o;
  if (!isOneOf(o.value.type, CAUSE_TYPES)) {
    return err(`${path}.type is not a known cause type.`);
  }
  const description = str(o.value.description, `${path}.description`);
  if (!description.ok) return description;

  if (o.value.type === 'order') {
    const tag: CauseTag = { type: 'order', description: description.value };
    if (o.value.shipmentId !== undefined) {
      const id = str(o.value.shipmentId, `${path}.shipmentId`);
      if (!id.ok) return id;
      tag.shipmentId = id.value;
    }
    return ok(tag);
  }
  if (o.value.type === 'event') {
    if (!isOneOf(o.value.eventId, EVENT_IDS)) {
      return err(`${path}.eventId is not a known event id.`);
    }
    return ok({
      type: 'event',
      description: description.value,
      eventId: o.value.eventId as EventId,
    });
  }
  if (o.value.type === 'species') {
    if (!isOneOf(o.value.speciesId, SPECIES_IDS)) {
      return err(`${path}.speciesId is not a known species.`);
    }
    return ok({
      type: 'species',
      description: description.value,
      speciesId: o.value.speciesId as SpeciesId,
    });
  }
  return ok({ type: 'system', description: description.value });
}
