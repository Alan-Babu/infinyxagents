import { CommonModule } from '@angular/common';
import { LocationStrategy } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

import { HumanHandoffBannerComponent } from '../../components/human-handoff-banner/human-handoff-banner';
import { IdleTimeoutBannerComponent } from '../../components/idle-timeout-banner/idle-timeout-banner';
import { MessageBubbleComponent } from '../../components/message-bubble/message-bubble';
import { PrivacyNoticeModalComponent } from '../../components/privacy-notice-modal/privacy-notice-modal';
import { QuickPromptsComponent } from '../../components/quick-prompts/quick-prompts';
import { SessionEndRatingModalComponent } from '../../components/session-end-rating-modal/session-end-rating-modal';
import { VoiceOrbComponent } from '../../components/voice-orb/voice-orb';
import { ChatMessageOut, VoicePhase } from '../../models/chat.models';
import { MofaChatApiService } from '../../services/mofa-chat-api.service';
import { VoiceCaptureService } from '../../services/voice-capture.service';
import { isExitIntent } from '../../utils/exit-intent';

const IDLE_PROMPT_MS = 45_000;
const IDLE_END_MS = 30_000;
const SUPPORT_NUMBER = '80044444';

type EndReason = 'user_exit' | 'idle_timeout' | 'manual';

