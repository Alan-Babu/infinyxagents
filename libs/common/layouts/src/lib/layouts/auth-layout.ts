import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { ImageSlider, Slide } from '../image-slider/image-slider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'lib-auth-layout',
    imports: [CommonModule, RouterModule, TranslateModule, ImageSlider, ConfirmDialogModule],
    templateUrl: './auth-layout.html',
    styles: '',
})
export class AuthLayout {
    readonly thisYear = new Date().getFullYear();

    readonly slides: Slide[] = [
        {
            icon: 'pi pi-shield',
            titleKey: 'auth.slides.security.title',
            subtitleKey: 'auth.slides.security.subtitle',
        },
        {
            icon: 'pi pi-chart-line',
            titleKey: 'auth.slides.insights.title',
            subtitleKey: 'auth.slides.insights.subtitle',
        },
        {
            icon: 'pi pi-plug',
            titleKey: 'auth.slides.integrations.title',
            subtitleKey: 'auth.slides.integrations.subtitle',
        },
    ];
}
