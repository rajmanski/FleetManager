#!/bin/bash
set -e
cd "$(dirname "$0")/.."
docker compose -f docker-compose.prod.yml run --rm migrate
