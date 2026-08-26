import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Tooltip } from 'primeng/tooltip';
import { ChatMessageOut } from '../../models/chat.models';

/** Renders a single chat bubble (user or agent), following `hr-agent`'s bubble styling convention. */
@Component({
    selector: 'lib-message-bubble',
    standalone: true,
    imports: [CommonModule, TranslateModule, Tooltip],
    template: `
        <div class="flex items-start gap-3" [class.flex-row-reverse]="message.role === 'user'">
            @if (message.role === 'agent') {
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-primary-500 bg-white text-primary-500">
                    <i class="pi pi-android"></i>
                </span>
            } @else {
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-500 text-white">
                    <i class="pi pi-user"></i>
                </span>
            }

            <div class="flex max-w-[70%] flex-col gap-1.5" [class.items-end]="message.role === 'user'">
                <div
                    class="whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed"
                    [class.bg-white]="message.role === 'agent'"
                    [class.text-gray-900]="message.role === 'agent'"
                    [class.border]="message.role === 'agent'"
                    [class.border-gray-200]="message.role === 'agent'"
                    [class.bg-primary-600]="message.role === 'user'"
                    [class.text-white]="message.role === 'user'"
                >
                    {{ message.content }}
                </div>

                <div class="flex items-center gap-2 px-1 text-xs text-gray-400">
                    <span>{{ formatTime(message.created_at) }}</span>

                    @if (message.role === 'user' && message.deliveryStatus) {
                        <span [pTooltip]="deliveryLabel" tooltipPosition="top">
                            @if (message.deliveryStatus === 'sent') {
                                <i class="pi pi-check"></i>
                            } @else if (message.deliveryStatus === 'delivered' || message.deliveryStatus === 'read') {
                                <i class="pi pi-check-circle" [class.text-primary-500]="message.deliveryStatus === 'read'"></i>
                            } @else if (message.deliveryStatus === 'failed') {
                                <i class="pi pi-exclamation-circle text-red-500"></i>
                            }
                        </span>
                    }

                    @if (message.role === 'agent' && message.confidence_score !== null && message.confidence_score !== undefined) {
                        <span
                            class="inline-block h-1.5 w-1.5 rounded-full"
                            [class.bg-green-500]="message.confidence_score >= 75"
                            [class.bg-amber-500]="message.confidence_score >= 40 && message.confidence_score < 75"
                            [class.bg-red-500]="message.confidence_score < 40"
                        ></span>
                    }
                </div>

                @if (message.citations && message.citations.length) {
                    <div class="flex flex-wrap gap-1.5">
                        @for (c of message.citations; track c.title) {
                            <span class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                                <i class="pi pi-link text-xs"></i>
                                {{ c.title }}
                            </span>
                        }
                    </div>
                }

                @if (message.role === 'agent' && showActions) {
                    <div class="flex items-center gap-3 px-1 text-gray-400">
                        <button
                            type="button"
                            class="cursor-pointer transition hover:text-primary-600"
                            [class.text-primary-500]="isPlaying"
                            [pTooltip]="'mofaChatbot.chat.listenTooltip' | translate"
                            tooltipPosition="top"
                            (click)="listen.emit()"
                        >
                            <i class="pi pi-volume-up"></i>
                        </button>
                        <button
                            type="button"
                            class="cursor-pointer transition hover:text-primary-600"
                            [class.text-primary-500]="message.feedback === 'up'"
                            [pTooltip]="'mofaChatbot.chat.feedbackUpTooltip' | translate"
                            tooltipPosition="top"
                            (click)="feedback.emit('up')"
                        >
                            <i class="pi pi-thumbs-up"></i>
                        </button>
                        <button
                            type="button"
                            class="cursor-pointer transition hover:text-primary-600"
                            [class.text-red-500]="message.feedback === 'down'"
                            [pTooltip]="'mofaChatbot.chat.feedbackDownTooltip' | translate"
                            tooltipPosition="top"
                            (click)="feedback.emit('down')"
                        >
                            <i class="pi pi-thumbs-down"></i>
                        </button>
                    </div>
                }

                @if (message.suggested_followups && message.suggested_followups.length) {
                    <div class="flex flex-col gap-1.5">
                        <div class="px-1 text-xs font-semibold text-gray-400">{{ 'mofaChatbot.chat.followUpsLabel' | translate }}</div>
                        @for (f of message.suggested_followups; track f) {
                            <button
                                type="button"
                                class="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-start text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                (click)="followupSelect.emit(f)"
                            >
                                {{ f }}
                            </button>
                        }
                    </div>
                }
            </div>
        </div>
    `,
})
export class MessageBubbleComponent {
    @Input({ required: true }) message!: ChatMessageOut;
    @Input() isPlaying = false;
    @Input() showActions = true;
    @Input() deliveryLabel = '';

    @Output() feedback = new EventEmitter<'up' | 'down'>();
    @Output() listen = new EventEmitter<void>();
    @Output() followupSelect = new EventEmitter<string>();

    formatTime(iso: string): string {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
}
