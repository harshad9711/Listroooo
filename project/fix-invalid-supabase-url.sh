#!/usr/bin/env bash
set -euo pipefail

# ─── fix-invalid-supabase-url.sh ───────────────────────────────────────────────
# 1) Ensure .env.local has valid Supabase URL & anon key placeholders
# 2) Rewrite src/lib/supabase.ts to validate the URL before creating the client
#
# Usage:
#   chmod +x fix-invalid-supabase-url.sh
#   ./fix-invalid-supabase-url.sh

echo "🔍 Verifying .env.local for Supabase configuration..."
touch .env.local

# Add placeholder if missing
if ! grep -q '^VITE_SUPABASE_URL=' .env.local; then
  echo 'VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co' >> .env.local
  echo "  ➕ Added VITE_SUPABASE_URL placeholder"
else
  echo "  ✔ VITE_SUPABASE_URL already present"
fi

if ! grep -q '^VITE_SUPABASE_ANON_KEY=' .env.local; then
  echo 'VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE' >> .env.local
  echo "  ➕ Added VITE_SUPABASE_ANON_KEY placeholder"
else
  echo "  ✔ VITE_SUPABASE_ANON_KEY already present"
fi

echo "✅ .env.local is ready. Edit it to include your actual Supabase URL & anon key."

# Overwrite the Supabase client initialization to include validation
SUP_FILE="src/lib/supabase.ts"
if [[ -f "$SUP_FILE" ]]; then
  echo "🔧 Rewriting $SUP_FILE with URL validation..."

  cat > "$SUP_FILE" <<'EOF'
import { createClient } from '@supabase/supabase-js';

// Load from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format
if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(`Invalid VITE_SUPABASE_URL: "${supabaseUrl}"`);
}
if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF

  echo "✅ Patched $SUP_FILE"
else
  echo "⚠️  Could not find $SUP_FILE—please ensure your Supabase client file is at that path."
fi

echo "🎉 Done! Fill in your real values in .env.local and restart your dev server." 