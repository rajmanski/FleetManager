#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_SQL="${ROOT_DIR}/scripts/seed_full_app_template.sql"

COMPOSE="${COMPOSE:-docker compose}"
MYSQL_SERVICE="${MYSQL_SERVICE:-mysql}"
GO_IMAGE="${GO_IMAGE:-golang:1.25-alpine}"

DB_NAME="${DB_NAME:-fleet_management}"
DB_USER="${DB_USER:-fleet_user}"
DB_PASSWORD="${DB_PASSWORD:-changeme-password}"
MIGRATE_DB_HOST="${MIGRATE_DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef}"
PASSWORD_HASH="${PASSWORD_HASH:-\$2a\$10\$gkzPYmNx6hqxSHWa9DgNnOJAwhup9KUPDo2BIzZ0wlAjfu6LtnEju}"

if [[ ! -f "${TEMPLATE_SQL}" ]]; then
  echo "Template not found: ${TEMPLATE_SQL}" >&2
  exit 1
fi

if [[ ${#ENCRYPTION_KEY} -ne 32 ]]; then
  echo "ENCRYPTION_KEY must be 32 bytes (current: ${#ENCRYPTION_KEY})" >&2
  exit 1
fi

echo "Waiting for MySQL in ${MYSQL_SERVICE}..."
for i in {1..90}; do
  if ${COMPOSE} exec -T -e MYSQL_PWD="${DB_PASSWORD}" "${MYSQL_SERVICE}" mysqladmin -u"${DB_USER}" ping -h localhost >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! ${COMPOSE} exec -T -e MYSQL_PWD="${DB_PASSWORD}" "${MYSQL_SERVICE}" mysqladmin -u"${DB_USER}" ping -h localhost >/dev/null 2>&1; then
  echo "MySQL is not ready in service ${MYSQL_SERVICE}" >&2
  exit 1
fi

echo "Running migrations via ${GO_IMAGE} container..."
MYSQL_CID="$(${COMPOSE} ps -q "${MYSQL_SERVICE}")"
if [[ -z "${MYSQL_CID}" ]]; then
  echo "Cannot detect container ID for service ${MYSQL_SERVICE}" >&2
  exit 1
fi
NETWORK_NAME="$(docker inspect -f '{{range $k, $_ := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${MYSQL_CID}" | head -n1 | tr -d '\r')"
if [[ -z "${NETWORK_NAME}" ]]; then
  echo "Cannot detect Docker network for ${MYSQL_SERVICE}" >&2
  exit 1
fi

docker run --rm \
  --network "${NETWORK_NAME}" \
  -v "${ROOT_DIR}/backend:/app" \
  -w /app \
  -e ENCRYPTION_KEY="${ENCRYPTION_KEY}" \
  -e DB_HOST="${MIGRATE_DB_HOST}" \
  -e DB_PORT="${DB_PORT}" \
  -e DB_USER="${DB_USER}" \
  -e DB_PASSWORD="${DB_PASSWORD}" \
  -e DB_NAME="${DB_NAME}" \
  "${GO_IMAGE}" go run ./cmd/migrate -direction up

echo "Generating encrypted PESEL values..."
PESEL1_ENC="$(docker run --rm -v "${ROOT_DIR}/backend:/app" -w /app -e ENCRYPTION_KEY="${ENCRYPTION_KEY}" "${GO_IMAGE}" go run ./tools/encrypt_pesel 90090515836 | tr -d '\r')"
PESEL2_ENC="$(docker run --rm -v "${ROOT_DIR}/backend:/app" -w /app -e ENCRYPTION_KEY="${ENCRYPTION_KEY}" "${GO_IMAGE}" go run ./tools/encrypt_pesel 02070803628 | tr -d '\r')"

TMP_SQL="$(mktemp)"
trap 'rm -f "${TMP_SQL}" "${TMP_SQL}.bak"' EXIT
cp "${TEMPLATE_SQL}" "${TMP_SQL}"
sed -i.bak \
  -e "s|__PASSWORD_HASH__|${PASSWORD_HASH}|g" \
  -e "s|__DRIVER1_PESEL_ENC__|${PESEL1_ENC}|g" \
  -e "s|__DRIVER2_PESEL_ENC__|${PESEL2_ENC}|g" \
  "${TMP_SQL}"

echo "Seeding database ${DB_NAME} via ${MYSQL_SERVICE}..."
cat "${TMP_SQL}" | ${COMPOSE} exec -T -e MYSQL_PWD="${DB_PASSWORD}" "${MYSQL_SERVICE}" mysql -u"${DB_USER}" "${DB_NAME}"

echo
echo "Seed completed."
echo "Demo accounts (password: Test_e14!):"
echo "  - demo_admin"
echo "  - demo_dispatcher"
echo "  - demo_mechanic"
