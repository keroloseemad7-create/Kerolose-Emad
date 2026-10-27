# Synthesised soundtrack: light beat + whooshes on each push, impact on the pop-out,
# pops/clicks for the order card. Writes audio.wav (12s, 44.1kHz stereo).
import numpy as np, wave
SR=44100; DUR=12; N=SR*DUR; rng=np.random.default_rng(7)
out=np.zeros(N)
def add(sig,t,g=1.0):
    i=int(t*SR); n=min(len(sig),N-i); out[i:i+n]+=sig[:n]*g
def env(n,a,d): x=np.arange(n)/SR; return np.minimum(1,x/a)*np.exp(-x/d)
def kick():
    n=int(.35*SR); x=np.arange(n)/SR; f=50+90*np.exp(-x*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*9)
def hat():
    n=int(.06*SR); s=rng.standard_normal(n); s=np.diff(s,prepend=0); return s*np.exp(-np.arange(n)/SR*70)*.25
def whoosh(d,f0,f1,g=1):
    n=int(d*SR); s=rng.standard_normal(n); x=np.linspace(0,1,n); f=f0*(f1/f0)**x
    # resonant-ish band via one-pole lowpass with sweeping cutoff, minus a slower one
    y=np.zeros(n); z=np.zeros(n); a=0; b=0
    for i in range(n):
        c=min(.99,2*np.pi*f[i]/SR); a+= c*(s[i]-a); b+= c*.25*(a-b); y[i]=a-b
    return y*np.sin(np.pi*x)**1.5*g/ (np.abs(y).max()+1e-9)
def boom():
    n=int(1.2*SR); x=np.arange(n)/SR; f=40+120*np.exp(-x*12)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*3.5)+rng.standard_normal(n)*np.exp(-x*18)*.5
def pop(f=900):
    n=int(.18*SR); x=np.arange(n)/SR; return np.sin(2*np.pi*(f+600*np.exp(-x*40))*x)*np.exp(-x*28)
def chime(f):
    n=int(.6*SR); x=np.arange(n)/SR; return (np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*2*f*x))*np.exp(-x*6)*.5
# beat: 120bpm, drops out for the pop-out moment
for k in range(int(DUR*2)):
    t=k*.5
    if 3.3<=t<5.6: continue
    add(kick(),t,.55)
    add(hat(),t+.25,.5)
bass=np.zeros(N); x=np.arange(N)/SR
notes=[55,55,65.4,49]
for k in range(int(DUR/2)):
    seg_=(x>=k*2)&(x<k*2+2); bass[seg_]=np.sin(2*np.pi*notes[k%4]*x[seg_])
gate=~((x>3.3)&(x<5.6)); out+=bass*.18*gate*np.minimum(1,x/1.0)
add(whoosh(.5,300,2500,.6),1.32)
add(whoosh(.5,350,3000,.7),2.22)
add(whoosh(.45,400,4000,.9),3.05)
add(boom(),3.42,1.0)
add(whoosh(.7,3000,300,.6),5.25)
add(whoosh(.5,500,1800,.35),5.65)
add(pop(700),6.5,.6); add(chime(1318),6.55,.5)
add(pop(1100),7.3,.4)
add(pop(1500),8.42,.6)
for i,t in enumerate([9.1,9.3,9.5]): add(chime([1046,1318,1568][i]),t,.35)
add(chime(2093),10.0,.3)
out*=np.minimum(1,(DUR-x)/1.0)  # fade out
out=np.tanh(out*1.1); out/=np.abs(out).max()/0.89
st=np.stack([out,out],1); st[:,1]=np.roll(out,40)
w=wave.open('audio.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
