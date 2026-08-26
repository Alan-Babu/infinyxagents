import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { CommonService } from '@nfinyx/services';
import { PageHeaderComponent } from '@nfinyx/page-header';

import { DropzoneComponent } from '../components/dropzone/dropzone';
import { VersionPickerDrawerComponent } from '../components/version-picker-drawer/version-picker-drawer';
import { SaveVersionDrawerComponent, SaveVersionPayload } from '../components/save-version-drawer/save-version-drawer';
import { MergeDrawerComponent, MergeDraftPayload } from '../components/merge-drawer/merge-drawer';
import { HistoryDrawerComponent, HistoryTab } from '../components/history-drawer/history-drawer';
import { DocCompareApiService } from '../services/doc-compare-api.service';
import { ChunkUploadProgress, ChunkUploadService } from '../services/chunk-upload.service';
import {
    AgentSummary,
    ChangeIndexEntry,
    ComparisonLogEntry,
    DiffResult,
    DocSide,
    HunkChoice,
    VersionDetail,
    VersionSummary,
} from '../models/doc-compare.models';

type Screen = 'upload' | 'results';
type Slot = 'A' | 'B';
type DrawerName = 'none' | 'picker' | 'save' | 'history' | 'merge';

@Component({
    selector: 'lib-doc-compare',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        PageHeaderComponent,
        DropzoneComponent,
        VersionPickerDrawerComponent,
        SaveVersionDrawerComponent,
        MergeDrawerComponent,
        HistoryDrawerComponent,
    ],
    templateUrl: './doc-compare.html',
})
export class DocCompare implements OnInit {
    private readonly api = inject(DocCompareApiService);
    private readonly chunkUpload = inject(ChunkUploadService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    screen: Screen = 'upload';
    docA: DocSide | null = null;
    docB: DocSide | null = null;

    comparisonId: string | null = null;
    result: DiffResult | null = null;
    agent: AgentSummary | null = null;
    baseLabel = '';
    compareLabel = '';
    activePage: number | null = null;
    currentChangeIdx = -1;

    /** hunk_id -> which side's text to keep in a merged draft ('compare' = keep newest, default) */
    selections: Record<string, HunkChoice> = {};

    master: VersionDetail | null = null;

    loading = false;
    loadingTitle = '';
    loadingSub = '';

    drawer: DrawerName = 'none';
    pickerSlot: Slot = 'A';
    savedVersions: VersionSummary[] = [];
    comparisonLog: ComparisonLogEntry[] = [];
    historyTab: HistoryTab = 'versions';

    saveSlot: Slot = 'A';
    errorMsg = '';

    uploadProgress: Partial<Record<Slot, ChunkUploadProgress>> = {};
    private cancelFlags: Record<Slot, boolean> = { A: false, B: false };

    ngOnInit(): void {
        this.loadMaster();
    }

    async loadMaster(): Promise<void> {
        const m = await this.api.getMaster();
        this.master = m;
        if (m && !this.docA) {
            this.docA = {
                source: 'saved', label: m.label, pageCount: m.page_count,
                savedVersionId: m.id, isMaster: true,
            };
        }
    }

    showLoading(title: string, sub: string): void {
        this.loadingTitle = title;
        this.loadingSub = sub;
        this.loading = true;
    }
    hideLoading(): void {
        this.loading = false;
    }

    // ---------- file handling: chunked upload ----------
    onFileSelected(slot: Slot, file: File): void {
        this.beginChunkedUpload(slot, file);
    }
    onDropped(slot: Slot, file: File): void {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            this.toastr.warning(this.translate.instant('docCompare.toast.dropPdfOnly'));
            return;
        }
        this.beginChunkedUpload(slot, file);
    }

    async beginChunkedUpload(slot: Slot, file: File): Promise<void> {
        this.cancelFlags[slot] = false;
        delete this.uploadProgress[slot];

        const placeholder: DocSide = {
            source: 'uploading', label: file.name, filename: file.name,
            size: file.size, pageCount: 0,
        };
        if (slot === 'A') this.docA = placeholder; else this.docB = placeholder;

        try {
            const result = await this.chunkUpload.uploadFile(
                file,
                (progress) => { this.uploadProgress[slot] = progress; },
                () => this.cancelFlags[slot],
            );
            const doc: DocSide = {
                source: 'upload', label: file.name, filename: file.name,
                size: file.size, pageCount: result.pageCount, uploadRef: result.uploadId,
            };
            if (slot === 'A') this.docA = doc; else this.docB = doc;
        } catch (err) {
            if (this.cancelFlags[slot]) {
                this.toastr.info(this.translate.instant('docCompare.toast.uploadCancelled'));
            } else {
                this.toastr.error(this.errorMessage(err, 'docCompare.toast.uploadFailed'));
            }
            if (slot === 'A') this.docA = null; else this.docB = null;
        } finally {
            delete this.uploadProgress[slot];
        }
    }

