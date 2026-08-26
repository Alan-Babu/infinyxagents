import { Injectable } from '@angular/core';
import { ExecSummaryApiBase } from './exec-summary-api-base';
import {
    AdminSettingsPayload,
    AdminSettingsResponse,
    AgentInstructionEntry,
    AgentInstructionRequest,
    ErrorLogEntry,
    ExportResponse,
    FeedbackEntry,
    FeedbackRequest,
    GenerateRequest,
    GenerateResponse,
    HistoryDetailEntry,
    HistoryEntry,
    ModerationFlagEntry,
    OutputFormat,
    Provider,
    RefineResponse,
    SaveReportRequest,
    SaveReportResponse,
    ScheduledJobEntry,
    ScheduleJobRequest,
    ShareResult,
    StartSessionResponse,
    Task,
    TranslateResponse,
} from '../models/executive-summary.models';

const ExecSummaryApiPaths = {
    history: '/history',
    health: '/health',
    session: '/session',
    tasks: '/tasks',
    feedback: '/feedback',
    schedules: '/schedules',
    adminSettings: '/admin/settings',
    instructions: '/instructions',
    moderationFlags: '/moderation/flags',
    adminLogs: '/admin/logs',
    download: '/download',
};

@Injectable({ providedIn: 'root' })
export class ExecSummaryApiService extends ExecSummaryApiBase {
    listHistory(): Promise<HistoryEntry[]> {
        return this.get<HistoryEntry[]>(ExecSummaryApiPaths.history);
    }

    getHistoryDetail(sessionId: string): Promise<HistoryDetailEntry> {
        return this.get<HistoryDetailEntry>(`${ExecSummaryApiPaths.history}/${sessionId}`);
    }

    deleteHistory(sessionId: string): Promise<{ deleted: boolean }> {
        return this.delete<{ deleted: boolean }>(`${ExecSummaryApiPaths.history}/${sessionId}`);
    }

    renameHistory(sessionId: string, name: string): Promise<HistoryEntry> {
        return this.patch<HistoryEntry>(`${ExecSummaryApiPaths.history}/${sessionId}`, { name });
    }

    health(): Promise<{ status: string; providers: Record<Provider, boolean> }> {
        return this.get<{ status: string; providers: Record<Provider, boolean> }>(ExecSummaryApiPaths.health);
    }

    startSession(topic: string, provider: Provider): Promise<StartSessionResponse> {
        return this.post<StartSessionResponse>(`${ExecSummaryApiPaths.session}/start`, { topic, provider });
    }

    submitAnswers(sessionId: string, answers: Record<string, string>): Promise<{ ok: boolean }> {
        return this.post<{ ok: boolean }>(`${ExecSummaryApiPaths.session}/${sessionId}/answers`, { answers });
    }

    generate(sessionId: string, params: GenerateRequest): Promise<GenerateResponse> {
        return this.post<GenerateResponse>(`${ExecSummaryApiPaths.session}/${sessionId}/generate`, params);
    }

    export(
        sessionId: string,
        format: OutputFormat,
        template?: string,
        contentMarkdown?: string,
        title?: string,
        createdBy?: string,
    ): Promise<ExportResponse> {
        return this.post<ExportResponse>(`${ExecSummaryApiPaths.session}/${sessionId}/export`, {
            format,
            template: template || null,
            content_markdown: contentMarkdown || null,
            title: title || null,
            created_by: createdBy || null,
        });
    }

    downloadUrl(fileName: string): string {
        return this.url(`${ExecSummaryApiPaths.download}/${fileName}`);
    }

    shareEmail(
        sessionId: string,
        target: string,
        attachExport?: OutputFormat,
        contentMarkdown?: string,
        title?: string,
    ): Promise<ShareResult> {
        return this.post<ShareResult>(`${ExecSummaryApiPaths.session}/${sessionId}/share`, {
            channel: 'email',
            target,
            attach_export: attachExport ?? null,
            content_markdown: contentMarkdown || null,
            title: title || null,
        });
    }

    shareWhatsapp(sessionId: string, target: string): Promise<ShareResult> {
        return this.post<ShareResult>(`${ExecSummaryApiPaths.session}/${sessionId}/share`, {
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
        return this.post<Task>(`${ExecSummaryApiPaths.session}/${sessionId}/task`, {
            title,
            assignees,
            notes,
            due_date: dueDate || null,
            priority: priority || 'Medium',
            importance: importance || 'Medium',
            created_by: createdBy || 'anonymous',
        });
    }

    setTaskStatus(taskId: number, status: string): Promise<Task> {
        return this.post<Task>(`${ExecSummaryApiPaths.tasks}/${taskId}/status`, { status });
    }

    listTasks(): Promise<Task[]> {
        return this.get<Task[]>(ExecSummaryApiPaths.tasks);
    }

    saveReport(sessionId: string, payload: SaveReportRequest): Promise<SaveReportResponse> {
        return this.post<SaveReportResponse>(`${ExecSummaryApiPaths.session}/${sessionId}/save`, payload);
    }

    submitFeedback(sessionId: string, payload: FeedbackRequest): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(`${ExecSummaryApiPaths.session}/${sessionId}/feedback`, payload);
    }

    listFeedback(): Promise<FeedbackEntry[]> {
        return this.get<FeedbackEntry[]>(ExecSummaryApiPaths.feedback);
    }

    createSchedule(sessionId: string, payload: ScheduleJobRequest): Promise<ScheduledJobEntry> {
        return this.post<ScheduledJobEntry>(`${ExecSummaryApiPaths.session}/${sessionId}/schedule`, payload);
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

    translate(sessionId: string, targetLanguage: string): Promise<TranslateResponse> {
        return this.post<TranslateResponse>(`${ExecSummaryApiPaths.session}/${sessionId}/translate`, {
            target_language: targetLanguage,
        });
    }

    refine(sessionId: string, instruction: string): Promise<RefineResponse> {
        return this.post<RefineResponse>(`${ExecSummaryApiPaths.session}/${sessionId}/refine`, { instruction });
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
}
