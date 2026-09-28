import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService, CommonService, mergeModuleTranslations } from '@nfinyx/services';
import { ApiError } from '@nfinyx/types';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import * as en from './i18n/en.json';
import * as ar from './i18n/ar.json';
import { LlmSettingsApi } from './llm-settings-api';
import { LlmProvider, LlmSettingsResponse, LlmSettingsUpdate, LlmTestResult } from './llm-settings.models';

interface Draft {
    provider: LlmProvider;
    baseUrl: string;
    model: string;
    apiKey: string;
    enabled: boolean;
    timeoutSeconds: number;
    maxTokens: number;
    vllmExtras: boolean;
}

/**
 * Model settings for one agent: provider, endpoint, model and key, with "Test connection". Route it with
 * `data: { agentId }` (the admin guard reads the same value) and `providers: provideLlmSettings('<service path>')`.
 * The backend (nfinyx_agent_toolkit.llm.admin) is the real gate; the admin check here only hides the form.
 */
@Component({
    selector: 'lib-llm-settings',
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
    templateUrl: './llm-settings.html',
})
export class LlmSettingsPage implements OnInit {
    private readonly api = inject(LlmSettingsApi);
    private readonly auth = inject(AuthService);
    private readonly common = inject(CommonService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly agentId = inject(ActivatedRoute).snapshot.data['agentId'] as string | undefined;

    readonly isAdmin = computed(() => (this.agentId ? this.auth.isAgentAdmin(this.agentId) : this.auth.isAdmin()));

    settings: LlmSettingsResponse | null = null;
    draft: Draft = this.emptyDraft();
    private baseline: Draft = this.emptyDraft();
    fieldErrors: Record<string, string> = {};
    loading = false;
    loadFailed = false;
    saving = false;
    testing = false;
    testResult: LlmTestResult | null = null;

    constructor() {
        mergeModuleTranslations(this.translate, { en, ar });
    }

    async ngOnInit(): Promise<void> {
        if (this.isAdmin()) await this.load();
    }

    get providerOptions(): { label: string; value: LlmProvider }[] {
        return (this.settings?.providers ?? ['openai_compatible', 'anthropic']).map(value => ({
            value,
            label: this.translate.instant(`llmSettings.providers.${value}`),
        }));
    }

    get editable(): boolean {
        return this.settings?.editable ?? false;
    }

    get isAnthropic(): boolean {
        return this.draft.provider === 'anthropic';
    }

    get baseUrlPlaceholderKey(): string {
        return this.isAnthropic ? 'llmSettings.placeholders.baseUrlAnthropic' : 'llmSettings.placeholders.baseUrlOpenai';
    }

    get modelPlaceholderKey(): string {
        return this.isAnthropic ? 'llmSettings.placeholders.modelAnthropic' : 'llmSettings.placeholders.modelOpenai';
    }

    get hasChanges(): boolean {
        return Object.keys(this.changes()).length > 0;
    }

    get keyHint(): string {
        const config = this.settings?.config;
        return config?.api_key_set
            ? `${this.translate.instant('llmSettings.fields.apiKeyCurrent')}: ${config.api_key_hint ?? '••••'}`
            : this.translate.instant('llmSettings.fields.apiKeyNone');
    }

    async load(): Promise<void> {
        this.loading = true;
        this.loadFailed = false;
        try {
            this.apply(await this.api.load());
        } catch (err) {
            this.loadFailed = true;
            this.toastr.error(this.errorMessage(err, 'llmSettings.toast.loadFailed'));
        } finally {
            this.loading = false;
        }
    }

    clearError(field: string): void {
        delete this.fieldErrors[field];
        this.testResult = null;
    }

    discard(): void {
        this.draft = { ...this.baseline };
        this.fieldErrors = {};
        this.testResult = null;
    }

    async save(): Promise<void> {
        const update = this.changes();
        if (!Object.keys(update).length || this.saving || !this.editable) return;

        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('llmSettings.confirm.saveMessage'),
            this.translate.instant('llmSettings.confirm.saveHeader'),
            this.translate.instant('llmSettings.confirm.saveWarning'),
        );
        if (!confirmed) return;

        this.saving = true;
        this.fieldErrors = {};
        try {
            this.apply(await this.api.update(update));
            this.toastr.success(this.translate.instant('llmSettings.toast.saved'));
        } catch (err) {
            this.handleSaveError(err);
        } finally {
            this.saving = false;
        }
    }

