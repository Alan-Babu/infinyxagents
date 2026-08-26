import { DatePipe } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api';
import { StorageService } from '../local-storage';
import {
    ApiIdRecord,
    AppComponentsPosition,
    AppConfig,
    AppPosition,
    LocalStorage
} from '@nfinyx/types';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { BehaviorSubject } from 'rxjs';
import { APP_CONFIG } from '../app-config';
import { LoaderService } from '../loader';

/**
 * Runtime color-override options layered on top of each app's fixed brand
 * preset (`AppTheme`/`MofaTheme`) — see `.theme-*` classes in
 * `libs/common/shared-assets/src/styles.css`.
 */
export const ThemeOptions = ['red', 'green', 'grey', 'pink'] as const;
export type ThemeOption = (typeof ThemeOptions)[number];

@Injectable({
    providedIn: 'root',
})
export class CommonService {
    ext = '';
    private mycopyrightyear: string = '';
    private userinfo = new BehaviorSubject<string>('');
    private freeZone = new BehaviorSubject<string>('');
    private themeSetting = new BehaviorSubject<any>('');
    private languageSetting = new BehaviorSubject<any>('');

    appLanguage: string = "en";
    private appComponentPositionsSource = new BehaviorSubject<AppComponentsPosition>({
        drawerPosition: "right",
        navPosition: "left",
        datatableStart: "left",
        datatableEnd: "right",
        isRTL: false
    });

    appComponentPositions$ = this.appComponentPositionsSource.asObservable();

