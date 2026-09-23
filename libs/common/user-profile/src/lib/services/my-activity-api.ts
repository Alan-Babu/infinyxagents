import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';
import { MyActivityPageResponse } from '../models/user-profile-activity.models';

/**
 * STOPGAP: "My Activity" reads from the shared Logs DB via an endpoint
 * hosted on HR_AGENT (`GET /api/my-activity`), not ocrbackend, which is
 * where that data actually lives -- `agentsapi.nfinyx.ai` (this app's
 * `APP_CONFIG.baseURL`, where the session token this app already holds is
 * verified) is HR_AGENT's own API, not ocrbackend's (a separate host,
 * `api.nfinyx.ai`, not yet under shared SSO with this one). HR_AGENT hosts
 * the read purely because it's the service this app already has a real
 * session with; see HR_AGENT/app/api/my_activity.py for the full reasoning
 * and how to move this once a real platform gateway/SSO unifies auth.
 * `resolveBaseUrl('api')` matches ApiService's own default, spelled out
 * here so it doesn't silently drift if that default ever changes.
 */
@Injectable({ providedIn: 'root' })
export class MyActivityApi extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl('api');
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
