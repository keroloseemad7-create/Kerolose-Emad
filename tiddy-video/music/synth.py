"""Shared synth kit (drums, bass, pads, trailer FX, reverb) for the Tiddy soundtracks."""
import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)  # overridden per track via set_duration()
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


def set_duration(sec):
    global DUR, N
    DUR = sec
    N = int(SR * sec)


class Bus:
    def __init__(self):
        self.N = N
        self.x = np.zeros((N, 2))

    def add(self, sig, t, gain=1.0, pan=0.0):
        n = self.N
        i = int(round(t * SR))
        if i >= n or i < -len(sig):
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[: n - i]
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


