import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { NoData } from '@nfinyx/no-data';
import { StatCardComponent } from '@nfinyx/stat-card';
import { AGENT_TILES, AgentTile } from '@nfinyx/agents-landing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ActivityDetailDrawer } from '../../components/activity-detail-drawer/activity-detail-drawer';
import { ActivityLogEntry, ActivityStatus, CategoryMixSegment, UsageByAgentEntry } from '../../models/user-profile-activity.models';
import { buildMockActivities } from '../../utils/activity-mock';
import { CATEGORY_COLOR_CLASS, DEFAULT_CATEGORY_COLOR_CLASS, STATUS_LABEL_KEY, STATUS_SEVERITY, dayKey, formatTime, timeAgo } from '../../utils/activity-display';

interface SelectOption {
    label: string;
    value: string;
}

interface FeedGroup {
    day: string;
    items: ActivityLogEntry[];
}

@Component({
    selector: 'lib-my-activity-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        PageHeaderComponent,
        NoData,
        StatCardComponent,
        InputTextModule,
        SelectModule,
        TagModule,
        ActivityDetailDrawer,
    ],
    templateUrl: './my-activity.html',
})
export class MyActivityPage implements OnDestroy {
    private readonly translate = inject(TranslateService);

    readonly statusSeverity = STATUS_SEVERITY;
    readonly statusLabelKey = STATUS_LABEL_KEY;
    readonly formatTime = formatTime;
    readonly timeAgo = timeAgo;

    readonly realAgentTiles: AgentTile[] = AGENT_TILES.filter(tile => !tile.disabled);
    private readonly allActivities: ActivityLogEntry[] = buildMockActivities(this.realAgentTiles);

    search = '';
    agentFilter = 'all';
    statusFilter = 'all';
    range = '14';

    agentOptions: SelectOption[] = [];
    statusOptions: SelectOption[] = [];
    rangeOptions: SelectOption[] = [];

    filteredActivities: ActivityLogEntry[] = [];
    groupedFeed: FeedGroup[] = [];
    usageByAgent: UsageByAgentEntry[] = [];
    categoryMix: CategoryMixSegment[] = [];
    resumeCards: ActivityLogEntry[] = [];

    selectedActivity: ActivityLogEntry | null = null;

    private readonly langChangeSub: Subscription = this.translate.onLangChange.subscribe(() => {
        this.buildFilterOptions();
        this.applyFilters();
    });

    constructor() {
        this.buildFilterOptions();
        this.resumeCards = this.computeResumeCards();
        this.applyFilters();
    }

    ngOnDestroy(): void {
        this.langChangeSub.unsubscribe();
    }

    get totalActivities(): number {
        return this.filteredActivities.length;
    }

    get agentsUsedCount(): number {
        return new Set(this.filteredActivities.map(a => a.agentId)).size;
    }

    get avgPerDay(): string {
        const days = this.range === 'all' ? 30 : parseInt(this.range, 10);
        return (this.filteredActivities.length / days).toFixed(1);
    }

    get needsReviewCount(): number {
        return this.filteredActivities.filter(a => a.status === 'needsReview').length;
    }

    get mostUsedAgentName(): string {
        const counts = new Map<string, number>();
        for (const a of this.filteredActivities) counts.set(a.agentId, (counts.get(a.agentId) ?? 0) + 1);
        let bestAgentId: string | undefined;
        let bestCount = 0;
        for (const [agentId, count] of counts) {
            if (count > bestCount) {
                bestCount = count;
                bestAgentId = agentId;
            }
        }
        return bestAgentId ? this.translate.instant(this.agentNameKey(bestAgentId)) : '—';
    }

    get maxUsageCount(): number {
        return this.usageByAgent[0]?.count ?? 1;
    }

    get categoryTotal(): number {
        return this.categoryMix.reduce((sum, c) => sum + c.count, 0) || 1;
    }

    agentTile(agentId: string): AgentTile | undefined {
        return this.realAgentTiles.find(t => t.id === agentId);
    }

    agentNameKey(agentId: string): string {
        return this.agentTile(agentId)?.nameKey ?? '';
    }

    resumeSubtitle(activity: ActivityLogEntry): string {
        return `${formatTime(activity.ts)} · ${dayKey(activity.ts, this.translate)}`;
    }

