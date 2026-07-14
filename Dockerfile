# syntax=docker/dockerfile:1
# Single-container image for FaithfulG Recipe Box:
#   1) build the Angular SPA, 2) build the NestJS API, 3) one Node runtime that
#      serves the API under /api AND the compiled SPA (with SPA deep-link fallback)
#      on port 80. This matches the k8s Service (targetPort 80) and the
#      /faithful-e2e-g/* ingress (which strips the prefix before it reaches the pod).

# ---- Stage 1: build the Angular SPA ----
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY web/frontend/package*.json ./
RUN npm ci
COPY web/frontend/ ./
# base-href must stay /faithful-e2e-g/ — the ingress serves the app under that path.
RUN npx ng build --configuration production --base-href /faithful-e2e-g/

# ---- Stage 2: build the NestJS backend ----
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
# Install dev deps too (nest CLI + prisma) for the build; NODE_ENV is unset here.
RUN npm install --include=dev
COPY backend/ ./
# Generate the Prisma client (driver-adapter based, no native engine binary needed),
# then compile TypeScript → dist (main lands at dist/src/main.js).
RUN npx prisma generate && npm run build

# ---- Stage 3: runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# main.js sits at /app/dist/src/main.js → default join(__dirname,'..','..','client')
# resolves to /app/client, but we set it explicitly for clarity.
ENV CLIENT_DIST_PATH=/app/client

# Backend build output, node_modules (incl. prisma CLI + generated client), and the
# Prisma schema/migrations/config needed for `migrate deploy` at boot.
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/prisma ./prisma
COPY --from=backend /app/prisma.config.ts ./prisma.config.ts
COPY --from=backend /app/package.json ./package.json

# Compiled Angular SPA, served as static assets + SPA fallback by NestJS.
COPY --from=frontend /fe/dist/frontend/browser ./client

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["./docker-entrypoint.sh"]
