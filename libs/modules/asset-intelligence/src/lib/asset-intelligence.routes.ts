import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const assetIntelligenceI18nResolver = createModuleI18nResolver({ en, ar });

const ASSET_INTELLIGENCE_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'asset-intelligence-dashboard',
        menu: 'assetIntelligence.nav.dashboard',
        activatedRoute: true,
        icon: MenuIcon.Home,
        link: '/asset-intelligence',
    },
    {
        id: 2,
        name: 'asset-intelligence-registry',
        menu: 'assetIntelligence.nav.assetRegistry',
        activatedRoute: true,
        icon: MenuIcon.Package,
        link: '/asset-intelligence/assets',
    },
    {
        id: 3,
        name: 'asset-intelligence-alerts',
        menu: 'assetIntelligence.nav.alerts',
        activatedRoute: true,
        icon: MenuIcon.ReceiptWarning,
        link: '/asset-intelligence/alerts',
    },
    {
        id: 4,
        name: 'asset-intelligence-ea-modeler',
        menu: 'assetIntelligence.nav.eaModeler',
        activatedRoute: true,
        icon: MenuIcon.Database,
        link: '/asset-intelligence/ea-modeler',
    },
    {
        id: 5,
        name: 'asset-intelligence-capability-map',
        menu: 'assetIntelligence.nav.capabilityMap',
        activatedRoute: true,
        icon: MenuIcon.SquaresFour,
        link: '/asset-intelligence/capability-map',
    },
    {
        id: 6,
        name: 'asset-intelligence-agent',
        menu: 'assetIntelligence.nav.agentChat',
        activatedRoute: true,
        icon: MenuIcon.ChatText,
        link: '/asset-intelligence/agent',
    },
    {
        id: 7,
        name: 'asset-intelligence-reports',
        menu: 'assetIntelligence.nav.reports',
        activatedRoute: true,
        icon: MenuIcon.Invoice,
        link: '/asset-intelligence/reports',
    },
    {
        id: 8,
        name: 'asset-intelligence-settings',
        menu: 'assetIntelligence.nav.settings',
        activatedRoute: true,
        icon: MenuIcon.Settings,
        link: '/asset-intelligence/settings',
    },
];

export const ASSET_INTELLIGENCE_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': ASSET_INTELLIGENCE_NAV },
        resolve: { i18n: assetIntelligenceI18nResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.AssetIntelligenceDashboardPage),
                data: { name: 'asset-intelligence-dashboard' },
            },
            {
                path: 'assets',
                loadComponent: () => import('./pages/asset-registry/asset-registry').then(m => m.AssetRegistryPage),
                data: { name: 'asset-intelligence-registry' },
            },
            {
                path: 'assets/:id',
                loadComponent: () => import('./pages/asset-detail/asset-detail').then(m => m.AssetDetailPage),
                data: { name: 'asset-intelligence-detail' },
            },
            {
                path: 'alerts',
                loadComponent: () => import('./pages/alerts/alerts-center').then(m => m.AlertsCenterPage),
                data: { name: 'asset-intelligence-alerts' },
            },
            {
                path: 'reports',
                loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsPage),
                data: { name: 'asset-intelligence-reports' },
            },
            {
                path: 'ea-modeler',
                loadComponent: () => import('./pages/ea-modeler/ea-modeler').then(m => m.EaModelerPage),
                data: { name: 'asset-intelligence-ea-modeler' },
            },
            {
                path: 'capability-map',
                loadComponent: () => import('./pages/capability-map/capability-map').then(m => m.CapabilityMapPage),
                data: { name: 'asset-intelligence-capability-map' },
            },
            {
                path: 'agent',
                loadComponent: () => import('./pages/agent-chat/agent-chat').then(m => m.AgentChatPage),
                data: { name: 'asset-intelligence-agent' },
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsPage),
                data: { name: 'asset-intelligence-settings' },
            },
        ],
    },
];
