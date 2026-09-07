export type CaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';
export type CaseMode = 'OFFICIAL_SOURCE' | 'MANUAL_UPLOAD' | 'TRUE_COPY' | 'DOCUMENT_EXTRACTION';
export type CaseSubMode = 'COMPLETED' | 'PIPELINE_ERROR' | 'HUMAN_REVIEW';
export type PipelineStepStatus = 'COMPLETED' | 'FAILED' | 'SKIPPED';

export const DOC_TYPES = [
    'POLICE_CLEARANCE',
    'EDUCATION_CERTIFICATE',
    'MARRIAGE_CERTIFICATE',
    'BIRTH_CERTIFICATE',
    'EXPERIENCE_CERTIFICATE',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export interface CountryOption {
    name: string;
    code: string;
}

export const COUNTRIES: CountryOption[] = [
    { name: 'Nepal', code: 'NPL' },
    { name: 'India', code: 'IND' },
    { name: 'Philippines', code: 'PHL' },
    { name: 'Egypt', code: 'EGY' },
    { name: 'Pakistan', code: 'PAK' },
];

export interface PipelineStep {
    key: string;
    name: string;
    agent: string;
    status: PipelineStepStatus;
    detail: string;
    confidence?: number | null;
    durationLabel?: string;
}

export interface AttestationCase {
    id: string;
    simId: string | null;
    docType: DocType;
    country: string;
    countryCode: string;
    status: CaseStatus;
    confidence: number;
    overallConfidence: number;
    risk: number;
    mode: CaseMode;
    subMode: CaseSubMode;
    file: string;
    mismatch: string[];
    pipeline: PipelineStep[];
    createdAt: number;
    updatedAt: number;
    reviewedAt: number | null;
    reviewer: string | null;
    notes: string;
}

export type CaseDecision = Extract<CaseStatus, 'APPROVED' | 'REJECTED'>;

export type CaseStatusGroup = 'pending' | 'failures' | 'completed';

export interface CaseMatchingField {
    fieldName: string;
    label: string;
    weight: number;
    inputValue: string;
    officialValue: string;
    score: number;
}

export interface CaseMatchingRationale {
    fieldName: string;
    severity: 'ok' | 'warn' | 'bad';
    message: string;
}

export interface CaseMatchingPortal {
    source: string;
    verified: boolean | null;
    status: string;
    checkedAt: number | null;
    portalUrl: string | null;
}

export interface CaseMatching {
    applicantName: string;
    keyIdentifier: string;
    fields: CaseMatchingField[];
    overallMatchPercent: number;
    decision: string;
    decisionForced: boolean;
    decisionReason: string;
    rationale: CaseMatchingRationale[];
    portal: CaseMatchingPortal | null;
}
