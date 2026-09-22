import { Component, inject } from '@angular/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { TranslateModule } from '@ngx-translate/core';
import { LegalAiToolbar } from '../../components/toolbar/legal-ai-toolbar';
import { LegalAiI18n } from '../../services/legal-ai-i18n.service';

interface Step {
    icon: string;
    n: number;
    /** Source file in the backend that implements this step. */
    file: string;
}

/** The analysis pipeline in execution order; mirrors the backend agents. */
@Component({
    selector: 'lib-legal-ai-pipeline',
    standalone: true,
    imports: [TranslateModule, PageHeaderComponent, LegalAiToolbar],
    template: `
        <div class="flex h-full min-h-0 flex-col">
            <lib-page-header titleKey="legalAi.agentsTitle" subtitleKey="legalAi.agentsSub" [showBack]="false">
                <lib-legal-ai-toolbar />
            </lib-page-header>
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <ol class="relative flex max-w-3xl flex-col gap-4 before:absolute before:inset-y-7 before:start-[1.6rem] before:w-0.5 before:bg-gray-200 before:content-['']">
                    @for (s of steps; track s.n) {
                    <li class="relative grid grid-cols-[3.25rem_1fr] items-start gap-4">
                        <span class="border-primary-200 text-primary-600 relative z-10 inline-flex h-13 w-13 items-center justify-center rounded-lg border bg-white text-xl shadow-sm" aria-hidden="true"><i class="pi" [class]="s.icon"></i></span>
                        <article class="rounded-lg border border-gray-200 bg-white p-5">
                            <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span class="bg-primary-50 text-primary-700 border-primary-200 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{{ i18n.t('stepN', { n: s.n }) }}</span>
                                <h2 class="text-base font-semibold text-gray-800">{{ 'legalAi.agent' + s.n + 'Name' | translate }}</h2>
                                <span class="font-mono text-xs text-gray-400 notranslate">{{ s.file }}</span>
                            </div>
                            <p class="max-w-2xl text-sm leading-relaxed text-gray-600">{{ 'legalAi.agent' + s.n + 'Desc' | translate }}</p>
                        </article>
                    </li>
                    }
                </ol>
            </div>
        </div>
    `,
})
export class LegalAiPipelinePage {
    protected readonly i18n = inject(LegalAiI18n);

    protected readonly steps: Step[] = [
        { n: 1, icon: 'pi-id-card', file: 'classification_agent.py' },
        { n: 2, icon: 'pi-search', file: 'retrieval_engine.py' },
        { n: 3, icon: 'pi-book', file: 'compliance_agent.py' },
        { n: 4, icon: 'pi-shield', file: 'evidence_validation_agent.py' },
        { n: 5, icon: 'pi-exclamation-triangle', file: 'risk_engine.py' },
    ];
}
