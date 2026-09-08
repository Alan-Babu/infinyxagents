import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { NoData } from '@nfinyx/no-data';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ButtonModule } from 'primeng/button';
import { CapabilityNodeComponent } from '../../components/capability-node/capability-node';
import { CapabilityNode } from '../../models/ea.models';
import { EaApiService } from '../../services/ea-api.service';

@Component({
    selector: 'lib-capability-map',
    standalone: true,
    imports: [CommonModule, TranslateModule, PageHeaderComponent, ButtonModule, NoData, CapabilityNodeComponent],
    templateUrl: './capability-map.html',
})
export class CapabilityMapPage implements OnInit {
    private readonly api = inject(EaApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly router = inject(Router);

    loading = false;
    errorMessage = '';
    capabilities: CapabilityNode[] = [];

    async ngOnInit(): Promise<void> {
        await this.refresh();
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            this.capabilities = await this.api.getCapabilityMap();
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    goToEaModeler(): void {
        this.router.navigate(['/asset-intelligence/ea-modeler']);
    }
}
