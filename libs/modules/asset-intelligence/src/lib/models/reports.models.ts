export interface DepreciationSchedulePoint {
    period: string;
    book_value: number;
}

export interface DepreciationSchedule {
    method: string;
    current_book_value: number;
    accumulated_depreciation: number;
    elapsed_months: number;
    useful_life_months: number;
    schedule: DepreciationSchedulePoint[];
    note?: string | null;
}

export interface DepreciationByDepartmentRow {
    department_id: string;
    department_name?: string;
    asset_count: number;
    cost: number;
    book_value: number;
    accumulated: number;
}

export interface DepreciationSummary {
    total_original_cost: number;
    total_current_book_value: number;
    total_accumulated_depreciation: number;
    by_department: DepreciationByDepartmentRow[];
}

export interface CostByDepartmentRow {
    department_id: string;
    department_name?: string;
    total_cost: number;
}

export interface UtilizationHeatmapAsset {
    asset_id: string;
    asset_tag: string;
    name: string;
    classification: 'OPTIMAL' | 'UNDERUTILIZED' | 'OVERUTILIZED' | 'UNKNOWN';
    avg_utilization_pct: number;
}

export interface UtilizationHeatmapGroup {
    department: string;
    assets: UtilizationHeatmapAsset[];
}
