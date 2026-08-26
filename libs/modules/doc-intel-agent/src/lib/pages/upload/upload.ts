import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { DocIntelDropzoneComponent } from '../../components/dropzone/dropzone';
import { DocIntelToolbarComponent } from '../../components/doc-intel-toolbar/doc-intel-toolbar';
import { DocIntelApiService } from '../../services/doc-intel-api.service';
import { ChunkUploadProgress, ChunkUploadService } from '@nfinyx/chunk-transfer';
import { DocUpload } from '../../models/doc-intel.models';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
    selector: 'lib-doc-intel-upload',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, PageHeaderComponent, DocIntelDropzoneComponent, DocIntelToolbarComponent],
    templateUrl: './upload.html',
})
export class UploadPage {
    private readonly api = inject(DocIntelApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly router = inject(Router);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    doc: DocUpload | null = null;
    uploadProgress: ChunkUploadProgress | null = null;
    analyzing = false;
    private cancelFlag = false;

    onFileSelected(file: File): void {
        this.beginChunkedUpload(file);
    }

    onDropped(file: File): void {
        const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
        if (!okType) {
            this.toastr.warning(this.translate.instant('docIntelAgent.toast.dropAcceptedOnly'));
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
            this.toastr.error(this.cancelFlag
                ? this.translate.instant('docIntelAgent.toast.uploadCancelled')
                : this.errorMessage(err, 'docIntelAgent.toast.uploadFailed'));
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

    async analyzeDocument(): Promise<void> {
        if (!this.doc?.uploadRef || this.analyzing) return;
        this.analyzing = true;
        try {
            const detail = await this.api.analyzeDocument(this.doc.uploadRef);
            this.router.navigateByUrl(`/doc-intel-agent/documents/${detail.id}`);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docIntelAgent.toast.analysisFailed'));
        } finally {
            this.analyzing = false;
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
