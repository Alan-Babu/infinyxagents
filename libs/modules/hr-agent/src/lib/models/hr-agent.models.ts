export interface FieldComparisonEntry {
    field: string;
    label: string;
    uploaded: string | null;
    official: string | null;
    /** null = not applicable */
    match: boolean | null;
}

export interface VerificationSummary {
    verification_id: string;
    approved: boolean;
    reason: string;
    field_comparison: FieldComparisonEntry[];
    documents: { uploaded: string; official: string | null };
    leave_request: { id: string; start_date: string; end_date: string; days: number; status: string } | null;
}

export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    created_at?: string;
    verification?: VerificationSummary | null;
    metadata?: { verification?: VerificationSummary | null; duration_ms?: number; token_usage?: TokenUsage | null } | null;
    /** Client-only toggle state. */
    feedback?: 'like' | 'dislike';
    /** Client-only. */
    feedbackPromptOpen?: boolean;
    duration_ms?: number;
    token_usage?: TokenUsage | null;
    /** Client-only. */
    attachmentName?: string;
}

export interface ConversationSummary {
    id: string;
    channel: string;
    created_at: string;
    preview: string | null;
}

export interface ChatResponse {
    conversation_id: string;
    message_id: string;
    reply: string;
    verification?: VerificationSummary | null;
    duration_ms?: number;
    token_usage?: TokenUsage | null;
}

export interface AttachmentRef {
    attachment_id: string;
}
