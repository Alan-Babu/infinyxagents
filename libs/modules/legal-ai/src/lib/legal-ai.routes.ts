import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as ar from './i18n/ar.json';
import * as en from './i18n/en.json';
import { LEGAL_AI_BASE } from './legal-ai.paths';
import { LegalAiShell } from './pages/shell/legal-ai-shell';

const legalAiI18nResolver = createModuleI18nResolver({ en, ar });

const LEGAL_AI_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'legal-ai-dashboard',
        menu: 'legalAi.navDashboard',
        activatedRoute: true,
        icon: MenuIcon.Gavel,
        link: LEGAL_AI_BASE,
    },
    {
        id: 2,
        name: 'legal-ai-library',
        menu: 'legalAi.navLibrary',
        activatedRoute: true,
        icon: MenuIcon.Database,
        link: `${LEGAL_AI_BASE}/library`,
    },
    {
        id: 3,
        name: 'legal-ai-pipeline',
        menu: 'legalAi.navAgents',
        activatedRoute: true,
        icon: MenuIcon.Checklist,
        link: `${LEGAL_AI_BASE}/pipeline`,
    },
];

/**
 * Mounted by the host apps at `legal-ai` (see the app route tables in `apps/mofa` and `apps/platform`).
 *
 *   /legal-ai                          documents dashboard (upload, filter, review queue at a glance)
 *   /legal-ai/documents/:id            analysis: overview, federal-law compliance, risk, entities, audit
 *   /legal-ai/library                  legislation knowledge base
 *   /legal-ai/library/:lawId           a law and its articles
 *   /legal-ai/pipeline                 the analysis pipeline
 *
 * List state (page, filter, search, tab, open finding) lives in query params.
 */
export const LEGAL_AI_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': LEGAL_AI_NAV },
        resolve: { i18n: legalAiI18nResolver },
        children: [
            {
                path: '',
                component: LegalAiShell,
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.LegalAiDashboardPage),
                        data: { name: 'legal-ai-dashboard' },
                    },
                    {
                        path: 'documents/:id',
                        loadComponent: () => import('./pages/document-detail/document-detail').then((m) => m.LegalAiDocumentDetailPage),
                        data: { name: 'legal-ai-document-detail' },
                    },
                    {
                        path: 'library',
                        loadComponent: () => import('./pages/library/library').then((m) => m.LegalAiLibraryPage),
                        data: { name: 'legal-ai-library' },
                    },
                    {
                        path: 'library/:lawId',
                        loadComponent: () => import('./pages/law-detail/law-detail').then((m) => m.LegalAiLawDetailPage),
                        data: { name: 'legal-ai-law-detail' },
                    },
                    {
                        path: 'pipeline',
                        loadComponent: () => import('./pages/pipeline/pipeline').then((m) => m.LegalAiPipelinePage),
                        data: { name: 'legal-ai-pipeline' },
                    },
                ],
            },
        ],
    },
];
