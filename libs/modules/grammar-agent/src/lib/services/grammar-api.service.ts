import { Injectable } from '@angular/core';
import { Paginated } from '@nfinyx/document-agent';
import { GrammarApiBase } from './grammar-api-base';
import {
    AgentStats,
    DetectionResult,
    DocumentDetail,
    DocumentListFilters,
    DocumentPageImage,
    DocumentSummary,
    FeedbackEntry,
    LogFilters,
    PerformanceReport,
    QAExchange,
    SearchHistoryEntry,
    TelemetryLogEntry,
} from '../models/grammar.models';

const GrammarApiPaths = {
    documents: '/documents',
    reviewQueue: '/documents/review-queue',
    feedback: '/feedback',
    stats: '/stats',
    searchHistory: '/stats/search-history',
    performance: '/stats/performance',
    logs: '/stats/logs',
};

export interface CheckDocumentPayload {
    uploadRef?: string;
    text?: string;
}

@Injectable({ providedIn: 'root' })
export class GrammarApiService extends GrammarApiBase {
    detectDocument(uploadRef: string): Promise<DetectionResult> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        return this.postFormData<DetectionResult>(`${GrammarApiPaths.documents}/detect`, fd);
    }

    checkDocument(payload: CheckDocumentPayload): Promise<DocumentDetail> {
        const fd = new FormData();
        if (payload.uploadRef) fd.append('upload_ref', payload.uploadRef);
        if (payload.text) fd.append('text', payload.text);
        return this.postFormData<DocumentDetail>(`${GrammarApiPaths.documents}/check`, fd);
    }

    listDocuments(filters: DocumentListFilters = {}): Promise<Paginated<DocumentSummary>> {
        return this.get<Paginated<DocumentSummary>>(GrammarApiPaths.documents, {
            q: filters.q,
            document_classification: filters.classification,
            review_status: filters.reviewStatus,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }

    getDocument(id: string): Promise<DocumentDetail> {
        return this.get<DocumentDetail>(`${GrammarApiPaths.documents}/${id}`);
    }

    deleteDocument(id: string): Promise<void> {
        return this.delete<void>(`${GrammarApiPaths.documents}/${id}`);
    }

    getReviewQueue(page = 1, pageSize = 20): Promise<Paginated<DocumentSummary>> {
        return this.get<Paginated<DocumentSummary>>(GrammarApiPaths.reviewQueue, { page, page_size: pageSize });
    }

    reviewDocument(
        id: string,
        decision: 'approve' | 'reject',
        reviewerName: string,
        reviewerNotes: string,
    ): Promise<DocumentDetail> {
        return this.patch<DocumentDetail>(`${GrammarApiPaths.documents}/${id}/review`, {
            decision,
            reviewer_name: reviewerName || null,
            reviewer_notes: reviewerNotes || null,
        });
    }

    getDocumentPages(id: string): Promise<DocumentPageImage[]> {
        return this.get<DocumentPageImage[]>(`${GrammarApiPaths.documents}/${id}/pages`);
    }

    askDocument(documentId: string, question: string): Promise<QAExchange> {
        return this.post<QAExchange>(`${GrammarApiPaths.documents}/${documentId}/ask`, { question });
    }

    listQA(documentId: string): Promise<QAExchange[]> {
        return this.get<QAExchange[]>(`${GrammarApiPaths.documents}/${documentId}/qa`);
    }

    submitFeedback(rating: number, comment: string, documentId?: string): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(GrammarApiPaths.feedback, {
            document_id: documentId || null,
            rating,
            comment: comment || null,
        });
    }

    getStats(): Promise<AgentStats> {
        return this.get<AgentStats>(GrammarApiPaths.stats);
    }

    getSearchHistory(page = 1, pageSize = 20): Promise<Paginated<SearchHistoryEntry>> {
        return this.get<Paginated<SearchHistoryEntry>>(GrammarApiPaths.searchHistory, { page, page_size: pageSize });
    }

    getPerformanceReport(): Promise<PerformanceReport> {
        return this.get<PerformanceReport>(GrammarApiPaths.performance);
    }

    getLogs(filters: LogFilters = {}): Promise<Paginated<TelemetryLogEntry>> {
        return this.get<Paginated<TelemetryLogEntry>>(GrammarApiPaths.logs, {
            call_type: filters.callType,
            success: filters.success,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }
}
