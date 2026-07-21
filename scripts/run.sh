#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "error: pnpm 10.17.1 is required; run 'corepack enable' first" >&2
  exit 127
fi

usage() {
  echo "usage: ./scripts/run.sh <install|demo|dev|build|typecheck|test|start|preflight|smoke|scrub> [args...]" >&2
}

if [[ $# -lt 1 ]]; then
  usage
  exit 64
fi

COMMAND="$1"
shift
cd "${REPOSITORY_ROOT}"

case "${COMMAND}" in
  install)
    exec pnpm install --frozen-lockfile "$@"
    ;;
  demo|dev|build|typecheck|test|start)
    exec pnpm run "${COMMAND}" "$@"
    ;;
  preflight)
    exec pnpm --silent run preflight:live -- "$@"
    ;;
  smoke)
    exec pnpm run smoke:fixture "$@"
    ;;
  scrub)
    exec pnpm run scrub "$@"
    ;;
  *)
    usage
    exit 64
    ;;
esac
