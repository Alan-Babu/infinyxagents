import { Injectable, inject } from '@angular/core';
import { ApiService, AuthService } from '@nfinyx/services';
import { AttachmentRef, ChatMessage, ChatResponse, ConversationSummary } from '../models/hr-agent.models';

export interface StreamHandlers {
    onStatus: (text: string) => void;
    onToken: (text: string) => void;
    onTokenClear: () => void;
}

const HrChatApiPaths = {
    messages: '/chat/messages',
    attachments: '/chat/attachments',
    conversations: '/chat/conversations',
    ws: '/chat/ws',
};

@Injectable({ providedIn: 'root' })
export class HrChatApiService extends ApiService {
    private readonly auth = inject(AuthService);

    sendMessage(text: string, conversationId: string | null): Promise<ChatResponse> {
        return this.post<ChatResponse>(HrChatApiPaths.messages, { text, conversation_id: conversationId });
    }

    /**
     * Streaming variant over WebSocket: live status lines while tools run (verification,
     * policy search…) and model-token deltas, resolving with the same shape as sendMessage()
     * when the final event arrives. Callers should fall back to sendMessage() if this rejects.
     */
    streamMessage(text: string, conversationId: string | null, handlers: StreamHandlers): Promise<ChatResponse> {
        return new Promise<ChatResponse>((resolve, reject) => {
            const token = this.auth.accessToken() ?? '';
            const wsBase = this.baseURL.replace(/\/$/, '').replace(/^http/, 'ws');
            const socket = new WebSocket(`${wsBase}${HrChatApiPaths.ws}?token=${encodeURIComponent(token)}`);
            let settled = false;

            const fail = (reason: string) => {
                if (settled) return;
                settled = true;
                reject(new Error(reason));
            };

            socket.onopen = () => socket.send(JSON.stringify({ text, conversation_id: conversationId }));
            socket.onmessage = (event: MessageEvent<string>) => {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'status':
                        handlers.onStatus(data.text);
                        break;
                    case 'token':
                        handlers.onToken(data.text);
                        break;
                    case 'token_clear':
                        handlers.onTokenClear();
                        break;
                    case 'final':
                        settled = true;
                        socket.close();
                        resolve(data as ChatResponse);
                        break;
                }
            };
            socket.onerror = () => fail('websocket error');
            socket.onclose = () => fail('websocket closed before reply');
        });
    }

    /**
     * Records a like/dislike on an assistant reply. issueText is only ever meaningful for a
     * dislike, and even then optional — stored server-side, not read back by this app.
     */
    submitFeedback(
        messageId: string,
        conversationId: string,
        rating: 'like' | 'dislike',
        issueText?: string,
    ): Promise<void> {
        return this.post<void>(`${HrChatApiPaths.messages}/${messageId}/feedback`, {
            conversation_id: conversationId,
            rating,
            issue_text: issueText ?? null,
        });
    }

    uploadAttachment(file: File): Promise<AttachmentRef> {
        const form = new FormData();
        form.append('file', file);
        return this.postFormData<AttachmentRef>(HrChatApiPaths.attachments, form);
    }

    getHistory(conversationId: string): Promise<ChatMessage[]> {
        return this.get<ChatMessage[]>(`${HrChatApiPaths.conversations}/${conversationId}/messages`);
    }

    listConversations(): Promise<ConversationSummary[]> {
        return this.get<ConversationSummary[]>(HrChatApiPaths.conversations);
    }

    deleteConversation(conversationId: string): Promise<void> {
        return this.delete<void>(`${HrChatApiPaths.conversations}/${conversationId}`);
    }

    /** Opens a verification document (uploaded/official certificate) in a new tab. */
    async openVerificationDocument(documentPath: string): Promise<void> {
        const blob = await this.getBlob(documentPath);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
}
