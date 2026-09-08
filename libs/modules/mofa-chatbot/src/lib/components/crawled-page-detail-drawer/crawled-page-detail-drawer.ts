import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { CrawledPageDetail } from '../../models/admin.models';

/**
 * Read-only crawled-page drawer opened from the admin Crawl Schedule page's
 * "Crawled Pages" list -- the direct, concrete answer to "did we actually
 * get this page's content": shows exactly the raw extracted text and the
 * chunks stored for it, mirroring risk-session-transcript-drawer's pattern.
 */
@Component({
    selector: 'lib-crawled-page-detail-drawer',
    standalone: true,
    imports: [CommonModule, TranslateModule, DrawerModule],
    template: `
        <p-drawer [visible]="!!page" position="right" styleClass="p-drawer-md" appendTo="body" [baseZIndex]="1200" (onHide)="closed.emit()">
            <ng-template #header>
                <div class="flex flex-col">
                    <span class="text-xs font-bold uppercase tracking-wide text-primary-600">{{ 'mofaChatbot.admin.crawl.pageDetailTitle' | translate }}</span>
                    @if (page) {
                        <span class="max-w-xs truncate font-mono text-xs text-gray-400">{{ page.url }}</span>
                    }
                </div>
            </ng-template>

            @if (page) {
                <div class="flex flex-col gap-5">
                    <div>
                        <div class="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">{{ 'mofaChatbot.admin.crawl.rawTextLabel' | translate }}</div>
                        <div class="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700">
                            {{ page.raw_text || ('mofaChatbot.admin.crawl.noRawText' | translate) }}
                        </div>
                    </div>

                    <div>
                        <div class="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                            {{ 'mofaChatbot.admin.crawl.chunksLabel' | translate }} ({{ page.chunks.length }})
                        </div>
                        <div class="flex flex-col gap-2">
                            @for (chunk of page.chunks; track chunk.id) {
                                <div class="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    {{ chunk.text }}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
        </p-drawer>
    `,
})
export class CrawledPageDetailDrawerComponent {
    @Input() page: CrawledPageDetail | null = null;
    @Output() closed = new EventEmitter<void>();
}
