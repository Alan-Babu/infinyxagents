import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CommonService } from '@nfinyx/services';
import {
    CallTypeOption,
    FeedbackDrawerComponent,
    FeedbackSubmitPayload,
    PaginationMeta,
    PerformanceDrawerComponent,
    PerformanceDrawerTab,
    PerformanceReport,
    ReviewDecisionPayload,
    ReviewQueueDrawerComponent,
    ReviewQueueItem,
    TelemetryLogEntry,
    TelemetryLogFilters,
} from '@nfinyx/document-agent';
import { ContractAnalyzerApiService } from '../../services/contract-analyzer-api.service';
import { AgentStats, ContractSummary, SearchHistoryEntry } from '../../models/contract-analyzer.models';
import { ContractAnalyzerStatsDrawerComponent } from '../contract-analyzer-stats-drawer/contract-analyzer-stats-drawer';

type ToolbarDrawer = 'none' | 'reviewQueue' | 'performance' | 'feedback' | 'stats';

const CALL_TYPE_LABEL_KEYS: Record<string, string> = {
    detect: 'contractAnalyzer.callTypes.detect',
    questions: 'contractAnalyzer.callTypes.questions',
    analyze: 'contractAnalyzer.callTypes.analyze',
    qa: 'contractAnalyzer.callTypes.qa',
};

/**
 * Module-internal toolbar: the four cross-cutting agent actions (review
 * queue, performance report, feedback, stats) available from every
 * contract-analyzer page. Wraps the shared `@nfinyx/document-agent` drawers
 * plus the module-local stats drawer, and owns their fetching — pages just
 * drop `<lib-contract-analyzer-toolbar>` into their header.
 */
@Component({
    selector: 'lib-contract-analyzer-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        ReviewQueueDrawerComponent,
        PerformanceDrawerComponent,
        FeedbackDrawerComponent,
        ContractAnalyzerStatsDrawerComponent,
    ],
    templateUrl: './contract-analyzer-toolbar.html',
})
export class ContractAnalyzerToolbarComponent implements OnInit {
    private readonly api = inject(ContractAnalyzerApiService);
    private readonly router = inject(Router);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    /** When set, "Rate the agent" offers a document-scoped option pre-selected to this id. */
    @Input() documentId: string | null = null;

    drawer: ToolbarDrawer = 'none';

    reviewQueueCount = 0;
    reviewQueueItems: ReviewQueueItem[] = [];
    reviewQueuePagination: PaginationMeta | null = null;
    reviewQueuePage = 1;

