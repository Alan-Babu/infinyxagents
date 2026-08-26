import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { TagModule } from 'primeng/tag';

import { DataTableStatusEntry } from '../../data-table/data-table.types';

export interface StatusCellParams extends ICellRendererParams {
    /** Maps a string cell value to a severity + label. Falls back to a boolean active/inactive tag when omitted. */
    statusMap?: Record<string, DataTableStatusEntry>;
}

@Component({
    selector: 'lib-data-table-status-cell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TagModule],
    template: `<p-tag
        class="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-widest"
        [value]="label"
        [severity]="severity"
    ></p-tag>`,
})
export class StatusCellComponent implements ICellRendererAngularComp {
    severity: DataTableStatusEntry['severity'] = 'secondary';
    label = 'Inactive';

    agInit(params: StatusCellParams): void {
        this.resolve(params);
    }

    refresh(params: StatusCellParams): boolean {
        this.resolve(params);
        return true;
    }

    private resolve(params: StatusCellParams): void {
        if (params.statusMap) {
            const entry = params.statusMap[params.value as string];
            this.severity = entry?.severity ?? 'secondary';
            this.label = entry?.label ?? String(params.value);
        } else {
            const active = !!params.value;
            this.severity = active ? 'success' : 'secondary';
            this.label = active ? 'Active' : 'Inactive';
        }
    }
}
