export type ActivityStatus = 'completed' | 'needsReview' | 'failed' | 'inProgress';

export interface ActivityLogEntry {
    id: string;
    agentId: string;
    action: string;
    detail: string;
    status: ActivityStatus;
    ts: number;
}

export interface UsageByAgentEntry {
    agentId: string;
    count: number;
}

export interface CategoryMixSegment {
    categoryKey: string;
    count: number;
    colorClass: string;
}

/** Raw row shape from ocrbackend's GET /api/v1/my-activity (MyActivityLogResponse), snake_case. */
export interface MyActivityApiRow {
    id: string;
    event_ts: string;
    source_service: string;
    agent_id: string | null;
    agent_name: string | null;
    agent_category: string | null;
    action: string;
    input_snippet: string | null;
    output_snippet: string | null;
    status: string;
    compliance_flag: string;
    duration_ms: number | null;
    feedback_rating: string | null;
    session_id: string | null;
}

/** Matches ocrbackend's Paginated[T] envelope exactly: {items, total, limit, skip}. */
export interface MyActivityPageResponse {
    items: MyActivityApiRow[];
    total: number;
    limit: number;
    skip: number;
}
