'use strict';
/* =========================================================================
   Interface: everything is drawn on one 1600x1000 canvas so it works the
   same on a flat screen and on the floating VR console.
   ========================================================================= */
const W = 1600, H = 1000;
const cv = document.getElementById('game');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const FD = "'Chakra Petch','Segoe UI',system-ui,sans-serif", FM = "'IBM Plex Mono',ui-monospace,Menlo,monospace";

/* ---------------- primitives ---------------- */
let HR = [];
const PTR = [{ x:-1, y:-1, on:false }, { x:-1, y:-1, on:false, xr:true }, { x:-1, y:-1, on:false, xr:true }];
function hovered(x,y,w,h){ return PTR.some(p => p.on && p.x>=x && p.x<=x+w && p.y>=y && p.y<=y+h); }
let VRTXT = false;   // set each frame: larger minimum text while in VR
function region(x,y,w,h,cb){ HR.push({ x,y,w,h,cb }); }
function rr(x,y,w,h,r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h); }
function T(t,x,y,o={}){ let fs_ = o.s||22; if(VRTXT && fs_ < 15) fs_ = fs_ < 12 ? fs_ + 3 : 15; ctx.font = `${o.w||400} ${fs_}px ${o.f||FM}`; ctx.fillStyle = o.c||C.ink; ctx.textAlign = o.a||'left'; ctx.textBaseline = o.b||'alphabetic';
  if('letterSpacing' in ctx) ctx.letterSpacing = (o.ls||0)+'px'; if(o.max) ctx.fillText(t,x,y,o.max); else ctx.fillText(t,x,y); if('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }
function label(t,x,y,c=C.muted,a='left',s=16){ T(String(t).toUpperCase(),x,y,{ s, f:FD, w:600, c, ls:2, a }); }
function lines(text, maxW, font){ ctx.font = font; const out = [];
  for(const para of String(text).split('\n')){ let line = ''; for(const word of para.split(' ')){ const t = line ? line+' '+word : word; if(ctx.measureText(t).width > maxW && line){ out.push(line); line = word; } else line = t; } out.push(line); }
  return out; }
function para(text,x,y,maxW,o={}){ const s = o.s||22, lh = o.lh||Math.round(s*1.45), font = `${o.w||400} ${s}px ${o.f||FM}`; let ls = lines(text,maxW,font);
  if(o.max && ls.length>o.max){ ls = ls.slice(0,o.max); ls[ls.length-1] += '…'; }
  ls.forEach((l,i)=>T(l,x,y+i*lh,{ s, f:o.f||FM, w:o.w||400, c:o.c||C.ink, a:o.a||'left' })); return ls.length*lh; }
function btn(x,y,w,h,text,cb,o={}){
  const dis = !!o.disabled, hov = !dis && hovered(x,y,w,h), col = o.col||C.amber;
  rr(x,y,w,h,6);
  if(o.fill){ const g = ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0, dis ? '#2a3350' : shade(col,.15)); g.addColorStop(1, dis ? '#1c2440' : shade(col,-.2)); ctx.fillStyle = g; }
  else { const g = ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0, hov ? hexA(col,.28) : '#1a2342'); g.addColorStop(1, hov ? hexA(col,.12) : '#10162b'); ctx.fillStyle = g; }
  ctx.fill(); if(o.fill && hov){ ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill(); }
  ctx.lineWidth = hov ? 3 : 2; ctx.strokeStyle = dis ? C.line : col; ctx.stroke();
  if(!dis){ ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x+6, y+2.5); ctx.lineTo(x+w-6, y+2.5); ctx.stroke(); }
  if(hov && !o.fill) glow(x+w/2, y+h/2, Math.max(w,h)*.55, col, .12);
  T(text, x+w/2, y+h/2+1, { a:'center', b:'middle', s:o.s||20, f:FD, w:600, c: dis ? C.muted : (o.fill ? C.void : col), ls:1 });
  if(!dis && cb) region(x,y,w,h,cb);
}

function panel(x,y,w,h,r=10){ rr(x,y,w,h,r); const g = ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'rgba(22,30,56,.96)'); g.addColorStop(1,'rgba(10,14,28,.96)'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.line; ctx.stroke(); corners(x,y,w,h); }

function bar(x,y,w,h,frac,col,bg=C.panel2){ rr(x,y,w,h,3); ctx.fillStyle = bg; ctx.fill(); if(frac>0){ rr(x,y,Math.max(3,w*clamp(frac,0,1)),h,3); ctx.fillStyle = col; ctx.fill(); } }
function tabs(x,y,list,cur,set,w=150){ list.forEach((t,i)=>btn(x+i*(w+8), y, w, 44, t[1], ()=>set(t[0]), { fill:cur===t[0], s:16 })); }

/* ---------------- stars ---------------- */
const STARS = Array.from({length:240}, () => ({ x:Math.random()*W, y:Math.random()*H, z:rand(.2,1) }));
function drawWarp2D(){
  const w = warpAmt(), t = performance.now()/1000, cx = W/2, cy = 330, q = { low:.4, medium:.7, high:1, ultra:1.4 }[SET.gfx||'high'] || 1;
  if(!UI._streaks){ UI._streaks = Array.from({ length:220 }, () => ({ a:Math.random()*Math.PI*2, r:Math.random(), s:.4 + Math.random()*1.4, h:Math.random()<.5 ? 200 : 265 })); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const n = Math.round(UI._streaks.length*q);
  for(let i=0;i<n;i++){ const st = UI._streaks[i]; const r0 = ((st.r + t*st.s*(.3 + w*2.5)) % 1); const R0 = 40 + r0*r0*1100, R1 = R0 + 20 + w*w*520*st.s;
    ctx.strokeStyle = `hsla(${st.h},90%,${70 + 25*w}%,${Math.min(1, w*1.8)*(.25 + r0*.75)})`; ctx.lineWidth = .8 + r0*2.6*w;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(st.a)*R0, cy + Math.sin(st.a)*R0*.62); ctx.lineTo(cx + Math.cos(st.a)*R1, cy + Math.sin(st.a)*R1*.62); ctx.stroke(); }
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300 + w*500); core.addColorStop(0, `rgba(220,240,255,${w*.55})`); core.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = core; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const white = SET.reduceFlashes ? Math.max(0, w-.6)*.8 : Math.max(0, w-.4)*1.6; if(white>0){ ctx.fillStyle = `rgba(240,248,255,${Math.min(.95, white)})`; ctx.fillRect(0,0,W,H); }
}
function warpAmt(){ return G && UI.screen==='game' && G.warp>0 ? (1-Math.abs(G.warp-.5)*2) : 0; }
function updateStars(dt){ const sp = 6 + warpAmt()*2600; for(const s of STARS){ s.x -= s.z*sp*dt; if(s.x<0){ s.x += W; s.y = Math.random()*H; } } }
function drawStars(){ const warp = warpAmt();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(const s of STARS){ ctx.fillStyle = `rgba(223,230,245,${.15 + s.z*.5})`;
    if(warp>.05) ctx.fillRect(s.x, s.y, 4 + s.z*warp*260, 1.6); else ctx.fillRect(s.x, s.y, s.z*1.8, s.z*1.8); }
  ctx.restore(); }

function corners(x,y,w,h,col=hexA(C.amber,.4),s=9){ ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(x,y+s); ctx.lineTo(x,y); ctx.lineTo(x+s,y); ctx.moveTo(x+w-s,y); ctx.lineTo(x+w,y); ctx.lineTo(x+w,y+s);
  ctx.moveTo(x+w,y+h-s); ctx.lineTo(x+w,y+h); ctx.lineTo(x+w-s,y+h); ctx.moveTo(x+s,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x,y+h-s); ctx.stroke(); }
let TIPS = [], TIP_MODAL = false;
function tip(x,y,w,h,title,body){ TIPS.push({ x,y,w,h,title,body, modal:TIP_MODAL }); }
function drawTip(){
  const p = PTR.find(q => q.on); if(!p) return;
  for(let i=TIPS.length-1;i>=0;i--){ const t = TIPS[i]; if(UI.screen==='game' && G && G.modal && !t.modal) continue;
    if(p.x>=t.x && p.x<=t.x+t.w && p.y>=t.y && p.y<=t.y+t.h){
      const ls = lines(t.body||'', 360, `400 15px ${FM}`); const w = 400, h = 46 + ls.length*20; let x = p.x+20, y = p.y+20;
      if(x+w > W-8) x = p.x-w-20; if(y+h > H-8) y = p.y-h-20;
      panel(x,y,w,h,8); T(t.title, x+16, y+28, { s:17, f:FD, w:700, c:C.amber }); ls.forEach((l,k) => T(l, x+16, y+52+k*20, { s:15 })); return; } }
}
function typed(m, text){ if(!m || m.skip) return text; if(!m.t0) m.t0 = performance.now(); const n = Math.floor((performance.now() - m.t0)*.11); if(n >= text.length){ m.skip = true; return text; } return text.slice(0, n); }
function drawBubbles(){
  for(const bub of (G.chat||[])){
    if(bub.t<=0) continue; let x, y;
    if(bub.enemy){ const b = G.enemy?._b; if(!b) continue; x = (b.x0+b.x1)/2; y = b.y0 - 34; }
    else { let c = null; for(const s of [G.ship, G.enemy]) if(s) c = c || s.crew.find(q => q.id===bub.id); if(!c || c._sx==null) continue; x = c._sx; y = c._sy - 30; }
    const a = Math.min(1, bub.t*2); ctx.globalAlpha = a; ctx.font = `600 15px ${FD}`; const w = Math.min(320, ctx.measureText(bub.text).width + 22), h = 28;
    x = clamp(x, w/2+8, W-w/2-8); y = Math.max(90, y);
    rr(x-w/2, y-h, w, h, 8); ctx.fillStyle = bub.enemy ? 'rgba(60,16,28,.95)' : 'rgba(240,244,255,.95)'; ctx.fill(); ctx.strokeStyle = bub.enemy ? C.hostile : C.amber; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-6, y); ctx.lineTo(x, y+8); ctx.lineTo(x+6, y); ctx.closePath(); ctx.fillStyle = bub.enemy ? 'rgba(60,16,28,.95)' : 'rgba(240,244,255,.95)'; ctx.fill();
    T(bub.text, x, y-h/2+1, { s:15, f:FD, w:600, a:'center', b:'middle', c: bub.enemy ? '#ffd0d8' : '#141b31' }); ctx.globalAlpha = 1;
  }
}
/* ---------------- main draw ---------------- */
function draw(){
  HR = []; TIPS = []; TIP_MODAL = false; VRTXT = SET.vrBigText !== false && typeof inXR==='function' && inXR();
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawBG(); drawStars();
  switch(UI.screen){
    case 'title': drawTitle(); break;
    case 'select': drawHangar(); break;
    case 'mods': drawModsScreen(); break;
    case 'help': drawHelpScreen(); break;
    case 'settings': drawSettings(); break;
    case 'ach': drawAchievements(); break;
    case 'game': drawGame(); break;
    case 'over': case 'win': drawEnd(); break;
  }
  if(UI.toast){ const a = Math.min(1, UI.toast.t*2); ctx.globalAlpha = a; ctx.font = `600 22px ${FD}`; const tw = Math.min(W-40, ctx.measureText(UI.toast.text).width + 48);
    panel(W/2-tw/2, 84, tw, 50, 8); T(UI.toast.text, W/2, 110, { a:'center', b:'middle', s:22, f:FD, w:600, c:C.warn }); ctx.globalAlpha = 1; }
  if(UI.screen==='game') drawHint();
  drawTip();
  for(const p of PTR){ if(!p.xr || !p.on) continue; glow(p.x, p.y, 18, C.amber, .5); ctx.beginPath(); ctx.arc(p.x,p.y,13,0,7); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,7); ctx.fillStyle = C.amber; ctx.fill(); }
}

/* ---------------- title & menus ---------------- */
function drawTitle(){
  const t = performance.now()/1000;
  if(!UI._fly){ try{ if(!DATA) applyMods(); UI._fly = makeShip(DATA.ships.pestrel || Object.values(DATA.ships)[0], 'p', {}); UI._fly.crew = []; }catch(e){ UI._fly = null; } }
  if(UI._fly){ const px = ((t*55 + 1150) % 2700) - 950; drawShip(UI._fly, { x:px, y:610, w:430, h:190 }, 1, false, true); }
  label('A Fedoration courier roguelike', 110, 200, C.cyan, 'left', 20);
  glow(380, 300, 260, C.amber, .12);
  T('VASTER', 104, 320, { s:132, f:FD, w:700, c:C.amber, ls:10 });
  T('THAN LIFE', 108, 428, { s:96, f:FD, w:700, c:C.ink, ls:12 });
  para('Outrun the Rebuff Fleet across eight sectors and stop the Flaggship. Built for Meta Quest, playable on any screen.', 112, 486, 780, { s:21, c:C.muted });
  const hasSave = !!LS.get(SAVE_KEY, null);
  let y = 560; const bw = 330;
  if(hasSave){ btn(110, y, bw, 58, 'Continue run', () => { if(!loadSave()) toast('That save could not be loaded.'); }, { fill:true }); y += 70; }
  btn(110, y, bw, 58, 'New run', () => { applyMods(); UI.selShip = UI.selShip && DATA.ships[UI.selShip] ? UI.selShip : 'pestrel'; UI.shipName = null; UI._prev = null; UI.screen = 'select'; }, { fill:!hasSave }); y += 70;
  const on = MODS.filter(m=>m.enabled).length;
  btn(110, y, bw, 58, on ? `Mods (${on} on)` : 'Mods', () => { UI.screen = 'mods'; loadLibrary(); }); y += 70;
  btn(110, y, 160, 58, 'Manual', () => { UI.screen = 'help'; }, { s:18 });
  btn(280, y, 160, 58, 'Settings', () => { UI.screen = 'settings'; }, { s:18 }); y += 70;
  btn(110, y, bw, 58, `Achievements ${Object.keys(PROFILE.ach).length}/${ACHIEVEMENTS.length}`, () => { UI.screen = 'ach'; }, { s:18 });
  label('Quest: trigger selects · left stick walks · aim at floor to teleport · A/X pause · B/Y map · grip brings the console', 110, H-30, C.muted, 'left', 15);
}

