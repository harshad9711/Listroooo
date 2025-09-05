#!/usr/bin/env bash
set -euo pipefail

# ─── fix-features-routing-and-auth.sh ─────────────────────────────────────────
# 1) Import all page components in App.tsx
# 2) Add Route entries for each feature path
# 3) Fix 'user is not defined' by importing useAuth and destructuring user in pages
#
# Usage:
#   1) Save this as fix-features-routing-and-auth.sh in your project root
#   2) chmod +x fix-features-routing-and-auth.sh
#   3) ./fix-features-routing-and-auth.sh

APP="src/App.tsx"

# 1) Import page components
declare -a PAGES=("ABTests" "Analytics" "Settings" "Login" "Register" "ForgotPassword" "Pricing" "AdCreativePerformance" "CompetitorScanner")
for PAGE in "${PAGES[@]}"; do
  if ! grep -q "import ${PAGE} from './pages/${PAGE}'" "$APP"; then
    IMPORT_LINE="import ${PAGE} from './pages/${PAGE}';"
    # Insert at the top using a temp file
    TMPFILE=$(mktemp)
    printf "%s\n" "$IMPORT_LINE" > "$TMPFILE"
    cat "$APP" >> "$TMPFILE"
    mv "$TMPFILE" "$APP"
    echo "✅ Imported ${PAGE} in App.tsx"
  fi
done

# 2) Add routes under <Routes>
TMP="${APP}.tmp"
inside_routes=0
> "$TMP"
while IFS= read -r line; do
  echo "$line" >> "$TMP"
  if [[ $line =~ \<Routes\> ]] && [[ $inside_routes -eq 0 ]]; then
    inside_routes=1
    for PAGE in "${PAGES[@]}"; do
      path=$(echo "$PAGE" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')
      echo "        <Route path=\"/${path}\" element={<${PAGE}/>}/>">> "$TMP"
    done
  fi
done < "$APP"
mv "$TMP" "$APP"
echo "✅ Routes added in App.tsx"

# 3) Fix 'user is not defined' in pages
for PAGE in "${PAGES[@]}"; do
  FILE="src/pages/${PAGE}.tsx"
  if [[ -f "$FILE" ]] && grep -q "user\." "$FILE"; then
    # Import useAuth if missing
    if ! grep -q "useAuth" "$FILE"; then
      IMPORT_LINE="import { useAuth } from '../contexts/AuthContext';"
      TMPFILE=$(mktemp)
      printf "%s\n" "$IMPORT_LINE" > "$TMPFILE"
      cat "$FILE" >> "$TMPFILE"
      mv "$TMPFILE" "$FILE"
      echo "✅ Added useAuth import in ${PAGE}.tsx"
    fi
    # Destructure user in component body
    awk -v page="$PAGE" 'BEGIN{added=0} {print} $0 ~ "function "page"" && !added {print "  const { user } = useAuth(); // fix undefined user"; added=1}' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    echo "✅ Added user destructure in ${PAGE}.tsx"
  fi
done

echo "🎉 Routing and auth fixes applied. Please restart your dev server." 