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

export type Template = 'Auto (agent picks)' | 'Editorial Navy' | 'Corporate Minimal' | 'Modern Teal';

export interface ClarifyingQuestion {
    id: string;
    question: string;
    suggested_answers: string[];
}

export interface StartSessionResponse {
    session_id: string;
    category_guess: Category;
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
}

export interface ExportResponse {
    file_path: string;
    file_name: string;
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
}

export interface HistoryDetailEntry extends HistoryEntry {
    title: string;
    content_markdown: string;
    dashboard_data?: CountryDashboardData | null;
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
