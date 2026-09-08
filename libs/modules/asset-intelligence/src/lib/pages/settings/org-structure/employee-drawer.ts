import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Department } from '../../../models/org.models';

export interface EmployeePayload {
    fullName: string;
    email: string;
    departmentId: string;
}

@Component({
    selector: 'lib-employee-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, SelectModule],
    templateUrl: './employee-drawer.html',
})
export class EmployeeDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() departments: Department[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<EmployeePayload>();

    fullName = '';
    email = '';
    departmentId: string | null = null;

    ngOnChanges(): void {
        if (this.visible) {
            this.fullName = '';
            this.email = '';
            this.departmentId = null;
        }
    }

    get isValid(): boolean {
        return !!this.fullName.trim() && !!this.email.trim() && !!this.departmentId;
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        if (!this.isValid || !this.departmentId) return;
        this.save.emit({ fullName: this.fullName.trim(), email: this.email.trim(), departmentId: this.departmentId });
    }
}
