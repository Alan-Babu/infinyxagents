import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChunkUploadProgress } from '@nfinyx/chunk-transfer';
import { ContractUpload } from '../../models/contract-analyzer.models';
import { fmtBytes } from '../../utils/contract-display';

/** Single-file dropzone for the contract-analyzer upload flow — accepts PDF/DOCX/TXT/JPG/PNG up to 20MB, uploaded in chunks. */
@Component({
    selector: 'lib-contract-analyzer-dropzone',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, ProgressBarModule],
    templateUrl: './dropzone.html',
})
export class ContractAnalyzerDropzoneComponent {
    @Input() doc: ContractUpload | null = null;
    @Input() uploadProgress: ChunkUploadProgress | undefined;

    @Output() fileSelected = new EventEmitter<File>();
    @Output() dropped = new EventEmitter<File>();
    @Output() clearDoc = new EventEmitter<void>();
    @Output() cancelUpload = new EventEmitter<void>();

    readonly fmtBytes = fmtBytes;

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

    trackByChunkIndex(_i: number, c: { index: number }): number {
        return c.index;
    }
}
