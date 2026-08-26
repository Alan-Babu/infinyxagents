import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import {
    CallTypeOption,
    PaginationMeta,
    PerformanceReport,
    TelemetryLogEntry,
    TelemetryLogFilters,
} from '../../models/document-agent.models';

export type PerformanceDrawerTab = 'report' | 'logs';

/**
 * Shared "agent performance" drawer: a stats/breakdown report tab plus a
 * filterable, paginated raw-telemetry log tab. Purely presentational —
 * callers own fetching and filtering; this emits `filtersChange`/`logsPage`
 * intents and re-renders whatever `report`/`logs` it's given.
 */
@Component({
    selector: 'lib-performance-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DrawerModule, TabsModule],
    templateUrl: './performance-drawer.html',
})
export class PerformanceDrawerComponent {
    @Input() visible = false;
    @Input() eyebrow = '';
    @Input() title = 'Agent performance report';
    @Input() tab: PerformanceDrawerTab = 'report';
    @Input() report: PerformanceReport | null = null;
    @Input() callTypeLabels: Record<string, string> = {};
    @Input() callTypeOptions: CallTypeOption[] = [];
    @Input() logs: TelemetryLogEntry[] = [];
    @Input() logsPagination: PaginationMeta | null = null;
    @Input() filters: TelemetryLogFilters = { callType: '', success: '', dateFrom: '', dateTo: '' };
    @Input() footerNote = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() tabChange = new EventEmitter<PerformanceDrawerTab>();
    @Output() filtersChange = new EventEmitter<TelemetryLogFilters>();
    @Output() logsPage = new EventEmitter<number>();

    close(): void {
        this.visibleChange.emit(false);
    }

    onTabChange(value: string | number | undefined): void {
        this.tabChange.emit(value === 'logs' ? 'logs' : 'report');
    }

    callTypeBreakdownEntries(): [string, PerformanceReport['by_call_type'][string]][] {
        return Object.entries(this.report?.by_call_type ?? {});
    }

    callTypeLabel(key: string): string {
        return this.callTypeLabels[key] ?? key;
    }

    confidenceClass(score: number | null): string {
        if (score === null || score === undefined) return 'text-gray-500';
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-red-600';
    }

    fmtPercent(value: number | null): string {
        return value === null || value === undefined ? '—' : `${value}%`;
    }

    fmtDuration(ms: number | null): string {
        if (ms === null || ms === undefined) return '—';
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    onFiltersChange(): void {
        this.filtersChange.emit({ ...this.filters });
    }
}
