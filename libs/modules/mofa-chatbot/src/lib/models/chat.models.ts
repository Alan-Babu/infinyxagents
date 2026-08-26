/** DTOs for the public-facing chat + shared-transcript surface, verified against the legacy `core/models.ts`. */

export interface Citation {
    title: string;
    url: string | null;
}

export interface ChatMessageOut {
    message_id: string;
    role: 'user' | 'agent';
    content: string;
    language: string | null;
    confidence_score: number | null;
    was_answered?: boolean;
    citations: Citation[];
    suggested_followups?: string[];
    feedback?: 'up' | 'down' | null;
    created_at: string;
    /**
     * Client-side only: tracks a USER message's delivery lifecycle for the
     * WhatsApp-style tick indicators — never sent by or read from the
     * backend, since this is a REST (not push/WebSocket) architecture and
     * the states are inferred from the request lifecycle, not server-pushed events.
     */
    deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
    /** Live session-level sentiment, carried on every agent reply. */
    happiness_score?: number | null;
    happiness_trend?: 'up' | 'down' | 'flat' | null;
    offer_human_handoff?: boolean;
    transcribed_text?: string;
    detected_language?: 'en' | 'ar';
}

export interface StartSessionResult {
    session_id: string;
    greeting: string;
    language: string;
}

export interface SharedChatMessage {
    role: string;
    content: string;
    created_at: string;
}

export interface SharedChatResult {
    session_id: string;
    language: string;
    messages: SharedChatMessage[];
}

export interface SpeakMessageResult {
    message_id: string;
    audio_base64: string;
    mime_type: string;
}

export interface SaveSessionResult {
    session_id: string;
    share_token: string;
}

export type VoicePhase = 'idle' | 'listening' | 'transmitting' | 'thinking' | 'speaking';
