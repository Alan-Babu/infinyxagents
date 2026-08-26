import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import type { INoRowsOverlayParams } from 'ag-grid-community';

export interface NoRowsOverlayParams extends INoRowsOverlayParams {
    message?: string;
}

@Component({
    selector: 'lib-data-table-no-rows-overlay',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<div class="flex min-h-48 items-center justify-center px-4 py-10 text-gray-500">
        {{ message }}
    </div>`,
})
export class NoRowsOverlayComponent implements INoRowsOverlayAngularComp {
    message = 'No data';

    agInit(params: NoRowsOverlayParams): void {
        this.message = params.message ?? 'No data';
    }

    refresh(params: NoRowsOverlayParams): void {
        this.message = params.message ?? 'No data';
    }
}
