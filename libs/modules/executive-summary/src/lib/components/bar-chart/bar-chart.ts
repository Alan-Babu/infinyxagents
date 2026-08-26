import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface BarDatum {
    label: string;
    value: number;
}

@Component({
    selector: 'lib-bar-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bar-chart.html',
})
export class BarChartComponent {
    @Input() data: BarDatum[] = [];
    @Input() unit = '';

    get max(): number {
        return Math.max(...this.data.map(d => d.value), 1);
    }

    pct(value: number): number {
        return Math.max((value / this.max) * 100, 2);
    }

    formatValue(value: number): string {
        const rounded = Math.round(value * 10) / 10;
        return this.unit ? `${rounded}${this.unit}` : `${rounded}`;
    }
}
