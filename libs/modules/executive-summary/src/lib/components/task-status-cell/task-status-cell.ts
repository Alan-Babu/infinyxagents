import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { SelectModule } from 'primeng/select';

export interface TaskStatusOption {
    label: string;
    value: string;
}

export interface TaskStatusCellParams extends ICellRendererParams {
    options: TaskStatusOption[];
    disabled?: (row: unknown) => boolean;
    onChange: (row: unknown, status: string) => void;
}

@Component({
    selector: 'lib-task-status-cell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, SelectModule],
    host: {
        class: 'block w-full',
        '(click)': '$event.stopPropagation()',
    },
    template: `<p-select
        [options]="options"
        [ngModel]="status"
        (ngModelChange)="onStatusChange($event)"
        optionLabel="label"
        optionValue="value"
        [disabled]="isDisabled"
        styleClass="text-xs!"
        appendTo="body"
    />`,
})
export class TaskStatusCellComponent implements ICellRendererAngularComp {
    options: TaskStatusOption[] = [];
    status = '';
    isDisabled = false;

    private row: unknown;
    private onChange?: (row: unknown, status: string) => void;

    agInit(params: TaskStatusCellParams): void {
        this.resolve(params);
    }

    refresh(params: TaskStatusCellParams): boolean {
        this.resolve(params);
        return true;
    }

    onStatusChange(status: string): void {
        this.status = status;
        this.onChange?.(this.row, status);
    }

    private resolve(params: TaskStatusCellParams): void {
        this.options = params.options;
        this.status = params.value;
        this.isDisabled = params.disabled?.(params.data) ?? false;
        this.row = params.data;
        this.onChange = params.onChange;
    }
}
