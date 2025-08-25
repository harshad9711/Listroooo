#!/usr/bin/env bash
set -euo pipefail

# ─── fix-supabase-env-interactive.sh ──────────────────────────────────────────
# Prompts you to enter your real Supabase URL & anon key, then updates .env.local
# and restarts the dev server so the Invalid URL error goes away.
#
# Usage:
#   1) Save as fix-supabase-env-interactive.sh in your project root
#   2) chmod +x fix-supabase-env-interactive.sh
#   3) ./fix-supabase-env-interactive.sh

ENV_FILE=".env.local"

# Ensure .env.local exists
touch "$ENV_FILE"

# Prompt for real values
read -p "Enter your Supabase Project URL (e.g. https://your-project-ref.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase ANON Key: " SUPABASE_ANON_KEY

# Update or insert VITE_SUPABASE_URL
if grep -q '^VITE_SUPABASE_URL=' "$ENV_FILE"; then
  sed -i "s|^VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" "$ENV_FILE"
else
  echo "VITE_SUPABASE_URL=$SUPABASE_URL" >> "$ENV_FILE"
fi

# Update or insert VITE_SUPABASE_ANON_KEY
if grep -q '^VITE_SUPABASE_ANON_KEY=' "$ENV_FILE"; then
  sed -i "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" "$ENV_FILE"
else
  echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> "$ENV_FILE"
fi

echo "✅ .env.local updated with your Supabase credentials."

echo "🧹 Restarting dev server..."
npm run dev 