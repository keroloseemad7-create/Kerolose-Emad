#!/usr/bin/env bash
# Regenerate the v2 soundtrack from src/v2/timeline.json: synthesize -> compress -> limit -> public/music_v2.wav
set -euo pipefail
cd "$(dirname "$0")/.."
python3 music/make_music_v2.py music/raw_v2.wav
ffmpeg -loglevel error -y -i music/raw_v2.wav \
  -af "acompressor=threshold=0.12:ratio=3:attack=8:release=140:makeup=2.2:knee=4,volume=2.5dB,alimiter=limit=0.8:attack=2:release=50:level=disabled" \
  -ar 48000 public/music_v2.wav
rm music/raw_v2.wav
echo "wrote public/music_v2.wav"
