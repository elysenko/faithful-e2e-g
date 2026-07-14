# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below was
> derived from the "Surface contract" section of `.pipeline/tasks.md` and the approved
> spec. If a machine-readable `surface.json` is produced later, reconcile this file
> against it (13 endpoints / 8 screens expected).

## Coverage summary
- Total cases: 61
- API endpoints covered: 13 / 13 (from `tasks.md` surface contract)
- User journeys covered: 8

## API tests

All routes sit behind the global prefix `/api`. Unless marked **Public**, a request
without a valid `Authorization: Bearer <jwt>` header must return **401**.

### `POST /api/auth/register`  (Public)
- **Happy path**: `{ email: "new@user.io", password: "pw123456" }` → **201/200** with body `{ accessToken: <jwt string>, user: { id, email: "new@user.io", role: "USER" } }`. Response must never expose `passwordHash`. `role` is always `USER` even if a `role` field is injected in the body.
- **Validation failures**: missing/empty `email` → **400**; malformed email (`"notanemail"`) → **400**; missing/too-short `password` → **400**; unknown extra fields are stripped (ValidationPipe `whitelist`), not 500.
- **Auth failures**: duplicate email (register the same address twice) → **409** on the second call.
- **Idempotency / edge cases**: email uniqueness is case-sensitive per schema (`@unique`); the returned `accessToken` decodes to `{ sub, email, role }`.

### `POST /api/auth/login`  (Public)
- **Happy path**: valid credentials of a registered/seeded user → **201/200** with `{ accessToken, user: { id, email, role } }`.
- **Validation failures**: missing `email` or `password` → **400**.
- **Auth failures**: unknown email → **401**; correct email + wrong password → **401** (must not reveal which field was wrong).
- **Idempotency / edge cases**: both seeded accounts (`USER` and `ADMIN` from `SEED_CREDS_JSON`) log in successfully; admin's token carries `role: "ADMIN"`.

### `GET /api/auth/me`  (JWT)
- **Happy path**: valid token → **200** with `{ id, email, role }` matching the token subject; no `passwordHash`.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**; malformed/garbage token → **401**; expired token (>7d) → **401**.
- **Idempotency / edge cases**: user role reflected accurately for both USER and ADMIN tokens.

### `GET /api/recipes`  (JWT)
- **Happy path**: authenticated user → **200** with an array of only *that user's* recipes, ordered newest-first (`createdAt` desc). New account → `[]`.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401** (explicitly exercised by the spec's testing strategy).
- **Idempotency / edge cases**: User B's recipes never appear in User A's list (ownership scoping).

### `POST /api/recipes`  (JWT)
- **Happy path**: `{ title: "Banitsa", ingredients: "filo, feta, eggs", steps: "layer; bake" }` → **201** with the created recipe including `id`, `userId` = caller, `createdAt`, `updatedAt`. A subsequent `GET /api/recipes` contains "Banitsa".
- **Validation failures**: missing `title` → **400**; missing `ingredients` → **400**; missing `steps` → **400**; non-string field types → **400**; extra fields stripped.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: created recipe is owned by the caller regardless of any `userId` supplied in the body.

### `GET /api/recipes/:id`  (JWT)
- **Happy path**: owner requests their recipe → **200** with the full recipe.
- **Validation failures**: n/a (id treated as opaque string).
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: another user's recipe id → **404** (not 403, to avoid leaking existence); non-existent id → **404**.

### `PATCH /api/recipes/:id`  (JWT)
- **Happy path**: owner updates `{ title: "Banitsa (updated)" }` → **200** with updated fields; `updatedAt` changes.
- **Validation failures**: invalid field types → **400**; empty body is allowed (no-op) or partial update per DTO.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: patching another user's recipe → **404**; patching non-existent id → **404**; `userId`/`id` cannot be reassigned via body.

