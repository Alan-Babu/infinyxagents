import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'lib-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="relative flex items-center gap-5 rounded-lg border border-gray-200 bg-white p-5 text-start">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" [ngClass]="bgClass">
            <i class="text-xl" [ngClass]="[icon, fgClass]"></i>
        </div>
        <div class="flex-1">
            <div class="mb-1 text-xs font-semibold text-gray-600">{{ label }}</div>
            <div class="text-2xl font-bold leading-none" [ngClass]="fgClass">{{ value }}</div>
            @if (sub) {
                <div class="mt-1 text-xs text-gray-500">{{ sub }}</div>
            }
        </div>
    </div>`,
})
export class StatCardComponent {
    @Input({ required: true }) label!: string;
    @Input({ required: true }) value!: string | number;
    @Input() sub?: string;
    @Input() icon = 'pi pi-info-circle';
    @Input() fgClass = 'text-primary-600';
    @Input() bgClass = 'bg-primary-50';
}
