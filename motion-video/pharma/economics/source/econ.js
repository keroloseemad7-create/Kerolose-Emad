// Renders slide 14 of the deck with sliders driven in sync with the voice-over.
// usage: node econ.js preview 35,45,76,106   |  node econ.js full out.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const FPS = 30, DUR = 117.7;
const DIR = __dirname;

// ---- timeline (seconds in the voice-over)
// slider moves: [start, sliderId, toValue, duration]
const MOVES = [
  [34.8, 'p', 700, 1.0],        // "بسبعمية جنيه"
  [44.0, 'c', 150, 0.9],        // "حوالي 150 جنيه"
  [92.8, 'p', 800, 1.0],        // "average order value ... 800"
  [100.5, 'p', 500, 1.0],       // "... عندي 500 جنيه"
  [104.8, 't', 2000000, 1.3],   // "مبيعات 2 مليون جنيه"
];
// highlights: [start, target, duration]
const HL = [
  [12.8, 'split', 6.5],                                     // "البارز دي ..."
  [16.6, 'gross', 3.0],                                      // "Gross Profit / Net Profit"
  [34.8, 'p', 2.4], [44.0, 'c', 2.2], [48.4, 'a', 2.2], [53.4, 's', 2.4],
  [56.8, 'p', 1.8], [59.4, 'c', 1.8], [62.2, 'a', 2.6], [67.4, 's', 2.2],
  [72.0, 't', 2.4], [75.4, 'gross', 3.2], [75.4, 'contrib', 2.6],
  [83.0, 't', 2.0], [85.0, 'gross', 2.6],
  [92.8, 'p', 2.4], [100.3, 'p', 2.6], [104.6, 't', 3.0], [106.8, 'units', 2.6], [107.6, 'gross', 9.5],
];
const START = { p: 500, c: 100, a: 100, s: 100, t: 1000000 };

const C = (x) => Math.max(0, Math.min(1, x));
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function stateAt(t) {
  const v = { ...START };
  for (const [t0, id, to, d] of MOVES) {
    const from = v[id];
    v[id] = from + (to - from) * eio(C((t - t0) / d));
  }
  const hl = {};
  for (const [t0, id, d] of HL) {
    const a = t - t0; if (a < 0 || a > d) continue;
    const k = Math.min(C(a / 0.25), C((d - a) / 0.45));     // fade in / out
    hl[id] = Math.max(hl[id] || 0, k);
  }
  return { v, hl };
}

