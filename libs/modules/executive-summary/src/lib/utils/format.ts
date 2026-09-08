import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

/** Approximates Angular's `date:'mediumDate'` format (e.g. "Jan 5, 2026") without the DatePipe. */
export function formatMediumDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * The scheduling user's own IANA timezone (e.g. "Asia/Dubai"), auto-detected
 * from the browser. The backend stores this alongside a schedule's
 * time_of_day/day_of_week/day_of_month — which are wall-clock values in
 * this timezone, not UTC — and does the real DST-aware conversion itself
 * (see backend/app/tasks/tasks.py's compute_next_run_at), so nothing here
 * needs to convert times by hand any more.
 */
export function detectBrowserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * "09:00 Asia/Dubai" — a schedule's own time_of_day/timezone, formatted for
 * display. Unlike formatInTimeZone below, there's no instant to convert:
 * time_of_day is already a wall-clock value in `timeZone`, so this just
 * labels it.
 */
export function formatScheduleTime(hhmm: string, timeZone: string): string {
    return `${hhmm} ${timeZone}`;
}

/**
 * Renders an ISO instant (e.g. next_run_at) in an explicit IANA `timeZone`
 * regardless of the viewer's own location — same convention as
 * mofa-chatbot's date-format.ts, so a schedule's "next run" reads the same
 * to its owner no matter where they're currently logged in from.
 */
export function formatInTimeZone(iso: string, timeZone: string): string {
    return format(new TZDate(iso, timeZone), 'dd MMM, HH:mm');
}
