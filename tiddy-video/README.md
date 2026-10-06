# TIDDY — Legend on Two Bearings

30-second cinematic motion graphic (1920×1080, 30fps, 900 frames) built with Remotion.

```bash
npm install
npm run studio   # live preview
npm run render   # -> out/tiddy.mp4
# equivalent to:
npx remotion render src/index.ts Tiddy out/tiddy.mp4 --codec=h264 --crf=18
```

## Structure
- `src/Root.tsx` – the single `Tiddy` composition
- `src/TiddyVideo.tsx` – scene sequencing + global vignette / film grain / cut flashes
- `src/theme.ts` – palette, fonts, easing, 120 BPM beat grid (`BEAT = 15` frames), shake helpers, scene timings
- `src/scenes/` – one component per scene: `Build`, `Reveal`, `Ride`, `Details`, `Jump`, `EndCard`
- `src/components/` – SVG parts (gears, bearing, spring, screw), spark simulator, metallic glitch text, city/street parallax
- `public/tiddy.png` – Tiddy cut out from the black background; `public/tiddy-ride.png` – same, rotated into riding pose
- `tiddy-original.png` – the untouched source photo

All cuts and impacts sit on 0.5s beats (120 BPM): drop in a 120 BPM track and it lines up.
