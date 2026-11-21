// Reporte de la prueba: JSON completo + resumen en Markdown (para el informe y para GitHub Actions).
const ms = (v) => (v === undefined ? '—' : `${Math.round(v)} ms`)
const pct = (v) => (v === undefined ? '—' : `${(v * 100).toFixed(2)} %`)

function metric(data, name) {
  return data.metrics[name] ? data.metrics[name].values : undefined
}

function thresholdRows(data) {
  const rows = []
  for (const [name, m] of Object.entries(data.metrics)) {
    if (!m.thresholds) continue
    for (const [expr, result] of Object.entries(m.thresholds)) {
      rows.push(`| \`${name}\` | \`${expr}\` | ${result.ok ? '✅ cumple' : '❌ no cumple'} |`)
    }
  }
  return rows.join('\n')
}

export function buildReport(data, { maxVus, base }) {
  const gestion = metric(data, 'http_req_duration{tipo:gestion}')
  const practica = metric(data, 'http_req_duration{tipo:practica}')
  const total = metric(data, 'http_reqs')
  const failed = metric(data, 'http_req_failed')
  const vusMax = metric(data, 'vus_max')
  const iteraciones = metric(data, 'iterations')
  const practicas = metric(data, 'practicas_completadas')
  const r429 = metric(data, 'respuestas_429')
  const checks = metric(data, 'checks')
  const fecha = new Date().toISOString()

  const md = `# Resultado de la prueba de carga (k6)

- Fecha: ${fecha}
- Objetivo: ${base} · rampa hasta **${maxVus} usuarios virtuales** (máximo alcanzado: ${vusMax ? vusMax.max : '—'})
- Peticiones totales: ${total ? total.count : '—'} (${total ? total.rate.toFixed(1) : '—'} req/s)
- Iteraciones: ${iteraciones ? iteraciones.count : '—'} · prácticas completas evaluadas: ${practicas ? practicas.count : 0}
- Errores HTTP: ${failed ? pct(failed.rate) : '—'} · respuestas 429: ${r429 ? r429.count : 0} · checks OK: ${checks ? pct(checks.rate) : '—'}

## Tiempos de respuesta

| Tráfico | promedio | mediana | p90 | p95 | p99 | máx |
|---|---|---|---|---|---|---|
| Gestión (panel, historial, biblioteca) | ${ms(gestion?.avg)} | ${ms(gestion?.med)} | ${ms(gestion?.['p(90)'])} | ${ms(gestion?.['p(95)'])} | ${ms(gestion?.['p(99)'])} | ${ms(gestion?.max)} |
| Práctica (iniciar, coach, evaluar) | ${ms(practica?.avg)} | ${ms(practica?.med)} | ${ms(practica?.['p(90)'])} | ${ms(practica?.['p(95)'])} | ${ms(practica?.['p(99)'])} | ${ms(practica?.max)} |

## Umbrales (EQ-03)

| Métrica | Umbral | Resultado |
|---|---|---|
${thresholdRows(data)}
`
  const stamp = fecha.replace(/[:.]/g, '-')
  return {
    stdout: md,
    [`infra/k6/results/carga-${maxVus}vus-${stamp}.json`]: JSON.stringify(data, null, 2),
    [`infra/k6/results/carga-${maxVus}vus-${stamp}.md`]: md,
    'infra/k6/results/ultimo-resumen.md': md,
  }
}
