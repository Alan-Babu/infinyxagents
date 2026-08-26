import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { FeedbackEntry, UnansweredQuestion } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';
import { buildFeedbackColDefs, buildUnansweredColDefs } from '../../../utils/feedback-columns';

@Component({
    selector: 'lib-admin-feedback',
    standalone: true,
    imports: [CommonModule, TranslateModule, DataTable],
    templateUrl: './feedback.html',
})
export class AdminFeedbackPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    unanswered: UnansweredQuestion[] = [];
    feedback: FeedbackEntry[] = [];

    unansweredColDefs: ColDef[] = buildUnansweredColDefs(
        key => this.translate.instant(key),
        q => this.markReviewed(q),
    );
    feedbackColDefs: ColDef[] = buildFeedbackColDefs(key => this.translate.instant(key));

    async ngOnInit(): Promise<void> {
        this.loading = true;
        try {
            const [feedbackRes, unansweredRes] = await Promise.all([this.api.listFeedback(1, 20), this.api.listUnansweredQuestions(false, 1, 20)]);
            this.feedback = feedbackRes.items;
            this.unanswered = unansweredRes.items;
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async markReviewed(question: UnansweredQuestion): Promise<void> {
        try {
            await this.api.markUnansweredReviewed(question.id);
            this.unanswered = this.unanswered.filter(u => u.id !== question.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}
