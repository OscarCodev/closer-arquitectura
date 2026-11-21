# ADR-009 · Escalabilidad horizontal del frontend, el backend y la base de datos

Estado: aceptada (noviembre de 2026). Complementa ADR-001 (monolito modular) y ADR-008 (Redis).

## Contexto

- El atributo de calidad EQ-03 exige que la API de gestión siga siendo usable cuando crece la concurrencia, y el Sprint 2 pide demostrarlo con k6 hasta 2,000 usuarios virtuales.
- Un solo proceso Node atiende las peticiones en un único hilo: escalar verticalmente tiene un techo bajo y deja un punto único de falla.
- PostgreSQL tiene un número limitado de conexiones (100 en local; Supabase limita según el plan). Cada réplica de la API abre su propio pool.

## Decisión

### Backend: réplicas sin estado detrás de un balanceador

La API no guarda estado en memoria entre peticiones:

| Estado | Dónde vive | Por eso cualquier réplica puede atender |
|---|---|---|
| Identidad | JWT firmado (se valida en cada réplica, sin sesión en servidor) | ✔ |
| Datos | PostgreSQL | ✔ |
| Caché y límites de uso | Redis compartido (ADR-008) | ✔ |
| Evaluación en curso | Estado `EVALUATING` en la BD con reserva atómica (ADR-006) | ✔ |

Con eso se ejecutan **3 réplicas** (`api-1`, `api-2`, `api-3`) detrás de **nginx** con `least_conn` (menos conexiones activas primero), `max_fails` y `proxy_next_upstream` para *failover*, `keepalive` hacia las réplicas y límites de recursos por contenedor (1 CPU, 512 MB). Agregar capacidad = agregar réplicas.

### Frontend: réplicas + CDN

- Las 13 rutas de Next.js se generan como estáticas; los archivos `/_next/static/*` llevan hash y se sirven con `Cache-Control: immutable` (1 año), así Cloudflare los entrega desde el borde sin tocar el servidor.
- En el VPS: **2 réplicas** de la web (imagen *standalone*) detrás del mismo nginx. En Vercel: escalado automático y CDN propio.
- Web y API comparten dominio (`/` y `/api/`): no hay CORS ni *preflight* extra por petición.

### Base de datos

| Técnica | Implementación |
|---|---|
| Pool de conexiones por réplica | `connection_limit` en `DATABASE_URL` (5 en producción, 10 en pruebas) |
| *Pooler* delante de PostgreSQL | PgBouncer en modo transacción (local, hasta 2,000 clientes sobre un pool de 30 conexiones); en Supabase, su pooler Supavisor (puerto 6543). Prisma usa `pgbouncer=true` |
| Índices para las consultas frecuentes | `prospect_profiles (user_id, updated_at desc)`, `practice_sessions (user_id, updated_at desc)`, `simulations (session_id, created_at)` y `(user_id, created_at desc)`, `support_contacts (user_id, created_at desc)` |
| Menos lecturas | Caché en Redis de onboarding, prospectos e historial (ADR-008) |
| Consultas acotadas | Historial: 60 sesiones; biblioteca: 200 prospectos; transcripción: 400 turnos / 24,000 caracteres |
| Escrituras seguras con concurrencia | *Compare-and-set* para reservar evaluaciones; `updateMany`/`deleteMany` filtrados por dueño |
| Evolución del esquema | Migraciones versionadas (`prisma migrate deploy` en el CD, nunca destructivo) |

Siguiente paso si la carga lo exige (no implementado): réplicas de lectura de PostgreSQL para el historial, y particionar `simulations` por fecha.

### Rate limiting en dos niveles

1. **nginx**, por IP: 50 peticiones/s con ráfaga de 100 (las redes privadas quedan exentas). Detrás de Cloudflare, la IP real se toma de `CF-Connecting-IP` solo si la petición viene de los rangos de Cloudflare, para que no se pueda falsificar.
2. **API**, por usuario y endpoint, con el contador compartido en Redis (ADR-008).

## Consecuencias

- La capacidad crece agregando réplicas; la caída de una réplica no corta el servicio.
- Redis y PostgreSQL pasan a ser los componentes compartidos: se monitorean con `GET /health/ready` y `GET /health/metrics`.
- Más piezas que operar: se documentan en `infra/docker-compose.prod.yml` y se despliegan con el CD.

## Verificación (21 de noviembre de 2026)

Stack local `infra/docker-compose.prod.yml` (perfil `local-db`): 3 API + 2 web + nginx + Redis + PostgreSQL + PgBouncer. Script reproducible: `bash infra/scripts/verificar-escalabilidad.sh`.

| Prueba | Resultado |
|---|---|
| Reparto de 30 peticiones a `/health/live` | 9 / 9 / 12 entre las 3 réplicas |
| 10 peticiones a la web | 10 × 200 (2 réplicas) |
| Un usuario atendido por 3 réplicas distintas | Ve siempre sus datos (estado compartido) |
| Límite de soporte (2/min) con envíos repartidos entre réplicas (CA-08.3) | 201, 201, 429, 429: el límite es global |
| *Failover*: `api-2` detenida, 20 peticiones | 20 × 200, atendidas por las otras dos réplicas |
| Pruebas E2E a través de nginx (puerto 8080) | 4 de 4 escenarios pasan (uno se repitió tras un reinicio de conexión momentáneo del puerto) |
| Capacidad con k6 | Ver informe de la fase 8 |
