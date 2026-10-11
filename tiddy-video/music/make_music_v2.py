"""Procedural soundtrack for Tiddy v2 (40s vertical cut).

Reads src/v2/timeline.json (same file the Remotion scenes use) so every hit lands on the
same beat-snapped frame as the visuals.

    python3 music/make_music_v2.py public/music_v2.raw.wav   # then music/build_v2.sh masters it
"""
import json
import os
import sys
import wave

import numpy as np

import synth
from synth import (Bus, adsr, bass_note, braam, clap, crash, fft_filter, glitch, hat, impact, kick, lead_note,
                   lp_sweep, metal_hit, noise, reverb, reverse_cymbal, riser, rng, saw, shimmer, snare, sub_boom,
                   supersaw, tom, tt, whoosh)

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, '..', 'src', 'v2', 'timeline.json')))
synth.set_duration(TL['durationSec'])
SR, N = synth.SR, synth.N
SPB = 60 / TL['music']['bpm']
OFF = TL['music']['offsetSec']
FPS = TL['fps']


def snap(s):
    """Same rule as src/v2/config.ts: nearest beat, then to the video frame grid."""
    return round((OFF + round((s - OFF) / SPB) * SPB) * FPS) / FPS


EV = {k: v for k, v in TL['events'].items()}
SC = TL['scenes']
B = SPB  # one beat in seconds

drums, bass, syn, fx, send = Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []  # sidechain triggers


def K(t, g=1.0, punch=1.0):
    drums.add(kick(punch), t, g)
    kicks.append(t)


def HIT(t, big=1.0, roots=None, peak=2400, crash_g=0.7):
    fx.add(impact(big), t, 1.0)
    if roots:
        fx.add(braam(roots, 3.0, peak), t, 0.8)
    if crash_g:
        fx.add(crash(), t, crash_g)
        send.add(crash(), t, 0.35)
    kicks.append(t)


# ---------------------------------------------------------------- extra instruments
def tape_stop(bus, t0, length=0.7):
    """Pitch/tempo slows to a halt (vinyl brake) from t0, then silence until the bus is re-used."""
    i0, n = int(t0 * SR), int(length * SR)
    seg = bus.x[i0:i0 + n * 2].copy()
    speed = np.linspace(1, 0, n) ** 1.4
    pos = np.cumsum(speed)
    pos = np.clip(pos, 0, len(seg) - 2)
    out = np.stack([np.interp(pos, np.arange(len(seg)), seg[:, c]) for c in range(2)], 1)
    out *= np.linspace(1, 0.2, n)[:, None]
    bus.x[i0:i0 + n] = out
    bus.x[i0 + n:i0 + n * 2] = 0


def screech(length=0.9):
    t = tt(length)
    nz = noise(length)
    s = fft_filter(nz, lo=2500, hi=5200, order=3) * 2.2
    tone = np.sin(2 * np.pi * (3100 - 600 * t / length) * t) * 0.25
    env = np.minimum(1, t / 0.03) * np.exp(-t * 1.6) * (0.8 + 0.2 * np.sin(2 * np.pi * 23 * t))
    return (s + tone) * env * 0.6


def heartbeat():
    t = tt(0.5)
    f = 38 + 30 * np.exp(-t * 25)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return np.tanh(2.0 * s)


def ringing(length=1.6, f=6200):
    t = tt(length)
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.3) * np.exp(-t * 0.8) * 0.05


def thunder_crack(length=1.2):
    t = tt(length)
    nz = noise(length)
    crack_ = fft_filter(nz, lo=1500) * np.exp(-t * 40)
    rumble = fft_filter(nz, hi=220) * np.exp(-t * 2.2) * 3
    return np.tanh(1.5 * (crack_ + rumble)) * 0.8


def roar(length=2.2):
    """Synth monster roar: growling low saw with jittery pitch through a sweeping formant + grit."""
    t = tt(length)
    jitter = np.repeat(rng.uniform(-1, 1, int(length * 60) + 1), SR // 60 + 1)[: len(t)]
    f = 70 + 25 * np.sin(np.pi * t / length) + 8 * fft_filter(jitter, hi=30)
    g = sum(saw(f, t, d) for d in (-0.02, 0, 0.017)) / 3 + 0.8 * noise(length)
    cut = 300 + 1700 * np.sin(np.pi * np.minimum(t / length, 1)) ** 0.6
    s = lp_sweep(np.tanh(3.5 * g), cut)
    env = np.minimum(1, t / 0.08) * np.exp(-np.maximum(t - length * 0.6, 0) * 4)
    return np.tanh(2.5 * s * env) * 0.9


def clack(length=0.5):
    """Plastic/wood ruler snapping."""
    t = tt(length)
    s = fft_filter(noise(length), lo=1800, hi=9000) * np.exp(-t * 70)
    s += np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 35) * 0.5 + np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 50) * 0.3
    return s * 0.9


