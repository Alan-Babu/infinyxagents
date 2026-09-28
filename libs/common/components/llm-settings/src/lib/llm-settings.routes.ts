import { inject } from '@angular/core';
import { ResolveFn, Route } from '@angular/router';
import { AuthService, createModuleI18nResolver, requireAdminGuard } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';
import { provideLlmSettings } from './llm-settings-api';

/** Registers the settings page's translations (needed early: the nav label is shown before the page loads). */
export const llmSettingsI18nResolver = createModuleI18nResolver({ en, ar });

/**
 * A module's nav, plus the "Model settings" entry for admins of that agent only. The route itself is enforced
 * by `requireAdminGuard` and the API by the backend; this only decides whether the entry is offered.
 */
export function withLlmSettingsNav(
    agentId: string,
    baseNav: MenuModel[],
    link: string,
): ResolveFn<MenuModel[]> {
    const item: MenuModel = {
        id: Math.max(0, ...baseNav.map(n => n.id)) + 1,
        name: `${agentId}-model-settings`,
        menu: 'llmSettings.nav',
        activatedRoute: true,
        icon: MenuIcon.Settings,
        link,
    };
    return () => (inject(AuthService).isAgentAdmin(agentId) ? [...baseNav, item] : baseNav);
}

/**
 * The child route for an agent's model settings.
 * @param agentId the agents-UI tile id (`'translator-agent'`), which the admin guard checks against the token scopes
 * @param servicePath the agent's API path under the platform domain, the same segment its `*ApiBase` uses
 */
export function llmSettingsRoute(agentId: string, servicePath: string, path = 'model-settings'): Route {
    return {
        path,
        loadComponent: () => import('./llm-settings').then(m => m.LlmSettingsPage),
        canActivate: [requireAdminGuard],
        providers: provideLlmSettings(servicePath),
        data: { name: `${agentId}-model-settings`, agentId },
    };
}
