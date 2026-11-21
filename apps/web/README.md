# Closer — solo frontend (demo navegable)

Copia del frontend de `closer` **sin backend**: sin Supabase, sin Gemini, sin rutas `/api`, sin variables de entorno.
Todas las pantallas son las mismas que en la app real; lo que antes venía del servidor ahora sale de `mocks/`.

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## User flow

```
/ (landing)
 ├─ "Comienza gratis" ──▶ /comienza-gratis ─┐
 └─ "Iniciar sesión"  ──▶ /iniciar-sesion  ─┤  Google (instantáneo) o email + cualquier código
                                            ▼
                              /setup/onboarding  (solo la primera vez)
                                            ▼
                                       /setup  (app principal)
                                        ├─ Practicar: rellenar contexto/prospecto o "Autocompletar"
                                        │     └─ "Empezar práctica" ─▶ pantalla de carga ─▶ /simulation
                                        │            (llamada simulada con guion; "Consejo" da tips)
                                        │            └─ "Colgar" ─▶ análisis ─▶ /simulation/result
                                        │                  ├─ "Reintentar" ─▶ /simulation
                                        │                  └─ "Volver" ─▶ /setup
                                        ├─ Prospectos (biblioteca de perfiles guardados)
                                        ├─ Rendimiento (dashboard de progreso)
                                        ├─ Sesiones recientes (sidebar) ─▶ resultados de cada sesión
                                        └─ Menú de cuenta: configuración, contacto, plan, cerrar sesión ─▶ /iniciar-sesion
```

Páginas legales: `/terminos`, `/privacidad`.

## Qué está simulado (`mocks/`)

| Archivo | Sustituye a | Comportamiento |
|---|---|---|
| `mocks/supabase-client.ts` | `@supabase/ssr` (auth + tablas) | Usuario guardado en `localStorage`. Cualquier email/código vale. Las consultas a tablas no devuelven nada. |
| `mocks/api.ts` (`mockFetch`) | `app/api/*` | Perfiles y sesiones en `localStorage` (con sesiones de ejemplo de `mock-simulation-data.ts`); autocompletar, consejos y resultado devuelven datos de ejemplo. |
| `mocks/live-audio.ts` | Gemini Live (voz) | No usa micrófono: reproduce un guion de conversación y anima las ondas de audio. |

Para **empezar de cero** (volver a ver el onboarding), cierra sesión o borra el `localStorage` del sitio.

Lo que se quitó respecto al proyecto original: `app/api/`, `proxy.ts` (protección de rutas en servidor), `supabase/`, `utils/supabase/`, `lib/security/`, `lib/billing/user-usage.ts` y las dependencias `@supabase/*` y `@google/genai`. La protección de rutas sigue funcionando en cliente (si no hay sesión, `/setup` te manda a login).
