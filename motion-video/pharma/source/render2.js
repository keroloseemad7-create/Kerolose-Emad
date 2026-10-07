const {chromium}=require('playwright');const {spawn}=require('child_process');
const [dir,mode,arg]=process.argv.slice(2);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+dir+'/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 const dur=await p.evaluate(()=>DUR);
 if(mode==='preview'){for(const t of arg.split(',').map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${dir}/prev_${t.toFixed(2)}.jpg`,type:'jpeg',quality:75});}}
 else{const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','16',arg],{stdio:['pipe','inherit','inherit']});
  for(let f=0;f<dur*30;f++){await p.evaluate(t=>render(t),f/30);ff.stdin.write(await p.screenshot({type:'jpeg',quality:95}));}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));}
 await b.close();})();
