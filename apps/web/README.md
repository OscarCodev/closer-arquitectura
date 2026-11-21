# Closer — frontend (Next.js)

Interfaz de Closer. Habla con el backend (`apps/api`) por REST y con Gemini Live por WebSocket para la voz.

```bash
cp .env.example .env.local
npm run dev        # http://localhost:3000 (requiere la API en http://localhost:4000)
```

## Modos (variables en `.env.local`)

| Variable | Valores | Uso |
|---|---|---|
| `NEXT_PUBLIC_AUTH_MODE` | `dev` · `supabase` | `dev`: login local sin Supabase (cualquier código). `supabase`: Google y código por email reales |
| `NEXT_PUBLIC_VOICE_MODE` | `mock` · `gemini` | `mock`: llamada con guion, sin micrófono. `gemini`: voz real (requiere `AI_PROVIDER=gemini` en la API) |
| `NEXT_PUBLIC_API_URL` | URL | Backend, p. ej. `http://localhost:4000/api/v1` |

## Organización

```
app/                 pantallas (App Router): login, onboarding, /setup, /simulation, resultados
lib/api/             cliente HTTP tipado de la API (único punto de contacto con el backend)
lib/auth/            autenticación: Supabase o modo desarrollo, misma interfaz
lib/voice/           llamada de voz: Gemini Live o guion simulado, misma interfaz
lib/practice/        inicio de una práctica (un solo lanzador)
stores/              estado global (Zustand): sesión de auth, práctica activa, llamada en vivo
```

## Flujo

```
/ → /iniciar-sesion → /setup/onboarding (primera vez) → /setup
/setup → "Iniciar" → POST /simulations (token de voz) → /simulation
/simulation → "Colgar" → POST /simulations/:id/evaluate → /simulation/result
/simulation/result → "Reintentar" → POST /simulations { sessionId } (intento n+1)
```

El puntaje lo calcula y guarda el servidor; el navegador solo envía la transcripción.
