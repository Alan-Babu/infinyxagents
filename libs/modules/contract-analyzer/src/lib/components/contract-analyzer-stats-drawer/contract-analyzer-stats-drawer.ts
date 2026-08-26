import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PaginationMeta } from '@nfinyx/document-agent';
import { AgentStats, SearchHistoryEntry } from '../../models/contract-analyzer.models';
import { fmtDateTime } from '../../utils/contract-display';

/**
 * Module-local "agent stats" drawer — presentational only, toolbar owns
 * fetching. Shows stat-card tiles for the top-line numbers, breakdown lists
 * for the `Record<string, number>` groupings, and a small paginated search
 * history list. No chart library — none exists elsewhere in the repo.
 */
@Component({
    selector: 'lib-contract-analyzer-stats-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule, StatCardComponent],
    templateUrl: './contract-analyzer-stats-drawer.html',
})
export class ContractAnalyzerStatsDrawerComponent {
    @Input() visible = false;
    @Input() stats: AgentStats | null = null;
    @Input() loading = false;
    @Input() searchHistory: SearchHistoryEntry[] = [];
    @Input() searchHistoryPagination: PaginationMeta | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() searchHistoryPage = new EventEmitter<number>();

    readonly fmtDateTime = fmtDateTime;

    close(): void {
        this.visibleChange.emit(false);
    }

    breakdown(rec: Record<string, number> | undefined): { key: string; count: number }[] {
        if (!rec) return [];
        return Object.entries(rec)
            .filter(([k]) => !!k)
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    }

    maxCount(rec: Record<string, number> | undefined): number {
        const entries = this.breakdown(rec);
        return entries.length ? Math.max(...entries.map(e => e.count)) : 1;
    }
}
