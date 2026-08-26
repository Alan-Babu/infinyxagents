import { ColDef, GridOptions, themeQuartz } from 'ag-grid-community';

/** Default column behaviour. Do not set `flex` here — it conflicts with
 * `autoSizeStrategy` on `defaultGridOptions` (AG Grid warning). */
export const defaultColDef: ColDef = {
    filter: true,
    sortable: true,
};

export const defaultGridTheme = themeQuartz.withParams({
    accentColor: '#0F99C7',
    borderColor: '#23252826',
    borderRadius: 3,
    cellTextColor: '#3F3F46',
    columnBorder: true,
    fontFamily: {
        googleFont: 'Inter',
    },
    foregroundColor: '#232528',
    headerBackgroundColor: '#FAFAFA',
    headerFontWeight: 500,
    headerRowBorder: true,
    headerTextColor: '#6B7280',
    headerVerticalPaddingScale: 1,
    spacing: 10,
    wrapperBorder: false,
    wrapperBorderRadius: 0,
});

export const defaultGridOptions: GridOptions = {
    autoSizeStrategy: {
        type: 'fitGridWidth',
    },
};
