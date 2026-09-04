import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { AgentLayout } from '@nfinyx/layouts';
import { AuthService, createModuleI18nResolver } from '@nfinyx/services';
import { MenuIcon, MenuModel } from '@nfinyx/types';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';

const execSummaryI18nResolver = createModuleI18nResolver({ en, ar });

/** Backed entirely by the exec-agent admin router, which rejects non-admin callers. */
const ADMIN_ONLY_NAV = ['executive-summary-guardrails', 'executive-summary-analytics'];

const EXEC_SUMMARY_NAV: MenuModel[] = [
    {
        id: 1,
        name: 'executive-summary-insights',
        menu: 'executiveSummary.insights.title',
        activatedRoute: true,
        icon: MenuIcon.Chart,
        link: '/executive-summary',
    },
    {
        id: 2,
        name: 'executive-summary-scheduled-jobs',
        menu: 'executiveSummary.scheduledJobs.title',
        activatedRoute: true,
        icon: MenuIcon.CalendarDots,
        link: '/executive-summary/scheduled-jobs',
    },
    {
        id: 3,
        name: 'executive-summary-guardrails',
        menu: 'executiveSummary.guardrails.title',
        activatedRoute: true,
        icon: MenuIcon.Gavel,
        link: '/executive-summary/guardrails',
    },
    {
        id: 4,
        name: 'executive-summary-my-tasks',
        menu: 'executiveSummary.myTasks.title',
        activatedRoute: true,
        icon: MenuIcon.CheckSquare,
        link: '/executive-summary/my-tasks',
    },
    {
        id: 5,
        name: 'executive-summary-feedback',
        menu: 'executiveSummary.feedback.title',
        activatedRoute: true,
        icon: MenuIcon.ReceiptWarning,
        link: '/executive-summary/feedback',
    },
    {
        id: 6,
        name: 'executive-summary-analytics',
        menu: 'executiveSummary.analytics.title',
        activatedRoute: true,
        icon: MenuIcon.Chart,
        link: '/executive-summary/analytics',
    },
];

/**
 * Hides the admin-only entries before `AgentLayout` reads `data['main-nav']`, so a
 * non-admin is never offered a page that can only answer "admin required".
 */
const execSummaryNavResolver = () => {
    const isAdmin = inject(AuthService).isAdmin();
    for (const item of EXEC_SUMMARY_NAV) {
        if (ADMIN_ONLY_NAV.includes(item.name)) item.hide = !isAdmin;
    }
    return EXEC_SUMMARY_NAV;
};

export const EXECUTIVE_SUMMARY_ROUTES: Route[] = [
    {
        path: '',
        component: AgentLayout,
        data: { 'main-nav': EXEC_SUMMARY_NAV },
        resolve: { i18n: execSummaryI18nResolver, nav: execSummaryNavResolver },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/insights/insights').then(m => m.InsightsPage),
                data: { name: 'executive-summary' },
            },
            {
                path: 'scheduled-jobs',
                loadComponent: () => import('./pages/scheduled-jobs/scheduled-jobs').then(m => m.ScheduledJobsPage),
                data: { name: 'executive-summary-scheduled-jobs' },
            },
            {
                path: 'guardrails',
                loadComponent: () => import('./pages/guardrails-report/guardrails-report').then(m => m.GuardrailsReportPage),
                data: { name: 'executive-summary-guardrails' },
            },
            {
                path: 'my-tasks',
                loadComponent: () => import('./pages/my-tasks/my-tasks').then(m => m.MyTasksPage),
                data: { name: 'executive-summary-my-tasks' },
            },
            {
                path: 'feedback',
                loadComponent: () => import('./pages/feedback-report/feedback-report').then(m => m.FeedbackReportPage),
                data: { name: 'executive-summary-feedback' },
            },
            {
                path: 'analytics',
                loadComponent: () => import('./pages/usage-analytics/usage-analytics').then(m => m.UsageAnalyticsPage),
                data: { name: 'executive-summary-analytics' },
            },
        ],
    },
];
