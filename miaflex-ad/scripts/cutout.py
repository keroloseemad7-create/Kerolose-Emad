# Cuts the white bottle out of a still frame -> RGBA png (used for the glow outline + end card)
# Usage: python3 scripts/cutout.py <time_s> <out.png> [x0 y0 x1 y1]  (optional box the bottle must stay inside, 0..1)
import sys, json, subprocess, numpy as np
t, outp = float(sys.argv[1]), sys.argv[2]
W, H = 864, 1536
raw = subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i','miaflex.mp4','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
a = img.astype(np.int16); R, G, B = a[...,0], a[...,1], a[...,2]
mx, mn = a.max(-1), a.min(-1)
cand = ((mx > 165) & (mx-mn < 40)) | ((B > G+28) & (R > G+12))      # white plastic or purple ink
if len(sys.argv) > 6:
    bx0, by0, bx1, by1 = map(float, sys.argv[3:7])
    box = np.zeros_like(cand); box[int(by0*H):int(by1*H), int(bx0*W):int(bx1*W)] = True
    cand &= box
import os
for r in filter(None, os.environ.get('EXCLUDE','').split(';')):   # EXCLUDE='x0,y0,x1,y1;...' rects to drop
    ex0, ey0, ex1, ey1 = map(float, r.split(','))
    cand[int(ey0*H):int(ey1*H), int(ex0*W):int(ex1*W)] = False
tr = json.load(open('public/track.json'))['frames'][int(t*30)]
seed = np.zeros_like(cand)
seed[int(tr['y0']*H):int(tr['y1']*H), int(tr['x0']*W):int(tr['x1']*W)] = True
def dil(m, r=1):
    o = m.copy()
    for dy in range(-r, r+1):
        for dx in range(-r, r+1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o
def ero(m, r=1): return ~dil(~m, r)
m = seed & cand
for _ in range(400):                     # geodesic growth inside the candidate mask
    n2 = dil(m, 2) & cand
    if n2.sum() == m.sum(): break
    m = n2
for _ in range(6): m = dil(m, 2)         # close small gaps (text, shadows)
for _ in range(6): m = ero(m, 2)
# fill holes: background = flood from the border through ~m
bg = np.zeros_like(m); bg[0,:]=bg[-1,:]=bg[:,0]=bg[:,-1]=True; bg &= ~m
if len(sys.argv) > 6: bg |= ~box
for _ in range(600):
    n2 = dil(bg, 3) & ~m
    if n2.sum() == bg.sum(): break
    bg = n2
m = ~bg
alpha = m.astype(np.float32)
for _ in range(2): alpha = (alpha + np.roll(alpha,1,0)+np.roll(alpha,-1,0)+np.roll(alpha,1,1)+np.roll(alpha,-1,1))/5
rgba = np.dstack([img, (alpha*255).astype(np.uint8)])
subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',f'{W}x{H}','-i','-',outp],input=rgba.tobytes(),check=True)
ys, xs = np.nonzero(m)
print(outp, 'bbox', xs.min()/W, ys.min()/H, xs.max()/W, ys.max()/H, 'coverage', m.mean().round(3))
