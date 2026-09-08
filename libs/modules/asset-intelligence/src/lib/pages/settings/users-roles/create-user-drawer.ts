import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { AssetUserRole } from '../../../models/permissions.models';

export interface CreateUserPayload {
    fullName: string;
    email: string;
    password: string;
    role: AssetUserRole;
}

@Component({
    selector: 'lib-create-user-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, PasswordModule, SelectModule],
    templateUrl: './create-user-drawer.html',
})
export class CreateUserDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() roles: AssetUserRole[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<CreateUserPayload>();

    fullName = '';
    email = '';
    password = '';
    role: AssetUserRole = 'VIEWER';

    ngOnChanges(): void {
        if (this.visible) {
            this.fullName = '';
            this.email = '';
            this.password = '';
            this.role = 'VIEWER';
        }
    }

    get isValid(): boolean {
        return !!this.fullName.trim() && !!this.email.trim() && !!this.password;
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        if (!this.isValid) return;
        this.save.emit({ fullName: this.fullName.trim(), email: this.email.trim(), password: this.password, role: this.role });
    }
}
