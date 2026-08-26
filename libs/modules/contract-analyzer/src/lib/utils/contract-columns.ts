import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ContractSummary } from '../models/contract-analyzer.models';
import { fmtDateTime, reviewStatusSeverity } from './contract-display';

/** Column defs for `<lib-data-table>` on the My Contracts page. `onDelete` fires the row's delete action. */
export function buildContractColDefs(t: (key: string) => string, onDelete: (row: ContractSummary) => void): ColDef[] {
    const riskMap: Record<string, DataTableStatusEntry> = {
        low: { severity: 'success', label: t('contractAnalyzer.risk.low') },
        medium: { severity: 'warn', label: t('contractAnalyzer.risk.medium') },
        high: { severity: 'danger', label: t('contractAnalyzer.risk.high') },
        critical: { severity: 'danger', label: t('contractAnalyzer.risk.critical') },
    };

    const reviewStatusMap: Record<string, DataTableStatusEntry> = {
        needs_review: { severity: reviewStatusSeverity('needs_review'), label: t('contractAnalyzer.reviewStatus.needs_review') },
        approved: { severity: reviewStatusSeverity('approved'), label: t('contractAnalyzer.reviewStatus.approved') },
        rejected: { severity: reviewStatusSeverity('rejected'), label: t('contractAnalyzer.reviewStatus.rejected') },
    };

    const actions: DataTableAction[] = [
        { key: 'delete', icon: 'trash', label: t('contractAnalyzer.myContracts.delete'), severity: 'danger' },
    ];

    return [
        { field: 'filename', headerName: t('contractAnalyzer.myContracts.table.filename'), cellClass: 'text-sm font-semibold text-gray-800' },
        { field: 'party_a_name', headerName: t('contractAnalyzer.myContracts.table.partyA'), valueFormatter: p => p.value || t('contractAnalyzer.common.unknownParty'), cellClass: 'text-sm text-gray-600' },
        { field: 'party_b_name', headerName: t('contractAnalyzer.myContracts.table.partyB'), valueFormatter: p => p.value || t('contractAnalyzer.common.unknownParty'), cellClass: 'text-sm text-gray-600' },
        { field: 'overall_risk_level', headerName: t('contractAnalyzer.myContracts.table.risk'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: riskMap } },
        { field: 'review_status', headerName: t('contractAnalyzer.myContracts.table.reviewStatus'), cellRenderer: StatusCellComponent, cellRendererParams: { statusMap: reviewStatusMap } },
        { field: 'document_classification', headerName: t('contractAnalyzer.myContracts.table.classification'), cellClass: 'text-gray-600' },
        { field: 'created_at', headerName: t('contractAnalyzer.myContracts.table.created'), valueFormatter: p => fmtDateTime(p.value), cellClass: 'whitespace-nowrap text-sm text-gray-400' },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onDelete(row as ContractSummary),
            },
        },
    ];
}