function classGroups(){
  const groups = {}; for(const id in DATA.ships){ const s = DATA.ships[id]; const k = s.cls || s.name; (groups[k] = groups[k] || []).push(id); }
  for(const k in groups) groups[k].sort((a,b) => (DATA.ships[a].layout||'A').localeCompare(DATA.ships[b].layout||'A'));
  return groups;
}
function drawHangar(){
  label('Choose your ship', 60, 70, C.cyan, 'left', 18);
  T('Hangar', 60, 122, { s:50, f:FD, w:700 });
  const groups = classGroups(), names = Object.keys(groups);
  const per = 8; const pages = Math.max(1, Math.ceil(names.length/per)); UI.page = clamp(UI.page, 0, pages-1);
  const show = names.slice(UI.page*per, UI.page*per+per);
  const sel = DATA.ships[UI.selShip] ? UI.selShip : groups[names[0]][0];
  const selCls = DATA.ships[sel].cls || DATA.ships[sel].name;
  show.forEach((cls, i) => {
    const x = 60 + (i%4)*372, y = 150 + Math.floor(i/4)*112, w = 356, h = 100, ids = groups[cls], cur = cls===selCls;
    const anyOpen = ids.some(id => shipUnlocked(DATA.ships[id]));
    rr(x,y,w,h,10); ctx.fillStyle = cur ? hexA(C.amber,.1) : hexA(C.panel,.9); ctx.fill(); ctx.lineWidth = cur?3:1.5; ctx.strokeStyle = cur ? C.amber : hovered(x,y,w,h) ? C.muted : C.line; ctx.stroke();
    region(x,y,w,h,() => { const open = ids.find(id => shipUnlocked(DATA.ships[id])); UI.selShip = open || ids[0]; UI.shipName = null; });
    T(cls, x+18, y+38, { s:22, f:FD, w:700, c: anyOpen ? (DATA.ships[ids[0]].color||C.amber) : C.muted });
    T(ids.map(id => `${DATA.ships[id].layout||'A'}${shipUnlocked(DATA.ships[id])?'':' (locked)'}`).join('  ·  '), x+18, y+72, { s:16, c:C.muted });
  });
  if(pages>1){ btn(1300, 70, 110, 44, '‹', ()=>UI.page--, { disabled:UI.page<=0 }); btn(1420, 70, 110, 44, '›', ()=>UI.page++, { disabled:UI.page>=pages-1 }); }
  // detail
  const def = DATA.ships[sel], open = shipUnlocked(def);
  const y0 = 390; panel(60, y0, 1480, 470, 12);
  groups[selCls].forEach((id, i) => btn(84 + i*140, y0+22, 130, 44, `Layout ${DATA.ships[id].layout||'A'}`, () => { UI.selShip = id; UI.shipName = null; }, { fill:id===sel, s:16 }));
  T(UI.shipName || def.name, 84, y0+118, { s:36, f:FD, w:700, c:def.color||C.amber });
  if(open && !inXR()) btn(84 + Math.min(520, ctx.measureText(UI.shipName || def.name).width + 20), y0+86, 110, 40, 'Rename', () => openRename('ship'), { s:15 });
  para(def.desc||'', 84, y0+156, 640, { s:18, lh:26, c:C.muted });
  let temp = UI._prev && UI._prev.id===sel ? UI._prev.sh : null;
  if(!temp){ try{ temp = makeShip(def,'p',{}); }catch(e){ temp = null; } UI._prev = { id:sel, sh:temp }; }
  if(temp){
    drawShip(temp, { x:760, y:y0+70, w:760, h:240 }, 1, false, true);
    const rows = [ ['Hull', temp.maxHull], ['Reactor', temp.reactor], ['Weapons', temp.weapons.map(w=>DATA.weapons[w.id].name).join(', ')||'None'],
      ['Drones', temp.drones.map(d=>DATA.drones[d.id].name).join(', ')||'None'], ['Systems', Object.keys(temp.systems).filter(k=>!SUB.includes(k)).map(k=>SYSN[k]).join(', ')],
      ['Crew', temp.crew.map(c=>DATA.races[c.race].name).join(', ')], ['Augments', temp.augments.map(a=>DATA.augments[a]?.name).join(', ')||'None'] ];
    rows.forEach((r,k) => { label(r[0], 84, y0+232+k*30, C.muted, 'left', 13); para(String(r[1]), 210, y0+232+k*30, 520, { s:15, lh:18, max:1 }); });
  } else T('This ship has an error in its data.', 84, y0+260, { s:18, c:C.hostile });
  if(!open){ ctx.fillStyle = 'rgba(7,10,20,.55)'; rr(740, y0+60, 790, 260, 10); ctx.fill(); T('LOCKED', 1135, y0+170, { s:40, f:FD, w:700, a:'center', c:C.muted, ls:6 }); T(unlockText(def.unlock), 1135, y0+212, { s:18, a:'center', c:C.ink }); }
  label('Difficulty', 760, y0+360, C.muted, 'left', 14); if(PROFILE.runs < 3) T(SET.difficulty==='easy' ? 'Easy is recommended for your first runs.' : 'Tip: Easy is recommended for your first runs.', 1220, y0+360, { s:14, c:C.cyan, a:'right' });
  Object.keys(DIFFICULTY).forEach((k,i) => btn(760 + i*150, y0+376, 140, 48, DIFFICULTY[k].name, () => { SET.difficulty = k; saveProfile(); }, { fill:SET.difficulty===k, s:16 }));
  btn(1240, 890, 300, 70, 'Launch', () => { newRun(sel, UI.shipName); }, { fill:true, s:26, disabled:!open });
  btn(1060, 890, 160, 70, 'Back', () => { UI.screen = 'title'; });
}
function drawModsScreen(){
  label('User content', 60, 70, C.cyan, 'left', 18);
  T('Mods', 60, 122, { s:50, f:FD, w:700 });
  para('Mods are JSON files that add or replace ships, weapons, drones, augments, races, enemies, sectors and events. Turn them on or off here; changes apply when you start a new run.', 60, 160, 1000, { s:18, c:C.muted, lh:26 });
  const per = 6, pages = Math.max(1, Math.ceil(MODS.length/per)); UI.modsPage = clamp(UI.modsPage, 0, pages-1);
  if(!MODS.length) para('No mods installed yet. Install one from the library, or use "Add mod files" (on Quest, exit VR first so the file picker can open).', 60, 250, 900, { s:20 });
  MODS.slice(UI.modsPage*per, UI.modsPage*per+per).forEach((m,i) => {
    const y = 230 + i*80; panel(60, y, 960, 68, 8);
    T(m.name, 84, y+30, { s:22, f:FD, w:700, c: m.enabled ? C.ink : C.muted });
    T(`${m.version ? 'v'+m.version+' · ' : ''}${m.author ? m.author+' · ' : ''}${modSummary(m.data)}`.slice(0,70), 84, y+54, { s:14, c:C.muted });
    btn(740, y+12, 120, 44, m.enabled ? 'On' : 'Off', () => { m.enabled = !m.enabled; saveMods(); }, { fill:m.enabled, col:m.enabled?C.good:C.muted });
    btn(872, y+12, 130, 44, 'Remove', () => { MODS.splice(MODS.indexOf(m),1); saveMods(); if(typeof renderModList==='function') renderModList(); }, { col:C.hostile, s:16 });
  });
  if(pages>1){ btn(60, 720, 100, 44, '‹', ()=>UI.modsPage--, { disabled:UI.modsPage<=0 }); btn(170, 720, 100, 44, '›', ()=>UI.modsPage++, { disabled:UI.modsPage>=pages-1 }); }
  const lx = 1060; panel(lx, 230, 480, 560, 10);
  label('Mod library', lx+20, 266, C.amber, 'left', 17);
  if(LIBRARY.state==='loading') T('Loading…', lx+20, 310, { s:18, c:C.muted });
  else if(LIBRARY.state!=='ready' || !LIBRARY.mods.length) para('No library found. When the game is hosted with a mods/index.json file (as on GitHub Pages), mods listed there can be installed here, even in VR.', lx+20, 306, 440, { s:16, lh:23, c:C.muted });
  else LIBRARY.mods.slice(0,6).forEach((m,i) => { const y = 290 + i*82; const have = MODS.some(x=>x.name===m.name);
    T(m.name, lx+20, y+26, { s:19, f:FD, w:700 }); para(m.desc||'', lx+20, y+50, 300, { s:13, lh:17, c:C.muted, max:2 });
    btn(lx+340, y+6, 120, 44, have ? 'Reinstall' : 'Install', () => installLibraryMod(m), { s:15, fill:!have }); });
  btn(60, 820, 300, 64, 'Add mod files', () => { if(inXR()) toast('Exit VR to pick files, then come back in.'); else openModPanel(); }, { fill:true });
  btn(380, 820, 200, 64, 'Back', () => { UI.screen = 'title'; });
  if(MODS.some(m=>m.data?.script) && !SET.allowScripts) T('Some mods include scripts. Allow them in Settings to run them.', 600, 860, { s:16, c:C.warn });
}
function drawSettings(){
  label('Options', 60, 70, C.cyan, 'left', 18);
  T('Settings', 60, 122, { s:50, f:FD, w:700 });
  const tab = UI.setTab || 'audio';
  tabs(60, 146, [['audio','Audio'],['graphics','Graphics'],['vr','VR & comfort'],['gameplay','Gameplay'],['profile','Profile']], tab, t => { UI.setTab = t; UI.confirmReset = false; }, 200);
  panel(60, 204, 1480, 640, 12);
  const X = 100, VX = 560; let y = 236;
  const head = (t) => { label(t, X, y+18, C.cyan, 'left', 15); y += 34; };
  const note = (t) => { para(t, X, y+2, 1360, { s:15, lh:20, c:C.muted }); y += 30; };
  const choice = (name, key, opts, def, desc, after) => { T(name, X, y+30, { s:20 }); const cur = SET[key] ?? def;
    opts.forEach(([v,l],i) => btn(VX + i*168, y+4, 158, 42, l, () => { SET[key] = v; saveProfile(); if(after) after(v); }, { fill:cur===v, s:15 }));
    if(desc) tip(X-10, y, 440, 50, name, desc); y += 50; };
  const onoff = (name, key, def, desc, after) => choice(name, key, [[true,'On'],[false,'Off']], def, desc, after);
  const slider = (name, val, txt, dec, inc, desc) => { T(name, X, y+30, { s:20 }); btn(VX, y+4, 60, 42, '−', dec, { s:22 }); T(txt, VX+140, y+32, { s:20, f:FD, w:700, a:'center', c:C.amber }); btn(VX+220, y+4, 60, 42, '+', inc, { s:22 }); if(desc) tip(X-10, y, 440, 50, name, desc); y += 50; };
  const vol = (k) => [() => { SET[k] = clamp(+((SET[k]??.5)-.1).toFixed(1),0,1); applyVolumes(); saveProfile(); }, () => { SET[k] = clamp(+((SET[k]??.5)+.1).toFixed(1),0,1); applyVolumes(); saveProfile(); }];
  switch(tab){
    case 'audio':
      head('Volume');
      slider('Music', 0, `${Math.round(SET.music*100)}%`, ...vol('music'), 'Adaptive soundtrack: calm themes per sector, a combat layer in fights and a heavier boss arrangement.');
      slider('Sound effects', 0, `${Math.round(SET.sfx*100)}%`, ...vol('sfx'), 'Weapons, impacts, doors, alarms, UI.');
      slider('Ship ambience', 0, `${Math.round((SET.amb ?? .5)*100)}%`, ...vol('amb'), 'Engine hum, fire crackle, breach hiss, low-hull warnings.');
      btn(X, y+10, 220, 46, 'Test sounds', () => { ensureAudio(); ['laser','ion','missile','shield','hit','explode'].forEach((n,i) => setTimeout(() => sfx(n), i*260)); });
      break;
    case 'graphics':
      head('Quality');
      choice('Effects quality', 'gfx', [['low','Low'],['medium','Medium'],['high','High'],['ultra','Ultra']], 'high', 'How many particles, streaks and explosion layers to draw. Use Low or Medium if your headset stutters.');
      choice('VR resolution', 'vrRes', [[.7,'70%'],[.85,'85%'],[1,'100%'],[1.2,'120%']], 1, 'Rendering resolution inside the headset. Higher is sharper but slower. Applies next time you enter VR.');
      choice('VR foveation', 'vrFov', [[0,'Off'],[.33,'Low'],[.66,'Medium'],[1,'High']], .66, 'Renders the edges of your view at lower resolution to save performance on Quest. Applies next time you enter VR.');
      head('Space');
      onoff('Living sky', 'skyFx', true, 'Hazard skies (nebula clouds, ion lightning, sun glare, pulsar pulses, asteroid belts), hyperspace tunnel and alert tints.');
      onoff('Shooting stars', 'shootingStars', true, 'The occasional meteor streaking across the sky.');
      onoff('Bridge interior', 'bridge', true, 'The ship bridge around you in VR. Turn off for an open view of space.', v => { if(typeof bridge!=='undefined' && bridge) bridge.group.visible = v && xrMode!=='immersive-ar'; });
      onoff('Holotable', 'holotable', true, '3D models of both ships on a table in front of you in VR.');
      head('Comfort');
      onoff('Screen shake', 'shake', true, 'Shake the flat-screen view on hits. Never used in VR.');
      onoff('Reduce flashes', 'reduceFlashes', false, 'Softer jump white-outs, lightning and pulsar flashes.');
      break;
    case 'vr':
      head('Body');
      choice('Play position', 'vrPose', [['standing','Standing'],['seated','Seated'],['lying','Lying down']], 'standing', 'Seated sets the bridge to chair height. Lying down tilts the world so looking up shows the console ahead.', v => setPlayPose(v));
      slider('Height adjustment', 0, `${(SET.vrHeight||0)>0?'+':''}${SET.vrHeight||0} cm`, () => { SET.vrHeight = clamp((SET.vrHeight||0) - 5, -60, 60); saveProfile(); if(inXR()) applyPlayMode(); }, () => { SET.vrHeight = clamp((SET.vrHeight||0) + 5, -60, 60); saveProfile(); if(inXR()) applyPlayMode(); }, 'Raise or lower your view on the bridge, for example if your floor height is off or you want a taller captain.');
      head('Movement');
      choice('Turning', 'vrTurn', [['30','Snap 30°'],['45','Snap 45°'],['smooth','Smooth']], '30', 'Right stick left/right.');
      choice('Walking', 'vrMove', [['smooth','Stick + teleport'],['teleport','Teleport only']], 'smooth', 'Left stick walks; aiming at the floor with the trigger teleports.');
      onoff('Comfort vignette', 'vrVignette', true, 'Darkens the edge of your view while moving to reduce motion sickness.');
      head('Console & clarity');
      onoff('Magnifier', 'vrLoupe', true, 'A zoomed loupe over whatever you point at on the console. Left stick click toggles it.');
      onoff('Bigger text', 'vrBigText', true, 'Enlarges small labels while in VR.');
      onoff('Controller help', 'vrLabels', true, 'Look at a controller to see what its buttons do.');
      btn(X, y+6, 260, 44, 'Reset console size', () => { SET.vrPanelScale = 1; saveProfile(); if(typeof panelGroup!=='undefined' && panelGroup) panelGroup.scale.setScalar(1); toast('Console size reset.'); }, { s:15 });
      btn(X+280, y+6, 260, 44, 'Reset holotable size', () => { SET.vrHoloScale = 1; saveProfile(); if(typeof holo!=='undefined' && holo) holo.top.scale.setScalar(1); toast('Holotable size reset.'); }, { s:15 });
      btn(X+560, y+6, 280, 44, 'Put everything back', () => { SET.vrPanelScale = 1; SET.vrHoloScale = 1; saveProfile(); if(inXR()){ panelGroup.scale.setScalar(1); holo.top.scale.setScalar(1); applyPlayMode(); } toast('Console, holotable and position reset.'); }, { s:15 }); y += 68;
      note('In VR: grip while pointing at the console to move it; grip on its edges or corner brackets to resize; two hands to move and scale. Do the same with the holotable.');
      break;
    case 'gameplay':
      head('Challenge');
      choice('Difficulty', 'difficulty', Object.keys(DIFFICULTY).map(k => [k, DIFFICULTY[k].name]), 'normal', 'Easy: more dodge, scrap and weaker enemies. Applies to new runs.');
      head('Help');
      onoff('Captain\'s tips', 'hints', true, 'Short tips the first time each mechanic comes up.');
      btn(VX, y-4, 240, 42, 'Replay all tips', () => { PROFILE.hintsSeen = {}; SET.hints = true; saveProfile(); toast('Tips will show again.'); }, { s:15 }); y += 50;
      onoff('Smart pause', 'smartPause', true, 'Pause automatically when boarders arrive, crew die or the hull gets critical.');
      head('Content');
      onoff('Unlock all ships', 'unlockAll', false, 'Skip the unlock conditions and pick any ship.');
      onoff('Allow mod scripts', 'allowScripts', false, 'Lets mods run their own JavaScript. Only turn this on for mods you trust.', () => applyMods());
      break;
    case 'profile':
      head('Your record');
      T(`Runs ${PROFILE.runs} · Ships defeated ${PROFILE.kills} · Furthest sector ${PROFILE.maxSector} · Wins ${Object.values(PROFILE.wins).reduce((a,b)=>a+(+b||0),0)} · Achievements ${Object.keys(PROFILE.ach).length}/${ACHIEVEMENTS.length}`, X, y+24, { s:20 }); y += 70;
      if(UI.confirmReset){ T('Erase all achievements, unlocks and stats?', X, y+24, { s:22, c:C.hostile });
        btn(X, y+40, 220, 52, 'Yes, erase', () => { for(const k of Object.keys(PROFILE.ach)) delete PROFILE.ach[k]; PROFILE.maxSector = 1; PROFILE.kills = 0; PROFILE.wins = {}; PROFILE.runs = 0; saveProfile(); UI.confirmReset = false; }, { col:C.hostile, fill:true });
        btn(X+240, y+40, 160, 52, 'Cancel', () => { UI.confirmReset = false; }); }
      else btn(X, y, 300, 52, 'Reset profile', () => { UI.confirmReset = true; }, { col:C.hostile });
      break;
  }
  btn(60, 870, 200, 64, 'Back', () => { UI.screen = 'title'; UI.confirmReset = false; });
}
function drawAchievements(){
  label('Your record', 60, 70, C.cyan, 'left', 18);
  T('Achievements', 60, 122, { s:50, f:FD, w:700 });
  ACHIEVEMENTS.forEach((a,i) => { const x = 60 + (i%2)*750, y = 160 + Math.floor(i/2)*78, got = !!PROFILE.ach[a.id];
    panel(x, y, 720, 66, 8); ctx.beginPath(); ctx.arc(x+34, y+33, 14, 0, 7); ctx.fillStyle = got ? C.amber : C.panel2; ctx.fill(); ctx.strokeStyle = got ? C.amber : C.line; ctx.lineWidth = 2; ctx.stroke();
    T(a.name, x+64, y+30, { s:20, f:FD, w:700, c: got ? C.ink : C.muted }); T(a.desc, x+64, y+54, { s:15, c:C.muted }); });
  btn(60, 880, 200, 64, 'Back', () => { UI.screen = 'title'; });
}
function drawHelpScreen(){
  label('Field manual', 60, 70, C.cyan, 'left', 18);
  T('How to play', 60, 122, { s:50, f:FD, w:700 });
  const items = [
    ['Power', 'Your reactor has a fixed number of bars. Use + and − under each system. Helm, Sensors, Doors and Battery are subsystems that need no reactor power.'],
    ['Weapons', 'Power a weapon, press Target, then point at an enemy room. With Autofire on it keeps firing at that room. Use Hold fire to let weapons charge, then Fire volley to hit shields all at once. Missiles and bombs use missile ammo.'],
    ['Shields', 'Every 2 shield power is one layer. Layers block lasers, ion and flak, then recharge. Missiles ignore shields. Beams lose 1 damage per layer. Bombs teleport past them.'],
    ['Crew', 'Select a crew member, then any room, on either ship. Crew man stations for bonuses, repair systems, fight fires, patch breaches and fight boarders. They gain skills as they work.'],
    ['Doors & air', 'Click doors to open or close them. Open airlocks to vent oxygen and starve fires or boarders. Breaches leak air until crew patch them.'],
    ['Special systems', 'Teleporter: gather crew in it and Send. Cloaking: dodge and freeze enemy weapons. Hacking: launch a drone, then pulse it. Mind control: turn an enemy. Battery: temporary power.'],
    ['Drones', 'Drones need Drone system power and use one drone part each time they deploy. Attack drones orbit the enemy, defense drones shoot down missiles, internal drones repair or fight.'],
    ['The journey', 'Each jump costs 1 fuel and the Rebuff Fleet advances. Choose your next sector at each exit. In the Last Stand, catch the Flaggship three times before it destroys Fedoration command.'] ];
  items.forEach(([h,t],i) => { const x = i%2 ? 820 : 60, y = 160 + Math.floor(i/2)*170; label(h, x, y, C.amber, 'left', 17); para(t, x, y+30, 700, { s:17, lh:25 }); });
  btn(60, 880, 200, 64, 'Back', () => { UI.screen = 'title'; });
}
function drawEnd(){
  const win = UI.screen==='win';
  label(win ? 'Mission complete' : 'Run over', W/2, 240, win ? C.good : C.hostile, 'center', 22);
  T(win ? 'THE FLAGGSHIP FALLS' : 'SHIP LOST', W/2, 340, { s:88, f:FD, w:700, a:'center', c: win ? C.amber : C.ink, ls:6 });
  para(win ? 'The data reaches Fedoration command. The Rebuff Fleet scatters, thoroughly rebuffed. You are, briefly, vaster than life.' : (UI.overReason||''), W/2-420, 410, 840, { s:22, c:C.muted });
  if(G){ const st = [['Sector', G.sector], ['Ships defeated', G.stats.kills], ['Scrap collected', G.stats.scrap], ['Jumps', G.stats.jumps]];
    st.forEach((s,i) => { const x = W/2 - 540 + i*270; label(s[0], x+120, 580, C.muted, 'center', 16); T(String(s[1]), x+120, 640, { s:52, f:FD, w:700, a:'center' }); });
    if(G.lost.length) T(`In memory of ${G.lost.slice(0,6).join(', ')}${G.lost.length>6?'…':''}`, W/2, 700, { s:18, a:'center', c:C.muted }); }
  btn(W/2-180, 760, 360, 72, 'Back to title', () => { UI.screen = 'title'; G = null; }, { fill:true, s:24 });
}

