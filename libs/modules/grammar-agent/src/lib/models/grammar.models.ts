import { Paginated, PaginationMeta, PerformanceReport, TelemetryLogEntry } from '@nfinyx/document-agent';

export type { Paginated, PaginationMeta, PerformanceReport, TelemetryLogEntry };

export interface DocumentSummary {
    id: string;
    filename: string;
    file_type: string;
    page_count: number;
    detected_language: string | null;
    detected_language_confidence: number | null;
    word_count: number;
    grammar_score: number | null;
    readability_grade: number | null;
    readability_label: string | null;
    issue_counts: Record<string, number>;
    document_classification: string;
    confidence_score: number | null;
    review_status: string;
    created_at: string;
}

export interface DetectionResult {
    upload_ref: string;
    filename: string;
    page_count: number;
    word_count: number;
    detected_language: string | null;
    detected_language_confidence: number | null;
    exceeds_length_limit: boolean;
}

export interface DocumentPageImage {
    page_num: number;
    image_base64: string;
    mime: string;
}

export interface GrammarIssue {
    id: string;
    /** Grammar | Spelling | Punctuation | Style | Clarity */
    type: string;
    /** critical | major | minor */
    severity: string;
    char_start: number;
    char_end: number;
    original_span: string;
    suggestion: string;
    explanation: string;
}

export interface DocumentDetail extends DocumentSummary {
    original_text: string | null;
    corrected_text: string | null;
    issues: GrammarIssue[];
    prompt_suggestions: string[];
    extraction_error: string | null;
    file_size_bytes: number | null;
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
    average_grammar_score: number | null;
    total_words_checked: number;
    issue_totals: Record<string, number>;
    documents_by_classification: Record<string, number>;
    documents_by_language: Record<string, number>;
    documents_by_review_status: Record<string, number>;
    rating_distribution: Record<string, number>;
}

export interface DocumentListFilters {
    q?: string;
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

/** Local upload state for the single-file check flow — mirrors doc-intel-agent's `DocUpload`. */
export interface DocUpload {
    filename: string;
    size: number;
    pageCount: number;
    uploadRef?: string;
}

/** Which of the two ways a user can submit text for a grammar check. */
export type InputMode = 'upload' | 'paste';
