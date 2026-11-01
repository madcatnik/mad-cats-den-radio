#!/bin/bash
# Download self-hosted fonts for MAD CATS DEN
# Run from project root: bash assets/fonts/download-fonts.sh

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "Downloading Alfa Slab One..."
curl -L -o AlfaSlabOne-Regular.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/alfaslabone/AlfaSlabOne-Regular.ttf"

echo "Downloading Barlow Condensed ExtraBold..."
curl -L -o BarlowCondensed-ExtraBold.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/BarlowCondensed-ExtraBold.ttf"

echo "Downloading IBM Plex Mono SemiBold + Bold..."
curl -L -o IBMPlexMono-SemiBold.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf"
curl -L -o IBMPlexMono-Bold.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Bold.ttf"

echo "Converting TTF to WOFF2 (requires woff2_compress, install via: brew install woff2 or apt install woff2)..."
if command -v woff2_compress &> /dev/null; then
  for f in *.ttf; do woff2_compress "$f"; done
  echo "WOFF2 created"
else
  echo "woff2_compress not found - using TTF only (works but larger). Install woff2 tools for WOFF2 conversion"
  echo "  macOS: brew install woff2"
  echo "  Ubuntu: sudo apt install woff2"
fi

echo "Done. Files in assets/fonts/"
ls -lh *.ttf *.woff2 2>/dev/null || ls -lh *.ttf
