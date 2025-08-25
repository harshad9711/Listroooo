#!/usr/bin/env bash
set -euo pipefail

# ─── fix-pages-500-simple.sh ──────────────────────────────────────────────────
# Cleans caches, ensures env vars, and restarts your dev server (without removing node_modules)
#
# Usage:
#   1) Save as fix-pages-500-simple.sh in your project root
#   2) chmod +x fix-pages-500-simple.sh
#   3) ./fix-pages-500-simple.sh

echo "🔍 Ensuring .env.local has required variables..."
touch .env.local
VARS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_DD_CLIENT_TOKEN
  VITE_DD_APP_ID
  VITE_ANTHROPIC_API_KEY
  OPENAI_API_KEY
)
for VAR in "${VARS[@]}"; do
  if ! grep -q "^$VAR=" .env.local; then
    echo "$VAR=REPLACE_ME" >> .env.local
    echo "  ➕ Added placeholder for $VAR"
  fi
done

echo "🧹 Cleaning caches..."
rm -rf .vite dist

echo "🚀 Starting development server..."
npm run dev

echo "✅ Dev server running. If 500 errors persist, check your server logs for stack traces." 