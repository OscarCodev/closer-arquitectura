#!/usr/bin/env bash
# Verifica el stack escalable (docker-compose.prod.yml con el perfil local-db).
# Uso:  bash infra/scripts/verificar-escalabilidad.sh
set -uo pipefail

BASE=${BASE:-http://127.0.0.1:8080}
API=$BASE/api/v1
COMPOSE="docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod.local --profile local-db"
json() { node -pe "const d=JSON.parse(require('fs').readFileSync(0)||'{}');$1"; }
title() { printf '\n== %s\n' "$1"; }

title "1. Reparto de carga: 30 peticiones a /health/live (cada réplica responde con su hostname)"
for i in $(seq 1 30); do curl -s "$API/health/live" | json 'd.instance'; done | sort | uniq -c

title "2. Web: 10 peticiones a / (2 réplicas)"
for i in $(seq 1 10); do curl -s -o /dev/null -w '%{http_code}\n' "$BASE/"; done | sort | uniq -c

title "3. Sesión y caché compartidas: un usuario lee sus prospectos desde réplicas distintas"
TOKEN=$(curl -s -X POST "$API/auth/dev-token" -H 'Content-Type: application/json' -d "{\"email\":\"escala-$RANDOM@closer.test\"}" | json 'd.accessToken')
H="Authorization: Bearer $TOKEN"
curl -s -X POST "$API/profiles" -H "$H" -H 'Content-Type: application/json' -d '{"prospect":"Ana Torres, CFO en Andes","context":"Vendo X"}' >/dev/null
for i in $(seq 1 6); do
  curl -s -D - -o /tmp/body "$API/profiles" -H "$H" | grep -i '^x-upstream' | tr -d '\r' | sed 's/^/   /'
  printf '   prospectos vistos: %s\n' "$(json 'd.profiles.length' < /tmp/body)"
done

title "4. Rate limit compartido entre réplicas (CA-08.3): soporte permite 2 por minuto en TOTAL"
for i in 1 2 3 4; do
  curl -s -o /dev/null -D - -X POST "$API/support/contacts" -H "$H" -H 'Content-Type: application/json' \
    -d '{"subject":"Prueba","message":"Mensaje de prueba de escalabilidad"}' | grep -iE '^HTTP|^x-upstream' | tr -d '\r' | paste -sd' '
done

title "5. Failover: se detiene api-2 y se envían 20 peticiones"
$COMPOSE stop api-2 >/dev/null 2>&1
for i in $(seq 1 20); do curl -s -o /dev/null -w '%{http_code}\n' "$API/health/live"; done | sort | uniq -c
for i in $(seq 1 12); do curl -s "$API/health/live" | json 'd.instance'; done | sort | uniq -c
$COMPOSE start api-2 >/dev/null 2>&1
echo "   api-2 iniciada de nuevo"

title "6. Pool de conexiones: conexiones reales a PostgreSQL (vía PgBouncer)"
docker exec closer-prod-postgres-1 psql -U closer -d closer -tAc \
  "select usename, application_name, count(*) from pg_stat_activity where datname='closer' group by 1,2 order by 3 desc"