    async resetToDefaults(): Promise<void> {
        if (this.saving || !this.editable) return;
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('llmSettings.confirm.resetMessage'),
            this.translate.instant('llmSettings.confirm.resetHeader'),
        );
        if (!confirmed) return;
        this.saving = true;
        try {
            this.apply(await this.api.reset());
            this.toastr.success(this.translate.instant('llmSettings.toast.reset'));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'llmSettings.toast.saveFailed'));
        } finally {
            this.saving = false;
        }
    }

    /** Tests the form as it stands (saved or not); a blank key means the saved one. */
    async test(): Promise<void> {
        if (this.testing) return;
        this.testing = true;
        this.testResult = null;
        this.fieldErrors = {};
        try {
            this.testResult = await this.api.test(this.formValues());
        } catch (err) {
            this.handleSaveError(err);
        } finally {
            this.testing = false;
        }
    }

    testMessage(result: LlmTestResult): string {
        return result.ok
            ? this.translate.instant('llmSettings.test.ok', { model: result.model ?? this.draft.model, ms: result.latency_ms ?? 0 })
            : this.translate.instant('llmSettings.test.failed', { error: result.error ?? '' });
    }

    private apply(res: LlmSettingsResponse): void {
        this.settings = res;
        const c = res.config;
        this.baseline = {
            provider: c.provider,
            baseUrl: c.base_url ?? '',
            model: c.model ?? '',
            apiKey: '',
            enabled: c.enabled,
            timeoutSeconds: c.timeout_seconds,
            maxTokens: c.max_tokens,
            vllmExtras: c.vllm_extras,
        };
        this.draft = { ...this.baseline };
        this.testResult = null;
    }

    /** Everything in the form, for a connection test. Blank text fields are omitted so the saved value is used. */
    private formValues(): LlmSettingsUpdate {
        const d = this.draft;
        const values: LlmSettingsUpdate = { provider: d.provider, base_url: d.baseUrl.trim() };
        if (d.model.trim()) values.model = d.model.trim();
        if (d.apiKey.trim()) values.api_key = d.apiKey.trim();
        return values;
    }

    /** Only the fields that differ from what the server has; the key only when one was typed. */
    private changes(): LlmSettingsUpdate {
        const d = this.draft;
        const b = this.baseline;
        const update: LlmSettingsUpdate = {};
        if (d.provider !== b.provider) update.provider = d.provider;
        if (d.baseUrl.trim() !== b.baseUrl) update.base_url = d.baseUrl.trim();
        if (d.model.trim() !== b.model) update.model = d.model.trim();
        if (d.apiKey.trim()) update.api_key = d.apiKey.trim();
        if (d.enabled !== b.enabled) update.enabled = d.enabled;
        if (Number(d.timeoutSeconds) !== b.timeoutSeconds) update.timeout_seconds = Number(d.timeoutSeconds);
        if (Number(d.maxTokens) !== b.maxTokens) update.max_tokens = Number(d.maxTokens);
        if (d.vllmExtras !== b.vllmExtras) update.vllm_extras = d.vllmExtras;
        return update;
    }

    private emptyDraft(): Draft {
        return {
            provider: 'openai_compatible', baseUrl: '', model: '', apiKey: '',
            enabled: true, timeoutSeconds: 300, maxTokens: 2048, vllmExtras: false,
        };
    }

    private handleSaveError(err: unknown): void {
        const apiError = err instanceof ApiError ? err : null;
        if (apiError?.status === 422 && apiError.body?.errors?.length) {
            for (const e of apiError.body.errors) {
                if (e.field) this.fieldErrors[e.field] = e.msg;
            }
            this.toastr.error(this.translate.instant('llmSettings.toast.invalid'));
        } else if (apiError?.status === 401 || apiError?.status === 403) {
            this.toastr.error(this.translate.instant('llmSettings.toast.notAuthorised'));
        } else {
            this.toastr.error(this.errorMessage(err, 'llmSettings.toast.saveFailed'));
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            return this.translate.instant('llmSettings.toast.notAuthorised');
        }
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