    cancelUpload(slot: Slot): void {
        this.cancelFlags[slot] = true;
    }

    clearSlot(slot: Slot): void {
        if (slot === 'A') this.docA = null; else this.docB = null;
    }

    get canCompare(): boolean {
        return !!this.docA && this.docA.source !== 'uploading'
            && !!this.docB && this.docB.source !== 'uploading';
    }

    // ---------- comparison ----------
    async runComparison(): Promise<void> {
        if (!this.docA || !this.docB) return;
        this.errorMsg = '';
        this.showLoading(
            this.translate.instant('docCompare.loading.comparingTitle'),
            this.translate.instant('docCompare.loading.comparingSub'),
        );
        try {
            const res = await this.api.runCompare({
                uploadRefA: this.docA.uploadRef, uploadRefB: this.docB.uploadRef,
                versionAId: this.docA.savedVersionId, versionBId: this.docB.savedVersionId,
                labelA: this.docA.label, labelB: this.docB.label,
            });
            this.comparisonId = res.comparison_id;
            this.result = res.diff;
            this.agent = res.agent;
            this.baseLabel = res.base_label;
            this.compareLabel = res.compare_label;
            this.selections = {};
            this.currentChangeIdx = -1;
            const firstChanged = res.diff.pages.find(p => p.has_changes);
            this.activePage = firstChanged ? firstChanged.page_num : (res.diff.pages[0]?.page_num ?? null);
            this.screen = 'results';
        } catch (err) {
            this.errorMsg = this.errorMessage(err, 'docCompare.toast.comparisonFailed');
            this.toastr.error(this.errorMsg);
        } finally {
            this.hideLoading();
        }
    }

    newComparison(): void {
        this.screen = 'upload';
        this.docB = null;
        this.result = null;
        this.agent = null;
        this.comparisonId = null;
        this.selections = {};
        // keep docA (usually the Master) so re-comparing against it is one click
    }

