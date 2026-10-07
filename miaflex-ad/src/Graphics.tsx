import React from 'react';
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import config from './config.json';
import { H, W } from './timeline';
import { backOut, clamp, easeInOut, easeOut, lerp, seg } from './fx';

// Fonts are bundled in public/fonts (Google Fonts: Anton + Montserrat) so renders work offline.
export const ANTON = 'Anton';
export const MONT = 'Montserrat';
loadFont({ family: ANTON, url: staticFile('fonts/Anton-400.woff2'), weight: '400' });
loadFont({ family: MONT, url: staticFile('fonts/Montserrat-600.woff2'), weight: '600' });
loadFont({ family: MONT, url: staticFile('fonts/Montserrat-800.woff2'), weight: '800' });
const P = config.palette;

// ---------------------------------------------------------------- icons (animated SVG)
export const Icon: React.FC<{ kind: string; f: number; size?: number }> = ({ kind, f, size = 96 }) => {
  const s = { stroke: '#fff', strokeWidth: 6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let g: React.ReactNode = null;
  if (kind === 'droplet') {
    const lvl = lerp(70, 30, easeOut(seg(f, 4, 18))) + Math.sin(f * 0.3) * 2;
    g = (<>
      <defs><clipPath id="dropclip"><path d="M50 10 C50 10 20 46 20 64 a30 30 0 0 0 60 0 C80 46 50 10 50 10Z" /></clipPath></defs>
      <rect x="0" y={lvl} width="100" height="100" fill={P.lavender} clipPath="url(#dropclip)" />
      <path d="M50 10 C50 10 20 46 20 64 a30 30 0 0 0 60 0 C80 46 50 10 50 10Z" {...s} />
      <path d="M36 66 a14 14 0 0 0 10 12" {...s} strokeWidth={4} />
    </>);
  } else if (kind === 'flex') {
    const k = 1 + 0.08 * Math.max(0, Math.sin(f * 0.35));
    g = (<g transform={`translate(50 55) scale(${k}) translate(-50 -55)`}>
      <path d="M18 78 L18 50 Q18 30 34 26 L40 14 Q44 8 52 12 L56 22 Q48 30 46 40 Q62 30 76 40 Q86 50 82 64 Q78 80 58 80 Z" fill={P.lavender} stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
      <path d="M50 52 Q60 46 70 52" {...s} strokeWidth={4} />
    </g>);
  } else {
    const ck = easeOut(seg(f, 6, 16));
    g = (<>
      <path d="M50 8 L84 20 L84 48 Q84 76 50 92 Q16 76 16 48 L16 20 Z" fill={P.lavender} stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
      <path d="M34 50 L46 62 L68 38" {...s} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ck} />
    </>);
  }
  return <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>{g}</svg>;
};

