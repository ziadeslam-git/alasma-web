# AGENTS.md - Al-Asma Pro web (read first, applies to every task)

## Read first

The source of truth is the Notion Frontend pages: "Architecture & Folder Structure & Coding Standards", "Overview &
Decisions", "Routes & Pages Map", "Components Inventory", "API Integration", "Design -> Code Migration" and the
current "Week F" page. If the repo and the pages disagree, STOP and ask.

## Project

Storefront, customer area and dashboard for an Arabic publishing house, one Next.js app (App Router, React, TypeScript
strict, CSS Modules + design tokens, pnpm). RTL first (`lang="ar" dir="rtl"`), logical CSS properties only.
The .NET API lives in a separate repo (../AlAsmaPro). The frontend talks to it over HTTP only and shares no code.

## Folder rules (non-negotiable)

- `src/app` routing and page assembly only, no business logic. Route groups: `(site)`, `(auth)`, `(account)`,
  `(admin)/admin`. `page.tsx` stays thin.
- `src/modules/<feature>` everything about one feature: `api/`, `components/`, `hooks/`, `schemas/`, `types.ts` and a
  public `index.ts`.
- `src/shared` ui, layout, lib, hooks, config, icons. `src/i18n`, `src/styles`, `src/mocks` (MSW handlers).
- Dependency rule `app -> modules -> shared`. shared imports nothing from modules or app. A module imports shared, or
  another module only through that module's `index.ts`. ESLint (`import/no-restricted-paths`) fails the build when
  broken. Create a feature folder only in the task that builds it, and add it to the module list in
  `eslint.config.mjs` if it is new.
- `design/` is READ-ONLY reference material (it has a SHA256SUMS file). Never edit, move, delete or import from it.
  It is ignored by ESLint, Prettier, Stylelint and TypeScript.

## Naming and code rules

- Files kebab-case. Components PascalCase, hooks `useXxx`, booleans `isXxx` / `hasXxx`.
- TypeScript strict with `noUncheckedIndexedAccess`. No `any` (a justified disable comment is the only exception).
- One main component per file, about 200 lines at most. Early return and guard clauses. Comments explain why.
- No magic strings: query keys in one file, routes in `routes.ts`, permissions as constants matching the backend.
- No Arabic text in code or components: it lives in `src/i18n/messages` (ESLint enforces it).
- No hex colours outside `src/styles/tokens.css`: use `var(--...)` tokens (Stylelint and ESLint enforce it).
- No `localStorage` / `sessionStorage` (the access token lives in memory only). No `dangerouslySetInnerHTML` except
  sanitized static pages from the API, with a comment giving the reason.
- The UI never computes prices, discounts, shipping or totals: it shows what the API returns.
- Hiding a button is not security. Use API types generated from `openapi.json`; never hand-write them.
- Conventional Commits. No secrets in code or Git (`.env.local` only).

## Tokens, fonts and base styles

- `src/styles/tokens.css` is copied byte for byte from `design/ds/al-asma/tokens.css`. Never edit it by hand: if the
  design changes, copy the file again. Colours, spacing, radii, shadows and fonts are used ONLY through its variables
  (`var(--primary)`, `var(--space-4)`, `var(--font-sans)`). Its text classes (`display-*`, `h1`..`h4`, `body*`,
  `caption`, `label`, `price*`, `quote`, `excerpt`) are the only global text styles; do not invent new ones.
- `src/styles/tokens-site.css` contains the verbatim `:root` declarations from `design/site.css` that are used by the
  site design but absent from the design-system token file. It is imported immediately after `tokens.css`; never
  replace values with invented ones. Breakpoints are literal `760px` and `1000px` values in media queries.
- Fonts are self-hosted woff2 files in `src/assets/fonts` (licences in `LICENSES.md`), loaded with `next/font/local` in
  `src/shared/config/fonts.ts`. Never use `next/font/google` or a Google Fonts URL. The family names match the ones
  in `tokens.css`, so only the variables are used in CSS, never a literal family name.
- Font weight 700 is the maximum (weight 800 does not exist in these fonts). Allowed weights: Aref Ruqaa 400 and 700,
  IBM Plex Sans Arabic 300-700, Amiri 400 and 700.
