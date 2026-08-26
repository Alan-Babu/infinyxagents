import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ChunkDownloadProgress, ChunkDownloadService } from '@nfinyx/chunk-transfer';
import { ContractAnalyzerToolbarComponent } from '../../components/contract-analyzer-toolbar/contract-analyzer-toolbar';
import { RiskDashboardComponent } from '../../components/risk-dashboard/risk-dashboard';
import { AskAgentChatComponent } from '../../components/ask-agent-chat/ask-agent-chat';
import { ContractAnalyzerApiService } from '../../services/contract-analyzer-api.service';
import { ContractDetail, QAExchange } from '../../models/contract-analyzer.models';
import { confidenceClass, fmtBytes, fmtConfidence, fmtCurrency, fmtDate, reviewStatusClass, riskClass } from '../../utils/contract-display';

type Tab = 'overview' | 'risk' | 'clauses' | 'recommendations' | 'ask';

@Component({
    selector: 'lib-contract-analyzer-contract-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        TooltipModule,
        RouterLink,
        PageHeaderComponent,
        ContractAnalyzerToolbarComponent,
        RiskDashboardComponent,
        AskAgentChatComponent,
    ],
    templateUrl: './contract-detail.html',
})
export class ContractDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(ContractAnalyzerApiService);
    private readonly chunkDownload = inject(ChunkDownloadService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    readonly fmtBytes = fmtBytes;
    readonly fmtDate = fmtDate;
    readonly fmtCurrency = fmtCurrency;
    readonly riskClass = riskClass;
    readonly reviewStatusClass = reviewStatusClass;
    readonly confidenceClass = confidenceClass;
    readonly fmtConfidence = fmtConfidence;

    /** Named `doc`, not `contract`-only, but kept short and unambiguous inside this class's methods. */
    doc: ContractDetail | null = null;
    loading = false;
    activeTab: Tab = 'overview';

    reviewing = false;
    reviewerName = '';
    reviewerNotes = '';

    qaHistory: QAExchange[] = [];
    asking = false;

    downloadingReport = false;
    downloadProgress: ChunkDownloadProgress | null = null;

    async ngOnInit(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) return;
        await this.loadContract(id);
    }

    async loadContract(id: string): Promise<void> {
        this.loading = true;
        try {
            this.doc = await this.api.getContract(id);
            this.qaHistory = await this.api.listQA(id);
            this.activeTab = 'overview';
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.loadContractFailed'));
        } finally {
            this.loading = false;
        }
    }

    backToContracts(): void {
        this.router.navigateByUrl('/contract-analyzer/contracts');
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
            const updated = await this.api.reviewContract(this.doc.id, decision, this.reviewerName.trim(), this.reviewerNotes.trim());
            this.doc = updated;
            this.reviewing = false;
            this.common.showSuccessMessage(this.translate.instant(decision === 'approve' ? 'contractAnalyzer.toast.reviewApproved' : 'contractAnalyzer.toast.reviewRejected'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.reviewFailed'));
        }
    }

    // ---------- Ask Agent ----------
    async sendQuestion(question: string): Promise<void> {
        if (!this.doc || this.asking) return;
        this.asking = true;
        try {
            const exchange = await this.api.askContract(this.doc.id, question);
            this.qaHistory.push(exchange);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.askFailed'));
        } finally {
            this.asking = false;
        }
    }

    // ---------- Copy link ----------
    async copyLink(): Promise<void> {
        try {
            await navigator.clipboard.writeText(window.location.href);
            this.common.showSuccessMessage(this.translate.instant('contractAnalyzer.detail.linkCopied'));
        } catch {
            this.common.showErrorMessage(this.translate.instant('contractAnalyzer.detail.linkCopyFailed'));
        }
    }

    // ---------- Report download (chunked) ----------
    async downloadReport(): Promise<void> {
        if (!this.doc || this.downloadingReport) return;
        this.downloadingReport = true;
        this.downloadProgress = null;
        try {
            const prep = await this.api.prepareReportDownload(this.doc.id);
            const blob = await this.chunkDownload.downloadFile(
                this.api,
                prep.download_id,
                prep.filename,
                prep.total_chunks,
                prep.total_size,
                (downloadId, index) => `/contracts/report/chunk/${downloadId}/${index}`,
                p => { this.downloadProgress = p; },
            );
            this.saveBlob(blob, prep.filename);
            this.common.showSuccessMessage(this.translate.instant('contractAnalyzer.detail.reportDownloaded'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.detail.reportDownloadFailed'));
        } finally {
            this.downloadingReport = false;
            this.downloadProgress = null;
        }
    }

    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }
}
