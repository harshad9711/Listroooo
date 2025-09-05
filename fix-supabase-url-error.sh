#!/usr/bin/env bash
set -euo pipefail

# ─── fix-supabase-url-error.sh ────────────────────────────────────────────────
# Fixes invalid URL construction in src/lib/supabase.ts by using raw env strings
# and reminds user to set correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
#
# Usage:
#   1) Save as fix-supabase-url-error.sh in your project root
#   2) chmod +x fix-supabase-url-error.sh
#   3) ./fix-supabase-url-error.sh

FILE="src/lib/supabase.ts"

if [[ -f "$FILE" ]]; then
  echo "🔧 Overwriting $FILE with correct Supabase client initialization..."

  cat > "$FILE" <<'EOF'
import { createClient } from '@supabase/supabase-js';

// Ensure these env vars are set in .env.local or your environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF

  echo "✅ $FILE updated. Please verify your .env.local has valid URLs:"
  echo "   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co"
  echo "   VITE_SUPABASE_ANON_KEY=<your-anon-key>"
else
  echo "❌ $FILE not found. Please confirm you have a src/lib/supabase.ts file."
fi 