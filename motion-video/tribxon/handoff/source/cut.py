# Cut the bottle out of src.jpg: flood-fill the light-grey studio background
# from the border, keep the largest remaining blob, feather the edge.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
im=np.asarray(Image.open('src.jpg').convert('RGB')).astype(int)
bgc=np.median(np.concatenate([im[:20].reshape(-1,3),im[-20:].reshape(-1,3)]),0)
d=np.abs(im-bgc).max(2); sat=im.max(2)-im.min(2)
like_bg=(d<22)&(sat<14)
lab,_=nd.label(like_bg)
edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bg=np.isin(lab,list(edge))
fg=~bg; fg=nd.binary_opening(fg,iterations=2)
lab,n=nd.label(fg); sizes=nd.sum(fg,lab,range(1,n+1)); fg=lab==(1+np.argmax(sizes))
fg=nd.binary_fill_holes(fg)
# drop the pale floor reflection under the bottle
ys=np.where(fg.any(1))[0]; lo=ys.max()
pale=(sat<45)&(im.mean(2)>140); pale[:lo-70]=False
fg&=~pale; fg=nd.binary_opening(fg,iterations=3)
lab,n=nd.label(fg); sizes=nd.sum(fg,lab,range(1,n+1)); fg=lab==(1+np.argmax(sizes))
m=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3))
rgba=Image.open('src.jpg').convert('RGB'); rgba.putalpha(m)
bb=m.getbbox(); print(bb); rgba.crop(bb).save('bottle.png')
