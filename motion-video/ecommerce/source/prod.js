// ---------- product drawings (yours = blue, competitor = gray)
function prod(kind,x,y,s,comp,op=1,rot=0){
  const c=comp?GRAY:BLUE, st=comp?GDK:NAVY, cap=comp?GDK:NAVY, fill='#fff';
  let g='';
  if(kind==='box'){
    g=`<path d="M-60 -90 L-32 -114 L88 -114 L60 -90 Z" fill="${comp?'#e3e7ef':'#dfe8ff'}" stroke="${st}" stroke-width="4" stroke-linejoin="round"/>
       <path d="M60 -90 L88 -114 L88 66 L60 90 Z" fill="${comp?'#cfd5e1':'#c4d4ff'}" stroke="${st}" stroke-width="4" stroke-linejoin="round"/>
       <rect x="-60" y="-90" width="120" height="180" rx="6" fill="${fill}" stroke="${st}" stroke-width="4"/>
       <rect x="-60" y="-34" width="120" height="58" fill="${c}"/>
       <rect x="-9" y="-28" width="18" height="46" rx="3" fill="#fff"/><rect x="-23" y="-14" width="46" height="18" rx="3" fill="#fff"/>
       <rect x="-40" y="40" width="80" height="8" rx="4" fill="${comp?'#d6dbe5':'#c4d4ff'}"/><rect x="-40" y="58" width="52" height="8" rx="4" fill="${comp?'#d6dbe5':'#c4d4ff'}"/>
       ${comp?'':`<text x="0" y="-52" text-anchor="middle" font-size="22" fill="${NAVY}">PGS</text>`}`;
  }else if(kind==='bottle'){
    g=`<rect x="-30" y="-124" width="60" height="34" rx="8" fill="${cap}"/>
       <rect x="-22" y="-92" width="44" height="14" fill="${comp?'#d6dbe5':'#c4d4ff'}"/>
       <rect x="-58" y="-80" width="116" height="172" rx="30" fill="${fill}" stroke="${st}" stroke-width="4"/>
       <rect x="-58" y="-26" width="116" height="66" fill="${c}"/>
       <g transform="rotate(-30)"><rect x="-26" y="-2" width="52" height="22" rx="11" fill="#fff"/><rect x="0" y="-2" width="26" height="22" rx="11" fill="${comp?'#e3e7ef':'#c4d4ff'}"/></g>`;
  }else{ // tube
    g=`<path d="M-56 -100 L56 -100 L38 76 L-38 76 Z" fill="${fill}" stroke="${st}" stroke-width="4" stroke-linejoin="round"/>
       <path d="M-56 -100 L56 -100" stroke="${st}" stroke-width="10"/>
       <path d="M-50 -40 L50 -40 L44 18 L-44 18 Z" fill="${c}"/>
       <rect x="-24" y="76" width="48" height="40" rx="6" fill="${cap}"/>
       <rect x="-30" y="-78" width="60" height="8" rx="4" fill="${comp?'#d6dbe5':'#c4d4ff'}"/>`;
  }
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})" opacity="${op}" style="filter:drop-shadow(0 18px 24px rgba(11,31,77,${comp?.10:.18}))">${g}</g>`;
}
