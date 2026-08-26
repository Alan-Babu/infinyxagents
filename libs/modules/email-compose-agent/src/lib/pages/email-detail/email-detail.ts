import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { StatCardComponent } from '@nfinyx/stat-card';
import { EmailComposeToolbarComponent } from '../../components/email-compose-toolbar/email-compose-toolbar';
import { EmailComposeApiService } from '../../services/email-compose-api.service';
import { EmailDetail, QAExchange } from '../../models/email-compose-agent.models';
import {
    classificationClass,
    confidenceClass,
    estimatedReadMinutes,
    fmtConfidence,
    reviewStatusBadgeClass,
} from '../../utils/email-compose-display';

type Tab = 'overview' | 'ask';

@Component({
    selector: 'lib-email-compose-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        DrawerModule,
        InputTextModule,
        TooltipModule,
        RouterLink,
        PageHeaderComponent,
        StatCardComponent,
        EmailComposeToolbarComponent,
    ],
    templateUrl: './email-detail.html',
})
export class EmailDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(EmailComposeApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    readonly fmtConfidence = fmtConfidence;
    readonly confidenceClass = confidenceClass;
    readonly classificationClass = classificationClass;
    readonly reviewStatusBadgeClass = reviewStatusBadgeClass;
    readonly estimatedReadMinutes = estimatedReadMinutes;

    /** Named `email`, not `document`, to avoid ambiguity — same idiom as grammar-agent's `doc`. */
    email: EmailDetail | null = null;
    loading = false;
    activeTab: Tab = 'overview';

    reviewing = false;
    reviewerName = '';
    reviewerNotes = '';

    activeTone = '';

    showingTranslation = false;
    translating = false;
    copied = false;

    qaHistory: QAExchange[] = [];
    questionInput = '';
    asking = false;
    selectedSuggestion: string | null = null;

    async ngOnInit(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) return;
        await this.loadEmail(id);
    }

    async loadEmail(id: string): Promise<void> {
        this.loading = true;
        try {
            this.email = await this.api.getEmail(id);
            this.qaHistory = await this.api.listQA(id);
            this.activeTab = 'overview';
            this.activeTone = this.email.tone;
            this.showingTranslation = false;
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.loadEmailFailed'));
        } finally {
            this.loading = false;
        }
    }

    backToEmails(): void {
        this.router.navigateByUrl('/email-compose-agent/emails');
    }

    // ---------- Tone variants ----------
    get toneOptions(): { tone: string; subject: string; body: string }[] {
        if (!this.email) return [];
        const primary = { tone: this.email.tone, subject: this.email.subject ?? '', body: this.email.body ?? '' };
        return [primary, ...this.email.alternate_tones];
    }

    get activeToneVariant(): { tone: string; subject: string; body: string } | undefined {
        return this.toneOptions.find(v => v.tone === this.activeTone) ?? this.toneOptions[0];
    }

    async selectTone(tone: string): Promise<void> {
        if (!this.email || tone === this.activeTone) return;
        this.activeTone = tone;
        try {
            const updated = await this.api.pickTone(this.email.id, tone);
            this.email = updated;
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.translateFailed'));
        }
    }

    // ---------- Translate / copy ----------
    async toggleTranslation(): Promise<void> {
        if (!this.email) return;
        if (this.showingTranslation) {
            this.showingTranslation = false;
            return;
        }
        if (this.email.translated_body) {
            this.showingTranslation = true;
            return;
        }
        this.translating = true;
        try {
            const targetLanguage = this.email.language?.toLowerCase().startsWith('ar') ? 'en' : 'ar';
            this.email = await this.api.translateEmail(this.email.id, targetLanguage);
            this.showingTranslation = true;
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.translateFailed'));
        } finally {
            this.translating = false;
        }
    }

    get displaySubject(): string | null {
        return this.showingTranslation ? this.email?.translated_subject ?? null : this.activeToneVariant?.subject ?? this.email?.subject ?? null;
    }

    get displayBody(): string | null {
        return this.showingTranslation ? this.email?.translated_body ?? null : this.activeToneVariant?.body ?? this.email?.body ?? null;
    }

    get displayIsRtl(): boolean {
        if (!this.showingTranslation || !this.email?.translated_language) return false;
        return this.email.translated_language.toLowerCase().startsWith('ar');
    }

    copyEmail(): void {
        const text = [this.displaySubject, '', this.displayBody].filter(v => v !== null).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.copied = true;
            setTimeout(() => { this.copied = false; }, 2000);
        });
    }

    // ---------- Review ----------
    startReview(): void {
        this.reviewing = true;
        this.reviewerName = '';
        this.reviewerNotes = '';
    }
    cancelReview(): void {
        this.reviewing = false;
    }
    async submitReviewDecision(decision: 'approve' | 'reject'): Promise<void> {
        if (!this.email) return;
        try {
            const updated = await this.api.reviewEmail(this.email.id, decision, this.reviewerName.trim(), this.reviewerNotes.trim());
            this.email = updated;
            this.reviewing = false;
            this.common.showSuccessMessage(this.translate.instant(decision === 'approve' ? 'emailComposeAgent.toast.reviewApproved' : 'emailComposeAgent.toast.reviewRejected'));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.reviewFailed'));
        }
    }

    // ---------- Ask Agent ----------
    selectPromptSuggestion(q: string): void {
        this.questionInput = q;
        this.selectedSuggestion = q;
        setTimeout(() => document.getElementById('qa-question-input')?.focus());
    }
    async sendQuestion(): Promise<void> {
        const q = this.questionInput.trim();
        if (!q || !this.email || this.asking) return;
        this.asking = true;
        this.questionInput = '';
        this.selectedSuggestion = null;
        try {
            const exchange = await this.api.askDocument(this.email.id, q);
            this.qaHistory.push(exchange);
            setTimeout(() => document.getElementById('qa-scroll-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.askFailed'));
        } finally {
            this.asking = false;
        }
    }

    // ---------- Overview helpers ----------
    get answeredClarificationCount(): number {
        return this.email?.clarifying_answers?.filter(a => a.trim().length > 0).length ?? 0;
    }
}
