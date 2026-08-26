import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { NoData } from '@nfinyx/no-data';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { KBDocument, KBVersion, SimulateResult } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';

const STATUS_SEVERITY: Record<KBVersion['status'], 'success' | 'info' | 'secondary' | 'warn'> = {
    draft: 'secondary',
    simulating: 'info',
    published: 'success',
    archived: 'warn',
};

@Component({
    selector: 'lib-admin-kb',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, SelectModule, TagModule, NoData],
    templateUrl: './kb.html',
})
export class AdminKbPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly auth = inject(AuthService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    versions: KBVersion[] = [];
    newVersionLabel = '';
    newVersionNotes = '';

    activeVersion: KBVersion | null = null;
    activeVersionDocs: KBDocument[] = [];

    simulateQuestion = '';
    simulateLanguage: 'en' | 'ar' = 'en';
    simulating = false;
    simulateResult: SimulateResult | null = null;

    readonly languageOptions = [
        { label: this.translate.instant('mofaChatbot.admin.common.languageEn'), value: 'en' },
        { label: this.translate.instant('mofaChatbot.admin.common.languageAr'), value: 'ar' },
    ];

    async ngOnInit(): Promise<void> {
        await this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        try {
            this.versions = await this.api.listKBVersions();
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    statusSeverity(status: KBVersion['status']): 'success' | 'info' | 'secondary' | 'warn' {
        return STATUS_SEVERITY[status];
    }

    statusLabel(status: KBVersion['status']): string {
        return this.translate.instant(`mofaChatbot.admin.kb.status.${status}`);
    }

    async createVersion(): Promise<void> {
        if (!this.newVersionLabel.trim()) return;
        try {
            const created = await this.api.createKBVersion(this.newVersionLabel.trim(), this.newVersionNotes.trim(), this.auth.user()?.displayName || '');
            this.versions = [created, ...this.versions];
            this.newVersionLabel = '';
            this.newVersionNotes = '';
            await this.openVersion(created);
            this.common.showSuccessMessage(this.translate.instant('mofaChatbot.admin.kb.versionCreated'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.kb.createFailed'));
        }
    }

    async openVersion(version: KBVersion): Promise<void> {
        this.activeVersion = version;
        this.simulateResult = null;
        try {
            this.activeVersionDocs = await this.api.listKBDocuments(version.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    closeVersion(): void {
        this.activeVersion = null;
        this.activeVersionDocs = [];
    }

    async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file || !this.activeVersion) return;
        try {
            await this.api.uploadKBDocument(this.activeVersion.id, file);
            this.common.showSuccessMessage(this.translate.instant('mofaChatbot.admin.kb.uploaded', { name: file.name }));
            this.activeVersionDocs = await this.api.listKBDocuments(this.activeVersion.id);
            const refreshed = await this.api.getKBVersion(this.activeVersion.id);
            this.activeVersion = refreshed;
            this.versions = this.versions.map(v => (v.id === refreshed.id ? refreshed : v));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.kb.uploadFailed'));
        }
    }

    async runSimulation(): Promise<void> {
        if (!this.activeVersion || !this.simulateQuestion.trim()) return;
        this.simulating = true;
        this.simulateResult = null;
        try {
            this.simulateResult = await this.api.simulateKBVersion(this.activeVersion.id, this.simulateQuestion.trim(), this.simulateLanguage);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.kb.simulationFailed'));
        } finally {
            this.simulating = false;
        }
    }

    async publishVersion(): Promise<void> {
        if (!this.activeVersion) return;
        try {
            const published = await this.api.publishKBVersion(this.activeVersion.id, this.auth.user()?.displayName || '');
            this.activeVersion = published;
            this.common.showSuccessMessage(this.translate.instant('mofaChatbot.admin.kb.published2', { label: published.label }));
            await this.load();
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('mofaChatbot.admin.kb.publishFailed'));
        }
    }

    fmtDateTime(iso: string | null): string {
        if (!iso) return this.translate.instant('mofaChatbot.admin.common.dash');
        return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    fmtSize(bytes: number): string {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
}
