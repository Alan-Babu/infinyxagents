import { DataTableAction, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { Asset } from '../models/asset.models';
import { criticalityEntry, statusEntry } from './asset-display';

/** Column defs for `<lib-data-table>` on the Asset Registry page. `onView` navigates to the asset's detail route. */
export function buildAssetColDefs(t: (key: string) => string, onView: (id: string) => void): ColDef[] {
    const actions: DataTableAction[] = [
        { key: 'view', icon: 'eye', label: t('assetIntelligence.table.view'), severity: 'secondary' },
    ];

    return [
        { field: 'asset_tag', headerName: t('assetIntelligence.table.tag'), cellClass: 'font-mono text-sm font-semibold text-gray-800' },
        { field: 'name', headerName: t('assetIntelligence.table.name'), cellClass: 'text-sm text-gray-800' },
        {
            field: 'status',
            headerName: t('assetIntelligence.table.status'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: {
                statusMap: Object.fromEntries(
                    (['IN_USE', 'IDLE', 'IN_REPAIR', 'RESERVED', 'RETIRED'] as const).map(s => [s, statusEntry(s, t)]),
                ),
            },
        },
        {
            field: 'criticality',
            headerName: t('assetIntelligence.table.criticality'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: {
                statusMap: Object.fromEntries(
                    (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(c => [c, criticalityEntry(c, t)]),
                ),
            },
        },
        { field: 'planned_retirement_date', headerName: t('assetIntelligence.table.retirement'), cellClass: 'text-sm text-gray-500' },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onView((row as Asset).id),
            },
        },
    ];
}
