# SPEC-02 · Biblioteca de prospectos

## Objetivo

Guardar los prospectos con los que el vendedor practica para reutilizarlos. Cada cambio es una operación por entidad (el MVP reenviaba la lista completa, y dos pestañas podían borrarse datos entre sí).

## Historia de usuario

Como vendedor, quiero guardar y editar los perfiles de mis clientes, para practicar con ellos sin volver a escribirlos.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-02.1 | un usuario que inicia una práctica con texto libre | pulsa "Iniciar" | el prospecto se guarda en su biblioteca |
| CA-02.2 | un prospecto recién guardado | termina la extracción de IA | se completan nombre y "cargo en empresa" |
| CA-02.3 | un usuario en la pestaña Perfiles | edita y guarda un prospecto | el cambio persiste al recargar |
| CA-02.4 | un usuario | elimina un prospecto | desaparece de la lista y del servidor (204) |
| CA-02.5 | un usuario B | intenta editar o borrar un prospecto de A | recibe 404 y el prospecto de A no cambia |
| CA-02.6 | una descripción vacía o de más de 1,400 caracteres | se intenta guardar | 400 `validation_error` |
| CA-02.7 | el servidor rechaza un cambio | el usuario editó o borró | la interfaz revierte el cambio optimista y muestra el error |

## Reglas de negocio

- `prospect` obligatorio; `prospect` y `context` máximo 1,400 caracteres.
- Si no se envía `name`, se usa `personName` o los primeros 40 caracteres de la descripción.
- Valores como "unknown", "n/a" o "-" se tratan como vacíos.
- Máximo 200 prospectos devueltos por usuario, ordenados por última modificación.

## Contrato de API

| Método y ruta | Entrada | Salida | Errores |
|---|---|---|---|
| `GET /profiles` | — | `{ profiles: Profile[] }` | 401 |
| `POST /profiles` | `{ prospect, context, name?, personName?, roleCompany? }` | `Profile` (201) | 400, 401, 429 |
| `PATCH /profiles/:id` | campos parciales | `Profile` | 400, 401, 404, 429 |
| `DELETE /profiles/:id` | — | 204 | 401, 404, 429 |
| `POST /assist/extract-profile` | `{ prospect }` | `{ name, role, company, gender }` | 401, 429 |

## Diseño

| Capa | Pieza |
|---|---|
| Dominio | `profiles/domain/prospect-profile.ts` (`buildProfileInput`) |
| Aplicación | `List/Create/Update/DeleteProfileUseCase`; puerto `ProfileRepositoryPort`; caché `profiles:{userId}` |
| Infraestructura | `PrismaProfileRepository` (filtra siempre por `userId`) |
| Presentación | `ProfilesController` con rate limit `profiles-write` (60/min) |
| Frontend | `app/setup/state/use-profile-manager.ts` (actualización optimista con reversión) |

## Tareas técnicas

- [x] Tabla `prospect_profiles` con índice `(user_id, updated_at desc)`.
- [x] CRUD por entidad con verificación de dueño en cada consulta.
- [x] Invalidación de caché en cada escritura.
- [x] Extracción de nombre/cargo en segundo plano tras guardar.
- [x] Frontend: reemplazar el `PUT` de lista completa por llamadas por entidad.

## Trazabilidad

- Código: `apps/api/src/modules/profiles/**`, `apps/web/app/setup/state/use-profile-manager.ts`, `apps/web/app/setup/ui/profiles-library-tab.tsx`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
