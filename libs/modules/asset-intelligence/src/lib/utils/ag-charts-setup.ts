import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

// AG Charts (like AG Grid) requires explicit module registration before first
// use. Importing this file for its side effect registers the full community
// feature set once, matching the pattern already used in @nfinyx/data-table
// for ag-grid's own ModuleRegistry.
ModuleRegistry.registerModules([AllCommunityModule]);
