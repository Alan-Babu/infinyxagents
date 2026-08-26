import { InjectionToken } from '@angular/core';

export type AppFooterInfo = {
    version?: string;
    showTerms?: boolean;
};

export const APP_FOOTER_INFO = new InjectionToken<AppFooterInfo>('APP_FOOTER_INFO');
