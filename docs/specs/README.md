# Especificaciones SDD de Closer

Desarrollo guiado por especificaciones (*Spec-Driven Development*): cada funcionalidad se especificó **antes** de implementarla, con criterios de aceptación verificables y tareas técnicas. Las pruebas automatizadas citan el identificador del criterio que verifican (por ejemplo `CA-05.3`).

| Spec | Funcionalidad | Módulo backend | Estado |
|---|---|---|---|
| [SPEC-01](SPEC-01-autenticacion-onboarding.md) | Autenticación y onboarding | `identity` | Implementada |
| [SPEC-02](SPEC-02-biblioteca-prospectos.md) | Biblioteca de prospectos | `profiles` | Implementada |
| [SPEC-03](SPEC-03-iniciar-practica.md) | Iniciar práctica y token de voz | `practice` | Implementada |
| [SPEC-04](SPEC-04-llamada-y-coach.md) | Llamada de voz y coach en vivo | `practice` + `apps/web/lib/voice` | Implementada |
| [SPEC-05](SPEC-05-evaluacion.md) | Evaluación de la llamada | `practice` | Implementada |
| [SPEC-06](SPEC-06-historial-reintentos.md) | Historial, reintentos y progreso | `practice` | Implementada |
| [SPEC-07](SPEC-07-soporte.md) | Contacto con soporte | `support` | Implementada |
| [SPEC-08](SPEC-08-cache-rate-limit.md) | Caché y límites de uso (no funcional) | `shared` | Implementada |

## Plantilla

Cada especificación sigue la misma estructura:

1. **Objetivo**: qué problema resuelve, en una o dos oraciones.
2. **Historia de usuario**: "Como … quiero … para …" (referencia a las historias del Sprint 1).
3. **Criterios de aceptación**: `CA-XX.n`, en formato *Dado / Cuando / Entonces*.
4. **Reglas de negocio**: validaciones y límites.
5. **Contrato de API**: endpoints, entradas, salidas y errores (detalle completo en Swagger: `/api/docs`).
6. **Diseño**: dónde vive cada pieza según Clean Architecture (dominio, aplicación, infraestructura, presentación).
7. **Tareas técnicas**: lista verificable de lo que hubo que construir.
8. **Trazabilidad**: archivos de código y pruebas que la cubren.

## Convenciones

- Errores de la API: siempre `{ "error": "mensaje", "code": "codigo" }`; con 429 además `retryAfterSeconds`.
- Autenticación: todo endpoint exige `Authorization: Bearer <token>` salvo los marcados como públicos.
- Prefijo de la API: `/api/v1`.
