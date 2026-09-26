/**
 * Per-agent access, as granted by the nfinyx Platform in the token's `scope` list.
 *
 * Scopes (see the Platform's app/core/agent_catalogue.py and nfinyx_agent_toolkit.auth):
 *   `agents:use`   open every agent            `agents:admin`   administer every agent (implies open)
 *   `<slug>:use`   open one agent              `<slug>:admin`   administer one agent (implies open)
 *
 * The tile / route id used in this UI differs from the scope slug, so it is mapped here. The
 * backends enforce this for real (PLATFORM_ENFORCE_AGENT_ACCESS); the UI only hides and guards.
 */
export const AGENT_SLUG_BY_TILE: Readonly<Record<string, string>> = {
    'executive-summary': 'exec_summary',
    'doc-compare': 'doc_compare',
    'digital-attestation': 'digital_attestation',
    'hr-agent': 'hr_agent',
    'doc-intel-agent': 'doc_intel',
    'translator-agent': 'translator',
    'grammar-agent': 'grammar_agent',
    'contract-analyzer': 'contract_analyzer',
    'mofa-chatbot': 'mofa_chatbot',
    'email-compose-agent': 'email_compose',
    'legal-ai': 'legal_ai',
    'asset-intelligence': 'asset_intelligence',
};

export const PLATFORM_USE_SCOPE = 'agents:use';
export const PLATFORM_ADMIN_SCOPE = 'agents:admin';

/** Reads the `scope` claim (a list, or an OAuth-style space-delimited string) from a JWT; [] if absent/unreadable. */
export function scopesFromToken(token: string | null | undefined): string[] {
    if (!token) return [];
    try {
        const [, payload] = token.split('.');
        const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { scope?: unknown };
        if (Array.isArray(claims.scope)) return claims.scope.map(String);
        if (typeof claims.scope === 'string') return claims.scope.split(/\s+/).filter(Boolean);
    } catch {
        // not a JWT we can read: no scopes
    }
    return [];
}

/** True when `scopes` let the user open the agent. An unknown tile (e.g. an in-lab placeholder) is not gated. */
export function canOpenAgentWithScopes(scopes: readonly string[], tileId: string): boolean {
    const slug = AGENT_SLUG_BY_TILE[tileId];
    if (!slug) return true;
    return [PLATFORM_USE_SCOPE, PLATFORM_ADMIN_SCOPE, `${slug}:use`, `${slug}:admin`].some(s => scopes.includes(s));
}

/** True when `scopes` make the user an admin of the agent. */
export function isAgentAdminWithScopes(scopes: readonly string[], tileId: string): boolean {
    const slug = AGENT_SLUG_BY_TILE[tileId];
    if (!slug) return false;
    return [PLATFORM_ADMIN_SCOPE, `${slug}:admin`].some(s => scopes.includes(s));
}
