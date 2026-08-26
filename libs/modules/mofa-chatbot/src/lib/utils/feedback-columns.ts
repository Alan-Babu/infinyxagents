import { DataTableAction, RowActionsCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { UnansweredQuestion } from '../models/admin.models';

/** Column defs for the unanswered-questions `<lib-data-table>` on the admin Feedback & Gaps page. */
export function buildUnansweredColDefs(t: (key: string) => string, onMarkReviewed: (question: UnansweredQuestion) => void): ColDef[] {
    const actions: DataTableAction[] = [
        {
            key: 'reviewed',
            icon: 'check',
            label: t('mofaChatbot.admin.feedback.markReviewed'),
            severity: 'secondary',
        },
    ];

    return [
        { field: 'question_text', headerName: t('mofaChatbot.admin.feedback.table.question'), cellClass: 'text-sm text-gray-800' },
        {
            field: 'language',
            headerName: t('mofaChatbot.admin.feedback.table.language'),
            valueFormatter: p => (p.value === 'ar' ? t('mofaChatbot.admin.common.languageAr') : t('mofaChatbot.admin.common.languageEn')),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'best_similarity_score',
            headerName: t('mofaChatbot.admin.feedback.table.score'),
            valueFormatter: p => (p.value !== null && p.value !== undefined ? `${Math.round(p.value * 100)}%` : '—'),
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'created_at',
            headerName: t('mofaChatbot.admin.feedback.table.asked'),
            valueFormatter: p => new Date(p.value).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onMarkReviewed(row as UnansweredQuestion),
            },
        },
    ];
}

/** Column defs for the recent-feedback `<lib-data-table>` on the admin Feedback & Gaps page. */
export function buildFeedbackColDefs(t: (key: string) => string): ColDef[] {
    return [
        {
            field: 'rating',
            headerName: t('mofaChatbot.admin.feedback.feedbackTable.rating'),
            valueFormatter: p => `${p.value} ★`,
            cellClass: 'text-sm text-gray-800',
        },
        {
            field: 'rating_comment',
            headerName: t('mofaChatbot.admin.feedback.feedbackTable.comment'),
            valueFormatter: p => p.value || '—',
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'ended_reason',
            headerName: t('mofaChatbot.admin.feedback.feedbackTable.ended'),
            valueFormatter: p => p.value || '—',
            cellClass: 'text-sm text-gray-600',
        },
        {
            field: 'ended_at',
            headerName: t('mofaChatbot.admin.feedback.feedbackTable.when'),
            valueFormatter: p => (p.value ? new Date(p.value).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
    ];
}
