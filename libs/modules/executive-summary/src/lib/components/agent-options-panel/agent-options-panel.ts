import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { GammaStatusResponse, GammaThemeEntry, McpServerEntry, McpToolEntry } from '../../models/executive-summary.models';
import { ExecSummaryApiService } from '../../services/exec-summary-api.service';

@Component({
    selector: 'lib-agent-options-panel',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TranslateModule, ButtonModule, CheckboxModule, DrawerModule, InputTextModule,
        SelectModule,
    ],
    template: `
        <p-drawer [(visible)]="visible" position="right" styleClass="p-drawer-md" appendTo="body"
            (onShow)="load()" (onHide)="visibleChange.emit(false)">
            <ng-template pTemplate="header">
                <span class="font-semibold">{{ 'executiveSummary.options.title' | translate }}</span>
            </ng-template>

            <section class="mb-6 border-b border-gray-200 pb-6">
                <h3 class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                    {{ 'executiveSummary.options.agentSettings' | translate }}
                </h3>
                <div class="mb-1 block text-xs font-semibold text-gray-600">{{ 'executiveSummary.options.source' | translate }}</div>
                <p-select class="mb-4 w-full" styleClass="w-full" appendTo="body" [options]="sourceOptions"
                    [ngModel]="source" (ngModelChange)="sourceChange.emit($event)" />
                <div class="mb-1 block text-xs font-semibold text-gray-600">{{ 'executiveSummary.options.template' | translate }}</div>
                <p-select class="w-full" styleClass="w-full" appendTo="body" [options]="templateOptions"
                    optionLabel="label" optionValue="label" [ngModel]="template" (ngModelChange)="templateChange.emit($event)" />
            </section>

            <section class="mb-6 border-b border-gray-200 pb-6">
                <h3 class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">MCP</h3>
                @if (!auth.isLoggedIn()) {
                    <p class="text-sm text-gray-500">{{ 'executiveSummary.options.loginForMcp' | translate }}</p>
                } @else if (loadingServers) {
                    <i class="pi pi-spin pi-spinner text-gray-400"></i>
                } @else if (!servers.length) {
                    <p class="text-sm text-gray-500">{{ 'executiveSummary.options.noServers' | translate }}</p>
                }
                @for (server of servers; track server.id) {
                    <div class="border-b border-gray-100 py-3 last:border-0">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">{{ server.name }}</p>
                                <p class="text-xs" [class.text-green-600]="server.connection_status === 'connected'"
                                    [class.text-gray-400]="server.connection_status !== 'connected'">
                                    {{ (server.connection_status === 'connected' ? 'executiveSummary.options.connected' : 'executiveSummary.options.notConnected') | translate }}
                                </p>
                            </div>
                            <div class="flex flex-wrap justify-end gap-1">
                                @if (server.connection_status !== 'connected') {
                                    <button type="button" pButton size="small" [loading]="busyServer === server.id"
                                        (click)="connect(server)"><span>{{ 'executiveSummary.options.connect' | translate }}</span></button>
                                } @else {
                                    <button type="button" pButton size="small" severity="secondary" [outlined]="true"
                                        (click)="viewTools(server)"><span>{{ 'executiveSummary.options.tools' | translate }}</span></button>
                                    <button type="button" pButton size="small" severity="danger" [outlined]="true"
                                        (click)="disconnect(server)"><span>{{ 'executiveSummary.options.disconnect' | translate }}</span></button>
                                }
                            </div>
                        </div>
                        @if (toolsOpen[server.id]) {
                            <div class="mt-3 rounded-lg bg-gray-50 p-3">
                                @if (toolsLoading === server.id) {
                                    <i class="pi pi-spin pi-spinner"></i>
                                } @else {
                                    @for (tool of tools[server.id]; track tool.name) {
                                        <div class="mb-2 flex cursor-pointer items-start gap-2 text-xs">
                                            <p-checkbox [binary]="true" [ngModel]="isToolSelected(server.id, tool.name)"
                                                (ngModelChange)="toggleTool(server.id, tool.name)" />
                                            <span><strong>{{ tool.name }}</strong>
                                                @if (tool.annotations?.destructiveHint) {
                                                    <span class="ms-1 text-red-600">{{ 'executiveSummary.options.destructive' | translate }}</span>
                                                }
                                                <span class="block text-gray-500">{{ tool.description }}</span>
                                            </span>
                                        </div>
                                    }
                                    <button type="button" pButton size="small" (click)="saveTools(server)">
                                        <span>{{ 'executiveSummary.options.saveTools' | translate }}</span>
                                    </button>
                                }
                            </div>
                        }
                    </div>
                }
            </section>

            <section>
                <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Gamma AI</h3>
                @if (!gamma.connected) {
                    <div class="flex gap-2">
                        <input pInputText type="password" class="min-w-0 flex-1" [(ngModel)]="gammaKey"
                            placeholder="sk-gamma-..." autocomplete="off" />
                        <button type="button" pButton [loading]="gammaBusy" [disabled]="!gammaKey.trim()"
                            (click)="connectGamma()"><span>{{ 'executiveSummary.options.connect' | translate }}</span></button>
                    </div>
                } @else {
                    <div class="mb-3 flex items-center justify-between">
                        <span class="text-sm font-semibold text-green-600">{{ 'executiveSummary.options.connected' | translate }}</span>
                        <button type="button" pButton size="small" severity="danger" [outlined]="true"
                            (click)="disconnectGamma()"><span>{{ 'executiveSummary.options.disconnect' | translate }}</span></button>
                    </div>
                    <div class="mb-1 block text-xs font-semibold text-gray-600">{{ 'executiveSummary.options.gammaTheme' | translate }}</div>
                    <p-select class="w-full" styleClass="w-full" appendTo="body" [options]="gammaThemeOptions"
                        optionLabel="name" optionValue="id" [ngModel]="gamma.theme_id ?? null"
                        (ngModelChange)="setGammaTheme($event)" />
                }
                @if (error) { <p class="mt-2 text-xs text-red-600">{{ error }}</p> }
            </section>
        </p-drawer>
    `,
})
export class AgentOptionsPanelComponent {
    private readonly api = inject(ExecSummaryApiService);
    readonly auth = inject(AuthService);

