import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';
import { MyActivityPageResponse } from '../models/user-profile-activity.models';

/**
 * The "My Activity" tab's backend lives on ocrbackend, at the same host
 * this app already authenticates against (`agentsapi.nfinyx.ai` IS
 * ocrbackend) -- so this is a normal authenticated call, not a special
 * unauthenticated-host case like digital-attestation's ReviewHub. The
 * endpoint always scopes to the caller's own verified identity server-side;
 * there's no userId param to pass.
 */
@Injectable({ providedIn: 'root' })
export class MyActivityApi extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl('api/v1');
    }

    getMyActivity(params?: {
        startTs?: string;
        endTs?: string;
        limit?: number;
        skip?: number;
    }): Promise<MyActivityPageResponse> {
        return this.get<MyActivityPageResponse>('/my-activity', {
            startTs: params?.startTs,
            endTs: params?.endTs,
            limit: params?.limit,
            skip: params?.skip,
        });
    }
}
