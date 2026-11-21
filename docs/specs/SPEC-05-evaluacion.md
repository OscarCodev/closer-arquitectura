# SPEC-05 · Evaluación de la llamada

## Objetivo

Al colgar, evaluar la conversación turno por turno y calcular un puntaje **en el servidor**, con un proceso idempotente y sin inventar feedback cuando la IA falla (ADR-006).

## Historia de usuario

Como vendedor, quiero saber qué hice bien, qué hice mal y qué debí decir en cada turno, para mejorar en el siguiente intento.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-05.1 | un intento `IN_CALL` con al menos un intercambio | se envía la transcripción | el intento pasa a `COMPLETED` con puntaje, turnos evaluados, métricas de voz y radar de 5 habilidades |
| CA-05.2 | el cliente envía un puntaje en el cuerpo | se evalúa | se ignora: el puntaje lo calcula el servidor |
| CA-05.3 | un intento ya `COMPLETED` | se vuelve a enviar la evaluación (aun con otra transcripción) | se devuelve el resultado guardado, sin reevaluar |
| CA-05.4 | dos peticiones simultáneas para el mismo intento | llegan a la vez | solo una evalúa; la otra recibe 409 |
| CA-05.5 | la IA no responde tras 3 intentos o su salida es inválida | se evalúa | el intento queda `FAILED`, se responde 502 y el usuario puede reintentar **sin repetir la llamada** |
| CA-05.6 | una transcripción sin intercambios | se evalúa | 400 y el intento queda `FAILED` |
| CA-05.7 | la IA omite la evaluación de un turno | se arma el resultado | ese turno aparece como "Sin evaluación"; los demás no se desplazan (se emparejan por número) |
| CA-05.8 | la primera evaluación de una sesión | se completa | la sesión toma el título sugerido "Prospecto: tema" si su nombre era automático |
| CA-05.9 | una evaluación que queda en `EVALUATING` más de 2 minutos | se reintenta | se permite evaluar de nuevo (recuperación de reservas vencidas) |

## Reglas de negocio

- Estados: `IN_CALL → EVALUATING → COMPLETED` o `→ FAILED → (reintento) EVALUATING`.
- Reserva atómica (*compare-and-set*): `UPDATE … WHERE status = esperado AND status_changed_at = esperado`.
- Puntaje global = 50 % turnos + 35 % habilidades + 15 % métricas de voz. Puntos por turno: crítico 20, mejorable 55, neutro 72, brillante 92.
- La IA debe cubrir al menos el 50 % de los turnos y devolver 5 valores de habilidad válidos.
- Transcripción acotada: máximo 400 items y 24,000 caracteres; va delimitada como datos en el prompt (mitigación de *prompt injection*).
- Muletillas contadas: eh, em, mmm, o sea, digamos, tipo ("este" y "pues" se quitaron por falsos positivos).
- Duración aceptada: 0 a 660 segundos.
- Límites: 4 evaluaciones/minuto y 24/hora por usuario.

## Contrato de API

`POST /simulations/:id/evaluate` — entrada `{ transcript: [{ role, text, startedAt?, endedAt? }], durationSeconds }`.

Salida 200: `{ session: Session, simulation: Simulation }` (misma forma que los tipos del frontend: `metrics`, `conversation[]`, `analysis.voice`, `analysis.skills`, `transcript`).

Errores: 400, 401, 404, 409, 429, 502.

## Diseño

| Capa | Pieza |
|---|---|
| Dominio | `transcript.ts` (sanear, fusionar, numerar turnos), `evaluation.ts` (`assembleEvaluation`), `scoring.ts`, `voice-metrics.ts`, `session-title.ts`, `practice-session.ts` (`decideEvaluation`) |
| Aplicación | `EvaluateSimulationUseCase` |
| Infraestructura | `GeminiConversationAiAdapter.evaluate` (JSON Schema, temperatura 0.1, 3 intentos con backoff), `PrismaPracticeRepository.claimForEvaluation/complete/fail` |
| Frontend | `app/simulation/page.tsx` (pantalla "Reintentar evaluación"), `app/setup/ui/results-dashboard.tsx` |

## Tareas técnicas

- [x] Máquina de estados y reserva atómica en el repositorio.
- [x] Turnos numerados enviados a la IA y salida estructurada con `turn`.
- [x] Eliminar el feedback heurístico de respaldo y la "corrección" de transcripción con IA.
- [x] Puntaje calculado en el dominio a partir de la salida de la IA.
- [x] Frontend: pantalla de error con reintento de la evaluación.
- [x] Frontend: corregir hooks condicionales en `results-dashboard.tsx`.

## Trazabilidad

- Código: `apps/api/src/modules/practice/domain/**`, `.../application/evaluate-simulation.use-case.ts`, `.../infrastructure/ai/**`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
