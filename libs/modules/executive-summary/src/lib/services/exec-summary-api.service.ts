import { Injectable } from '@angular/core';
import { ExecSummaryApiBase } from './exec-summary-api-base';
import {
    AdminSettingsPayload,
    AdminSettingsResponse,
    AgentInstructionEntry,
    AgentInstructionRequest,
    AuditLogEntry,
    BulkImportTrustedSourcesResponse,
    ConversationDetail,
    ConversationSearchParams,
    CreateMcpServerRequest,
    CreateTrustedSourceRequest,
    ErrorLogEntry,
    ExpertiseLevel,
    ExportResponse,
    FeedbackEntry,
    FeedbackRequest,
    ForkSessionResponse,
    GammaStatusResponse,
    GammaThemeEntry,
    GenerateRequest,
    GenerateResponse,
    HistoryDetailEntry,
    HistoryEntry,
    HistorySearchParams,
    McpAuthorizeUrlResponse,
    McpServerEntry,
    McpToolCallResult,
    ModerationSummaryResponse,
    ModerationFlagEntry,
    OutputFormat,
    PaginatedConversationsResponse,
    PaginatedHistoryResponse,
    Provider,
    RefineResponse,
    SaveChatTurnRequest,
    ChatTurnEntry,
    SaveReportRequest,
    SaveReportResponse,
    ScheduledJobEntry,
    ScheduleJobRequest,
    ShareResult,
    SourceHit,
    StartSessionResponse,
    Task,
    TrustedSourceEntry,
    TranslateResponse,
    UsageSummaryResponse,
    UsageTimeseriesPoint,
    UserProfileResponse,
} from '../models/executive-summary.models';

const ExecSummaryApiPaths = {
    history: '/history',
    chatHistory: '/chat-history',
    health: '/health',
    session: '/session',
    tasks: '/tasks',
    feedback: '/feedback',
    schedules: '/schedules',
    adminSettings: '/admin/settings',
    instructions: '/instructions',
    moderationFlags: '/moderation/flags',
    adminLogs: '/admin/logs',
    trustedSources: '/admin/trusted-sources',
    adminMcpServers: '/admin/mcp-servers',
    mcpServers: '/mcp-servers',
    mcpConnections: '/mcp-connections',
    gamma: '/integrations/gamma',
    users: '/users',
    auditLog: '/admin/audit-log',
    analytics: '/admin/analytics',
    adminUsers: '/admin/users',
    download: '/download',
};

@Injectable({ providedIn: 'root' })
export class ExecSummaryApiService extends ExecSummaryApiBase {
    listHistory(params: Partial<HistorySearchParams> = {}): Promise<PaginatedHistoryResponse> {
        return this.get<PaginatedHistoryResponse>(ExecSummaryApiPaths.history, {
            q: params.q,
            category: params.category,
            research_type: params.research_type,
            framework: params.framework,
            visibility: params.visibility,
            limit: params.limit ?? 100,
            offset: params.offset ?? 0,
        });
    }

    searchHistory(params: HistorySearchParams): Promise<PaginatedHistoryResponse> {
        return this.listHistory(params);
    }

    getHistoryDetail(sessionId: string): Promise<HistoryDetailEntry> {
        return this.get<HistoryDetailEntry>(
            `${ExecSummaryApiPaths.history}/${encodeURIComponent(sessionId)}`,
        );
    }

