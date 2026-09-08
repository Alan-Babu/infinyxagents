import { CommonModule } from '@angular/common';
import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ApiError } from '@nfinyx/types';
import { DataTable } from '@nfinyx/data-table';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { Asset, AssetStatus } from '../../models/asset.models';
import { AssetApiService } from '../../services/asset-api.service';
import { buildAssetColDefs } from '../../utils/asset-columns';

interface StatusOption {
    label: string;
    value: AssetStatus | '';
}

@Component({
    selector: 'lib-asset-registry',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DataTable, PageHeaderComponent, InputTextModule, SelectModule],
    templateUrl: './asset-registry.html',
})
export class AssetRegistryPage implements OnDestroy {
    private readonly api = inject(AssetApiService);
    private readonly router = inject(Router);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    readonly search = signal('');
    readonly status = signal<AssetStatus | ''>('');

    assets: Asset[] = [];
    loading = false;
    errorMessage = '';
    colDefs: ColDef[] = [];

    scanTag = '';
    scanError = '';

    statusOptions: StatusOption[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => {
            this.rebuildColDefs();
            this.rebuildStatusOptions();
        });
        this.rebuildColDefs();
        this.rebuildStatusOptions();

        effect(() => {
            const q = this.search();
            const status = this.status();
            this.refresh(q, status);
        });
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private rebuildColDefs(): void {
        this.colDefs = buildAssetColDefs(
            key => this.translate.instant(key),
            id => this.viewAsset(id),
        );
    }

    private rebuildStatusOptions(): void {
        const statuses: AssetStatus[] = ['IN_USE', 'IDLE', 'IN_REPAIR', 'RESERVED', 'RETIRED'];
        this.statusOptions = [
            { label: this.translate.instant('assetIntelligence.assetRegistry.allStatuses'), value: '' },
            ...statuses.map(s => ({ label: this.translate.instant(`assetIntelligence.status.${s}`), value: s })),
        ];
    }

    private async refresh(q: string, status: AssetStatus | ''): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            this.assets = await this.api.listAssets({ q: q || undefined, status });
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    async onScan(): Promise<void> {
        const tag = this.scanTag.trim();
        if (!tag) return;
        this.scanError = '';
        try {
            const asset = await this.api.getByTag(tag);
            this.scanTag = '';
            this.viewAsset(asset.id);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                this.scanError = this.translate.instant('assetIntelligence.assetRegistry.scanNotFound');
            } else {
                this.common.showApiError(err);
            }
        }
    }

    viewAsset(id: string): void {
        this.router.navigate(['/asset-intelligence/assets', id]);
    }

    onRowClick(row: unknown): void {
        this.viewAsset((row as Asset).id);
    }
}
