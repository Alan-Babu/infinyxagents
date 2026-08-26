import { Injectable } from '@angular/core';
import { Paginated } from '@nfinyx/document-agent';
import { TranslatorApiBase } from './translator-api-base';
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
} from '../models/translator.models';

const TranslatorApiPaths = {
    documents: '/documents',
    reviewQueue: '/documents/review-queue',
    feedback: '/feedback',
    stats: '/stats',
    searchHistory: '/stats/search-history',
    performance: '/stats/performance',
    logs: '/stats/logs',
};

@Injectable({ providedIn: 'root' })
export class TranslatorApiService extends TranslatorApiBase {
    detectDocument(uploadRef: string): Promise<DetectionResult> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        return this.postFormData<DetectionResult>(`${TranslatorApiPaths.documents}/detect`, fd);
    }

    translateDocument(uploadRef: string, pagesToTranslate?: number[]): Promise<DocumentDetail> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        if (pagesToTranslate && pagesToTranslate.length) {
            fd.append('pages_to_translate', pagesToTranslate.join(','));
        }
        return this.postFormData<DocumentDetail>(`${TranslatorApiPaths.documents}/translate`, fd);
    }

    listDocuments(filters: DocumentListFilters = {}): Promise<Paginated<DocumentSummary>> {
        return this.get<Paginated<DocumentSummary>>(TranslatorApiPaths.documents, {
            q: filters.q,
            document_type: filters.documentType,
            status: filters.status,
            risk_level: filters.riskLevel,
            document_category: filters.category,
            document_classification: filters.classification,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }

    getDocument(id: string): Promise<DocumentDetail> {
        return this.get<DocumentDetail>(`${TranslatorApiPaths.documents}/${id}`);
    }

    deleteDocument(id: string): Promise<void> {
        return this.delete<void>(`${TranslatorApiPaths.documents}/${id}`);
    }

    getReviewQueue(page = 1, pageSize = 20): Promise<Paginated<DocumentSummary>> {
        return this.get<Paginated<DocumentSummary>>(TranslatorApiPaths.reviewQueue, { page, page_size: pageSize });
    }

    reviewDocument(
        id: string,
        decision: 'approve' | 'reject',
        reviewerName: string,
        reviewerNotes: string,
    ): Promise<DocumentDetail> {
        return this.patch<DocumentDetail>(`${TranslatorApiPaths.documents}/${id}/review`, {
            decision,
            reviewer_name: reviewerName || null,
            reviewer_notes: reviewerNotes || null,
        });
    }

    getDocumentPages(id: string): Promise<DocumentPageImage[]> {
        return this.get<DocumentPageImage[]>(`${TranslatorApiPaths.documents}/${id}/pages`);
    }

    askDocument(documentId: string, question: string): Promise<QAExchange> {
        return this.post<QAExchange>(`${TranslatorApiPaths.documents}/${documentId}/ask`, { question });
    }

    listQA(documentId: string): Promise<QAExchange[]> {
        return this.get<QAExchange[]>(`${TranslatorApiPaths.documents}/${documentId}/qa`);
    }

    submitFeedback(rating: number, comment: string, documentId?: string): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(TranslatorApiPaths.feedback, {
            document_id: documentId || null,
            rating,
            comment: comment || null,
        });
    }

    getStats(): Promise<AgentStats> {
        return this.get<AgentStats>(TranslatorApiPaths.stats);
    }

    getSearchHistory(page = 1, pageSize = 20): Promise<Paginated<SearchHistoryEntry>> {
        return this.get<Paginated<SearchHistoryEntry>>(TranslatorApiPaths.searchHistory, { page, page_size: pageSize });
    }

    getPerformanceReport(): Promise<PerformanceReport> {
        return this.get<PerformanceReport>(TranslatorApiPaths.performance);
    }

    getLogs(filters: LogFilters = {}): Promise<Paginated<TelemetryLogEntry>> {
        return this.get<Paginated<TelemetryLogEntry>>(TranslatorApiPaths.logs, {
            call_type: filters.callType,
            success: filters.success,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }
}
