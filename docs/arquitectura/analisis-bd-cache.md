# Análisis de la base de datos y de la estrategia de caché

Este documento reúne cómo se comporta la persistencia de Closer y por qué se cachea lo que se cachea. Se apoya en el código, en [ADR-008](ADR-008-cache-redis.md) y en las mediciones de las [pruebas de carga](../pruebas/pruebas-carga.md).

## 1. Patrón de acceso

Closer es un sistema **de muchas lecturas y pocas escrituras por usuario**:

| Operación | Frecuencia | Tipo | Tabla principal |
|---|---|---|---|
| Ver panel, historial y biblioteca | Cada vez que se abre la app o se vuelve al menú | Lectura | `practice_sessions`, `simulations`, `prospect_profiles` |
| Consultar el onboarding (¿ya lo completó?) | En cada inicio de sesión y navegación | Lectura | `onboarding_profiles` |
| Iniciar una práctica | Varias veces por sesión | Escritura (2 filas) | `practice_sessions`, `simulations` |
| Evaluar una llamada | Una vez por práctica | Escritura (transacción) | `simulations`, `practice_sessions` |
| Guardar perfiles u onboarding | Ocasional | Escritura | `prospect_profiles`, `onboarding_profiles` |

En la prueba de carga oficial, el 84 % de las peticiones fueron de gestión (lecturas): 316,758 de 376,696.

## 2. Modelo de datos e índices

Esquema: [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma). Todas las consultas filtran por el usuario dueño, así que los índices empiezan por `user_id` y siguen con el orden en que se muestran los datos:

| Tabla | Índice | Consulta que atiende |
|---|---|---|
| `practice_sessions` | `(user_id, updated_at DESC)` | Historial: últimas 60 sesiones, la más reciente primero |
| `simulations` | `(session_id, created_at)` | Intentos de una sesión, en orden |
| `simulations` | `(user_id, created_at DESC)` | Buscar un intento verificando que pertenece al usuario |
| `prospect_profiles` | `(user_id, updated_at DESC)` | Biblioteca de prospectos |
| `support_contacts` | `(user_id, created_at DESC)` | Contactos de soporte del usuario |
| `onboarding_profiles` | PK `user_id` | Una fila por usuario |

Decisiones de diseño:

- **Límites de tamaño en las columnas** (`VARCHAR(1400)` para prospecto y contexto, `VARCHAR(120)` para nombres) alineados con las validaciones de los DTO: la base rechaza lo que la API no debería aceptar.
- **JSON para resultados de la evaluación** (`metrics`, `conversation`, `analysis`): se escriben una vez y se leen completos, nunca se filtran por dentro, así que no conviene normalizarlos en tablas.
- **Borrado en cascada** desde `users`: eliminar un usuario elimina todo lo suyo.
- **El historial solo trae intentos `COMPLETED`** y como máximo 60 sesiones (`SESSIONS_LIST_LIMIT`), así la respuesta no crece sin límite.

## 3. Concurrencia y consistencia

| Situación | Riesgo | Solución en el código |
|---|---|---|
| Dos peticiones evalúan la misma llamada a la vez (doble clic, reintento de red) | Gastar la IA dos veces y guardar dos resultados | **Compare-and-set**: `claimForEvaluation` hace un `UPDATE ... WHERE status = esperado AND status_changed_at = esperado`; solo una petición cambia la fila, la otra recibe 409. Probado en integración (CA-05.4). |
| Una evaluación queda colgada (el proceso se cae) | La llamada nunca se puede reevaluar | `status_changed_at` permite detectar evaluaciones `EVALUATING` de más de 2 minutos y volver a intentarlas (`decideEvaluation`). |
| Guardar la evaluación toca 3 filas | Quedar a medias | **Transacción en lote** (`$transaction([...])`): las tres escrituras viajan juntas. La versión interactiva vencía a los 5 s bajo carga (hallazgo de k6). |
| La IA falla | Guardar un feedback inventado | La simulación pasa a `FAILED` con el motivo; no se guarda puntaje y se puede reintentar. |

## 4. Conexiones a PostgreSQL

Cada réplica de la API abre un pool de Prisma. Sin control, 3 réplicas × N conexiones agotan PostgreSQL. Por eso hay un *pooler* delante:

