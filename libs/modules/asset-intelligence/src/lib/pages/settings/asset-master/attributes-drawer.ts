import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { Category, CategoryAttributeDef } from '../../../models/asset-master.models';

/** Read-only drawer showing a category's dynamic attribute schema. */
@Component({
    selector: 'lib-attributes-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule],
    templateUrl: './attributes-drawer.html',
})
export class AttributesDrawerComponent {
    @Input() visible = false;
    @Input() category: Category | null = null;
    @Input() attributes: CategoryAttributeDef[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();

    close(): void {
        this.visibleChange.emit(false);
    }
}
