export interface SessionUser {
    id: string;
    email: string;
    displayName: string;
    department: string;
    managerId: string | null;
    hireDate: string;
    tenantId: string | null;
    role: string;
}

/** Persisted session shape; may include legacy subscriberId from older builds. */
export interface SessionState {
    user: SessionUser & { subscriberId?: string };
    // permissions: PermCode[];
    /** The caller's own tenant's enabled module flags, e.g. "hr_agent". Absent in sessions persisted before this field existed. */
    tenantFeatures?: string[];
    /** Compact data-residency status; absent in sessions persisted before this field existed. */
    // dataResidency?: DataResidencyDto;
    token: string;
    /** Epoch ms, decoded from the JWT's own `exp` claim — the server doesn't return a separate expiry. */
    expiresAt: number;
    issuedAt: number;
}