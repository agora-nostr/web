#!/bin/bash

# Script to update all NDK import paths to match new registry structure

echo "Updating NDK import paths..."

# Find all files with NDK imports
FILES=$(find src -type f \( -name "*.svelte" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "from '\$lib/ndk" {} \;)

# Count files
echo "Found $(echo "$FILES" | wc -l | tr -d ' ') files with NDK imports"

# Create temporary file for replacements
cat > /tmp/import_replacements.txt << 'EOF'
# Article cards
s|from '\$lib/ndk/components/article-card/article-card-medium.svelte'|from '\$lib/ndk/components/article/cards/basic/article-card-medium.svelte'|g
s|from '\$lib/ndk/components/article-card-hero/article-card-hero.svelte'|from '\$lib/ndk/components/article/cards/hero/article-card-hero.svelte'|g
s|from '\$lib/ndk/components/article-card-portrait/article-card-portrait.svelte'|from '\$lib/ndk/components/article/cards/portrait/article-card-portrait.svelte'|g

# Event cards
s|from '\$lib/ndk/components/event-card'|from '\$lib/ndk/components/event/cards/compound'|g
s|from '\$lib/ndk/components/event-card-classic'|from '\$lib/ndk/components/event/cards/classic'|g

# Follow components
s|from '\$lib/ndk/components/actions'|from '\$lib/ndk/components/follow/buttons/basic'|g
s|from '\$lib/ndk/components/follow-pack-compact'|from '\$lib/ndk/components/follow/packs/compact'|g

# Reaction components
s|from '\$lib/ndk/components/reaction/reaction-button.svelte'|from '\$lib/ndk/components/reaction/buttons/reaction-button.svelte'|g
s|from '\$lib/ndk/components/reaction/reaction-emoji-button.svelte'|from '\$lib/ndk/components/reaction/buttons/reaction-emoji-button.svelte'|g
s|from '\$lib/ndk/components/reaction'|from '\$lib/ndk/components/reaction/buttons'|g

# Highlight cards
s|from '\$lib/ndk/components/highlight-card/highlight-card.svelte'|from '\$lib/ndk/components/highlight/cards/basic/highlight-card.svelte'|g
s|from '\$lib/ndk/components/highlight-card-feed/highlight-card-feed.svelte'|from '\$lib/ndk/components/highlight/cards/basic/highlight-card-feed.svelte'|g
s|from '\$lib/ndk/components/highlight-card-compact/highlight-card-compact.svelte'|from '\$lib/ndk/components/highlight/cards/compact/highlight-card-compact.svelte'|g

# Zap components
s|from '\$lib/ndk/components/zap-send'|from '\$lib/ndk/components/zap/send'|g
s|from '\$lib/ndk/components/zaps'|from '\$lib/ndk/components/zap/list'|g
EOF

# Apply replacements
for file in $FILES; do
  echo "Processing: $file"
  sed -i.bak -f /tmp/import_replacements.txt "$file"
  rm "${file}.bak"
done

echo "Import path updates complete!"