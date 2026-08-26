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
} from '@nfinyx/document-agent';
import { EmailComposeApiService } from '../../services/email-compose-api.service';
import { AgentStats, ContextProfile, EmailSummary, EmailTelemetryLogEntry, SearchHistoryEntry } from '../../models/email-compose-agent.models';
import { StatsDrawerComponent } from '../stats-drawer/stats-drawer';
import { WritingProfileDrawerComponent } from '../writing-profile-drawer/writing-profile-drawer';

type ToolbarDrawer = 'none' | 'reviewQueue' | 'performance' | 'feedback' | 'stats' | 'profile';

const CALL_TYPE_LABEL_KEYS: Record<string, string> = {
    compose: 'emailComposeAgent.callTypes.compose',
    reply_questions: 'emailComposeAgent.callTypes.replyQuestions',
    reply_draft: 'emailComposeAgent.callTypes.replyDraft',
    translate: 'emailComposeAgent.callTypes.translate',
    qa: 'emailComposeAgent.callTypes.qa',
};

/**
 * Module-internal toolbar: the five cross-cutting agent actions (review
 * queue, performance report, stats, writing profile, feedback) available
 * from every email-compose-agent page. Wraps the shared `@nfinyx/document-agent`
 * drawers plus two local drawers — pages just drop `<lib-email-compose-toolbar>`
 * into their header.
 */
@Component({
    selector: 'lib-email-compose-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        ReviewQueueDrawerComponent,
        PerformanceDrawerComponent,
        FeedbackDrawerComponent,
        StatsDrawerComponent,
        WritingProfileDrawerComponent,
    ],
    templateUrl: './email-compose-toolbar.html',
})
export class EmailComposeToolbarComponent implements OnInit {
    private readonly api = inject(EmailComposeApiService);
    private readonly router = inject(Router);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    /** When set, "Rate the agent" offers an email-scoped option pre-selected to this id. */
    @Input() emailId: string | null = null;

    drawer: ToolbarDrawer = 'none';

    reviewQueueCount = 0;
    reviewQueueItems: ReviewQueueItem[] = [];
    reviewQueuePagination: PaginationMeta | null = null;
    reviewQueuePage = 1;

    performanceTab: PerformanceDrawerTab = 'report';
    performanceReport: PerformanceReport | null = null;
    logs: EmailTelemetryLogEntry[] = [];
    logsPagination: PaginationMeta | null = null;
    logsPage = 1;
    logFilters = { callType: '', success: '', dateFrom: '', dateTo: '' };
    readonly callTypeOptions: CallTypeOption[] = Object.entries(CALL_TYPE_LABEL_KEYS).map(([value, key]) => ({
        value,
        label: this.translate.instant(key),
    }));
    get callTypeLabels(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, i18nKey] of Object.entries(CALL_TYPE_LABEL_KEYS)) out[key] = this.translate.instant(i18nKey);
        return out;
    }

    stats: AgentStats | null = null;
    searchHistory: SearchHistoryEntry[] = [];
    searchHistoryPagination: PaginationMeta | null = null;
    searchHistoryPage = 1;

    profile: ContextProfile | null = null;
    savingProfile = false;

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
    private toReviewQueueItem(email: EmailSummary): ReviewQueueItem {
        return {
            id: email.id,
            title: email.subject || this.translate.instant('emailComposeAgent.common.noSubject'),
            metaLine: [
                this.translate.instant(`emailComposeAgent.common.mode.${email.mode}`) || email.mode,
                this.translate.instant(`emailComposeAgent.tones.${email.tone}`) || email.tone,
                email.language,
            ],
            badges: [
                { label: this.translate.instant(`emailComposeAgent.classification.${email.document_classification}`) || email.document_classification, severity: 'secondary' as const },
                ...(email.confidence_score !== null
                    ? [{ label: `${email.confidence_score}%`, severity: this.confidenceSeverity(email.confidence_score) as 'success' | 'warn' | 'danger' }]
                    : []),
            ],
        };
    }
    private confidenceSeverity(score: number): 'success' | 'warn' | 'danger' {
        if (score >= 75) return 'success';
        if (score >= 50) return 'warn';
        return 'danger';
    }
    async onReviewQueuePage(delta: number): Promise<void> {
        this.reviewQueuePage = Math.max(1, this.reviewQueuePage + delta);
        await this.loadReviewQueue();
    }
    openEmailFromQueue(id: string): void {
        this.drawer = 'none';
        this.router.navigateByUrl(`/email-compose-agent/emails/${id}`);
    }
    async onReviewDecide(payload: ReviewDecisionPayload): Promise<void> {
        try {
            await this.api.reviewEmail(payload.id, payload.decision, payload.reviewerName, payload.reviewerNotes);
            this.common.showSuccessMessage(
                this.translate.instant(payload.decision === 'approve' ? 'emailComposeAgent.toast.reviewApproved' : 'emailComposeAgent.toast.reviewRejected'),
            );
            await this.loadReviewQueue();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.reviewFailed'));
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
    async onLogFiltersChange(filters: { callType: string; success: string; dateFrom: string; dateTo: string }): Promise<void> {
        this.logFilters = filters;
        this.logsPage = 1;
        await this.loadLogs();
    }
    async onLogsPage(delta: number): Promise<void> {
        this.logsPage = Math.max(1, this.logsPage + delta);
        await this.loadLogs();
    }

    // ---------- Stats ----------
    async openStats(): Promise<void> {
        this.drawer = 'stats';
        this.searchHistoryPage = 1;
        await Promise.all([this.loadStats(), this.loadSearchHistory()]);
    }
    async loadStats(): Promise<void> {
        this.stats = await this.api.getStats();
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

    // ---------- Writing profile ----------
    async openProfile(): Promise<void> {
        this.drawer = 'profile';
        try {
            this.profile = await this.api.getContextProfile();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.loadProfileFailed'));
        }
    }
    async onSaveProfile(payload: Partial<ContextProfile>): Promise<void> {
        this.savingProfile = true;
        try {
            this.profile = await this.api.saveContextProfile(payload);
            this.drawer = 'none';
            this.common.showSuccessMessage(this.translate.instant('emailComposeAgent.toast.profileSaved'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.profileSaveFailed'));
        } finally {
            this.savingProfile = false;
        }
    }

    // ---------- Feedback ----------
    openFeedback(): void {
        this.drawer = 'feedback';
    }
    async onSubmitFeedback(payload: FeedbackSubmitPayload): Promise<void> {
        try {
            await this.api.submitFeedback(payload.rating, payload.comment, payload.forDocument && this.emailId ? this.emailId : undefined);
            this.drawer = 'none';
            this.common.showSuccessMessage(this.translate.instant('emailComposeAgent.toast.feedbackSubmitted'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.feedbackFailed'));
        }
    }

    closeDrawer(): void {
        this.drawer = 'none';
    }
}
