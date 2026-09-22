import { Component, computed, inject } from '@angular/core';
import { NoData } from '@nfinyx/no-data';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentEntities } from '../../../models/legal-ai.models';
import { LegalAiI18n } from '../../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../../state/legal-ai-analysis.store';

const LIMIT = 20;

type Section = { key: keyof DocumentEntities; title: string };
const SECTIONS: Section[] = [
    { key: 'parties', title: 'entParties' },
    { key: 'dates', title: 'entDates' },
    { key: 'monetary_amounts', title: 'entMoney' },
    { key: 'durations', title: 'entDurations' },
    { key: 'jurisdictions', title: 'entJurisdictions' },
    { key: 'termination', title: 'entTermination' },
    { key: 'confidentiality', title: 'entConfidentiality' },
    { key: 'ip_ownership', title: 'entIp' },
    { key: 'data_protection', title: 'entData' },
];

interface Group {
    key: string;
    title: string;
    total: number;
    items: string[];
}

@Component({
    selector: 'lib-legal-ai-entities-tab',
    standalone: true,
    imports: [TranslateModule, NoData],
    template: `
        @if (groups().length === 0) {
        <div class="rounded-lg border border-gray-200 bg-white"><lib-no-data icon="pi pi-id-card" [message]="'legalAi.noEntities' | translate" /></div>
        } @else {
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            @for (g of groups(); track g.key) {
            <section class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5">
                <div class="flex items-center justify-between gap-2">
                    <h2 class="text-base font-semibold text-gray-800">{{ 'legalAi.' + g.title | translate }}</h2>
                    <span class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600 tabular-nums">{{ i18n.num(g.total) }}</span>
                </div>
                <ul class="flex flex-col gap-2">
                    @for (item of g.items; track $index) { <li class="wrap-anywhere rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{{ item }}</li> }
                </ul>
                @if (g.total > g.items.length) { <p class="text-xs text-gray-400 tabular-nums">+{{ i18n.num(g.total - g.items.length) }}</p> }
            </section>
            }
        </div>
        }
    `,
})
export class LegalAiEntitiesTab {
    private readonly store = inject(LegalAiAnalysisStore);
    protected readonly i18n = inject(LegalAiI18n);

    protected readonly groups = computed<Group[]>(() => {
        const entities = this.store.entities();
        if (!entities) return [];
        return SECTIONS.flatMap((s) => {
            const raw = (entities[s.key] ?? []) as unknown as Record<string, unknown>[];
            if (!raw.length) return [];
            return [{ key: s.key, title: s.title, total: raw.length, items: raw.slice(0, LIMIT).map((e) => this.format(s.key, e)) }];
        });
    });

    private format(key: keyof DocumentEntities, e: Record<string, unknown>): string {
        switch (key) {
            case 'dates':
                return `${e['type']}: ${e['text']}${e['parsed'] ? ` (${e['parsed']})` : ''}`;
            case 'monetary_amounts':
                return `${e['type']}: ${e['currency']} ${this.i18n.num(Number(e['amount']))}`;
            case 'durations':
                return `${e['type']}: ${e['value']} ${e['unit']}`;
            default:
                return String(e['text'] ?? '');
        }
    }
}
