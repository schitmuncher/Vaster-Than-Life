'use strict';
/* =========================================================================
   Graphics: procedural textures (hulls, rooms, planets, nebulae), system
   icons, crew sprites, particles, glow sprites and event illustrations.
   Static art is cached on offscreen canvases so Quest 2 stays smooth.
   ========================================================================= */
function hashStr(s){ let h = 2166136261; s = String(s); for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; }
function srng(seed){ let s = (seed>>>0) || 123456789; return () => { s ^= s<<13; s >>>= 0; s ^= s>>>17; s ^= s<<5; s >>>= 0; return s/4294967296; }; }
function mkCanvas(w,h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function rgbOf(hex){ const h = String(hex).replace('#',''); const n = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h.slice(0,6), 16); return [(n>>16)&255, (n>>8)&255, n&255]; }
function shade(hex, f){ let [r,g,b] = rgbOf(hex); if(f<0){ r *= 1+f; g *= 1+f; b *= 1+f; } else { r += (255-r)*f; g += (255-g)*f; b += (255-b)*f; } return `rgb(${r|0},${g|0},${b|0})`; }
function mixHex(a, b, t){ const A = rgbOf(a), B = rgbOf(b); return '#' + A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }

/* ---------------- glow sprites ---------------- */
const GLOW = {};
function glowSprite(color, r=32){
  const k = color + r; if(GLOW[k]) return GLOW[k];
  const c = mkCanvas(r*2, r*2), g = c.getContext('2d'); const gr = g.createRadialGradient(r,r,0,r,r,r);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, hexA(color,.9)); gr.addColorStop(.5, hexA(color,.3)); gr.addColorStop(1, hexA(color,0));
  g.fillStyle = gr; g.fillRect(0,0,r*2,r*2); return GLOW[k] = c;
}
function glow(x, y, size, color, alpha=1){ if(size<=0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(alpha,0,1); ctx.drawImage(glowSprite(color), x-size, y-size, size*2, size*2); ctx.restore(); }

/* ---------------- planets & backgrounds ---------------- */
const PLANET_COLS = ['#3b4f7a','#7a4b3b','#3b7a5a','#6a3b7a','#8a7a4b','#2f5f7f','#8a5a3a','#4b6a8a','#5a3b2f'];
function drawPlanet(g, x, y, r, rnd, base, atmo){
  g.save(); g.beginPath(); g.arc(x,y,r,0,7); g.clip();
  const bg = g.createLinearGradient(x-r, y-r, x+r, y+r); bg.addColorStop(0, shade(base,.25)); bg.addColorStop(1, shade(base,-.35)); g.fillStyle = bg; g.fillRect(x-r,y-r,2*r,2*r);
  const tilt = (rnd()-.5)*.5;
  for(let i=0;i<18;i++){ const yy = y - r + rnd()*2*r, hh = 3 + rnd()*r*.16; g.fillStyle = rnd()<.5 ? `rgba(255,255,255,${.03+rnd()*.07})` : `rgba(0,0,0,${.05+rnd()*.12})`;
    g.beginPath(); g.ellipse(x + (rnd()-.5)*r*.3, yy, r*1.4, hh, tilt, 0, 7); g.fill(); }
  for(let i=0;i<8;i++){ const a = rnd()*6.28, d = rnd()*r*.8; g.fillStyle = `rgba(0,0,0,${.06+rnd()*.1})`; g.beginPath(); g.ellipse(x+Math.cos(a)*d, y+Math.sin(a)*d, 6+rnd()*r*.18, 4+rnd()*r*.1, rnd()*3, 0, 7); g.fill(); }
  const sh = g.createRadialGradient(x-r*.45, y-r*.45, r*.05, x-r*.1, y-r*.1, r*1.25);
  sh.addColorStop(0,'rgba(255,255,255,.22)'); sh.addColorStop(.45,'rgba(0,0,0,0)'); sh.addColorStop(.8,'rgba(0,0,0,.65)'); sh.addColorStop(1,'rgba(0,0,0,.92)');
  g.fillStyle = sh; g.fillRect(x-r,y-r,2*r,2*r); g.restore();
  const at = g.createRadialGradient(x,y,r*.92,x,y,r*1.18); at.addColorStop(0, hexA(atmo||'#8fc1ff',.0)); at.addColorStop(.35, hexA(atmo||'#8fc1ff',.28)); at.addColorStop(1, hexA(atmo||'#8fc1ff',0));
  g.fillStyle = at; g.beginPath(); g.arc(x,y,r*1.2,0,7); g.fill();
  if(rnd()<.35){ g.save(); g.translate(x,y); g.rotate(-.35 + rnd()*.2); g.scale(1,.22); g.strokeStyle = 'rgba(220,200,170,.35)'; g.lineWidth = r*.12; g.beginPath(); g.arc(0,0,r*1.65,0,7); g.stroke(); g.lineWidth = r*.05; g.strokeStyle = 'rgba(220,200,170,.2)'; g.beginPath(); g.arc(0,0,r*1.9,0,7); g.stroke(); g.restore(); }
}
function paintSpace(g, w, h, rnd, tint, o={}){
  const base = g.createLinearGradient(0,0,w,h); base.addColorStop(0,'#04060d'); base.addColorStop(1,'#0a0f20'); g.fillStyle = base; g.fillRect(0,0,w,h);
  g.save(); g.globalCompositeOperation = 'lighter';
  const cols = [tint, '#5a4a8f', '#1d3a6a', mixHex(tint,'#ff5a7a',.4)];
  const n = o.nebula ? 26 : 14;
  for(let i=0;i<n;i++){ const x = rnd()*w, y = rnd()*h, r = (120 + rnd()*420)*(w/1600); const c = cols[i%cols.length];
    const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0, hexA(c, (o.nebula?.12:.07) + rnd()*.05)); gr.addColorStop(1, hexA(c,0)); g.fillStyle = gr; g.fillRect(x-r,y-r,2*r,2*r); }
  g.restore();
  for(let i=0;i<900*(w*h)/(1600*1000);i++){ const a = rnd(); g.fillStyle = `rgba(${200+rnd()*55|0},${210+rnd()*45|0},255,${.08+a*.5})`; const s = a>.97 ? 2 : 1; g.fillRect(rnd()*w, rnd()*h, s, s); }
  for(let i=0;i<10;i++){ const x = rnd()*w, y = rnd()*h, s = 4 + rnd()*8; g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x-s,y); g.lineTo(x+s,y); g.moveTo(x,y-s); g.lineTo(x,y+s); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x-1,y-1,2,2); }
}
const BG = { key:null, canvas:null };
function bgKey(){ if(UI.screen!=='game' || !G) return 'title'; return [G.sectorType, G.sector, G.map ? G.map.cur : 0, G.nebula ? 1 : 0, G.hazard||''].join(':'); }
function buildBG(key){
  const c = mkCanvas(W,H), g = c.getContext('2d'); const rnd = srng(hashStr(key));
  const title = key==='title';
  const sd = title ? { color:'#ffb547' } : sectorDef();
  paintSpace(g, W, H, rnd, sd.color||'#5fd3e6', { nebula: !title && G.nebula });
  if(title){ drawPlanet(g, 1240, 470, 230, rnd, '#3b2a3f', '#ffb547'); }
  else {
    if(G.hazard==='sun'){ const x = 1500, y = 80; const gr = g.createRadialGradient(x,y,0,x,y,520); gr.addColorStop(0,'rgba(255,240,200,1)'); gr.addColorStop(.12,'rgba(255,190,90,.8)'); gr.addColorStop(.4,'rgba(255,120,40,.25)'); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0,0,W,H); }
    else if(rnd() < .8){ const r = 60 + rnd()*170; drawPlanet(g, 900 + rnd()*600, 80 + rnd()*380, r, rnd, pick(PLANET_COLS), pick(['#8fc1ff','#ffb547','#7be0a0','#ff9de2'])); }
    if(G.hazard==='asteroid'){ for(let i=0;i<40;i++) drawRock(g, rnd()*W, rnd()*H*.6, 3 + rnd()*14, rnd); }
    if(G.hazard==='pulsar'){ const x = 200 + rnd()*1200, y = 60 + rnd()*200; for(let i=6;i>0;i--){ g.strokeStyle = `rgba(150,220,255,${.05*i})`; g.lineWidth = i*3; g.beginPath(); g.ellipse(x,y,20+i*30,6+i*8,0,0,7); g.stroke(); } g.drawImage(glowSprite('#bfefff',64), x-60, y-60, 120, 120); }
    if(G.hazard==='ionstorm'){ g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ const x = rnd()*W, y = rnd()*H; const gr = g.createRadialGradient(x,y,0,x,y,260); gr.addColorStop(0,'rgba(95,211,230,.12)'); gr.addColorStop(1,'rgba(95,211,230,0)'); g.fillStyle = gr; g.fillRect(x-260,y-260,520,520); } g.restore(); }
  }
  return c;
}
function drawRock(g, x, y, r, rnd){ const n = 6 + (rnd()*4|0); g.beginPath(); for(let i=0;i<n;i++){ const a = i/n*6.283, rr_ = r*(.7 + rnd()*.4); const px = x + Math.cos(a)*rr_, py = y + Math.sin(a)*rr_; i ? g.lineTo(px,py) : g.moveTo(px,py); } g.closePath();
  const gr = g.createLinearGradient(x-r,y-r,x+r,y+r); gr.addColorStop(0,'#8a7d6c'); gr.addColorStop(1,'#2e2822'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.stroke(); }
function drawBG(){ const k = bgKey(); if(BG.key!==k){ BG.key = k; BG.canvas = buildBG(k); } ctx.drawImage(BG.canvas, 0, 0); }

/* ---------------- system icons ---------------- */
function drawSysIcon(g, k, x, y, s, col, alpha=1){
  g.save(); g.translate(x,y); g.globalAlpha *= alpha; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.5, s*.1); g.lineCap = 'round'; g.lineJoin = 'round';
  const u = s/2; g.beginPath();
  switch(k){
    case 'shields': g.moveTo(0,-u); g.lineTo(u*.85,-u*.6); g.lineTo(u*.7,u*.3); g.lineTo(0,u); g.lineTo(-u*.7,u*.3); g.lineTo(-u*.85,-u*.6); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(0,-u*.45); g.lineTo(0,u*.5); g.stroke(); break;
    case 'engines': g.moveTo(-u,-u*.5); g.lineTo(u*.2,-u*.5); g.lineTo(u*.7,-u*.8); g.lineTo(u*.7,u*.8); g.lineTo(u*.2,u*.5); g.lineTo(-u,u*.5); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-u*1.0,0); g.lineTo(-u*.35,0); g.stroke(); break;
    case 'oxygen': g.arc(-u*.3,u*.2,u*.45,0,7); g.stroke(); g.beginPath(); g.arc(u*.45,-u*.35,u*.3,0,7); g.stroke(); g.beginPath(); g.arc(u*.5,u*.5,u*.15,0,7); g.fill(); break;
    case 'weapons': g.arc(0,0,u*.6,0,7); g.stroke(); g.beginPath(); g.moveTo(-u,0); g.lineTo(-u*.3,0); g.moveTo(u*.3,0); g.lineTo(u,0); g.moveTo(0,-u); g.lineTo(0,-u*.3); g.moveTo(0,u*.3); g.lineTo(0,u); g.stroke(); break;
    case 'drones': g.moveTo(0,-u*.7); g.lineTo(u*.5,0); g.lineTo(0,u*.7); g.lineTo(-u*.5,0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-u,-u*.7); g.lineTo(-u*.4,-u*.7); g.moveTo(u*.4,-u*.7); g.lineTo(u,-u*.7); g.stroke(); break;
    case 'medbay': g.rect(-u*.3,-u*.85,u*.6,u*1.7); g.rect(-u*.85,-u*.3,u*1.7,u*.6); g.fill(); break;
    case 'clonebay': for(let i=-4;i<=4;i++){ const yy = i*u*.22; const xx = Math.sin(i*.8)*u*.5; g.moveTo(xx,yy); g.lineTo(-xx,yy); } g.stroke(); g.beginPath(); for(let i=-4;i<=4;i++){ const yy = i*u*.22; i===-4 ? g.moveTo(Math.sin(i*.8)*u*.5,yy) : g.lineTo(Math.sin(i*.8)*u*.5,yy); } g.stroke(); break;
    case 'teleporter': g.ellipse(0,u*.6,u*.8,u*.25,0,0,7); g.stroke(); g.beginPath(); g.moveTo(0,u*.3); g.lineTo(0,-u); g.moveTo(-u*.35,-u*.6); g.lineTo(0,-u); g.lineTo(u*.35,-u*.6); g.stroke(); break;
    case 'cloaking': g.ellipse(0,0,u*.9,u*.5,0,0,7); g.stroke(); g.beginPath(); g.arc(0,0,u*.25,0,7); g.fill(); g.beginPath(); g.moveTo(-u*.8,u*.8); g.lineTo(u*.8,-u*.8); g.stroke(); break;
    case 'hacking': g.rect(-u*.5,-u*.5,u,u); g.stroke(); g.beginPath(); for(const p of [-.25,.25]){ g.moveTo(p*u,-u*.5); g.lineTo(p*u,-u); g.moveTo(p*u,u*.5); g.lineTo(p*u,u); g.moveTo(-u*.5,p*u); g.lineTo(-u,p*u); g.moveTo(u*.5,p*u); g.lineTo(u,p*u); } g.stroke(); break;
    case 'mindcontrol': g.arc(0,0,u*.35,0,7); g.stroke(); for(const r of [.6,.9]){ g.beginPath(); g.arc(0,0,u*r,-.8,.8); g.stroke(); g.beginPath(); g.arc(0,0,u*r,Math.PI-.8,Math.PI+.8); g.stroke(); } break;
    case 'piloting': g.arc(0,0,u*.8,0,7); g.stroke(); g.beginPath(); g.arc(0,0,u*.2,0,7); g.fill(); g.beginPath(); for(let i=0;i<3;i++){ const a = i*2.094 - 1.57; g.moveTo(Math.cos(a)*u*.2, Math.sin(a)*u*.2); g.lineTo(Math.cos(a)*u*.8, Math.sin(a)*u*.8); } g.stroke(); break;
    case 'sensors': g.arc(-u*.2,u*.2,u*.8,-1.57,0); g.lineTo(-u*.2,u*.2); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-u*.2,u*.2); g.lineTo(u*.5,-u*.5); g.stroke(); g.beginPath(); g.arc(u*.55,-u*.55,u*.15,0,7); g.fill(); break;
    case 'doors': g.rect(-u*.6,-u*.9,u*1.2,u*1.8); g.stroke(); g.beginPath(); g.moveTo(0,-u*.9); g.lineTo(0,u*.9); g.stroke(); g.beginPath(); g.arc(-u*.2,0,u*.08,0,7); g.arc(u*.2,0,u*.08,0,7); g.fill(); break;
    case 'battery': g.rect(-u*.5,-u*.75,u,u*1.6); g.stroke(); g.fillRect(-u*.2,-u*.95,u*.4,u*.2); g.beginPath(); g.moveTo(u*.1,-u*.45); g.lineTo(-u*.2,u*.05); g.lineTo(u*.1,u*.05); g.lineTo(-u*.1,u*.5); g.stroke(); break;
    default: g.arc(0,0,u*.5,0,7); g.stroke();
  }
  g.restore();
}

