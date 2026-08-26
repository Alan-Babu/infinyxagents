import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

export interface SaveProfileFormModel {
    name: string;
    description: string;
    researchType: string;
    visibility: 'Private' | 'Shared';
}

interface OptionDef {
    label: string;
    description?: string;
}

@Component({
    selector: 'lib-save-profile-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, SelectModule],
    templateUrl: './save-profile-drawer.html',
})
export class SaveProfileDrawerComponent {
    @Input() visible = false;
    @Input({ required: true }) model!: SaveProfileFormModel;
    @Input() researchTypeOptions: OptionDef[] = [];

    @Output() closed = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<void>();
}
