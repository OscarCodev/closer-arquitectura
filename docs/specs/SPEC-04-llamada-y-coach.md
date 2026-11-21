# SPEC-04 · Llamada de voz y coach en vivo

## Objetivo

Conversar por voz con el prospecto simulado con baja latencia y, si el vendedor lo pide, recibir un consejo para su siguiente turno.

## Historia de usuario

Como vendedor, quiero hablar con un prospecto realista y pedir ayuda en el momento, para aprender mientras practico.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-04.1 | un token de voz válido | se abre `/simulation` | el navegador se conecta directo con Gemini Live (sin pasar audio por el backend) |
| CA-04.2 | la conexión lista y la página montada | se inicia la conversación | el prospecto contesta primero ("¿Aló?") según su instrucción de sistema |
| CA-04.3 | el prospecto está hablando | el vendedor lo interrumpe | la reproducción se corta al instante (*barge-in*) |
| CA-04.4 | la llamada conectada | pasa el tiempo | el cronómetro avanza solo mientras hay conexión |
| CA-04.5 | el cronómetro llega a 10 minutos | — | la llamada se cierra y se evalúa sola |
| CA-04.6 | el prospecto terminó su turno hace más de 0,5 s | el vendedor pide "Consejo" | recibe una sugerencia breve basada en el contexto **guardado en el servidor** |
| CA-04.7 | la llamada ya fue evaluada | se pide un consejo para ese intento | 409 `conflict` |
| CA-04.8 | `NEXT_PUBLIC_VOICE_MODE=mock` | se abre `/simulation` | se reproduce un guion sin micrófono (pruebas E2E y demos) |

## Reglas de negocio

- El audio del micrófono se agrupa en lotes de ~40 ms antes de enviarse (el MVP enviaba ~125 mensajes por segundo).
- El consejo usa como máximo los últimos 12 turnos; si hay menos de 2, devuelve un consejo genérico sin llamar a la IA.
- Límites del coach: 18 por minuto y 180 por hora por usuario.

## Contrato de API

| Método y ruta | Entrada | Salida | Errores |
|---|---|---|---|
| `POST /simulations/:id/coach` | `{ transcript: [{ role, text }] }` (máx. 400 items) | `{ tip }` | 401, 404, 409, 429 |

La conexión de voz es WebSocket entre navegador y Google (ADR-003); el backend solo emite el token (SPEC-03).

## Diseño

| Capa | Pieza |
|---|---|
| Aplicación | `CoachTipUseCase` (lee el escenario de la sesión, no del cliente) |
| Infraestructura | `GeminiConversationAiAdapter.coachTip` (JSON Schema), `FakeConversationAiAdapter` |
| Frontend | `lib/voice/voice-session.ts` (interfaz), `gemini-live-session.ts`, `scripted-voice-session.ts`; `app/simulation/page.tsx`; `state/use-simulation-timer.ts` |

## Tareas técnicas

- [x] Interfaz `VoiceSession` con dos implementaciones (Gemini Live y guion).
- [x] Conexión con token bloqueado: el navegador ya no envía el prompt.
- [x] Lotes de audio de 40 ms.
- [x] Inicio de la conversación solo con la página montada (pendiente si el audio aún no está listo).
- [x] Cronómetro atado a la conexión y corte automático al límite.
- [x] Coach con contexto del servidor y validación de estado del intento.

## Trazabilidad

- Código: `apps/web/lib/voice/**`, `apps/web/app/simulation/**`, `apps/api/src/modules/practice/application/ai-assist.use-cases.ts`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