/* ---------------- room floor ---------------- */
let FLOOR = null;
function floorTile(){
  if(FLOOR) return FLOOR; const c = mkCanvas(32,32), g = c.getContext('2d');
  g.fillStyle = '#18213b'; g.fillRect(0,0,32,32);
  g.fillStyle = 'rgba(255,255,255,.035)'; for(let i=0;i<32;i+=4) g.fillRect(0,i,32,1.5);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.strokeRect(.5,.5,31,31);
  g.fillStyle = 'rgba(255,255,255,.12)'; for(const [x,y] of [[3,3],[29,3],[3,29],[29,29]]){ g.beginPath(); g.arc(x,y,1.1,0,7); g.fill(); }
  return FLOOR = c;
}

/* ---------------- ship art (cached) ---------------- */
function hullShape(g, b){
  const { x0,y0,x1,y1,nose,facing } = b, cy = (y0+y1)/2, Hh = y1-y0, cx = (x0+x1)/2;
  const X = x => facing>0 ? x : 2*cx - x;
  const P = [[x0+22,y0],[x1-14,y0],[x1+nose*.55,cy-Hh*.2],[x1+nose,cy-Hh*.04],[x1+nose,cy+Hh*.04],[x1+nose*.55,cy+Hh*.2],[x1-14,y1],[x0+22,y1],[x0+4,y1-18],[x0,y1-30],[x0,y0+30],[x0+4,y0+18]];
  g.beginPath(); P.forEach((p,i)=> i ? g.lineTo(X(p[0]),p[1]) : g.moveTo(X(p[0]),p[1])); g.closePath();
}
function nacelles(b){
  const { x0,y0,x1,y1,facing } = b, L = x1-x0, cx = (x0+x1)/2; const X = x => facing>0 ? x : 2*cx - x;
  const h = Math.max(14, (y1-y0)*.13);
  return [ { x0:X(x0-24), x1:X(x0+L*.38), y:y0-h*.55, h, top:true }, { x0:X(x0-24), x1:X(x0+L*.38), y:y1-h*.45, h, top:false } ];
}
function shipArt(sh, mini){
  const b = sh._b; if(!b) return null;
  const key = [sh.id, sh.rooms.length, sh.rooms.map(r=>r.sys+(sh.systems[r.sys]?1:0)).join(','), (b.x1-b.x0)|0, (b.y1-b.y0)|0, (b.cell*10)|0, b.facing, mini?1:0, sh.color, sh.weapons.length].join('|');
  if(sh._art && sh._artKey===key) return sh._art;
  const pad = 70, ox = Math.min(b.x0, b.x0 - b.nose) - pad, oy = b.y0 - pad;
  const w = (b.x1 - b.x0) + 2*b.nose + 2*pad, h = (b.y1 - b.y0) + 2*pad;
  const c = mkCanvas(w, h), g = c.getContext('2d'); g.translate(-ox, -oy);
  const rnd = srng(hashStr(sh.id + sh.name)); const col = sh.color || C.amber;
  const { x0,y0,x1,y1,facing } = b, cy = (y0+y1)/2, L = x1-x0, cx = (x0+x1)/2;
  const X = x => facing>0 ? x : 2*cx - x;
  // shadow
  g.save(); g.translate(8,12); hullShape(g, b); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); g.restore();
  // nacelles
  for(const n of nacelles(b)){
    const xa = Math.min(n.x0,n.x1), xb = Math.max(n.x0,n.x1);
    g.beginPath(); if(g.roundRect) g.roundRect(xa, n.y, xb-xa, n.h, n.h/2); else g.rect(xa, n.y, xb-xa, n.h);
    const ng = g.createLinearGradient(0,n.y,0,n.y+n.h); ng.addColorStop(0,'#4a5577'); ng.addColorStop(.5,'#2a3150'); ng.addColorStop(1,'#151a2c'); g.fillStyle = ng; g.fill();
    g.strokeStyle = shade(col,-.2); g.lineWidth = 1.5; g.stroke();
    g.fillStyle = hexA(col,.7); g.fillRect(xa + (xb-xa)*.35, n.y + n.h*.38, (xb-xa)*.4, n.h*.24);
    const tx = facing>0 ? xa : xb; g.fillStyle = '#0a0d18'; g.beginPath(); g.ellipse(tx, n.y+n.h/2, 5, n.h*.42, 0, 0, 7); g.fill();
  }
  // fins
  for(const top of [true,false]){ const y = top ? y0 : y1, d = top ? -1 : 1, fh = Math.max(12, (y1-y0)*.1);
    g.beginPath(); g.moveTo(X(x0+L*.5), y); g.lineTo(X(x0+L*.6), y + d*fh); g.lineTo(X(x0+L*.68), y + d*fh); g.lineTo(X(x0+L*.66), y); g.closePath();
    const fg = g.createLinearGradient(0, y, 0, y + d*fh); fg.addColorStop(0, '#2b3456'); fg.addColorStop(1, '#3d4870'); g.fillStyle = fg; g.fill(); g.strokeStyle = hexA(col,.7); g.lineWidth = 1.5; g.stroke(); }
  // hull body
  hullShape(g, b);
  const hg = g.createLinearGradient(0,y0,0,y1); hg.addColorStop(0,'#46527a'); hg.addColorStop(.35,'#2b3456'); hg.addColorStop(1,'#121729'); g.fillStyle = hg; g.fill();
  g.save(); hullShape(g, b); g.clip();
  g.globalAlpha = .16; g.fillStyle = col; g.fillRect(ox, oy, w, h); g.globalAlpha = 1;
  const rowH = Math.max(18, (y1-y0)/7);
  for(let yy = y0 - 6, row = 0; yy < y1 + 6; yy += rowH, row++){ let xx = x0 - 40 - (row%2)*40; while(xx < x1 + b.nose){ const pw = 90 + rnd()*120;
      const px = X(xx) - (facing>0?0:pw);
      const pg = g.createLinearGradient(0, yy, 0, yy+rowH); const tone = rnd()*.06; pg.addColorStop(0, `rgba(255,255,255,${.03+tone})`); pg.addColorStop(1, `rgba(0,0,0,${.06+tone})`); g.fillStyle = pg; g.fillRect(px, yy, pw, rowH);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(px, yy, pw, 1); g.fillRect(px + (facing>0?0:pw-1), yy, 1, rowH);
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(px, yy+1, pw, 1);
      if(rnd()<.25){ g.fillStyle = 'rgba(0,0,0,.25)'; for(let v=0; v<4; v++) g.fillRect(px + 10 + v*6, yy + rowH*.3, 3, rowH*.4); }
      xx += pw; } }
  for(let i=0;i<60;i++){ g.fillStyle = `rgba(0,0,0,${rnd()*.15})`; g.fillRect(ox + rnd()*w, oy + rnd()*h, 2 + rnd()*20, 1); }
  g.fillStyle = hexA(col,.75); g.fillRect(ox, y0 + (y1-y0)*.07, w, 4); g.fillStyle = hexA(col,.35); g.fillRect(ox, y1 - (y1-y0)*.07 - 3, w, 2);
  g.fillStyle = 'rgba(255,255,255,.25)'; for(let xx = x0+20; xx < x1; xx += 13){ g.fillRect(X(xx), y0+5, 1.6, 1.6); g.fillRect(X(xx), y1-6, 1.6, 1.6); }
  const sh_ = g.createLinearGradient(0,y0,0,y1); sh_.addColorStop(0,'rgba(255,255,255,.12)'); sh_.addColorStop(.2,'rgba(255,255,255,0)'); sh_.addColorStop(.85,'rgba(0,0,0,0)'); sh_.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle = sh_; g.fillRect(ox,oy,w,h);
  g.restore();
  hullShape(g, b); g.lineWidth = mini ? 2 : 3; g.strokeStyle = shade(col,.05); g.stroke();
  // cockpit glass on nose
  const nx = x1 + b.nose*.12, ny = cy; const gw = Math.max(10, b.nose*.5), gh = Math.max(4, (y1-y0)*.045);
  g.beginPath(); g.moveTo(X(nx - gw*.4), ny - gh*2.2); g.lineTo(X(nx + gw*.45), ny - gh*.6); g.lineTo(X(nx + gw*.45), ny - gh*.1); g.lineTo(X(nx - gw*.4), ny - gh*.9); g.closePath();
  g.moveTo(X(nx - gw*.4), ny + gh*2.2); g.lineTo(X(nx + gw*.45), ny + gh*.6); g.lineTo(X(nx + gw*.45), ny + gh*.1); g.lineTo(X(nx - gw*.4), ny + gh*.9); g.closePath();
  const gg = g.createLinearGradient(0, ny-gh, 0, ny+gh); gg.addColorStop(0,'#bff4ff'); gg.addColorStop(.3,'#3fa8c4'); gg.addColorStop(1,'#0c2a3a'); g.fillStyle = gg; g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.stroke();
  // weapon hardpoints
  const nW = Math.min(4, sh.weapons.length);
  for(let i=0;i<nW;i++){ const top = i%2===0; const xx = X(x0 + L*(.55 + .1*Math.floor(i/2))), yy = top ? y0 : y1;
    g.fillStyle = '#2a3150'; g.beginPath(); g.arc(xx, yy, mini?4:7, 0, 7); g.fill(); g.strokeStyle = hexA(col,.8); g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#8a95b8'; g.lineWidth = mini?2:3; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + facing*(mini?8:16), yy + (top?-2:2)); g.stroke(); }
  // antenna & greebles
  for(let i=0;i<6;i++){ const xx = X(x0 + 30 + rnd()*(L-60)), top = rnd()<.5; g.fillStyle = '#39436a'; g.fillRect(xx-4, (top?y0-5:y1+1), 8, 4); }
  g.strokeStyle = '#8a95b8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(x0+L*.2), y0); g.lineTo(X(x0+L*.18), y0-18); g.stroke(); g.fillStyle = C.hostile; g.fillRect(X(x0+L*.18)-1.5, y0-20, 3, 3);
  // rooms
  const pat = g.createPattern ? g.createPattern(floorTile(), 'repeat') : null;
  sh.rooms.forEach((r,i) => { const q = sh._rects[i]; if(!q) return;
    g.fillStyle = pat || '#18213b'; g.fillRect(q.x, q.y, q.w, q.h);
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.strokeRect(q.x+2, q.y+2, q.w-4, q.h-4);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; for(let gx=1; gx<r.w; gx++){ g.beginPath(); g.moveTo(q.x+gx*b.cell, q.y); g.lineTo(q.x+gx*b.cell, q.y+q.h); g.stroke(); }
    for(let gy=1; gy<r.h; gy++){ g.beginPath(); g.moveTo(q.x, q.y+gy*b.cell); g.lineTo(q.x+q.w, q.y+gy*b.cell); g.stroke(); }
    if(r.sys){ const inst = !!sh.systems[r.sys]; const s = Math.min(q.w, q.h)*.55;
      drawSysIcon(g, r.sys, q.x+q.w/2, q.y+q.h/2, s, SYSC[r.sys]||C.ink, inst ? .22 : .08);
      g.fillStyle = hexA(SYSC[r.sys]||C.ink, inst ? .9 : .3); g.fillRect(q.x+3, q.y+3, mini?3:4, Math.min(q.h-6, mini?10:20)); }
    g.strokeStyle = '#4b5d8e'; g.lineWidth = mini ? 1.5 : 2.5; g.strokeRect(q.x+1, q.y+1, q.w-2, q.h-2);
  });
  sh._art = { c, dx:ox - b.x0, dy:oy - b.y0 }; sh._artKey = key;
  return sh._art;
}
function engineGlow(sh, t){
  const b = sh._b; if(!b) return; const col = sh.color || C.amber; const f = .75 + Math.sin(t*23 + (sh.isEnemy?2:0))*.12 + Math.random()*.08;
  for(const n of nacelles(b)){ const tx = b.facing>0 ? Math.min(n.x0,n.x1) : Math.max(n.x0,n.x1);
    glow(tx - b.facing*6, n.y + n.h/2, n.h*1.9*f, col, .9); glow(tx - b.facing*18, n.y + n.h/2, n.h*1.1*f, '#ffffff', .35); }
}

