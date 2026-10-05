const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{
 const mode=process.argv[2]||'preview';
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+__dirname+'/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 if(mode==='preview'){
  const ts=(process.argv[3]||'1,3.5,5.7,8.3,9.6,12.3,14.5,17.8,19.3,22,26,28,29.5,31.6').split(',').map(Number);
  for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${__dirname}/prev_${String(t).padStart(5,'0')}.jpg`,quality:70,type:'jpeg'});}
 } else {
  const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-preset','medium',__dirname+'/motion_16x9.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let f=0;f<32*30;f++){await p.evaluate(t=>render(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:95});ff.stdin.write(buf);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();
})();
