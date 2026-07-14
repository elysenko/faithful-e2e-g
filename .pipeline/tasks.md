# Pipeline Task Decomposition

## Summary
"FaithfulG Recipe Box" is a full-stack single-container app: a NestJS + Prisma/PostgreSQL API with JWT full-auth that also serves a compiled Angular standalone-components SPA from the same Node process. Authenticated users manage their own recipes (title, ingredients, steps) with strict per-user ownership scoping; a seeded Admin can view an overview of all users and their recipe counts. It is packaged as a multi-stage Docker image and deployed under the existing Colossus `/faithful-e2e-g/` ingress with a co-located Postgres 16 deployment.

## Surface contract

### Backend API routes (global prefix `/api`)
- `POST /api/auth/register` — create `USER`, return `{ accessToken, user }` (409 on duplicate email). Public.
- `POST /api/auth/login` — verify credentials, return `{ accessToken, user }`. Public.
- `GET /api/auth/me` — current user (JWT required).
- `GET /api/recipes` — current user's recipes, newest first (JWT). 401 if unauthenticated.
- `POST /api/recipes` — create `{ title, ingredients, steps }` (JWT, validated).
- `GET /api/recipes/:id` — owned recipe or 404 (JWT).
- `PATCH /api/recipes/:id` — update owned recipe or 404 (JWT).
- `DELETE /api/recipes/:id` — delete owned recipe or 404 (JWT).
- `GET /api/admin/overview` — `[{ userId, email, recipeCount }]` (JWT + `@Roles('ADMIN')`). 403 non-admin, 401 unauth.
- `GET /api/admin/settings` — list service/integration config keys with masked values + configured status (JWT + ADMIN).
- `PATCH /api/admin/settings` — upsert key-value config pairs (JWT + ADMIN).
- `GET /api/health` — `{ status: 'ok' }`. Public.
- `GET /api/health/deep` — runs `SELECT 1` against DB. Public.

### Frontend screens (Angular, base-href `/faithful-e2e-g/`, `apiBase: 'api'`)
- `/login` — public, `data.flow: 'login'`.
- `/signup` — public, `data.flow: 'signup'`.
- `/recipes` — `authGuard`, `flow: 'recipes-list'`, items carry `data-testid="recipe-item"`.
- `/recipes/new` — `authGuard`, `flow: 'recipe-create'`.
- `/recipes/:id/edit` — `authGuard`, `flow: 'recipe-edit'` (edit + delete).
- `/admin` — `adminGuard`, `flow: 'admin-overview'`, table with `data-testid="admin-overview"`.
- `/admin/settings` — `adminGuard`, service/integration credential configuration.
- `''` → redirect `/recipes`; `**` → redirect.
- App title/header: `FaithfulG Recipe Box`, header branding "FaithfulG" + logout.

### Entities
- `User { id, email (unique), passwordHash, role Role @default(USER), createdAt, recipes[] }`
- `Recipe { id, title, ingredients, steps, userId, user, createdAt, updatedAt }`
- `SystemSetting { key @id, value, updatedAt }`
- `enum Role { USER ADMIN }`

