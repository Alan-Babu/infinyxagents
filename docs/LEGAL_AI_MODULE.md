# NX Legal AI — feature module

Angular front end for the **Legal AI Compliance Agent**: upload a contract, get a clause-by-clause
compliance analysis against verified UAE Federal legislation, review findings, browse the law library,
and ask grounded legal questions. It replaces the disabled "In Lab" *NX Legal AI* tile.

| | |
|---|---|
| Library | `libs/modules/legal-ai` (Nx project `legal-ai`) |
| Import alias | `@nfinyx/legal-ai` → exports `LEGAL_AI_ROUTES` |
| Mounted at | `/legal-ai` in `apps/mofa` and `apps/platform` (lazy, inside `SharedLayout`, behind `requireLoginGuard`) |
| Dashboard tile | `AGENT_TILES` id `legal-ai` (category *Compliance & Review*, badge *Beta*) |
| Backend | FastAPI service at `{APP_CONFIG.baseURL}/legalai/api` — in production `https://agentsapi.nfinyx.ai/legalai/api` |

## Routes

| Path | Page |
|---|---|
| `/legal-ai` | Documents dashboard — stats, filter, search, paginated table, upload |
| `/legal-ai/documents/:id` | Analysis — Overview · Federal law compliance · Risk & recommendations · Extracted entities · Audit trail; finding drawer with human review |
| `/legal-ai/library` | Legislation knowledge base (filter by category, search, paginated) |
| `/legal-ai/library/:lawId` | One law and its articles (paginated, expandable) |
| `/legal-ai/pipeline` | The five analysis agents, in execution order |

Every page shares the **Ask Legal AI** drawer (grounded Q&A, scoped to the open document) and the
**Upload** drawer via the `LegalAiShell` parent route, which also owns document polling
(4 s while an analysis is running, 30 s otherwise, paused when the tab is hidden).

List state lives in the URL (`?page=&filter=&q=&category=&tab=&finding=`), so views are deep-linkable
and Back closes an open finding.

## How it follows the workspace conventions

- **Layout / menu** — `AgentLayout` with `data['main-nav']` (Gavel, Database, Checklist icons).
- **API** — `LegalAiApiBase extends ApiService` sets `resolveBaseUrl('legalai/api')`; `LegalAiApiService`
  returns Promises. The shared `AuthInterceptor` attaches the bearer token.
- **i18n** — `i18n/en.json` + `ar.json` under the `legalAi.*` namespace, merged by
  `createModuleI18nResolver`. `translation-parity.spec.ts` keeps both languages in sync.
- **UI** — PrimeNG (`p-drawer`, `p-select`, `p-progressbar`, buttons), Tailwind, and the shared
  `lib-page-header`, `lib-stat-card`, `lib-no-data`.
- **Selectors** — prefix `lib-`; components are standalone.

## Colour

Brand colour is the app's PrimeNG preset (`primary-*`): UAE gold in `mofa`, the default palette in
`platform`. Functional colours follow the
[UAE Design System colour guidelines](https://designsystem.gov.ae/guidelines/colour-system): the
official scales are exposed as Tailwind tokens in `libs/common/shared-assets/src/styles.css`
(`ae-red`, `ae-green`, `ae-camel`, `ae-desert`, `ae-sea`, `ae-tech`, each 50–950) and mapped in
`utils/display.ts` — error = red, success = green, warning = camel / desert, information = sea / tech.
Status tags always carry an icon, so colour is never the only signal.

## Structure

```
libs/modules/legal-ai/src
├── index.ts                     public API: LEGAL_AI_ROUTES, models, LegalAiApiService
└── lib/
    ├── legal-ai.routes.ts       route table + menu
    ├── legal-ai.paths.ts        LEGAL_AI_BASE ('/legal-ai')
    ├── pages/                   shell · dashboard · document-detail (+ tabs/) · library · law-detail · pipeline
    ├── components/              finding-drawer · qa-drawer · upload-drawer · processing-monitor · toolbar · pager · tags
    ├── services/                api base + api service + i18n helper
    ├── state/                   signal stores: documents, laws, analysis (per page), Q&A, upload, UI
    ├── models/  utils/  i18n/
```

## Develop

```bash
pnpm exec nx serve mofa            # or platform; open #/legal-ai (sign in first)
pnpm exec nx test legal-ai         # unit tests (Vitest)
pnpm exec nx lint legal-ai
pnpm exec nx build mofa
```

**Against a local backend.** The apps' `environment.ts` `baseURL` is the shared platform gateway, and the
module calls `{baseURL}/legalai/api/*`. To run the FastAPI service from `legalAI` locally
(`uvicorn backend.app.main:app --port 8000`), put a proxy in front that maps `/legalai/api/*` →
`http://localhost:8000/api/*` and point `baseURL` at it, e.g. nginx:

```nginx
location /legalai/api/ { proxy_pass http://localhost:8000/api/; }
```

## Notes

- Upload is a single multipart request (the shared `ApiService` has no progress events), so the drawer
  shows an indeterminate bar; network failures are retried up to 3 times with back-off.
- The standalone prototype's *Contract comparison* and *Version comparison* tabs showed placeholder
  data (the backend has no baselines or version history) and were not carried over.
- The platform has no dark theme, so the prototype's night theme was not carried over either.
