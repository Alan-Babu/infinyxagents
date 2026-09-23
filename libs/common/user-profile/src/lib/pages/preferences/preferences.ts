import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { CommonService, ThemeOption, ThemeOptions } from '@nfinyx/services';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface ThemeSwatch {
    value: ThemeOption | '';
    labelKey: string;
    swatchClass: string;
}

interface LanguageOption {
    value: string;
    /** Language's own endonym, e.g. 'العربية' for Arabic — not translated, it names the language itself. */
    name: string;
    /** English exonym shown as the secondary line, e.g. 'Arabic'. */
    native: string;
}

@Component({
    selector: 'lib-preferences-page',
    standalone: true,
    imports: [CommonModule, TranslateModule, PageHeaderComponent],
    templateUrl: './preferences.html',
})
export class PreferencesPage implements OnDestroy {
    private readonly common = inject(CommonService);
    private readonly translate = inject(TranslateService);

    readonly languageOptions: LanguageOption[] = [
        { value: 'en', name: 'English', native: 'English' },
        { value: 'ar', name: 'العربية', native: 'Arabic' },
    ];

    readonly themeSwatches: ThemeSwatch[] = [
        { value: '', labelKey: 'userProfile.preferences.themeNames.default', swatchClass: 'bg-white' },
        ...ThemeOptions.map(option => ({
            value: option,
            labelKey: `userProfile.preferences.themeNames.${option}`,
            swatchClass: `theme-swatch-${option}`,
        })),
    ];

    currentLanguage = this.common.getLanguage();
    currentTheme = this.common.getThemes();

    private readonly langChangeSub: Subscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        this.currentLanguage = event.lang;
    });

    setLanguage(lang: string): void {
        this.common.switchLanguage(lang);
    }

    setTheme(theme: ThemeOption | ''): void {
        this.currentTheme = theme;
        this.common.setThemes(theme);
    }

    ngOnDestroy(): void {
        this.langChangeSub.unsubscribe();
    }
}
