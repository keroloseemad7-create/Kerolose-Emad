"""Builds the audio for the ad and the beat grid the edit snaps to.

- If ./music.mp3 exists: copies it to public/, detects BPM + first-beat offset,
  writes src/data/beatgrid.json (the edit re-times itself to that grid).
- Otherwise: 125 BPM grid + a generated placeholder track (public/music_generated.wav).
- Always: public/sfx.wav (impacts, whooshes, spray "psst", riser, shimmer) on the grid.

Usage: python3 scripts/make_audio.py
"""
import json, os, shutil, subprocess, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, 'src/config.json')))
FPS, SR = cfg['video']['fps'], 44100
rng = np.random.default_rng(7)


def detect_beats(path):
    sr = 11025
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 128
    n = len(x) // hop
    e = np.log1p(1000 * np.square(x[:n * hop]).reshape(n, hop).mean(1))
    onset = np.maximum(0, np.diff(e, prepend=e[0]))
    onset -= onset.mean()
    fr = sr / hop                                          # onset frames per second
    ac = np.correlate(onset, onset, 'full')[len(onset) - 1:]
    lags = np.arange(len(ac))
    bpm_of = lambda lag: 60 * fr / lag
    ok = (lags > 0) & (bpm_of(np.maximum(lags, 1)) >= 70) & (bpm_of(np.maximum(lags, 1)) <= 180)
    lag = lags[ok][np.argmax(ac[ok])]
    bpm = bpm_of(lag)
    while bpm < 100: bpm *= 2                               # fold into the 100-160 band
    while bpm > 160: bpm /= 2
    period = 60 * fr / bpm
    phases = np.arange(0, period, 0.5)
    score = [onset[np.round(np.arange(p, len(onset), period)).astype(int)].sum() for p in phases]
    offset = phases[int(np.argmax(score))] / fr
    return round(float(bpm), 2), round(float(offset), 3)


music_in = os.path.join(ROOT, 'music.mp3')
if os.path.exists(music_in):
    shutil.copy(music_in, os.path.join(ROOT, 'public/music.mp3'))
    bpm, offset = detect_beats(music_in)
    grid = {'bpm': bpm, 'offsetSec': offset, 'source': 'music.mp3'}
    print(f'music.mp3 found -> {bpm} BPM, first beat at {offset}s')
else:
    grid = {'bpm': 125, 'offsetSec': 0, 'source': 'grid'}
    print('no music.mp3 -> 125 BPM grid + generated placeholder track')
json.dump(grid, open(os.path.join(ROOT, 'src/data/beatgrid.json'), 'w'))

# ---- same grid math as src/timeline.ts
FPB = FPS * 60 / grid['bpm']
OFF = round(grid['offsetSec'] * FPS)
beat_frame = lambda b: OFF + round(b * FPB)
clips, b = [], 0
for c in cfg['clips']:
    clips.append({**c, 'from': 0 if not clips else beat_frame(b), 'beat': b})
    b += c['beats']
TOTAL_BEATS, DUR = b, beat_frame(b)
N = int((DUR / FPS + 0.6) * SR)
sec = lambda fr: fr / FPS
beat_sec = 60 / grid['bpm']


def band_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(spec, n)
    return y / (np.abs(y).max() + 1e-9)


def place(buf, t, sig, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[max(i, 0):j] += gain * sig[max(0, -i):j - i]


def env(n, a, d):  # attack/decay seconds
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def kick():
    n = int(0.42 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) + 0.25 * band_noise(n, 1500, 5000) * np.exp(-t * 90)


def clap():
    n = int(0.25 * SR)
    s = band_noise(n, 900, 6000) * env(n, 0.002, 0.06)
    for k in (0.012, 0.024): s += np.roll(s, int(k * SR)) * 0.6
    return s * 0.7


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return band_noise(n, 7000, 16000) * env(n, 0.001, 0.07 if open_ else 0.015)


def tone(freq, dur, harm=6, decay=3.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * freq * h * t + h) / h for h in range(1, harm + 1))
    return y * np.exp(-t * decay)


