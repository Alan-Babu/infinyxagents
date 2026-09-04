export type Provider = 'qwen' | 'openai' | 'claude';

export type Category = 'political' | 'social' | 'personal' | 'business' | 'trade' | 'other';

export type LengthPreset = 'short' | 'executive' | 'long' | 'custom';

export type Framework =
    | 'none'
    | 'PESTLE'
    | "Porter's Five Forces"
    | 'DEEPLIST'
    | 'McKinsey 7-S Model'
    | 'SWOT'
    | 'SOAR';

export type OutputFormat = 'html' | 'docx' | 'pdf' | 'pptx';

export type Mode = 'General Research' | 'Executive Concierge';

export type Source = 'Web search' | 'Specific URL(s)' | 'Upload document';

export type Template =
    | 'Auto (agent picks)'
    | 'UAE Color Theme'
    | 'Editorial Navy'
    | 'Corporate Minimal'
    | 'Modern Teal'
    | 'MoFA';

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'expert';

export const ALL_PROVIDERS: Provider[] = ['qwen', 'openai', 'claude'];

export interface UserProfileResponse {
    user_id: string;
    expertise_level: ExpertiseLevel;
    updated_at: string;
}

export interface ClarifyingQuestion {
    id: string;
    question: string;
    suggested_answers: string[];
}

export interface StartSessionResponse {
    session_id: string;
    intent: 'research' | 'chit_chat';
    reply?: string | null;
    category_guess: Category | null;
    clarifying_questions: ClarifyingQuestion[];
    suggested_framework: Framework;
    framework_reason: string;
    involves_specific_person: boolean;
    involves_country_relations: boolean;
}

export interface ForkSessionRequest {
    content_markdown?: string | null;
    title?: string | null;
}

export interface ForkSessionResponse {
    session_id: string;
    title: string;
    content_markdown: string;
    category_guess: Category | null;
    clarifying_questions: ClarifyingQuestion[];
    suggested_framework: Framework;
    framework_reason: string;
    involves_specific_person: boolean;
    involves_country_relations: boolean;
}

export interface GenerateRequest {
    length: LengthPreset;
    custom_word_count?: number | null;
    custom_page_count?: number | null;
    framework: Framework;
    category?: Category | null;
    audience?: string | null;
    output_format: OutputFormat;
    provider: Provider;
    personnel_profile?: boolean;
    country_dashboard?: boolean;
    source?: string | null;
    mcp_connection_id?: string | null;
    user_id: string;
}

export interface SourceHit {
    title: string;
    url: string;
}

export type ChatTurnKind = 'chitchat' | 'brief';

export interface ChatAnswerEntry {
    question: string;
    answer: string;
}

export interface SaveChatTurnRequest {
    conversation_id: string;
    turn_index: number;
    session_id: string;
    kind: ChatTurnKind;
    instruction: string;
    topic: string;
    title?: string;
    content_markdown?: string;
    framework?: string;
    provider?: string;
    source_selection?: string | null;
    sources?: SourceHit[];
    answers?: ChatAnswerEntry[];
}

export interface ChatTurnEntry {
    conversation_id: string;
    turn_index: number;
    session_id: string;
    kind: ChatTurnKind;
    instruction: string;
    topic: string;
    title: string;
    content_markdown: string;
    framework: string;
    provider: string;
    source_selection?: string | null;
    sources: SourceHit[];
    answers: ChatAnswerEntry[];
    created_at: string;
}

export interface ConversationSummary {
    conversation_id: string;
    title: string;
    turn_count: number;
    last_kind: ChatTurnKind;
    created_at: string;
    updated_at: string;
}

export interface ConversationDetail {
    conversation_id: string;
    turns: ChatTurnEntry[];
}

