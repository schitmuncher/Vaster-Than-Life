'use strict';
/* =========================================================================
   Crew sprites. Every crew member gets a persistent look (gender, skin, hair,
   colour morph, accessories). Figures are drawn procedurally at 2x with
   shading and outlines, in idle / walk / work / fight frames, and cached.
   ========================================================================= */
const SKIN_TONES = ['#f3d2b3','#e8b893','#d29a6c','#b07a4f','#8a5a36','#5e3b22','#3f2716'];
const HAIR_COLS = ['#16120f','#3a2416','#5e3a1e','#8a5a2c','#c08a46','#e0c27a','#b8432a','#e9e4d8','#7a4bb0','#2f7fa8','#c94f8a'];
const HAIR_F = ['long','bob','bun','ponytail','braid','pixie','curly'];
const HAIR_M = ['short','crop','mohawk','bald','swept','curly','beardshort'];
const MORPHS = {
  pebblekin:['#9aa7b8','#a99f92','#8d9aa0','#b3a48c','#7f8a96'],
  enjinn:['#6fc3ff','#5fd3e6','#7f9cff','#58e0c0','#9a86ff'],
  voltan:['#ffe27a','#fff2b0','#ffc46a','#d8ff8a','#ffd0f0'],
  sloog:['#9fdc7a','#7fcf9a','#c2e070','#8fd0c0','#b0d88a'],
  mantlis:['#c6e05a','#8fd45a','#5ac6a0','#b0c040','#9a8ae0'],
  glassborn:['#d8f6ff','#ffd8f0','#d8ffe8','#e8e0ff']
};
function ensureLook(c){
  if(c.look) return c.look;
  const r = srng(hashStr(c.id || c.name || 'x'));
  const g = c.gender || (r() < .5 ? 'f' : 'm'); c.gender = g;
  const pickR = a => a[Math.floor(r()*a.length)];
  c.look = { g, skin:pickR(SKIN_TONES), hair:pickR(HAIR_COLS), style: g==='f' ? pickR(HAIR_F) : pickR(HAIR_M), morph:pickR(MORPHS[c.race] || ['#ffffff']), acc:r(), v:r() };
  return c.look;
}
function pronouns(c){ ensureLook(c); return c.gender==='f' ? 'she/her' : 'he/him'; }

