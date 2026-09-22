import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';
import { LegalAiQaStore } from '../../state/legal-ai-qa.store';
import { MarkdownLitePipe } from '../../utils/markdown-lite.pipe';

/** "Ask Legal AI": grounded Q&A over the legislation knowledge base and (optionally) the open document. */
@Component({
    selector: 'lib-legal-ai-qa-drawer',
    standalone: true,
    imports: [FormsModule, TranslateModule, ButtonModule, DrawerModule, SelectModule, MarkdownLitePipe],
    templateUrl: './legal-ai-qa-drawer.html',
})
export class LegalAiQaDrawer {
    protected readonly qa = inject(LegalAiQaStore);
    protected readonly i18n = inject(LegalAiI18n);
    private readonly end = viewChild<ElementRef<HTMLElement>>('end');

    constructor() {
        // Keep the newest message in view.
        effect(() => {
            this.qa.messages();
            this.qa.loading();
            queueMicrotask(() => this.end()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' }));
        });
    }

    protected examples(): string[] {
        return [this.i18n.t('qaEx1'), this.i18n.t('qaEx2'), this.i18n.t('qaEx3')];
    }

    protected sessionOptions(): { label: string; value: string }[] {
        return this.qa.sessions().map((s) => ({ label: s.title || this.i18n.t('qaConversation'), value: s.id }));
    }

    protected send(event?: Event): void {
        event?.preventDefault();
        void this.qa.ask(this.qa.draft());
    }

    /** Enter sends; Shift+Enter inserts a newline. */
    protected onEnter(event: Event): void {
        const e = event as KeyboardEvent;
        if (e.shiftKey || e.isComposing) return;
        e.preventDefault();
        void this.qa.ask(this.qa.draft());
    }
}
