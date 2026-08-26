import { Paginated, PaginationMeta, PerformanceReport, TelemetryLogEntry } from '@nfinyx/document-agent';

export type { Paginated, PaginationMeta, PerformanceReport, TelemetryLogEntry };

export interface DocumentSummary {
    id: string;
    filename: string;
    file_type: string;
    page_count: number;
    issued_by_type: string | null;
    issued_by_name: string | null;
    issued_to_type: string | null;
    issued_to_name: string | null;
    document_type: string | null;
    issued_on: string | null;
    valid_through: string | null;
    has_expiry: boolean;
    status: string;
    risk_level: string;
    document_category: string;
    document_classification: string;
    confidence_score: number | null;
    review_status: string;
    created_at: string;
}

export interface FieldLocation {
    page_num: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface DocumentPageImage {
    page_num: number;
    image_base64: string;
    mime: string;
}

export interface StampSignature {
    type: string;
    accredited_entity_name: string | null;
    ministry_of_foreign_affairs_name: string | null;
    country: string | null;
    date: string | null;
    signed_by: string | null;
    reference_number: string | null;
    description: string;
    location: FieldLocation | null;
}

export interface ComplianceRecommendations {
    can_be_approved?: string;
    approval_reason?: string;
    can_be_authorized?: string;
    authorization_reason?: string;
    uae_attestation_eligible?: string;
    uae_attestation_reason?: string;
    uae_attestation_next_step?: string;
}

export interface DocumentDetail extends DocumentSummary {
    insights: string | null;
    risk_factors: string[];
    prompt_suggestions: string[];
    extraction_error: string | null;
    file_size_bytes: number | null;
    field_locations: Record<string, FieldLocation>;
    stamps_and_signatures: StampSignature[];
    compliance_recommendations: ComplianceRecommendations;
    reviewed_at: string | null;
    reviewer_name: string | null;
    reviewer_notes: string | null;
}

export interface QAExchange {
    id: string;
    document_id: string;
    question: string;
    answer: string;
    confidence_score: number | null;
    created_at: string;
}

export interface FeedbackEntry {
    id: string;
    document_id: string | null;
    rating: number;
    comment: string | null;
    created_at: string;
}

export interface SearchHistoryEntry {
    id: string;
    query_text: string | null;
    result_count: number;
    created_at: string;
}

export interface AgentStats {
    total_documents: number;
    total_questions: number;
    total_feedback: number;
    average_rating: number | null;
    documents_by_type: Record<string, number>;
    documents_by_status: Record<string, number>;
    documents_by_risk: Record<string, number>;
    documents_by_category: Record<string, number>;
    documents_by_classification: Record<string, number>;
    rating_distribution: Record<string, number>;
}

export interface DocumentListFilters {
    q?: string;
    documentType?: string;
    status?: string;
    riskLevel?: string;
    category?: string;
    classification?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

export interface LogFilters {
    callType?: string;
    success?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

/** Local upload state for the single-file analyze flow — mirrors doc-compare's `DocSide`, minus the multi-slot bits. */
export interface DocUpload {
    filename: string;
    size: number;
    pageCount: number;
    uploadRef?: string;
}
