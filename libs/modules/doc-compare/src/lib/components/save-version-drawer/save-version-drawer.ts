import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';

export interface SaveVersionPayload {
    label: string;
    tag: string;
    notes: string;
    setAsMaster: boolean;
}

const TAG_OPTIONS = ['Draft', 'Reviewed', 'Final', 'Superseded'];

@Component({
    selector: 'lib-save-version-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, CheckboxModule, DrawerModule, InputTextModule],
    templateUrl: './save-version-drawer.html',
})
export class SaveVersionDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() slot: 'A' | 'B' = 'A';
    @Input() initialLabel = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<SaveVersionPayload>();

    readonly tagOptions = TAG_OPTIONS;

    label = '';
    tag = 'Draft';
    notes = '';
    setAsMaster = false;

    ngOnChanges(): void {
        if (this.visible) {
            this.label = this.initialLabel;
            this.tag = 'Draft';
            this.notes = '';
            this.setAsMaster = false;
        }
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        this.save.emit({ label: this.label.trim(), tag: this.tag, notes: this.notes.trim(), setAsMaster: this.setAsMaster });
    }
}
