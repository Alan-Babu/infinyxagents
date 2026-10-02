import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { SourceOverlayField, SourceOverlayStamp, VerifySourceDrawerComponent } from '@nfinyx/document-agent';
import { TranslatorToolbarComponent } from '../../components/translator-toolbar/translator-toolbar';
import { TranslatorApiService } from '../../services/translator-api.service';
import {
    DocumentDetail,
    DocumentPageImage,
    QAExchange,
    SUMMARY_TYPES,
    SummaryEntry,
    SummaryFailure,
    SummaryType,
} from '../../models/translator.models';
import { complianceClass, confidenceClass, fmtBytes, fmtConfidence, fmtDate, riskClass, statusBadgeClass } from '../../utils/translator-display';

type Tab = 'overview' | 'risk' | 'compliance' | 'stamps' | 'translation' | 'summary' | 'ask';

const OVERVIEW_FIELD_KEYS = ['issued_by_name', 'issued_to_name', 'document_type', 'issued_on', 'valid_through'];

@Component({
    selector: 'lib-translator-document-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        RouterLink,
        PageHeaderComponent,
        TranslatorToolbarComponent,
        VerifySourceDrawerComponent,
    ],
    templateUrl: './document-detail.html',
})
export class DocumentDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(TranslatorApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    readonly fmtBytes = fmtBytes;
    readonly fmtDate = fmtDate;
    readonly riskClass = riskClass;
    readonly statusBadgeClass = statusBadgeClass;
    readonly confidenceClass = confidenceClass;
    readonly complianceClass = complianceClass;
    readonly fmtConfidence = fmtConfidence;

    /** Named `doc`, not `document`, to keep the global DOM `document` unambiguous inside this class's methods. */
    doc: DocumentDetail | null = null;
    loading = false;
    activeTab: Tab = 'overview';

    reviewing = false;
    reviewerName = '';
    reviewerNotes = '';

    qaHistory: QAExchange[] = [];
    questionInput = '';
    asking = false;
    selectedSuggestion: string | null = null;

    verifySourceVisible = false;
    sourcePages: DocumentPageImage[] = [];
    pagesLoading = false;

    /** Page-by-page original/translated split view */
    activePageTab = 1;

    // ---------- summaries ----------
    readonly summaryTypes = SUMMARY_TYPES;
    selectedSummaryTypes = new Set<SummaryType>(['concise']);
    summaries: SummaryEntry[] = [];
    summaryFailures: SummaryFailure[] = [];
    generatingSummary = false;
    copiedSummaryType: SummaryType | null = null;

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
            this.summaries = this.doc.summaries ?? [];
            this.summaryFailures = [];
            this.activeTab = 'overview';
            this.activePageTab = this.doc.pages_translated[0] || 1;
            await this.loadSourcePages(id);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.loadDocumentFailed'));
        } finally {
            this.loading = false;
        }
    }

    async loadSourcePages(id: string): Promise<void> {
        this.pagesLoading = true;
        try {
            this.sourcePages = await this.api.getDocumentPages(id);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.loadPagesFailed'));
        } finally {
            this.pagesLoading = false;
        }
    }

    backToDocuments(): void {
        this.router.navigateByUrl('/translator-agent/documents');
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
            this.toastr.success(this.translate.instant(decision === 'approve' ? 'translatorAgent.toast.reviewApproved' : 'translatorAgent.toast.reviewRejected'));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.reviewFailed'));
        }
    }

    // ---------- Summaries ----------
    isSummaryTypeSelected(type: SummaryType): boolean {
        return this.selectedSummaryTypes.has(type);
    }

    toggleSummaryType(type: SummaryType): void {
        const next = new Set(this.selectedSummaryTypes);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        this.selectedSummaryTypes = next;
    }

    /** Summaries for the selected types, in the canonical display order. */
    get visibleSummaries(): SummaryEntry[] {
        return this.summaryTypes
            .filter(type => this.selectedSummaryTypes.has(type))
            .map(type => this.summaries.find(s => s.summary_type === type))
            .filter((s): s is SummaryEntry => !!s);
    }

    /** True when every selected type already has a summary, so the action becomes "Regenerate". */
    get allSelectedSummarized(): boolean {
        return this.selectedSummaryTypes.size > 0 && this.visibleSummaries.length === this.selectedSummaryTypes.size;
    }

    summaryFailureMessage(failure: SummaryFailure): string {
        return this.translate.instant('translatorAgent.summary.failedType', {
            type: this.translate.instant(`translatorAgent.summary.types.${failure.summary_type}.name`),
            message: failure.message,
        });
    }

    async generateSummaries(): Promise<void> {
        if (!this.doc || this.generatingSummary || this.selectedSummaryTypes.size === 0) return;
        const regenerate = this.allSelectedSummarized;
        const requested = this.summaryTypes.filter(type => this.selectedSummaryTypes.has(type));
        this.generatingSummary = true;
        this.summaryFailures = [];
        try {
            const result = await this.api.generateSummaries(this.doc.id, requested, regenerate);
            const generated = new Set(result.summaries.map(s => s.summary_type));
            this.summaries = [...this.summaries.filter(s => !generated.has(s.summary_type)), ...result.summaries];
            this.summaryFailures = result.failed;
            if (result.summaries.length) {
                this.toastr.success(this.translate.instant('translatorAgent.toast.summaryGenerated'));
            }
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.summaryFailed'));
        } finally {
            this.generatingSummary = false;
        }
    }

    async deleteSummary(type: SummaryType): Promise<void> {
        if (!this.doc) return;
        try {
            await this.api.deleteSummary(this.doc.id, type);
            this.summaries = this.summaries.filter(s => s.summary_type !== type);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.summaryDeleteFailed'));
        }
    }

    async copySummary(entry: SummaryEntry): Promise<void> {
        try {
            await navigator.clipboard.writeText(entry.summary);
            this.copiedSummaryType = entry.summary_type;
            setTimeout(() => {
                if (this.copiedSummaryType === entry.summary_type) this.copiedSummaryType = null;
            }, 1500);
        } catch {
            this.toastr.error(this.translate.instant('translatorAgent.toast.copyFailed'));
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
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.askFailed'));
        } finally {
            this.asking = false;
        }
    }

    // ---------- Verify Source ----------
    openVerifySource(): void {
        if (!this.doc) return;
        this.verifySourceVisible = true;
    }

    fieldLabel(key: string): string {
        return this.translate.instant(`translatorAgent.fields.${key}`) || key;
    }

    private fieldDisplayValue(key: string): string {
        const d = this.doc as DocumentDetail;
        switch (key) {
            case 'issued_by_name': return d.issued_by_name || '—';
            case 'issued_to_name': return d.issued_to_name || '—';
            case 'document_type': return d.document_type || '—';
            case 'issued_on': return this.fmtDate(d.issued_on);
            case 'valid_through': return d.has_expiry ? this.fmtDate(d.valid_through) : this.translate.instant('translatorAgent.detail.noExpiry');
            default: return '—';
        }
    }

    verifySourceFields(): SourceOverlayField[] {
        if (!this.doc) return [];
        return OVERVIEW_FIELD_KEYS.map(key => ({
            key,
            label: this.fieldLabel(key),
            value: this.fieldDisplayValue(key),
            location: this.doc?.field_locations[key],
        }));
    }

    verifySourceStamps(): SourceOverlayStamp[] {
        if (!this.doc) return [];
        return this.doc.stamps_and_signatures.map(s => ({
            label: s.type,
            sublabel: s.accredited_entity_name || s.ministry_of_foreign_affairs_name || s.description || this.translate.instant('translatorAgent.verifySource.unlabeled'),
            location: s.location,
        }));
    }

    // ---------- split view: original (left) vs translated (right) ----------
    translatedTextForPage(pageNum: number): string | null {
        if (!this.doc) return null;
        const tp = this.doc.translated_pages.find(t => t.page_num === pageNum);
        return tp ? tp.translated_text : null;
    }
    originalImageForPage(pageNum: number): DocumentPageImage | undefined {
        return this.sourcePages.find(p => p.page_num === pageNum);
    }
    isPageTranslated(pageNum: number): boolean {
        return this.doc?.pages_translated.includes(pageNum) || false;
    }
    /** True when the page was already English, so the "translation" is the original text. */
    isPageSkipped(pageNum: number): boolean {
        return this.doc?.translated_pages.find(t => t.page_num === pageNum)?.skipped === true;
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
