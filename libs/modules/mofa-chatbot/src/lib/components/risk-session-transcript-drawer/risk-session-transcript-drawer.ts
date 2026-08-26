import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { SessionTranscript } from '../../models/admin.models';

/** Read-only session-transcript drawer opened from the admin Risk & Sentiment list. */
@Component({
    selector: 'lib-risk-session-transcript-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, DrawerModule],
    template: `
        <p-drawer [visible]="!!transcript" position="right" styleClass="p-drawer-md" appendTo="body" [baseZIndex]="1200" (onHide)="closed.emit()">
            <ng-template #header>
                <div class="flex flex-col">
                    <span class="text-xs font-bold uppercase tracking-wide text-primary-600">{{ 'mofaChatbot.admin.riskSessions.transcriptTitle' | translate }}</span>
                    @if (transcript) {
                        <span class="font-mono text-xs text-gray-400">{{ transcript.session_id }}</span>
                    }
                </div>
            </ng-template>

            @if (transcript) {
                @if (transcript.risk_reason) {
                    <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">{{ transcript.risk_reason }}</div>
                }
                <div class="flex flex-col gap-3">
                    @for (m of transcript.messages; track $index) {
                        <div class="flex flex-col gap-1" [class.items-end]="m.role === 'user'">
                            <span class="px-1 text-xs font-bold uppercase tracking-wide text-gray-400">{{ m.role }}</span>
                            <div
                                class="max-w-[85%] whitespace-pre-wrap rounded-lg border px-3.5 py-2.5 text-sm"
                                [class.bg-white]="m.role !== 'user'"
                                [class.border-gray-200]="m.role !== 'user'"
                                [class.bg-primary-50]="m.role === 'user'"
                                [class.border-primary-100]="m.role === 'user'"
                            >
                                {{ m.content }}
                            </div>
                            @if (m.detected_sentiment || m.blocked_reason) {
                                <div class="flex gap-2 px-1 text-xs text-gray-400">
                                    @if (m.detected_sentiment) {
                                        <span>{{ m.detected_sentiment }}</span>
                                    }
                                    @if (m.blocked_reason) {
                                        <span class="font-semibold text-red-600">{{ 'mofaChatbot.admin.riskSessions.blockedLabel' | translate }}: {{ m.blocked_reason }}</span>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>
            }
        </p-drawer>
    `,
})
export class RiskSessionTranscriptDrawerComponent {
    @Input() transcript: SessionTranscript | null = null;
    @Output() closed = new EventEmitter<void>();
}
