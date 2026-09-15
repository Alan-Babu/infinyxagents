export interface ProfileNavItem {
    /** Route segment relative to /user-profile, e.g. 'preferences'. */
    path: string;
    /** i18n key for the link label. */
    labelKey: string;
    /** PrimeIcons class, e.g. 'pi pi-history'. */
    icon: string;
}

export interface ProfileNavSection {
    /** i18n key for the section header, e.g. 'userProfile.nav.sections.preferences'. */
    headingKey: string;
    items: ProfileNavItem[];
}

export const PROFILE_NAV_SECTIONS: ProfileNavSection[] = [
    {
        headingKey: 'userProfile.nav.sections.activity',
        items: [{ path: 'activity', labelKey: 'userProfile.nav.myActivity', icon: 'pi pi-history' }],
    },
    {
        headingKey: 'userProfile.nav.sections.preferences',
        items: [{ path: 'preferences', labelKey: 'userProfile.nav.preferences', icon: 'pi pi-cog' }],
    },
];
