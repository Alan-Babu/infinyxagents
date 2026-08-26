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
    authTokenURL: string;
    redirectURL?: string;
    logoutURL?: string;
    joburl: string;
    newwindow: boolean;
    isInDevelopment: boolean;
    appId: string;
}