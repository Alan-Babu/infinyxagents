import { Component, computed, inject, input } from '@angular/core';
import { NoData } from '@nfinyx/no-data';
import { TranslateModule } from '@ngx-translate/core';
import { LegalAiPager } from '../../../components/pager/legal-ai-pager';
import { AuditEntry } from '../../../models/legal-ai.models';
import { LegalAiI18n } from '../../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../../state/legal-ai-analysis.store';
import { paginate } from '../../../utils/format';

const PAGE_SIZE = 10;

const ICONS: Record<string, string> = {
    UPLOAD: 'pi-upload',
    ANALYSIS_COMPLETE: 'pi-check-circle',
    REVIEW_APPROVE: 'pi-verified',
    REVIEW_REJECT: 'pi-times-circle',
    QA_ASK: 'pi-comments',
};

@Component({
    selector: 'lib-legal-ai-audit-tab',
    standalone: true,
    imports: [TranslateModule, NoData, LegalAiPager],
    template: `
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h2 class="flex items-center gap-2 border-b border-gray-200 px-5 py-4 text-base font-semibold text-gray-800"><i class="pi pi-lock text-gray-400" aria-hidden="true"></i>{{ 'legalAi.auditTitle' | translate }}</h2>
            @if (paged().total === 0) {
            <lib-no-data icon="pi pi-history" [message]="'legalAi.noAudit' | translate" />
            } @else {
            <ol>
                @for (e of paged().slice; track e.id) {
                <li class="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-gray-100 px-5 py-4 first:border-t-0">
                    <span class="bg-primary-50 text-primary-600 inline-flex h-10 w-10 items-center justify-center rounded-md" aria-hidden="true"><i class="pi" [class]="icon(e.action)"></i></span>
                    <div class="min-w-0">
                        <p class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                            <span class="font-mono text-sm font-semibold text-gray-800 notranslate">{{ e.action }}</span>
                            <span class="text-xs text-gray-400 tabular-nums">{{ e.actor }} · {{ i18n.date(e.timestamp, true) }}</span>
                        </p>
                        <p class="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
                            @if (e.model_used) { <span class="rounded bg-gray-100 px-2 py-0.5">{{ 'legalAi.model' | translate }}: <code class="notranslate">{{ e.model_used }}</code></span> }
                            @if (e.prompt_version) { <span class="rounded bg-gray-100 px-2 py-0.5"><code class="notranslate">{{ e.prompt_version }}</code></span> }
                            @for (kv of details(e); track kv[0]) { <span class="rounded bg-gray-100 px-2 py-0.5 tabular-nums">{{ kv[0] }}: {{ kv[1] }}</span> }
                        </p>
                    </div>
                </li>
                }
            </ol>
            <lib-legal-ai-pager [page]="paged().page" [pages]="paged().pages" [from]="paged().from" [to]="paged().to" [total]="paged().total" />
            }
        </section>
    `,
})
export class LegalAiAuditTab {
    private readonly store = inject(LegalAiAnalysisStore);
    protected readonly i18n = inject(LegalAiI18n);
    readonly page = input(1);

    /** Newest first — the backend returns oldest first. */
    protected readonly paged = computed(() => paginate([...this.store.audit()].reverse(), this.page(), PAGE_SIZE));

    protected icon(action: string): string {
        return ICONS[action] ?? 'pi-history';
    }

    protected details(e: AuditEntry): [string, string][] {
        if (!e.details_json) return [];
        try {
            const parsed = JSON.parse(e.details_json) as Record<string, unknown>;
            return Object.entries(parsed)
                .filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v) && String(v).length <= 48)
                .slice(0, 5)
                .map(([k, v]) => [k, String(v)] as [string, string]);
        } catch {
            return [];
        }
    }
}
