import type { ColDef } from 'ag-grid-community';
import { CostByDepartmentRow, DepreciationByDepartmentRow } from '../models/reports.models';

export function buildDepreciationByDepartmentColDefs(t: (key: string) => string): ColDef[] {
    return [
        { field: 'department_name', headerName: t('assetIntelligence.reports.department'), valueGetter: p => (p.data as DepreciationByDepartmentRow).department_name || (p.data as DepreciationByDepartmentRow).department_id },
        { field: 'asset_count', headerName: t('assetIntelligence.reports.assets') },
        { field: 'cost', headerName: t('assetIntelligence.reports.originalCost'), valueFormatter: p => Number(p.value ?? 0).toLocaleString() },
        { field: 'book_value', headerName: t('assetIntelligence.reports.bookValue'), valueFormatter: p => Number(p.value ?? 0).toLocaleString() },
        { field: 'accumulated', headerName: t('assetIntelligence.reports.accumulatedDepr'), valueFormatter: p => Number(p.value ?? 0).toLocaleString() },
    ];
}

export function buildCostByDepartmentColDefs(t: (key: string) => string): ColDef[] {
    return [
        { field: 'department_name', headerName: t('assetIntelligence.reports.department'), valueGetter: p => (p.data as CostByDepartmentRow).department_name || (p.data as CostByDepartmentRow).department_id },
        { field: 'total_cost', headerName: t('assetIntelligence.reports.totalCost'), valueFormatter: p => Number(p.value ?? 0).toLocaleString() },
    ];
}
