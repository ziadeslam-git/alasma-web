# app/

Routing and page assembly only, no business logic. Route groups: `(site)` public and indexable, `(auth)` login and
registration, `(account)` customer area (client-rendered, noindex), `(admin)/admin` dashboard (client-rendered,
noindex). Each group gets its own `layout.tsx` when its first page is built.