/* ---------------- game screen ---------------- */
const PBOX = { x:24, y:96, w:760, h:466 }, EBOX = { x:816, y:96, w:760, h:466 };
function drawGame(){
  drawTopBar();
  ctx.save(); if(G.shake>0 && SET.shake!==false && !inXR()) ctx.translate(rand(-1,1)*G.shake*9, rand(-1,1)*G.shake*9);
  drawShip(G.ship, PBOX, 1, false, false); ctx.restore();
  if(G.enemy) drawShip(G.enemy, EBOX, -1, true, false); else drawQuiet();
  drawUnits(); drawProjectiles(); drawFX(); drawBubbles();
  drawRoster(); if(G.enemy) drawEnemyStrip();
  drawSystems(); drawArmory(); drawCrewCard();
  const sw_ = UI.selWeapon!=null ? DATA.weapons[G.ship.weapons[UI.selWeapon]?.id] : null;
  const hint = UI.selWeapon!=null ? (sw_?.heal ? 'Point at one of YOUR rooms to target the burst' : `Point at an enemy room · ${sw_?.type==='beam'||sw_?.type==='bomb' ? 100 : 100-evasion(G.enemy||G.ship)}% to hit · ${G.enemy?.shield||0} shield layer${(G.enemy?.shield||0)===1?'':'s'}`)
    : UI.mode==='tele' ? 'Point at an enemy room to teleport your away team' : UI.mode==='hack' ? 'Point at an enemy room to launch the hacking drone'
    : UI.mode==='mind' ? 'Point at an enemy crew member to take control' : UI.selCrew ? ((UI.selCrews||[]).length>1 ? `Point at a room to move ${UI.selCrews.length} crew` : 'Point at a room to move your crew member') : '';
  if(hint){ panel(W/2-330, 520, 660, 40, 8); T(hint, W/2, 541, { s:17, a:'center', b:'middle', c:C.amber }); }
  if(G.flash>0){ ctx.fillStyle = `rgba(255,200,120,${G.flash*.35})`; ctx.fillRect(0,0,W,H); }
  if(G.warp>0) drawWarp2D();
  if(G.paused && !G.modal && !UI.hint){ ctx.fillStyle = 'rgba(7,10,20,.3)'; ctx.fillRect(0,76,W,480);
    panel(W/2-200, 250, 400, 100, 10); T('PAUSED', W/2, 298, { s:42, f:FD, w:700, a:'center', c:C.amber, ls:8 }); T('Give orders, then resume', W/2, 332, { s:17, a:'center', c:C.muted });
    if(typeof inXR==='function' && inXR()){ panel(W/2-260, 362, 520, 70, 10); [['standing','Standing'],['seated','Seated'],['lying','Lying down']].forEach(([v,l],i) => btn(W/2-250 + i*170, 372, 160, 50, l, () => setPlayPose(v), { fill:(SET.vrPose||'standing')===v, s:16 })); } }
  if(G.modal) drawModal();
}
function drawTopBar(){
  const s = G.ship;
  const g = ctx.createLinearGradient(0,0,0,76); g.addColorStop(0,'rgba(24,32,60,.97)'); g.addColorStop(1,'rgba(10,14,28,.97)'); ctx.fillStyle = g; ctx.fillRect(0,0,W,76);
  const gl = ctx.createLinearGradient(0,0,W,0); gl.addColorStop(0,hexA(C.amber,0)); gl.addColorStop(.5,hexA(C.amber,.55)); gl.addColorStop(1,hexA(C.amber,0)); ctx.fillStyle = gl; ctx.fillRect(0,75,W,2);
  label('Hull', 20, 30, C.muted, 'left', 14);
  const n = s.maxHull, bw = 260, seg = bw/n, hc = s.hull/n > .5 ? C.good : s.hull/n > .25 ? C.warn : C.hostile;
  for(let i=0;i<n;i++){ const on_ = i < s.hull; ctx.fillStyle = on_ ? hc : '#141b31'; ctx.fillRect(70+i*seg, 13, Math.max(1,seg-1.5), 22); if(on_){ ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(70+i*seg, 13, Math.max(1,seg-1.5), 4); } }
  T(`${s.hull}/${n}`, 70+bw+8, 31, { s:18, w:600 });
  tip(16, 8, 360, 34, 'Hull', 'Your ship\'s structural integrity. At zero, the run is over. Repair it at stores, some events and with hull repair drones.');
  label('Shld', 20, 63, C.muted, 'left', 14);
  const mx = Math.floor((s.systems.shields?.max||0)/2), ml = shieldLayers(s);
  for(let i=0;i<Math.max(mx,0);i++){ const x = 82+i*24; ctx.beginPath(); ctx.moveTo(x,51); ctx.lineTo(x+9,59); ctx.lineTo(x,67); ctx.lineTo(x-9,59); ctx.closePath(); ctx.fillStyle = i < s.shield ? C.cyan : (i<ml ? hexA(C.cyan,.25) : C.panel2); ctx.fill(); if(i < s.shield) glow(x, 59, 12, C.cyan, .35); }
  let tx = 92 + Math.max(mx,1)*24;
  if(s.super>0){ T(`+${s.super}`, tx, 64, { s:16, f:FD, w:700, c:C.good }); tx += 44; }
  label(`Evade ${evasion(s)}%`, tx, 64, evasion(s)>0 ? C.ink : C.hostile, 'left', 14);
  tip(tx, 48, 110, 22, 'Evasion', 'Chance to dodge incoming shots. Needs powered engines and someone at the helm. Manning engines and cloaking add more.');
  const avgO2 = Math.round(s.rooms.reduce((t,r)=>t+r.o2,0)/s.rooms.length);
  label(`O2 ${avgO2}%`, tx+120, 64, avgO2<40 ? C.hostile : C.ink, 'left', 14);
  const res = [['Scrap', G.scrap, C.amber, 'The currency of the galaxy. Spend it on upgrades, repairs and gear.'], ['Fuel', G.fuel, G.fuel<=3?C.hostile:C.ink, 'Each jump costs 1 fuel. Run out and you will be stranded.'], ['Missiles', G.missiles, C.ink, 'Ammo for missiles and bombs.'], ['Parts', G.parts, C.ink, 'Drone parts. Each drone deployment and hacking drone uses one.']];
  res.forEach((r,i) => { const x = 440 + i*108; label(r[0], x, 28, C.muted, 'left', 13); T(String(r[1]), x, 64, { s:28, f:FD, w:700, c:r[2] }); tip(x-6, 10, 100, 60, r[0], r[3]); });
  const sd = sectorDef();
  label(`Sector ${G.sector} of ${R.sectors}`, 872, 22, C.muted, 'left', 12);
  label(sd.name, 872, 42, sd.color||C.cyan, 'left', 12);
  if(G.flag) label(`Base ${G.flag.baseHP} · Boss ${G.flag.phase+1}/3`, 872, 64, C.hostile, 'left', 11);
  else if(G.hazard) label(HAZARDS[G.hazard], 872, 64, G.hazard==='nebula'?C.violet:C.warn, 'left', 11);
  label('VTL drive', 1108, 28, C.muted, 'left', 12);
  const charge = G.enemy && !G.enemy.dead ? G.ftl : 1; bar(1108, 38, 150, 12, charge, charge>=1 ? C.good : C.amber); if(charge>=1) glow(1258, 44, 16, C.good, .4);
  tip(1104, 14, 160, 44, 'VTL drive', 'Charges during combat while someone flies the ship. When full you can jump away from a fight.');
  btn(1268, 12, 104, 52, charge>=1 ? 'Jump' : 'Map', openMap, { fill:charge>=1 && !!G.enemy, col: charge>=1 ? C.good : C.amber });
  btn(1380, 12, 92, 52, 'Ship', () => { G.modal = { type:'ship' }; UI.tab = UI.tab || 'systems'; });
  btn(1480, 12, 100, 52, G.paused ? 'Resume' : 'Pause', () => { G.paused = !G.paused; }, { fill:G.paused });
}

