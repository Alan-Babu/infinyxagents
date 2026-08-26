import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PaginationMeta } from '@nfinyx/document-agent';
import { AgentStats, SearchHistoryEntry } from '../../models/email-compose-agent.models';

/**
 * Local "business stats" drawer — no shared-lib equivalent exists for this.
 * Purely presentational: caller owns fetching `AgentStats`/search history.
 */
@Component({
    selector: 'lib-email-compose-stats-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule, StatCardComponent],
    templateUrl: './stats-drawer.html',
})
export class StatsDrawerComponent {
    @Input() visible = false;
    @Input() stats: AgentStats | null = null;
    @Input() searchHistory: SearchHistoryEntry[] = [];
    @Input() searchHistoryPagination: PaginationMeta | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() page = new EventEmitter<number>();

    close(): void {
        this.visibleChange.emit(false);
    }

    breakdownEntries(record: Record<string, number> | undefined): [string, number][] {
        if (!record) return [];
        return Object.entries(record).sort((a, b) => b[1] - a[1]);
    }

    barWidth(value: number, record: Record<string, number> | undefined): number {
        if (!record) return 0;
        const max = Math.max(...Object.values(record), 1);
        return Math.round((value / max) * 100);
    }

    fmtDate(iso: string): string {
        const d = new Date(iso);
        return (
            d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' · ' +
            d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        );
    }
}
