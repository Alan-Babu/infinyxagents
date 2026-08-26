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
import { EmailComposeToolbarComponent } from '../../components/email-compose-toolbar/email-compose-toolbar';
import { EmailComposeApiService } from '../../services/email-compose-api.service';
import { EmailSummary, PaginationMeta } from '../../models/email-compose-agent.models';
import { buildEmailColDefs } from '../../utils/email-columns';

@Component({
    selector: 'lib-email-compose-my-emails',
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
        EmailComposeToolbarComponent,
    ],
    templateUrl: './my-emails.html',
})
export class MyEmailsPage implements OnInit, OnDestroy {
    private readonly api = inject(EmailComposeApiService);
    private readonly router = inject(Router);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    emails: EmailSummary[] = [];
    pagination: PaginationMeta | null = null;
    page = 1;
    loading = false;
    colDefs: ColDef[] = [];

    search = '';
    classification = '';
    mode = '';
    dateFrom = '';
    dateTo = '';

    classificationOptions: { label: string; value: string }[] = [];
    modeOptions: { label: string; value: string }[] = [];

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
            { label: t('emailComposeAgent.filters.anyClassification'), value: '' },
            { label: t('emailComposeAgent.classification.Confidential'), value: 'Confidential' },
            { label: t('emailComposeAgent.classification.Internal'), value: 'Internal' },
            { label: t('emailComposeAgent.classification.Public'), value: 'Public' },
        ];
        this.modeOptions = [
            { label: t('emailComposeAgent.filters.anyMode'), value: '' },
            { label: t('emailComposeAgent.common.mode.compose'), value: 'compose' },
            { label: t('emailComposeAgent.common.mode.reply'), value: 'reply' },
        ];
    }

    private rebuildColDefs(): void {
        this.colDefs = buildEmailColDefs(key => this.translate.instant(key), row => this.deleteEmail(row));
    }

    async runSearch(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.listEmails({
                q: this.search || undefined,
                classification: this.classification || undefined,
                mode: this.mode || undefined,
                dateFrom: this.dateFrom || undefined,
                dateTo: this.dateTo || undefined,
                page: this.page,
                pageSize: 20,
            });
            this.emails = res.items;
            this.pagination = res.pagination;
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.loadEmailsFailed'));
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

    openEmail(row: unknown): void {
        const email = row as EmailSummary;
        this.router.navigateByUrl(`/email-compose-agent/emails/${email.id}`);
    }

    async deleteEmail(email: EmailSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('emailComposeAgent.confirm.deleteEmail', { subject: email.subject || this.translate.instant('emailComposeAgent.common.noSubject') }),
            this.translate.instant('emailComposeAgent.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteEmail(email.id);
            this.common.showSuccessMessage(this.translate.instant('emailComposeAgent.toast.emailDeleted'));
            await this.runSearch();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.deleteFailed'));
        }
    }
}
