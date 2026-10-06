# TIDDY — Legend on Two Bearings

30-second cinematic motion graphic (1920×1080, 30fps, 900 frames) built with Remotion.

```bash
npm install
npm run studio   # live preview
npm run render   # -> out/tiddy.mp4
# equivalent to:
npx remotion render src/index.ts Tiddy out/tiddy.mp4 --codec=h264 --crf=18 --audio-codec=aac --audio-bitrate=320k
```

## Structure
- `src/Root.tsx` – the single `Tiddy` composition
- `src/TiddyVideo.tsx` – scene sequencing + global vignette / film grain / cut flashes
- `src/theme.ts` – palette, fonts, easing, 120 BPM beat grid (`BEAT = 15` frames), shake helpers, scene timings
- `src/scenes/` – one component per scene: `Build`, `Reveal`, `Ride`, `Details`, `Jump`, `EndCard`
- `src/components/` – SVG parts (gears, bearing, spring, screw), spark simulator, metallic glitch text, city/street parallax
- `public/tiddy.png` – Tiddy cut out from the black background; `public/tiddy-ride.png` – same, rotated into riding pose
- `tiddy-original.png` – the untouched source photo

## Soundtrack
`public/music.wav` is an original 120 BPM, D-minor hybrid trailer/rock-electronic track, synthesized
from scratch by `music/make_music.py` (no samples, royalty-free). Every hit is placed on the video's beat grid:
metal clangs as the parts snap together, braams on the reveal and title slam, a full drop for the ride,
a clang per word in the details, a slow-motion drop + explosion + landing impact for the jump, and a final chord on the end card.

```bash
./music/build.sh   # regenerate + master the track (needs python3 + numpy + ffmpeg)
```
