import { AssetUserRole } from './permissions.models';

export interface AssetUser {
    id: string;
    email: string;
    full_name: string;
    role: AssetUserRole;
    employee_id?: string | null;
    is_active: boolean;
}

export interface RoleListResponse {
    roles: AssetUserRole[];
}
