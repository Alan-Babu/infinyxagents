import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { CommonService } from '@nfinyx/services';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ExecSummaryApiService } from '../../services/exec-summary-api.service';
import {
    Category,
    ConversationSummary,
    Framework,
    HistoryEntry,
    ResearchType,
    Visibility,
} from '../../models/executive-summary.models';

type HistoryTab = 'research' | 'chats';
const PAGE_SIZE = 4;
const ANY = 'Any';

@Component({
    selector: 'lib-history-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DialogModule, InputTextModule, SelectModule, DatePipe],
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
    @Output() openConversation = new EventEmitter<string>();

    activeTab: HistoryTab = 'research';
    entries: HistoryEntry[] = [];
    entriesTotal = 0;
    entriesPage = 1;
    entriesHasMore = false;
    entriesLoading = false;
    researchQuery = '';
    researchCategory = ANY;
    researchType = ANY;
    researchFramework = ANY;
    researchVisibility = ANY;
    conversations: ConversationSummary[] = [];
    conversationsTotal = 0;
    conversationsPage = 1;
    conversationsHasMore = false;
    conversationsLoading = false;
    chatsQuery = '';
    private researchTimer?: ReturnType<typeof setTimeout>;
    private chatsTimer?: ReturnType<typeof setTimeout>;

    readonly categoryOptions = [ANY, 'political', 'social', 'personal', 'business', 'trade', 'other'];
    readonly researchTypeOptions = [
        ANY, 'Country', 'Trade', 'Government Official / Minister', 'Business / Company', 'Individual / Person',
        'Social Media Post', 'Other',
    ];
    readonly frameworkOptions = [ANY, 'PESTLE', "Porter's Five Forces", 'DEEPLIST', 'McKinsey 7-S Model', 'SWOT', 'SOAR'];
    readonly visibilityOptions = [ANY, 'private', 'shared'];
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
        await this.loadResearch(1);
        if (this.activeTab === 'chats') await this.loadConversations(1);
    }

    get totalResearchPages(): number {
        return Math.max(1, Math.ceil(this.entriesTotal / PAGE_SIZE));
    }

    get totalConversationPages(): number {
        return Math.max(1, Math.ceil(this.conversationsTotal / PAGE_SIZE));
    }

    switchTab(tab: HistoryTab): void {
        this.activeTab = tab;
        if (tab === 'chats' && !this.conversations.length) void this.loadConversations(1);
    }

    onResearchSearch(value: string): void {
        this.researchQuery = value;
        clearTimeout(this.researchTimer);
        this.researchTimer = setTimeout(() => void this.loadResearch(1), 300);
    }

    onChatSearch(value: string): void {
        this.chatsQuery = value;
        clearTimeout(this.chatsTimer);
        this.chatsTimer = setTimeout(() => void this.loadConversations(1), 300);
    }

    async loadResearch(page: number): Promise<void> {
        this.entriesLoading = true;
        try {
            const response = await this.api.searchHistory({
                q: this.researchQuery.trim() || undefined,
                category: this.researchCategory === ANY ? undefined : this.researchCategory as Category,
                research_type: this.researchType === ANY ? undefined : this.researchType as ResearchType,
                framework: this.researchFramework === ANY ? undefined : this.researchFramework as Framework,
                visibility: this.researchVisibility === ANY ? undefined : this.researchVisibility as Visibility,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            this.entries = response.items;
            this.entriesTotal = response.total;
            this.entriesHasMore = response.has_more;
            this.entriesPage = page;
        } finally {
            this.entriesLoading = false;
        }
    }

    async loadConversations(page: number): Promise<void> {
        this.conversationsLoading = true;
        try {
            const response = await this.api.searchConversations({
                q: this.chatsQuery.trim() || undefined,
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            this.conversations = response.items;
            this.conversationsTotal = response.total;
            this.conversationsHasMore = response.has_more;
            this.conversationsPage = page;
        } finally {
            this.conversationsLoading = false;
        }
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
            await this.loadResearch(this.entriesPage);
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.history.deleteFailed'));
        }
    }

    async confirmDeleteConversation(conversation: ConversationSummary): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('executiveSummary.history.confirmDeleteChat', { name: conversation.title }),
            this.translate.instant('executiveSummary.confirmHeader'),
            '',
            true,
        );
        if (!confirmed) return;
        this.actingId = conversation.conversation_id;
        try {
            await this.api.deleteConversation(conversation.conversation_id);
            await this.loadConversations(this.conversationsPage);
        } catch {
            this.toastr.error(this.translate.instant('executiveSummary.history.deleteChatFailed'));
        } finally {
            this.actingId = null;
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
