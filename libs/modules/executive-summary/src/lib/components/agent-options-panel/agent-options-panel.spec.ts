import { describe, expect, it, vi } from 'vitest';

import { AgentOptionsPanelComponent } from './agent-options-panel';
import type { McpServerEntry } from '../../models/executive-summary.models';

describe('AgentOptionsPanelComponent', () => {
  it('initializes tool state safely when fetching tools fails', async () => {
    const component = Object.create(AgentOptionsPanelComponent.prototype) as AgentOptionsPanelComponent;
    const server = {
      id: 'server-1',
      name: 'Research tools',
      connection_id: 'connection-1',
      connection_status: 'connected',
      imported_tools: ['search'],
    } as McpServerEntry;
    Object.assign(component, {
      api: {
        listMcpConnectionTools: vi.fn().mockRejectedValue(new Error('unavailable')),
      },
      toolsOpen: {},
      tools: {},
      selectedTools: {},
      toolsLoading: null,
      error: '',
    });

    await component.viewTools(server);

    expect(component.tools['server-1']).toEqual([]);
    expect(component.selectedTools['server-1'].has('search')).toBe(true);
    expect(component.error).toBe('unavailable');
  });
});
