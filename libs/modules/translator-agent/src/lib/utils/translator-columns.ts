import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { DocumentSummary } from '../models/translator.models';
import { fmtDateTime, statusSeverity } from './translator-display';

/** Column defs for `<lib-data-table>` on the My Documents page. `onDelete` fires the row's delete action. */
export function buildDocumentColDefs(t: (key: string) => string, onDelete: (row: DocumentSummary) => void): ColDef[] {
    const statusMap: Record<string, DataTableStatusEntry> = {
        Valid: { severity: statusSeverity('Valid'), label: t('translatorAgent.status.Valid') },
        Expired: { severity: statusSeverity('Expired'), label: t('translatorAgent.status.Expired') },
        'No Expiry': { severity: statusSeverity('No Expiry'), label: t('translatorAgent.status.NoExpiry') },
        Unknown: { severity: statusSeverity('Unknown'), label: t('translatorAgent.status.Unknown') },
    };

    const riskMap: Record<string, DataTableStatusEntry> = {
        low: { severity: 'success', label: t('translatorAgent.risk.low') },
        medium: { severity: 'warn', label: t('translatorAgent.risk.medium') },
        high: { severity: 'danger', label: t('translatorAgent.risk.high') },
    };

    const actions: DataTableAction[] = [
        { key: 'delete', icon: 'trash', label: t('translatorAgent.myDocuments.delete'), severity: 'danger' },
    ];

    return [
        { field: 'filename', headerName: t('translatorAgent.myDocuments.table.filename'), cellClass: 'text-sm font-semibold text-gray-800' },
        { field: 'document_type', headerName: t('translatorAgent.myDocuments.table.documentType'), valueFormatter: p => p.value || t('translatorAgent.common.unclassified'), cellClass: 'text-xs font-bold text-primary-700' },
        { field: 'detected_language', headerName: t('translatorAgent.myDocuments.table.language'), valueFormatter: p => p.value || t('translatorAgent.common.unknownLanguage'), cellClass: 'text-xs font-semibold text-gray-600' },
        { field: 'issued_by_name', headerName: t('translatorAgent.myDocuments.table.issuedBy'), valueFormatter: p => p.value || t('translatorAgent.common.unknownIssuer'), cellClass: 'text-sm text-gray-600' },
        { field: 'status', headerName: t('translatorAgent.myDocuments.table.status'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap } },
        { field: 'risk_level', headerName: t('translatorAgent.myDocuments.table.risk'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: riskMap } },
        { field: 'document_category', headerName: t('translatorAgent.myDocuments.table.category'), cellClass: 'text-gray-600' },
        { field: 'document_classification', headerName: t('translatorAgent.myDocuments.table.classification'), cellClass: 'text-gray-600' },
        { field: 'created_at', headerName: t('translatorAgent.myDocuments.table.created'), valueFormatter: p => fmtDateTime(p.value), cellClass: 'whitespace-nowrap text-sm text-gray-400' },
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
