import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDate, formatNumber } from '../utils/format';

/**
 * Thin helper over ngx-translate for the legal-ai namespace (`legalAi.*`) plus the locale-aware
 * date/number formatting the module needs. Templates use the `translate` pipe for static text
 * and this service for anything parameterised or formatted.
 */
@Injectable({ providedIn: 'root' })
export class LegalAiI18n {
    private readonly translate = inject(TranslateService);

    get lang(): 'en' | 'ar' {
        return (this.translate.getCurrentLang() || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
    }

    /** Translate `legalAi.<key>` with optional `{{param}}` interpolation. */
    t(key: string, params?: Record<string, unknown>): string {
        return this.translate.instant(`legalAi.${key}`, params);
    }

    /** Label for a finding/document status; falls back to the raw value for unknown statuses. */
    status(value: string | null | undefined): string {
        return this.labelOrRaw('st_', value);
    }

    severity(value: string | null | undefined): string {
        return this.labelOrRaw('sev_', value);
    }

    date(value: string | null | undefined, withTime = false): string {
        return formatDate(value, this.lang, withTime);
    }

    num(value: number): string {
        return formatNumber(value, this.lang);
    }

    private labelOrRaw(prefix: string, value: string | null | undefined): string {
        if (!value) return '';
        const key = `legalAi.${prefix}${value}`;
        const label = this.translate.instant(key);
        return label === key ? value : label;
    }
}
