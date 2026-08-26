import { Component, inject } from '@angular/core';
import { LoaderService } from '@nfinyx/services';

@Component({
    selector: 'lib-loader',
    imports: [],
    templateUrl: './loader.html',
    styles: ``
})
export class Loader {
    loader = inject(LoaderService)
}