## db_agent tasks
- [ ] Create `backend/prisma/schema.prisma` with `datasource db` (postgres, `env("DATABASE_URL")`) and `generator client`.
- [ ] Define `enum Role { USER ADMIN }` and `model User` (`id String @id @default(cuid())`, `email String @unique`, `passwordHash String`, `role Role @default(USER)`, `createdAt DateTime @default(now())`, `recipes Recipe[]`) — full_auth model with `role @default(USER)`.
- [ ] Define `model Recipe` (`id String @id @default(cuid())`, `title String`, `ingredients String`, `steps String`, `userId String`, `user User @relation(fields:[userId], references:[id])`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`).
- [ ] Add `model SystemSetting { key String @id; value String; updatedAt DateTime @updatedAt }` for admin-configurable service/integration credentials.
- [ ] Create initial Prisma migration for `User`, `Recipe`, `SystemSetting` (used by `prisma migrate deploy` at boot).
- [ ] Create `backend/prisma/seed.ts` — idempotent `upsert` of a demo `USER` and an `ADMIN` (bcrypt-hashed passwords), then `console.log('SEED_CREDS_JSON=' + JSON.stringify([{role, email, password}, ...]))`.

## backend_agent tasks
- [ ] Scaffold backend config: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.env.example` (dev defaults for `DATABASE_URL`, `JWT_SECRET`) with dependencies listed in spec.
- [ ] Create `src/prisma/prisma.service.ts` (`PrismaService extends PrismaClient` with `onModuleInit` connect) and `src/prisma/prisma.module.ts`.
- [ ] Create `src/main.ts` — bootstrap, `setGlobalPrefix('api')`, global `ValidationPipe({ whitelist, transform })`, CORS enabled, `listen(process.env.PORT || 80)`.
- [ ] Create `src/app.module.ts` — wire Prisma, Auth, Users, Recipes, Admin, Health modules + `ServeStaticModule.forRoot({ rootPath: <angular dist>, exclude: ['/api/(.*)'] })` with SPA fallback.
- [ ] Create `src/auth/` module: `auth.module.ts` (`JwtModule` secret from config, `7d`), `jwt.strategy.ts` (validate + load user), `jwt-auth.guard.ts` (default guard), `roles.guard.ts`, `roles.decorator.ts`, `current-user.decorator.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`.
- [ ] Implement `src/auth/auth.service.ts`: `register(dto)` — 409 on duplicate email, bcrypt hash, create role `USER`, return `{ accessToken, user }`; `login(dto)` — verify + sign JWT `{ sub, email, role }`. (Admin exists only via seed; register always creates `USER`.)
- [ ] Implement `src/auth/auth.controller.ts`: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (JWT).
- [ ] Create `src/users/users.service.ts` + `src/users/users.module.ts` (lookup/create helpers used by auth).
- [ ] Create `src/recipes/` module: `recipes.module.ts`, `dto/create-recipe.dto.ts`, `dto/update-recipe.dto.ts` (`class-validator` on `title`, `ingredients`, `steps`).
- [ ] Implement `src/recipes/recipes.controller.ts` + `recipes.service.ts` — all routes `@UseGuards(JwtAuthGuard)`; `GET` list (current user, newest first), `POST` create, `GET/PATCH/DELETE /:id` scoped by `userId` returning 404 when not owned; unauthenticated → 401.
- [ ] Create `src/admin/` module: `admin.module.ts`, `admin.controller.ts`, `admin.service.ts` — `GET /api/admin/overview` guarded by `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`, returns `[{ userId, email, recipeCount }]` via `prisma.user.findMany` + `_count.recipes` (403 non-admin, 401 unauth).
- [ ] Create `src/health/health.controller.ts` — `GET /api/health` → `{ status: 'ok' }`; `GET /api/health/deep` → runs `SELECT 1` (both public).
- [ ] Create `lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if value is absent or equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS`, reads from `SystemSetting` DB row; returns null if neither set.
- [ ] Implement `GET /api/admin/settings` (list configured service keys for `postgresql` and `minio` with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, `@Roles('ADMIN')`).

## ui_agent tasks
- [ ] Scaffold frontend config: `package.json` (Angular ~18), `angular.json`, `tsconfig*.json`, `src/index.html` (title `FaithfulG Recipe Box`), `src/main.ts`, `src/styles.css`, `src/environments/environment*.ts` (`apiBase: 'api'`).
- [ ] Create `src/app/app.config.ts` (router, `provideHttpClient(withInterceptors([authInterceptor]))`) and `src/app/core/models.ts` (User, Recipe, auth response types).
- [ ] Create `src/app/app.component.ts/html` — header with "FaithfulG" branding + logout; admin nav link visible only to admins (role check).
- [ ] Create `src/app/pages/login/` — reactive login form (public, `data.flow: 'login'`).
- [ ] Create `src/app/pages/signup/` — reactive signup form (public, `data.flow: 'signup'`).
- [ ] Create `src/app/pages/recipes-list/` — list current user's recipes with items carrying `data-testid="recipe-item"`; empty/loading/error states (`authGuard`, `flow: 'recipes-list'`).
- [ ] Create `src/app/pages/recipe-form/` — reactive create form (`/recipes/new`, `flow: 'recipe-create'`) and edit/delete form (`/recipes/:id/edit`, `flow: 'recipe-edit'`).
- [ ] Create `src/app/pages/admin-overview/` — table with `data-testid="admin-overview"` showing per-user recipe counts (`adminGuard`, `flow: 'admin-overview'`).
- [ ] Create `src/app/app.routes.ts` — wire all routes above with guards + `data.flow`; `''` → `/recipes`, `**` → redirect.
- [ ] Create `/admin/settings` page — lists `postgresql` and `minio` services each with a configured/unconfigured badge and per-service credential form (`adminGuard`). (No `placeholder_services`/`placeholder_integrations` present, so no activation banner required — see Open questions.)

## service_agent tasks
- [ ] Create `src/app/core/auth.service.ts` — `login`/`register`/`logout`, token stored in `localStorage`, `isAdmin`, `me()`.
- [ ] Create `src/app/core/auth.interceptor.ts` — attach `Authorization: Bearer <token>` to outgoing requests.
- [ ] Create `src/app/core/auth.guard.ts` (redirect to `/login`) and `src/app/core/admin.guard.ts` (redirect non-admins to `/recipes`).
- [ ] Create `src/app/core/recipe.service.ts` — CRUD against `${apiBase}/recipes` and `${apiBase}/recipes/:id`.
- [ ] Create `src/app/core/admin.service.ts` — `GET ${apiBase}/admin/overview`; plus admin settings read/write against `${apiBase}/admin/settings`.

## tester tasks
- [ ] Backend e2e: register → login returns JWT; `GET /api/recipes` without token → 401.
- [ ] Backend e2e: create "Banitsa" then `GET /api/recipes` list contains it; `GET/PATCH/DELETE` on another user's recipe → 404 (ownership scoping).
- [ ] Backend e2e: non-admin `GET /api/admin/overview` → 403; admin → 200 with recipe counts; `/api/health/deep` → 200 when DB up.
- [ ] Seed test: run seed, assert `SEED_CREDS_JSON` printed and both demo + admin accounts can log in.
- [ ] Frontend e2e: log in as demo user, create "Banitsa", assert an element with `data-testid="recipe-item"` appears.
- [ ] Frontend e2e: log in as admin, open `/admin`, assert `data-testid="admin-overview"`; verify page title/header contain "FaithfulG".
- [ ] Frontend e2e: unauthenticated visit to `/recipes` redirects to `/login`.
- [ ] Deploy smoke: through ingress, `/faithful-e2e-g/api/health` → 200 and SPA loads with correct base-href.

## Open questions
- **Infra tasks unassigned:** The spec's Steps 9–10 (`Dockerfile`, `docker-entrypoint.sh`, `k8s/postgres.yaml`, `k8s/deployment.yaml`, `kustomization.yaml`, delete `nginx.conf`) are container/K8s concerns with no matching pipeline agent (db/backend/ui/service/tester). Confirm which agent owns Docker + Kubernetes packaging, or whether it is handled outside this pipeline.
- **`minio` provisioned but unused:** `<spec_deployments>` includes `minio`, but the spec body never references object storage (no file/image uploads). Admin settings tasks include a `minio` credential form per the settings rules — confirm whether MinIO is actually needed or should be dropped.
- **`spec_integrations` is a parse artifact:** The single integration entry is literally "None (no third-party APIs/SDKs; PostgreSQL is first-party infra)" with a placeholder env key. No real integration client module was created (the spec's `## Integrations` section explicitly says "None"). Confirm this is intentional.
- **Admin creation policy:** `<auth_model>` is `full_auth`, but the spec mandates Admin exists **only via seed** and that `POST /api/auth/register` always creates `USER` (not first-signup-admin). Tasks follow the spec's explicit decision; confirm no public admin promotion path is expected.
- **`/admin/settings` vs spec:** The spec's admin surface is `/admin/overview` only; `/admin/settings` is added per the mechanical settings rules because `<spec_deployments>` is non-empty. Confirm the settings page is desired given the spec does not describe runtime-configurable credentials.
