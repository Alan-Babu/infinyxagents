import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { AssetAlert } from '../../models/asset.models';
import { AssetApiService } from '../../services/asset-api.service';
import { buildAlertColDefs } from '../../utils/alert-columns';

@Component({
    selector: 'lib-alerts-center',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, PageHeaderComponent, ButtonModule],
    templateUrl: './alerts-center.html',
})
export class AlertsCenterPage implements OnInit, OnDestroy {
    private readonly api = inject(AssetApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    alerts: AssetAlert[] = [];
    loading = false;
    errorMessage = '';
    scanning = false;
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
        this.colDefs = buildAlertColDefs(
            key => this.translate.instant(key),
            id => this.resolveAlert(id),
        );
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            this.alerts = await this.api.listAlerts('OPEN');
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    async runScan(): Promise<void> {
        this.scanning = true;
        try {
            await this.api.runAlertScan();
            await this.refresh();
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.scanning = false;
        }
    }

    async resolveAlert(id: string): Promise<void> {
        try {
            await this.api.updateAlert(id, 'RESOLVED');
            await this.refresh();
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
