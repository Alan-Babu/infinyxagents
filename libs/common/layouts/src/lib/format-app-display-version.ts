/** e.g. `1.0.4` → `v1.0.4` for footer display. */
export function formatAppDisplayVersion(version: string | undefined): string {
    const raw = `${version ?? ""}`.trim();
    if (!raw) return "";
    return raw.startsWith("v") ? raw : `v${raw}`;
}
