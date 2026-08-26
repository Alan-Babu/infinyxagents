import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { GrammarDropzoneComponent } from '../../components/dropzone/dropzone';
import { GrammarToolbarComponent } from '../../components/grammar-toolbar/grammar-toolbar';
import { GrammarApiService } from '../../services/grammar-api.service';
import { ChunkUploadProgress, ChunkUploadService } from '../../services/chunk-upload.service';
import { DetectionResult, DocUpload, InputMode } from '../../models/grammar.models';

const ACCEPTED_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];

@Component({
    selector: 'lib-grammar-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, PageHeaderComponent, GrammarDropzoneComponent, GrammarToolbarComponent],
    templateUrl: './upload.html',
})
export class UploadPage {
    private readonly api = inject(GrammarApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly router = inject(Router);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    inputMode: InputMode = 'upload';

    doc: DocUpload | null = null;
    uploadProgress: ChunkUploadProgress | null = null;
    detection: DetectionResult | null = null;
    detecting = false;
    checking = false;
    private cancelFlag = false;

    pastedText = '';

    setInputMode(mode: InputMode): void {
        this.inputMode = mode;
        this.doc = null;
        this.detection = null;
    }

    onFileSelected(file: File): void {
        this.beginChunkedUpload(file);
    }

    onDropped(file: File): void {
        const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|docx|txt|jpe?g|png)$/i.test(file.name);
        if (!okType) {
            this.toastr.warning(this.translate.instant('grammarAgent.toast.dropAcceptedOnly'));
            return;
        }
        this.beginChunkedUpload(file);
    }

    async beginChunkedUpload(file: File): Promise<void> {
        this.cancelFlag = false;
        this.uploadProgress = null;
        this.detection = null;
        this.doc = { filename: file.name, size: file.size, pageCount: 0 };

        try {
            const result = await this.chunkUpload.uploadFile(
                file,
                p => { this.uploadProgress = p; },
                () => this.cancelFlag,
            );
            this.doc = { filename: file.name, size: file.size, pageCount: result.pageCount, uploadRef: result.uploadId };
        } catch (err) {
            this.toastr.error(this.cancelFlag
                ? this.translate.instant('grammarAgent.toast.uploadCancelled')
                : this.errorMessage(err, 'grammarAgent.toast.uploadFailed'));
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
        this.detection = null;
    }

    async detectUploadedDocument(): Promise<void> {
        if (!this.doc?.uploadRef || this.detecting) return;
        this.detecting = true;
        try {
            this.detection = await this.api.detectDocument(this.doc.uploadRef);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.detectFailed'));
        } finally {
            this.detecting = false;
        }
    }

    async checkUploadedDocument(): Promise<void> {
        if (!this.doc?.uploadRef || this.checking) return;
        await this.runCheck({ uploadRef: this.doc.uploadRef });
    }

    pastedWordCount(): number {
        const trimmed = this.pastedText.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    async checkPastedText(): Promise<void> {
        const text = this.pastedText.trim();
        if (!text) {
            this.toastr.warning(this.translate.instant('grammarAgent.toast.pasteTextFirst'));
            return;
        }
        await this.runCheck({ text });
    }

    private async runCheck(payload: { uploadRef?: string; text?: string }): Promise<void> {
        this.checking = true;
        try {
            const detail = await this.api.checkDocument(payload);
            this.router.navigateByUrl(`/grammar-agent/documents/${detail.id}`);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'grammarAgent.toast.checkFailed'));
        } finally {
            this.checking = false;
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