- `src/styles/globals.css` is imported once, from the root layout, and pulls in `tokens.css` and `reset.css`. Logical
  properties only (`margin-inline-start`, `inline-size`), no hex, no left/right.
- `/dev/tokens` is a development-only page that shows every token. It returns 404 in production and is `noindex`.

## Testing

- Unit and component tests (Vitest + Testing Library + vitest-axe) sit next to the code as `*.test.ts` / `*.test.tsx`.
  `pnpm test` runs them once; `pnpm test:watch` watches. It must work OFFLINE with no browser: never add a unit test
  that needs the network or a real browser.
- MSW is a TEST tool only. Handlers are in `src/mocks/handlers.ts`, the Node server in `src/mocks/server.ts`, started in
  `src/test/setup.ts` with `onUnhandledFrame: 'error'`, so a request without a handler fails the test. There is no
  service worker, no browser entry and no mock mode: never enable MSW in dev or production. Add a handler only for an
  endpoint the delivered backend really has.
- jsdom cannot compute colour contrast, so `src/test/axe.ts` turns that one rule off; contrast is covered by the
  Playwright axe run.
- End-to-end and accessibility tests (Playwright, Chromium only, 360 / 768 / 1280 wide, port 3100, against the
  production build) live in `e2e/`. `pnpm test:e2e` is run by the OWNER or Claude Code, NOT by Codex (its sandbox cannot
  run a browser reliably). CI runs it in a separate job.
- `src/test/examples` and `e2e/examples` are examples to copy, to be replaced by real tests.
- A task is not finished until its tests pass. Definition of Done: see section 14 of the Architecture page (Notion).

## API layer (src/shared/lib/api)

- The contract is `openapi.json`, a COMMITTED copy of `../AlAsmaPro/docs/openapi.json`, and `schema.d.ts` is generated
  from it. `pnpm api:sync` copies the contract from the sibling backend folder, `pnpm api:types` regenerates
  `schema.d.ts`, `pnpm api:check` (CI) fails when the committed `schema.d.ts` is stale. Never edit either file by hand
  (both are ignored by Prettier and ESLint). Codex and CI never need the backend folder.
- Never type an API shape by hand: import `paths` / `components` from `schema.d.ts` (or `@/shared/lib/api`).
- Two clients, both from `openapi-fetch`. `createServerClient()` is for Server Components and ISR: absolute
  `API_ORIGIN` (default `http://localhost:5198`), no cookies, no auth; pass Next caching per call with
  `nextFetch({ revalidate, tags })`; use `throwIfError(result)` to turn a failed result into an `ApiError`.
  `createBrowserClient(hooks)` is for Client Components: same-origin, cookies included, `Authorization: Bearer` from the
  injected `getAccessToken()` (the token lives in memory only), every failure THROWN as an `ApiError`, and
  `onUnauthorized` called once per 401. With the `refreshAccessToken` hook (the auth module sets it) a 401 outside the auth
  routes gets ONE refresh and ONE retry; the auth routes (login, register, refresh, logout, forgot/reset password,
  confirm email) never refresh. Feature code gets its client from `getApiClient()` of `@/modules/auth`.
- The schema paths already start with `/api/v1`, so the client base URL is the origin, not `/api/v1`.
- In development `next.config.ts` rewrites `/api/v1/*` to `API_ORIGIN` so the refresh cookie stays same-origin (ADR-18).
  Copy `.env.example` to `.env.local` to change the origin. Never put a secret in a `NEXT_PUBLIC_` variable.
- Errors: `ApiError` carries status, type, title, detail, `code`, traceId, field `errors` and `retryAfterSeconds` (429).
  Show users `getApiErrorMessage(error)`: Arabic text from `src/i18n/messages/ar.json` (`apiErrors`: `codes` for the
  public and auth screens, `adminCodes` for admin and later features, then the status, kind and generic fallbacks).
  Add the Arabic text for a new backend `code` there, never in code.
- The UI never computes prices, discounts, shipping or totals: it shows what the API returns.

## Auth and the session (src/modules/auth)

