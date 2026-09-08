import { DataTableAction, RowActionsCellComponent } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { CrawledPage } from '../models/admin.models';
import { formatTimestamp } from './date-format';

/** Column defs for the "Crawled Pages" `<lib-data-table>` on the admin Crawl Schedule page -- lets an admin browse exactly what's been fetched from the configured site(s). */
export function buildCrawledPageColDefs(t: (key: string) => string, onView: (page: CrawledPage) => void): ColDef[] {
    const actions: DataTableAction[] = [
        {
            key: 'view',
            icon: 'eye',
            label: t('mofaChatbot.admin.crawl.viewPage'),
            severity: 'secondary',
        },
    ];

    return [
        { field: 'title', headerName: t('mofaChatbot.admin.crawl.crawledPagesTable.title'), cellClass: 'text-sm text-gray-800' },
        { field: 'url', headerName: t('mofaChatbot.admin.crawl.crawledPagesTable.url'), cellClass: 'max-w-96 truncate text-sm text-gray-500' },
        {
            field: 'last_crawled_at',
            headerName: t('mofaChatbot.admin.crawl.crawledPagesTable.lastCrawled'),
            valueFormatter: p => formatTimestamp(p.value),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            field: 'last_changed_at',
            headerName: t('mofaChatbot.admin.crawl.crawledPagesTable.lastChanged'),
            valueFormatter: p => formatTimestamp(p.value),
            cellClass: 'whitespace-nowrap text-sm text-gray-400',
        },
        {
            colId: 'action',
            headerName: '',
            cellRenderer: RowActionsCellComponent,
            cellRendererParams: {
                actions,
                onAction: (_key: string, row: unknown) => onView(row as CrawledPage),
            },
        },
    ];
}
