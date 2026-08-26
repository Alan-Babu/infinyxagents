import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { BlacklistTerm } from '../models/admin.models';

/** Column defs for the `<lib-data-table>` on the admin Blacklist page. */
export function buildBlacklistColDefs(
    t: (key: string) => string,
    onToggle: (term: BlacklistTerm) => void,
    onDelete: (term: BlacklistTerm) => void,
): ColDef[] {
    const statusMap: Record<string, DataTableStatusEntry> = {
        active: { severity: 'success', label: t('mofaChatbot.admin.blacklist.active') },
        inactive: { severity: 'secondary', label: t('mofaChatbot.admin.blacklist.inactive') },
    };

    const actions: DataTableAction[] = [
        {
            key: 'toggle',
            icon: 'x-circle',
            label: t('mofaChatbot.admin.blacklist.deactivateTooltip'),
            severity: 'secondary',
        },
        {
            key: 'delete',
            icon: 'trash',
            label: t('mofaChatbot.admin.blacklist.deleteTooltip'),
            severity: 'danger',
        },
    ];

    return [
        { field: 'term', headerName: t('mofaChatbot.admin.blacklist.table.term'), cellClass: 'text-sm font-semibold text-gray-800' },
        { field: 'match_type', headerName: t('mofaChatbot.admin.blacklist.table.type'), cellClass: 'text-sm text-gray-600' },
        { field: 'category', headerName: t('mofaChatbot.admin.blacklist.table.category'), cellClass: 'text-sm text-gray-600' },
        {
            colId: 'status',
            headerName: t('mofaChatbot.admin.blacklist.table.status'),
            valueGetter: p => ((p.data as BlacklistTerm).is_active ? 'active' : 'inactive'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: { statusMap },
        },
        {
            field: 'created_by',
            headerName: t('mofaChatbot.admin.blacklist.table.addedBy'),
            valueFormatter: p => p.value || '—',
            cellClass: 'text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (key: string, row: unknown) => (key === 'toggle' ? onToggle(row as BlacklistTerm) : onDelete(row as BlacklistTerm)),
            },
        },
    ];
}
