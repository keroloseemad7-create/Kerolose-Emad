"""Estimate BPM + first-beat offset of a track and write them into src/v2/timeline.json.

    python3 tools/detect_beats.py music.mp3            # updates the beat grid
    python3 tools/detect_beats.py music.mp3 --dry-run  # just print

Copy the track to public/music.mp3 too: the composition plays it instead of the generated
soundtrack, and every hit in timeline.json snaps to this grid.
"""
import json
import os
import subprocess
import sys

import numpy as np

SR, HOP, NFFT = 22050, 512, 2048


def onset_envelope(path):
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    x = np.frombuffer(pcm, np.float32)
    frames = 1 + (len(x) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.log1p(np.abs(np.fft.rfft(x[idx] * np.hanning(NFFT), axis=1)) * 10)
    flux = np.maximum(0, np.diff(spec, axis=0)).sum(1)
    flux -= np.convolve(flux, np.ones(16) / 16, 'same')  # remove slow loudness drift
    return np.maximum(flux, 0)


def estimate(env, lo=80, hi=160):
    fps = SR / HOP
    ac = np.correlate(env, env, 'full')[len(env) - 1:]
    lags = np.arange(len(ac))
    bpm_of_lag = 60 * fps / np.maximum(lags, 1)
    ok = (bpm_of_lag >= lo) & (bpm_of_lag <= hi)
    # perceptual prior around 120 BPM resolves half/double/2:3 tempo confusions
    prior = np.exp(-0.5 * (np.log2(bpm_of_lag / 120) / 0.35) ** 2)
    lag = lags[ok][np.argmax((ac * prior)[ok])]
    # refine to sub-frame tempo by scanning nearby BPMs with a comb
    best = (-1, 0, 0)
    for bpm in np.arange(60 * fps / (lag + 1), 60 * fps / (lag - 1), 0.05):
        period = 60 * fps / bpm
        for phase in np.arange(0, period, 0.25):
            pos = np.arange(phase, len(env) - 1, period).astype(int)
            score = env[pos].sum()
            if score > best[0]:
                best = (score, bpm, phase)
    _, bpm, phase = best
    # flux frame i measures the change into STFT frame i+1, which peaks once the onset is ~3/4 into the window
    t0 = ((phase + 1) * HOP + 0.75 * NFFT) / SR
    return round(float(bpm), 2), round(float(t0), 3)


if __name__ == '__main__':
    path = sys.argv[1]
    bpm, offset = estimate(onset_envelope(path))
    spb = 60 / bpm
    offset = offset % spb
    print(f'{os.path.basename(path)}: {bpm} BPM, first beat at {offset:.3f}s')
    if '--dry-run' not in sys.argv:
        tl_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'v2', 'timeline.json')
        tl = json.load(open(tl_path))
        tl['music']['bpm'] = bpm
        tl['music']['offsetSec'] = offset
        json.dump(tl, open(tl_path, 'w'), indent=2)
        print('updated', os.path.relpath(tl_path))
