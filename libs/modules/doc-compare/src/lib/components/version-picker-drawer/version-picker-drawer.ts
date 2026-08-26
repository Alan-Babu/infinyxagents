import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { VersionSummary } from '../../models/doc-compare.models';

@Component({
    selector: 'lib-version-picker-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule, DatePipe],
    templateUrl: './version-picker-drawer.html',
})
export class VersionPickerDrawerComponent {
    @Input() visible = false;
    @Input() versions: VersionSummary[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() select = new EventEmitter<VersionSummary>();

    close(): void {
        this.visibleChange.emit(false);
    }
}
