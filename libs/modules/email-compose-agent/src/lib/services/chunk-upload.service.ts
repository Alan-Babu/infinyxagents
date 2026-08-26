import { Injectable } from '@angular/core';
import { EmailComposeApiBase } from './email-compose-api-base';

/** 512KB per chunk — small enough to show a clear breakdown in the upload UI. */
export const CHUNK_SIZE = 512 * 1024;

export type ChunkState = 'pending' | 'uploading' | 'done' | 'error';

export interface ChunkStatus {
    index: number;
    sizeBytes: number;
    state: ChunkState;
}

export interface ChunkUploadProgress {
    uploadId: string;
    filename: string;
    chunks: ChunkStatus[];
    chunksDone: number;
    totalChunks: number;
    bytesUploaded: number;
    totalBytes: number;
    percent: number;
}

export interface CompletedUpload {
    uploadId: string;
    filename: string;
    size: number;
    pageCount: number;
    fileType: string;
}

interface InitUploadResponse {
    upload_id: string;
}

interface CompleteUploadResponse {
    filename: string;
    size: number;
    page_count: number;
    file_type: string;
}

@Injectable({ providedIn: 'root' })
export class ChunkUploadService extends EmailComposeApiBase {
    /**
     * Splits `file` into fixed-size chunks and PUTs them one at a time so the
     * caller can render a live, chunk-by-chunk progress breakdown. Resolves once
     * the server has assembled + validated the whole file.
     */
    async uploadFile(
        file: File,
        onProgress: (p: ChunkUploadProgress) => void,
        shouldCancel: () => boolean = () => false,
    ): Promise<CompletedUpload> {
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

        const initRes = await this.post<InitUploadResponse>('/uploads/init', {
            filename: file.name,
            total_size: file.size,
            total_chunks: totalChunks,
        });
        const uploadId = initRes.upload_id;

        const chunks: ChunkStatus[] = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            chunks.push({ index: i, sizeBytes: end - start, state: 'pending' });
        }

        let bytesUploaded = 0;
        const emit = () => {
            const chunksDone = chunks.filter(c => c.state === 'done').length;
            onProgress({
                uploadId, filename: file.name, chunks: chunks.map(c => ({ ...c })),
                chunksDone, totalChunks,
                bytesUploaded, totalBytes: file.size,
                percent: file.size === 0 ? 100 : Math.round((bytesUploaded / file.size) * 100),
            });
        };
        emit();

        for (let i = 0; i < totalChunks; i++) {
            if (shouldCancel()) {
                throw new Error('Upload cancelled');
            }
            chunks[i].state = 'uploading';
            emit();

            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const blob = file.slice(start, end);

            try {
                await this.put(`/uploads/${uploadId}/chunk/${i}`, blob, {
                    headers: { 'Content-Type': 'application/octet-stream' },
                });
                chunks[i].state = 'done';
                bytesUploaded += chunks[i].sizeBytes;
            } catch (err) {
                chunks[i].state = 'error';
                emit();
                throw err;
            }
            emit();
        }

        const completeRes = await this.post<CompleteUploadResponse>(`/uploads/${uploadId}/complete`, {});

        return {
            uploadId,
            filename: completeRes.filename,
            size: completeRes.size,
            pageCount: completeRes.page_count,
            fileType: completeRes.file_type,
        };
    }
}
