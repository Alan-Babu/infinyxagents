import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { TabsModule } from 'primeng/tabs';
import { AssetMasterPage } from './asset-master/asset-master';
import { OrgStructurePage } from './org-structure/org-structure';
import { UsersRolesPage } from './users-roles/users-roles';

@Component({
    selector: 'lib-settings',
    standalone: true,
    imports: [CommonModule, TranslateModule, PageHeaderComponent, TabsModule, OrgStructurePage, UsersRolesPage, AssetMasterPage],
    templateUrl: './settings.html',
})
export class SettingsPage {
    activeTab: string | number = 'org';

    onTabChange(value: string | number | undefined): void {
        if (value !== undefined) this.activeTab = value;
    }
}
