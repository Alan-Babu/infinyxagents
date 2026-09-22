import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { LEGAL_AI_BASE } from '../../legal-ai.paths';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiDocumentsStore } from '../../state/legal-ai-documents.store';
import { LegalAiUiState } from '../../state/legal-ai-ui.state';

/** Floating analysis monitor: appears while any document is being analysed, hides when they finish. */
@Component({
    selector: 'lib-legal-ai-processing-monitor',
    standalone: true,
    imports: [RouterLink, TranslateModule, ProgressBarModule],
    template: `
        @if (docs.processing().length > 0 && !ui.processingDismissed()) {
        <section class="fixed bottom-5 start-24 z-40 flex w-80 max-w-[calc(100vw-7rem)] flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
            role="status" aria-live="polite">
            <div class="flex items-center gap-3 text-sm font-semibold text-gray-800">
                <span class="relative inline-flex h-2 w-2 shrink-0">
                    <span class="bg-primary-500 absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"></span>
                    <span class="bg-primary-500 relative inline-flex h-2 w-2 rounded-full"></span>
                </span>
                <span class="min-w-0 flex-1 truncate">{{ 'legalAi.processingTitle' | translate }}</span>
                <button type="button" class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                    [attr.aria-label]="'legalAi.dismiss' | translate" (click)="ui.processingDismissed.set(true)">
                    <i class="pi pi-times text-xs" aria-hidden="true"></i>
                </button>
            </div>
            @for (doc of docs.processing(); track doc.id) {
            <a class="flex flex-col gap-1.5 rounded-md p-1.5 -mx-1.5 text-inherit no-underline hover:bg-gray-50" [routerLink]="[base, 'documents', doc.id]">
                <span class="truncate text-sm font-semibold text-gray-800">{{ doc.original_name || doc.filename }}</span>
                <p-progressbar [value]="percent(doc.progress?.percent, doc.findings_count, doc.total_clauses)" [showValue]="false" styleClass="h-1.5!" />
                <span class="text-xs text-gray-500 tabular-nums">
                    @if (doc.total_clauses) {
                    {{ i18n.t('processingClauses', { done: doc.progress?.clause_index ?? doc.findings_count, total: doc.total_clauses }) }}
                    } @else {
                    {{ doc.progress?.note || ('legalAi.extractingClauses' | translate) }}
                    }
                </span>
            </a>
            }
            <p class="text-xs leading-snug text-gray-400">{{ 'legalAi.processingHint' | translate }}</p>
        </section>
        }
    `,
})
export class LegalAiProcessingMonitor {
    protected readonly docs = inject(LegalAiDocumentsStore);
    protected readonly ui = inject(LegalAiUiState);
    protected readonly i18n = inject(LegalAiI18n);
    protected readonly base = LEGAL_AI_BASE;

    constructor() {
        // Re-arm once everything has finished, so the next upload shows the monitor again.
        effect(() => {
            if (this.docs.processing().length === 0) this.ui.processingDismissed.set(false);
        });
    }

    protected percent(progress: number | undefined, done: number, total?: number): number {
        if (progress !== undefined) return Math.min(100, Math.max(0, Math.round(progress)));
        return total ? Math.round((done / total) * 100) : 0;
    }
}
