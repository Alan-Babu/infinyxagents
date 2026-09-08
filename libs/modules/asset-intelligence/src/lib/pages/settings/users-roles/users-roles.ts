import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { AssetUserRole } from '../../../models/permissions.models';
import { AssetUser } from '../../../models/users.models';
import { UserAdminApiService } from '../../../services/user-admin-api.service';
import { PermissionsService } from '../../../services/permissions.service';
import { buildUserColDefs } from '../../../utils/user-columns';
import { CreateUserDrawerComponent, CreateUserPayload } from './create-user-drawer';

const ROLES: AssetUserRole[] = ['ADMIN', 'EA_ADMIN', 'APPROVER', 'CUSTODIAN', 'REQUESTER', 'VIEWER'];

@Component({
    selector: 'lib-users-roles',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DataTable, CreateUserDrawerComponent],
    templateUrl: './users-roles.html',
})
export class UsersRolesPage implements OnInit, OnDestroy {
    private readonly api = inject(UserAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);
    readonly permissions = inject(PermissionsService);

    users: AssetUser[] = [];
    roles = ROLES;
    colDefs: ColDef[] = [];

    createUserDrawerOpen = false;

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        await this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);
        this.colDefs = buildUserColDefs(
            t,
            this.roles,
            (role, row) => this.changeRole(row, role),
            row => this.toggleActive(row),
        );
    }

    async refresh(): Promise<void> {
        try {
            this.users = await this.api.listUsers();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async changeRole(user: AssetUser, role: AssetUserRole): Promise<void> {
        try {
            await this.api.updateUser(user.id, { role });
            this.replaceUser(user.id, { role });
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async toggleActive(user: AssetUser): Promise<void> {
        try {
            const updated = await this.api.updateUser(user.id, { is_active: !user.is_active });
            this.replaceUser(user.id, { is_active: updated.is_active });
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    /** Replaces a user immutably (new array + new object) so `<lib-data-table>` picks up the change via its `rowData` @Input. */
    private replaceUser(id: string, changes: Partial<AssetUser>): void {
        this.users = this.users.map(u => (u.id === id ? { ...u, ...changes } : u));
    }

    async createUser(payload: CreateUserPayload): Promise<void> {
        try {
            const user = await this.api.createUser({
                full_name: payload.fullName,
                email: payload.email,
                password: payload.password,
                role: payload.role,
            });
            this.users = [...this.users, user];
            this.createUserDrawerOpen = false;
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
