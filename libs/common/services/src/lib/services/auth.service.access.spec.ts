import { describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';

/** An AuthService without DI: only what canOpenAgent / isAgentAdmin read. */
function service(opts: { enforce: boolean; scopes: string[]; hrAdmin?: boolean }) {
    const instance = Object.create(AuthService.prototype) as AuthService;
    Object.assign(instance, {
        appConfig: { enforceAgentAccess: opts.enforce },
        scopes: () => opts.scopes,
        isAdmin: () => opts.hrAdmin === true,
    });
    return instance;
}

describe('AuthService per-agent access', () => {
    it('lets everyone open every agent while enforcement is off (the default)', () => {
        const auth = service({ enforce: false, scopes: [] });
        expect(auth.canOpenAgent('doc-intel-agent')).toBe(true);
        expect(auth.canOpenAgent('legal-ai')).toBe(true);
    });

    it('keeps the old global admin rule while enforcement is off', () => {
        expect(service({ enforce: false, scopes: [], hrAdmin: true }).isAgentAdmin('doc-intel-agent')).toBe(true);
        expect(service({ enforce: false, scopes: ['doc_intel:admin'] }).isAgentAdmin('doc-intel-agent')).toBe(false);
    });

    it('opens only the agents the token includes once enforcement is on', () => {
        const auth = service({ enforce: true, scopes: ['doc_intel:use', 'legal_ai:admin'] });
        expect(auth.canOpenAgent('doc-intel-agent')).toBe(true);
        expect(auth.canOpenAgent('legal-ai')).toBe(true); // admin implies open
        expect(auth.canOpenAgent('mofa-chatbot')).toBe(false);
    });

    it('opens every agent with agents:use, and administers every agent with agents:admin', () => {
        expect(service({ enforce: true, scopes: ['agents:use'] }).canOpenAgent('mofa-chatbot')).toBe(true);
        expect(service({ enforce: true, scopes: ['agents:use'] }).isAgentAdmin('mofa-chatbot')).toBe(false);
        expect(service({ enforce: true, scopes: ['agents:admin'] }).isAgentAdmin('mofa-chatbot')).toBe(true);
    });

    it('a use-only scope is not admin, and a role with no agent scope opens nothing', () => {
        const auth = service({ enforce: true, scopes: ['doc_intel:use'] });
        expect(auth.isAgentAdmin('doc-intel-agent')).toBe(false);
        expect(service({ enforce: true, scopes: [] }).canOpenAgent('doc-intel-agent')).toBe(false);
    });

    it('an admin HR profile may open HR Agent without a use scope (mirrors the backend), but no other agent', () => {
        const auth = service({ enforce: true, scopes: [], hrAdmin: true });
        expect(auth.canOpenAgent('hr-agent')).toBe(true);
        expect(auth.isAgentAdmin('hr-agent')).toBe(true);
        expect(auth.canOpenAgent('doc-intel-agent')).toBe(false);
        expect(auth.isAgentAdmin('doc-intel-agent')).toBe(false);
    });

    it('does not gate an unknown (in-lab) tile', () => {
        expect(service({ enforce: true, scopes: [] }).canOpenAgent('nx-fin-ai')).toBe(true);
    });
});
