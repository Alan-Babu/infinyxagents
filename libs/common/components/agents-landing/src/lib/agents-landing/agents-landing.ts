import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoData } from '@nfinyx/no-data';
import { AuthService, CommonService, StorageService } from '@nfinyx/services';
import { LocalStorage } from '@nfinyx/types';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

/** Tailwind accent used for the tile's icon square — kept to the existing palette, no new brand colors. */
export type AgentTileAccent = 'primary' | 'sky' | 'violet' | 'amber';

export interface AgentTile {
    id: string;
    icon: string;
    link: string;
    nameKey: string;
    descriptionKey: string;
    /** i18n key for the category group heading this tile is listed under. */
    categoryKey: string;
    accent?: AgentTileAccent;
    badge?: string;
}

interface TileCategory {
    key: string;
    icon: string;
    tiles: AgentTile[];
}

/** Icon shown next to a category's name in the sidebar and section headings — keyed by `categoryKey`. */
const CATEGORY_ICONS: Record<string, string> = {
    'agentsLanding.category.documents': 'pi pi-copy',
    'agentsLanding.category.compliance': 'pi pi-shield',
    'agentsLanding.category.general': 'pi pi-th-large',
};
const DEFAULT_CATEGORY_ICON = 'pi pi-folder';

/** Central registry of agent modules — shared by the dashboard grid and the header's agent switcher. */
export const AGENT_TILES: AgentTile[] = [
    {
        id: 'executive-summary',
        icon: 'pi pi-chart-line',
        link: '/executive-summary',
        nameKey: 'menu.executiveSummary',
        descriptionKey: 'agentsLanding.executiveSummaryDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'sky',
        badge: 'LIVE',
    },
    {
        id: 'doc-compare',
        icon: 'pi pi-file-edit',
        link: '/doc-compare',
        nameKey: 'menu.docCompare',
        descriptionKey: 'agentsLanding.docCompareDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'violet',
        badge: 'LIVE',
    },
    {
        id: 'digital-attestation',
        icon: 'pi pi-shield',
        link: '/digital-attestation',
        nameKey: 'menu.digitalAttestation',
        descriptionKey: 'agentsLanding.digitalAttestationDesc',
        categoryKey: 'agentsLanding.category.compliance',
        accent: 'amber',
        badge: 'LIVE',
    },
    {
        id: 'hr-agent',
        icon: 'pi pi-users',
        link: '/hr-agent',
        nameKey: 'menu.hrAgent',
        descriptionKey: 'agentsLanding.hrAgentDesc',
        categoryKey: 'agentsLanding.category.general',
        accent: 'primary',
        badge: 'LIVE',
    },
    {
        id: 'doc-intel-agent',
        icon: 'pi pi-search-plus',
        link: '/doc-intel-agent',
        nameKey: 'menu.docIntelAgent',
        descriptionKey: 'agentsLanding.docIntelAgentDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'sky',
        badge: 'LIVE',
    },
    {
        id: 'translator-agent',
        icon: 'pi pi-language',
        link: '/translator-agent',
        nameKey: 'menu.translatorAgent',
        descriptionKey: 'agentsLanding.translatorAgentDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'violet',
        badge: 'LIVE',
    },
    {
        id: 'grammar-agent',
        icon: 'pi pi-pencil',
        link: '/grammar-agent',
        nameKey: 'menu.grammarAgent',
        descriptionKey: 'agentsLanding.grammarAgentDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'amber',
        badge: 'LIVE',
    },
    {
        id: 'contract-analyzer',
        icon: 'pi pi-file-check',
        link: '/contract-analyzer',
        nameKey: 'menu.contractAnalyzer',
        descriptionKey: 'agentsLanding.contractAnalyzerDesc',
        categoryKey: 'agentsLanding.category.documents',
        accent: 'sky',
        badge: 'LIVE',
    },
    {
        id: 'mofa-chatbot',
        icon: 'pi pi-comments',
        link: '/mofa-chatbot',
        nameKey: 'menu.mofaChatbot',
        descriptionKey: 'agentsLanding.mofaChatbotDesc',
        categoryKey: 'agentsLanding.category.general',
        accent: 'primary',
        badge: 'LIVE',
    },
    {
        id: 'email-compose-agent',
        icon: 'pi pi-envelope',
        link: '/email-compose-agent',
        nameKey: 'menu.emailComposeAgent',
        descriptionKey: 'agentsLanding.emailComposeAgentDesc',
        categoryKey: 'agentsLanding.category.general',
        accent: 'violet',
        badge: 'LIVE',
    },
];

@Component({
    selector: 'lib-agents-landing',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TranslateModule, InputTextModule, ButtonModule, NoData],
    templateUrl: './agents-landing.html',
    host: { class: 'block flex-1 min-h-0 overflow-auto' },
})
export class AgentsLanding {
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly router = inject(Router);
    private readonly common = inject(CommonService);
    private readonly storage = inject(StorageService);
    private readonly document = inject(DOCUMENT);

