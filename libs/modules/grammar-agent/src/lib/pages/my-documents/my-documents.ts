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
import { GrammarToolbarComponent } from '../../components/grammar-toolbar/grammar-toolbar';
import { GrammarApiService } from '../../services/grammar-api.service';
import { DocumentSummary, PaginationMeta } from '../../models/grammar.models';
import { buildDocumentColDefs } from '../../utils/grammar-columns';

@Component({
    selector: 'lib-grammar-my-documents',
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
        GrammarToolbarComponent,
    ],
    templateUrl: './my-documents.html',
})
export class MyDocumentsPage implements OnInit, OnDestroy {
    private readonly api = inject(GrammarApiService);
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
    classification = '';
    reviewStatus = '';
    dateFrom = '';
    dateTo = '';

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
        this.classificationOptions = [
            { label: t('grammarAgent.filters.anyClassification'), value: '' },
            { label: t('grammarAgent.classification.Confidential'), value: 'Confidential' },
            { label: t('grammarAgent.classification.Internal'), value: 'Internal' },
            { label: t('grammarAgent.classification.Public'), value: 'Public' },
        ];
        this.reviewStatusOptions = [
            { label: t('grammarAgent.filters.anyReviewStatus'), value: '' },
            { label: t('grammarAgent.reviewStatus.auto_approved'), value: 'auto_approved' },
            { label: t('grammarAgent.reviewStatus.needs_review'), value: 'needs_review' },
            { label: t('grammarAgent.reviewStatus.approved'), value: 'approved' },
            { label: t('grammarAgent.reviewStatus.rejected'), value: 'rejected' },
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
                classification: this.classification || undefined,
                reviewStatus: this.reviewStatus || undefined,
                dateFrom: this.dateFrom || undefined,
                dateTo: this.dateTo || undefined,
                page: this.page,
                pageSize: 20,
            });
            this.documents = res.items;
            this.pagination = res.pagination;
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.loadDocumentsFailed'));
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
        this.router.navigateByUrl(`/grammar-agent/documents/${doc.id}`);
    }

    async deleteDocument(doc: DocumentSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('grammarAgent.confirm.deleteDocument', { filename: doc.filename }),
            this.translate.instant('grammarAgent.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteDocument(doc.id);
            this.toastr.success(this.translate.instant('grammarAgent.toast.documentDeleted'));
            await this.runSearch();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.deleteFailed'));
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
