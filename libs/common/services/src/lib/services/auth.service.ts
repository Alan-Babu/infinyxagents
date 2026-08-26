import { computed, inject, Injectable, signal } from '@angular/core';

import { ApiService } from '../api';
import { StorageService } from '../local-storage';
import { CommonService } from './common';
import { ApiError, AuthenticatedUserDto, AuthMessageResponse, ForgotPasswordRequest, LocalStorage, messageFromApiError, ResetPasswordRequest, SessionState, SessionUser, TokenResponse } from '@nfinyx/types';

export const AuthAPIPaths = {
    authLogin: '/auth/token',
    authMe: '/auth/me',
    authForgotPassword: '/auth/forgot-password',
    authResetPassword: '/auth/reset-password',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly storage = inject(StorageService);
    private readonly api = inject(ApiService);
    private readonly common = inject(CommonService);
    private readonly _session = signal<SessionState | null>(this.restore());
    public loginsessionkey = "login";

    readonly session = this._session.asReadonly();
    readonly isLoggedIn = computed(() => this._session() !== null);
    readonly user = computed(() => this._session()?.user ?? null);
    // readonly permissions = computed(() => this._session()?.permissions ?? []);
    readonly tenantFeatures = computed(() => this._session()?.tenantFeatures ?? []);
    // readonly dataResidency = computed(
    //     () =>
    //         this._session()?.dataResidency ?? {
    //             enabled: false,
    //             region: 'UAE',
    //             countries: [] as string[],
    //         },
    // );
    // readonly dataResidencyEnabled = computed(() => this.dataResidency().enabled === true);
    readonly accessToken = computed(() => this._session()?.token ?? null);
    readonly tenantId = computed(() => this._session()?.user.tenantId ?? null);
    readonly isAdmin = computed(
        () => (this.user()?.role ?? '').toLowerCase() === 'admin',
    );

    me(): Promise<AuthenticatedUserDto> {
        return this.api.get<AuthenticatedUserDto>(AuthAPIPaths.authMe);
    }

    forgotPassword(payload: ForgotPasswordRequest): Promise<AuthMessageResponse> {
        return this.api.post<AuthMessageResponse>(AuthAPIPaths.authForgotPassword, payload);
    }

    resetPassword(payload: ResetPasswordRequest): Promise<AuthMessageResponse> {
        return this.api.post<AuthMessageResponse>(AuthAPIPaths.authResetPassword, payload);
    }

    async login(
        email: string,
        password: string,
    ): Promise<{ ok: true } | { ok: false; reason: string }> {
        try {
            const token = await this.api.postForm<TokenResponse>(AuthAPIPaths.authLogin, {
                username: email.trim().toLowerCase(),
                password,
            });
            const state = await this.buildSession(token.access_token);
            this._session.set(state);
            this.persist(state);
            return { ok: true };
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) return { ok: false, reason: 'alerts.loginFailed' };
                if (err.status === 403) return { ok: false, reason: 'alerts.permissionDenied' };
                if (err.status === 423) return { ok: false, reason: 'alerts.accountLocked' };
                return { ok: false, reason: messageFromApiError(err) };
            }
            return { ok: false, reason: 'alerts.loginFailed' };
        }
    }

    /** Re-validates token via /auth/me and refreshes persisted session. */
    async refreshProfile(): Promise<void> {
        const current = this._session();
        if (!current?.token) return;
        if (this.isExpired(current)) {
            this.logout();
            throw new ApiError('Session expired', 401, null);
        }
        const state = await this.buildSession(current.token);
        this._session.set(state);
        this.persist(state);
    }

    /** Called from APP_INITIALIZER when a stored token exists. */
    async bootstrapFromStorage(): Promise<void> {
        const current = this._session();
        if (!current?.token) return;
        if (this.isExpired(current)) {
            this.logout();
            return;
        }
        try {
            await this.refreshProfile();
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                this.logout();
            }
        }
    }

    /**
     * Establish a session from a Platform access token (OIDC callback path).
     * Same persistence shape as email/password login.
     */
    async establishFromAccessToken(
        accessToken: string,
    ): Promise<{ ok: true } | { ok: false; reason: string }> {
        try {
            const state = await this.buildSession(accessToken);
            this._session.set(state);
            this.persist(state);
            return { ok: true };
        } catch (err) {
            if (err instanceof ApiError) {
                return { ok: false, reason: messageFromApiError(err) };
            }
            return { ok: false, reason: 'alerts.loginFailed' };
        }
    }

    /**
     * Clear the Platform session. When OIDC is enabled, also ends the Keycloak
     * SSO cookie via ``/auth/oidc/logout`` so the next SSO shows the login form
     * instead of silently re-using the previous IdP user.
     */
    logout(options?: { endIdpSession?: boolean; returnUrl?: string }): void {
        this._session.set(null);
        this.storage.removeItem(LocalStorage.Session);

        // Opt-in only (sign-out button). Do not default on — session expiry
        // /auth/me failures must not bounce the whole tab through Keycloak.
        if (options?.endIdpSession !== true) {
            return;
        }
        const base = this.api.baseURL.replace(/\/$/, '');
        const params = new URLSearchParams();
        if (options?.returnUrl) {
            params.set('returnUrl', options.returnUrl);
        }
        const qs = params.toString();
        window.location.href = `${base}/auth/oidc/logout${qs ? `?${qs}` : ''}`;
    }

    private async buildSession(token: string): Promise<SessionState> {
        const expiresAt = this.decodeJwtExpiry(token);

        // Persist token before /auth/me so the auth interceptor (localStorage)
        // can attach Authorization on that request.
        const pending: SessionState = {
            user: {
                id: 'pending',
                email: '',
                displayName: '',
                department: '',
                managerId: null,
                hireDate: '',
                tenantId: null,
                role: '',
            },
            // permissions: [],
            tenantFeatures: [],
            // dataResidency: { enabled: false, region: 'UAE', countries: [] },
            token,
            expiresAt,
            issuedAt: Date.now(),
        };
        this._session.set(pending);
        this.persist(pending);
        const me = await this.me();
        return {
            user: this.mapUser(me),
            // permissions: permissionsFromApi(me.permissions),
            tenantFeatures: (me.tenantFeatures ?? []).map(String),
            // dataResidency: {
            //     enabled: me.dataResidency?.enabled === true,
            //     region: me.dataResidency?.region ?? 'UAE',
            //     countries: me.dataResidency?.countries ?? [],
            // },
            token,
            expiresAt,
            issuedAt: Date.now(),
        };
    }

    /** JWTs carry their own `exp` claim (seconds since epoch) — the token endpoint doesn't return a separate expiry. */
    private decodeJwtExpiry(token: string): number {
        try {
            const [, payload] = token.split('.');
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
            if (typeof decoded.exp === 'number') return decoded.exp * 1000;
        } catch {
            // fall through to default below
        }
        return Date.now() + 60 * 60 * 1000;
    }

    private mapUser(dto: AuthenticatedUserDto): SessionUser {
        return {
            id: this.common.normalizeApiId(dto),
            email: dto.email,
            displayName: dto.full_name,
            department: dto.department ?? '',
            managerId: dto.manager_id ?? null,
            hireDate: dto.hire_date ?? '',
            tenantId: dto.tenant_id,
            role: dto.role,
        };
    }

    private restore(): SessionState | null {
        const stored = this.storage.getJSON<SessionState>(LocalStorage.Session);
        if (!stored?.token) return null;

        if (!stored.user) {
            stored.user = {
                id: '',
                email: '',
                displayName: '',
                department: '',
                managerId: null,
                hireDate: '',
                tenantId: null,
                role: '',
            };
        }

        if (!stored.user.tenantId && stored.user.subscriberId) {
            stored.user.tenantId = stored.user.subscriberId;
        }

        const id = this.common.normalizeApiId(stored.user);
        if (id) {
            stored.user.id = id;
        }

        return stored;
    }

    private persist(state: SessionState): void {
        this.storage.setJSON(LocalStorage.Session, state);
    }

    private isExpired(state: SessionState): boolean {
        if (!state.expiresAt) return false;
        return Date.now() >= state.expiresAt;
    }
}
