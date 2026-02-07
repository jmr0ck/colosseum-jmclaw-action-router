#!/usr/bin/env bash
set -euo pipefail

# Load xAI key from workspace secret file if present
if [[ -f ../.secrets/xai_grok_api_key ]]; then
  export XAI_API_KEY="$(cat ../.secrets/xai_grok_api_key)"
fi

node dist/xaiCli.js "$@"