    @Input() visible = false;
    @Input() source = 'Web search';
    @Input() template = 'Auto (agent picks)';
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() sourceChange = new EventEmitter<string>();
    @Output() templateChange = new EventEmitter<string>();
    @Output() serversChange = new EventEmitter<McpServerEntry[]>();

    readonly sourceOptions = ['Web search', 'Specific URL(s)', 'Upload document'];
    readonly templateOptions = [
        { label: 'Auto (agent picks)' }, { label: 'UAE Color Theme' }, { label: 'Editorial Navy' },
        { label: 'Corporate Minimal' }, { label: 'Modern Teal' }, { label: 'MoFA' },
    ];
    servers: McpServerEntry[] = [];
    loadingServers = false;
    busyServer: string | null = null;
    toolsLoading: string | null = null;
    toolsOpen: Record<string, boolean> = {};
    tools: Record<string, McpToolEntry[]> = {};
    selectedTools: Record<string, Set<string>> = {};
    gamma: GammaStatusResponse = { connected: false };
    gammaThemes: GammaThemeEntry[] = [];
    gammaKey = '';
    gammaBusy = false;
    error = '';

    get gammaThemeOptions(): GammaThemeEntry[] {
        return [{ id: null as unknown as string, name: 'Gamma default' }, ...this.gammaThemes];
    }

    async load(): Promise<void> {
        if (!this.auth.isLoggedIn()) return;
        this.loadingServers = true;
        try {
            const [servers, gamma] = await Promise.all([this.api.listMcpServers(), this.api.getGammaStatus()]);
            this.servers = servers;
            this.gamma = gamma;
            this.serversChange.emit(servers);
            if (gamma.connected) this.gammaThemes = await this.api.listGammaThemes();
        } catch {
            // Optional integrations must not block the agent.
        } finally {
            this.loadingServers = false;
        }
    }

    async connect(server: McpServerEntry): Promise<void> {
        this.busyServer = server.id;
        try {
            if (server.auth_type === 'oauth') {
                const { authorize_url } = await this.api.getMcpAuthorizeUrl(server.id);
                const popup = window.open(authorize_url, 'mcp-oauth', 'width=520,height=720');
                if (popup) {
                    await new Promise<void>(resolve => {
                        const poll = window.setInterval(() => {
                            if (popup.closed) {
                                window.clearInterval(poll);
                                resolve();
                            }
                        }, 750);
                    });
                }
            } else {
                await this.api.connectMcpServerStatic(server.id);
            }
            await this.load();
        } catch (error) {
            this.error = this.message(error);
        } finally {
            this.busyServer = null;
        }
    }

    async disconnect(server: McpServerEntry): Promise<void> {
        if (!server.connection_id) return;
        await this.api.disconnectMcpServer(server.connection_id);
        await this.load();
    }

    async viewTools(server: McpServerEntry): Promise<void> {
        if (!server.connection_id) return;
        this.toolsOpen[server.id] = true;
        this.toolsLoading = server.id;
        this.tools[server.id] = [];
        this.selectedTools[server.id] = new Set(server.imported_tools);
        try {
            const response = await this.api.listMcpConnectionTools(server.connection_id);
            this.tools[server.id] = response.result.tools ?? [];
        } catch (error) {
            this.error = this.message(error);
        } finally {
            this.toolsLoading = null;
        }
    }

    toggleTool(serverId: string, name: string): void {
        const selection = this.selectedTools[serverId] ?? new Set<string>();
        if (selection.has(name)) selection.delete(name);
        else selection.add(name);
        this.selectedTools[serverId] = selection;
    }

    isToolSelected(serverId: string, name: string): boolean {
        return this.selectedTools[serverId]?.has(name) ?? false;
    }

    async saveTools(server: McpServerEntry): Promise<void> {
        if (!server.connection_id) return;
        await this.api.setImportedMcpTools(server.connection_id, [...(this.selectedTools[server.id] ?? [])]);
        this.toolsOpen[server.id] = false;
        await this.load();
    }

    async connectGamma(): Promise<void> {
        this.gammaBusy = true;
        this.error = '';
        try {
            this.gamma = await this.api.connectGamma(this.gammaKey.trim());
            this.gammaKey = '';
            this.gammaThemes = await this.api.listGammaThemes();
        } catch (error) {
            this.error = this.message(error);
        } finally {
            this.gammaBusy = false;
        }
    }

    async disconnectGamma(): Promise<void> {
        await this.api.disconnectGamma();
        this.gamma = { connected: false };
        this.gammaThemes = [];
    }

    async setGammaTheme(themeId: string | null): Promise<void> {
        this.gamma = await this.api.setGammaTheme(themeId);
    }

    private message(error: unknown): string {
        return (error as { message?: string })?.message ?? 'Integration request failed.';
    }
}
