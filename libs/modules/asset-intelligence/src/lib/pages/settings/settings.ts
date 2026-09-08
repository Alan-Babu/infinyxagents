import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { AssetMasterPage } from './asset-master/asset-master';
import { OrgStructurePage } from './org-structure/org-structure';
import { UsersRolesPage } from './users-roles/users-roles';

type SettingsTab = 'org' | 'users' | 'master';

interface SettingsTabDef {
    id: SettingsTab;
    labelKey: string;
}

const TABS: SettingsTabDef[] = [
    { id: 'org', labelKey: 'assetIntelligence.settings.tabs.org' },
    { id: 'users', labelKey: 'assetIntelligence.settings.tabs.users' },
    { id: 'master', labelKey: 'assetIntelligence.settings.tabs.master' },
];

@Component({
    selector: 'lib-settings',
    standalone: true,
    imports: [CommonModule, TranslateModule, PageHeaderComponent, OrgStructurePage, UsersRolesPage, AssetMasterPage],
    templateUrl: './settings.html',
})
export class SettingsPage {
    readonly tabs = TABS;
    activeTab: SettingsTab = 'org';

    switchTab(id: SettingsTab): void {
        this.activeTab = id;
    }
}
