import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ButtonModule } from 'primeng/button';
import { DepreciationChartComponent } from '../../components/depreciation-chart/depreciation-chart';
import { Asset, AssetIntelligence, ImpactAnalysisResult } from '../../models/asset.models';
import { CategoryAttributeDef } from '../../models/asset-master.models';
import { ApplicationAssetLink, ApplicationCapabilityLink, ProjectAssetLink } from '../../models/ea.models';
import { DepreciationSchedule } from '../../models/reports.models';
import { AssetApiService } from '../../services/asset-api.service';
import { AssetMasterApiService } from '../../services/asset-master-api.service';
import { ApplicationApiService } from '../../services/application-api.service';
import { ProjectApiService } from '../../services/project-api.service';
import { PermissionsService } from '../../services/permissions.service';
import { riskLevelBadgeClass } from '../../utils/asset-display';

interface LinkedEaElement {
    id: string;
    name: string;
}

@Component({
    selector: 'lib-asset-detail',
    standalone: true,
    imports: [CommonModule, TranslateModule, PageHeaderComponent, NoData, ButtonModule, RouterLink, DepreciationChartComponent],
    templateUrl: './asset-detail.html',
})
export class AssetDetailPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly assetApi = inject(AssetApiService);
    private readonly masterApi = inject(AssetMasterApiService);
    private readonly applicationApi = inject(ApplicationApiService);
    private readonly projectApi = inject(ProjectApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    readonly permissions = inject(PermissionsService);

    assetId = '';
    asset: Asset | null = null;
    loading = false;
    errorMessage = '';

    barcodeUrl: string | null = null;

    impactLoading = false;
    impact: ImpactAnalysisResult | null = null;

    depreciation: DepreciationSchedule | null = null;
    intelligence: AssetIntelligence | null = null;
    attributes: CategoryAttributeDef[] = [];
    linkedApplications: ApplicationAssetLink[] = [];
    linkedProjects: ProjectAssetLink[] = [];
    linkedEaElements: LinkedEaElement[] = [];

    readonly riskLevelBadgeClass = riskLevelBadgeClass;

    async ngOnInit(): Promise<void> {
        this.assetId = this.route.snapshot.paramMap.get('id') ?? '';
        this.permissions.load();
        await this.refresh();
    }

    ngOnDestroy(): void {
        if (this.barcodeUrl) URL.revokeObjectURL(this.barcodeUrl);
    }

    async refresh(): Promise<void> {
        if (!this.assetId) return;
        this.loading = true;
        this.errorMessage = '';
        try {
            this.asset = await this.assetApi.getAsset(this.assetId);
            await Promise.all([
                this.loadBarcode(),
                this.loadDepreciation(),
                this.loadIntelligence(),
                this.loadCategoryAttributes(),
                this.loadLinkedApplications(),
                this.loadLinkedProjects(),
            ]);
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    private async loadBarcode(): Promise<void> {
        try {
            const blob = await this.assetApi.getBarcodeBlob(this.assetId);
            if (this.barcodeUrl) URL.revokeObjectURL(this.barcodeUrl);
            this.barcodeUrl = URL.createObjectURL(blob);
        } catch {
            this.barcodeUrl = null;
        }
    }

    private async loadDepreciation(): Promise<void> {
        try {
            this.depreciation = await this.assetApi.getDepreciationSchedule(this.assetId);
        } catch {
            this.depreciation = null;
        }
    }

    private async loadIntelligence(): Promise<void> {
        try {
            this.intelligence = await this.assetApi.getAssetIntelligence(this.assetId);
        } catch {
            this.intelligence = null;
        }
    }

    private async loadCategoryAttributes(): Promise<void> {
        if (!this.asset?.category_id) {
            this.attributes = [];
            return;
        }
        try {
            this.attributes = await this.masterApi.getAttributeSchema(this.asset.category_id);
        } catch {
            this.attributes = [];
        }
    }

    attributeValue(attr: CategoryAttributeDef): unknown {
        return this.asset?.asset_metadata?.[attr.attr_key];
    }

    private async loadLinkedApplications(): Promise<void> {
        try {
            this.linkedApplications = await this.applicationApi.getForAsset(this.assetId);
        } catch {
            this.linkedApplications = [];
        }
        await this.loadLinkedEaElements();
    }

    private async loadLinkedEaElements(): Promise<void> {
        try {
            const perAppCapabilities = await Promise.all(
                this.linkedApplications.map(app => this.applicationApi.getCapabilities(app.application_id)),
            );
            const seen = new Map<string, LinkedEaElement>();
            for (const capabilities of perAppCapabilities as ApplicationCapabilityLink[][]) {
                for (const cap of capabilities) {
                    seen.set(cap.capability_id, { id: cap.capability_id, name: cap.name });
                }
            }
            this.linkedEaElements = [...seen.values()];
        } catch {
            this.linkedEaElements = [];
        }
    }

    private async loadLinkedProjects(): Promise<void> {
        try {
            this.linkedProjects = await this.projectApi.getForAsset(this.assetId);
        } catch {
            this.linkedProjects = [];
        }
    }

    async runImpactAnalysis(): Promise<void> {
        this.impactLoading = true;
        try {
            this.impact = await this.assetApi.getImpactAnalysis(this.assetId);
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.impactLoading = false;
        }
    }

    async markRetired(): Promise<void> {
        if (!this.asset) return;
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('assetIntelligence.financials.markRetired'),
            this.translate.instant('assetIntelligence.financials.title'),
            '',
            true,
        );
        if (!confirmed) return;
        try {
            this.asset = await this.assetApi.retireAsset(this.assetId);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    printLabel(): void {
        if (!this.barcodeUrl || !this.asset) return;
        const win = window.open('', '_blank', 'width=420,height=320');
        if (!win) return;
        win.document.write(`
            <html>
                <head><title>${this.asset.asset_tag}</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 24px; }
                    img { max-width: 100%; }
                    h2 { margin: 12px 0 0; }
                </style>
                </head>
                <body onload="window.print()">
                    <img src="${this.barcodeUrl}" alt="${this.asset.asset_tag}" />
                    <h2>${this.asset.asset_tag}</h2>
                    <p>${this.asset.name}</p>
                </body>
            </html>
        `);
        win.document.close();
    }
}
