# Resultado de la prueba de carga (k6)

- Fecha: 2026-11-21T23:15:36.092Z
- Objetivo: http://127.0.0.1:8080 · rampa hasta **2000 usuarios virtuales** (máximo alcanzado: 2000)
- Peticiones totales: 376696 (608.3 req/s)
- Iteraciones: 74528 · prácticas completas evaluadas: 18614
- Errores HTTP: 0.01 % · respuestas 429: 32 · checks OK: 99.97 %

## Tiempos de respuesta

| Tráfico | promedio | mediana | p90 | p95 | p99 | máx |
|---|---|---|---|---|---|---|
| Gestión (panel, historial, biblioteca) | 431 ms | 108 ms | 412 ms | 579 ms | 12597 ms | 24214 ms |
| Práctica (iniciar, coach, evaluar) | 432 ms | 219 ms | 754 ms | 943 ms | 6031 ms | 23211 ms |

## Umbrales (EQ-03)

| Métrica | Umbral | Resultado |
|---|---|---|
| `http_req_failed{tipo:gestion}` | `rate<0.01` | ✅ cumple |
| `http_req_failed{tipo:practica}` | `rate<0.01` | ✅ cumple |
| `http_req_duration{tipo:practica}` | `p(95)<3000` | ✅ cumple |
| `checks` | `rate>0.99` | ✅ cumple |
| `http_req_duration{tipo:gestion}` | `p(95)<1000` | ✅ cumple |
