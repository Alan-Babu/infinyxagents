import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ChunkUploadProgress, ChunkUploadService } from '@nfinyx/chunk-transfer';
import { ContractAnalyzerDropzoneComponent } from '../../components/dropzone/dropzone';
import { PartyFormComponent, PartyFormModel } from '../../components/party-form/party-form';
import { QuestionsFormComponent, QuestionsFormModel } from '../../components/questions-form/questions-form';
import { ContractAnalyzerToolbarComponent } from '../../components/contract-analyzer-toolbar/contract-analyzer-toolbar';
import { ContractAnalyzerApiService } from '../../services/contract-analyzer-api.service';
import { ContractUpload, DetectionResult, QuestionsResult } from '../../models/contract-analyzer.models';

type WizardStep = 'upload' | 'party' | 'questions';

const ACCEPTED_EXTENSIONS = /\.(pdf|docx|txt|jpe?g|png)$/i;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Component({
    selector: 'lib-contract-analyzer-upload',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        PageHeaderComponent,
        ContractAnalyzerDropzoneComponent,
        PartyFormComponent,
        QuestionsFormComponent,
        ContractAnalyzerToolbarComponent,
    ],
    templateUrl: './upload.html',
})
export class UploadPage {
    private readonly api = inject(ContractAnalyzerApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly router = inject(Router);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    step: WizardStep = 'upload';

    doc: ContractUpload | null = null;
    uploadProgress: ChunkUploadProgress | null = null;
    private cancelFlag = false;
    detecting = false;

    detection: DetectionResult | null = null;
    partyModel: PartyFormModel = { partyA: { name: '', type: 'Commercial' }, partyB: { name: '', type: 'Commercial' } };
    fetchingQuestions = false;

    questionsResult: QuestionsResult | null = null;
    questionsModel: QuestionsFormModel = { answers: [], cashFlowContext: '', previousContractNotes: '' };
    analyzing = false;

    // ---------- Upload ----------
    onFileSelected(file: File): void {
        this.beginChunkedUpload(file);
    }

    onDropped(file: File): void {
        const okType = ACCEPTED_EXTENSIONS.test(file.name);
        if (!okType || file.size > MAX_FILE_SIZE) {
            this.common.showWarningMessage(this.translate.instant('contractAnalyzer.toast.dropAcceptedOnly'));
            return;
        }
        this.beginChunkedUpload(file);
    }

    async beginChunkedUpload(file: File): Promise<void> {
        this.cancelFlag = false;
        this.uploadProgress = null;
        this.doc = { filename: file.name, size: file.size, pageCount: 0 };

        try {
            const result = await this.chunkUpload.uploadFile(
                this.api,
                file,
                p => { this.uploadProgress = p; },
                () => this.cancelFlag,
            );
            this.doc = { filename: file.name, size: file.size, pageCount: result.pageCount, uploadRef: result.uploadId };
        } catch (err) {
            if (this.cancelFlag) {
                this.common.showWarningMessage(this.translate.instant('contractAnalyzer.toast.uploadCancelled'));
            } else {
                this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.uploadFailed'));
            }
            this.doc = null;
        } finally {
            this.uploadProgress = null;
        }
    }

    cancelUpload(): void {
        this.cancelFlag = true;
    }

    clearDoc(): void {
        this.doc = null;
    }

    async detectContract(): Promise<void> {
        if (!this.doc?.uploadRef || this.detecting) return;
        this.detecting = true;
        try {
            const result = await this.api.detectContract(this.doc.uploadRef);
            this.detection = result;
            this.partyModel = {
                partyA: { name: result.party_a_name || '', type: result.party_a_type || 'Commercial' },
                partyB: { name: result.party_b_name || '', type: result.party_b_type || 'Commercial' },
            };
            this.step = 'party';
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.detectFailed'));
        } finally {
            this.detecting = false;
        }
    }

    // ---------- Party confirmation ----------
    backToUpload(): void {
        this.step = 'upload';
        this.doc = null;
        this.detection = null;
    }

    async fetchQuestions(): Promise<void> {
        if (!this.doc?.uploadRef || this.fetchingQuestions) return;
        this.fetchingQuestions = true;
        try {
            const result = await this.api.getQuestions(this.doc.uploadRef);
            this.questionsResult = result;
            this.questionsModel = { answers: result.questions.map(() => ''), cashFlowContext: '', previousContractNotes: '' };
            this.step = 'questions';
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.questionsFailed'));
        } finally {
            this.fetchingQuestions = false;
        }
    }

    // ---------- Clarifying questions ----------
    backToParty(): void {
        this.step = 'party';
    }

    async analyzeContract(): Promise<void> {
        if (!this.doc?.uploadRef || this.analyzing || !this.questionsModel.cashFlowContext.trim()) return;
        this.analyzing = true;
        try {
            const detail = await this.api.analyzeContract({
                uploadRef: this.doc.uploadRef,
                partyAName: this.partyModel.partyA.name,
                partyAType: this.partyModel.partyA.type,
                partyBName: this.partyModel.partyB.name,
                partyBType: this.partyModel.partyB.type,
                questions: this.questionsResult?.questions || [],
                answers: this.questionsModel.answers,
                cashFlowContext: this.questionsModel.cashFlowContext,
                previousContractNotes: this.questionsModel.previousContractNotes,
            });
            this.router.navigateByUrl(`/contract-analyzer/contracts/${detail.id}`);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('contractAnalyzer.toast.analysisFailed'));
        } finally {
            this.analyzing = false;
        }
    }
}
