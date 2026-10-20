# motion-graphics-from-phone

Motion graphics as code: a Remotion project built by Claude Code in a cloud environment, driven from the Claude
mobile app. Companion repo for the join.dev deep dive "Ask for the Code, Not the Video".

- `brand/`: the kids.join.dev logo files (badge + wordmark) the logo reveal animates.
- Rendered videos and frame strips are committed under `renders/`.
- `src/KidsLogoReveal.tsx`: the 6 s, 1920x1080 @ 30 fps `KidsLogoReveal` composition. The badge is rebuilt in SVG from
  `brand/` so the ring, Bit and the brackets can move separately; Fredoka is extracted from the brand SVGs into
  `public/fonts/`.
- `scripts/strip.sh <out.png>`: renders every 5th frame small and tiles them into a numbered contact sheet.

```bash
npm install
npx remotion studio                       # preview
npx remotion render KidsLogoReveal renders/kids-logo-reveal.mp4
# No network for Remotion's browser download? Use a local Chromium:
#   --browser-executable=/path/to/headless_shell   (strip.sh reads $REMOTION_BROWSER)
```
