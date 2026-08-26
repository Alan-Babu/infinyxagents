import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APP_CONFIG, COMMON_PROVIDERS } from '@nfinyx/services';
import { provideToastr } from 'ngx-toastr';
import { providePrimeNG } from 'primeng/config';
import { MofaTheme } from '@nfinyx/shared-assets';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(appRoutes, withHashLocation()),
        provideToastr(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: MofaTheme,
                options: {
                    darkModeSelector: false,
                    cssLayer: {
                        name: 'primeng',
                        order: 'theme, base, primeng',
                    },
                },
            },
        }),
        { provide: APP_CONFIG, useValue: environment },
        COMMON_PROVIDERS,
    ]
};
