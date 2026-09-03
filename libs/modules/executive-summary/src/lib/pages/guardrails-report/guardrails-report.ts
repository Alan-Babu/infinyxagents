import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@nfinyx/services';
import { ToastrService } from 'ngx-toastr';
import { DataTable, DataTableStatusEntry, StatusCellComponent } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';

import { GuardrailDrawerComponent } from '../../components/guardrail-drawer/guardrail-drawer';
import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { AuditLogEntry, ModerationFlagEntry } from '../../models/executive-summary.models';
import { formatMediumDate } from '../../utils/format';
import { categoryLabel, guardrailPriority, guardrailStatusLabel, initials } from '../../utils/guardrail-display';

@Component({
    selector: 'lib-guardrails-report',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, GuardrailDrawerComponent, StatCardComponent, PageHeaderComponent],
    templateUrl: './guardrails-report.html',
})
export class GuardrailsReportPage implements OnInit, OnDestroy {
    private readonly api = inject(ExecSummaryApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly auth = inject(AuthService);

    flags: ModerationFlagEntry[] = [];
    loading = false;
    selectedFlag: ModerationFlagEntry | null = null;
    updatingId: number | null = null;
    colDefs: ColDef[] = [];
    activeTab: 'blocked' | 'activity' = 'blocked';
    auditEntries: AuditLogEntry[] = [];
    auditLoading = false;
    auditLoaded = false;
    auditColDefs: ColDef[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    ngOnInit(): void {
        if (this.isAdmin) this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    /** Moderation flags and the audit log both live on the exec-agent admin router. */
    get isAdmin(): boolean {
        return this.auth.isAdmin();
    }

    async refresh(): Promise<void> {
        this.loading = true;
        try {
            this.flags = await this.api.listModerationFlags();
        } finally {
            this.loading = false;
        }
    }

    async selectTab(tab: 'blocked' | 'activity'): Promise<void> {
        this.activeTab = tab;
        if (tab === 'activity' && this.isAdmin && !this.auditLoaded) {
            this.auditLoading = true;
            try {
                this.auditEntries = await this.api.getAuditLog();
                this.auditLoaded = true;
            } catch {
                this.auditEntries = [];
                this.auditLoaded = false;
                this.toastr.warning(this.translate.instant('executiveSummary.guardrails.auditUnavailable'));
            } finally {
                this.auditLoading = false;
            }
        }
    }

    get highPriorityCount(): number {
        return this.flags.filter(f => guardrailPriority(f.category) === 'High').length;
    }

    get unreviewedCount(): number {
        return this.flags.filter(f => f.status === 'flagged').length;
    }

    openFlag(row: unknown): void {
        this.selectedFlag = row as ModerationFlagEntry;
    }

    closeDrawer(): void {
        this.selectedFlag = null;
    }

    async setStatus(flag: ModerationFlagEntry, status: string): Promise<void> {
        this.updatingId = flag.id;
        try {
            const updated = await this.api.setModerationStatus(flag.id, status);
            this.updatingId = null;
            const idx = this.flags.findIndex(f => f.id === updated.id);
            if (idx !== -1) this.flags[idx] = updated;
            if (this.selectedFlag?.id === updated.id) this.selectedFlag = updated;
        } catch {
            this.updatingId = null;
            this.toastr.error(this.translate.instant('executiveSummary.guardrails.updateFailed'));
        }
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);

        const statusMap: Record<string, DataTableStatusEntry> = {
            flagged: { severity: 'danger', label: guardrailStatusLabel('flagged', t) },
            reviewed: { severity: 'secondary', label: guardrailStatusLabel('reviewed', t) },
            corrective_action_taken: { severity: 'success', label: guardrailStatusLabel('corrective_action_taken', t) },
        };

        const priorityChip = (priority: 'High' | 'Medium' | 'Low') => {
            const classes =
                priority === 'High'
                    ? 'bg-red-100 text-red-700'
                    : priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600';
            return `<span class="rounded-full px-2.5 py-1 text-xs font-medium ${classes}">${priority}</span>`;
        };

        this.colDefs = [
            {
                field: 'category',
                headerName: t('executiveSummary.guardrails.policy'),
                cellRenderer: (p: { value: string }) =>
                    `<span class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">${categoryLabel(p.value)}</span>`,
            },
            {
                colId: 'requester',
                headerName: t('executiveSummary.guardrails.requester'),
                valueGetter: p => p.data.user_id,
                cellRenderer: (p: { data: ModerationFlagEntry }) => `
                    <div class="flex items-center gap-2">
                        <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">${initials(p.data.user_id)}</span>
                        <div>
                            <div class="text-sm font-semibold text-gray-800">${p.data.user_id}</div>
                            <div class="text-xs text-gray-400">${formatMediumDate(p.data.created_at)}</div>
                        </div>
                    </div>`,
            },
            {
                colId: 'reason',
                headerName: t('executiveSummary.guardrails.reason'),
                valueGetter: p => p.data.matched_terms.join(', ') || '—',
                tooltipValueGetter: p => p.data.matched_terms.join(', '),
                cellClass: 'max-w-56 truncate text-gray-500',
            },
            {
                colId: 'priority',
                headerName: t('executiveSummary.guardrails.priority'),
                valueGetter: p => guardrailPriority(p.data.category),
                cellRenderer: (p: { value: 'High' | 'Medium' | 'Low' }) => priorityChip(p.value),
            },
            {
                field: 'status',
                headerName: t('executiveSummary.guardrails.status'),
                cellRenderer: StatusCellComponent,
                cellRendererParams: { statusMap },
            },
        ];
        this.auditColDefs = [
            { field: 'action', headerName: t('executiveSummary.guardrails.action'), flex: 1 },
            { field: 'resource_type', headerName: t('executiveSummary.guardrails.resource'), flex: 1 },
            { field: 'resource_id', headerName: t('executiveSummary.guardrails.resourceId'), flex: 1 },
            { field: 'user_id', headerName: t('executiveSummary.guardrails.user'), flex: 1 },
            {
                field: 'created_at',
                headerName: t('executiveSummary.guardrails.when'),
                valueFormatter: params => formatMediumDate(params.value),
                flex: 1,
            },
        ];
    }
}
