/** Raw DTOs for the `verification-workflows` backend — snake_case, wrapped in an envelope. */

export interface VerificationWorkflowEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface HumanReviewSummary {
    decision?: string | null;
    reviewer_id?: string | null;
    notes?: string | null;
    source?: string | null;
    reviewed_at?: string | null;
}

export interface VerificationWorkflowQueueItem {
    workflow_id: string;
    tenant_code?: string;
    verification_mode?: string | null;
    status: string;
    current_stage?: string;
    verification_stage?: string | null;
    document_type?: string | null;
    country?: string | null;
    country_code?: string | null;
    entity?: string | null;
    entity_code?: string | null;
    document_count?: number;
    file_name?: string | null;
    ocr_status?: string | null;
    confidence_score?: number | null;
    error_message?: string | null;
    review_status?: string | null;
    official_verification_status?: string | null;
    final_decision?: string | null;
    risk_score?: number | null;
    decision_reasons?: string[] | null;
    human_review?: HumanReviewSummary | null;
    created_at: string;
    updated_at: string;
}

export interface VerificationWorkflowQueueResponse {
    items: VerificationWorkflowQueueItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface ReviewDecisionRequest {
    decision: 'APPROVED' | 'REJECTED';
    reviewer_id?: string | null;
    reasons?: string[];
    notes?: string | null;
}

export interface ReviewDecisionResponse {
    workflow_id: string;
    review_status: string;
    final_decision: string;
    decision_reasons?: string[];
    workflow_signals?: Record<string, unknown>;
}

/** GET .../agent-execution-logs item — actual backend shape (verified against a live response). */
export interface AgentExecutionLog {
    id: string;
    verification_id?: string;
    workflow_id?: string;
    agent_name: string;
    agent_stage: string;
    status: string;
    confidence_score?: number | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    duration_seconds?: number | null;
}

export interface AgentExecutionLogsResponse {
    items: AgentExecutionLog[];
    total: number;
    limit: number;
    offset: number;
}

export type WorkflowDocumentSource = 'uploaded' | 'true-copy' | 'attested-copy';
export type WorkflowDocumentAction = 'view' | 'download';
