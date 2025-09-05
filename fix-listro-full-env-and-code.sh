#!/usr/bin/env bash
set -euo pipefail

# ─── fix-listro-full-env-and-code.sh ──────────────────────────────────────────
# 1) Ensure all required env vars in .env.local
# 2) Patch Supabase client initialization
# 3) Comment out Datadog RUM init to avoid 403 errors
# 4) Import missing Card component in MarketingDashboard.tsx
# 5) Clean cache, reinstall, rebuild, and restart dev server
#
# Usage:
#   chmod +x fix-listro-full-env-and-code.sh
#   ./fix-listro-full-env-and-code.sh

echo "🔍 Verifying .env.local and required variables..."
touch .env.local
REQUIRED=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_ANTHROPIC_API_KEY
  OPENAI_API_KEY
  SHOPIFY_API_KEY
  SHOPIFY_API_SECRET
  VITE_DD_CLIENT_TOKEN
  VITE_DD_APP_ID
)
for VAR in "${REQUIRED[@]}"; do
  if ! grep -q "^$VAR=" .env.local; then
    echo "$VAR=REPLACE_ME" >> .env.local
    echo "  ➕ Added placeholder for $VAR"
  fi
done
echo "✅ .env.local prepared (update REPLACE_ME values!)."

# 2) Patch Supabase client
SUP_FILE="src/lib/supabase.ts"
if [[ -f "$SUP_FILE" ]]; then
  echo "🔧 Patching Supabase client in $SUP_FILE"
  cat > "$SUP_FILE" <<'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF
else
  echo "⚠️  $SUP_FILE not found; skipping Supabase patch."
fi

# 3) Disable Datadog RUM init to avoid 403 errors
echo "🔧 Commenting out Datadog RUM initialization..."
grep -RIl "datadogRum.init" src | while read -r FILE; do
  sed -i "s|\(datadogRum\.init.*\)|// \1|g" "$FILE"
  echo "  ➕ Commented in $FILE"
done

# 4) Import missing Card in MarketingDashboard
MD_FILE="src/pages/MarketingDashboard.tsx"
if [[ -f "$MD_FILE" ]]; then
  echo "🔧 Ensuring Card is imported in $MD_FILE"
  if ! grep -q "import.*Card.*from" "$MD_FILE"; then
    sed -i "1iimport { Card } from '@/components/ui/card';" "$MD_FILE"
    echo "  ➕ Added Card import"
  else
    echo "  ✔ Card import already present"
  fi
else
  echo "⚠️  $MD_FILE not found; skipping Card import."
fi

echo "🧹 Cleaning cache and dependencies..."
rm -rf node_modules .vite dist

echo "📦 Reinstalling dependencies..."
npm install

echo "🏗️  Building project..."
npm run build

echo "🚀 Starting development server..."
npm run dev 