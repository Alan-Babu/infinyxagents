import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthInterceptor } from './auth.interceptor';

const BASE_URL = 'https://agentsapi.nfinyx.ai';
const PLATFORM_API = `${BASE_URL}/api`;
const EXEC_AGENT_API = `${BASE_URL}/exec-agent/api`;

function interceptorWith(session: { token: string; expiresAt: number } | null) {
  const removeItem = vi.fn();
  const interceptor = Object.create(AuthInterceptor.prototype) as AuthInterceptor;
  Object.assign(interceptor, {
    storage: { getJSON: () => session, removeItem },
    platformApiPrefix: `${PLATFORM_API}/`,
  });
  return { interceptor, removeItem };
}

/** Fails the request with a 401 and reports whether the session was cleared. */
async function unauthorized(
  interceptor: AuthInterceptor,
  url: string,
): Promise<{ authorization: string | null }> {
  let authorization: string | null = null;
  const next = {
    handle: (req: HttpRequest<unknown>) => {
      authorization = req.headers.get('Authorization');
      return throwError(() => new HttpErrorResponse({ status: 401, url }));
    },
  };

  await new Promise<void>(resolve => {
    interceptor.intercept(new HttpRequest('GET', url), next).subscribe({
      error: () => resolve(),
    });
  });

  return { authorization };
}

describe('AuthInterceptor session lifetime', () => {
  const liveSession = { token: 'jwt-token', expiresAt: Date.now() + 60_000 };

  it('attaches the shared bearer token to agent-service requests', async () => {
    const { interceptor } = interceptorWith(liveSession);

    const { authorization } = await unauthorized(interceptor, `${EXEC_AGENT_API}/admin/settings`);

    expect(authorization).toBe('Bearer jwt-token');
  });

  it('keeps a valid session when an agent service refuses an admin route', async () => {
    const { interceptor, removeItem } = interceptorWith(liveSession);

    await unauthorized(interceptor, `${EXEC_AGENT_API}/admin/settings`);

    expect(removeItem).not.toHaveBeenCalled();
  });

  it('clears the session when the platform API rejects the token', async () => {
    const { interceptor, removeItem } = interceptorWith(liveSession);

    await unauthorized(interceptor, `${PLATFORM_API}/auth/me`);

    expect(removeItem).toHaveBeenCalledOnce();
  });

  it('clears an expired session on any 401', async () => {
    const { interceptor, removeItem } = interceptorWith({
      token: 'jwt-token',
      expiresAt: Date.now() - 1,
    });

    await unauthorized(interceptor, `${EXEC_AGENT_API}/admin/settings`);

    expect(removeItem).toHaveBeenCalledOnce();
  });

  it('never clears the session for a failed login attempt', async () => {
    const { interceptor, removeItem } = interceptorWith(null);

    await unauthorized(interceptor, `${PLATFORM_API}/auth/token`);

    expect(removeItem).not.toHaveBeenCalled();
  });
});
