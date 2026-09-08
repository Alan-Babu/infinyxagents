import { Component, Input, OnChanges } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

export interface DepartmentBarSeries {
    key: string;
    name: string;
    color?: string;
}

/** Presentational grouped-bar chart, one bar group per `xKey` value (e.g. department). Caller resolves series labels/colors. */
@Component({
    selector: 'lib-department-bar-chart',
    standalone: true,
    imports: [AgCharts],
    template: `<ag-charts [options]="options" style="display: block; height: 260px" />`,
})
export class DepartmentBarChartComponent implements OnChanges {
    @Input({ required: true }) data: unknown[] = [];
    @Input({ required: true }) xKey = '';
    @Input({ required: true }) series: DepartmentBarSeries[] = [];

    options: AgCartesianChartOptions = { data: [], series: [] };

    ngOnChanges(): void {
        this.options = {
            data: this.data,
            series: this.series.map(s => ({
                type: 'bar' as const,
                xKey: this.xKey,
                yKey: s.key,
                yName: s.name,
                fill: s.color,
            })),
            axes: {
                x: { type: 'category' },
                y: { type: 'number' },
            },
            legend: { enabled: this.series.length > 1 },
            padding: { top: 8, right: 8, bottom: 8, left: 8 },
        };
    }
}
