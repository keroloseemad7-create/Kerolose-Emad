"""Remove the gray studio background from the full-body views with rembg.

    python3 tools/cutout_views.py public/views/raw public/views
Detail panels (face, chest, texture, foot) are full-bleed macro shots and are copied as-is.
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

FULL_BODY = ['front', 'back', 'left', 'right', 'top', 'bottom', 'angled', 'size']
DETAIL = ['face', 'chest', 'texture', 'foot']

raw, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else 'isnet-general-use'
session = new_session(model)
for name in FULL_BODY:
    im = Image.open(os.path.join(raw, f'{name}.png')).convert('RGB')
    cut = remove(im, session=session, post_process_mask=True)
    a = np.asarray(cut.getchannel('A'))
    # keep only the bear: drop faint specks, slightly soften the edge
    alpha = Image.fromarray(np.where(a > 24, a, 0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    cut.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    cut = cut.crop(bbox)
    cut.save(os.path.join(out, f'{name}.png'))
    print(name, cut.size)
for name in DETAIL:
    shutil.copy(os.path.join(raw, f'{name}.png'), os.path.join(out, f'{name}.png'))
