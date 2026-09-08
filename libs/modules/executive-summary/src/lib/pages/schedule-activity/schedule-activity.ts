import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable, DataTableStatusEntry, StatusCellComponent } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { DrawerModule } from 'primeng/drawer';
import type { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { marked } from 'marked';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { ScheduledJobRunDetail, ScheduledJobRunEntry } from '../../models/executive-summary.models';
import { formatInTimeZone } from '../../utils/format';

@Component({
    selector: 'lib-schedule-activity',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, StatCardComponent, PageHeaderComponent, DrawerModule],
    templateUrl: './schedule-activity.html',
})
export class ScheduleActivityPage implements OnInit, OnDestroy {
    private readonly api = inject(ExecSummaryApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    runs: ScheduledJobRunEntry[] = [];
    loading = false;
    colDefs: ColDef[] = [];

    detailOpen = false;
    detailLoading = false;
    selectedRun: ScheduledJobRunDetail | null = null;
    currentHtml = '';
    previousHtml = '';

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    ngOnInit(): void {
        this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    async refresh(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.listScheduleRuns({ limit: 200 });
            this.runs = res.runs;
        } finally {
            this.loading = false;
        }
    }

    get failedCount(): number {
        return this.runs.filter(r => r.status === 'failed').length;
    }

    get emailedCount(): number {
        return this.runs.filter(r => r.emailed).length;
    }

    formatRunAt(r: ScheduledJobRunEntry): string {
        return formatInTimeZone(r.run_at, r.timezone);
    }

    formatPreviousRunAt(): string {
        if (!this.selectedRun?.previous_run_at) return '';
        return formatInTimeZone(this.selectedRun.previous_run_at, this.selectedRun.timezone);
    }

    async openRun(row: unknown): Promise<void> {
        const entry = row as ScheduledJobRunEntry;
        this.detailOpen = true;
        this.detailLoading = true;
        this.selectedRun = null;
        this.currentHtml = '';
        this.previousHtml = '';
        try {
            const detail = await this.api.getScheduleRun(entry.id);
            this.selectedRun = detail;
            this.currentHtml = detail.content_markdown ? (marked.parse(detail.content_markdown) as string) : '';
            this.previousHtml = detail.previous_content_markdown ? (marked.parse(detail.previous_content_markdown) as string) : '';
        } catch (err) {
            this.common.showApiError(err);
            this.detailOpen = false;
        } finally {
            this.detailLoading = false;
        }
    }

    closeDetail(): void {
        this.detailOpen = false;
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);

        const statusMap: Record<string, DataTableStatusEntry> = {
            success: { severity: 'success', label: t('executiveSummary.scheduleActivity.success') },
            failed: { severity: 'danger', label: t('executiveSummary.scheduleActivity.failed') },
        };
        const emailedMap: Record<string, DataTableStatusEntry> = {
            yes: { severity: 'info', label: t('executiveSummary.scheduleActivity.emailedYes') },
            no: { severity: 'secondary', label: t('executiveSummary.scheduleActivity.emailedNo') },
        };
        const changedMap: Record<string, DataTableStatusEntry> = {
            yes: { severity: 'warn', label: t('executiveSummary.scheduleActivity.changedYes') },
            no: { severity: 'secondary', label: t('executiveSummary.scheduleActivity.changedNo') },
            unknown: { severity: 'secondary', label: '—' },
        };

        this.colDefs = [
            {
                field: 'topic',
                headerName: t('executiveSummary.scheduleActivity.job'),
                cellClass: 'font-semibold text-primary-700',
                tooltipField: 'topic',
            },
            {
                colId: 'run_at',
                headerName: t('executiveSummary.scheduleActivity.mailedAt'),
                valueGetter: p => this.formatRunAt(p.data),
                cellClass: 'text-gray-500',
            },
            {
                colId: 'status',
                headerName: t('executiveSummary.scheduleActivity.status'),
                valueGetter: p => p.data.status,
                cellRenderer: StatusCellComponent,
                cellRendererParams: { statusMap },
            },
            {
                colId: 'emailed',
                headerName: t('executiveSummary.scheduleActivity.emailed'),
                valueGetter: p => (p.data.emailed ? 'yes' : 'no'),
                cellRenderer: StatusCellComponent,
                cellRendererParams: { statusMap: emailedMap },
            },
            {
                colId: 'changed',
                headerName: t('executiveSummary.scheduleActivity.changed'),
                valueGetter: p => (p.data.changed === null || p.data.changed === undefined ? 'unknown' : p.data.changed ? 'yes' : 'no'),
                cellRenderer: StatusCellComponent,
                cellRendererParams: { statusMap: changedMap },
            },
        ];
    }
}
