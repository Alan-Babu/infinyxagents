export interface MenuModel {
    id: number;
    activatedRoute: boolean;
    externalurl?: boolean;
    icon: string;
    link?: string;
    menu: string;
    menufull?: string;
    active?: boolean;
    hide?: boolean;
    expanded?: boolean;
    name: string;
    recordcount?: number;
    queryParam?: Record<string, any>;
    subMenus?: MenuModel[];
    tooltips?: { permission: number; permissionText: string; }[]
}
