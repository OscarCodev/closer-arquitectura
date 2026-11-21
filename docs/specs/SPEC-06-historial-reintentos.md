# SPEC-06 · Historial, reintentos y progreso

## Objetivo

Que el vendedor vea sus sesiones anteriores, compare intentos del mismo escenario (1/n, 2/n…) y siga su progreso.

## Historia de usuario

Como vendedor, quiero repetir el mismo escenario y ver si mejoro entre intentos, para practicar de forma deliberada.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-06.1 | un usuario con sesiones evaluadas | abre `/setup` | el historial lista sus sesiones, la más reciente primero (máx. 60) |
| CA-06.2 | una sesión sin intentos evaluados | se lista el historial | no aparece |
| CA-06.3 | un resultado en pantalla | pulsa "Reintentar llamada" | se inicia un intento nuevo en la misma sesión y luego se ve "2 de 2" |
| CA-06.4 | un usuario | renombra una sesión | el nombre persiste y ya no lo reemplaza el título automático |
| CA-06.5 | un usuario | elimina una sesión | desaparecen la sesión y sus intentos (cascada) |
| CA-06.6 | una sesión de otro usuario | se intenta ver, renombrar o borrar | 404 |
| CA-06.7 | una llamada recién evaluada | el usuario vuelve a `/setup` | la sesión aparece arriba y seleccionada sin recargar todo |
| CA-06.8 | la pestaña "Tu progreso" | el usuario tiene intentos | ve promedio, tendencia, radar y actividad de 28 días calculados de su historial |

## Reglas de negocio

- El historial solo incluye intentos `COMPLETED`, en orden cronológico dentro de cada sesión.
- La fuente de verdad es el servidor; `localStorage` solo guarda qué sesión estaba seleccionada.

## Contrato de API

| Método y ruta | Entrada | Salida | Errores |
|---|---|---|---|
| `GET /sessions` | — | `{ sessions: Session[] }` | 401 |
| `GET /sessions/:id` | — | `Session` | 401, 404 |
| `PATCH /sessions/:id` | `{ name }` | 204 | 400, 401, 404 |
| `DELETE /sessions/:id` | — | 204 | 401, 404 |
| `POST /simulations` | `{ sessionId }` | ver SPEC-03 | — |

## Diseño

| Capa | Pieza |
|---|---|
| Aplicación | `ListSessionsUseCase` (caché `sessions:{userId}`), `GetSessionUseCase`, `RenameSessionUseCase`, `DeleteSessionUseCase` |
| Infraestructura | `PrismaPracticeRepository.listSessions` (índice `user_id, updated_at desc`; filtra sesiones con intentos completados) |
| Presentación | `SessionsController` |
| Frontend | `app/setup/state/use-session-manager.ts`, `setup-sidebar.tsx`, `progress-dashboard.tsx`, `app/simulation/result/page.tsx` |

## Tareas técnicas

- [x] Listado con intentos completados y límite de 60.
- [x] Renombrar y borrar por entidad con verificación de dueño.
- [x] Reintento por `sessionId` (el escenario lo reutiliza el servidor).
- [x] Frontend: eliminar la sincronización de estado completo y la fusión con `localStorage`.
- [x] Frontend: actualización optimista con reversión en renombrar y borrar.

## Trazabilidad

- Código: `apps/api/src/modules/practice/application/sessions.use-cases.ts`, `.../presentation/sessions.controller.ts`, `apps/web/app/setup/state/use-session-manager.ts`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
