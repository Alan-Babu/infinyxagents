import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const translatorAgentI18nResolver = createModuleI18nResolver({ en, ar });

const TRANSLATOR_AGENT_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'translator-agent-upload',
        menu: 'translatorAgent.nav.translate',
        activatedRoute: true,
        icon: MenuIcon.Globe,
        link: '/translator-agent',
    },
    {
        id: 2,
        name: 'translator-agent-documents',
        menu: 'translatorAgent.nav.myDocuments',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/translator-agent/documents',
    },
];

export const TRANSLATOR_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': TRANSLATOR_AGENT_NAV },
        resolve: { i18n: translatorAgentI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/upload/upload').then(m => m.UploadPage),
                data: { name: 'translator-agent' },
            },
            {
                path: 'documents',
                loadComponent: () => import('./pages/my-documents/my-documents').then(m => m.MyDocumentsPage),
                data: { name: 'translator-agent-documents' },
            },
            {
                path: 'documents/:id',
                loadComponent: () => import('./pages/document-detail/document-detail').then(m => m.DocumentDetailPage),
                data: { name: 'translator-agent-document-detail' },
            },
        ],
    },
];
