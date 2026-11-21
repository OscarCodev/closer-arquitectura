# Guía de despliegue (opción A: servicios administrados)

Arquitectura en producción:

```
Usuario ─► Cloudflare (DNS · TLS · CDN)
             ├─► app.<dominio> ─► Vercel (web Next.js)
             └─► api.<dominio> ─► Render (API NestJS, imagen Docker)
                                    ├─► Upstash (Redis: caché y límites)
                                    ├─► Supabase (PostgreSQL vía Supavisor + Auth)
                                    └─► Gemini (texto)
Navegador ─WSS─► Gemini Live (voz, con token efímero de la API)
```

Todo es gratuito, salvo el dominio (~US$10/año). **Ninguna clave se guarda en el repositorio**: cada una se pega directamente en el servicio que la usa.

Orden recomendado (cada paso usa datos del anterior):

| # | Servicio | Qué obtienes | Tiempo aprox. |
|---|---|---|---|
| 1 | Supabase | URL, claves, cadenas de conexión | 10 min |
| 2 | Google AI Studio | API key de Gemini | 3 min |
| 3 | Upstash | URL de Redis | 3 min |
| 4 | Render | API en `https://closer-api.onrender.com` | 15 min |
| 5 | GitHub (secretos) | Migraciones y despliegue automáticos | 5 min |
| 6 | Vercel | Web en `https://<proyecto>.vercel.app` | 10 min |
| 7 | Supabase Auth | Login con código y con Google | 10 min |
| 8 | Dominio + Cloudflare | `app.<dominio>` y `api.<dominio>` con CDN | 20 min + propagación |

Anota los valores en un lugar privado (no en el repo) a medida que los obtienes.

---

## 1. Supabase (base de datos y login)

1. Entra a https://supabase.com → **New project**.
   - Nombre: `closer`. Región: **East US (North Virginia)**, la misma región que usará Render.
   - Genera una contraseña de base de datos y **guárdala**.
2. Cuando termine de crearse, anota:
   - **Project URL**: *Project Settings → Data API* (o *API*): `https://<ref>.supabase.co` → `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL`.
   - **anon / publishable key**: *Project Settings → API Keys* → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (es pública, va en el navegador).
   - **Legacy JWT secret**: *Project Settings → JWT Keys* → *Legacy JWT Secret* → `AUTH_JWT_SECRET`. La API valida los tokens con este secreto o, si el proyecto firma con claves asimétricas, con las claves públicas de `SUPABASE_URL`; las dos vías ya están implementadas.
3. Cadenas de conexión: botón **Connect** (arriba) → pestaña de cadenas de conexión:
   - **Transaction pooler** (puerto **6543**). Agrégale al final `?pgbouncer=true&connection_limit=5` → `DATABASE_URL`.
   - **Session pooler** (puerto **5432**) → `DIRECT_DATABASE_URL`. Se usa solo para las migraciones.
   - En ambas reemplaza `[YOUR-PASSWORD]` por la contraseña del paso 1.

> No uses la *Direct connection* para `DIRECT_DATABASE_URL`: es solo IPv6 y GitHub Actions no siempre la alcanza. El *Session pooler* funciona por IPv4.

## 2. Gemini (Google AI Studio)

1. Entra a https://aistudio.google.com → **Get API key** → **Create API key** (en un proyecto nuevo, separado del MVP).
2. Anota la clave → `GEMINI_API_KEY`.

## 3. Upstash (Redis)

1. Entra a https://upstash.com → **Create Database** (Redis).
   - Región: **us-east-1**. Plan gratuito.
2. En la página de la base, copia la URL de conexión con TLS: `rediss://default:<password>@<host>.upstash.io:6379` → `REDIS_URL` (con **rediss**, doble *s*).

> No ejecutes pruebas de carga contra producción: el plan gratuito de Upstash tiene un límite de comandos y se agotaría.

## 4. Render (API)

1. Entra a https://render.com e inicia sesión con **GitHub**. Autoriza el repositorio `closer-arquitectura`.
2. **New → Blueprint** → elige `closer-arquitectura`. Render lee `render.yaml` y propone el servicio `closer-api`.
3. Completa las variables que pide:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Transaction pooler + `?pgbouncer=true&connection_limit=5` (paso 1) |
| `DIRECT_DATABASE_URL` | Session pooler (paso 1) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `AUTH_JWT_SECRET` | Legacy JWT secret |
| `REDIS_URL` | `rediss://…` de Upstash |
| `GEMINI_API_KEY` | Clave de Gemini |
| `CORS_ORIGINS` | Por ahora `https://closer.vercel.app` (se corrige en el paso 6 con la URL real de Vercel) |

4. **Apply**. La primera construcción tarda unos 5–10 minutos.
5. Copia el **Deploy Hook**: servicio `closer-api` → *Settings → Deploy Hook* → `RENDER_DEPLOY_HOOK_URL`.

La API todavía responderá con error en las rutas de datos porque la base está vacía. Las migraciones se aplican en el paso 5.

## 5. GitHub: secretos para migraciones y despliegue automático

En https://github.com/OscarCodev/closer-arquitectura → **Settings**:

1. **Environments → New environment** → nombre `production`.
2. Dentro de `production` → **Add environment secret**:
   - `PROD_DIRECT_DATABASE_URL` = Session pooler (la misma `DIRECT_DATABASE_URL`).
   - `RENDER_DEPLOY_HOOK_URL` = Deploy Hook de Render.
3. **Secrets and variables → Actions → Variables → New repository variable**:
   - `PROD_API_URL` = `https://closer-api.onrender.com/api/v1` (usa la URL real que muestra Render).
