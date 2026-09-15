import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@nfinyx/services';
import { PROFILE_NAV_SECTIONS } from '../../models/user-profile-nav.models';

@Component({
    selector: 'lib-profile-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    templateUrl: './profile-sidebar.html',
})
export class ProfileSidebar {
    private readonly authService = inject(AuthService);

    readonly user = this.authService.user;
    readonly navSections = PROFILE_NAV_SECTIONS;
}
