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

Ejecutada el 21 de noviembre de 2026 con `.github/workflows/carga.yml` ([run #1](https://github.com/OscarCodev/closer-arquitectura/actions/runs/44959807408)) en un runner estándar `ubuntu-latest`, con k6 y el stack completo en la misma máquina. Archivos del resultado: [`resultados-k6-2000vus/`](resultados-k6-2000vus/resumen.md).

**Resultado: cumple EQ-03.** Los 5 umbrales pasaron.

| Métrica | Resultado | Umbral | |
|---|---|---|---|
| Usuarios virtuales concurrentes (pico) | 2,000 | — | |
| Peticiones totales | 376,696 (608 req/s) | — | |
| Iteraciones / prácticas completas evaluadas | 74,528 / 18,614 | — | |
| **Gestión: p95** | **579 ms** (mediana 108 ms, p90 412 ms) | p95 < 1 s | ✅ |
| **Gestión: errores** | **0 de 316,758** | < 1 % | ✅ |
| Práctica (iniciar, coach, evaluar): p95 | 943 ms (mediana 219 ms) | p95 < 3 s | ✅ |
| Práctica: errores | 0.057 % (32 respuestas 429) | < 1 % | ✅ |
| Checks funcionales | 99.97 % | > 99 % | ✅ |

Los 32 errores son respuestas 429 del límite de evaluaciones por usuario (4 por minuto): la protección funcionando, no fallas del sistema.

**Comportamiento de los componentes** (máximos durante la prueba):

| Componente | CPU máx. | Memoria máx. | Observación |
|---|---|---|---|
| API (3 réplicas) | 81 %, 83 %, 85 % | 102–120 MB | Carga repartida de forma pareja |
| PostgreSQL | 80 % | 202 MB | Crece con la carga, igual que la API |
| PgBouncer | 28 % | 12 MB | 41 conexiones reales a PostgreSQL |
| nginx | 23 % | 65 MB | Lejos de su límite |
| Redis | 13 % | 67 MB | Aciertos de caché: 85.4–85.6 % en cada réplica |
| Web (2 réplicas) | 16 %, 24 % | 41–54 MB | El tráfico de la prueba es casi todo API |

**Lectura de los resultados:**

- **La caché hizo su trabajo**: 85.5 % de las lecturas de onboarding, biblioteca e historial salieron de Redis (≈ 255,000 aciertos), sin tocar PostgreSQL.
- **El pool de conexiones protegió a la base de datos**: miles de peticiones concurrentes usaron solo 41 conexiones reales a PostgreSQL.
- **Dónde está el límite**: desde la mitad de la rampa las conexiones reales se estabilizan en 41 (el pool de 40 de PgBouncer más el monitor), es decir, el pool queda saturado en el pico. Eso explica la cola de latencia: el p99 de gestión llega a 12.6 s porque algunas peticiones esperan turno en PgBouncer, aunque el 95 % responde en menos de 0.6 s. Con la API y PostgreSQL por encima del 80 % de CPU, 2,000 usuarios sostenidos están cerca del máximo de este hardware.
- **Próximos pasos para más capacidad** (no requeridos por EQ-03): ampliar el pool de PgBouncer junto con los recursos de PostgreSQL, agregar réplicas de la API en otro servidor, y réplicas de lectura de PostgreSQL para el historial (ADR-009).
