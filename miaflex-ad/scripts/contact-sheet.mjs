// 3-frame preview contact sheet of the rendered ad -> out/preview_sheet.jpg
// Times come from config.previewSheetAtSec.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../src/config.json', import.meta.url)));
const video = 'out/miaflex_ad.mp4';
const inputs = cfg.previewSheetAtSec.flatMap((t) => ['-ss', String(t), '-i', video]);
const n = cfg.previewSheetAtSec.length;
const graph = cfg.previewSheetAtSec.map((_, i) => `[${i}:v]scale=540:-1,setsar=1[v${i}]`).join(';') +
  ';' + cfg.previewSheetAtSec.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${n}`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-frames:v', '1', '-q:v', '3', 'out/preview_sheet.jpg'], { stdio: 'inherit' });
console.log('wrote out/preview_sheet.jpg');
