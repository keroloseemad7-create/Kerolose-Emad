# Miaflex Spray — vertical ad (Remotion)

Turns the 40s handheld `miaflex.mp4` into a ~20.6s, 1080x1920, 30fps beat-cut ad → `out/miaflex_ad.mp4`.

## Re-render after changes

```bash
npm install          # first time only
npm run build        # audio + beat grid -> render -> out/preview_sheet.jpg
```

`npm run build` = `npm run audio` (beat grid + music/SFX) → `npm run render` → `npm run sheet` (3-frame contact sheet).
Live preview while editing: `npm run studio`.

## What to edit

Everything editable is in **`src/config.json`**:

| Key | What it controls |
|---|---|
| `text.*` | Hook words, reveal title, "PSST!", end-card title / "by ONYX Pharma" / CTA (`cta` = "Available now" placeholder) |
| `clips[]` | The edit, in order. `beats` = length (125 BPM → 1 beat = 0.48s), `src` = start second in miaflex.mp4, `speed` = playback speed (2–3 = speed ramp), `in` = transition into the clip: `cut`, `whip`, `zoom`, `flash-white`, `flash-purple` |
| `clips[reveal].freeze` | Freeze frame on the product reveal (`atSrc` must match `public/still_reveal.jpg` + `public/cut_upright.png`) |
| `callouts[]` | The 3 feature callouts: `lines`, `icon` (`droplet` / `flex` / `shield`), `anchor` (point on the label, relative to the tracked label), `box` (x/y in px on the 1080x1920 canvas) |
| `spray` | Spray burst moment (`burstAtSrc`), nozzle position keyframes, mist direction/spread/particle count |
| `impactBeats` | Beats that get camera shake + impact SFX |
| `grade` | Contrast, saturation, brightness, cool tint, background blur/darken |
| `previewSheetAtSec` | Which 3 moments go in the contact sheet |

Safe areas: keep text between y=192 and y=1536 (top 10% / bottom 20% are covered by social UI).

## Audio

Set in `config.audio`: `originalSound` (the footage's own street sound, on by default), `music` (off), `sfx` (whooshes/impacts/psst, `sfxVolume`).

## Music

Drop a track at `./music.mp3` and run `npm run build`: `scripts/make_audio.py` detects its BPM and first beat,
writes `src/data/beatgrid.json`, and every cut/impact re-snaps to that grid. Without it, a 125 BPM grid and a
generated placeholder beat (`public/music_generated.wav`) are used. SFX (impacts, whooshes, psst, riser) are
always in `public/sfx.wav`, generated on the same grid.

## Helper scripts

- `scripts/track.py miaflex.mp4` → `public/track.json` (copy to `src/data/track.json`): per-frame position of the purple label, used to aim callouts and keep the bottle sharp while the street is blurred.
- `scripts/cutout.py <sec> <out.png> [x0 y0 x1 y1]` → RGBA bottle cutout (used for the glow outline + end card). `EXCLUDE="x0,y0,x1,y1"` drops stray background pieces.
- `remotion.config.ts` points to the Chromium on this machine; delete that line elsewhere so Remotion uses its own.