function layoutShip(sh, box, facing, mini){
  const gw = sh.gw, gh = sh.gh;
  const pad = mini ? 12 : 20, nose = mini ? 30 : 56;
  const cell = Math.min(mini ? 40 : 64, (box.w - 2*pad - nose - 60)/gw, (box.h - 2*pad - (mini?10:76))/gh);
  const sw = gw*cell, shh = gh*cell;
  const ox = box.x + (box.w - sw)/2 - facing*nose*.35, oy = box.y + (box.h - shh)/2 + (mini?0:4);
  sh._rects = sh.rooms.map(r => ({ x: facing>0 ? ox + r.x*cell : ox + (gw - r.x - r.w)*cell, y: oy + r.y*cell, w:r.w*cell, h:r.h*cell }));
  sh._b = { x0:ox-pad, y0:oy-pad, x1:ox+sw+pad, y1:oy+shh+pad, cell, nose, facing, ox, oy };
  return sh._b;
}
function cellXY(sh, x, y){ const b = sh._b; const gx = b.facing>0 ? x : (sh.gw-1-x); return { x: b.ox + gx*b.cell + b.cell/2, y: b.oy + y*b.cell + b.cell/2 }; }
function hullPath(b){
  const { x0,y0,x1,y1,nose,facing } = b, cy = (y0+y1)/2;
  const P = facing>0 ? [[x0+20,y0],[x1-8,y0],[x1+nose,cy],[x1-8,y1],[x0+20,y1],[x0,y1-24],[x0,y0+24]]
                     : [[x1-20,y0],[x0+8,y0],[x0-nose,cy],[x0+8,y1],[x1-20,y1],[x1,y1-24],[x1,y0+24]];
  ctx.beginPath(); P.forEach((p,i)=> i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); ctx.closePath();
}
function gunPoint(sh){ const b = sh._b; if(!b) return { x: sh.isEnemy?1100:500, y:330 }; const cy = (b.y0+b.y1)/2; return b.facing>0 ? { x:b.x1+b.nose*.6, y:cy } : { x:b.x0-b.nose*.6, y:cy }; }
function sensorLevel(){ if(!G) return 3; return eff(G.ship,'sensors'); }
function telepathic(){ return G && G.ship.crew.some(c => c.owner==='p' && DATA.races[c.race]?.telepathic); }
function drawShip(sh, box, facing, isEnemy, mini){
  const b = layoutShip(sh, box, facing, mini), cell = b.cell, cy = (b.y0+b.y1)/2, col = sh.color;
  const fade = sh.dead ? Math.max(0, (G?.dieT||0)/1.3) : 1; if(fade<=0) return;
  const cloaked = sh.cloak?.t>0, t = G?.time ?? performance.now()/1000, live = !!G && !G.paused && !G.modal && UI.screen==='game';
  const baseA = fade * (cloaked ? .38 : 1); ctx.globalAlpha = baseA;
  engineGlow(sh, t);
  const img = getImg(sh.image);
  if(img){ ctx.drawImage(img, b.x0 - (facing<0?b.nose:0), b.y0, (b.x1-b.x0)+b.nose, b.y1-b.y0);
    sh._rects.forEach(q => { ctx.fillStyle = 'rgba(24,33,59,.92)'; ctx.fillRect(q.x,q.y,q.w,q.h); ctx.strokeStyle = '#4b5d8e'; ctx.lineWidth = 2; ctx.strokeRect(q.x+1,q.y+1,q.w-2,q.h-2); }); }
  else { const art = shipArt(sh, mini); if(art) ctx.drawImage(art.c, b.x0 + art.dx, b.y0 + art.dy); }
  const vis = !isEnemy || mini ? 3 : sensorLevel();
  const ownIn = new Set(); if(isEnemy) for(const c of sh.crew) if(c.owner==='p') ownIn.add(c.room);
  const selW = (!mini && UI.selWeapon!=null && G) ? G.ship.weapons[UI.selWeapon] : null; const healSel = selW && DATA.weapons[selW.id]?.heal;
  sh.rooms.forEach((r,i) => {
    const q = sh._rects[i]; if(!q) return; const s = r.sys ? sh.systems[r.sys] : null, seen = vis>=1 || ownIn.has(i);
    if(!seen){ ctx.fillStyle = 'rgba(8,12,24,.85)'; ctx.fillRect(q.x+2,q.y+2,q.w-4,q.h-4); if(!mini) T('?', q.x+q.w/2, q.y+q.h/2+6, { s:18, f:FD, w:700, a:'center', c:'#2f3a5c' }); }
    else if(!mini){
      if(r.o2 < 60){ ctx.fillStyle = hexA(C.hostile, (60-r.o2)/60*.38); ctx.fillRect(q.x+2,q.y+2,q.w-4,q.h-4); }
      if(s && s.dmg>0){ ctx.fillStyle = hexA(C.hostile, (.12 + .22*s.dmg/s.max)*(.75 + .25*Math.sin(t*6))); ctx.fillRect(q.x+2,q.y+2,q.w-4,q.h-4); }
      if(s && s.ionT>0){ ctx.save(); ctx.beginPath(); ctx.rect(q.x,q.y,q.w,q.h); ctx.clip(); ctx.strokeStyle = hexA(C.cyan,.45); ctx.lineWidth = 3;
        for(let k=-q.h;k<q.w;k+=14){ const o = (t*30)%14; ctx.beginPath(); ctx.moveTo(q.x+k+o,q.y+q.h); ctx.lineTo(q.x+k+o+q.h,q.y); ctx.stroke(); } ctx.restore(); }
      for(let f=0; f<r.fire; f++){ const fx_ = q.x + ((f % r.w)+.5)*cell, fy = q.y + (Math.floor(f / r.w)+.6)*cell; const fl = Math.sin(t*12 + f*2)*cell*.05;
        glow(fx_, fy, cell*.5, '#ff7a2d', .45);
        ctx.beginPath(); ctx.moveTo(fx_-cell*.24, fy+cell*.25); ctx.quadraticCurveTo(fx_-cell*.3, fy-cell*.05, fx_+fl, fy-cell*.38); ctx.quadraticCurveTo(fx_+cell*.3, fy-cell*.05, fx_+cell*.24, fy+cell*.25); ctx.closePath(); ctx.fillStyle = hexA('#ff6a2d',.9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(fx_-cell*.12, fy+cell*.22); ctx.quadraticCurveTo(fx_-cell*.14, fy, fx_-fl, fy-cell*.18); ctx.quadraticCurveTo(fx_+cell*.14, fy, fx_+cell*.12, fy+cell*.22); ctx.closePath(); ctx.fillStyle = '#ffd27a'; ctx.fill();
        if(live && Math.random()<.12) ember(fx_, fy - cell*.25); }
      for(let k=0; k<r.breach; k++){ const bx = q.x + q.w - (k+.5)*Math.min(cell*.5, 22) - 4, by = q.y + q.h - 12; ctx.beginPath(); ctx.arc(bx, by, Math.min(9, cell*.14), 0, 7); ctx.fillStyle = '#000'; ctx.fill(); ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 2; ctx.stroke(); if(live && Math.random()<.25) vent(bx, by, (Math.random()-.5), -1); }
    }
    const hov = !mini && hovered(q.x,q.y,q.w,q.h);
    const targeting = !mini && ((isEnemy && ((selW && !healSel) || UI.mode==='tele' || UI.mode==='hack')) || (!isEnemy && healSel));
    if(targeting && hov){ ctx.strokeStyle = C.hostile; ctx.lineWidth = 3; ctx.strokeRect(q.x+1,q.y+1,q.w-2,q.h-2); glow(q.x+q.w/2, q.y+q.h/2, Math.max(q.w,q.h)*.6, C.hostile, .15); }
    else if(hov && UI.selCrew){ ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.strokeRect(q.x+1,q.y+1,q.w-2,q.h-2); }
    if(r.sys && !mini){
      const ic = SYSC[r.sys]||C.ink, inst = !!s;
      T(SYSS[r.sys], q.x+11, q.y+17, { s: q.w < 56 ? 9 : 12, f:FD, w:700, c:inst ? ic : hexA(ic,.35), ls: q.w < 56 ? 0 : 1 });
      if(inst && seen && s.dmg>0){ const work = sh.crew.some(c => c.room===i && !c.path.length && crewSide(c)===sh.side); if(work) bar(q.x+6, q.y+q.h-10, q.w-12, 6, s.rep, C.good, 'rgba(0,0,0,.5)'); else if(Math.sin(t*5)>0) T('!', q.x+q.w-10, q.y+18, { s:16, f:FD, w:700, c:C.hostile }); }
      if(sh.hacked && sh.hacked.room===i){ const on_ = sh.hacked.pulseT>0; ctx.strokeStyle = on_ ? '#ff9de2' : hexA('#ff9de2',.6); ctx.lineWidth = on_ ? 4 : 2; ctx.strokeRect(q.x+4,q.y+4,q.w-8,q.h-8); if(on_) glow(q.x+q.w/2, q.y+q.h/2, q.w*.6, '#ff9de2', .3); T('HACK', q.x+q.w-6, q.y+16, { s:11, f:FD, w:700, a:'right', c:'#ff9de2' }); }
    }
    if(!mini && G){
      if(isEnemy){
        if(selW && !healSel) region(q.x,q.y,q.w,q.h, () => { selW.target = i; UI.selWeapon = null; });
        else if(UI.mode==='tele') region(q.x,q.y,q.w,q.h, () => { if(teleSend(G.ship, G.enemy, i)) UI.mode = null; else toast('Gather crew in the teleporter room first, and wait for it to charge.'); });
        else if(UI.mode==='hack') region(q.x,q.y,q.w,q.h, () => { if(hackLaunch(G.ship, G.enemy, i)) UI.mode = null; });
        else if(UI.selCrew) region(q.x,q.y,q.w,q.h, () => moveSelected(sh, i));
        else if(sh.crew.some(c => c.room===i && controlled(c))) region(q.x,q.y,q.w,q.h, () => selectRoomCrew(sh, i));
      } else {
        if(healSel) region(q.x,q.y,q.w,q.h, () => { selW.target = i; UI.selWeapon = null; });
        else if(UI.selCrew) region(q.x,q.y,q.w,q.h, () => moveSelected(sh, i));
        else if(sh.crew.some(c => c.room===i && controlled(c))) region(q.x,q.y,q.w,q.h, () => selectRoomCrew(sh, i));
      }
    }
  });
  if(!mini) for(const d of sh.doors){
    const a = cellXY(sh, d.ca[0], d.ca[1]), bb = cellXY(sh, d.cb[0], d.cb[1]);
    const mx = (a.x+bb.x)/2, my = (a.y+bb.y)/2, horiz = Math.abs(a.y-bb.y) < 1;
    const L = cell*.46, Th = Math.max(5, cell*.12), open = doorOpen(d);
    const st = d.broken>0 ? C.hostile : d.b<0 ? '#e0b070' : '#b89f74';
    ctx.fillStyle = '#0b0f1c'; if(horiz) ctx.fillRect(mx-Th/2-1, my-L/2-2, Th+2, L+4); else ctx.fillRect(mx-L/2-2, my-Th/2-1, L+4, Th+2);
    const gap = open ? L*.36 : 0; ctx.fillStyle = st;
    if(horiz){ ctx.fillRect(mx-Th/2, my-L/2, Th, L/2-gap); ctx.fillRect(mx-Th/2, my+gap, Th, L/2-gap); }
    else { ctx.fillRect(mx-L/2, my-Th/2, L/2-gap, Th); ctx.fillRect(mx+gap, my-Th/2, L/2-gap, Th); }
    if(open && !d.broken) glow(mx, my, L*.4, C.good, .25); if(d.broken>0 && Math.random()<.05 && live) sparks(mx, my, '#ffb547', 3);
    if(!isEnemy && canDoors(sh) && G) region(mx-Math.max(horiz?Th:L,22)/2, my-Math.max(horiz?L:Th,22)/2, Math.max(horiz?Th:L,22), Math.max(horiz?L:Th,22), () => { d.open = !d.open; d.broken = 0; sfx('door'); });
  }
  const rad = Math.max(5, Math.min(15, cell*.26));
  const seeCrew = !isEnemy || mini || sensorLevel()>=2 || telepathic();
  for(const c of sh.crew){
    if(isEnemy && !seeCrew && c.owner!=='p' && !ownIn.has(c.room)){ c._sx = null; continue; }
    const p = cellXY(sh, c.x, c.y); const px = p.x, py = p.y + (mini?0:2);
    const face = c._sx!=null && Math.abs(px - c._sx) > .05 ? Math.sign(px - c._sx) : (c._face || (isEnemy ? -1 : 1)); c._face = face; c._sx = px; c._sy = py;
    if(!mini && (UI.selCrew===c.id || (UI.selCrews||[]).includes(c.id))){ ctx.beginPath(); ctx.ellipse(px, py+rad*.95, rad*1.25, rad*.45, 0, 0, 7); ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.stroke(); glow(px, py+rad*.9, rad*1.3, C.amber, .3); }
    drawCrewSprite(px, py, rad, c, { hostile: c.owner==='e' && !mini, face, ship: sh });
    if(!mini){
      const hw = rad*1.9, fr = clamp(c.hp/c.maxHp,0,1); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(px-hw/2-1, py-rad*2.6-1, hw+2, 5); ctx.fillStyle = fr>.5 ? C.good : fr>.25 ? C.warn : C.hostile; ctx.fillRect(px-hw/2, py-rad*2.6, hw*fr, 3);
      if(c.mcT>0){ ctx.beginPath(); ctx.arc(px,py,rad+7,0,7); ctx.strokeStyle = C.violet; ctx.lineWidth = 2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]); }
      if(c.stunT>0) T('z', px+rad, py-rad, { s:14, f:FD, w:700, c:C.cyan });
      if(c.owner==='p' && !c.drone){ const jb = crewJob(c, sh); if(jb.k!=='idle' && jb.k!=='move') drawJobIcon(px + rad*1.25, py - rad*2.75, jb, Math.max(6, rad*.5)); }
      if(crewSide(c)!==sh.side && c.owner==='p'){ ctx.beginPath(); ctx.arc(px,py,rad+3,0,7); ctx.strokeStyle = hexA(C.amber,.6); ctx.lineWidth = 1.5; ctx.stroke(); }
      if(G && controlled(c)) region(px-rad-6, py-rad-8, rad*2+12, rad*2+14, () => { UI.selCrew = UI.selCrew===c.id && !(UI.selCrews||[]).length ? null : c.id; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; });
      else if(G && UI.mode==='mind' && crewSide(c)!=='p') region(px-rad-6, py-rad-8, rad*2+12, rad*2+14, () => { if(mindControl(G.ship, c)) UI.mode = null; });
    }
  }
  const scx = (b.x0+b.x1)/2 + facing*b.nose*.3, rx = (b.x1-b.x0)/2 + b.nose*.55 + 18, ry = (b.y1-b.y0)/2 + 30;
  sh._shieldE = { cx:scx, cy, rx, ry };
  if(!mini) drawShieldBubble(scx, cy, rx, ry, sh.shield, sh.super, t);
  if(cloaked){ ctx.save(); ctx.globalAlpha = .18; ctx.strokeStyle = C.cyan; ctx.lineWidth = 1; for(let yy = b.y0 + ((t*40)%8); yy < b.y1; yy += 8){ ctx.beginPath(); ctx.moveTo(b.x0 - (facing<0?b.nose:0), yy); ctx.lineTo(b.x1 + (facing>0?b.nose:0), yy); ctx.stroke(); } ctx.restore(); }
  if(!mini && G){ G.ship.weapons.forEach((w,wi) => { if(w.target==null) return; const heal = DATA.weapons[w.id]?.heal;
      if((isEnemy && heal) || (!isEnemy && !heal)) return; const q = sh._rects[w.target]; if(!q) return; const x = q.x+q.w/2 + (wi-1.5)*12, y = q.y+q.h/2;
      const tc = heal ? C.good : C.amber; ctx.save(); ctx.translate(x,y); ctx.rotate(t*.8); ctx.strokeStyle = tc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0,0,15,0,7);
      for(let k=0;k<4;k++){ ctx.moveTo(Math.cos(k*1.571)*9, Math.sin(k*1.571)*9); ctx.lineTo(Math.cos(k*1.571)*22, Math.sin(k*1.571)*22); } ctx.stroke(); ctx.restore();
      T(String(wi+1), x, y+1, { s:14, f:FD, w:700, a:'center', b:'middle', c:tc }); }); }
  ctx.globalAlpha = 1;
  if(!mini){ label(sh.name, box.x+8, box.y+16, hexA(col,.9), 'left', 15); if(cloaked) label(`Cloaked ${sh.cloak.t.toFixed(0)}s`, box.x+box.w-8, box.y+16, C.cyan, 'right', 14); }
}

