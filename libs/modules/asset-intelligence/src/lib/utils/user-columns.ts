import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { AssetUserRole } from '../models/permissions.models';
import { AssetUser } from '../models/users.models';
import { RoleSelectCellComponent } from '../components/role-select-cell/role-select-cell';

export function buildUserColDefs(
    t: (key: string) => string,
    roles: AssetUserRole[],
    onRoleChange: (role: AssetUserRole, row: AssetUser) => void,
    onToggleActive: (row: AssetUser) => void,
): ColDef[] {
    const statusMap: Record<'true' | 'false', DataTableStatusEntry> = {
        true: { severity: 'success', label: t('assetIntelligence.settings.users.active') },
        false: { severity: 'secondary', label: t('assetIntelligence.settings.users.disabled') },
    };

    const actions: DataTableAction[] = [
        {
            key: 'disable',
            icon: 'x-circle',
            label: t('assetIntelligence.settings.users.disable'),
            severity: 'danger',
            visible: row => (row as AssetUser).is_active,
        },
        {
            key: 'enable',
            icon: 'check-circle',
            label: t('assetIntelligence.settings.users.enable'),
            severity: 'success',
            visible: row => !(row as AssetUser).is_active,
        },
    ];

    return [
        { field: 'full_name', headerName: t('assetIntelligence.settings.users.name'), cellClass: 'font-semibold text-gray-800' },
        { field: 'email', headerName: t('assetIntelligence.settings.users.email'), cellClass: 'text-gray-500' },
        {
            field: 'role',
            headerName: t('assetIntelligence.settings.users.role'),
            cellRenderer: RoleSelectCellComponent,
            cellRendererParams: { roles, onChange: onRoleChange },
        },
        {
            field: 'is_active',
            headerName: t('assetIntelligence.settings.users.status'),
            valueGetter: p => String((p.data as AssetUser).is_active),
            cellRenderer: StatusCellComponent,
            cellRendererParams: { statusMap },
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onToggleActive(row as AssetUser),
            },
        },
    ];
}
