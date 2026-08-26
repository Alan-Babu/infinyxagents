import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const grammarAgentI18nResolver = createModuleI18nResolver({ en, ar });

const GRAMMAR_AGENT_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'grammar-agent-upload',
        menu: 'grammarAgent.nav.check',
        activatedRoute: true,
        icon: MenuIcon.SealQuestion,
        link: '/grammar-agent',
    },
    {
        id: 2,
        name: 'grammar-agent-documents',
        menu: 'grammarAgent.nav.myDocuments',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/grammar-agent/documents',
    },
];

export const GRAMMAR_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': GRAMMAR_AGENT_NAV },
        resolve: { i18n: grammarAgentI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/upload/upload').then(m => m.UploadPage),
                data: { name: 'grammar-agent' },
            },
            {
                path: 'documents',
                loadComponent: () => import('./pages/my-documents/my-documents').then(m => m.MyDocumentsPage),
                data: { name: 'grammar-agent-documents' },
            },
            {
                path: 'documents/:id',
                loadComponent: () => import('./pages/document-detail/document-detail').then(m => m.DocumentDetailPage),
                data: { name: 'grammar-agent-document-detail' },
            },
        ],
    },
];
