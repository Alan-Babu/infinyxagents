import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { QAExchange } from '../../models/contract-analyzer.models';
import { confidenceClass, fmtConfidence } from '../../utils/contract-display';

/**
 * Chat bubbles + prompt-suggestion chips + confidence pill + auto-scroll for
 * the "Ask Agent" tab. Structurally glanced at hr-chat for bubble layout
 * only — this backend is plain request/response (no streaming, no speech
 * synthesis, no like/dislike), so none of that machinery is ported here.
 */
@Component({
    selector: 'lib-contract-analyzer-ask-agent-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule],
    templateUrl: './ask-agent-chat.html',
})
export class AskAgentChatComponent {
    @Input() history: QAExchange[] = [];
    @Input() suggestions: string[] = [];
    @Input() asking = false;

    @Output() ask = new EventEmitter<string>();

    readonly confidenceClass = confidenceClass;
    readonly fmtConfidence = fmtConfidence;

    questionInput = '';
    selectedSuggestion: string | null = null;

    selectPromptSuggestion(q: string): void {
        this.questionInput = q;
        this.selectedSuggestion = q;
        setTimeout(() => document.getElementById('contract-qa-question-input')?.focus());
    }

    send(): void {
        const q = this.questionInput.trim();
        if (!q || this.asking) return;
        this.questionInput = '';
        this.selectedSuggestion = null;
        this.ask.emit(q);
        setTimeout(() => document.getElementById('contract-qa-scroll-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
    }
}
