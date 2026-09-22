import { describe, expect, it } from 'vitest';
import type { Finding } from '../models/legal-ai.models';
import { bySeverity, clamp, csvCell, findingNeedsReview, formatDate, paginate, parseApiDate } from './format';

const finding = (over: Partial<Finding> = {}): Finding => ({
  clause_number: '1',
  clause_text: 'text',
  legal_topic: 'Payment',
  status: 'COMPLIANT',
  severity: 'LOW',
  reasoning: 'because',
  confidence: 0.9,
  human_review_required: false,
  ...over,
});

describe('parseApiDate', () => {
  it('treats backend timestamps without a zone as UTC', () => {
    expect(parseApiDate('2026-09-21T10:24:05.688190')?.toISOString()).toBe('2026-09-21T10:24:05.688Z');
  });
  it('respects an explicit offset', () => {
    expect(parseApiDate('2026-09-21T12:00:00+02:00')?.toISOString()).toBe('2026-09-21T10:00:00.000Z');
  });
  it('returns null for empty or invalid input', () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate('not a date')).toBeNull();
  });
});

describe('formatDate', () => {
  it('is pinned to Asia/Dubai so SSR and browser agree', () => {
    // 21:30 UTC is already the next calendar day in Dubai (UTC+4).
    expect(formatDate('2026-09-21T21:30:00', 'en')).toContain('22');
  });
  it('shows a dash for missing values', () => {
    expect(formatDate(undefined, 'en')).toBe('—');
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);
  it('slices a page and reports the range', () => {
    const p = paginate(items, 2, 10);
    expect(p.slice).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect([p.from, p.to, p.total, p.pages]).toEqual([11, 20, 23, 3]);
  });
  it('clamps out-of-range pages', () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, -4, 10).page).toBe(1);
  });
  it('handles an empty list', () => {
    const p = paginate([], 1, 10);
    expect([p.from, p.to, p.pages]).toEqual([0, 0, 1]);
  });
});

describe('findingNeedsReview', () => {
  it('flags statuses that need counsel', () => {
    expect(findingNeedsReview(finding({ status: 'NEEDS_REVIEW' }))).toBe(true);
    expect(findingNeedsReview(finding({ status: 'AMBIGUOUS' }))).toBe(true);
    expect(findingNeedsReview(finding({ human_review_required: true }))).toBe(true);
  });
  it('is resolved once approved or rejected', () => {
    expect(findingNeedsReview(finding({ status: 'NEEDS_REVIEW', review_status: 'APPROVED' }))).toBe(false);
    expect(findingNeedsReview(finding({ human_review_required: true, review_status: 'REJECTED' }))).toBe(false);
  });
  it('leaves clean findings alone', () => {
    expect(findingNeedsReview(finding())).toBe(false);
  });
});

describe('bySeverity', () => {
  it('orders most severe first', () => {
    const sorted = [finding({ severity: 'LOW' }), finding({ severity: 'CRITICAL' }), finding({ severity: 'MEDIUM' })].sort(bySeverity);
    expect(sorted.map((f) => f.severity)).toEqual(['CRITICAL', 'MEDIUM', 'LOW']);
  });
});

describe('csvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
  });
  it('passes plain values through and blanks null', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell(null)).toBe('');
    expect(csvCell(0.97)).toBe('0.97');
  });
});

describe('clamp', () => {
  it('bounds a value', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-1, 1, 3)).toBe(1);
  });
});
