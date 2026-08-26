import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/** Small blocking transparency prompt (AI disclosure, sensitive-data warning, human-support number) — `p-dialog` per the Dialog-vs-Drawer rule. */
@Component({
    selector: 'lib-privacy-notice-modal',
    standalone: true,
    imports: [CommonModule, TranslateModule, DialogModule, ButtonModule],
    template: `
        <p-dialog
            [visible]="visible"
            (visibleChange)="visibleChange.emit($event)"
            [modal]="true"
            [dismissableMask]="true"
            [draggable]="false"
            styleClass="w-full! max-w-md!"
            [header]="'mofaChatbot.chat.privacy.title' | translate"
        >
            <div class="flex flex-col gap-3 text-sm text-gray-700">
                <p>{{ 'mofaChatbot.chat.privacy.body1' | translate }}</p>
                <p>{{ 'mofaChatbot.chat.privacy.body2' | translate }}</p>
                <p>{{ 'mofaChatbot.chat.privacy.body3' | translate: { number: supportNumber } }}</p>
            </div>
            <div class="mt-5 flex justify-end">
                <button type="button" pButton class="cursor-pointer" (click)="visibleChange.emit(false)">
                    <span>{{ 'mofaChatbot.chat.privacy.gotIt' | translate }}</span>
                </button>
            </div>
        </p-dialog>
    `,
})
export class PrivacyNoticeModalComponent {
    @Input() visible = false;
    @Input() supportNumber = '80044444';
    @Output() visibleChange = new EventEmitter<boolean>();
}
