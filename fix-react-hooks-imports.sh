#!/usr/bin/env bash
set -euo pipefail

# ─── fix-react-hooks-imports.sh ──────────────────────────────────────────────
# Ensures every .tsx page under src/pages imports React hooks when used.
#
# Usage:
#   1) Save this as fix-react-hooks-imports.sh in your project root
#   2) chmod +x fix-react-hooks-imports.sh
#   3) ./fix-react-hooks-imports.sh

# Loop through all TSX page files
find src/pages -type f -name '*.tsx' | while read -r FILE; do
  # Process only if the file uses any common React hook
  if grep -Eq '\b(useState|useEffect|useContext|useReducer|useCallback)\b' "$FILE"; then
    echo "📄 Processing $FILE"

    # If there's no import from 'react', insert a full import at the top
    if ! grep -q "from 'react'" "$FILE"; then
      sed -i "1iimport React, { useState, useEffect, useContext, useReducer, useCallback } from 'react';" "$FILE"
      echo "  ➕ Inserted React hook imports"
    else
      # Check if any hook is used but not imported
      NEEDS_HOOKS=false
      for HOOK in useState useEffect useContext useReducer useCallback; do
        if grep -q "\b$HOOK\b" "$FILE" && ! grep -q "{[^}]*\b$HOOK\b" "$FILE"; then
          NEEDS_HOOKS=true
        fi
      done

      # If hooks are missing from import, append them
      if [ "$NEEDS_HOOKS" = true ]; then
        sed -i "s|import React\([^;]*\)from 'react';|import React\1, { useState, useEffect, useContext, useReducer, useCallback } from 'react';|" "$FILE"
        echo "  ➕ Added missing hook imports to existing React import"
      else
        echo "  ✔ Hooks already imported"
      fi
    fi
  fi
done

echo "✅ React hook imports fixed. Restart your dev server." 