    @Input() tiles: AgentTile[] = [];
    @ViewChild('contentScroll') private contentScroll?: ElementRef<HTMLElement>;

    search = '';
    /** `all` = "All agents", `'pinned'` = the Quick Access section, otherwise a `categoryKey` — tracks which nav item was last clicked, purely for highlighting; it no longer filters what's shown. */
    selectedFilter = "all";

    private readonly pinnedIds = signal<string[]>(this.storage.getItem(LocalStorage.PinnedAgents) ?? []);

    get userName(): string {
        return this.auth.user()?.displayName || '';
    }

    /** Distinct categories across all tiles, in first-occurrence order — drives both the sidebar and the filter pills. */
    get allCategories(): TileCategory[] {
        const byKey = new Map<string, AgentTile[]>();
        for (const tile of this.tiles) {
            const list = byKey.get(tile.categoryKey) ?? [];
            list.push(tile);
            byKey.set(tile.categoryKey, list);
        }
        return [...byKey.entries()].map(([key, tiles]) => ({
            key,
            icon: CATEGORY_ICONS[key] ?? DEFAULT_CATEGORY_ICON,
            tiles,
        }));
    }

    get pinnedCount(): number {
        return this.pinnedIds().length;
    }

    isPinned(tile: AgentTile): boolean {
        return this.pinnedIds().includes(tile.id);
    }

    /** Pinned tiles, search-filtered — shown as their own row above the categories. */
    get pinnedTiles(): AgentTile[] {
        const q = this.search.trim().toLowerCase();
        let filtered = this.tiles.filter(t => this.isPinned(t));
        if (q) {
            filtered = filtered.filter(t => this.translate.instant(t.nameKey).toLowerCase().includes(q));
        }
        return filtered;
    }

    togglePin(event: MouseEvent, tile: AgentTile): void {
        event.stopPropagation();
        event.preventDefault();
        const current = this.pinnedIds();
        const next = current.includes(tile.id) ? current.filter(id => id !== tile.id) : [...current, tile.id];
        this.pinnedIds.set(next);
        this.storage.setItem(LocalStorage.PinnedAgents, next);
    }

    /** Jumps to the clicked nav item's section instead of filtering the page down to it — every group stays rendered. */
    selectFilter(key: string): void {
        this.selectedFilter = key;

        if (key === 'all') {
            this.contentScroll?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const id = key === 'pinned' ? 'section-pinned' : `section-${key}`;
        this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    private scrollSpyTicking = false;

    /** Keeps the sidebar/pill highlight in sync while the user scrolls the content pane by hand. */
    onContentScroll(): void {
        if (this.scrollSpyTicking) return;
        this.scrollSpyTicking = true;
        requestAnimationFrame(() => {
            this.updateActiveSectionFromScroll();
            this.scrollSpyTicking = false;
        });
    }

    private updateActiveSectionFromScroll(): void {
        const container = this.contentScroll?.nativeElement;
        if (!container) return;

        const sections = Array.from(container.querySelectorAll<HTMLElement>('[id^="section-"]'));
        const containerTop = container.getBoundingClientRect().top;
        const offset = 32; // treat a section as active once its heading nears the top of the pane

        let active: string | null = null;
        for (const el of sections) {
            if (el.getBoundingClientRect().top - containerTop <= offset) {
                active = el.id;
            }
        }
        this.selectedFilter = active ? active.slice('section-'.length) : 'all';
    }

    get categories(): TileCategory[] {
        const q = this.search.trim().toLowerCase();
        let filtered = this.tiles;

        if (q) {
            filtered = filtered.filter(t => this.translate.instant(t.nameKey).toLowerCase().includes(q));
        }

        const byKey = new Map<string, AgentTile[]>();
        for (const tile of filtered) {
            const list = byKey.get(tile.categoryKey) ?? [];
            list.push(tile);
            byKey.set(tile.categoryKey, list);
        }
        return [...byKey.entries()].map(([key, tiles]) => ({
            key,
            icon: CATEGORY_ICONS[key] ?? DEFAULT_CATEGORY_ICON,
            tiles,
        }));
    }

    /**
     * Lazy-loaded agent modules can take a moment to fetch their chunk, so show
     * a loading indicator for the duration of the navigation — but only when it
     * starts from this landing page, not globally for every route change.
     * Modified clicks (ctrl/cmd/shift/middle-click) are left to the browser's
     * native new-tab handling, same as `RouterLink` does internally.
     */
    onTileClick(event: MouseEvent, tile: AgentTile): void {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
            return;
        }
        event.preventDefault();
        this.common.showLoading();
        this.router.navigateByUrl(tile.link).finally(() => this.common.hideLoading());
    }
}
