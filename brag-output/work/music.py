# soft A-major score for the brag video: felt piano + pad + in-key cues, one reverb space
import numpy as np, wave
SR, DUR = 48000, 20.0
N = int(SR * DUR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(sig, start, pan=0.0, g=1.0):
    i = int(start * SR); sig = sig[: max(0, N - i)]
    L[i:i + len(sig)] += sig * g * np.sqrt((1 - pan) / 2); R[i:i + len(sig)] += sig * g * np.sqrt((1 + pan) / 2)
def piano(m, dur=2.4, vel=1.0):
    n = int(dur * SR); x = np.arange(n) / SR; f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (2.2 + k * 1.6)) for k, a in [(1, 1), (2, .38), (3, .12), (4, .05)])
    att = np.minimum(1, x / 0.008); rel = np.minimum(1, (dur - x) / 0.3)
    return s * att * rel * vel * 0.18
def pad(ms, dur):
    n = int(dur * SR); x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * hz(m) * x + np.sin(2 * np.pi * .3 * x) * .4) + .3 * np.sin(2 * np.pi * hz(m) * 2.003 * x) for m in ms)
    env = np.minimum(1, x / 1.2) * np.minimum(1, (dur - x) / 1.2)
    return s * env * 0.022
def bell(m, vel=1.0):
    n = int(3 * SR); x = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * x) * np.exp(-x * 1.6) + .35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 3.5)
    return s * np.minimum(1, x / 0.004) * vel * 0.10
BEAT = 0.6
# chords: A, F#m, D, E (2 bars = 8 beats = 4.8s each), outro resolves to A at 16.4
prog = [(0.0, [57, 61, 64], 45), (4.8, [54, 57, 61], 42), (9.6, [50, 54, 57], 38), (14.4, [52, 56, 59], 40)]
for st, ch, bass in prog:
    end = min(st + 4.8, 16.4)
    add(pad([bass, bass + 7], end - st + 1.0), st, 0, 1.0)
    # gentle arpeggio, sparse
    pat = [0, 2, 1, 2, 0, 2, 1, 2]
    for b in range(8):
        tt = st + b * BEAT
        if tt >= 16.2: break
        if b % 2 == 0 or st >= 4.8:
            add(piano(ch[pat[b]] + 12, 1.8, .75 if b % 4 == 0 else .5), tt, (-.3, .3)[b % 2])
    add(piano(bass, 3.0, .7), st, 0)
# outro: A major bloom, then let it ring out
add(pad([45, 52, 57, 61], 3.8), 16.3, 0, 1.3)
for i, m in enumerate([57, 61, 64, 69, 73]): add(piano(m, 3.4, .8), 16.4 + i * 0.07, (-.4 + i * .2))
add(piano(33, 3.6, .9), 16.4)
# cues: cat wakes, grid touches (pentatonic, quiet), dark panel swell
add(bell(81, 1.0), 1.25, .1); add(bell(88, .5), 1.4, -.1)
for tt, m in zip([7.75, 8.7, 9.7, 10.6, 11.5, 12.3], [76, 78, 81, 83, 85, 88]): add(bell(m, .35), tt, (tt - 10) / 6)
sw = int(1.2 * SR); x = np.arange(sw) / SR
add(np.sin(2 * np.pi * hz(40) * x) * np.sin(np.pi * x / 1.2) * 0.06, 12.0)
# one room: convolve with a short smooth reverb tail
ir_n = int(2.2 * SR); rng = np.random.default_rng(3); ir_t = np.arange(ir_n) / SR
def conv(a, ir):
    n = len(a) + len(ir); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, F) * np.fft.rfft(ir, F), F)[: len(a)]
irL = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.0); irR = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.0)
# soften the tail's highs
k = np.ones(24) / 24; irL = np.convolve(irL, k, "same"); irR = np.convolve(irR, k, "same")
irL /= np.abs(irL).sum() ** .5 * 6; irR /= np.abs(irR).sum() ** .5 * 6
wetL, wetR = conv(L, irL), conv(R, irR)
L, R = L * .8 + wetL * .5, R * .8 + wetR * .5
fade = np.ones(N); fi = int(.25 * SR); fade[:fi] = np.linspace(0, 1, fi); fo = int(1.6 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 2
L *= fade; R *= fade
mx = np.max(np.abs(np.stack([L, R]))); L, R = L / mx * .7, R / mx * .7
L, R = np.tanh(L * 1.1) / np.tanh(1.1), np.tanh(R * 1.1) / np.tanh(1.1)
out = (np.stack([L, R], 1) * 32767 * .9).astype("<i2")
with wave.open("music.wav", "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print("ok", mx)
