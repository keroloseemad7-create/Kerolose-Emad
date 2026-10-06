"""Procedural, beat-synced soundtrack for the Tiddy video.

120 BPM (one beat = 0.5s = 15 video frames), D minor, hybrid trailer / rock-electronic.
Every hit lines up with the impacts, cuts and words in the Remotion scenes.

    python3 music/make_music.py public/music.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def tt(sec):
    return np.arange(int(sec * SR)) / SR


def noise(sec):
    return rng.uniform(-1, 1, int(sec * SR))


def fft_filter(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = np.ones_like(f)
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * H, len(x))


def lp_sweep(x, cut, passes=2):
    """Time-varying one-pole lowpass (cascaded)."""
    a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR)
    y = x
    for _ in range(passes):
        out = np.empty_like(y)
        s = 0.0
        for i in range(len(y)):
            s += a[i] * (y[i] - s)
            out[i] = s
        y = out
    return y


def saw(freq, t, detune=0.0):
    ph = np.cumsum(np.broadcast_to(freq * (1 + detune), t.shape)) / SR
    return 2 * (ph % 1.0) - 1


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.05):
    env = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n))
    env[:na] = np.linspace(0, 1, na)
    if na + nd < n:
        env[na:na + nd] = np.linspace(1, s, nd)
    if nr < n:
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= N or i < -len(sig):
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[: N - i]
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l, sig * r], 1) * 1.4142
        self.x[i:i + len(sig)] += sig * gain


def reverb(x, sec=2.4, decay=0.55, tone=6000):
    n = int(sec * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    L = 1 << int(np.ceil(np.log2(len(x) + n)))
    for ch in range(2):
        ir = fft_filter(rng.normal(0, 1, n), hi=tone) * np.exp(-t / decay)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
    return out


# ---------------------------------------------------------------- instruments
def kick(punch=1.0, length=0.5):
    t = tt(length)
    f = 44 + 120 * punch * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = fft_filter(noise(length), lo=2000) * np.exp(-t * 400) * 0.35
    return np.tanh(1.8 * (body + click)) * 0.95


def snare(length=0.4):
    t = tt(length)
    tone = (np.sin(2 * np.pi * 185 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 22) * 0.55
    nz = fft_filter(noise(length), lo=1200, hi=9000) * np.exp(-t * 13)
    return np.tanh(1.5 * (tone + nz))


def clap(length=0.35):
    t = tt(length)
    nz = fft_filter(noise(length), lo=900, hi=4500)
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += (t >= d) * np.exp(-np.maximum(t - d, 0) * (180 if d < 0.02 else 18))
    return nz * env * 0.8


def hat(open_=False):
    length = 0.35 if open_ else 0.07
    t = tt(length)
    nz = fft_filter(noise(length), lo=7000)
    return nz * np.exp(-t * (11 if open_ else 70)) * 0.6


def crash(length=2.8):
    t = tt(length)
    nz = fft_filter(noise(length), lo=3500, hi=15000)
    metal = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in rng.uniform(3000, 9000, 12)) / 12
    return (nz + 0.25 * metal) * np.exp(-t * 1.7) * 0.7


def tom(f0, length=0.45):
    t = tt(length)
    f = f0 * (1 + 0.6 * np.exp(-t * 18))
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7))


def metal_hit(f0=420, length=1.6):
    """Anvil / scrap-metal clang: inharmonic partials."""
    t = tt(length)
    ratios = [1, 2.76, 5.40, 8.93, 13.34, 3.9]
    decays = [3.5, 5, 7, 10, 14, 6]
    s = sum(np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t * d) / (1 + i * 0.4)
            for i, (r, d) in enumerate(zip(ratios, decays)) if f0 * r < 16000)  # no aliasing
    s += fft_filter(noise(length), lo=2500) * np.exp(-t * 45) * 0.8
    return s * 0.45


def sub_boom(length=2.2, f_hi=70, f_lo=26):
    t = tt(length)
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 3)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6))


def impact(big=1.0, length=3.0):
    t = tt(length)
    s = sub_boom(length) * 0.95
    s += fft_filter(noise(length), hi=1800) * np.exp(-t * 9) * 0.9
    s += kick(1.2, length) * 0.8
    out = s * big
    return out


def braam(roots, length=3.0, peak=2400):
    t = tt(length)
    s = np.zeros_like(t)
    for f in roots:
        for d in (-0.012, -0.004, 0.0, 0.006, 0.013):
            s += saw(f, t, d)
    s /= 5 * len(roots)
    cut = 120 + (peak - 120) * np.exp(-((t - 0.25) ** 2) / 0.35) * (t > 0) + 140
    s = lp_sweep(np.tanh(2.8 * s), cut)
    env = np.minimum(1, t / 0.04) * np.exp(-t * 0.7)
    return s * env * 1.6


def riser(length=2.0, f0=180, f1=1600):
    t = tt(length)
    p = t / length
    f = f0 * (f1 / f0) ** (p ** 1.6)
    tonal = sum(saw(f, t, d) for d in (-0.01, 0, 0.012)) / 3
    nz = noise(length)
    cut = 400 + 9000 * p ** 2
    s = lp_sweep(0.5 * tonal + 0.8 * nz, cut, passes=1)
    return s * p ** 2.2 * 0.8


def whoosh(length=0.45, up=True):
    t = tt(length)
    p = t / length
    cut = (300 + 5000 * p ** 2) if up else (5300 - 5000 * p ** 0.5)
    nz = noise(length)
    s = lp_sweep(nz, cut) - lp_sweep(nz, cut * 0.25)
    env = np.sin(np.pi * np.clip(p, 0, 1)) ** (1.5 if up else 0.7)
    return s * env * 2.2


def reverse_cymbal(length=1.5):
    c = crash(length + 0.5)[: int(length * SR)]
    return c[::-1] * 1.1


def bass_note(freq, length, drive=3.0, cutoff=900):
    t = tt(length)
    s = 0.6 * saw(freq, t, -0.005) + 0.6 * saw(freq, t, 0.005) + 0.9 * np.sin(2 * np.pi * freq * t)
    s = fft_filter(s, hi=cutoff)
    env = adsr(len(t), a=0.003, d=0.08, s=0.75, r=0.02)
    return np.tanh(drive * s * env) * 0.55


def supersaw(freqs, length, cutoff=3800, a=0.004, r=0.04, s_lvl=0.8):
    t = tt(length)
    s = np.zeros_like(t)
    for f in freqs:
        for d in (-0.018, -0.009, 0.0, 0.008, 0.017):
            s += saw(f, t, d)
    s = fft_filter(s / (5 * len(freqs)), hi=cutoff)
    return s * adsr(len(t), a=a, d=0.12, s=s_lvl, r=r) * 1.6


def lead_note(freq, length):
    t = tt(length)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15)
    ph = np.cumsum(freq * vib) / SR
    sq = np.sign(np.sin(2 * np.pi * ph)) * 0.6 + (2 * (ph % 1) - 1) * 0.5
    s = fft_filter(sq, hi=4200)
    return np.tanh(1.5 * s) * adsr(len(t), a=0.006, d=0.1, s=0.8, r=0.05) * 0.5


def glitch(length=0.8):
    """Stuttered, bit-crushed digital burst for the title glitch."""
    t = tt(length)
    src = (saw(220, t) + noise(length)) * 0.5
    src = np.round(src * 6) / 6
    gate = ((t * 32).astype(int) % 2 == 0) * (rng.uniform(0, 1, len(t)) > 0.0)
    chop = np.repeat(rng.uniform(0.2, 1, int(length * 32) + 1), int(SR / 32) + 1)[: len(t)]
    return src * gate * chop * np.exp(-t * 2.5) * 0.5


def shimmer(length=2.0):
    t = tt(length)
    s = np.zeros_like(t)
    for k, f in enumerate([1174.7, 1396.9, 1760.0, 2349.3, 2793.8, 3520.0]):
        start = k * 0.06
        tk = np.maximum(t - start, 0)
        s += np.sin(2 * np.pi * f * tk) * (t >= start) * np.exp(-tk * 2.2)
    return s * 0.12


# ---------------------------------------------------------------- notes / harmony
D1, A1, BB1, C2, D2, F2 = 36.71, 55.0, 58.27, 65.41, 73.42, 87.31
CHORDS = {  # root (bass) and triad voicing
    'Dm': (D2, [293.66, 349.23, 440.00]),
    'Bb': (BB1, [233.08, 293.66, 349.23]),
    'F': (F2, [220.00, 261.63, 349.23]),
    'C': (C2, [196.00, 261.63, 329.63]),
}
PROG = ['Dm', 'Bb', 'F', 'C']

drums, bass, synth, fx, verb_send = Bus(), Bus(), Bus(), Bus(), Bus()
kick_times = []


def K(t, g=1.0, punch=1.0):
    drums.add(kick(punch), t, g)
    kick_times.append(t)


# ---------------------------------------------------------------- 0-4s  THE BUILD
drone_t = tt(4.0)
drone = sum(saw(f, drone_t, d) for f in (D1, A1, D2) for d in (-0.006, 0.006)) / 6
drone = lp_sweep(drone, 150 + 900 * (drone_t / 4.0) ** 2) * np.minimum(1, drone_t / 1.5) * 0.9
synth.add(drone, 0.0, 0.9)
for i in range(8):  # ticking clockwork
    t0 = i * 0.25 + 0.0
    fx.add(metal_hit(2600 + (i % 2) * 400, 0.12) * 0.25, t0, 0.5, pan=0.4 if i % 2 else -0.4)
for i, t0 in enumerate([1.0, 1.5, 2.0, 2.5, 3.0]):  # parts snapping together
    m = metal_hit(330 + i * 70)
    fx.add(m, t0, 0.9, pan=[-0.5, -0.3, 0.3, 0.0, 0.0][i])
    verb_send.add(m, t0, 0.5)
    K(t0, 0.9, 1.1)
    drums.add(tom(90 + i * 15), t0, 0.5)
    for k in range(4):  # 16th tick fill between hits
        drums.add(hat(), t0 + 0.25 + k * 0.0625, 0.25 + 0.1 * k)
fx.add(metal_hit(520, 2.0), 3.5, 1.0)
verb_send.add(metal_hit(520, 2.0), 3.5, 0.7)
fx.add(impact(0.7), 3.5, 0.8)
kick_times.append(3.5)
fx.add(riser(2.0), 2.0, 0.6)
fx.add(reverse_cymbal(1.0), 3.0, 0.6)

# ---------------------------------------------------------------- 4-9s  THE REVEAL
fx.add(impact(1.0), 4.0, 1.0)
fx.add(braam([D1, D2, A1 * 2]), 4.0, 0.75)
fx.add(crash(), 4.0, 0.6)
verb_send.add(crash(), 4.0, 0.3)
kick_times.append(4.0)
# tense 16th bass pulse under the spotlight sweep
for i in range(int(1.5 / 0.125)):
    t0 = 4.0 + i * 0.125
    bass.add(bass_note(D2, 0.11, drive=2.0, cutoff=300 + i * 40), t0, 0.6)
for i in range(8):  # snare roll into the title slam
    drums.add(snare(0.2), 4.5 + i * 0.125, 0.25 + i * 0.07)
fx.add(riser(1.0, 300, 2400), 4.5, 0.6)
# TITLE SLAM @ 5.5s
fx.add(impact(1.2), 5.5, 1.1)
fx.add(braam([D1, D2, F2 * 2, A1 * 4], 3.5, 3200), 5.5, 0.85)
fx.add(crash(), 5.5, 0.8)
fx.add(glitch(0.8), 5.5, 0.55)
verb_send.add(crash(), 5.5, 0.4)
kick_times.append(5.5)
# half-time groove until the ride
for b in range(int((9.0 - 6.0) / BEAT)):
    t0 = 6.0 + b * BEAT
    if b % 4 in (0, 2) and b < 4:
        K(t0, 0.85)
    if b % 4 == 2 and b < 4:
        drums.add(snare(), t0, 0.7)
    drums.add(hat(), t0 + 0.25, 0.3)
for i, ch in enumerate(['Dm', 'Bb', 'C']):
    root, triad = CHORDS[ch]
    t0 = 6.0 + i * 1.0
    synth.add(supersaw(triad, 1.0, cutoff=1800 + i * 800, a=0.05), t0, 0.45)
    for k in range(8):
        bass.add(bass_note(root, 0.12), t0 + k * 0.125, 0.65)
fx.add(shimmer(), 7.5, 1.0)
verb_send.add(shimmer(), 7.5, 1.2)
# fill + whip into the ride
for k in range(8):
    drums.add(snare(0.2), 8.0 + k * 0.0625, 0.3 + k * 0.06)
for k, f in enumerate([180, 150, 120, 95]):
    drums.add(tom(f), 8.5 + k * 0.125, 0.8)
fx.add(riser(1.0, 250, 3000), 8.0, 0.7)
fx.add(whoosh(0.4), 8.62, 0.8)

# ---------------------------------------------------------------- 9-16s  THE RIDE (drop) + 16-22s DETAILS
GROOVE_START, GROOVE_END = 9.0, 23.0
fx.add(impact(0.9), 9.0, 0.9)
fx.add(crash(), 9.0, 0.8)
nbeats = int((GROOVE_END - GROOVE_START) / BEAT)
for b in range(nbeats):
    t0 = GROOVE_START + b * BEAT
    bar = b // 4
    ch = PROG[bar % 4]
    root, triad = CHORDS[ch]
    K(t0, 1.0)
    if b % 2 == 1:
        drums.add(snare(), t0, 0.8)
        drums.add(clap(), t0, 0.5)
    for k in range(4):
        drums.add(hat(), t0 + k * 0.125, [0.45, 0.22, 0.32, 0.22][k], pan=0.25)
    drums.add(hat(True), t0 + 0.25, 0.28, pan=-0.2)
    # driving 16th bass with octave pops
    for k in range(4):
        f = root * (2 if k == 2 else 1)
        bass.add(bass_note(f, 0.12, drive=3.5, cutoff=1100), t0 + k * 0.125, 0.75 if k == 0 else 0.6)
    # offbeat supersaw stabs (pumped by sidechain)
    synth.add(supersaw(triad, 0.22, cutoff=4200), t0 + 0.25, 0.42)
    if b % 8 == 7:  # tom fill every 2 bars
        for k, f in enumerate([200, 160, 130, 100]):
            drums.add(tom(f, 0.3), t0 + k * 0.125, 0.55)
for t0 in (13.0, 17.0, 21.0):
    fx.add(crash(), t0, 0.55)

# lead hook (enters after 2 bars of groove, rests during the detail words)
E = 0.25
hook = [  # (beat offset in 8ths, freq, length in 8ths)
    (0, 587.33, 1), (1, 587.33, 1), (2, 698.46, 2), (4, 659.26, 1), (5, 587.33, 1), (6, 523.25, 2),
    (8, 440.00, 1), (9, 523.25, 1), (10, 587.33, 4), (14, 523.25, 1), (15, 587.33, 1),
    (16, 587.33, 1), (17, 587.33, 1), (18, 698.46, 2), (20, 783.99, 1), (21, 698.46, 1), (22, 659.26, 2),
    (24, 698.46, 1), (25, 659.26, 1), (26, 523.25, 2), (28, 587.33, 4),
]
for start in (11.0,):
    for off, f, ln in hook:
        n = lead_note(f, ln * E * 0.95)
        synth.add(n, start + off * E, 0.55, pan=0.1)
        verb_send.add(n, start + off * E, 0.25)
        synth.add(n * 0.35, start + off * E + 0.375, 0.5, pan=-0.5)  # dotted-8th echo

# details: a metal hit on every word, whoosh into every shot
for shot in range(3):
    s0 = 16.0 + shot * 2.0
    for w in range(3):
        t0 = s0 + w * 0.5
        m = metal_hit([440, 520, 620][w] * (1 + 0.06 * shot), 1.0)
        fx.add(m, t0, 0.75, pan=[-0.3, 0.3, 0][w])
        verb_send.add(m, t0, 0.35)
        if w == 2:
            fx.add(sub_boom(1.0, 90, 35), t0, 0.5)
            kick_times.append(t0)
    fx.add(whoosh(0.3), s0 - 0.28, 0.6)
# stutter answer phrases on the detail beats
for shot in range(3):
    s0 = 16.0 + shot * 2.0
    for off, f in [(6, 587.33), (7, 698.46)]:
        synth.add(lead_note(f, 0.2), s0 + off * E, 0.45)

# ---------------------------------------------------------------- 22-27s  THE JUMP
for k in range(16):  # snare roll + riser into launch
    drums.add(snare(0.15), 22.0 + k * 0.0625, 0.2 + k * 0.04)
fx.add(riser(1.0, 300, 3500), 22.0, 0.8)
# LAUNCH @ 23.0 -> slow motion
fx.add(impact(0.8), 23.0, 0.8)
fx.add(whoosh(0.9, up=False), 23.0, 0.8)
kick_times.append(23.0)
slow_t = tt(2.5)
pad = sum(saw(f, slow_t, d) for f in (D2, A1 * 2, 349.23 / 2) for d in (-0.01, 0.01)) / 6
pad = lp_sweep(pad, 300 + 500 * np.sin(np.pi * slow_t / 2.5)) * np.sin(np.pi * np.minimum(slow_t / 2.5, 1)) ** 0.5
synth.add(pad, 23.0, 0.9)
fx.add(sub_boom(2.5, 40, 30) * 0.6, 23.0, 0.6)
for t0 in (23.5, 23.75, 24.75, 25.0):  # slowed heartbeat
    drums.add(kick(0.4, 0.4), t0, 0.5)
# EXPLOSION @ 24.0
fx.add(impact(1.2), 24.0, 1.0)
fx.add(crash(3.5), 24.0, 0.9)
for k in range(10):  # flying debris
    m = metal_hit(rng.uniform(500, 1400), 0.6)
    fx.add(m, 24.05 + k * rng.uniform(0.03, 0.09) * k / 3, 0.3, pan=rng.uniform(-0.8, 0.8))
verb_send.add(crash(3.5), 24.0, 0.6)
kick_times.append(24.0)
fx.add(reverse_cymbal(1.2), 24.3, 0.7)
fx.add(riser(1.0, 200, 2000), 24.5, 0.6)
# LANDING @ 25.5
fx.add(impact(1.4), 25.5, 1.15)
fx.add(braam([D1, D2, A1 * 2], 2.0, 2600), 25.5, 0.7)
fx.add(crash(), 25.5, 0.9)
fx.add(metal_hit(300, 2.0), 25.5, 0.8)
kick_times.append(25.5)
for b in range(3):  # groove slams back for 3 beats
    t0 = 25.5 + b * BEAT
    if b:
        K(t0, 1.0)
    if b % 2 == 1:
        drums.add(snare(), t0, 0.8)
        drums.add(clap(), t0, 0.5)
    root, triad = CHORDS['Dm' if b < 2 else 'C']
    for k in range(4):
        drums.add(hat(), t0 + k * 0.125, 0.3)
        bass.add(bass_note(root * (2 if k == 2 else 1), 0.12, drive=3.5, cutoff=1100), t0 + k * 0.125, 0.65)
    synth.add(supersaw(triad, 0.22, cutoff=4200), t0 + 0.25, 0.42)
for k, f in enumerate([220, 180, 140, 110]):
    drums.add(tom(f, 0.3), 26.5 + k * 0.125, 0.7)

# ---------------------------------------------------------------- 27-30s  END CARD
fx.add(impact(1.2, 3.0), 27.0, 1.0)
fx.add(braam([D1, D2, A1 * 2, 349.23], 3.0, 2000), 27.0, 0.8)
fx.add(crash(3.0), 27.0, 0.8)
verb_send.add(crash(3.0), 27.0, 0.5)
kick_times.append(27.0)
end_t = tt(3.0)
chord = supersaw([146.83, 220.0, 293.66, 349.23, 440.0], 3.0, cutoff=2600, a=0.02, r=1.2, s_lvl=0.7)
synth.add(chord, 27.0, 0.45)
verb_send.add(chord, 27.0, 0.3)
fx.add(shimmer(2.5), 28.0, 1.0)
verb_send.add(shimmer(2.5), 28.0, 1.0)
for k in range(4):
    fx.add(metal_hit(2600, 0.15) * 0.3, 28.0 + k * 0.5, 0.5, pan=0.5 if k % 2 else -0.5)

# ---------------------------------------------------------------- mix
# sidechain pump: duck bass/synths on every kick and impact
duck = np.ones(N)
dl = int(0.28 * SR)
dt = np.arange(dl) / SR
shape = 1 - 0.55 * np.exp(-dt / 0.09)
for t0 in kick_times:
    i = int(t0 * SR)
    if i < N:
        seg = shape[: N - i]
        duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
duck2 = np.stack([duck, duck], 1)

mix = drums.x * 0.9 + bass.x * duck2 * 0.85 + synth.x * duck2 * 0.75 + fx.x * 0.8
wet = reverb(verb_send.x + drums.x * 0.08 + synth.x * 0.25 + fx.x * 0.15)
mix += wet * 0.35
mix = np.stack([fft_filter(mix[:, c], lo=28, order=2) for c in range(2)], 1)

# gentle fade at the very end, soft clip + normalise
fade = np.ones(N)
fl = int(0.6 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(1.6 * mix) / np.tanh(1.6)
mix *= 0.97

out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, mix.shape[0] / SR, 's')
