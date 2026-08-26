import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { LocalStorage, SessionState } from '@nfinyx/types';
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
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly storage = inject(StorageService);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (isUnauthenticatedHost(req.url)) {
            // eslint-disable-next-line no-console
            console.error(
                `[AuthInterceptor] Skipping auth for ${req.url} (unauthenticated-host carve-out). ` +
                    'Remove UNAUTHENTICATED_HOSTS once this backend moves under the authenticated domain.',
            );
            return next.handle(req);
        }

        const token = this.storage.getJSON<SessionState>(LocalStorage.Session)?.token;
        const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

        return next.handle(request).pipe(
            catchError((error: unknown) => {
                if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/token')) {
                    this.storage.removeItem(LocalStorage.Session);
                }
                return throwError(() => error);
            }),
        );
    }
}
