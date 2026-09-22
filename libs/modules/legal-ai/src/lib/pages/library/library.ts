import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { debounceTime, Subject } from 'rxjs';
import { LegalAiPager } from '../../components/pager/legal-ai-pager';
import { LegalAiToolbar } from '../../components/toolbar/legal-ai-toolbar';
import { LEGAL_AI_BASE } from '../../legal-ai.paths';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiLawsStore } from '../../state/legal-ai-laws.store';
import { toneClass } from '../../utils/display';
import { paginate } from '../../utils/format';

const PAGE_SIZE = 9;

@Component({
    selector: 'lib-legal-ai-library',
    standalone: true,
    imports: [RouterLink, TranslateModule, InputTextModule, NoData, PageHeaderComponent, LegalAiPager, LegalAiToolbar],
    templateUrl: './library.html',
})
export class LegalAiLibraryPage {
    protected readonly i18n = inject(LegalAiI18n);
    protected readonly laws = inject(LegalAiLawsStore);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly base = LEGAL_AI_BASE;
    protected readonly skeletons = [1, 2, 3, 4, 5, 6];
    protected readonly search$ = new Subject<string>();
    protected readonly categoryClass = toneClass('neutral');

    // /legal-ai/library?category=Labour&q=data&page=2
    private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    protected readonly q = computed(() => this.params().get('q') ?? '');
    protected readonly category = computed(() => this.params().get('category'));

    protected readonly filtered = computed(() => {
        const term = this.q().trim().toLowerCase();
        const cat = this.category();
        return this.laws.laws().filter((l) => {
            if (cat && (l.category || 'Federal') !== cat) return false;
            return !term || `${l.law_number} ${l.title}`.toLowerCase().includes(term);
        });
    });
    protected readonly paged = computed(() => paginate(this.filtered(), Number(this.params().get('page')) || 1, PAGE_SIZE));

    constructor() {
        void this.laws.ensureLoaded();
        this.search$
            .pipe(debounceTime(250), takeUntilDestroyed())
            .subscribe((q) =>
                this.router.navigate([], { queryParams: { q: q.trim() || null, page: null }, queryParamsHandling: 'merge', replaceUrl: true }),
            );
    }

    protected onSearch(event: Event): void {
        this.search$.next((event.target as HTMLInputElement).value);
    }

    /** Laws without an official number carry their title as the identifier; don't repeat it as a badge. */
    protected hasOfficialNumber(value: string): boolean {
        return /No\.?\s*\(?\d+/i.test(value) && value.length <= 60;
    }
}
