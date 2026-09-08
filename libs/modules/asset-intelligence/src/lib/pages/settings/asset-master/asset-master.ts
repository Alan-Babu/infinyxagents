import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { Category, CategoryAttributeDef, Vendor } from '../../../models/asset-master.models';
import { AssetMasterApiService } from '../../../services/asset-master-api.service';
import { PermissionsService } from '../../../services/permissions.service';
import { buildCategoryColDefs, buildVendorColDefs } from '../../../utils/asset-master-columns';
import { AttributesDrawerComponent } from './attributes-drawer';
import { CategoryDrawerComponent, CategoryPayload } from './category-drawer';
import { VendorDrawerComponent, VendorPayload } from './vendor-drawer';

@Component({
    selector: 'lib-asset-master',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DataTable, CategoryDrawerComponent, VendorDrawerComponent, AttributesDrawerComponent],
    templateUrl: './asset-master.html',
})
export class AssetMasterPage implements OnInit, OnDestroy {
    private readonly api = inject(AssetMasterApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);
    readonly permissions = inject(PermissionsService);

    categories: Category[] = [];
    vendors: Vendor[] = [];

    categoryColDefs: ColDef[] = [];
    vendorColDefs: ColDef[] = [];

    categoryDrawerOpen = false;
    vendorDrawerOpen = false;

    attributesDrawerOpen = false;
    attributesCategory: Category | null = null;
    attributesByCategory = new Map<string, CategoryAttributeDef[]>();

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        this.categories = await this.api.listCategories();
        this.vendors = await this.api.listVendors();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);
        this.categoryColDefs = buildCategoryColDefs(t, category => this.viewAttributes(category));
        this.vendorColDefs = buildVendorColDefs(t);
    }

    async viewAttributes(category: Category): Promise<void> {
        this.attributesCategory = category;
        this.attributesDrawerOpen = true;
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

    async addCategory(payload: CategoryPayload): Promise<void> {
        try {
            const category = await this.api.createCategory({
                name: payload.name,
                asset_class: payload.assetClass,
                default_useful_life_months: payload.usefulLifeMonths,
            });
            this.categories = [...this.categories, category];
            this.categoryDrawerOpen = false;
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async addVendor(payload: VendorPayload): Promise<void> {
        try {
            const vendor = await this.api.createVendor({ name: payload.name, contact_email: payload.contactEmail });
            this.vendors = [...this.vendors, vendor];
            this.vendorDrawerOpen = false;
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
