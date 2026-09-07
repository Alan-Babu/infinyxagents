/** Approximates Angular's `date:'mediumDate'` format (e.g. "Jan 5, 2026") without the DatePipe. */
export function formatMediumDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Converts an "HH:MM" time the user picked in their own (browser) timezone
 * to the equivalent UTC "HH:MM" the backend stores schedules in, plus how
 * many calendar days the conversion shifts (-1, 0, or +1) — e.g. 11:00 PM in
 * a UTC+4 timezone lands on 7:00 PM UTC the *same* day, while a very late or
 * very early local time can cross midnight into the next/previous UTC day.
 * Callers must apply dayShift to any day-of-week/day-of-month the user also
 * picked, or a weekly/monthly schedule silently fires a day off.
 */
export function localTimeToUtc(hhmm: string): { time: string; dayShift: number } {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const local = new Date();
    local.setHours(hours, minutes, 0, 0);

    let dayShift = local.getUTCDay() - local.getDay();
    if (dayShift > 3) dayShift -= 7;
    if (dayShift < -3) dayShift += 7;

    return { time: `${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}`, dayShift };
}

/** Inverse of localTimeToUtc's time conversion, for displaying a stored UTC "HH:MM" to the viewer in their own timezone. */
export function utcTimeToLocal(hhmm: string): string {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const utc = new Date();
    utc.setUTCHours(hours, minutes, 0, 0);
    return `${pad2(utc.getHours())}:${pad2(utc.getMinutes())}`;
}

/** Shifts a Python-convention weekday (0=Monday..6=Sunday) by `days`, wrapping mod 7. */
export function shiftPythonWeekday(weekday: number, days: number): number {
    return ((weekday + days) % 7 + 7) % 7;
}

/**
 * Shifts a day-of-month by `days` within the app's fixed 1-28 cycle — the
 * backend caps day_of_month at 28 to sidestep short-month issues (see
 * backend/app/schemas.py), so this wraps on that same 28-day wheel rather
 * than against real month lengths.
 */
export function shiftDayOfMonth28(day: number, days: number): number {
    return (((day - 1 + days) % 28) + 28) % 28 + 1;
}
