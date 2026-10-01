import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { AgentGroupAccess } from '../agent-access';
import { AgentGroupsService } from './agent-groups.service';

const GROUPS: AgentGroupAccess[] = [{ slug: 'HR', name: 'HR', access: 'use', agentSlugs: ['hr_agent'] }];

/** An AgentGroupsService without DI: only what load() reads. */
function service(opts: { platformApiUrl?: string; getAbsolute?: ReturnType<typeof vi.fn> }) {
    const instance = Object.create(AgentGroupsService.prototype) as AgentGroupsService;
    const getAbsolute = opts.getAbsolute ?? vi.fn().mockResolvedValue(GROUPS);
    Object.assign(instance, {
        api: { getAbsolute },
        appConfig: { platformApiUrl: opts.platformApiUrl },
        _groups: signal<AgentGroupAccess[]>([]),
    });
    return { instance, getAbsolute, groups: () => (instance as unknown as { _groups: () => AgentGroupAccess[] })._groups() };
}

describe('AgentGroupsService.load', () => {
    it('reads the signed-in user\'s groups from the Platform', async () => {
        const { instance, getAbsolute, groups } = service({ platformApiUrl: 'https://api.example.test/platform/api/v1' });
        await instance.load();
        expect(getAbsolute).toHaveBeenCalledWith('https://api.example.test/platform/api/v1/agent-groups/me');
        expect(groups()).toEqual(GROUPS);
    });

    it('ignores trailing slashes on the Platform URL', async () => {
        const { instance, getAbsolute } = service({ platformApiUrl: 'https://api.example.test/v1///' });
        await instance.load();
        expect(getAbsolute).toHaveBeenCalledWith('https://api.example.test/v1/agent-groups/me');
    });

    it('has no departments, and makes no request, without a Platform URL (legacy local login)', async () => {
        const { instance, getAbsolute, groups } = service({ platformApiUrl: undefined });
        await instance.load();
        expect(getAbsolute).not.toHaveBeenCalled();
        expect(groups()).toEqual([]);
    });

    it('treats any failure as no departments rather than breaking the landing page', async () => {
        const { instance, groups } = service({
            platformApiUrl: 'https://api.example.test/v1',
            getAbsolute: vi.fn().mockRejectedValue(new Error('403')),
        });
        await instance.load();
        expect(groups()).toEqual([]);
    });
});
