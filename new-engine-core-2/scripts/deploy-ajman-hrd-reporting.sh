#!/usr/bin/env bash
# Targeted deploy for Ajman HRD reporting API changes.
# Usage:
#   AWS_PROFILE=f2-stage AWS_REGION=us-west-2 ./scripts/deploy-ajman-hrd-reporting.sh lambdas
#   AWS_PROFILE=f2-stage AWS_REGION=us-west-2 ./scripts/deploy-ajman-hrd-reporting.sh api
#   AWS_PROFILE=f2-stage ./scripts/deploy-ajman-hrd-reporting.sh all
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

export AWS_PROFILE="${AWS_PROFILE:-f2-stage}"
export AWS_REGION="${AWS_REGION:-us-west-2}"

echo "Using AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION"

deploy_lambda() {
  local dir="$1"
  echo "Deploying lambda: $dir"
  cd "$ROOT/lambda-functions/$dir"
  npm install --production
  npm run deploy
}

case "$TARGET" in
  lambdas)
    deploy_lambda search-post
    deploy_lambda db-api-invoker
    ;;
  api)
    cd "$ROOT/api-gateway"
    node deploy-all.js
    ;;
  all)
    deploy_lambda search-post
    deploy_lambda db-api-invoker
    cd "$ROOT/api-gateway"
    node deploy-all.js
    ;;
  *)
    echo "Unknown target: $TARGET (use: lambdas | api | all)"
    exit 1
    ;;
esac

echo "Done. Remember to run DB migrations (cx-module SQL 31-42) before testing."
