import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { ToneSelectorComponent } from '../tone-selector/tone-selector';
import { ContextProfile } from '../../models/email-compose-agent.models';

/**
 * Local "writing profile" drawer — sender name/title/company/signature/default
 * tone/notes form. No shared-lib equivalent exists. Purely presentational:
 * the toolbar owns fetching/saving the actual `ContextProfile`.
 */
@Component({
    selector: 'lib-email-compose-writing-profile-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, ToneSelectorComponent],
    templateUrl: './writing-profile-drawer.html',
})
export class WritingProfileDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() profile: ContextProfile | null = null;
    @Input() saving = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Partial<ContextProfile>>();

    senderName = '';
    senderTitle = '';
    senderCompany = '';
    signatureBlock = '';
    defaultTone = 'Professional';
    notes = '';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.senderName = this.profile?.sender_name ?? '';
            this.senderTitle = this.profile?.sender_title ?? '';
            this.senderCompany = this.profile?.sender_company ?? '';
            this.signatureBlock = this.profile?.signature_block ?? '';
            this.defaultTone = this.profile?.default_tone || 'Professional';
            this.notes = this.profile?.notes ?? '';
        }
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    submit(): void {
        this.save.emit({
            sender_name: this.senderName.trim() || null,
            sender_title: this.senderTitle.trim() || null,
            sender_company: this.senderCompany.trim() || null,
            signature_block: this.signatureBlock.trim() || null,
            default_tone: this.defaultTone,
            notes: this.notes.trim() || null,
        });
    }
}
