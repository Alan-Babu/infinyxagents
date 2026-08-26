import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';

export interface MergeDraftPayload {
    label: string;
    tag: string;
    notes: string;
    setAsMaster: boolean;
}

const TAG_OPTIONS = ['Draft', 'Reviewed', 'Final', 'Superseded'];

@Component({
    selector: 'lib-merge-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, CheckboxModule, DrawerModule, InputTextModule],
    templateUrl: './merge-drawer.html',
})
export class MergeDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() initialLabel = '';
    @Input() overriddenCount = 0;
    @Input() baseLabel = '';
    @Input() compareLabel = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<MergeDraftPayload>();

    readonly tagOptions = TAG_OPTIONS;

    label = '';
    tag = 'Draft';
    notes = '';
    setAsMaster = false;

    ngOnChanges(): void {
        if (this.visible) {
            this.label = this.initialLabel;
            this.tag = 'Draft';
            this.notes = this.overriddenCount > 0
                ? `${this.overriddenCount} change(s) reverted to "${this.baseLabel}".`
                : '';
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
