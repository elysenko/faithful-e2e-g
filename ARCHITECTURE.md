# Architecture

## Scaffolded Platforms

| Platform | Status | Directory |
|---|---|---|
| `backend` | ✅ Newly scaffolded | `backend/` |
| `web` | ✅ Newly scaffolded | `web/` (frontend: `web/frontend/`, backend stub: `web/backend/`) |

## Stack

- **Primary API**: NestJS + Prisma/PostgreSQL — `backend/`
- **Frontend**: Angular 19 (standalone components) — `web/frontend/`
- **Packaging**: Single-container — NestJS serves Angular dist + REST API
- **Auth**: JWT (Bearer, `localStorage`), `bcrypt` password hashing
- **Database**: PostgreSQL 16, Prisma ORM

## Directory Map

```
/
├── backend/            ← NestJS API (template-backend)
│   ├── prisma/         ← Prisma schema + seed + migrations
│   ├── src/            ← NestJS source (auth, recipes, admin, health)
│   ├── nest-cli.json
│   └── package.json
├── web/                ← Web stack (template-web)
│   ├── frontend/       ← Angular 19 SPA
│   │   ├── angular.json
│   │   └── src/
│   └── backend/        ← Lightweight NestJS reference (see backend/ for primary)
├── k8s/                ← Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── postgres.yaml   ← (to be created)
├── kustomization.yaml
├── Dockerfile          ← (to be replaced with multi-stage build)
├── colossus.yaml       ← Build manifest for deploy agents
└── .colossus-acceptance.json
```

## Template Sources

- `backend/` copied from `/app/scaffold-templates/template-backend/`
- `web/` copied from `/app/scaffold-templates/template-web/`

## Next Steps for Developer

1. **Edit `backend/.env`** (or create from `.env.example`): set `DATABASE_URL` and `JWT_SECRET`
2. **Run Postgres**: `docker-compose up -d` (or use the K8s postgres.yaml once created)
3. **Run migrations**: `cd backend && npx prisma migrate dev`
4. **Seed database**: `cd backend && npx prisma db seed`
5. **Build Angular**: `cd web/frontend && npm install && ng build --base-href /faithful-e2e-g/`
6. **Run backend**: `cd backend && pnpm install && pnpm run start:dev`
7. **Dockerfile**: Replace existing static-serve Dockerfile with multi-stage build per the plan
8. **K8s**: Add `k8s/postgres.yaml` and update `kustomization.yaml`
