# SPEC-07 · Contacto con soporte

## Objetivo

Que el vendedor reporte un problema desde la app; el mensaje siempre queda guardado y, si hay un canal configurado, se reenvía.

## Historia de usuario

Como vendedor, quiero avisar de un problema sin salir de la app, para que me ayuden rápido.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-07.1 | asunto y mensaje de al menos 10 caracteres | envía el formulario | el mensaje se guarda y ve "Mensaje enviado" |
| CA-07.2 | un webhook configurado (`SUPPORT_WEBHOOK_URL`) | se envía un mensaje | se reenvía con usuario, asunto, mensaje y ruta; `delivered: true` |
| CA-07.3 | sin webhook o con el webhook caído | se envía un mensaje | igual se guarda; `delivered: false` |
| CA-07.4 | un tercer envío en el mismo minuto | — | 429 con el mensaje "Espera un momento…" |
| CA-07.5 | la API no responde | se envía | se abre el correo del usuario como alternativa |

## Reglas de negocio

- Asunto máximo 200 caracteres, mensaje entre 10 y 5,000, ruta máximo 300.
- Límites: 2 por minuto y 8 por hora por usuario. Timeout del webhook: 5 s.

## Contrato de API

`POST /support/contacts` — entrada `{ subject, message, pagePath? }`, salida 201 `{ ok: true, delivered }`. Errores: 400, 401, 429.

## Diseño

| Capa | Pieza |
|---|---|
| Dominio | `support/domain/support-contact.ts` |
| Aplicación | `SendSupportContactUseCase`; puertos `SupportRepositoryPort`, `SupportNotifierPort` |
| Infraestructura | `PrismaSupportRepository`, `WebhookSupportNotifier` |
| Frontend | `app/setup/state/use-setup-modals.ts`, `contact-support-modal.tsx` |

## Tareas técnicas

- [x] Tabla `support_contacts`.
- [x] Persistencia antes del reenvío; fallo del webhook no pierde el mensaje.
- [x] Frontend: alternativa `mailto:` si la API no responde.

## Trazabilidad

- Código: `apps/api/src/modules/support/**`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
