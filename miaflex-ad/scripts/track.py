# Tracks the purple label + white bottle in every source frame -> public/track.json
# Usage: python3 scripts/track.py miaflex.mp4
import sys, json, subprocess, numpy as np
src = sys.argv[1]
W, H = 144, 256  # analysis resolution (source is 864x1536, same 9:16 aspect)
raw = subprocess.run(['ffmpeg','-v','error','-i',src,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],
                     capture_output=True, check=True).stdout
n = len(raw)//(W*H*3)
a = np.frombuffer(raw, np.uint8).reshape(n, H, W, 3).astype(np.int16)
R, G, B = a[...,0], a[...,1], a[...,2]
purple = (B > G+28) & (R > G+12) & ((R+G+B)/3 < 175)
mx = a.max(-1); mn = a.min(-1)
white = (mx > 200) & (mx-mn < 28)
out = []
ys, xs = np.mgrid[0:H, 0:W]
for i in range(n):
    m = purple[i]
    if m.sum() < 25:
        out.append(None); continue
    px, py = xs[m], ys[m]
    x0, x1 = np.percentile(px, [4, 96]); y0, y1 = np.percentile(py, [4, 96])
    cx, cy = px.mean(), py.mean()
    # bottle = white pixels in a band around the label; nozzle = top of that band
    band = white[i] & (np.abs(xs-cx) < max(10,(x1-x0)*.9)) & (ys < y1)
    bx, by = xs[band], ys[band]
    top = float(np.percentile(by, 2)) if band.sum() > 30 else float(y0)
    topx = float(bx[by < top+6].mean()) if band.sum() > 30 and (by < top+6).any() else float(cx)
    out.append({k: round(float(v)/s, 4) for k, v, s in [
        ('cx',cx,W),('cy',cy,H),('x0',x0,W),('x1',x1,W),('y0',y0,H),('y1',y1,H),('topx',topx,W),('top',top,H)]})
# fill gaps + light smoothing so overlays don't jitter
keys = ['cx','cy','x0','x1','y0','y1','topx','top']
arr = np.array([[o[k] for k in keys] if o else [np.nan]*8 for o in out])
for j in range(8):
    col = arr[:, j]; ok = ~np.isnan(col)
    arr[:, j] = np.interp(np.arange(n), np.flatnonzero(ok), col[ok])
k = np.ones(5)/5
sm = np.vstack([np.convolve(np.pad(arr[:, j], 2, mode='edge'), k, 'valid') for j in range(8)]).T
json.dump({'fps': 30, 'frames': [dict(zip(keys, map(lambda v: round(float(v), 4), r))) for r in sm]},
          open('public/track.json', 'w'))
print('tracked', n, 'frames')
for t in [4.3, 19.0, 26.5, 31.0, 35.5, 37.6]:
    print(t, dict(zip(keys, sm[int(t*30)].round(3))))
