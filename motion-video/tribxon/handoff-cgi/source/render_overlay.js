// Renders overlay.html (texts, sticker, order card) as transparent PNG frames -> overlay/0001.png ...
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const FPS=24, b=await chromium.launch(), p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+__dirname+'/overlay.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 const dur=await p.evaluate(()=>DUR); fs.mkdirSync(__dirname+'/overlay',{recursive:true});
 for(let f=0;f<dur*FPS;f++){await p.evaluate(t=>render(t),f/FPS);
  await p.screenshot({path:`${__dirname}/overlay/${String(f+1).padStart(4,'0')}.png`,omitBackground:true});}
 await b.close();
})();
