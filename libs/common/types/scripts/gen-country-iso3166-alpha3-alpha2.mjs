/**
 * Regenerates ISO3166_ALPHA3_TO_ALPHA2 in libs/common/types (single source with CountryISO).
 * Run from repo root: node libs/common/types/scripts/gen-country-iso3166-alpha3-alpha2.mjs
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(
    __dirname,
    "../src/lib/constants/country-iso3166-alpha3-to-alpha2.ts"
);

const url =
    "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json";

const header = `/**
 * ISO 3166-1 alpha-3 (uppercase) → lowercase alpha-2 for flag filenames and APIs.
 * Kept alongside {@link CountryISO} in \`@nfinyx/types\` so country ISO data is maintained in one library.
 *
 * This file is generated — do not edit by hand.
 * Regenerate: \`node libs/common/types/scripts/gen-country-iso3166-alpha3-alpha2.mjs\`
 */
export const ISO3166_ALPHA3_TO_ALPHA2: Record<string, string> = {
`;

https
    .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => {
            const a = JSON.parse(d);
            const o = {};
            for (const x of a) {
                const a3 = x["alpha-3"];
                const a2 = x["alpha-2"];
                if (a3 && a2) o[String(a3).toUpperCase()] = String(a2).toLowerCase();
            }
            const keys = Object.keys(o).sort();
            const lines = keys.map(
                (k) => `    ${k}: ${JSON.stringify(o[k])},`
            );
            const body =
                header +
                lines.join("\n") +
                "\n};\n";
            fs.writeFileSync(out, body, "utf8");
            console.log("wrote", out, keys.length, "entries");
        });
    })
    .on("error", (e) => {
        console.error(e);
        process.exit(1);
    });
