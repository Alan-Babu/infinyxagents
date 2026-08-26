import { DataTableStatusEntry, StatusCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';

/** Column defs for the crawl-runs `<lib-data-table>` on the admin Crawl Schedule page. */
export function buildCrawlRunColDefs(t: (key: string) => string): ColDef[] {
    const statusMap: Record<string, DataTableStatusEntry> = {
        completed: { severity: 'success', label: 'Completed' },
        running: { severity: 'info', label: 'Running' },
        failed: { severity: 'danger', label: 'Failed' },
    };

    return [
        { field: 'trigger', headerName: t('mofaChatbot.admin.crawl.table.trigger'), cellClass: 'text-sm text-gray-700' },
        { field: 'mode', headerName: t('mofaChatbot.admin.crawl.table.mode'), cellClass: 'text-sm text-gray-600' },
        {
            field: 'status',
            headerName: t('mofaChatbot.admin.crawl.table.status'),
            cellRenderer: StatusCellComponent,
            cellRendererParams: { statusMap },
        },
        { field: 'pages_discovered', headerName: t('mofaChatbot.admin.crawl.table.discovered'), cellClass: 'text-sm text-gray-600' },
        { field: 'pages_changed', headerName: t('mofaChatbot.admin.crawl.table.changed'), cellClass: 'text-sm text-gray-600' },
        { field: 'pages_unchanged', headerName: t('mofaChatbot.admin.crawl.table.unchanged'), cellClass: 'text-sm text-gray-600' },
        { field: 'pages_failed', headerName: t('mofaChatbot.admin.crawl.table.failed'), cellClass: 'text-sm text-gray-600' },
        { field: 'chunks_created', headerName: t('mofaChatbot.admin.crawl.table.chunks'), cellClass: 'text-sm text-gray-600' },
        {
            field: 'started_at',
            headerName: t('mofaChatbot.admin.crawl.table.started'),
            valueFormatter: p => (p.value ? new Date(p.value).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
    ];
}
