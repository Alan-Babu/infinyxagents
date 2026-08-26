import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '@nfinyx/services';
import { DataTable, DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { ScheduledJobEntry } from '../../models/executive-summary.models';
import { formatMediumDate } from '../../utils/format';

@Component({
    selector: 'lib-scheduled-jobs',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, StatCardComponent, PageHeaderComponent],
    templateUrl: './scheduled-jobs.html',
})
export class ScheduledJobsPage implements OnInit, OnDestroy {
    private readonly api = inject(ExecSummaryApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    jobs: ScheduledJobEntry[] = [];
    activeJobs: ScheduledJobEntry[] = [];
    loading = false;
    colDefs: ColDef[] = [];

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
            this.jobs = await this.api.listSchedules();
            this.activeJobs = this.jobs.filter(j => j.active);
        } finally {
            this.loading = false;
        }
    }

    get failedCount(): number {
        return this.activeJobs.filter(j => j.last_run_status === 'failed').length;
    }

    formatSchedule(j: ScheduledJobEntry): string {
        const freq = j.frequency.charAt(0).toUpperCase() + j.frequency.slice(1);
        return `${freq} ${j.time_of_day}`;
    }

    async cancel(job: ScheduledJobEntry): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('executiveSummary.scheduledJobs.confirmCancel', { topic: job.topic }),
            this.translate.instant('executiveSummary.confirmHeader'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.cancelSchedule(job.id);
            await this.refresh();
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.scheduledJobs.cancelFailed'));
        }
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);

        const statusMap: Record<string, DataTableStatusEntry> = {
            failed: { severity: 'danger', label: t('executiveSummary.scheduledJobs.failed') },
            success: { severity: 'secondary', label: t('executiveSummary.scheduledJobs.success') },
            never: { severity: 'secondary', label: t('executiveSummary.scheduledJobs.neverRun') },
        };

        const actions: DataTableAction[] = [
            {
                key: 'cancel',
                icon: 'x',
                label: t('executiveSummary.scheduledJobs.cancel'),
                severity: 'danger',
            },
        ];

        this.colDefs = [
            {
                field: 'topic',
                headerName: t('executiveSummary.scheduledJobs.job'),
                cellClass: 'font-semibold text-primary-700',
                tooltipField: 'topic',
            },
            {
                colId: 'schedule',
                headerName: t('executiveSummary.scheduledJobs.schedule'),
                valueGetter: p => this.formatSchedule(p.data),
                cellRenderer: (p: { value: string }) =>
                    `<span class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">${p.value}</span>`,
            },
            {
                field: 'next_run_at',
                headerName: t('executiveSummary.scheduledJobs.nextRun'),
                valueFormatter: p => (p.value ? formatMediumDate(p.value) : '—'),
                cellClass: 'text-gray-500',
            },
            {
                colId: 'status',
                headerName: t('executiveSummary.scheduledJobs.lastStatus'),
                valueGetter: p => p.data.last_run_status ?? 'never',
                cellRenderer: StatusCellComponent,
                cellRendererParams: { statusMap },
            },
            {
                colId: 'action',
                headerName: '',
                cellRenderer: RowActionsCellComponent,
                cellRendererParams: {
                    actions,
                    onAction: (_key: string, row: unknown) => this.cancel(row as ScheduledJobEntry),
                },
            },
        ];
    }
}
