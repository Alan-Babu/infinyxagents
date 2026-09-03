import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { AuthService } from '@nfinyx/services';
import { StatCardComponent } from '@nfinyx/stat-card';

import { BarChartComponent, BarDatum } from '../../components/bar-chart/bar-chart';
import { DonutChartComponent, DonutDatum } from '../../components/donut-chart/donut-chart';
import {
    ModerationSummaryResponse,
    UsageSummaryResponse,
    UsageTimeseriesPoint,
} from '../../models/executive-summary.models';
import { ExecSummaryApiService } from '../../services/exec-summary-api.service';

@Component({
    selector: 'lib-usage-analytics',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        PageHeaderComponent,
        StatCardComponent,
        BarChartComponent,
        DonutChartComponent,
    ],
    templateUrl: './usage-analytics.html',
})
export class UsageAnalyticsPage implements OnInit {
    private readonly api = inject(ExecSummaryApiService);
    private readonly translate = inject(TranslateService);
    private readonly auth = inject(AuthService);

    loading = false;
    partialFailure = false;
    summary: UsageSummaryResponse | null = null;
    timeseries: UsageTimeseriesPoint[] = [];
    moderation: ModerationSummaryResponse | null = null;

    /** Every analytics endpoint lives on the exec-agent admin router. */
    get isAdmin(): boolean {
        return this.auth.isAdmin();
    }

    async ngOnInit(): Promise<void> {
        if (!this.isAdmin) return;
        this.loading = true;
        const results = await Promise.allSettled([
            this.api.getUsageSummary(),
            this.api.getUsageTimeseries(30),
            this.api.getModerationSummary(),
        ]);
        if (results[0].status === 'fulfilled') this.summary = results[0].value;
        if (results[1].status === 'fulfilled') this.timeseries = results[1].value;
        if (results[2].status === 'fulfilled') this.moderation = results[2].value;
        this.partialFailure = results.some(result => result.status === 'rejected');
        this.loading = false;
    }

    get providerData(): BarDatum[] {
        return (this.summary?.by_provider || []).map(item => ({ label: item.provider, value: item.count }));
    }

    get frameworkData(): DonutDatum[] {
        return (this.summary?.top_frameworks || []).map(item => ({ label: item.framework, value: item.count }));
    }

    get timeseriesData(): BarDatum[] {
        return this.timeseries.map(item => ({
            label: new Date(item.date).toLocaleDateString(this.translate.currentLang || undefined, {
                month: 'short',
                day: '2-digit',
            }),
            value: item.count,
        }));
    }

    get moderationData(): BarDatum[] {
        return (this.moderation?.by_category || []).map(item => ({ label: item.category, value: item.count }));
    }

    percentage(value: number | null | undefined): string {
        return value == null ? '—' : `${Math.round(value * 10) / 10}%`;
    }
}
