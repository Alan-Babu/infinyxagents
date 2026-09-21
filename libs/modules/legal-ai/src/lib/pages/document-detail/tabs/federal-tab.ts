import { Component, computed, inject, input } from '@angular/core';
import { NoData } from '@nfinyx/no-data';
import { TranslateModule } from '@ngx-translate/core';
import { LegalAiPager } from '../../../components/pager/legal-ai-pager';
import { LegalAiSeverityTag } from '../../../components/tags/legal-ai-severity-tag';
import { LegalAiStatusTag } from '../../../components/tags/legal-ai-status-tag';
import { Finding } from '../../../models/legal-ai.models';
import { LegalAiI18n } from '../../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../../state/legal-ai-analysis.store';
import { toneClass } from '../../../utils/display';
import { findingNeedsReview, paginate } from '../../../utils/format';

const PAGE_SIZE = 10;

@Component({
    selector: 'lib-legal-ai-federal-tab',
    standalone: true,
    imports: [TranslateModule, NoData, LegalAiPager, LegalAiSeverityTag, LegalAiStatusTag],
    template: `
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
            @if (paged().total === 0) {
            <lib-no-data icon="pi pi-file" [message]="'legalAi.noFindings' | translate" />
            } @else {
            <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-sm">
                    <caption class="sr-only">{{ 'legalAi.tabFederal' | translate }}</caption>
                    <thead class="bg-gray-50 text-xs text-gray-500">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.clauseNum' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.topic' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.citedLaw' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.status' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.severity' | translate }}</th>
                            <th scope="col" class="px-4 py-3 text-start font-semibold">{{ 'legalAi.sourceLink' | translate }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (f of paged().slice; track f.id ?? $index) {
                        <tr class="hover:bg-primary-50 cursor-pointer border-t border-gray-100 transition-colors" (click)="rowClick($event, f)">
                            <td class="px-4 py-3"><button type="button" class="cursor-pointer font-mono font-semibold text-gray-800 hover:underline" (click)="store.openFinding(f.id)">{{ f.clause_number }}</button></td>
                            <td class="px-4 py-3 font-semibold text-gray-800">{{ f.legal_topic }}</td>
                            <td class="px-4 py-3 text-gray-600">{{ f.law_number ? f.law_number + ' ' + i18n.t('articleAbbr') + ' ' + f.article_number : '—' }}</td>
                            <td class="px-4 py-3">
                                <span class="flex flex-wrap gap-1.5">
                                    <lib-legal-ai-status-tag [status]="f.status" />
                                    @if (f.review_status === 'APPROVED') { <span [class]="successClass">{{ 'legalAi.reviewApproved' | translate }}</span> }
                                    @else if (f.review_status === 'REJECTED') { <span [class]="dangerClass">{{ 'legalAi.reviewRejected' | translate }}</span> }
                                    @else if (needsReview(f) && !implied(f)) { <span [class]="warningClass">{{ 'legalAi.statusReview' | translate }}</span> }
                                </span>
                            </td>
                            <td class="px-4 py-3"><lib-legal-ai-severity-tag [severity]="f.severity" /></td>
                            <td class="px-4 py-3">
                                @if (f.source_url) {
                                <a class="text-primary-700 inline-flex items-center gap-1 font-semibold no-underline hover:underline" [href]="f.source_url" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">
                                    {{ 'legalAi.sourceLink' | translate }} <i class="pi pi-external-link text-xs" aria-hidden="true"></i>
                                </a>
                                } @else { — }
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
export class LegalAiFederalTab {
    protected readonly store = inject(LegalAiAnalysisStore);
    protected readonly i18n = inject(LegalAiI18n);
    readonly page = input(1);

    protected readonly successClass = toneClass('success');
    protected readonly dangerClass = toneClass('danger');
    protected readonly warningClass = toneClass('warning');
    protected readonly needsReview = findingNeedsReview;
    protected readonly paged = computed(() => paginate(this.store.findings(), this.page(), PAGE_SIZE));

    /** The status tag already says "needs review" for these — don't repeat it. */
    protected implied(f: Finding): boolean {
        return ['NEEDS_REVIEW', 'AMBIGUOUS', 'INSUFFICIENT_EVIDENCE'].includes(f.status);
    }

    protected rowClick(event: Event, f: Finding): void {
        if ((event.target as HTMLElement).closest('a,button')) return;
        this.store.openFinding(f.id);
    }
}