/* ---------------- drawing helpers (logical units, origin at the feet, y up negative) ---------------- */
const OUT = 'rgba(8,10,20,.75)';
function grad(g, x0, y0, x1, y1, c0, c1){ const gr = g.createLinearGradient(x0,y0,x1,y1); gr.addColorStop(0,c0); gr.addColorStop(1,c1); return gr; }
function fillOut(g, fill, lw=1.1, stroke=OUT){ g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
function rrect(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function ell(g, x, y, rx, ry, rot=0){ g.beginPath(); g.ellipse(x, y, Math.max(.1,rx), Math.max(.1,ry), rot, 0, 7); }
function limb(g, x0, y0, x1, y1, w, col, stroke=OUT){ g.lineCap = 'round'; g.strokeStyle = stroke; g.lineWidth = w + 2.2; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); }
function poseInfo(pose){ const walk = pose==='walk0' ? 1 : pose==='walk1' ? -1 : 0; return { walk, work:pose==='work', fight:pose==='fight0' || pose==='fight1', strike:pose==='fight1' }; }

function drawHuman(g, L, pose, hostile){
  const p = poseInfo(pose), female = L.g==='f';
  const uni = hostile ? '#7a2233' : '#2c4a86', uniD = hostile ? '#4a1420' : '#1a2c55', trim = hostile ? '#ff9aa8' : '#ffb547';
  // legs
  limb(g, -3.2, -16, -3.2 - p.walk*3.5, -1.5, 4.6, uniD); limb(g, 3.2, -16, 3.2 + p.walk*3.5, -1.5, 4.6, uniD);
  rrect(g, -6.4 - p.walk*3.5, -3, 6, 3.4, 1.5); fillOut(g, '#15161c'); rrect(g, .4 + p.walk*3.5, -3, 6, 3.4, 1.5); fillOut(g, '#15161c');
  // back arm
  const ba = p.fight ? [-4,-27,-9,-33] : p.walk ? [-6,-27,-7 + p.walk*3,-17] : [-6,-27,-7,-17];
  limb(g, ba[0], ba[1], ba[2], ba[3], 3.8, uniD);
  // torso
  const sw = female ? 6.2 : 7.4, ww = female ? 4.6 : 6.2;
  g.beginPath(); g.moveTo(-sw, -30); g.quadraticCurveTo(0, -32, sw, -30); g.lineTo(ww, -16); g.lineTo(-ww, -16); g.closePath(); fillOut(g, grad(g, -sw, -30, sw, -16, uni, uniD));
  g.fillStyle = trim; g.fillRect(-sw+1.5, -29.5, sw*2-3, 1.6); g.fillRect(-ww, -18.3, ww*2, 1.8);
  g.fillStyle = '#ffd88a'; ell(g, -3, -26, 1.2, 1.2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .8; g.beginPath(); g.moveTo(0,-29); g.lineTo(0,-18.5); g.stroke();
  // front arm
  let fa = [6,-27,7,-17];
  if(p.work) fa = [6,-27,13,-22]; else if(p.fight) fa = p.strike ? [6,-27,15,-27] : [6,-27,9,-33]; else if(p.walk) fa = [6,-27,7 - p.walk*3,-17];
  limb(g, fa[0], fa[1], fa[2], fa[3], 3.8, uni); ell(g, fa[2], fa[3], 1.9, 1.9); fillOut(g, L.skin, .8);
  if(p.work){ g.strokeStyle = '#c8ccd8'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(fa[2], fa[3]); g.lineTo(fa[2] + 4, fa[3] - 3.5); g.stroke(); }
  // neck & head
  g.fillStyle = L.skin; g.fillRect(-1.6, -33, 3.2, 3);
  const hy = -38.5;
  // long hair behind
  if(female && ['long','braid','ponytail','curly'].includes(L.style)){ g.beginPath(); g.moveTo(-5.6, hy-1); g.quadraticCurveTo(-7.2, hy+8, L.style==='long' ? -4 : -2, hy + (L.style==='long' ? 11 : 6)); g.lineTo(4, hy + (L.style==='long' ? 11 : 4)); g.quadraticCurveTo(7, hy+6, 5.6, hy-1); g.closePath(); fillOut(g, L.hair, .9); }
  ell(g, 0, hy, 5.4, 5.9); fillOut(g, grad(g, -5, hy-6, 5, hy+6, shade(L.skin,.12), shade(L.skin,-.18)), 1);
  ell(g, 4.9, hy + .8, 1.1, 1.6); fillOut(g, L.skin, .7);
  // face (looking right)
  g.fillStyle = '#1a1420'; ell(g, 2.6, hy - .2, .8, 1.05); g.fill(); ell(g, -.4, hy - .2, .8, 1.05); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(2.7, hy - .9, .5, .5);
  g.strokeStyle = shade(L.skin,-.45); g.lineWidth = .7; g.beginPath(); g.moveTo(.4, hy + 3); g.quadraticCurveTo(1.6, hy + 3.7, 2.8, hy + 3); g.stroke();
  if(female){ g.fillStyle = 'rgba(200,90,110,.35)'; ell(g, 3.4, hy + 1.6, 1.1, .7); g.fill(); }
  // hair styles
  g.fillStyle = L.hair; g.strokeStyle = OUT; g.lineWidth = .9;
  const cap = (h, ext=0) => { g.beginPath(); g.ellipse(0, hy - 1.2, 5.8 + ext, h, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); };
  switch(L.style){
    case 'bald': g.fillStyle = 'rgba(255,255,255,.25)'; ell(g, -1.5, hy - 4, 2, 1); g.fill(); break;
    case 'crop': cap(4.2); break;
    case 'short': cap(5.2); g.beginPath(); g.moveTo(-5.8, hy - 1); g.lineTo(-5.4, hy + 3); g.lineTo(-3.8, hy - 1); g.fill(); break;
    case 'swept': cap(5.4, .6); g.beginPath(); g.moveTo(-3, hy - 6.5); g.quadraticCurveTo(5, hy - 9, 7, hy - 3); g.lineTo(2, hy - 4); g.fill(); g.stroke(); break;
    case 'mohawk': g.beginPath(); g.moveTo(-4, hy - 4); g.quadraticCurveTo(0, hy - 13, 4, hy - 4); g.closePath(); g.fill(); g.stroke(); break;
    case 'curly': for(let i=0;i<7;i++){ ell(g, -5 + i*1.7, hy - 4.5 - Math.sin(i)*1.2, 2.2, 2.2); g.fill(); } break;
    case 'beardshort': cap(4.6); g.beginPath(); g.moveTo(-1, hy + 1.5); g.quadraticCurveTo(2, hy + 7.2, 5, hy + 1.5); g.lineTo(4, hy + 4); g.closePath(); g.fill(); break;
    case 'bob': cap(5.6, .4); g.fillRect(-6.2, hy - 1, 2.4, 6); g.fillRect(4.4, hy - 1, 1.6, 3); break;
    case 'bun': cap(5.2); ell(g, -3.5, hy - 6.5, 2.8, 2.8); g.fill(); g.stroke(); break;
    case 'ponytail': cap(5.4); g.beginPath(); g.moveTo(-5, hy - 3); g.quadraticCurveTo(-11, hy + 1, -8, hy + 9); g.lineTo(-6, hy + 2); g.closePath(); g.fill(); g.stroke(); break;
    case 'braid': cap(5.4); for(let i=0;i<4;i++){ ell(g, -6, hy + 1 + i*2.6, 1.6, 1.4); g.fill(); g.stroke(); } break;
    case 'pixie': cap(5); g.beginPath(); g.moveTo(-5.6, hy - 1.5); g.lineTo(2, hy - 5.5); g.lineTo(5.8, hy - 2); g.lineTo(5.6, hy - 6); g.lineTo(-4, hy - 7); g.closePath(); g.fill(); break;
    case 'long': cap(5.6, .4); break;
  }
  if(L.acc > .7 && !hostile){ g.strokeStyle = '#5fd3e6'; g.lineWidth = 1; g.beginPath(); g.moveTo(5.2, hy); g.lineTo(5.2, hy + 3); g.lineTo(3.4, hy + 3.6); g.stroke(); }
}
function drawPebble(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph, female = L.g==='f';
  limb(g, -5, -10, -5 - p.walk*2.5, -1.5, 6.5, shade(col,-.35)); limb(g, 5, -10, 5 + p.walk*2.5, -1.5, 6.5, shade(col,-.35));
  const back = p.fight ? [-9,-26,-13,-34] : [-9,-26,-12,-13]; limb(g, back[0], back[1], back[2], back[3], 6, shade(col,-.3)); ell(g, back[2], back[3], 3.4, 3.2); fillOut(g, shade(col,-.25));
  g.beginPath(); g.moveTo(-11,-28); g.lineTo(-8,-36); g.lineTo(5,-38); g.lineTo(12,-30); g.lineTo(11,-15); g.lineTo(6,-9); g.lineTo(-7,-9); g.lineTo(-12,-16); g.closePath();
  fillOut(g, grad(g, -10, -38, 10, -9, shade(col,.15), shade(col,-.35)), 1.3);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(-8,-35); g.lineTo(4,-37); g.lineTo(-1,-27); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(11,-15); g.lineTo(6,-9); g.lineTo(2,-18); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-6,-30); g.lineTo(-2,-24); g.lineTo(-4,-17); g.moveTo(5,-32); g.lineTo(7,-25); g.stroke();
  g.fillStyle = '#5a7a3a'; for(let i=0;i<3;i++){ ell(g, -6 + i*5 + L.v*3, -11 - (i%2)*2, 1.4, .9); g.fill(); }
  if(female){ for(const [x,y,h] of [[-8,-36,5],[-5,-37.5,7],[-2,-38,4]]){ g.beginPath(); g.moveTo(x-1.5,y); g.lineTo(x,y-h); g.lineTo(x+1.5,y); g.closePath(); fillOut(g, L.acc>.5 ? '#ff9de2' : '#7fe8ff', .7); } }
  ell(g, 6, -38, 5.2, 4.2); fillOut(g, grad(g, 1, -42, 10, -34, shade(col,.1), shade(col,-.3)));
  g.fillStyle = shade(col,-.45); g.fillRect(2.5, -40.5, 8, 1.6);
  g.fillStyle = hostile ? '#ff5a7a' : '#ffd166'; ell(g, 6, -38.3, 1, .8); g.fill(); ell(g, 9, -38.3, 1, .8); g.fill();
  const fr = p.work ? [10,-25,17,-22] : p.fight ? (p.strike ? [10,-25,19,-26] : [10,-25,12,-36]) : [10,-25,12,-13];
  limb(g, fr[0], fr[1], fr[2], fr[3], 6, shade(col,-.1)); ell(g, fr[2], fr[3], 3.6, 3.4); fillOut(g, shade(col,-.05));
}
function drawEnjinn(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph, female = L.g==='f', t = (p.walk||0);
  // smoky tail instead of legs
  const tg = g.createLinearGradient(0,-18,0,0); tg.addColorStop(0, hexA(col,.95)); tg.addColorStop(1, hexA(col,0));
  g.beginPath(); g.moveTo(-5,-18); g.quadraticCurveTo(-6 + t*2,-8, -1 + t*3, -1); g.quadraticCurveTo(1,-5, 2 + t, 0); g.quadraticCurveTo(5,-9, 5,-18); g.closePath(); g.fillStyle = tg; g.fill();
  g.globalAlpha = .5; ell(g, t*2.5, -2, 3, 1.6); g.fillStyle = hexA(col,.6); g.fill(); g.globalAlpha = 1;
  limb(g, -6,-28, p.fight ? -10 : -8, p.fight ? -33 : -19, 3.4, shade(col,-.2)); g.fillStyle = '#ffd166'; g.fillRect(-9.5, p.fight ? -31 : -22, 3, 1.5);
  g.beginPath(); g.moveTo(-6.4,-31); g.quadraticCurveTo(0,-33, 6.4,-31); g.lineTo(5,-17); g.lineTo(-5,-17); g.closePath(); fillOut(g, grad(g, -6, -31, 6, -17, shade(col,.1), shade(col,-.25)));
  g.beginPath(); g.moveTo(-6,-30); g.lineTo(-2.5,-30); g.lineTo(-1.5,-18); g.lineTo(-5,-18); g.closePath(); fillOut(g, hostile ? '#a83244' : '#e07a2c', .8); g.beginPath(); g.moveTo(6,-30); g.lineTo(2.5,-30); g.lineTo(1.5,-18); g.lineTo(5,-18); g.closePath(); fillOut(g, hostile ? '#a83244' : '#e07a2c', .8);
  g.fillStyle = '#5a4630'; g.fillRect(-5.5,-20,11,2.4); g.fillStyle = '#c8ccd8'; g.fillRect(-4,-21,1.4,3.6); g.fillRect(2.5,-21,1.4,3.6);
  const fa = p.work ? [6,-28,13,-24] : p.fight ? (p.strike ? [6,-28,14,-28] : [6,-28,9,-34]) : [6,-28,8,-19];
  limb(g, fa[0], fa[1], fa[2], fa[3], 3.4, col); g.fillStyle = '#ffd166'; g.fillRect(fa[2]-2, fa[3]-1, 3, 1.5);
  if(p.work || L.acc>.4){ g.strokeStyle = '#c8ccd8'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(fa[2], fa[3]); g.lineTo(fa[2]+3.5, fa[3]-4.5); g.stroke(); ell(g, fa[2]+3.8, fa[3]-5, 1.4, 1.4); g.stroke(); }
  const hy = -38;
  ell(g, 0, hy, 5.4, 5.6); fillOut(g, grad(g, -5, hy-6, 5, hy+6, shade(col,.18), shade(col,-.2)));
  g.beginPath(); g.moveTo(4.6, hy - 1); g.lineTo(8.5, hy - 4); g.lineTo(5, hy + 1.5); g.closePath(); fillOut(g, col, .8);
  g.fillStyle = '#10202a'; ell(g, 2.6, hy, .9, 1.1); g.fill(); ell(g, -.4, hy, .9, 1.1); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(2.7, hy - .7, .5, .5);
  rrect(g, -4.8, hy - 5.6, 9.6, 2.8, 1.2); fillOut(g, '#3a3f52', .8); g.fillStyle = '#7ff7ff'; ell(g, -1.8, hy - 4.2, 1.6, 1.1); g.fill(); ell(g, 2.4, hy - 4.2, 1.6, 1.1); g.fill();
  g.fillStyle = shade(col,-.35); ell(g, -1, hy - 7.2, 2.4, 2.2); g.fill();
  if(female){ g.beginPath(); g.moveTo(-1.5, hy - 8); g.quadraticCurveTo(-10, hy - 8, -8, hy + 6); g.lineTo(-6, hy + 5); g.quadraticCurveTo(-8, hy - 4, -0.5, hy - 6.5); g.closePath(); fillOut(g, L.acc>.5 ? '#2a3a7a' : '#1a1a2a', .8); g.fillStyle = '#ffd166'; g.fillRect(-3, hy - 8.8, 2.2, 1.6); }
  else { g.beginPath(); g.moveTo(1, hy + 4); g.quadraticCurveTo(3, hy + 9, 5, hy + 3.8); g.closePath(); fillOut(g, '#1a1a2a', .7); }
}
function drawVoltan(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph, female = L.g==='f';
  const aura = g.createRadialGradient(0,-24,2,0,-24,22); aura.addColorStop(0, hexA(col,.55)); aura.addColorStop(1, hexA(col,0)); g.fillStyle = aura; g.fillRect(-24,-48,48,48);
  const bob = p.walk ? 1.2 : 0;
  g.beginPath(); g.moveTo(0,-34 - bob); g.quadraticCurveTo(8,-30, 6,-18); g.quadraticCurveTo(3,-7, 0,-4); g.quadraticCurveTo(-3,-7, -6,-18); g.quadraticCurveTo(-8,-30, 0,-34 - bob); g.closePath();
  const bg = g.createLinearGradient(0,-34,0,-4); bg.addColorStop(0, hexA('#ffffff',.95)); bg.addColorStop(.4, hexA(col,.9)); bg.addColorStop(1, hexA(col,.15)); g.fillStyle = bg; g.fill(); g.strokeStyle = hexA(shade(col,-.3),.7); g.lineWidth = .9; g.stroke();
  g.strokeStyle = hexA('#ffffff',.65); g.lineWidth = .7; g.beginPath(); g.moveTo(0,-30); g.lineTo(0,-14); g.moveTo(0,-24); g.lineTo(3.5,-20); g.moveTo(0,-20); g.lineTo(-3.5,-16); g.stroke();
  const core = g.createRadialGradient(0,-23,0,0,-23,4); core.addColorStop(0,'#ffffff'); core.addColorStop(1, hexA(col,0)); g.fillStyle = core; ell(g, 0,-23,4,4); g.fill();
  const fa = p.work ? [5,-28,12,-24] : p.fight ? (p.strike ? [5,-28,14,-28] : [5,-28,9,-36]) : [5,-28,9,-18];
  limb(g, -5,-28, p.fight ? -9 : -9, p.fight ? -35 : -18, 2.6, hexA(col,.85), hexA(shade(col,-.3),.5)); limb(g, fa[0], fa[1], fa[2], fa[3], 2.6, hexA(col,.9), hexA(shade(col,-.3),.5));
  if(p.fight || p.work){ const sp = g.createRadialGradient(fa[2],fa[3],0,fa[2],fa[3],4); sp.addColorStop(0,'#ffffff'); sp.addColorStop(1,hexA(col,0)); g.fillStyle = sp; ell(g, fa[2], fa[3], 4, 4); g.fill(); }
  const hy = -39 - bob;
  ell(g, 0, hy, 5, 5.4); fillOut(g, grad(g, -4, hy-5, 4, hy+5, '#ffffff', col), .9, hexA(shade(col,-.3),.7));
  if(female){ g.beginPath(); g.moveTo(-3,hy-4); g.quadraticCurveTo(0,hy-13,3,hy-4); g.closePath(); fillOut(g, hexA(col,.8), .7, hexA('#ffffff',.6)); }
  else { for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*3,hy-3); g.lineTo(s*7,hy-9); g.lineTo(s*4.5,hy-2); g.closePath(); fillOut(g, hexA(col,.8), .7, hexA('#ffffff',.6)); } }
  g.fillStyle = hostile ? '#ff3050' : '#3a2a00'; ell(g, 2.6, hy, 1, .7); g.fill(); ell(g, -.4, hy, 1, .7); g.fill();
}
function drawSloog(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph, female = L.g==='f';
  const slide = p.walk*1.5;
  g.beginPath(); g.moveTo(-11 + slide, 0); g.quadraticCurveTo(-13, -4, -8, -6); g.quadraticCurveTo(-6, -22, -2, -30); g.quadraticCurveTo(3, -36, 7, -30); g.quadraticCurveTo(10, -18, 9, -6); g.quadraticCurveTo(13, -3, 12 + slide, 0); g.closePath();
  fillOut(g, grad(g, -10, -34, 10, 0, shade(col,.12), shade(col,-.35)), 1.2);
  g.fillStyle = hexA('#ffffff',.18); g.beginPath(); g.moveTo(-5,-26); g.quadraticCurveTo(-2,-33, 3,-31); g.quadraticCurveTo(-2,-28, -4,-19); g.closePath(); g.fill();
  g.fillStyle = hexA(shade(col,.35),.55); g.beginPath(); g.ellipse(4,-15,4,9,0,0,7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)'; for(let i=0;i<4;i++){ ell(g, -5 + (i%2)*3 + L.v*2, -12 - i*4, 1.2, .9); g.fill(); }
  if(L.acc > .5){ g.beginPath(); g.moveTo(1,-24); g.lineTo(-2,-26.5); g.lineTo(-2,-21.5); g.closePath(); g.moveTo(1,-24); g.lineTo(4,-26.5); g.lineTo(4,-21.5); g.closePath(); fillOut(g, hostile ? '#ff5a7a' : '#b04ad8', .6); }
  else { g.beginPath(); g.moveTo(-3,-25); g.quadraticCurveTo(1,-21, 6,-25); g.lineTo(5,-22); g.quadraticCurveTo(1,-19, -2,-22); g.closePath(); fillOut(g, hostile ? '#ff5a7a' : (female ? '#e07ab0' : '#4a6ad8'), .6); }
  const fa = p.work ? [8,-18,14,-16] : p.fight ? (p.strike ? [8,-18,15,-20] : [8,-18,10,-26]) : [8,-18,10,-12];
  limb(g, fa[0], fa[1], fa[2], fa[3], 2.4, shade(col,-.05));
  for(const [bx,tx,ty] of [[0,-2,-44],[4,5,-45]]){ g.strokeStyle = OUT; g.lineWidth = 3.4; g.beginPath(); g.moveTo(bx,-31); g.quadraticCurveTo(bx + (tx-bx)*.2, -38, tx, ty); g.stroke(); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
    ell(g, tx, ty, 2.6, 2.6); fillOut(g, '#f4f6ff', .8); g.fillStyle = hostile ? '#b01030' : '#151515'; ell(g, tx + 1, ty, 1.1, 1.3); g.fill(); }
  g.strokeStyle = shade(col,-.5); g.lineWidth = .9; g.beginPath(); g.moveTo(3,-28); g.quadraticCurveTo(5.5, female ? -26 : -26.5, 8,-28.5); g.stroke();
}
function drawMantlis(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph, female = L.g==='f';
  const dk = shade(col,-.35);
  limb(g, -3,-14, -6 - p.walk*3, 0, 2, dk); limb(g, 3,-14, 6 + p.walk*3, 0, 2, dk); limb(g, -1,-14, -2 + p.walk*2, -1, 1.8, dk); limb(g, 1,-14, 3 - p.walk*2, -1, 1.8, dk);
  ell(g, -4, -14, female ? 6.5 : 5.5, 4.2, -.3); fillOut(g, grad(g, -10, -18, 2, -10, col, dk));
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .7; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-7 + i*2.5, -17.5); g.lineTo(-8 + i*2.5, -10.5); g.stroke(); }
  g.beginPath(); g.moveTo(-3,-17); g.quadraticCurveTo(-1,-28, 1,-31); g.lineTo(4,-29); g.quadraticCurveTo(3,-22, 2,-15); g.closePath(); fillOut(g, grad(g, -2, -31, 3, -15, shade(col,.15), dk));
  const sc = p.fight ? (p.strike ? [[2,-27,10,-30,17,-26]] : [[2,-27,8,-36,6,-42]]) : p.work ? [[2,-27,9,-24,12,-20]] : [[2,-27,7,-22,4,-30]];
  for(const [x0,y0,x1,y1,x2,y2] of sc){ limb(g, x0,y0,x1,y1, 2.6, col); g.strokeStyle = OUT; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); g.strokeStyle = shade(col,.2); g.lineWidth = 1.8; g.stroke();
    g.fillStyle = shade(col,.3); g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2 + (x2-x1)*.25 + 1.5, y2 + (y2-y1)*.25); g.lineTo(x2 - 1, y2 + 1); g.closePath(); g.fill(); }
  limb(g, 0,-27, -3, p.fight ? -33 : -20, 2.2, dk);
  const hy = -35;
  g.beginPath(); g.moveTo(-3.5, hy - 3); g.lineTo(6.5, hy - 3); g.lineTo(2, hy + 5.5); g.closePath(); fillOut(g, grad(g, -3, hy - 3, 6, hy + 5, shade(col,.2), col));
  for(const ex of [-2.4, 5]){ ell(g, ex, hy - 2.2, 2.2, 2.8, ex<0 ? .5 : -.5); const eg = g.createRadialGradient(ex - .6, hy - 3, 0, ex, hy - 2.2, 2.8); eg.addColorStop(0, hostile ? '#ff8aa0' : '#bfffd0'); eg.addColorStop(.3, hostile ? '#701020' : '#103020'); eg.addColorStop(1, '#050805'); g.fillStyle = eg; g.fill(); }
  g.strokeStyle = dk; g.lineWidth = .9; g.beginPath(); g.moveTo(1.2, hy + 4.8); g.lineTo(.2, hy + 6.5); g.moveTo(2.8, hy + 4.8); g.lineTo(3.8, hy + 6.5); g.stroke();
  g.strokeStyle = col; g.lineWidth = .9; g.beginPath(); g.moveTo(0, hy - 3); g.quadraticCurveTo(-3, hy - 10, -6, hy - (female ? 9 : 12)); g.moveTo(3, hy - 3); g.quadraticCurveTo(5, hy - 10, 9, hy - (female ? 9 : 12)); g.stroke();
  if(female){ g.fillStyle = shade(col,.35); ell(g, -6, hy - 9, 1, 1); g.fill(); ell(g, 9, hy - 9, 1, 1); g.fill(); }
}
function drawGlass(g, L, pose, hostile){
  const p = poseInfo(pose), col = L.morph;
  limb(g, -3,-14, -3 - p.walk*3, -1, 3.6, hexA(col,.9), 'rgba(80,140,170,.8)'); limb(g, 3,-14, 3 + p.walk*3, -1, 3.6, hexA(col,.9), 'rgba(80,140,170,.8)');
  g.beginPath(); g.moveTo(0,-34); g.lineTo(7,-28); g.lineTo(5,-14); g.lineTo(-5,-14); g.lineTo(-7,-28); g.closePath(); fillOut(g, grad(g, -7, -34, 7, -14, '#ffffff', hexA(col,.85)), 1, 'rgba(80,140,170,.85)');
  g.strokeStyle = 'rgba(120,180,210,.7)'; g.lineWidth = .7; g.beginPath(); g.moveTo(0,-34); g.lineTo(0,-14); g.moveTo(-7,-28); g.lineTo(5,-14); g.moveTo(7,-28); g.lineTo(-5,-14); g.stroke();
  const core = g.createRadialGradient(0,-24,0,0,-24,5); core.addColorStop(0, hostile ? '#ff9aa8' : '#bff4ff'); core.addColorStop(1, 'rgba(191,244,255,0)'); g.fillStyle = core; ell(g, 0, -24, 5, 5); g.fill();
  const fa = p.work ? [6,-28,13,-24] : p.fight ? (p.strike ? [6,-28,15,-28] : [6,-28,9,-36]) : [6,-28,8,-17];
  limb(g, -6,-28, -8, p.fight ? -35 : -17, 3, hexA(col,.9), 'rgba(80,140,170,.8)'); limb(g, fa[0], fa[1], fa[2], fa[3], 3, hexA(col,.9), 'rgba(80,140,170,.8)');
  const hy = -39; g.beginPath(); g.moveTo(0, hy - 6); g.lineTo(5, hy - 1); g.lineTo(3, hy + 5); g.lineTo(-3, hy + 5); g.lineTo(-5, hy - 1); g.closePath(); fillOut(g, grad(g, -5, hy - 6, 5, hy + 5, '#ffffff', col), 1, 'rgba(80,140,170,.85)');
  g.fillStyle = hostile ? '#ff3050' : '#2a8ab0'; g.fillRect(.5, hy - 1, 3.5, 1.4);
  if(L.g==='f'){ g.beginPath(); g.moveTo(-2, hy - 5); g.lineTo(-1, hy - 12); g.lineTo(1, hy - 5.5); g.closePath(); fillOut(g, hexA(col,.85), .7, 'rgba(80,140,170,.85)'); }
}
function drawDroneBot(g, L, pose, hostile, id){
  const role = DATA?.drones?.[id]?.role || (DATA?.drones?.[id]?.kind==='boarding' ? 'board' : 'fight');
  const accent = hostile ? '#ff5a7a' : role==='repair' ? '#7be0a0' : '#f0a6ff';
  const p = poseInfo(pose); const hover = -6 + (p.walk ? 1 : 0);
  g.fillStyle = 'rgba(0,0,0,.25)'; ell(g, 0, -1, 8, 2); g.fill();
  g.globalAlpha = .6; const jet = g.createLinearGradient(0, hover, 0, 0); jet.addColorStop(0, hexA(accent,.8)); jet.addColorStop(1, hexA(accent,0)); g.fillStyle = jet; g.fillRect(-3, hover, 6, -hover); g.globalAlpha = 1;
  if(role==='board'){ rrect(g, -9, hover - 18, 18, 16, 4); fillOut(g, grad(g, 0, hover - 18, 0, hover - 2, '#5a6080', '#262a40')); for(const s of [-1,1]){ limb(g, s*8, hover - 8, s*13, hover - 2 - (p.fight ? 6 : 0), 2.6, '#8a90b0'); } }
  else { ell(g, 0, hover - 12, 8, 7); fillOut(g, grad(g, -8, hover - 19, 8, hover - 5, '#6a7090', '#2a2e48'));
    if(role==='repair'){ limb(g, 6, hover - 11, 12, hover - (p.work ? 14 : 8), 2, '#a8b0c8'); g.strokeStyle = '#c8ccd8'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(12, hover - (p.work ? 14 : 8)); g.lineTo(15, hover - (p.work ? 17 : 11)); g.stroke(); }
    else { for(let i=0;i<4;i++){ const a = -1.2 + i*.8; g.beginPath(); g.moveTo(Math.cos(a)*8, hover - 12 + Math.sin(a)*7); g.lineTo(Math.cos(a)*11, hover - 12 + Math.sin(a)*10); g.strokeStyle = '#a8b0c8'; g.lineWidth = 1.6; g.stroke(); } } }
  const eg = g.createRadialGradient(3, hover - 12, 0, 3, hover - 12, 3.4); eg.addColorStop(0, '#ffffff'); eg.addColorStop(.4, accent); eg.addColorStop(1, hexA(accent,0)); g.fillStyle = eg; ell(g, 3, hover - 12, 3.4, 3.4); g.fill();
}

