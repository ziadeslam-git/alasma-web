# modules/

One folder per feature (auth, catalog, search, cart, checkout, orders, account, engagement, publishing, content,
admin). Each feature folder holds its own `api/`, `components/`, `hooks/`, `schemas/`, `types.ts` and a public
`index.ts`. Feature folders are created by the task that builds the feature, not before.

Dependency rule: `app -> modules -> shared`. A module may import `shared`, or another module only through that
module's `index.ts`. ESLint enforces this (`import/no-restricted-paths` in `eslint.config.mjs`).
