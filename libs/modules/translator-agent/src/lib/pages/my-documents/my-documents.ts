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
import { TranslatorToolbarComponent } from '../../components/translator-toolbar/translator-toolbar';
import { TranslatorApiService } from '../../services/translator-api.service';
import { DocumentSummary, PaginationMeta } from '../../models/translator.models';
import { buildDocumentColDefs } from '../../utils/translator-columns';

@Component({
    selector: 'lib-translator-my-documents',
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
        TranslatorToolbarComponent,
    ],
    templateUrl: './my-documents.html',
})
export class MyDocumentsPage implements OnInit, OnDestroy {
    private readonly api = inject(TranslatorApiService);
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
            { label: t('translatorAgent.filters.anyStatus'), value: '' },
            { label: t('translatorAgent.status.Valid'), value: 'Valid' },
            { label: t('translatorAgent.status.Expired'), value: 'Expired' },
            { label: t('translatorAgent.status.NoExpiry'), value: 'No Expiry' },
            { label: t('translatorAgent.status.Unknown'), value: 'Unknown' },
        ];
        this.riskOptions = [
            { label: t('translatorAgent.filters.anyRisk'), value: '' },
            { label: t('translatorAgent.risk.low'), value: 'low' },
            { label: t('translatorAgent.risk.medium'), value: 'medium' },
            { label: t('translatorAgent.risk.high'), value: 'high' },
        ];
        this.categoryOptions = [
            { label: t('translatorAgent.filters.anyCategory'), value: '' },
            { label: t('translatorAgent.category.Individual'), value: 'Individual' },
            { label: t('translatorAgent.category.Commercial'), value: 'Commercial' },
        ];
        this.classificationOptions = [
            { label: t('translatorAgent.filters.anyClassification'), value: '' },
            { label: t('translatorAgent.classification.Confidential'), value: 'Confidential' },
            { label: t('translatorAgent.classification.Critical'), value: 'Critical' },
            { label: t('translatorAgent.classification.PublicCopy'), value: 'Public Copy' },
            { label: t('translatorAgent.classification.ControlledCopy'), value: 'Controlled Copy' },
            { label: t('translatorAgent.classification.Internal'), value: 'Internal' },
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
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.loadDocumentsFailed'));
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
        this.router.navigateByUrl(`/translator-agent/documents/${doc.id}`);
    }

    async deleteDocument(doc: DocumentSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('translatorAgent.confirm.deleteDocument', { filename: doc.filename }),
            this.translate.instant('translatorAgent.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteDocument(doc.id);
            this.toastr.success(this.translate.instant('translatorAgent.toast.documentDeleted'));
            await this.runSearch();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.deleteFailed'));
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
