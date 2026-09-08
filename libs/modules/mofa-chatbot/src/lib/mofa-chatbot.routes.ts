import { inject } from '@angular/core';
import { ResolveFn, Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { AuthService, createModuleI18nResolver, requireAdminGuard } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

/** Single resolver instance shared by the authenticated routes below and the unauthenticated shared-chat route. */
export const mofaChatbotI18nResolver = createModuleI18nResolver({ en, ar });

const MOFA_CHATBOT_CHAT_NAV_ITEM: MenuModel = {
    id: 1,
    name: 'mofa-chatbot-chat',
    menu: 'mofaChatbot.nav.chat',
    activatedRoute: true,
    icon: MenuIcon.ChatText,
    link: '/mofa-chatbot',
};

const MOFA_CHATBOT_ADMIN_NAV_ITEM: MenuModel = {
    id: 2,
    name: 'mofa-chatbot-admin',
    menu: 'mofaChatbot.nav.admin',
    activatedRoute: true,
    icon: MenuIcon.Settings,
    link: '/mofa-chatbot/admin',
};

/**
 * Resolved (not static) so the admin nav icon only appears for admins --
 * AgentLayout itself stays module-agnostic, it just renders whatever
 * `data['main-nav']` resolves to, same as it did with the old static array.
 * Route access itself is separately enforced by requireAdminGuard below;
 * this only controls whether the icon is offered in the first place.
 */
const mofaChatbotNavResolver: ResolveFn<MenuModel[]> = () => {
    const auth = inject(AuthService);
    return auth.isAdmin() ? [MOFA_CHATBOT_CHAT_NAV_ITEM, MOFA_CHATBOT_ADMIN_NAV_ITEM] : [MOFA_CHATBOT_CHAT_NAV_ITEM];
};

export const MOFA_CHATBOT_ROUTES: Route[] = [
    {
        // Login is enforced by SharedLayout's own `canActivateChild: [requireLoginGuard]`
        // (see app.routes.ts in each app) — this route is nested under that block.
        path: '',
        component: AgentLayout,
        resolve: { i18n: mofaChatbotI18nResolver, 'main-nav': mofaChatbotNavResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/chat/mofa-chat').then(m => m.MofaChatPage),
                data: { name: 'mofa-chatbot-chat' },
            },
            {
                path: 'admin',
                loadComponent: () => import('./pages/admin/admin-shell/admin-shell').then(m => m.AdminShellPage),
                canActivate: [requireAdminGuard],
                data: { name: 'mofa-chatbot-admin' },
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./pages/admin/overview/overview').then(m => m.AdminOverviewPage),
                        data: { name: 'mofa-chatbot-admin-overview' },
                    },
                    {
                        path: 'crawl',
                        loadComponent: () => import('./pages/admin/crawl/crawl').then(m => m.AdminCrawlPage),
                        data: { name: 'mofa-chatbot-admin-crawl' },
                    },
                    {
                        path: 'kb',
                        loadComponent: () => import('./pages/admin/kb/kb').then(m => m.AdminKbPage),
                        data: { name: 'mofa-chatbot-admin-kb' },
                    },
                    {
                        path: 'blacklist',
                        loadComponent: () => import('./pages/admin/blacklist/blacklist').then(m => m.AdminBlacklistPage),
                        data: { name: 'mofa-chatbot-admin-blacklist' },
                    },
                    {
                        path: 'sessions',
                        loadComponent: () => import('./pages/admin/sessions/sessions').then(m => m.AdminSessionsPage),
                        data: { name: 'mofa-chatbot-admin-sessions' },
                    },
                    {
                        path: 'risk-sessions',
                        loadComponent: () => import('./pages/admin/risk-sessions/risk-sessions').then(m => m.AdminRiskSessionsPage),
                        data: { name: 'mofa-chatbot-admin-risk-sessions' },
                    },
                    {
                        path: 'feedback',
                        loadComponent: () => import('./pages/admin/feedback/feedback').then(m => m.AdminFeedbackPage),
                        data: { name: 'mofa-chatbot-admin-feedback' },
                    },
                ],
            },
        ],
    },
];

/**
 * Unauthenticated shared-transcript route — a sibling top-level block (registered next to
 * `AuthLayout`/`SharedLayout` in each app's `app.routes.ts`), not nested inside `SharedLayout`,
 * since anyone with the link (no login) must be able to open it.
 */
export const MOFA_CHATBOT_SHARED_ROUTES: Route[] = [
    {
        path: 'mofa-chatbot/shared/:token',
        loadComponent: () => import('./pages/shared-chat/shared-chat').then(m => m.SharedChatPage),
        resolve: { i18n: mofaChatbotI18nResolver },
        data: { name: 'mofa-chatbot-shared' },
    },
];
