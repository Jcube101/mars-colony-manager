/** Pure report model + causes (placeholder — Phase 3). */

export type MonthReport = {
  readonly scaffold: true;
};

export function buildReportPlaceholder(): MonthReport {
  return { scaffold: true };
}
