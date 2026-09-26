import { inject } from '@angular/core';
import { ResolveFn, Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { AuthService, createModuleI18nResolver, requireAdminGuard } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const docIntelAgentI18nResolver = createModuleI18nResolver({ en, ar });

const DOC_INTEL_AGENT_BASE_NAV: MenuModel[] = [
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

const DOC_INTEL_AGENT_SETTINGS_NAV_ITEM: MenuModel = {
    id: 3,
    name: 'doc-intel-agent-settings',
    menu: 'docIntelAgent.nav.settings',
    activatedRoute: true,
    icon: MenuIcon.Settings,
    link: '/doc-intel-agent/settings',
};

/**
 * Resolved (not static) so the Settings icon is only offered to admins. Access to the
 * route itself is enforced by requireAdminGuard, and the backend enforces admin on the
 * API; this only controls whether the entry is shown.
 */
const docIntelAgentNavResolver: ResolveFn<MenuModel[]> = () =>
    inject(AuthService).isAgentAdmin('doc-intel-agent')
        ? [...DOC_INTEL_AGENT_BASE_NAV, DOC_INTEL_AGENT_SETTINGS_NAV_ITEM]
        : DOC_INTEL_AGENT_BASE_NAV;

export const DOC_INTEL_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        resolve: { i18n: docIntelAgentI18nResolver, 'main-nav': docIntelAgentNavResolver },
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
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsPage),
                canActivate: [requireAdminGuard],
                data: { name: 'doc-intel-agent-settings', agentId: 'doc-intel-agent' },
            },
        ],
    },
];
