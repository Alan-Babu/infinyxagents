import { Route } from '@angular/router';
import { AuthLayout, SharedLayout } from '@nfinyx/layouts';
import { requireAgentAccessGuard, requireLoginGuard } from '@nfinyx/services';
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
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'executive-summary' },
                loadChildren: () =>
                    import('@nfinyx/executive-summary').then(m => m.EXECUTIVE_SUMMARY_ROUTES),
            },
            {
                path: 'doc-compare',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'doc-compare' },
                loadChildren: () =>
                    import('@nfinyx/doc-compare').then(m => m.DOC_COMPARE_ROUTES),
            },
            {
                path: 'hr-agent',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'hr-agent' },
                loadChildren: () =>
                    import('@nfinyx/hr-agent').then(m => m.HR_AGENT_ROUTES),
            },
            {
                path: 'digital-attestation',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'digital-attestation' },
                loadChildren: () =>
                    import('@nfinyx/digital-attestation').then(m => m.DIGITAL_ATTESTATION_ROUTES),
            },
            {
                path: 'user-profile',
                loadChildren: () =>
                    import('@nfinyx/user-profile').then(m => m.USER_PROFILE_ROUTES),
            },
            {
                path: 'asset-intelligence',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'asset-intelligence' },
                loadChildren: () =>
                    import('@nfinyx/asset-intelligence').then(m => m.ASSET_INTELLIGENCE_ROUTES),
            },
            {
                path: 'doc-intel-agent',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'doc-intel-agent' },
                loadChildren: () =>
                    import('@nfinyx/doc-intel-agent').then(m => m.DOC_INTEL_AGENT_ROUTES),
            },
            {
                path: 'contract-analyzer',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'contract-analyzer' },
                loadChildren: () =>
                    import('@nfinyx/contract-analyzer').then(m => m.CONTRACT_ANALYZER_ROUTES),
            },
            {
                path: 'legal-ai',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'legal-ai' },
                loadChildren: () =>
                    import('@nfinyx/legal-ai').then(m => m.LEGAL_AI_ROUTES),
            },
            {
                path: 'translator-agent',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'translator-agent' },
                loadChildren: () =>
                    import('@nfinyx/translator-agent').then(m => m.TRANSLATOR_AGENT_ROUTES),
            },
            {
                path: 'grammar-agent',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'grammar-agent' },
                loadChildren: () =>
                    import('@nfinyx/grammar-agent').then(m => m.GRAMMAR_AGENT_ROUTES),
            },
            {
                path: 'email-compose-agent',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'email-compose-agent' },
                loadChildren: () =>
                    import('@nfinyx/email-compose-agent').then(m => m.EMAIL_COMPOSE_AGENT_ROUTES),
            },
            {
                path: 'mofa-chatbot',
                canActivate: [requireAgentAccessGuard],
                data: { agentId: 'mofa-chatbot' },
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
