# SPEC-01 · Autenticación y onboarding

## Objetivo

Que el vendedor entre con Google o con un código por correo y, la primera vez, complete un onboarding de 5 pasos que personaliza la práctica. El onboarding tiene **una sola fuente de verdad** en el servidor (el MVP lo guardaba en dos lugares que se desincronizaban).

## Historia de usuario

Como vendedor nuevo, quiero registrarme rápido y contar mi contexto (rol, industria, a quién vendo), para que las prácticas se adapten a mí.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-01.1 | un visitante sin sesión | entra a `/setup` | es redirigido a `/iniciar-sesion` |
| CA-01.2 | un usuario que inicia sesión por primera vez | termina el login | va a `/setup/onboarding` |
| CA-01.3 | un usuario con onboarding completo | inicia sesión | va directo a `/setup` |
| CA-01.4 | un usuario en el onboarding | envía el formulario sin nombre | ve un error y no se guarda nada (400) |
| CA-01.5 | un usuario que edita su perfil desde Ajustes | guarda y recarga la página | ve los cambios guardados |
| CA-01.6 | una petición sin token o con token inválido/expirado | llama a cualquier endpoint protegido | recibe 401 `unauthenticated` |
| CA-01.7 | una petición con campos no declarados | llama a `PUT /me/onboarding` | recibe 400 (lista blanca de campos) |

## Reglas de negocio

- La identidad la emite Supabase Auth. El backend valida el JWT localmente: HS256 con el *JWT secret* o RS256/ES256 con las claves públicas (JWKS) del proyecto.
- El `id` del usuario siempre sale del token verificado, nunca del cuerpo de la petición (EQ-04).
- Cada campo del onboarding se recorta a 200 caracteres. `firstName` es obligatorio.
- Login de desarrollo (`POST /auth/dev-token`): solo con `AUTH_DEV_LOGIN=true` y nunca en producción (la API no arranca si se intenta).

## Contrato de API

| Método y ruta | Entrada | Salida | Errores |
|---|---|---|---|
| `GET /me` | — | `{ id, email, onboardingCompleted }` | 401 |
| `GET /me/onboarding` | — | `{ onboarding: {...} \| null }` | 401 |
| `PUT /me/onboarding` | `OnboardingDto` (14 campos) | `{ onboarding }` | 400, 401 |
| `POST /auth/dev-token` *(público, solo desarrollo)* | `{ email }` | `{ accessToken, userId, expiresIn }` | 404 si está deshabilitado |

## Diseño

| Capa | Pieza |
|---|---|
| Dominio | `identity/domain/onboarding.ts` (`normalizeOnboarding`), `authenticated-user.ts` |
| Aplicación | `AuthenticateUseCase`, `GetOnboardingUseCase`, `SaveOnboardingUseCase`; puertos `TokenVerifierPort`, `UserRepositoryPort` |
| Infraestructura | `SupabaseJwtVerifier` (jose), `PrismaUserRepository` |
| Presentación | `AuthGuard` global + `@Public()`, `@CurrentUser()`, `MeController`, `DevAuthController` |
| Frontend | `lib/auth/auth-client.ts` (Supabase o desarrollo), `stores/use-auth-store.ts`, `lib/auth/post-login.ts` |

## Tareas técnicas

- [x] Verificador de JWT de Supabase con soporte HS256 y JWKS.
- [x] Guard global de autenticación con decorador `@Public()`.
- [x] Alta automática del usuario en la tabla `users` en su primera petición (marcada en caché).
- [x] Tabla `onboarding_profiles` y endpoints `GET`/`PUT /me/onboarding`.
- [x] Frontend: cliente de autenticación intercambiable (Supabase / desarrollo).
- [x] Frontend: redirecciones según `onboardingCompleted` del servidor (no `user_metadata`).
- [x] Corregir el modal de Ajustes para que guarde en el servidor.

## Trazabilidad

- Código: `apps/api/src/modules/identity/**`, `apps/web/lib/auth/**`, `apps/web/stores/use-auth-store.ts`.
- Pruebas: ver [matriz de pruebas](../pruebas/matriz-pruebas.md).
