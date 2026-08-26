import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';

export interface RecentReport {
    session_id: string;
    name: string;
    framework: string;
    word_count: number;
}

@Component({
    selector: 'lib-export-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, SelectModule],
    templateUrl: './export-panel.html',
})
export class ExportPanelComponent {
    @Input() visible = false;
    @Input() title = '';
    @Input() format: 'Word (.docx)' | 'PDF' | 'PowerPoint (.pptx)' = 'Word (.docx)';
    @Input() formatOptions: { value: string; label: string }[] = [
        { value: 'Word (.docx)', label: 'Word (.docx)' },
        { value: 'PDF', label: 'PDF' },
        { value: 'PowerPoint (.pptx)', label: 'PowerPoint (.pptx)' },
    ];
    @Input() downloading = false;
    @Input() recentReports: RecentReport[] = [];
    @Input() downloadingRecentId: string | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() formatChange = new EventEmitter<string>();
    @Output() download = new EventEmitter<void>();
    @Output() downloadRecent = new EventEmitter<string>();

    get formatLabel(): string {
        if (this.format.startsWith('Word')) return 'DOCX';
        if (this.format.startsWith('PDF')) return 'PDF';
        if (this.format.startsWith('PowerPoint')) return 'PPTX';
        return this.format;
    }

    close(): void {
        this.visibleChange.emit(false);
    }
}
