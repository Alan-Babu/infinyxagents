import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

type Entry = number | 'gap-start' | 'gap-end';

/**
 * Pagination as real links: the page lives in the URL (`?page=`), so it is shareable and
 * back-button friendly. Client-side slicing (see `paginate` in utils/format) supplies the numbers.
 */
@Component({
    selector: 'lib-legal-ai-pager',
    standalone: true,
    imports: [RouterLink, TranslateModule],
    template: `
        @if (pages() > 1) {
        <nav class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3" [attr.aria-label]="'legalAi.pagination' | translate">
            <span class="text-xs text-gray-500 tabular-nums" aria-live="polite">
                {{ 'legalAi.showingRange' | translate: { from: from(), to: to(), total: total() } }}
            </span>
            <ul class="flex items-center gap-1">
                <li>
                    @if (page() > 1) {
                    <a class="pager-btn" routerLink="." [queryParams]="{ page: page() - 1 }" queryParamsHandling="merge" rel="prev"
                        [attr.aria-label]="'legalAi.pagePrev' | translate"><i class="pi pi-angle-left rtl:rotate-180" aria-hidden="true"></i></a>
                    } @else {
                    <span class="pager-btn opacity-40" aria-disabled="true"><i class="pi pi-angle-left rtl:rotate-180" aria-hidden="true"></i></span>
                    }
                </li>
                @for (e of entries(); track $index) {
                <li class="max-sm:hidden">
                    @if (e === 'gap-start' || e === 'gap-end') {
                    <span class="px-1 text-gray-400" aria-hidden="true">…</span>
                    } @else {
                    <a class="pager-btn" routerLink="." [queryParams]="{ page: e }" queryParamsHandling="merge"
                        [class.pager-active]="e === page()" [attr.aria-current]="e === page() ? 'page' : null"
                        [attr.aria-label]="'legalAi.pageN' | translate: { n: e }">{{ e }}</a>
                    }
                </li>
                }
                <li>
                    @if (page() < pages()) {
                    <a class="pager-btn" routerLink="." [queryParams]="{ page: page() + 1 }" queryParamsHandling="merge" rel="next"
                        [attr.aria-label]="'legalAi.pageNext' | translate"><i class="pi pi-angle-right rtl:rotate-180" aria-hidden="true"></i></a>
                    } @else {
                    <span class="pager-btn opacity-40" aria-disabled="true"><i class="pi pi-angle-right rtl:rotate-180" aria-hidden="true"></i></span>
                    }
                </li>
            </ul>
        </nav>
        }
    `,
    styles: `
        .pager-btn {
            display: inline-grid;
            place-items: center;
            min-width: 2.25rem;
            height: 2.25rem;
            padding: 0 0.5rem;
            border: 1px solid transparent;
            border-radius: 0.5rem;
            font-size: 0.8125rem;
            font-weight: 550;
            color: var(--color-gray-600);
            text-decoration: none;
        }
        a.pager-btn:hover {
            background: var(--color-gray-100);
            color: var(--color-gray-900);
        }
        .pager-active {
            background: var(--p-primary-50);
            border-color: var(--p-primary-200);
            color: var(--p-primary-700);
        }
    `,
})
export class LegalAiPager {
    readonly page = input.required<number>();
    readonly pages = input.required<number>();
    readonly from = input.required<number>();
    readonly to = input.required<number>();
    readonly total = input.required<number>();

    /** First, last, and a window around the current page, with ellipses for the gaps. */
    readonly entries = computed<Entry[]>(() => {
        const total = this.pages();
        const cur = this.page();
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const out: Entry[] = [1];
        const start = Math.max(2, cur - 1);
        const end = Math.min(total - 1, cur + 1);
        if (start > 2) out.push('gap-start');
        for (let i = start; i <= end; i++) out.push(i);
        if (end < total - 1) out.push('gap-end');
        out.push(total);
        return out;
    });
}
