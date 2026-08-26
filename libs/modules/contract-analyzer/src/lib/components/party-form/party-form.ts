import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DetectionResult, PartyDraft } from '../../models/contract-analyzer.models';

export interface PartyFormModel {
    partyA: PartyDraft;
    partyB: PartyDraft;
}

/** The 5 fixed party types — values sent to the API stay in English so the MOFA/IT-outsourcing substring detection stays language-independent; only the displayed label is translated. */
export const PARTY_TYPES: { value: string; labelKey: string }[] = [
    { value: 'Government/MOFA', labelKey: 'contractAnalyzer.party.types.governmentMofa' },
    { value: 'Commercial', labelKey: 'contractAnalyzer.party.types.commercial' },
    { value: 'IT/Outsourcing Company', labelKey: 'contractAnalyzer.party.types.itOutsourcing' },
    { value: 'Individual', labelKey: 'contractAnalyzer.party.types.individual' },
    { value: 'Other', labelKey: 'contractAnalyzer.party.types.other' },
];

/**
 * Step 2 of the upload wizard: confirms the detected parties. `model` is
 * owned by the parent (`UploadPage`) and mutated in place via `[(ngModel)]`
 * — same reference-object idiom used by other multi-field drawer forms in
 * this repo, avoiding a separate `@Output` per field.
 */
@Component({
    selector: 'lib-contract-analyzer-party-form',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, SelectModule],
    templateUrl: './party-form.html',
})
export class PartyFormComponent {
    @Input({ required: true }) model!: PartyFormModel;
    @Input() detection: DetectionResult | null = null;
    @Input() loading = false;

    @Output() back = new EventEmitter<void>();
    @Output() continue = new EventEmitter<void>();

    readonly partyTypeOptions = PARTY_TYPES;

    get isMofaItOutsourcing(): boolean {
        const a = (this.model.partyA.type || '').toLowerCase();
        const b = (this.model.partyB.type || '').toLowerCase();
        return (a.includes('government') || a.includes('mofa')) && b.includes('outsourcing');
    }
}
