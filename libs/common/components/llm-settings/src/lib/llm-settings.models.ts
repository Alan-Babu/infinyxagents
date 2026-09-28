export type LlmProvider = 'openai_compatible' | 'anthropic';

/** One agent's model connection as the backend reports it. The API key is never included: only `api_key_set` and a short hint. */
export interface LlmConfigView {
    provider: LlmProvider;
    base_url: string;
    model: string;
    enabled: boolean;
    timeout_seconds: number;
    max_tokens: number;
    vllm_extras: boolean;
    api_key_set: boolean;
    api_key_hint: string | null;
}

/** GET/PUT/DELETE `/admin/llm` (nfinyx_agent_toolkit.llm.admin). */
export interface LlmSettingsResponse {
    config: LlmConfigView;
    /** False when this agent stores the values another way and only allows viewing + testing here. */
    editable: boolean;
    providers: LlmProvider[];
    limits: { timeout_seconds: [number, number]; max_tokens: [number, number] };
    /** Non-empty when the deployment pins the model to specific hosts (LLM_ALLOWED_HOSTS): anything else is refused. */
    restricted_hosts: string[];
}

/** Send only what changes; a blank `api_key` keeps the current key. */
export interface LlmSettingsUpdate {
    provider?: LlmProvider;
    base_url?: string;
    model?: string;
    api_key?: string;
    enabled?: boolean;
    timeout_seconds?: number;
    max_tokens?: number;
    vllm_extras?: boolean;
}

/** POST `/admin/llm/test`: never an HTTP error for a provider failure, the failure is the answer. */
export interface LlmTestResult {
    ok: boolean;
    model?: string;
    latency_ms?: number;
    sample?: string;
    error?: string;
    status_code?: number | null;
}