(async () => {
  const [mode, arg] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.clock.install({ time: 0 });
  await page.goto('file://' + DIR + '/deck.html#14');
  await page.clock.runFor(100);
  await page.addStyleTag({ content: `
    *{transition:none!important}
    .nb,#hint,#notes{display:none!important}
    .sl{border-radius:18px;padding:6px 14px;margin:-6px -14px;position:relative}
    .sl label b{display:inline-block;transform-origin:right center}
    .xglow{position:absolute;inset:-10px;border-radius:30px;pointer-events:none;border:3px solid #F5C04A}
  ` });
  await page.evaluate(() => { for (const a of document.getAnimations()) a.pause(); });
  // element centres (stage px) for the camera
  const R = await page.evaluate(() => {
    const sl = document.querySelectorAll('.slide')[13], c = (el) => { const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
    const rows = [...sl.querySelectorAll('.sl')];
    const all = [...sl.querySelectorAll('[data-a]')].map(e => e.getBoundingClientRect());
    const box = [Math.min(...all.map(r => r.x)), Math.min(...all.map(r => r.y)), Math.max(...all.map(r => r.right)), Math.max(...all.map(r => r.bottom))];
    return { p: c(rows[0]), c: c(rows[1]), a: c(rows[2]), s: c(rows[3]), t: c(rows[4]),
      split: c(document.getElementById('sp')), contrib: c(document.getElementById('o1').closest('.card')),
      units: c(document.getElementById('o3').closest('.card')), gross: c(sl.querySelector('.gcard')), box };
  });
  const BW = R.box[2] - R.box[0];
  const home = [(R.box[0] + R.box[2]) / 2, (R.box[1] + R.box[3]) / 2, Math.min(1.12, 1760 / BW)];
  // smoothed camera: push in on whatever is being talked about
  const cams = []; let cam = [...home];
  for (let i = 0; i <= Math.round(DUR * FPS); i++) {
    const t = i / FPS; let tgt = home, best = -1;
    for (const [t0, id, d] of HL) if (t >= t0 && t <= t0 + d && t0 > best) { best = t0;
      const [x, y] = R[id], z = Math.min(home[2] * 1.1, 1856 / BW);
      tgt = [home[0] + (x - home[0]) * 0.45, home[1] + (y - home[1]) * 0.45, z]; }
    // never push the content off-screen: clamp the centre so the content box stays inside the frame
    const clampC = (c, lo, hi, z, half, m) => { const a = hi - (half - m) / z, b = lo + (half - m) / z; return a > b ? (lo + hi) / 2 : Math.min(b, Math.max(a, c)); };
    tgt = [clampC(tgt[0], R.box[0], R.box[2], tgt[2], 960, 30), clampC(tgt[1], R.box[1], R.box[3], tgt[2], 540, 75), tgt[2]];
    const k = 1 - Math.exp(-2.6 / FPS);
    cam = cam.map((v, j) => v + (tgt[j] - v) * k); cams.push([...cam]);
  }

  const ff = mode === 'full' && spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const times = mode === 'full' ? Array.from({ length: Math.round(DUR * FPS) }, (_, i) => i / FPS) : arg.split(',').map(Number);
  let clockMs = 100;
  for (const t of times) {
    const target = Math.round(t * 1000) + 100;
    if (target > clockMs) { await page.clock.runFor(target - clockMs); clockMs = target; }
    const st = stateAt(t); st.cam = cams[Math.round(t * FPS)];
    await page.evaluate(({ st, t }) => {
      const slide = document.querySelectorAll('.slide')[13], [cx, cy, z] = st.cam;
      slide.style.transformOrigin = '0 0'; slide.style.transform = `translate(${960 - cx * z}px, ${540 - cy * z}px) scale(${z})`;
      // deterministic CSS animations (slide entrance, grid drift)
      for (const a of document.getAnimations()) a.currentTime = t * 1000;
      for (const id of ['p', 'c', 'a', 's', 't']) document.getElementById(id).value = st.v[id];
      calc();
      // the numbers update every frame; keep the bar smooth by using the exact (unstepped) values
      const v = st.v, m = v.p - v.c - v.a - v.s;
      const seg = [['Cost', v.c, '#2a5cc2'], ['Ads', v.a, '#5AB0FF'], ['Ship', v.s, '#8aa6d8'], ['Profit', Math.max(m, 0), '#F5C04A']];
      document.getElementById('sp').innerHTML = seg.map(x => `<div style="flex:${Math.max(x[1], .001)};background:${x[2]};color:${x[0] == 'Profit' ? '#0A1A3A' : '#fff'}">${x[1] > v.p * .1 ? x[0] : ''}</div>`).join('');
      // highlights
      const rows = { p: 0, c: 1, a: 2, s: 3, t: 4 }, sl = [...document.querySelectorAll('.slide')[13].querySelectorAll('.sl')];
      sl.forEach((row, i) => {
        const id = Object.keys(rows).find(k => rows[k] === i), k = st.hl[id] || 0;
        row.style.background = `rgba(245,192,74,${0.13 * k})`;
        row.style.boxShadow = k ? `0 0 ${40 * k}px rgba(245,192,74,${0.35 * k}), inset 0 0 0 2px rgba(245,192,74,${0.7 * k})` : 'none';
        const bEl = row.querySelector('label b');
        bEl.style.transform = `scale(${1 + 0.35 * k})`; bEl.style.color = k > 0.05 ? `rgba(245,192,74,1)` : '';
        row.querySelector('input').style.filter = `drop-shadow(0 0 ${14 * k}px rgba(245,192,74,${k}))`;
      });
      const cards = { contrib: document.getElementById('o1').closest('.card'), units: document.getElementById('o3').closest('.card'),
        gross: document.querySelector('.slide:nth-of-type(14) .gcard'), split: document.getElementById('sp') };
      for (const [id, el] of Object.entries(cards)) {
        const k = st.hl[id] || 0, pulse = 1 + 0.025 * k * (0.6 + 0.4 * Math.sin(t * 7));
        el.style.transform = k ? `scale(${pulse})` : '';
        el.style.boxShadow = k ? `0 0 ${70 * k}px rgba(${id === 'gross' ? '245,192,74' : '90,176,255'},${0.65 * k}), 0 0 0 ${3 * k}px rgba(255,255,255,${0.8 * k})` : '';
        el.style.zIndex = k ? 5 : '';
      }
    }, { st, t });
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (ff) ff.stdin.write(buf); else require('fs').writeFileSync(`${DIR}/prev_${t.toFixed(1)}.jpg`, buf);
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await b.close();
})();
