import { Injectable } from '@angular/core';
import {
    AnalyticsOverview,
    BlacklistTerm,
    BlacklistTestResult,
    CrawlRun,
    CrawlSchedule,
    FeedbackEntry,
    KBDocument,
    KBVersion,
    Paginated,
    RiskSession,
    SessionTranscript,
    SimulateResult,
    UnansweredQuestion,
} from '../models/admin.models';
import { MofaChatbotApiBase } from './mofa-chatbot-api-base';

/** Admin backoffice endpoints: knowledge-base versions, crawl schedule, blacklist, analytics. */
@Injectable({ providedIn: 'root' })
export class MofaChatbotAdminApiService extends MofaChatbotApiBase {
    // ---- Knowledge base ----
    createKBVersion(label: string, notes: string, createdBy: string): Promise<KBVersion> {
        return this.post<KBVersion>('/kb/versions', { label, notes, created_by: createdBy });
    }

    listKBVersions(): Promise<KBVersion[]> {
        return this.get<KBVersion[]>('/kb/versions');
    }

    getKBVersion(id: string): Promise<KBVersion> {
        return this.get<KBVersion>(`/kb/versions/${id}`);
    }

    uploadKBDocument(versionId: string, file: File): Promise<void> {
        const fd = new FormData();
        fd.append('file', file);
        return this.postFormData<void>(`/kb/versions/${versionId}/upload`, fd);
    }

    listKBDocuments(versionId: string): Promise<KBDocument[]> {
        return this.get<KBDocument[]>(`/kb/versions/${versionId}/documents`);
    }

    simulateKBVersion(versionId: string, question: string, language: string): Promise<SimulateResult> {
        return this.post<SimulateResult>(`/kb/versions/${versionId}/simulate`, { question, language });
    }

    publishKBVersion(versionId: string, publishedBy: string): Promise<KBVersion> {
        return this.post<KBVersion>(`/kb/versions/${versionId}/publish`, { published_by: publishedBy });
    }

    // ---- Crawl ----
    getCrawlSchedule(): Promise<CrawlSchedule> {
        return this.get<CrawlSchedule>('/crawl/schedule');
    }

    updateCrawlSchedule(patch: Partial<CrawlSchedule> & { updated_by?: string }): Promise<CrawlSchedule> {
        return this.put<CrawlSchedule>('/crawl/schedule', patch);
    }

    triggerCrawl(mode: 'incremental' | 'full', seedUrls?: string[], maxPages?: number): Promise<void> {
        return this.post<void>('/crawl/trigger', { mode, seed_urls: seedUrls ?? null, max_pages: maxPages ?? null });
    }

    listCrawlRuns(page = 1, pageSize = 20): Promise<Paginated<CrawlRun>> {
        return this.get<Paginated<CrawlRun>>('/crawl/runs', { page, page_size: pageSize });
    }

    // ---- Blacklist ----
    listBlacklistTerms(): Promise<BlacklistTerm[]> {
        return this.get<BlacklistTerm[]>('/blacklist');
    }

    createBlacklistTerm(term: string, matchType: string, category: string, createdBy: string): Promise<BlacklistTerm> {
        return this.post<BlacklistTerm>('/blacklist', { term, match_type: matchType, category, created_by: createdBy });
    }

    updateBlacklistTerm(id: string, isActive?: boolean, category?: string): Promise<BlacklistTerm> {
        return this.patch<BlacklistTerm>(`/blacklist/${id}`, { is_active: isActive, category });
    }

    deleteBlacklistTerm(id: string): Promise<void> {
        return this.delete<void>(`/blacklist/${id}`);
    }

    testBlacklist(text: string): Promise<BlacklistTestResult> {
        return this.post<BlacklistTestResult>('/blacklist/test', { text });
    }

    // ---- Analytics ----
    getAnalyticsOverview(days = 7): Promise<AnalyticsOverview> {
        return this.get<AnalyticsOverview>('/analytics/overview', { days });
    }

    listUnansweredQuestions(reviewed?: boolean, page = 1, pageSize = 20): Promise<Paginated<UnansweredQuestion>> {
        return this.get<Paginated<UnansweredQuestion>>('/analytics/unanswered-questions', { reviewed, page, page_size: pageSize });
    }

    markUnansweredReviewed(id: string): Promise<void> {
        return this.patch<void>(`/analytics/unanswered-questions/${id}/reviewed`, {});
    }

    listRiskSessions(page = 1, pageSize = 20): Promise<Paginated<RiskSession>> {
        return this.get<Paginated<RiskSession>>('/analytics/risk-sessions', { page, page_size: pageSize });
    }

    getSessionTranscript(sessionId: string): Promise<SessionTranscript> {
        return this.get<SessionTranscript>(`/analytics/sessions/${sessionId}/transcript`);
    }

    listFeedback(page = 1, pageSize = 20): Promise<Paginated<FeedbackEntry>> {
        return this.get<Paginated<FeedbackEntry>>('/analytics/feedback', { page, page_size: pageSize });
    }
}
