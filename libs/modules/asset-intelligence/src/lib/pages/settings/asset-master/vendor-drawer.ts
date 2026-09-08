import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';

export interface VendorPayload {
    name: string;
    contactEmail: string;
}

@Component({
    selector: 'lib-vendor-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule],
    templateUrl: './vendor-drawer.html',
})
export class VendorDrawerComponent implements OnChanges {
    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<VendorPayload>();

    name = '';
    contactEmail = '';

    ngOnChanges(): void {
        if (this.visible) {
            this.name = '';
            this.contactEmail = '';
        }
    }

    get isValid(): boolean {
        return !!this.name.trim() && !!this.contactEmail.trim();
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        if (!this.isValid) return;
        this.save.emit({ name: this.name.trim(), contactEmail: this.contactEmail.trim() });
    }
}
