import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { TranslatorDropzoneComponent } from '../../components/dropzone/dropzone';
import { TranslatorToolbarComponent } from '../../components/translator-toolbar/translator-toolbar';
import { TranslatorApiService } from '../../services/translator-api.service';
import { ChunkUploadProgress, ChunkUploadService } from '../../services/chunk-upload.service';
import { DetectionResult, DocUpload } from '../../models/translator.models';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

type Screen = 'upload' | 'pageSelect';
type PageSelectionMode = 'all' | 'custom';

@Component({
    selector: 'lib-translator-upload',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, PageHeaderComponent, TranslatorDropzoneComponent, TranslatorToolbarComponent],
    templateUrl: './upload.html',
})
export class UploadPage {
    private readonly api = inject(TranslatorApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly router = inject(Router);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);

    screen: Screen = 'upload';

    doc: DocUpload | null = null;
    uploadProgress: ChunkUploadProgress | null = null;
    detecting = false;
    translating = false;
    private cancelFlag = false;

    detection: DetectionResult | null = null;
    pageSelectionMode: PageSelectionMode = 'all';
    selectedPages: Set<number> = new Set();

    onFileSelected(file: File): void {
        this.beginChunkedUpload(file);
    }

    onDropped(file: File): void {
        const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
        if (!okType) {
            this.toastr.warning(this.translate.instant('translatorAgent.toast.dropAcceptedOnly'));
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
                file,
                p => { this.uploadProgress = p; },
                () => this.cancelFlag,
            );
            this.doc = { filename: file.name, size: file.size, pageCount: result.pageCount, uploadRef: result.uploadId };
        } catch (err) {
            this.toastr.error(this.cancelFlag
                ? this.translate.instant('translatorAgent.toast.uploadCancelled')
                : this.errorMessage(err, 'translatorAgent.toast.uploadFailed'));
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

    // ---------- detect -> (page selection) -> translate ----------
    async detectLanguageAndPages(): Promise<void> {
        if (!this.doc?.uploadRef || this.detecting) return;
        this.detecting = true;
        try {
            const result = await this.api.detectDocument(this.doc.uploadRef);
            this.detection = result;
            this.selectedPages = new Set(Array.from({ length: result.page_count }, (_, i) => i + 1));
            if (result.ask_page_selection) {
                this.pageSelectionMode = 'all';
                this.screen = 'pageSelect';
            } else {
                await this.translateDocument();
            }
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.detectionFailed'));
        } finally {
            this.detecting = false;
        }
    }

    // ---------- page selection screen ----------
    setPageSelectionMode(mode: PageSelectionMode): void {
        this.pageSelectionMode = mode;
        if (mode === 'all' && this.detection) {
            this.selectedPages = new Set(Array.from({ length: this.detection.page_count }, (_, i) => i + 1));
        }
    }

    togglePageSelected(pageNum: number): void {
        if (this.selectedPages.has(pageNum)) this.selectedPages.delete(pageNum);
        else this.selectedPages.add(pageNum);
    }

    isPageSelected(pageNum: number): boolean {
        return this.selectedPages.has(pageNum);
    }

    get pageNumbers(): number[] {
        return this.detection ? Array.from({ length: this.detection.page_count }, (_, i) => i + 1) : [];
    }

    get selectedPageCount(): number {
        return this.selectedPages.size;
    }

    async confirmPageSelection(): Promise<void> {
        if (this.selectedPageCount === 0) {
            this.toastr.warning(this.translate.instant('translatorAgent.pageSelect.selectAtLeastOne'));
            return;
        }
        await this.translateDocument();
    }

    cancelPageSelection(): void {
        this.screen = 'upload';
        this.doc = null;
        this.detection = null;
    }

    async translateDocument(): Promise<void> {
        if (!this.doc?.uploadRef || this.translating) return;
        const pages = Array.from(this.selectedPages).sort((a, b) => a - b);
        const translatingAll = this.detection ? pages.length === this.detection.page_count : true;
        this.translating = true;
        try {
            const detail = await this.api.translateDocument(this.doc.uploadRef, translatingAll ? undefined : pages);
            this.router.navigateByUrl(`/translator-agent/documents/${detail.id}`);
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'translatorAgent.toast.translationFailed'));
        } finally {
            this.translating = false;
        }
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
