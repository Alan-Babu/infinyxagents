import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { StatCardComponent } from '@nfinyx/stat-card';
import { InputTextModule } from 'primeng/inputtext';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { FeedbackEntry } from '../../models/executive-summary.models';

@Component({
    selector: 'lib-feedback-report',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, InputTextModule, DatePipe, PageHeaderComponent, StatCardComponent],
    templateUrl: './feedback-report.html',
})
export class FeedbackReportPage implements OnInit {
    private readonly api = inject(ExecSummaryApiService);

    feedback: FeedbackEntry[] = [];
    loading = false;
    search = '';

    async ngOnInit(): Promise<void> {
        this.loading = true;
        try {
            this.feedback = await this.api.listFeedback();
        } finally {
            this.loading = false;
        }
    }

    get averageRating(): number {
        if (!this.feedback.length) return 0;
        return this.feedback.reduce((sum, f) => sum + f.rating, 0) / this.feedback.length;
    }

    get averageRatingDisplay(): string {
        return this.feedback.length ? `${this.averageRating.toFixed(1)} / 5` : '—';
    }

    get withCommentsCount(): number {
        return this.feedback.filter(f => f.comment && f.comment.trim()).length;
    }

    get distribution(): { stars: number; count: number; pct: number }[] {
        const total = this.feedback.length;
        return [5, 4, 3, 2, 1].map(stars => {
            const count = this.feedback.filter(f => f.rating === stars).length;
            return { stars, count, pct: total ? (count / total) * 100 : 0 };
        });
    }

    get filteredFeedback(): FeedbackEntry[] {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.feedback;
        return this.feedback.filter(f => (f.comment || '').toLowerCase().includes(q));
    }

    stars(rating: number): number[] {
        return [0, 1, 2, 3, 4].map(i => (i < rating ? 1 : 0));
    }
}
