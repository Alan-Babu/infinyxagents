import { computed, inject, Injectable, signal } from '@angular/core';
import { DocumentItem } from '../models/legal-ai.models';
import { LegalAiApiService } from '../services/legal-ai-api.service';
import { ApiError, messageFromApiError } from '@nfinyx/types';

const POLL_ACTIVE_MS = 4_000;
const POLL_IDLE_MS = 30_000;

/**
 * The workspace's document list.
 *
 * Polling is adaptive: fast while any document is being analysed, slow otherwise, and paused
 * while the browser tab is hidden. The owner (the module shell) starts and stops it.
 */
@Injectable({ providedIn: 'root' })
export class LegalAiDocumentsStore {
    private readonly api = inject(LegalAiApiService);

    readonly documents = signal<DocumentItem[]>([]);
    readonly loaded = signal(false);
    readonly error = signal<string | null>(null);

    readonly processing = computed(() => this.documents().filter((d) => d.status === 'PROCESSING'));
    readonly stats = computed(() => {
        const docs = this.documents();
        const high = docs.filter((d) => d.high_risk).length;
        const review = docs.filter((d) => !d.high_risk && d.needs_review).length;
        return { total: docs.length, high, review, clean: docs.length - high - review };
    });

    private timer: ReturnType<typeof setTimeout> | null = null;
    private polling = false;
    private pending: Promise<void> | null = null;

    /** Fetch once; concurrent callers share the same request. */
    refresh(): Promise<void> {
        if (this.pending) return this.pending;
        this.pending = this.api
            .listDocuments()
            .then((docs) => {
                this.documents.set(docs);
                this.error.set(null);
            })
            .catch((e: unknown) => {
                this.error.set(e instanceof ApiError ? messageFromApiError(e) : 'Request failed');
            })
            .finally(() => {
                this.loaded.set(true);
                this.pending = null;
            });
        return this.pending;
    }

    ensureLoaded(): void {
        if (!this.loaded() && !this.pending) void this.refresh();
    }

    /** Optimistic local patch, e.g. after a review changes `needs_review`. */
    patch(id: string, changes: Partial<DocumentItem>): void {
        this.documents.update((docs) => docs.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    }

    startPolling(): void {
        if (this.polling) return;
        this.polling = true;
        document.addEventListener('visibilitychange', this.onVisibility);
        this.schedule(0);
    }

    stopPolling(): void {
        this.polling = false;
        document.removeEventListener('visibilitychange', this.onVisibility);
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    private readonly onVisibility = () => {
        if (!document.hidden && this.polling) this.schedule(0);
    };

    private schedule(delay: number): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(async () => {
            if (!this.polling) return;
            if (!document.hidden) await this.refresh();
            if (this.polling) this.schedule(this.processing().length ? POLL_ACTIVE_MS : POLL_IDLE_MS);
        }, delay);
    }
}