/* ---------------- cache & public API ---------------- */
const SPRITES = {};
const SPR_W = 48, SPR_H = 66, SPR_S = 2.5;
function spriteFor(c, pose, hostile){
  const L = ensureLook(c); const race = c.drone ? 'drone' : (DATA.races[c.race] ? c.race : 'human');
  const key = [race, c.drone||'', L.g, L.skin, L.hair, L.style, L.morph, (L.acc*10)|0, (L.v*10)|0, pose, hostile?1:0].join('|');
  if(SPRITES[key]) return SPRITES[key];
  const cv_ = mkCanvas(SPR_W*SPR_S, SPR_H*SPR_S), g = cv_.getContext('2d');
  g.scale(SPR_S, SPR_S); g.translate(SPR_W/2 - 2, SPR_H - 3); g.lineJoin = 'round';
  switch(race){
    case 'pebblekin': drawPebble(g, L, pose, hostile); break;
    case 'enjinn': drawEnjinn(g, L, pose, hostile); break;
    case 'voltan': drawVoltan(g, L, pose, hostile); break;
    case 'sloog': drawSloog(g, L, pose, hostile); break;
    case 'mantlis': drawMantlis(g, L, pose, hostile); break;
    case 'glassborn': drawGlass(g, L, pose, hostile); break;
    case 'drone': drawDroneBot(g, L, pose, hostile, c.drone); break;
    default: drawHuman(g, L, pose, hostile);
  }
  return SPRITES[key] = cv_;
}
function crewPose(c, sh){
  const t = G?.time || 0;
  if(c.path && c.path.length) return (Math.floor(t*7 + (c.id?.charCodeAt?.(0)||0)) % 2) ? 'walk0' : 'walk1';
  if(!sh) return 'idle';
  const room = sh.rooms[c.room]; if(!room) return 'idle';
  const fighting = sh.crew.some(o => o.room===c.room && crewSide(o)!==crewSide(c));
  if(fighting && crewDps(c) > 0) return (Math.floor(t*5 + (c.id?.charCodeAt?.(1)||0)) % 2) ? 'fight0' : 'fight1';
  if(crewSide(c)===sh.side && (room.fire>0 || room.breach>0 || (room.sys && sh.systems[room.sys]?.dmg>0))) return 'work';
  if(crewSide(c)!==sh.side && room.sys && sh.systems[room.sys] && sh.systems[room.sys].dmg < sh.systems[room.sys].max) return (Math.floor(t*4) % 2) ? 'fight0' : 'fight1';
  return 'idle';
}
/* draws a crew member with feet at (x, y + r) — replaces the old dot sprites */
function drawCrewSprite(x, y, r, c, o={}){
  const sh = o.ship || null; const pose = o.pose || crewPose(c, sh);
  const img = spriteFor(c, pose, !!o.hostile);
  const hgt = r*3.4, wid = hgt*SPR_W/SPR_H, fy = y + r*1.0;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, fy, r*.85, r*.25, 0, 0, 7); ctx.fill();
  if(o.hostile && !c.drone){ ctx.save(); ctx.globalAlpha *= .55; glow(x, fy - hgt*.45, r*1.6, '#ff3050', .5); ctx.restore(); }
  ctx.save(); ctx.translate(x, fy); if(o.face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -wid/2, -hgt + hgt*3/SPR_H, wid, hgt); ctx.restore();
  if(pose==='work' && G && !G.paused && !G.modal && Math.random() < .08) sparks(x + (o.face<0 ? -1 : 1)*r*.9, fy - hgt*.4, '#ffd27a', 2);
  if(c.mcT>0){ ctx.save(); ctx.strokeStyle = C.violet; ctx.lineWidth = 1.5; ctx.beginPath(); const tt = (G?.time||0)*4; for(let i=0;i<3;i++){ ctx.moveTo(x - r*.6 + i*r*.6, fy - hgt - 2); ctx.arc(x - r*.6 + i*r*.6, fy - hgt - 4, 2, tt + i, tt + i + 4); } ctx.stroke(); ctx.restore(); }
}
/* head-and-shoulders portrait inside a circle */
function drawPortrait(x, y, rad, c, hostile){
  const img = spriteFor(c, 'idle', !!hostile);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.clip();
  const bg = ctx.createRadialGradient(x, y - rad*.3, 1, x, y, rad); bg.addColorStop(0, '#2a3a66'); bg.addColorStop(1, '#0c1226'); ctx.fillStyle = bg; ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
  const k = rad/34, hx = (SPR_W/2 - 1)*SPR_S, hy = (SPR_H - 3 - 37)*SPR_S;
  ctx.drawImage(img, x - hx*k, y - rad*.18 - hy*k, SPR_W*SPR_S*k, SPR_H*SPR_S*k);
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.strokeStyle = hostile ? C.hostile : hexA(C.amber,.8); ctx.lineWidth = 2; ctx.stroke();
}
