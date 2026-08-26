import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TranslateService, TranslationObject } from '@ngx-translate/core';

/** Per-language JSON blobs for one module's own translation namespace, e.g. `{ en: enJson, ar: arJson }`. */
export type ModuleTranslations = Record<string, TranslationObject>;

/**
 * Merges a set of per-language translation JSON blobs into the shared `TranslateService`
 * (deep-merge, so it never clobbers what's already loaded). Shared by both the lazy
 * route-resolver path (`createModuleI18nResolver`) and anything that needs its
 * translations available immediately at bootstrap (e.g. an `APP_INITIALIZER`).
 */
export function mergeModuleTranslations(translate: TranslateService, translations: ModuleTranslations): void {
    for (const [lang, json] of Object.entries(translations)) {
        /** `import * as x from './x.json'` carries a bundler-added `default` wrapper alongside the named keys — unwrap it so it doesn't get merged in as a stray branch. */
        const payload = ((json as Record<string, unknown>)['default'] as TranslationObject) ?? json;
        translate.setTranslation(lang, payload, true);
    }
}

/**
 * Builds a route `resolve` fn that merges a module's own translation JSON into the
 * shared `TranslateService` the first time that module's route activates — so each
 * module can own `i18n/en.json` / `i18n/ar.json` next to its routes instead of every
 * translation living in one central app-level file.
 */
export function createModuleI18nResolver(translations: ModuleTranslations): ResolveFn<true> {
    let registered = false;
    return () => {
        if (!registered) {
            mergeModuleTranslations(inject(TranslateService), translations);
            registered = true;
        }
        return true;
    };
}
