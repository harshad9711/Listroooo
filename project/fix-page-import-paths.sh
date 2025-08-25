#!/usr/bin/env bash
set -euo pipefail

# ─── fix-page-import-paths.sh ─────────────────────────────────────────────────
# Converts any absolute TSX imports from '/src/pages/Whatever.tsx'
# into correct relative imports './pages/Whatever' so Vite can load them.

echo "🔍 Scanning for absolute /src/pages imports..."

# 1) Static imports: from '/src/pages/...'
grep -RIl "from [\"']/src/pages/" src | while read -r file; do
  echo "Patching static imports in $file"
  sed -i '' -E \
    -e "s|from [\"']/src/pages/([^\"']+)\\.tsx[\"']|from './pages/\1'|g" \
    "$file"
done

# 2) Dynamic imports: import('/src/pages/...')
grep -RIl "import\([\"']/src/pages/" src | while read -r file; do
  echo "Patching dynamic imports in $file"
  sed -i '' -E \
    -e "s|import\([\"']/src/pages/([^\"']+)\\.tsx[\"']\)|import('./pages/\1')|g" \
    "$file"
done

echo "✅ Import paths updated. Please restart your dev server." 