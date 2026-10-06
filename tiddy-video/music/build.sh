#!/usr/bin/env bash
# Regenerate the soundtrack: synthesize -> compress -> limit -> public/music.wav
set -euo pipefail
cd "$(dirname "$0")/.."
python3 music/make_music.py music/raw.wav
ffmpeg -loglevel error -y -i music/raw.wav \
  -af "acompressor=threshold=0.12:ratio=3:attack=8:release=140:makeup=2.2:knee=4,volume=2.5dB,alimiter=limit=0.8:attack=2:release=50:level=disabled" \
  -ar 48000 public/music.wav
rm music/raw.wav
echo "wrote public/music.wav"
