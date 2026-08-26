/** Approximates Angular's `date:'mediumDate'` format (e.g. "Jan 5, 2026") without the DatePipe. */
export function formatMediumDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
