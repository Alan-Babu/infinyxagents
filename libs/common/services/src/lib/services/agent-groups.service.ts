import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { AgentGroupAccess, departmentsFromGroups } from '../agent-access';
import { ApiService } from '../api';
import { APP_CONFIG } from '../app-config';
import { AuthService } from './auth.service';

/**
 * The department groups (HR, Finance, ...) the signed-in user can reach, for the agents landing page.
 *
 * Display only. Access to an agent is decided by the token's scopes (see `AuthService.canOpenAgent`);
 * the Platform expands a group grant into ordinary per-agent scopes at login, so nothing here gates a
 * route. Needs `platformApiUrl` (the Platform is where groups live); without it there are no departments.
 */
@Injectable({ providedIn: 'root' })
export class AgentGroupsService {
    private readonly api = inject(ApiService);
    private readonly appConfig = inject(APP_CONFIG);
    private readonly auth = inject(AuthService);

    private readonly _groups = signal<AgentGroupAccess[]>([]);
    readonly groups = this._groups.asReadonly();

    /** Landing-page departments: groups mapped to this UI's tiles, limited to tiles the user can open. */
    readonly departments = computed(() =>
        departmentsFromGroups(this._groups(), tileId => this.auth.canOpenAgent(tileId)),
    );

    constructor() {
        // Reload whenever the signed-in token changes (login, refresh, logout).
        effect(() => {
            const token = this.auth.accessToken();
            untracked(() => {
                if (token) void this.load();
                else this._groups.set([]);
            });
        });
    }

    /** Fetches `GET {platformApiUrl}/agent-groups/me`; any failure just means no departments. */
    async load(): Promise<void> {
        const root = this.appConfig.platformApiUrl?.replace(/\/+$/, '');
        if (!root) {
            this._groups.set([]);
            return;
        }
        try {
            this._groups.set(await this.api.getAbsolute<AgentGroupAccess[]>(`${root}/agent-groups/me`));
        } catch {
            this._groups.set([]);
        }
    }
}
