import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';

/** Shared base for every translator-agent API service — sets the module's base URL once. */
@Injectable()
export abstract class TranslatorApiBase extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl('doc-translate/api');
    }
}
