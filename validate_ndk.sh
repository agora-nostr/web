#!/bin/bash

echo "Validating NDK files against registry..."

# Registry path
REGISTRY="/Users/pablofernandez/tenex/NDK-nhlteu/svelte/registry/src/lib/registry"
NDK_DIR="src/lib/ndk"

# Counter variables
TOTAL=0
MATCH=0
MISMATCH=0
MISSING=0

# Find all files in src/lib/ndk
find $NDK_DIR -type f \( -name "*.svelte" -o -name "*.ts" -o -name "*.js" -o -name "*.css" \) | while read file; do
  TOTAL=$((TOTAL + 1))

  # Get relative path from ndk directory
  relative_path="${file#$NDK_DIR/}"

  # Construct registry file path
  registry_file="$REGISTRY/$relative_path"

  if [ -f "$registry_file" ]; then
    # Calculate SHA256 for both files
    sha_local=$(shasum -a 256 "$file" | cut -d' ' -f1)
    sha_registry=$(shasum -a 256 "$registry_file" | cut -d' ' -f1)

    if [ "$sha_local" = "$sha_registry" ]; then
      MATCH=$((MATCH + 1))
      echo "✓ MATCH: $relative_path"
    else
      MISMATCH=$((MISMATCH + 1))
      echo "✗ MISMATCH: $relative_path"
      echo "  Local:    $sha_local"
      echo "  Registry: $sha_registry"
    fi
  else
    MISSING=$((MISSING + 1))
    echo "? NOT IN REGISTRY: $relative_path"
  fi
done

echo ""
echo "=== Validation Summary ==="
echo "Total files checked: $TOTAL"
echo "Matching: $MATCH"
echo "Mismatched: $MISMATCH"
echo "Not in registry: $MISSING"

# Check for critical files
echo ""
echo "=== Checking Critical Files ==="

critical_files=(
  "ui/user/index.svelte.ts"
  "ui/event-content.svelte"
  "components/follow/buttons/basic/follow-button.svelte"
  "builders/reaction-action/reaction-action.svelte.ts"
  "builders/follow-action/follow-action.svelte.ts"
  "builders/zap-action/zap-action.svelte.ts"
)

for cf in "${critical_files[@]}"; do
  if [ -f "$NDK_DIR/$cf" ]; then
    echo "✓ Found: $cf"
  else
    echo "✗ MISSING: $cf"
  fi
done