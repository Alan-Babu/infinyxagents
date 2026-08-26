import { Route } from '@angular/router';
import { AuthLayout, SharedLayout } from '@nfinyx/layouts';
import { requireLoginGuard } from '@nfinyx/services';
import { MOFA_CHATBOT_SHARED_ROUTES } from '@nfinyx/mofa-chatbot';
import { Login } from './auth.module/login/login';
import { Dashboard } from './dashboard/dashboard';
import { ROUTE_PATHS } from './app.route-paths';

export const appRoutes: Route[] = [
    {
        path: '',
        component: AuthLayout,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full',
            },
            {
                path: 'login',
                component: Login,
                data: { name: 'login' },
                pathMatch: 'full',
            }
        ],
    },
    {
        path: '',
        component: SharedLayout,
        canActivateChild: [requireLoginGuard],
        children: [
            {
                path: ROUTE_PATHS.DASHBOARD,
                component: Dashboard,
                data: { name: 'dashboard' },
            },
            {
                path: 'executive-summary',
                loadChildren: () =>
                    import('@nfinyx/executive-summary').then(m => m.EXECUTIVE_SUMMARY_ROUTES),
            },
            {
                path: 'doc-compare',
                loadChildren: () =>
                    import('@nfinyx/doc-compare').then(m => m.DOC_COMPARE_ROUTES),
            },
            {
                path: 'hr-agent',
                loadChildren: () =>
                    import('@nfinyx/hr-agent').then(m => m.HR_AGENT_ROUTES),
            },
            {
                path: 'digital-attestation',
                loadChildren: () =>
                    import('@nfinyx/digital-attestation').then(m => m.DIGITAL_ATTESTATION_ROUTES),
            },
            {
                path: 'doc-intel-agent',
                loadChildren: () =>
                    import('@nfinyx/doc-intel-agent').then(m => m.DOC_INTEL_AGENT_ROUTES),
            },
            {
                path: 'contract-analyzer',
                loadChildren: () =>
                    import('@nfinyx/contract-analyzer').then(m => m.CONTRACT_ANALYZER_ROUTES),
            },
            {
                path: 'translator-agent',
                loadChildren: () =>
                    import('@nfinyx/translator-agent').then(m => m.TRANSLATOR_AGENT_ROUTES),
            },
            {
                path: 'grammar-agent',
                loadChildren: () =>
                    import('@nfinyx/grammar-agent').then(m => m.GRAMMAR_AGENT_ROUTES),
            },
            {
                path: 'email-compose-agent',
                loadChildren: () =>
                    import('@nfinyx/email-compose-agent').then(m => m.EMAIL_COMPOSE_AGENT_ROUTES),
            },
            {
                path: 'mofa-chatbot',
                loadChildren: () =>
                    import('@nfinyx/mofa-chatbot').then(m => m.MOFA_CHATBOT_ROUTES),
            },
        ],
    },
    ...MOFA_CHATBOT_SHARED_ROUTES,
    {
        path: '**',
        redirectTo: 'login',
    },
];
