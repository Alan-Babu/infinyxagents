import { DataTableAction, RowActionsCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { RiskSession } from '../models/admin.models';

/** Column defs for the `<lib-data-table>` on the admin Risk & Sentiment page. */
export function buildRiskSessionColDefs(t: (key: string) => string, onView: (session: RiskSession) => void): ColDef[] {
    const actions: DataTableAction[] = [
        {
            key: 'view',
            icon: 'eye',
            label: t('mofaChatbot.admin.riskSessions.view'),
            severity: 'secondary',
        },
    ];

    return [
        {
            field: 'language',
            headerName: t('mofaChatbot.admin.riskSessions.table.language'),
            valueFormatter: p => (p.value === 'ar' ? t('mofaChatbot.admin.common.languageAr') : t('mofaChatbot.admin.common.languageEn')),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'overall_sentiment',
            headerName: t('mofaChatbot.admin.riskSessions.table.sentiment'),
            valueFormatter: p => p.value || '—',
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'risk_reason',
            headerName: t('mofaChatbot.admin.riskSessions.table.reason'),
            cellClass: 'max-w-72 truncate text-sm text-gray-500',
        },
        {
            field: 'rating',
            headerName: t('mofaChatbot.admin.riskSessions.table.rating'),
            valueFormatter: p => (p.value ? `${p.value} ★` : '—'),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'started_at',
            headerName: t('mofaChatbot.admin.riskSessions.table.started'),
            valueFormatter: p => (p.value ? new Date(p.value).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onView(row as RiskSession),
            },
        },
    ];
}
