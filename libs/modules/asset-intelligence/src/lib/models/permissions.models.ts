export type AssetUserRole = 'ADMIN' | 'EA_ADMIN' | 'APPROVER' | 'CUSTODIAN' | 'REQUESTER' | 'VIEWER';

/** `permissions[resource][action]`: mirrors the legacy asset-mgmt backend's RBAC matrix shape. */
export type PermissionMatrix = Record<string, Record<string, boolean>>;

export interface AssetSessionInfo {
    role: AssetUserRole;
    permissions: PermissionMatrix;
}
