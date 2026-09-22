import { Component, computed, inject, input } from '@angular/core';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { statusLook } from '../../utils/display';

/** Finding / document status pill (icon + label; colour is never the only signal). */
@Component({
    selector: 'lib-legal-ai-status-tag',
    standalone: true,
    template: `<span [class]="look().cls"><i class="pi" [class]="look().icon" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class LegalAiStatusTag {
    private readonly i18n = inject(LegalAiI18n);
    readonly status = input.required<string>();
    readonly look = computed(() => statusLook(this.status()));
    /** Re-evaluated on every change-detection pass so a language switch updates the label. */
    label(): string {
        return this.i18n.status(this.status());
    }
}
