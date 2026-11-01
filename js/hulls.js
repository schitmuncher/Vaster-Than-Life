'use strict';
/* =========================================================================
   Hull styles: every faction builds ships its own way. A style sets the hull
   outline, the engines, the fins, the paint, the cockpit and a few details:
   Fedoration wedges, Rebuff spikes, Enjinn capsules with dishes, Pebblekin
   rock, Voltan lenses of light, Sloog blobs, Mantlis insects with mandibles,
   stealth chevrons, Glassborn crystal, pyrate patchwork, automated blocks...
   Outlines only ever grow outwards from the rooms (and are scaled up if they
   would cut a room), so the interior always fits. Ships and mods can pick a
   style with "style": "voltan" (any key of HSTYLE).
   ========================================================================= */
const HSTYLE = {
  fed:     { out:'wedge', nac:'twin',  fin:'swept',    pal:['#46527a','#2b3456','#121729'], cock:'glass', plate:'rows' },
  rebuff:  { out:'spike', nac:'quad',  fin:'blade',    pal:['#4a3a44','#2a2028','#120c12'], cock:'slit',  plate:'rows', stripe:'#ff5a7a', decor:'spikes' },
  enjinn:  { out:'round', nac:'pods',  fin:'none',     pal:['#3f6e6a','#25443f','#10201d'], cock:'dome',  plate:'grid', decor:'dish' },
  pebble:  { out:'jag',   nac:'rock',  fin:'none',     pal:['#7a5a3e','#4c3626','#22180f'], cock:'slit',  plate:'rock', decor:'boulders' },
  voltan:  { out:'lens',  nac:'light', fin:'crescent', pal:['#7d7a5a','#4b4934','#1d1c12'], cock:'glow',  plate:'lines', decor:'halo' },
  sloog:   { out:'blob',  nac:'pods',  fin:'none',     pal:['#4f7a3e','#2f4b25','#13200f'], cock:'dome',  plate:'organic', decor:'tendrils' },
  mantlis: { out:'insect',nac:'twin',  fin:'wings',    pal:['#5a6a2c','#36401a','#161b0a'], cock:'eyes',  plate:'segments', decor:'legs' },
  stealth: { out:'flat',  nac:'flush', fin:'none',     pal:['#33304a','#1f1d30','#0b0a14'], cock:'slit',  plate:'stealth' },
  glass:   { out:'facet', nac:'crystal', fin:'none',   pal:['#5fa7c4','#2c5a72','#0e2230'], cock:'glow',  plate:'crystal', decor:'shards' },
  pyrate:  { out:'patch', nac:'odd',   fin:'swept',    pal:['#6a4a36','#3e2b20','#1a120c'], cock:'glass', plate:'patch', decor:'flag' },
  auto:    { out:'block', nac:'quad',  fin:'blade',    pal:['#5a5f6e','#353946','#16181f'], cock:'eye',   plate:'grid', decor:'antennae' },
  flag:    { out:'spike', nac:'quad',  fin:'blade',    pal:['#3a2a34','#21161e','#0c070b'], cock:'slit',  plate:'rows', stripe:'#ff3a5a', decor:'spikes' },
  hive:    { out:'round', nac:'quad',  fin:'swept',    pal:['#6a5a2c','#40361a','#1a160a'], cock:'dome',  plate:'hex', decor:'hangars' },
  bug:     { out:'bulbs', nac:'twin',  fin:'none',     pal:['#4f6a4a','#2f402c','#121a10'], cock:'glass', plate:'rows' }
};
/* which style a ship gets: its own "style", else guessed from its class, name, crew or faction */
function shipStyle(sh){
  if(sh._style) return sh._style; const def = (DATA.ships && DATA.ships[sh.id]) || (DATA.enemies && DATA.enemies[sh.id]) || {};
  let s = def.style && HSTYLE[def.style] ? def.style : null;
  const txt = `${sh.id} ${sh.cls||''} ${def.name||''} ${(def.tags||[]).join(' ')} ${sh.faction||''}`.toLowerCase();
  if(!s){ if(sh.boss) s = 'flag'; else if(def.auto || sh.auto) s = 'auto';
    else if(/rd_star|starbug|midget|mining shuttle/.test(txt)) s = 'bug';
    else if(/enjinn|engi|drone carrier|beehive|swarm|hive/.test(txt)) s = /carrier|beehive|swarm|hive/.test(txt) ? 'hive' : 'enjinn';
    else if(/pebble|rock|anvil|siege|juggernaut|brute/.test(txt)) s = 'pebble';
    else if(/voltan|ion skirm|tide|lance|lantern/.test(txt)) s = 'voltan';
    else if(/sloog|slime|puppet|mind/.test(txt)) s = 'sloog';
    else if(/mantlis|raider|crowbar|boarding/.test(txt)) s = 'mantlis';
    else if(/stealth|peekaboo|phantom|shade|cloak|infiltrat/.test(txt)) s = 'stealth';
    else if(/glass|crystal/.test(txt)) s = 'glass';
    else if(/pyrate|pirate|corsair|jolly|galleon|gunship|boom|scoundrel/.test(txt)) s = 'pyrate';
    else if(/rebuff|defector|turncoat|whistle|simulant/.test(txt)) s = 'rebuff';
    else if(/gelf|canoe|longboat/.test(txt)) s = 'pebble';
    else s = 'fed'; }
  return (sh._style = s);
}
function hstyle(b){ return HSTYLE[b && b.style] || HSTYLE.fed; }
/* ---------------- outlines ---------------- */
function inPoly(P, x, y){ let c = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if(((yi > y) !== (yj > y)) && (x < (xj - xi)*(y - yi)/(yj - yi) + xi)) c = !c; } return c; }
function hullPoints(b){
  if(b._pts && b._ptsKey === b.style + b.x0 + b.y0 + b.x1 + b.y1) return b._pts;
  const { x0,y0,x1,y1,nose,facing } = b, cy = (y0+y1)/2, Hh = y1-y0, L = x1-x0, cx = (x0+x1)/2, n = nose, st = hstyle(b);
  const rnd = srng(hashStr(String(b.seed||'') + st.out) || 3);
  let P;
  const superE = (k, ax, by, shift, wob) => { const out = [], N = 56; for(let i = 0; i < N; i++){ const t = i/N*Math.PI*2, c = Math.cos(t), s = Math.sin(t), w = 1 + (wob ? wob*Math.sin(t*5 + 1.3) : 0);
    out.push([cx + shift + ax*w*Math.sign(c)*Math.pow(Math.abs(c), 2/k), cy + by*w*Math.sign(s)*Math.pow(Math.abs(s), 2/k)]); } return out; };
  switch(st.out){
    case 'spike': P = [[x0+28,y0],[x1-30,y0],[x1+n*.35,cy-Hh*.14],[x1+n*1.45,cy],[x1+n*.35,cy+Hh*.14],[x1-30,y1],[x0+28,y1],[x0+8,y1+10],[x0-22,y1-6],[x0,cy+Hh*.16],[x0-14,cy],[x0,cy-Hh*.16],[x0-22,y0+6],[x0+8,y0-10]]; break;
    case 'round': P = superE(5, L/2 + n*.55, Hh/2*1.02, n*.5, 0); break;
    case 'blob':  P = superE(3.2, L/2 + n*.5, Hh/2*1.08, n*.45, .045); break;
    case 'lens': { P = []; const xa = x0 - 46, xb = x1 + n*1.1, N = 26, u0 = Math.min((x0 + 6 - xa)/(xb - xa), (xb - x1 - 6)/(xb - xa)), hh = Math.min(Hh/2*1.4, (Hh/2 + 8)/Math.pow(Math.sin(Math.PI*u0), .32)); for(let i = 0; i <= N; i++){ const u = i/N; P.push([xa + (xb-xa)*u, cy - hh*Math.pow(Math.sin(Math.PI*u), .32)]); } for(let i = N-1; i > 0; i--){ const u = i/N; P.push([xa + (xb-xa)*u, cy + hh*Math.pow(Math.sin(Math.PI*u), .32)]); } break; }
    case 'jag': { P = []; const step = 26; for(let x = x0+6; x < x1; x += step) P.push([x, y0 - 4 - rnd()*14]); P.push([x1+n*.4, y0+Hh*.12 - rnd()*10], [x1+n*.95, cy - Hh*.06], [x1+n*.8, cy + Hh*.1], [x1+n*.35, y1 - Hh*.1 + rnd()*10]);
      for(let x = x1-6; x > x0; x -= step) P.push([x, y1 + 4 + rnd()*14]); P.push([x0-14 - rnd()*10, y1-14], [x0-20 - rnd()*12, cy], [x0-14 - rnd()*10, y0+14]); break; }
    case 'insect': P = [[x0+24,y0-4],[x0+L*.3,y0-14],[x0+L*.38,y0],[x0+L*.62,y0-14],[x0+L*.7,y0],[x1-10,y0-8],[x1+n*.3,cy-Hh*.24],[x1+n*1.15,cy-Hh*.16],[x1+n*.55,cy-Hh*.05],[x1+n*.4,cy],[x1+n*.55,cy+Hh*.05],[x1+n*1.15,cy+Hh*.16],[x1+n*.3,cy+Hh*.24],[x1-10,y1+8],[x0+L*.7,y1],[x0+L*.62,y1+14],[x0+L*.38,y1],[x0+L*.3,y1+14],[x0+24,y1+4],[x0-26,cy+Hh*.22],[x0-52,cy],[x0-26,cy-Hh*.22]]; break;
    case 'block': P = [[x0+10,y0-4],[x1-6,y0-4],[x1+n*.55,y0+Hh*.16],[x1+n*.55,y1-Hh*.16],[x1-6,y1+4],[x0+10,y1+4],[x0-6,y1-14],[x0-6,y0+14]]; break;
    case 'flat': P = [[x0+12,y0-2],[x1-40,y0-12],[x1+n*1.6,cy],[x1-40,y1+12],[x0+12,y1+2],[x0-30,y1+14],[x0+6,cy],[x0-30,y0-14]]; break;
    case 'facet': { P = []; const N = 14; for(let i = 0; i < N; i++){ const t = i/N*Math.PI*2; const r = 1.08 + rnd()*.14; P.push([cx + n*.45 + Math.cos(t)*(L/2 + n*.6)*r, cy + Math.sin(t)*(Hh/2)*r*1.06]); } break; }
    case 'patch': P = [[x0+22,y0],[x0+L*.3,y0],[x0+L*.32,y0-12],[x0+L*.46,y0-12],[x0+L*.48,y0],[x1-14,y0],[x1+n*.6,cy-Hh*.22],[x1+n*1.05,cy-Hh*.02],[x1+n*.9,cy+Hh*.08],[x1+n*.5,cy+Hh*.2],[x1-14,y1],[x0+L*.7,y1],[x0+L*.68,y1+16],[x0+L*.56,y1+10],[x0+L*.54,y1],[x0+22,y1],[x0+4,y1-18],[x0-8,y1-30],[x0,y0+30],[x0+4,y0+18]]; break;
    case 'bulbs': { P = []; const hump = (u0, u1, h) => { for(let i = 0; i <= 8; i++){ const u = u0 + (u1-u0)*i/8; P.push([x0 + L*u, y0 - h*Math.sin(Math.PI*i/8)]); } };
      hump(0, .36, 22); hump(.36, .64, 10); hump(.64, 1, 18); P.push([x1+n*.6, y0+Hh*.12], [x1+n*.95, cy], [x1+n*.6, y1-Hh*.12]);
      const bot = []; for(const [x, y] of P.slice(0, 27).reverse()) bot.push([x, y1 + (y0 - y)]); P.push(...bot); P.push([x0-18, y1-20], [x0-26, cy], [x0-18, y0+20]); break; }
    default: P = [[x0+22,y0],[x1-14,y0],[x1+n*.55,cy-Hh*.2],[x1+n,cy-Hh*.04],[x1+n,cy+Hh*.04],[x1+n*.55,cy+Hh*.2],[x1-14,y1],[x0+22,y1],[x0+4,y1-18],[x0,y1-30],[x0,y0+30],[x0+4,y0+18]];
  }
  // never cut into a room: grow the outline until the rooms (inset by a few pixels) fit inside
  const ix0 = b.ox != null ? b.ox - 4 : x0 + 16, ix1 = b.ox != null ? x1 - (b.ox - x0) + 4 : x1 - 16, iy0 = b.oy != null ? b.oy - 4 : y0 + 16, iy1 = b.oy != null ? y1 - (b.oy - y0) + 4 : y1 - 16;
  const chk = [[ix0,iy0],[ix1,iy0],[ix0,iy1],[ix1,iy1],[(ix0+ix1)/2,iy0],[(ix0+ix1)/2,iy1],[ix0,cy],[ix1,cy]];
  for(let k = 0; k < 12 && !chk.every(([x, y]) => inPoly(P, x, y)); k++){ const ccx = (ix0+ix1)/2; P = P.map(([x, y]) => [ccx + (x - ccx)*1.05, cy + (y - cy)*1.06]); }
  const X = x => facing>0 ? x : 2*cx - x;
  b._pts = P.map(p => [X(p[0]), p[1]]); b._ptsKey = b.style + x0 + y0 + x1 + y1;
  return b._pts;
}
function nacelles(b){
  const { x0,y0,x1,y1,facing } = b, L = x1-x0, cx = (x0+x1)/2, Hh = y1-y0; const X = x => facing>0 ? x : 2*cx - x;
  const h = Math.max(14, Hh*.13), st = hstyle(b);
  const twin = (len, hh, off) => [ { x0:X(x0-24), x1:X(x0+L*len), y:y0-hh*off, h:hh, top:true }, { x0:X(x0-24), x1:X(x0+L*len), y:y1-hh*(1-off), h:hh, top:false } ];
  switch(st.nac){
    case 'quad': { const hh = h*.62; return [ ...twin(.34, hh, .75), { x0:X(x0-34), x1:X(x0+L*.22), y:y0+Hh*.22, h:hh*.9 }, { x0:X(x0-34), x1:X(x0+L*.22), y:y1-Hh*.22-hh*.9, h:hh*.9 } ]; }
    case 'pods': { const hh = h*1.35; return [ { x0:X(x0-30), x1:X(x0+L*.16), y:y0-hh*.6, h:hh, pod:true }, { x0:X(x0-30), x1:X(x0+L*.16), y:y1-hh*.4, h:hh, pod:true } ]; }
    case 'rock': { const hh = h*1.2; return [ { x0:X(x0-30), x1:X(x0+L*.12), y:cy0(b)-hh*1.4, h:hh, rock:true }, { x0:X(x0-30), x1:X(x0+L*.12), y:cy0(b)+hh*.4, h:hh, rock:true } ]; }
    case 'light': return twin(.42, h*.55, .5).map(n => Object.assign(n, { light:true }));
    case 'flush': return [ { x0:X(x0-14), x1:X(x0+L*.3), y:y0+4, h:h*.6, flush:true }, { x0:X(x0-14), x1:X(x0+L*.3), y:y1-4-h*.6, h:h*.6, flush:true } ];
    case 'crystal': return twin(.28, h*.8, .55).map(n => Object.assign(n, { crystal:true }));
    case 'odd': return [ { x0:X(x0-30), x1:X(x0+L*.44), y:y0-h*.7, h:h*1.2 }, { x0:X(x0-14), x1:X(x0+L*.26), y:y1-h*.3, h:h*.7 } ];
    default: return twin(.38, h, .55);
  }
}
function cy0(b){ return (b.y0 + b.y1)/2; }
/* engines, drawn by style */
function drawNacelle(g, n, col, st){
  const xa = Math.min(n.x0, n.x1), xb = Math.max(n.x0, n.x1), w = xb - xa;
  g.beginPath();
  if(n.pod) g.ellipse(xa + w/2, n.y + n.h/2, w/2, n.h/2, 0, 0, 7);
  else if(n.rock){ g.moveTo(xa, n.y + n.h*.2); g.lineTo(xa + w*.3, n.y); g.lineTo(xb, n.y + n.h*.15); g.lineTo(xb - w*.1, n.y + n.h); g.lineTo(xa + w*.2, n.y + n.h*.9); g.closePath(); }
  else if(n.crystal){ g.moveTo(xa, n.y + n.h/2); g.lineTo(xa + w*.3, n.y); g.lineTo(xb, n.y + n.h*.3); g.lineTo(xb, n.y + n.h*.7); g.lineTo(xa + w*.3, n.y + n.h); g.closePath(); }
  else if(g.roundRect) g.roundRect(xa, n.y, w, n.h, n.flush ? 2 : n.h/2); else g.rect(xa, n.y, w, n.h);
  const p = st.pal, ng = g.createLinearGradient(0, n.y, 0, n.y + n.h); ng.addColorStop(0, shade(p[0], .15)); ng.addColorStop(.5, p[1]); ng.addColorStop(1, p[2]); g.fillStyle = ng; g.fill();
  g.strokeStyle = n.light ? hexA(col, .9) : shade(col, -.2); g.lineWidth = n.light ? 2 : 1.5; g.stroke();
  if(n.light){ g.fillStyle = hexA(col, .5); g.fillRect(xa + w*.1, n.y + n.h*.35, w*.8, n.h*.3); }
  else if(!n.rock){ g.fillStyle = hexA(col, .7); g.fillRect(xa + w*.35, n.y + n.h*.38, w*.4, n.h*.24); }
}
/* fins, drawn by style */
function drawFins(g, b, col, st, X){
  const { x0,y0,x1,y1 } = b, L = x1-x0, Hh = y1-y0;
  if(st.fin==='none') return;
  for(const top of [true, false]){ const y = top ? y0 : y1, d = top ? -1 : 1;
    g.beginPath();
    if(st.fin==='blade'){ const fh = Math.max(20, Hh*.2); g.moveTo(X(x0+L*.42), y); g.lineTo(X(x0+L*.3), y + d*fh); g.lineTo(X(x0+L*.38), y + d*fh); g.lineTo(X(x0+L*.62), y); }
    else if(st.fin==='crescent'){ const fh = Math.max(22, Hh*.26); g.moveTo(X(x0+L*.3), y); g.quadraticCurveTo(X(x0+L*.38), y + d*fh*1.3, X(x0+L*.62), y + d*fh); g.quadraticCurveTo(X(x0+L*.5), y + d*fh*.4, X(x0+L*.56), y); }
    else if(st.fin==='wings'){ const fh = Math.max(30, Hh*.45); g.moveTo(X(x0+L*.4), y); g.quadraticCurveTo(X(x0+L*.1), y + d*fh*1.2, X(x0-L*.05), y + d*fh*.7); g.quadraticCurveTo(X(x0+L*.2), y + d*fh*.2, X(x0+L*.55), y); }
    else { const fh = Math.max(12, Hh*.1); g.moveTo(X(x0+L*.5), y); g.lineTo(X(x0+L*.6), y + d*fh); g.lineTo(X(x0+L*.68), y + d*fh); g.lineTo(X(x0+L*.66), y); }
    g.closePath();
    if(st.fin==='wings'){ g.fillStyle = 'rgba(190,230,140,.18)'; g.fill(); g.strokeStyle = hexA(col, .55); g.lineWidth = 1.2; g.stroke(); }
    else if(st.fin==='crescent'){ g.fillStyle = hexA(col, .35); g.fill(); g.strokeStyle = hexA('#ffffff', .6); g.lineWidth = 1.5; g.stroke(); }
    else { const fg = g.createLinearGradient(0, y, 0, y + d*20); fg.addColorStop(0, st.pal[1]); fg.addColorStop(1, shade(st.pal[0], .1)); g.fillStyle = fg; g.fill(); g.strokeStyle = hexA(st.stripe || col, .75); g.lineWidth = 1.5; g.stroke(); }
  }
}
/* details behind the hull (legs, tendrils, wings' veins...) */
function hullBehind(g, b, col, st, X, rnd){
  const { x0,y0,x1,y1 } = b, L = x1-x0, Hh = y1-y0;
  if(st.decor==='spikes'){ g.fillStyle = shade(st.pal[0], .1); for(let i = 0; i < 5; i++){ const xx = x0 + L*(.2 + i*.14); for(const [y, d] of [[y0, -1], [y1, 1]]){ g.beginPath(); g.moveTo(X(xx), y); g.lineTo(X(xx + 8), y + d*14); g.lineTo(X(xx + 16), y); g.closePath(); g.fill(); } } }
  if(st.decor==='boulders'){ g.fillStyle = shade(st.pal[0], -.1); for(let i = 0; i < 6; i++){ const xx = X(x0 + rnd()*L), top = rnd()<.5; g.beginPath(); g.ellipse(xx, top ? y0 - 4 : y1 + 4, 10 + rnd()*10, 6 + rnd()*5, rnd(), 0, 7); g.fill(); } }
  if(st.decor==='shards'){ g.fillStyle = 'rgba(160,240,255,.5)'; for(let i = 0; i < 6; i++){ const xx = X(x0 + L*(.15 + i*.13)), top = i%2===0, y = top ? y0 : y1, d = top ? -1 : 1; g.beginPath(); g.moveTo(xx - 6, y); g.lineTo(xx, y + d*(16 + rnd()*14)); g.lineTo(xx + 6, y); g.closePath(); g.fill(); } }
  if(st.decor==='legs'){ g.strokeStyle = shade(st.pal[1], .2); g.lineWidth = 3; g.lineCap = 'round'; for(let i = 0; i < 3; i++){ const xx = x0 + L*(.3 + i*.18); g.beginPath(); g.moveTo(X(xx), y1 - 4); g.lineTo(X(xx - 14), y1 + 18); g.lineTo(X(xx - 4), y1 + 30); g.stroke(); } }
  if(st.decor==='tendrils'){ g.strokeStyle = hexA(shade(st.pal[0], .2), .8); g.lineWidth = 4; g.lineCap = 'round'; for(let i = 0; i < 4; i++){ const yy = y0 + Hh*(.2 + i*.2); g.beginPath(); g.moveTo(X(x0), yy); g.bezierCurveTo(X(x0 - 30), yy - 10, X(x0 - 20), yy + 16, X(x0 - 48 - rnd()*14), yy + 6); g.stroke(); } }
  if(st.decor==='halo'){ g.strokeStyle = hexA(col, .35); g.lineWidth = 3; g.beginPath(); g.ellipse(X(x0 + L*.45), (y0+y1)/2, L*.18, Hh*.72, 0, 0, 7); g.stroke(); }
  if(st.decor==='dish'){ const xx = X(x0 + L*.25); g.strokeStyle = shade(st.pal[0], .3); g.lineWidth = 2; g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 - 22); g.stroke(); g.beginPath(); g.ellipse(xx, y0 - 26, 14, 6, 0, 0, 7); g.fillStyle = st.pal[0]; g.fill(); g.stroke(); }
  if(st.decor==='antennae'){ g.strokeStyle = '#8a95b8'; g.lineWidth = 1.5; for(let i = 0; i < 3; i++){ const xx = X(x0 + L*(.2 + i*.12)); g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 - 14 - i*6); g.stroke(); g.fillStyle = C.hostile; g.fillRect(xx - 1.5, y0 - 16 - i*6, 3, 3); } }
  if(st.decor==='flag'){ const xx = X(x0 + L*.15); g.strokeStyle = '#8a7a64'; g.lineWidth = 2; g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y0 - 40); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(xx, y0 - 40); g.lineTo(xx - b.facing*30, y0 - 34); g.lineTo(xx, y0 - 26); g.closePath(); g.fill(); g.fillStyle = '#eee'; g.beginPath(); g.arc(xx - b.facing*11, y0 - 33, 3, 0, 7); g.fill(); }
  if(st.decor==='hangars'){ g.fillStyle = st.pal[2]; for(const yy of [y0 - 10, y1 + 2]) g.fillRect(X(x0 + L*.55) - (b.facing>0 ? 0 : L*.25), yy, L*.25, 8); }
}
/* details over the hull plating */
function hullFront(g, b, col, st, X, rnd, ox, oy, w, h){
  const { x0,y0,x1,y1 } = b, L = x1-x0, Hh = y1-y0;
  if(st.plate==='rock'){ for(let i = 0; i < 26; i++){ g.fillStyle = `rgba(${rnd()<.5 ? '0,0,0' : '255,220,180'},${.05 + rnd()*.08})`; g.beginPath(); g.ellipse(ox + rnd()*w, oy + rnd()*h, 10 + rnd()*30, 6 + rnd()*16, rnd()*3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for(let i = 0; i < 8; i++){ let x = x0 + rnd()*L, y = y0 + rnd()*Hh; g.beginPath(); g.moveTo(x, y); for(let k = 0; k < 4; k++){ x += (rnd()-.5)*30; y += (rnd()-.5)*20; g.lineTo(x, y); } g.stroke(); } }
  if(st.plate==='organic'){ for(let i = 0; i < 30; i++){ g.fillStyle = `rgba(200,255,150,${.04 + rnd()*.07})`; g.beginPath(); g.arc(ox + rnd()*w, oy + rnd()*h, 3 + rnd()*12, 0, 7); g.fill(); } }
  if(st.plate==='crystal'){ g.strokeStyle = 'rgba(200,250,255,.25)'; g.lineWidth = 1.2; for(let i = 0; i < 14; i++){ g.beginPath(); g.moveTo(ox + rnd()*w, oy + rnd()*h); g.lineTo(ox + rnd()*w, oy + rnd()*h); g.stroke(); } }
  if(st.plate==='stealth'){ g.strokeStyle = 'rgba(160,140,255,.14)'; g.lineWidth = 1; for(let i = -8; i < 16; i++){ g.beginPath(); g.moveTo(X(x0 + i*40), y0); g.lineTo(X(x0 + i*40 + Hh*.6), (y0+y1)/2); g.lineTo(X(x0 + i*40), y1); g.stroke(); } }
  if(st.plate==='segments'){ g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; for(let i = 1; i < 5; i++){ const xx = X(x0 + L*i/5); g.beginPath(); g.moveTo(xx, y0 - 16); g.quadraticCurveTo(X(x0 + L*i/5 + 14), (y0+y1)/2, xx, y1 + 16); g.stroke(); } }
  if(st.plate==='hex'){ g.strokeStyle = 'rgba(255,220,120,.12)'; g.lineWidth = 1; const r = 14; for(let yy = oy; yy < oy + h; yy += r*1.5) for(let xx = ox + ((yy/(r*1.5))%2 ? r : 0); xx < ox + w; xx += r*2){ g.beginPath(); for(let k = 0; k < 6; k++){ const a = k*Math.PI/3; g.lineTo(xx + Math.cos(a)*r*.9, yy + Math.sin(a)*r*.9); } g.closePath(); g.stroke(); } }
  if(st.plate==='patch'){ for(let i = 0; i < 9; i++){ const pw = 30 + rnd()*60, ph = 16 + rnd()*30, px = x0 + rnd()*L, py = y0 + rnd()*Hh; g.fillStyle = `rgba(${rnd()<.5 ? '120,90,60' : '70,80,100'},.35)`; g.fillRect(px, py, pw, ph); g.fillStyle = 'rgba(0,0,0,.5)'; for(let k = 0; k < 4; k++) g.fillRect(px + 3 + k*(pw-6)/3, py + 2, 2, 2); } }
  if(st.plate==='lines'){ g.strokeStyle = hexA(col, .3); g.lineWidth = 1.5; for(let i = 0; i < 3; i++){ const yy = y0 + Hh*(.25 + i*.25); g.beginPath(); g.moveTo(ox, yy); g.lineTo(ox + w, yy); g.stroke(); } }
  if(st.stripe){ g.fillStyle = hexA(st.stripe, .6); g.fillRect(ox, (y0+y1)/2 - 3, w, 6); }
}
/* the cockpit, by style */
function drawCockpit(g, b, col, st, X){
  const { x1,y0,y1 } = b, cy = (y0+y1)/2, Hh = y1-y0, n = b.nose;
  const nx = x1 + n*(st.out==='spike' || st.out==='flat' ? .3 : .12);
  if(st.cock==='eye'){ g.fillStyle = '#1a0608'; g.beginPath(); g.arc(X(nx + n*.2), cy, Hh*.07, 0, 7); g.fill(); g.fillStyle = C.hostile; g.beginPath(); g.arc(X(nx + n*.2), cy, Hh*.035, 0, 7); g.fill(); return; }
  if(st.cock==='eyes'){ for(const d of [-1, 1]){ g.fillStyle = '#ffe24a'; g.beginPath(); g.ellipse(X(nx + n*.1), cy + d*Hh*.12, Hh*.05, Hh*.03, 0, 0, 7); g.fill(); } return; }
  if(st.cock==='dome'){ const gg = g.createRadialGradient(X(nx), cy - Hh*.03, 2, X(nx), cy, Hh*.13); gg.addColorStop(0, '#d8fff4'); gg.addColorStop(1, '#1d5a52'); g.fillStyle = gg; g.beginPath(); g.ellipse(X(nx), cy, Math.max(8, n*.3), Hh*.12, 0, 0, 7); g.fill(); return; }
  if(st.cock==='glow'){ g.fillStyle = hexA(col, .9); g.beginPath(); g.ellipse(X(nx + n*.15), cy, Math.max(8, n*.35), Hh*.05, 0, 0, 7); g.fill(); return; }
  if(st.cock==='slit'){ g.fillStyle = '#7fd8ff'; g.fillRect(X(nx) - (b.facing>0 ? 0 : n*.5), cy - 2, n*.5, 4); return; }
  const gw = Math.max(10, n*.5), gh = Math.max(4, Hh*.045);
  g.beginPath(); g.moveTo(X(nx - gw*.4), cy - gh*2.2); g.lineTo(X(nx + gw*.45), cy - gh*.6); g.lineTo(X(nx + gw*.45), cy - gh*.1); g.lineTo(X(nx - gw*.4), cy - gh*.9); g.closePath();
  g.moveTo(X(nx - gw*.4), cy + gh*2.2); g.lineTo(X(nx + gw*.45), cy + gh*.6); g.lineTo(X(nx + gw*.45), cy + gh*.1); g.lineTo(X(nx - gw*.4), cy + gh*.9); g.closePath();
  const gg = g.createLinearGradient(0, cy-gh, 0, cy+gh); gg.addColorStop(0,'#bff4ff'); gg.addColorStop(.3,'#3fa8c4'); gg.addColorStop(1,'#0c2a3a'); g.fillStyle = gg; g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.stroke();
}
