import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const hrAgentI18nResolver = createModuleI18nResolver({ en, ar });

const HR_AGENT_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'hr-agent',
        menu: 'menu.hrAgent',
        activatedRoute: true,
        icon: MenuIcon.ChatText,
        link: '/hr-agent',
    },
];

export const HR_AGENT_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': HR_AGENT_NAV },
        resolve: { i18n: hrAgentI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/chat/hr-chat').then(m => m.HrChatPage),
                data: { name: 'hr-agent' },
            },
        ],
    },
];
