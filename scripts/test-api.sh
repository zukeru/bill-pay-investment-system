#!/bin/sh
# Isolated database: never runs destructive API tests against the app database.
set -eu
cd "$(dirname "$0")/.."
bp_test_exists=$(docker compose exec -T db psql -U billionaire -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='billionaire_tests'" | tr -d '[:space:]')
if [ "$bp_test_exists" != '1' ]; then
  docker compose exec -T db createdb -U billionaire billionaire_tests
fi
docker compose run --rm --no-deps -v "$PWD/server/test:/app/test:ro" api sh -c 'TEST_DATABASE_URL="${DATABASE_URL%/*}/billionaire_tests" npm test'
