import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DataTable } from '@nfinyx/data-table';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { ContractAnalyzerToolbarComponent } from '../../components/contract-analyzer-toolbar/contract-analyzer-toolbar';
import { ContractAnalyzerApiService } from '../../services/contract-analyzer-api.service';
import { ContractSummary, PaginationMeta } from '../../models/contract-analyzer.models';
import { buildContractColDefs } from '../../utils/contract-columns';

@Component({
    selector: 'lib-contract-analyzer-my-contracts',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DataTable,
        PageHeaderComponent,
        ContractAnalyzerToolbarComponent,
    ],
    templateUrl: './my-contracts.html',
})
export class MyContractsPage implements OnInit, OnDestroy {
    private readonly api = inject(ContractAnalyzerApiService);
    private readonly router = inject(Router);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    contracts: ContractSummary[] = [];
    pagination: PaginationMeta | null = null;
    page = 1;
    loading = false;
    colDefs: ColDef[] = [];

    search = '';
    riskLevel = '';
    classification = '';
    reviewStatus = '';
    dateFrom = '';
    dateTo = '';

    riskOptions: { label: string; value: string }[] = [];
    classificationOptions: { label: string; value: string }[] = [];
    reviewStatusOptions: { label: string; value: string }[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => {
            this.buildFilterOptions();
            this.rebuildColDefs();
        });
        this.buildFilterOptions();
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        await this.runSearch();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private buildFilterOptions(): void {
        const t = (k: string) => this.translate.instant(k);
        this.riskOptions = [
            { label: t('contractAnalyzer.filters.anyRisk'), value: '' },
            { label: t('contractAnalyzer.risk.low'), value: 'low' },
            { label: t('contractAnalyzer.risk.medium'), value: 'medium' },
            { label: t('contractAnalyzer.risk.high'), value: 'high' },
            { label: t('contractAnalyzer.risk.critical'), value: 'critical' },
        ];
        this.classificationOptions = [
            { label: t('contractAnalyzer.filters.anyClassification'), value: '' },
            { label: t('contractAnalyzer.classification.Confidential'), value: 'Confidential' },
            { label: t('contractAnalyzer.classification.Critical'), value: 'Critical' },
            { label: t('contractAnalyzer.classification.PublicCopy'), value: 'Public Copy' },
            { label: t('contractAnalyzer.classification.ControlledCopy'), value: 'Controlled Copy' },
            { label: t('contractAnalyzer.classification.Internal'), value: 'Internal' },
        ];
        this.reviewStatusOptions = [
            { label: t('contractAnalyzer.filters.anyReviewStatus'), value: '' },
            { label: t('contractAnalyzer.reviewStatus.needs_review'), value: 'needs_review' },
            { label: t('contractAnalyzer.reviewStatus.approved'), value: 'approved' },
            { label: t('contractAnalyzer.reviewStatus.rejected'), value: 'rejected' },
        ];
    }

    private rebuildColDefs(): void {
        this.colDefs = buildContractColDefs(key => this.translate.instant(key), row => this.deleteContract(row));
    }

    async runSearch(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.listContracts({
                q: this.search || undefined,
                overallRiskLevel: this.riskLevel || undefined,
                classification: this.classification || undefined,
                reviewStatus: this.reviewStatus || undefined,
                dateFrom: this.dateFrom || undefined,
                dateTo: this.dateTo || undefined,
                page: this.page,
                pageSize: 20,
            });
            this.contracts = res.items;
            this.pagination = res.pagination;
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.loadContractsFailed'));
        } finally {
            this.loading = false;
        }
    }

    applyFilters(): void {
        this.page = 1;
        this.runSearch();
    }

    goToPage(delta: number): void {
        this.page = Math.max(1, this.page + delta);
        this.runSearch();
    }

    openContract(row: unknown): void {
        const contract = row as ContractSummary;
        this.router.navigateByUrl(`/contract-analyzer/contracts/${contract.id}`);
    }

    async deleteContract(contract: ContractSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('contractAnalyzer.confirm.deleteContract', { filename: contract.filename }),
            this.translate.instant('contractAnalyzer.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteContract(contract.id);
            this.common.showSuccessMessage(this.translate.instant('contractAnalyzer.toast.contractDeleted'));
            await this.runSearch();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.deleteFailed'));
        }
    }
}
