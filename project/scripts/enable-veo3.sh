#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Creating Veo3 integration feature in prototype…"
bolt feature create "veo3.integration" \
  --description "Enable Veo 3 AI‐Video Generator in Listro" \
  --group "ai" \
  --env prototype

echo "✅ Done! You can now promote with:"
echo "    bolt feature promote veo3.integration --from prototype --to production"