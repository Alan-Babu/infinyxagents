import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AssetClass, Category, CategoryAttributeDef, Vendor } from '../../../models/asset-master.models';
import { AssetMasterApiService } from '../../../services/asset-master-api.service';
import { PermissionsService } from '../../../services/permissions.service';

interface AssetClassOption {
    label: string;
    value: AssetClass;
}

@Component({
    selector: 'lib-asset-master',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
    templateUrl: './asset-master.html',
})
export class AssetMasterPage implements OnInit {
    private readonly api = inject(AssetMasterApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    readonly permissions = inject(PermissionsService);

    categories: Category[] = [];
    vendors: Vendor[] = [];

    assetClassOptions: AssetClassOption[] = [];
    newCategoryName = '';
    newCategoryClass: AssetClass = 'IT';
    newCategoryUsefulLife: number | null = null;

    newVendorName = '';
    newVendorEmail = '';

    expandedCategoryId: string | null = null;
    attributesByCategory = new Map<string, CategoryAttributeDef[]>();

    async ngOnInit(): Promise<void> {
        this.assetClassOptions = [
            { label: this.translate.instant('assetIntelligence.settings.assetMaster.classIt'), value: 'IT' },
            { label: this.translate.instant('assetIntelligence.settings.assetMaster.classNonIt'), value: 'NON_IT' },
        ];
        this.categories = await this.api.listCategories();
        this.vendors = await this.api.listVendors();
    }

    async toggleAttributes(category: Category): Promise<void> {
        if (this.expandedCategoryId === category.id) {
            this.expandedCategoryId = null;
            return;
        }
        this.expandedCategoryId = category.id;
        if (!this.attributesByCategory.has(category.id)) {
            try {
                const attrs = await this.api.getAttributeSchema(category.id);
                this.attributesByCategory.set(category.id, attrs);
            } catch (err) {
                this.common.showApiError(err);
            }
        }
    }

    attributesFor(categoryId: string): CategoryAttributeDef[] {
        return this.attributesByCategory.get(categoryId) ?? [];
    }

    async addCategory(): Promise<void> {
        const name = this.newCategoryName.trim();
        if (!name || !this.newCategoryUsefulLife) return;
        try {
            const category = await this.api.createCategory({
                name,
                asset_class: this.newCategoryClass,
                default_useful_life_months: this.newCategoryUsefulLife,
            });
            this.categories = [...this.categories, category];
            this.newCategoryName = '';
            this.newCategoryUsefulLife = null;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async addVendor(): Promise<void> {
        const name = this.newVendorName.trim();
        const email = this.newVendorEmail.trim();
        if (!name || !email) return;
        try {
            const vendor = await this.api.createVendor({ name, contact_email: email });
            this.vendors = [...this.vendors, vendor];
            this.newVendorName = '';
            this.newVendorEmail = '';
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
