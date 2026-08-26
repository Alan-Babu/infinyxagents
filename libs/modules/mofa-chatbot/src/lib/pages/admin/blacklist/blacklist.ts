import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { BlacklistTerm, BlacklistTestResult } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';
import { buildBlacklistColDefs } from '../../../utils/blacklist-columns';

@Component({
    selector: 'lib-admin-blacklist',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DataTable, ButtonModule, InputTextModule, SelectModule, TagModule],
    templateUrl: './blacklist.html',
})
export class AdminBlacklistPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly auth = inject(AuthService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    terms: BlacklistTerm[] = [];
    colDefs: ColDef[] = [];

    newTerm = '';
    newTermType: 'contains' | 'exact' | 'regex' = 'contains';
    newTermCategory = '';

    testText = '';
    testResult: BlacklistTestResult | null = null;

    readonly typeOptions = [
        { label: this.translate.instant('mofaChatbot.admin.blacklist.typeContains'), value: 'contains' },
        { label: this.translate.instant('mofaChatbot.admin.blacklist.typeExact'), value: 'exact' },
        { label: this.translate.instant('mofaChatbot.admin.blacklist.typeRegex'), value: 'regex' },
    ];

    constructor() {
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        await this.load();
    }

    private rebuildColDefs(): void {
        this.colDefs = buildBlacklistColDefs(
            key => this.translate.instant(key),
            term => this.toggleTermActive(term),
            term => this.removeTerm(term),
        );
    }

    async load(): Promise<void> {
        this.loading = true;
        try {
            this.terms = await this.api.listBlacklistTerms();
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async addTerm(): Promise<void> {
        if (!this.newTerm.trim()) return;
        try {
            const created = await this.api.createBlacklistTerm(this.newTerm.trim(), this.newTermType, this.newTermCategory.trim() || 'general', this.auth.user()?.displayName || '');
            this.terms = [created, ...this.terms];
            this.newTerm = '';
            this.common.showSuccessMessage(this.translate.instant('mofaChatbot.admin.blacklist.added'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.blacklist.addFailed'));
        }
    }

    async toggleTermActive(term: BlacklistTerm): Promise<void> {
        try {
            const updated = await this.api.updateBlacklistTerm(term.id, !term.is_active);
            this.terms = this.terms.map(t => (t.id === updated.id ? updated : t));
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async removeTerm(term: BlacklistTerm): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('mofaChatbot.admin.blacklist.deleteConfirm', { term: term.term }),
            this.translate.instant('mofaChatbot.admin.blacklist.deleteConfirmHeader'),
            '',
            true,
        );
        if (!confirmed) return;
        try {
            await this.api.deleteBlacklistTerm(term.id);
            this.terms = this.terms.filter(t => t.id !== term.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async runBlacklistTest(): Promise<void> {
        if (!this.testText.trim()) return;
        try {
            this.testResult = await this.api.testBlacklist(this.testText.trim());
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
