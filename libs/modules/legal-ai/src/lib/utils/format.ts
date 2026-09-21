import type { Finding } from '../models/legal-ai.models';

/**
 * The backend stores `datetime.utcnow().isoformat()` — UTC without a designator.
 * Treat those as UTC, otherwise the browser would parse them as local time.
 */
export function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const d = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Locale-aware date. Pinned to Asia/Dubai so server-rendered and hydrated markup
 * are identical regardless of the server's or viewer's timezone (hydration safe).
 */
export function formatDate(value: string | null | undefined, lang: 'en' | 'ar', withTime = false): string {
  const d = parseApiDate(value);
  if (!d) return '—';
  const key = `${lang}:${withTime}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Dubai',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
    formatters.set(key, fmt);
  }
  return fmt.format(d);
}

export function formatNumber(value: number, lang: 'en' | 'ar'): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-AE' : 'en-GB').format(value);
}

/** A finding still needs counsel sign-off. Mirrors backend finding_is_pending_review. */
export function findingNeedsReview(f: Finding): boolean {
  if (f.review_status === 'APPROVED' || f.review_status === 'REJECTED') return false;
  return (
    Boolean(f.human_review_required) ||
    ['NEEDS_REVIEW', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE'].includes(f.status)
  );
}

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFORMATIONAL: 4 };

/** Comparator: most severe first. Stable for equal severities (clause order is preserved). */
export function bySeverity(a: Finding, b: Finding): number {
  return (SEVERITY_RANK[a.severity] ?? 5) - (SEVERITY_RANK[b.severity] ?? 5);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Client-side pagination helper (page is 1-based). */
export function paginate<T>(items: readonly T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = clamp(page, 1, pages);
  const start = (current - 1) * size;
  return {
    page: current,
    pages,
    total: items.length,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + size, items.length),
    slice: items.slice(start, start + size),
  };
}

/** Escape a value for a CSV cell. */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
