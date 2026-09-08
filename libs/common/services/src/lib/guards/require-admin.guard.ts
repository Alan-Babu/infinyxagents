import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks entry into an admin-only route subtree for a logged-in user whose
 * role isn't 'admin' (see AuthService.isAdmin) -- unlike requireLoginGuard,
 * this assumes the visitor IS already authenticated (it runs nested inside
 * routes requireLoginGuard already protects) and only gates on role, so it
 * redirects within the SPA via the router rather than forcing a full
 * page reload through the login flow.
 *
 * This is client-side navigation gating only -- it hides/blocks the route in
 * the UI, it does not add server-side authorization to whatever backend
 * endpoints that route calls. Matches this app's current trust level
 * everywhere else; not a new gap, but not real access control either.
 */
export const requireAdminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    if (auth.isAdmin()) return true;

    const router = inject(Router);
    return router.parseUrl('/dashboard');
};
