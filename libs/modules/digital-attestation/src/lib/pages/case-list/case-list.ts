import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import { PageHeaderComponent } from '@nfinyx/page-header';
import type { ColDef } from 'ag-grid-community';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { CaseDrawerComponent } from '../../components/case-drawer/case-drawer';
import { AttestationCase, CaseDecision, CaseStatusGroup, COUNTRIES, DOC_TYPES } from '../../models/digital-attestation.models';
import { DigitalAttestationApiService } from '../../services/digital-attestation-api.service';
import { buildCaseColDefs } from '../../utils/case-columns';
import { docTypeLabel } from '../../utils/case-display';

@Component({
    selector: 'lib-case-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, InputTextModule, SelectModule, DataTable, CaseDrawerComponent, PageHeaderComponent],
    templateUrl: './case-list.html',
})
export class CaseListPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly api = inject(DigitalAttestationApiService);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    statusGroup: CaseStatusGroup = 'pending';
    allCases: AttestationCase[] = [];
    baseCases: AttestationCase[] = [];
    filteredCases: AttestationCase[] = [];
    loading = false;
    errorMessage = '';
    drawerCase: AttestationCase | null = null;
    colDefs: ColDef[] = [];

    search = '';
    docType = 'all';
    country = 'all';

    docTypeOptions: { label: string; value: string }[] = [];
    countryOptions: { label: string; value: string }[] = [];

    private readonly langSub: Subscription;

    constructor() {
        this.langSub = this.translate.onLangChange.subscribe(() => {
            this.buildFilterOptions();
            this.rebuildColDefs();
        });
        this.rebuildColDefs();
    }

    async ngOnInit(): Promise<void> {
        this.statusGroup = (this.route.snapshot.data['statusGroup'] as CaseStatusGroup) || 'pending';
        this.buildFilterOptions();
        await this.refresh();
    }

    ngOnDestroy(): void {
        this.langSub.unsubscribe();
    }

    private buildFilterOptions(): void {
        this.docTypeOptions = [
            { label: this.translate.instant('digitalAttestation.filters.allDocTypes'), value: 'all' },
            ...DOC_TYPES.map(d => ({ label: docTypeLabel(d), value: d })),
        ];
        this.countryOptions = [
            { label: this.translate.instant('digitalAttestation.filters.allCountries'), value: 'all' },
            ...COUNTRIES.map(c => ({ label: c.name, value: c.code })),
        ];
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
            if (this.statusGroup === 'pending') {
                this.allCases = (await this.api.listCases('pending')).items;
            } else if (this.statusGroup === 'completed') {
                this.allCases = (await this.api.listCases('completed')).items;
            } else {
                // No dedicated "failed" bucket server-side — fetch both and filter client-side.
                const [pending, completed] = await Promise.all([this.api.listCases('pending'), this.api.listCases('completed')]);
                this.allCases = [...pending.items, ...completed.items];
            }
            this.applyFilters();
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('digitalAttestation.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    /** Recomputes `baseCases`/`filteredCases`. Called explicitly (not via getters) so
     * `<lib-data-table>`'s `[rowData]` only gets a new array reference when the
     * underlying data or filters actually change — a getter re-evaluated on every
     * change-detection cycle would hand ag-grid a "new" array every tick. */
    applyFilters(): void {
        if (this.statusGroup === 'pending') this.baseCases = this.allCases.filter(c => c.status === 'PENDING');
        else if (this.statusGroup === 'failures') this.baseCases = this.allCases.filter(c => c.status === 'FAILED');
        else this.baseCases = this.allCases.filter(c => c.status === 'APPROVED' || c.status === 'REJECTED');

        let list = this.baseCases;
        if (this.docType !== 'all') list = list.filter(c => c.docType === this.docType);
        if (this.country !== 'all') list = list.filter(c => c.countryCode === this.country);
        if (this.search.trim()) {
            const q = this.search.toLowerCase();
            list = list.filter(c => c.id.toLowerCase().includes(q) || c.file.toLowerCase().includes(q) || (c.simId || '').toLowerCase().includes(q));
        }
        this.filteredCases = list;
    }

    openCase(row: unknown): void {
        this.drawerCase = row as AttestationCase;
    }

    closeDrawer(): void {
        this.drawerCase = null;
    }

    async onDecide(event: { id: string; decision: CaseDecision }): Promise<void> {
        const row = this.allCases.find(c => c.id === event.id);
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
