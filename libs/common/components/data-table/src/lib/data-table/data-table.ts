import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
    AllCommunityModule,
    ModuleRegistry,
    type ColDef,
    type GridApi,
    type GridOptions,
    type GridReadyEvent,
    type RowClickedEvent,
    type RowSelectionOptions,
    type SelectionChangedEvent,
} from 'ag-grid-community';
import { InputTextModule } from 'primeng/inputtext';

import { defaultColDef, defaultGridOptions, defaultGridTheme } from './data-table-options';
import { NoRowsOverlayComponent } from '../renderers/no-rows-overlay/no-rows-overlay';

// AG Grid v33+ requires explicit module registration. Registering the full
// community feature set here means any consumer of `DataTable` gets a
// working grid without having to register modules themselves.
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Reusable ag-grid wrapper: consumers own their `ColDef[]`/`rowData` and this
 * component supplies pagination, client-side search, responsive column
 * sizing, RTL support, and the row-actions/status cell renderers.
 *
 * `StatusCellComponent`/`RowActionsCellComponent` are not referenced here —
 * consumers pass them directly as a colDef's `cellRenderer`, and ag-grid
 * instantiates them itself.
 */
@Component({
    selector: 'lib-data-table',
    standalone: true,
    imports: [CommonModule, FormsModule, AgGridAngular, InputTextModule],
    templateUrl: './data-table.html',
})
export class DataTable implements OnInit, OnChanges {
    @Input() rowData: unknown[] = [];
    @Input() colDefs: ColDef[] = [];
    @Input() gridOptions: GridOptions = {};
    @Input() showSearch = true;
    @Input() searchPlaceholder = 'Search...';
    @Input() noRowsMessage = 'No data';
    @Input() paginator = true;
    @Input() rows = 10;
    @Input() rowsPerPageOptions: number[] = [10, 25, 50, 100];
    @Input() enableMultiselect = false;
    @Input() enableRtl = false;
    @Input() resizeWidth = 800;

    @Output() rowClick = new EventEmitter<unknown>();
    @Output() searchChanged = new EventEmitter<string>();
    @Output() rowSelected = new EventEmitter<unknown[]>();

    @ViewChild('agGrid') agGrid?: AgGridAngular;

    searchText = '';
    displayRowData: unknown[] = [];
    private originalRowData: unknown[] = [];
    /** Column defs with the action column pinned for LTR/RTL. */
    resolvedColDefs: ColDef[] = [];

    defaultColDefMerged: ColDef = defaultColDef;
    gridTheme = defaultGridTheme;
    mergedGridOptions: GridOptions = { ...defaultGridOptions };
    noRowsOverlayComponent = NoRowsOverlayComponent;

    gridApi?: GridApi;
    gridSize = '';

    rowSelection: RowSelectionOptions = {
        mode: 'singleRow',
        checkboxes: false,
        enableClickSelection: false,
    };

    ngOnInit(): void {
        this.mergedGridOptions = { ...defaultGridOptions, ...this.gridOptions };
        if (this.enableMultiselect) {
            this.rowSelection = { mode: 'multiRow', checkboxes: true, enableClickSelection: true };
        }
        this.resolvedColDefs = this.applyActionColumnDefaults([...this.colDefs]);
        this.originalRowData = [...this.rowData];
        this.displayRowData = [...this.originalRowData];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gridOptions']) {
            this.mergedGridOptions = { ...defaultGridOptions, ...this.gridOptions };
        }
        if (changes['rowData']) {
            const incoming = changes['rowData'].currentValue as unknown[] | undefined;
            this.originalRowData = [...(incoming ?? [])];
            this.displayRowData = [...this.originalRowData];
            if (this.searchText) {
                this.onSearchChange();
            }
        }
        if (changes['enableMultiselect']) {
            this.rowSelection = this.enableMultiselect
                ? { mode: 'multiRow', checkboxes: true, enableClickSelection: true }
                : { mode: 'singleRow', checkboxes: false, enableClickSelection: false };
        }
        if (changes['colDefs'] || changes['enableRtl']) {
            this.resolvedColDefs = this.applyActionColumnDefaults([...this.colDefs]);
        }
    }

    private applyActionColumnDefaults(defs: ColDef[]): ColDef[] {
        // Strip `flex` — AG Grid rejects it when `autoSizeStrategy` is set
        // on grid options (console: "colDef.flex is not supported with
        // gridOptions.autoSizeStrategy").
        return defs.map((col: ColDef) => {
            const { flex: _flex, ...rest } = col;
            if (rest.field === 'action' || rest.colId === 'action') {
                return {
                    ...rest,
                    pinned: this.enableRtl ? 'left' : 'right',
                    filter: false,
                    sortable: false,
                    suppressHeaderMenuButton: true,
                };
            }
            return rest;
        });
    }

    onGridReady(params: GridReadyEvent): void {
        this.gridApi = params.api;
        params.api.setGridOption('domLayout', 'autoHeight');
        this.updateColumnSizing();
    }

    @HostListener('window:resize')
    onResize(): void {
        this.updateColumnSizing();
    }

    updateColumnSizing(): void {
        if (!this.gridApi) return;
        if (window.innerWidth <= this.resizeWidth && this.gridSize !== 'mobile') {
            this.gridApi.autoSizeAllColumns();
            this.gridSize = 'mobile';
        } else if (window.innerWidth > this.resizeWidth && this.gridSize !== 'desktop') {
            this.gridApi.sizeColumnsToFit();
            this.gridSize = 'desktop';
        }
    }

    onSearchChange(): void {
        const keyword = (this.searchText || '').trim().toLowerCase();
        if (!keyword) {
            this.displayRowData = [...this.originalRowData];
            this.searchChanged.emit('');
            return;
        }
        this.displayRowData = this.originalRowData.filter(row =>
            Object.values(row as object).some(val => val?.toString().toLowerCase().includes(keyword)),
        );
        this.searchChanged.emit(keyword);
    }

    onRowClicked(event: RowClickedEvent): void {
        const target = event.event?.target as HTMLElement | undefined;
        if (target?.closest('button')) {
            return;
        }
        if (event.data !== undefined) {
            this.rowClick.emit(event.data);
        }
    }

    onSelectionChanged(event: SelectionChangedEvent): void {
        this.rowSelected.emit(event.selectedNodes?.map(n => n.data) ?? []);
    }

    onPaginationChanged(): void {
        this.updateColumnSizing();
    }

    /** Whether a parent has bound `(rowClick)` — drives the pointer cursor on rows. */
    get rowsClickable(): boolean {
        return this.rowClick.observed;
    }
}
