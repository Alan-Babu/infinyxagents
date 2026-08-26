export interface SelectDropdown {
    label: string;
    value: string | number;
    param1?: any;
}

export interface UserSelectDropdown extends SelectDropdown {
    avatar: string;
    supportLabel?: string
}

export interface MonthSelectDropdown extends SelectDropdown {
    quarter: number;
}