/* ---------------- crew sprites ---------------- */
function drawCrewSprite(x, y, r, c, o={}){
  const race = c.drone ? 'drone' : c.race; const R_ = DATA.races[c.race] || {};
  const col = o.hostile ? '#ff5a7a' : (c.drone ? '#f0a6ff' : (R_.color || '#e8c49a'));
  const t = (G?.time||0), moving = c.path && c.path.length, bob = moving ? Math.sin(t*14 + (c.id?.charCodeAt?.(0)||0))*r*.12 : 0;
  const uniform = o.hostile ? '#6a2233' : '#2c3f6e';
  ctx.save(); ctx.translate(x, y + bob); if(o.face<0) ctx.scale(-1,1);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, r*.95 - bob, r*.7, r*.22, 0, 0, 7); ctx.fill();
  switch(race){
    case 'pebblekin':
      ctx.fillStyle = shade(col,-.15); ctx.beginPath(); ctx.ellipse(0, r*.2, r*.95, r*.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(r*.1, -r*.45, r*.55, r*.45, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-r*.4,0); ctx.lineTo(-r*.1,r*.3); ctx.lineTo(-r*.3,r*.6); ctx.stroke();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(r*.25, -r*.5, r*.18, r*.1); break;
    case 'enjinn':
      ctx.fillStyle = uniform; ctx.beginPath(); ctx.ellipse(0, r*.35, r*.55, r*.55, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -r*.3, r*.55, 0, 7); ctx.fill();
      ctx.fillStyle = '#0c2a3a'; ctx.fillRect(-r*.1, -r*.45, r*.6, r*.22); ctx.fillStyle = '#7ff7ff'; ctx.fillRect(r*.05, -r*.42, r*.4, r*.14);
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0,-r*.85); ctx.lineTo(0,-r*1.15); ctx.stroke(); ctx.fillStyle = '#7ff7ff'; ctx.beginPath(); ctx.arc(0,-r*1.18,r*.12,0,7); ctx.fill(); break;
    case 'voltan':
      ctx.restore(); glow(x, y+bob, r*1.8, '#ffe27a', .45); ctx.save(); ctx.translate(x, y+bob);
      ctx.fillStyle = hexA(col,.85); ctx.beginPath(); ctx.moveTo(0,-r*1.0); ctx.quadraticCurveTo(r*.8,-r*.2,r*.35,r*.8); ctx.lineTo(-r*.35,r*.8); ctx.quadraticCurveTo(-r*.8,-r*.2,0,-r*1.0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r*.18,-r*.3,r*.1,0,7); ctx.arc(r*.18,-r*.3,r*.1,0,7); ctx.fill(); break;
    case 'sloog':
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r*.9, r*.8); ctx.quadraticCurveTo(-r*.8, -r*.4, 0, -r*.4); ctx.quadraticCurveTo(r*.8, -r*.4, r*.9, r*.8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = r*.14; ctx.beginPath(); ctx.moveTo(-r*.2,-r*.35); ctx.lineTo(-r*.35,-r*1.0); ctx.moveTo(r*.2,-r*.35); ctx.lineTo(r*.35,-r*1.0); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r*.35,-r*1.05,r*.17,0,7); ctx.arc(r*.35,-r*1.05,r*.17,0,7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-r*.3,-r*1.05,r*.08,0,7); ctx.arc(r*.4,-r*1.05,r*.08,0,7); ctx.fill(); break;
    case 'mantlis':
      ctx.fillStyle = shade(col,-.2); ctx.beginPath(); ctx.ellipse(0, r*.35, r*.4, r*.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r*.5,-r*.75); ctx.lineTo(r*.5,-r*.75); ctx.lineTo(0,-r*.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(-r*.25,-r*.6,r*.14,r*.2,.4,0,7); ctx.ellipse(r*.25,-r*.6,r*.14,r*.2,-.4,0,7); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = r*.12; ctx.beginPath(); ctx.moveTo(r*.3,r*.1); ctx.lineTo(r*.9,-r*.3); ctx.lineTo(r*.75,r*.25); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-r*.2,-r*.75); ctx.lineTo(-r*.5,-r*1.2); ctx.moveTo(r*.2,-r*.75); ctx.lineTo(r*.5,-r*1.2); ctx.stroke(); break;
    case 'glassborn':
      ctx.restore(); glow(x, y+bob, r*1.5, '#bff4ff', .3); ctx.save(); ctx.translate(x, y+bob);
      ctx.fillStyle = hexA('#d8f6ff',.85); ctx.beginPath(); ctx.moveTo(0,-r*1.05); ctx.lineTo(r*.6,-r*.2); ctx.lineTo(r*.4,r*.85); ctx.lineTo(-r*.4,r*.85); ctx.lineTo(-r*.6,-r*.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,140,170,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,-r*1.05); ctx.lineTo(0,r*.85); ctx.moveTo(-r*.6,-r*.2); ctx.lineTo(r*.6,-r*.2); ctx.stroke(); break;
    case 'drone':
      ctx.fillStyle = '#3a3f5a'; ctx.beginPath(); ctx.moveTo(0,-r*.9); ctx.lineTo(r*.85,0); ctx.lineTo(0,r*.9); ctx.lineTo(-r*.85,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = o.hostile ? '#ff5a7a' : '#7ff7ff'; ctx.beginPath(); ctx.arc(0,0,r*.25,0,7); ctx.fill(); break;
    default:
      ctx.fillStyle = uniform; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-r*.5, -r*.05, r, r*.9, r*.3); else ctx.rect(-r*.5,-r*.05,r,r*.9); ctx.fill();
      ctx.fillStyle = o.hostile ? '#ff5a7a' : C.amber; ctx.fillRect(-r*.5, r*.15, r, r*.1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -r*.45, r*.42, 0, 7); ctx.fill();
      ctx.fillStyle = shade(col,-.55); ctx.beginPath(); ctx.arc(0, -r*.58, r*.42, Math.PI*1.05, Math.PI*1.95); ctx.fill();
  }
  ctx.restore();
}

