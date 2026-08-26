import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnDestroy, Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@nfinyx/services';
import { AppConfig, MenuModel } from '@nfinyx/types';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';

type GroupedMenu = MenuModel & { group?: 'base' | 'embassy' | 'customer' };

@Component({
    selector: 'lib-main-menu',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, TooltipModule],
    templateUrl: './main-menu.html',
})
export class MainMenu implements OnDestroy {
    private allMenus: GroupedMenu[] = [];
    private readonly activeMenuHintKey: string;

    private _menuList: GroupedMenu[] = [];
    @Input()
    set menuList(value: MenuModel[] | null | undefined) {
        this._menuList = value ?? [];
        this.allMenus = this._menuList;
    }
    get menuList(): GroupedMenu[] {
        return this._menuList;
    }
    customerMenus: GroupedMenu[] = [];

    selectedCompanyName = '';
    /** Bound to the sticky sidebar search input (client-side filter only). */
    menuSearchText = '';
    @Input() openExternalInNewWindow = true;
    /** i18n key for search placeholder (default works for embassy / datatable). */
    @Input() menuSearchPlaceholderKey = 'labels.searchPlaceholder';
    /** Icon-only rail mode: labels/search/submenus hidden, only top-level icons shown. */
    @Input() collapsed = false;
    @Output() panelClick = new EventEmitter<{ menu: MenuModel; parent?: MenuModel }>();
    @Output() toggleCollapse = new EventEmitter<void>();

    private menuSub?: Subscription;
    private routerSub?: Subscription;
    private companySub?: Subscription;
    private langSub?: Subscription;
    /** Menu rebinds when counts arrive; notify once per menu mount to avoid a fetch loop. */

    constructor(
        private router: Router,
        private translate: TranslateService,
        private cdr: ChangeDetectorRef,
        @Inject(APP_CONFIG) private readonly appConfig: AppConfig
    ) {
        const appId = String(this.appConfig?.appId ?? 'app').trim() || 'app';
        this.activeMenuHintKey = `${appId}:main_menu_active_hint`;
    }

    ngOnDestroy(): void {
        this.menuSub?.unsubscribe();
        this.routerSub?.unsubscribe();
        this.companySub?.unsubscribe();
        this.langSub?.unsubscribe();
    }

    private serializeMenuStructure(menus: MenuModel[] | undefined): string {
        return JSON.stringify(
            (menus || []).map((menu) => ({
                key: this.menuStateKey(menu),
                subMenus: this.serializeMenuStructure(menu.subMenus),
            }))
        );
    }

    private menuStateKey(menu: MenuModel): string {
        return `${menu.name || ''}|${menu.link || ''}|${menu.id}`;
    }

    /** Rail (collapsed) icon click: expand first so items with submenus become visible, then apply normal click behavior. */
    onRailItemClick(menu: MenuModel) {
        if (menu.subMenus?.length) {
            this.toggleCollapse.emit();
        }
        this.onPanelClick({ menu });
    }

    onPanelClick(event: { menu: MenuModel; parent?: MenuModel }) {
        const { menu, parent } = event;

        if (menu.externalurl && menu.link) {
            if (this.openExternalInNewWindow) window.open(menu.link, 'New Window');
            else window.open(menu.link, '_blank');
            this.panelClick.emit(event);
            return;
        }

        this.clearActive(this.allMenus);
        menu.active = true;
        if (parent) (parent).expanded = true;

        if (menu.link) {
            this.router.navigateByUrl(this.toAbsoluteMenuLink(menu.link));
        }

        this.panelClick.emit(event);
    }

    resolveIconPath(icon?: string): string {
        const normalized = `${icon ?? ''}`.trim();
        if (!normalized) {
            return '';
        }

        if (normalized === 'play_arrow') {
            return 'M96 72v112l88-56Z';
        }

        return normalized;
    }

    private clearActive(nodes: MenuModel[]) {
        for (const n of nodes || []) {
            n.active = false;
            if (n.subMenus?.length) this.clearActive(n.subMenus);
        }
    }

    private normalizeUrl(s: string) {
        let path = (s || '').split('?')[0];
        const hashIdx = path.indexOf('#');
        if (hashIdx >= 0) {
            path = path.slice(hashIdx + 1);
        }
        return path.replace(/^\/+/, '').replace(/\/+$/, '');
    }

    /** Menu links without a leading `/` are relative to the current route and can 404 (e.g. pending → completed). */
    private toAbsoluteMenuLink(link: string): string {
        const trimmed = `${link ?? ''}`.trim();
        if (!trimmed) {
            return trimmed;
        }
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
            return trimmed;
        }
        return `/${trimmed}`;
    }
}
