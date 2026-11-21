#!/usr/bin/env bash
# Registra cada INTERVAL segundos el uso de CPU/memoria de los contenedores del stack y las
# conexiones reales a PostgreSQL, mientras corre la prueba de carga.
#   bash infra/k6/monitor.sh infra/k6/results/monitor.csv &   (detener con kill)
OUT=${1:-infra/k6/results/monitor.csv}
INTERVAL=${INTERVAL:-10}
mkdir -p "$(dirname "$OUT")"
echo "hora,contenedor,cpu_pct,mem_mb" > "$OUT"
PG_OUT="${OUT%.csv}-postgres.csv"
echo "hora,conexiones_postgres" > "$PG_OUT"

while true; do
  now=$(date +%H:%M:%S)
  docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' 2>/dev/null | grep closer-prod | while IFS=, read -r name cpu mem; do
    used=${mem%% /*}
    mb=$(echo "$used" | awk '/GiB/{printf "%.0f", $1*1024; next} /MiB/{printf "%.0f", $1; next} /KiB/{printf "%.1f", $1/1024}')
    echo "$now,${name#closer-prod-},${cpu%\%},$mb" >> "$OUT"
  done
  conns=$(docker exec closer-prod-postgres-1 psql -U closer -d closer -tAc "select count(*) from pg_stat_activity where datname='closer'" 2>/dev/null)
  echo "$now,${conns:-}" >> "$PG_OUT"
  sleep "$INTERVAL"
done