function moveSelected(sh, ri_){
  const ids = UI.selCrews && UI.selCrews.length ? UI.selCrews : [UI.selCrew];
  const group = sh.crew.filter(x => ids.includes(x.id) && controlled(x));
  if(!group.length){ toast('Crew can only walk within the ship they are on. Use the teleporter to cross.'); UI.selCrew = null; UI.selCrews = []; return; }
  let moved = 0; for(const c of group){ if(orderMove(sh, c, ri_)){ moved++; c.manualT = 10; if(sh===G.ship) c.station = ri_; } }
  if(!moved) toast('That room is full.'); else if(moved < group.length) toast('Not everyone fits in that room.');
  UI.selCrew = null; UI.selCrews = [];
}
function selectRoomCrew(sh, ri_){ const ids = sh.crew.filter(c => c.room===ri_ && controlled(c)).map(c => c.id); if(!ids.length) return false; UI.selCrew = ids[0]; UI.selCrews = ids; UI.selWeapon = null; UI.mode = null; return true; }
function drawQuiet(){
  const b = EBOX; const node = G.map?.nodes[G.map.cur];
  ctx.beginPath(); ctx.arc(b.x+b.w*.62, b.y+b.h*.46, 150, 0, 7); const pg = ctx.createRadialGradient(b.x+b.w*.55,b.y+b.h*.38,10,b.x+b.w*.62,b.y+b.h*.46,150);
  pg.addColorStop(0, G.nebula ? '#5a4a8f' : '#3a4f7a'); pg.addColorStop(1,'#0c1226'); ctx.fillStyle = pg; ctx.fill();
  label(node?.type==='store' ? 'Store beacon' : node?.type==='exit' ? 'Exit beacon' : node?.type==='base' ? 'Fedoration Command' : 'Beacon', b.x+20, b.y+34, C.cyan, 'left', 18);
  T('No hostiles in range.', b.x+20, b.y+74, { s:24, f:FD, w:600 });
  T(G.hazard ? HAZARDS[G.hazard] : 'Open the map to plot your next jump.', b.x+20, b.y+106, { s:18, c: G.hazard ? C.warn : C.muted });
  const boarders = G.ship.crew.filter(c => crewSide(c)!=='p').length;
  if(boarders) T(`${boarders} intruder${boarders>1?'s':''} still aboard!`, b.x+20, b.y+140, { s:20, f:FD, w:700, c:C.hostile });
  if(node?.type==='store') btn(b.x+20, b.y+b.h-90, 240, 64, 'Open store', () => { if(!node.store) node.store = makeStore(); G.modal = { type:'store', node:G.map.cur }; }, { fill:true });
  if(node?.type==='exit') btn(b.x+20, b.y+b.h-90, 300, 64, 'Jump to next sector', () => { G.modal = { type:'exit', opts:sectorOptions() }; }, { fill:true, col:C.good });
  btn(b.x+b.w-200, b.y+b.h-90, 180, 64, 'Map', openMap);
}
function drawRoster(){
  const list = []; for(const s of [G.ship, G.enemy]) if(s) for(const c of s.crew) if(c.owner==='p' && !c.drone) list.push([c, s]);
  const n = list.length, x0 = 24, y0 = 572, gap = 6, cw = Math.min(160, (760 - gap*(n-1))/Math.max(1,n));
  list.forEach(([c, s], i) => { const x = x0 + i*(cw+gap), sel = UI.selCrew===c.id, race = DATA.races[c.race] || {};
    rr(x,y0,cw,66,8); ctx.fillStyle = sel ? hexA(C.amber,.16) : hexA(C.panel,.94); ctx.fill(); ctx.lineWidth = sel?3:1.5; ctx.strokeStyle = sel ? C.amber : c.mcT>0 ? C.violet : hovered(x,y0,cw,66) ? C.muted : C.line; ctx.stroke();
    drawPortrait(x+21, y0+27, 16, c, false);
    T(c.name, x+43, y0+24, { s: cw<120 ? 14 : 16, f:FD, w:600, max: cw-50 });
    const jb = crewJob(c, s); const short = { fight:'Fighting', repair:'Repairing', fire:'Firefighting', breach:'Patching', heal:'Healing', man:'Manning', move:'Moving', idle:'Standing by', mind:'Controlled!', board:'Aboard enemy', stun:'Stunned' }[jb.k];
    T(short + (jb.k==='man' ? ' ' + (STATION_NAME[jb.sys]||'') : ''), x+43, y0+42, { s:11, c: JOB_COL[jb.k] || C.muted, max:cw-50 });
    bar(x+43, y0+50, cw-53, 7, c.hp/c.maxHp, c.hp/c.maxHp>.5?C.good:c.hp/c.maxHp>.25?C.warn:C.hostile);
    tip(x, y0, cw, 66, `${c.name} · ${race.name||''}`, `${crewJob(c, s).text}. ${raceTraits(race)}. Skills: ${SKILLS.map(k=>SKILLN[k]+' '+['-','I','II'][skillLvl(c,k)]).join(', ')}. Click for details.`);
    if(c.mcT<=0) region(x,y0,cw,66, () => { UI.selCrew = sel ? null : c.id; UI.selWeapon = null; UI.mode = null; }); });
}
function drawEnemyStrip(){
  const e = G.enemy, x = 816, y = 572, sens = sensorLevel();
  panel(x, y, 760, 66, 8);
  T(e.name, x+16, y+28, { s:19, f:FD, w:700, c:C.hostile });
  label(`Hull ${e.hull}/${e.maxHull}`, x+16, y+54, C.muted, 'left', 12);
  bar(x+150, y+44, 200, 12, e.hull/e.maxHull, C.hostile);
  label(`Shields ${e.shield}${e.super>0?' +'+e.super:''}`, x+370, y+54, C.cyan, 'left', 12);
  label(`Evade ${evasion(e)}%`, x+500, y+54, C.ink, 'left', 12);
  if(e.fleeT!=null){ label('Escaping', x+610, y+28, C.warn, 'left', 12); bar(x+610, y+40, 130, 10, 1 - e.fleeT/22, C.warn); }
  else if(sens>=3){ e.weapons.slice(0,4).forEach((w,i) => { const d = DATA.weapons[w.id]; bar(x+610+i*34, y+42, 28, 10, w.on ? w.charge/d.charge : 0, C.hostile); }); label('Weapons', x+610, y+28, C.muted, 'left', 11); }
  if(e.cloak.t>0) label('Cloaked', x+250, y+26, C.cyan, 'left', 13);
}
function sysAction(k){
  const s = G.ship, e = G.enemy && !G.enemy.dead ? G.enemy : null;
  switch(k){
    case 'cloaking': return s.cloak.t>0 ? [`${s.cloak.t.toFixed(0)}s`, null, true] : s.cloak.cd>0 ? [`${Math.ceil(s.cloak.cd)}s`, null, true] : ['Cloak', () => activateCloak(s), !canCloak(s)];
    case 'teleporter': { const aboard = e && e.crew.some(c=>c.owner==='p' && !c.drone);
      if(s.tele.cd>0) return [`${Math.ceil(s.tele.cd)}s`, null, true];
      if(aboard) return ['Return', () => teleRecall(s, e), false];
      return [UI.mode==='tele' ? 'Cancel' : 'Send', () => { UI.mode = UI.mode==='tele' ? null : 'tele'; UI.selWeapon = null; UI.selCrew = null; }, !canTele(s, e)]; }
    case 'hacking': { if(e && e.hacked && e.hacked.by==='p'){ const h = e.hacked; if(h.pulseT>0) return [`${h.pulseT.toFixed(0)}s`, null, true]; if(h.cd>0) return [`${Math.ceil(h.cd)}s`, null, true]; return ['Hack', () => hackPulse(s, e), !canHackPulse(s, e)]; }
      if(s.hackLaunched) return ['Flying', null, true];
      return [UI.mode==='hack' ? 'Cancel' : 'Launch', () => { UI.mode = UI.mode==='hack' ? null : 'hack'; UI.selWeapon = null; UI.selCrew = null; }, !canHackLaunch(s, e)]; }
    case 'mindcontrol': return s.mc.cd>0 ? [`${Math.ceil(s.mc.cd)}s`, null, true] : [UI.mode==='mind' ? 'Cancel' : 'Mind', () => { UI.mode = UI.mode==='mind' ? null : 'mind'; UI.selWeapon = null; UI.selCrew = null; }, !canMind(s)];
    default: return null;
  }
}
function drawSystems(){
  const s = G.ship, x = 24, y = 652, w = 904, h = 328;
  panel(x,y,w,h);
  label('Power', x+16, y+28, C.amber, 'left', 16);
  const avail = reactorAvail(s), free = reactorFree(s);
  T(`${free} free of ${avail}${s.battery.t>0?' (battery)':''}${G.hazard==='ionstorm'?' (ion storm)':''}`, x+100, y+28, { s:14, c:C.muted });
  const segW = Math.min(18, 300/Math.max(1,avail));
  for(let i=0;i<avail;i++){ ctx.fillStyle = i < free ? C.good : hexA(C.good,.15); ctx.fillRect(x+w-196-(i+1)*segW, y+12, segW-3, 18); }
  const list = MAIN.filter(k => s.systems[k]);
  const subW = 176, colW = Math.min(100, (w - 28 - subW)/Math.max(1,list.length));
  list.forEach((k,i) => {
    const cx = x+14 + i*colW, sy = s.systems[k], e = eff(s,k), bonus = bonusPower(s,k), cw = colW-8;
    drawSysIcon(ctx, k, cx + 12, y+55, 15, SYSC[k]); T(SYSS[k], cx + 24, y+60, { s:13, f:FD, w:700, c:SYSC[k], ls:1 });
    tip(cx, y+40, cw, 160, SYSN[k], `${sysDesc(k)} Level ${sy.max}, power ${sy.power}${bonus?` (+${bonus} Voltan)`:''}${sy.dmg?`, ${sy.dmg} damaged`:''}.`);
    const areaH = 108, bh = Math.min(20, (areaH - (sy.max-1)*3)/sy.max), bw = Math.min(46, cw-10), bx = cx + cw/2 - bw/2;
    for(let b=0;b<sy.max;b++){ const by = y+70 + areaH - (b+1)*(bh+3);
      let fill = null, stroke = C.line;
      if(b >= sy.max - sy.dmg){ fill = hexA(C.hostile,.75); stroke = C.hostile; }
      else if(b < e){ fill = b >= sy.power ? C.warn : (hackedNow(s,k)?'#ff9de2':C.amber); stroke = fill; }
      else if(b < Math.min(sy.power + bonus, sy.max - sy.dmg)){ stroke = sy.ionT>0 ? C.cyan : '#ff9de2'; }
      rr(bx, by, bw, bh, 3); if(fill){ ctx.fillStyle = fill; ctx.fill(); } ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
    let st = ''; if(k==='shields') st = `${shieldLayers(s)} layer${shieldLayers(s)===1?'':'s'}`; else if(manned(s,k)) st = 'manned'; else if(sy.ionT>0) st = 'ion';
    if(st) T(st, cx + cw/2, y+194, { s:11, a:'center', c: st==='ion' ? C.cyan : C.good });
    btn(cx, y+202, cw, 40, '+', () => { const r = addPower(s,k); sfx(r==='ok' ? 'power' : 'error'); if(r==='reactor') toast('No reactor power free.'); else if(r==='damaged') toast(`${SYSN[k]} is damaged. Send crew to repair it.`); else if(r==='full') toast(`${SYSN[k]} is at full power. Upgrade it in Ship.`); }, { s:24 });
    btn(cx, y+246, cw, 32, '−', () => { removePower(s,k); sfx('unpower'); }, { s:22, disabled: sy.power<=0 });
    const act = sysAction(k); if(act) btn(cx, y+284, cw, 36, act[0], act[1], { s:14, disabled:act[2], col:SYSC[k], fill: (k==='teleporter'&&UI.mode==='tele')||(k==='hacking'&&UI.mode==='hack')||(k==='mindcontrol'&&UI.mode==='mind') });
  });
  const hx = x + w - subW - 10, hy = y+40;
  rr(hx, hy, subW, 280, 8); ctx.fillStyle = C.panel2; ctx.fill();
  const pc = mannedCrew(s,'piloting'), pil = eff(s,'piloting');
  T('HELM', hx+12, hy+22, { s:13, f:FD, w:700, c:C.violet, ls:1 }); T(`Evade ${evasion(s)}%`, hx+subW-12, hy+22, { s:14, f:FD, w:700, a:'right' });
  T(pc ? `Pilot: ${pc.name}` : pil>=2 ? 'Autopilot' : pil<=0 ? 'Helm damaged' : 'No pilot!', hx+12, hy+42, { s:13, c: pc ? C.good : pil>=2 ? C.warn : C.hostile });
  T(`SENS ${eff(s,'sensors')}${G.nebula?' (nebula)':''} · DOOR ${s.systems.doors ? eff(s,'doors') : '-'}`, hx+12, hy+62, { s:12, c:C.muted });
  const bw2 = (subW-30)/2;
  btn(hx+10, hy+74, bw2, 36, 'Open', () => { if(!setAllDoors(s, true, false)) toast('Door control is down.'); }, { s:13, col:C.good });
  btn(hx+20+bw2, hy+74, bw2, 36, 'Close', () => { if(!setAllDoors(s, false, true)) toast('Door control is down.'); }, { s:13, col:'#c9a27e' });
  const vent = s.doors.some(d => d.b<0 && d.open);
  btn(hx+10, hy+116, subW-20, 36, vent ? 'Seal airlocks' : 'Vent airlocks', () => { if(!canDoors(s)){ toast('Door control is down.'); return; } for(const d of s.doors) if(d.b<0) d.open = !vent; }, { s:13, col:C.cyan, fill:vent });
  btn(hx+10, hy+158, (subW-30)/2, 36, 'Stations', () => returnToStations(s), { s:13 });
  btn(hx+20+(subW-30)/2, hy+158, (subW-30)/2, 36, G.crewAuto ? 'Auto on' : 'Auto off', () => { G.crewAuto = !G.crewAuto; toast(G.crewAuto ? 'Crew autopilot on: idle crew handle damage, fires and boarders.' : 'Crew autopilot off.'); }, { s:13, fill:G.crewAuto, col:C.good });
  tip(hx+10, hy+158, subW-20, 36, 'Crew stations and autopilot', 'Stations sends everyone back to their posts. With autopilot on, idle crew repair damage, fight fires and boarders, visit the medbay when hurt, then return to their posts. Moving someone by hand makes that room their new post.');
  if(s.systems.battery){ const b = s.battery; btn(hx+10, hy+200, subW-20, 36, b.t>0 ? `Battery ${b.t.toFixed(0)}s` : b.cd>0 ? `Recharging ${Math.ceil(b.cd)}s` : 'Battery boost', () => activateBattery(s), { s:13, col:C.warn, disabled:!canBattery(s) }); }
  if(s.systems.teleporter){ btn(hx+10, hy+242, subW-20, 32, 'Gather at teleporter', () => { const tr = roomOf(s,'teleporter'); let n = 0; for(const c of s.crew){ if(!controlled(c) || n>=4) continue; if(c.room===roomOf(s,'piloting')) continue; if(orderMove(s, c, tr)) n++; } if(!n) toast('No free crew to send.'); }, { s:12, col:'#c6e05a' }); }
}
function drawArmory(){
  const s = G.ship, x = 944, y = 652, w = 632, h = 328;
  panel(x,y,w,h);
  label('Weapons', x+16, y+28, C.hostile, 'left', 16);
  T(`${weaponPowerUsed(s)}/${eff(s,'weapons')} pwr · ${G.missiles} msl`, x+120, y+28, { s:14, c:C.muted });
  if(G.enemy && !G.enemy.dead){ const ready = s.weapons.filter(w => w.on && w.charge >= (DATA.weapons[w.id]?.charge||1) && ['laser','flak','ion'].includes(DATA.weapons[w.id]?.type)).reduce((t,w)=>t+(DATA.weapons[w.id].shots||1),0); if(G.hold || ready) T(`${ready} shot${ready===1?'':'s'} ready vs ${G.enemy.shield} shield${G.enemy.shield===1?'':'s'}`, x+120, y+212, { s:13, c: ready > G.enemy.shield ? C.good : C.warn }); }
  btn(x+w-150, y+8, 136, 30, G.autofire ? 'Autofire on' : 'Autofire off', () => { G.autofire = !G.autofire; }, { s:13, fill:G.autofire, col:C.hostile });
  btn(x+w-296, y+8, 136, 30, G.hold ? 'Fire volley' : 'Hold fire', () => { G.hold = !G.hold; }, { s:13, fill:!!G.hold, col:C.warn });
  const slots = R.weaponSlots, gap = 8, cw = (w - 28 - gap*(slots-1))/slots, ch = 152;
  for(let i=0;i<slots;i++){
    const cx = x+14 + i*(cw+gap), cy = y+44, wp = s.weapons[i];
    if(!wp){ rr(cx,cy,cw,ch,8); ctx.setLineDash([6,6]); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); T('Empty', cx+cw/2, cy+ch/2, { s:14, a:'center', c:C.muted }); continue; }
    const d = DATA.weapons[wp.id]; if(!d) continue; const sel = UI.selWeapon===i, ready = wp.on && wp.charge >= d.charge;
    rr(cx,cy,cw,ch,8); ctx.fillStyle = sel ? hexA(C.amber,.14) : C.panel2; ctx.fill(); ctx.lineWidth = sel?3:1.5; ctx.strokeStyle = sel ? C.amber : wp.on ? hexA(C.amber,.5) : C.line; ctx.stroke();
    para(`${i+1} ${d.name}`, cx+8, cy+20, cw-14, { s:14, f:FD, w:700, lh:16, max:2, c: wp.on ? C.ink : C.muted });
    tip(cx, cy, cw, 96, d.name, `${d.type}. ${d.heal ? 'Heals '+d.heal+' per crew.' : d.type==='bomb' ? (d.sysDamage||0)+' system damage, ignores shields.' : (d.damage||0)+' damage × '+(d.shots||1)+(d.type==='beam' ? ', hits '+(d.rooms||2)+' rooms' : '')+'.'} ${d.power} power, ${d.charge}s charge.${d.fire?' Can start fires.':''}${d.breach?' Can breach hulls.':''}${d.type==='missile'?' Ignores shields, uses a missile.':''}${d.type==='ion'?' Drains shields and systems.':''}${d.desc?' '+d.desc:''}`);
    const tc = d.type==='missile'||d.type==='bomb' ? '#ffffff' : d.type==='ion' ? C.cyan : d.type==='beam' ? C.violet : d.type==='flak' ? C.warn : C.amber;
    label(d.type, cx+8, cy+52, tc, 'left', 11);
    T(d.heal ? `heal ${d.heal}` : d.type==='bomb' ? `${d.sysDamage||0} sys` : `${d.damage}×${d.shots||1}`, cx+cw-8, cy+52, { s:12, a:'right', c:C.muted });
    for(let p=0;p<d.power;p++){ rr(cx+8+p*16, cy+58, 13, 9, 2); ctx.fillStyle = wp.on ? C.amber : C.line; ctx.fill(); }
    bar(cx+8, cy+72, cw-16, 9, wp.charge/d.charge, ready ? C.good : C.amber);
    T(!wp.on ? 'Off' : ready ? (wp.target==null ? 'Ready' : 'Firing') : `${(d.charge-wp.charge).toFixed(1)}s`, cx+8, cy+96, { s:12, c: ready ? C.good : C.muted });
    btn(cx+6, cy+102, cw-12, 22, wp.on ? 'Power off' : 'Power on', () => {
      if(wp.on){ wp.on = false; wp.target = null; if(UI.selWeapon===i) UI.selWeapon = null; }
      else if(eff(s,'weapons') - weaponPowerUsed(s) >= d.power) wp.on = true;
      else toast('Not enough weapon power. Add power to Weapons.'); }, { s:12, col: wp.on ? C.muted : C.amber });
    btn(cx+6, cy+127, cw-12, 22, wp.target!=null ? 'Clear' : (sel ? 'Pick room' : 'Target'), () => {
      if(wp.target!=null){ wp.target = null; UI.selWeapon = null; }
      else if(!wp.on) toast('Power the weapon first.');
      else if(!G.enemy && !d.heal) toast('No enemy to target.');
      else { UI.selWeapon = sel ? null : i; UI.mode = null; UI.selCrew = null; } }, { s:12, col:C.hostile, fill: sel });
  }
  const dy = y+222;
  label('Drones', x+16, dy, '#f0a6ff', 'left', 15);
  if(!s.systems.drones){ T('No drone system installed.', x+120, dy, { s:14, c:C.muted }); if(!s.drones.length) return; }
  else T(`${dronePowerUsed(s)}/${eff(s,'drones')} power · ${G.parts} parts`, x+120, dy, { s:14, c:C.muted });
  const ds = R.droneSlots, dw = (w - 28 - 8*(ds-1))/ds;
  for(let i=0;i<ds;i++){
    const cx = x+14 + i*(dw+8), cy = dy+10, dr = s.drones[i];
    if(!dr){ rr(cx,cy,dw,86,8); ctx.setLineDash([6,6]); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); continue; }
    const bp = DATA.drones[dr.id]; if(!bp) continue;
    rr(cx,cy,dw,86,8); ctx.fillStyle = C.panel2; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = dr.on ? '#f0a6ff' : C.line; ctx.stroke();
    T(bp.name, cx+8, cy+20, { s:13, f:FD, w:700, c: dr.on ? C.ink : C.muted });
    tip(cx, cy, dw, 44, bp.name, `${bp.kind} drone, ${bp.power} power. ${{attack:'Orbits the enemy and fires on its rooms.',defense:'Shoots down incoming missiles and drones.',anti:'Hunts enemy drones.',internal:bp.role==='repair'?'Walks your ship repairing systems.':'Walks your ship fighting intruders.',boarding:'Rams the enemy and fights inside it.',hull:'Repairs hull out of combat.'}[bp.kind]||''} ${bp.desc||''}`);
    for(let p=0;p<bp.power;p++){ rr(cx+8+p*14, cy+28, 11, 8, 2); ctx.fillStyle = dr.on ? '#f0a6ff' : C.line; ctx.fill(); }
    const status = !dr.on ? (bp.kind==='hull' ? 'Use out of combat' : 'Off') : dr.unit ? 'Deployed' : (G.parts<=0 && !hasAug(s,'recovery')) ? 'No parts!' : ['attack','defense','anti','boarding'].includes(bp.kind) && !G.enemy ? 'Waits for combat' : 'Deploying';
    T(status, cx+dw-8, cy+36, { s:11, a:'right', c: dr.unit ? C.good : C.muted });
    btn(cx+6, cy+48, dw-12, 30, dr.on ? 'Power off' : (bp.kind==='hull' ? 'Use' : 'Power on'), () => {
      if(dr.on){ dr.on = false; removeDrone(s, dr); }
      else if(!s.systems.drones) toast('Install a Drone system first.');
      else if(eff(s,'drones') - dronePowerUsed(s) < bp.power) toast('Not enough drone power.');
      else dr.on = true; }, { s:13, col:'#f0a6ff' });
  }
}
function unitPos(u){ const s = shipBySide(u.orbit); const b = s?._b; if(!b) return { x:800, y:330 };
  const cx = (b.x0+b.x1)/2, cy = (b.y0+b.y1)/2, rx = (b.x1-b.x0)/2 + b.nose*.6 + 40, ry = (b.y1-b.y0)/2 + 44;
  return { x: cx + Math.cos(u.ang)*rx, y: cy + Math.sin(u.ang)*ry }; }