@Component({
    selector: 'lib-mofa-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        TranslateModule,
        ButtonModule,
        Tooltip,
        MessageBubbleComponent,
        VoiceOrbComponent,
        QuickPromptsComponent,
        HumanHandoffBannerComponent,
        IdleTimeoutBannerComponent,
        PrivacyNoticeModalComponent,
        SessionEndRatingModalComponent,
    ],
    providers: [VoiceCaptureService],
    templateUrl: './mofa-chat.html',
    host: { class: 'flex flex-col overflow-hidden flex-1 min-h-full bg-gray-50' },
})
export class MofaChatPage implements OnInit, OnDestroy {
    private readonly api = inject(MofaChatApiService);
    private readonly voiceCapture = inject(VoiceCaptureService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly router = inject(Router);
    private readonly locationStrategy = inject(LocationStrategy);

    @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

    sessionId: string | null = null;
    messages: ChatMessageOut[] = [];
    messageInput = '';
    sending = false;
    starting = true;

    showIdlePrompt = false;
    private idlePromptTimer?: ReturnType<typeof setTimeout>;
    private idleEndTimer?: ReturnType<typeof setTimeout>;

    showRatingModal = false;
    ratingValue = 0;
    ratingComment = '';
    private endReason: EndReason = 'manual';

    currentHappiness: number | null = null;
    currentHappinessTrend: 'up' | 'down' | 'flat' | null = null;
    showHandoffOffer = false;
    showPrivacyNotice = false;

    shareLink: string | null = null;
    quickPrompts: string[] = [];

    // ---- Voice ----
    playingMessageId: string | null = null;
    private audioEl: HTMLAudioElement | null = null;
    voiceConversationMode = false;
    voicePhase: VoicePhase = 'idle';
    audioLevels: number[] = new Array(32).fill(4);
    private closeAfterSpeak = false;

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => {
            this.rebuildQuickPrompts();
            this.startNewSession();
        });
        this.rebuildQuickPrompts();
    }

    get language(): string {
        return this.translate.currentLang || 'en';
    }
    get isRtl(): boolean {
        return this.language === 'ar';
    }
    get showVoiceOverlay(): boolean {
        return this.voicePhase !== 'idle' || this.voiceConversationMode;
    }
    get deliveryStatusLabel(): (status?: string) => string {
        return (status?: string) => this.translate.instant(`mofaChatbot.chat.delivery.${status || 'sent'}`);
    }

    async ngOnInit(): Promise<void> {
        await this.startNewSession();
    }

    ngOnDestroy(): void {
        this.clearIdleTimers();
        this.audioEl?.pause();
        this.langSub.unsubscribe();
    }

    private rebuildQuickPrompts(): void {
        const prompts = this.translate.instant('mofaChatbot.chat.quickPrompts');
        this.quickPrompts = Array.isArray(prompts) ? prompts : [];
    }

    private appendMessage(msg: ChatMessageOut): void {
        this.messages = [...this.messages, msg];
    }

    private patchMessage(messageId: string, patch: Partial<ChatMessageOut>): void {
        this.messages = this.messages.map(m => (m.message_id === messageId ? { ...m, ...patch } : m));
    }

    async startNewSession(): Promise<void> {
        this.starting = true;
        this.messages = [];
        this.sessionId = null;
        this.shareLink = null;
        this.voiceConversationMode = false;
        this.voicePhase = 'idle';
        this.voiceCapture.cancel();
        this.audioEl?.pause();

        try {
            const res = await this.api.startSession(this.language);
            this.sessionId = res.session_id;
            this.messages = [
                {
                    message_id: 'greeting',
                    role: 'agent',
                    content: res.greeting,
                    language: res.language,
                    confidence_score: null,
                    citations: [],
                    created_at: new Date().toISOString(),
                },
            ];
            this.resetIdleTimer();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.chat.toast.startFailed'));
        } finally {
            this.starting = false;
        }
    }

    selectQuickPrompt(text: string): void {
        this.messageInput = text;
        this.sendMessage();
    }

    async sendMessage(): Promise<void> {
        const text = this.messageInput.trim();
        if (!text || !this.sessionId || this.sending) return;

        this.resetIdleTimer();
        this.sending = true;
        this.messageInput = '';

        const userMsg: ChatMessageOut = {
            message_id: `local-${Date.now()}`,
            role: 'user',
            content: text,
            language: this.language,
            confidence_score: null,
            citations: [],
            created_at: new Date().toISOString(),
            deliveryStatus: 'sent',
        };
        this.appendMessage(userMsg);
        this.scrollToBottom();

        try {
            const agentMsg = await this.api.sendMessage(this.sessionId, text, this.language);
            this.patchMessage(userMsg.message_id, { deliveryStatus: 'delivered' });
            setTimeout(() => this.patchMessage(userMsg.message_id, { deliveryStatus: 'read' }), 200);
            this.appendMessage(agentMsg);
            this.currentHappiness = agentMsg.happiness_score ?? this.currentHappiness;
            this.currentHappinessTrend = agentMsg.happiness_trend ?? this.currentHappinessTrend;
            if (agentMsg.offer_human_handoff) this.showHandoffOffer = true;
            this.scrollToBottom();
            if (isExitIntent(text)) {
                this.endReason = 'user_exit';
                this.closeChatAfterReply();
            }
        } catch (err) {
            this.patchMessage(userMsg.message_id, { deliveryStatus: 'failed' });
            this.common.showApiError(err, this.translate.instant('mofaChatbot.chat.toast.sendFailed'));
        } finally {
            this.sending = false;
        }
    }

    onInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private closeChatAfterReply(): void {
        this.endSpeechToSpeech();
        setTimeout(() => this.openRatingModal(), 400);
    }

    // ---------- Feedback ----------
    async giveFeedback(msg: ChatMessageOut, feedback: 'up' | 'down'): Promise<void> {
        if (msg.feedback === feedback) return;
        this.patchMessage(msg.message_id, { feedback });
        try {
            await this.api.submitMessageFeedback(msg.message_id, feedback);
        } catch {
            this.patchMessage(msg.message_id, { feedback: null });
        }
    }

    // ---------- Idle detection ----------
    private resetIdleTimer(): void {
        this.clearIdleTimers();
        this.showIdlePrompt = false;
        this.idlePromptTimer = setTimeout(() => this.triggerIdlePrompt(), IDLE_PROMPT_MS);
    }
    private clearIdleTimers(): void {
        clearTimeout(this.idlePromptTimer);
        clearTimeout(this.idleEndTimer);
    }
    private triggerIdlePrompt(): void {
        if (this.sending || this.showRatingModal) return;
        this.showIdlePrompt = true;
        this.idleEndTimer = setTimeout(() => this.handleIdleTimeout(), IDLE_END_MS);
    }
    imStillHere(): void {
        this.showIdlePrompt = false;
        this.resetIdleTimer();
    }
    private async handleIdleTimeout(): Promise<void> {
        this.showIdlePrompt = false;
        this.endReason = 'idle_timeout';
        if (this.sessionId) {
            try {
                await this.api.endSession(this.sessionId, 'idle_timeout', 4, undefined, true);
            } catch {
                // Best-effort — idle close still proceeds locally.
            }
        }
        this.appendMessage({
            message_id: `local-idle-${Date.now()}`,
            role: 'agent',
            content: this.translate.instant('mofaChatbot.chat.idle.closingMessage'),
            language: this.language,
            confidence_score: null,
            citations: [],
            created_at: new Date().toISOString(),
        });
        this.scrollToBottom();
    }

    // ---------- Star rating ----------
    openRatingModal(): void {
        this.showRatingModal = true;
        this.ratingValue = 0;
        this.ratingComment = '';
    }
    async submitRating(): Promise<void> {
        if (this.sessionId) {
            try {
                await this.api.endSession(this.sessionId, this.endReason, this.ratingValue || undefined, this.ratingComment.trim() || undefined, this.ratingValue === 0);
            } catch {
                // Best-effort.
            }
        }
        this.showRatingModal = false;
        this.common.showSuccessMessage(this.translate.instant('mofaChatbot.chat.rating.thanks'));
    }
    async skipRating(): Promise<void> {
        if (this.sessionId) {
            try {
                await this.api.endSession(this.sessionId, this.endReason, 4, undefined, true);
            } catch {
                // Best-effort.
            }
        }
        this.showRatingModal = false;
    }

    // ---------- Save & share ----------
    async saveAndShare(): Promise<void> {
        if (!this.sessionId) return;
        try {
            const res = await this.api.saveSession(this.sessionId);
            const urlTree = this.router.createUrlTree(['/mofa-chatbot/shared', res.share_token]);
            const externalUrl = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(urlTree));
            this.shareLink = `${window.location.origin}/${externalUrl.replace(/^\/+/, '')}`;
            try {
                await navigator.clipboard.writeText(this.shareLink);
                this.common.showSuccessMessage(this.translate.instant('mofaChatbot.chat.toast.linkCopied'));
            } catch {
                this.common.showSuccessMessage(this.translate.instant('mofaChatbot.chat.toast.chatSaved'));
            }
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.chat.toast.saveFailed'));
        }
    }

    // ---------- Voice input (live conversation) ----------
    async startSpeechToSpeech(): Promise<void> {
        this.voiceConversationMode = true;
        this.closeAfterSpeak = false;
        this.voicePhase = 'idle';
        await this.startRecording();
    }

    endSpeechToSpeech(): void {
        this.voiceConversationMode = false;
        this.cancelVoice();
    }

    cancelVoice(): void {
        this.voiceCapture.cancel();
        this.audioEl?.pause();
        this.playingMessageId = null;
        this.sending = false;
        this.voicePhase = 'idle';
        this.audioLevels = new Array(32).fill(4);
    }

    private async startRecording(): Promise<void> {
        try {
            this.resetIdleTimer();
            this.voicePhase = 'listening';
            await this.voiceCapture.start({
                onLevels: levels => (this.audioLevels = levels),
                onAutoStop: () => this.stopRecordingAndSubmit(),
                onNoSpeechTimeout: () => this.handleNoSpeechTimeout(),
            });
        } catch {
            this.voicePhase = 'idle';
            this.common.showErrorMessage(this.translate.instant('mofaChatbot.chat.voice.micError'));
        }
    }

    private async stopRecordingAndSubmit(): Promise<void> {
        const blob = await this.voiceCapture.stop();
        if (!blob || !this.sessionId) {
            if (!this.voiceConversationMode) this.voicePhase = 'idle';
            return;
        }
        this.sending = true;
        this.voicePhase = 'transmitting';
        setTimeout(() => {
            if (this.voicePhase === 'transmitting') this.voicePhase = 'thinking';
        }, 1600);

        try {
            const res = await this.api.recordVoiceMessage(this.sessionId, blob, this.language);
            this.appendMessage({
                message_id: `local-voice-${Date.now()}`,
                role: 'user',
                content: res.transcribed_text || '',
                language: this.language,
                confidence_score: null,
                citations: [],
                created_at: new Date().toISOString(),
                deliveryStatus: 'read',
            });
            this.appendMessage(res);
            this.sending = false;
            this.scrollToBottom();
            const closing = isExitIntent(res.transcribed_text || '');
            this.closeAfterSpeak = closing;
            if (closing) this.endReason = 'user_exit';

            if (this.voiceConversationMode) {
                await this.playMessageAudio(res, !closing);
            } else {
                this.voicePhase = 'idle';
                if (closing) this.closeChatAfterReply();
            }
        } catch (err) {
            this.sending = false;
            this.voicePhase = 'idle';
            this.common.showApiError(err, this.translate.instant('mofaChatbot.chat.voice.processError'));
        }
    }

    private handleNoSpeechTimeout(): void {
        this.voiceCapture.stop();
        if (this.voiceConversationMode) {
            this.startRecording();
        }
    }

    async toggleRecording(): Promise<void> {
        if (this.voiceCapture.isRecording) {
            await this.stopRecordingAndSubmit();
        } else {
            await this.startRecording();
        }
    }

    // ---------- Voice output (listen) ----------
    async playMessageAudio(msg: ChatMessageOut, thenListenAgain = false): Promise<void> {
        if (this.playingMessageId === msg.message_id) {
            this.audioEl?.pause();
            this.playingMessageId = null;
            if (!this.voiceConversationMode) this.voicePhase = 'idle';
            return;
        }
        this.playingMessageId = msg.message_id;
        this.voicePhase = 'speaking';

        try {
            const res = await this.api.speakMessage(msg.message_id);
            const audio = new Audio(`data:${res.mime_type};base64,${res.audio_base64}`);
            this.audioEl = audio;
            await audio.play();
            audio.onended = () => {
                this.playingMessageId = null;
                if (this.closeAfterSpeak) {
                    this.closeAfterSpeak = false;
                    this.closeChatAfterReply();
                    return;
                }
                if (thenListenAgain && this.voiceConversationMode) {
                    this.startRecording();
                } else {
                    this.voicePhase = 'idle';
                }
            };
        } catch {
            this.playingMessageId = null;
            this.voicePhase = 'idle';
            this.common.showErrorMessage(this.translate.instant('mofaChatbot.chat.voice.speakUnavailable'));
            if (thenListenAgain && this.voiceConversationMode) await this.startRecording();
        }
    }

    // ---------- Human handoff ----------
    acceptHandoff(): void {
        this.showHandoffOffer = false;
        this.appendMessage({
            message_id: `local-handoff-${Date.now()}`,
            role: 'agent',
            content: this.translate.instant('mofaChatbot.chat.handoff.acceptedMessage', { number: SUPPORT_NUMBER }),
            language: this.language,
            confidence_score: null,
            citations: [],
            created_at: new Date().toISOString(),
        });
        this.scrollToBottom();
    }
    dismissHandoff(): void {
        this.showHandoffOffer = false;
    }
    requestHumanHelp(): void {
        this.acceptHandoff();
    }

    private scrollToBottom(): void {
        setTimeout(() => this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' }));
    }
}