- The access token lives ONLY in the module-level session store (`session/session-store.ts`): never in web storage, a
  cookie, the URL, a log or React state. The refresh token is the HttpOnly cookie `alasma_rt`; the front end never reads
  it and the Next server never sees it (Path `/api/v1/auth`), so Server Components treat everyone as anonymous and the
  client hydrates the session.
- `alasma_has_session=1` is a hint cookie written by the front end after login or refresh (SameSite=Lax, 7 days, Secure
  on https) and removed when the session ends. The bootstrap refresh runs only when it exists, so an anonymous visitor
  makes no `/auth/refresh` request.
- Get a token ONLY through `ensureFreshSession()`: one in-flight refresh per tab, serialised across tabs with Web Locks
  (`alasma-auth-refresh`) and shared through a BroadcastChannel (`alasma-auth`), because the API treats parallel
  refreshes as reuse and kills the session. A refresh that failed for network or server reasons is not repeated for
  `REFRESH_RETRY_PAUSE_MS`. Never write a second refresh path or retry a failed refresh in a loop.
- `<AuthProvider>` is mounted once in the root layout. `useAuth()` gives `{ status, user, login, logout }`
  (`loading` on the server and the first client render). Errors are `ApiError`s.
- `/dev/auth` (development only) exercises login, logout, parallel calls and a forced refresh without showing the token.
  `e2e/auth-real-api.spec.ts` runs the same logic against the real API and is skipped unless `E2E_REAL_API=1`.

## The client boundary ('use client')

A file that uses a React hook (including our own, like `useFieldContext`), `createContext` or an inline event handler
(`onClick={...}`) must start with `'use client'`, or a Server Component importing it breaks the build and every page
returns 500. `scripts/check-use-client.mjs` (run by `pnpm lint`) fails and lists such files. Keep the boundary small:
put the directive only on the file that needs it, never on a file just to silence an error, and keep presentational
components (Icon, Skeleton, EmptyState, pages) as Server Components. Tests, `src/test`, `src/mocks`, `*.d.ts` and the
generated icon registry are not checked.

## Overlays (Modal, Drawer)

`Modal` and `Drawer` (`src/shared/ui/modal`, `src/shared/ui/drawer`) sit on the native `<dialog>` through one shared
`OverlayDialog` (`src/shared/ui/overlay`). They are client components: a Server page must not pass them functions, so
keep the open state in a small client wrapper and render the overlay there (see the dev sections). Put `data-autofocus`
on the element that should get focus on open. Do not write a third dialog implementation: extend `OverlayDialog`.
The page scroll lock is shared (`src/shared/lib/dom/scroll-lock.ts`), so stacked overlays are safe. The overlay e2e spec
(`e2e/overlays.spec.ts`) runs against `next dev` on port 3101 because it uses the dev-only `/dev/components` page.

## Landmarks

`SiteShell` owns the only `<main>` (`id="main-content"`). Pages and components rendered inside it must not render another one (axe reports duplicate and nested main landmarks). The dev pages under `(dev)` are outside the shell and have their own.

## The "Soon" rule

Anything in the design that is not in V1 is shown dimmed and disabled with a "قريباً" label: no fake data, no API
call, no working link. One list controls it: `features.ts`, each entry `live`, `soon` or `hidden` (hidden = not planned).
Add every new feature exactly once in `src/shared/config/features.ts`, then render it through `FeatureGate` so live
features render normally, soon features are inert and labelled, and hidden features render nothing.
Keep every user-facing path in `src/shared/config/routes.ts`; use its helpers for dynamic path segments so Arabic slugs
are encoded safely.
Deferred navigation entries, including publishing packages, must remain registered as `soon` until their backend work is delivered.

## Sequencing rule

The frontend is built only on backend that is delivered and tested. MSW is a test tool only, never a stand-in for a
backend that does not exist yet (that feature shows as Soon).

## Scripts

`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:css`, `pnpm format:check`,
`pnpm test`, `pnpm test:watch`, `pnpm test:e2e`, `pnpm api:sync`, `pnpm api:types`, `pnpm api:check`. Run typecheck, lint, lint:css, format:check, test and build before
reporting a task done.

## Process

- Do only the current task. Anything else you notice goes under "Observed but not changed" in your report.
- Never commit or push. Never print secrets.
- Codex cannot install packages: if a task needs a new package, stop and report which one.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
