import { DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { authArI18n, authEnI18n } from '@nfinyx/shared-assets';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthInterceptor } from './lib/interceptors/auth.interceptor';
import { mergeModuleTranslations } from './lib/module-i18n-resolver';

/**
 * Merges the shared auth-shell translations (login form, auth.slides, alerts) before the
 * first route/component renders — `AuthLayout`/`Login` are part of the initial bundle, not
 * a lazy module, so they can't wait for a route `resolve` the way feature modules do.
 */
function initLanguageFactory(translate: TranslateService): () => Promise<void> {
    return () => {
        mergeModuleTranslations(translate, { en: authEnI18n, ar: authArI18n });
        return Promise.resolve();
    };
}

export const COMMON_PROVIDERS: Provider[] = [
    DatePipe,
    MessageService,
    DialogService,
    ConfirmationService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideTranslateService({
        loader: provideTranslateHttpLoader({
            prefix: './i18n/',
            suffix: '.json',
            /** Bypass HTTP_INTERCEPTORS so auth headers / 401 handling never break translation JSON loads. */
            useHttpBackend: true,
        }),
        fallbackLang: 'en',
        lang: 'en',
        /**
         * Without this, TranslateService's own HTTP-loaded translations REPLACE
         * (not merge into) the whole language object. If the core i18n fetch
         * resolves after a module's own `setTranslation(..., true)` resolver has
         * already merged its namespace in — a real race on a hard refresh straight
         * into a module route with hash-location routing — the module's keys get
         * silently wiped out. `extend: true` makes every `setTranslations` call
         * (loader-driven or manual) merge regardless of call order.
         */
        extend: true,
    }),
    {
        provide: APP_INITIALIZER,
        multi: true,
        useFactory: initLanguageFactory,
        deps: [TranslateService],
    },
];