import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { EmailSummary } from '../models/email-compose-agent.models';
import { fmtDateTime, reviewStatusSeverity } from './email-compose-display';

/** Column defs for `<lib-data-table>` on the My Emails page. `onDelete` fires the row's delete action. */
export function buildEmailColDefs(t: (key: string) => string, onDelete: (row: EmailSummary) => void): ColDef[] {
    const reviewStatusMap: Record<string, DataTableStatusEntry> = {
        auto_approved: { severity: reviewStatusSeverity('auto_approved'), label: t('emailComposeAgent.reviewStatus.auto_approved') },
        needs_review: { severity: reviewStatusSeverity('needs_review'), label: t('emailComposeAgent.reviewStatus.needs_review') },
        approved: { severity: reviewStatusSeverity('approved'), label: t('emailComposeAgent.reviewStatus.approved') },
        rejected: { severity: reviewStatusSeverity('rejected'), label: t('emailComposeAgent.reviewStatus.rejected') },
    };

    const classificationMap: Record<string, DataTableStatusEntry> = {
        Confidential: { severity: 'danger', label: t('emailComposeAgent.classification.Confidential') },
        Internal: { severity: 'warn', label: t('emailComposeAgent.classification.Internal') },
        Public: { severity: 'success', label: t('emailComposeAgent.classification.Public') },
    };

    const actions: DataTableAction[] = [
        { key: 'delete', icon: 'trash', label: t('emailComposeAgent.myEmails.delete'), severity: 'danger' },
    ];

    return [
        {
            field: 'subject', headerName: t('emailComposeAgent.myEmails.table.subject'),
            valueFormatter: p => p.value || t('emailComposeAgent.common.noSubject'),
            cellClass: 'text-sm font-semibold text-gray-800',
        },
        { field: 'mode', headerName: t('emailComposeAgent.myEmails.table.mode'), valueFormatter: p => t(`emailComposeAgent.common.mode.${p.value}`) || p.value, cellClass: 'text-sm text-gray-600' },
        { field: 'tone', headerName: t('emailComposeAgent.myEmails.table.tone'), valueFormatter: p => t(`emailComposeAgent.tones.${p.value}`) || p.value, cellClass: 'text-sm text-gray-600' },
        { field: 'language', headerName: t('emailComposeAgent.myEmails.table.language'), cellClass: 'text-sm text-gray-600' },
        { field: 'word_count', headerName: t('emailComposeAgent.myEmails.table.wordCount'), valueFormatter: p => (p.value ?? 0).toLocaleString(), cellClass: 'text-sm text-gray-600' },
        { field: 'document_classification', headerName: t('emailComposeAgent.myEmails.table.classification'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: classificationMap } },
        { field: 'review_status', headerName: t('emailComposeAgent.myEmails.table.reviewStatus'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: reviewStatusMap } },
        { field: 'created_at', headerName: t('emailComposeAgent.myEmails.table.created'), valueFormatter: p => fmtDateTime(p.value), cellClass: 'whitespace-nowrap text-sm text-gray-400' },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onDelete(row as EmailSummary),
            },
        },
    ];
}
