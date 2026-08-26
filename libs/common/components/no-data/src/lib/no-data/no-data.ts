import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Generic empty-state block for non-table contexts (empty drawers, no-results
 * panels, empty dashboard sections). For ag-grid's own empty-grid overlay,
 * use `NoRowsOverlayComponent` from `@nfinyx/data-table` instead — that one
 * implements ag-grid's overlay contract and isn't usable outside a grid.
 */
@Component({
    selector: 'lib-no-data',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <i class="text-3xl text-gray-300" [ngClass]="icon"></i>
        <div class="text-sm font-medium text-gray-500">{{ message }}</div>
        @if (subMessage) {
            <div class="text-xs text-gray-400">{{ subMessage }}</div>
        }
    </div>`,
})
export class NoData {
    @Input() message = 'No data';
    @Input() subMessage?: string;
    @Input() icon = 'pi pi-inbox';
}
