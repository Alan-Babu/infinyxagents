import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/** 5-star + optional comment prompt shown when a chat session ends (exit intent / manual close) — `p-dialog` per the Dialog-vs-Drawer rule. */
@Component({
    selector: 'lib-session-end-rating-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DialogModule, ButtonModule],
    template: `
        <p-dialog
            [visible]="visible"
            (visibleChange)="visibleChange.emit($event)"
            [modal]="true"
            [dismissableMask]="false"
            [closable]="false"
            [draggable]="false"
            styleClass="w-full! max-w-sm!"
            [header]="'mofaChatbot.chat.rating.title' | translate"
        >
            <p class="mb-4 text-sm text-gray-500">{{ 'mofaChatbot.chat.rating.subtitle' | translate }}</p>
            <div class="mb-4 flex justify-center gap-1.5" role="radiogroup">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                    <button
                        type="button"
                        class="cursor-pointer text-3xl leading-none transition"
                        [class.text-amber-400]="star <= rating"
                        [class.text-gray-200]="star > rating"
                        (click)="ratingChange.emit(star)"
                    >
                        <i class="pi" [class.pi-star-fill]="star <= rating" [class.pi-star]="star > rating"></i>
                    </button>
                }
            </div>
            <textarea
                class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                rows="2"
                [ngModel]="comment"
                (ngModelChange)="commentChange.emit($event)"
                [placeholder]="'mofaChatbot.chat.rating.commentPlaceholder' | translate"
            ></textarea>
            <div class="mt-5 flex justify-end gap-2">
                <button type="button" pButton severity="secondary" [outlined]="true" class="cursor-pointer" (click)="skip.emit()">
                    <span>{{ 'mofaChatbot.chat.rating.skip' | translate }}</span>
                </button>
                <button type="button" pButton class="cursor-pointer" (click)="submitRating.emit()">
                    <span>{{ 'mofaChatbot.chat.rating.submit' | translate }}</span>
                </button>
            </div>
        </p-dialog>
    `,
})
export class SessionEndRatingModalComponent {
    @Input() visible = false;
    @Input() rating = 0;
    @Input() comment = '';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() ratingChange = new EventEmitter<number>();
    @Output() commentChange = new EventEmitter<string>();
    @Output() submitRating = new EventEmitter<void>();
    @Output() skip = new EventEmitter<void>();
}
