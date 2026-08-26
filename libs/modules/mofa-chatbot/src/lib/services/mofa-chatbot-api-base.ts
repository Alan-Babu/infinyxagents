import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, ApiService } from '@nfinyx/services';

/** Shared base for every mofa-chatbot API service — sets the module's base URL once. */
@Injectable()
export abstract class MofaChatbotApiBase extends ApiService {
    constructor() {
        super(inject(APP_CONFIG));
        this.baseURL = this.resolveBaseUrl('mofa-chatbot/api');
    }
}
