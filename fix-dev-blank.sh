#!/usr/bin/env bash
set -euo pipefail

# ─── fix-dev-blank.sh ─────────────────────────────────────────────────────────
# Ensures environment is configured, cleans caches, reinstalls deps, builds, and starts dev server
#
# Usage:
#   chmod +x fix-dev-blank.sh
#   ./fix-dev-blank.sh

echo "🔍 Verifying .env.local and required env vars..."
touch .env.local
REQUIRED_VARS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_ANTHROPIC_API_KEY
  OPENAI_API_KEY
)
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$VAR=" .env.local; then
    echo "$VAR=REPLACE_ME" >> .env.local
    echo "  ➕ Added placeholder for $VAR"
  fi
done
echo "✅ .env.local ready (remember to update placeholders!)."

echo "🧹 Cleaning up caches and dependencies..."
rm -rf node_modules .vite cache dist

echo "📦 Reinstalling dependencies..."
npm install

echo "🏗️  Building project to catch early errors..."
npm run build

echo "🚀 Starting development server..."
npm run dev 