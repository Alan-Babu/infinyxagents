import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { DocumentSummary } from '../models/doc-intel.models';
import { fmtDateTime, statusSeverity } from './doc-intel-display';

/** Column defs for `<lib-data-table>` on the My Documents page. `onDelete` fires the row's delete action. */
export function buildDocumentColDefs(t: (key: string) => string, onDelete: (row: DocumentSummary) => void): ColDef[] {
    const statusMap: Record<string, DataTableStatusEntry> = {
        Valid: { severity: statusSeverity('Valid'), label: t('docIntelAgent.status.Valid') },
        Expired: { severity: statusSeverity('Expired'), label: t('docIntelAgent.status.Expired') },
        'No Expiry': { severity: statusSeverity('No Expiry'), label: t('docIntelAgent.status.NoExpiry') },
        Unknown: { severity: statusSeverity('Unknown'), label: t('docIntelAgent.status.Unknown') },
    };

    const riskMap: Record<string, DataTableStatusEntry> = {
        low: { severity: 'success', label: t('docIntelAgent.risk.low') },
        medium: { severity: 'warn', label: t('docIntelAgent.risk.medium') },
        high: { severity: 'danger', label: t('docIntelAgent.risk.high') },
    };

    const actions: DataTableAction[] = [
        { key: 'delete', icon: 'trash', label: t('docIntelAgent.myDocuments.delete'), severity: 'danger' },
    ];

    return [
        { field: 'filename', headerName: t('docIntelAgent.myDocuments.table.filename'), cellClass: 'text-sm font-semibold text-gray-800' },
        { field: 'document_type', headerName: t('docIntelAgent.myDocuments.table.documentType'), valueFormatter: p => p.value || t('docIntelAgent.common.unclassified'), cellClass: 'text-xs font-bold text-primary-700' },
        { field: 'issued_by_name', headerName: t('docIntelAgent.myDocuments.table.issuedBy'), valueFormatter: p => p.value || t('docIntelAgent.common.unknownIssuer'), cellClass: 'text-sm text-gray-600' },
        { field: 'status', headerName: t('docIntelAgent.myDocuments.table.status'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap } },
        { field: 'risk_level', headerName: t('docIntelAgent.myDocuments.table.risk'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: riskMap } },
        { field: 'document_category', headerName: t('docIntelAgent.myDocuments.table.category'), cellClass: 'text-gray-600' },
        { field: 'document_classification', headerName: t('docIntelAgent.myDocuments.table.classification'), cellClass: 'text-gray-600' },
        { field: 'created_at', headerName: t('docIntelAgent.myDocuments.table.created'), valueFormatter: p => fmtDateTime(p.value), cellClass: 'whitespace-nowrap text-sm text-gray-400' },
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
