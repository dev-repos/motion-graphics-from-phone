#!/usr/bin/env bash
# Render every 5th frame of KidsLogoReveal small and tile them, in order, into one
# numbered contact sheet. Usage: scripts/strip.sh renders/strip-1.png
set -euo pipefail
out="${1:?usage: scripts/strip.sh <output.png>}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
npx remotion render KidsLogoReveal "$tmp/small.mp4" --scale=0.25 --crf=16 ${REMOTION_BROWSER:+--browser-executable="$REMOTION_BROWSER"}
ffmpeg -hide_banner -loglevel error -y -i "$tmp/small.mp4" \
  -vf "select='not(mod(n\,5))',drawtext=text='%{eif\:n*5\:d}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,tile=6x6:padding=4:color=white" \
  -frames:v 1 -fps_mode passthrough "$out"
echo "wrote $out"
