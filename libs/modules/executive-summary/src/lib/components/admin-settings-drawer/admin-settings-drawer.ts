import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@nfinyx/services';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import {
    ALL_FILE_TYPES,
    ALL_FRAMEWORKS,
    ALL_PROVIDERS,
    AdminSettingsResponse,
    AgentInstructionEntry,
    CreateMcpServerRequest,
    ErrorLogEntry,
    McpServerEntry,
    Provider,
    TrustedSourceEntry,
} from '../../models/executive-summary.models';

type MenuView =
    | 'menu'
    | 'guardrails'
    | 'external-models'
    | 'skills'
    | 'general'
    | 'logs'
    | 'retention'
    | 'moderation-model'
    | 'fallback-providers'
    | 'mcp-servers'
    | 'presenton'
    | 'web-search';

@Component({
    selector: 'lib-admin-settings-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, CheckboxModule, DrawerModule, InputTextModule, PasswordModule],
    templateUrl: './admin-settings-drawer.html',
})
export class AdminSettingsDrawerComponent implements OnChanges {
    private readonly api = inject(ExecSummaryApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    readonly auth = inject(AuthService);

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    loading = false;
    view: MenuView = 'menu';
    settings: AdminSettingsResponse | null = null;

    errorLogs: ErrorLogEntry[] = [];
    logsLoading = false;
    showResolvedOnly = false;
    expandedLogId: number | null = null;
    resolvingId: number | null = null;

    promptOptimizationEnabled = true;
    arabicEnabled = true;
    blacklistCategories: { name: string; termsText: string }[] = [];
    openaiKeyInput = '';
    anthropicKeyInput = '';
    qwenKeyInput = '';
    modelVersion = '';
    providerName = '';
    tokenRateLimit: number | null = null;
    allowedFileTypes: string[] = [...ALL_FILE_TYPES];
    enabledFrameworks: string[] = [...ALL_FRAMEWORKS];
    readonly allFileTypes = ALL_FILE_TYPES;
    readonly allFrameworks = ALL_FRAMEWORKS;
    readonly allProviders = ALL_PROVIDERS;
    saveStatus = '';

    errorLogRetentionDays: number | null = null;
    telemetryRetentionDays: number | null = null;
    moderationFlagRetentionDays: number | null = null;
    auditLogRetentionDays: number | null = null;
    deleteUserDataStatus = '';
    deletingUserData = false;

    modelModerationEnabled = true;
    modelModerationThreshold = 0.5;
    fallbackProviderOrder: Provider[] = [];

    presentonEnabled = false;
    presentonBaseUrl = '';
    presentonTemplateName = '';
    presentonApiKeyInput = '';

    webSearchEnabled = false;
    tavilyApiKeyInput = '';
    trustedSources: TrustedSourceEntry[] = [];
    trustedSourcesLoading = false;
    newSourceCategory = '';
    newSourceName = '';
    newSourceUrl = '';
    bulkImportText = '';
    bulkImporting = false;
    bulkImportStatus = '';

    mcpServers: McpServerEntry[] = [];
    mcpServersLoading = false;
    mcpServerStatus = '';
    newMcpServer: CreateMcpServerRequest = this.emptyMcpServer();

    instructionsUserId = '';
    instructions: AgentInstructionEntry[] = [];
    newName = '';
    newDescription = '';
    newInstructions = '';
    newDocumentation = '';
    newExecutableCode = '';
    newResources = '';

    ngOnChanges(): void {
        if (this.visible) {
            this.instructionsUserId ||= this.auth.user()?.id || '';
            this.view = 'menu';
            if (this.isAdmin) this.loadSettings();
        }
    }

    /** Every endpoint behind this drawer sits on the exec-agent admin router. */
    get isAdmin(): boolean {
        return this.auth.isAdmin();
    }

    get drawerTitle(): string {
        const titles: Record<MenuView, string> = {
            menu: this.translate.instant('executiveSummary.adminSettings.title'),
            guardrails: this.translate.instant('executiveSummary.adminSettings.guardrails'),
            'external-models': this.translate.instant('executiveSummary.adminSettings.externalModels'),
            skills: this.translate.instant('executiveSummary.adminSettings.skills'),
            general: this.translate.instant('executiveSummary.adminSettings.general'),
            logs: this.translate.instant('executiveSummary.adminSettings.logs'),
            retention: this.translate.instant('executiveSummary.adminSettings.retention'),
            'moderation-model': this.translate.instant('executiveSummary.adminSettings.modelModeration'),
            'fallback-providers': this.translate.instant('executiveSummary.adminSettings.fallbackProviders'),
            'mcp-servers': this.translate.instant('executiveSummary.adminSettings.mcpServers'),
            presenton: this.translate.instant('executiveSummary.adminSettings.presenton'),
            'web-search': this.translate.instant('executiveSummary.adminSettings.webSearch'),
        };
        return titles[this.view];
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    async loadSettings(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.getAdminSettings();
            this.settings = res;
            this.promptOptimizationEnabled = res.prompt_optimization_enabled;
            this.arabicEnabled = res.arabic_enabled;
            this.modelVersion = res.model_version || '';
            this.providerName = res.provider_name || '';
            this.tokenRateLimit = res.token_rate_limit_per_user ?? null;
            this.allowedFileTypes = res.allowed_file_types?.length ? [...res.allowed_file_types] : [...ALL_FILE_TYPES];
            this.enabledFrameworks = res.enabled_frameworks?.length ? [...res.enabled_frameworks] : [...ALL_FRAMEWORKS];
            this.blacklistCategories = Object.entries(res.blacklist_terms || {}).map(([name, terms]) => ({
                name,
                termsText: terms.join(', '),
            }));
            this.errorLogRetentionDays = res.error_log_retention_days ?? null;
            this.telemetryRetentionDays = res.telemetry_retention_days ?? null;
            this.moderationFlagRetentionDays = res.moderation_flag_retention_days ?? null;
            this.auditLogRetentionDays = res.audit_log_retention_days ?? null;
            this.modelModerationEnabled = res.model_moderation_enabled;
            this.modelModerationThreshold = res.model_moderation_threshold;
            this.fallbackProviderOrder = (res.fallback_provider_order || []) as Provider[];
            this.presentonEnabled = res.presenton_enabled;
            this.presentonBaseUrl = res.presenton_base_url || '';
            this.presentonTemplateName = res.presenton_template_name || '';
            this.webSearchEnabled = res.web_search_enabled;
        } finally {
            this.loading = false;
        }
    }

    addCategory(): void {
        this.blacklistCategories.push({ name: '', termsText: '' });
    }

    removeCategory(i: number): void {
        this.blacklistCategories.splice(i, 1);
    }

    toggleFileType(ft: string): void {
        this.allowedFileTypes = this.allowedFileTypes.includes(ft)
            ? this.allowedFileTypes.filter(f => f !== ft)
            : [...this.allowedFileTypes, ft];
    }

    toggleFramework(fw: string): void {
        this.enabledFrameworks = this.enabledFrameworks.includes(fw)
            ? this.enabledFrameworks.filter(f => f !== fw)
            : [...this.enabledFrameworks, fw];
    }

    async save(): Promise<void> {
        const blacklist_terms: Record<string, string[]> = {};
        for (const cat of this.blacklistCategories) {
            if (!cat.name.trim()) continue;
            blacklist_terms[cat.name.trim()] = cat.termsText.split(',').map(t => t.trim()).filter(Boolean);
        }

        try {
            this.settings = await this.api.saveAdminSettings({
                prompt_optimization_enabled: this.promptOptimizationEnabled,
                blacklist_terms,
                openai_api_key: this.openaiKeyInput || null,
                anthropic_api_key: this.anthropicKeyInput || null,
                qwen_api_key: this.qwenKeyInput || null,
                model_version: this.modelVersion || null,
                provider_name: this.providerName || null,
                token_rate_limit_per_user: this.tokenRateLimit,
                arabic_enabled: this.arabicEnabled,
                allowed_file_types: this.allowedFileTypes,
                enabled_frameworks: this.enabledFrameworks,
                model_moderation_enabled: this.modelModerationEnabled,
                model_moderation_threshold: this.modelModerationThreshold,
                error_log_retention_days: this.errorLogRetentionDays,
                telemetry_retention_days: this.telemetryRetentionDays,
                moderation_flag_retention_days: this.moderationFlagRetentionDays,
                audit_log_retention_days: this.auditLogRetentionDays,
                fallback_provider_order: this.fallbackProviderOrder,
                presenton_enabled: this.presentonEnabled,
                presenton_base_url: this.presentonBaseUrl || null,
                presenton_api_key: this.presentonApiKeyInput || null,
                presenton_template_name: this.presentonTemplateName || null,
                web_search_enabled: this.webSearchEnabled,
                tavily_api_key: this.tavilyApiKeyInput || null,
            });
            this.openaiKeyInput = '';
            this.anthropicKeyInput = '';
            this.qwenKeyInput = '';
            this.presentonApiKeyInput = '';
            this.tavilyApiKeyInput = '';
            this.saveStatus = this.translate.instant('executiveSummary.adminSettings.saved');
            setTimeout(() => (this.saveStatus = ''), 3000);
        } catch {
            this.saveStatus = this.translate.instant('executiveSummary.adminSettings.saveFailed');
        }
    }

    async loadErrorLogs(): Promise<void> {
        this.logsLoading = true;
        this.expandedLogId = null;
        try {
            this.errorLogs = await this.api.listErrorLogs(this.showResolvedOnly || undefined);
        } finally {
            this.logsLoading = false;
        }
    }

    toggleLogExpand(id: number): void {
        this.expandedLogId = this.expandedLogId === id ? null : id;
    }

    async resolveLog(log: ErrorLogEntry): Promise<void> {
        this.resolvingId = log.id;
        try {
            await this.api.resolveErrorLog(log.id);
            this.resolvingId = null;
            log.resolved = true;
        } catch {
            this.resolvingId = null;
            this.toastr.error(this.translate.instant('executiveSummary.adminSettings.resolveFailed'));
        }
    }

    async loadInstructions(): Promise<void> {
        if (!this.instructionsUserId.trim()) return;
        try {
            this.instructions = await this.api.listInstructions(this.instructionsUserId.trim());
        } catch {
            this.instructions = [];
        }
    }

    async addInstruction(): Promise<void> {
        if (!this.newName.trim() || !this.newDescription.trim() || !this.newInstructions.trim()) return;
        const row = await this.api.createInstruction({
            user_id: this.instructionsUserId.trim(),
            name: this.newName.trim(),
            description: this.newDescription.trim(),
            instructions: this.newInstructions.trim(),
            executable_code: this.newExecutableCode.trim() || null,
            documentation: this.newDocumentation.trim() || null,
            resources: this.newResources.trim() || null,
            active: true,
        });
        this.instructions = [row, ...this.instructions];
        this.newName = '';
        this.newDescription = '';
        this.newInstructions = '';
        this.newDocumentation = '';
        this.newExecutableCode = '';
        this.newResources = '';
    }

    async removeInstruction(id: number): Promise<void> {
        await this.api.deleteInstruction(id);
        this.instructions = this.instructions.filter(i => i.id !== id);
    }

    providerLabel(provider: Provider): string {
        return provider === 'qwen' ? 'Qwen' : provider === 'openai' ? 'OpenAI' : 'Claude';
    }

    setFallbackProvider(index: number, value: string): void {
        const next = [...this.fallbackProviderOrder];
        if (!value) next.splice(index, 1);
        else next[index] = value as Provider;
        this.fallbackProviderOrder = next.filter(Boolean);
    }

    async deleteCurrentUserData(): Promise<void> {
        const userId = this.auth.user()?.id;
        if (!userId || !confirm(this.translate.instant('executiveSummary.adminSettings.deleteDataConfirm'))) return;
        this.deletingUserData = true;
        this.deleteUserDataStatus = '';
        try {
            const response = await this.api.deleteUserData(userId);
            const total = Object.values(response.deleted_counts).reduce((sum, value) => sum + value, 0);
            this.deleteUserDataStatus = this.translate.instant('executiveSummary.adminSettings.deleteDataSuccess', { total });
        } catch {
            this.deleteUserDataStatus = this.translate.instant('executiveSummary.adminSettings.deleteDataFailed');
        } finally {
            this.deletingUserData = false;
        }
    }

    get trustedSourceCategories(): string[] {
        return [...new Set(this.trustedSources.map(source => source.category))];
    }

    trustedSourcesFor(category: string): TrustedSourceEntry[] {
        return this.trustedSources.filter(source => source.category === category);
    }

    async loadTrustedSources(): Promise<void> {
        this.trustedSourcesLoading = true;
        try {
            this.trustedSources = await this.api.listTrustedSources();
        } catch {
            this.trustedSources = [];
        } finally {
            this.trustedSourcesLoading = false;
        }
    }

    async addTrustedSource(): Promise<void> {
        if (!this.newSourceCategory.trim() || !this.newSourceName.trim() || !this.newSourceUrl.trim()) return;
        try {
            const source = await this.api.createTrustedSource({
                category: this.newSourceCategory.trim(),
                name: this.newSourceName.trim(),
                url: this.newSourceUrl.trim(),
            });
            this.trustedSources = [...this.trustedSources, source];
            this.newSourceCategory = '';
            this.newSourceName = '';
            this.newSourceUrl = '';
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.adminSettings.integrationUnavailable'));
        }
    }

    async deleteTrustedSource(id: number): Promise<void> {
        try {
            await this.api.deleteTrustedSource(id);
            this.trustedSources = this.trustedSources.filter(source => source.id !== id);
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.adminSettings.integrationUnavailable'));
        }
    }

    async bulkImport(): Promise<void> {
        if (!this.bulkImportText.trim()) return;
        this.bulkImporting = true;
        this.bulkImportStatus = '';
        try {
            const response = await this.api.bulkImportTrustedSources(this.bulkImportText);
            this.trustedSources = [...this.trustedSources, ...response.imported];
            this.bulkImportText = '';
            this.bulkImportStatus = this.translate.instant('executiveSummary.adminSettings.importSuccess', {
                count: response.count,
            });
        } catch {
            this.bulkImportStatus = this.translate.instant('executiveSummary.adminSettings.importFailed');
        } finally {
            this.bulkImporting = false;
        }
    }

    async loadMcpServers(): Promise<void> {
        this.mcpServersLoading = true;
        this.mcpServerStatus = '';
        try {
            this.mcpServers = await this.api.adminListMcpServers();
        } catch {
            this.mcpServers = [];
            this.mcpServerStatus = this.translate.instant('executiveSummary.adminSettings.integrationUnavailable');
        } finally {
            this.mcpServersLoading = false;
        }
    }

    async addMcpServer(): Promise<void> {
        if (!this.newMcpServer.name.trim() || !this.newMcpServer.base_url.trim()) return;
        try {
            const server = await this.api.adminCreateMcpServer(this.newMcpServer);
            this.mcpServers = [...this.mcpServers, server];
            this.newMcpServer = this.emptyMcpServer();
        } catch {
            this.mcpServerStatus = this.translate.instant('executiveSummary.adminSettings.integrationUnavailable');
        }
    }

    async deleteMcpServer(id: string): Promise<void> {
        try {
            await this.api.adminDeleteMcpServer(id);
            this.mcpServers = this.mcpServers.filter(server => server.id !== id);
        } catch {
            this.mcpServerStatus = this.translate.instant('executiveSummary.adminSettings.integrationUnavailable');
        }
    }

    private emptyMcpServer(): CreateMcpServerRequest {
        return {
            name: '',
            description: '',
            base_url: '',
            auth_type: 'oauth',
            oauth_authorize_url: '',
            oauth_token_url: '',
            oauth_client_id: '',
            oauth_client_secret: '',
            oauth_scopes: '',
            static_api_key: '',
        };
    }
}
