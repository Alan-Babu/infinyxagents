import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { FeedbackSubmitPayload } from '../../models/document-agent.models';

export interface FeedbackScopeLabels {
    forDocument: string;
    overall: string;
}

/**
 * Shared "rate the agent" drawer: 5-star rating + optional comment, with an
 * optional document-vs-overall scope toggle. Purely presentational — resets
 * its form state whenever `visible` flips to `true`.
 */
@Component({
    selector: 'lib-feedback-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DrawerModule],
    templateUrl: './feedback-drawer.html',
})
export class FeedbackDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() eyebrow = '';
    @Input() title = 'Rate the agent';
    /** Pass null/undefined to hide the document-vs-overall toggle entirely. */
    @Input() scopeLabels: FeedbackScopeLabels | null = null;
    @Input() commentPlaceholder = 'What worked well, or what should improve…';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() submitFeedback = new EventEmitter<FeedbackSubmitPayload>();

    rating = 0;
    comment = '';
    forDocument = true;
    readonly stars = [1, 2, 3, 4, 5];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.rating = 0;
            this.comment = '';
            this.forDocument = true;
        }
    }

    setRating(value: number): void {
        this.rating = value;
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    submit(): void {
        if (!this.rating) return;
        this.submitFeedback.emit({ rating: this.rating, comment: this.comment.trim(), forDocument: this.forDocument });
    }
}
