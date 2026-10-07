"""Contact sheet of public/views: each cutout on checkerboard (left half) and dark (right half)."""
import os
import sys

from PIL import Image, ImageDraw

views, out = sys.argv[1], sys.argv[2]
names = ['front', 'back', 'left', 'right', 'top', 'bottom', 'angled', 'size', 'face', 'chest', 'texture', 'foot']
CW, CH = 360, 460
sheet = Image.new('RGB', (CW * 4, CH * 3), (30, 30, 34))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(os.path.join(views, f'{n}.png')).convert('RGBA')
    im.thumbnail((CW - 20, CH - 50))
    x0, y0 = (i % 4) * CW, (i // 4) * CH
    bg = Image.new('RGBA', (CW, CH - 30))
    bd = ImageDraw.Draw(bg)
    for yy in range(0, CH, 20):
        for xx in range(0, CW, 20):
            if xx < CW // 2:
                c = (205, 205, 205) if (xx // 20 + yy // 20) % 2 else (150, 150, 150)
            else:
                c = (12, 12, 16)
            bd.rectangle([xx, yy, xx + 19, yy + 19], fill=c + (255,))
    bg.alpha_composite(im, ((CW - im.width) // 2, (CH - 30 - im.height) // 2))
    sheet.paste(bg.convert('RGB'), (x0, y0))
    d.text((x0 + 10, y0 + CH - 24), f'{n}.png  {Image.open(os.path.join(views, n + ".png")).size}', fill=(255, 200, 120))
sheet.save(out)
