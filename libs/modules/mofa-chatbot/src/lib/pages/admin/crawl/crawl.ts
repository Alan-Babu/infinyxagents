import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import type { ColDef } from 'ag-grid-community';
import { CrawledPage, CrawledPageDetail, CrawlRun, CrawlSchedule } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';
import { CrawledPageDetailDrawerComponent } from '../../../components/crawled-page-detail-drawer/crawled-page-detail-drawer';
import { buildCrawlRunColDefs } from '../../../utils/crawl-columns';
import { buildCrawledPageColDefs } from '../../../utils/crawled-page-columns';
import { formatInTimeZone, formatTimestamp } from '../../../utils/date-format';

@Component({
    selector: 'lib-admin-crawl',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DataTable, CheckboxModule, InputNumberModule, InputTextModule, ButtonModule, Tooltip, CrawledPageDetailDrawerComponent],
    templateUrl: './crawl.html',
})
export class AdminCrawlPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly auth = inject(AuthService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    triggering = false;
    schedule: CrawlSchedule | null = null;
    scheduleDraft: Partial<CrawlSchedule> = {};
    seedUrlsText = '';
    crawlRuns: CrawlRun[] = [];
    colDefs: ColDef[] = buildCrawlRunColDefs(key => this.translate.instant(key));

    crawledPages: CrawledPage[] = [];
    crawledPagesSearch = '';
    selectedCrawledPage: CrawledPageDetail | null = null;
    crawledPageColDefs: ColDef[] = buildCrawledPageColDefs(
        key => this.translate.instant(key),
        page => this.viewCrawledPage(page),
    );

    /** The most recent run that actually finished successfully -- what
     * "the knowledge base was last updated at X" concretely means, distinct
     * from the next SCHEDULED time. crawlRuns is already ordered newest-first. */
    get lastSuccessfulRun(): CrawlRun | null {
        return this.crawlRuns.find(r => r.status === 'completed') ?? null;
    }

    async ngOnInit(): Promise<void> {
        await this.load();
    }

    private async load(): Promise<void> {
        this.loading = true;
        try {
            const [schedule, runs, pages] = await Promise.all([
                this.api.getCrawlSchedule(),
                this.api.listCrawlRuns(1, 10),
                this.api.listCrawledPages(undefined, 1, 20),
            ]);
            this.schedule = schedule;
            this.scheduleDraft = { ...schedule };
            this.seedUrlsText = schedule.seed_urls.join('\n');
            this.crawlRuns = runs.items;
            this.crawledPages = pages.items;
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async saveSchedule(): Promise<void> {
        const seedUrls = this.seedUrlsText
            .split('\n')
            .map(u => u.trim())
            .filter(Boolean);
        try {
            this.schedule = await this.api.updateCrawlSchedule({
                enabled: this.scheduleDraft.enabled,
                hour: this.scheduleDraft.hour,
                minute: this.scheduleDraft.minute,
                mode: this.scheduleDraft.mode,
                seed_urls: seedUrls,
                max_pages_per_run: this.scheduleDraft.max_pages_per_run,
                use_sitemap: this.scheduleDraft.use_sitemap,
                updated_by: this.auth.user()?.displayName || '',
            });
            this.common.showSuccessMessage(this.translate.instant('mofaChatbot.admin.crawl.saved'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.crawl.saveFailed'));
        }
    }

    async triggerCrawlNow(mode: 'incremental' | 'full'): Promise<void> {
        this.triggering = true;
        try {
            await this.api.triggerCrawl(mode);
            this.common.showSuccessMessage(this.translate.instant(mode === 'full' ? 'mofaChatbot.admin.crawl.startedFull' : 'mofaChatbot.admin.crawl.startedIncremental'));
            setTimeout(() => this.refreshRuns(), 1500);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.crawl.startFailed'));
        } finally {
            this.triggering = false;
        }
    }

    async refreshRuns(): Promise<void> {
        try {
            this.crawlRuns = (await this.api.listCrawlRuns(1, 10)).items;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async searchCrawledPages(): Promise<void> {
        try {
            this.crawledPages = (await this.api.listCrawledPages(this.crawledPagesSearch || undefined, 1, 20)).items;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async viewCrawledPage(page: CrawledPage): Promise<void> {
        try {
            this.selectedCrawledPage = await this.api.getCrawledPage(page.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    closeCrawledPageDetail(): void {
        this.selectedCrawledPage = null;
    }

    formatRunTimestamp(iso: string | null): string {
        return formatTimestamp(iso);
    }

    /**
     * Formats the next-run ISO datetime explicitly in the schedule's OWN
     * timezone (not the admin's browser timezone, which may differ) --
     * makes it unambiguous exactly when the next crawl will actually run.
     */
    formatNextRunAt(iso: string, timezone: string): string {
        try {
            return formatInTimeZone(iso, timezone);
        } catch {
            return iso;
        }
    }
}
