export type AppPosition = 'right' | 'left';

export type AppComponentsPosition = {
    navPosition: AppPosition;
    drawerPosition: AppPosition;
    datatableStart: AppPosition;
    datatableEnd: AppPosition;
    isRTL: boolean
}

export type SidebarOutput = {
    data: any;
};