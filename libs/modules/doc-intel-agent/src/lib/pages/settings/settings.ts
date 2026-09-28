import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService, CommonService } from '@nfinyx/services';
import { ApiError } from '@nfinyx/types';
import { LlmProvider, LlmTestResult } from '@nfinyx/llm-settings';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { DocIntelApiService } from '../../services/doc-intel-api.service';
import { DocIntelSettingField, DocIntelSettingsGroup } from '../../models/doc-intel.models';

type DraftValue = string | number | boolean | null;

@Component({
    selector: 'lib-doc-intel-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        SelectModule,
        PageHeaderComponent,
    ],
    templateUrl: './settings.html',
})
export class SettingsPage implements OnInit {
    private readonly api = inject(DocIntelApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    /** The route guard already keeps non-admins out; this is the in-page second line, and the backend is the real one. */
    private readonly auth = inject(AuthService);
    readonly isAdmin = computed(() => this.auth.isAgentAdmin('doc-intel-agent'));

    groups: DocIntelSettingsGroup[] = [];
    envFile = '';
    loading = false;
    saving = false;
    loadFailed = false;

    /** What the inputs are bound to, by env key. Secrets start blank (blank = keep the current value). */
    draft: Record<string, DraftValue> = {};
    private baseline: Record<string, DraftValue> = {};
    fieldErrors: Record<string, string> = {};

    /** Outcome of the last save, shown as a banner. */
    restartRequiredLabels: string[] = [];
    ineffectiveLabels: string[] = [];

    /** "Test connection" for the model group. */
    testing = false;
    testResult: LlmTestResult | null = null;

    async ngOnInit(): Promise<void> {
        if (this.isAdmin()) await this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        this.loadFailed = false;
        try {
            this.applyResponse(await this.api.getSettings());
        } catch (err) {
            this.loadFailed = true;
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.settings.toast.loadFailed'));
        } finally {
            this.loading = false;
        }
    }

    get dirtyFields(): DocIntelSettingField[] {
        return this.allFields().filter(f => this.isDirty(f));
    }

    get hasChanges(): boolean {
        return this.dirtyFields.length > 0;
    }

    isDirty(field: DocIntelSettingField): boolean {
        return this.draft[field.key] !== this.baseline[field.key];
    }

    reset(): void {
        this.draft = { ...this.baseline };
        this.fieldErrors = {};
    }

    clearError(key: string): void {
        delete this.fieldErrors[key];
    }

    async save(): Promise<void> {
        const changed = this.dirtyFields;
        if (!changed.length || this.saving) return;

        if (changed.some(f => f.is_secret || f.restart_required)) {
            const confirmed = await this.common.showConfirmationDialog(
                this.translate.instant('docIntelAgent.settings.confirm.message'),
                this.translate.instant('docIntelAgent.settings.confirm.header'),
                this.translate.instant('docIntelAgent.settings.confirm.warning'),
            );
            if (!confirmed) return;
        }

        const values: Record<string, string | number | boolean | null> = {};
        for (const f of changed) values[f.key] = this.draft[f.key];

        this.saving = true;
        this.fieldErrors = {};
        try {
            const result = await this.api.updateSettings(values);
            this.applyResponse(result);
            this.restartRequiredLabels = this.labelsFor(result.restart_required_keys);
            this.ineffectiveLabels = this.labelsFor(result.ineffective_keys);
            this.toastr.success(this.translate.instant('docIntelAgent.settings.toast.saved'));
        } catch (err) {
            this.handleSaveError(err);
        } finally {
            this.saving = false;
        }
    }

    isWide(field: DocIntelSettingField): boolean {
        return field.type === 'url' || field.type === 'dsn' || field.type === 'list';
    }

    /** Select options for a field with a fixed set of values; provider names get a readable label. */
    optionsFor(field: DocIntelSettingField): { label: string; value: string }[] {
        return (field.choices ?? []).map(value => {
            const key = `docIntelAgent.settings.providers.${value}`;
            const label = this.translate.instant(key);
            return { value, label: label === key ? value : label };
        });
    }

    /**
     * Tests the model group as the form stands (saved or not). The provider, endpoint and model are sent as typed; a blank
     * key is left out so the backend tests with the saved one.
     */
    async testModel(): Promise<void> {
        if (this.testing) return;
        this.testing = true;
        this.testResult = null;
        try {
            const provider = String(this.draft['QWEN_PROVIDER'] ?? '');
            const model = String(this.draft['QWEN_MODEL'] ?? '').trim();
            const apiKey = String(this.draft['QWEN_API_KEY'] ?? '').trim();
            this.testResult = await this.api.testModel({
                ...(provider ? { provider: provider as LlmProvider } : {}),
                base_url: String(this.draft['QWEN_API_BASE'] ?? '').trim(),
                ...(model ? { model } : {}),
                ...(apiKey ? { api_key: apiKey } : {}),
            });
        } catch (err) {
            this.handleSaveError(err);
        } finally {
            this.testing = false;
        }
    }

    testMessage(result: LlmTestResult): string {
        return result.ok
            ? this.translate.instant('docIntelAgent.settings.test.ok', { model: result.model ?? '', ms: result.latency_ms ?? 0 })
            : this.translate.instant('docIntelAgent.settings.test.failed', { error: result.error ?? '' });
    }

    private applyResponse(res: { groups: DocIntelSettingsGroup[]; env_file: string }): void {
        this.groups = res.groups;
        this.envFile = res.env_file;
        this.baseline = {};
        for (const f of this.allFields()) this.baseline[f.key] = this.toDraft(f);
        this.draft = { ...this.baseline };
    }

    private toDraft(field: DocIntelSettingField): DraftValue {
        if (field.is_secret) return '';
        if (Array.isArray(field.value)) return field.value.join(', ');
        return field.value as DraftValue;
    }

    private allFields(): DocIntelSettingField[] {
        return this.groups.flatMap(g => g.fields);
    }

    private labelsFor(keys: string[]): string[] {
        const byKey = new Map(this.allFields().map(f => [f.key, f.label]));
        return keys.map(k => byKey.get(k) ?? k);
    }

    private handleSaveError(err: unknown): void {
        const apiError = err instanceof ApiError ? err : null;
        if (apiError?.status === 422 && apiError.body?.errors?.length) {
            for (const e of apiError.body.errors) {
                if (e.field) this.fieldErrors[e.field] = e.msg;
            }
            this.toastr.error(this.translate.instant('docIntelAgent.settings.toast.invalid'));
        } else if (apiError?.status === 401 || apiError?.status === 403) {
            this.toastr.error(this.translate.instant('docIntelAgent.settings.toast.notAuthorised'));
        } else {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.settings.toast.saveFailed'));
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            return this.translate.instant('docIntelAgent.settings.toast.notAuthorised');
        }
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