def reel_ticks(t_land, n=10, span=0.4):
    for k in range(n):
        t = t_land - span + span * (1 - (1 - k / n) ** 1.8)
        fx.add(metal_hit(3200, 0.05) * 0.4, t, 0.35, pan=0.5)
    fx.add(metal_hit(1567, 0.8), t_land, 0.45, pan=0.5)  # 'ding'


def blip_pop():
    t = tt(0.35)
    f = 300 * (4 ** np.minimum(t / 0.08, 1))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    s += fft_filter(noise(0.35), lo=2000) * np.exp(-t * 90) * 0.4
    return s * 0.8


def slide_whistle(f0=1300, f1=420, length=0.7):
    t = tt(length)
    f = f0 * (f1 / f0) ** (t / length) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(len(t), 0.02, 0.1, 0.8, 0.12) * 0.35


def boing(length=0.6):
    t = tt(length)
    f = 180 + 420 * (1 - np.exp(-t * 9)) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.6


def music_box(f, length=1.2):
    t = tt(length)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.002) * 0.3


def engine_rev(length=1.2):
    t = tt(length)
    f = 55 + 120 * (1 - np.exp(-t * 3)) + 15 * np.sin(2 * np.pi * 3 * t)
    ph = np.cumsum(f) / SR
    s = np.sign(np.sin(2 * np.pi * ph)) * 0.6 + (2 * (ph % 1) - 1) * 0.6
    s *= 0.6 + 0.4 * (np.sin(2 * np.pi * ph * 0.5) > 0)
    s = fft_filter(np.tanh(2 * s), hi=2200)
    return s * np.minimum(1, t / 0.05) * np.exp(-np.maximum(t - 0.7, 0) * 5) * 0.55


