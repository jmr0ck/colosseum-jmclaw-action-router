#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-}"
shift || true

if [[ -z "$CMD" ]]; then
  echo "usage: scripts/x-run.sh <whoami|tweet|reply> [args...]" >&2
  exit 1
fi

# Load secrets (local only)
# Default to BlinkGuard creds, but allow override:
#   X_ENV_FILE=.secrets/x_bullture_oauth1.env ./scripts/x-run.sh whoami
X_ENV_FILE="${X_ENV_FILE:-.secrets/x_blinkguard_oauth1.env}"

set -a
source "$X_ENV_FILE"
set +a

node dist/xCli.js "$CMD" "$@"
