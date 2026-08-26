import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    inject,
    Inject,
    OnDestroy,
    OnInit,
    Optional,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    NavigationEnd,
    Router,
    RouterModule,
} from '@angular/router';
import { formatAppDisplayVersion } from '../format-app-display-version';
import {
    APP_CONFIG, AuthService,
    CommonService
} from '@nfinyx/services';
import {
    APP_FOOTER_INFO,
    AppConfig,
    AppFooterInfo,
    AppPosition,
} from '@nfinyx/types';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { Subscription, filter } from 'rxjs';
import { PopoverModule } from 'primeng/popover';
import { AGENT_TILES, AgentTile } from '@nfinyx/agents-landing';
import { ThemeOption, ThemeOptions } from '@nfinyx/services';

@Component({
    selector: 'lib-shared-layout',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TranslateModule,
        ConfirmDialogModule,
        PopoverModule,
    ],
    templateUrl: './shared-layout.html',
    providers: [CommonService, DialogService],
})
export class SharedLayout implements OnInit, OnDestroy {
    common = inject(CommonService);
    authService = inject(AuthService);

    mainNavPosition: AppPosition = 'left';
    sidebarposition: AppPosition = 'right';
    userloggedin = false;
    bigScreen = false;
    /** True once navigated away from the agents-landing dashboard, to show the header's "back to agents" pill. */
    showBackToAgents = false;
    currentAgent: AgentTile | undefined;
    readonly languageOptions = [
        { value: 'en', label: 'EN' },
        { value: 'ar', label: 'AR' },
    ];
    readonly themeOptions = ThemeOptions;
    currentLanguage = 'en';
    currentTheme = '';
    private navEndSub?: Subscription;
    public thisYear: number = new Date().getFullYear();
    public version: string = '';

    get userdetails() {
        const user = this.authService.user();
        return {
            username: user?.displayName || user?.email || '',
            profilePhoto: './assets/img/avatar.png',
            rolename: user?.role || '',
        };
    }

    constructor(
        public router: Router,
        public translate: TranslateService,
        public dialogService: DialogService,
        public cd: ChangeDetectorRef,
        private http: HttpClient,
        @Inject(APP_CONFIG) private config: AppConfig,
        @Optional() @Inject(APP_FOOTER_INFO) footerInfo?: AppFooterInfo
    ) {
        this.version = formatAppDisplayVersion(footerInfo?.version);

        this.common.appComponentPositions$.subscribe(value => {
            this.mainNavPosition = value.navPosition;
            this.sidebarposition = value.drawerPosition;
        });

        this.translate.onLangChange.subscribe(
            (event: LangChangeEvent) => {
                this.mainNavPosition = event.lang == "ar" ? "right" : "left";
                this.common.updateSidebarPosition(event.lang);
                this.currentLanguage = event.lang;
            }
        );

        this.currentLanguage = this.common.getLanguage();
        this.currentTheme = this.common.getThemes();
    }

    setLanguage(lang: string): void {
        this.common.switchLanguage(lang);
    }

    setTheme(theme: ThemeOption | ''): void {
        this.currentTheme = theme;
        this.common.setThemes(theme);
    }

    async ngOnInit(): Promise<void> {
        this.navEndSub = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e) => this.updateShowBackToAgents(e.urlAfterRedirects || e.url));
        this.updateShowBackToAgents(this.router.url);
    }

    ngOnDestroy(): void {
        this.navEndSub?.unsubscribe();
    }

    private updateShowBackToAgents(url: string): void {
        const normalized = (url || '').split('?')[0].split('#')[0];
        this.showBackToAgents = normalized !== '/' && normalized !== '/dashboard';
        const rootSegment = normalized.split('/').filter(Boolean)[0];
        this.currentAgent = AGENT_TILES.find(tile => tile.id === rootSegment);
    }

    checkPositionLang() {
        const lang = this.translate.currentLang || 'en';
        this.mainNavPosition = lang === 'ar' ? 'right' : 'left';
    }

    logout() {
        this.authService.logout();
        this.router.navigateByUrl(`/${this.authService.loginsessionkey}`);
    }
}
