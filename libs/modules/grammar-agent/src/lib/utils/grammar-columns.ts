import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { DocumentSummary } from '../models/grammar.models';
import { fmtDateTime, reviewStatusSeverity, scoreClass } from './grammar-display';

/** Column defs for `<lib-data-table>` on the My Documents page. `onDelete` fires the row's delete action. */
export function buildDocumentColDefs(t: (key: string) => string, onDelete: (row: DocumentSummary) => void): ColDef[] {
    const reviewStatusMap: Record<string, DataTableStatusEntry> = {
        auto_approved: { severity: reviewStatusSeverity('auto_approved'), label: t('grammarAgent.reviewStatus.auto_approved') },
        needs_review: { severity: reviewStatusSeverity('needs_review'), label: t('grammarAgent.reviewStatus.needs_review') },
        approved: { severity: reviewStatusSeverity('approved'), label: t('grammarAgent.reviewStatus.approved') },
        rejected: { severity: reviewStatusSeverity('rejected'), label: t('grammarAgent.reviewStatus.rejected') },
    };

    const actions: DataTableAction[] = [
        { key: 'delete', icon: 'trash', label: t('grammarAgent.myDocuments.delete'), severity: 'danger' },
    ];

    return [
        { field: 'filename', headerName: t('grammarAgent.myDocuments.table.filename'), cellClass: 'text-sm font-semibold text-gray-800' },
        {
            field: 'grammar_score', headerName: t('grammarAgent.myDocuments.table.score'),
            valueFormatter: p => (p.value === null || p.value === undefined ? '—' : `${p.value}/100`),
            cellClass: (p: { data: DocumentSummary }) => `text-sm font-bold ${scoreClass(p.data.grammar_score)}`,
        },
        { field: 'readability_label', headerName: t('grammarAgent.myDocuments.table.readability'), valueFormatter: p => p.value || '—', cellClass: 'text-sm text-gray-600' },
        { field: 'word_count', headerName: t('grammarAgent.myDocuments.table.wordCount'), valueFormatter: p => (p.value ?? 0).toLocaleString(), cellClass: 'text-sm text-gray-600' },
        {
            field: 'issue_counts', headerName: t('grammarAgent.myDocuments.table.issues'),
            valueFormatter: p => {
                const counts = (p.value || {}) as Record<string, number>;
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                return total ? String(total) : t('grammarAgent.myDocuments.table.noIssues');
            },
            cellClass: 'text-sm text-gray-600',
        },
        { field: 'document_classification', headerName: t('grammarAgent.myDocuments.table.classification'), cellClass: 'text-gray-600' },
        { field: 'review_status', headerName: t('grammarAgent.myDocuments.table.reviewStatus'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: reviewStatusMap } },
        { field: 'created_at', headerName: t('grammarAgent.myDocuments.table.created'), valueFormatter: p => fmtDateTime(p.value), cellClass: 'whitespace-nowrap text-sm text-gray-400' },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onDelete(row as DocumentSummary),
            },
        },
    ];
}
