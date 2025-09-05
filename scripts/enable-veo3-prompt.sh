#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Creating Veo 3 Prompt Generator feature in prototype…"
bolt feature create "veo3.prompt-generator" \
  --description "Generate optimized Veo 3 prompts from a basic idea" \
  --group "veo3" \
  --env prototype

echo "✅ Done! To promote to production, run:"
echo "    bolt feature promote veo3.prompt-generator --from prototype --to production"