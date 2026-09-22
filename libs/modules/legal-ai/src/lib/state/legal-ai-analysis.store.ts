import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '@nfinyx/services';
import { ApiError, messageFromApiError } from '@nfinyx/types';
import {
    AnalysisProgress,
    AnalysisSummary,
    AuditEntry,
    DocumentEntities,
    Finding,
} from '../models/legal-ai.models';
import { LegalAiApiService } from '../services/legal-ai-api.service';
import { LegalAiI18n } from '../services/legal-ai-i18n.service';
import { csvCell, findingNeedsReview } from '../utils/format';
import { LegalAiDocumentsStore } from './legal-ai-documents.store';

const POLL_MS = 3_000;

/**
 * State for a single document's analysis page. Provided by the page component, so it is created
 * fresh per visit and released on navigation (no stale data between documents).
 */
@Injectable()
export class LegalAiAnalysisStore {
    private readonly api = inject(LegalAiApiService);
    private readonly docs = inject(LegalAiDocumentsStore);
    private readonly i18n = inject(LegalAiI18n);
    private readonly common = inject(CommonService);
    private readonly router = inject(Router);

    readonly documentId = signal<string | null>(null);
    readonly analysis = signal<AnalysisSummary | null>(null);
    readonly audit = signal<AuditEntry[]>([]);
    readonly entities = signal<DocumentEntities | null>(null);
    readonly progress = signal<AnalysisProgress | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly selectedId = signal<string | null>(null);

    readonly reviewBusy = signal(false);
    readonly reviewError = signal<string | null>(null);

    readonly findings = computed(() => this.analysis()?.findings ?? []);
    readonly selectedFinding = computed<Finding | null>(() => {
        const id = this.selectedId();
        return id ? (this.findings().find((f) => f.id === id) ?? null) : null;
    });
    readonly isProcessing = computed(() => this.analysis()?.overall_status === 'PROCESSING');
    readonly failed = computed(() => this.analysis()?.overall_status === 'FAILED');

    private timer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    /** Load (or reload) everything for a document. */
    async open(id: string): Promise<void> {
        if (this.documentId() !== id) {
            this.analysis.set(null);
            this.audit.set([]);
            this.entities.set(null);
            this.progress.set(null);
        }
        this.documentId.set(id);
        this.loading.set(true);
        this.error.set(null);
        await this.fetch(id);
        this.loading.set(false);
        this.schedulePoll();
    }

    private async fetch(id: string): Promise<void> {
        try {
            // Audit, entities and progress are supplementary: their failure must not hide the analysis.
            const [analysis, audit, entities, detail] = await Promise.all([
                this.api.getAnalysis(id),
                this.api.getAudit(id).catch(() => [] as AuditEntry[]),
                this.api.getEntities(id).catch(() => null),
                this.api.getDocument(id).catch(() => null),
            ]);
            if (this.destroyed || this.documentId() !== id) return;
            this.analysis.set(analysis);
            this.audit.set(audit);
            this.entities.set(entities);
            this.progress.set(detail?.progress ?? null);
            this.error.set(null);
        } catch (e) {
            // Keep whatever we already have; only surface an error when there is nothing to show.
            if (!this.analysis()) this.error.set(e instanceof ApiError ? messageFromApiError(e) : 'Request failed');
        }
    }

    private schedulePoll(): void {
        if (this.destroyed) return;
        if (this.timer) clearTimeout(this.timer);
        if (!this.isProcessing()) return;
        this.timer = setTimeout(async () => {
            const id = this.documentId();
            if (id && !document.hidden) await this.fetch(id);
            this.schedulePoll();
        }, POLL_MS);
    }

    destroy(): void {
        this.destroyed = true;
        if (this.timer) clearTimeout(this.timer);
    }

    /** Reflect the `?finding=` query param into state (called by the page). */
    select(id: string | null): void {
        this.selectedId.set(id);
        this.reviewError.set(null);
    }

    /** Open / close a finding by updating the URL, so it is deep-linkable and Back closes it. */
    openFinding(id: string | undefined | null): void {
        if (!id) return;
        void this.router.navigate([], { queryParams: { finding: id }, queryParamsHandling: 'merge' });
    }

    closeFinding(): void {
        void this.router.navigate([], { queryParams: { finding: null }, queryParamsHandling: 'merge' });
    }

    async rerun(): Promise<void> {
        const id = this.documentId();
        if (!id) return;
        try {
            await this.api.reanalyzeDocument(id);
            this.common.showSuccessMessage('legalAi.rerunStarted');
            await this.open(id);
            void this.docs.refresh();
        } catch (e) {
            this.common.showApiError(e, this.i18n.t('reviewError'));
        }
    }

    async review(decision: 'approve' | 'reject', note: string, status: string): Promise<boolean> {
        const docId = this.documentId();
        const finding = this.selectedFinding();
        if (!docId || !finding?.id || this.reviewBusy()) return false;
        if (decision === 'reject' && !note.trim()) {
            this.reviewError.set(this.i18n.t('reviewNoteHint'));
            return false;
        }
        this.reviewBusy.set(true);
        this.reviewError.set(null);
        try {
            const updated = await this.api.reviewFinding(docId, finding.id, {
                decision,
                note: note.trim() || undefined,
                reviewer: 'User',
                status: decision === 'reject' ? status : undefined,
            });
            this.analysis.update((a) =>
                a ? { ...a, findings: a.findings.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)) } : a,
            );
            this.docs.patch(docId, { needs_review: this.findings().some(findingNeedsReview) });
            void this.docs.refresh();
            return true;
        } catch (e) {
            this.reviewError.set(e instanceof ApiError ? messageFromApiError(e) : this.i18n.t('reviewError'));
            return false;
        } finally {
            this.reviewBusy.set(false);
        }
    }

    /** Download the findings as CSV (BOM-prefixed so Excel reads Arabic correctly). */
    exportCsv(): void {
        const a = this.analysis();
        if (!a) return;
        const header = ['clause', 'topic', 'status', 'severity', 'law', 'article', 'confidence', 'human_review', 'reasoning', 'recommendation', 'source_url'];
        const rows = a.findings.map((f) =>
            [f.clause_number, f.legal_topic, f.status, f.severity, f.law_number, f.article_number, f.confidence, f.human_review_required, f.reasoning, f.recommendation, f.source_url]
                .map(csvCell)
                .join(','),
        );
        const blob = new Blob(['﻿' + [header.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${a.filename.replace(/\.[^.]+$/, '')}-findings.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }
}
