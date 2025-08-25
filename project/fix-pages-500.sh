#!/usr/bin/env bash
set -euo pipefail

# ─── fix-pages-500.sh ─────────────────────────────────────────────────────────
# Cleans caches, ensures env vars, rebuilds, and restarts your dev server
#
# Usage:
#   1) Save as fix-pages-500.sh in your project root
#   2) chmod +x fix-pages-500.sh
#   3) ./fix-pages-500.sh

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

echo "🧹 Cleaning caches and previous builds..."
rm -rf node_modules .vite dist

echo "📦 Reinstalling dependencies..."
npm install

echo "🏗️  Running a full build to catch errors..."
if ! npm run build; then
  echo "❌ Build failed—check the error output above to fix code issues."
  exit 1
fi

echo "🚀 Starting development server..."
npm run dev

echo "✅ Dev server running. If 500 errors persist, check your server logs for stack traces." 