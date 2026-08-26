import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const docIntelAgentI18nResolver = createModuleI18nResolver({ en, ar });

const DOC_INTEL_AGENT_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'doc-intel-agent-upload',
        menu: 'docIntelAgent.nav.analyze',
        activatedRoute: true,
        icon: MenuIcon.SealQuestion,
        link: '/doc-intel-agent',
    },
    {
        id: 2,
        name: 'doc-intel-agent-documents',
        menu: 'docIntelAgent.nav.myDocuments',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/doc-intel-agent/documents',
    },
];

export const DOC_INTEL_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': DOC_INTEL_AGENT_NAV },
        resolve: { i18n: docIntelAgentI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/upload/upload').then(m => m.UploadPage),
                data: { name: 'doc-intel-agent' },
            },
            {
                path: 'documents',
                loadComponent: () => import('./pages/my-documents/my-documents').then(m => m.MyDocumentsPage),
                data: { name: 'doc-intel-agent-documents' },
            },
            {
                path: 'documents/:id',
                loadComponent: () => import('./pages/document-detail/document-detail').then(m => m.DocumentDetailPage),
                data: { name: 'doc-intel-agent-document-detail' },
            },
        ],
    },
];
