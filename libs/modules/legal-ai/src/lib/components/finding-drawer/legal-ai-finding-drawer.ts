import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { Finding } from '../../models/legal-ai.models';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiAnalysisStore } from '../../state/legal-ai-analysis.store';
import { findingNeedsReview } from '../../utils/format';
import { LegalAiSeverityTag } from '../tags/legal-ai-severity-tag';
import { LegalAiStatusTag } from '../tags/legal-ai-status-tag';

const REJECT_STATUSES = ['NOT_APPLICABLE', 'COMPLIANT', 'NON_COMPLIANT', 'AMBIGUOUS'] as const;

/** One finding in full, plus the human-review workflow (approve / reject with a required note). */
@Component({
    selector: 'lib-legal-ai-finding-drawer',
    standalone: true,
    imports: [FormsModule, TranslateModule, ButtonModule, DrawerModule, SelectModule, LegalAiSeverityTag, LegalAiStatusTag],
    templateUrl: './legal-ai-finding-drawer.html',
})
export class LegalAiFindingDrawer {
    protected readonly store = inject(LegalAiAnalysisStore);
    protected readonly i18n = inject(LegalAiI18n);

    protected readonly note = signal('');
    protected readonly status = signal<string>('NOT_APPLICABLE');

    /** Keep the last finding rendered while the drawer closes (the URL param is cleared first). */
    private readonly last = signal<Finding | null>(null);
    protected readonly view = computed(() => this.store.selectedFinding() ?? this.last());
    protected readonly pending = computed(() => {
        const f = this.store.selectedFinding();
        return f ? findingNeedsReview(f) : false;
    });
    protected readonly confidencePct = computed(() => Math.round((this.view()?.confidence ?? 0) * 100));

    constructor() {
        effect(() => {
            const f = this.store.selectedFinding();
            if (f) untracked(() => this.last.set(f));
        });
        // Reset the form whenever a different finding is opened.
        effect(() => {
            this.store.selectedId();
            untracked(() => {
                this.note.set(this.store.selectedFinding()?.review_note ?? '');
                this.status.set('NOT_APPLICABLE');
            });
        });
    }

    protected statusOptions(): { label: string; value: string }[] {
        return REJECT_STATUSES.map((s) => ({ label: this.i18n.status(s), value: s }));
    }

    protected async submit(decision: 'approve' | 'reject'): Promise<void> {
        const ok = await this.store.review(decision, this.note(), this.status());
        if (ok) this.note.set('');
    }
}
