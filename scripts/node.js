#!/usr/bin/env node
import { confirm, input, select } from "@inquirer/prompts";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

function getNxApps() {
    try {
        const raw = execSync("npx nx show projects --type=app --json", {
            stdio: ["pipe", "pipe", "ignore"],
        }).toString();
        const projects = JSON.parse(raw);
        return projects.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );
    } catch (err) {
        console.error("Error reading Nx apps:", err.message);
        return [];
    }
}

function getBuildConfigurations(project) {
    try {
        const raw = execSync(`npx nx show project ${project} --json`, {
            stdio: ["pipe", "pipe", "ignore"],
        }).toString();
        const projectInfo = JSON.parse(raw);
        const configurations = projectInfo?.targets?.build?.configurations;
        if (!configurations) return [];
        return Object.keys(configurations).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );
    } catch (err) {
        console.error("Error reading build configurations:", err.message);
        return [];
    }
}

function getProjectInfo(project) {
    try {
        const raw = execSync(`npx nx show project ${project} --json`, {
            stdio: ["pipe", "pipe", "ignore"],
        }).toString();
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error reading project info:", err.message);
        return null;
    }
}

function extractVersionFromEnv(source) {
    const patterns = [
        {
            kind: "appdetails",
            re: /appdetails\s*:\s*\{[\s\S]*?version\s*:\s*["'`]([^"'`]+)["'`]/,
        },
        {
            kind: "top",
            re: /\n\s{4}version\s*:\s*["'`]([^"'`]+)["'`]/,
        },
        {
            kind: "any",
            re: /version\s*:\s*["'`]([^"'`]+)["'`]/,
        },
    ];

    for (const { kind, re } of patterns) {
        const match = source.match(re);
        const value = match?.[1]?.trim();
        if (value) {
            return { value, kind };
        }
    }

    return null;
}

function updateVersionInEnv(source, versionInfo, nextVersion) {
    if (versionInfo.kind === "appdetails") {
        return source.replace(
            /(appdetails\s*:\s*\{[\s\S]*?version\s*:\s*["'`])[^"'`]+(["'`])/,
            `$1${nextVersion}$2`
        );
    }

    if (versionInfo.kind === "top") {
        return source.replace(
            /(\n\s{4}version\s*:\s*["'`])[^"'`]+(["'`])/,
            `$1${nextVersion}$2`
        );
    }

    return source.replace(
        /(version\s*:\s*["'`])[^"'`]+(["'`])/,
        `$1${nextVersion}$2`
    );
}

function parseVersion(version) {
    const match = `${version}`.trim().match(/^([vV])?(\d+)\.(\d+)\.(\d+)([a-zA-Z]*)$/);
    if (!match) {
        return null;
    }

    return {
        prefix: match[1] ?? "",
        major: Number(match[2]),
        minor: Number(match[3]),
        patch: Number(match[4]),
        suffix: match[5] ?? "",
    };
}

function formatVersion({ prefix, major, minor, patch, suffix }) {
    return `${prefix}${major}.${minor}.${patch}${suffix}`;
}

function bumpVersion(current, type) {
    const parsed = parseVersion(current);
    if (!parsed) {
        return "";
    }

    const { prefix, major, minor, patch, suffix } = parsed;

    if (type === "major") {
        return formatVersion({
            prefix,
            major: major + 1,
            minor: 0,
            patch: 0,
            suffix: "",
        });
    }

    if (type === "minor") {
        return formatVersion({
            prefix,
            major,
            minor: minor + 1,
            patch: 0,
            suffix: "",
        });
    }

    if (suffix) {
        const lastChar = suffix.slice(-1);
        if (/[a-yA-Y]/.test(lastChar)) {
            const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
            return formatVersion({
                prefix,
                major,
                minor,
                patch,
                suffix: `${suffix.slice(0, -1)}${nextChar}`,
            });
        }
    }

    return formatVersion({
        prefix,
        major,
        minor,
        patch: patch + 1,
        suffix: "",
    });
}

/** Single env file Angular uses for a build configuration (fileReplacements[].with). */
function getEnvFilePathForBuildConfiguration(projectInfo, configurationName) {
    const cfg =
        projectInfo?.targets?.build?.configurations?.[configurationName];
    const fr = cfg?.fileReplacements;
    if (!Array.isArray(fr) || fr.length === 0) return null;
    const withPath = fr[0]?.with;
    if (!withPath || typeof withPath !== "string") return null;
    const abs = path.resolve(process.cwd(), withPath);
    return existsSync(abs) ? abs : null;
}

/**
 * Prefer Development vs Production before version bump when both `dev` and `production` configs exist.
 */
async function selectBuildConfigurationFirst(configurations) {
    const deployConfigs = configurations.filter((c) => c !== "development");
    if (deployConfigs.length > 3) {
        return select({
            message: "Select build configuration:",
            choices: deployConfigs.map((c) => ({ name: c, value: c })),
            loop: false,
            pageSize: Math.min(deployConfigs.length, 12),
        });
    }

    const hasDev =
        configurations.includes("dev") || configurations.includes("development");
    const hasProd = configurations.includes("production");
    const hasProdInternal = configurations.includes("prod-internal");
    if (hasDev && hasProd) {
        const devConfig = configurations.includes("dev") ? "dev" : "development";
        const choices = [
            {
                name: "Development (environment.dev.ts)",
                value: devConfig,
            },
            {
                name: "Production (environment.prod.ts)",
                value: "production",
            },
        ];

        if (hasProdInternal) {
            choices.push({
                name: "Production Internal (environment.prod-internal.ts)",
                value: "prod-internal",
            });
        }

        return select({
            message: "Select build environment:",
            choices,
            loop: false,
            pageSize: choices.length,
        });
    }
    return select({
        message: "Select a build configuration:",
        choices: configurations.map((c) => ({ name: c, value: c })),
        loop: false,
        pageSize: configurations.length,
    });
}

async function maybePromptVersionUpdate(
    project,
    projectInfo,
    buildConfigurationName
) {
    const envFile = getEnvFilePathForBuildConfiguration(
        projectInfo,
        buildConfigurationName
    );
    if (!envFile) return;

    const versionInfo = extractVersionFromEnv(readFileSync(envFile, "utf8"));
    if (!versionInfo?.value) return;

    const currentVersion = versionInfo.value;

    const shouldUpdate = await confirm({
        message: `Current ${project} version is ${currentVersion} (${path.basename(envFile)}). Update before build?`,
        default: false,
    });
    if (!shouldUpdate) return;

    const bumpType = await select({
        message: "Select version update type:",
        choices: [
            { name: `Patch (${currentVersion} -> ${bumpVersion(currentVersion, "patch") || "custom"})`, value: "patch" },
            { name: `Minor (${currentVersion} -> ${bumpVersion(currentVersion, "minor") || "custom"})`, value: "minor" },
            { name: `Major (${currentVersion} -> ${bumpVersion(currentVersion, "major") || "custom"})`, value: "major" },
            { name: "Custom", value: "custom" },
        ],
        loop: false,
    });

    let nextVersion = "";
    if (bumpType === "custom") {
        nextVersion = (
            await input({
                message: "Enter version:",
                default: currentVersion,
                validate: (value) => `${value}`.trim() !== "" || "Version is required",
            })
        ).trim();
    } else {
        nextVersion = bumpVersion(currentVersion, bumpType);
    }

    if (!nextVersion || nextVersion === currentVersion) return;

    const source = readFileSync(envFile, "utf8");
    const updated = updateVersionInEnv(source, versionInfo, nextVersion);
    if (updated !== source) {
        writeFileSync(envFile, updated, "utf8");
    }

    console.log(`✓ Updated ${path.basename(envFile)} to ${nextVersion}`);
}

async function main() {
    const action = process.argv[2];

    if (!action || !["serve", "build"].includes(action)) {
        console.error("Invalid action. Use serve or build.");
        process.exit(1);
    }

    const projects = getNxApps();
    if (!projects.length) {
        console.error("No Nx projects found.");
        process.exit(1);
    }

    const project = await select({
        message: "Select an Nx app:",
        choices: projects.map((p) => ({ name: p, value: p })),
        loop: false,
        pageSize: projects.length,
    });
    const projectInfo = getProjectInfo(project);

    let command = `npx nx ${action} ${project}`;

    if (action === "serve") {
        const configurations = getBuildConfigurations(project);
        if (configurations.includes("development")) {
            command += " --configuration=development";
        } else if (configurations.includes("dev")) {
            command += " --configuration=dev";
        }
    }

    if (action === "build") {
        const configurations = getBuildConfigurations(project);
        let configuration = "";
        if (configurations.length) {
            configuration = await selectBuildConfigurationFirst(configurations);
            command += ` --configuration=${configuration}`;
        }
        if (configuration) {
            await maybePromptVersionUpdate(
                project,
                projectInfo,
                configuration
            );
        }
    }

    console.log(`\n→ Running: ${command}\n`);
    execSync(command, {
        stdio: "inherit",
        env: {
            ...process.env,
            // Avoid flaky cached project graph failures after workspace changes.
            NX_DAEMON: "false",
        },
    });
}

main();

process.on("uncaughtException", (error) => {
    if (error instanceof Error && error.name === "ExitPromptError") {
        console.log("👋 until next time!");
    } else {
        throw error;
    }
});
