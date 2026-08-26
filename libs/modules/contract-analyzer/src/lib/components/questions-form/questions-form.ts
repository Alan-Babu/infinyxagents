import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { QuestionsResult } from '../../models/contract-analyzer.models';

export interface QuestionsFormModel {
    answers: string[];
    cashFlowContext: string;
    previousContractNotes: string;
}

/**
 * Step 3 of the upload wizard: dynamic clarifying questions plus the
 * required cash-flow/liquidity context and optional prior-contract notes.
 * `model` is owned by the parent and mutated in place via `[(ngModel)]`.
 */
@Component({
    selector: 'lib-contract-analyzer-questions-form',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule],
    templateUrl: './questions-form.html',
})
export class QuestionsFormComponent {
    @Input() questionsResult: QuestionsResult | null = null;
    @Input({ required: true }) model!: QuestionsFormModel;
    @Input() submitting = false;

    @Output() back = new EventEmitter<void>();
    @Output() formSubmit = new EventEmitter<void>();

    trackByIndex(index: number): number {
        return index;
    }
}
