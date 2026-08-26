import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface DonutDatum {
    label: string;
    value: number;
}

const PALETTE = [
    'var(--p-primary-800)', 'var(--p-primary-500)', 'var(--p-primary-400)',
    'var(--p-primary-300)', 'var(--p-primary-200)', 'var(--p-primary-700)', 'var(--p-primary-900)',
];

interface Segment extends DonutDatum {
    color: string;
    pct: number;
    dashArray: string;
    dashOffset: number;
}

@Component({
    selector: 'lib-donut-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './donut-chart.html',
})
export class DonutChartComponent {
    @Input() data: DonutDatum[] = [];
    readonly Math = Math;

    get segments(): Segment[] {
        const total = this.data.reduce((sum, d) => sum + d.value, 0) || 1;
        const circumference = 2 * Math.PI * 15.915;
        let cumulativePct = 0;
        return this.data.map((d, i) => {
            const pct = (d.value / total) * 100;
            const dash = (pct / 100) * circumference;
            const segment: Segment = {
                ...d,
                color: PALETTE[i % PALETTE.length],
                pct,
                dashArray: `${dash} ${circumference - dash}`,
                dashOffset: -((cumulativePct / 100) * circumference),
            };
            cumulativePct += pct;
            return segment;
        });
    }
}
