import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AssetAlert, PortfolioIntelligence } from '../../models/asset.models';
import { CostByDepartmentRow } from '../../models/reports.models';
import { AssetApiService } from '../../services/asset-api.service';
import { buildAlertColDefs } from '../../utils/alert-columns';

@Component({
    selector: 'lib-asset-intelligence-dashboard',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, StatCardComponent, PageHeaderComponent],
    templateUrl: './dashboard.html',
})
export class AssetIntelligenceDashboardPage implements OnInit, OnDestroy {
    private readonly api = inject(AssetApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly router = inject(Router);

    loading = false;
    errorMessage = '';
    portfolio: PortfolioIntelligence | null = null;
    topAlerts: AssetAlert[] = [];
    openAlertsCount = 0;
    criticalAlertsCount = 0;
    underutilizedCount = 0;
    overutilizedCount = 0;
    departmentalSpend = 0;
    colDefs: ColDef[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        await this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private rebuildColDefs(): void {
        this.colDefs = buildAlertColDefs(key => this.translate.instant(key));
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const [portfolio, alerts, underutilized, overutilized, spend] = await Promise.all([
                this.api.getPortfolioIntelligence(),
                this.api.listAlerts('OPEN'),
                this.api.getUnderutilized(),
                this.api.getOverutilized(),
                this.api.getCostByDepartment(),
            ]);
            this.portfolio = portfolio;
            this.openAlertsCount = alerts.length;
            this.criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL').length;
            this.topAlerts = [...alerts]
                .sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity))
                .slice(0, 8);
            this.underutilizedCount = underutilized.length;
            this.overutilizedCount = overutilized.length;
            this.departmentalSpend = (spend as CostByDepartmentRow[]).reduce((sum, row) => sum + (row.total_cost ?? 0), 0);
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    openAlert(row: unknown): void {
        const alert = row as AssetAlert;
        this.router.navigate(['/asset-intelligence/assets', alert.asset_id]);
    }

    private severityWeight(severity: AssetAlert['severity']): number {
        const weights: Record<AssetAlert['severity'], number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return weights[severity];
    }
}
