import { CommonModule, Location } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'lib-page-header',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    templateUrl: './page-header.html',
})
export class PageHeaderComponent {
    private readonly location = inject(Location);

    @Input() titleKey = '';
    @Input() subtitleKey?: string;
    @Input() showBack = true;
    /** Plain text, not a translation key — this is a shared component with no fixed i18n namespace. */
    @Input() backLabel = 'Back';
    @Output() back = new EventEmitter<void>();

    /**
     * Optional override for the title area — pass `<ng-template #titleContent>…</ng-template>`
     * as a child of `<lib-page-header>` to render custom markup (badges, a document name, etc.)
     * instead of the default `titleKey`/`subtitleKey` text. Falls back to the default when absent.
     */
    @ContentChild('titleContent') titleTemplate?: TemplateRef<unknown>;

    goBack(): void {
        this.back.emit();
        this.location.back();
    }
}
