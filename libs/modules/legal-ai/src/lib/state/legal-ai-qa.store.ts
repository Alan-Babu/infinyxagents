import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiError, messageFromApiError } from '@nfinyx/types';
import { QACitation } from '../models/legal-ai.models';
import { LegalAiApiService } from '../services/legal-ai-api.service';
import { LegalAiI18n } from '../services/legal-ai-i18n.service';

export interface QAMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    citations?: QACitation[];
    source?: string;
    documentName?: string | null;
    flagged?: boolean;
}

export interface QASession {
    id: string;
    title: string;
}

// Same keys as the standalone app so existing conversations carry over on the same origin.
const SESSION_KEY = 'legalai.qa.session';
const SESSIONS_KEY = 'legalai.qa.sessions';

function safeStorage(): Storage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

@Injectable({ providedIn: 'root' })
export class LegalAiQaStore {
    private readonly api = inject(LegalAiApiService);
    private readonly i18n = inject(LegalAiI18n);

    readonly open = signal(false);
    readonly messages = signal<QAMessage[]>([]);
    readonly sessions = signal<QASession[]>([]);
    readonly sessionId = signal('');
    readonly loading = signal(false);
    readonly draft = signal('');

    /** Document the current page is about; sent with each question for grounded context. */
    readonly contextDocId = signal<string | null>(null);
    readonly contextDocName = signal<string | null>(null);

    readonly hasMessages = computed(() => this.messages().length > 0);
    private initialised = false;

    show(prefill?: string): void {
        if (prefill) this.draft.set(prefill);
        this.open.set(true);
        this.init();
    }

    hide(): void {
        this.open.set(false);
    }

    setContext(id: string | null, name: string | null): void {
        this.contextDocId.set(id);
        this.contextDocName.set(name);
    }

    private init(): void {
        if (this.initialised) return;
        this.initialised = true;
        this.sessions.set(this.readSessions());
        let id = safeStorage()?.getItem(SESSION_KEY) ?? '';
        if (!id) {
            id = crypto.randomUUID();
            this.remember(id);
        }
        this.sessionId.set(id);
        void this.loadHistory(id);
    }

    async loadHistory(id: string): Promise<void> {
        try {
            const rows = await this.api.chatHistory(id);
            this.messages.set(
                (rows ?? []).map((m) => ({
                    id: m.id,
                    role: m.role,
                    text: m.content,
                    source: m.source ?? undefined,
                    flagged: Boolean(m.is_toxic),
                })),
            );
        } catch {
            // History is a convenience; a fresh conversation is fine.
        }
    }

    newChat(): void {
        const id = crypto.randomUUID();
        this.remember(id);
        this.sessions.set(this.readSessions());
        this.sessionId.set(id);
        this.messages.set([]);
    }

    openSession(id: string): void {
        this.remember(id, this.readSessions().find((s) => s.id === id)?.title);
        this.sessions.set(this.readSessions());
        this.sessionId.set(id);
        this.messages.set([]);
        void this.loadHistory(id);
    }

    async ask(question: string): Promise<void> {
        const q = question.trim();
        if (!q || this.loading()) return;
        this.init();
        this.push({ id: crypto.randomUUID(), role: 'user', text: q });
        this.draft.set('');
        this.loading.set(true);
        this.remember(this.sessionId(), q);
        this.sessions.set(this.readSessions());
        try {
            const res = await this.api.ask({
                question: q,
                document_id: this.contextDocId() ?? undefined,
                session_id: this.sessionId(),
                top_k: 5,
            });
            if (res.session_id && res.session_id !== this.sessionId()) {
                this.sessionId.set(res.session_id);
                this.remember(res.session_id, q);
                this.sessions.set(this.readSessions());
            }
            this.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                text: res.answer,
                citations: res.citations,
                source: res.source,
                documentName: res.document_name,
                flagged: res.flagged,
            });
        } catch (e) {
            const text =
                e instanceof ApiError && e.status > 0
                    ? `${e.status}: ${messageFromApiError(e)}`
                    : this.i18n.t('qaBackendDown');
            this.push({ id: crypto.randomUUID(), role: 'assistant', text });
        } finally {
            this.loading.set(false);
        }
    }

    private push(message: QAMessage): void {
        this.messages.update((m) => [...m, message]);
    }

    private readSessions(): QASession[] {
        try {
            const raw = JSON.parse(safeStorage()?.getItem(SESSIONS_KEY) || '[]');
            return Array.isArray(raw) ? (raw as QASession[]) : [];
        } catch {
            return [];
        }
    }

    private remember(id: string, title?: string): void {
        const store = safeStorage();
        if (!store) return;
        const next = this.readSessions().filter((s) => s.id !== id);
        next.unshift({ id, title: title?.slice(0, 80) || 'New conversation' });
        try {
            store.setItem(SESSIONS_KEY, JSON.stringify(next.slice(0, 20)));
            store.setItem(SESSION_KEY, id);
        } catch {
            // Storage may be full or blocked — chat still works in-memory.
        }
    }
}
