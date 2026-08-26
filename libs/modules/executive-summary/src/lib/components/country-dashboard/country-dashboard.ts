import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BarChartComponent, BarDatum } from '../bar-chart/bar-chart';
import { DonutChartComponent, DonutDatum } from '../donut-chart/donut-chart';
import { CountryDashboardData } from '../../models/executive-summary.models';

@Component({
    selector: 'lib-country-dashboard',
    standalone: true,
    imports: [CommonModule, TranslateModule, BarChartComponent, DonutChartComponent],
    templateUrl: './country-dashboard.html',
})
export class CountryDashboardComponent {
    @Input() data: CountryDashboardData | null | undefined;

    get tradeBarData(): BarDatum[] {
        return (this.data?.trade_by_year || []).map(t => ({ label: String(t.year), value: t.value_usd_billion }));
    }

    get investmentDonutData(): DonutDatum[] {
        return (this.data?.uae_investment_by_sector || []).map(s => ({ label: s.sector, value: s.value_usd_billion }));
    }

    get localsDonutData(): DonutDatum[] {
        return (this.data?.uae_locals_by_reason || []).map(r => ({ label: r.reason, value: r.percentage }));
    }
}
