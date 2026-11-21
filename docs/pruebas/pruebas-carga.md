# Pruebas de carga con k6

Objetivo (Sprint 2): validar el atributo de calidad **EQ-03 (escalabilidad)** simulando progresivamente hasta **2,000 usuarios virtuales concurrentes**.

Criterio de aceptación de EQ-03: la API de gestión mantiene **p95 ≤ 1 s** y **errores técnicos < 1 %**.

## Qué se prueba

**Sistema bajo prueba:** el stack de producción replicado (`infra/docker-compose.prod.yml`): nginx → 3 réplicas de la API + 2 de la web, Redis compartido y PostgreSQL detrás de PgBouncer. La IA usa el adaptador simulado (`AI_PROVIDER=fake`). Se mide nuestra arquitectura, no la latencia de Gemini, que se mide aparte (EQ-01) y además costaría dinero.

**Comportamiento de cada usuario virtual** (`infra/k6/carga.js`). Cada uno tiene su propia cuenta, así los límites por usuario funcionan como en la realidad, y en bucle:

1. Abre el panel: `GET /me`, `/me/onboarding`, `/sessions`, `/profiles` (tráfico de **gestión**).
2. Piensa entre 3 y 7 s.
3. En el 25 % de las vueltas hace una **práctica completa**: guarda el prospecto, inicia la llamada, pide un consejo y evalúa.

**Rampa:** 5 % → 25 % → 50 % → 100 % de `MAX_VUS` en 7 minutos, 2 minutos sostenidos en el pico y 1 minuto de bajada.

**Herramientas:**

| Archivo | Uso |
|---|---|
| `infra/k6/humo.js` | 5 usuarios, 30 s: valida el stack antes de la carga |
| `infra/k6/carga.js` | Rampa hasta `MAX_VUS` con umbrales de EQ-03 |
| `infra/k6/lib/report.js` | Reporte en Markdown + JSON (`infra/k6/results/`) |
| `infra/k6/monitor.sh` | CPU y memoria por contenedor y conexiones a PostgreSQL cada 10 s |
| `.github/workflows/carga.yml` | Ejecuta todo en un runner Linux de GitHub (manual, con `MAX_VUS` configurable) |

## Hallazgos y correcciones

Las primeras ejecuciones revelaron tres defectos reales que no aparecían con poca carga:

| # | Síntoma | Causa | Corrección |
|---|---|---|---|
| 1 | 123 respuestas 502 y "no live upstreams" en nginx | Node cierra las conexiones inactivas a los 5 s; nginx reutilizaba conexiones que Node estaba cerrando | `keepAliveTimeout` de 65 s en la API y la web, y `keepalive_timeout 30s` en nginx (nginx cierra primero) |
| 2 | Evaluaciones fallidas: "Transaction already closed" | La transacción interactiva de Prisma superaba su límite de 5 s esperando conexión | Transacción en lote (`$transaction([...])`) sin idas y vueltas |
| 3 | Errores P2024 (sin conexión libre en el pool) | Pool de Prisma de 10 conexiones por réplica | 25 por réplica hacia PgBouncer (conexiones lógicas baratas) y pool real de PgBouncer de 40 |

También se detectó un problema del entorno: en Windows, el reenvío de puertos de Docker Desktop corta en silencio las conexiones keep-alive inactivas y se pierden peticiones antes de llegar a nginx. No ocurre en Linux. Para pruebas locales en Windows existe la opción `WINDOWS_DOCKER=1`.

## Resultados

### 1. Laptop de desarrollo (Windows, i3-8145U de 4 hilos, 3.9 GB de RAM, Docker con 1.9 GB), 300 usuarios virtuales

k6 y los 9 contenedores comparten la misma máquina, así que es un escenario muy desfavorable.

Medido en el servidor (log de nginx, peticiones que llegaron al stack), después de las correcciones:

| Métrica | Resultado | EQ-03 |
|---|---|---|
| Peticiones atendidas | 11,830 | — |
| Errores del servidor | 1 (0.008 %) | ✅ < 1 % |
| Gestión (GET panel): p50 / p95 / p99 | 22 ms / **822 ms** / 2,046 ms | ✅ p95 ≤ 1 s |
| Toda la API: p50 / p95 / p99 | 31 ms / 1,072 ms / 2,592 ms | — |
| Prácticas completas evaluadas | 748 | — |
| Aciertos de caché (Redis), por réplica | 75 %, 75 %, 77 % | — |
| Conexiones reales a PostgreSQL (máx.) | 22 | — |
| CPU máxima por réplica de la API | 62 %, 79 %, 99 % | — |

Del lado del cliente, k6 registró 35 % de errores: ~6,300 peticiones expiraron a los 30 s **sin llegar a nginx**. Es la limitación de red de Docker Desktop descrita arriba, no un error del sistema. Por eso esta ejecución valida el servidor pero no es la medición oficial.

### 2. Runner Linux de GitHub Actions, 2,000 usuarios virtuales (medición oficial)

Se ejecuta con `.github/workflows/carga.yml` (Actions → "Prueba de carga (k6)" → Run workflow). El resumen con tiempos, umbrales, CPU y memoria por contenedor queda en la página del run, y los archivos completos como artefacto `resultados-k6-2000vus`.

*Pendiente de ejecución.*
