import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { Subscription } from 'rxjs';

import { TaskStatusCellComponent } from '../../components/task-status-cell/task-status-cell';
import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { Task } from '../../models/executive-summary.models';

type SubTab = 'to-me' | 'by-me';

interface TabDef {
    id: SubTab;
    labelKey: string;
}

@Component({
    selector: 'lib-my-tasks',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, StatCardComponent, PageHeaderComponent],
    templateUrl: './my-tasks.html',
})
export class MyTasksPage implements OnInit, OnDestroy {
    private readonly api = inject(ExecSummaryApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly auth = inject(AuthService);

    readonly statusOptions = [
        { label: 'Open', value: 'open' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Done', value: 'done' },
    ];

    readonly tabs: TabDef[] = [
        { id: 'to-me', labelKey: 'executiveSummary.myTasks.assignedToMe' },
        { id: 'by-me', labelKey: 'executiveSummary.myTasks.assignedByMe' },
    ];

    tasks: Task[] = [];
    currentTabTasks: Task[] = [];
    loading = false;
    subTab: SubTab = 'to-me';
    updatingId: number | null = null;
    colDefs: ColDef[] = [];

    readonly gridOptions: GridOptions = {
        getRowClass: params => (this.isOverdue(params.data as Task) ? 'bg-red-50' : undefined),
    };

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    get currentUser(): string {
        return this.auth.user()?.id || '';
    }

    private get currentUserAliases(): string[] {
        const user = this.auth.user();
        return [user?.id, user?.displayName, user?.email]
            .map(value => (value || '').trim().toLowerCase())
            .filter((value, index, aliases) => Boolean(value) && aliases.indexOf(value) === index);
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
            this.tasks = await this.api.listTasks();
            this.applyTab();
        } finally {
            this.loading = false;
        }
    }

    get toMe(): Task[] {
        return this.tasks.filter(t => t.assignees.some(a => this.matchesCurrentUser(a)));
    }

    get byMe(): Task[] {
        return this.tasks.filter(t => this.matchesCurrentUser(t.created_by));
    }

    private matchesCurrentUser(identity: string): boolean {
        const candidate = (identity || '').trim().toLowerCase();
        if (!candidate) return false;

        const candidateAliases = new Set([
            candidate,
            ...candidate.split(':').map(part => part.trim()).filter(Boolean),
        ]);
        return this.currentUserAliases.some(alias => candidateAliases.has(alias));
    }

    tabCount(id: SubTab): number {
        return id === 'to-me' ? this.toMe.length : this.byMe.length;
    }

    get overdueCount(): number {
        return this.currentTabTasks.filter(t => this.isOverdue(t)).length;
    }

    get doneCount(): number {
        return this.currentTabTasks.filter(t => t.status === 'done').length;
    }

    isOverdue(t: Task): boolean {
        if (!t.due_date || t.status === 'done') return false;
        return new Date(t.due_date) < new Date(new Date().toDateString());
    }

    switchTab(tab: SubTab): void {
        this.subTab = tab;
        this.applyTab();
        this.rebuildColDefs();
    }

    private applyTab(): void {
        this.currentTabTasks = this.subTab === 'to-me' ? this.toMe : this.byMe;
    }

    async setStatus(task: Task, status: string): Promise<void> {
        this.updatingId = task.id;
        this.rebuildColDefs();
        try {
            const updated = await this.api.setTaskStatus(task.id, status);
            const idx = this.tasks.findIndex(t => t.id === updated.id);
            if (idx !== -1) this.tasks[idx] = updated;
            this.applyTab();
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.myTasks.updateFailed'));
        } finally {
            this.updatingId = null;
            this.rebuildColDefs();
        }
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);
        const subTab = this.subTab;

        const priorityChip = (priority: string) => {
            const classes =
                priority === 'Urgent'
                    ? 'bg-red-600 text-white'
                    : priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600';
            return `<span class="rounded-full px-2.5 py-1 text-xs font-medium ${classes}">${priority}</span>`;
        };

        this.colDefs = [
            {
                field: 'title',
                headerName: t('executiveSummary.myTasks.task'),
                cellClass: 'font-semibold text-gray-800',
                tooltipField: 'title',
            },
            {
                colId: 'from',
                headerName: subTab === 'to-me' ? t('executiveSummary.myTasks.from') : t('executiveSummary.myTasks.assignees'),
                valueGetter: p => (subTab === 'to-me' ? p.data.created_by : p.data.assignees.join(', ')),
                cellClass: 'text-gray-500',
            },
            {
                field: 'due_date',
                headerName: t('executiveSummary.myTasks.due'),
                valueFormatter: p => p.value || '—',
                cellClass: p => (this.isOverdue(p.data) ? 'font-semibold text-red-600' : 'text-gray-500'),
            },
            {
                field: 'priority',
                headerName: t('executiveSummary.myTasks.priority'),
                cellRenderer: (p: { value: string }) => priorityChip(p.value),
            },
            {
                field: 'status',
                headerName: t('executiveSummary.myTasks.status'),
                cellRenderer: TaskStatusCellComponent,
                cellRendererParams: {
                    options: this.statusOptions,
                    disabled: (row: unknown) => this.updatingId === (row as Task).id,
                    onChange: (row: unknown, status: string) => this.setStatus(row as Task, status),
                },
            },
        ];
    }
}