// ---------------------------------------------------------------- feature callout with animated leader line
export const Callout: React.FC<{ f: number; dur: number; anchor: { x: number; y: number }; box: { x: number; y: number; align: string };
  lines: string[]; icon: string }> = ({ f, dur, anchor, box, lines, icon }) => {
  const out = seg(f, dur - 6, dur);
  const dot = backOut(clamp(seg(f, 0, 6)));
  const line = easeOut(seg(f, 3, 12));
  const card = backOut(clamp(seg(f, 8, 16)));
  const right = box.align === 'right';
  const ex = box.x, ey = box.y;
  const midX = lerp(anchor.x, ex, 0.35);
  const path = `M${anchor.x} ${anchor.y} L${midX} ${ey} L${ex} ${ey}`;
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <path d={path} fill="none" stroke={P.lavender} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.35}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} style={{ filter: `blur(6px)` }} />
        <path d={path} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
        <circle cx={anchor.x} cy={anchor.y} r={34 * dot + ((f * 2) % 30)} fill="none" stroke={P.lavender} strokeWidth={4} opacity={(1 - ((f * 2) % 30) / 30) * dot} />
        <circle cx={anchor.x} cy={anchor.y} r={16 * dot} fill="#fff" stroke={P.purple} strokeWidth={6} />
      </svg>
      <div style={{ position: 'absolute', top: ey, [right ? 'right' : 'left']: right ? W - ex : ex,
        transform: `translateY(-50%) translateX(${(1 - card) * (right ? 60 : -60)}px) scale(${lerp(0.6, 1, card)})`,
        transformOrigin: right ? 'right center' : 'left center', opacity: clamp(card * 3),
        display: 'flex', flexDirection: right ? 'row-reverse' : 'row', alignItems: 'center', gap: 22,
        background: `linear-gradient(135deg, ${P.purple}f2, ${P.deep}f2)`, borderRadius: 34, padding: '22px 34px',
        border: `3px solid ${P.lavender}`, boxShadow: `0 0 40px ${P.glow}88, 0 18px 40px rgba(0,0,0,.45)` }}>
        <Icon kind={icon} f={f} />
        <div style={{ textAlign: right ? 'right' : 'left' }}>
          {lines.map((l, i) => {
            const k = easeOut(seg(f, 11 + i * 3, 17 + i * 3));
            return <div key={i} style={{ fontFamily: MONT, fontWeight: 800, color: i ? P.lavender : '#fff', fontSize: i ? 52 : 46,
              lineHeight: 1.08, letterSpacing: 1, transform: `translateY(${(1 - k) * 24}px)`, opacity: k, whiteSpace: 'nowrap' }}>{l}</div>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- glitchy slam text
export const GlitchWord: React.FC<{ text: string; f: number; size: number; color: string; glitch: number }> = ({ text, f, size, color, glitch }) => {
  const slam = clamp(seg(f, 0, 5));
  const sc = lerp(2.6, 1, easeOut(slam));
  const g = glitch * (random(`g${f}`) > 0.35 ? 1 : 0.2);
  const base: React.CSSProperties = { fontFamily: ANTON, fontSize: size, lineHeight: 0.95, letterSpacing: 2, whiteSpace: 'nowrap', textTransform: 'uppercase' };
  const slices = [0, 1, 2, 3].map((i) => {
    const y0 = random(`sy${f}${i}`) * 90, h = 6 + random(`sh${f}${i}`) * 18, dx = (random(`sx${f}${i}`) - 0.5) * 70 * g;
    return <div key={i} style={{ ...base, color, position: 'absolute', inset: 0, clipPath: `inset(${y0}% 0 ${100 - y0 - h}% 0)`, transform: `translateX(${dx}px)` }}>{text}</div>;
  });
  return (
    <div style={{ position: 'relative', transform: `scale(${sc})`, opacity: clamp(slam * 4), filter: `blur(${(1 - slam) * 8}px)` }}>
      <div style={{ ...base, color: '#ff2e7a', position: 'absolute', inset: 0, transform: `translate(${-10 * g - 3}px, ${2 * g}px)`, mixBlendMode: 'screen', opacity: 0.85 }}>{text}</div>
      <div style={{ ...base, color: '#29e3ff', position: 'absolute', inset: 0, transform: `translate(${10 * g + 3}px, ${-2 * g}px)`, mixBlendMode: 'screen', opacity: 0.85 }}>{text}</div>
      <div style={{ ...base, color, textShadow: `0 0 40px ${P.glow}, 0 8px 0 ${P.deep}` }}>{text}</div>
      {g > 0.5 && slices}
    </div>
  );
};

export const Hook: React.FC<{ beatF: (b: number) => number }> = ({ beatF }) => {
  const f = useCurrentFrame();
  const [a, b] = config.text.hook;
  const glitchOn = (fr: number) => [0, 1, 2, 3].some((k) => fr >= beatF(k) && fr < beatF(k) + 4) ? 1 : 0;
  const out = seg(f, beatF(4) - 4, beatF(4));
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + out * 1.8})`, opacity: 1 - out, filter: `blur(${out * 14}px)` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(46,13,71,.55), transparent 70%)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: -60 }}>
        <GlitchWord text={a} f={f} size={230} color="#fff" glitch={glitchOn(f)} />
        {f >= beatF(1) && <GlitchWord text={b} f={f - beatF(1)} size={300} color={P.lavender} glitch={glitchOn(f)} />}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- product reveal title
export const RevealTitle: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const out = seg(f, dur - 5, dur);
  const title = config.text.revealTitle.split('');
  const subK = easeOut(seg(f, title.length + 4, title.length + 14));
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${out * -40}px)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1130, height: 520, background: `linear-gradient(transparent, ${P.deep}55 30%, ${P.deep}cc 65%, ${P.deep}ee)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center' }}>
        {title.map((ch, i) => {
          const k = seg(f, i * 1.4, i * 1.4 + 5);
          return <span key={i} style={{ fontFamily: ANTON, fontSize: 200, color: '#fff', display: 'inline-block', letterSpacing: 4,
            transform: `scale(${lerp(3, 1, easeOut(k))}) translateY(${(1 - easeOut(k)) * -40}px)`, opacity: clamp(k * 4),
            filter: `blur(${(1 - k) * 10}px)`, textShadow: `0 0 34px ${P.glow}, 0 10px 0 ${P.purple}` }}>{ch}</span>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 64,
        color: P.lavender, letterSpacing: lerp(60, 26, subK), opacity: subK }}>{config.text.revealSub}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- spray mist burst + PSST
export const SprayBurst: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  if (f < 0) return null;
  const S = config.spray;
  const parts = [];
  for (let i = 0; i < S.particles; i++) {
    const delay = random(`d${i}`) * 7;
    const a = f - delay;
    if (a < 0 || a > 26) continue;
    const ang = ((S.directionDeg + (random(`a${i}`) - 0.5) * S.spreadDeg * 2) * Math.PI) / 180;
    const sp = 18 + random(`v${i}`) * 34;
    const dist = sp * a * (1 - a / 60);
    const px = x + Math.cos(ang) * dist, py = y + Math.sin(ang) * dist + a * a * 0.12;
    const r = (2 + random(`r${i}`) * 7) * (1 + a / 14);
    parts.push(<circle key={i} cx={px} cy={py} r={r} fill={random(`c${i}`) > 0.5 ? '#fff' : P.lavender} opacity={(1 - a / 26) * 0.85} />);
  }
  const cloud = seg(f, 0, 22);
  const cx = x + Math.cos((S.directionDeg * Math.PI) / 180) * 230 * easeOut(cloud);
  const cy = y + Math.sin((S.directionDeg * Math.PI) / 180) * 230 * easeOut(cloud);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><radialGradient id="mist"><stop offset="0" stopColor="#fff" stopOpacity={0.55} /><stop offset="0.5" stopColor={P.lavender} stopOpacity={0.25} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient></defs>
      <ellipse cx={cx} cy={cy} rx={60 + 260 * easeOut(cloud)} ry={40 + 170 * easeOut(cloud)} fill="url(#mist)" opacity={1 - seg(f, 14, 30)} transform={`rotate(${S.directionDeg} ${cx} ${cy})`} />
      <g style={{ filter: 'blur(1.2px)' }}>{parts}</g>
      <circle cx={x} cy={y} r={10 + f * 6} fill="none" stroke="#fff" strokeWidth={4} opacity={1 - seg(f, 0, 8)} />
    </svg>
  );
};

export const Psst: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  if (f < 0) return null;
  const k = backOut(clamp(seg(f, 0, 7)));
  const out = seg(f, 30, 38);
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2, r0 = 150 + 20 * easeOut(seg(f, 0, 10)), r1 = r0 + 70 * (1 - seg(f, 4, 16));
    return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 * 0.6} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 * 0.6} stroke={P.lavender} strokeWidth={10} strokeLinecap="round" />;
  });
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(-9deg) scale(${k})`, opacity: 1 - out }}>
      <svg width={600} height={400} viewBox="-300 -200 600 400" style={{ position: 'absolute', left: -300 + 210, top: -200 + 95 }}>{rays}</svg>
      <div style={{ fontFamily: ANTON, fontSize: 190, color: '#fff', WebkitTextStroke: `10px ${P.purple}`, paintOrder: 'stroke fill',
        textShadow: `0 0 40px ${P.glow}, 0 12px 0 ${P.deep}`, letterSpacing: 6 }}>{config.text.spray}</div>
    </div>
  );
};

// ---------------------------------------------------------------- end card
export const EndCard: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const bottle = backOut(clamp(seg(f, 2, 14)));
  const shine = seg(f, 16, 40);
  const t1 = easeOut(seg(f, 10, 20)), t2 = easeOut(seg(f, 16, 26)), t3 = backOut(clamp(seg(f, 24, 34)));
  const float = Math.sin(f * 0.08) * 10;
  // cutout bottle bbox in the source frame (from scripts/cutout.py): x .4375-.6806, y .1621-.6927
  const scale = 0.82, bcx = 0.559 * W, bcy = 0.4274 * H;
  const imgStyle: React.CSSProperties = { position: 'absolute', width: W, height: H, left: 0, top: 0 };
  const cut = staticFile('cut_upright.png');
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, #8d45c2 0%, ${P.purple} 38%, ${P.deep} 100%)`, overflow: 'hidden' }}>
      {/* soft rotating light rays */}
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${f * 0.6}deg at 50% 42%, rgba(255,255,255,.06) 0deg 8deg, transparent 8deg 22deg)`, opacity: 0.8 }} />
      <div style={{ position: 'absolute', left: 540 - 330, top: 1090, width: 560, height: 80, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,.45), transparent 70%)', opacity: bottle }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H,
        transform: `translate(${540 - bcx}px, ${700 - bcy + float + (1 - bottle) * 200}px) translate(${bcx}px,${bcy}px) scale(${scale * lerp(0.7, 1, bottle)}) translate(${-bcx}px,${-bcy}px)`, opacity: clamp(bottle * 2) }}>
        <Img src={cut} style={{ ...imgStyle, filter: `contrast(1.1) saturate(1.35) brightness(1.06) drop-shadow(0 0 30px ${P.glow}aa)` }} />
        {/* shine sweep, masked to the bottle shape */}
        <div style={{ ...imgStyle, WebkitMaskImage: `url(${cut})`, maskImage: `url(${cut})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
          background: `linear-gradient(105deg, transparent ${lerp(-30, 110, easeInOut(shine)) - 12}%, rgba(255,255,255,.85) ${lerp(-30, 110, easeInOut(shine))}%, transparent ${lerp(-30, 110, easeInOut(shine)) + 12}%)`, mixBlendMode: 'screen' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: ANTON, fontSize: 150, color: '#fff', letterSpacing: 3,
        transform: `translateY(${(1 - t1) * 40}px)`, opacity: t1, textShadow: `0 0 34px ${P.glow}, 0 8px 0 ${P.deep}` }}>{config.text.endTitle}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center', fontFamily: MONT, fontWeight: 600, fontSize: 46, color: P.lavender, letterSpacing: 6,
        opacity: t2, transform: `translateY(${(1 - t2) * 20}px)` }}>{config.text.endBy}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1410, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 44, color: P.purple, background: '#fff', borderRadius: 60, padding: '16px 56px',
          transform: `scale(${t3})`, opacity: clamp(t3 * 3), boxShadow: `0 0 40px ${P.glow}, 0 14px 30px rgba(0,0,0,.35)` }}>{config.text.cta}</div>
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: 1 - seg(f, 0, 5) }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- finishing: vignette + film grain
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 48%, transparent 55%, rgba(10,0,20,.55) 100%)' }} />
      <AbsoluteFill style={{ mixBlendMode: 'overlay', opacity: 0.22 }}>
        <svg width={W} height={H}>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width={W} height={H} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};
