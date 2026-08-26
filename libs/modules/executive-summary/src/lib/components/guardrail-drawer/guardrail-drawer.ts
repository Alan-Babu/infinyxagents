import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { ModerationFlagEntry } from '../../models/executive-summary.models';
import { categoryLabel, guardrailPriority, guardrailStatusLabel, initials } from '../../utils/guardrail-display';

@Component({
    selector: 'lib-guardrail-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DrawerModule, TagModule, DatePipe],
    templateUrl: './guardrail-drawer.html',
})
export class GuardrailDrawerComponent {
    private readonly translate = inject(TranslateService);

    @Input() flag: ModerationFlagEntry | null = null;
    @Input() updatingId: number | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() setStatus = new EventEmitter<{ flag: ModerationFlagEntry; status: string }>();

    readonly categoryLabel = categoryLabel;
    readonly guardrailPriority = guardrailPriority;
    readonly initials = initials;

    statusLabel(status: string): string {
        return guardrailStatusLabel(status, key => this.translate.instant(key));
    }

    onSetStatus(status: string): void {
        if (this.flag) this.setStatus.emit({ flag: this.flag, status });
    }
}
