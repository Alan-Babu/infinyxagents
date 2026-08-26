import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastrService } from 'ngx-toastr';
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
import { GrammarApiService } from '../../services/grammar-api.service';
import { DocumentSummary } from '../../models/grammar.models';

type ToolbarDrawer = 'none' | 'reviewQueue' | 'performance' | 'feedback';

const CALL_TYPE_LABEL_KEYS: Record<string, string> = {
    grammar_check: 'grammarAgent.callTypes.grammarCheck',
    qa: 'grammarAgent.callTypes.qa',
};

/**
 * Module-internal toolbar: the three cross-cutting agent actions (review
 * queue, performance report, feedback) available from every grammar-agent
 * page. Wraps the shared `@nfinyx/document-agent` drawers and owns their
 * fetching — pages just drop `<lib-grammar-toolbar>` into their header.
 */
@Component({
    selector: 'lib-grammar-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        ReviewQueueDrawerComponent,
        PerformanceDrawerComponent,
        FeedbackDrawerComponent,
    ],
    templateUrl: './grammar-toolbar.html',
})
export class GrammarToolbarComponent implements OnInit {
    private readonly api = inject(GrammarApiService);
    private readonly router = inject(Router);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    /** When set, "Rate the agent" offers a document-scoped option pre-selected to this id. */
    @Input() documentId: string | null = null;

    drawer: ToolbarDrawer = 'none';

    reviewQueueCount = 0;
    reviewQueueItems: ReviewQueueItem[] = [];
    reviewQueuePagination: PaginationMeta | null = null;
    reviewQueuePage = 1;
    private reviewQueueDocs: DocumentSummary[] = [];

    performanceTab: PerformanceDrawerTab = 'report';
    performanceReport: PerformanceReport | null = null;
    logs: TelemetryLogEntry[] = [];
    logsPagination: PaginationMeta | null = null;
    logsPage = 1;
    logFilters: TelemetryLogFilters = { callType: '', success: '', dateFrom: '', dateTo: '' };
    readonly callTypeOptions: CallTypeOption[] = [
        { value: 'grammar_check', label: this.translate.instant('grammarAgent.callTypes.grammarCheck') },
        { value: 'qa', label: this.translate.instant('grammarAgent.callTypes.qa') },
    ];
    get callTypeLabels(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, i18nKey] of Object.entries(CALL_TYPE_LABEL_KEYS)) out[key] = this.translate.instant(i18nKey);
        return out;
    }

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
        this.reviewQueueDocs = res.items;
        this.reviewQueuePagination = res.pagination;
        this.reviewQueueCount = res.pagination.total_count;
        this.reviewQueueItems = res.items.map(this.toReviewQueueItem.bind(this));
    }
    private toReviewQueueItem(doc: DocumentSummary): ReviewQueueItem {
        return {
            id: doc.id,
            title: doc.filename,
            metaLine: [
                doc.detected_language || this.translate.instant('grammarAgent.common.unknownLanguage'),
                `${doc.word_count} ${this.translate.instant('grammarAgent.common.words')}`,
            ],
            badges: [
                ...(doc.grammar_score !== null
                    ? [{ label: `${doc.grammar_score}/100`, severity: this.scoreSeverity(doc.grammar_score) as 'success' | 'warn' | 'danger' }]
                    : []),
                { label: this.translate.instant(`grammarAgent.classification.${doc.document_classification}`) || doc.document_classification, severity: 'secondary' as const },
            ],
        };
    }
    private scoreSeverity(score: number): 'success' | 'warn' | 'danger' {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warn';
        return 'danger';
    }
    async onReviewQueuePage(delta: number): Promise<void> {
        this.reviewQueuePage = Math.max(1, this.reviewQueuePage + delta);
        await this.loadReviewQueue();
    }
    openDocumentFromQueue(id: string): void {
        this.drawer = 'none';
        this.router.navigateByUrl(`/grammar-agent/documents/${id}`);
    }
    async onReviewDecide(payload: ReviewDecisionPayload): Promise<void> {
        try {
            await this.api.reviewDocument(payload.id, payload.decision, payload.reviewerName, payload.reviewerNotes);
            this.toastr.success(
                this.translate.instant(payload.decision === 'approve' ? 'grammarAgent.toast.reviewApproved' : 'grammarAgent.toast.reviewRejected'),
            );
            await this.loadReviewQueue();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.reviewFailed'));
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
            this.toastr.success(this.translate.instant('grammarAgent.toast.feedbackSubmitted'));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.feedbackFailed'));
        }
    }

    closeDrawer(): void {
        this.drawer = 'none';
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
