# Imagen de producción del backend de Closer.
# Se construye desde la RAÍZ del monorepo:  docker build -f apps/api/Dockerfile -t closer-api .

# ── 1. Dependencias completas y compilación ─────────────────────────
FROM node:26-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/api --ignore-scripts
COPY apps/api apps/api
RUN npx --workspace apps/api prisma generate \
 && npm run build -w apps/api

# ── 2. Solo dependencias de producción ──────────────────────────────
FROM node:26-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/api --omit=dev --ignore-scripts && mkdir -p apps/api/node_modules

# ── 3. Imagen final (sin código fuente ni herramientas de desarrollo) ─
FROM node:26-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=4000
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
# Dependencias que npm no pudo subir a la raíz por conflicto de versiones (p. ej. jose v5 vs v6)
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
# Cliente de Prisma generado en la etapa de compilación
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
