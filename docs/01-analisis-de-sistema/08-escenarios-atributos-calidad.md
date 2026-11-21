# Escenarios de atributos de calidad de Closer

Las metas se propusieron en el Sprint 1 y se verificaron durante la implementación. La fila **Estado** de cada escenario indica el resultado y la prueba que lo respalda (ver la [matriz de pruebas](../pruebas/matriz-pruebas.md)).

## EQ-01. Rendimiento

| Elemento | Descripción |
|---|---|
| Origen | AC01 / DA01 |
| Fuente | Vendedor |
| Estímulo | Habla durante una simulación activa. |
| Condición | Sesión con red estable y condiciones de prueba documentadas. |
| Respuesta | Reproducir la respuesta del prospecto sin bloquear los controles. |
| Medida | Propuesta: p95 del tiempo entre fin del turno y primer audio de respuesta ≤ 2 segundos en 20 sesiones simultáneas. |
| Verificación | Registrar marcas de tiempo en navegador; distinguir red, proveedor y aplicación. |
| Estado | Pendiente: requiere Gemini Live real y micrófono. La arquitectura lo favorece (WSS directo navegador–Gemini, preconexión y audio en lotes de 40 ms). |

## EQ-02. Disponibilidad

| Elemento | Descripción |
|---|---|
| Origen | AC02 |
| Fuente | Usuario |
| Estímulo | Consulta el historial cuando falla el proveedor de IA. |
| Condición | Backend y persistencia disponibles; proveedor de IA inaccesible. |
| Respuesta | Mantener historial accesible y conservar sesiones; informar evaluación pendiente o fallida. |
| Medida | Propuesta: 99,5 % de disponibilidad mensual de gestión e historial, medida separadamente de voz. |
| Verificación | Monitorizar endpoints críticos y simular fallo de IA; documentar ventana de medición. |
| Estado | Parcial: si la IA falla, el historial sigue disponible y la evaluación queda FAILED con reintento (`evaluate-simulation.use-case.spec.ts`). Monitoreo con `/health/ready`; el 99,5 % mensual solo se puede medir en producción. |

## EQ-03. Escalabilidad

| Elemento | Descripción |
|---|---|
| Origen | AC03 / DA02 |
| Fuente | Usuarios concurrentes |
| Estímulo | La carga crece progresivamente hasta 2,000 usuarios virtuales concurrentes (Sprint 2). |
| Condición | Stack de producción replicado: 3 réplicas de la API y 2 de la web detrás de nginx, Redis y PostgreSQL con PgBouncer. IA simulada (la voz se mide en EQ-01). |
| Respuesta | Iniciar sesiones dentro de cuotas y mantener operaciones de gestión utilizables. |
| Medida | Gestión (panel, historial, biblioteca): p95 ≤ 1 s y errores técnicos < 1 %. |
| Verificación | k6 con rampa 5 % → 25 % → 50 % → 100 % y pico sostenido; monitoreo de CPU, memoria y conexiones por contenedor (`infra/k6`). |
| Estado | Cumple en servidor con 300 usuarios en la laptop de desarrollo: gestión p95 822 ms y 0.008 % de errores. Medición oficial con 2,000 usuarios en GitHub Actions: ver [pruebas de carga](../pruebas/pruebas-carga.md). |

## EQ-04. Seguridad

| Elemento | Descripción |
|---|---|
| Origen | AC04 / DA03 |
| Fuente | Usuario sin permisos |
| Estímulo | Intenta consultar o eliminar la sesión de otra cuenta. |
| Condición | Matriz de permisos y dos cuentas de prueba. |
| Respuesta | Rechazar antes de modificar datos o invocar proveedores. |
| Medida | 100 % de los casos no autorizados definidos se rechazan sin exponer transcripciones ni secretos. |
| Verificación | Probar API y acceso de datos sujeto a RLS; comprobar ausencia de cambios y llamadas externas. |
| Estado | Cumple: un segundo usuario recibe 404 al consultar, modificar o borrar sesiones, prospectos o simulaciones ajenas (`api.integration-spec.ts`). El identificador sale siempre del JWT. |

## EQ-05. Mantenibilidad

| Elemento | Descripción |
|---|---|
| Origen | AC05 / DA06 |
| Fuente | Equipo de desarrollo |
| Estímulo | Sustituye el adaptador de evaluación. |
| Condición | Contrato de EvaluadorConversacion y datos de prueba estables. |
| Respuesta | Conservar el dominio y los casos de uso cuando se respete el contrato. |
| Medida | Sin imports del SDK en dominio/aplicación; pruebas de contrato y regresión aprobadas. |
| Verificación | Inspeccionar dependencias y ejecutar escenarios de éxito, error y respuesta inválida. |
| Estado | Cumple: ESLint impide importar SDKs en dominio y aplicación; el adaptador de IA se sustituye por configuración y los casos de uso se prueban con dobles (`practice-use-cases.spec.ts`, `gemini-adapters.spec.ts`). |

## EQ-06. Usabilidad

| Elemento | Descripción |
|---|---|
| Origen | AC06 |
| Fuente | Usuario nuevo |
| Estímulo | Configura e inicia su primera práctica. |
| Condición | Cuenta autenticada, micrófono permitido y cuota disponible. |
| Respuesta | Guiar configuración y mostrar estado de la llamada. |
| Medida | Propuesta: 4 de 5 participantes completan el flujo sin ayuda en ≤ 3 minutos. |
| Verificación | Prueba de tareas; medir tiempo, errores, comprensión y accesibilidad de controles. |
| Estado | Pendiente de prueba con usuarios. El onboarding y el flujo completo se recorren automáticamente en las pruebas E2E (`closer.e2e.spec.ts`). |

## EQ-07. Interoperabilidad

| Elemento | Descripción |
|---|---|
| Origen | AC07 / DA04 |
| Fuente | Proveedor externo |
| Estímulo | Devuelve timeout o evaluación con estructura inválida. |
| Condición | Sesión finalizada y adaptador de IA activo. |
| Respuesta | Normalizar el error; conservar transcripción y ofrecer reintento controlado. |
| Medida | 100 % de los errores definidos se traducen a estados controlados; no guardar evaluaciones inválidas. |
| Verificación | Simular respuestas en pruebas de contrato y comprobar validación y persistencia. |
| Estado | Cumple: timeouts y respuestas inválidas de la IA se traducen a FAILED con reintento, sin guardar evaluaciones inválidas ni inventar feedback (`evaluation.spec.ts`, `gemini-adapters.spec.ts`). |