| Entorno | Camino | Configuración |
|---|---|---|
| Local / escalado (Docker Compose) | API → **PgBouncer** (modo *transaction*) → PostgreSQL | 25 conexiones lógicas por réplica, 40 conexiones reales de PgBouncer |
| Producción | API (Render) → **Supavisor** de Supabase (puerto 6543) → PostgreSQL | `?pgbouncer=true&connection_limit=5` |
| Migraciones | Conexión directa de sesión (puerto 5432) | Solo en el CD (`prisma migrate deploy`) |

Medido con k6 a 2,000 usuarios: miles de peticiones concurrentes usaron **41 conexiones reales** a PostgreSQL. En el pico el pool de PgBouncer se satura y esa espera explica la cola de latencia (p99 de 12.6 s), mientras el p95 se mantiene en 579 ms.

## 5. Seguridad de los datos

- **Row Level Security activado en todas las tablas** ([ADR-011](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)): la Data API pública de Supabase no puede leer nada; todo pasa por el backend.
- **El dueño sale del token verificado**, nunca del cuerpo de la petición: cada consulta del repositorio incluye `userId` en el `WHERE`.

## 6. Estrategia de caché

Patrón **cache-aside** con Redis compartido por todas las réplicas (`CachePort` → `RedisCacheAdapter`):

1. Se busca la clave en Redis.
2. Si no está (*miss*), se consulta PostgreSQL y se guarda con un TTL.
3. Toda escritura **borra la clave en la misma petición**, así el usuario ve su cambio al instante.

| Clave | TTL | Por qué ese TTL | Se invalida en |
|---|---|---|---|
| `onboarding:{userId}` | 15 min | Casi nunca cambia y se consulta en cada navegación | `PUT /me/onboarding` |
| `profiles:{userId}` | 5 min | Cambia poco | Crear, editar o borrar un perfil |
| `sessions:{userId}` | 2 min | Cambia con cada práctica evaluada | Evaluar, renombrar o borrar una sesión |
| `user:known:{userId}` | 10 min | Evita un `upsert` del usuario en cada petición | — |

**Qué no se cachea, a propósito**: el estado de las simulaciones y las evaluaciones (deben ser exactos para la idempotencia), los tokens de voz (son de un solo uso) y las respuestas de la IA (dependen del contenido exacto).

**Si Redis falla**, la caché responde "sin dato" y la app lee de PostgreSQL, y el rate limit deja pasar y lo registra (*fail-open*). La aplicación se vuelve más lenta, pero no se cae.

### Rate limiting en el mismo Redis

Ventana fija por usuario y endpoint (`SET NX EX` + `INCR` en una transacción), compartida por todas las réplicas. Por ejemplo, evaluar tiene un límite de 4 por minuto y 24 por hora, e iniciar llamadas de 6 por minuto y 40 por hora. Protege el costo de la IA y la base de datos ante abuso.

## 7. Resultados medidos

Prueba oficial con 2,000 usuarios virtuales ([resultados](../pruebas/resultados-k6-2000vus/resumen.md)):

| Métrica | Valor | Lectura |
|---|---|---|
| Aciertos de caché por réplica | 85.6 %, 85.5 %, 85.4 % (≈ 255,000 aciertos) | 6 de cada 7 lecturas no tocaron PostgreSQL |
| Conexiones reales a PostgreSQL | 41 como máximo | El pooler protegió la base |
| CPU de PostgreSQL | 80 % máx. | Cerca del límite del hardware en el pico |
| CPU de Redis | 13 % máx. | Redis está lejos de ser el cuello de botella |
| Gestión (lecturas): p95 | 579 ms | Cumple EQ-03 (< 1 s) |
| Errores de gestión | 0 de 316,758 | — |

Los contadores se consultan en vivo en `GET /api/v1/health/metrics` (`hits`, `misses`, `hitRatio` por réplica).

## 8. Conclusiones y siguientes pasos

- El cuello de botella bajo carga es **PostgreSQL** (CPU y pool), no la API ni Redis. La caché es lo que permite llegar a 2,000 usuarios con un solo servidor de base de datos.
- Para crecer: ampliar el pool junto con los recursos de PostgreSQL, agregar **réplicas de lectura** para el historial y más réplicas de la API ([ADR-009](ADR-009-escalabilidad.md)).
- En producción gratuita, Upstash tiene un límite diario de comandos: por eso las pruebas de carga se hacen en el entorno Docker y no contra producción.
