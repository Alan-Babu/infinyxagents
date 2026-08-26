export interface LoginRequest {
    username: string;
    password: string;
}

/** OAuth2 password-grant token response (FastAPI `OAuth2PasswordRequestForm` convention) — no expiry is returned, it's decoded from the JWT's own `exp` claim. */
export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface AuthMessageResponse {
    message: string;
}

/** Shape actually returned by GET /auth/me. */
export interface AuthenticatedUserDto {
    id?: string;
    _id?: string;
    full_name: string;
    email: string;
    department?: string;
    manager_id?: string | null;
    hire_date?: string;
    role: string;
    tenant_id: string | null;
    /** The caller's own tenant's enabled module flags, e.g. "hr_agent". */
    tenantFeatures?: unknown[];
    /** Compact data-residency status from the caller's tenant dataPolicy. */
    // dataResidency?: DataResidencyDto;
}