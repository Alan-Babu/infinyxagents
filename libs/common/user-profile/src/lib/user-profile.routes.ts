import { Route } from '@angular/router';
import { createModuleI18nResolver } from '@nfinyx/services';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';
import { ProfileShell } from './components/profile-shell/profile-shell';

const userProfileI18nResolver = createModuleI18nResolver({ en, ar });

export const USER_PROFILE_ROUTES: Route[] = [
    {
        path: '',
        component: ProfileShell,
        resolve: { i18n: userProfileI18nResolver },
        children: [
            { path: '', redirectTo: 'preferences', pathMatch: 'full' },
            {
                path: 'preferences',
                loadComponent: () => import('./pages/preferences/preferences').then(m => m.PreferencesPage),
                data: { name: 'user-profile-preferences' },
            },
            {
                path: 'activity',
                loadComponent: () => import('./pages/my-activity/my-activity').then(m => m.MyActivityPage),
                data: { name: 'user-profile-activity' },
            },
        ],
    },
];
