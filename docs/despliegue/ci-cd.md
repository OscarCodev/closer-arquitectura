# CI/CD con GitHub Actions

Cada push pasa por **integración continua** (CI). Si el push es a `main` y el CI termina en verde, corre el **despliegue continuo** (CD). Un commit que rompe una prueba nunca llega a producción.

```
push / pull request
   │
   ▼
CI (.github/workflows/ci.yml)
   ├── api  · lint → tipos → migraciones → unitarias + integración + cobertura (mínimos) → build
   ├── web  · lint → tipos → build de producción
   └── e2e  · (si api y web pasan) builds de producción + Playwright en Chromium
   │
   ▼  solo rama main y CI en verde
CD (.github/workflows/cd.yml)
   image ─► migrate ─► deploy-api ─► deploy-web ─► smoke
```

## CI: qué se verifica

| Job | Pasos | Servicios | Artefactos |
|---|---|---|---|
| `api` | `npm ci`, ESLint (incluye las reglas de capas de Clean Architecture), `tsc`, `prisma migrate deploy` sobre base vacía, Jest unitarias + integración con cobertura mínima (80 % líneas), `nest build` | PostgreSQL 16, Redis 7 | `cobertura-api` (HTML + lcov); resumen de cobertura en la página del run |
| `web` | `npm ci`, ESLint, `tsc`, `next build` | — | — |
| `e2e` | Builds de producción de API y web, `playwright install chromium`, 4 escenarios E2E | PostgreSQL 16, Redis 7 | `reporte-playwright` (HTML, capturas, video y traza de los fallos) |

Configuración sin secretos: la IA usa el adaptador simulado (`AI_PROVIDER=fake`), la voz el guion (`NEXT_PUBLIC_VOICE_MODE=mock`) y el login el modo desarrollo. El CI no gasta créditos de Gemini ni necesita Supabase.

Otras medidas:

- `concurrency`: un push nuevo cancela el CI anterior de la misma rama.
- Caché de `npm` entre ejecuciones (`actions/setup-node` con `cache: npm`).
- Dependabot (`.github/dependabot.yml`): PRs semanales de dependencias npm y mensuales de Actions y Docker; cada PR pasa por este mismo CI.

## CD: cómo se despliega

| Job | Qué hace | Se ejecuta si existe |
|---|---|---|
| `image` | Construye `apps/api/Dockerfile` (multi-stage, usuario sin privilegios, healthcheck) y la publica en GitHub Container Registry como `ghcr.io/<usuario>/closer-api:latest` y `:<sha>` | Siempre (usa el `GITHUB_TOKEN`) |
| `migrate` | `prisma migrate deploy` contra la base de producción (solo aplica migraciones pendientes, nunca borra datos) | Secreto `PROD_DIRECT_DATABASE_URL` |
| `deploy-api` | Render: llama al *deploy hook* con la imagen nueva · Railway: `railway up` · VPS: `docker compose pull && up -d` por SSH | `RENDER_DEPLOY_HOOK_URL`, o `RAILWAY_TOKEN`, o `VPS_HOST` + `VPS_USER` + `VPS_SSH_KEY` |
| `deploy-web` | `vercel pull/build/deploy --prod` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| `smoke` | Espera a que `GET /health/ready` responda (PostgreSQL y Redis arriba) y que la web devuelva 200 | Variables `PROD_API_URL`, `PROD_WEB_URL` |

Los jobs `migrate`, `deploy-api` y `deploy-web` usan el *environment* `production` de GitHub: ahí se guardan los secretos y, si se quiere, se puede exigir aprobación manual antes de desplegar.

## Configuración en GitHub (una sola vez)

1. **Settings → Environments → New environment**: `production`.
2. **Secretos del environment `production`** (solo los del proveedor elegido):

| Secreto | De dónde sale |
|---|---|
| `PROD_DIRECT_DATABASE_URL` | Supabase → Project Settings → Database → *Direct connection* o *Session pooler* |
| `RENDER_DEPLOY_HOOK_URL` | Render → servicio de la API → Settings → *Deploy Hook* |
| `RAILWAY_TOKEN` | Railway → Project Settings → Tokens |
| `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` | IP del servidor, usuario y clave privada SSH |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `.vercel/project.json` después de `npx vercel link` en `apps/web` |

3. **Variables** (Settings → Variables → Actions): `PROD_API_URL` (p. ej. `https://api.tu-dominio.com/api/v1`) y `PROD_WEB_URL`.
4. **Branch protection** para `main`: exigir que los checks `API · lint, tipos, pruebas y cobertura`, `Web · lint, tipos y build` y `E2E · Playwright` pasen antes de hacer merge.

Las variables de entorno de la API en producción (Supabase, Gemini, Redis) se configuran en el proveedor de hosting, no en GitHub; ver `apps/api/.env.example`.

## Verificación local del pipeline

Antes de subir los workflows se ejecutaron en local los mismos pasos (noviembre de 2026):

| Paso del CI | Resultado local |
|---|---|
| Sintaxis de `ci.yml`, `cd.yml`, `dependabot.yml` | Válida (parser YAML) |
| Lint y tipos de API y web | Sin errores |
| Unitarias + integración con cobertura | 146 pruebas, 97.6 % de líneas (mínimo 80 %) |
| `next build` de la web | Compila; 13 rutas |
| E2E en modo CI (builds de producción, `CI=1`) | 4 de 4 escenarios pasan (2.4 min) |
| `docker build -f apps/api/Dockerfile .` | Construye; la imagen arranca con `NODE_ENV=production` |

Comprobaciones de la imagen Docker de la API en modo producción:

- `GET /health/ready`: PostgreSQL y Redis `up`; `HEALTHCHECK` de Docker en estado `healthy`.
- Sin token → 401; Swagger disponible en `/api/docs`.
- `POST /auth/dev-token` → 404 (el login de desarrollo no existe en producción), y con `AUTH_DEV_LOGIN=true` la API se niega a arrancar.
- Corre con el usuario `node` (sin privilegios) y no contiene el código fuente, solo `dist/`.
- Hallazgo corregido: `jose` v5 queda en `apps/api/node_modules` (Supabase usa v6 en la raíz); la imagen ahora copia también esa carpeta.

Pendiente de la fase 7: `infra/docker-compose.prod.yml` (réplicas de la API detrás de nginx), que usa el despliegue por VPS.