function drawUnits(){ const t = G.time; for(const u of G.units){ const p = unitPos(u); u._x = p.x; u._y = p.y; const bp = DATA.drones[u.bp];
  const col = u.side==='p' ? (bp?.kind==='defense' ? C.cyan : '#f0a6ff') : C.hostile;
  glow(p.x, p.y, 16, col, .45);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(u.ang + Math.PI/2);
  ctx.fillStyle = '#2a3150'; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-8,8); ctx.lineTo(-4,0); ctx.lineTo(-8,-8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(2,0,2.5,0,7); ctx.fill();
  ctx.strokeStyle = hexA(col,.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0,0,14,t*6,t*6+1); ctx.stroke(); ctx.restore(); } }

function projOrigin(p){
  if(p._ox==null){
    if(p.unit){ const u = G.units.find(x=>x.id===p.unit); if(u && u._x!=null){ p._ox = u._x; p._oy = u._y; } }
    if(p._ox==null && p.from==='h'){ p._ox = rand(200, 1400); p._oy = -20; }
    if(p._ox==null){ const s = shipBySide(p.from); const g = s ? gunPoint(s) : { x:800, y:-20 }; p._ox = g.x; p._oy = g.y; }
  }
  return { x:p._ox, y:p._oy };
}
function drawProjectiles(){
  const live = !G.paused && !G.modal;
  for(const p of G.proj){
    if(p.t<0) continue;
    const dst = shipBySide(p.to); if(!dst) continue;
    const a = projOrigin(p), d = p.d, k = clamp(p.t/p.dur,0,1), kind = projKind(p);
    let b = roomCenter(dst, p.room);
    const blockable = (dst.shield>0 && ['laser','ion','flak'].includes(d.type)) || (dst.super>0 && d.type!=='bomb');
    if(blockable && dst._shieldE){ const e = ellipseEdge(dst, a.x, a.y); if(e) b = e; }
    if(d.type==='beam'){
      const col = d.fire ? C.fire : d.crewDamage ? C.good : C.violet; const wob = Math.sin(G.time*60)*2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for(const r of (p.rooms||[p.room])){ let c = roomCenter(dst, r); if(blockable && dst._shieldE){ const e = ellipseEdge(dst, a.x, a.y); if(e) c = e; }
        ctx.strokeStyle = hexA(col, .35*(1-k*.5)); ctx.lineWidth = 16*(1-k)+4; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y+wob); ctx.stroke();
        ctx.strokeStyle = hexA('#ffffff', .9*(1-k*.6)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y+wob); ctx.stroke();
        ctx.drawImage(glowSprite(col), c.x-26, c.y-26, 52, 52); if(live && Math.random()<.4) sparks(c.x, c.y, col, 2); }
      ctx.drawImage(glowSprite(col), a.x-20, a.y-20, 40, 40); ctx.restore(); p._x = b.x; p._y = b.y; continue; }
    if(d.type==='bomb' || d.heal){ const col = d.heal ? C.good : '#ffffff'; ctx.beginPath(); ctx.arc(b.x, b.y, 8 + k*24, 0, 7); ctx.strokeStyle = hexA(col, 1-k); ctx.lineWidth = 3; ctx.stroke(); glow(b.x, b.y, 30*(1-k)+8, d.heal ? C.good : C.violet, .6); p._x = b.x; p._y = b.y; continue; }
    const arc = (d.type==='missile' || kind==='hack' || kind==='bdrone') ? 50 : 0;
    const x = a.x + (b.x-a.x)*k, y = a.y + (b.y-a.y)*k - Math.sin(k*Math.PI)*arc; p._x = x; p._y = y;
    const kk = Math.max(0,k-.03), px_ = a.x + (b.x-a.x)*kk, py_ = a.y + (b.y-a.y)*kk - Math.sin(kk*Math.PI)*arc;
    const ang = Math.atan2(y-py_, x-px_);
    if(kind==='asteroid'){ ctx.save(); ctx.translate(x,y); ctx.rotate(G.time*2 + (p.id?.charCodeAt?.(0)||0)); drawRock(ctx, 0, 0, 9, srng(hashStr(p.id||'a'))); ctx.restore(); if(live && Math.random()<.4) trail(x, y, '#6a6055'); continue; }
    if(kind==='hack' || kind==='bdrone'){ const col = kind==='hack' ? '#ff9de2' : '#f0a6ff'; glow(x,y,16,col,.6); ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.fillStyle = '#2a3150'; ctx.fillRect(-8,-5,16,10); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(-8,-5,16,10); ctx.restore(); if(live) trail(x, y, '#9a8ab0'); continue; }
    const col = d.type==='ion' ? C.cyan : d.type==='missile' ? '#ffd9a0' : d.type==='flak' ? C.warn : (p.from==='p' ? C.amber : C.hostile);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if(d.type==='missile'){ ctx.restore(); if(live){ trail(x - Math.cos(ang)*8, y - Math.sin(ang)*8); } glow(x - Math.cos(ang)*9, y - Math.sin(ang)*9, 14, '#ff8a3d', .8);
      ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.fillStyle = '#d8dce8'; ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(3,-3.5); ctx.lineTo(-8,-3.5); ctx.lineTo(-8,3.5); ctx.lineTo(3,3.5); ctx.closePath(); ctx.fill(); ctx.fillStyle = C.hostile; ctx.fillRect(-8,-5,4,10); ctx.restore(); continue; }
    if(d.type==='ion'){ ctx.drawImage(glowSprite(C.cyan), x-16, y-16, 32, 32); ctx.strokeStyle = 'rgba(200,250,255,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); for(let i=0;i<3;i++){ const r1 = Math.random()*6.28; ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(r1)*12, y+Math.sin(r1)*12); } ctx.stroke(); ctx.restore(); continue; }
    if(d.type==='flak'){ for(let i=0;i<3;i++){ ctx.drawImage(glowSprite(C.warn), x-8+i*5-5, y-8+(i%2)*6-3, 14, 14); } ctx.restore(); continue; }
    const tail = 26; ctx.strokeStyle = hexA(col,.55); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang)*tail, y - Math.sin(ang)*tail); ctx.lineTo(x,y); ctx.stroke();
    ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang)*tail*.7, y - Math.sin(ang)*tail*.7); ctx.lineTo(x,y); ctx.stroke();
    ctx.drawImage(glowSprite(col), x-14, y-14, 28, 28); ctx.restore();
  }
}

function drawFX(){
  for(const f of G.fx){ const k = f.t/1.1;
    if(f.type==='boom'){ glow(f.x, f.y, 20 + k*50, '#ff8a3d', (1-k)*.6); }
    else if(f.type==='shield' || f.type==='super'){ const col = f.type==='super' ? C.good : C.cyan; ctx.beginPath(); ctx.arc(f.x,f.y, 10 + k*50, 0, 7); ctx.strokeStyle = hexA(col, 1-k); ctx.lineWidth = 5*(1-k)+1; ctx.stroke(); glow(f.x, f.y, 40*(1-k)+10, col, (1-k)*.8); }
    else if(f.type==='ion' || f.type==='tele'){ const col = f.type==='tele' ? '#c6e05a' : C.cyan; ctx.beginPath(); ctx.arc(f.x,f.y, 14 + k*50, 0, 7); ctx.strokeStyle = hexA(col, (1-k)*.9); ctx.lineWidth = 6; ctx.stroke(); glow(f.x, f.y, 50*(1-k), col, .5); }
    else if(f.type==='heal'){ ctx.beginPath(); ctx.arc(f.x,f.y, 14 + k*50, 0, 7); ctx.strokeStyle = hexA(C.good, (1-k)*.9); ctx.lineWidth = 6; ctx.stroke(); glow(f.x, f.y, 40*(1-k), C.good, .5); }
    else if(f.type==='zap'){ ctx.beginPath(); ctx.arc(f.x,f.y, 6 + k*24, 0, 7); ctx.strokeStyle = hexA(C.cyan, 1-k); ctx.lineWidth = 3; ctx.stroke(); glow(f.x, f.y, 24*(1-k), '#ffffff', .7); }
    else if(f.type==='text'){ ctx.globalAlpha = 1-k; T(f.text, f.x, f.y - k*40, { s:24, f:FD, w:700, a:'center', c: f.text==='MISS' || f.text==='RESISTED' ? C.ink : C.hostile }); ctx.globalAlpha = 1; } }
  drawParts();
}

/* ---------------- modals ---------------- */
function mframe(w,h,title,col=C.amber,m){
  ctx.fillStyle = 'rgba(4,6,12,.74)'; ctx.fillRect(0,0,W,H); region(0,0,W,H,() => { if(m) m.skip = true; });
  const x = (W-w)/2, y = (H-h)/2; rr(x,y,w,h,14); const g = ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#131b36'); g.addColorStop(1,'#090e1d'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
  ctx.save(); rr(x,y,w,h,14); ctx.clip(); const hg = ctx.createLinearGradient(x,0,x+w,0); hg.addColorStop(0,hexA(col,.25)); hg.addColorStop(1,hexA(col,0)); ctx.fillStyle = hg; ctx.fillRect(x,y,w,68); ctx.fillStyle = hexA(col,.5); ctx.fillRect(x,y+68,w,1.5); ctx.restore();
  corners(x-5,y-5,w+10,h+10,col,18);
  if(title) T(title.toUpperCase(), x+32, y+46, { s:24, f:FD, w:700, c:col, ls:3 });
  TIP_MODAL = true;
  return { x, y, w, h };
}