export interface PaginatedConversationsResponse {
    items: ConversationSummary[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

export interface ConversationSearchParams {
    q?: string;
    limit: number;
    offset: number;
}

export interface CountryDashboardData {
    trade_by_year?: { year: number; value_usd_billion: number }[];
    uae_investment_by_sector?: { sector: string; value_usd_billion: number }[];
    uae_locals_by_reason?: { reason: string; percentage: number }[];
    risks?: { category: string; level: 'Low' | 'Medium' | 'High'; note?: string }[];
    embassy?: { city?: string; note?: string };
    last_meetings?: { date: string; description: string }[];
    consular_services?: string[];
    shared_services?: string[];
    recent_updates?: string[];
    data_confidence_note?: string;
}

export interface GenerateResponse {
    session_id: string;
    title: string;
    content_markdown: string;
    word_count: number;
    framework_used: Framework;
    dashboard_data?: CountryDashboardData | null;
    response_time_ms?: number;
    total_tokens?: number | null;
    confidence_score?: number | null;
    quality_score?: number | null;
    sources?: SourceHit[];
}

export interface ExportResponse {
    file_path: string;
    file_name: string;
    generated_via: 'gamma' | 'presenton' | 'pptgenx' | 'local';
}

export interface ShareResult {
    channel: string;
    result: string;
    link?: string;
}

export interface Task {
    id: number;
    session_id?: string | null;
    title: string;
    assignees: string[];
    created_by: string;
    notes?: string;
    due_date?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    importance: 'Low' | 'Medium' | 'High';
    status: string;
    external_ref?: string | null;
    created_at: string;
}

export type ResearchType =
    | 'Country'
    | 'Trade'
    | 'Government Official / Minister'
    | 'Business / Company'
    | 'Individual / Person'
    | 'Social Media Post'
    | 'Other';

export type Visibility = 'private' | 'shared';

export interface HistoryEntry {
    session_id: string;
    name: string;
    description?: string | null;
    research_type: ResearchType;
    visibility: Visibility;
    category?: Category | null;
    framework: Framework;
    word_count: number;
    created_at: string;
    rating?: number | null;
    confidence_score?: number | null;
    provider?: string | null;
    model?: string | null;
    generated_at?: string | null;
}

export interface HistoryDetailEntry extends HistoryEntry {
    title: string;
    content_markdown: string;
    dashboard_data?: CountryDashboardData | null;
}

export interface PaginatedHistoryResponse {
    items: HistoryEntry[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

export interface HistorySearchParams {
    q?: string;
    category?: Category;
    research_type?: ResearchType;
    framework?: Framework;
    visibility?: Visibility;
    limit: number;
    offset: number;
}

export interface SaveReportRequest {
    name: string;
    description?: string | null;
    research_type: ResearchType;
    visibility: Visibility;
}

export interface SaveReportResponse {
    saved: boolean;
    entry: HistoryEntry;
}

export interface FeedbackRequest {
    rating: number;
    comment?: string | null;
}

export interface FeedbackEntry {
    id: number;
    session_id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
}

export interface ScheduleJobRequest {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time_of_day: string;
    recipient_email: string;
    notify_mode: 'always' | 'on_change';
    day_of_week?: number;
    day_of_month?: number;
    quarterly_start_month?: number;
}

export interface ScheduledJobEntry {
    id: number;
    session_id: string;
    topic: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time_of_day: string;
    recipient_email: string;
    notify_mode: 'always' | 'on_change';
    day_of_week?: number | null;
    day_of_month?: number | null;
    quarterly_start_month?: number | null;
    active: boolean;
    last_run_at?: string | null;
    last_run_changed?: boolean | null;
    last_run_status?: 'success' | 'failed' | null;
    last_error_message?: string | null;
    next_run_at?: string | null;
    created_at: string;
}

export const ALL_FRAMEWORKS = ["PESTLE", "Porter's Five Forces", 'DEEPLIST', 'McKinsey 7-S Model', 'SWOT', 'SOAR'];
export const ALL_FILE_TYPES = ['html', 'pdf', 'docx', 'pptx'];

export interface AdminSettingsResponse {
    prompt_optimization_enabled: boolean;
    blacklist_terms: Record<string, string[]>;
    openai_api_key_set: boolean;
    anthropic_api_key_set: boolean;
    qwen_api_key_set: boolean;
    model_version?: string | null;
    provider_name?: string | null;
    token_rate_limit_per_user?: number | null;
    arabic_enabled: boolean;
    allowed_file_types: string[];
    enabled_frameworks: string[];
    model_moderation_enabled: boolean;
    model_moderation_threshold: number;
    error_log_retention_days?: number | null;
    telemetry_retention_days?: number | null;
    moderation_flag_retention_days?: number | null;
    audit_log_retention_days?: number | null;
    fallback_provider_order: string[];
    presenton_enabled: boolean;
    presenton_base_url?: string | null;
    presenton_api_key_set: boolean;
    presenton_template_name?: string | null;
    pptgenx_enabled: boolean;
    pptgenx_base_url?: string | null;
    pptgenx_api_key_set: boolean;
    web_search_enabled: boolean;
    tavily_api_key_set: boolean;
    updated_at: string;
}

export interface AdminSettingsPayload {
    prompt_optimization_enabled: boolean;
    blacklist_terms: Record<string, string[]>;
    openai_api_key?: string | null;
    anthropic_api_key?: string | null;
    qwen_api_key?: string | null;
    model_version?: string | null;
    provider_name?: string | null;
    token_rate_limit_per_user?: number | null;
    arabic_enabled: boolean;
    allowed_file_types: string[];
    enabled_frameworks: string[];
    model_moderation_enabled: boolean;
    model_moderation_threshold: number;
    error_log_retention_days?: number | null;
    telemetry_retention_days?: number | null;
    moderation_flag_retention_days?: number | null;
    audit_log_retention_days?: number | null;
    fallback_provider_order: Provider[];
    presenton_enabled: boolean;
    presenton_base_url?: string | null;
    presenton_api_key?: string | null;
    presenton_template_name?: string | null;
    pptgenx_enabled: boolean;
    pptgenx_base_url?: string | null;
    pptgenx_api_key?: string | null;
    web_search_enabled: boolean;
    tavily_api_key?: string | null;
}

export interface TrustedSourceEntry {
    id: number;
    category: string;
    name: string;
    url: string;
    created_at: string;
}

export interface CreateTrustedSourceRequest {
    category: string;
    name: string;
    url: string;
}

export interface BulkImportTrustedSourcesResponse {
    imported: TrustedSourceEntry[];
    count: number;
}

export interface McpServerEntry {
    id: string;
    name: string;
    description: string | null;
    base_url: string;
    auth_type: 'none' | 'oauth' | 'api_key';
    oauth_scopes: string | null;
    enabled: boolean;
    created_at: string;
    connection_id?: string | null;
    connection_status?: 'pending' | 'connected' | 'error' | null;
    imported_tools: string[];
}

export interface McpToolEntry {
    name: string;
    description?: string | null;
    inputSchema?: Record<string, unknown>;
    annotations?: {
        title?: string;
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    } | null;
}

export interface CreateMcpServerRequest {
    name: string;
    description?: string;
    base_url: string;
    auth_type: 'none' | 'oauth' | 'api_key';
    oauth_authorize_url?: string;
    oauth_token_url?: string;
    oauth_client_id?: string;
    oauth_client_secret?: string;
    oauth_scopes?: string;
    static_api_key?: string;
}

export interface McpAuthorizeUrlResponse {
    authorize_url: string;
}

export interface McpToolCallResult {
    result: { tools?: McpToolEntry[]; isError?: boolean; content?: unknown[] };
}

export interface GammaStatusResponse {
    connected: boolean;
    theme_id?: string | null;
}

export interface GammaThemeEntry {
    id: string;
    name: string;
}

export interface AgentInstructionEntry {
    id: number;
    user_id: string;
    name: string;
    description?: string | null;
    instructions: string;
    executable_code?: string | null;
    documentation?: string | null;
    resources?: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AgentInstructionRequest {
    user_id: string;
    name: string;
    description: string;
    instructions: string;
    executable_code?: string | null;
    documentation?: string | null;
    resources?: string | null;
    active: boolean;
}

export interface TranslateRequest {
    target_language: string;
}

export interface TranslateResponse {
    language: string;
    content_markdown: string;
    response_time_ms: number;
    total_tokens?: number | null;
}

export interface RefineResponse {
    title: string;
    content_markdown: string;
    response_time_ms: number;
    total_tokens?: number | null;
}

export interface AssistantDef {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface ModerationFlagEntry {
    id: number;
    user_id: string;
    session_id?: string | null;
    input_text: string;
    category: string;
    matched_terms: string[];
    detection_method?: 'blacklist' | 'model' | null;
    model_score?: number | null;
    status: 'flagged' | 'reviewed' | 'corrective_action_taken';
    created_at: string;
}

export interface ErrorLogEntry {
    id: number;
    path: string;
    method: string;
    error_type: string;
    error_message: string;
    traceback: string;
    user_id?: string | null;
    resolved: boolean;
    created_at: string;
}

export interface AuditLogEntry {
    id: number;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    extra_data?: Record<string, unknown> | null;
    created_at: string;
}

export interface ProviderUsage {
    provider: string;
    count: number;
    avg_response_time_ms?: number | null;
    avg_total_tokens?: number | null;
}

export interface FrameworkUsage {
    framework: string;
    count: number;
}

export interface UsageSummaryResponse {
    total_requests: number;
    by_provider: ProviderUsage[];
    avg_confidence_score?: number | null;
    avg_quality_score?: number | null;
    top_frameworks: FrameworkUsage[];
    moderation_block_rate: number;
}

export interface UsageTimeseriesPoint {
    date: string;
    count: number;
    avg_response_time_ms?: number | null;
}

export interface ModerationSummaryResponse {
    total_flags: number;
    by_category: { category: string; count: number }[];
    by_detection_method: { detection_method: string; count: number }[];
    by_status: { status: string; count: number }[];
}
