import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChunkUploadProgress } from '../../services/chunk-upload.service';
import { DocUpload } from '../../models/grammar.models';

/** Single-file dropzone for the check-grammar upload flow — accepts PDF/DOCX/TXT/JPG/PNG, uploaded in chunks. */
@Component({
    selector: 'lib-grammar-dropzone',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, ProgressBarModule],
    templateUrl: './dropzone.html',
})
export class GrammarDropzoneComponent {
    @Input() doc: DocUpload | null = null;
    @Input() uploadProgress: ChunkUploadProgress | undefined;

    @Output() fileSelected = new EventEmitter<File>();
    @Output() dropped = new EventEmitter<File>();
    @Output() clearDoc = new EventEmitter<void>();
    @Output() cancelUpload = new EventEmitter<void>();

    onFileInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) this.fileSelected.emit(file);
        input.value = '';
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        if (file) this.dropped.emit(file);
    }

    fmtBytes(n?: number): string {
        if (!n) return '';
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        return (n / (1024 * 1024)).toFixed(2) + ' MB';
    }

    trackByChunkIndex(_i: number, c: { index: number }): number {
        return c.index;
    }
}
