import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { TooltipModule } from 'primeng/tooltip';
import { resolveIsoCountry } from './iso-country-codes';

export interface FlagCellParams extends ICellRendererParams {
    /** Resolves the country code/name from the row when it isn't the plain cell value. */
    valueGetter?: (row: unknown) => string | null | undefined;
}

@Component({
    selector: 'lib-data-table-flag-cell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TooltipModule],
    template: `
        @if (flagUrl) {
            <img
                [src]="flagUrl"
                [alt]="countryName"
                [pTooltip]="countryName"
                tooltipPosition="top"
                class="h-auto w-8 object-contain"
                (error)="onImgError()"
            />
        } @else if (countryName) {
            <span [pTooltip]="countryName" tooltipPosition="top" class="text-xs text-gray-500">{{ countryName }}</span>
        } @else {
            <span class="text-xs text-gray-400">—</span>
        }
    `,
})
export class FlagCellComponent implements ICellRendererAngularComp {
    flagUrl: string | null = null;
    countryName = '';

    agInit(params: FlagCellParams): void {
        this.resolve(params);
    }

    refresh(params: FlagCellParams): boolean {
        this.resolve(params);
        return true;
    }

    private resolve(params: FlagCellParams): void {
        const code = params.valueGetter ? params.valueGetter(params.data) : (params.value as string | null | undefined);
        const country = resolveIsoCountry(code);

        if (!country) {
            this.flagUrl = null;
            this.countryName = code ? String(code) : '';
            return;
        }

        this.flagUrl = `/images/flags/${country.iso2.toLowerCase()}.svg`;
        this.countryName = country.name;
    }

    onImgError(): void {
        this.flagUrl = null;
    }
}
