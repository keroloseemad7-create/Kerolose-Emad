// node render.js preview [t1,t2,...]  -> prev_*.jpg stills
// node render.js video               -> ../video_noaudio.mp4 (1080x1920, 30fps)
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{
 const mode=process.argv[2]||'preview';
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+__dirname+'/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 if(mode==='preview'){
  const ts=(process.argv[3]||'0.8,1.3,1.75,2.6,3.5,4.4,5.6,6.3,7.0,8.45,10.5').split(',').map(Number);
  for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${__dirname}/prev_${String(t).padStart(5,'0')}.jpg`,quality:70,type:'jpeg'});}
 } else {
  const dur=await p.evaluate(()=>DUR);
  const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium',__dirname+'/../video_noaudio.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let f=0;f<dur*30;f++){await p.evaluate(t=>render(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:95});ff.stdin.write(buf);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();
})();
