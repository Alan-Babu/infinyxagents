export type DataTableSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';

export type DataTableActionIcon =
    | 'pencil'
    | 'trash'
    | 'eye'
    | 'info'
    | 'sitemap'
    | 'gpu-panel'
    | 'log'
    | 'rotate'
    | 'check-circle'
    | 'x-circle'
    | 'check'
    | 'x';

/** Row action buttons passed to {@link RowActionsCellComponent} via `cellRendererParams`. */
export interface DataTableAction {
    key: string;
    icon: DataTableActionIcon;
    label: string;
    color?: string;
    severity?: DataTableSeverity;
    visible?: (row: unknown) => boolean;
}

/** Maps a raw cell value to a tag severity + label, passed to {@link StatusCellComponent} via `cellRendererParams`. */
export interface DataTableStatusEntry {
    severity: Extract<DataTableSeverity, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'>;
    label: string;
}
