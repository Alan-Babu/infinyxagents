import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AuthService } from '../services/auth.service';
import { requireAdminGuard } from './require-admin.guard';
import { requireAgentAccessGuard } from './require-agent-access.guard';

function run(guard: typeof requireAgentAccessGuard, auth: Partial<AuthService>, data: Record<string, unknown>) {
    const injector = Injector.create({
        providers: [
            { provide: AuthService, useValue: auth },
            { provide: Router, useValue: { parseUrl: (url: string) => `redirect:${url}` } },
        ],
    });
    const route = { data } as unknown as ActivatedRouteSnapshot;
    return runInInjectionContext(injector, () => guard(route, {} as RouterStateSnapshot));
}

describe('requireAgentAccessGuard', () => {
    it('lets the user in when the role includes the agent', () => {
        const auth = { canOpenAgent: (id: string) => id === 'doc-intel-agent' };
        expect(run(requireAgentAccessGuard, auth, { agentId: 'doc-intel-agent' })).toBe(true);
    });

    it('sends the user to the (ungated) dashboard when it does not', () => {
        const auth = { canOpenAgent: () => false };
        expect(run(requireAgentAccessGuard, auth, { agentId: 'legal-ai' })).toBe('redirect:/dashboard');
    });

    it('does nothing on a route that names no agent', () => {
        const auth = { canOpenAgent: () => false };
        expect(run(requireAgentAccessGuard, auth, {})).toBe(true);
    });
});

describe('requireAdminGuard', () => {
    const auth = {
        isAdmin: () => false,
        isAgentAdmin: (id: string) => id === 'doc-intel-agent',
    } as Partial<AuthService>;

    it('uses the agent admin rule when the route names its agent', () => {
        expect(run(requireAdminGuard, auth, { agentId: 'doc-intel-agent' })).toBe(true);
        expect(run(requireAdminGuard, auth, { agentId: 'mofa-chatbot' })).toBe('redirect:/dashboard');
    });

    it('keeps the old global admin rule without an agentId', () => {
        expect(run(requireAdminGuard, { ...auth, isAdmin: () => true }, {})).toBe(true);
        expect(run(requireAdminGuard, auth, {})).toBe('redirect:/dashboard');
    });
});
