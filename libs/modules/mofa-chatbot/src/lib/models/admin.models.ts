/** DTOs for the admin backoffice surface, verified against the legacy `core/models.ts`. */

export interface KBVersion {
    id: string;
    label: string;
    status: 'draft' | 'simulating' | 'published' | 'archived';
    notes: string | null;
    created_by: string | null;
    document_count: number;
    chunk_count: number;
    created_at: string;
    published_at: string | null;
    published_by: string | null;
}

export interface KBDocument {
    id: string;
    filename: string;
    file_type: string;
    file_size_bytes: number;
    created_at: string;
}

export interface SimulateResult {
    answer: string | null;
    confidence: number | null;
    citations: { title: string; url: string | null }[];
    chunks_from_draft: number;
    chunks_from_live: number;
}

export interface CrawlSchedule {
    id: string;
    name: string;
    enabled: boolean;
    hour: number;
    minute: number;
    mode: 'incremental' | 'full';
    seed_urls: string[];
    max_pages_per_run: number;
    updated_at: string | null;
    updated_by: string | null;
    next_run_description: string;
}

export interface CrawlRun {
    id: string;
    mode: string;
    trigger: string;
    status: string;
    pages_discovered: number;
    pages_fetched: number;
    pages_changed: number;
    pages_unchanged: number;
    pages_failed: number;
    chunks_created: number;
    error_message: string | null;
    started_at: string | null;
    finished_at: string | null;
    duration_seconds: number | null;
}

export interface BlacklistTerm {
    id: string;
    term: string;
    match_type: 'contains' | 'exact' | 'regex';
    category: string;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
}

export interface BlacklistTestResult {
    is_blocked: boolean;
    matched_term: string | null;
    category: string | null;
}

export interface AnalyticsOverview {
    period_days: number;
    total_sessions: number;
    total_user_messages: number;
    risk_flagged_sessions: number;
    unanswered_questions: number;
    average_rating: number | null;
    default_ratings_count: number;
    sentiment_breakdown: Record<string, number>;
    end_reason_breakdown: Record<string, number>;
    language_breakdown: Record<string, number>;
    thumbs_up: number;
    thumbs_down: number;
}

export interface UnansweredQuestion {
    id: string;
    question_text: string;
    language: string | null;
    best_similarity_score: number | null;
    reviewed: boolean;
    created_at: string;
}

export interface RiskSession {
    id: string;
    language: string;
    overall_sentiment: string | null;
    risk_reason: string | null;
    status: string;
    rating: number | null;
    started_at: string;
    ended_at: string | null;
}

export interface SessionTranscriptMessage {
    role: string;
    content: string;
    detected_sentiment: string | null;
    blocked_reason: string | null;
    created_at: string;
}

export interface SessionTranscript {
    session_id: string;
    overall_sentiment: string | null;
    risk_reason: string | null;
    messages: SessionTranscriptMessage[];
}

export interface FeedbackEntry {
    session_id: string;
    rating: number;
    rating_is_default: boolean;
    rating_comment: string | null;
    ended_reason: string | null;
    ended_at: string | null;
}

/** Pagination envelope every paginated admin-list endpoint returns: `{ items, pagination }`. */
export interface PaginationMeta {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
}

export interface Paginated<T> {
    items: T[];
    pagination: PaginationMeta;
}

export type AdminTab = 'overview' | 'crawl' | 'kb' | 'blacklist' | 'risk-sessions' | 'feedback';
