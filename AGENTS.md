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

## The "Soon" rule

Anything in the design that is not in V1 is shown dimmed and disabled with a "قريباً" label: no fake data, no API
call, no working link. One list controls it: `features.ts`, each entry `live`, `soon` or `hidden` (hidden = not planned).

## Sequencing rule

The frontend is built only on backend that is delivered and tested. MSW is a test tool only, never a stand-in for a
backend that does not exist yet (that feature shows as Soon).

## Scripts

`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:css`, `pnpm format:check`.
Run typecheck, lint, lint:css, format:check and build before reporting a task done.

## Process

- Do only the current task. Anything else you notice goes under "Observed but not changed" in your report.
- Never commit or push. Never print secrets.
- Codex cannot install packages: if a task needs a new package, stop and report which one.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
