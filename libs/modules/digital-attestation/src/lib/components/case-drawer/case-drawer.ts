import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, CommonService } from '@nfinyx/services';
import { ApiError } from '@nfinyx/types';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { AttestationCase, CaseDecision } from '../../models/digital-attestation.models';
import { WorkflowDocumentSource } from '../../models/verification-workflow.models';
import { DigitalAttestationApiService } from '../../services/digital-attestation-api.service';
import {
    confidenceTone,
    docTypeLabel,
    formatDateTime,
    statusSeverity,
    toneBadgeClass,
    toneBarClass,
    toneTextClass,
} from '../../utils/case-display';

interface DrawerFile {
    id: WorkflowDocumentSource;
    titleKey: string;
}

interface FileViewState {
    loading: boolean;
    error: boolean;
    unavailable: boolean;
    previewUrl: SafeResourceUrl | null;
    objectUrl: string | null;
}

function blankFileView(): FileViewState {
    return { loading: false, error: false, unavailable: false, previewUrl: null, objectUrl: null };
}

@Component({
    selector: 'lib-case-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DrawerModule, TabsModule, TagModule],
    templateUrl: './case-drawer.html',
})
export class CaseDrawerComponent implements OnChanges, OnDestroy {
    private readonly api = inject(DigitalAttestationApiService);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly sanitizer = inject(DomSanitizer);

    /** The case row as already fetched by the parent's list/queue call — the drawer never
     * re-fetches a single workflow to populate itself, matching the reference app (`openReview`
     * uses the row it already has; a single-workflow GET is only ever a fallback inside agent-run
     * fetching, never the drawer's primary data source). */
    @Input() row: AttestationCase | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() decided = new EventEmitter<void>();

    readonly docTypeLabel = docTypeLabel;
    readonly formatDateTime = formatDateTime;
    readonly statusSeverity = statusSeverity;
    readonly confidenceTone = confidenceTone;
    readonly toneBadgeClass = toneBadgeClass;
    readonly toneTextClass = toneTextClass;
    readonly toneBarClass = toneBarClass;

    readonly fileList: DrawerFile[] = [
        { id: 'uploaded', titleKey: 'digitalAttestation.drawer.files.input' },
        { id: 'true-copy', titleKey: 'digitalAttestation.drawer.files.trueCopy' },
        { id: 'attested-copy', titleKey: 'digitalAttestation.drawer.files.attestedCopy' },
    ];

    case: AttestationCase | null = null;
    activeTab = 'overview';
    activeFile: WorkflowDocumentSource = 'uploaded';
    notes = '';
    submitting = false;

    agentsLoading = false;
    agentsError = false;

    fileViews: Record<WorkflowDocumentSource, FileViewState> = {
        uploaded: blankFileView(),
        'true-copy': blankFileView(),
        'attested-copy': blankFileView(),
    };

    ngOnChanges(changes: SimpleChanges): void {
        if (!('row' in changes)) return;
        this.resetDrawerState();
        if (!this.row) return;
        this.case = { ...this.row };
        this.notes = this.case.notes;
        // Load agent runs + the uploaded file's preview up front so the Agents/Files
        // tabs feel instant when the user switches to them, matching the reference UX.
        void this.loadAgentRuns();
        void this.loadFilePreview('uploaded');
    }

    ngOnDestroy(): void {
        this.revokeObjectUrls();
    }

    private resetDrawerState(): void {
        this.activeTab = 'overview';
        this.activeFile = 'uploaded';
        this.case = null;
        this.agentsLoading = false;
        this.agentsError = false;
        this.revokeObjectUrls();
        this.fileViews = { uploaded: blankFileView(), 'true-copy': blankFileView(), 'attested-copy': blankFileView() };
    }

    private revokeObjectUrls(): void {
        for (const view of Object.values(this.fileViews)) {
            if (view.objectUrl) URL.revokeObjectURL(view.objectUrl);
        }
    }

    get activeFileTitleKey(): string {
        return this.fileList.find(f => f.id === this.activeFile)?.titleKey ?? '';
    }

    get failedStepCount(): number {
        return this.case?.pipeline.filter(p => p.status === 'FAILED').length ?? 0;
    }

    get reviewedBySummary(): string {
        if (!this.case?.reviewedAt) return '';
        const decision = this.translate.instant(this.case.status === 'APPROVED' ? 'digitalAttestation.drawer.approved' : 'digitalAttestation.drawer.rejected');
        return this.translate.instant('digitalAttestation.drawer.reviewedBy', {
            decision,
            reviewer: this.case.reviewer,
            date: formatDateTime(this.case.reviewedAt),
        });
    }

    async onTabChange(value: string | number | undefined): Promise<void> {
        this.activeTab = String(value ?? 'overview');
        if (this.activeTab === 'agents') await this.loadAgentRuns();
        if (this.activeTab === 'files') await this.loadFilePreview(this.activeFile);
    }

    private async loadAgentRuns(): Promise<void> {
        if (!this.case || this.case.pipeline.length || this.agentsLoading) return;
        this.agentsLoading = true;
        this.agentsError = false;
        try {
            const pipeline = await this.api.getAgentRuns(this.case.id);
            this.case = { ...this.case, pipeline };
        } catch {
            this.agentsError = true;
        } finally {
            this.agentsLoading = false;
        }
    }

    async selectFile(source: WorkflowDocumentSource): Promise<void> {
        this.activeFile = source;
        await this.loadFilePreview(source);
    }

    private async loadFilePreview(source: WorkflowDocumentSource): Promise<void> {
        if (!this.case) return;
        const view = this.fileViews[source];
        if (view.previewUrl || view.loading || view.unavailable) return;
        view.loading = true;
        view.error = false;
        try {
            const blob = await this.api.getDocumentBlob(this.case.id, source, 'view');
            const objectUrl = URL.createObjectURL(blob);
            view.objectUrl = objectUrl;
            view.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) view.unavailable = true;
            else view.error = true;
        } finally {
            view.loading = false;
        }
    }

    async downloadFile(source: WorkflowDocumentSource): Promise<void> {
        if (!this.case) return;
        try {
            const blob = await this.api.getDocumentBlob(this.case.id, source, 'download');
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `${this.case.id}-${source}`;
            link.click();
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async submitDecision(decision: CaseDecision): Promise<void> {
        if (!this.case || this.submitting) return;
        this.submitting = true;
        try {
            const reviewerId = this.auth.user()?.id || '';
            await this.api.decide(this.case.id, decision, reviewerId, this.notes, this.case.mismatch);
            // Matches the reference app: close the drawer and let the parent reload the list
            // from the queue endpoint rather than re-fetching this single workflow.
            this.closed.emit();
            this.decided.emit();
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.submitting = false;
        }
    }
}
