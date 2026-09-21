import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LegalAiProcessingMonitor } from '../../components/processing-monitor/legal-ai-processing-monitor';
import { LegalAiQaDrawer } from '../../components/qa-drawer/legal-ai-qa-drawer';
import { LegalAiUploadDrawer } from '../../components/upload-drawer/legal-ai-upload-drawer';
import { LegalAiDocumentsStore } from '../../state/legal-ai-documents.store';
import { LegalAiLawsStore } from '../../state/legal-ai-laws.store';

/**
 * Parent route of every legal-ai page. It owns what outlives a single page: the document
 * polling loop, and the drawers (upload, Legal Q&A) and processing monitor shared by all pages.
 */
@Component({
    selector: 'lib-legal-ai-shell',
    standalone: true,
    imports: [RouterOutlet, LegalAiQaDrawer, LegalAiUploadDrawer, LegalAiProcessingMonitor],
    template: `
        <router-outlet />
        <lib-legal-ai-upload-drawer />
        <lib-legal-ai-qa-drawer />
        <lib-legal-ai-processing-monitor />
    `,
    host: { class: 'block h-full min-h-0' },
})
export class LegalAiShell implements OnInit, OnDestroy {
    private readonly docs = inject(LegalAiDocumentsStore);
    private readonly laws = inject(LegalAiLawsStore);

    ngOnInit(): void {
        this.docs.ensureLoaded();
        void this.laws.ensureLoaded();
        this.docs.startPolling();
    }

    ngOnDestroy(): void {
        this.docs.stopPolling();
    }
}