# ---------------------------------------------------------------- generated placeholder music (125 BPM)
if grid['source'] == 'grid':
    L = np.zeros(N); Rr = np.zeros(N)
    duck = np.ones(N)
    t0 = grid['offsetSec']
    reveal = next(c for c in clips if c['id'] == 'reveal')
    fz = reveal['freeze']
    tension = (reveal['beat'] + fz['afterBeats'], reveal['beat'] + fz['afterBeats'] + fz['holdBeats'])
    end_beat = next(c for c in clips if c['id'] == 'endcard')['beat']
    roots = [55.0, 55.0, 43.65, 49.0]                       # A, A, F, G  (bass, per bar)
    chords = [[220, 261.6, 329.6], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]]
    for bt in range(int(TOTAL_BEATS) + 1):
        ts = t0 + bt * beat_sec
        quiet = tension[0] <= bt < tension[1]
        bar = (bt // 4) % 4
        if not quiet:
            place(L, ts, kick(), 0.9); place(Rr, ts, kick(), 0.9)
            d = 1 - 0.75 * env(int(0.3 * SR), 0.005, 0.12)
            i = int(ts * SR); duck[i:i + len(d)] = np.minimum(duck[i:i + len(d)], d[:max(0, min(len(d), N - i))])
            if bt % 2 == 1: place(L, ts, clap(), 0.5); place(Rr, ts + 0.008, clap(), 0.5)
            place(L, ts + beat_sec / 2, hat(True), 0.18); place(Rr, ts + beat_sec / 2, hat(True), 0.22)
        for s16 in range(4):
            place(L if s16 % 2 else Rr, ts + s16 * beat_sec / 4, hat(), 0.10 if not quiet else 0.05)
        if bt < end_beat or bt % 2 == 0:
            for half in (0.5,):
                place(L, ts + half * beat_sec, tone(roots[bar], beat_sec * 0.45, 4, 6), 0.35)
                place(Rr, ts + half * beat_sec, tone(roots[bar], beat_sec * 0.45, 4, 6), 0.35)
        if bt % 4 == 0:
            for k, fq in enumerate(chords[bar]):
                pad = tone(fq, beat_sec * 4, 7, 0.9) * env(int(beat_sec * 4 * SR), 0.03, 2.5)
                place(L, ts, pad, 0.07 * (1.6 if quiet else 1)); place(Rr, ts + 0.006 * (k + 1), pad, 0.07 * (1.6 if quiet else 1))
    L *= duck * 0.9 + 0.1; Rr *= duck * 0.9 + 0.1
    music = np.stack([L, Rr], 1)
else:
    music = None

# ---------------------------------------------------------------- SFX on the grid
S = np.zeros(N)
for b in cfg['impactBeats']:                                  # impacts
    n = int(0.9 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 4)
    crack = band_noise(n, 2000, 12000) * np.exp(-t * 40)
    place(S, sec(beat_frame(b)), boom * 0.55 + crack * 0.35)
for c in clips:                                               # whooshes into whip / zoom cuts
    if c['in'] in ('whip', 'zoom'):
        n = int(0.32 * SR); t = np.arange(n) / SR
        sw = band_noise(n, 300, 9000) * np.sin(np.pi * t / t[-1]) ** 2
        place(S, sec(c['from']) - 0.26, sw, 0.45)
    if c['in'].startswith('flash'):
        place(S, sec(c['from']), tone(1760, 0.25, 2, 14), 0.12)
spray = next(c for c in clips if c['id'] == cfg['spray']['clip'])
burst = sec(spray['from']) + (cfg['spray']['burstAtSrc'] - spray['src']) / spray.get('speed', 1)
n = int(0.6 * SR); t = np.arange(n) / SR
place(S, burst, band_noise(n, 3500, 14000) * env(n, 0.01, 0.18), 0.7)   # "psst"
end = next(c for c in clips if c['id'] == 'endcard')
n = int(2 * beat_sec * SR); t = np.arange(n) / SR                    # riser into end card
riser = band_noise(n, 800, 9000) * (t / t[-1]) ** 2 + 0.3 * np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / t[-1]) ** 2) / SR) * (t / t[-1])
place(S, sec(end['from']) - len(riser) / SR, riser, 0.4)
for k, fq in enumerate([1318.5, 1568, 1975.5, 2637]):                 # shimmer on the end card
    place(S, sec(end['from']) + 0.08 * k, tone(fq, 1.6, 3, 2.2), 0.08)
sfx = np.stack([S, S], 1)


def write(path, x):
    x = x / max(1.0, np.abs(x).max() / 0.95)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


write(os.path.join(ROOT, 'public/sfx.wav'), sfx)
if music is not None:
    write(os.path.join(ROOT, 'public/music_generated.wav'), music)
print(f'audio ready: {TOTAL_BEATS} beats, {DUR} frames ({DUR / FPS:.2f}s)')
