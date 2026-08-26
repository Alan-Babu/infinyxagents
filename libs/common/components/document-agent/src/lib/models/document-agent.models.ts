export interface PaginationMeta {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface Paginated<T> {
    items: T[];
    pagination: PaginationMeta;
}

export interface CallTypeBreakdown {
    count: number;
    success_rate: number | null;
    avg_confidence: number | null;
    avg_duration_ms: number | null;
    total_tokens: number;
}

export interface RecentError {
    id: string;
    call_type: string;
    error_message: string | null;
    created_at: string;
}

export interface PerformanceReport {
    total_calls: number;
    success_rate: number | null;
    avg_confidence: number | null;
    avg_duration_ms: number | null;
    total_tokens: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    by_call_type: Record<string, CallTypeBreakdown>;
    recent_errors: RecentError[];
}

export interface TelemetryLogEntry {
    id: string;
    document_id: string | null;
    call_type: string;
    model: string | null;
    success: boolean;
    confidence_score: number | null;
    duration_ms: number | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    total_tokens: number | null;
    error_message: string | null;
    created_at: string;
    document_filename: string | null;
}

export interface TelemetryLogFilters {
    callType: string;
    /** '' | 'true' | 'false' — kept as a string since it drives a <select>. */
    success: string;
    dateFrom: string;
    dateTo: string;
}

export interface CallTypeOption {
    value: string;
    label: string;
}

export type ReviewQueueBadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface ReviewQueueBadge {
    label: string;
    severity: ReviewQueueBadgeSeverity;
}

/**
 * Display-ready shape for one review-queue row. Callers map their own
 * DocumentSummary-like model into this so the drawer stays agnostic of
 * per-agent fields (confidence vs. grammar score, risk vs. severity, ...).
 */
export interface ReviewQueueItem {
    id: string;
    title: string;
    metaLine: string[];
    badges: ReviewQueueBadge[];
}

export interface ReviewDecisionPayload {
    id: string;
    decision: 'approve' | 'reject';
    reviewerName: string;
    reviewerNotes: string;
}

export interface FeedbackSubmitPayload {
    rating: number;
    comment: string;
    forDocument: boolean;
}

export interface SourceLocation {
    page_num: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface SourcePageImage {
    page_num: number;
    image_base64: string;
    mime: string;
}

export interface SourceOverlayField {
    key: string;
    label: string;
    value: string;
    location: SourceLocation | undefined;
}

export interface SourceOverlayStamp {
    label: string;
    sublabel: string;
    location: SourceLocation | null;
}