    performanceTab: PerformanceDrawerTab = 'report';
    performanceReport: PerformanceReport | null = null;
    logs: TelemetryLogEntry[] = [];
    logsPagination: PaginationMeta | null = null;
    logsPage = 1;
    logFilters: TelemetryLogFilters = { callType: '', success: '', dateFrom: '', dateTo: '' };
    readonly callTypeOptions: CallTypeOption[] = Object.entries(CALL_TYPE_LABEL_KEYS).map(([value, key]) => ({
        value,
        label: this.translate.instant(key),
    }));
    get callTypeLabels(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, i18nKey] of Object.entries(CALL_TYPE_LABEL_KEYS)) out[key] = this.translate.instant(i18nKey);
        return out;
    }

    statsLoading = false;
    stats: AgentStats | null = null;
    searchHistory: SearchHistoryEntry[] = [];
    searchHistoryPagination: PaginationMeta | null = null;
    searchHistoryPage = 1;

    ngOnInit(): void {
        this.refreshReviewQueueCount();
    }

    async refreshReviewQueueCount(): Promise<void> {
        const res = await this.api.getReviewQueue(1, 1);
        this.reviewQueueCount = res.pagination.total_count;
    }

    // ---------- Review queue ----------
    async openReviewQueue(): Promise<void> {
        this.drawer = 'reviewQueue';
        this.reviewQueuePage = 1;
        await this.loadReviewQueue();
    }
    async loadReviewQueue(): Promise<void> {
        const res = await this.api.getReviewQueue(this.reviewQueuePage, 20);
        this.reviewQueuePagination = res.pagination;
        this.reviewQueueCount = res.pagination.total_count;
        this.reviewQueueItems = res.items.map(this.toReviewQueueItem.bind(this));
    }
    private toReviewQueueItem(doc: ContractSummary): ReviewQueueItem {
        return {
            id: doc.id,
            title: doc.filename,
            metaLine: [
                doc.party_a_name || this.translate.instant('contractAnalyzer.common.unknownParty'),
                doc.party_b_name || this.translate.instant('contractAnalyzer.common.unknownParty'),
            ],
            badges: [
                ...(doc.confidence_score !== null
                    ? [{ label: `${doc.confidence_score}%`, severity: this.confidenceSeverity(doc.confidence_score) as 'success' | 'warn' | 'danger' }]
                    : []),
                { label: this.translate.instant(`contractAnalyzer.risk.${(doc.overall_risk_level || 'unknown').toLowerCase()}`), severity: this.riskSeverity(doc.overall_risk_level) },
            ],
        };
    }
    private confidenceSeverity(score: number): 'success' | 'warn' | 'danger' {
        if (score >= 75) return 'success';
        if (score >= 50) return 'warn';
        return 'danger';
    }
    private riskSeverity(risk: string | null): 'success' | 'warn' | 'danger' | 'secondary' {
        const r = (risk || '').toLowerCase();
        if (r === 'low') return 'success';
        if (r === 'medium') return 'warn';
        if (r === 'high' || r === 'critical') return 'danger';
        return 'secondary';
    }
    async onReviewQueuePage(delta: number): Promise<void> {
        this.reviewQueuePage = Math.max(1, this.reviewQueuePage + delta);
        await this.loadReviewQueue();
    }
    openDocumentFromQueue(id: string): void {
        this.drawer = 'none';
        this.router.navigateByUrl(`/contract-analyzer/contracts/${id}`);
    }
    async onReviewDecide(payload: ReviewDecisionPayload): Promise<void> {
        try {
            await this.api.reviewContract(payload.id, payload.decision, payload.reviewerName, payload.reviewerNotes);
            this.common.showSuccessMessage(
                this.translate.instant(payload.decision === 'approve' ? 'contractAnalyzer.toast.reviewApproved' : 'contractAnalyzer.toast.reviewRejected'),
            );
            await this.loadReviewQueue();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.reviewFailed'));
        }
    }

    // ---------- Performance ----------
    async openPerformance(): Promise<void> {
        this.drawer = 'performance';
        this.performanceTab = 'report';
        this.logsPage = 1;
        await this.loadPerformanceReport();
    }
    async loadPerformanceReport(): Promise<void> {
        this.performanceReport = await this.api.getPerformanceReport();
    }
    async onPerformanceTabChange(tab: PerformanceDrawerTab): Promise<void> {
        this.performanceTab = tab;
        if (tab === 'report') await this.loadPerformanceReport();
        else await this.loadLogs();
    }
    async loadLogs(): Promise<void> {
        const res = await this.api.getLogs({
            callType: this.logFilters.callType || undefined,
            success: this.logFilters.success === '' ? undefined : this.logFilters.success === 'true',
            dateFrom: this.logFilters.dateFrom || undefined,
            dateTo: this.logFilters.dateTo || undefined,
            page: this.logsPage,
            pageSize: 20,
        });
        this.logs = res.items;
        this.logsPagination = res.pagination;
    }
    async onLogFiltersChange(filters: TelemetryLogFilters): Promise<void> {
        this.logFilters = filters;
        this.logsPage = 1;
        await this.loadLogs();
    }
    async onLogsPage(delta: number): Promise<void> {
        this.logsPage = Math.max(1, this.logsPage + delta);
        await this.loadLogs();
    }

    // ---------- Feedback ----------
    openFeedback(): void {
        this.drawer = 'feedback';
    }
    async onSubmitFeedback(payload: FeedbackSubmitPayload): Promise<void> {
        try {
            await this.api.submitFeedback(payload.rating, payload.comment, payload.forDocument && this.documentId ? this.documentId : undefined);
            this.drawer = 'none';
            this.common.showSuccessMessage(this.translate.instant('contractAnalyzer.toast.feedbackSubmitted'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.feedbackFailed'));
        }
    }

    // ---------- Stats ----------
    async openStats(): Promise<void> {
        this.drawer = 'stats';
        this.searchHistoryPage = 1;
        this.statsLoading = true;
        try {
            const [stats] = await Promise.all([this.api.getStats(), this.loadSearchHistory()]);
            this.stats = stats;
        } finally {
            this.statsLoading = false;
        }
    }
    async loadSearchHistory(): Promise<void> {
        const res = await this.api.getSearchHistory(this.searchHistoryPage, 20);
        this.searchHistory = res.items;
        this.searchHistoryPagination = res.pagination;
    }
    async onSearchHistoryPage(delta: number): Promise<void> {
        this.searchHistoryPage = Math.max(1, this.searchHistoryPage + delta);
        await this.loadSearchHistory();
    }

    closeDrawer(): void {
        this.drawer = 'none';
    }
}
