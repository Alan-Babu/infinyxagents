import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DepartmentBarChartComponent, DepartmentBarSeries } from '../../components/department-bar-chart/department-bar-chart';
import { CostByDepartmentRow, DepreciationSummary, UtilizationHeatmapGroup } from '../../models/reports.models';
import { AssetApiService } from '../../services/asset-api.service';
import { buildCostByDepartmentColDefs, buildDepreciationByDepartmentColDefs } from '../../utils/reports-columns';
import { utilizationBadgeClass } from '../../utils/asset-display';

@Component({
    selector: 'lib-reports',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, StatCardComponent, PageHeaderComponent, ButtonModule, TooltipModule, DepartmentBarChartComponent],
    templateUrl: './reports.html',
})
export class ReportsPage implements OnInit {
    private readonly api = inject(AssetApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly router = inject(Router);

    loading = false;
    errorMessage = '';

    summary: DepreciationSummary | null = null;
    costByDepartment: CostByDepartmentRow[] = [];
    heatmap: UtilizationHeatmapGroup[] = [];

    depreciationColDefs: ColDef[] = [];
    costColDefs: ColDef[] = [];
    chartSeries: DepartmentBarSeries[] = [];

    downloadingDepreciation = false;
    downloadingCost = false;

    readonly utilizationBadgeClass = utilizationBadgeClass;

    async ngOnInit(): Promise<void> {
        this.rebuildColDefs();
        await this.refresh();
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);
        this.depreciationColDefs = buildDepreciationByDepartmentColDefs(t);
        this.costColDefs = buildCostByDepartmentColDefs(t);
        this.chartSeries = [
            { key: 'cost', name: t('assetIntelligence.reports.originalCost'), color: '#9CA3AF' },
            { key: 'book_value', name: t('assetIntelligence.reports.bookValue'), color: '#0F99C7' },
        ];
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const [summary, costByDepartment, heatmap] = await Promise.all([
                this.api.getDepreciationSummary(),
                this.api.getCostByDepartment(),
                this.api.getUtilizationHeatmap(),
            ]);
            this.summary = summary;
            this.costByDepartment = costByDepartment;
            this.heatmap = heatmap;
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    async downloadDepreciationCsv(): Promise<void> {
        this.downloadingDepreciation = true;
        try {
            const blob = await this.api.downloadDepreciationCsv();
            this.saveBlob(blob, 'depreciation.csv');
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.downloadingDepreciation = false;
        }
    }

    async downloadCostByDepartmentCsv(): Promise<void> {
        this.downloadingCost = true;
        try {
            const blob = await this.api.downloadCostByDepartmentCsv();
            this.saveBlob(blob, 'cost-by-department.csv');
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.downloadingCost = false;
        }
    }

    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    goToAsset(assetId: string): void {
        this.router.navigate(['/asset-intelligence/assets', assetId]);
    }
}
