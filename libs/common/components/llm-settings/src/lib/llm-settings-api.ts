import { inject, InjectionToken, Injectable, Provider } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';
import { LlmSettingsResponse, LlmSettingsUpdate, LlmTestResult } from './llm-settings.models';

/** The agent's API path under the platform domain, e.g. `doc-translate/api` (the same segment its own `*ApiBase` uses). */
export const LLM_SETTINGS_SERVICE_PATH = new InjectionToken<string>('LLM_SETTINGS_SERVICE_PATH');

const ADMIN_LLM = '/admin/llm';

@Injectable()
export class LlmSettingsApi extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl(inject(LLM_SETTINGS_SERVICE_PATH));
    }

    load(): Promise<LlmSettingsResponse> {
        return this.get<LlmSettingsResponse>(ADMIN_LLM);
    }

    update(body: LlmSettingsUpdate): Promise<LlmSettingsResponse> {
        return this.put<LlmSettingsResponse>(ADMIN_LLM, body);
    }

    /** Drops the saved overrides: the agent goes back to its `.env` defaults. */
    reset(): Promise<LlmSettingsResponse> {
        return this.delete<LlmSettingsResponse>(ADMIN_LLM);
    }

    test(body: LlmSettingsUpdate): Promise<LlmTestResult> {
        return this.post<LlmTestResult>(`${ADMIN_LLM}/test`, body);
    }
}

/**
 * Route-level providers for the settings page of one agent:
 *   `{ path: 'settings', loadComponent: ..., providers: provideLlmSettings('doc-translate/api') }`
 */
export function provideLlmSettings(servicePath: string): Provider[] {
    return [{ provide: LLM_SETTINGS_SERVICE_PATH, useValue: servicePath }, LlmSettingsApi];
}
