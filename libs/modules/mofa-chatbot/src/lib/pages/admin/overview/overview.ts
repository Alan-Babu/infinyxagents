import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { StatCardComponent } from '@nfinyx/stat-card';
import { SelectModule } from 'primeng/select';
import { AnalyticsOverview } from '../../../models/admin.models';
import { MofaChatbotAdminApiService } from '../../../services/mofa-chatbot-admin-api.service';

interface BreakdownEntry {
    key: string;
    count: number;
}

@Component({
    selector: 'lib-admin-overview',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, SelectModule, StatCardComponent],
    templateUrl: './overview.html',
})
export class AdminOverviewPage implements OnInit {
    private readonly api = inject(MofaChatbotAdminApiService);
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    loading = false;
    overview: AnalyticsOverview | null = null;
    days = 7;

    readonly rangeOptions = [
        { label: this.translate.instant('mofaChatbot.admin.overview.range24h'), value: 1 },
        { label: this.translate.instant('mofaChatbot.admin.overview.range7d'), value: 7 },
        { label: this.translate.instant('mofaChatbot.admin.overview.range30d'), value: 30 },
    ];

    async ngOnInit(): Promise<void> {
        await this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        try {
            this.overview = await this.api.getAnalyticsOverview(this.days);
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    breakdownEntries(rec: Record<string, number> | undefined): BreakdownEntry[] {
        if (!rec) return [];
        return Object.entries(rec)
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    }

    maxBreakdownCount(rec: Record<string, number> | undefined): number {
        const entries = this.breakdownEntries(rec);
        return entries.length ? Math.max(...entries.map(e => e.count)) : 1;
    }

    languageLabel(key: string): string {
        return key === 'ar' ? this.translate.instant('mofaChatbot.admin.common.languageAr') : this.translate.instant('mofaChatbot.admin.common.languageEn');
    }
}
