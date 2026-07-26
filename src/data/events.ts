/** Event table + weights (placeholder — Phase 2). */

export const EVENT_IDS = [
  'dust',
  'cold',
  'blight',
  'quiet',
  'solar_flare',
  'illness',
] as const;

export type EventId = (typeof EVENT_IDS)[number];
