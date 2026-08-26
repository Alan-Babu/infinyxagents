import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TONES } from '../../models/email-compose-agent.models';

/** Reusable 1-of-N pill selector for the 8 fixed email tones, used by both the compose and reply flows. */
@Component({
    selector: 'lib-email-compose-tone-selector',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './tone-selector.html',
})
export class ToneSelectorComponent {
    @Input() value = '';
    @Input() label = '';

    @Output() valueChange = new EventEmitter<string>();

    readonly tones = TONES;

    select(tone: string): void {
        this.valueChange.emit(tone);
    }
}
