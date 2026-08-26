import { Injectable } from '@angular/core';
import { ChatMessageOut, SaveSessionResult, SharedChatResult, SpeakMessageResult, StartSessionResult } from '../models/chat.models';
import { normalizeChatMessage } from '../utils/message-normalizer';
import { MofaChatbotApiBase } from './mofa-chatbot-api-base';

/** Public-facing chat, voice, and shared-transcript endpoints. */
@Injectable({ providedIn: 'root' })
export class MofaChatApiService extends MofaChatbotApiBase {
    async startSession(language: string): Promise<StartSessionResult> {
        const res = await this.post<StartSessionResult>('/chat/sessions', { language });
        return {
            session_id: res?.session_id ?? '',
            greeting: res?.greeting ?? '',
            language: res?.language ?? language,
        };
    }

    async sendMessage(sessionId: string, text: string, language: string, inputMode: 'text' | 'voice' = 'text'): Promise<ChatMessageOut> {
        const res = await this.post<unknown>('/chat/messages', { session_id: sessionId, text, language, input_mode: inputMode });
        return normalizeChatMessage(res);
    }

    async getMessages(sessionId: string): Promise<ChatMessageOut[]> {
        const rows = await this.get<unknown[]>(`/chat/sessions/${sessionId}/messages`);
        return Array.isArray(rows) ? rows.map(normalizeChatMessage) : [];
    }

    submitMessageFeedback(messageId: string, feedback: 'up' | 'down'): Promise<void> {
        return this.post<void>(`/chat/messages/${messageId}/feedback`, { feedback });
    }

    endSession(sessionId: string, reason: string, rating?: number, ratingComment?: string, ratingIsDefault = false): Promise<void> {
        return this.post<void>(`/chat/sessions/${sessionId}/end`, {
            reason,
            rating: rating ?? null,
            rating_comment: ratingComment ?? null,
            rating_is_default: ratingIsDefault,
        });
    }

    saveSession(sessionId: string): Promise<SaveSessionResult> {
        return this.post<SaveSessionResult>(`/chat/sessions/${sessionId}/save`, {});
    }

    getSharedSession(shareToken: string): Promise<SharedChatResult> {
        return this.get<SharedChatResult>(`/chat/shared/${shareToken}`);
    }

    async recordVoiceMessage(sessionId: string, audioBlob: Blob, language?: string): Promise<ChatMessageOut> {
        const fd = new FormData();
        fd.append('file', audioBlob, 'recording.webm');
        const params = new URLSearchParams({ session_id: sessionId, ...(language ? { language } : {}) });
        const res = await this.postFormData<unknown>(`/chat/voice-messages?${params.toString()}`, fd);
        return normalizeChatMessage(res);
    }

    speakMessage(messageId: string): Promise<SpeakMessageResult> {
        return this.post<SpeakMessageResult>(`/chat/messages/${messageId}/speak`, {});
    }
}
