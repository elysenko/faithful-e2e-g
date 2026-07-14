# FaithfulG Recipe Box

A recipe collection app. Authenticated users create, list, edit, and delete their
own recipes (title, ingredients, steps). Admins get a read-only overview of every
user's recipe count at `/admin`.

## Stack

- **Backend:** NestJS + Prisma (PostgreSQL), JWT auth (`bcryptjs`) — `backend/`
- **Frontend:** Angular (standalone components) — `web/frontend/`
- **Packaging:** single container — NestJS serves the REST API under `/api` and the
  compiled Angular SPA (with deep-link fallback) on port 80.

## Layout

```
backend/         NestJS API (auth, recipes, admin, health) + Prisma schema/seed
web/frontend/    Angular SPA (approved UI)
Dockerfile       Multi-stage: build SPA → build API → single runtime image (port 80)
docker-entrypoint.sh   migrate deploy → seed (idempotent) → start
k8s/             Deployment (probes on /api/health), Service (80), Ingress (/faithful-e2e-g)
```

## Local development

```bash
# Backend (needs a reachable Postgres in DATABASE_URL, plus JWT_SECRET, JWT_EXP)
cd backend
npm install
export DATABASE_URL="postgresql://user:pass@host:5432/app"
export JWT_SECRET="dev-secret" JWT_EXP="1d"
npx prisma migrate deploy      # apply migrations
node prisma/seed/seed.js       # seed demo User + Admin (prints SEED_CREDS_JSON=...)
npm run build && node dist/src/main.js   # serves on PORT (default 80)

# Frontend (dev server with proxy to the API)
cd web/frontend
npm install
npm start
```

For production, `npm run build` in `web/frontend` produces `dist/frontend/browser`,
which the container copies to `/app/client` and NestJS serves.

## API surface

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET|POST /api/recipes` · `GET|PATCH|DELETE /api/recipes/:id` (JWT; owner-scoped)
- `GET /api/admin/overview` (JWT + `admin` role)
- `GET /api/health` · `GET /api/health/deep`
