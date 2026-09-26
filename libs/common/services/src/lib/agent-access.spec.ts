import { describe, expect, it } from 'vitest';

import {
    AGENT_SLUG_BY_TILE,
    canOpenAgentWithScopes,
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
