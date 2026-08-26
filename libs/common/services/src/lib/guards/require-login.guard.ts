import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Applied via `canActivateChild` on the `SharedLayout` route block in each app's
 * `app.routes.ts` — blocks entry into every authenticated route (dashboard + all feature
 * modules) for a visitor with no session, and re-checks on every subsequent in-app
 * navigation (not just first mount). Needed because some routes (e.g. mofa-chatbot's
 * public `/mofa-chatbot/shared/:token`) are intentionally reachable without login and can
 * link into the authenticated app shell — without this guard a visitor could navigate
 * straight into a `SharedLayout` route before any auth check ever ran.
 */
export const requireLoginGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    if (auth.isLoggedIn()) return true;

    window.location.href = `${window.location.href.split('#')[0]}#/${auth.loginsessionkey}`;
    return false;
};
