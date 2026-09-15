import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProfileSidebar } from '../profile-sidebar/profile-sidebar';

@Component({
    selector: 'lib-profile-shell',
    standalone: true,
    imports: [CommonModule, RouterModule, ProfileSidebar],
    templateUrl: './profile-shell.html',
    host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
})
export class ProfileShell {}
