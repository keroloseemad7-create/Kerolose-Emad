"""Detect the 4x3 photo panels in tiddy_sheet.png and crop each (captions excluded).

    python3 tools/split_sheet.py tiddy_sheet.png public/views/raw
"""
import json
import os
import sys

import numpy as np
from PIL import Image

NAMES = [
    ['front', 'back', 'left', 'right'],
    ['top', 'bottom', 'angled', 'face'],
    ['chest', 'texture', 'foot', 'size'],
]

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(int)
photo = a.mean(2) < 246  # panels are gray photos, gutters/caption strips are white


def runs(mask, min_len=40):
    r, s = [], None
    for i, v in enumerate(mask):
        if v and s is None:
            s = i
        if not v and s is not None:
            if i - s >= min_len:
                r.append((s, i))
            s = None
    if s is not None and len(mask) - s >= min_len:
        r.append((s, len(mask)))
    return r


# coarse grid from projection profiles (caption text is too sparse to pass the 50% test)
col_runs = runs(photo.mean(0) > 0.5)
row_runs = runs(photo.mean(1) > 0.5)
assert len(col_runs) == 4 and len(row_runs) == 3, (col_runs, row_runs)

boxes = {}
for ri, (y0, y1) in enumerate(row_runs):
    for ci, (x0, x1) in enumerate(col_runs):
        # refine each cell individually, then shave 3px to drop anti-aliased borders
        cell = photo[y0:y1, x0:x1]
        ry = runs(cell.mean(1) > 0.5, 20)[0]
        rx = runs(cell.mean(0) > 0.5, 20)[0]
        box = (x0 + rx[0] + 3, y0 + ry[0] + 3, x0 + rx[1] - 3, y0 + ry[1] - 3)
        name = NAMES[ri][ci]
        im.crop(box).save(os.path.join(out, f'{name}.png'))
        boxes[name] = box
print(json.dumps(boxes, indent=1))