4. Ve a **Actions → CD → Run workflow** (rama `main`). El CD:
   - aplica las migraciones a Supabase (crea las tablas),
   - pide a Render que despliegue,
   - y prueba `GET /api/v1/health/ready` hasta que responda.

Comprueba en el navegador: `https://closer-api.onrender.com/api/v1/health/ready` debe mostrar `database` y `redis` en `up`. Swagger: `https://closer-api.onrender.com/api/docs`.

## 6. Vercel (web)

1. Entra a https://vercel.com e inicia sesión con **GitHub** → **Add New → Project** → importa `closer-arquitectura`.
2. **Root Directory**: `apps/web` (Vercel detecta Next.js y el monorepo).
3. **Environment Variables**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://closer-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_AUTH_MODE` | `supabase` |
| `NEXT_PUBLIC_VOICE_MODE` | `gemini` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |

4. **Deploy**. Al terminar, copia la URL (`https://<proyecto>.vercel.app`).
5. Vuelve a **Render → closer-api → Environment** y cambia `CORS_ORIGINS` por esa URL exacta (sin `/` final). Guarda; Render se reinicia solo.

## 7. Supabase Auth (login)

En Supabase → **Authentication**:

1. **URL Configuration**:
   - *Site URL*: `https://<proyecto>.vercel.app`
   - *Redirect URLs*: agrega `https://<proyecto>.vercel.app/auth/callback` y `http://localhost:3000/auth/callback`.
2. **Código por correo**: la pantalla de login pide un **código de 6 dígitos**. En *Emails → Templates*, en **Magic Link** y en **Confirm signup**, agrega al cuerpo `Tu código es: {{ .Token }}`.
3. **Google (opcional)**:
   - En https://console.cloud.google.com → *APIs & Services → Credentials → Create credentials → OAuth client ID* (tipo *Web application*).
   - *Authorized redirect URI*: `https://<ref>.supabase.co/auth/v1/callback`.
   - Copia *Client ID* y *Client secret* en Supabase → *Authentication → Sign In / Providers → Google*.
4. **Correos (recomendado)**: el envío incluido en el plan gratuito tiene un límite bajo por hora, pensado para pruebas. Para la presentación puedes usar Google o configurar un SMTP gratuito (Resend o Brevo) en *Authentication → Emails → SMTP Settings*.

Prueba: abre la URL de Vercel → **Iniciar sesión** → completa el onboarding → haz una práctica de voz (el navegador pedirá permiso de micrófono).

## 8. Dominio, DNS y CDN (Cloudflare)

1. Compra un dominio. Lo más simple es **Cloudflare Registrar** (dash.cloudflare.com → *Domain Registration*), porque el DNS queda en Cloudflare automáticamente. Si lo compras en otro registrador, agrégalo a Cloudflare (*Add a domain*, plan Free) y cambia los *nameservers* en el registrador por los que indique Cloudflare.
2. **Vercel → Project → Settings → Domains** → agrega `app.<dominio>`.
3. **Render → closer-api → Settings → Custom Domains** → agrega `api.<dominio>`.
4. **Cloudflare → DNS → Records**:

| Tipo | Nombre | Destino | Proxy |
|---|---|---|---|
| CNAME | `app` | `cname.vercel-dns.com` | Activado (nube naranja) |
| CNAME | `api` | `closer-api.onrender.com` | Activado (nube naranja) |

   Si Render o Vercel no logran verificar el dominio, desactiva el proxy (nube gris) hasta que lo verifiquen y vuelve a activarlo.
5. **Cloudflare → SSL/TLS → Overview** → modo **Full (strict)**.
6. Actualiza las URLs:
   - Vercel: `NEXT_PUBLIC_API_URL` = `https://api.<dominio>/api/v1` → **Redeploy**.
   - Render: `CORS_ORIGINS` = `https://app.<dominio>`.
   - Supabase Auth: *Site URL* y *Redirect URLs* con `https://app.<dominio>`.
   - GitHub: variable `PROD_API_URL` = `https://api.<dominio>/api/v1` y `PROD_WEB_URL` = `https://app.<dominio>`.

Con el proxy de Cloudflare activo, los archivos estáticos (`/_next/static/*`, con caché de un año) se sirven desde la CDN.

## Antes de presentar

- Render gratuito se **duerme tras 15 minutos sin uso** y tarda unos 50 s en despertar. Abre `https://api.<dominio>/api/v1/health/ready` unos minutos antes.
- Haz una práctica completa con voz real para confirmar micrófono, Gemini y evaluación.
- Comparte el repositorio con la docente si es privado (es público).

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La web muestra "No hay conexión con el servidor" | `NEXT_PUBLIC_API_URL` incorrecta o API dormida | Revisa la variable y redeploy; abre `/health/ready` |
| Error de CORS en la consola del navegador | `CORS_ORIGINS` no coincide exactamente con la URL de la web | Ponla sin `/` final y con `https` |
| `/health/ready` muestra `database: down` | Contraseña o cadena del pooler incorrecta | Revisa `DATABASE_URL` (puerto 6543 y `pgbouncer=true`) |
| `/health/ready` muestra `redis: down` | URL de Upstash sin TLS | Debe empezar con `rediss://` |
| 401 en todas las rutas tras iniciar sesión | `AUTH_JWT_SECRET` o `SUPABASE_URL` incorrectos | Revisa ambos en Render |
| Llega un enlace pero no un código | Plantilla de correo sin `{{ .Token }}` | Paso 7.2 |
| La voz no conecta | `GEMINI_API_KEY` inválida o modelo no disponible | Revisa la clave; el error aparece en los logs de Render |
