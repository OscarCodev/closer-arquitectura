# Estrategia y matriz de pruebas

Cada criterio de aceptación (`CA-XX.n`) de las [especificaciones SDD](../specs/README.md) tiene al menos una prueba automatizada que lo cita en su nombre.

## Niveles de prueba

| Nivel | Herramienta | Qué prueba | Dependencias | Comando |
|---|---|---|---|---|
| Unitarias (dominio) | Jest | Reglas puras: transcripción, puntaje, métricas de voz, evaluación, estados, validaciones | Ninguna | `npm run test -w apps/api` |
| Unitarias (aplicación) | Jest + dobles en memoria | Casos de uso con repositorios, caché e IA falsos (posible gracias a los puertos de Clean Architecture) | Ninguna | `npm run test -w apps/api` |
| Unitarias (infraestructura) | Jest + SDK simulado | Adaptadores de Gemini, webhook, Redis caído, filtro de errores | Ninguna | `npm run test -w apps/api` |
| Integración | Jest + Supertest | API completa por HTTP contra PostgreSQL y Redis reales | Docker (`npm run infra:up`) | `npm run test:integration -w apps/api` |
| End to End | Playwright (Chromium) | Flujos del usuario en el navegador: login, onboarding, práctica, evaluación, reintento, biblioteca | API + web en marcha | `npm run test:e2e -w apps/web` |
| Cobertura | Jest | Unitarias + integración combinadas | Docker | `npm run test:cov:all -w apps/api` → `apps/api/coverage/index.html` |

Para que las pruebas no tengan costo ni dependan de terceros: la IA usa el adaptador simulado (`AI_PROVIDER=fake`), la voz usa el guion (`NEXT_PUBLIC_VOICE_MODE=mock`) y el login usa el modo desarrollo.

## Resultados (21 de noviembre de 2026)

| Suite | Pruebas | Resultado |
|---|---|---|
| Unitarias (13 archivos) | 127 | Todas pasan |
| Integración (1 archivo) | 19 | Todas pasan |
| End to End (4 escenarios) | 4 | Todas pasan |
| Carga con k6 (2,000 usuarios) | 5 umbrales | Todos cumplen ([detalle](pruebas-carga.md)) |

Cobertura combinada (unitarias + integración) del backend:

| Métrica | Cobertura | Umbral exigido |
|---|---|---|
| Líneas | 97.6 % | 80 % |
| Sentencias | 96.2 % | 80 % |
| Funciones | 96.5 % | 75 % |
| Ramas | 74.5 % | 65 % |

## Matriz criterio → prueba

