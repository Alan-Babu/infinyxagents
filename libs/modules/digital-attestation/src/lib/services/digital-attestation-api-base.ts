import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';

/**
 * Shared base for every digital-attestation API service — sets the module's base URL once.
 *
 * The verification-workflows backend currently lives on a different host than the rest of
 * the platform's agents (`APP_CONFIG.baseURL`), so this is hardcoded here rather than
 * composed via `resolveBaseUrl()`. It's expected to move under the same domain later, at
 * which point this should go back to `this.resolveBaseUrl('attestation/api')`.
 */
@Injectable()
export abstract class DigitalAttestationApiBase extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        // this.baseURL = this.resolveBaseUrl('attestation/api');
        this.baseURL = 'https://api.nfinyx.ai/platform/api/v1/verification-workflows';
    }
}
