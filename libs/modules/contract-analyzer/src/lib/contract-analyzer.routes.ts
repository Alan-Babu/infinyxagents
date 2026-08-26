import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const contractAnalyzerI18nResolver = createModuleI18nResolver({ en, ar });

const CONTRACT_ANALYZER_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'contract-analyzer-upload',
        menu: 'contractAnalyzer.nav.analyze',
        activatedRoute: true,
        icon: MenuIcon.Gavel,
        link: '/contract-analyzer',
    },
    {
        id: 2,
        name: 'contract-analyzer-contracts',
        menu: 'contractAnalyzer.nav.myContracts',
        activatedRoute: true,
        icon: MenuIcon.Files,
        link: '/contract-analyzer/contracts',
    },
];

export const CONTRACT_ANALYZER_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': CONTRACT_ANALYZER_NAV },
        resolve: { i18n: contractAnalyzerI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/upload/upload').then(m => m.UploadPage),
                data: { name: 'contract-analyzer' },
            },
            {
                path: 'contracts',
                loadComponent: () => import('./pages/my-contracts/my-contracts').then(m => m.MyContractsPage),
                data: { name: 'contract-analyzer-contracts' },
            },
            {
                path: 'contracts/:id',
                loadComponent: () => import('./pages/contract-detail/contract-detail').then(m => m.ContractDetailPage),
                data: { name: 'contract-analyzer-contract-detail' },
            },
        ],
    },
];
