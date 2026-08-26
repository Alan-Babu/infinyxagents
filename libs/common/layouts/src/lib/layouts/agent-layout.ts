import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { AGENT_TILES, AgentTile } from '@nfinyx/agents-landing';
import { MainMenu } from '@nfinyx/main-menu';
import { MenuModel } from '@nfinyx/types';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, filter } from 'rxjs';

/**
 * Per-module icon-rail layout, nested one level inside `SharedLayout`'s router-outlet.
 * Reads its nav items from `data['main-nav']` on its own route — same mechanism
 * `SharedLayout` used to use globally, just scoped to a single agent module now.
 */
@Component({
    selector: 'lib-agent-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, TooltipModule, MainMenu],
    templateUrl: './agent-layout.html',
    host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
})
export class AgentLayout implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    collapsed = true;
    menuList: MenuModel[] = [];
    currentAgent: AgentTile | undefined;
    private navEndSub?: Subscription;

    constructor() {
        this.route.data.subscribe((data) => {
            const incoming = (data && data['main-nav']) || [];
            this.menuList = Array.isArray(incoming) ? incoming : [];
            this.updateActiveMenu(this.router.url);
        });
    }

    ngOnInit(): void {
        this.navEndSub = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e) => {
                const url = e.urlAfterRedirects || e.url;
                this.updateCurrentAgent(url);
                this.updateActiveMenu(url);
            });
        this.updateCurrentAgent(this.router.url);
        this.updateActiveMenu(this.router.url);
    }

    ngOnDestroy(): void {
        this.navEndSub?.unsubscribe();
    }

    toggleCollapsed(): void {
        this.collapsed = !this.collapsed;
    }

    updateActiveMenu(currentUrl: string): void {
        if (!Array.isArray(this.menuList) || this.menuList.length === 0) return;
        this.clearMenuState(this.menuList);
        this.setActiveState(this.menuList, currentUrl);
    }

    handleMenuItemClick(menu: MenuModel, parent?: MenuModel): void {
        if (menu.subMenus?.length) {
            this.menuList.forEach((m) => {
                if (m !== menu) m.expanded = false;
            });
            menu.expanded = !menu.expanded;
            return;
        }

        this.clearMenuState(this.menuList);
        menu.active = true;
        if (parent) {
            this.menuList.forEach((m) => (m.expanded = false));
            parent.expanded = true;
        }

        if (menu.link) this.router.navigateByUrl(this.toAbsoluteMenuLink(menu.link));
    }

    private clearMenuState(menus?: MenuModel[]): void {
        if (!menus?.length) return;
        for (const m of menus) {
            m.active = false;
            if (!m.subMenus?.length) m.expanded = false;
            if (m.subMenus?.length) this.clearMenuState(m.subMenus);
        }
    }

    private setActiveState(menus: MenuModel[], currentUrl: string, parent?: MenuModel): void {
        if (!menus?.length) return;
        for (const m of menus) {
            if (m.link && this.normalize(currentUrl) === this.normalize(m.link)) {
                m.active = true;
                if (parent) {
                    this.menuList.forEach((p) => {
                        if (p !== parent) p.expanded = false;
                    });
                    parent.expanded = true;
                }
            }
            if (m.subMenus?.length) this.setActiveState(m.subMenus, currentUrl, m);
        }
    }

    private updateCurrentAgent(url: string): void {
        const rootSegment = this.normalize(url).split('/').filter(Boolean)[0];
        this.currentAgent = AGENT_TILES.find((tile) => tile.id === rootSegment);
    }

    private normalize(url: string): string {
        return (url || '').split('?')[0].split('#')[0];
    }

    private toAbsoluteMenuLink(link: string): string {
        const trimmed = `${link ?? ''}`.trim();
        if (!trimmed) return trimmed;
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
        return `/${trimmed}`;
    }
}
