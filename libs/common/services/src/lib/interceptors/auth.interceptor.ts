import { Inject, Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AppConfig, LocalStorage, SessionState } from '@nfinyx/types';
import { APP_CONFIG } from '../app-config';
import { StorageService } from '../local-storage';

/**
 * Hosts whose routes aren't protected by the platform's own bearer token — attaching
 * `Authorization` (and reacting to a 401 from them by clearing the session) doesn't apply.
 * digital-attestation's verification-workflows backend currently lives here, on a separate
 * host from the rest of the platform (`APP_CONFIG.baseURL`).
 *
 * @deprecated Temporary carve-out. Remove this list (and the branch in `intercept()` that
 * checks it) once `DigitalAttestationApiBase` moves under the platform's authenticated
 * domain — see the commented-out `resolveBaseUrl('attestation/api')` there.
 */
const UNAUTHENTICATED_HOSTS = ['api.nfinyx.ai'];

/**
 * Exact hostname match — `req.url.includes(host)` would also match e.g. `agentsapi.nfinyx.ai`
 * (it contains `api.nfinyx.ai` as a substring), silently stripping auth from the wrong host.
 */
function isUnauthenticatedHost(url: string): boolean {
    try {
        return UNAUTHENTICATED_HOSTS.includes(new URL(url).hostname);
    } catch {
        return false;
    }
}

/**
 * Attaches the persisted session's bearer token to outgoing requests, and clears the
 * session on a 401 so `AuthService.isLoggedIn` reflects reality immediately rather than
 * only after the next explicit `/auth/me` call.
 *
 * A 401 only means "this session is dead" when it comes from the platform API that issued
 * the token, or when the token has actually expired. Agent backends behind their own
 * service segment (e.g. `{baseURL}/exec-agent/api`) also answer 401 for routes the caller
 * simply isn't allowed to use — treating those as a logout would silently drop a perfectly
 * valid shared login the first time any agent probed an admin-only endpoint.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly storage = inject(StorageService);
    /** `{baseURL}/api/` — the platform API that issues and validates the session token. */
    private readonly platformApiPrefix: string;

    constructor(@Inject(APP_CONFIG) appConfig: AppConfig) {
        this.platformApiPrefix = `${(appConfig.baseURL ?? '').replace(/\/+$/, '')}/api/`;
    }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (isUnauthenticatedHost(req.url)) {
            // eslint-disable-next-line no-console
            console.error(
                `[AuthInterceptor] Skipping auth for ${req.url} (unauthenticated-host carve-out). ` +
                    'Remove UNAUTHENTICATED_HOSTS once this backend moves under the authenticated domain.',
            );
            return next.handle(req);
        }

        const session = this.storage.getJSON<SessionState>(LocalStorage.Session);
        const request = session?.token
            ? req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })
            : req;

        return next.handle(request).pipe(
            catchError((error: unknown) => {
                if (error instanceof HttpErrorResponse && error.status === 401 && this.isDeadSession(req.url, session)) {
                    this.storage.removeItem(LocalStorage.Session);
                }
                return throwError(() => error);
            }),
        );
    }

    /**
     * A 401 invalidates the stored session only when the platform API itself rejected the
     * token, or when the token was already past its own `exp`. Sessions persisted before
     * `expiresAt` existed have no expiry to trust, so they keep the original clear-on-401
     * behaviour.
     */
    private isDeadSession(url: string, session: SessionState | null): boolean {
        if (!session) return false;
        if (url.includes('/auth/token')) return false;
        if (url.startsWith(this.platformApiPrefix)) return true;
        return !session.expiresAt || session.expiresAt <= Date.now();
    }
}
