import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { SelectModule } from 'primeng/select';
import type { ColDef } from 'ag-grid-community';
import { RiskSessionTranscriptDrawerComponent } from '../../../components/risk-session-transcript-drawer/risk-session-transcript-drawer';
import { ChatSessionSummary, SessionTranscript } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';
import { buildSessionColDefs } from '../../../utils/session-columns';

/** Every chat session, not just risk-flagged ones -- the admin "chat history" browser (see AdminRiskSessionsPage for the narrower risk-only view, which this reuses the transcript drawer from). */
@Component({
    selector: 'lib-admin-sessions',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DataTable, SelectModule, RiskSessionTranscriptDrawerComponent],
    templateUrl: './sessions.html',
})
export class AdminSessionsPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    sessions: ChatSessionSummary[] = [];
    transcript: SessionTranscript | null = null;

    language: string | null = null;
    sentiment: string | null = null;
    languageOptions: { label: string; value: string | null }[] = [];
    sentimentOptions: { label: string; value: string | null }[] = [];

    colDefs: ColDef[] = buildSessionColDefs(
        key => this.translate.instant(key),
        session => this.viewTranscript(session),
    );

    async ngOnInit(): Promise<void> {
        const t = (key: string) => this.translate.instant(key);
        this.languageOptions = [
            { label: t('mofaChatbot.admin.sessions.filters.allLanguages'), value: null },
            { label: t('mofaChatbot.admin.common.languageEn'), value: 'en' },
            { label: t('mofaChatbot.admin.common.languageAr'), value: 'ar' },
        ];
        this.sentimentOptions = [
            { label: t('mofaChatbot.admin.sessions.filters.allSentiments'), value: null },
            { label: t('mofaChatbot.admin.sessions.filters.positive'), value: 'positive' },
            { label: t('mofaChatbot.admin.sessions.filters.neutral'), value: 'neutral' },
            { label: t('mofaChatbot.admin.sessions.filters.negative'), value: 'negative' },
            { label: t('mofaChatbot.admin.sessions.filters.frustrated'), value: 'frustrated' },
        ];
        await this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        try {
            this.sessions = (
                await this.api.listSessions({
                    page: 1,
                    pageSize: 50,
                    language: this.language ?? undefined,
                    sentiment: this.sentiment ?? undefined,
                })
            ).items;
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async viewTranscript(session: ChatSessionSummary): Promise<void> {
        try {
            this.transcript = await this.api.getSessionTranscript(session.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    closeTranscript(): void {
        this.transcript = null;
    }
}
