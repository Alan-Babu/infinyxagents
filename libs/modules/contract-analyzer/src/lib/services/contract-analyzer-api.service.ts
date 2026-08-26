import { Injectable } from '@angular/core';
import { Paginated } from '@nfinyx/document-agent';
import { ContractAnalyzerApiBase } from './contract-analyzer-api-base';
import {
    AgentStats,
    ContractDetail,
    ContractListFilters,
    ContractSummary,
    DetectionResult,
    DocumentPageImage,
    DownloadPrepareResult,
    FeedbackEntry,
    LogFilters,
    PerformanceReport,
    QAExchange,
    QuestionsResult,
    SearchHistoryEntry,
    TelemetryLogEntry,
} from '../models/contract-analyzer.models';

const ContractAnalyzerApiPaths = {
    contracts: '/contracts',
    reviewQueue: '/contracts/review-queue',
    feedback: '/feedback',
    stats: '/stats',
    searchHistory: '/stats/search-history',
    performance: '/stats/performance',
    logs: '/stats/logs',
};

@Injectable({ providedIn: 'root' })
export class ContractAnalyzerApiService extends ContractAnalyzerApiBase {
    detectContract(uploadRef: string): Promise<DetectionResult> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        return this.postFormData<DetectionResult>(`${ContractAnalyzerApiPaths.contracts}/detect`, fd);
    }

    getQuestions(uploadRef: string): Promise<QuestionsResult> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        return this.postFormData<QuestionsResult>(`${ContractAnalyzerApiPaths.contracts}/questions`, fd);
    }

    analyzeContract(payload: {
        uploadRef: string;
        partyAName: string;
        partyAType: string;
        partyBName: string;
        partyBType: string;
        questions: string[];
        answers: string[];
        cashFlowContext: string;
        previousContractNotes: string;
    }): Promise<ContractDetail> {
        return this.post<ContractDetail>(`${ContractAnalyzerApiPaths.contracts}/analyze`, {
            upload_ref: payload.uploadRef,
            party_a_name: payload.partyAName || null,
            party_a_type: payload.partyAType || null,
            party_b_name: payload.partyBName || null,
            party_b_type: payload.partyBType || null,
            questions: payload.questions,
            answers: payload.answers,
            cash_flow_context: payload.cashFlowContext || null,
            previous_contract_notes: payload.previousContractNotes || null,
        });
    }

    prepareReportDownload(contractId: string): Promise<DownloadPrepareResult> {
        return this.post<DownloadPrepareResult>(`${ContractAnalyzerApiPaths.contracts}/${contractId}/report/prepare`, {});
    }

    listContracts(filters: ContractListFilters = {}): Promise<Paginated<ContractSummary>> {
        return this.get<Paginated<ContractSummary>>(ContractAnalyzerApiPaths.contracts, {
            q: filters.q,
            overall_risk_level: filters.overallRiskLevel,
            document_classification: filters.classification,
            review_status: filters.reviewStatus,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }

    getContract(id: string): Promise<ContractDetail> {
        return this.get<ContractDetail>(`${ContractAnalyzerApiPaths.contracts}/${id}`);
    }

    deleteContract(id: string): Promise<void> {
        return this.delete<void>(`${ContractAnalyzerApiPaths.contracts}/${id}`);
    }

    getContractPages(id: string): Promise<DocumentPageImage[]> {
        return this.get<DocumentPageImage[]>(`${ContractAnalyzerApiPaths.contracts}/${id}/pages`);
    }

    getReviewQueue(page = 1, pageSize = 20): Promise<Paginated<ContractSummary>> {
        return this.get<Paginated<ContractSummary>>(ContractAnalyzerApiPaths.reviewQueue, { page, page_size: pageSize });
    }

    reviewContract(
        id: string,
        decision: 'approve' | 'reject',
        reviewerName: string,
        reviewerNotes: string,
    ): Promise<ContractDetail> {
        return this.patch<ContractDetail>(`${ContractAnalyzerApiPaths.contracts}/${id}/review`, {
            decision,
            reviewer_name: reviewerName || null,
            reviewer_notes: reviewerNotes || null,
        });
    }

    askContract(documentId: string, question: string): Promise<QAExchange> {
        return this.post<QAExchange>(`${ContractAnalyzerApiPaths.contracts}/${documentId}/ask`, { question });
    }

    listQA(documentId: string): Promise<QAExchange[]> {
        return this.get<QAExchange[]>(`${ContractAnalyzerApiPaths.contracts}/${documentId}/qa`);
    }

    submitFeedback(rating: number, comment: string, documentId?: string): Promise<FeedbackEntry> {
        return this.post<FeedbackEntry>(ContractAnalyzerApiPaths.feedback, {
            document_id: documentId || null,
            rating,
            comment: comment || null,
        });
    }

    getStats(): Promise<AgentStats> {
        return this.get<AgentStats>(ContractAnalyzerApiPaths.stats);
    }

    getSearchHistory(page = 1, pageSize = 20): Promise<Paginated<SearchHistoryEntry>> {
        return this.get<Paginated<SearchHistoryEntry>>(ContractAnalyzerApiPaths.searchHistory, { page, page_size: pageSize });
    }

    getPerformanceReport(): Promise<PerformanceReport> {
        return this.get<PerformanceReport>(ContractAnalyzerApiPaths.performance);
    }

    getLogs(filters: LogFilters = {}): Promise<Paginated<TelemetryLogEntry>> {
        return this.get<Paginated<TelemetryLogEntry>>(ContractAnalyzerApiPaths.logs, {
            call_type: filters.callType,
            success: filters.success,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            page: filters.page ?? 1,
            page_size: filters.pageSize ?? 20,
        });
    }
}
