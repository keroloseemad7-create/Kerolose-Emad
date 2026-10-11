"""Procedural, beat-synced soundtrack for the Tiddy video.

120 BPM (one beat = 0.5s = 15 video frames), D minor, hybrid trailer / rock-electronic.
Every hit lines up with the impacts, cuts and words in the Remotion scenes.

    python3 music/make_music.py public/music.wav
"""
import sys
import wave

import numpy as np

from synth import *  # noqa: F401,F403  (shared instrument kit)
from synth import N, SR, rng

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
