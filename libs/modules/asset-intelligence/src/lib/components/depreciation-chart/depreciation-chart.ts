import { Component, Input, OnChanges } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';
import { DepreciationSchedulePoint } from '../../models/reports.models';
import '../../utils/ag-charts-setup';

/** Presentational line chart for a depreciation schedule's book value over time. Caller resolves the caption/labels. */
@Component({
    selector: 'lib-depreciation-chart',
    standalone: true,
    imports: [AgCharts],
    template: `<ag-charts [options]="options" style="display: block; height: 220px" />`,
})
export class DepreciationChartComponent implements OnChanges {
    @Input({ required: true }) points: DepreciationSchedulePoint[] = [];
    @Input() valueAxisLabel = 'Book value';

    options: AgCartesianChartOptions = { data: [], series: [] };

    ngOnChanges(): void {
        this.options = {
            data: this.points,
            series: [
                {
                    type: 'line',
                    xKey: 'period',
                    yKey: 'book_value',
                    yName: this.valueAxisLabel,
                    stroke: '#0F99C7',
                    marker: { enabled: false },
                },
            ],
            axes: {
                x: { type: 'category' },
                y: { type: 'number' },
            },
            legend: { enabled: false },
            padding: { top: 8, right: 8, bottom: 8, left: 8 },
        };
    }
}
