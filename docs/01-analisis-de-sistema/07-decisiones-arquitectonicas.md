# Decisiones arquitectónicas de Closer

Estado: **implementadas** (Sprints 2 y 3). Las decisiones del Sprint 1 se mantienen; la columna "Implementación" indica cómo se materializó cada una y las ADR-008 a ADR-010 se agregaron durante la construcción.

| ID | Decisión | Drivers | Justificación | Implementación |
|---|---|---|---|---|
| ADR-001 | Monolito modular para el backend | DA02, DA06 | Separar responsabilidades sin introducir coordinación distribuida inicial. | NestJS 11 con los módulos `identity`, `profiles`, `practice`, `support` y `health`, un solo despliegue. Escala horizontalmente con réplicas sin estado (ADR-009). |
| ADR-002 | Clean Architecture dentro de cada módulo | DA06 | Aislar reglas y casos de uso de proveedores. | Carpetas `domain/`, `application/`, `infrastructure/` y `presentation/` por módulo. ESLint impide que `domain` y `application` importen Prisma, Redis o Gemini. |
| ADR-003 | Separar streaming y gestión | DA01, DA05 | Evitar que la evaluación posterior interfiera con el audio. | REST (`/api/v1`) para la gestión; WSS directo navegador ↔ Gemini Live para la voz. |
| ADR-004 | Integraciones mediante puertos y adaptadores | DA04, DA06 | Normalizar errores y resultados de IA, pagos e identidad. | Puertos `ConversationAiPort` y `LiveVoicePort` con adaptadores Gemini y simulado (pruebas y k6), elegidos por configuración (`AI_PROVIDER`). |
| ADR-005 | PostgreSQL administrado por Supabase | DA03, DA07 | Conservar relaciones, estados y evaluaciones con consistencia. | Prisma con migraciones versionadas. Autorización en la aplicación: toda consulta filtra por el dueño (`userId` del JWT). |
| ADR-006 | Evaluación idempotente después del cierre | DA01, DA07 | Reintentar sin duplicar resultados ni bloquear la conversación. | Estados `IN_CALL`, `EVALUATING`, `COMPLETED` y `FAILED`; reserva atómica (*compare-and-set*) y recuperación de evaluaciones colgadas a los 2 minutos. |
| ADR-007 | Credenciales permanentes solo en servidor | DA03 | Evitar exposición de secretos en el navegador. | Token efímero de un solo uso con `liveConnectConstraints`: modelo, voz y prompt quedan fijados en el servidor. |
| ADR-008 | [Caché y rate limiting con Redis](../arquitectura/ADR-008-cache-redis.md) | DA02 | Lecturas frecuentes y límites que funcionen con varias réplicas. | Redis compartido: caché *cache-aside* con invalidación por escritura y límites por usuario. |
| ADR-009 | [Escalabilidad horizontal](../arquitectura/ADR-009-escalabilidad.md) | DA02 | Atender la concurrencia del Sprint 2 (k6 hasta 2,000 usuarios). | nginx con 3 réplicas de la API y 2 de la web; PgBouncer o Supavisor como pool de conexiones. |
| ADR-010 | Evaluación calculada solo en el servidor | DA03, DA07 | En el MVP el cliente enviaba el puntaje y podía falsificarse. | El navegador envía la transcripción; el dominio calcula el puntaje y lo guarda. Sin IA disponible no se inventa feedback: el intento queda `FAILED` y se reintenta. |

## Cambios respecto a la propuesta del Sprint 1

| Asunto pendiente en el Sprint 1 | Decisión tomada |
|---|---|
| Framework del backend "por definir" | NestJS 11 (módulos, inyección de dependencias, Swagger y pruebas integrados) |
| "No se incorpora Redis sin una necesidad medida" | Se incorporó (ADR-008): con varias réplicas, la caché y los límites deben ser compartidos |
| Alojamiento "por definir" | Imagen Docker publicada por el CD; Render, Railway o VPS con `docker-compose.prod.yml`. Web en Vercel |
| Mecanismo de acceso de voz "por validar" | Token efímero con restricciones (ADR-007) |
| Umbrales de carga "por validar" | Medidos con k6: ver [pruebas de carga](../pruebas/pruebas-carga.md) |
| Módulo "Planes y límites" (cuotas Free/Pro) | Congelado: el MVP tenía una vulnerabilidad que permitía cambiarse de plan desde el navegador. Los límites de uso los cubre el rate limiting (ADR-008) |

Supabase Storage sigue sin usarse: no se guarda audio (solo la transcripción).

## Trazabilidad

- [Drivers](06-driver-arquitectonicos.md)
- [Escenarios de calidad](08-escenarios-atributos-calidad.md)
- [Estilo](../02-arquitectura-software/estilo-arquitectonico.md)
- [Enfoque](../02-arquitectura-software/enfoque-aquitectonico.md)
- [Especificaciones SDD](../specs/README.md)
