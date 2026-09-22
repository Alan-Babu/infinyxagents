import { Component, computed, inject, input } from '@angular/core';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { severityLook } from '../../utils/display';

@Component({
    selector: 'lib-legal-ai-severity-tag',
    standalone: true,
    template: `<span [class]="look().cls"><i class="pi" [class]="look().icon" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class LegalAiSeverityTag {
    private readonly i18n = inject(LegalAiI18n);
    readonly severity = input.required<string>();
    readonly look = computed(() => severityLook(this.severity()));
    label(): string {
        return this.i18n.severity(this.severity());
    }
}
