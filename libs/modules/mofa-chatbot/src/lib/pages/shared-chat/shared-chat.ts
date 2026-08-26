import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedChatResult } from '../../models/chat.models';
import { MofaChatApiService } from '../../services/mofa-chat-api.service';

/** Standalone, unauthenticated, read-only transcript render for a saved/shared chat link. */
@Component({
    selector: 'lib-shared-chat',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './shared-chat.html',
    host: { class: 'flex min-h-screen flex-col bg-gray-50' },
})
export class SharedChatPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly api = inject(MofaChatApiService);

    loading = true;
    error = '';
    result: SharedChatResult | null = null;

    get isRtl(): boolean {
        return this.result?.language === 'ar';
    }

    async ngOnInit(): Promise<void> {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.loading = false;
            this.error = 'missing';
            return;
        }
        try {
            this.result = await this.api.getSharedSession(token);
        } catch {
            this.error = 'notFound';
        } finally {
            this.loading = false;
        }
    }
}