/* ---------------- particles ---------------- */
const PARTS = [];
function addPart(p){ if(PARTS.length > 450) PARTS.shift(); p.max = p.life; PARTS.push(p); }
function burst(x, y, scale=1, color='#ffb547'){
  addPart({ type:'flash', x, y, vx:0, vy:0, life:.22, size:60*scale, color:'#fff3c4' });
  for(let i=0;i<14*scale;i++){ const a = Math.random()*6.283, s = 60 + Math.random()*260*scale; addPart({ type:'spark', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:.25 + Math.random()*.5, size:1.5 + Math.random()*2, color: pick(['#fff3c4', color, '#ff8a3d']) }); }
  for(let i=0;i<6*scale;i++){ const a = Math.random()*6.283, s = 10 + Math.random()*40; addPart({ type:'smoke', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 10, life:.8 + Math.random()*1, size:(8 + Math.random()*10)*scale, color:'#2a2a36' }); }
  for(let i=0;i<4*scale;i++){ const a = Math.random()*6.283, s = 30 + Math.random()*120; addPart({ type:'glow', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:.3 + Math.random()*.4, size:10 + Math.random()*14*scale, color:'#ff8a3d' }); }
}
function debris(x, y, color, n=10){ for(let i=0;i<n;i++){ const a = Math.random()*6.283, s = 40 + Math.random()*180; addPart({ type:'debris', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:1.4 + Math.random()*1.4, size:4 + Math.random()*10, color:shade(color||'#46527a', -.3 - Math.random()*.3), rot:Math.random()*6, vr:(Math.random()-.5)*8, pts:3 + (Math.random()*3|0) }); } }
function vent(x, y, dx, dy){ for(let i=0;i<3;i++) addPart({ type:'smoke', x, y, vx:dx*60 + (Math.random()-.5)*30, vy:dy*60 + (Math.random()-.5)*30, life:.6 + Math.random()*.5, size:3 + Math.random()*4, color:'#c8d6ee' }); }
function ember(x, y){ addPart({ type:'glow', x:x + (Math.random()-.5)*10, y, vx:(Math.random()-.5)*12, vy:-30 - Math.random()*40, life:.5 + Math.random()*.5, size:4 + Math.random()*6, color:pick(['#ff8a3d','#ffb547','#ff5a3d']) }); }
function sparks(x, y, color, n=6){ for(let i=0;i<n;i++){ const a = Math.random()*6.283, s = 80 + Math.random()*160; addPart({ type:'spark', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:.2 + Math.random()*.3, size:1.5, color }); } }
function trail(x, y, color){ addPart({ type:'smoke', x, y, vx:(Math.random()-.5)*8, vy:(Math.random()-.5)*8, life:.5 + Math.random()*.4, size:3 + Math.random()*3, color: color||'#8890a8' }); }
function updateParts(dt){
  for(const p of PARTS){ p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(p.type==='smoke'){ p.vx *= .97; p.vy *= .97; p.size += dt*10; } else if(p.type==='spark'){ p.vx *= .94; p.vy *= .94; } else if(p.type==='debris'){ p.rot += p.vr*dt; p.vx *= .995; p.vy *= .995; } else if(p.type==='glow'){ p.vx *= .95; p.vy *= .95; } }
  let j = 0; for(let i=0;i<PARTS.length;i++) if(PARTS[i].life>0) PARTS[j++] = PARTS[i]; PARTS.length = j;
}
function drawParts(){
  for(const p of PARTS){ const k = clamp(p.life/p.max, 0, 1);
    if(p.type==='smoke'){ ctx.globalAlpha = k*.45; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    else if(p.type==='debris'){ ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, k*2); ctx.fillStyle = p.color; ctx.beginPath(); for(let i=0;i<p.pts;i++){ const a = i/p.pts*6.283, r = p.size*(i%2 ? .6 : 1); i ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,170,90,.6)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(const p of PARTS){ const k = clamp(p.life/p.max, 0, 1);
    if(p.type==='spark'){ ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*.035, p.y - p.vy*.035); ctx.stroke(); }
    else if(p.type==='glow'){ ctx.globalAlpha = k*.9; ctx.drawImage(glowSprite(p.color), p.x-p.size, p.y-p.size, p.size*2, p.size*2); }
    else if(p.type==='flash'){ ctx.globalAlpha = k; const s = p.size*(1.4-k*.4); ctx.drawImage(glowSprite(p.color,48), p.x-s, p.y-s, s*2, s*2); }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

/* ---------------- shields ---------------- */
function drawShieldBubble(cx, cy, rx, ry, layers, superPts, t){
  if(layers<=0 && superPts<=0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry/rx);
  if(layers>0){ const gr = ctx.createRadialGradient(0,0,rx*.55,0,0,rx); gr.addColorStop(0, hexA(C.cyan,0)); gr.addColorStop(.85, hexA(C.cyan,.05 + .03*layers)); gr.addColorStop(1, hexA(C.cyan,.22 + .08*layers)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,rx,0,7); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    for(let i=0;i<layers;i++){ ctx.strokeStyle = hexA(C.cyan, .35 - i*.05); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,rx - i*6,0,7); ctx.stroke(); }
    ctx.strokeStyle = hexA('#bff4ff', .25); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,rx, -2.3 + Math.sin(t)*.2, -1.2 + Math.sin(t)*.2); ctx.stroke(); }
  if(superPts>0){ ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(C.good, .35 + superPts*.04); ctx.lineWidth = 3 + superPts*.6; ctx.beginPath(); ctx.arc(0,0,rx+12,0,7); ctx.stroke(); }
  ctx.restore();
}
function ellipseEdge(sh, ox, oy){ const e = sh._shieldE; if(!e) return null; const a = Math.atan2((oy-e.cy)*(e.rx/e.ry), ox-e.cx); return { x:e.cx + Math.cos(a)*e.rx, y:e.cy + Math.sin(a)*e.ry, a }; }

/* ---------------- event art ---------------- */
const ART_CACHE = {};
function eventArt(kind, seed, w, h){
  const key = kind + '|' + seed + '|' + w + 'x' + h; if(ART_CACHE[key]) return ART_CACHE[key];
  const c = mkCanvas(w, h), g = c.getContext('2d'); const rnd = srng(hashStr(key));
  const tints = { nebula:'#8b6fd6', star:'#ffb547', distress:'#ff5a7a', station:'#5fd3e6', creature:'#9fdc7a', market:'#ffd166', fleet:'#ff5a7a', wreck:'#c9a27e', planet:'#7be0a0', glass:'#bff4ff', ship:'#5fd3e6', space:'#5fd3e6' };
  paintSpace(g, w, h, rnd, tints[kind]||'#5fd3e6', { nebula: kind==='nebula' || kind==='glass' });
  const cy = h/2;
  switch(kind){
    case 'planet': drawPlanet(g, w*.7, cy + h*.15, h*.75, rnd, pick(PLANET_COLS), '#8fc1ff'); break;
    case 'star': { const gr = g.createRadialGradient(w*.75,cy,0,w*.75,cy,h*1.2); gr.addColorStop(0,'#fffbe8'); gr.addColorStop(.15,'#ffd27a'); gr.addColorStop(.45,'rgba(255,140,50,.35)'); gr.addColorStop(1,'rgba(255,100,40,0)'); g.fillStyle = gr; g.fillRect(0,0,w,h); break; }
    case 'station': { const x = w*.68; g.strokeStyle = '#7a88b0'; g.lineWidth = 6; g.beginPath(); g.ellipse(x, cy, h*.5, h*.18, 0, 0, 7); g.stroke(); g.fillStyle = '#3a4566'; g.fillRect(x-14, cy-h*.42, 28, h*.84); g.fillStyle = '#5fd3e6';
      for(let i=0;i<10;i++) g.fillRect(x-8, cy-h*.36 + i*h*.07, 4, 3); for(const d of [-1,1]){ g.fillStyle = '#2a3150'; g.fillRect(x + d*h*.5 - 40, cy-6, 80, 12); g.fillStyle = '#4b6aa8'; for(let i=0;i<6;i++) g.fillRect(x + d*h*.5 - 38 + i*13, cy-30, 10, 22); }
      g.drawImage(glowSprite('#ff5a7a',16), x-8, cy-h*.46, 16, 16); break; }
    case 'wreck': for(let i=0;i<7;i++){ const x = w*.45 + rnd()*w*.45, y = cy + (rnd()-.5)*h*.6, s = 10 + rnd()*40; g.save(); g.translate(x,y); g.rotate(rnd()*6); g.fillStyle = shade('#46527a', -rnd()*.5); g.fillRect(-s, -s*.35, s*2, s*.7); g.strokeStyle = 'rgba(255,140,60,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(s, -s*.35); g.lineTo(s*.7, 0); g.lineTo(s, s*.35); g.stroke(); g.restore(); }
      for(let i=0;i<6;i++) g.drawImage(glowSprite('#ff8a3d',12), w*.45 + rnd()*w*.45, cy + (rnd()-.5)*h*.5, 10, 10); break;
    case 'nebula': for(let i=0;i<8;i++){ const x = rnd()*w, y = rnd()*h, r = 40 + rnd()*120; const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(200,170,255,.25)'); gr.addColorStop(1,'rgba(200,170,255,0)'); g.fillStyle = gr; g.fillRect(x-r,y-r,2*r,2*r); } break;
    case 'asteroid': for(let i=0;i<22;i++) drawRock(g, w*.35 + rnd()*w*.65, rnd()*h, 4 + rnd()*26, rnd); break;
    case 'creature': { const x = w*.7; g.fillStyle = '#3d5a3a'; g.beginPath(); g.ellipse(x, cy, h*.55, h*.3, -.2, 0, 7); g.fill(); g.fillStyle = '#5c8a4f'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(x - h*.3 + i*h*.15, cy - h*.12, h*.06, h*.04, 0, 0, 7); g.fill(); }
      g.fillStyle = '#ffd166'; g.beginPath(); g.arc(x + h*.35, cy - h*.05, h*.06, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x + h*.37, cy - h*.05, h*.025, 0, 7); g.fill();
      g.strokeStyle = '#3d5a3a'; g.lineWidth = 6; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(x - h*.4, cy + i*8 - 10); g.quadraticCurveTo(x - h*.8, cy + i*20, x - h*.95, cy - 30 + i*25); g.stroke(); } break; }
    case 'market': { for(let i=0;i<4;i++){ const x = w*.45 + i*w*.13, y = cy + Math.sin(i*1.7)*h*.18; g.fillStyle = '#4a4030'; g.fillRect(x-30, y-12, 60, 24); g.fillStyle = pick(['#ffd166','#7be0a0','#5fd3e6','#ff9de2']); g.fillRect(x-22, y-8, 14, 6); g.drawImage(glowSprite('#ffd166',10), x+16, y-6, 10, 10); } break; }
    case 'distress': { const x = w*.7; g.fillStyle = '#3a4566'; g.fillRect(x-6, cy-30, 12, 60); g.fillStyle = '#2a3150'; g.beginPath(); g.arc(x, cy-30, 14, 0, 7); g.fill();
      for(let i=1;i<5;i++){ g.strokeStyle = `rgba(255,90,122,${.5 - i*.1})`; g.lineWidth = 3; g.beginPath(); g.arc(x, cy-30, 14 + i*16, -1.2, -.2); g.stroke(); g.beginPath(); g.arc(x, cy-30, 14 + i*16, Math.PI+.2, Math.PI+1.2); g.stroke(); }
      g.drawImage(glowSprite('#ff5a7a',20), x-20, cy-50, 40, 40); break; }
    case 'fleet': for(let i=0;i<9;i++){ const x = w*.4 + rnd()*w*.55, y = rnd()*h, s = 4 + rnd()*10; g.fillStyle = '#5a2a38'; g.beginPath(); g.moveTo(x+s*2, y); g.lineTo(x-s, y-s*.7); g.lineTo(x-s*.6, y); g.lineTo(x-s, y+s*.7); g.closePath(); g.fill(); g.drawImage(glowSprite('#ff5a7a',8), x-s*1.6, y-4, 8, 8); } break;
    case 'glass': for(let i=0;i<16;i++){ const x = w*.35 + rnd()*w*.65, y = rnd()*h, s = 8 + rnd()*30; g.fillStyle = `rgba(200,240,255,${.25 + rnd()*.4})`; g.beginPath(); g.moveTo(x, y-s); g.lineTo(x+s*.4, y); g.lineTo(x, y+s*.6); g.lineTo(x-s*.4, y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.stroke(); } break;
  }
  return ART_CACHE[key] = c;
}
function artFor(ev, m){
  if(m?.combat) return 'ship';
  if(ev?.art) return ev.art;
  const t = (ev?.text||'').toLowerCase();
  if(ev?.distress) return 'distress';
  if(/nebula|mist|whisper/.test(t)) return 'nebula';
  if(/wreck|derelict|graveyard|debris|hulk/.test(t)) return 'wreck';
  if(/station|dock|relay|depot|outpost|base/.test(t)) return 'station';
  if(/sun|star|flare|comet/.test(t)) return 'star';
  if(/asteroid|rock|miner/.test(t)) return 'asteroid';
  if(/merchant|trader|dealer|casino|market|smuggler|shop/.test(t)) return 'market';
  if(/weevil|creature|whale|beast|spider|monster|alien/.test(t)) return 'creature';
  if(/planet|moon|colony|world/.test(t)) return 'planet';
  if(/glass|crystal|shard/.test(t)) return 'glass';
  if(/fleet|rebuff|armada/.test(t)) return 'fleet';
  return 'space';
}
