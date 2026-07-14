#!/bin/sh
# Container entrypoint: wait for Postgres, apply migrations, seed (idempotent),
# then start the NestJS server (which also serves the Angular SPA).
set -e

echo "[entrypoint] Waiting for the database to accept connections..."
i=0
until node -e "const {Pool}=require('pg');new Pool({connectionString:process.env.DATABASE_URL}).query('SELECT 1').then(()=>process.exit(0)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 40 ]; then
    echo "[entrypoint] Database still unreachable after ~80s — aborting so the pod restarts."
    exit 1
  fi
  echo "[entrypoint] DB not ready yet (attempt $i)..."
  sleep 2
done
echo "[entrypoint] Database is reachable."

# Apply pending migrations. A failure here MUST crash the container (set -e) so
# the readiness probe never marks a broken schema as ready.
echo "[entrypoint] Applying migrations (prisma migrate deploy)..."
npx prisma migrate deploy

# Seed demo User + Admin (idempotent upsert). Emits SEED_CREDS_JSON=... which the
# post-deploy agent parses to surface demo logins. Non-fatal: startup proceeds.
echo "[entrypoint] Seeding demo data (idempotent)..."
node prisma/seed/seed.js || echo "[entrypoint] Seed step failed (non-fatal) — continuing startup."

echo "[entrypoint] Starting NestJS (serves API on /api and the Angular SPA)..."
exec node dist/src/main.js
