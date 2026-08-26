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

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import {
    ALL_FILE_TYPES,
    ALL_FRAMEWORKS,
    AdminSettingsResponse,
    AgentInstructionEntry,
    ErrorLogEntry,
} from '../../models/executive-summary.models';

type MenuView = 'menu' | 'guardrails' | 'external-models' | 'skills' | 'general' | 'logs';

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
    saveStatus = '';

    instructionsUserId = 'anonymous';
    instructions: AgentInstructionEntry[] = [];
    newName = '';
    newDescription = '';
    newInstructions = '';
    newDocumentation = '';
    newExecutableCode = '';
    newResources = '';

    ngOnChanges(): void {
        if (this.visible) {
            this.view = 'menu';
            this.loadSettings();
        }
    }

    get drawerTitle(): string {
        const titles: Record<MenuView, string> = {
            menu: this.translate.instant('executiveSummary.adminSettings.title'),
            guardrails: this.translate.instant('executiveSummary.adminSettings.guardrails'),
            'external-models': this.translate.instant('executiveSummary.adminSettings.externalModels'),
            skills: this.translate.instant('executiveSummary.adminSettings.skills'),
            general: this.translate.instant('executiveSummary.adminSettings.general'),
            logs: this.translate.instant('executiveSummary.adminSettings.logs'),
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
            });
            this.openaiKeyInput = '';
            this.anthropicKeyInput = '';
            this.qwenKeyInput = '';
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
}
