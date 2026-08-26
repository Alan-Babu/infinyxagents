import { Injectable } from '@angular/core';

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
}

export interface ChunkDownloadProgress {
    downloadId: string;
    filename: string;
    chunksDone: number;
    totalChunks: number;
    bytesDone: number;
    totalBytes: number;
    percent: number;
}

interface InitUploadResponse {
    upload_id: string;
}

interface CompleteUploadResponse {
    filename: string;
    size: number;
    page_count: number;
}

/**
 * Minimal structural interface any `*ApiBase` (which already extends
 * `ApiService`) satisfies for free — callers just pass `this`. Keeps the
 * chunk-transfer services decoupled from any one module's API base class.
 */
export interface ChunkTransferClient {
    post<T>(path: string, body: unknown): Promise<T>;
    put<T>(path: string, body: unknown, options?: { headers?: Record<string, string> }): Promise<T>;
    getBlob(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<Blob>;
}

@Injectable({ providedIn: 'root' })
export class ChunkUploadService {
    /**
     * Splits `file` into fixed-size chunks and PUTs them one at a time via
     * `client` so the caller can render a live, chunk-by-chunk progress
     * breakdown. Resolves once the server has assembled + validated the
     * whole file.
     */
    async uploadFile(
        client: ChunkTransferClient,
        file: File,
        onProgress: (p: ChunkUploadProgress) => void,
        shouldCancel: () => boolean = () => false,
    ): Promise<CompletedUpload> {
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

        const initRes = await client.post<InitUploadResponse>('/uploads/init', {
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
                await client.put(`/uploads/${uploadId}/chunk/${i}`, blob, {
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

        const completeRes = await client.post<CompleteUploadResponse>(`/uploads/${uploadId}/complete`, {});

        return {
            uploadId,
            filename: completeRes.filename,
            size: completeRes.size,
            pageCount: completeRes.page_count,
        };
    }
}

@Injectable({ providedIn: 'root' })
export class ChunkDownloadService {
    /**
     * Symmetric counterpart to `ChunkUploadService`: the server has already
     * "prepared" the file (POST `preparePath`, handled by the caller before
     * invoking this), returning a `download_id`/chunk count; this fetches
     * each chunk as a binary blob via `client.getBlob(chunkPathBuilder(...))`
     * in turn and reassembles them client-side into a single `Blob`, using
     * the server's own `chunk_size` for reassembly bookkeeping rather than
     * the local `CHUNK_SIZE` constant, in case they ever diverge.
     */
    async downloadFile(
        client: ChunkTransferClient,
        downloadId: string,
        filename: string,
        totalChunks: number,
        totalBytes: number,
        chunkPathBuilder: (downloadId: string, index: number) => string,
        onProgress: (p: ChunkDownloadProgress) => void,
        shouldCancel: () => boolean = () => false,
    ): Promise<Blob> {
        const parts: Blob[] = [];
        let bytesDone = 0;

        const emit = () => {
            onProgress({
                downloadId, filename, chunksDone: parts.length, totalChunks,
                bytesDone, totalBytes,
                percent: totalBytes === 0 ? 100 : Math.round((bytesDone / totalBytes) * 100),
            });
        };
        emit();

        for (let i = 0; i < totalChunks; i++) {
            if (shouldCancel()) {
                throw new Error('Download cancelled');
            }
            const chunk = await client.getBlob(chunkPathBuilder(downloadId, i));
            parts.push(chunk);
            bytesDone += chunk.size;
            emit();
        }

        return new Blob(parts);
    }
}
