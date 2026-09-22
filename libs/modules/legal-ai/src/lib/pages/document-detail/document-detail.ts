import { Component, computed, DestroyRef, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { LegalAiFindingDrawer } from '../../components/finding-drawer/legal-ai-finding-drawer';
import { LegalAiToolbar } from '../../components/toolbar/legal-ai-toolbar';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../state/legal-ai-analysis.store';
import { LegalAiQaStore } from '../../state/legal-ai-qa.store';
import { toneClass } from '../../utils/display';
import { LegalAiAuditTab } from './tabs/audit-tab';
import { LegalAiEntitiesTab } from './tabs/entities-tab';
import { LegalAiFederalTab } from './tabs/federal-tab';
import { LegalAiOverviewTab } from './tabs/overview-tab';
import { LegalAiRiskTab } from './tabs/risk-tab';

export type TabId = 'overview' | 'federal' | 'risk' | 'entities' | 'audit';

const TABS: { id: TabId; key: string }[] = [
    { id: 'overview', key: 'legalAi.tabOverview' },
    { id: 'federal', key: 'legalAi.tabFederal' },
    { id: 'risk', key: 'legalAi.tabRisk' },
    { id: 'entities', key: 'legalAi.tabEntities' },
    { id: 'audit', key: 'legalAi.tabAudit' },
];

@Component({
    selector: 'lib-legal-ai-document-detail',
    standalone: true,
    // Fresh store per visit: state is released as soon as the user navigates away.
    providers: [LegalAiAnalysisStore],
    imports: [
        RouterLink,
        TranslateModule,
        ButtonModule,
        ProgressBarModule,
        NoData,
        PageHeaderComponent,
        LegalAiToolbar,
        LegalAiFindingDrawer,
        LegalAiOverviewTab,
        LegalAiFederalTab,
        LegalAiRiskTab,
        LegalAiEntitiesTab,
        LegalAiAuditTab,
    ],
    templateUrl: './document-detail.html',
})
export class LegalAiDocumentDetailPage {
    protected readonly store = inject(LegalAiAnalysisStore);
    private readonly qa = inject(LegalAiQaStore);
    private readonly route = inject(ActivatedRoute);
    protected readonly i18n = inject(LegalAiI18n);

    // /legal-ai/documents/:id?tab=federal&page=2&finding=<id>
    private readonly paramMap = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
    private readonly queryMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    protected readonly id = computed(() => this.paramMap().get('id') ?? '');

    protected readonly tabs = TABS;
    protected readonly skeletons = [1, 2, 3, 4];
    protected readonly typeClass = toneClass('neutral');
    protected readonly jurisdictionClass = toneClass('info');
    protected readonly lawClass = toneClass('alert');

    protected readonly activeTab = computed<TabId>(() => TABS.find((x) => x.id === this.queryMap().get('tab'))?.id ?? 'overview');
    protected readonly pageNumber = computed(() => Number(this.queryMap().get('page')) || 1);
    protected readonly percent = computed(() => Math.round(this.store.progress()?.percent ?? 0));

    constructor() {
        effect(() => {
            const id = this.id();
            if (id) untracked(() => void this.store.open(id));
        });
        effect(() => this.store.select(this.queryMap().get('finding')));
        // Ground Legal AI answers in the document being viewed.
        effect(() => {
            const a = this.store.analysis();
            this.qa.setContext(a ? this.id() : null, a?.filename ?? null);
        });
        inject(DestroyRef).onDestroy(() => {
            this.store.destroy();
            this.qa.setContext(null, null);
        });
    }

    protected reload(): void {
        void this.store.open(this.id());
    }
}
