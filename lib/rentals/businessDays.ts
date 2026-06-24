// Business-day helpers (Mon–Fri, no holiday calendar).

/** How many business days must elapse after return_pending before auto-release. */
export const RETURN_REVIEW_WINDOW_DAYS = 5; // TODO: later read from admin settings table

/** Returns a new Date that is `days` business days after `from`. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip Sat (6) and Sun (0)
  }
  return result;
}

/** True if `days` business days have elapsed since `from` (relative to `now`). */
export function reviewWindowLapsed(from: Date, now: Date): boolean {
  return now >= addBusinessDays(from, RETURN_REVIEW_WINDOW_DAYS);
}

/** How many business days have elapsed between `from` and `to`. */
export function businessDaysElapsed(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  while (d < to) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
