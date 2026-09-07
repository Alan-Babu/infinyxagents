import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { detectBrowserTimeZone } from '../../utils/format';

export interface ScheduleFormModel {
    frequency: string;
    time: string;
    email: string;
    notifyMode: string;
    dayOfWeek: string;
    dayOfMonth: string;
    quarterlyMonth: string;
}

interface OptionDef {
    label: string;
    description?: string;
}

@Component({
    selector: 'lib-schedule-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, SelectModule],
    templateUrl: './schedule-drawer.html',
})
export class ScheduleDrawerComponent {
    @Input() visible = false;
    @Input({ required: true }) model!: ScheduleFormModel;
    @Input() frequencyOptions: OptionDef[] = [];
    @Input() notifyOptions: OptionDef[] = [];
    @Input() dayOfWeekOptions: OptionDef[] = [];
    @Input() dayOfMonthOptions: OptionDef[] = [];
    @Input() monthOptions: OptionDef[] = [];

    @Output() closed = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<void>();

    /** Shown next to the time field so the user knows what timezone their pick will be scheduled in. */
    readonly detectedTimeZone = detectBrowserTimeZone();
}
