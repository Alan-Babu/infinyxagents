import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';

/**
 * Shared base for every legal-ai API service — sets the module's base URL once.
 * `APP_CONFIG.baseURL` is the platform's API domain, so this resolves to
 * `{baseURL}/legalai/api` (e.g. `https://agentsapi.nfinyx.ai/legalai/api`).
 */
@Injectable()
export abstract class LegalAiApiBase extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl('legalai/api');
    }
}
