export interface RecaptchaCfg {
    siteKey: string;
}

export interface AppDetailsCfg {
    version: string;
    year: string;
    idletime_out?: number;
    session_timeout?: number;
}

export interface AppConfig {
    production: boolean;
    appdetails: AppDetailsCfg;
    recaptcha: RecaptchaCfg;
    /** Root API domain only (e.g. `https://agentsapi.nfinyx.ai`) — no `/api` or per-agent segment. Each ApiService subclass appends its own via `resolveBaseUrl()`. */
    baseURL: string;
    /**
     * nfinyx Platform API root (the identity provider), e.g. `https://api.nfinyx.ai/platform/api/v1`.
     * When set, sign-in goes through `{platformApiUrl}/auth/agents/login` and the resulting token is
     * accepted by both the platform (ReviewHub) and the agent backends. When unset, the legacy
     * local `/auth/token` login is used.
     */
    platformApiUrl?: string;
    /**
     * Hide agents the user's role does not include, and block their routes (tiles + route guard driven by the
     * token's scopes). Off by default. Turn on together with the backends' PLATFORM_ENFORCE_AGENT_ACCESS, and only
     * after the Platform roles carry the new permissions and users have signed in again.
     */
    enforceAgentAccess?: boolean;
    authTokenURL: string;
    redirectURL?: string;
    logoutURL?: string;
    joburl: string;
    newwindow: boolean;
    isInDevelopment: boolean;
    appId: string;
}