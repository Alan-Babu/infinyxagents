import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { SelectModule } from 'primeng/select';
import { AssetUser } from '../../models/users.models';
import { AssetUserRole } from '../../models/permissions.models';

export interface RoleSelectCellParams extends ICellRendererParams {
    roles: AssetUserRole[];
    onChange: (role: AssetUserRole, row: AssetUser) => void;
}

/** Module-local ag-grid cell renderer: an inline role `p-select` per user row. */
@Component({
    selector: 'lib-role-select-cell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, SelectModule],
    host: { '(click)': '$event.stopPropagation()' },
    template: `<p-select [options]="roles" [ngModel]="value" (ngModelChange)="onSelect($event)" appendTo="body" size="small" styleClass="w-40 leading-relaxed" />`,
})
export class RoleSelectCellComponent implements ICellRendererAngularComp {
    roles: AssetUserRole[] = [];
    value: AssetUserRole | null = null;
    private row!: AssetUser;
    private onChange!: (role: AssetUserRole, row: AssetUser) => void;

    agInit(params: RoleSelectCellParams): void {
        this.resolve(params);
    }

    refresh(params: RoleSelectCellParams): boolean {
        this.resolve(params);
        return true;
    }

    onSelect(role: AssetUserRole): void {
        this.value = role;
        this.onChange(role, this.row);
    }

    private resolve(params: RoleSelectCellParams): void {
        this.roles = params.roles;
        this.value = params.value as AssetUserRole;
        this.row = params.data as AssetUser;
        this.onChange = params.onChange;
    }
}
