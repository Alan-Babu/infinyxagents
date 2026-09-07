import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { ChatMessageOut, MyChatSession } from '../../models/chat.models';
import { formatTimestamp } from '../../utils/date-format';
import { MessageBubbleComponent } from '../message-bubble/message-bubble';

/**
 * A visitor's own past sessions -- list view, and (once one is picked) a
 * read-only transcript rendered with the same MessageBubbleComponent live
 * chat uses. Parent owns fetching (mirrors risk-session-transcript-drawer /
 * crawled-page-detail-drawer's pattern: this component is presentational,
 * driven entirely by inputs).
 */
@Component({
    selector: 'lib-chat-history-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, DrawerModule, MessageBubbleComponent],
    template: `
        <p-drawer [visible]="visible" position="right" styleClass="p-drawer-md" appendTo="body" [baseZIndex]="1200" (onHide)="closed.emit()">
            <ng-template #header>
                <div class="flex items-center gap-2">
                    @if (selectedSessionId) {
                        <button type="button" class="cursor-pointer text-gray-500 hover:text-primary-600" (click)="backToList.emit()">
                            <i class="pi pi-arrow-left"></i>
                        </button>
                    }
                    <span class="text-xs font-bold uppercase tracking-wide text-primary-600">{{ 'mofaChatbot.chat.history.title' | translate }}</span>
                </div>
            </ng-template>

            @if (loading) {
                <div class="flex items-center justify-center py-16">
                    <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
                </div>
            } @else if (selectedSessionId) {
                <div class="flex flex-col gap-5">
                    @for (message of transcript; track message.message_id) {
                        <lib-message-bubble [message]="message" [showActions]="false" />
                    }
                    @if (!transcript.length) {
                        <p class="text-sm text-gray-400">{{ 'mofaChatbot.chat.history.emptyTranscript' | translate }}</p>
                    }
                </div>
            } @else if (sessions.length) {
                <div class="flex flex-col gap-2">
                    @for (s of sessions; track s.session_id) {
                        <button
                            type="button"
                            class="flex cursor-pointer flex-col items-start gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-start transition hover:border-primary-300 hover:bg-primary-50"
                            (click)="sessionSelect.emit(s)"
                        >
                            <span class="text-sm font-medium text-gray-800">{{ formatStarted(s.started_at) }}</span>
                            <span class="text-xs text-gray-400">
                                {{ s.language === 'ar' ? ('mofaChatbot.admin.common.languageAr' | translate) : ('mofaChatbot.admin.common.languageEn' | translate) }}
                                &middot; {{ s.status }}
                                @if (s.rating) {
                                    &middot; {{ s.rating }} ★
                                }
                            </span>
                        </button>
                    }
                </div>
            } @else {
                <p class="text-sm text-gray-400">{{ 'mofaChatbot.chat.history.empty' | translate }}</p>
            }
        </p-drawer>
    `,
})
export class ChatHistoryDrawerComponent {
    @Input() visible = false;
    @Input() loading = false;
    @Input() sessions: MyChatSession[] = [];
    @Input() selectedSessionId: string | null = null;
    @Input() transcript: ChatMessageOut[] = [];

    @Output() closed = new EventEmitter<void>();
    @Output() sessionSelect = new EventEmitter<MyChatSession>();
    @Output() backToList = new EventEmitter<void>();

    formatStarted(iso: string): string {
        return formatTimestamp(iso);
    }
}
