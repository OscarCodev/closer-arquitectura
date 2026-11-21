# ADR-008 · Caché y rate limiting con Redis

Estado: aceptada (noviembre de 2026). Reemplaza la nota de ADR-001 que descartaba Redis "sin una necesidad medida".

## Contexto

- Cada carga de `/setup` lee tres recursos del usuario: onboarding, biblioteca de prospectos e historial de sesiones. Cambian poco y se leen mucho.
- El backend corre con varias réplicas detrás de un balanceador (escalabilidad horizontal, criterio T8). Un rate limit en memoria, como el del MVP, deja pasar N veces el límite con N réplicas.
- La prueba de carga apunta a 2,000 usuarios virtuales concurrentes (Sprint 2). Postgres administrado (Supabase) tiene un número limitado de conexiones.

## Decisión

Redis compartido por todas las réplicas, detrás de dos puertos de la capa de aplicación:

| Puerto | Adaptador | Uso |
|---|---|---|
| `CachePort` | `RedisCacheAdapter` | Caché *cache-aside* de lecturas frecuentes |
| `RateLimiterPort` | `RedisRateLimiterAdapter` | Límites por usuario y por endpoint, compartidos entre réplicas |

### Qué se cachea

| Clave | Contenido | TTL | Se invalida cuando |
|---|---|---|---|
| `onboarding:{userId}` | Respuestas del onboarding (o `{none:true}` si no existe) | 15 min | `PUT /me/onboarding` |
| `profiles:{userId}` | Biblioteca de prospectos | 5 min | `POST`, `PATCH`, `DELETE /profiles` |
| `sessions:{userId}` | Historial (60 sesiones con sus intentos) | 2 min | Evaluar una llamada, renombrar o borrar una sesión |
| `user:known:{userId}` | Marca de que el usuario ya existe en la BD | 10 min | — (evita un `upsert` por petición) |

Prefijo real en Redis: `closer:cache:`. Rate limit: `closer:rl:{regla}:{usuario}` con ventana fija (`SET NX EX` + `INCR` en una transacción).

### Qué no se cachea

- Evaluaciones y tokens de voz: son escrituras o datos de un solo uso.
- Respuestas de la IA (coach, extracción): dependen del contenido exacto y su valor es inmediato.

## Consecuencias

- Las lecturas repetidas no tocan Postgres; la caché se mide en `GET /api/v1/health/metrics` (`hits`, `misses`, `hitRatio` por réplica).
- Consistencia: toda escritura borra la clave en la misma petición, así el usuario ve su cambio al instante. El TTL acota cualquier dato viejo si una invalidación fallara.
- Degradación controlada: si Redis no responde, la caché devuelve "sin dato" y se lee de Postgres; el rate limit deja pasar (*fail-open*) y lo registra.
- Nueva dependencia de infraestructura: Redis 7 en Docker (local) o Upstash / Render Key Value (producción).

## Verificación

Probado con la API local (noviembre de 2026):

- 3 × `GET /me`, 2 × `GET /profiles`, 2 × `GET /sessions` → 3 fallos y 4 aciertos (la primera lectura de cada recurso va a la BD).
- TTL observados en Redis: 299 s (prospectos) y 898 s (onboarding).
- Tras `PUT /me/onboarding` y `POST /profiles`, las claves correspondientes desaparecen y la siguiente lectura trae el dato nuevo.