### `DELETE /api/recipes/:id`  (JWT)
- **Happy path**: owner deletes their recipe → **200/204**; subsequent `GET /api/recipes/:id` → **404**.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: deleting another user's recipe → **404** (and the target recipe still exists for its owner); deleting an already-deleted/unknown id → **404**.

### `GET /api/admin/overview`  (JWT + `@Roles('ADMIN')`)
- **Happy path**: admin token → **200** with `[{ userId, email, recipeCount }]`; `recipeCount` equals the actual number of recipes per user (verify by seeding a user with N recipes).
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**; valid USER (non-admin) token → **403**.
- **Idempotency / edge cases**: array includes every user; a user with zero recipes shows `recipeCount: 0`.

### `GET /api/admin/settings`  (JWT + `@Roles('ADMIN')`)
- **Happy path**: admin token → **200** with a list of service config keys (`postgresql`, `minio`) each with a **masked** value and a `configured` boolean. Raw secret values must never be returned in clear text.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**; non-admin token → **403**.
- **Idempotency / edge cases**: unset keys report `configured: false` with empty/masked value.

### `PATCH /api/admin/settings`  (JWT + `@Roles('ADMIN')`)
- **Happy path**: admin upserts `{ "SOME_KEY": "value" }` → **200**; a following `GET /api/admin/settings` shows that key `configured: true` (value still masked).
- **Validation failures**: malformed body (non-object / non-string values) → **400**.
- **Auth failures**: no token → **401**; non-admin token → **403**.
- **Idempotency / edge cases**: re-sending the same key updates rather than duplicates (upsert on `SystemSetting.key` primary key); `updatedAt` advances.

### `GET /api/health`  (Public)
- **Happy path**: → **200** with `{ status: "ok" }`, no auth required.
- **Validation failures**: n/a.
- **Auth failures**: n/a (public/exempt).
- **Idempotency / edge cases**: reachable through the ingress at `/faithful-e2e-g/api/health`.

### `GET /api/health/deep`  (Public)
- **Happy path**: DB reachable → **200** (runs `SELECT 1`).
- **Validation failures**: n/a.
- **Auth failures**: n/a (public/exempt).
- **Idempotency / edge cases**: when the DB is unreachable, returns a non-200 (5xx) so the readiness probe fails rather than serving a broken app.

## UI / journey tests

App base-href is `/faithful-e2e-g/`; API is called at relative `api/...`. Document
title is `FaithfulG Recipe Box` and the header shows "FaithfulG" branding + logout.

### Journey: Signup
- **Steps**: navigate to `/signup` (public) → fill reactive form email + password → submit.
- **Expected outcomes**: account created via `POST /api/auth/register`; token stored in `localStorage`; redirected to `/recipes`.
- **Negative path**: duplicate email → visible error surfaced from the 409; invalid/empty fields keep the submit disabled or show validation messages, no navigation.

### Journey: Login
- **Steps**: navigate to `/login` (public) → enter demo user credentials → submit.
- **Expected outcomes**: `POST /api/auth/login` succeeds; token persisted to `localStorage`; redirected to `/recipes`; header branding "FaithfulG" and logout control visible.
- **Negative path**: wrong password → error message shown, remains on `/login`, no token stored.

### Journey: Recipes list (`flow: 'recipes-list'`)
- **Steps**: authenticated user visits `/recipes`.
- **Expected outcomes**: list renders current user's recipes; each item carries `data-testid="recipe-item"`; empty state shown for a new user.
- **Negative path**: API error → visible error/empty state, not a blank crash; loading state shown while fetching.

