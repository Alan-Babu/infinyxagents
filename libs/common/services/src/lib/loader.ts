import { Inject, Injectable } from '@angular/core';
import { AppConfig } from '@nfinyx/types';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { APP_CONFIG } from './app-config';

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    template: string = '';
    isVisible: boolean = false;
    private _loading = new BehaviorSubject<boolean>(false);
    loading$ = this._loading.asObservable();
    isVisible1: boolean = false;

    constructor(
        private translate: TranslateService,
        @Inject(APP_CONFIG) private config: AppConfig
    ) { }

    show(template?: string) {
        if (template) {
            this.template = `${this.translate.instant(template)}`;
        } else if (this.config.appId === 'customer') {
            this.template = `${this.translate.instant('labels.loadingPleaseWait')}`;
        }
        this.isVisible = true;
    }

    hide() {
        this.isVisible = false;
        this.template = ``;
    }

    // show1(): void {
    //   this._loading.next(true);
    //   this.isVisible1 = true;
    // }

    // hide1(): void {
    //   this._loading.next(false);
    //   this.isVisible1 = false;
    // }

    changeContent(template: string) {
        this.template = this.translate.instant(template);
    }
}
