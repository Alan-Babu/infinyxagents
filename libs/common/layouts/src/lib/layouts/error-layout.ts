import { CommonModule } from "@angular/common";
import { Component, inject, Inject, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AvatarModule } from "primeng/avatar";
import { DrawerModule } from "primeng/drawer";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { PopoverModule } from "primeng/popover";

import { APP_CONFIG, CommonService } from "@nfinyx/services";
import { AppConfig } from "@nfinyx/types";

@Component({
    selector: "lib-error-layout",
    templateUrl: "./error-layout.html",
    styles: "",
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
        PopoverModule,
        AvatarModule,
        DrawerModule,
    ],
    providers: [
        CommonService,
        DialogService,
        DynamicDialogRef,
    ],
})
export class ErrorLayout implements OnInit {
    thisYear: number = new Date().getFullYear();
    version: string = "";
    common = inject(CommonService);

    constructor(
        @Inject(APP_CONFIG) private config: AppConfig,
        private translate: TranslateService,
        private router: Router,
    ) {
        this.common.hideLoading();
    }

    ngOnInit(): void {
        this.version = this.config?.appdetails?.version ?? "";
    }

    goToTermsPage() {
        this.router.navigate(["/terms-and-conditions"]);
    }
}
