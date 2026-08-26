import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SourceLocation, SourceOverlayField, SourceOverlayStamp, SourcePageImage } from '../../models/document-agent.models';

/**
 * Shared bounding-box overlay drawer: renders a document page image with
 * clickable boxes for every field/stamp the agent grounded to a location,
 * synced with a field list on the side. Purely presentational — callers
 * pre-resolve/translate all labels and values before passing them in.
 */
@Component({
    selector: 'lib-verify-source-drawer',
    standalone: true,
    imports: [CommonModule, ButtonModule, DrawerModule],
    templateUrl: './verify-source-drawer.html',
})
export class VerifySourceDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() eyebrow = '';
    @Input() title = 'Verify against source';
    @Input() pages: SourcePageImage[] = [];
    @Input() fields: SourceOverlayField[] = [];
    @Input() stamps: SourceOverlayStamp[] = [];
    @Input() noImageMessage = '';
    @Input() noLocationMessage = '';
    @Input() footerNote = '';
    @Input() loading = false;

    @Output() visibleChange = new EventEmitter<boolean>();

    activePage = 1;
    highlightedField: string | null = null;
    highlightedStampIndex: number | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.highlightedField = null;
            this.highlightedStampIndex = null;
            const firstFieldPage = this.fields.find(f => f.location)?.location?.page_num;
            const firstStampPage = this.stamps.find(s => s.location)?.location?.page_num;
            this.activePage = firstFieldPage || firstStampPage || this.pages[0]?.page_num || 1;
        }
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    currentPage(): SourcePageImage | undefined {
        return this.pages.find(p => p.page_num === this.activePage);
    }

    fieldsOnActivePage(): SourceOverlayField[] {
        return this.fields.filter(f => f.location?.page_num === this.activePage);
    }

    stampsOnActivePage(): { index: number; stamp: SourceOverlayStamp }[] {
        return this.stamps
            .map((stamp, index) => ({ index, stamp }))
            .filter(({ stamp }) => stamp.location && stamp.location.page_num === this.activePage);
    }

    selectField(key: string, location: SourceLocation | undefined): void {
        this.highlightedField = key;
        this.highlightedStampIndex = null;
        if (location) this.activePage = location.page_num;
    }

    selectStamp(index: number, location: SourceLocation | null): void {
        this.highlightedStampIndex = index;
        this.highlightedField = null;
        if (location) this.activePage = location.page_num;
    }

    fieldBoxStyle(loc: SourceLocation): { left: string; top: string; width: string; height: string } {
        return {
            left: loc.x1 * 100 + '%',
            top: loc.y1 * 100 + '%',
            width: (loc.x2 - loc.x1) * 100 + '%',
            height: (loc.y2 - loc.y1) * 100 + '%',
        };
    }
}
