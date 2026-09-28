import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks entry into an agent's route subtree when the user's role does not include that agent
 * (only when `enforceAgentAccess` is on; see AuthService.canOpenAgent). The agent is named by the
 * route's `data: { agentId: '<tile id>' }`. Redirects to the dashboard, which is not itself gated,
 * so there is no redirect loop.
 *
 * Client-side navigation gating only: the agent backends enforce access on the API.
 */
export const requireAgentAccessGuard: CanActivateFn = route => {
    const agentId = route.data?.['agentId'] as string | undefined;
    if (!agentId) return true;

    const auth = inject(AuthService);
    if (auth.canOpenAgent(agentId)) return true;

    return inject(Router).parseUrl('/dashboard');
};
