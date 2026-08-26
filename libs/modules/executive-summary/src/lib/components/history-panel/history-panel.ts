import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { CommonService } from '@nfinyx/services';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import { HistoryEntry } from '../../models/executive-summary.models';

@Component({
    selector: 'lib-history-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DialogModule, InputTextModule, DatePipe],
    templateUrl: './history-panel.html',
})
export class HistoryPanelComponent implements OnInit {
    private readonly api = inject(ExecSummaryApiService);
    private readonly toastr = inject(ToastrService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);

    @Input() collapsed = false;
    @Output() collapsedChange = new EventEmitter<boolean>();
    @Output() open = new EventEmitter<string>();
    @Output() exportItem = new EventEmitter<string>();

    entries: HistoryEntry[] = [];
    /** Which card (by session_id) currently has an action in flight. */
    actingId: string | null = null;

    renameDialogVisible = false;
    renameTarget: HistoryEntry | null = null;
    renameValue = '';

    shareDialogVisible = false;
    shareTarget: HistoryEntry | null = null;
    shareEmail = '';

    async ngOnInit(): Promise<void> {
        await this.refresh();
    }

    async refresh(): Promise<void> {
        this.entries = await this.api.listHistory();
    }

    async confirmDelete(h: HistoryEntry): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('executiveSummary.history.confirmDelete', { name: h.name }),
            this.translate.instant('executiveSummary.confirmHeader'),
            '',
            true,
        );
        if (!confirmed) return;

        try {
            await this.api.deleteHistory(h.session_id);
            this.refresh();
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.history.deleteFailed'));
        }
    }

    openRenameDialog(h: HistoryEntry): void {
        this.renameTarget = h;
        this.renameValue = h.name;
        this.renameDialogVisible = true;
    }

    async confirmRename(): Promise<void> {
        const h = this.renameTarget;
        const newName = this.renameValue.trim();
        if (!h || !newName || newName === h.name) {
            this.renameDialogVisible = false;
            return;
        }
        this.actingId = h.session_id;
        this.renameDialogVisible = false;
        try {
            await this.api.renameHistory(h.session_id, newName);
            await this.refresh();
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.history.renameFailed'));
        } finally {
            this.actingId = null;
        }
    }

    openShareDialog(h: HistoryEntry): void {
        this.shareTarget = h;
        this.shareEmail = '';
        this.shareDialogVisible = true;
    }

    async confirmShare(): Promise<void> {
        const h = this.shareTarget;
        const target = this.shareEmail.trim();
        if (!h || !target) {
            this.shareDialogVisible = false;
            return;
        }
        this.actingId = h.session_id;
        this.shareDialogVisible = false;
        try {
            const detail = await this.api.getHistoryDetail(h.session_id);
            const res = await this.api.shareEmail(h.session_id, target, undefined, detail.content_markdown, detail.title);
            this.toastr.success(res.result || this.translate.instant('executiveSummary.history.shared'));
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.history.shareFailed'));
        } finally {
            this.actingId = null;
        }
    }
}
