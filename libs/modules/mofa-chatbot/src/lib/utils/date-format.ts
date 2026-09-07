import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

/** "14:05" in the viewer's own local timezone -- chat message bubble timestamps. */
export function formatMessageTime(iso: string): string {
    return format(new Date(iso), 'HH:mm');
}

/**
 * "07 Sep, 14:05" in the viewer's own local timezone, or '—' if absent -- the
 * shared look used across the admin backoffice's run/session/feedback tables.
 */
export function formatTimestamp(iso: string | null | undefined): string {
    return iso ? format(new Date(iso), 'dd MMM, HH:mm') : '—';
}

/**
 * Same "dd MMM, HH:mm" look, but rendered explicitly in `timeZone` regardless
 * of the viewer's own location -- used for the crawl schedule's "next run"
 * display, which must always show the schedule's configured timezone (e.g.
 * Asia/Dubai) so it reads the same to an admin no matter where they are.
 */
export function formatInTimeZone(iso: string, timeZone: string): string {
    return format(new TZDate(iso, timeZone), 'dd MMM, HH:mm');
}
