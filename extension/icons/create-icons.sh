#!/bin/bash
# Script to create placeholder SVG icons
# You can replace these with proper PNG icons later

# Create a simple bookmark icon SVG
cat > icon.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <g transform="translate(0, 0) scale(5.5)">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>
</svg>
SVGEOF

echo "SVG icon created. Install ImageMagick to convert to PNG:"
echo "sudo apt-get install imagemagick"
echo "Then run: convert -background none -resize 16x16 icon.svg icon16.png"
echo "         convert -background none -resize 48x48 icon.svg icon48.png"
echo "         convert -background none -resize 128x128 icon.svg icon128.png"
