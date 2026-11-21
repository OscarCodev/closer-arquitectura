# SPEC-08 · Caché y límites de uso (requisito no funcional)

## Objetivo

Reducir la carga sobre PostgreSQL en las lecturas frecuentes y proteger el costo de la IA con límites que funcionen igual con una o con muchas réplicas del backend. Decisión de arquitectura: [ADR-008](../arquitectura/ADR-008-cache-redis.md).

## Atributos de calidad relacionados

- Escalabilidad (EQ-03) y rendimiento de la API de gestión.
- Seguridad y control de costos (límites por usuario).

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-08.1 | un usuario | lee dos veces seguidas prospectos, historial u onboarding | la segunda lectura sale de Redis (acierto visible en `/health/metrics`) |
| CA-08.2 | un recurso en caché | el usuario lo modifica | la clave se borra en la misma petición y la siguiente lectura trae el dato nuevo |
| CA-08.3 | dos réplicas del backend | un usuario supera un límite repartiendo peticiones entre ambas | el límite se aplica al total (contador compartido en Redis) |
| CA-08.4 | Redis caído | llegan peticiones | la API sigue respondiendo desde PostgreSQL y lo registra (degradación controlada) |
| CA-08.5 | cualquier réplica | se consulta `GET /health/metrics` | devuelve aciertos, fallos y tasa de aciertos de la caché, memoria y tiempo activo |

## Reglas

| Recurso | TTL | Invalidación |
|---|---|---|
| Onboarding | 15 min | `PUT /me/onboarding` |
| Prospectos | 5 min | escrituras en `/profiles` |
| Historial | 2 min | evaluar, renombrar o borrar |

Límites por endpoint (por usuario): ver cada especificación. Respuesta al superar: 429, `Retry-After` y `retryAfterSeconds`.

## Diseño

| Capa | Pieza |
|---|---|
| Aplicación | Puertos `CachePort` y `RateLimiterPort` (`shared/application/ports`) |
| Infraestructura | `RedisCacheAdapter` (cache-aside, contadores), `RedisRateLimiterAdapter` (ventana fija atómica) |
| Presentación | `@RateLimit(...)` + `RateLimitGuard` global; `GET /health/metrics` |

## Tareas técnicas

- [x] Redis 7 en Docker Compose con política `allkeys-lru` y 256 MB.
- [x] Caché *cache-aside* con TTL e invalidación por escritura.
- [x] Rate limit distribuido (reemplaza el `Map` en memoria del MVP).
- [x] Métricas de caché por réplica.
- [x] Degradación controlada si Redis no está disponible.

## Trazabilidad

- Código: `apps/api/src/shared/**`, casos de uso de `profiles`, `practice` e `identity`.
- Verificación manual: [ADR-008 § Verificación](../arquitectura/ADR-008-cache-redis.md#verificación).
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
