#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED_VARS=(
  NODE_ENV PORT APP_NAME FRONTEND_URL
  DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME DB_SSL
  COMPOSE_PROJECT_NAME APP_EXTERNAL_PORT DB_EXTERNAL_PORT DOCKER_BUILD_TARGET
  SALT_ROUNDS
  MAIL_PROVIDER MAIL_HOST MAIL_PORT MAIL_SECURE MAIL_FROM_NAME MAIL_FROM_EMAIL
  SESSION_MAX_AGE COOKIE_DOMAIN
  JWT_ADMIN_ACCESS_SECRET JWT_ADMIN_ACCESS_EXP
  JWT_ADMIN_REFRESH_SECRET JWT_ADMIN_REFRESH_EXP
  ADMIN_REGISTRATION_OTP_EMAIL
  JWT_USER_ACCESS_SECRET JWT_USER_ACCESS_EXP
  JWT_USER_REFRESH_SECRET JWT_USER_REFRESH_EXP
  CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET
  JWT_SECRET_RESET_REQUEST JWT_SECRET_RESET_ACCESS
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Missing required environment variable: $var"
    exit 1
  fi
done

if [ "$NODE_ENV" != "production" ]; then
  echo "NODE_ENV must be production (got: $NODE_ENV)"
  exit 1
fi

if [ "$DOCKER_BUILD_TARGET" != "production" ]; then
  echo "DOCKER_BUILD_TARGET must be production (got: $DOCKER_BUILD_TARGET)"
  exit 1
fi

if [ "$DB_HOST" != "db" ]; then
  echo "DB_HOST must be db for docker compose networking (got: $DB_HOST)"
  exit 1
fi

JWT_SECRET_VARS=(
  JWT_SECRET_RESET_REQUEST JWT_SECRET_RESET_ACCESS
  JWT_ADMIN_ACCESS_SECRET JWT_ADMIN_REFRESH_SECRET
  JWT_USER_ACCESS_SECRET JWT_USER_REFRESH_SECRET
)

for var in "${JWT_SECRET_VARS[@]}"; do
  value="${!var}"
  if [ "${#value}" -lt 32 ]; then
    echo "$var must be at least 32 characters"
    exit 1
  fi
done

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst is required but not installed"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but not installed"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but not installed"
  exit 1
fi

ENVSUBST_VARS='$NODE_ENV $PORT $APP_NAME $FRONTEND_URL $DB_HOST $DB_PORT $DB_USER $DB_PASSWORD $DB_NAME $DB_SSL $COMPOSE_PROJECT_NAME $APP_EXTERNAL_PORT $DB_EXTERNAL_PORT $DOCKER_BUILD_TARGET $SALT_ROUNDS $MAIL_PROVIDER $MAIL_HOST $MAIL_PORT $MAIL_SECURE $MAIL_USER $MAIL_PASSWORD $MAIL_FROM_NAME $MAIL_FROM_EMAIL $SESSION_MAX_AGE $COOKIE_DOMAIN $JWT_ADMIN_ACCESS_SECRET $JWT_ADMIN_ACCESS_EXP $JWT_ADMIN_REFRESH_SECRET $JWT_ADMIN_REFRESH_EXP $ADMIN_REGISTRATION_OTP_EMAIL $JWT_USER_ACCESS_SECRET $JWT_USER_ACCESS_EXP $JWT_USER_REFRESH_SECRET $JWT_USER_REFRESH_EXP $CLOUDINARY_CLOUD_NAME $CLOUDINARY_API_KEY $CLOUDINARY_API_SECRET $JWT_SECRET_RESET_REQUEST $JWT_SECRET_RESET_ACCESS'

envsubst "$ENVSUBST_VARS" < scripts/deploy.env.template > .env.production
echo production > .compose-active-env

pnpm docker:prod

echo "Running database migrations..."
pnpm db:migrate:docker

echo "Waiting for health check..."
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${APP_EXTERNAL_PORT}/health" >/dev/null; then
    echo "Health check passed"
    exit 0
  fi
  sleep 2
done

echo "Health check failed"
exit 1
