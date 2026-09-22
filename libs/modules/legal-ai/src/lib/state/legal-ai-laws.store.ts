import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiError, messageFromApiError } from '@nfinyx/types';
import { LawItem } from '../models/legal-ai.models';
import { LegalAiApiService } from '../services/legal-ai-api.service';

/** Shared legislation index (dashboard stat + law library). Loaded once, on demand. */
@Injectable({ providedIn: 'root' })
export class LegalAiLawsStore {
    private readonly api = inject(LegalAiApiService);

    readonly laws = signal<LawItem[]>([]);
    readonly loaded = signal(false);
    readonly error = signal<string | null>(null);

    readonly totalArticles = computed(() => this.laws().reduce((n, l) => n + (l.article_count || 0), 0));
    readonly categories = computed(() =>
        [...new Set(this.laws().map((l) => l.category || 'Federal'))].sort((a, b) => a.localeCompare(b)),
    );

    private pending: Promise<void> | null = null;

    ensureLoaded(): Promise<void> {
        if (this.loaded()) return Promise.resolve();
        if (this.pending) return this.pending;
        this.pending = this.api
            .listLaws()
            .then((laws) => {
                this.laws.set(laws);
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

    reload(): Promise<void> {
        this.loaded.set(false);
        return this.ensureLoaded();
    }
}
