#!/usr/bin/env bash
# =====================================================================
# FIXTECH - prueba de humo contra un despliegue.
#
# Uso:
#   ./deploy/smoke-test.sh http://127.0.0.1:8088
#
# Variables opcionales para verificar el login real:
#   SMOKE_ADMIN_EMAIL=admin@fixtech.pe
#   SMOKE_ADMIN_PASSWORD=Admin123!
#
# Requiere curl y python3. No imprime tokens ni contraseñas.
# =====================================================================

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8088}"
BASE_URL="${BASE_URL%/}"
FALLOS=0

paso() {
  printf '\n[%s] %s\n' "$1" "$2"
}

ok() {
  printf '  OK   %s\n' "$1"
}

fallo() {
  printf '  FALLO %s\n' "$1"
  FALLOS=$((FALLOS + 1))
}

codigo() {
  curl -sS -o /dev/null -w '%{http_code}' "$1"
}

cabecera() {
  curl -sSI "$1" | tr -d '\r' | awk -F': ' -v nombre="$2" 'tolower($1) == tolower(nombre) {print $2; exit}'
}

paso 1 "Frontend y fallback de la SPA"
INDEX_STATUS="$(codigo "$BASE_URL/")"
if [ "$INDEX_STATUS" = "200" ]; then ok "GET / -> 200"; else fallo "GET / -> $INDEX_STATUS"; fi

LOGIN_STATUS="$(codigo "$BASE_URL/login")"
if [ "$LOGIN_STATUS" = "200" ]; then ok "GET /login -> 200"; else fallo "GET /login -> $LOGIN_STATUS"; fi

FALLBACK_STATUS="$(codigo "$BASE_URL/ruta-inexistente")"
if [ "$FALLBACK_STATUS" = "200" ]; then
  ok "GET /ruta-inexistente -> 200 (fallback)"
else
  fallo "GET /ruta-inexistente -> $FALLBACK_STATUS"
fi

if curl -sS "$BASE_URL/" | grep -q '<app-root'; then
  ok "index.html contiene <app-root>"
else
  fallo "index.html no contiene <app-root>"
fi

paso 2 "Fuentes y archivos estáticos"
FUENTE_STATUS="$(codigo "$BASE_URL/fonts/roboto-latin.woff2")"
if [ "$FUENTE_STATUS" = "200" ]; then ok "GET /fonts/roboto-latin.woff2 -> 200"; else fallo "fuente -> $FUENTE_STATUS"; fi

ICONOS_STATUS="$(codigo "$BASE_URL/fonts/material-symbols-outlined.woff2")"
if [ "$ICONOS_STATUS" = "200" ]; then ok "GET /fonts/material-symbols-outlined.woff2 -> 200"; else fallo "iconos -> $ICONOS_STATUS"; fi

paso 3 "Proxy /api"
API_STATUS="$(codigo "$BASE_URL/api/catalogos/distritos")"
if [ "$API_STATUS" = "200" ]; then
  ok "GET /api/catalogos/distritos -> 200"
else
  fallo "GET /api/catalogos/distritos -> $API_STATUS"
fi

CUERPO_API="$(curl -sS "$BASE_URL/api/catalogos/distritos" || true)"
if printf '%s' "$CUERPO_API" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d, list) and len(d) > 0' 2>/dev/null; then
  ok "la respuesta de catálogos es una lista con datos"
else
  fallo "la respuesta de catálogos no es válida"
fi

paso 4 "Cabeceras de seguridad"
for CABECERA in "X-Content-Type-Options" "X-Frame-Options" "Referrer-Policy" "Content-Security-Policy"; do
  VALOR="$(cabecera "$BASE_URL/" "$CABECERA" || true)"
  if [ -n "$VALOR" ]; then ok "$CABECERA: $VALOR"; else fallo "falta $CABECERA"; fi
done

paso 5 "Login y perfil autenticado (opcional)"
if [ -n "${SMOKE_ADMIN_EMAIL:-}" ] && [ -n "${SMOKE_ADMIN_PASSWORD:-}" ]; then
  RESPUESTA_LOGIN="$(
    curl -sS -X POST "$BASE_URL/api/auth/login" \
      -H 'Content-Type: application/json' \
      --data "{\"correo\":\"$SMOKE_ADMIN_EMAIL\",\"password\":\"$SMOKE_ADMIN_PASSWORD\"}"
  )"
  TOKEN="$(
    printf '%s' "$RESPUESTA_LOGIN" |
      python3 -c 'import json,sys; print(json.load(sys.stdin).get("accessToken", ""))' 2>/dev/null || true
  )"
  if [ -n "$TOKEN" ]; then
    ok "POST /api/auth/login devuelve accessToken"
    PERFIL="$(
      curl -sS "$BASE_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"
    )"
    CORREO="$(
      printf '%s' "$PERFIL" |
        python3 -c 'import json,sys; print(json.load(sys.stdin).get("correo", ""))' 2>/dev/null || true
    )"
    if [ "$CORREO" = "$SMOKE_ADMIN_EMAIL" ]; then
      ok "GET /api/auth/me devuelve el perfil de $CORREO"
    else
      fallo "GET /api/auth/me no devolvió el perfil esperado"
    fi
  else
    fallo "POST /api/auth/login no devolvió accessToken"
  fi
else
  printf '  OMITIDO  Defina SMOKE_ADMIN_EMAIL y SMOKE_ADMIN_PASSWORD para probar el login.\n'
fi

printf '\n========================================\n'
if [ "$FALLOS" -eq 0 ]; then
  printf 'Prueba de humo: OK\n'
  exit 0
fi

printf 'Prueba de humo: %s fallo(s)\n' "$FALLOS"
exit 1
