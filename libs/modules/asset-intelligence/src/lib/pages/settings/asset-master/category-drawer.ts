import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AssetClass } from '../../../models/asset-master.models';

export interface CategoryPayload {
    name: string;
    assetClass: AssetClass;
    usefulLifeMonths: number;
}

interface AssetClassOption {
    label: string;
    value: AssetClass;
}

@Component({
    selector: 'lib-category-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, InputNumberModule, SelectModule],
    templateUrl: './category-drawer.html',
})
export class CategoryDrawerComponent implements OnChanges {
    private readonly translate = inject(TranslateService);

    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<CategoryPayload>();

    name = '';
    assetClass: AssetClass = 'IT';
    usefulLifeMonths: number | null = null;

    readonly assetClassOptions: AssetClassOption[] = [
        { label: this.translate.instant('assetIntelligence.settings.assetMaster.classIt'), value: 'IT' },
        { label: this.translate.instant('assetIntelligence.settings.assetMaster.classNonIt'), value: 'NON_IT' },
    ];

    ngOnChanges(): void {
        if (this.visible) {
            this.name = '';
            this.assetClass = 'IT';
            this.usefulLifeMonths = null;
        }
    }

    get isValid(): boolean {
        return !!this.name.trim() && !!this.usefulLifeMonths;
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    confirm(): void {
        if (!this.isValid || !this.usefulLifeMonths) return;
        this.save.emit({ name: this.name.trim(), assetClass: this.assetClass, usefulLifeMonths: this.usefulLifeMonths });
    }
}
