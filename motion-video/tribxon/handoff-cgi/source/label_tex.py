# Unwrap the cylindrical label from the product photo into a flat 360° texture.
# Photo column x maps to angle θ via x = CX + R·sin θ; the unseen back is filled by clamping.
import numpy as np
from PIL import Image
src=np.asarray(Image.open('src.jpg').convert('RGB')).astype(float)
CX,R,Y0,Y1=449,200,467,898
TW=2048; TH=int((Y1-Y0)/(2*np.pi*R)*TW)
band=src[Y0:Y1]
th=(np.arange(TW)/TW)*2*np.pi-np.pi           # -π..π, 0 = front
lim=np.radians(78)
cl=np.clip(th,-lim,lim)
x=CX+R*np.sin(cl)
x0=np.floor(x).astype(int); f=(x-x0)[None,:,None]
col=band[:,x0]*(1-f)+band[:,x0+1]*f
rows=np.linspace(0,band.shape[0]-1,TH)
out=np.stack([np.interp(rows,np.arange(band.shape[0]),col[:,i,c]) for i in range(TW) for c in range(3)],1).reshape(TH,TW,3)
# unseen sides: navy panel on the left (continues the blue graphic), white panel on the right
L=th<-lim; Rr=th>lim
out[:,L]=np.array([22,38,105.]); out[:,Rr]=np.array([238,240,243.])
k=24  # soften the hand-over
for i in np.where(np.diff(L.astype(int))!=0)[0].tolist()+np.where(np.diff(Rr.astype(int))!=0)[0].tolist():
    a,b=max(0,i-k),min(TW,i+k); w=np.linspace(0,1,b-a)[None,:,None]
    out[:,a:b]=out[:,a][:,None]*(1-w)+out[:,b-1][:,None]*w
Image.fromarray(out.clip(0,255).astype(np.uint8)).save('label.png'); print(TW,TH)
