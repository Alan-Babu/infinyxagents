import { DataTableAction, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { AssetAlert } from '../models/asset.models';
import { alertSeverityEntry } from './asset-display';

/** Column defs for `<lib-data-table>` shared by the dashboard's top-alerts table and the Alerts & Renewals page. */
export function buildAlertColDefs(t: (key: string) => string, onResolve?: (id: string) => void): ColDef[] {
    const cols: ColDef[] = [
        {
            field: 'severity',
            headerName: t('assetIntelligence.table.severity'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: {
                statusMap: Object.fromEntries(
                    (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(s => [s, alertSeverityEntry(s, t)]),
                ),
            },
        },
        { field: 'alert_type', headerName: t('assetIntelligence.table.type'), cellClass: 'text-xs font-bold text-primary-700' },
        { field: 'message', headerName: t('assetIntelligence.table.message'), cellClass: 'text-sm text-gray-700', flex: 2 },
        { field: 'due_date', headerName: t('assetIntelligence.table.due'), cellClass: 'text-sm text-gray-500', valueFormatter: p => p.value || '—' },
    ];

    if (onResolve) {
        cols.push(
            { field: 'generated_by', headerName: t('assetIntelligence.table.source'), cellClass: 'font-mono text-xs text-gray-400' },
            {
                colId: 'action',
                headerName: '',
                cellRenderer: RowActionsCellComponent,
                cellRendererParams: {
                    actions: [
                        {
                            key: 'resolve',
                            icon: 'check',
                            label: t('assetIntelligence.table.resolve'),
                            severity: 'success',
                            visible: (row: unknown) => (row as AssetAlert).status === 'OPEN',
                        } satisfies DataTableAction,
                    ],
                    onAction: (_key: string, row: unknown) => onResolve((row as AssetAlert).id),
                },
            },
        );
    }

    return cols;
}
