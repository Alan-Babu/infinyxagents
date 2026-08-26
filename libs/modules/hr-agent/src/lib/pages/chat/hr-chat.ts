import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { HrChatApiService } from '../../services/hr-chat-api.service';
import { ChatMessage, ConversationSummary, TokenUsage, VerificationSummary } from '../../models/hr-agent.models';

interface QuickAction {
    icon: string;
    labelKey: string;
    prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { icon: 'pi pi-wallet', labelKey: 'hrAgent.quickActions.leaveBalance', prompt: 'What is my current leave balance?' },
    { icon: 'pi pi-clipboard', labelKey: 'hrAgent.quickActions.appliedLeaves', prompt: 'Show me the leaves I have applied for.' },
    { icon: 'pi pi-times-circle', labelKey: 'hrAgent.quickActions.cancelLeaves', prompt: 'I would like to cancel a leave request.' },
    { icon: 'pi pi-calendar-plus', labelKey: 'hrAgent.quickActions.applyForLeave', prompt: 'I would like to apply for leave.' },
    { icon: 'pi pi-calendar', labelKey: 'hrAgent.quickActions.leavePolicy', prompt: 'What is the company leave policy?' },
];

interface ConversationGroup {
    labelKey: string;
    items: ConversationSummary[];
}

