/**
 * Pure report model + causes (types live here for Phase 3 builders).
 * Full report assembly is Phase 3; Phase 2 exports the shape.
 */

export type { CauseTag, MonthReport } from '@/sim/types';

import type { MonthReport } from '@/sim/types';

/** Empty report shell for a month (pipeline fills this later). */
export function emptyMonthReport(month: number): MonthReport {
  return {
    month,
    headline: '',
    causes: [],
    events: [],
    arrivals: [],
    losses: [],
  };
}
