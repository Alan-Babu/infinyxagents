import { describe, expect, it, vi } from 'vitest';

import { HistoryPanelComponent } from './history-panel';

function componentDouble(): HistoryPanelComponent {
  const component = Object.create(
    HistoryPanelComponent.prototype,
  ) as HistoryPanelComponent;
  Object.assign(component, {
    researchQuery: '  trade  ',
    researchCategory: 'business',
    researchType: 'Trade',
    researchFramework: 'SWOT',
    researchVisibility: 'private',
    entries: [],
    entriesTotal: 0,
    entriesPage: 1,
    entriesHasMore: false,
    entriesLoading: false,
    chatsQuery: '  cabinet  ',
    conversations: [],
    conversationsTotal: 0,
    conversationsPage: 1,
    conversationsHasMore: false,
    conversationsLoading: false,
  });
  return component;
}

describe('HistoryPanelComponent pagination', () => {
  it('parses paginated research responses and calculates the requested offset', async () => {
    const component = componentDouble();
    const item = {
      session_id: 'session-1',
      name: 'Trade brief',
      research_type: 'Trade' as const,
      visibility: 'private' as const,
      framework: 'SWOT' as const,
      word_count: 250,
      created_at: '2026-09-03T08:00:00Z',
    };
    const searchHistory = vi.fn().mockResolvedValue({
      items: [item],
      total: 9,
      limit: 4,
      offset: 4,
      has_more: true,
    });
    Object.assign(component, { api: { searchHistory } });

    await component.loadResearch(2);

    expect(searchHistory).toHaveBeenCalledWith({
      q: 'trade',
      category: 'business',
      research_type: 'Trade',
      framework: 'SWOT',
      visibility: 'private',
      limit: 4,
      offset: 4,
    });
    expect(component.entries).toEqual([item]);
    expect(component.entriesTotal).toBe(9);
    expect(component.entriesHasMore).toBe(true);
    expect(component.entriesPage).toBe(2);
    expect(component.totalResearchPages).toBe(3);
    expect(component.entriesLoading).toBe(false);
  });

  it('parses paginated conversation responses', async () => {
    const component = componentDouble();
    const conversation = {
      conversation_id: 'conversation-1',
      title: 'Cabinet briefing',
      turn_count: 3,
      last_kind: 'brief' as const,
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-03T08:00:00Z',
    };
    const searchConversations = vi.fn().mockResolvedValue({
      items: [conversation],
      total: 6,
      limit: 4,
      offset: 4,
      has_more: true,
    });
    Object.assign(component, { api: { searchConversations } });

    await component.loadConversations(2);

    expect(searchConversations).toHaveBeenCalledWith({
      q: 'cabinet',
      limit: 4,
      offset: 4,
    });
    expect(component.conversations).toEqual([conversation]);
    expect(component.conversationsTotal).toBe(6);
    expect(component.conversationsHasMore).toBe(true);
    expect(component.conversationsPage).toBe(2);
    expect(component.totalConversationPages).toBe(2);
    expect(component.conversationsLoading).toBe(false);
  });
});
