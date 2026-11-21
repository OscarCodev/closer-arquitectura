# Closer

Simulador de llamadas de venta con IA: el vendedor practica por voz con un prospecto simulado (Gemini Live) y recibe una evaluación por turno.

Monorepo con dos aplicaciones:

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `apps/web` | Frontend | Next.js 16, React 19, Zustand, Tailwind |
| `apps/api` | Backend: monolito modular con Clean Architecture | NestJS 11, Prisma, PostgreSQL, Redis |
| `infra/` | Infraestructura local y pruebas de carga | Docker Compose, nginx, k6 |
| `docs/` | Especificaciones SDD y documentación técnica | Markdown |

## Requisitos

- Node.js 20 o superior
- Docker Desktop (PostgreSQL y Redis locales)

## Puesta en marcha local

```bash
npm install
npm run infra:up                          # PostgreSQL + Redis en Docker
cp apps/api/.env.example apps/api/.env    # valores locales listos para usar
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate                        # aplica las migraciones
npm run dev:api                           # http://localhost:4000/api/v1
npm run dev:web                           # http://localhost:3000
```

- Swagger (documentación de la API): http://localhost:4000/api/docs
- Salud: http://localhost:4000/api/v1/health/ready

Sin claves externas, el proyecto funciona en modo local: login de desarrollo (`AUTH_DEV_LOGIN=true`), IA simulada (`AI_PROVIDER=fake`) y voz con guion (`NEXT_PUBLIC_VOICE_MODE=mock`). Para usar Supabase y Gemini reales, completa las variables indicadas en cada `.env.example`.

## Arquitectura del backend

Cada módulo de negocio (`apps/api/src/modules/*`) sigue Clean Architecture:

```
domain/          entidades y reglas puras (sin frameworks)
application/     casos de uso y puertos (interfaces)
infrastructure/  adaptadores: Prisma, Redis, Gemini, Supabase JWT
presentation/    controladores REST y DTOs (Swagger)
```

ESLint impide que `domain` y `application` importen proveedores concretos (Prisma, Redis, Gemini).

## Pruebas

| Comando | Qué ejecuta |
|---|---|
| `npm test` | Pruebas unitarias del backend (dominio, casos de uso, adaptadores). No requiere Docker |
| `npm run test:integration` | API completa contra PostgreSQL y Redis reales (requiere `npm run infra:up`) |
| `npm run test:cov` | Unitarias + integración con reporte de cobertura en `apps/api/coverage/index.html` |
| `npm run test:e2e` | Playwright en Chromium contra la web y la API (las levanta si no están corriendo) |

CI/CD: [docs/despliegue/ci-cd.md](docs/despliegue/ci-cd.md). Estrategia, resultados y matriz criterio → prueba: [docs/pruebas/matriz-pruebas.md](docs/pruebas/matriz-pruebas.md). Especificaciones: [docs/specs](docs/specs/README.md).

## Stack escalable (producción en VPS y pruebas de carga)

`infra/docker-compose.prod.yml`: nginx → 3 réplicas de la API + 2 de la web, Redis compartido y PostgreSQL vía PgBouncer.

```bash
npm run stack:up        # construye y levanta todo en http://localhost:8080
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma   # con DATABASE_URL apuntando a 127.0.0.1:5433 (primera vez)
npm run stack:verify    # reparto, estado compartido, rate limit global y failover
npm run stack:down
```

Decisión y resultados: [ADR-009](docs/arquitectura/ADR-009-escalabilidad.md).
