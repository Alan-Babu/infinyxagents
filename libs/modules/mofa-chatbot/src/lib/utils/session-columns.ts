import { DataTableAction, RowActionsCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ChatSessionSummary } from '../models/admin.models';
import { formatTimestamp } from './date-format';

/** Column defs for the `<lib-data-table>` on the admin Sessions browser -- every session, not just risk-flagged ones (see utils/risk-session-columns.ts for that narrower view). */
export function buildSessionColDefs(t: (key: string) => string, onView: (session: ChatSessionSummary) => void): ColDef[] {
    const actions: DataTableAction[] = [
        {
            key: 'view',
            icon: 'eye',
            label: t('mofaChatbot.admin.sessions.view'),
            severity: 'secondary',
        },
    ];

    return [
        {
            field: 'language',
            headerName: t('mofaChatbot.admin.sessions.table.language'),
            valueFormatter: p => (p.value === 'ar' ? t('mofaChatbot.admin.common.languageAr') : t('mofaChatbot.admin.common.languageEn')),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'overall_sentiment',
            headerName: t('mofaChatbot.admin.sessions.table.sentiment'),
            valueFormatter: p => p.value || '—',
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'risk_flag',
            headerName: t('mofaChatbot.admin.sessions.table.risk'),
            valueFormatter: p => (p.value ? t('mofaChatbot.admin.sessions.flagged') : '—'),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'status',
            headerName: t('mofaChatbot.admin.sessions.table.status'),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'rating',
            headerName: t('mofaChatbot.admin.sessions.table.rating'),
            valueFormatter: p => (p.value ? `${p.value} ★` : '—'),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'started_at',
            headerName: t('mofaChatbot.admin.sessions.table.started'),
            valueFormatter: p => formatTimestamp(p.value),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onView(row as ChatSessionSummary),
            },
        },
    ];
}
