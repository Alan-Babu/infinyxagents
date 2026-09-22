import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { LegalAiQaStore } from '../../state/legal-ai-qa.store';
import { LegalAiUiState } from '../../state/legal-ai-ui.state';

/** Header actions shared by every legal-ai page: upload a document, ask Legal AI. */
@Component({
    selector: 'lib-legal-ai-toolbar',
    standalone: true,
    imports: [TranslateModule, ButtonModule],
    template: `
        <div class="flex flex-wrap gap-2">
            <button type="button" pButton size="small" severity="secondary" [outlined]="true" (click)="qa.show()">
                <i class="pi pi-comments" aria-hidden="true"></i><span>{{ 'legalAi.askLegalBtn' | translate }}</span>
            </button>
            <button type="button" pButton size="small" (click)="ui.openUpload()">
                <i class="pi pi-upload" aria-hidden="true"></i><span>{{ 'legalAi.uploadBtn' | translate }}</span>
            </button>
        </div>
    `,
})
export class LegalAiToolbar {
    protected readonly qa = inject(LegalAiQaStore);
    protected readonly ui = inject(LegalAiUiState);
}
