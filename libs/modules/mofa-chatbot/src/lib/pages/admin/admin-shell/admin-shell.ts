import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface AdminTabLink {
    labelKey: string;
    path: string;
    icon: string;
    exact: boolean;
}

const ADMIN_TABS: AdminTabLink[] = [
    { labelKey: 'mofaChatbot.admin.nav.overview', path: '/mofa-chatbot/admin', icon: 'pi pi-chart-bar', exact: true },
    { labelKey: 'mofaChatbot.admin.nav.crawl', path: '/mofa-chatbot/admin/crawl', icon: 'pi pi-clock', exact: false },
    { labelKey: 'mofaChatbot.admin.nav.kb', path: '/mofa-chatbot/admin/kb', icon: 'pi pi-book', exact: false },
    { labelKey: 'mofaChatbot.admin.nav.blacklist', path: '/mofa-chatbot/admin/blacklist', icon: 'pi pi-ban', exact: false },
    { labelKey: 'mofaChatbot.admin.nav.riskSessions', path: '/mofa-chatbot/admin/risk-sessions', icon: 'pi pi-exclamation-triangle', exact: false },
    { labelKey: 'mofaChatbot.admin.nav.feedback', path: '/mofa-chatbot/admin/feedback', icon: 'pi pi-star', exact: false },
];

/** Secondary-nav shell for the 6 admin backoffice sub-pages, driving real routed navigation (not `@if` state). */
@Component({
    selector: 'lib-admin-shell',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, TranslateModule],
    templateUrl: './admin-shell.html',
    host: { class: 'flex overflow-hidden flex-1 min-h-full bg-gray-50' },
})
export class AdminShellPage {
    readonly tabs = ADMIN_TABS;
}
