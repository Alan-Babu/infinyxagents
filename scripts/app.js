#!/usr/bin/env node
import { input, select } from "@inquirer/prompts";
import { execSync } from "child_process";

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

async function main() {
    const action = await select({
        message: "What would you like to create?",
        choices: [
            { name: "Add New Project", value: "app" },
            { name: "Add Shared Component", value: "shared_component" },
            {
                name: "Add Project Scoped Component",
                value: "project_component",
            },
            {
                name: "Add Shared Types, Components, Enums",
                value: "shared_lib",
            },
            {
                name: "Add Feature Module (libs/modules)",
                value: "feature_module",
            },
        ],
    });

    let command = "";

    if (action === "app") {
        const appName = await input({ message: "Enter app name:" });
        if (!appName) {
            console.error("App name is required.");
            process.exit(1);
        }
        const needsLogin = await (
            await import("@inquirer/prompts")
        ).confirm({
            message: "Should the app be protected with a login page?",
        });

        command = `npx nx g @nx/angular:app apps/${appName} --bundler=esbuild --inline-style --skipTests --ssr=false`;

        console.log(`\n→ Running: ${command}\n`);
        execSync(command, { stdio: "inherit" });

        console.log(`\n→ Starting post project setup for ${appName}...\n`);

        const fs = await import("fs");
        const path = await import("path");

        // 1. styles.css Update
        fs.writeFileSync(
            path.join("apps", appName, "src", "styles.css"),
            `@import "../../../libs/common/shared-assets/src/styles.css"\n`
        );

        // 2. app.html Update
        fs.writeFileSync(
            path.join("apps", appName, "src", "app", "app.html"),
            `<lib-loader />
<router-outlet></router-outlet>\n`
        );

        // 3. app.ts Update (prepend imports and remove nx-welcome)
        const appTsPath = path.join("apps", appName, "src", "app", "app.ts");
        let appTsContent = fs.readFileSync(appTsPath, "utf-8");
        // Remove NxWelcomeComponent import
        appTsContent = appTsContent.replace(/import { NxWelcome } from "\.\/nx-welcome";\n?/, "");
        appTsContent = `import { Loader } from '@nfinyx/loader';\n` + appTsContent;
        // Inject into imports and remove NxWelcomeComponent
        appTsContent = appTsContent.replace(/imports:\s*\[([^\]]*)\]/, (match, p1) => {
            const cleanImports = p1
                .split(",")
                .map((i) => i.trim())
                .filter((i) => i && i !== "NxWelcome");
            return `imports: [${cleanImports.length ? cleanImports.join(", ") + ", " : ""}Loader]`;
        });
        fs.writeFileSync(appTsPath, appTsContent);

        // 4. app.config.ts Update
        let appConfigContent = `import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APP_CONFIG, COMMON_PROVIDERS } from '@nfinyx/services';
import { provideToastr } from 'ngx-toastr';
import { providePrimeNG } from 'primeng/config';
import { AppTheme } from '@nfinyx/shared-assets';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(appRoutes, withHashLocation()),
        provideToastr(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: AppTheme,
                options: {
                    darkModeSelector: false,
                    cssLayer: {
                        name: 'primeng',
                        order: 'theme, base, primeng',
                    },
                },
            },
        }),
        { provide: APP_CONFIG, useValue: environment },
        COMMON_PROVIDERS,
    ]
};\n`;
        fs.writeFileSync(
            path.join("apps", appName, "src", "app", "app.config.ts"),
            appConfigContent
        );

        // 5. project.json Update
        const projectJsonPath = path.join("apps", appName, "project.json");
        const projectJson = JSON.parse(
            fs.readFileSync(projectJsonPath, "utf-8")
        );

        if (
            projectJson.targets &&
            projectJson.targets.build &&
            projectJson.targets.build.options
        ) {
            if (!projectJson.targets.build.options.assets)
                projectJson.targets.build.options.assets = [];
            projectJson.targets.build.options.assets.push({
                glob: "**/*",
                input: "libs/common/shared-assets/src/assets",
            });

            if (!projectJson.targets.build.options.styles)
                projectJson.targets.build.options.styles = [];
            projectJson.targets.build.options.styles.unshift(
                "node_modules/ngx-toastr/toastr.css"
            );

            fs.writeFileSync(
                projectJsonPath,
                JSON.stringify(projectJson, null, 2)
            );
        }

        // 6. Delete nx-welcome.ts
        const welcomeFile = path.join(
            "apps",
            appName,
            "src",
            "app",
            "nx-welcome.ts"
        );
        if (fs.existsSync(welcomeFile)) {
            fs.unlinkSync(welcomeFile);
        }

        // 7. Generate environments/environment.ts
        const envDir = path.join("apps", appName, "src", "environments");
        if (!fs.existsSync(envDir)) {
            fs.mkdirSync(envDir, { recursive: true });
        }

        const appId = appName.replace(/-/g, "_");
        let envContent = `export const environment = {
    production: false,
    baseURL: 'http://localhost:5401/api/',
    RSA: {
        publicKey: '',
        privateKey: '',
    },
    enableProxy: false,
    enableOtpLogin: false,
    appId: '${appId}',`;

        envContent += `\n};\n`;
        fs.writeFileSync(path.join(envDir, "environment.ts"), envContent);

        // 8. Conditionally add Login Component & Route Configuration
        const appRoutesPath = path.join(
            "apps",
            appName,
            "src",
            "app",
            "app.routes.ts"
        );
        let appRoutesContent = `import { Route } from '@angular/router';
import { AuthLayout, ErrorLayout } from '@nfinyx/layouts';
import { PageNotFound } from '@nfinyx/page-not-found';\n`;

        if (needsLogin) {
            // First, generate the component
            console.log(`\n→ Generating Login component for ${appName}...`);
            const loginCmd = `npx nx g @schematics/angular:component login --project=${appName} --path=apps/${appName}/src/app/auth.module --standalone --inline-style --skipTests`;
            execSync(loginCmd, { stdio: "inherit" });

            // Append Login import and specific route configuration
            appRoutesContent += `import { Login } from './auth.module/login/login';\n
export const appRoutes: Route[] = [
    {
        path: '',
        component: AuthLayout,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full',
            },
            {
                path: 'login',
                component: Login,
                data: { name: 'login' },
                pathMatch: 'full',
            }
        ],
    },
    {
        path: '**',
        redirectTo: 'pagenotfound',
    },
    {
        path: '',
        component: ErrorLayout,
        children: [
            {
                path: 'pagenotfound',
                component: PageNotFound,
            },
        ],
    },
];\n`;
        } else {
            // Basic route configuration without login
            appRoutesContent += `\nexport const appRoutes: Route[] = [
    {
        path: '**',
        redirectTo: 'pagenotfound',
    },
    {
        path: '',
        component: ErrorLayout,
        children: [
            {
                path: 'pagenotfound',
                component: PageNotFound,
            },
        ],
    },
];\n`;
        }

        fs.writeFileSync(appRoutesPath, appRoutesContent);

        // 9. Generate i18n files
        const i18nDir = path.join("apps", appName, "public", "i18n");
        if (!fs.existsSync(i18nDir)) {
            fs.mkdirSync(i18nDir, { recursive: true });
        }
        fs.writeFileSync(path.join(i18nDir, "en.json"), "{}\n");
        fs.writeFileSync(path.join(i18nDir, "ar.json"), "{}\n");

        console.log(`\n→ Post project setup complete for ${appName}!`);

        if (needsLogin) {
            console.log(`\n→ Login component generated for ${appName}!`);
            console.log(`  Please note: you need to include the login form and functionalities manually.`);
        }

        console.log(`  To start the project, run: pnpm start\n`);

        // We already ran the command, skip down below.
        command = "";
    } else if (action === "shared_component") {
        const libName = await input({ message: "Enter library name:" });
        if (!libName) {
            console.error("Library name is required.");
            process.exit(1);
        }
        command = `npx nx g @nx/angular:lib libs/common/${libName} --inline-style --skipTests`;
    } else if (action === "project_component") {
        const componentName = await input({ message: "Enter component name:" });
        if (!componentName) {
            console.error("Component name is required.");
            process.exit(1);
        }

        const projects = getNxApps();
        if (!projects.length) {
            console.error("No Nx projects found to add a component to.");
            process.exit(1);
        }
        const appName = await select({
            message: "Select an Nx app for the component:",
            choices: projects.map((p) => ({ name: p, value: p })),
            loop: false,
            pageSize: projects.length,
        });

        const subPath = await input({
            message: `Enter path relative to apps/${appName}/src/app/ (e.g. auth.module, or leave empty for root):`,
            default: "",
        });

        const fullPath = subPath
            ? `apps/${appName}/src/app/${subPath.replace(/^\/+/, "")}`
            : `apps/${appName}/src/app`;

        command = `npx nx g @schematics/angular:component ${componentName} --project=${appName} --path=${fullPath} --standalone --inline-style --skipTests`;
    } else if (action === "shared_lib") {
        const subPath = await input({
            message: "Enter path relative to libs/ (e.g. common/services):",
        });
        if (!subPath) {
            console.error("Library path is required.");
            process.exit(1);
        }
        const fullLibPath = `libs/${subPath.replace(/^\/+/, "")}`;
        command = `npx nx generate @nx/js:lib --directory=${fullLibPath} --projectNameAndRootFormat=as-provided --unitTestRunner=none --linter=eslint --bundler=none`;
    } else if (action === "feature_module") {
        const moduleName = await input({ message: "Enter feature module name (e.g. executive-summary):" });
        if (!moduleName) {
            console.error("Module name is required.");
            process.exit(1);
        }
        command = `npx nx g @nx/angular:lib libs/modules/${moduleName} --inline-style --skipTests`;

        console.log(`\n→ Running: ${command}\n`);
        execSync(command, { stdio: "inherit" });

        console.log(`\n→ Add "@nfinyx/${moduleName}": ["libs/modules/${moduleName}/src/index.ts"] to tsconfig.base.json paths.\n`);

        command = "";
    }

    if (command) {
        console.log(`\n→ Running: ${command}\n`);
        execSync(command, { stdio: "inherit" });
    }
}

main();

process.on("uncaughtException", (error) => {
    if (error instanceof Error && error.name === "ExitPromptError") {
        console.log("👋 until next time!");
    } else {
        throw error;
    }
});
