import { describe, expect, it, vi } from 'vitest';

import { ExecSummaryApiService } from './exec-summary-api.service';

function serviceDouble(): ExecSummaryApiService {
  return Object.create(ExecSummaryApiService.prototype) as ExecSummaryApiService;
}

describe('ExecSummaryApiService contracts', () => {
  it('sends paginated history filters using backend query names', async () => {
    const service = serviceDouble();
    const get = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      limit: 4,
      offset: 8,
      has_more: false,
    });
    Object.assign(service, { get });

    await service.listHistory({
      q: 'trade',
      category: 'business',
      research_type: 'Trade',
      framework: 'SWOT',
      visibility: 'private',
      limit: 4,
      offset: 8,
    });

    expect(get).toHaveBeenCalledWith('/history', {
      q: 'trade',
      category: 'business',
      research_type: 'Trade',
      framework: 'SWOT',
      visibility: 'private',
      limit: 4,
      offset: 8,
    });
  });

  it('uses default history pagination and chat pagination contracts', async () => {
    const service = serviceDouble();
    const get = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      limit: 100,
      offset: 0,
      has_more: false,
    });
    Object.assign(service, { get });

    await service.listHistory();
    await service.searchConversations({ q: 'cabinet', limit: 4, offset: 12 });

    expect(get).toHaveBeenNthCalledWith(1, '/history', {
      q: undefined,
      category: undefined,
      research_type: undefined,
      framework: undefined,
      visibility: undefined,
      limit: 100,
      offset: 0,
    });
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/chat-history/conversations',
      { q: 'cabinet', limit: 4, offset: 12 },
    );
  });

  it('preserves the full chat turn persistence payload', async () => {
    const service = serviceDouble();
    const post = vi.fn().mockResolvedValue({});
    Object.assign(service, { post });
    const payload = {
      conversation_id: 'conversation/1',
      turn_index: 2,
      session_id: 'session-3',
      kind: 'brief' as const,
      instruction: 'Add risks',
      topic: 'UAE trade',
      title: 'Trade brief',
      content_markdown: '# Trade brief',
      framework: 'SWOT',
      provider: 'Qwen (local)',
      source_selection: 'Web search',
      sources: [{ title: 'Source', url: 'https://example.test' }],
      answers: [{ question: 'Audience?', answer: 'Minister' }],
    };

    await service.saveChatTurn(payload);

    expect(post).toHaveBeenCalledWith('/chat-history/turn', payload);
  });

  it('encodes dynamic path segments for history, chat, export, and download', async () => {
    const service = serviceDouble();
    const get = vi.fn().mockResolvedValue({});
    const post = vi.fn().mockResolvedValue({});
    Object.assign(service, {
      baseURL: 'https://agents.example/exec-agent/api',
      get,
      post,
    });

    await service.getHistoryDetail('saved/report');
    await service.getConversation('conversation/one');
    await service.export('session/one', 'pdf');

    expect(get).toHaveBeenNthCalledWith(1, '/history/saved%2Freport');
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/chat-history/conversations/conversation%2Fone',
    );
    expect(post).toHaveBeenCalledWith(
      '/session/session%2Fone/export',
      expect.any(Object),
    );
    expect(service.downloadUrl('brief final.pdf')).toBe(
      'https://agents.example/exec-agent/api/download/brief%20final.pdf',
    );
  });

  it('sends the complete export body including explicit nulls', async () => {
    const service = serviceDouble();
    const post = vi.fn().mockResolvedValue({});
    Object.assign(service, { post });
    const sources = [{ title: 'Official source', url: 'https://example.test/a' }];

    await service.export(
      'session-1',
      'pptx',
      'MoFA',
      '# Brief',
      'Ministerial brief',
      'Aisha Example',
      sources,
      'presenton',
      'L2: Internal',
    );

    expect(post).toHaveBeenCalledWith('/session/session-1/export', {
      format: 'pptx',
      template: 'MoFA',
      content_markdown: '# Brief',
      title: 'Ministerial brief',
      created_by: 'Aisha Example',
      sources,
      export_engine: 'presenton',
      classification: 'L2: Internal',
    });
  });

  it('maps the authenticated platform user ID into session start', async () => {
    const service = serviceDouble();
    const post = vi.fn().mockResolvedValue({});
    Object.assign(service, { post });

    await service.startSession('Trade outlook', 'qwen', 'employee-42');

    expect(post).toHaveBeenCalledWith('/session/start', {
      topic: 'Trade outlook',
      provider: 'qwen',
      user_id: 'employee-42',
    });
  });

  it('uses backend anonymous semantics for blank required ownership fields', async () => {
    const service = serviceDouble();
    const post = vi.fn().mockResolvedValue({});
    Object.assign(service, { post });

    await service.startSession('Trade outlook', 'qwen', '   ');
    await service.generate('session-1', {
      length: 'executive',
      framework: 'PESTLE',
      output_format: 'html',
      provider: 'qwen',
      user_id: '',
    });
    await service.createTask('session-1', 'Review brief', ['Aisha'], undefined, undefined, undefined, undefined, '');

    expect(post).toHaveBeenNthCalledWith(1, '/session/start', {
      topic: 'Trade outlook',
      provider: 'qwen',
      user_id: 'anonymous',
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/session/session-1/generate',
      expect.objectContaining({ user_id: 'anonymous' }),
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      '/session/session-1/task',
      expect.objectContaining({ created_by: 'anonymous' }),
    );
  });
});
