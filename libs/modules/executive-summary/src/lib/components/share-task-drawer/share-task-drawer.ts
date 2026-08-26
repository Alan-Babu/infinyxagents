import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

export type ShareTaskStage = 'share' | 'task';

export interface ShareTaskFormModel {
    emailTarget: string;
    whatsappTarget: string;
    taskAssigneesInput: string;
    taskDueDate: string;
    taskPriority: string;
    taskImportance: string;
}

interface OptionDef {
    label: string;
    description?: string;
}

@Component({
    selector: 'lib-share-task-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, InputTextModule, SelectModule],
    templateUrl: './share-task-drawer.html',
})
export class ShareTaskDrawerComponent {
    @Input() visible = false;
    @Input() stage: ShareTaskStage = 'share';
    @Input({ required: true }) model!: ShareTaskFormModel;
    @Input() whatsappLink = '';
    @Input() priorityOptions: OptionDef[] = [];
    @Input() importanceOptions: OptionDef[] = [];

    @Output() closed = new EventEmitter<void>();
    @Output() stageChange = new EventEmitter<ShareTaskStage>();
    @Output() sendEmail = new EventEmitter<void>();
    @Output() getWhatsappLink = new EventEmitter<void>();
    @Output() createTask = new EventEmitter<void>();

    switchStage(stage: ShareTaskStage): void {
        this.stage = stage;
        this.stageChange.emit(stage);
    }
}
