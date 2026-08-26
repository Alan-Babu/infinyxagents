import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { PaginationMeta, ReviewDecisionPayload, ReviewQueueItem } from '../../models/document-agent.models';

/**
 * Shared "review queue" drawer: a paginated list of flagged documents with an
 * inline approve/reject form. Purely presentational — callers own fetching,
 * pagination, and the actual review API call; this component only emits
 * intents (`open`, `decide`, `page`).
 */
@Component({
    selector: 'lib-review-queue-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DrawerModule, InputTextModule],
    templateUrl: './review-queue-drawer.html',
})
export class ReviewQueueDrawerComponent {
    @Input() visible = false;
    @Input() eyebrow = '';
    @Input() title = 'Review queue';
    @Input() items: ReviewQueueItem[] = [];
    @Input() pagination: PaginationMeta | null = null;
    @Input() loading = false;
    @Input() emptyMessage = 'Nothing needs review right now.';
    @Input() footerNote = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() open = new EventEmitter<string>();
    @Output() decide = new EventEmitter<ReviewDecisionPayload>();
    @Output() page = new EventEmitter<number>();

    reviewingId: string | null = null;
    reviewerName = '';
    reviewerNotes = '';

    close(): void {
        this.visibleChange.emit(false);
    }

    startReview(id: string): void {
        this.reviewingId = id;
        this.reviewerName = '';
        this.reviewerNotes = '';
    }

    cancelReview(): void {
        this.reviewingId = null;
    }

    submitDecision(decision: 'approve' | 'reject'): void {
        if (!this.reviewingId) return;
        this.decide.emit({
            id: this.reviewingId,
            decision,
            reviewerName: this.reviewerName.trim(),
            reviewerNotes: this.reviewerNotes.trim(),
        });
        this.reviewingId = null;
    }
}
