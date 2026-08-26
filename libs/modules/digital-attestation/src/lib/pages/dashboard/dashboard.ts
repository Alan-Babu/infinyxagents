import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { StatCardComponent } from '@nfinyx/stat-card';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { CaseDrawerComponent } from '../../components/case-drawer/case-drawer';
import { AttestationCase, CaseDecision } from '../../models/digital-attestation.models';
import { DigitalAttestationApiService } from '../../services/digital-attestation-api.service';
import { buildCaseColDefs } from '../../utils/case-columns';

@Component({
    selector: 'lib-attestation-dashboard',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule, DataTable, CaseDrawerComponent, StatCardComponent, PageHeaderComponent],
    templateUrl: './dashboard.html',
})
export class AttestationDashboardPage implements OnInit, OnDestroy {
    private readonly api = inject(DigitalAttestationApiService);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    cases: AttestationCase[] = [];
    recentCases: AttestationCase[] = [];
    loading = false;
    errorMessage = '';
    drawerCase: AttestationCase | null = null;
    colDefs: ColDef[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => this.rebuildColDefs());
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        await this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private rebuildColDefs(): void {
        this.colDefs = buildCaseColDefs(
            key => this.translate.instant(key),
            (id, decision) => this.onDecide({ id, decision }),
        );
    }

    async refresh(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const [pending, completed] = await Promise.all([this.api.listCases('pending'), this.api.listCases('completed')]);
            this.cases = [...pending.items, ...completed.items].sort((a, b) => b.updatedAt - a.updatedAt);
            this.recentCases = this.cases.slice(0, 6);
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('digitalAttestation.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    get pendingCount(): number {
        return this.cases.filter(c => c.status === 'PENDING').length;
    }

    get failedCount(): number {
        return this.cases.filter(c => c.status === 'FAILED').length;
    }

    get completedCount(): number {
        return this.cases.filter(c => c.status === 'APPROVED' || c.status === 'REJECTED').length;
    }

    get approvedCount(): number {
        return this.cases.filter(c => c.status === 'APPROVED').length;
    }

    get approvalRate(): number {
        return this.completedCount ? Math.round((this.approvedCount / this.completedCount) * 100) : 0;
    }

    get avgConfidence(): number {
        if (!this.cases.length) return 0;
        return Math.round(this.cases.reduce((sum, c) => sum + c.confidence, 0) / this.cases.length);
    }

    goToManualReview(): void {
        this.router.navigateByUrl('/digital-attestation/pending');
    }

    openCase(row: unknown): void {
        this.drawerCase = row as AttestationCase;
    }

    closeDrawer(): void {
        this.drawerCase = null;
    }

    async onDecide(event: { id: string; decision: CaseDecision }): Promise<void> {
        const row = this.cases.find(c => c.id === event.id);
        try {
            await this.api.decide(event.id, event.decision, this.auth.user()?.id || '', undefined, row?.mismatch);
            await this.refresh();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async onDecided(): Promise<void> {
        await this.refresh();
    }
}
