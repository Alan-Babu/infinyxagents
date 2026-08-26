import { DataTableAction, DataTableStatusEntry, RowActionsCellComponent, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { AttestationCase, CaseDecision, CaseStatus } from '../models/digital-attestation.models';
import { confidenceColorClass, docTypeLabel, timeAgo } from './case-display';

/**
 * Column defs for `<lib-data-table>` shared by the dashboard and case-list
 * pages. `t` should resolve a translation key; `onDecide` is called when a
 * row's approve/reject action is clicked.
 */
export function buildCaseColDefs(t: (key: string) => string, onDecide: (id: string, decision: CaseDecision) => void): ColDef[] {
    const statusMap: Record<CaseStatus, DataTableStatusEntry> = {
        PENDING: { severity: 'warn', label: t('digitalAttestation.status.PENDING') },
        APPROVED: { severity: 'success', label: t('digitalAttestation.status.APPROVED') },
        REJECTED: { severity: 'danger', label: t('digitalAttestation.status.REJECTED') },
        FAILED: { severity: 'danger', label: t('digitalAttestation.status.FAILED') },
    };

    const actions: DataTableAction[] = [
        {
            key: 'APPROVED',
            icon: 'check',
            label: t('digitalAttestation.table.approve'),
            severity: 'success',
            visible: row => (row as AttestationCase).status === 'PENDING',
        },
        {
            key: 'REJECTED',
            icon: 'x',
            label: t('digitalAttestation.table.reject'),
            severity: 'danger',
            visible: row => (row as AttestationCase).status === 'PENDING',
        },
    ];

    return [
        { field: 'id', headerName: t('digitalAttestation.table.workflowId'), cellClass: 'text-sm font-semibold text-gray-800' },
        {
            field: 'docType',
            headerName: t('digitalAttestation.table.documentType'),
            valueFormatter: p => docTypeLabel(p.value),
            cellClass: 'text-xs font-bold text-primary-700',
        },
        { field: 'file', headerName: t('digitalAttestation.table.file'), cellClass: 'text-sm text-gray-400' },
        { field: 'country', headerName: t('digitalAttestation.table.country'), cellClass: 'text-gray-600' },
        {
            field: 'confidence',
            headerName: t('digitalAttestation.table.confidence'),
            valueFormatter: p => `${p.value}%`,
            cellClass: p => `font-semibold ${confidenceColorClass(p.value)}`,
        },
        {
            field: 'mismatch',
            headerName: t('digitalAttestation.table.mismatch'),
            valueFormatter: p => (p.value?.[0] as string) || '—',
            cellClass: 'max-w-56 truncate text-sm text-gray-400',
        },
        { field: 'risk', headerName: t('digitalAttestation.table.risk'), cellClass: 'text-gray-600' },
        {
            field: 'status',
            headerName: t('digitalAttestation.table.status'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: { statusMap },
        },
        {
            field: 'updatedAt',
            headerName: t('digitalAttestation.table.updated'),
            valueFormatter: p => timeAgo(p.value),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (key: string, row: unknown) => onDecide((row as AttestationCase).id, key as CaseDecision),
            },
        },
    ];
}
