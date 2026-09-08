import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Small "create by name" drawer, reused for Divisions/Departments/Sections in
 * Organization Structure — the only difference between the three is the copy,
 * so one parameterized drawer replaces three near-identical forms.
 */
@Component({
    selector: 'lib-name-entry-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule],
    templateUrl: './name-entry-drawer.html',
})
export class NameEntryDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() eyebrowKey = '';
    @Input() titleKey = '';
    @Input() labelKey = '';
    @Input() placeholderKey = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<string>();

    name = '';

    ngOnChanges(): void {
        if (this.visible) this.name = '';
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        const trimmed = this.name.trim();
        if (!trimmed) return;
        this.save.emit(trimmed);
    }
}
