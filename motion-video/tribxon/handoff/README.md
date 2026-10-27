# Tribxon – "خُده!" hand-off reel (9:16, 12s)

`tribxon_handoff_9x16.mp4` — a hand emerges from deep inside the screen (a tunnel of
screen frames) and pushes the bottle outward in three beats
(خُد! / امسك! / خُده بقى!) until it breaks out of the screen frame, then a closing order
card: price 440 جنيه, "اطلبه دلوقتي", and the website / Facebook / Instagram channels.

Built with free tools only (Chromium + Playwright, ffmpeg, Python/numpy).

## Rebuild
```bash
cd source
python3 cut.py          # src.jpg -> bottle.png (background removal)
python3 make_audio.py   # audio.wav (beat + whooshes + impact)
node render.js preview  # stills prev_*.jpg for a quick look
node render.js video    # ../video_noaudio.mp4
cd .. && ffmpeg -i video_noaudio.mp4 -i source/audio.wav -c:v copy -c:a aac -shortest tribxon_handoff_9x16.mp4
```
Texts, price and timings live in `source/index.html` (`KEYS` = push timings/scales).