    applyFilters(): void {
        const rangeFiltered = this.allActivities.filter(a => this.withinRange(a.ts));
        this.usageByAgent = this.computeUsageByAgent(rangeFiltered);
        this.categoryMix = this.computeCategoryMix(rangeFiltered);

        let list = rangeFiltered;
        if (this.agentFilter !== 'all') {
            list = list.filter(a => a.agentId === this.agentFilter);
        }
        if (this.statusFilter !== 'all') {
            list = list.filter(a => a.status === this.statusFilter);
        }
        const q = this.search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                a => this.translate.instant(this.agentNameKey(a.agentId)).toLowerCase().includes(q) || a.action.toLowerCase().includes(q),
            );
        }

        this.filteredActivities = list;
        this.groupedFeed = this.groupByDay(list);
    }

    setAgentFilter(agentId: string): void {
        this.agentFilter = agentId;
        this.applyFilters();
    }

    openDrawer(activity: ActivityLogEntry): void {
        this.selectedActivity = activity;
    }

    closeDrawer(): void {
        this.selectedActivity = null;
    }

    private withinRange(ts: number): boolean {
        if (this.range === 'all') return true;
        const days = parseInt(this.range, 10);
        return Date.now() - ts <= days * 86400000;
    }

    private computeResumeCards(): ActivityLogEntry[] {
        const seen = new Set<string>();
        const picks: ActivityLogEntry[] = [];
        for (const a of this.allActivities) {
            if (picks.length >= 3) break;
            if (!seen.has(a.agentId)) {
                seen.add(a.agentId);
                picks.push(a);
            }
        }
        return picks;
    }

    private computeUsageByAgent(list: ActivityLogEntry[]): UsageByAgentEntry[] {
        const counts = new Map<string, number>();
        for (const a of list) counts.set(a.agentId, (counts.get(a.agentId) ?? 0) + 1);
        return [...counts.entries()]
            .map(([agentId, count]) => ({ agentId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }

    private computeCategoryMix(list: ActivityLogEntry[]): CategoryMixSegment[] {
        const counts = new Map<string, number>();
        for (const a of list) {
            const tile = this.agentTile(a.agentId);
            if (!tile) continue;
            counts.set(tile.categoryKey, (counts.get(tile.categoryKey) ?? 0) + 1);
        }
        return [...counts.entries()]
            .map(([categoryKey, count]) => ({
                categoryKey,
                count,
                colorClass: CATEGORY_COLOR_CLASS[categoryKey] ?? DEFAULT_CATEGORY_COLOR_CLASS,
            }))
            .sort((a, b) => b.count - a.count);
    }

    private groupByDay(list: ActivityLogEntry[]): FeedGroup[] {
        const groups: FeedGroup[] = [];
        const indexByDay = new Map<string, number>();
        for (const activity of list) {
            const key = dayKey(activity.ts, this.translate);
            let idx = indexByDay.get(key);
            if (idx === undefined) {
                idx = groups.length;
                indexByDay.set(key, idx);
                groups.push({ day: key, items: [] });
            }
            groups[idx].items.push(activity);
        }
        return groups;
    }

    private buildFilterOptions(): void {
        this.agentOptions = [
            { label: this.translate.instant('userProfile.activity.filters.allAgents'), value: 'all' },
            ...this.realAgentTiles.map(t => ({ label: this.translate.instant(t.nameKey), value: t.id })),
        ];
        this.statusOptions = [
            { label: this.translate.instant('userProfile.activity.filters.allStatuses'), value: 'all' },
            ...(Object.keys(STATUS_LABEL_KEY) as ActivityStatus[]).map(status => ({
                label: this.translate.instant(STATUS_LABEL_KEY[status]),
                value: status,
            })),
        ];
        this.rangeOptions = [
            { label: this.translate.instant('userProfile.activity.filters.today'), value: '1' },
            { label: this.translate.instant('userProfile.activity.filters.last7'), value: '7' },
            { label: this.translate.instant('userProfile.activity.filters.last14'), value: '14' },
            { label: this.translate.instant('userProfile.activity.filters.allTime'), value: 'all' },
        ];
    }
}
