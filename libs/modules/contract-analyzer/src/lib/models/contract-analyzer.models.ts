import { CallTypeBreakdown, Paginated, PaginationMeta, PerformanceReport, RecentError, TelemetryLogEntry } from '@nfinyx/document-agent';

export type { CallTypeBreakdown, Paginated, PaginationMeta, PerformanceReport, RecentError, TelemetryLogEntry };

export interface RiskCategoryEntry {
    category: string;
    /** Low | Medium | High | Critical */
    level: string;
    score: number;
    explanation: string;
    clause_reference: string | null;
    cash_flow_impact: string;
}

export interface KeyClause {
    clause_type: string;
    summary: string;
    page_reference: string | null;
    risk_flag: string | null;
}

export interface ContractSummary {
    id: string;
    filename: string;
    file_type: string;
    page_count: number;
    party_a_name: string | null;
    party_a_type: string | null;
    party_b_name: string | null;
    party_b_type: string | null;
    is_mofa_it_outsourcing_contract: boolean;
    contract_type: string | null;
    contract_value: number | null;
    currency: string | null;
    overall_risk_score: number | null;
    overall_risk_level: string | null;
    confidence_score: number | null;
    document_classification: string;
    review_status: string;
    created_at: string;
}

export interface ContractDetail extends ContractSummary {
    detected_language: string | null;
    detected_language_confidence: number | null;
    contract_start_date: string | null;
    contract_end_date: string | null;
    clarifying_questions: string[];
    clarifying_answers: string[];
    cash_flow_context: string | null;
    previous_contract_notes: string | null;
    executive_summary: string | null;
    applicable_context: string | null;
    risk_categories: RiskCategoryEntry[];
    key_clauses: KeyClause[];
    recommendations: string[];
    prompt_suggestions: string[];
    extraction_error: string | null;
    file_size_bytes: number | null;
    reviewed_at: string | null;
    reviewer_name: string | null;
    reviewer_notes: string | null;
}

export interface DetectionResult {
    upload_ref: string;
    filename: string;
    page_count: number;
    detected_language: string | null;
    detected_language_confidence: number | null;
    party_a_name: string | null;
    party_a_type: string | null;
    party_b_name: string | null;
    party_b_type: string | null;
    contract_type: string | null;
    exceeds_length_limit: boolean;
}

export interface QuestionsResult {
    contract_summary: string;
    questions: string[];
}

export interface DocumentPageImage {
    page_num: number;
    image_base64: string;
    mime: string;
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
    total_contracts: number;
    total_questions: number;
    total_feedback: number;
    average_rating: number | null;
    average_risk_score: number | null;
    average_confidence: number | null;
    mofa_it_outsourcing_count: number;
    contracts_by_risk_level: Record<string, number>;
    contracts_by_classification: Record<string, number>;
    contracts_by_review_status: Record<string, number>;
    rating_distribution: Record<string, number>;
}

export interface DownloadPrepareResult {
    download_id: string;
    filename: string;
    total_size: number;
    total_chunks: number;
    chunk_size: number;
}

export interface ContractListFilters {
    q?: string;
    overallRiskLevel?: string;
    classification?: string;
    reviewStatus?: string;
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

export interface PartyDraft {
    name: string;
    type: string;
}

/** Local upload state for the single-file analyze flow — mirrors doc-intel-agent's `DocUpload`. */
export interface ContractUpload {
    filename: string;
    size: number;
    pageCount: number;
    uploadRef?: string;
}