function drawModal(){
  const m = G.modal;
  switch(m.type){
    case 'msg': { const f = mframe(960, clamp(230 + lines(m.text||'', 896, `400 21px ${FM}`).length*31, 340, 560), m.title, C.amber, m); const txt = fillText(m.text, m.ctx||{ crew:randomCrewName() }); m.ctx = m.ctx || { crew:randomCrewName() }; const sh_ = typed(m, txt);
      para(sh_, f.x+32, f.y+110, f.w-64, { s:21, lh:31 });
      if(sh_.length===txt.length) btn(f.x+f.w-332, f.y+f.h-92, 300, 62, m.btn || 'Continue', () => { G.modal = null; if(m.then) m.then(); }, { fill:true }); else T('Click to skip', f.x+f.w-32, f.y+f.h-24, { s:14, a:'right', c:C.muted }); break; }
    case 'event': drawEventModal(m); break;
    case 'result': { const f = mframe(960, clamp(220 + lines(m.text||'', 896, `400 21px ${FM}`).length*31 + Math.min(8,(m.lines||[]).length)*32, 360, 620), m.title||'Outcome', C.amber, m); const sh_ = typed(m, m.text||''); const hgt = para(sh_, f.x+32, f.y+110, f.w-64, { s:21, lh:31 });
      if(sh_.length===(m.text||'').length){ (m.lines||[]).slice(0,8).forEach((l,i) => T('› ' + l, f.x+32, f.y+146 + hgt + i*32, { s:19, c: /^-|lost|damaged|fire|injured|closer/i.test(l) ? C.hostile : C.good }));
        btn(f.x+f.w-332, f.y+f.h-92, 300, 62, 'Continue', () => closeResult(m), { fill:true }); } else T('Click to skip', f.x+f.w-32, f.y+f.h-24, { s:14, a:'right', c:C.muted }); break; }
    case 'map': drawMapModal(); break;
    case 'store': drawStoreModal(m); break;
    case 'ship': drawShipModal(); break;
    case 'exit': { const opts = m.opts||[]; const f = mframe(Math.max(1000, opts.length*400+64), 520, 'Exit beacon', C.good);
      para(G.sector+1 >= R.sectors ? 'One jump left: the Last Stand, where the Flaggship waits.' : opts.includes('glass') ? 'Your nav computer shows the usual routes, and one that should not exist.' : 'Two routes lead on. Choose the next sector. You cannot come back.', f.x+32, f.y+104, f.w-64, { s:20 });
      const cw = (f.w-64-(opts.length-1)*20)/opts.length;
      opts.forEach((t,i) => { const sd = DATA.sectors[t]; const bx = f.x+32 + i*(cw+20), by = f.y+160;
        const art = eventArt(sd.secret ? 'glass' : sd.nebula>.3 ? 'nebula' : sd.final ? 'fleet' : 'planet', t, Math.floor(cw), 90);
        rr(bx, by, cw, 240, 10); ctx.fillStyle = C.panel2; ctx.fill(); ctx.save(); rr(bx, by, cw, 90, 10); ctx.clip(); ctx.drawImage(art, bx, by); ctx.restore(); ctx.strokeStyle = sd.color||C.cyan; ctx.lineWidth = 2; rr(bx, by, cw, 240, 10); ctx.stroke();
        T(sd.name, bx+18, by+124, { s:21, f:FD, w:700, c:sd.color||C.cyan });
        const mix = sd.mix||{}; T(`Fights ${mix.combat||0}% · Events ${mix.event||0}% · Stores ${mix.store||0}%`, bx+18, by+152, { s:13, c:C.muted });
        T(sd.secret ? 'Uncharted. Unknown.' : sd.nebula>.3 ? 'Nebula: no sensors, slower fleet' : sd.final ? 'The Flaggship and Fedoration command' : `Expect: ${(sd.enemyTags||[]).join(', ') || 'anyone'}`, bx+18, by+174, { s:13, c:C.muted });
        btn(bx+16, by+184, cw-32, 46, `Jump to sector ${G.sector+1}`, () => nextSector(t), { fill:true, col:sd.color||C.good, s:17 }); });
      btn(f.x+f.w-232, f.y+f.h-82, 200, 56, 'Stay here', () => { G.modal = null; }); break; }
    case 'stranded': { const f = mframe(940, 420, 'Out of fuel', C.hostile);
      para('The tanks are dry. You can broadcast a distress call for fuel, but the Rebuff Fleet will hear it too and close in.', f.x+32, f.y+104, f.w-64, { s:21 });
      btn(f.x+32, f.y+f.h-92, 420, 62, 'Broadcast distress call', () => { G.fuel += 3; G.fleetX += .3; G.modal = { type:'msg', title:'Signal answered', text:'A passing trader sells you 3 fuel cells at a mercy price. The fleet is much closer now.', btn:'Open map', then:openMap }; }, { fill:true, col:C.hostile });
      btn(f.x+f.w-252, f.y+f.h-92, 220, 62, 'Not yet', () => { G.modal = null; }); break; }
    case 'surrender': { const f = mframe(940, 470, 'They surrender', C.good);
      const parts = []; const o = m.offer; if(o.scrap) parts.push(`${o.scrap} scrap`); if(o.fuel) parts.push(`${o.fuel} fuel`); if(o.missiles) parts.push(`${o.missiles} missiles`); if(o.parts) parts.push(`${o.parts} drone parts`); if(o.weapon) parts.push('a weapon');
      const y2 = para(m.line || '"Enough!"', f.x+32, f.y+104, f.w-64, { s:21, c:C.ink });
      para(`The ${m.name} offers ${parts.join(', ')} if you let them go.`, f.x+32, f.y+120+y2, f.w-64, { s:19, c:C.muted });
      btn(f.x+32, f.y+f.h-92, 340, 62, 'Accept surrender', () => { G.modal = null; finishCombat('surrender', o); }, { fill:true, col:C.good });
      btn(f.x+f.w-332, f.y+f.h-92, 300, 62, 'Keep firing', () => { G.modal = null; }, { col:C.hostile }); break; }
  }
}

function drawEventModal(m){
  const base = DATA.events[m.id]; const ev = m.inline || base; if(!ev){ G.modal = null; return; }
  const node = G.map?.nodes[G.map.cur];
  const title = m.combat ? 'Incoming hail' : (node?.quest===m.id || base?.questOnly) ? 'Quest beacon' : (base?.distress || node?.distress) ? 'Distress beacon' : 'Beacon';
  m.ctx = m.ctx || { crew:randomCrewName() }; m.who = m.who || {};
  const fullText = fillText(ev.text, m.ctx);
  const visChoices = ev.choices.filter(c => !(reqHidden(c.req) && !reqMet(c.req)));
  let need = 272 + lines(fullText, 1056, `400 20px ${FM}`).length*29 + 16 + (m.lines ? Math.min(4, m.lines.length)*26 + 4 : 0);
  for(const c of visChoices){ const rk = c.req?.race || '_'; if(!m.who[rk]) m.who[rk] = c.req?.race ? randomCrewName(c.req.race) : m.ctx.crew;
    need += lines(`1. ${reqLabel(c.req)}${fillText(c.text, Object.assign({}, m.ctx, { who:m.who[rk] }))}${costLabel(c.cost, c.text)}`, 1010, `400 19px ${FM}`).length*27 + 32; }
  const f = mframe(1120, clamp(need + 30, 480, 940), title, m.combat ? C.hostile : C.amber, m);
  const ak = artFor(base || ev, m); const art = eventArt(ak, (m.id||'x') + (m.inline ? ':' + (ev.text||'').length : ''), 1056, 150);
  ctx.drawImage(art, f.x+32, f.y+84); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.strokeRect(f.x+32, f.y+84, 1056, 150);
  if(m.combat && G.enemy?._art){ const a = G.enemy._art.c; const sc = Math.min(560/a.width, 140/a.height); const w = a.width*sc, h = a.height*sc; ctx.drawImage(a, f.x+32+1056-w-20, f.y+84+(150-h)/2, w, h); glow(f.x+32+1056-w*.2, f.y+84+75, 60, C.hostile, .15); }
  let y = f.y + 272;
  const text = fillText(ev.text, m.ctx); const shown = typed(m, text); const done = shown.length===text.length;
  y += para(shown, f.x+32, y, f.w-64, { s:20, lh:29 });
  if(!done){ T('Click to skip', f.x+f.w-32, f.y+f.h-24, { s:14, a:'right', c:C.muted }); return; }
  if(m.lines && m.lines.length){ y += 4; for(const l of m.lines.slice(0,4)){ T('› ' + l, f.x+32, y+4, { s:17, c: /^-|lost|injured|fire|closer/i.test(l) ? C.hostile : C.good }); y += 26; } }
  y += 12;
  const choices = visChoices;
  choices.forEach((c,i) => {
    const ok = reqMet(c.req), blue = reqHidden(c.req);
    const rk = c.req?.race || '_'; if(!m.who[rk]) m.who[rk] = c.req?.race ? randomCrewName(c.req.race) : m.ctx.crew;
    const txt = `${i+1}. ${reqLabel(c.req)}${fillText(c.text, Object.assign({}, m.ctx, { who:m.who[rk] }))}${costLabel(c.cost, c.text)}`;
    const ls = lines(txt, f.w-110, `400 19px ${FM}`); const h = ls.length*27 + 22;
    const hov = ok && hovered(f.x+32, y, f.w-64, h);
    rr(f.x+32, y, f.w-64, h, 8); const g = ctx.createLinearGradient(f.x, 0, f.x+f.w, 0); g.addColorStop(0, hov ? hexA(blue?C.cyan:C.amber,.22) : '#18203c'); g.addColorStop(1, '#0f1529'); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = hov?3:1.5; ctx.strokeStyle = !ok ? C.line : blue ? C.cyan : (hov?C.amber:C.line); ctx.stroke();
    if(hov){ ctx.fillStyle = blue ? C.cyan : C.amber; ctx.fillRect(f.x+32, y+4, 4, h-8); }
    ls.forEach((l,k) => T(l, f.x+54, y+31+k*27, { s:19, c: !ok ? C.muted : blue ? C.cyan : C.ink }));
    if(ok) region(f.x+32, y, f.w-64, h, () => chooseOption(c));
    y += h + 10;
  });
}

function drawMapModal(){
  const f = mframe(1500, 920, `Sector ${G.sector} · ${sectorDef().name}`, C.cyan), nodes = G.map.nodes, cur = nodes[G.map.cur];
  const mx = n => f.x + 80 + n.x*(f.w-160), my = n => f.y + 130 + n.y*(f.h-270);
  const fleetPx = f.x + 80 + G.fleetX*(f.w-160);
  if(fleetPx > f.x){ ctx.fillStyle = hexA(C.hostile,.14); ctx.fillRect(f.x+2, f.y+90, Math.min(fleetPx-f.x, f.w-4), f.h-210);
    ctx.strokeStyle = C.hostile; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fleetPx, f.y+90); ctx.lineTo(fleetPx, f.y+f.h-120); ctx.stroke();
    label('Rebuff Fleet', Math.max(f.x+20, fleetPx-150), f.y+f.h-128, C.hostile, 'left', 14); }
  const nextPx = f.x + 80 + (G.fleetX + R.fleetSpeed*(sectorDef().fleetMult||1))*(f.w-160);
  ctx.setLineDash([8,8]); ctx.strokeStyle = hexA(C.hostile,.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nextPx, f.y+90); ctx.lineTo(nextPx, f.y+f.h-120); ctx.stroke(); ctx.setLineDash([]);
  nodes.forEach((n,i) => { if(n.nebula){ ctx.beginPath(); ctx.arc(mx(n), my(n), 46, 0, 7); ctx.fillStyle = hexA(C.nebula,.22); ctx.fill(); } });
  nodes.forEach((a,i) => a.links.forEach(j => { if(j<i) return; const b = nodes[j]; const live = (i===G.map.cur || j===G.map.cur);
    ctx.strokeStyle = live ? C.cyan : hexA(C.muted,.3); ctx.lineWidth = live?3:2; ctx.beginPath(); ctx.moveTo(mx(a),my(a)); ctx.lineTo(mx(b),my(b)); ctx.stroke(); }));
  const jumpable = canJump() && G.warp<=0, scan = hasAug(G.ship,'scanners');
  nodes.forEach((n,i) => {
    const x = mx(n), y = my(n), reach = cur.links.includes(i), isCur = i===G.map.cur, hov = reach && hovered(x-30,y-30,60,60);
    const flagHere = G.flag && G.flag.node===i;
    const col = flagHere ? C.hostile : n.type==='store' ? C.good : n.type==='exit'||n.type==='base' ? C.good : n.quest ? C.warn : n.distress ? C.warn : n.visited ? C.muted : C.ink;
    ctx.beginPath(); ctx.arc(x,y, hov?26:20, 0, 7); ctx.fillStyle = n.visited ? C.panel2 : C.room; ctx.fill(); ctx.lineWidth = reach ? 3 : 2; ctx.strokeStyle = col; ctx.stroke();
    if(isCur){ ctx.beginPath(); ctx.arc(x,y,32,0,7); ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.stroke(); }
    let tag = n.type==='store' ? 'STORE' : n.type==='exit' ? 'EXIT' : n.type==='base' ? `BASE ${G.flag?.baseHP??''}` : n.type==='start' ? 'START' : n.quest && !n.visited ? 'QUEST' : n.distress && !n.visited ? 'DISTRESS' : '';
    if(flagHere) tag = 'FLAGGSHIP';
    const known = scan || n.revealed; const inner = !n.visited && !['store','exit','base','start'].includes(n.type) ? (known ? (n.type==='combat' ? '!' : n.type==='event' ? '?' : '·') : '?') : '';
    if(inner) T(inner, x, y+1, { s:20, f:FD, w:700, a:'center', b:'middle', c: inner==='!' ? C.hostile : C.muted });
    if(tag) label(tag, x, y+48, col, 'center', 13);
    if(n.hazard && (scan || n.revealed || n.visited || reach)) label(HAZARDS[n.hazard].split(' ')[0], x, y-30, C.warn, 'center', 11);
    if(flagHere){ ctx.beginPath(); ctx.moveTo(x+26, y-8); ctx.lineTo(x+46, y); ctx.lineTo(x+26, y+8); ctx.closePath(); ctx.fillStyle = C.hostile; ctx.fill(); }
    if(n.x < G.fleetX && !isCur) { ctx.strokeStyle = C.hostile; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x-10,y-10); ctx.lineTo(x+10,y+10); ctx.moveTo(x+10,y-10); ctx.lineTo(x-10,y+10); ctx.stroke(); }
    if(reach && jumpable) region(x-30,y-30,60,60, () => jumpTo(i));
  });
  label(jumpable ? 'Choose a connected beacon. Each jump costs 1 fuel.' : 'The VTL drive must charge before you can jump out of combat.', f.x+32, f.y+f.h-46, jumpable ? C.muted : C.warn, 'left', 15);
  T(`Fuel ${G.fuel}`, f.x+f.w-330, f.y+f.h-44, { s:22, f:FD, w:700, c: G.fuel<=3?C.hostile:C.ink });
  btn(f.x+f.w-196, f.y+f.h-82, 160, 58, 'Close', () => { G.modal = null; });
}
function drawStoreModal(m){
  const node = G.map.nodes[m.node], st = node.store; const s = G.ship;
  const f = mframe(1440, 880, 'Store', C.good);
  if(!m.greet) m.greet = pick(STORE_GREETS[G.sectorType] || STORE_GREETS.civilian); T(m.greet, f.x+160, f.y+44, { s:16, c:C.muted });
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:26, f:FD, w:700, c:C.amber });
  tabs(f.x+32, f.y+76, [['weapons','Weapons'],['drones','Drones'],['augments','Augments'],['systems','Systems'],['supplies','Supplies'],['sell','Sell']], UI.storeTab, t => UI.storeTab = t, 186);
  const y0 = f.y+150, cx = f.x+32;
  const item = (i, name, sub, cost, onBuy, disabled, soldTxt) => { const y = y0 + i*112; panel(cx, y, f.w-64, 100, 8);
    T(name, cx+20, y+36, { s:22, f:FD, w:700, c: disabled && soldTxt ? C.muted : C.ink }); para(sub, cx+20, y+64, 1000, { s:15, lh:20, c:C.muted, max:2 });
    btn(cx+f.w-300, y+24, 220, 54, soldTxt || `Buy · ${cost}`, onBuy, { disabled: disabled || G.scrap < cost, fill:!disabled && G.scrap>=cost, col:C.good }); };
  switch(UI.storeTab){
    case 'weapons': st.weapons.forEach((id,i) => { const d = DATA.weapons[id]; if(!d) return; const sold = st.sold.includes('w:'+id); const c = price(d.cost, st);
      item(i, d.name, `${d.type} · ${d.heal ? 'heals '+d.heal : d.type==='bomb' ? (d.sysDamage||0)+' system damage' : d.damage+' damage × '+(d.shots||1)} · ${d.power} power · ${d.charge}s${d.fire?' · fire':''}${d.breach?' · breach':''}${d.desc?' · '+d.desc:''}`, c,
        () => buy(c, () => { st.sold.push('w:'+id); toast(giveWeapon(id)); }), sold, sold ? 'Sold' : null); }); break;
    case 'drones': if(!s.systems.drones) T('Your ship has no Drone system yet. Install one from the Systems tab to use these.', cx, y0+300, { s:17, c:C.warn });
      st.drones.forEach((id,i) => { const d = DATA.drones[id]; if(!d) return; const sold = st.sold.includes('d:'+id); const c = price(d.cost, st);
      item(i, d.name, `${d.kind} drone · ${d.power} power${d.desc?' · '+d.desc:''}`, c, () => buy(c, () => { st.sold.push('d:'+id); toast(giveDrone(id)); }), sold, sold ? 'Sold' : null); }); break;
    case 'augments': st.augments.forEach((id,i) => { const a = DATA.augments[id]; if(!a) return; const sold = st.sold.includes('a:'+id) || s.augments.includes(id); const c = price(a.cost, st);
      item(i, a.name, a.desc||'', c, () => { if(s.augments.length>=R.augmentSlots){ toast('All augment slots are full. Sell one first.'); return; } buy(c, () => { st.sold.push('a:'+id); toast(giveAugment(id)); }); }, sold, sold ? 'Owned' : null); });
      T(`Augment slots: ${s.augments.length}/${R.augmentSlots}`, cx, y0+260, { s:16, c:C.muted }); break;
    case 'systems': st.systems.forEach((k,i) => { const have = !!s.systems[k]; const c = price(INSTALL[k]||60, st);
      const clash = (k==='clonebay' && s.systems.medbay) || (k==='medbay' && s.systems.clonebay);
      item(i, `${SYSN[k]} system`, clash ? 'You can only have a Medbay or a Clone Bay, not both.' : sysDesc(k), c, () => buy(c, () => { installSystem(s, k); toast(`${SYSN[k]} installed.`); }), have || clash, have ? 'Installed' : clash ? 'Unavailable' : null); });
      if(!st.systems.length) T('No new systems for sale here.', cx, y0+40, { s:18, c:C.muted }); break;
    case 'supplies': {
      const rows = [ ['Fuel cell', 'One jump\'s worth.', 3, () => G.fuel++], ['Missile', 'Ammo for missiles and bombs.', 6, () => G.missiles++], ['Drone part', 'Each drone deployment and hacking drone uses one.', 8, () => G.parts++],
        ['Hull repair ×1', `Hull ${s.hull}/${s.maxHull}`, 2 + Math.floor((G.sector-1)/3), () => { s.hull = Math.min(s.maxHull, s.hull+1); }, s.hull>=s.maxHull], ['Hull repair ×5', `Hull ${s.hull}/${s.maxHull}`, 5*(2 + Math.floor((G.sector-1)/3)) - 1, () => { s.hull = Math.min(s.maxHull, s.hull+5); }, s.hull>=s.maxHull] ];
      rows.forEach((r,i) => { const c = price(r[2], st); const y = y0 + i*82; panel(cx, y, 640, 72, 8); T(r[0], cx+20, y+32, { s:20, f:FD, w:700 }); T(r[1], cx+20, y+56, { s:14, c:C.muted });
        btn(cx+420, y+12, 200, 48, `Buy · ${c}`, () => buy(c, r[3]), { disabled: r[4] || G.scrap < c, col:C.good }); });
      const race = DATA.races[st.crewRace]; const rx = cx+680; panel(rx, y0, 680, 300, 8); label('Crew for hire', rx+20, y0+34, C.muted);
      const crewN = s.crew.filter(c=>c.owner==='p'&&!c.drone).length; const cc = price(50, st);
      if(race && !st.crewSold){ if(!st._cand || st._cand.race!==(DATA.races[st.crewRace]?st.crewRace:'human')) st._cand = newCrew(st.crewRace, 'p'); const cand = st._cand; ensureLook(cand);
        drawPortrait(rx+60, y0+120, 40, cand, false);
        T(cand.name, rx+120, y0+92, { s:26, f:FD, w:700 }); T(`${race.name} · ${pronouns(cand)}`, rx+120, y0+120, { s:16, c:race.color||C.ink }); para(race.desc||'', rx+120, y0+148, 540, { s:15, lh:20, c:C.muted });
        btn(rx+20, y0+220, 240, 54, `Hire · ${cc}`, () => buy(cc, () => { const nc = addCrew(s, st.crewRace, 'p', cand.name); nc.gender = cand.gender; nc.look = cand.look; st.crewSold = true; checkCrewAch(); }), { disabled: G.scrap<cc || crewN>=R.maxCrew, fill:G.scrap>=cc && crewN<R.maxCrew, col:C.good });
        if(crewN>=R.maxCrew) T('Crew quarters are full.', rx+280, y0+254, { s:15, c:C.warn }); }
      else T('Nobody else is looking for work.', rx+20, y0+80, { s:18, c:C.muted });
      break; }
    case 'sell': {
      const items = [...(s.cargo||[]).map((c,i)=>({ ...c, src:'cargo', i })), ...s.augments.map((a,i)=>({ kind:'augment', id:a, src:'aug', i }))];
      if(!items.length) T('Nothing to sell. Move weapons or drones to cargo from the Ship screen first.', cx, y0+40, { s:18, c:C.muted });
      items.slice(0,6).forEach((it, k) => { const d = it.kind==='weapon' ? DATA.weapons[it.id] : it.kind==='drone' ? DATA.drones[it.id] : DATA.augments[it.id]; const v = sellValue(it.kind, it.id);
        const y = y0 + k*96; panel(cx, y, f.w-64, 84, 8); T(d?.name || it.id, cx+20, y+36, { s:20, f:FD, w:700 }); T(it.kind, cx+20, y+62, { s:14, c:C.muted });
        btn(cx+f.w-300, y+16, 220, 52, `Sell · ${v}`, () => { if(it.src==='cargo') s.cargo.splice(it.i,1); else s.augments.splice(it.i,1); G.scrap += v; sfx('buy'); save(); }, { col:C.amber }); });
      break; }
  }
  btn(f.x+f.w-232, f.y+f.h-80, 200, 56, 'Leave', () => { G.modal = null; save(); });
}
function sysDesc(k){ return { shields:'Every 2 power gives one shield layer that blocks a shot and recharges.', engines:'More power means more evasion. Needs a pilot at the helm.', oxygen:'Keeps the air breathable in every room.', weapons:'Powers your weapons. Each weapon needs its own power.', piloting:'Someone must sit at the helm to dodge and to charge the jump drive. Higher levels add an autopilot.', drones:'Power drones that fight, defend, repair or board.', teleporter:'Send up to 4 crew to the enemy ship and bring them back.', cloaking:'Vanish: +60% evasion and enemy weapons stop charging.',
  hacking:'Attach a drone to an enemy system, then pulse it to shut it down.', mindcontrol:'Turn an enemy crew member to your side for a while.', medbay:'Heals crew standing inside it.', clonebay:'Brings dead crew back after a short delay.',
  battery:'A backup battery that adds temporary reactor power.', sensors:'See inside enemy ships: damage at level 1, crew at 2, weapon charge at 3.', doors:'Lets you open and close doors. Stronger doors slow boarders.' }[k] || ''; }
