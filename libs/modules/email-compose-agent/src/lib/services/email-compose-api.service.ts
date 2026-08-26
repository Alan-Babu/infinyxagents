import { Injectable } from '@angular/core';
import { Paginated } from '@nfinyx/document-agent';
import { EmailComposeApiBase } from './email-compose-api-base';
import {
    AgentStats,
    ContextProfile,
    EmailDetail,
    EmailListFilters,
    EmailLogFilters,
    EmailSummary,
    EmailTelemetryLogEntry,
    FeedbackEntry,
    PerformanceReport,
    QAExchange,
    ReplyQuestionsResult,
    SearchHistoryEntry,
} from '../models/email-compose-agent.models';

const EmailComposeApiPaths = {
    emails: '/emails',
    reviewQueue: '/emails/review-queue',
    contextProfile: '/context-profile',
    feedback: '/feedback',
    stats: '/stats',
    searchHistory: '/stats/search-history',
    performance: '/stats/performance',
    logs: '/stats/logs',
};

@Injectable({ providedIn: 'root' })
export class EmailComposeApiService extends EmailComposeApiBase {
    composeEmail(context: string, tone: string, recipientHint?: string): Promise<EmailDetail> {
        const fd = new FormData();
        fd.append('context', context);
        fd.append('tone', tone);
        if (recipientHint) fd.append('recipient_hint', recipientHint);
        return this.postFormData<EmailDetail>(`${EmailComposeApiPaths.emails}/compose`, fd);
    }

    getReplyQuestions(threadText?: string, uploadRef?: string): Promise<ReplyQuestionsResult> {
        const fd = new FormData();
        if (threadText) fd.append('thread_text', threadText);
        if (uploadRef) fd.append('upload_ref', uploadRef);
        return this.postFormData<ReplyQuestionsResult>(`${EmailComposeApiPaths.emails}/reply/questions`, fd);
    }

    draftReply(
        threadText: string,
        questions: string[],
        answers: string[],
        tone: string,
        emotionalTone?: string,
    ): Promise<EmailDetail> {
        const fd = new FormData();
        fd.append('thread_text', threadText);
        fd.append('questions', JSON.stringify(questions));
        fd.append('answers', JSON.stringify(answers));
        fd.append('tone', tone);
        if (emotionalTone) fd.append('emotional_tone', emotionalTone);
        return this.postFormData<EmailDetail>(`${EmailComposeApiPaths.emails}/reply/draft`, fd);
    }

    translateEmail(id: string, targetLanguage: string): Promise<EmailDetail> {
        return this.post<EmailDetail>(`${EmailComposeApiPaths.emails}/${id}/translate`, { target_language: targetLanguage });
    }

    pickTone(id: string, tone: string): Promise<EmailDetail> {
        return this.get<EmailDetail>(`${EmailComposeApiPaths.emails}/${id}/pick-tone`, { tone });
    }

    listEmails(filters: EmailListFilters = {}): Promise<Paginated<EmailSummary>> {
        return this.get<Paginated<EmailSummary>>(EmailComposeApiPaths.emails, {
            q: filters.q,
            mode: filters.mode,
            document_classification: filters.classification,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }

    getEmail(id: string): Promise<EmailDetail> {
        return this.get<EmailDetail>(`${EmailComposeApiPaths.emails}/${id}`);
    }

    deleteEmail(id: string): Promise<void> {
        return this.delete<void>(`${EmailComposeApiPaths.emails}/${id}`);
    }

    getReviewQueue(page = 1, pageSize = 20): Promise<Paginated<EmailSummary>> {
        return this.get<Paginated<EmailSummary>>(EmailComposeApiPaths.reviewQueue, { page, page_size: pageSize });
    }

    reviewEmail(id: string, decision: 'approve' | 'reject', reviewerName: string, reviewerNotes: string): Promise<EmailDetail> {
        return this.patch<EmailDetail>(`${EmailComposeApiPaths.emails}/${id}/review`, {
            decision,
            reviewer_name: reviewerName || null,
            reviewer_notes: reviewerNotes || null,
        });
    }

    getContextProfile(): Promise<ContextProfile> {
        return this.get<ContextProfile>(EmailComposeApiPaths.contextProfile);
    }

    saveContextProfile(profile: Partial<ContextProfile>): Promise<ContextProfile> {
        return this.put<ContextProfile>(EmailComposeApiPaths.contextProfile, profile);
    }

    askDocument(id: string, question: string): Promise<QAExchange> {
        return this.post<QAExchange>(`${EmailComposeApiPaths.emails}/${id}/ask`, { question });
    }

    listQA(id: string): Promise<QAExchange[]> {
        return this.get<QAExchange[]>(`${EmailComposeApiPaths.emails}/${id}/qa`);
    }

    submitFeedback(rating: number, comment: string, documentId?: string): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(EmailComposeApiPaths.feedback, {
            document_id: documentId || null,
            rating,
            comment: comment || null,
        });
    }

    getStats(): Promise<AgentStats> {
        return this.get<AgentStats>(EmailComposeApiPaths.stats);
    }

    getSearchHistory(page = 1, pageSize = 20): Promise<Paginated<SearchHistoryEntry>> {
        return this.get<Paginated<SearchHistoryEntry>>(EmailComposeApiPaths.searchHistory, { page, page_size: pageSize });
    }

    getPerformanceReport(): Promise<PerformanceReport> {
        return this.get<PerformanceReport>(EmailComposeApiPaths.performance);
    }

    getLogs(filters: EmailLogFilters = {}): Promise<Paginated<EmailTelemetryLogEntry>> {
        return this.get<Paginated<EmailTelemetryLogEntry>>(EmailComposeApiPaths.logs, {
            call_type: filters.callType,
            success: filters.success,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }
}
