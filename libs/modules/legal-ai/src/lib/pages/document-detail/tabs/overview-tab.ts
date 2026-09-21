import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NoData } from '@nfinyx/no-data';
import { StatCardComponent } from '@nfinyx/stat-card';
import { TranslateModule } from '@ngx-translate/core';
import { LegalAiSeverityTag } from '../../../components/tags/legal-ai-severity-tag';
import { LegalAiI18n } from '../../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../../state/legal-ai-analysis.store';
import { toneClass } from '../../../utils/display';
import { bySeverity } from '../../../utils/format';

const TOP_N = 8;

@Component({
    selector: 'lib-legal-ai-overview-tab',
    standalone: true,
    imports: [RouterLink, TranslateModule, NoData, StatCardComponent, LegalAiSeverityTag],
    template: `
        @if (store.analysis(); as a) {
        <div class="flex flex-col gap-6">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <lib-stat-card [label]="'legalAi.statCompliant' | translate" [value]="i18n.num(a.compliant_count)" [sub]="'legalAi.statCompliantSub' | translate"
                    icon="pi pi-shield" fgClass="text-ae-green-700" bgClass="bg-ae-green-50" />
                <lib-stat-card [label]="'legalAi.statNeedsReview' | translate" [value]="i18n.num(a.needs_review_count + a.non_compliant_count)" [sub]="'legalAi.statNeedsReviewSub' | translate"
                    icon="pi pi-eye" fgClass="text-primary-600" bgClass="bg-primary-50" />
                <lib-stat-card [label]="'legalAi.statAmbiguous' | translate" [value]="i18n.num(a.ambiguous_count + a.insufficient_evidence_count)" [sub]="'legalAi.statAmbiguousSub' | translate"
                    icon="pi pi-question-circle" fgClass="text-ae-tech-800" bgClass="bg-ae-tech-50" />
                <lib-stat-card [label]="'legalAi.statClauses' | translate" [value]="i18n.num(a.findings.length)" [sub]="'legalAi.statClausesSub' | translate"
                    icon="pi pi-file" fgClass="text-gray-700" bgClass="bg-gray-100" />
            </div>

            <section class="overflow-hidden rounded-lg border border-gray-200 bg-white" aria-labelledby="legal-ai-key-findings">
                <header class="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                    <h2 id="legal-ai-key-findings" class="text-base font-semibold text-gray-800">{{ 'legalAi.keyFindings' | translate }}</h2>
                    @if (store.findings().length > top().length) {
                    <a class="text-primary-700 inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline" routerLink="." [queryParams]="{ tab: 'federal', page: null }" queryParamsHandling="merge">
                        {{ 'legalAi.tabFederal' | translate }} <i class="pi pi-arrow-right text-xs rtl:rotate-180" aria-hidden="true"></i>
                    </a>
                    }
                </header>
                @if (top().length === 0) {
                <lib-no-data icon="pi pi-file" [message]="'legalAi.noFindings' | translate" />
                } @else {
                <ul>
                    @for (f of top(); track f.id ?? $index) {
                    <li class="border-t border-gray-100 first:border-t-0">
                        <button type="button" class="hover:bg-primary-50 grid w-full cursor-pointer grid-cols-[auto_1fr] items-start gap-3 px-5 py-4 text-start transition-colors" (click)="store.openFinding(f.id)">
                            <lib-legal-ai-severity-tag [severity]="f.severity" />
                            <span class="min-w-0">
                                <span class="block text-sm font-semibold text-gray-800">{{ 'legalAi.clauseWord' | translate }} {{ f.clause_number }} · {{ f.legal_topic }}</span>
                                <span class="mt-0.5 line-clamp-2 text-sm text-gray-600">{{ f.reasoning }}</span>
                            </span>
                        </button>
                    </li>
                    }
                </ul>
                }
            </section>

            @if (a.applicable_laws.length) {
            <section class="rounded-lg border border-gray-200 bg-white" aria-labelledby="legal-ai-applicable-laws">
                <h2 id="legal-ai-applicable-laws" class="border-b border-gray-200 px-5 py-4 text-base font-semibold text-gray-800">{{ 'legalAi.applicableLaws' | translate }}</h2>
                <div class="flex flex-wrap gap-2 px-5 py-4">
                    @for (law of a.applicable_laws; track law) { <span [class]="lawClass">{{ law }}</span> }
                </div>
            </section>
            }
        </div>
        }
    `,
})
export class LegalAiOverviewTab {
    protected readonly store = inject(LegalAiAnalysisStore);
    protected readonly i18n = inject(LegalAiI18n);
    protected readonly lawClass = toneClass('info');
    protected readonly top = computed(() => [...this.store.findings()].sort(bySeverity).slice(0, TOP_N));
}