function drawShipModal(){
  const s = G.ship, f = mframe(1440, 880, s.name);
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:26, f:FD, w:700, c:C.amber });
  tabs(f.x+32, f.y+76, [['systems','Systems'],['crew','Crew'],['gear','Weapons & drones'],['augments','Augments'],['log','Captain\'s log']], UI.tab, t => UI.tab = t, 220);
  const y0 = f.y+146, cx = f.x+32;
  if(UI.tab==='systems'){
    const sysRow = (k, x, y) => { const sy = s.systems[k], capL = CAPS[k]||8, cost = upgradeCost(k, sy.max);
      T(SYSN[k], x, y+30, { s:20, f:FD, w:700, c:SYSC[k] });
      for(let b=0;b<capL;b++){ rr(x+170+b*24, y+12, 19, 24, 3); ctx.fillStyle = b<sy.max ? SYSC[k] : C.panel2; ctx.fill(); }
      btn(x+380, y+6, 170, 44, sy.max>=capL ? 'Maxed' : `+1 · ${cost}`, () => buy(cost, () => { sy.max++; if(SUB.includes(k)) {} }), { disabled: sy.max>=capL || G.scrap<cost, s:16 }); };
    const main = MAIN.filter(k=>s.systems[k]), sub = SUB.filter(k=>s.systems[k]);
    label('Main systems', cx, y0+10, C.muted, 'left', 14); main.forEach((k,i) => sysRow(k, cx, y0+20 + i*58));
    const rx = f.x+740; label('Subsystems (no reactor power)', rx, y0+10, C.muted, 'left', 14); sub.forEach((k,i) => sysRow(k, rx, y0+20 + i*58));
    const ry = y0+40 + Math.max(sub.length,1)*58; const rc = reactorCost();
    T('Reactor', rx, ry+30, { s:20, f:FD, w:700, c:C.good }); T(`${s.reactor} bars`, rx+170, ry+30, { s:18 });
    btn(rx+380, ry+6, 170, 44, s.reactor>=25 ? 'Maxed' : `+1 · ${rc}`, () => buy(rc, () => { s.reactor++; }), { disabled: s.reactor>=25 || G.scrap<rc, s:16 });
    T('New systems can be installed at stores.', rx, ry+100, { s:15, c:C.muted });
  } else if(UI.tab==='crew'){
    const crew = []; for(const sh of [G.ship, G.enemy]) if(sh) for(const c of sh.crew) if(c.owner==='p' && !c.drone) crew.push(c);
    crew.forEach((c,i) => { const x = cx + (i%2)*690, y = y0 + Math.floor(i/2)*150, race = DATA.races[c.race]||{};
      panel(x, y, 670, 138, 8); drawPortrait(x+42, y+40, 28, c, false);
      T(c.name, x+82, y+38, { s:22, f:FD, w:700 }); T(`${race.name} · ${c.gender==='f'?'♀':'♂'} ${pronouns(c)} · ${Math.ceil(c.hp)}/${c.maxHp} hp · ${c.kills} kills`, x+82, y+62, { s:14, c:C.muted }); { const sh_ = [G.ship, G.enemy].find(q=>q && q.crew.includes(c)); const jb = crewJob(c, sh_); T(jb.text, x+82, y+80, { s:13, c:JOB_COL[jb.k]||C.ink, max:340 }); para(raceTraits(race), x+440, y+72, 220, { s:11, lh:14, c:C.cyan, max:1 }); }
      SKILLS.forEach((k,j) => { const lv = skillLvl(c,k), t = SKILLT[k], v = c.sk[k]||0; const sx = x+20 + j*106, sy = y+90;
        T(SKILLN[k], sx, sy+12, { s:12, c:C.muted }); bar(sx, sy+20, 96, 8, lv>=2 ? 1 : lv===1 ? .5 + .5*(v-t[0])/(t[1]-t[0]) : .5*v/t[0], lv>=2 ? C.amber : lv===1 ? C.good : C.cyan); });
      btn(x+440, y+14, 100, 40, inXR() ? 'Reroll' : 'Rename', () => { if(inXR()) c.name = pick(NAMES); else openRename('crew', c); }, { s:14 });
      btn(x+550, y+14, 100, 40, 'Dismiss', () => { if(crew.length<=1){ toast('You need at least one crew member.'); return; } UI.confirmDismiss = c.id; }, { s:14, col:C.hostile });
      if(UI.confirmDismiss===c.id){ rr(x+300, y+60, 350, 70, 8); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.hostile; ctx.stroke(); T('Leave them at this beacon?', x+316, y+86, { s:15, c:C.hostile });
        btn(x+316, y+94, 150, 32, 'Yes', () => { for(const sh of [G.ship, G.enemy]) if(sh){ const k = sh.crew.indexOf(c); if(k>=0) sh.crew.splice(k,1); } UI.confirmDismiss = null; }, { s:13, col:C.hostile, fill:true });
        btn(x+480, y+94, 150, 32, 'No', () => { UI.confirmDismiss = null; }, { s:13 }); }
    });
  } else if(UI.tab==='gear'){
    const lock = !!G.enemy;
    label(`Mounted weapons (${s.weapons.length}/${R.weaponSlots})`, cx, y0+10, C.muted, 'left', 14);
    s.weapons.forEach((w,i) => { const d = DATA.weapons[w.id], y = y0+24 + i*58; T(`${i+1}. ${d?.name||w.id}`, cx, y+30, { s:18 });
      if(i>0) btn(cx+340, y+4, 50, 42, '↑', () => { [s.weapons[i-1], s.weapons[i]] = [s.weapons[i], s.weapons[i-1]]; }, { s:16, disabled:lock });
      btn(cx+400, y+4, 170, 42, 'To cargo', () => { s.weapons.splice(i,1); (s.cargo = s.cargo||[]).push({ kind:'weapon', id:w.id }); UI.selWeapon = null; }, { disabled:lock, s:15 }); });
    const dy = y0+24 + R.weaponSlots*58 + 20; label(`Mounted drones (${s.drones.length}/${R.droneSlots})`, cx, dy, C.muted, 'left', 14);
    s.drones.forEach((d,i) => { const y = dy+14 + i*58; T(DATA.drones[d.id]?.name||d.id, cx, y+30, { s:18 });
      btn(cx+400, y+4, 170, 42, 'To cargo', () => { removeDrone(s, d); s.drones.splice(i,1); (s.cargo = s.cargo||[]).push({ kind:'drone', id:d.id }); }, { disabled:lock, s:15 }); });
    const rx = f.x+740; label('Cargo', rx, y0+10, C.muted, 'left', 14);
    if(!(s.cargo||[]).length) T('Empty', rx, y0+50, { s:18, c:C.muted });
    (s.cargo||[]).slice(0,9).forEach((it,i) => { const d = it.kind==='weapon' ? DATA.weapons[it.id] : DATA.drones[it.id]; const y = y0+24 + i*58;
      T(`${d?.name||it.id}`, rx, y+30, { s:18 }); T(it.kind, rx+330, y+30, { s:13, c:C.muted });
      const full = it.kind==='weapon' ? s.weapons.length>=R.weaponSlots : s.drones.length>=R.droneSlots;
      btn(rx+460, y+4, 170, 42, 'Mount', () => { s.cargo.splice(i,1); if(it.kind==='weapon') s.weapons.push({ id:it.id, charge:0, on:false, target:null }); else s.drones.push({ id:it.id, on:false, unit:null }); }, { disabled: full || lock, s:15 }); });
    if(lock) T('Gear cannot be swapped mid-fight.', cx, f.y+f.h-40, { s:16, c:C.warn });
  } else if(UI.tab==='log'){
    label('Captain\'s log', cx, y0+10, C.muted, 'left', 14);
    const entries = (G.log||[]).slice(-17).reverse(); if(!entries.length) T('Nothing logged yet.', cx, y0+56, { s:18, c:C.muted });
    entries.forEach((e,i) => { T(`S${e.s}`, cx, y0+46+i*36, { s:14, f:FD, w:700, c:C.amber }); para(e.t, cx+50, y0+46+i*36, 1280, { s:15, lh:18, max:1 }); });
  } else {
    label(`Augments (${s.augments.length}/${R.augmentSlots})`, cx, y0+10, C.muted, 'left', 14);
    if(!s.augments.length) T('No augments yet. Find them in events and stores.', cx, y0+56, { s:18, c:C.muted });
    s.augments.forEach((a,i) => { const d = DATA.augments[a]; const y = y0+24 + i*96; panel(cx, y, 1000, 84, 8);
      T(d?.name||a, cx+20, y+36, { s:22, f:FD, w:700, c:C.amber }); T(d?.desc||'', cx+20, y+62, { s:15, c:C.muted });
      btn(cx+800, y+18, 180, 48, UI.confirmAug===a ? 'Really?' : 'Discard', () => { if(UI.confirmAug===a){ s.augments.splice(i,1); UI.confirmAug = null; } else UI.confirmAug = a; }, { s:15, col:C.hostile, fill:UI.confirmAug===a }); });
  }
  btn(f.x+f.w-232, f.y+f.h-80, 200, 56, 'Done', () => { G.modal = null; UI.confirmDismiss = null; UI.confirmAug = null; });
}

/* ---------------- input ---------------- */
function click(x,y){
  ensureAudio();
  for(let i=HR.length-1;i>=0;i--){ const r = HR[i]; if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ r.cb(); sfx('click'); return; } }
  if(UI.screen==='game'){ UI.selCrew = null; UI.selWeapon = null; UI.mode = null; }
}
function canvasXY(e){ const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left)/r.width*W, y:(e.clientY - r.top)/r.height*H }; }
cv.addEventListener('pointermove', e => { const p = canvasXY(e); PTR[0].x = p.x; PTR[0].y = p.y; PTR[0].on = e.pointerType==='mouse'; });
cv.addEventListener('pointerleave', () => { PTR[0].on = false; });
cv.addEventListener('pointerdown', e => { e.preventDefault(); const p = canvasXY(e); PTR[0].x = p.x; PTR[0].y = p.y; click(p.x, p.y); });
window.addEventListener('keydown', e => {
  if(UI.hint && (e.key==='Enter' || e.key==='Escape')){ closeHint(false); e.preventDefault(); return; }
  if(e.target && e.target.closest && e.target.closest('dialog,#modPanel,#renameDlg')) return;
  if(UI.screen!=='game' || !G) return;
  if(e.code==='Space'){ e.preventDefault(); if(!G.modal) G.paused = !G.paused; }
  else if(e.key==='m' || e.key==='M'){ if(G.modal?.type==='map') G.modal = null; else if(!G.modal) openMap(); }
  else if(e.key==='c' || e.key==='C'){ if(!G.modal) activateCloak(G.ship); }
  else if(e.key==='v' || e.key==='V'){ G.hold = !G.hold; }
  else if(/^[1-4]$/.test(e.key) && !G.modal){ const i = +e.key-1, w = G.ship.weapons[i]; if(w && w.on) { UI.selWeapon = UI.selWeapon===i ? null : i; UI.mode = null; } }
  else if(e.key==='Escape'){ if(G.modal && ['map','ship','store'].includes(G.modal.type)) G.modal = null; UI.selCrew = null; UI.selWeapon = null; UI.mode = null; }
});