    public languageList: any[] = [];

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected translate: TranslateService,
        protected Toastr: ToastrService,
        protected datePipe: DatePipe,
        protected apiservice: ApiService,
        protected sanitizer: DomSanitizer,
        protected loadingService: LoaderService,
        protected localStorageService: StorageService,
        protected confirmationService: ConfirmationService,
        protected config: PrimeNG,
        @Inject(APP_CONFIG) protected appConfig: AppConfig,
    ) {
        const theme: string = this.getThemes();
        this.setThemes(theme);

        const persistedLang = this.getLanguage();
        let language = this.translate.getCurrentLang();
        if (persistedLang && persistedLang !== language) {
            this.switchLanguage(persistedLang);
            language = persistedLang;
        }
        this.updateSidebarPosition(language);

    }

    normalizeApiId(record: ApiIdRecord): string {
        if (!record) return '';
        const candidates = [record.id, record._id, record.roleId, record.Id, record.RoleId];
        for (const raw of candidates) {
            if (raw == null) continue;
            const id = String(raw).trim();
            if (id) return id;
        }
        return '';
    }

    updateSidebarPosition(lang: string) {

        if (this.appLanguage == lang) return;

        let appStart: AppPosition = 'left';
        let appEnd: AppPosition = 'right';

        this.appLanguage = lang;

        if (lang === 'ar') {
            appStart = "right";
            appEnd = "left";
        }

        // setTimeout(() => {
        this.appComponentPositionsSource.next({
            navPosition: appStart,
            drawerPosition: appEnd,
            datatableStart: appStart,
            datatableEnd: appEnd,
            isRTL: lang === 'ar'
        });
        // });
    }

    /**
     * Switches the active language, persists it (localStorage, so it survives reload and
     * is shared across tabs), and sets `document.documentElement`'s `lang`/`dir`. RTL layout
     * flip (sidebar/drawer position) happens reactively via `SharedLayout`'s own
     * `translate.onLangChange` subscription — this method doesn't duplicate that.
     */
    switchLanguage(lang: string): void {
        this.localStorageService.setItem(LocalStorage.Language, lang, false, undefined, false);
        this.translate.use(lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    getLanguage(): string {
        const stored = this.localStorageService.getItem(LocalStorage.Language, false);
        return typeof stored === 'string' && stored.trim() !== '' ? stored : this.translate.getCurrentLang() || 'en';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    GetHTTPHeaders(tokenKey: string, contentType: string = 'application/json'): {
        headers: HttpHeaders;
    } {
        return {
            headers: new HttpHeaders({
                "Content-Type": contentType,
                Authorization: "Bearer " + `${this.localStorageService.getItem(tokenKey)}`,
            }),
        };
    }

    //toaster message alerts
    clearMessage() {
        this.Toastr.clear();
    }

    showWarningMessage(data: any, clearexisttoaster = true) {
        if (clearexisttoaster) {
            this.Toastr.clear();
        }
        //
        if (data != undefined) {
            var status = this.translate.instant(data);
            this.Toastr.warning(data);
        }
    }

    showErrorMessage(data: any, clearexisttoaster = true) {
        if (clearexisttoaster) {
            this.Toastr.clear();
        }
        //
        if (data != undefined) {
            data = this.normalizeErrorMessage(data);
            const status = this.translate.instant(data);
            this.Toastr.error(status);
        }
    }

    showSuccessMessage(data: any) {
        this.Toastr.clear();
        if (data != undefined) {
            const status = this.translate.instant(data);
            this.Toastr.success(status);
        }
    }

    showMessage(data: any, title = '') {
        this.Toastr.clear();
        if (data != undefined) {
            const status = this.translate.instant(data);
            this.Toastr.info(status, title, { timeOut: 5000 });
        }
    }

    getApiErrorMessage(error: any, fallbackMessage?: string): string {
        return this.normalizeErrorMessage(
            error?.error?.responseMessage ||
            error?.error?.data ||
            error?.error?.message ||
            error?.message ||
            fallbackMessage ||
            this.translate.instant('toasterlabels.somethingwentwrong')
        );
    }

    showApiError(error: any, fallbackMessage?: string): void {
        this.showErrorMessage(this.getApiErrorMessage(error, fallbackMessage));
    }

    private normalizeErrorMessage(message: any): any {
        if (typeof message !== 'string') {
            return message;
        }

        const trimmedMessage = message.trim().replace(/^ERROR DURING PROCESSING:\s*/i, '');
        const oracleMatch = trimmedMessage.match(/^ORA-\d+:\s*(.*)$/i);

        return oracleMatch?.[1]?.trim() || trimmedMessage;
    }

    convertISOToCustomFormat(isoDate: any) {
        const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];

        const date = new Date(isoDate);
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        const customFormattedDate = `${day}-${month}-${year}`;
        return customFormattedDate;
    }

    showLoading(text?: string): void {
        this.loadingService.show(text);
    }

    hideLoading(): void {
        this.loadingService.hide();
    }

    formatDateTime(isoDateString: any) {
        const date = new Date(isoDateString);

        // Format the date as "28-Aug-2024"
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        // Format the time as "12:07 PM"
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = ((hours + 11) % 12) + 1; // Convert to 12-hour format
        const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

        return `${formattedDate}, ${formattedTime}`;
    }

    isValidEmail(email: string): boolean {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    openExternalUrl(
        url: string,
        newWindow: boolean = true,
        heightwidth: { height: number; width: number } = {
            height: screen.availHeight,
            width: screen.availWidth,
        }
    ) {
        if (newWindow) {
            window.open(
                url,
                'New Window',
                `width=${heightwidth.width},height=${heightwidth.height}`
            );
        } else {
            window.open(url, '_blank');
        }
    }

    /**
     * Persists theme to **localStorage** so duplicate tabs share the same appearance (sessionStorage is per-tab),
     * and applies/removes the `theme-*` class on `<html>` so PrimeNG's `--p-primary-*` scale (and every
     * `bg-primary-*`/`text-primary-*` Tailwind utility bridged from it) repaints immediately.
     * Pass `''` to clear back to the app's own fixed brand preset (`AppTheme`/`MofaTheme`).
     */
    setThemes(theme: string) {
        this.localStorageService.setItem(LocalStorage.Theme, theme, false, undefined, false);
        this.themeSetting.next(theme);
        this.applyThemeClass(theme);
    }

    private applyThemeClass(theme: string): void {
        const root = document.documentElement;
        ThemeOptions.forEach((option) => root.classList.remove(`theme-${option}`));
        if (theme) {
            root.classList.add(`theme-${theme}`);
        }
    }

    getThemes(): string {
        const fromLocal = this.localStorageService.getItem(LocalStorage.Theme, false);
        if (typeof fromLocal === "string" && String(fromLocal).trim() !== "") {
            return fromLocal;
        }
        const legacySession = this.localStorageService.getItem(LocalStorage.Theme, true);
        if (typeof legacySession === "string" && String(legacySession).trim() !== "") {
            this.localStorageService.setItem(
                LocalStorage.Theme,
                legacySession,
                false,
                undefined,
                false
            );
            return legacySession;
        }
        return "";
    }

    getBrowserName(userAgent: string = navigator.userAgent): string {
        const ua = `${userAgent ?? ''}`;

        if (/Edg\//i.test(ua)) return 'Edge';
        if (/OPR\//i.test(ua)) return 'Opera';
        if (/Firefox\//i.test(ua)) return 'Firefox';
        if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) return 'Chrome';
        if (/Safari\//i.test(ua)) return 'Safari';
        if (/MSIE\s|Trident\//i.test(ua)) return 'IE';

        return 'Unknown';
    }

    getFormattedDate(date: any): string {
        if (!date) {
            return '';
        }

        const formattedDate = this.datePipe.transform(date, 'dd-MMM-yyyy');
        return formattedDate ? formattedDate : '';
    }

    getCurrentWeekNumber(now = new Date()): number {
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const weekNumber = Math.floor(diff / oneWeek);
        return weekNumber;
    }

    convertToNumber(value: string): number {
        const numericString = value.replace(/[^0-9.]/g, '');
        return parseFloat(numericString);
    }

    /**
     * Detects a `Validators.required` (or composed `Validators.compose([...])`)
     * validator on a control without triggering validation, so a required-field
     * label indicator can't drift out of sync with the control's own validators.
     */
    isControlRequired(controlName: string, form: FormGroup): boolean {
        const control = form.get(controlName);
        if (!control?.validator) {
            return false;
        }
        const validator = control.validator({} as AbstractControl);
        return !!(validator && validator['required']);
    }

    /**
     * Gates a field's `p-invalid`/error-message display on the control being
     * both invalid and having been interacted with (touched or dirty), so
     * validation messages don't show on a freshly opened, untouched form.
     */
    isControlInvalid(controlName: string, form: FormGroup): boolean {
        const control = form.get(controlName);
        if (!control) {
            return false;
        }
        return control.invalid && (control.touched || control.dirty);
    }

    /**
     * Single entry point for confirm prompts — targets the app's default
     * (unkeyed) `<p-confirmDialog>`. Resolves `true` on accept, `false` on
     * reject/dismiss. `mode: 'ok'` hides the reject button for a single
     * acknowledgement prompt.
     */
    showConfirmationDialog(
        messageKey: string,
        headerKey: string,
        warningMessageKey = '',
        isDestructive = false,
        icon = 'pi pi-exclamation-triangle',
        mode: 'ok' | 'yesno' = 'yesno',
    ): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            let settled = false;
            const settle = (result: boolean) => {
                if (settled) return;
                settled = true;
                resolve(result);
            };

            const message = warningMessageKey
                ? `${this.translate.instant(messageKey)}<br/><span class="text-xs text-gray-400">${this.translate.instant(warningMessageKey)}</span>`
                : this.translate.instant(messageKey);

            this.confirmationService.confirm({
                message,
                header: this.translate.instant(headerKey),
                icon,
                rejectVisible: mode !== 'ok',
                acceptButtonProps: {
                    severity: isDestructive ? 'danger' : 'primary',
                },
                rejectButtonProps: {
                    severity: 'secondary',
                    variant: 'text',
                },
                accept: () => settle(true),
                reject: () => settle(false),
            });
        });
    }

}