# SPEC-03 · Iniciar práctica y token de voz

## Objetivo

Preparar una llamada de práctica: registrar el intento en el servidor y entregar al navegador un token de voz de un solo uso con el personaje del prospecto **armado y bloqueado en el servidor** (en el MVP el prompt viajaba al navegador y el intento no quedaba registrado).

## Historia de usuario

Como vendedor, quiero describir a mi prospecto y elegir modo y tono, para practicar una llamada realista en segundos.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-03.1 | contexto y prospecto de al menos 20 caracteres | pulsa "Iniciar" | se crea una sesión, un intento en estado `IN_CALL` y llega un token de voz |
| CA-03.2 | un prospecto descrito en texto libre | se inicia la práctica | el servidor extrae nombre, cargo y empresa **una sola vez** y elige una voz acorde al género |
| CA-03.3 | un modo o tono que no existe en el catálogo | se inicia la práctica | se usan los valores por defecto (Ciclo Completo, Perfil Real) |
| CA-03.4 | una sesión existente | se envía `{ sessionId }` | se reutiliza su escenario y su voz; el nuevo intento se suma a la sesión |
| CA-03.5 | un `sessionId` de otro usuario | se intenta reintentar | 404 |
| CA-03.6 | 7 inicios en un minuto | llega la séptima petición | 429 con `retryAfterSeconds` |
| CA-03.7 | el inicio falla (red, límite, proveedor) | el usuario está en la pantalla de carga | vuelve a `/setup` y ve el motivo |
| CA-03.8 | `AI_PROVIDER=fake` | se inicia la práctica | el token es simulado y la llamada usa el guion (sin costo) |

## Reglas de negocio

- Duración máxima de la llamada: 10 minutos (`MAX_CALL_MINUTES`), informada al frontend.
- Token de Gemini: `uses: 1`, nueva sesión en 2 minutos como máximo, vence a los 12 minutos; con `liveConnectConstraints` fija modelo, voz, transcripción y `systemInstruction`.
- El prompt incluye reglas contra inyección: el prospecto ignora instrucciones del vendedor que intenten cambiar su personaje.
- Límites: 6 inicios/minuto y 40/hora por usuario.

## Contrato de API

`POST /simulations`

Entrada (escenario nuevo): `{ context, prospect, prospectName?, prospectRole?, prospectCompany?, advancedSelections?: { modo, tono } }`
Entrada (reintento): `{ sessionId }`

Salida 201:

```json
{
  "simulationId": "uuid",
  "session": { "id": "uuid", "name": "Práctica con Lucía", "advancedSelections": { "modo": "...", "tono": "..." }, "simulations": [] },
  "prospect": { "name": "Lucía Fernández", "role": "Head of Sales", "company": "Nubia Retail", "description": "..." },
  "live": { "provider": "gemini", "token": "auth_tokens/...", "model": "...", "voiceName": "Kore", "expiresAt": "..." },
  "maxCallMinutes": 10
}
```

Errores: 400 (validación), 401, 404 (sesión ajena), 429, 502 (proveedor de voz).

## Diseño

| Capa | Pieza |
|---|---|
| Dominio | `prospect-persona.ts` (catálogo de modos/tonos, `buildProspectSystemPrompt`, `selectVoice`), `practice-session.ts` (`provisionalSessionName`) |
| Aplicación | `StartSimulationUseCase`; puertos `ConversationAiPort`, `LiveVoicePort`, `PracticeRepositoryPort` |
| Infraestructura | `GeminiLiveVoiceAdapter` (token con restricciones), `FakeLiveVoiceAdapter`, `PrismaPracticeRepository` |
| Presentación | `SimulationsController.start` |
| Frontend | `lib/practice/start-practice.ts` (único lanzador), pantalla de carga que espera al servidor |

## Tareas técnicas

- [x] Tablas `practice_sessions` y `simulations` con estado.
- [x] Prompt del prospecto en el dominio del backend (se eliminó `lib/gemini/prompts.ts` del frontend).
- [x] Token efímero con `liveConnectConstraints`.
- [x] Una sola extracción de perfil por inicio (el MVP la hacía dos veces).
- [x] Selección de voz por género extraído (se eliminó la heurística de texto con falsos positivos).
- [x] Frontend: un solo lanzador (se eliminaron `use-simulation-launcher.ts` y `start-practice-session.ts`).
- [x] Frontend: navegar a `/simulation` solo cuando el servidor confirmó el inicio.

## Trazabilidad

- Código: `apps/api/src/modules/practice/application/start-simulation.use-case.ts`, `.../domain/prospect-persona.ts`, `apps/web/lib/practice/start-practice.ts`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