    jumpToPage(n: number): void {
        this.activePage = n;
        setTimeout(() => {
            document.getElementById('page-' + n)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ---------- change-by-change navigation ----------
    goToChange(delta: number): void {
        if (!this.result || this.result.change_index.length === 0) return;
        const max = this.result.change_index.length - 1;
        this.currentChangeIdx = Math.min(Math.max(this.currentChangeIdx + delta, 0), max);
        this.jumpToChangeIndex(this.currentChangeIdx);
    }
    jumpToChangeIndex(i: number): void {
        if (!this.result) return;
        const entry: ChangeIndexEntry = this.result.change_index[i];
        if (!entry) return;
        this.currentChangeIdx = i;
        this.activePage = entry.page_num;
        setTimeout(() => {
            document.getElementById('hunk-' + entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ---------- per-hunk keep base/compare selection ----------
    getHunkChoice(hunkId: string): HunkChoice {
        return this.selections[hunkId] || 'compare';
    }
    setHunkChoice(hunkId: string, choice: HunkChoice): void {
        if (choice === 'compare') delete this.selections[hunkId];
        else this.selections[hunkId] = choice;
    }
    get overriddenCount(): number {
        return Object.values(this.selections).filter(v => v === 'base').length;
    }

    /** Hide PDF extraction artifacts without changing the stored merge content. */
    collapseRepeatedLines(value?: string): string {
        if (!value) return '';
        const lines = value.split(/(?<=\n)/);
        const output: string[] = [];
        let run: string[] = [];
        let runKey: string | null = null;

        const flushRun = () => {
            if (run.length >= 3) output.push(run[0]);
            else output.push(...run);
        };

        for (const line of lines) {
            const key = line.trim().replace(/\s+/g, ' ');
            if (key && key === runKey) {
                run.push(line);
                continue;
            }
            flushRun();
            run = [line];
            runKey = key || null;
        }
        flushRun();
        return output.join('');
    }

    // ---------- drawers: picker ----------
    async openPicker(slot: Slot): Promise<void> {
        this.pickerSlot = slot;
        this.drawer = 'picker';
        this.savedVersions = await this.api.listVersions();
    }
    selectSavedVersion(v: VersionSummary): void {
        const doc: DocSide = {
            source: 'saved', label: v.label, pageCount: v.page_count,
            savedVersionId: v.id, isMaster: v.is_master,
        };
        if (this.pickerSlot === 'A') this.docA = doc; else this.docB = doc;
        this.closeDrawer();
        this.toastr.success(this.translate.instant('docCompare.toast.loadedAsVersion', { label: v.label, slot: this.pickerSlot }));
    }

    // ---------- drawers: save version ----------
    openSaveDrawer(slot: Slot): void {
        const doc = slot === 'A' ? this.docA : this.docB;
        if (!doc || !doc.uploadRef) {
            this.toastr.warning(this.translate.instant('docCompare.toast.onlyNewUploadsSaveable'));
            return;
        }
        this.saveSlot = slot;
        this.drawer = 'save';
    }
    get saveDrawerInitialLabel(): string {
        const doc = this.saveSlot === 'A' ? this.docA : this.docB;
        return doc?.filename || doc?.label || '';
    }
    async confirmSaveVersion(payload: SaveVersionPayload): Promise<void> {
        const doc = this.saveSlot === 'A' ? this.docA : this.docB;
        if (!doc?.uploadRef) return;
        if (!payload.label) {
            this.toastr.warning(this.translate.instant('docCompare.toast.labelRequired'));
            return;
        }
        try {
            const v = await this.api.saveVersion(doc.uploadRef, payload.label, payload.tag, payload.notes, payload.setAsMaster);
            if (this.saveSlot === 'A' && this.docA) this.docA.savedVersionId = v.id;
            if (this.saveSlot === 'B' && this.docB) this.docB.savedVersionId = v.id;
            this.closeDrawer();
            this.toastr.success(this.translate.instant(v.is_master ? 'docCompare.toast.savedAsMaster' : 'docCompare.toast.savedToLibrary', { label: v.label }));
            if (v.is_master) this.loadMaster();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docCompare.toast.saveFailed'));
        }
    }

    // ---------- drawer: merge selected changes into a new draft ----------
    openMergeDrawer(): void {
        if (!this.result || !this.comparisonId) return;
        this.drawer = 'merge';
    }
    get mergeDrawerInitialLabel(): string {
        return `${this.compareLabel} (merged)`;
    }
    async confirmMerge(payload: MergeDraftPayload): Promise<void> {
        if (!this.comparisonId) return;
        if (!payload.label) {
            this.toastr.warning(this.translate.instant('docCompare.toast.labelRequired'));
            return;
        }
        try {
            const v = await this.api.mergeComparison(
                this.comparisonId, this.selections, payload.label, payload.tag, payload.notes, payload.setAsMaster,
            );
            this.closeDrawer();
            this.toastr.success(this.translate.instant(v.is_master ? 'docCompare.toast.mergedDraftSavedMaster' : 'docCompare.toast.mergedDraftSaved', { label: v.label }));
            if (v.is_master) this.loadMaster();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docCompare.toast.mergeFailed'));
        }
    }

    // ---------- drawers: history ----------
    openHistoryDrawer(): void {
        this.drawer = 'history';
        this.switchHistoryTab(this.historyTab);
    }
    async switchHistoryTab(tab: HistoryTab): Promise<void> {
        this.historyTab = tab;
        if (tab === 'versions') this.savedVersions = await this.api.listVersions();
        else this.comparisonLog = await this.api.listHistory();
    }
    useVersionFromHistory(event: { version: VersionSummary; slot: Slot }): void {
        const { version: v, slot } = event;
        const doc: DocSide = {
            source: 'saved', label: v.label, pageCount: v.page_count,
            savedVersionId: v.id, isMaster: v.is_master,
        };
        if (slot === 'A') this.docA = doc; else this.docB = doc;
        this.closeDrawer();
        this.screen = 'upload';
        this.toastr.success(this.translate.instant('docCompare.toast.loadedAsVersion', { label: v.label, slot }));
    }
    async setMasterVersion(v: VersionSummary): Promise<void> {
        try {
            await this.api.setMaster(v.id);
            this.toastr.success(this.translate.instant('docCompare.toast.setAsMaster', { label: v.label }));
            this.switchHistoryTab(this.historyTab);
            this.loadMaster();
        } catch (err) {
            this.toastr.error(this.errorMessage(err, 'docCompare.toast.setMasterFailed'));
        }
    }
    async deleteVersion(v: VersionSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('docCompare.confirm.deleteVersion', { label: v.label }),
            this.translate.instant('docCompare.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        await this.api.deleteVersion(v.id);
        this.savedVersions = this.savedVersions.filter(x => x.id !== v.id);
        this.toastr.success(this.translate.instant('docCompare.toast.versionRemoved'));
        if (v.is_master) this.loadMaster();
    }
    async deleteLogEntry(l: ComparisonLogEntry): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('docCompare.confirm.deleteLogEntry'),
            this.translate.instant('docCompare.confirm.header'),
            '',
            true,
        );
        if (!confirmed) return;

        await this.api.deleteHistoryEntry(l.id);
        this.comparisonLog = this.comparisonLog.filter(x => x.id !== l.id);
    }

    closeDrawer(): void {
        this.drawer = 'none';
    }

    private errorMessage(err: unknown, fallbackKey: string): string {
        const message = (err as { message?: string })?.message;
        return message || this.translate.instant(fallbackKey);
    }
}
