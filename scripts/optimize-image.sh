#!/usr/bin/env bash
#
# Optimize a team member photo for the website.
#
# Reads from:  static/<name>.jpg
# Writes to:   static/optimized/<name>.jpg
#
# Usage:
#   npm run optimize-image -- <name>              # center crop (default)
#   npm run optimize-image -- <name> north        # keep top of image (e.g. tall portraits)
#   npm run optimize-image -- <name> center 600   # custom output size
#
# Requires: ImageMagick (magick)

set -euo pipefail

SIZE=800
QUALITY=85
GRAVITY="center"

name="${1:-}"
if [[ -z "$name" ]]; then
  echo "Usage: npm run optimize-image -- <name> [gravity] [size]"
  echo ""
  echo "  name      Image filename without extension (e.g. serena-gao)"
  echo "  gravity   Crop anchor: center (default), north, south, east, west"
  echo "  size      Output dimension in px (default: 800)"
  echo ""
  echo "Examples:"
  echo "  npm run optimize-image -- serena-gao"
  echo "  npm run optimize-image -- chaolan-lin north"
  echo "  npm run optimize-image -- chaolan-lin north 600"
  exit 1
fi

GRAVITY="${2:-$GRAVITY}"
SIZE="${3:-$SIZE}"

INPUT="static/${name}.jpg"
OUTPUT="static/optimized/${name}.jpg"

if [[ ! -f "$INPUT" ]]; then
  echo "Error: $INPUT not found"
  exit 1
fi

if ! command -v magick &>/dev/null; then
  echo "Error: ImageMagick (magick) is required. Install with: brew install imagemagick"
  exit 1
fi

mkdir -p static/optimized

magick "$INPUT" \
  -resize "${SIZE}x${SIZE}^" \
  -gravity "$GRAVITY" \
  -extent "${SIZE}x${SIZE}" \
  -quality "$QUALITY" \
  -strip \
  "$OUTPUT"

input_size=$(du -h "$INPUT" | cut -f1 | xargs)
output_size=$(du -h "$OUTPUT" | cut -f1 | xargs)
dims=$(magick identify -format '%wx%h' "$OUTPUT")

echo "Optimized: $INPUT ($input_size) -> $OUTPUT ($output_size, ${dims}, q${QUALITY}, gravity: ${GRAVITY})"
