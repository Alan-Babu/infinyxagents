import { describe, expect, it, vi } from 'vitest';

import { InsightsPage } from './insights';

function pageDouble(isAdmin = true): InsightsPage {
  const page = Object.create(InsightsPage.prototype) as InsightsPage;
  Object.assign(page, {
    auth: {
      user: () => ({
        id: ' employee-42 ',
        displayName: 'Aisha Example',
        email: 'aisha@example.test',
      }),
      isLoggedIn: () => true,
      isAdmin: () => isAdmin,
    },
    framework: 'PESTLE',
    frameworkOptions: [],
    provider: 'Claude',
    source: 'Specific URL(s)',
    sections: [],
    turns: [],
    stage: 'idle',
    historyLoadError: '',
    pendingUserMessage: null,
    resultComposerMode: 'refine',
    preparedBy: '  Prepared By Name  ',
    template: 'MoFA',
    briefMarkdown: '# Brief',
    briefTitle: 'Ministerial brief',
    briefSources: [{ title: 'Official source', url: 'https://example.test' }],
    sessionId: 'session-1',
    exportFormat: 'PowerPoint (.pptx)',
    generationMode: 'Presenton',
    exporting: false,
  });
  return page;
}

describe('InsightsPage integration behavior', () => {
  it('maps the authenticated platform identity without using display name', () => {
    const page = pageDouble();

    expect(page.userId).toBe('employee-42');
    expect(page.userName).toBe('Aisha Example');
    expect(page.exportCreatedBy).toBe('Prepared By Name');
  });

  it('restores persisted chat turns and resumes the last brief settings', async () => {
    const page = pageDouble();
    const getConversation = vi.fn().mockResolvedValue({
      conversation_id: 'conversation-7',
      turns: [
        {
          conversation_id: 'conversation-7',
          turn_index: 0,
          session_id: 'session-7',
          kind: 'brief',
          instruction: 'Create a risk brief',
          topic: 'Trade risks',
          title: 'Trade risk brief',
          content_markdown: '## Strengths\nStrong position',
          framework: 'SWOT',
          provider: 'qwen',
          source_selection: 'Web search',
          sources: [{ title: 'Source', url: 'https://example.test/source' }],
          answers: [{ question: 'Audience?', answer: 'Minister' }],
          created_at: '2026-09-03T08:00:00Z',
        },
      ],
    });
    Object.assign(page, { api: { getConversation } });

    await page.loadConversation('conversation-7');

    expect(getConversation).toHaveBeenCalledWith('conversation-7');
    expect(page.conversationId).toBe('conversation-7');
    expect(page.sessionId).toBe('session-7');
    expect(page.activeTopic).toBe('Trade risks');
    expect(page.framework).toBe('SWOT');
    expect(page.provider).toBe('Qwen (local)');
    expect(page.source).toBe('Web search');
    expect(page.stage).toBe('result');
    expect(page.turns).toHaveLength(1);
    expect(page.currentTurn?.answers).toEqual([
      { question: 'Audience?', answer: 'Minister' },
    ]);
    expect(page.sections[0]?.isFrameworkSection).toBe(true);
    expect(page.saveStage).toBe('prompt');
    expect(page.actionStage).toBe('prompt');
    expect(page.scheduleStage).toBe('prompt');
    expect(page.translationState).toBe('idle');
    expect(page.feedbackSubmitted).toBe(false);
    expect(page.feedbackRating).toBe(0);
    expect(page.viewingHistoryIndex).toBeNull();
    expect(page.sourcesOpenTurnId).toBeNull();
    expect(page.expandedTurnId).toBeNull();
    expect(page.forkingTurnId).toBeNull();
    expect(page.pendingUserMessage).toBeNull();
  });

  it('loads optional MCP servers and applies enabled frameworks on init', async () => {
    const page = pageDouble();
    const servers = [{
      id: 'server-1',
      name: 'Research tools',
      auth_type: 'none',
      connection_status: 'connected',
      connection_id: 'connection-1',
      imported_tools: ['search'],
    }];
    Object.assign(page, {
      api: {
        listMcpServers: vi.fn().mockResolvedValue(servers),
        getUserProfile: vi.fn().mockRejectedValue(new Error('not saved')),
        getAdminSettings: vi.fn().mockResolvedValue({
          enabled_frameworks: ['SWOT'],
          allowed_file_types: [],
        }),
        listHistory: vi.fn().mockRejectedValue(new Error('history unavailable')),
      },
      historyEntries: [{ session_id: 'stale' }],
    });

    await page.ngOnInit();

    expect(page.mcpServers).toEqual(servers);
    expect(page.frameworkOptions.map(option => option.label)).toEqual(['SWOT']);
    expect(page.framework).toBe('SWOT');
    expect(page.historyEntries).toEqual([]);
    expect(page.historyLoadError).toBe('history unavailable');
  });

  it('never calls the admin-only settings endpoint for a non-admin', async () => {
    const page = pageDouble(false);
    const getAdminSettings = vi.fn();
    Object.assign(page, {
      api: {
        listMcpServers: vi.fn().mockResolvedValue([]),
        getUserProfile: vi.fn().mockResolvedValue({ expertise_level: 'expert' }),
        getAdminSettings,
        listHistory: vi.fn().mockResolvedValue({ items: [] }),
      },
    });

    await page.ngOnInit();

    expect(page.isAdmin).toBe(false);
    expect(getAdminSettings).not.toHaveBeenCalled();
    expect(page.historyEntries).toEqual([]);
    expect(page.historyLoadError).toBe('');
  });

  it('clears the opposite composer buffer when switching modes', () => {
    const page = pageDouble();
    Object.assign(page, { topic: 'new topic', refineInstruction: 'add risks' });

    page.switchResultComposerMode('new');
    expect(page.refineInstruction).toBe('');
    expect(page.topic).toBe('new topic');

    page.refineInstruction = 'new refinement';
    page.switchResultComposerMode('refine');
    expect(page.topic).toBe('');
    expect(page.refineInstruction).toBe('new refinement');
  });

  it('clears stale moderation and quota state before refining', async () => {
    const page = pageDouble();
    let stateAtRequest: unknown;
    Object.assign(page, {
      refineInstruction: 'Add risks',
      moderationBlocked: true,
      quotaExceeded: true,
      errorMessage: 'old error',
      refineError: 'old refine error',
      api: {
        refine: vi.fn().mockImplementation(() => {
          stateAtRequest = {
            moderationBlocked: page.moderationBlocked,
            quotaExceeded: page.quotaExceeded,
            errorMessage: page.errorMessage,
            refineError: page.refineError,
          };
          return Promise.reject(new Error('request failed'));
        }),
      },
    });

    await page.refineBrief();

    expect(stateAtRequest).toEqual({
      moderationBlocked: false,
      quotaExceeded: false,
      errorMessage: '',
      refineError: '',
    });
  });

  it('normalizes a forked turn provider label', async () => {
    const page = pageDouble();
    const turn = {
      id: 'turn-1',
      kind: 'brief' as const,
      instruction: 'Create brief',
      title: 'Brief',
      markdown: '# Brief',
      html: '<h1>Brief</h1>',
      sessionId: 'session-1',
      framework: 'SWOT',
      provider: 'qwen',
      sourceSelection: 'Web search',
      topic: 'Trade',
      answers: [],
      sources: [],
      createdAt: new Date(),
    };
    Object.assign(page, {
      forkingTurnId: null,
      questions: [],
      answers: {},
      conversationId: 'conversation-1',
      api: {
        fork: vi.fn().mockResolvedValue({
          session_id: 'forked-session',
          title: 'Forked brief',
          content_markdown: '# Forked brief',
        }),
        saveChatTurn: vi.fn().mockResolvedValue({}),
      },
    });

    await page.forkFromTurn(turn);

    expect(page.provider).toBe('Qwen (local)');
  });

  it('exports all current report context and honors Prepared by', async () => {
    const page = pageDouble();
    const exportReport = vi.fn().mockResolvedValue({ file_name: 'brief.pptx' });
    const downloadUrl = vi.fn().mockReturnValue('https://example.test/brief.pptx');
    Object.assign(page, {
      api: { export: exportReport, downloadUrl },
      common: { showApiError: vi.fn() },
    });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    await page.runExport();

    expect(exportReport).toHaveBeenCalledWith(
      'session-1',
      'pptx',
      'MoFA',
      '# Brief',
      'Ministerial brief',
      'Prepared By Name',
      [{ title: 'Official source', url: 'https://example.test' }],
      'presenton',
    );
    expect(downloadUrl).toHaveBeenCalledWith('brief.pptx');
    expect(open).toHaveBeenCalledWith(
      'https://example.test/brief.pptx',
      '_blank',
    );
    expect(page.exporting).toBe(false);
  });
});
