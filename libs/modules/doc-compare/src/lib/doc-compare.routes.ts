import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { llmSettingsI18nResolver, llmSettingsRoute, withLlmSettingsNav } from '@nfinyx/llm-settings';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const docCompareI18nResolver = createModuleI18nResolver({ en, ar });

const DOC_COMPARE_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'doc-compare',
        menu: 'menu.docCompare',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/doc-compare',
    },
];

export const DOC_COMPARE_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        resolve: {
            i18n: docCompareI18nResolver,
            llmI18n: llmSettingsI18nResolver,
            // Adds "Model settings" for admins of this agent only (route + API are enforced separately).
            'main-nav': withLlmSettingsNav('doc-compare', DOC_COMPARE_NAV, '/doc-compare/model-settings'),
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./doc-compare/doc-compare').then(m => m.DocCompare),
                data: { name: 'doc-compare' },
            },
            llmSettingsRoute('doc-compare', 'doc-compare/api'),
        ],
    },
];
