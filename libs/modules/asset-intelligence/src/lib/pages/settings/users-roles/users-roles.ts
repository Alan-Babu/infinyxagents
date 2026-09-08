import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { AssetUserRole } from '../../../models/permissions.models';
import { AssetUser } from '../../../models/users.models';
import { UserAdminApiService } from '../../../services/user-admin-api.service';
import { PermissionsService } from '../../../services/permissions.service';

const ROLES: AssetUserRole[] = ['ADMIN', 'EA_ADMIN', 'APPROVER', 'CUSTODIAN', 'REQUESTER', 'VIEWER'];

@Component({
    selector: 'lib-users-roles',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, SelectModule, PasswordModule],
    templateUrl: './users-roles.html',
})
export class UsersRolesPage implements OnInit {
    private readonly api = inject(UserAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);
    readonly permissions = inject(PermissionsService);

    users: AssetUser[] = [];
    roles = ROLES;
    errorMessage = '';

    newUserName = '';
    newUserEmail = '';
    newUserPassword = '';
    newUserRole: AssetUserRole = 'VIEWER';

    async ngOnInit(): Promise<void> {
        await this.refresh();
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
            user.role = role;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async toggleActive(user: AssetUser): Promise<void> {
        try {
            const updated = await this.api.updateUser(user.id, { is_active: !user.is_active });
            user.is_active = updated.is_active;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async createUser(): Promise<void> {
        this.errorMessage = '';
        const name = this.newUserName.trim();
        const email = this.newUserEmail.trim();
        if (!name || !email || !this.newUserPassword) return;
        try {
            const user = await this.api.createUser({ full_name: name, email, password: this.newUserPassword, role: this.newUserRole });
            this.users = [...this.users, user];
            this.newUserName = '';
            this.newUserEmail = '';
            this.newUserPassword = '';
            this.newUserRole = 'VIEWER';
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.actionFailed');
        }
    }
}
