import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AGENT_TILES, AgentTile } from '@nfinyx/agents-landing';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { ActivityLogEntry } from '../../models/user-profile-activity.models';
import { formatDateTime, STATUS_LABEL_KEY, STATUS_SEVERITY, timeAgo } from '../../utils/activity-display';

@Component({
    selector: 'lib-activity-detail-drawer',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, ButtonModule, DrawerModule, TagModule],
    templateUrl: './activity-detail-drawer.html',
})
export class ActivityDetailDrawer {
    @Input() activity: ActivityLogEntry | null = null;
    @Output() closed = new EventEmitter<void>();

    readonly statusLabelKey = STATUS_LABEL_KEY;
    readonly statusSeverity = STATUS_SEVERITY;

    formatDateTime = formatDateTime;
    timeAgo = timeAgo;

    get agent(): AgentTile | undefined {
        return this.activity ? AGENT_TILES.find(tile => tile.id === this.activity?.agentId) : undefined;
    }
}