@Component({
    selector: 'lib-hr-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, Tooltip],
    templateUrl: './hr-chat.html',
    host: {
        class: 'flex flex-col overflow-hidden flex-1 min-h-full',
    },
})
export class HrChatPage implements OnInit {
    private readonly chat = inject(HrChatApiService);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);

    @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

    messages: ChatMessage[] = [this.greeting()];
    draft = '';
    conversationId: string | null = null;
    pendingAttachmentId: string | null = null;
    pendingAttachmentName = '';
    sending = false;

    conversations: ConversationSummary[] = [];
    loadingHistory = false;

    readonly quickActions = QUICK_ACTIONS;

    /** Live-progress state while a reply is being generated. */
    statusText = '';
    streamText = '';

    get userInitials(): string {
        const name = this.auth.user()?.displayName || '';
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]!.toUpperCase())
            .join('');
    }

    async ngOnInit(): Promise<void> {
        await this.refreshConversations();
    }

    get groupedConversations(): ConversationGroup[] {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const groups: ConversationGroup[] = [
            { labelKey: 'hrAgent.history.today', items: [] },
            { labelKey: 'hrAgent.history.previous7Days', items: [] },
            { labelKey: 'hrAgent.history.older', items: [] },
        ];

        for (const conversation of this.conversations) {
            const created = new Date(conversation.created_at);
            const dayDiff = Math.floor((startOfToday.getTime() - created.setHours(0, 0, 0, 0)) / 86_400_000);
            if (dayDiff <= 0) groups[0].items.push(conversation);
            else if (dayDiff <= 7) groups[1].items.push(conversation);
            else groups[2].items.push(conversation);
        }

        return groups.filter(group => group.items.length > 0);
    }

    get currentTitle(): string {
        const conversation = this.conversations.find(c => c.id === this.conversationId);
        const preview = conversation?.preview?.trim();
        if (!preview) return this.conversationId ? this.translate.instant('hrAgent.conversation') : this.translate.instant('hrAgent.newChat');
        return preview.length > 60 ? `${preview.slice(0, 57)}…` : preview;
    }

    async send(): Promise<void> {
        const text = this.draft.trim();
        if ((!text && !this.pendingAttachmentId) || this.sending) return;

        const body = text || this.translate.instant('hrAgent.attachedDocumentFallback');
        const withAttachment = this.pendingAttachmentId
            ? `${body}\n\n[attachment_id: ${this.pendingAttachmentId}]`
            : body;

        const isNewConversation = !this.conversationId;
        this.messages.push({
            role: 'user',
            content: text,
            attachmentName: this.pendingAttachmentName || undefined,
            created_at: new Date().toISOString(),
        });
        this.draft = '';
        this.pendingAttachmentId = null;
        this.pendingAttachmentName = '';
        this.sending = true;
        this.statusText = this.translate.instant('hrAgent.thinking');
        this.streamText = '';
        this.scrollToBottom();

        try {
            let response;
            try {
                response = await this.chat.streamMessage(withAttachment, this.conversationId, {
                    onStatus: (status) => {
                        this.statusText = status;
                        this.scrollToBottom();
                    },
                    onToken: (token) => {
                        this.streamText += token;
                        this.scrollToBottom();
                    },
                    onTokenClear: () => {
                        this.streamText = '';
                    },
                });
            } catch {
                // WebSocket unavailable (proxy, old backend…): plain request instead.
                response = await this.chat.sendMessage(withAttachment, this.conversationId);
            }
            this.conversationId = response.conversation_id;
            this.messages.push({
                id: response.message_id,
                role: 'assistant',
                content: response.reply,
                verification: response.verification ?? null,
                duration_ms: response.duration_ms,
                token_usage: response.token_usage,
                created_at: new Date().toISOString(),
            });
            if (isNewConversation) await this.refreshConversations();
        } catch {
            this.messages.push({
                role: 'assistant',
                content: this.translate.instant('hrAgent.genericError'),
                created_at: new Date().toISOString(),
            });
        } finally {
            this.sending = false;
            this.statusText = '';
            this.streamText = '';
            this.scrollToBottom();
        }
    }

    /** Re-sends the most recent user message, e.g. from the "regenerate" action under the latest reply. */
    async regenerateLast(): Promise<void> {
        if (this.sending) return;
        const lastUser = [...this.messages].reverse().find(message => message.role === 'user');
        if (!lastUser) return;
        this.draft = lastUser.content;
        await this.send();
    }

    formatDuration(ms?: number): string {
        if (!ms) return '';
        return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
    }

    formatTokens(usage?: TokenUsage | null): string {
        if (!usage?.total_tokens) return '';
        return this.translate.instant('hrAgent.tokenCount', { count: usage.total_tokens.toLocaleString() });
    }

    /**
     * Short, conversational stand-in for the raw field-by-field comparison text the backend
     * sends. The verification card below already renders that detail, so the bubble just
     * states the outcome instead of duplicating a dense text dump.
     */
    verificationSummaryText(verification: VerificationSummary): string {
        if (verification.approved && verification.leave_request) {
            const leave = verification.leave_request;
            return this.translate.instant('hrAgent.verification.approvedSummary', {
                days: leave.days, start: leave.start_date, end: leave.end_date,
            });
        }
        return this.translate.instant('hrAgent.verification.notApprovedSummary', { reason: verification.reason });
    }

    async copyMessage(message: ChatMessage): Promise<void> {
        await navigator.clipboard.writeText(message.content);
    }

    speakMessage(message: ChatMessage): void {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(message.content));
    }

    /**
     * Like submits immediately. Dislike opens the inline "what went wrong?" box instead — its
     * own Submit/Skip actions are what actually call the service.
     */
    async giveFeedback(message: ChatMessage, rating: 'like' | 'dislike'): Promise<void> {
        if (!message.id || !this.conversationId) return;
        if (rating === 'dislike') {
            message.feedbackPromptOpen = true;
            return;
        }
        message.feedback = 'like';
        message.feedbackPromptOpen = false;
        try {
            await this.chat.submitFeedback(message.id, this.conversationId, 'like');
        } catch {
            // Non-fatal: the like still shows as given locally even if the network call failed.
        }
    }

    async submitDislikeReason(message: ChatMessage, issueText: string): Promise<void> {
        await this.recordDislike(message, issueText.trim() || undefined);
    }

    async skipDislikeReason(message: ChatMessage): Promise<void> {
        await this.recordDislike(message, undefined);
    }

    private async recordDislike(message: ChatMessage, issueText: string | undefined): Promise<void> {
        if (!message.id || !this.conversationId) return;
        message.feedback = 'dislike';
        message.feedbackPromptOpen = false;
        try {
            await this.chat.submitFeedback(message.id, this.conversationId, 'dislike', issueText);
        } catch {
            // Non-fatal — see giveFeedback.
        }
    }

    async openConversation(conversation: ConversationSummary): Promise<void> {
        if (this.sending || this.loadingHistory) return;
        this.loadingHistory = true;
        try {
            const history = await this.chat.getHistory(conversation.id);
            this.conversationId = conversation.id;
            this.messages = history
                .filter(message => message.role === 'user' || message.role === 'assistant')
                .map(message => ({
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    created_at: message.created_at,
                    verification: message.metadata?.verification ?? null,
                    duration_ms: message.metadata?.duration_ms,
                    token_usage: message.metadata?.token_usage,
                }));
            if (this.messages.length === 0) this.messages = [this.greeting()];
            this.scrollToBottom();
        } finally {
            this.loadingHistory = false;
        }
    }

    async deleteConversation(event: Event, conversation: ConversationSummary): Promise<void> {
        event.stopPropagation();
        if (this.loadingHistory) return;
        this.loadingHistory = true;
        try {
            await this.chat.deleteConversation(conversation.id);
            this.conversations = this.conversations.filter(c => c.id !== conversation.id);
            if (this.conversationId === conversation.id) this.newChat();
        } finally {
            this.loadingHistory = false;
        }
    }

    newChat(): void {
        if (this.sending) return;
        this.conversationId = null;
        this.messages = [this.greeting()];
        this.clearAttachment();
    }

    async askForHuman(): Promise<void> {
        if (this.sending) return;
        this.draft = this.translate.instant('hrAgent.talkToHumanMessage');
        await this.send();
    }

    /** Quick-action sidebar buttons send their prompt exactly like typing it into the composer and pressing Send. */
    async sendQuickAction(action: QuickAction): Promise<void> {
        if (this.sending) return;
        this.draft = action.prompt;
        await this.send();
    }

    private async refreshConversations(): Promise<void> {
        try {
            this.conversations = await this.chat.listConversations();
        } catch {
            // Non-fatal: the history panel just stays empty.
        }
    }

    async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const ref = await this.chat.uploadAttachment(file);
        this.pendingAttachmentId = ref.attachment_id;
        this.pendingAttachmentName = file.name;
        input.value = '';
    }

    clearAttachment(): void {
        this.pendingAttachmentId = null;
        this.pendingAttachmentName = '';
    }

    async openDocument(documentPath: string | null): Promise<void> {
        if (!documentPath) return;
        await this.chat.openVerificationDocument(documentPath);
    }

    private greeting(): ChatMessage {
        return {
            role: 'assistant',
            content: this.translate.instant('hrAgent.greeting'),
            created_at: new Date().toISOString(),
        };
    }

    private scrollToBottom(): void {
        queueMicrotask(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }));
    }
}
