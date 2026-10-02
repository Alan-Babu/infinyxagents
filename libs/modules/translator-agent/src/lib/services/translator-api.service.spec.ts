import { describe, expect, it, vi } from 'vitest';

import { TranslatorApiService } from './translator-api.service';

function serviceDouble(methods: Record<string, unknown>): TranslatorApiService {
  return Object.assign(Object.create(TranslatorApiService.prototype), methods) as TranslatorApiService;
}

describe('TranslatorApiService summary contracts', () => {
  it('lists the available summary types', async () => {
    const get = vi.fn().mockResolvedValue([]);
    await serviceDouble({ get }).getSummaryTypes();
    expect(get).toHaveBeenCalledWith('/documents/summary-types');
  });

  it('lists cached summaries of one document', async () => {
    const get = vi.fn().mockResolvedValue([]);
    await serviceDouble({ get }).listSummaries('doc-1');
    expect(get).toHaveBeenCalledWith('/documents/doc-1/summaries');
  });

  it('generates summaries with the backend field names and does not force regeneration by default', async () => {
    const post = vi.fn().mockResolvedValue({ document_id: 'doc-1', summaries: [], failed: [] });
    await serviceDouble({ post }).generateSummaries('doc-1', ['concise', 'executive']);
    expect(post).toHaveBeenCalledWith('/documents/doc-1/summaries', {
      summary_types: ['concise', 'executive'],
      regenerate: false,
    });
  });

  it('can force a fresh generation', async () => {
    const post = vi.fn().mockResolvedValue({ document_id: 'doc-1', summaries: [], failed: [] });
    await serviceDouble({ post }).generateSummaries('doc-1', ['technical'], true);
    expect(post).toHaveBeenCalledWith('/documents/doc-1/summaries', {
      summary_types: ['technical'],
      regenerate: true,
    });
  });

  it('deletes one summary type', async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    await serviceDouble({ delete: del }).deleteSummary('doc-1', 'key_points');
    expect(del).toHaveBeenCalledWith('/documents/doc-1/summaries/key_points');
  });
});

describe('TranslatorApiService existing contracts stay unchanged', () => {
  it('detects with a multipart upload_ref', async () => {
    const postFormData = vi.fn().mockResolvedValue({});
    await serviceDouble({ postFormData }).detectDocument('ref-1');
    const [path, body] = postFormData.mock.calls[0] as [string, FormData];
    expect(path).toBe('/documents/detect');
    expect(body.get('upload_ref')).toBe('ref-1');
  });

  it('translates selected pages as a comma list, or all pages when none are given', async () => {
    const postFormData = vi.fn().mockResolvedValue({});
    const service = serviceDouble({ postFormData });
    await service.translateDocument('ref-1', [1, 3]);
    await service.translateDocument('ref-1');
    const [, selected] = postFormData.mock.calls[0] as [string, FormData];
    const [path, all] = postFormData.mock.calls[1] as [string, FormData];
    expect(path).toBe('/documents/translate');
    expect(selected.get('pages_to_translate')).toBe('1,3');
    expect(all.has('pages_to_translate')).toBe(false);
  });

  it('asks questions and reads the review queue with the existing paths', async () => {
    const post = vi.fn().mockResolvedValue({});
    const get = vi.fn().mockResolvedValue({});
    const service = serviceDouble({ post, get });
    await service.askDocument('doc-1', 'Who?');
    await service.getReviewQueue(2, 5);
    expect(post).toHaveBeenCalledWith('/documents/doc-1/ask', { question: 'Who?' });
    expect(get).toHaveBeenCalledWith('/documents/review-queue', { page: 2, page_size: 5 });
  });
});
