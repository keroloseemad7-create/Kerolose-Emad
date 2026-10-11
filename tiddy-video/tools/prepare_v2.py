"""Upscale the sheet views for the 1080x1920 video and derive monster-mode layers.

    python3 tools/prepare_v2.py public/views public/views/hd
- every view is upscaled 3x (Lanczos + light unsharp mask) so it survives big on-screen sizes
- front_lava.png: the dark pinstripes of front.png isolated as an emissive red/orange layer
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom', 'angled', 'size', 'face', 'chest', 'texture', 'foot']
for n in NAMES:
    im = Image.open(os.path.join(src, f'{n}.png'))
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    big = im.resize((im.width * 3, im.height * 3), Image.LANCZOS)
    if big.mode == 'RGBA':
        rgb = big.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        rgb.putalpha(big.getchannel('A'))
        big = rgb
    else:
        big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    big.save(os.path.join(out, f'{n}.png'))

# lava stripes: darkness of the fabric (stripes) inside the bear's alpha, excluding eyes/nose/embroidery blobs
for n in ['front']:
    im = Image.open(os.path.join(out, f'{n}.png')).convert('RGBA')
    a = np.asarray(im).astype(float)
    lum = a[..., :3].mean(2)
    local = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))).astype(float)
    stripe = np.clip((local - lum - 6) / 30, 0, 1)  # darker than its neighbourhood = stripe
    stripe *= a[..., 3] / 255
    stripe[lum < 45] = 0  # button eyes / nose stay black
    s8 = Image.fromarray((stripe * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    lava = Image.new('RGBA', im.size, (255, 70, 20, 0))
    lava.putalpha(s8)
    lava.save(os.path.join(out, f'{n}_lava.png'))
    print('lava', n, im.size)

# manifest for the Remotion code: pixel sizes + facial landmarks (fractions of the image)
manifest = {n: dict(zip(('w', 'h'), Image.open(os.path.join(out, f'{n}.png')).size)) for n in NAMES}
manifest['face']['eyes'] = [[0.302, 0.459], [0.684, 0.397]]
manifest['face']['eyeR'] = 0.04
manifest['front']['eyes'] = [[0.391, 0.202], [0.642, 0.183]]
manifest['front']['eyeR'] = 0.03
with open(os.path.join(os.path.dirname(__file__), '..', 'src', 'v2', 'views.json'), 'w') as f:
    json.dump(manifest, f, indent=1)
