import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RiskCategoryEntry } from '../../models/contract-analyzer.models';
import { riskClass } from '../../utils/contract-display';

const LEVEL_ORDER = ['Critical', 'High', 'Medium', 'Low'];

interface RiskLevelGroup {
    level: string;
    items: RiskCategoryEntry[];
}

/** Risk categories grouped by severity (Critical → Low), click-to-expand for explanation/clause/cash-flow-impact. */
@Component({
    selector: 'lib-contract-analyzer-risk-dashboard',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './risk-dashboard.html',
})
export class RiskDashboardComponent {
    @Input() categories: RiskCategoryEntry[] = [];

    readonly riskClass = riskClass;

    expandedCategory: string | null = null;

    get groups(): RiskLevelGroup[] {
        return LEVEL_ORDER
            .map(level => ({ level, items: this.categories.filter(c => c.level === level) }))
            .filter(g => g.items.length > 0);
    }

    toggle(category: string): void {
        this.expandedCategory = this.expandedCategory === category ? null : category;
    }
}
