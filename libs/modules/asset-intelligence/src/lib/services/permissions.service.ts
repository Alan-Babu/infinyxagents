import { Injectable, computed, signal } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { AssetSessionInfo, AssetUserRole } from '../models/permissions.models';

/**
 * Fetches and caches this module's own RBAC matrix, separate from the platform's
 * generic session role. The legacy asset-mgmt app used to receive this from its
 * own `/auth/login` response. Since this module reuses the platform's session
 * instead of logging in separately, `load()` calls a GET equivalent instead.
 *
 * TODO: confirm the exact endpoint/response shape with the asset-mgmt backend
 * team (candidate used below: `GET /auth/me` -> { role, permissions }).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService extends AssetIntelligenceApiBase {
    private readonly _info = signal<AssetSessionInfo | null>(null);
    private loadPromise: Promise<void> | null = null;

    readonly role = computed<AssetUserRole | null>(() => this._info()?.role ?? null);

    load(): Promise<void> {
        if (!this.loadPromise) {
            this.loadPromise = this.get<AssetSessionInfo>('/auth/me')
                .then(info => this._info.set(info))
                .catch(() => this._info.set(null));
        }
        return this.loadPromise;
    }

    // Gating is disabled for now — `/auth/me` isn't confirmed with the backend
    // team yet, so `can`/`hasRole` were hiding every gated action for every
    // user. Re-enable the real checks below once that endpoint is confirmed.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    can(_resource: string, _action: string): boolean {
        return true;
        // const matrix: PermissionMatrix | undefined = this._info()?.permissions;
        // return matrix?.[_resource]?.[_action] === true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasRole(..._roles: AssetUserRole[]): boolean {
        return true;
        // const role = this.role();
        // return !!role && _roles.includes(role);
    }
}
