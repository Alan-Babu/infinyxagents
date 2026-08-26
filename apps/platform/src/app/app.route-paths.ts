/**
 * Centralised route paths. Kebab-case. Hash-routing in use.
 */
export const ROUTE_PATHS = {
    LOGIN: 'login',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
    DASHBOARD: 'dashboard',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export const APP_ROUTES = {
    login: `/${ROUTE_PATHS.LOGIN}`,
    forgotPassword: `/${ROUTE_PATHS.FORGOT_PASSWORD}`,
    resetPassword: `/${ROUTE_PATHS.RESET_PASSWORD}`,
    dashboard: `/${ROUTE_PATHS.DASHBOARD}`,
} as const;