| Criterio | Unitaria | Integración | E2E |
|---|---|---|---|
| CA-01.1 Sin sesión → login | | | `closer.e2e.spec.ts` › sin sesión… |
| CA-01.2 / CA-01.3 Onboarding y reingreso | | | `closer.e2e.spec.ts` › usuario nuevo… |
| CA-01.4 Nombre obligatorio | `validation-rules.spec.ts` | `api.integration-spec.ts` › onboarding | |
| CA-01.5 Ajustes persisten | `application-use-cases.spec.ts` › onboarding guardado | `api.integration-spec.ts` › onboarding | |
| CA-01.6 Token inválido → 401 | | `api.integration-spec.ts` › sin token / firma inválida | |
| CA-01.7 Campos extra → 400 | | `api.integration-spec.ts` › onboarding | |
| CA-02.1 Prospecto guardado al practicar | `application-use-cases.spec.ts` | | `closer.e2e.spec.ts` › biblioteca |
| CA-02.3 Edición persiste | `application-use-cases.spec.ts` | `api.integration-spec.ts` › CRUD | |
| CA-02.4 Eliminar | | `api.integration-spec.ts` › CRUD | `closer.e2e.spec.ts` › biblioteca |
| CA-02.5 Aislamiento entre usuarios | `application-use-cases.spec.ts` | `api.integration-spec.ts` › CRUD | |
| CA-02.6 Límite de 1,400 caracteres | `validation-rules.spec.ts` | `api.integration-spec.ts` › CRUD | |
| CA-03.1 Inicio con token y prompt del servidor | `practice-use-cases.spec.ts`, `gemini-adapters.spec.ts` | `api.integration-spec.ts` › inicia la práctica | `closer.e2e.spec.ts` › práctica |
| CA-03.2 Extracción única y voz por género | `practice-use-cases.spec.ts`, `practice-rules.spec.ts` | | |
| CA-03.3 Modo/tono por defecto | `practice-rules.spec.ts`, `practice-use-cases.spec.ts` | | |
| CA-03.4 Reintento reutiliza escenario | `practice-use-cases.spec.ts` | `api.integration-spec.ts` › reintento | `closer.e2e.spec.ts` › práctica |
| CA-03.5 Sesión ajena → 404 | `practice-use-cases.spec.ts` | | |
| CA-03.8 Modo simulado sin costo | | `api.integration-spec.ts` › inicia la práctica | todas |
| CA-04.6 Coach durante la llamada | `practice-use-cases.spec.ts` | `api.integration-spec.ts` › coach | `closer.e2e.spec.ts` › práctica |
| CA-04.7 Coach tras evaluar → 409 | `practice-use-cases.spec.ts` | `api.integration-spec.ts` › coach ya no responde | |
| CA-05.1 Evaluación y puntaje en el servidor | `evaluation.spec.ts`, `scoring.spec.ts`, `evaluate-simulation.use-case.spec.ts` | `api.integration-spec.ts` › evalúa | `closer.e2e.spec.ts` › práctica |
| CA-05.3 Idempotencia | `practice-rules.spec.ts`, `evaluate-simulation.use-case.spec.ts` | `api.integration-spec.ts` › idempotente | |
| CA-05.4 Evaluaciones simultáneas | `evaluate-simulation.use-case.spec.ts` | `api.integration-spec.ts` › simultáneas | |
| CA-05.5 IA falla → FAILED y reintento | `evaluation.spec.ts`, `evaluate-simulation.use-case.spec.ts`, `gemini-adapters.spec.ts` | | |
| CA-05.6 Sin intercambios → 400 | `evaluation.spec.ts`, `evaluate-simulation.use-case.spec.ts` | `api.integration-spec.ts` › sin intercambios | |
| CA-05.7 Emparejar por número de turno | `evaluation.spec.ts` | | |
| CA-05.8 Título sugerido | `evaluation.spec.ts`, `evaluate-simulation.use-case.spec.ts` | `api.integration-spec.ts` › evalúa | |
| CA-05.9 Recuperar evaluación colgada | `practice-rules.spec.ts` | | |
| CA-06.1 Historial | | `api.integration-spec.ts` › reintento | `closer.e2e.spec.ts` › práctica |
| CA-06.2 Sesión sin intentos no aparece | | `api.integration-spec.ts` | |
| CA-06.3 Intentos 1/n, 2/n | | `api.integration-spec.ts` › reintento | `closer.e2e.spec.ts` › práctica ("de 2") |
| CA-06.4 a CA-06.6 Renombrar, borrar, aislamiento | `practice-use-cases.spec.ts` | `api.integration-spec.ts` › renombrar y borrar | |
| CA-07.2 / CA-07.3 Webhook | `application-use-cases.spec.ts`, `webhook-notifier.spec.ts` | | |
| CA-07.4 Límite → 429 | | `api.integration-spec.ts` › 429 | |
| CA-08.1 Lectura desde caché | `practice-use-cases.spec.ts`, `application-use-cases.spec.ts` | `api.integration-spec.ts` › caché | |
| CA-08.2 Invalidación | `evaluate-simulation.use-case.spec.ts`, `application-use-cases.spec.ts` | | |
| CA-08.4 Redis caído | `redis-adapters.spec.ts` | | |
| CA-08.5 Métricas de caché | `redis-adapters.spec.ts` | `api.integration-spec.ts` › caché | |

Criterios sin prueba automatizada (verificados manualmente): CA-04.1 a CA-04.5 dependen del micrófono y de Gemini Live real; CA-08.3 (límite compartido entre réplicas) se verifica en la fase de escalabilidad con varias réplicas detrás de nginx.

## End to End

Escenarios en `apps/web/e2e/closer.e2e.spec.ts`:

1. Sin sesión, `/setup` redirige al login.
2. Usuario nuevo: login por enlace de correo → onboarding de 5 pasos por la interfaz → `/setup`; al volver a entrar va directo.
3. Práctica completa: autogenerar escenario → llamada → consejo → colgar → resultado → reintento ("2 de 2") → historial.
4. El prospecto de la práctica queda en la biblioteca y se puede eliminar.

Hallazgos de las pruebas E2E que se corrigieron en el código:

- El botón "Autogenerar" no tenía nombre accesible (solo ícono): se agregó `aria-label`.
- Un corte momentáneo de conexión con PostgreSQL devolvía "Error interno" (500): ahora responde 503 con `Retry-After`, y la URL local usa `127.0.0.1` (en Windows `localhost` puede resolver a IPv6 y fallar de forma intermitente con Docker). La pantalla "Reintentar evaluación" permitió recuperar la llamada sin repetirla.
