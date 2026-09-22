import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ApiError, messageFromApiError } from '@nfinyx/types';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { LegalAiPager } from '../../components/pager/legal-ai-pager';
import { LegalAiToolbar } from '../../components/toolbar/legal-ai-toolbar';
import { LawArticle, LawItem } from '../../models/legal-ai.models';
import { LegalAiApiService } from '../../services/legal-ai-api.service';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiQaStore } from '../../state/legal-ai-qa.store';
import { toneClass } from '../../utils/display';
import { paginate } from '../../utils/format';

const PAGE_SIZE = 20;
const PREVIEW_CHARS = 260;

@Component({
    selector: 'lib-legal-ai-law-detail',
    standalone: true,
    imports: [TranslateModule, ButtonModule, NoData, PageHeaderComponent, LegalAiPager, LegalAiToolbar],
    templateUrl: './law-detail.html',
})
export class LegalAiLawDetailPage {
    private readonly api = inject(LegalAiApiService);
    private readonly qa = inject(LegalAiQaStore);
    private readonly route = inject(ActivatedRoute);
    protected readonly i18n = inject(LegalAiI18n);

    // /legal-ai/library/:lawId?page=2
    private readonly paramMap = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
    private readonly queryMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    protected readonly lawId = computed(() => this.paramMap().get('lawId') ?? '');

    protected readonly law = signal<LawItem | null>(null);
    protected readonly articles = signal<LawArticle[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly notFound = signal(false);
    protected readonly expanded = signal<ReadonlySet<string>>(new Set());
    protected readonly skeletons = [1, 2, 3, 4, 5];
    protected readonly categoryClass = toneClass('neutral');
    protected readonly jurisdictionClass = toneClass('info');

    protected readonly paged = computed(() => paginate(this.articles(), Number(this.queryMap().get('page')) || 1, PAGE_SIZE));

    constructor() {
        effect(() => {
            const id = this.lawId();
            if (id) untracked(() => void this.load(id));
        });
    }

    protected async load(id: string): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.notFound.set(false);
        this.expanded.set(new Set());
        try {
            const [law, articles] = await Promise.all([this.api.getLaw(id), this.api.listLawArticles(id)]);
            this.law.set(law);
            this.articles.set(articles);
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) this.notFound.set(true);
            else this.error.set(e instanceof ApiError ? messageFromApiError(e) : 'Request failed');
            this.articles.set([]);
        } finally {
            this.loading.set(false);
        }
    }

    protected isLong(a: LawArticle): boolean {
        return a.article_text.length > PREVIEW_CHARS;
    }

    protected preview(a: LawArticle): string {
        if (this.expanded().has(a.id) || !this.isLong(a)) return a.article_text;
        return `${a.article_text.slice(0, PREVIEW_CHARS).trimEnd()}…`;
    }

    protected toggle(id: string): void {
        this.expanded.update((set) => {
            const next = new Set(set);
            if (!next.delete(id)) next.add(id);
            return next;
        });
    }

    protected ask(): void {
        const law = this.law();
        if (law) this.qa.show(this.i18n.t('askAboutLawPrompt', { law: `${law.law_number} — ${law.title}` }));
    }
}
