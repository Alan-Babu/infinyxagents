import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CapabilityNode, HealthBand } from '../../models/ea.models';

const HEALTH_BAND_CLASS: Record<HealthBand, string> = {
    HEALTHY: 'bg-green-50 border-green-200 text-green-700',
    WATCH: 'bg-amber-50 border-amber-200 text-amber-700',
    AT_RISK: 'bg-red-50 border-red-200 text-red-700',
};

/** Recursive tree node for the Capability Map: renders itself and its children, indented by depth. */
@Component({
    selector: 'lib-capability-node',
    standalone: true,
    imports: [CommonModule, CapabilityNodeComponent],
    template: `
        <div class="mb-2 flex items-center justify-between rounded-lg border px-4 py-2.5" [ngClass]="bandClass" [style.marginInlineStart.px]="depth * 20">
            <span class="text-sm font-semibold text-gray-800">{{ node.name }}</span>
            <span class="flex items-center gap-4 text-xs">
                <span class="font-bold">{{ node.health_score }}</span>
                <span class="text-gray-500">{{ node.linked_asset_count }} linked asset(s)</span>
            </span>
        </div>
        @for (child of node.children; track child.id) {
            <lib-capability-node [node]="child" [depth]="depth + 1" />
        }
    `,
})
export class CapabilityNodeComponent {
    @Input({ required: true }) node!: CapabilityNode;
    @Input() depth = 0;

    get bandClass(): string {
        return HEALTH_BAND_CLASS[this.node.health_band];
    }
}
