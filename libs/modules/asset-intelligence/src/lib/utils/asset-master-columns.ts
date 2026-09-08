import { DataTableAction, RowActionsCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { Category } from '../models/asset-master.models';

export function buildCategoryColDefs(t: (key: string) => string, onViewAttributes: (category: Category) => void): ColDef[] {
    const actions: DataTableAction[] = [
        { key: 'attributes', icon: 'info', label: t('assetIntelligence.settings.assetMaster.attributes'), severity: 'secondary' },
    ];

    return [
        { field: 'name', headerName: t('assetIntelligence.settings.assetMaster.name'), cellClass: 'font-semibold text-gray-800' },
        { field: 'asset_class', headerName: t('assetIntelligence.settings.assetMaster.class'), cellClass: 'text-gray-500' },
        {
            field: 'default_useful_life_months',
            headerName: t('assetIntelligence.settings.assetMaster.usefulLife'),
            valueFormatter: p => `${p.value} ${t('assetIntelligence.settings.assetMaster.months')}`,
            cellClass: 'text-gray-500',
        },
        {
            field: 'requires_calibration',
            headerName: t('assetIntelligence.settings.assetMaster.calibration'),
            valueFormatter: p => t(p.value ? 'assetIntelligence.settings.assetMaster.yes' : 'assetIntelligence.settings.assetMaster.no'),
            cellClass: 'text-gray-500',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onViewAttributes(row as Category),
            },
        },
    ];
}

export function buildVendorColDefs(t: (key: string) => string): ColDef[] {
    return [
        { field: 'name', headerName: t('assetIntelligence.settings.assetMaster.name'), cellClass: 'font-semibold text-gray-800' },
        { field: 'contact_email', headerName: t('assetIntelligence.settings.assetMaster.contactEmail'), cellClass: 'text-gray-500' },
        {
            field: 'support_sla_hours',
            headerName: t('assetIntelligence.settings.assetMaster.supportSla'),
            valueFormatter: p => `${p.value}h`,
            cellClass: 'text-gray-500',
        },
    ];
}
