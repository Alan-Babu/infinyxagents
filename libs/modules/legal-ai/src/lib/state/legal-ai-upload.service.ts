import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError, messageFromApiError } from '@nfinyx/types';
import { LEGAL_AI_BASE } from '../legal-ai.paths';
import { LegalAiApiService } from '../services/legal-ai-api.service';
import { LegalAiI18n } from '../services/legal-ai-i18n.service';
import { LegalAiDocumentsStore } from './legal-ai-documents.store';
import { LegalAiUiState } from './legal-ai-ui.state';

const MAX_ATTEMPTS = 3;
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = ['pdf', 'docx', 'txt'];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class LegalAiUploadService {
    private readonly api = inject(LegalAiApiService);
    private readonly docs = inject(LegalAiDocumentsStore);
    private readonly ui = inject(LegalAiUiState);
    private readonly i18n = inject(LegalAiI18n);
    private readonly router = inject(Router);

    readonly file = signal<File | null>(null);
    readonly busy = signal(false);
    readonly error = signal<string | null>(null);
    readonly notice = signal<string | null>(null);

    /** Validate and stage a file. Returns false (and sets `error`) when rejected. */
    pick(file: File | null | undefined): boolean {
        this.error.set(null);
        if (!file) return false;
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED.includes(ext)) {
            this.error.set(this.i18n.t('unsupportedFile'));
            return false;
        }
        if (file.size > MAX_BYTES) {
            this.error.set(this.i18n.t('fileTooLarge'));
            return false;
        }
        this.file.set(file);
        return true;
    }

    clear(): void {
        this.file.set(null);
        this.error.set(null);
        this.notice.set(null);
    }

    /** Upload with up to 3 attempts; only network failures (no HTTP status) are retried. */
    async submit(): Promise<void> {
        const file = this.file();
        if (!file || this.busy()) return;
        this.busy.set(true);
        this.error.set(null);
        this.notice.set(null);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const created = await this.api.uploadDocument(file);
                this.busy.set(false);
                this.clear();
                this.ui.closeUpload();
                void this.docs.refresh();
                void this.router.navigate([LEGAL_AI_BASE, 'documents', created.id]);
                return;
            } catch (e) {
                const network = e instanceof ApiError && e.status === 0;
                if (network && attempt < MAX_ATTEMPTS) {
                    this.notice.set(this.i18n.t('uploadRetry', { n: attempt, max: MAX_ATTEMPTS }));
                    await sleep(attempt * 5_000);
                    continue;
                }
                this.notice.set(null);
                this.error.set(
                    network
                        ? this.i18n.t('loadError')
                        : this.i18n.t('uploadFailed', { detail: e instanceof ApiError ? messageFromApiError(e) : String(e) }),
                );
                break;
            }
        }
        this.busy.set(false);
    }
}
