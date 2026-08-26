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
import { DocIntelToolbarComponent } from '../../components/doc-intel-toolbar/doc-intel-toolbar';
import { DocIntelApiService } from '../../services/doc-intel-api.service';
import { DocumentDetail, DocumentPageImage, QAExchange } from '../../models/doc-intel.models';
import { complianceClass, confidenceClass, fmtBytes, fmtConfidence, fmtDate, riskClass, statusBadgeClass } from '../../utils/doc-intel-display';

type Tab = 'overview' | 'risk' | 'compliance' | 'stamps' | 'ask';

const OVERVIEW_FIELD_KEYS = ['issued_by_name', 'issued_to_name', 'document_type', 'issued_on', 'valid_through'];

@Component({
    selector: 'lib-doc-intel-document-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        RouterLink,
        PageHeaderComponent,
        DocIntelToolbarComponent,
        VerifySourceDrawerComponent,
    ],
    templateUrl: './document-detail.html',
})
export class DocumentDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(DocIntelApiService);
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
    verifySourceLoading = false;
    sourcePages: DocumentPageImage[] = [];

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
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.loadDocumentFailed'));
        } finally {
            this.loading = false;
        }
    }

    backToDocuments(): void {
        this.router.navigateByUrl('/doc-intel-agent/documents');
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
            this.toastr.success(this.translate.instant(decision === 'approve' ? 'docIntelAgent.toast.reviewApproved' : 'docIntelAgent.toast.reviewRejected'));
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.reviewFailed'));
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
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.askFailed'));
        } finally {
            this.asking = false;
        }
    }

    // ---------- Verify Source ----------
    async openVerifySource(): Promise<void> {
        if (!this.doc) return;
        this.verifySourceVisible = true;
        this.verifySourceLoading = true;
        try {
            this.sourcePages = await this.api.getDocumentPages(this.doc.id);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.loadPagesFailed'));
        } finally {
            this.verifySourceLoading = false;
        }
    }

    fieldLabel(key: string): string {
        return this.translate.instant(`docIntelAgent.fields.${key}`) || key;
    }

    private fieldDisplayValue(key: string): string {
        const d = this.doc as DocumentDetail;
        switch (key) {
            case 'issued_by_name': return d.issued_by_name || '—';
            case 'issued_to_name': return d.issued_to_name || '—';
            case 'document_type': return d.document_type || '—';
            case 'issued_on': return this.fmtDate(d.issued_on);
            case 'valid_through': return d.has_expiry ? this.fmtDate(d.valid_through) : this.translate.instant('docIntelAgent.detail.noExpiry');
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
            sublabel: s.accredited_entity_name || s.ministry_of_foreign_affairs_name || s.description || this.translate.instant('docIntelAgent.verifySource.unlabeled'),
            location: s.location,
        }));
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
