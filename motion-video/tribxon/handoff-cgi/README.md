# Tribxon – "خُده!" CGI reel (9:16, 12s, 24fps)

`tribxon_handoff_cgi_9x16.mp4` — a 3D Opta Tribxon bottle (Blender/Cycles) comes up a glowing
tunnel inside a giant phone screen, pushes out in three beats (خُد! / امسك! / خُده بقى!) right up
to the lens, then settles in front of the phone with the order card (440 جنيه, website / Facebook / Instagram).

Free tools only: Blender as a Python module (`pip install bpy`), Chromium + Playwright, ffmpeg, numpy.

## Rebuild
```bash
cd source
python3 label_tex.py               # src.jpg -> label.png (unwrapped label)
python3 scene.py still 0.6,3.9,7   # test stills -> stills/
python3 scene.py anim 1 288        # 3D frames -> frames/ (~2h on 4 CPU cores; resumable)
node render_overlay.js             # texts/card as transparent PNGs -> overlay/
python3 make_audio.py              # audio.wav
cd .. && ffmpeg -framerate 24 -i source/frames/%04d.png -framerate 24 -i source/overlay/%04d.png -i source/audio.wav \
  -filter_complex "[0]scale=1080:1920:flags=lanczos,fade=in:0:8,unsharp=5:5:0.6[b];[b][1]overlay=format=auto,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 17 -c:a aac -shortest tribxon_handoff_cgi_9x16.mp4
```
Motion timeline: `KEYS` in `source/scene.py`; text timings in `source/overlay.html`.
