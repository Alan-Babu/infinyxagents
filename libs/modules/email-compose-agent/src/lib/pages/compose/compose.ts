import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '@nfinyx/services';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { EmailComposeDropzoneComponent } from '../../components/dropzone/dropzone';
import { EmailComposeToolbarComponent } from '../../components/email-compose-toolbar/email-compose-toolbar';
import { ToneSelectorComponent } from '../../components/tone-selector/tone-selector';
import { EmailComposeApiService } from '../../services/email-compose-api.service';
import { ChunkUploadProgress, ChunkUploadService } from '../../services/chunk-upload.service';
import { ComposeMode, EmailUpload, ReplyInputMode } from '../../models/email-compose-agent.models';

const ACCEPTED_TYPES = ['application/pdf', 'text/plain'];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

type ReplyStep = 'input' | 'questions';

@Component({
    selector: 'lib-email-compose-compose',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        PageHeaderComponent,
        EmailComposeDropzoneComponent,
        EmailComposeToolbarComponent,
        ToneSelectorComponent,
    ],
    templateUrl: './compose.html',
})
export class ComposePage {
    private readonly api = inject(EmailComposeApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly router = inject(Router);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    homeMode: ComposeMode = 'compose';

    // ---------- Compose ----------
    context = '';
    recipientHint = '';
    tone = 'Professional';
    composing = false;

    // ---------- Reply ----------
    replyStep: ReplyStep = 'input';
    replyInputMode: ReplyInputMode = 'paste';
    threadText = '';
    doc: EmailUpload | null = null;
    uploadProgress: ChunkUploadProgress | null = null;
    private cancelFlag = false;
    readingThread = false;

    replyThreadSummary = '';
    replyQuestions: string[] = [];
    replyAnswers: string[] = [];
    replyEmotionalTone: string | null = null;
    replyTone = 'Professional';
    drafting = false;

    setHomeMode(mode: ComposeMode): void {
        this.homeMode = mode;
        this.resetReply();
    }

    private resetReply(): void {
        this.replyStep = 'input';
        this.threadText = '';
        this.doc = null;
        this.uploadProgress = null;
        this.replyThreadSummary = '';
        this.replyQuestions = [];
        this.replyAnswers = [];
        this.replyEmotionalTone = null;
        this.replyTone = 'Professional';
    }

    // ---------- Compose flow ----------
    async submitCompose(): Promise<void> {
        const context = this.context.trim();
        if (!context) {
            this.common.showWarningMessage(this.translate.instant('emailComposeAgent.toast.contextRequired'));
            return;
        }
        this.composing = true;
        try {
            const detail = await this.api.composeEmail(context, this.tone, this.recipientHint.trim() || undefined);
            this.router.navigateByUrl(`/email-compose-agent/emails/${detail.id}`);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.composeFailed'));
        } finally {
            this.composing = false;
        }
    }

    // ---------- Reply flow: input ----------
    setReplyInputMode(mode: ReplyInputMode): void {
        this.replyInputMode = mode;
        this.doc = null;
        this.threadText = '';
    }

    onFileSelected(file: File): void {
        this.beginChunkedUpload(file);
    }

    onDropped(file: File): void {
        const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|docx|txt)$/i.test(file.name);
        if (!okType) {
            this.common.showWarningMessage(this.translate.instant('emailComposeAgent.toast.dropAcceptedOnly'));
            return;
        }
        this.beginChunkedUpload(file);
    }

    async beginChunkedUpload(file: File): Promise<void> {
        if (file.size > MAX_UPLOAD_BYTES) {
            this.common.showWarningMessage(this.translate.instant('emailComposeAgent.toast.fileTooLarge'));
            return;
        }
        this.cancelFlag = false;
        this.uploadProgress = null;
        this.doc = { filename: file.name, size: file.size, pageCount: 0 };

        try {
            const result = await this.chunkUpload.uploadFile(
                file,
                p => { this.uploadProgress = p; },
                () => this.cancelFlag,
            );
            this.doc = { filename: file.name, size: file.size, pageCount: result.pageCount, uploadRef: result.uploadId };
        } catch {
            this.common.showApiError(
                null,
                this.cancelFlag
                    ? this.translate.instant('emailComposeAgent.toast.uploadCancelled')
                    : this.translate.instant('emailComposeAgent.toast.uploadFailed'),
            );
            this.doc = null;
        } finally {
            this.uploadProgress = null;
        }
    }

    cancelUpload(): void {
        this.cancelFlag = true;
    }

    clearDoc(): void {
        this.doc = null;
    }

    async readThread(): Promise<void> {
        const text = this.threadText.trim();
        if (this.replyInputMode === 'paste' && !text) {
            this.common.showWarningMessage(this.translate.instant('emailComposeAgent.toast.threadRequired'));
            return;
        }
        if (this.replyInputMode === 'upload' && !this.doc?.uploadRef) {
            this.common.showWarningMessage(this.translate.instant('emailComposeAgent.toast.threadRequired'));
            return;
        }
        this.readingThread = true;
        try {
            const result = await this.api.getReplyQuestions(
                this.replyInputMode === 'paste' ? text : undefined,
                this.replyInputMode === 'upload' ? this.doc?.uploadRef : undefined,
            );
            this.replyThreadSummary = result.thread_summary;
            this.replyQuestions = result.questions;
            this.replyAnswers = result.questions.map(() => '');
            this.replyEmotionalTone = result.emotional_tone;
            this.replyStep = 'questions';
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.readThreadFailed'));
        } finally {
            this.readingThread = false;
        }
    }

    // ---------- Reply flow: questions ----------
    get emotionalToneNeedsAttention(): boolean {
        return this.replyEmotionalTone === 'heated' || this.replyEmotionalTone === 'frustrated';
    }

    useDiplomaticTone(): void {
        this.replyTone = 'Diplomatic';
    }

    backToThreadInput(): void {
        this.replyStep = 'input';
    }

    async draftReply(): Promise<void> {
        this.drafting = true;
        try {
            // Mirrors legacy behavior verbatim: thread_text is only ever populated in
            // paste mode. In upload mode the backend resolves the thread server-side
            // from the earlier `/emails/reply/questions` upload_ref call.
            const detail = await this.api.draftReply(
                this.threadText.trim(),
                this.replyQuestions,
                this.replyAnswers,
                this.replyTone,
                this.replyEmotionalTone ?? undefined,
            );
            this.router.navigateByUrl(`/email-compose-agent/emails/${detail.id}`);
        } catch (err) {
            this.common.showApiError(err, this.translate.instant('emailComposeAgent.toast.draftReplyFailed'));
        } finally {
            this.drafting = false;
        }
    }
}
