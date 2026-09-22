import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { StatCardComponent } from '@nfinyx/stat-card';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { debounceTime, Subject } from 'rxjs';
import { LegalAiPager } from '../../components/pager/legal-ai-pager';
import { LegalAiStatusTag } from '../../components/tags/legal-ai-status-tag';
import { LegalAiToolbar } from '../../components/toolbar/legal-ai-toolbar';
import { LEGAL_AI_BASE } from '../../legal-ai.paths';
import { DocumentItem } from '../../models/legal-ai.models';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiDocumentsStore } from '../../state/legal-ai-documents.store';
import { LegalAiLawsStore } from '../../state/legal-ai-laws.store';
import { LegalAiUiState } from '../../state/legal-ai-ui.state';
import { toneClass } from '../../utils/display';
import { paginate, parseApiDate } from '../../utils/format';

type Filter = 'all' | 'highrisk' | 'review' | 'clear';
const PAGE_SIZE = 8;

@Component({
    selector: 'lib-legal-ai-dashboard',
    standalone: true,
    imports: [
        RouterLink,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        NoData,
        PageHeaderComponent,
        StatCardComponent,
        LegalAiPager,
        LegalAiStatusTag,
        LegalAiToolbar,
    ],
    templateUrl: './dashboard.html',
})
export class LegalAiDashboardPage {
    protected readonly i18n = inject(LegalAiI18n);
    protected readonly docs = inject(LegalAiDocumentsStore);
    protected readonly laws = inject(LegalAiLawsStore);
    protected readonly ui = inject(LegalAiUiState);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly base = LEGAL_AI_BASE;
    protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];
    protected readonly search$ = new Subject<string>();
    protected readonly jurisdictionClass = toneClass('info');

    // /legal-ai?filter=review&q=nda&page=2 — the URL is the source of truth for list state.
    private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    protected readonly q = computed(() => this.params().get('q') ?? '');
    protected readonly activeFilter = computed<Filter>(() => {
        const f = this.params().get('filter');
        return f === 'highrisk' || f === 'review' || f === 'clear' ? f : 'all';
    });

    protected readonly filtered = computed<DocumentItem[]>(() => {
        const term = this.q().trim().toLowerCase();
        const f = this.activeFilter();
        return [...this.docs.documents()]
            .filter((d) => {
                if (term && !`${d.original_name || d.filename} ${d.contract_type}`.toLowerCase().includes(term)) return false;
                if (f === 'highrisk') return d.high_risk;
                if (f === 'review') return d.needs_review;
                if (f === 'clear') return !d.needs_review;
                return true;
            })
            .sort((a, b) => (parseApiDate(b.uploaded_at)?.getTime() ?? 0) - (parseApiDate(a.uploaded_at)?.getTime() ?? 0));
    });

    protected readonly paged = computed(() => paginate(this.filtered(), Number(this.params().get('page')) || 1, PAGE_SIZE));

    protected readonly filters: { id: Filter; key: string }[] = [
        { id: 'all', key: 'legalAi.filterAll' },
        { id: 'highrisk', key: 'legalAi.filterHighRisk' },
        { id: 'review', key: 'legalAi.filterReview' },
        { id: 'clear', key: 'legalAi.filterClear' },
    ];

    constructor() {
        this.docs.ensureLoaded();
        void this.laws.ensureLoaded();
        this.search$
            .pipe(debounceTime(250), takeUntilDestroyed())
            .subscribe((q) =>
                this.router.navigate([], {
                    queryParams: { q: q.trim() || null, page: null },
                    queryParamsHandling: 'merge',
                    replaceUrl: true,
                }),
            );
    }

    protected onSearch(event: Event): void {
        this.search$.next((event.target as HTMLInputElement).value);
    }

    protected open(event: Event, id: string): void {
        // Anchors inside the row handle their own navigation.
        if ((event.target as HTMLElement).closest('a,button')) return;
        void this.router.navigate([this.base, 'documents', id]);
    }

    protected reload(): void {
        void this.docs.refresh();
    }

    protected rowStatus(d: DocumentItem): string {
        if (d.status === 'COMPLETED') return d.needs_review ? 'NEEDS_REVIEW' : 'COMPLIANT';
        return d.status;
    }

    protected progressPct(d: DocumentItem): number | null {
        return d.status === 'PROCESSING' && d.progress ? Math.round(d.progress.percent) : null;
    }
}
