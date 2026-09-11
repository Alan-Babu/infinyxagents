import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { StatCardComponent } from '@nfinyx/stat-card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { FeedbackEntry, FeedbackStats } from '../../models/executive-summary.models';

const PAGE_SIZE = 8;
const ANY = 'Any rating';
const RATING_OPTIONS = [ANY, '5 stars', '4 stars', '3 stars', '2 stars', '1 star'];

@Component({
    selector: 'lib-feedback-report',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, InputTextModule, SelectModule, DatePipe, PageHeaderComponent, StatCardComponent],
    templateUrl: './feedback-report.html',
})
export class FeedbackReportPage implements OnInit {
    private readonly api = inject(ExecSummaryApiService);

    readonly anyOption = ANY;
    readonly ratingOptions = RATING_OPTIONS;

    feedback: FeedbackEntry[] = [];
    total = 0;
    page = 1;
    hasMore = false;
    loading = false;

    stats: FeedbackStats | null = null;
    statsLoading = false;

    search = '';
    ratingFilter = ANY;
    private searchTimer?: ReturnType<typeof setTimeout>;

    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadStats(), this.loadFeedback(1)]);
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.total / PAGE_SIZE));
    }

    get averageRatingDisplay(): string {
        return this.stats?.total ? `${this.stats.average_rating.toFixed(1)} / 5` : '—';
    }

    private get ratingValue(): number | undefined {
        return this.ratingFilter === ANY ? undefined : Number(this.ratingFilter.charAt(0));
    }

    onSearchChange(value: string): void {
        this.search = value;
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => void this.loadFeedback(1), 300);
    }

    onRatingFilterChange(): void {
        void this.loadFeedback(1);
    }

    async loadStats(): Promise<void> {
        this.statsLoading = true;
        try {
            this.stats = await this.api.getFeedbackStats();
        } finally {
            this.statsLoading = false;
        }
    }

    async loadFeedback(page: number): Promise<void> {
        this.loading = true;
        try {
            const res = await this.api.searchFeedback({
                q: this.search.trim() || undefined,
                rating: this.ratingValue,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            this.feedback = res.items;
            this.total = res.total;
            this.hasMore = res.has_more;
            this.page = page;
        } finally {
            this.loading = false;
        }
    }

    stars(rating: number): number[] {
        return [0, 1, 2, 3, 4].map(i => (i < rating ? 1 : 0));
    }
}
