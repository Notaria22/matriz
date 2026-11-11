#!/usr/bin/env bash
# deploy.sh - Despliegue de Matriz en el servidor de desarrollo (Ubuntu + Docker)
#
# Uso:  bash deploy.sh
#
# Hace, en orden: respaldo de la base, actualizar el código de develop,
# reconstruir y levantar los contenedores (el backend aplica las migraciones
# al arrancar), verificar que responde y limpiar imágenes viejas.
# Si algo falla, se detiene y lo dice.
set -euo pipefail

RAIZ="${MATRIZ_DIR:-$HOME/matriz}"
RAMA="${MATRIZ_RAMA:-develop}"
RESPALDOS="${MATRIZ_RESPALDOS:-$HOME/matriz-respaldos}"
URL_SALUD="http://127.0.0.1:8080/health"

paso() { printf '\n==> %s\n' "$1"; }

cd "$RAIZ"
[ -f .env ] || { echo "Falta $RAIZ/.env (copiar de .env.example)"; exit 1; }

# shellcheck disable=SC1091
set -a; . ./.env; set +a

# --- 1. Respaldo ANTES de tocar nada (si la base ya está corriendo) ---
paso "Respaldando la base de datos"
mkdir -p "$RESPALDOS"
if docker compose ps --status running db 2>/dev/null | grep -q db; then
    dump="$RESPALDOS/${DB_NAME}-$(date +%Y-%m-%d-%H%M).sql.gz"
    docker compose exec -T db mariadb-dump -u root --password="$MARIADB_ROOT_PASSWORD" \
        --single-transaction --default-character-set=utf8mb4 "$DB_NAME" | gzip > "$dump"
    [ "$(stat -c %s "$dump")" -gt 200 ] || { echo "El respaldo quedó vacío. Se detiene."; exit 1; }
    echo "   $dump"
    # Conservar solo los últimos 15 días
    find "$RESPALDOS" -name '*.sql.gz' -mtime +15 -delete
else
    echo "   La base no está corriendo todavía (primer despliegue); no hay nada que respaldar."
fi

# --- 2. Código ---
paso "Actualizando el código ($RAMA)"
antes=$(git rev-parse --short HEAD)
git fetch origin "$RAMA"
git reset --hard "origin/$RAMA"
despues=$(git rev-parse --short HEAD)
[ "$antes" = "$despues" ] && echo "   Sin cambios nuevos ($despues)" || echo "   $antes -> $despues"

# --- 3. Contenedores (el backend corre alembic upgrade head al arrancar) ---
paso "Construyendo y levantando los contenedores"
docker compose up -d --build

# --- 4. Verificar ---
paso "Verificando"
for _ in $(seq 1 30); do
    if curl -fsS "$URL_SALUD" >/dev/null 2>&1; then
        paso "Limpiando imágenes viejas"
        docker image prune -f >/dev/null
        printf '\nDespliegue completo. Versión %s en %s\n' "$despues" "${PUBLIC_URL:-}"
        exit 0
    fi
    sleep 3
done

echo "El backend no respondió. Últimas líneas del log:"
docker compose logs --tail 40 backend
exit 1