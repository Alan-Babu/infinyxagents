import { describe, expect, it } from 'vitest';

import {
    AGENT_SLUG_BY_TILE,
    AgentGroupAccess,
    canOpenAgentWithScopes,
    departmentsFromGroups,
    isAgentAdminWithScopes,
    scopesFromToken,
} from './agent-access';

function tokenWith(claims: Record<string, unknown>): string {
    const encode = (value: unknown) =>
        btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encode({ alg: 'RS256' })}.${encode(claims)}.signature`;
}

describe('scopesFromToken', () => {
    it('reads a scope list', () => {
        expect(scopesFromToken(tokenWith({ scope: ['agents:use', 'doc_intel:admin'] }))).toEqual([
            'agents:use',
            'doc_intel:admin',
        ]);
    });

    it('reads an OAuth-style space-delimited string', () => {
        expect(scopesFromToken(tokenWith({ scope: 'agents:use  legal_ai:use' }))).toEqual([
            'agents:use',
            'legal_ai:use',
        ]);
    });

    it.each([undefined, null, '', 'not-a-jwt', 'a.b.c'])('returns [] for %s', token => {
        expect(scopesFromToken(token)).toEqual([]);
    });

    it('returns [] when the token has no scope claim', () => {
        expect(scopesFromToken(tokenWith({ sub: 'u1' }))).toEqual([]);
    });
});

describe('canOpenAgentWithScopes', () => {
    it.each([
        [['agents:use'], true],
        [['agents:admin'], true],
        [['doc_intel:use'], true],
        [['doc_intel:admin'], true],
        [[], false],
        [['legal_ai:use'], false],
        [['legal_ai:admin'], false],
        [['hr_agent:simulate'], false],
    ])('doc-intel-agent with %j -> %s', (scopes, expected) => {
        expect(canOpenAgentWithScopes(scopes, 'doc-intel-agent')).toBe(expected);
    });

    it('does not gate a tile it does not know (an in-lab placeholder)', () => {
        expect(canOpenAgentWithScopes([], 'nx-fin-ai')).toBe(true);
    });
});

describe('isAgentAdminWithScopes', () => {
    it.each([
        [['agents:admin'], true],
        [['doc_intel:admin'], true],
        [['doc_intel:use'], false],
        [['agents:use'], false],
        [['legal_ai:admin'], false],
        [[], false],
    ])('doc-intel-agent with %j -> %s', (scopes, expected) => {
        expect(isAgentAdminWithScopes(scopes, 'doc-intel-agent')).toBe(expected);
    });

    it('is false for an unknown tile', () => {
        expect(isAgentAdminWithScopes(['agents:admin'], 'nx-fin-ai')).toBe(false);
    });
});

describe('tile -> scope slug mapping', () => {
    it('has a unique slug per tile, in the snake_case the backends use', () => {
        const slugs = Object.values(AGENT_SLUG_BY_TILE);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const slug of slugs) expect(slug).toMatch(/^[a-z]+(_[a-z]+)*$/);
    });

    it('matches the backend catalogue for the agents that enforce access', () => {
        // backend/app/core/agent_catalogue.py: <slug>:use / <slug>:admin are what the agent backends check.
        expect(AGENT_SLUG_BY_TILE['executive-summary']).toBe('exec_summary');
        expect(AGENT_SLUG_BY_TILE['doc-intel-agent']).toBe('doc_intel');
        expect(AGENT_SLUG_BY_TILE['mofa-chatbot']).toBe('mofa_chatbot');
        expect(AGENT_SLUG_BY_TILE['legal-ai']).toBe('legal_ai');
        expect(AGENT_SLUG_BY_TILE['grammar-agent']).toBe('grammar_agent');
        expect(AGENT_SLUG_BY_TILE['translator-agent']).toBe('translator');
    });
});

// Department groups: the Platform expands a group grant into ordinary per-agent scopes at login, so
// the existing scope checks already do the right thing; groups only drive the landing-page chips.
describe('group grants arrive as per-agent scopes', () => {
    // What the Platform puts in the token for a role holding AGENTS_USE_GROUP_HR (hr_agent, legal_ai)
    // plus AGENTS_ADMIN_GROUP_FINANCE (legal_ai, contract_analyzer): the strongest scope per agent.
    const scopes = ['hr_agent:use', 'contract_analyzer:admin', 'legal_ai:admin'];

    it('opens exactly the agents of the held groups', () => {
        expect(canOpenAgentWithScopes(scopes, 'hr-agent')).toBe(true);
        expect(canOpenAgentWithScopes(scopes, 'legal-ai')).toBe(true);
        expect(canOpenAgentWithScopes(scopes, 'contract-analyzer')).toBe(true);
        expect(canOpenAgentWithScopes(scopes, 'doc-intel-agent')).toBe(false);
    });

    it('administers only what a group admin grant covers (admin beats use for an agent in two groups)', () => {
        expect(isAgentAdminWithScopes(scopes, 'legal-ai')).toBe(true);
        expect(isAgentAdminWithScopes(scopes, 'contract-analyzer')).toBe(true);
        expect(isAgentAdminWithScopes(scopes, 'hr-agent')).toBe(false);
    });
});

describe('departmentsFromGroups', () => {
    const groups: AgentGroupAccess[] = [
        { slug: 'HR', name: 'HR', access: 'use', agentSlugs: ['hr_agent', 'legal_ai'] },
        { slug: 'FINANCE', name: 'Finance', access: 'admin', agentSlugs: ['legal_ai', 'contract_analyzer'] },
        { slug: 'EMPTY', name: 'Empty', access: 'use', agentSlugs: [] },
    ];

    it('maps agent slugs to tile ids and lists an agent in every group it belongs to', () => {
        const result = departmentsFromGroups(groups);
        expect(result.map(d => d.slug)).toEqual(['HR', 'FINANCE']);
        expect(result[0].tileIds).toEqual(['hr-agent', 'legal-ai']);
        expect(result[1].tileIds).toEqual(['legal-ai', 'contract-analyzer']);
        expect(result[1].access).toBe('admin');
    });

    it('omits a department with no agents, so a chip never leads to an empty page', () => {
        expect(departmentsFromGroups(groups).some(d => d.slug === 'EMPTY')).toBe(false);
    });

    it('drops tiles the user cannot open, and the department if none are left', () => {
        const onlyLegal = departmentsFromGroups(groups, tileId => tileId === 'legal-ai');
        expect(onlyLegal.map(d => [d.slug, d.tileIds])).toEqual([
            ['HR', ['legal-ai']],
            ['FINANCE', ['legal-ai']],
        ]);
        expect(departmentsFromGroups(groups, () => false)).toEqual([]);
    });

    it('skips an agent slug that has no tile in this UI', () => {
        const result = departmentsFromGroups([
            { slug: 'OPS', name: 'Ops', access: 'use', agentSlugs: ['retired_agent', 'translator'] },
        ]);
        expect(result[0].tileIds).toEqual(['translator-agent']);
    });
});
