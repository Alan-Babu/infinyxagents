import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { GrammarToolbarComponent } from '../../components/grammar-toolbar/grammar-toolbar';
import { GrammarApiService } from '../../services/grammar-api.service';
import { DocumentDetail, GrammarIssue, QAExchange } from '../../models/grammar.models';
import {
    classificationClass,
    confidenceClass,
    fmtBytes,
    fmtConfidence,
    reviewStatusBadgeClass,
    scoreClass,
    severityClass,
    severityUnderlineClass,
} from '../../utils/grammar-display';

type Tab = 'overview' | 'issues' | 'ask';

interface TextSegment {
    text: string;
    issue: GrammarIssue | null;
}

@Component({
    selector: 'lib-grammar-document-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        RouterLink,
        PageHeaderComponent,
        GrammarToolbarComponent,
    ],
    templateUrl: './document-detail.html',
})
export class DocumentDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(GrammarApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    readonly fmtBytes = fmtBytes;
    readonly fmtConfidence = fmtConfidence;
    readonly scoreClass = scoreClass;
    readonly confidenceClass = confidenceClass;
    readonly classificationClass = classificationClass;
    readonly reviewStatusBadgeClass = reviewStatusBadgeClass;
    readonly severityClass = severityClass;
    readonly severityUnderlineClass = severityUnderlineClass;

    /** Named `doc`, not `document`, to keep the global DOM `document` unambiguous inside this class's methods. */
    doc: DocumentDetail | null = null;
    loading = false;
    activeTab: Tab = 'overview';

    reviewing = false;
    reviewerName = '';
    reviewerNotes = '';

    highlightedIssueId: string | null = null;

    qaHistory: QAExchange[] = [];
    questionInput = '';
    asking = false;
    selectedSuggestion: string | null = null;

    async ngOnInit(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) return;
        await this.loadDocument(id);
    }

    async loadDocument(id: string): Promise<void> {
        this.loading = true;
        try {
            this.doc = await this.api.getDocument(id);
            this.qaHistory = await this.api.listQA(id);
            this.activeTab = 'overview';
            this.highlightedIssueId = null;
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.loadDocumentFailed'));
        } finally {
            this.loading = false;
        }
    }

    backToDocuments(): void {
        this.router.navigateByUrl('/grammar-agent/documents');
    }

    // ---------- inline highlighted original text ----------
    /**
     * Splits `original_text` into a run of plain/highlighted segments, one per
     * `GrammarIssue` span, so the Overview tab can render inline highlights.
     * Overlapping issues (char_start before the running cursor) are skipped —
     * they'd corrupt the slice-based render.
     */
    originalTextSegments(): TextSegment[] {
        if (!this.doc?.original_text) return [];
        const text = this.doc.original_text;
        const issues = [...this.doc.issues].sort((a, b) => a.char_start - b.char_start);
        const segments: TextSegment[] = [];
        let cursor = 0;
        for (const issue of issues) {
            if (issue.char_start < cursor) continue;
            if (issue.char_start > cursor) segments.push({ text: text.slice(cursor, issue.char_start), issue: null });
            segments.push({ text: text.slice(issue.char_start, issue.char_end), issue });
            cursor = issue.char_end;
        }
        if (cursor < text.length) segments.push({ text: text.slice(cursor), issue: null });
        return segments;
    }

    selectIssue(issueId: string): void {
        this.highlightedIssueId = this.highlightedIssueId === issueId ? null : issueId;
        this.activeTab = 'issues';
        setTimeout(() => document.getElementById('issue-' + issueId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }

    // ---------- review ----------
    startReview(): void {
        this.reviewing = true;
        this.reviewerName = '';
        this.reviewerNotes = '';
    }
    cancelReview(): void {
        this.reviewing = false;
    }
    async submitReviewDecision(decision: 'approve' | 'reject'): Promise<void> {
        if (!this.doc) return;
        try {
            const updated = await this.api.reviewDocument(this.doc.id, decision, this.reviewerName.trim(), this.reviewerNotes.trim());
            this.doc = updated;
            this.reviewing = false;
            this.toastr.success(this.translate.instant(decision === 'approve' ? 'grammarAgent.toast.reviewApproved' : 'grammarAgent.toast.reviewRejected'));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.reviewFailed'));
        }
    }

    // ---------- Ask Document ----------
    selectPromptSuggestion(q: string): void {
        this.questionInput = q;
        this.selectedSuggestion = q;
        setTimeout(() => document.getElementById('qa-question-input')?.focus());
    }
    async sendQuestion(): Promise<void> {
        const q = this.questionInput.trim();
        if (!q || !this.doc || this.asking) return;
        this.asking = true;
        this.questionInput = '';
        this.selectedSuggestion = null;
        try {
            const exchange = await this.api.askDocument(this.doc.id, q);
            this.qaHistory.push(exchange);
            setTimeout(() => document.getElementById('qa-scroll-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.askFailed'));
        } finally {
            this.asking = false;
        }
    }

    issueCount(key: string): number {
        return this.doc?.issue_counts?.[key] ?? 0;
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
