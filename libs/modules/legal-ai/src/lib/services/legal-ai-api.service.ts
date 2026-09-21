import { Injectable } from '@angular/core';
import { LegalAiApiBase } from './legal-ai-api-base';
import {
    AnalysisSummary,
    AuditEntry,
    ChatMessageDto,
    DocumentDetail,
    DocumentEntities,
    DocumentItem,
    Finding,
    FindingReviewRequest,
    LawArticle,
    LawItem,
    QAResponse,
    UploadResponse,
} from '../models/legal-ai.models';

const LegalAiApiPaths = {
    documents: '/documents',
    laws: '/laws',
    qaAsk: '/qa/ask',
    qaHistory: '/qa/history',
};

/** Typed client for the Legal AI FastAPI backend (documents, legislation knowledge base, Q&A). */
@Injectable({ providedIn: 'root' })
export class LegalAiApiService extends LegalAiApiBase {
    // ── Documents ────────────────────────────────────────────────────────────
    listDocuments(): Promise<DocumentItem[]> {
        return this.get<DocumentItem[]>(LegalAiApiPaths.documents);
    }

    getDocument(id: string): Promise<DocumentDetail> {
        return this.get<DocumentDetail>(`${LegalAiApiPaths.documents}/${id}`);
    }

    getAnalysis(id: string): Promise<AnalysisSummary> {
        return this.get<AnalysisSummary>(`${LegalAiApiPaths.documents}/${id}/analysis`);
    }

    getAudit(id: string): Promise<AuditEntry[]> {
        return this.get<AuditEntry[]>(`${LegalAiApiPaths.documents}/${id}/audit`);
    }

    getEntities(id: string): Promise<DocumentEntities> {
        return this.get<DocumentEntities>(`${LegalAiApiPaths.documents}/${id}/entities`);
    }

    uploadDocument(file: File): Promise<UploadResponse> {
        const fd = new FormData();
        fd.append('file', file);
        return this.postFormData<UploadResponse>(`${LegalAiApiPaths.documents}/upload`, fd);
    }

    reanalyzeDocument(id: string): Promise<unknown> {
        return this.post<unknown>(`${LegalAiApiPaths.documents}/${id}/analyze`, {});
    }

    reviewFinding(documentId: string, findingId: string, body: FindingReviewRequest): Promise<Finding> {
        return this.post<Finding>(`${LegalAiApiPaths.documents}/${documentId}/findings/${findingId}/review`, body);
    }

    // ── Legislation knowledge base ───────────────────────────────────────────
    listLaws(): Promise<LawItem[]> {
        return this.get<LawItem[]>(LegalAiApiPaths.laws);
    }

    getLaw(id: string): Promise<LawItem> {
        return this.get<LawItem>(`${LegalAiApiPaths.laws}/${encodeURIComponent(id)}`);
    }

    listLawArticles(id: string): Promise<LawArticle[]> {
        return this.get<LawArticle[]>(`${LegalAiApiPaths.laws}/${encodeURIComponent(id)}/articles`);
    }

    // ── Q&A ──────────────────────────────────────────────────────────────────
    ask(body: { question: string; document_id?: string; session_id: string; top_k: number }): Promise<QAResponse> {
        return this.post<QAResponse>(LegalAiApiPaths.qaAsk, body);
    }

    chatHistory(sessionId: string): Promise<ChatMessageDto[]> {
        return this.get<ChatMessageDto[]>(LegalAiApiPaths.qaHistory, { session_id: sessionId });
    }
}
