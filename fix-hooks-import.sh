#!/usr/bin/env bash
set -euo pipefail

# ─── fix-hooks-import.sh ─────────────────────────────────────────────────────
# Scans your src/pages/*.tsx files and ensures React hooks are imported
# whenever useState or useEffect is used.
#
# Usage:
#   1) Save this as fix-hooks-import.sh in your project root
#   2) chmod +x fix-hooks-import.sh
#   3) ./fix-hooks-import.sh

# Loop through all .tsx files in src/pages
find src/pages -type f -name '*.tsx' | while read -r file; do
  # Only process files that use useState or useEffect
  if grep -Eq 'use(State|Effect)' "$file"; then
    echo "Processing $file..."
    # If hooks are already imported, skip
    if grep -Eq "import .*{[^}]*use(State|Effect)[^}]*}.*from 'react'" "$file"; then
      echo "  ✔ Hooks already imported."
    else
      # If there's an existing React import, append hooks
      if grep -Eq "import React.*from 'react'" "$file"; then
        # Use a temporary file approach for macOS compatibility
        sed 's|import React\([^;]*\)from '\''react'\'';|import React\1, { useState, useEffect } from '\''react'\'';|' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        echo "  ➕ Added useState/useEffect to existing React import."
      else
        # No React import: insert a new one at the top
        echo "import React, { useState, useEffect } from 'react';" > "$file.tmp"
        cat "$file" >> "$file.tmp"
        mv "$file.tmp" "$file"
        echo "  ➕ Inserted new React import with hooks."
      fi
    fi
  fi
done

echo "✅ Hook imports fixed. Please restart your dev server." 