import { Paginated, PaginationMeta, PerformanceReport, TelemetryLogEntry } from '@nfinyx/document-agent';

export type { Paginated, PaginationMeta, PerformanceReport };

/** Extends the shared telemetry log entry with the one extra field this module's backend returns. */
export interface EmailTelemetryLogEntry extends TelemetryLogEntry {
    qa_exchange_id: string | null;
}

export interface EmailSummary {
    id: string;
    mode: string;
    tone: string;
    subject: string | null;
    language: string;
    word_count: number;
    confidence_score: number | null;
    document_classification: string;
    review_status: string;
    emotional_tone: string | null;
    created_at: string;
}

export interface ToneVariant {
    tone: string;
    subject: string;
    body: string;
}

export interface EmailDetail extends EmailSummary {
    context_input: string | null;
    reply_to_email_text: string | null;
    clarifying_questions: string[];
    clarifying_answers: string[];
    body: string | null;
    alternate_tones: ToneVariant[];
    translated_subject: string | null;
    translated_body: string | null;
    translated_language: string | null;
    missing_info: string[];
    sensitive_patterns_found: string[];
    reviewed_at: string | null;
    reviewer_name: string | null;
    reviewer_notes: string | null;
    prompt_suggestions: string[];
    extraction_error: string | null;
}

export interface ReplyQuestionsResult {
    thread_summary: string;
    questions: string[];
    emotional_tone: string | null;
}

export interface ContextProfile {
    sender_name: string | null;
    sender_title: string | null;
    sender_company: string | null;
    signature_block: string | null;
    default_tone: string;
    notes: string | null;
    updated_at: string | null;
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
    total_emails: number;
    total_composed: number;
    total_replied: number;
    total_translated: number;
    total_questions: number;
    total_feedback: number;
    average_rating: number | null;
    average_confidence: number | null;
    total_words_composed: number;
    emails_by_classification: Record<string, number>;
    emails_by_tone: Record<string, number>;
    rating_distribution: Record<string, number>;
}

export interface EmailListFilters {
    q?: string;
    mode?: string;
    classification?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

export interface EmailLogFilters {
    callType?: string;
    success?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

export const TONES = [
    'Professional',
    'Friendly',
    'Formal',
    'Persuasive',
    'Concise',
    'Apologetic',
    'Assertive',
    'Diplomatic',
] as const;
export type Tone = (typeof TONES)[number];

export type ComposeMode = 'compose' | 'reply';
export type ReplyInputMode = 'paste' | 'upload';

/** Local upload state for the reply-thread upload flow — mirrors grammar-agent's `DocUpload`. */
export interface EmailUpload {
    filename: string;
    size: number;
    pageCount: number;
    uploadRef?: string;
}
