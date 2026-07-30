/**
 * Event roll + apply (GDD §7).
 * Runs after ecosystem ticks in the month pipeline.
 */

import {
  EVENT_FORECAST_CHANCE,
  EVENT_LIST,
  EVENTS,
  type EventId,
} from '@/data/events';
import { SPECIES_IDS } from '@/data/species';
import type { Rng } from '@/sim/rng';
import type { CauseTag, GameState } from '@/sim/types';

export type EventStepResult = {
  state: GameState;
  events: EventId[];
  causes: CauseTag[];
  mods: { dust: boolean; cold: boolean; illness: boolean };
  /** Adjusted O₂ produced this month after event cuts. */
  o2ProducedAdjust: number;
  forecast?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pickWeighted(rng: Rng, weights: { id: EventId; weight: number }[]): EventId {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  if (total <= 0) return 'quiet';
  let roll = rng.next() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.id;
  }
  return weights[weights.length - 1]!.id;
}

/** Roll and apply one event for the month. */
export function resolveEvents(
  state: GameState,
  rng: Rng,
  o2ProducedSoFar: number,
): EventStepResult {
  const causes: CauseTag[] = [];
  const mods = { dust: false, cold: false, illness: false };
  let o2ProducedAdjust = 0;

  const overcrowded = state.colony.population > state.colony.habitatCapacity;
  const lowMorale = state.colony.morale <= 25;

  const weights = EVENT_LIST.map((e) => {
    let w = e.weight;
    if (e.id === 'illness' && (overcrowded || lowMorale)) {
      w *= 2.5;
    }
    return { id: e.id, weight: w };
  });

  // Debug override (?debug=1 UI) — does not affect normal runs
  let eventId: EventId;
  if (state.flags.debugForceEvent) {
    eventId = state.flags.debugForceEvent;
    delete state.flags.debugForceEvent;
    // Still consume a roll for stream stability when not forced? Prefer not — debug only.
  } else {
    eventId = pickWeighted(rng, weights);
  }
  const card = EVENTS[eventId];

  switch (eventId) {
    case 'quiet':
      causes.push({ type: 'event', eventId, description: card.summary });
      break;
    case 'dust': {
      mods.dust = true;
      state.colony.powerBuffer = Math.max(0, state.colony.powerBuffer * 0.65);
      state.biome.plants.grass = clamp(state.biome.plants.grass * 0.9, 0, 100);
      // Retroactive O₂ production cut for the month
      const cut = o2ProducedSoFar * 0.4;
      o2ProducedAdjust = -cut;
      state.colony.o2Buffer = Math.max(0, state.colony.o2Buffer - cut);
      state.biome.o2ProductionLastMonth = Math.max(
        0,
        state.biome.o2ProductionLastMonth - cut,
      );
      causes.push({
        type: 'event',
        eventId,
        description: 'Dust storm: power buffer cut, O₂ production and growth stressed.',
      });
      break;
    }
    case 'cold':
      mods.cold = true;
      state.biome.plants.algae = clamp(state.biome.plants.algae * 0.75, 0, 100);
      causes.push({
        type: 'event',
        eventId,
        description: 'Cold snap: algae stressed; food need elevated this month.',
      });
      break;
    case 'solar_flare':
      state.flags.nextRequestDelayMonths = Math.max(
        state.flags.nextRequestDelayMonths,
        1,
      );
      causes.push({
        type: 'event',
        eventId,
        description: 'Solar flare: next Earth request delayed +1 month.',
      });
      break;
    case 'blight': {
      const present: { id: (typeof SPECIES_IDS)[number]; score: number }[] = [];
      if (state.biome.plants.grass > 5)
        present.push({ id: 'grass', score: state.biome.plants.grass });
      if (state.biome.plants.algae > 5)
        present.push({ id: 'algae', score: state.biome.plants.algae });
      if (state.biome.animals.insects > 10)
        present.push({ id: 'insects', score: state.biome.animals.insects });
      if (state.biome.animals.rabbits > 3)
        present.push({ id: 'rabbits', score: state.biome.animals.rabbits });
      if (state.biome.animals.deer > 2)
        present.push({ id: 'deer', score: state.biome.animals.deer });
      if (state.biome.mycelium > 5)
        present.push({ id: 'mycelium', score: state.biome.mycelium });
      if (present.length === 0) {
        causes.push({
          type: 'event',
          eventId,
          description: 'Blight reported but found no established biomass to strike.',
        });
      } else {
        const target = present[rng.nextInt(present.length)]!;
        switch (target.id) {
          case 'grass':
            state.biome.plants.grass *= 0.4;
            break;
          case 'algae':
            state.biome.plants.algae *= 0.4;
            break;
          case 'insects':
            state.biome.animals.insects = Math.round(
              state.biome.animals.insects * 0.4,
            );
            break;
          case 'rabbits':
            state.biome.animals.rabbits = Math.round(
              state.biome.animals.rabbits * 0.4,
            );
            break;
          case 'deer':
            state.biome.animals.deer = Math.round(state.biome.animals.deer * 0.4);
            break;
          case 'mycelium':
            state.biome.mycelium *= 0.4;
            break;
          default:
            break;
        }
        causes.push({
          type: 'event',
          eventId,
          description: `Blight hard-cut ${target.id}.`,
        });
      }
      break;
    }
    case 'illness':
      mods.illness = true;
      causes.push({
        type: 'event',
        eventId,
        description: 'Illness: elevated food need and reduced harvest labor.',
      });
      break;
  }

  state.flags.lastEvents = eventId === 'quiet' ? [] : [eventId];

  // Soft one-month forecast on ~50% of months for major weather (GDD)
  let forecast: string | undefined;
  const majors = EVENT_LIST.filter((e) => e.forecastable);
  if (rng.chance(EVENT_FORECAST_CHANCE) && majors.length > 0) {
    const f = majors[rng.nextInt(majors.length)]!;
    forecast = `Soft forecast (~50%): elevated risk of ${f.name.toLowerCase()} next month — unconfirmed. Plan cargo around the lag, not the weather.`;
  }
  state.forecast = forecast;

  return {
    state,
    events: eventId === 'quiet' ? [] : [eventId],
    causes,
    mods,
    o2ProducedAdjust,
    forecast,
  };
}
