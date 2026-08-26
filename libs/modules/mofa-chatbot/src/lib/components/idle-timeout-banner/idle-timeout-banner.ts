import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

/** "Still there?" banner shown after 45s of no user activity; auto-ends the session 30s later if unanswered. */
@Component({
    selector: 'lib-idle-timeout-banner',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    template: `
        <div class="mx-6 mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <i class="pi pi-clock text-gray-400"></i>
            <span class="flex-1">{{ 'mofaChatbot.chat.idle.prompt' | translate }}</span>
            <button type="button" pButton size="small" class="cursor-pointer" (click)="stillHere.emit()">
                <span>{{ 'mofaChatbot.chat.idle.stillHere' | translate }}</span>
            </button>
        </div>
    `,
})
export class IdleTimeoutBannerComponent {
    @Output() stillHere = new EventEmitter<void>();
}
