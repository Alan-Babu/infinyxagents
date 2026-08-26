export * from "./app-theme";
import * as authEnJson from "./i18n/en.json";
import * as authArJson from "./i18n/ar.json";

/** Shared login/auth-shell translations (page/form/buttons/alerts/auth.slides), reused by any app that mounts `AuthLayout`. */
export const authEnI18n = authEnJson;
export const authArI18n = authArJson;
