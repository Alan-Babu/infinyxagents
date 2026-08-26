import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface Slide {
    titleKey?: string;
    subtitleKey?: string;
    /** Solid icon class (PrimeIcons) for placeholder visual. */
    icon?: string;
}

@Component({
    selector: 'lib-image-slider',
    templateUrl: './image-slider.html',
    styles: [':host {display:flex;width:100%;align-items:center;position:relative;height:100%;}'],
    imports: [CommonModule, TranslateModule]
})
export class ImageSlider implements OnInit, OnDestroy {
    @Input() slides: Slide[] = [];
    @Input() intervalMs = 5000;

    readonly index = signal(0);
    private timer?: ReturnType<typeof setInterval>;

    ngOnInit(): void {
        if (this.slides.length > 1) {
            this.timer = setInterval(() => this.next(), this.intervalMs);
        }
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    next(): void {
        this.index.update(i => (i + 1) % this.slides.length);
    }

    go(i: number): void {
        this.index.set(i);
    }
}
