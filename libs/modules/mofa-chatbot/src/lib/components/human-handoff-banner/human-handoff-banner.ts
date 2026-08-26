import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

/** Proactive nudge shown when the live sentiment score drops below the backend's threshold. */
@Component({
    selector: 'lib-human-handoff-banner',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    template: `
        <div class="mx-6 mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <i class="pi pi-heart text-amber-600"></i>
            <span class="flex-1">{{ 'mofaChatbot.chat.handoff.banner' | translate }}</span>
            <div class="flex gap-2">
                <button
                    type="button"
                    pButton
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    class="cursor-pointer"
                    (click)="dismiss.emit()"
                >
                    <span>{{ 'mofaChatbot.chat.handoff.noThanks' | translate }}</span>
                </button>
                <button type="button" pButton size="small" class="cursor-pointer" (click)="accept.emit()">
                    <span>{{ 'mofaChatbot.chat.handoff.yesPlease' | translate }}</span>
                </button>
            </div>
        </div>
    `,
})
export class HumanHandoffBannerComponent {
    @Output() accept = new EventEmitter<void>();
    @Output() dismiss = new EventEmitter<void>();
}