def groove(t0, t1, prog, lead=False, stabs=True, half=False, gain=1.0):
    """Driving 120 BPM groove between t0 and t1 (seconds)."""
    nb = int(round((t1 - t0) / B))
    for b in range(nb):
        t = t0 + b * B
        root, triad = CHORDS[prog[(b // 4) % len(prog)]]
        if not half or b % 2 == 0:
            K(t, gain)
        if (b % 2 == 1 and not half) or (half and b % 4 == 2):
            drums.add(snare(), t, 0.8 * gain)
            drums.add(clap(), t, 0.5 * gain)
        for k in range(4):
            drums.add(hat(), t + k * B / 4, [0.45, 0.22, 0.32, 0.22][k] * gain, pan=0.25)
        drums.add(hat(True), t + B / 2, 0.26 * gain, pan=-0.2)
        for k in range(4):
            bass.add(bass_note(root * (2 if k == 2 else 1), B / 4 * 0.95, drive=3.5, cutoff=1100), t + k * B / 4, (0.75 if k == 0 else 0.6) * gain)
        if stabs:
            syn.add(supersaw(triad, B * 0.44, cutoff=4200), t + B / 2, 0.42 * gain)


D1, A1, BB1, C2, D2, F2, A2 = 36.71, 55.0, 58.27, 65.41, 73.42, 87.31, 110.0
CHORDS = {
    'Dm': (D2, [293.66, 349.23, 440.00]),
    'Bb': (BB1, [233.08, 293.66, 349.23]),
    'F': (F2, [220.00, 261.63, 349.23]),
    'C': (C2, [196.00, 261.63, 329.63]),
}

# ---------------------------------------------------------------- 1. COLD OPEN
c0, c1 = SC['coldOpen']
dt = tt(c1 + 0.5)
drone = sum(saw(f, dt, d) for f in (D1, A1) for d in (-0.006, 0.006)) / 4
drone = lp_sweep(drone, 90 + 500 * (dt / c1) ** 2) * np.minimum(1, dt / 1.2) * 0.9
syn.add(drone, 0, 0.8)
fx.add(shimmer(1.5) * 0.6, 0.0, 0.8)
send.add(shimmer(1.5), 0.0, 0.8)
fx.add(riser(1.0, 120, 900), 0.0, 0.35)
for i, s in enumerate(EV['coldOpen']['hits']):
    t = snap(s)
    HIT(t, 1.0 + 0.1 * i, roots=[D1, D2] if i < 2 else [D1, D2, A2], peak=1800 + 600 * i, crash_g=0.4 + 0.15 * i)
    fx.add(metal_hit(300 + 90 * i, 1.6), t, 0.7)
    send.add(metal_hit(300 + 90 * i, 1.6), t, 0.4)
    if i < 2:
        fx.add(riser(0.9, 150, 1200), t + 0.1, 0.3)
fx.add(reverse_cymbal(0.9), snap(c1) - 0.9, 0.6)

# ---------------------------------------------------------------- 2. TURNAROUND
E = EV['turnaround']
t_land, t_title = snap(E['land']), snap(E['title'])
HIT(t_land, 0.9, roots=[D1, D2], crash_g=0.5)
for i in range(int((E['swaps'][0] - E['land']) / (B / 4)) + int(1.5 / (B / 4))):
    bass.add(bass_note(D2, B / 4 * 0.9, drive=2.0, cutoff=260 + i * 25), t_land + i * B / 4, 0.55)
for i, s in enumerate(E['swaps']):
    t = snap(s)
    fx.add(whoosh(0.32), t - 0.2, 0.9, pan=-0.5 if i % 2 else 0.5)
    fx.add(metal_hit(1800 + 200 * i, 0.3), t, 0.35)
    drums.add(tom(140 - i * 15), t, 0.6)
for k in range(8):
    drums.add(snare(0.18), t_title - 0.5 + k * B / 8, 0.25 + k * 0.07)
fx.add(riser(0.5, 400, 3000), t_title - 0.5, 0.6)
HIT(t_title, 1.2, roots=[D1, D2, F2 * 2, A2 * 2], peak=3200, crash_g=0.8)
fx.add(glitch(0.8), t_title, 0.5)
fx.add(shimmer(), t_title + 0.5, 0.8)
send.add(shimmer(), t_title + 0.5, 1.0)
for i, ch in enumerate(['Dm', 'Bb', 'C', 'C']):
    root, triad = CHORDS[ch]
    t = t_title + i * B
    syn.add(supersaw(triad, B, cutoff=1600 + i * 600, a=0.03), t, 0.4)
    for k in range(4):
        bass.add(bass_note(root, B / 4 * 0.9), t + k * B / 4, 0.6)
    if i % 2 == 0:
        K(t, 0.85)
t_ride = snap(SC['ride'][0])
for k in range(8):
    drums.add(snare(0.18), t_ride - B + k * B / 8, 0.3 + k * 0.06)
fx.add(riser(1.0, 250, 3000), t_ride - 1.0, 0.6)
fx.add(whoosh(0.4), t_ride - 0.36, 0.8)

# ---------------------------------------------------------------- 3. RIDE (drop) + brake tape-stop
t_brake, t_stop = snap(EV['ride']['brake']), snap(EV['ride']['stop'])
HIT(t_ride, 0.9, crash_g=0.8)
groove(t_ride, t_brake + 1.0, ['Dm', 'Bb', 'F', 'C'])
hook = [(0, 587.33, 1), (1, 587.33, 1), (2, 698.46, 2), (4, 659.26, 1), (5, 587.33, 1), (6, 523.25, 2),
        (8, 440.00, 1), (9, 523.25, 1), (10, 587.33, 4), (14, 523.25, 1), (15, 587.33, 1)]
for rep in range(2):
    for off, f, ln in hook:
        t = t_ride + 2 * 4 * B / 2 + rep * 8 * B / 2 * 2 + off * B / 2
        if t + ln * B / 2 > t_brake:
            continue
        n = lead_note(f, ln * B / 2 * 0.95)
        syn.add(n, t, 0.55, pan=0.1)
        send.add(n, t, 0.25)
        syn.add(n * 0.35, t + 0.75 * B, 0.5, pan=-0.5)
fx.add(crash(), t_ride + 4 * B * 2, 0.5)
for bus in (drums, bass, syn):
    tape_stop(bus, t_brake, t_stop - t_brake - 0.05)
fx.add(screech(t_stop - t_brake + 0.2), t_brake, 0.8)

# ---------------------------------------------------------------- 4. TRIGGER: freeze, silence, heartbeat
t_freeze = snap(EV['trigger']['freeze'])
fx.add(metal_hit(2637, 1.4), t_freeze, 0.5)  # glassy 'tink' of time stopping
send.add(metal_hit(2637, 1.4), t_freeze, 0.8)
fx.add(sub_boom(1.2, 60, 28), t_freeze, 0.6)

# ---------------------------------------------------------------- 5. MONSTER MODE
M = EV['monster']
t_ign, t_wide = snap(M['ignite']), snap(M['wide'])
stages = [snap(s) for s in M['stages']]
t_snap, t_roar = snap(M['rulerSnap']), snap(M['roar'])
words = [snap(s) for s in M['titleWords']]
t_end = snap(SC['monster'][1])
fx.add(riser(t_wide - t_ign, 80, 2400), t_ign, 0.8)  # eyes igniting
fx.add(braam([D1, D2 * 1.0595 ** 1], 1.2, 1200), t_ign + 0.2, 0.5)
fx.add(shimmer(1.0) * 1.5, t_ign + 0.2, 0.5)
HIT(t_wide, 1.3, roots=[D1, D2, A1], peak=2000, crash_g=0.6)
fx.add(thunder_crack(), t_wide, 0.8)
# heavy half-time monster groove: distorted sub ostinato, slamming drums
for b in range(int(round((t_end - t_wide) / B))):
    t = t_wide + b * B
    if t >= t_end - 0.01:
        break
    if b % 4 == 0:
        K(t, 1.1, 1.2)
        drums.add(tom(70), t, 0.6)
    if b % 4 == 2:
        drums.add(snare(0.6), t, 1.0)
        drums.add(clap(), t, 0.6)
        send.add(snare(0.6), t, 0.4)
    for k in range(2):
        bass.add(bass_note(D2 / 2 * (1.5 if (b % 8 == 7 and k) else 1), B / 2 * 0.95, drive=5.0, cutoff=500), t + k * B / 2, 0.85)
    drums.add(hat(), t + B / 2, 0.25)
for i, t in enumerate(stages):
    HIT(t, 1.3 + 0.1 * i, roots=[D1 * 2 ** (i / 12 * 3), D2 * 2 ** (i / 12 * 3), A2], peak=1800 + 500 * i, crash_g=0.6)
    fx.add(thunder_crack(), t + 0.05, 0.7)
    reel_ticks(t)
for k in range(6):
    tk = t_wide + 0.4 + rng.uniform(0, t_end - t_wide - 1)
    fx.add(thunder_crack(0.9), tk, 0.35, pan=rng.uniform(-0.7, 0.7))
fx.add(clack(), t_snap, 0.9)
fx.add(metal_hit(900, 0.5), t_snap, 0.3)
HIT(t_roar, 1.5, roots=[D1, D2, F2, A2], peak=2600, crash_g=0.9)
fx.add(roar(2.2), t_roar, 1.0)
send.add(roar(2.2), t_roar, 0.4)
fx.add(glitch(0.6), words[0], 0.45)
HIT(words[1], 1.1, roots=None, crash_g=0.5)
fx.add(glitch(0.6), words[1], 0.45)

# ---------------------------------------------------------------- 6. SHRINK: smoke clears, POP, cute music box
S6 = EV['shrink']
t_clear, t_pop, t_sit, t_oops = snap(S6['smokeClear']), snap(S6['pop']), snap(S6['sit']), snap(S6['oops'])
fx.add(whoosh(0.5, up=False), t_clear, 0.7)
for bus in (drums, bass):
    i = int(t_pop * SR)
    bus.x[i:int(snap(SC['shrink'][1]) * SR)] *= 0  # hard cut at the pop
fx.add(blip_pop(), t_pop, 1.0)
send.add(blip_pop(), t_pop, 0.5)
fx.add(slide_whistle(), t_oops - 0.1, 0.9)
mb = [(0, 587.33), (1, 739.99), (2, 880.0), (3, 739.99), (4, 783.99), (5, 739.99), (6, 659.26), (8, 587.33),
      (9, 659.26), (10, 739.99), (11, 587.33), (12, 493.88), (13, 587.33), (14, 659.26), (16, 587.33)]
for off, f in mb:
    t = t_sit + off * B / 2
    syn.add(music_box(f), t, 2.0, pan=0.2)
    send.add(music_box(f), t, 0.6)
pad_t = tt(snap(SC['shrink'][1]) - t_sit)
pad = sum(np.sin(2 * np.pi * f * pad_t) for f in (293.66, 369.99, 440.0)) / 3 * np.minimum(1, pad_t / 0.8) * 0.3
syn.add(pad, t_sit, 1.0)
for k in range(10):  # heart chimes
    t = t_oops + 0.4 + k * 0.32
    fx.add(music_box(1760 * (1.12 ** (k % 4)), 0.6) * 0.6, t, 1.0, pan=rng.uniform(-0.6, 0.6))

# ---------------------------------------------------------------- 7. BACK ON THE BIKE
S7 = EV['backOnBike']
t_hop, t_land2, t_jump, t_jl = snap(S7['hop']), snap(S7['land']), snap(S7['jump']), snap(S7['jumpLand'])
fx.add(boing(), t_hop, 0.9)
fx.add(whoosh(0.4), t_hop + 0.15, 0.5)
HIT(t_land2, 1.0, crash_g=0.6)
fx.add(engine_rev(1.3), t_land2 + 0.05, 0.8)
groove(t_land2, t_jump, ['Dm', 'C'])
# slow motion: everything drops out, a filtered pad breathes, cymbal swells into the landing
fx.add(whoosh(0.9, up=False), t_jump, 0.8)
fx.add(sub_boom(2.0, 50, 30) * 0.6, t_jump, 0.6)
st = tt(t_jl - t_jump)
spad = sum(saw(f, st, d) for f in (D2, A2, 349.23 / 2) for d in (-0.01, 0.01)) / 6
spad = lp_sweep(spad, 250 + 600 * np.sin(np.pi * st / st[-1])) * np.sin(np.pi * st / st[-1]) ** 0.5
syn.add(spad, t_jump, 0.9)
for k, tb in enumerate(np.arange(t_jump + 0.25, t_jl - 0.2, 0.62)):
    drums.add(kick(0.4, 0.4), tb, 0.45)
fx.add(reverse_cymbal(1.2), t_jl - 1.2, 0.8)
fx.add(riser(1.0, 200, 2200), t_jl - 1.0, 0.5)
HIT(t_jl, 1.3, roots=[D1, D2], crash_g=0.8)
groove(t_jl, snap(SC['backOnBike'][1]), ['Dm'])

# ---------------------------------------------------------------- 8. END CARD
S8 = EV['endCard']
t_logo, t_tag = snap(S8['logo']), snap(S8['tagline'])
HIT(t_logo, 1.2, roots=[D1, D2, A2], peak=2200, crash_g=0.8)
chord = supersaw([146.83, 220.0, 293.66, 349.23, 440.0], 3.0, cutoff=2400, a=0.02, r=1.2, s_lvl=0.7)
syn.add(chord, t_logo, 0.45)
send.add(chord, t_logo, 0.3)
fx.add(shimmer(2.5), t_logo + 0.5, 0.9)
send.add(shimmer(2.5), t_logo + 0.5, 1.0)
fx.add(metal_hit(880, 1.2), t_tag, 0.4)
send.add(metal_hit(880, 1.2), t_tag, 0.5)
for s in S8['redEye']:
    t = snap(s)
    fx.add(glitch(0.25), t, 0.5)
    fx.add(sub_boom(0.8, 70, 30), t, 0.5)
fx.add(roar(1.2) * 0.6, snap(S8['redEye'][1]) + 0.25, 0.6)
fx.add(braam([D1, D2 * 1.0595], 1.2, 900), snap(S8['redEye'][1]) + 0.25, 0.5)

# ---------------------------------------------------------------- mix
duck = np.ones(N)
dt_ = np.arange(int(0.28 * SR)) / SR
shape = 1 - 0.55 * np.exp(-dt_ / 0.09)
for t0 in kicks:
    i = int(t0 * SR)
    if 0 <= i < N:
        seg = shape[: N - i]
        duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
d2 = np.stack([duck, duck], 1)
mix = drums.x * 0.9 + bass.x * d2 * 0.85 + syn.x * d2 * 0.75 + fx.x * 0.8
mix += reverb(send.x + drums.x * 0.06 + syn.x * 0.25 + fx.x * 0.15) * 0.35
mix = np.stack([fft_filter(mix[:, c], lo=28) for c in range(2)], 1)
# enforce the trigger's silence (only heartbeat + ring survive)
q0, q1 = int((snap(EV['trigger']['face']) + 0.1) * SR), int(snap(SC['monster'][0]) * SR)
quiet = np.ones(N)
quiet[q0:q1] = 0.0
ramp = int(0.15 * SR)
quiet[q0 - ramp:q0] = np.linspace(1, 0, ramp)
mix = mix * quiet[:, None]
hb = Bus()  # heartbeat + ear ringing are the only sounds inside the silence
for s in EV['trigger']['heartbeats']:
    hb.add(heartbeat(), snap(s), 0.95)
    hb.add(heartbeat(), snap(s) + 0.18, 0.6)
hb.add(ringing(1.8), snap(EV['trigger']['face']), 1.0)
mix += hb.x * (1 - quiet[:, None])
fade = np.ones(N)
fl = int(0.4 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(1.6 * mix) / np.tanh(1.6) * 0.97

out = sys.argv[1] if len(sys.argv) > 1 else 'music_v2.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, N / SR, 's')
