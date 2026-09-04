import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';

import { ExpertiseLevel } from '../../models/executive-summary.models';
import { ExecSummaryApiService } from '../../services/exec-summary-api.service';

@Component({
    selector: 'lib-profile-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, SelectModule],
    template: `
        <p-drawer [(visible)]="visible" position="right" styleClass="p-drawer-sm" appendTo="body"
            (onHide)="visibleChange.emit(false)">
            <ng-template pTemplate="header">
                <span class="font-semibold">{{ 'executiveSummary.profile.title' | translate }}</span>
            </ng-template>
            @if (loading) {
                <div class="flex items-center gap-2 text-sm text-gray-500"><i class="pi pi-spin pi-spinner"></i>
                    {{ 'executiveSummary.loading' | translate }}</div>
            } @else {
                <p class="mb-4 text-sm leading-6 text-gray-500">{{ 'executiveSummary.profile.hint' | translate }}</p>
                <div class="mb-1.5 block text-xs font-semibold text-gray-600">
                    {{ 'executiveSummary.profile.experienceLevel' | translate }}
                </div>
                <p-select class="w-full" styleClass="w-full" appendTo="body" [options]="levelOptions"
                    optionLabel="label" optionValue="value" [(ngModel)]="expertiseLevel" />
                <p class="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-500">{{ selectedDescription | translate }}</p>
                @if (statusKey) {
                    <p class="mt-3 text-sm" [class.text-green-600]="statusKey.endsWith('saved')"
                        [class.text-red-600]="statusKey.endsWith('failed')">{{ statusKey | translate }}</p>
                }
                <button type="button" pButton styleClass="mt-5! w-full!" [loading]="saving" (click)="save()">
                    <span>{{ 'executiveSummary.actions.save' | translate }}</span>
                </button>
            }
        </p-drawer>
    `,
})
export class ProfileSettingsComponent {
    private readonly api = inject(ExecSummaryApiService);

    @Input() visible = false;
    @Input({ required: true }) userId = '';
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() expertiseChange = new EventEmitter<ExpertiseLevel>();

    readonly levelOptions = [
        { label: 'Beginner', value: 'beginner' as const, description: 'executiveSummary.profile.beginnerHint' },
        { label: 'Intermediate', value: 'intermediate' as const, description: 'executiveSummary.profile.intermediateHint' },
        { label: 'Expert', value: 'expert' as const, description: 'executiveSummary.profile.expertHint' },
    ];
    expertiseLevel: ExpertiseLevel = 'expert';
    loading = false;
    saving = false;
    statusKey = '';

    get selectedDescription(): string {
        return this.levelOptions.find(option => option.value === this.expertiseLevel)?.description ?? '';
    }

    async open(): Promise<void> {
        this.visible = true;
        this.visibleChange.emit(true);
        this.statusKey = '';
        if (!this.userId) return;
        this.loading = true;
        try {
            const profile = await this.api.getUserProfile(this.userId);
            this.expertiseLevel = profile.expertise_level;
            this.expertiseChange.emit(this.expertiseLevel);
        } catch {
            this.statusKey = 'executiveSummary.profile.failed';
        } finally {
            this.loading = false;
        }
    }

    async save(): Promise<void> {
        if (!this.userId) return;
        this.saving = true;
        this.statusKey = '';
        try {
            const profile = await this.api.saveUserProfile(this.userId, this.expertiseLevel);
            this.expertiseLevel = profile.expertise_level;
            this.expertiseChange.emit(profile.expertise_level);
            this.statusKey = 'executiveSummary.profile.saved';
        } catch {
            this.statusKey = 'executiveSummary.profile.failed';
        } finally {
            this.saving = false;
        }
    }
}
