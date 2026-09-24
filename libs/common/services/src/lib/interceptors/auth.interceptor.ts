import { Inject, Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AppConfig, LocalStorage, SessionState } from '@nfinyx/types';
import { APP_CONFIG } from '../app-config';
import { StorageService } from '../local-storage';

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
    /** `{baseURL}/api/` — the agents API that validates the session token. */
    private readonly platformApiPrefix: string;
    /** The nfinyx Platform API (identity provider + ReviewHub), when configured. */
    private readonly identityApiPrefix: string | null;

    constructor(@Inject(APP_CONFIG) appConfig: AppConfig) {
        this.platformApiPrefix = `${(appConfig.baseURL ?? '').replace(/\/+$/, '')}/api/`;
        const identityRoot = (appConfig.platformApiUrl ?? '').replace(/\/+$/, '');
        this.identityApiPrefix = identityRoot ? `${identityRoot}/` : null;
    }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // A caller-supplied Authorization header wins (e.g. the platform logout call, made after
        // the local session is already cleared).
        if (req.headers.has('Authorization')) {
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
        if (url.includes('/auth/token') || url.includes('/auth/agents/login')) return false;
        if (url.startsWith(this.platformApiPrefix)) return true;
        // The platform issued this token, so its 401 (expired or revoked session) is a dead session.
        if (this.identityApiPrefix && url.startsWith(this.identityApiPrefix)) return true;
        return !session.expiresAt || session.expiresAt <= Date.now();
    }
}