    deleteHistory(sessionId: string): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(
            `${ExecSummaryApiPaths.history}/${encodeURIComponent(sessionId)}`,
        );
    }

    renameHistory(sessionId: string, name: string): Promise<HistoryEntry> {
        return this.patch<HistoryEntry>(
            `${ExecSummaryApiPaths.history}/${encodeURIComponent(sessionId)}`,
            { name },
        );
    }

    saveChatTurn(payload: SaveChatTurnRequest): Promise<ChatTurnEntry> {
        return this.post<ChatTurnEntry>(`${ExecSummaryApiPaths.chatHistory}/turn`, payload);
    }

    searchConversations(params: ConversationSearchParams): Promise<PaginatedConversationsResponse> {
        return this.get<PaginatedConversationsResponse>(`${ExecSummaryApiPaths.chatHistory}/conversations`, {
            q: params.q,
            limit: params.limit,
            offset: params.offset,
        });
    }

    getConversation(conversationId: string): Promise<ConversationDetail> {
        return this.get<ConversationDetail>(
            `${ExecSummaryApiPaths.chatHistory}/conversations/${encodeURIComponent(conversationId)}`,
        );
    }

    deleteConversation(conversationId: string): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(
            `${ExecSummaryApiPaths.chatHistory}/conversations/${encodeURIComponent(conversationId)}`,
        );
    }

    health(): Promise<{ status: string; providers: Record<Provider, boolean> }> {
        return this.get<{ status: string; providers: Record<Provider, boolean> }>(ExecSummaryApiPaths.health);
    }

    startSession(topic: string, provider: Provider, userId: string): Promise<StartSessionResponse> {
        return this.post<StartSessionResponse>(`${ExecSummaryApiPaths.session}/start`, {
            topic,
            provider,
            user_id: userId.trim() || 'anonymous',
        });
    }

    submitAnswers(sessionId: string, answers: Record<string, string>): Promise<{ ok: boolean }> {
        return this.post<{ ok: boolean }>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/answers`,
            { answers },
        );
    }

    generate(sessionId: string, params: GenerateRequest): Promise<GenerateResponse> {
        return this.post<GenerateResponse>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/generate`,
            { ...params, user_id: params.user_id.trim() || 'anonymous' },
        );
    }

    export(
        sessionId: string,
        format: OutputFormat,
        template?: string,
        contentMarkdown?: string,
        title?: string,
        createdBy?: string,
        sources?: SourceHit[],
        exportEngine?: 'local' | 'gamma' | 'presenton',
        classification?: string,
    ): Promise<ExportResponse> {
        return this.post<ExportResponse>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/export`, {
            format,
            template: template || null,
            content_markdown: contentMarkdown || null,
            title: title || null,
            created_by: createdBy || null,
            sources: sources?.length ? sources : null,
            export_engine: exportEngine ?? null,
            classification: classification || null,
        });
    }

    downloadUrl(fileName: string): string {
        return this.url(`${ExecSummaryApiPaths.download}/${encodeURIComponent(fileName)}`);
    }

    shareEmail(
        sessionId: string,
        target: string,
        attachExport?: OutputFormat,
        contentMarkdown?: string,
        title?: string,
    ): Promise<ShareResult> {
        return this.post<ShareResult>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/share`, {
            channel: 'email',
            target,
            attach_export: attachExport ?? null,
            content_markdown: contentMarkdown || null,
            title: title || null,
        });
    }

    shareWhatsapp(sessionId: string, target: string): Promise<ShareResult> {
        return this.post<ShareResult>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/share`, {
            channel: 'whatsapp',
            target,
        });
    }

    createTask(
        sessionId: string,
        title: string,
        assignees: string[],
        notes?: string,
        dueDate?: string,
        priority?: string,
        importance?: string,
        createdBy?: string,
    ): Promise<Task> {
        return this.post<Task>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/task`, {
            title,
            assignees,
            notes,
            due_date: dueDate || null,
            priority: priority || 'Medium',
            importance: importance || 'Medium',
            created_by: createdBy?.trim() || 'anonymous',
        });
    }

    setTaskStatus(taskId: number, status: string): Promise<Task> {
        return this.post<Task>(`${ExecSummaryApiPaths.tasks}/${taskId}/status`, { status });
    }

    listTasks(): Promise<Task[]> {
        return this.get<Task[]>(ExecSummaryApiPaths.tasks);
    }

    saveReport(sessionId: string, payload: SaveReportRequest): Promise<SaveReportResponse> {
        return this.post<SaveReportResponse>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/save`,
            payload,
        );
    }

    submitFeedback(sessionId: string, payload: FeedbackRequest): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/feedback`,
            payload,
        );
    }

    listFeedback(): Promise<FeedbackEntry[]> {
        return this.get<FeedbackEntry[]>(ExecSummaryApiPaths.feedback);
    }

    createSchedule(sessionId: string, payload: ScheduleJobRequest): Promise<ScheduledJobEntry> {
        return this.post<ScheduledJobEntry>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/schedule`,
            payload,
        );
    }

    listSchedules(sessionId?: string): Promise<ScheduledJobEntry[]> {
        return this.get<ScheduledJobEntry[]>(ExecSummaryApiPaths.schedules, { session_id: sessionId });
    }

    cancelSchedule(jobId: number): Promise<ScheduledJobEntry> {
        return this.delete<ScheduledJobEntry>(`${ExecSummaryApiPaths.schedules}/${jobId}`);
    }

    getAdminSettings(): Promise<AdminSettingsResponse> {
        return this.get<AdminSettingsResponse>(ExecSummaryApiPaths.adminSettings);
    }

    saveAdminSettings(payload: AdminSettingsPayload): Promise<AdminSettingsResponse> {
        return this.put<AdminSettingsResponse>(ExecSummaryApiPaths.adminSettings, payload);
    }

    listInstructions(userId: string): Promise<AgentInstructionEntry[]> {
        return this.get<AgentInstructionEntry[]>(ExecSummaryApiPaths.instructions, { user_id: userId });
    }

    createInstruction(payload: AgentInstructionRequest): Promise<AgentInstructionEntry> {
        return this.post<AgentInstructionEntry>(ExecSummaryApiPaths.instructions, payload);
    }

    deleteInstruction(id: number): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(`${ExecSummaryApiPaths.instructions}/${id}`);
    }

    listTrustedSources(): Promise<TrustedSourceEntry[]> {
        return this.get<TrustedSourceEntry[]>(ExecSummaryApiPaths.trustedSources);
    }

    createTrustedSource(payload: CreateTrustedSourceRequest): Promise<TrustedSourceEntry> {
        return this.post<TrustedSourceEntry>(ExecSummaryApiPaths.trustedSources, payload);
    }

    bulkImportTrustedSources(text: string): Promise<BulkImportTrustedSourcesResponse> {
        return this.post<BulkImportTrustedSourcesResponse>(`${ExecSummaryApiPaths.trustedSources}/bulk-import`, { text });
    }

    deleteTrustedSource(id: number): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(`${ExecSummaryApiPaths.trustedSources}/${id}`);
    }

    adminListMcpServers(): Promise<McpServerEntry[]> {
        return this.get<McpServerEntry[]>(ExecSummaryApiPaths.adminMcpServers);
    }

    adminCreateMcpServer(payload: CreateMcpServerRequest): Promise<McpServerEntry> {
        return this.post<McpServerEntry>(ExecSummaryApiPaths.adminMcpServers, payload);
    }

    adminDeleteMcpServer(id: string): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(
            `${ExecSummaryApiPaths.adminMcpServers}/${encodeURIComponent(id)}`,
        );
    }

    listMcpServers(): Promise<McpServerEntry[]> {
        return this.get<McpServerEntry[]>(ExecSummaryApiPaths.mcpServers);
    }

    getMcpAuthorizeUrl(serverId: string): Promise<McpAuthorizeUrlResponse> {
        return this.get<McpAuthorizeUrlResponse>(
            `${ExecSummaryApiPaths.mcpServers}/${encodeURIComponent(serverId)}/authorize`,
        );
    }

    connectMcpServerStatic(serverId: string): Promise<McpServerEntry> {
        return this.post<McpServerEntry>(
            `${ExecSummaryApiPaths.mcpServers}/${encodeURIComponent(serverId)}/connect`,
            {},
        );
    }

    disconnectMcpServer(connectionId: string): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(
            `${ExecSummaryApiPaths.mcpConnections}/${encodeURIComponent(connectionId)}`,
        );
    }

    listMcpConnectionTools(connectionId: string): Promise<McpToolCallResult> {
        return this.get<McpToolCallResult>(
            `${ExecSummaryApiPaths.mcpConnections}/${encodeURIComponent(connectionId)}/tools`,
        );
    }

    setImportedMcpTools(connectionId: string, toolNames: string[]): Promise<McpServerEntry> {
        return this.put<McpServerEntry>(
            `${ExecSummaryApiPaths.mcpConnections}/${encodeURIComponent(connectionId)}/imported-tools`,
            { tool_names: toolNames },
        );
    }

    connectGamma(apiKey: string): Promise<GammaStatusResponse> {
        return this.post<GammaStatusResponse>(`${ExecSummaryApiPaths.gamma}/connect`, { api_key: apiKey });
    }

    getGammaStatus(): Promise<GammaStatusResponse> {
        return this.get<GammaStatusResponse>(`${ExecSummaryApiPaths.gamma}/status`);
    }

    listGammaThemes(): Promise<GammaThemeEntry[]> {
        return this.get<GammaThemeEntry[]>(`${ExecSummaryApiPaths.gamma}/themes`);
    }

    setGammaTheme(themeId: string | null): Promise<GammaStatusResponse> {
        return this.put<GammaStatusResponse>(`${ExecSummaryApiPaths.gamma}/theme`, { theme_id: themeId });
    }

    disconnectGamma(): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(`${ExecSummaryApiPaths.gamma}/connect`);
    }

    translate(sessionId: string, targetLanguage: string): Promise<TranslateResponse> {
        return this.post<TranslateResponse>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/translate`, {
            target_language: targetLanguage,
        });
    }

    refine(sessionId: string, instruction: string): Promise<RefineResponse> {
        return this.post<RefineResponse>(
            `${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/refine`,
            { instruction },
        );
    }

    fork(sessionId: string, contentMarkdown?: string, title?: string): Promise<ForkSessionResponse> {
        return this.post<ForkSessionResponse>(`${ExecSummaryApiPaths.session}/${encodeURIComponent(sessionId)}/fork`, {
            content_markdown: contentMarkdown || null,
            title: title || null,
        });
    }

    listModerationFlags(): Promise<ModerationFlagEntry[]> {
        return this.get<ModerationFlagEntry[]>(ExecSummaryApiPaths.moderationFlags);
    }

    setModerationStatus(flagId: number, status: string): Promise<ModerationFlagEntry> {
        return this.post<ModerationFlagEntry>(`${ExecSummaryApiPaths.moderationFlags}/${flagId}/status`, { status });
    }

    listErrorLogs(resolvedOnly?: boolean): Promise<ErrorLogEntry[]> {
        return this.get<ErrorLogEntry[]>(ExecSummaryApiPaths.adminLogs, resolvedOnly ? { resolved: true } : undefined);
    }

    resolveErrorLog(errorId: number): Promise<{ resolved: boolean }> {
        return this.post<{ resolved: boolean }>(`${ExecSummaryApiPaths.adminLogs}/${errorId}/resolve`, {});
    }

    getUserProfile(userId: string): Promise<UserProfileResponse> {
        return this.get<UserProfileResponse>(
            `${ExecSummaryApiPaths.users}/${encodeURIComponent(userId)}/profile`,
        );
    }

    saveUserProfile(userId: string, expertiseLevel: ExpertiseLevel): Promise<UserProfileResponse> {
        return this.put<UserProfileResponse>(
            `${ExecSummaryApiPaths.users}/${encodeURIComponent(userId)}/profile`,
            { expertise_level: expertiseLevel },
        );
    }

    getAuditLog(filters?: { user_id?: string; action?: string; resource_type?: string }): Promise<AuditLogEntry[]> {
        return this.get<AuditLogEntry[]>(ExecSummaryApiPaths.auditLog, filters);
    }

    getUsageSummary(): Promise<UsageSummaryResponse> {
        return this.get<UsageSummaryResponse>(`${ExecSummaryApiPaths.analytics}/usage-summary`);
    }

    getUsageTimeseries(days = 30): Promise<UsageTimeseriesPoint[]> {
        return this.get<UsageTimeseriesPoint[]>(`${ExecSummaryApiPaths.analytics}/usage-timeseries`, { days });
    }

    getModerationSummary(): Promise<ModerationSummaryResponse> {
        return this.get<ModerationSummaryResponse>(`${ExecSummaryApiPaths.analytics}/moderation-summary`);
    }

    deleteUserData(userId: string): Promise<{ user_id: string; deleted_counts: Record<string, number> }> {
        return this.post<{ user_id: string; deleted_counts: Record<string, number> }>(
            `${ExecSummaryApiPaths.adminUsers}/${encodeURIComponent(userId)}/delete-data`,
            {},
        );
    }
}
