import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const digitalAttestationI18nResolver = createModuleI18nResolver({ en, ar });

const DIGITAL_ATTESTATION_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'digital-attestation-dashboard',
        menu: 'digitalAttestation.nav.dashboard',
        activatedRoute: true,
        icon: MenuIcon.SquaresFour,
        link: '/digital-attestation',
    },
    {
        id: 2,
        name: 'digital-attestation-pending',
        menu: 'digitalAttestation.nav.manualReview',
        activatedRoute: true,
        icon: MenuIcon.Checklist,
        link: '/digital-attestation/pending',
    },
    {
        id: 3,
        name: 'digital-attestation-failures',
        menu: 'digitalAttestation.nav.failures',
        activatedRoute: true,
        icon: MenuIcon.XCircle,
        link: '/digital-attestation/failures',
    },
    {
        id: 4,
        name: 'digital-attestation-completed',
        menu: 'digitalAttestation.nav.completed',
        activatedRoute: true,
        icon: MenuIcon.CheckSquare,
        link: '/digital-attestation/completed',
    },
];

export const DIGITAL_ATTESTATION_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': DIGITAL_ATTESTATION_NAV },
        resolve: { i18n: digitalAttestationI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.AttestationDashboardPage),
                data: { name: 'digital-attestation' },
            },
            {
                path: 'pending',
                loadComponent: () => import('./pages/case-list/case-list').then(m => m.CaseListPage),
                data: { name: 'digital-attestation-pending', statusGroup: 'pending' },
            },
            {
                path: 'failures',
                loadComponent: () => import('./pages/case-list/case-list').then(m => m.CaseListPage),
                data: { name: 'digital-attestation-failures', statusGroup: 'failures' },
            },
            {
                path: 'completed',
                loadComponent: () => import('./pages/case-list/case-list').then(m => m.CaseListPage),
                data: { name: 'digital-attestation-completed', statusGroup: 'completed' },
            },
        ],
    },
];