### Journey: Create recipe (`flow: 'recipe-create'`)
- **Steps**: from `/recipes` go to `/recipes/new` → fill reactive form title="Banitsa", ingredients, steps → submit.
- **Expected outcomes**: `POST /api/recipes` succeeds; navigation back to `/recipes`; a new element with `data-testid="recipe-item"` for "Banitsa" appears (spec's key frontend assertion).
- **Negative path**: submitting an incomplete form is blocked / shows validation; server error surfaces a message without losing entered data.

### Journey: Edit & delete recipe (`flow: 'recipe-edit'`)
- **Steps**: from a recipe item open `/recipes/:id/edit` → change title → save; then delete.
- **Expected outcomes**: `PATCH` updates the item in the list; `DELETE` removes it and returns to `/recipes` where the item is gone.
- **Negative path**: editing/deleting a recipe not owned (direct URL with another id) → 404 handled gracefully (redirect or error), not an app crash.

### Journey: Admin overview (`flow: 'admin-overview'`)
- **Steps**: log in as the seeded admin → admin nav link visible → open `/admin`.
- **Expected outcomes**: table with `data-testid="admin-overview"` renders per-user recipe counts; page title/header contain "FaithfulG".
- **Negative path**: a non-admin navigating to `/admin` is redirected to `/recipes` by `adminGuard` (admin nav link not shown for USER).

### Journey: Admin settings
- **Steps**: as admin open `/admin/settings`.
- **Expected outcomes**: `postgresql` and `minio` services each shown with a configured/unconfigured badge and a per-service credential form; saving calls `PATCH /api/admin/settings` and flips the badge to configured; values displayed masked.
- **Negative path**: non-admin visiting `/admin/settings` is redirected to `/recipes`.

### Journey: Auth guard redirect (unauthenticated)
- **Steps**: with no token in `localStorage`, navigate directly to `/recipes`.
- **Expected outcomes**: `authGuard` redirects to `/login` (spec's key redirect assertion). Same for `/recipes/new`, `/recipes/:id/edit`, `/admin`.
- **Negative path**: `''` redirects to `/recipes` (then to `/login` if unauthenticated); unknown `**` path redirects per routing config. Logout clears the token and returns to `/login`.

## Data integrity tests
- After `POST /api/recipes`, exactly one `Recipe` row exists with `userId` = the authenticated caller; `id` is a cuid; `createdAt` and `updatedAt` are set.
- `Recipe.userId` always references an existing `User` (FK relation); deleting is scoped so a user can never mutate another user's rows.
- `User.email` is unique — a duplicate insert (register) is rejected at the DB/service layer (409), leaving row count unchanged.
- `User.role` defaults to `USER`; no code path other than the seed creates an `ADMIN`.
- `User.passwordHash` stores a bcrypt hash, never the plaintext; it is never serialized in any API response.
- `PATCH /api/recipes/:id` advances `updatedAt` and never changes `id` or `userId`.
- `SystemSetting` uses `key` as primary key; repeated `PATCH /api/admin/settings` upserts (no duplicate keys) and advances `updatedAt`.
- Seed is idempotent: running it twice (via `upsert`) does not create duplicate demo/admin users; `SEED_CREDS_JSON=...` is printed to stdout and both listed accounts authenticate.

## Out of scope
- **Container/Kubernetes packaging** (`Dockerfile`, `docker-entrypoint.sh`, `k8s/postgres.yaml`, `k8s/deployment.yaml`, `kustomization.yaml`, `nginx.conf` deletion): validated only indirectly via the deploy smoke test (`/faithful-e2e-g/api/health` → 200, SPA loads with correct base-href). No unit tests for infra manifests — the spec assigns no pipeline agent to them (see `tasks.md` open question).
- **MinIO object-storage behaviour**: the spec body describes no uploads/file storage; `minio` appears only as an admin-settings credential row. Only its presence/masking in `/api/admin/settings` is tested, not any storage operation (spec is silent).
- **Public admin promotion / first-signup-admin**: the spec mandates admin exists only via seed; register always creates `USER`. No test asserts a self-service path to ADMIN because none should exist.
- **Third-party integrations**: `## Integrations` is explicitly "None"; no external API/SDK tests.
- **Token-refresh / logout invalidation server-side**: JWT is stateless (7d expiry); no refresh endpoint in the surface, so no such tests.
- **Rate limiting, pagination, and i18n**: not described in the spec.

Wrote .pipeline/test_spec.md (61 cases across 13 endpoints / 8 journeys).
