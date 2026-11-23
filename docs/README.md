# Documentación de Closer

**Autor:** Oscar Abel Bautista Ayala · **Curso:** Arquitectura de Software (IS-488)

Plataforma de entrenamiento comercial con simulaciones de ventas por voz, evaluación y retroalimentación con IA, dirigida a vendedores, AE, SDR y emprendedores.

La documentación sigue el orden del proyecto: análisis y propuesta (Sprint 1), especificación e implementación (Sprint 2), y pruebas, escalabilidad y despliegue (Sprint 3). Los documentos del Sprint 1 se conservan e indican, donde corresponde, cómo quedó la implementación.

## 1. Análisis del sistema (Sprint 1)

- [Actores](01-analisis-de-sistema/01-actores.md)
- [Historias de usuario](01-analisis-de-sistema/02-historias-del-usuario.md)
- [Requisitos funcionales](01-analisis-de-sistema/03-requisitos-funcionales.md)
- [Atributos de calidad](01-analisis-de-sistema/04-atributos-de-calidad.md)
- [Restricciones](01-analisis-de-sistema/05-restricciones.md)
- [Drivers arquitectónicos](01-analisis-de-sistema/06-driver-arquitectonicos.md)
- [Decisiones arquitectónicas (ADR-001 a ADR-011)](01-analisis-de-sistema/07-decisiones-arquitectonicas.md) · actualizado con la implementación
- [Escenarios de atributos de calidad](01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · con el estado de verificación de cada uno

## 2. Arquitectura de software

- [Arquitectura inicial](02-arquitectura-software/arquitectura-inicial.md)
- [Estilo: monolito modular](02-arquitectura-software/estilo-arquitectonico.md)
- [Enfoque: Clean Architecture](02-arquitectura-software/enfoque-aquitectonico.md)
- [Componentes arquitectónicos](02-arquitectura-software/componentes-arquitectonicos.md)
- [ADR-008 · Caché y rate limiting con Redis](arquitectura/ADR-008-cache-redis.md)
- [ADR-009 · Escalabilidad horizontal](arquitectura/ADR-009-escalabilidad.md)
- [Análisis de la base de datos y de la estrategia de caché](arquitectura/analisis-bd-cache.md) · índices, concurrencia, conexiones y resultados medidos

## 3. Diseño interno

- [Diseño interno de módulos](03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) · propuesta y cómo quedó implementado
- [Patrones de diseño](03-diseño-de-software/diseño-interno/patrones-de-diseño.md) · propuestos y presentes en el código
- [Principios de diseño (SOLID)](03-diseño-de-software/diseño-interno/principios-de-diseño.md) · con su ubicación en el código

## 4. Modelo C4

- [Nivel 1 · Contexto](04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md)
- [Nivel 2 · Contenedores](04-modelo-c4/Nivel2-DiagramadeContenedores.md) · propuesta e implementación
- [Nivel 3 · Componentes](04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) · propuesta e implementación
- [Nivel 4 · Código](04-modelo-c4/Nivel4-DiagramadeCodigo.md)

## 5. Especificaciones (SDD)

- [Índice y plantilla](specs/README.md): 8 especificaciones con criterios de aceptación, contrato de API y tareas técnicas.
- Contrato completo de la API: Swagger en `/api/docs` (`/api/docs/openapi.json`).

## 6. Pruebas

- [Estrategia, resultados y matriz criterio → prueba](pruebas/matriz-pruebas.md): unitarias, integración, cobertura y E2E.
- [Pruebas de carga con k6](pruebas/pruebas-carga.md).

## 7. Despliegue

- [Guía de despliegue (Supabase, Render, Vercel, Upstash, Cloudflare)](despliegue/guia-despliegue.md)
- [CI/CD con GitHub Actions](despliegue/ci-cd.md)

## Diagramas

Las imágenes PNG están en `img/` y sus fuentes vectoriales en `img/fuentes-svg/`. Para regenerarlas:

```bash
python docs/img/fuentes-svg/generar-diagramas.py
node docs/img/fuentes-svg/exportar-png.cjs   # requiere sharp (incluido en node_modules del monorepo)
```

Colores: azul para presentación, verde para aplicación y negocio, ámbar para dominio y datos, violeta para infraestructura y rosa para servicios externos.

Presentación del Sprint 1: [presentacion-sprint-1.pdf](presentacion-sprint-1.pdf).
