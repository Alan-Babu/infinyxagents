import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const emailComposeAgentI18nResolver = createModuleI18nResolver({ en, ar });

const EMAIL_COMPOSE_AGENT_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'email-compose-agent-compose',
        menu: 'emailComposeAgent.nav.compose',
        activatedRoute: true,
        icon: MenuIcon.ChatText,
        link: '/email-compose-agent',
    },
    {
        id: 2,
        name: 'email-compose-agent-emails',
        menu: 'emailComposeAgent.nav.myEmails',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/email-compose-agent/emails',
    },
];

export const EMAIL_COMPOSE_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': EMAIL_COMPOSE_AGENT_NAV },
        resolve: { i18n: emailComposeAgentI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/compose/compose').then(m => m.ComposePage),
                data: { name: 'email-compose-agent' },
            },
            {
                path: 'emails',
                loadComponent: () => import('./pages/my-emails/my-emails').then(m => m.MyEmailsPage),
                data: { name: 'email-compose-agent-emails' },
            },
            {
                path: 'emails/:id',
                loadComponent: () => import('./pages/email-detail/email-detail').then(m => m.EmailDetailPage),
                data: { name: 'email-compose-agent-detail' },
            },
        ],
    },
];
