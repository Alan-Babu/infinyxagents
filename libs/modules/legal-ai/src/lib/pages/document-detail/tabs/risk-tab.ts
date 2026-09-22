import { Component, computed, inject, input } from '@angular/core';
import { NoData } from '@nfinyx/no-data';
import { TranslateModule } from '@ngx-translate/core';
import { LegalAiPager } from '../../../components/pager/legal-ai-pager';
import { LegalAiSeverityTag } from '../../../components/tags/legal-ai-severity-tag';
import { Finding } from '../../../models/legal-ai.models';
import { LegalAiAnalysisStore } from '../../../state/legal-ai-analysis.store';
import { toneClass } from '../../../utils/display';
import { bySeverity, paginate } from '../../../utils/format';

const PAGE_SIZE = 8;

@Component({
    selector: 'lib-legal-ai-risk-tab',
    standalone: true,
    imports: [TranslateModule, NoData, LegalAiPager, LegalAiSeverityTag],
    template: `
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
            @if (paged().total === 0) {
            <lib-no-data icon="pi pi-shield" [message]="'legalAi.statCompliant' | translate" [subMessage]="'legalAi.statCompliantSub' | translate" />
            } @else {
            <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-sm">
                    <caption class="sr-only">{{ 'legalAi.tabRisk' | translate }}</caption>
                    <thead class="bg-gray-50 text-xs text-gray-500">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.clauseNum' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.severity' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.exposure' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.rec' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.humanReview' | translate }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (f of paged().slice; track f.id ?? $index) {
                        <tr class="hover:bg-primary-50 cursor-pointer border-t border-gray-100 align-top transition-colors" (click)="rowClick($event, f)">
                            <td class="px-4 py-3"><button type="button" class="cursor-pointer font-mono font-semibold text-gray-800 hover:underline" (click)="store.openFinding(f.id)">{{ f.clause_number }}</button></td>
                            <td class="px-4 py-3"><lib-legal-ai-severity-tag [severity]="f.severity" /></td>
                            <td class="max-w-md px-4 py-3 leading-relaxed text-gray-700">{{ f.reasoning }}</td>
                            <td class="max-w-md px-4 py-3 leading-relaxed text-gray-700">{{ f.recommendation || ('legalAi.defaultRec' | translate) }}</td>
                            <td class="px-4 py-3">
                                @if (f.human_review_required) { <span [class]="dangerClass">{{ 'legalAi.required' | translate }}</span> }
                                @else { <span [class]="neutralClass">{{ 'legalAi.optional' | translate }}</span> }
                            </td>
                        </tr>
                        }
                    </tbody>
                </table>
            </div>
            <lib-legal-ai-pager [page]="paged().page" [pages]="paged().pages" [from]="paged().from" [to]="paged().to" [total]="paged().total" />
            }
        </section>
    `,
})
export class LegalAiRiskTab {
    protected readonly store = inject(LegalAiAnalysisStore);
    readonly page = input(1);

    protected readonly dangerClass = toneClass('danger');
    protected readonly neutralClass = toneClass('neutral');
    private readonly risky = computed(() => this.store.findings().filter((f) => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity)).sort(bySeverity));
    protected readonly paged = computed(() => paginate(this.risky(), this.page(), PAGE_SIZE));

    protected rowClick(event: Event, f: Finding): void {
        if ((event.target as HTMLElement).closest('a,button')) return;
        this.store.openFinding(f.id);
    }
}
