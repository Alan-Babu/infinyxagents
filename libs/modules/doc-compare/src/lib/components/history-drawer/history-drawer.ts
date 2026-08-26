import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { ComparisonLogEntry, VersionSummary } from '../../models/doc-compare.models';

export type HistoryTab = 'versions' | 'log';

@Component({
    selector: 'lib-history-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule, DatePipe],
    templateUrl: './history-drawer.html',
})
export class HistoryDrawerComponent {
    @Input() visible = false;
    @Input() tab: HistoryTab = 'versions';
    @Input() versions: VersionSummary[] = [];
    @Input() log: ComparisonLogEntry[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() tabChange = new EventEmitter<HistoryTab>();
    @Output() useAsVersion = new EventEmitter<{ version: VersionSummary; slot: 'A' | 'B' }>();
    @Output() setMaster = new EventEmitter<VersionSummary>();
    @Output() deleteVersion = new EventEmitter<VersionSummary>();
    @Output() deleteLogEntry = new EventEmitter<ComparisonLogEntry>();

    close(): void {
        this.visibleChange.emit(false);
    }
}
