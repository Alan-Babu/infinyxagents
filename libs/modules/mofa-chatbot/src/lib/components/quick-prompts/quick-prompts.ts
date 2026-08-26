import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/** Suggested-question chip row shown until the visitor sends their first real message. */
@Component({
    selector: 'lib-quick-prompts',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <div class="mx-auto flex max-w-4xl flex-col gap-2 px-1">
            <div class="text-xs font-semibold text-gray-400">{{ 'mofaChatbot.chat.quickPromptsLabel' | translate }}</div>
            <div class="flex flex-wrap gap-2">
                @for (prompt of prompts; track prompt) {
                    <button
                        type="button"
                        class="cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-start text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
                        (click)="promptSelect.emit(prompt)"
                    >
                        {{ prompt }}
                    </button>
                }
            </div>
        </div>
    `,
})
export class QuickPromptsComponent {
    @Input() prompts: string[] = [];
    @Output() promptSelect = new EventEmitter<string>();
}
