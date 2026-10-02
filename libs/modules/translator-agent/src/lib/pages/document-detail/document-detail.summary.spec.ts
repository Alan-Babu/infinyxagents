import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SummaryEntry, SummaryType } from '../../models/translator.models';
import { DocumentDetailPage } from './document-detail';

function entry(type: SummaryType, overrides: Partial<SummaryEntry> = {}): SummaryEntry {
  return {
    id: `id-${type}`,
    document_id: 'doc-1',
    summary_type: type,
    summary: `${type} text`,
    line_count: 1,
    model: 'qwen',
    cached: false,
    stale: false,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    ...overrides,
  };
}

interface Harness {
  page: DocumentDetailPage;
  api: { generateSummaries: ReturnType<typeof vi.fn>; deleteSummary: ReturnType<typeof vi.fn> };
  toastr: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
}

/** The component builds its dependencies with inject(), so tests assemble the instance by hand. */
function harness(state: Partial<DocumentDetailPage> = {}): Harness {
  const api = { generateSummaries: vi.fn(), deleteSummary: vi.fn() };
  const toastr = { success: vi.fn(), error: vi.fn() };
  const translate = { instant: vi.fn((key: string) => key) };
  const page = Object.assign(Object.create(DocumentDetailPage.prototype), {
    api,
    toastr,
    translate,
    doc: { id: 'doc-1', translated_pages: [] },
    summaryTypes: ['concise', 'numerical_analysis', 'detailed_concise', 'executive', 'key_points', 'technical'],
    selectedSummaryTypes: new Set<SummaryType>(['concise']),
    summaries: [] as SummaryEntry[],
    summaryFailures: [],
    generatingSummary: false,
    copiedSummaryType: null,
    ...state,
  }) as DocumentDetailPage;
  return { page, api, toastr };
}

describe('DocumentDetailPage summaries', () => {
  beforeEach(() => vi.useRealTimers());

  it('toggles summary types without mutating the previous selection', () => {
    const { page } = harness();
    const before = page.selectedSummaryTypes;
    page.toggleSummaryType('executive');
    expect(page.isSummaryTypeSelected('executive')).toBe(true);
    expect(before.has('executive')).toBe(false);
    page.toggleSummaryType('executive');
    expect(page.isSummaryTypeSelected('executive')).toBe(false);
  });

  it('shows only selected summaries, in canonical order', () => {
    const { page } = harness({
      selectedSummaryTypes: new Set<SummaryType>(['technical', 'concise']),
      summaries: [entry('technical'), entry('executive'), entry('concise')],
    });
    expect(page.visibleSummaries.map((s) => s.summary_type)).toEqual(['concise', 'technical']);
  });

  it('first generates, then offers regeneration once every selected type has a summary', () => {
    const empty = harness();
    expect(empty.page.allSelectedSummarized).toBe(false);
    const done = harness({ summaries: [entry('concise')] });
    expect(done.page.allSelectedSummarized).toBe(true);
    const partial = harness({
      selectedSummaryTypes: new Set<SummaryType>(['concise', 'executive']),
      summaries: [entry('concise')],
    });
    expect(partial.page.allSelectedSummarized).toBe(false);
    const none = harness({ selectedSummaryTypes: new Set<SummaryType>() });
    expect(none.page.allSelectedSummarized).toBe(false);
  });

  it('requests the selected types in canonical order and stores the results', async () => {
    const { page, api, toastr } = harness({ selectedSummaryTypes: new Set<SummaryType>(['executive', 'concise']) });
    api.generateSummaries.mockResolvedValue({
      document_id: 'doc-1',
      summaries: [entry('concise'), entry('executive')],
      failed: [],
    });

    await page.generateSummaries();

    expect(api.generateSummaries).toHaveBeenCalledWith('doc-1', ['concise', 'executive'], false);
    expect(page.summaries.map((s) => s.summary_type).sort()).toEqual(['concise', 'executive']);
    expect(page.generatingSummary).toBe(false);
    expect(toastr.success).toHaveBeenCalled();
  });

  it('replaces an existing summary when regenerating', async () => {
    const { page, api } = harness({ summaries: [entry('concise', { summary: 'old' })] });
    api.generateSummaries.mockResolvedValue({
      document_id: 'doc-1',
      summaries: [entry('concise', { summary: 'new' })],
      failed: [],
    });

    await page.generateSummaries();

    expect(api.generateSummaries).toHaveBeenCalledWith('doc-1', ['concise'], true);
    expect(page.summaries).toHaveLength(1);
    expect(page.summaries[0].summary).toBe('new');
  });

  it('keeps the successes and reports the types that failed', async () => {
    const { page, api, toastr } = harness({ selectedSummaryTypes: new Set<SummaryType>(['concise', 'key_points']) });
    api.generateSummaries.mockResolvedValue({
      document_id: 'doc-1',
      summaries: [entry('concise')],
      failed: [{ summary_type: 'key_points', error_code: 'LLM_SERVICE_ERROR', message: 'model down' }],
    });

    await page.generateSummaries();

    expect(page.summaries.map((s) => s.summary_type)).toEqual(['concise']);
    expect(page.summaryFailures).toHaveLength(1);
    expect(toastr.error).not.toHaveBeenCalled();
  });

  it('surfaces the backend error message when everything fails', async () => {
    const { page, api, toastr } = harness();
    api.generateSummaries.mockRejectedValue({ message: 'LLM service error: HTTP 500' });

    await page.generateSummaries();

    expect(toastr.error).toHaveBeenCalledWith('LLM service error: HTTP 500');
    expect(page.generatingSummary).toBe(false);
  });

  it('ignores clicks while a request is running or nothing is selected', async () => {
    const busy = harness({ generatingSummary: true });
    await busy.page.generateSummaries();
    const none = harness({ selectedSummaryTypes: new Set<SummaryType>() });
    await none.page.generateSummaries();
    expect(busy.api.generateSummaries).not.toHaveBeenCalled();
    expect(none.api.generateSummaries).not.toHaveBeenCalled();
  });

  it('deletes a summary and drops it from the list', async () => {
    const { page, api } = harness({ summaries: [entry('concise'), entry('executive')] });
    api.deleteSummary.mockResolvedValue(undefined);

    await page.deleteSummary('concise');

    expect(api.deleteSummary).toHaveBeenCalledWith('doc-1', 'concise');
    expect(page.summaries.map((s) => s.summary_type)).toEqual(['executive']);
  });

  it('keeps the summary and shows the error when deletion fails', async () => {
    const { page, api, toastr } = harness({ summaries: [entry('concise')] });
    api.deleteSummary.mockRejectedValue({ message: 'nope' });

    await page.deleteSummary('concise');

    expect(page.summaries).toHaveLength(1);
    expect(toastr.error).toHaveBeenCalledWith('nope');
  });

  it('detects pages that were already English and returned as-is', () => {
    const { page } = harness({
      doc: {
        id: 'doc-1',
        translated_pages: [
          { page_num: 1, translated_text: 'a', skipped: true },
          { page_num: 2, translated_text: 'b' },
        ],
      } as never,
    });
    expect(page.isPageSkipped(1)).toBe(true);
    expect(page.isPageSkipped(2)).toBe(false);
    expect(page.isPageSkipped(9)).toBe(false);
  });
});
