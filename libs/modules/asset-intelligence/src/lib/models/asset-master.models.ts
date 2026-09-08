export type AssetClass = 'IT' | 'NON_IT';
export type AttributeType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';

export interface Category {
    id: string;
    name: string;
    asset_class: AssetClass;
    default_useful_life_months: number;
    requires_calibration: boolean;
}

export interface CategoryAttributeDef {
    id: string;
    category_id: string;
    attr_key: string;
    attr_label: string;
    attr_type: AttributeType;
    options?: string[] | null;
    is_required: boolean;
    sort_order: number;
}

export interface Vendor {
    id: string;
    name: string;
    contact_email: string;
    support_sla_hours: number;
}
