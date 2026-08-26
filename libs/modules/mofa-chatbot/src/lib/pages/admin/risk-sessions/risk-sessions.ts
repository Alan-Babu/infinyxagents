import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { RiskSessionTranscriptDrawerComponent } from '../../../components/risk-session-transcript-drawer/risk-session-transcript-drawer';
import { RiskSession, SessionTranscript } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';
import { buildRiskSessionColDefs } from '../../../utils/risk-session-columns';

@Component({
    selector: 'lib-admin-risk-sessions',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable, RiskSessionTranscriptDrawerComponent],
    templateUrl: './risk-sessions.html',
})
export class AdminRiskSessionsPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    sessions: RiskSession[] = [];
    transcript: SessionTranscript | null = null;
    colDefs: ColDef[] = buildRiskSessionColDefs(
        key => this.translate.instant(key),
        session => this.viewTranscript(session),
    );

    async ngOnInit(): Promise<void> {
        this.loading = true;
        try {
            this.sessions = (await this.api.listRiskSessions(1, 20)).items;
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async viewTranscript(session: RiskSession): Promise<void> {
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
