import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { AssetUser, RoleListResponse } from '../models/users.models';

@Injectable({ providedIn: 'root' })
export class UserAdminApiService extends AssetIntelligenceApiBase {
    listUsers(): Promise<AssetUser[]> {
        return this.get<AssetUser[]>('/auth/users');
    }

    createUser(payload: { full_name: string; email: string; password: string; role: string }): Promise<AssetUser> {
        return this.post<AssetUser>('/auth/users', payload);
    }

    updateUser(id: string, payload: Partial<AssetUser>): Promise<AssetUser> {
        return this.patch<AssetUser>(`/auth/users/${id}`, payload);
    }

    listRoles(): Promise<RoleListResponse> {
        return this.get<RoleListResponse>('/auth/roles');
    }
}
