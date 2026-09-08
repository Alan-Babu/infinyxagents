import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AgentStatus } from '../../models/asset.models';
import { AgentApiService } from '../../services/agent-api.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

@Component({
    selector: 'lib-agent-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule],
    templateUrl: './agent-chat.html',
})
export class AgentChatPage implements OnInit {
    private readonly api = inject(AgentApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    private readonly route = inject(ActivatedRoute);

    @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

    status: AgentStatus | null = null;
    messages: ChatMessage[] = [];
    draft = '';
    sending = false;

    private readonly contextAssetId: string | null = null;

    constructor() {
        this.contextAssetId = this.route.snapshot.queryParamMap.get('assetId');
    }

    async ngOnInit(): Promise<void> {
        try {
            this.status = await this.api.status();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async send(): Promise<void> {
        const query = this.draft.trim();
        if (!query || this.sending) return;
        this.messages.push({ role: 'user', content: query });
        this.draft = '';
        this.sending = true;
        this.scrollToBottom();
        try {
            const response = await this.api.chat(query, this.contextAssetId ?? undefined);
            this.messages.push({ role: 'assistant', content: response.answer });
        } catch (err) {
            this.common.showApiError(err);
            this.messages.push({ role: 'assistant', content: this.translate.instant('assetIntelligence.agentChat.errorReply') });
        } finally {
            this.sending = false;
            this.scrollToBottom();
        }
    }

    private scrollToBottom(): void {
        queueMicrotask(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }));
    }
}
