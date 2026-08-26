import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DataTable } from '@nfinyx/data-table';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { DocIntelToolbarComponent } from '../../components/doc-intel-toolbar/doc-intel-toolbar';
import { DocIntelApiService } from '../../services/doc-intel-api.service';
import { DocumentSummary, PaginationMeta } from '../../models/doc-intel.models';
import { buildDocumentColDefs } from '../../utils/doc-intel-columns';

@Component({
    selector: 'lib-doc-intel-my-documents',
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
        DocIntelToolbarComponent,
    ],
    templateUrl: './my-documents.html',
})
export class MyDocumentsPage implements OnInit, OnDestroy {
    private readonly api = inject(DocIntelApiService);
    private readonly router = inject(Router);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    documents: DocumentSummary[] = [];
    pagination: PaginationMeta | null = null;
    page = 1;
    loading = false;
    colDefs: ColDef[] = [];

    search = '';
    status = '';
    riskLevel = '';
    category = '';
    classification = '';
    dateFrom = '';
    dateTo = '';

    statusOptions: { label: string; value: string }[] = [];
    riskOptions: { label: string; value: string }[] = [];
    categoryOptions: { label: string; value: string }[] = [];
    classificationOptions: { label: string; value: string }[] = [];

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
        this.statusOptions = [
            { label: t('docIntelAgent.filters.anyStatus'), value: '' },
            { label: t('docIntelAgent.status.Valid'), value: 'Valid' },
            { label: t('docIntelAgent.status.Expired'), value: 'Expired' },
            { label: t('docIntelAgent.status.NoExpiry'), value: 'No Expiry' },
            { label: t('docIntelAgent.status.Unknown'), value: 'Unknown' },
        ];
        this.riskOptions = [
            { label: t('docIntelAgent.filters.anyRisk'), value: '' },
            { label: t('docIntelAgent.risk.low'), value: 'low' },
            { label: t('docIntelAgent.risk.medium'), value: 'medium' },
            { label: t('docIntelAgent.risk.high'), value: 'high' },
        ];
        this.categoryOptions = [
            { label: t('docIntelAgent.filters.anyCategory'), value: '' },
            { label: t('docIntelAgent.category.Individual'), value: 'Individual' },
            { label: t('docIntelAgent.category.Commercial'), value: 'Commercial' },
        ];
        this.classificationOptions = [
            { label: t('docIntelAgent.filters.anyClassification'), value: '' },
            { label: t('docIntelAgent.classification.Confidential'), value: 'Confidential' },
            { label: t('docIntelAgent.classification.Critical'), value: 'Critical' },
            { label: t('docIntelAgent.classification.PublicCopy'), value: 'Public Copy' },
            { label: t('docIntelAgent.classification.ControlledCopy'), value: 'Controlled Copy' },
            { label: t('docIntelAgent.classification.Internal'), value: 'Internal' },
        ];
    }

    private rebuildColDefs(): void {
        this.colDefs = buildDocumentColDefs(key => this.translate.instant(key), row => this.deleteDocument(row));
    }

    async runSearch(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.listDocuments({
                q: this.search || undefined,
                status: this.status || undefined,
                riskLevel: this.riskLevel || undefined,
                category: this.category || undefined,
                classification: this.classification || undefined,
                dateFrom: this.dateFrom || undefined,
                dateTo: this.dateTo || undefined,
                page: this.page,
                pageSize: 20,
            });
            this.documents = res.items;
            this.pagination = res.pagination;
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.loadDocumentsFailed'));
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

    openDocument(row: unknown): void {
        const doc = row as DocumentSummary;
        this.router.navigateByUrl(`/doc-intel-agent/documents/${doc.id}`);
    }

    async deleteDocument(doc: DocumentSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('docIntelAgent.confirm.deleteDocument', { filename: doc.filename }),
            this.translate.instant('docIntelAgent.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteDocument(doc.id);
            this.toastr.success(this.translate.instant('docIntelAgent.toast.documentDeleted'));
            await this.runSearch();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.deleteFailed'));
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
