/**
 * Random event table + base weights (GDD §7).
 * Weights marked // BALANCE; pipeline applies conditional modifiers in Phase 3.
 */

export const EVENT_IDS = [
  'dust',
  'cold',
  'blight',
  'quiet',
  'solar_flare',
  'illness',
] as const;

export type EventId = (typeof EVENT_IDS)[number];

export type EventSeverity = 'none' | 'minor' | 'major';

export type EventCard = {
  id: EventId;
  name: string;
  severity: EventSeverity;
  /** Relative pick weight among non-quiet events (// BALANCE). */
  weight: number;
  summary: string;
  /** Soft forecast eligible (~50% of major weather). */
  forecastable: boolean;
};

/**
 * Target cadence (GDD): ~1 minor / 2–3 months; ~1 major / 6–8 months; quiet allowed.
 * Quiet is high-weight so empty drama months happen often.
 */
export const EVENTS: Record<EventId, EventCard> = {
  quiet: {
    id: 'quiet',
    name: 'Quiet month',
    severity: 'none',
    weight: 40, // BALANCE
    summary: 'No named event.',
    forecastable: false,
  },
  dust: {
    id: 'dust',
    name: 'Dust storm',
    severity: 'major',
    weight: 8, // BALANCE
    summary: 'Power −, O₂ production −, outdoor growth −.',
    forecastable: true,
  },
  cold: {
    id: 'cold',
    name: 'Cold snap',
    severity: 'major',
    weight: 8, // BALANCE
    summary: 'Food need +, algae growth −.',
    forecastable: true,
  },
  solar_flare: {
    id: 'solar_flare',
    name: 'Solar flare',
    severity: 'major',
    weight: 5, // BALANCE
    summary: 'Next request delayed +1 month.',
    forecastable: true,
  },
  blight: {
    id: 'blight',
    name: 'Blight',
    severity: 'major',
    weight: 6, // BALANCE
    summary: 'Hard cut to one species.',
    forecastable: false,
  },
  illness: {
    id: 'illness',
    name: 'Illness',
    severity: 'minor',
    weight: 10, // BALANCE — overcrowding / low morale raise this in Phase 3
    summary: 'Minor; +food need, −labor that month.',
    forecastable: false,
  },
};

export const EVENT_LIST: EventCard[] = EVENT_IDS.map((id) => EVENTS[id]);

/** Chance a major weather event gets a one-month soft forecast (GDD). */
export const EVENT_FORECAST_CHANCE = 0.5; // BALANCE locked by GDD intent
