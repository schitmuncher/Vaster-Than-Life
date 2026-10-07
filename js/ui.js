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
function region(x,y,w,h,cb){ HR.push({ x,y,w,h,cb }); }
function rr(x,y,w,h,r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h); }
function T(t,x,y,o={}){ ctx.font = `${o.w||400} ${o.s||22}px ${o.f||FM}`; ctx.fillStyle = o.c||C.ink; ctx.textAlign = o.a||'left'; ctx.textBaseline = o.b||'alphabetic';
  if('letterSpacing' in ctx) ctx.letterSpacing = (o.ls||0)+'px'; ctx.fillText(t,x,y); if('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }
function label(t,x,y,c=C.muted,a='left',s=16){ T(String(t).toUpperCase(),x,y,{ s, f:FD, w:600, c, ls:2, a }); }
function lines(text, maxW, font){ ctx.font = font; const out = [];
  for(const para of String(text).split('\n')){ let line = ''; for(const word of para.split(' ')){ const t = line ? line+' '+word : word; if(ctx.measureText(t).width > maxW && line){ out.push(line); line = word; } else line = t; } out.push(line); }
  return out; }
function para(text,x,y,maxW,o={}){ const s = o.s||22, lh = o.lh||Math.round(s*1.45), font = `${o.w||400} ${s}px ${o.f||FM}`; let ls = lines(text,maxW,font);
  if(o.max && ls.length>o.max){ ls = ls.slice(0,o.max); ls[ls.length-1] += '…'; }
  ls.forEach((l,i)=>T(l,x,y+i*lh,{ s, f:o.f||FM, w:o.w||400, c:o.c||C.ink, a:o.a||'left' })); return ls.length*lh; }
function btn(x,y,w,h,text,cb,o={}){
  const dis = !!o.disabled, hov = !dis && hovered(x,y,w,h), col = o.col||C.amber;
  rr(x,y,w,h,6); ctx.fillStyle = o.fill ? (dis?C.line:col) : (hov ? hexA(col,.18) : C.panel2); ctx.fill();
  if(o.fill && hov){ ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fill(); }
  ctx.lineWidth = hov ? 3 : 2; ctx.strokeStyle = dis ? C.line : col; ctx.stroke();
  T(text, x+w/2, y+h/2+1, { a:'center', b:'middle', s:o.s||20, f:FD, w:600, c: dis ? C.muted : (o.fill ? C.void : col), ls:1 });
  if(!dis && cb) region(x,y,w,h,cb);
}
function panel(x,y,w,h,r=10){ rr(x,y,w,h,r); ctx.fillStyle = hexA(C.panel,.94); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.line; ctx.stroke(); }
function bar(x,y,w,h,frac,col,bg=C.panel2){ rr(x,y,w,h,3); ctx.fillStyle = bg; ctx.fill(); if(frac>0){ rr(x,y,Math.max(3,w*clamp(frac,0,1)),h,3); ctx.fillStyle = col; ctx.fill(); } }
function tabs(x,y,list,cur,set,w=150){ list.forEach((t,i)=>btn(x+i*(w+8), y, w, 44, t[1], ()=>set(t[0]), { fill:cur===t[0], s:16 })); }

/* ---------------- stars ---------------- */
const STARS = Array.from({length:240}, () => ({ x:Math.random()*W, y:Math.random()*H, z:rand(.2,1) }));
function warpAmt(){ return G && UI.screen==='game' && G.warp>0 ? (1-Math.abs(G.warp-.5)*2) : 0; }
function updateStars(dt){ const sp = 6 + warpAmt()*2600; for(const s of STARS){ s.x -= s.z*sp*dt; if(s.x<0){ s.x += W; s.y = Math.random()*H; } } }
function drawStars(){ const warp = warpAmt(); const neb = G && UI.screen==='game' && G.nebula;
  if(neb){ const g = ctx.createRadialGradient(1100,400,50,1100,400,900); g.addColorStop(0,'rgba(139,111,214,.28)'); g.addColorStop(1,'rgba(139,111,214,0)'); ctx.fillStyle = g; ctx.fillRect(0,0,W,H); }
  for(const s of STARS){ ctx.fillStyle = `rgba(223,230,245,${.25 + s.z*.6})`;
    if(warp>.05) ctx.fillRect(s.x, s.y, 4 + s.z*warp*260, 1.6); else ctx.fillRect(s.x, s.y, s.z*2.2, s.z*2.2); } }

/* ---------------- main draw ---------------- */
function draw(){
  HR = [];
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = C.void; ctx.fillRect(0,0,W,H);
  drawStars();
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
  for(const p of PTR){ if(!p.xr || !p.on) continue; ctx.beginPath(); ctx.arc(p.x,p.y,13,0,7); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,7); ctx.fillStyle = C.amber; ctx.fill(); }
}

/* ---------------- title & menus ---------------- */
function drawTitle(){
  const g = ctx.createRadialGradient(1180,420,20,1180,420,520); g.addColorStop(0,'rgba(255,181,71,.22)'); g.addColorStop(1,'rgba(255,181,71,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  ctx.beginPath(); ctx.arc(1240,470,230,0,7); const pg = ctx.createLinearGradient(1040,280,1440,680); pg.addColorStop(0,'#3b2a3f'); pg.addColorStop(1,'#0b0f1d'); ctx.fillStyle = pg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(1240,470,360,70,-.25,0,7); ctx.strokeStyle = hexA(C.amber,.35); ctx.lineWidth = 3; ctx.stroke();
  label('A Fedoration courier roguelike', 110, 200, C.cyan, 'left', 20);
  T('VASTER', 104, 320, { s:132, f:FD, w:700, c:C.amber, ls:10 });
  T('THAN LIFE', 108, 428, { s:96, f:FD, w:700, c:C.ink, ls:12 });
  para('Outrun the Rebuff Fleet across eight sectors and stop the Flaggship. Built for Meta Quest, playable on any screen.', 112, 486, 700, { s:21, c:C.muted });
  const hasSave = !!LS.get(SAVE_KEY, null);
  let y = 560; const bw = 330;
  if(hasSave){ btn(110, y, bw, 58, 'Continue run', () => { if(!loadSave()) toast('That save could not be loaded.'); }, { fill:true }); y += 70; }
  btn(110, y, bw, 58, 'New run', () => { applyMods(); UI.selShip = UI.selShip && DATA.ships[UI.selShip] ? UI.selShip : 'pestrel'; UI.shipName = null; UI.screen = 'select'; }, { fill:!hasSave }); y += 70;
  const on = MODS.filter(m=>m.enabled).length;
  btn(110, y, bw, 58, on ? `Mods (${on} on)` : 'Mods', () => { UI.screen = 'mods'; loadLibrary(); }); y += 70;
  btn(110, y, 160, 58, 'Manual', () => { UI.screen = 'help'; }, { s:18 });
  btn(280, y, 160, 58, 'Settings', () => { UI.screen = 'settings'; }, { s:18 }); y += 70;
  btn(110, y, bw, 58, `Achievements ${Object.keys(PROFILE.ach).length}/${ACHIEVEMENTS.length}`, () => { UI.screen = 'ach'; }, { s:18 });
  label('Quest: point and pull the trigger · A/X pause · B/Y map · grip recenters · right stick moves the screen', 110, H-30, C.muted, 'left', 15);
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
  let temp = null; try{ temp = makeShip(def,'p',{}); }catch(e){}
  if(temp){
    drawShip(temp, { x:760, y:y0+70, w:760, h:240 }, 1, false, true);
    const rows = [ ['Hull', temp.maxHull], ['Reactor', temp.reactor], ['Weapons', temp.weapons.map(w=>DATA.weapons[w.id].name).join(', ')||'None'],
      ['Drones', temp.drones.map(d=>DATA.drones[d.id].name).join(', ')||'None'], ['Systems', Object.keys(temp.systems).filter(k=>!SUB.includes(k)).map(k=>SYSN[k]).join(', ')],
      ['Crew', temp.crew.map(c=>DATA.races[c.race].name).join(', ')], ['Augments', temp.augments.map(a=>DATA.augments[a]?.name).join(', ')||'None'] ];
    rows.forEach((r,k) => { label(r[0], 84, y0+232+k*30, C.muted, 'left', 13); para(String(r[1]), 210, y0+232+k*30, 520, { s:15, lh:18, max:1 }); });
  } else T('This ship has an error in its data.', 84, y0+260, { s:18, c:C.hostile });
  if(!open){ ctx.fillStyle = 'rgba(7,10,20,.55)'; rr(740, y0+60, 790, 260, 10); ctx.fill(); T('LOCKED', 1135, y0+170, { s:40, f:FD, w:700, a:'center', c:C.muted, ls:6 }); T(unlockText(def.unlock), 1135, y0+212, { s:18, a:'center', c:C.ink }); }
  label('Difficulty', 760, y0+360, C.muted, 'left', 14);
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
  const row = (y, name, val, dec, inc) => { T(name, 80, y+34, { s:22 }); T(val, 560, y+34, { s:22, f:FD, w:700, a:'center', c:C.amber }); if(dec) btn(440, y+6, 60, 46, '−', dec, { s:24 }); if(inc) btn(620, y+6, 60, 46, '+', inc, { s:24 }); };
  row(170, 'Music volume', `${Math.round(SET.music*100)}%`, () => { SET.music = clamp(+(SET.music-.1).toFixed(1),0,1); applyVolumes(); saveProfile(); }, () => { SET.music = clamp(+(SET.music+.1).toFixed(1),0,1); applyVolumes(); saveProfile(); });
  row(240, 'Sound effects', `${Math.round(SET.sfx*100)}%`, () => { SET.sfx = clamp(+(SET.sfx-.1).toFixed(1),0,1); applyVolumes(); saveProfile(); }, () => { SET.sfx = clamp(+(SET.sfx+.1).toFixed(1),0,1); applyVolumes(); saveProfile(); sfx('click'); });
  const tog = (y, name, key, note) => { T(name, 80, y+34, { s:22 }); btn(440, y+6, 240, 46, SET[key] ? 'On' : 'Off', () => { SET[key] = !SET[key]; saveProfile(); if(key==='allowScripts') applyMods(); }, { fill:SET[key], col:SET[key]?C.good:C.muted }); if(note) para(note, 720, y+22, 780, { s:15, lh:20, c:C.muted }); };
  T('Difficulty', 80, 344, { s:22 }); Object.keys(DIFFICULTY).forEach((k,i) => btn(440 + i*130, 316, 120, 46, DIFFICULTY[k].name, () => { SET.difficulty = k; saveProfile(); }, { fill:SET.difficulty===k, s:16 }));
  tog(390, 'Holotable in VR', 'holotable', '3D models of both ships on a table below the console.');
  tog(460, 'Unlock all ships', 'unlockAll', 'Skip the unlock conditions and pick any ship.');
  tog(530, 'Allow mod scripts', 'allowScripts', 'Lets mods run their own JavaScript. Only turn this on for mods you trust.');
  if(UI.confirmReset){ T('Erase all achievements, unlocks and stats?', 80, 660, { s:22, c:C.hostile });
    btn(80, 680, 220, 52, 'Yes, erase', () => { for(const k of Object.keys(PROFILE.ach)) delete PROFILE.ach[k]; PROFILE.maxSector = 1; PROFILE.kills = 0; PROFILE.wins = {}; PROFILE.runs = 0; saveProfile(); UI.confirmReset = false; toast('Profile reset.'); }, { col:C.hostile, fill:true });
    btn(320, 680, 160, 52, 'Cancel', () => { UI.confirmReset = false; }); }
  else btn(80, 640, 300, 52, 'Reset profile', () => { UI.confirmReset = true; }, { col:C.hostile });
  T(`Runs ${PROFILE.runs} · Ships defeated ${PROFILE.kills} · Furthest sector ${PROFILE.maxSector} · Wins ${Object.values(PROFILE.wins).reduce((a,b)=>a+(+b||0),0)}`, 80, 790, { s:18, c:C.muted });
  btn(80, 860, 200, 64, 'Back', () => { UI.screen = 'title'; UI.confirmReset = false; });
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
  ctx.save(); if(G.shake>0) ctx.translate(rand(-1,1)*G.shake*9, rand(-1,1)*G.shake*9);
  drawShip(G.ship, PBOX, 1, false, false); ctx.restore();
  if(G.enemy) drawShip(G.enemy, EBOX, -1, true, false); else drawQuiet();
  drawUnits(); drawProjectiles(); drawFX();
  drawRoster(); if(G.enemy) drawEnemyStrip();
  drawSystems(); drawArmory();
  const hint = UI.selWeapon!=null ? (DATA.weapons[G.ship.weapons[UI.selWeapon]?.id]?.heal ? 'Point at one of YOUR rooms to target the burst' : 'Point at an enemy room to target it')
    : UI.mode==='tele' ? 'Point at an enemy room to teleport your away team' : UI.mode==='hack' ? 'Point at an enemy room to launch the hacking drone'
    : UI.mode==='mind' ? 'Point at an enemy crew member to take control' : UI.selCrew ? 'Point at a room to move your crew member' : '';
  if(hint){ panel(W/2-330, 520, 660, 40, 8); T(hint, W/2, 541, { s:17, a:'center', b:'middle', c:C.amber }); }
  if(G.flash>0){ ctx.fillStyle = `rgba(255,200,120,${G.flash*.35})`; ctx.fillRect(0,0,W,H); }
  if(G.warp>0){ ctx.fillStyle = `rgba(255,236,200,${warpAmt()*.5})`; ctx.fillRect(0,0,W,H); }
  if(G.paused && !G.modal){ ctx.fillStyle = 'rgba(7,10,20,.3)'; ctx.fillRect(0,76,W,480);
    panel(W/2-200, 250, 400, 100, 10); T('PAUSED', W/2, 298, { s:42, f:FD, w:700, a:'center', c:C.amber, ls:8 }); T('Give orders, then resume', W/2, 332, { s:17, a:'center', c:C.muted }); }
  if(G.modal) drawModal();
}
function drawTopBar(){
  const s = G.ship;
  ctx.fillStyle = hexA(C.panel,.96); ctx.fillRect(0,0,W,76); ctx.fillStyle = C.line; ctx.fillRect(0,75,W,1.5);
  label('Hull', 20, 30, C.muted, 'left', 14);
  const n = s.maxHull, bw = 260, seg = bw/n;
  for(let i=0;i<n;i++){ ctx.fillStyle = i < s.hull ? (s.hull/n > .5 ? C.good : s.hull/n > .25 ? C.warn : C.hostile) : C.panel2; ctx.fillRect(70+i*seg, 13, Math.max(1,seg-1.5), 22); }
  T(`${s.hull}/${n}`, 70+bw+8, 31, { s:18, w:600 });
  label('Shld', 20, 63, C.muted, 'left', 14);
  const mx = Math.floor((s.systems.shields?.max||0)/2), ml = shieldLayers(s);
  for(let i=0;i<Math.max(mx,0);i++){ const x = 82+i*24; ctx.beginPath(); ctx.moveTo(x,51); ctx.lineTo(x+9,59); ctx.lineTo(x,67); ctx.lineTo(x-9,59); ctx.closePath(); ctx.fillStyle = i < s.shield ? C.cyan : (i<ml ? hexA(C.cyan,.25) : C.panel2); ctx.fill(); }
  let tx = 92 + Math.max(mx,1)*24;
  if(s.super>0){ T(`+${s.super}`, tx, 64, { s:16, f:FD, w:700, c:C.good }); tx += 44; }
  label(`Evade ${evasion(s)}%`, tx, 64, evasion(s)>0 ? C.ink : C.hostile, 'left', 14);
  const avgO2 = Math.round(s.rooms.reduce((t,r)=>t+r.o2,0)/s.rooms.length);
  label(`O2 ${avgO2}%`, tx+120, 64, avgO2<40 ? C.hostile : C.ink, 'left', 14);
  const res = [['Scrap', G.scrap, C.amber], ['Fuel', G.fuel, G.fuel<=3?C.hostile:C.ink], ['Missiles', G.missiles, C.ink], ['Parts', G.parts, C.ink]];
  res.forEach((r,i) => { const x = 440 + i*108; label(r[0], x, 28, C.muted, 'left', 13); T(String(r[1]), x, 64, { s:28, f:FD, w:700, c:r[2] }); });
  const sd = sectorDef();
  label(`Sector ${G.sector} of ${R.sectors}`, 872, 22, C.muted, 'left', 12);
  label(sd.name, 872, 42, sd.color||C.cyan, 'left', 12);
  if(G.flag) label(`Base ${G.flag.baseHP} · Boss ${G.flag.phase+1}/3`, 872, 64, C.hostile, 'left', 11);
  else if(G.hazard) label(HAZARDS[G.hazard], 872, 64, G.hazard==='nebula'?C.violet:C.warn, 'left', 11);
  label('VTL drive', 1108, 28, C.muted, 'left', 12);
  const charge = G.enemy && !G.enemy.dead ? G.ftl : 1; bar(1108, 38, 150, 12, charge, charge>=1 ? C.good : C.amber);
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
  const fade = sh.dead ? Math.max(0, (G?.dieT||0)/1.3) : 1;
  const cloaked = sh.cloak?.t>0;
  ctx.globalAlpha = fade * (cloaked ? .45 : 1);
  const tail = facing>0 ? b.x0 : b.x1;
  for(const dy of [-.25,.25]){ const yy = cy + dy*(b.y1-b.y0); const g = ctx.createRadialGradient(tail,yy,2,tail,yy,mini?24:44);
    g.addColorStop(0,hexA(col,.7)); g.addColorStop(1,hexA(col,0)); ctx.fillStyle = g; ctx.fillRect(tail-60,yy-50,120,100); }
  const img = getImg(sh.image);
  if(img){ ctx.drawImage(img, b.x0 - (facing<0?b.nose:0), b.y0, (b.x1-b.x0)+b.nose, b.y1-b.y0); }
  else { hullPath(b); const hg = ctx.createLinearGradient(0,b.y0,0,b.y1); hg.addColorStop(0,'#1b2440'); hg.addColorStop(1,'#10162a');
    ctx.fillStyle = hg; ctx.fill(); ctx.lineWidth = mini?2:3; ctx.strokeStyle = hexA(col,.8); ctx.stroke(); }
  const vis = !isEnemy || mini ? 3 : sensorLevel();
  const ownIn = new Set(); if(isEnemy) for(const c of sh.crew) if(c.owner==='p') ownIn.add(c.room);
  const selW = UI.selWeapon!=null ? G?.ship.weapons[UI.selWeapon] : null; const healSel = selW && DATA.weapons[selW.id]?.heal;
  sh.rooms.forEach((r,i) => {
    const q = sh._rects[i], s = r.sys ? sh.systems[r.sys] : null, seen = vis>=1 || ownIn.has(i);
    ctx.fillStyle = seen ? C.room : '#141a2c'; ctx.fillRect(q.x,q.y,q.w,q.h);
    if(seen){
      if(r.o2 < 60){ ctx.fillStyle = hexA(C.hostile, (60-r.o2)/60*.4); ctx.fillRect(q.x,q.y,q.w,q.h); }
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      for(let gx=1; gx<r.w; gx++){ ctx.beginPath(); ctx.moveTo(q.x+gx*cell,q.y); ctx.lineTo(q.x+gx*cell,q.y+q.h); ctx.stroke(); }
      for(let gy=1; gy<r.h; gy++){ ctx.beginPath(); ctx.moveTo(q.x,q.y+gy*cell); ctx.lineTo(q.x+q.w,q.y+gy*cell); ctx.stroke(); }
      if(s && s.dmg>0){ ctx.fillStyle = hexA(C.hostile, .14 + .25*s.dmg/s.max); ctx.fillRect(q.x,q.y,q.w,q.h); }
      if(s && s.ionT>0){ ctx.save(); ctx.beginPath(); ctx.rect(q.x,q.y,q.w,q.h); ctx.clip(); ctx.strokeStyle = hexA(C.cyan,.45); ctx.lineWidth = 3;
        for(let k=-q.h;k<q.w;k+=14){ ctx.beginPath(); ctx.moveTo(q.x+k,q.y+q.h); ctx.lineTo(q.x+k+q.h,q.y); ctx.stroke(); } ctx.restore(); }
      for(let f=0; f<r.fire; f++){ const fx_ = q.x + ((f % r.w)+.5)*cell, fy = q.y + (Math.floor(f / r.w)+.5)*cell; const fl = Math.sin((G?.time||0)*12 + f*2)*3;
        ctx.beginPath(); ctx.moveTo(fx_-cell*.22, fy+cell*.25); ctx.quadraticCurveTo(fx_-cell*.25, fy-cell*.05, fx_, fy-cell*.3-fl); ctx.quadraticCurveTo(fx_+cell*.25, fy-cell*.05, fx_+cell*.22, fy+cell*.25); ctx.closePath();
        ctx.fillStyle = hexA(C.fire,.85); ctx.fill(); }
      for(let k=0; k<r.breach; k++){ const bx = q.x + q.w - (k+.5)*Math.min(cell*.5, 22) - 4, by = q.y + q.h - 12; ctx.beginPath(); ctx.arc(bx, by, Math.min(9, cell*.14), 0, 7); ctx.fillStyle = '#000'; ctx.fill(); ctx.strokeStyle = C.hostile; ctx.lineWidth = 2; ctx.stroke(); }
    } else if(!mini){ T('?', q.x+q.w/2, q.y+q.h/2+6, { s:18, f:FD, w:700, a:'center', c:'#2f3a5c' }); }
    const hov = !mini && hovered(q.x,q.y,q.w,q.h);
    const targeting = !mini && ((isEnemy && ((selW && !healSel) || UI.mode==='tele' || UI.mode==='hack')) || (!isEnemy && healSel));
    ctx.lineWidth = 2; ctx.strokeStyle = (targeting && hov) ? C.hostile : (hov && UI.selCrew) ? C.amber : '#3a4a72'; ctx.strokeRect(q.x+1,q.y+1,q.w-2,q.h-2);
    if(r.sys){
      const ic = SYSC[r.sys]||C.ink, inst = !!s;
      ctx.fillStyle = hexA(ic, inst ? .9 : .25); ctx.fillRect(q.x+3,q.y+3,mini?3:5,Math.min(q.h-6, mini?12:22));
      if(!mini) T(SYSS[r.sys], q.x+11, q.y+17, { s: q.w < 56 ? 9 : 12, f:FD, w:700, c:inst ? ic : hexA(ic,.35), ls: q.w < 56 ? 0 : 1 });
      if(!mini && inst && seen && s.dmg>0){ const work = sh.crew.some(c => c.room===i && !c.path.length && crewSide(c)===sh.side); if(work) bar(q.x+6, q.y+q.h-10, q.w-12, 6, s.rep, C.good, 'rgba(0,0,0,.5)'); }
      if(!mini && sh.hacked && sh.hacked.room===i){ ctx.strokeStyle = sh.hacked.pulseT>0 ? '#ff9de2' : hexA('#ff9de2',.6); ctx.lineWidth = sh.hacked.pulseT>0 ? 4 : 2; ctx.strokeRect(q.x+4,q.y+4,q.w-8,q.h-8); T('HACK', q.x+q.w-6, q.y+16, { s:11, f:FD, w:700, a:'right', c:'#ff9de2' }); }
    }
    if(!mini){
      if(isEnemy){
        if(selW && !healSel) region(q.x,q.y,q.w,q.h, () => { selW.target = i; UI.selWeapon = null; });
        else if(UI.mode==='tele') region(q.x,q.y,q.w,q.h, () => { if(teleSend(G.ship, G.enemy, i)) UI.mode = null; else toast('Gather crew in the teleporter room first, and wait for it to charge.'); });
        else if(UI.mode==='hack') region(q.x,q.y,q.w,q.h, () => { if(hackLaunch(G.ship, G.enemy, i)) UI.mode = null; });
        else if(UI.selCrew) region(q.x,q.y,q.w,q.h, () => moveSelected(sh, i));
      } else {
        if(healSel) region(q.x,q.y,q.w,q.h, () => { selW.target = i; UI.selWeapon = null; });
        else if(UI.selCrew) region(q.x,q.y,q.w,q.h, () => moveSelected(sh, i));
      }
    }
  });
  // doors
  if(!mini) for(const d of sh.doors){
    const a = cellXY(sh, d.ca[0], d.ca[1]), bb = cellXY(sh, d.cb[0], d.cb[1]);
    const mx = (a.x+bb.x)/2, my = (a.y+bb.y)/2, horiz = Math.abs(a.y-bb.y) < 1;
    const L = cell*.42, Th = Math.max(5, cell*.11);
    const w = horiz ? Th : L, h = horiz ? L : Th;
    const st = d.broken>0 ? C.hostile : doorOpen(d) ? C.good : (d.b<0 ? '#e0b070' : '#c9a27e');
    if(doorOpen(d)){ ctx.strokeStyle = st; ctx.lineWidth = 2; ctx.strokeRect(mx-w/2, my-h/2, w, h); }
    else { ctx.fillStyle = st; ctx.fillRect(mx-w/2, my-h/2, w, h); }
    if(!isEnemy && canDoors(sh)) region(mx-Math.max(w,22)/2, my-Math.max(h,22)/2, Math.max(w,22), Math.max(h,22), () => { d.open = !d.open; d.broken = 0; });
  }
  // crew
  const rad = Math.max(5, Math.min(15, cell*.24));
  const seeCrew = !isEnemy || mini || sensorLevel()>=2 || telepathic();
  for(const c of sh.crew){
    if(isEnemy && !seeCrew && c.owner!=='p' && !ownIn.has(c.room)){ c._sx = null; continue; }
    const p = cellXY(sh, c.x, c.y); c._sx = p.x; c._sy = p.y + (mini?0:3);
    const race = raceOf(c), hostileHere = crewSide(c)!==sh.side;
    ctx.beginPath();
    if(c.drone){ ctx.moveTo(p.x, p.y-rad); ctx.lineTo(p.x+rad, p.y); ctx.lineTo(p.x, p.y+rad); ctx.lineTo(p.x-rad, p.y); ctx.closePath(); }
    else ctx.arc(p.x, p.y, rad, 0, 7);
    ctx.fillStyle = c.owner==='e' && !mini ? (c.drone ? '#ff9de2' : hexA(C.hostile,.9)) : (c.drone ? '#f0a6ff' : race.color); ctx.fill();
    if(!mini){
      ctx.beginPath(); ctx.arc(p.x,p.y,rad+4,-Math.PI/2,-Math.PI/2 + Math.PI*2*clamp(c.hp/c.maxHp,0,1)); ctx.strokeStyle = c.hp/c.maxHp>.5 ? C.good : c.hp/c.maxHp>.25 ? C.warn : C.hostile; ctx.lineWidth = 3; ctx.stroke();
      if(c.mcT>0){ ctx.beginPath(); ctx.arc(p.x,p.y,rad+8,0,7); ctx.strokeStyle = C.violet; ctx.lineWidth = 2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]); }
      if(!c.drone) T((c.name||'?')[0], p.x, p.y+1, { s:Math.round(rad), f:FD, w:700, a:'center', b:'middle', c:C.void });
      if(c.stunT>0) T('z', p.x+rad, p.y-rad, { s:14, f:FD, w:700, c:C.cyan });
      if(UI.selCrew===c.id){ ctx.beginPath(); ctx.arc(p.x,p.y,rad+9,0,7); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke(); }
      if(hostileHere && c.owner==='p') { ctx.beginPath(); ctx.arc(p.x,p.y,rad+2,0,7); ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.stroke(); }
      if(controlled(c)) region(p.x-rad-6, p.y-rad-6, rad*2+12, rad*2+12, () => { UI.selCrew = UI.selCrew===c.id ? null : c.id; UI.selWeapon = null; UI.mode = null; });
      else if(UI.mode==='mind' && crewSide(c)!=='p') region(p.x-rad-6, p.y-rad-6, rad*2+12, rad*2+12, () => { if(mindControl(G.ship, c)) UI.mode = null; });
    }
  }
  // shields
  if(!mini){ const scx = (b.x0+b.x1)/2 + facing*b.nose*.3; const rx = (b.x1-b.x0)/2 + b.nose*.55 + 14, ry = (b.y1-b.y0)/2 + 26;
    if(sh.shield>0){ ctx.beginPath(); ctx.ellipse(scx, cy, rx, ry, 0, 0, 7); ctx.fillStyle = hexA(C.cyan, .03 + .025*sh.shield); ctx.fill(); ctx.strokeStyle = hexA(C.cyan, .35 + .1*sh.shield); ctx.lineWidth = 1.5 + sh.shield*1.2; ctx.stroke(); }
    if(sh.super>0){ ctx.beginPath(); ctx.ellipse(scx, cy, rx+10, ry+10, 0, 0, 7); ctx.strokeStyle = hexA(C.good, .5); ctx.lineWidth = 2 + sh.super*.6; ctx.stroke(); }
  }
  // targets
  if(!mini && G){ G.ship.weapons.forEach((w,wi) => { if(w.target==null) return; const heal = DATA.weapons[w.id]?.heal; if(heal === !isEnemy){}
      if((isEnemy && heal) || (!isEnemy && !heal)) return; const q = sh._rects[w.target]; if(!q) return; const x = q.x+q.w/2 + (wi-1.5)*12, y = q.y+q.h/2;
      ctx.strokeStyle = heal ? C.good : C.amber; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x,y,15,0,7); ctx.moveTo(x-22,y); ctx.lineTo(x-8,y); ctx.moveTo(x+8,y); ctx.lineTo(x+22,y); ctx.moveTo(x,y-22); ctx.lineTo(x,y-8); ctx.moveTo(x,y+8); ctx.lineTo(x,y+22); ctx.stroke();
      T(String(wi+1), x, y+1, { s:14, f:FD, w:700, a:'center', b:'middle', c: heal ? C.good : C.amber }); }); }
  ctx.globalAlpha = 1;
  if(!mini){ label(sh.name, box.x+8, box.y+16, hexA(col,.9), 'left', 15); if(cloaked) label(`Cloaked ${sh.cloak.t.toFixed(0)}s`, box.x+box.w-8, box.y+16, C.cyan, 'right', 14); }
}
function moveSelected(sh, ri_){
  const c = sh.crew.find(x => x.id===UI.selCrew);
  if(!c){ toast('Crew can only walk within the ship they are on. Use the teleporter to cross.'); UI.selCrew = null; return; }
  if(!orderMove(sh, c, ri_)) toast('That room is full.'); UI.selCrew = null;
}
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
    ctx.beginPath(); ctx.arc(x+16, y0+22, 8, 0, 7); ctx.fillStyle = race.color||'#fff'; ctx.fill();
    T(c.name, x+30, y0+28, { s: cw<110 ? 14 : 17, f:FD, w:600 });
    const where = c.mcT>0 ? 'Controlled!' : s!==G.ship ? 'Enemy ship' : c.path.length ? 'Moving' : (s.rooms[c.room]?.sys ? SYSS[s.rooms[c.room].sys] : 'Hall');
    if(cw>=110) T(where, x+cw-8, y0+28, { s:12, a:'right', c: s!==G.ship || c.mcT>0 ? C.hostile : C.muted });
    bar(x+10, y0+46, cw-20, 8, c.hp/c.maxHp, c.hp/c.maxHp>.5?C.good:c.hp/c.maxHp>.25?C.warn:C.hostile);
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
    T(SYSS[k], cx + cw/2, y+60, { s:13, f:FD, w:700, a:'center', c:SYSC[k], ls:1 });
    const areaH = 108, bh = Math.min(20, (areaH - (sy.max-1)*3)/sy.max), bw = Math.min(46, cw-10), bx = cx + cw/2 - bw/2;
    for(let b=0;b<sy.max;b++){ const by = y+70 + areaH - (b+1)*(bh+3);
      let fill = null, stroke = C.line;
      if(b >= sy.max - sy.dmg){ fill = hexA(C.hostile,.75); stroke = C.hostile; }
      else if(b < e){ fill = b >= sy.power ? C.warn : (hackedNow(s,k)?'#ff9de2':C.amber); stroke = fill; }
      else if(b < Math.min(sy.power + bonus, sy.max - sy.dmg)){ stroke = sy.ionT>0 ? C.cyan : '#ff9de2'; }
      rr(bx, by, bw, bh, 3); if(fill){ ctx.fillStyle = fill; ctx.fill(); } ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
    let st = ''; if(k==='shields') st = `${shieldLayers(s)} layer${shieldLayers(s)===1?'':'s'}`; else if(manned(s,k)) st = 'manned'; else if(sy.ionT>0) st = 'ion';
    if(st) T(st, cx + cw/2, y+194, { s:11, a:'center', c: st==='ion' ? C.cyan : C.good });
    btn(cx, y+202, cw, 40, '+', () => { const r = addPower(s,k); if(r==='reactor') toast('No reactor power free.'); else if(r==='damaged') toast(`${SYSN[k]} is damaged. Send crew to repair it.`); else if(r==='full') toast(`${SYSN[k]} is at full power. Upgrade it in Ship.`); }, { s:24 });
    btn(cx, y+246, cw, 32, '−', () => removePower(s,k), { s:22, disabled: sy.power<=0 });
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
  btn(hx+10, hy+158, subW-20, 36, 'Crew to stations', () => returnToStations(s), { s:13 });
  if(s.systems.battery){ const b = s.battery; btn(hx+10, hy+200, subW-20, 36, b.t>0 ? `Battery ${b.t.toFixed(0)}s` : b.cd>0 ? `Recharging ${Math.ceil(b.cd)}s` : 'Battery boost', () => activateBattery(s), { s:13, col:C.warn, disabled:!canBattery(s) }); }
  if(s.systems.teleporter){ btn(hx+10, hy+242, subW-20, 32, 'Gather at teleporter', () => { const tr = roomOf(s,'teleporter'); let n = 0; for(const c of s.crew){ if(!controlled(c) || n>=4) continue; if(c.room===roomOf(s,'piloting')) continue; if(orderMove(s, c, tr)) n++; } if(!n) toast('No free crew to send.'); }, { s:12, col:'#c6e05a' }); }
}
function drawArmory(){
  const s = G.ship, x = 944, y = 652, w = 632, h = 328;
  panel(x,y,w,h);
  label('Weapons', x+16, y+28, C.hostile, 'left', 16);
  T(`${weaponPowerUsed(s)}/${eff(s,'weapons')} pwr · ${G.missiles} msl`, x+120, y+28, { s:14, c:C.muted });
  btn(x+w-150, y+8, 136, 30, G.autofire ? 'Autofire on' : 'Autofire off', () => { G.autofire = !G.autofire; }, { s:13, fill:G.autofire, col:C.hostile });
  btn(x+w-296, y+8, 136, 30, G.hold ? 'Fire volley' : 'Hold fire', () => { G.hold = !G.hold; }, { s:13, fill:!!G.hold, col:C.warn });
  const slots = R.weaponSlots, gap = 8, cw = (w - 28 - gap*(slots-1))/slots, ch = 152;
  for(let i=0;i<slots;i++){
    const cx = x+14 + i*(cw+gap), cy = y+44, wp = s.weapons[i];
    if(!wp){ rr(cx,cy,cw,ch,8); ctx.setLineDash([6,6]); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); T('Empty', cx+cw/2, cy+ch/2, { s:14, a:'center', c:C.muted }); continue; }
    const d = DATA.weapons[wp.id]; if(!d) continue; const sel = UI.selWeapon===i, ready = wp.on && wp.charge >= d.charge;
    rr(cx,cy,cw,ch,8); ctx.fillStyle = sel ? hexA(C.amber,.14) : C.panel2; ctx.fill(); ctx.lineWidth = sel?3:1.5; ctx.strokeStyle = sel ? C.amber : wp.on ? hexA(C.amber,.5) : C.line; ctx.stroke();
    para(`${i+1} ${d.name}`, cx+8, cy+20, cw-14, { s:14, f:FD, w:700, lh:16, max:2, c: wp.on ? C.ink : C.muted });
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
function drawUnits(){ for(const u of G.units){ const p = unitPos(u); u._x = p.x; u._y = p.y; const bp = DATA.drones[u.bp];
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(u.ang); ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-7,7); ctx.lineTo(-3,0); ctx.lineTo(-7,-7); ctx.closePath();
  ctx.fillStyle = u.side==='p' ? (bp?.kind==='defense' ? C.cyan : '#f0a6ff') : C.hostile; ctx.fill(); ctx.restore(); } }
function projOrigin(p){
  if(p._ox==null){
    if(p.unit){ const u = G.units.find(x=>x.id===p.unit); if(u && u._x!=null){ p._ox = u._x; p._oy = u._y; } }
    if(p._ox==null && p.from==='h'){ p._ox = rand(200, 1400); p._oy = -20; }
    if(p._ox==null){ const s = shipBySide(p.from); const g = s ? gunPoint(s) : { x:800, y:-20 }; p._ox = g.x; p._oy = g.y; }
  }
  return { x:p._ox, y:p._oy };
}
function drawProjectiles(){
  for(const p of G.proj){
    if(p.t<0) continue;
    const dst = shipBySide(p.to); if(!dst) continue;
    const a = projOrigin(p), b = roomCenter(dst, p.room), d = p.d, k = clamp(p.t/p.dur,0,1);
    if(d.type==='beam'){ ctx.strokeStyle = hexA(d.fire ? C.fire : d.crewDamage ? C.good : C.violet, 1-k*.6); ctx.lineWidth = 6*(1-k)+2;
      for(const r of (p.rooms||[p.room])){ const c = roomCenter(dst, r); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y); ctx.stroke(); } continue; }
    if(d.type==='bomb' || d.heal){ ctx.beginPath(); ctx.arc(b.x, b.y, 8 + k*20, 0, 7); ctx.strokeStyle = hexA(d.heal ? C.good : '#ffffff', 1-k); ctx.lineWidth = 3; ctx.stroke(); p._x = b.x; p._y = b.y; continue; }
    const x = a.x + (b.x-a.x)*k, y = a.y + (b.y-a.y)*k - Math.sin(k*Math.PI)*(p.from==='h'?0:60); p._x = x; p._y = y;
    const kind = projKind(p);
    const col = kind==='hack' ? '#ff9de2' : kind==='bdrone' ? '#f0a6ff' : kind==='asteroid' ? '#9a8a7a' : d.type==='ion' ? C.cyan : d.type==='missile' ? '#ffffff' : d.type==='flak' ? C.warn : (p.from==='p' ? C.amber : C.hostile);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x,y, kind==='asteroid'?9 : kind==='missile'||d.type==='missile'||kind==='hack'||kind==='bdrone' ? 7 : 5, 0, 7); ctx.fill();
    const kk = Math.max(0,k-.06), tx = a.x + (b.x-a.x)*kk, ty = a.y + (b.y-a.y)*kk - Math.sin(kk*Math.PI)*(p.from==='h'?0:60);
    ctx.strokeStyle = hexA(col,.5); ctx.lineWidth = d.type==='missile'?4:3; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke();
  }
}
function drawFX(){
  for(const f of G.fx){ const k = f.t/1.1;
    if(f.type==='boom'){ ctx.beginPath(); ctx.arc(f.x,f.y, 10 + k*60, 0, 7); ctx.fillStyle = `rgba(255,${180-k*120|0},80,${(1-k)*.7})`; ctx.fill(); }
    else if(f.type==='shield'){ ctx.beginPath(); ctx.arc(f.x,f.y, 20 + k*70, 0, 7); ctx.strokeStyle = hexA(C.cyan, 1-k); ctx.lineWidth = 4; ctx.stroke(); }
    else if(f.type==='super'){ ctx.beginPath(); ctx.arc(f.x,f.y, 20 + k*80, 0, 7); ctx.strokeStyle = hexA(C.good, 1-k); ctx.lineWidth = 5; ctx.stroke(); }
    else if(f.type==='ion' || f.type==='tele'){ ctx.beginPath(); ctx.arc(f.x,f.y, 14 + k*50, 0, 7); ctx.strokeStyle = hexA(f.type==='tele'?'#c6e05a':C.cyan, (1-k)*.9); ctx.lineWidth = 6; ctx.stroke(); }
    else if(f.type==='heal'){ ctx.beginPath(); ctx.arc(f.x,f.y, 14 + k*50, 0, 7); ctx.strokeStyle = hexA(C.good, (1-k)*.9); ctx.lineWidth = 6; ctx.stroke(); }
    else if(f.type==='zap'){ ctx.beginPath(); ctx.arc(f.x,f.y, 6 + k*24, 0, 7); ctx.strokeStyle = hexA(C.cyan, 1-k); ctx.lineWidth = 3; ctx.stroke(); }
    else if(f.type==='text'){ ctx.globalAlpha = 1-k; T(f.text, f.x, f.y - k*40, { s:24, f:FD, w:700, a:'center', c: f.text==='MISS' || f.text==='RESISTED' ? C.ink : C.hostile }); ctx.globalAlpha = 1; } }
}

/* ---------------- modals ---------------- */
function mframe(w,h,title,col=C.amber){
  ctx.fillStyle = 'rgba(4,6,12,.74)'; ctx.fillRect(0,0,W,H); region(0,0,W,H,()=>{});
  const x = (W-w)/2, y = (H-h)/2; rr(x,y,w,h,14); ctx.fillStyle = C.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
  if(title) T(title.toUpperCase(), x+32, y+52, { s:26, f:FD, w:700, c:col, ls:3 });
  return { x, y, w, h };
}
function drawModal(){
  const m = G.modal;
  switch(m.type){
    case 'msg': { const f = mframe(940, 440, m.title); para(m.text, f.x+32, f.y+104, f.w-64, { s:21 });
      btn(f.x+f.w-332, f.y+f.h-92, 300, 62, m.btn || 'Continue', () => { G.modal = null; if(m.then) m.then(); }, { fill:true }); break; }
    case 'event': drawEventModal(m); break;
    case 'result': { const f = mframe(940, 520, m.title||'Outcome'); const hgt = para(m.text||'', f.x+32, f.y+104, f.w-64, { s:21 });
      (m.lines||[]).slice(0,8).forEach((l,i) => T('› ' + l, f.x+32, f.y+140 + hgt + i*32, { s:19, c: /^-|lost|damaged|fire/i.test(l) ? C.hostile : C.good }));
      btn(f.x+f.w-332, f.y+f.h-92, 300, 62, 'Continue', () => closeResult(m), { fill:true }); break; }
    case 'map': drawMapModal(); break;
    case 'store': drawStoreModal(m); break;
    case 'ship': drawShipModal(); break;
    case 'exit': { const f = mframe(1000, 500, 'Exit beacon', C.good);
      para(G.sector+1 >= R.sectors ? 'One jump left: the Last Stand, where the Flaggship waits.' : 'Two routes lead on. Choose the next sector. You cannot come back.', f.x+32, f.y+100, f.w-64, { s:20 });
      (m.opts||[]).forEach((t,i) => { const sd = DATA.sectors[t]; const bx = f.x+32 + i*480, by = f.y+170;
        rr(bx, by, 450, 190, 10); ctx.fillStyle = C.panel2; ctx.fill(); ctx.strokeStyle = sd.color||C.cyan; ctx.lineWidth = 2; ctx.stroke();
        T(sd.name, bx+20, by+42, { s:24, f:FD, w:700, c:sd.color||C.cyan });
        const mix = sd.mix||{}; T(`Fights ${mix.combat||0}% · Events ${mix.event||0}% · Stores ${mix.store||0}%`, bx+20, by+76, { s:14, c:C.muted });
        T(sd.nebula>.3 ? 'Mostly nebula: no sensors, slower fleet' : sd.final ? 'The Flaggship and Fedoration command' : `Expect: ${(sd.enemyTags||[]).join(', ') || 'anyone'}`, bx+20, by+102, { s:14, c:C.muted });
        btn(bx+20, by+120, 410, 52, `Jump to sector ${G.sector+1}`, () => nextSector(t), { fill:true, col:sd.color||C.good }); });
      btn(f.x+f.w-232, f.y+f.h-82, 200, 56, 'Stay here', () => { G.modal = null; }); break; }
    case 'stranded': { const f = mframe(940, 420, 'Out of fuel', C.hostile);
      para('The tanks are dry. You can broadcast a distress call for fuel, but the Rebuff Fleet will hear it too and close in.', f.x+32, f.y+104, f.w-64, { s:21 });
      btn(f.x+32, f.y+f.h-92, 420, 62, 'Broadcast distress call', () => { G.fuel += 3; G.fleetX += .3; G.modal = { type:'msg', title:'Signal answered', text:'A passing trader sells you 3 fuel cells at a mercy price. The fleet is much closer now.', btn:'Open map', then:openMap }; }, { fill:true, col:C.hostile });
      btn(f.x+f.w-252, f.y+f.h-92, 220, 62, 'Not yet', () => { G.modal = null; }); break; }
    case 'surrender': { const f = mframe(940, 440, 'They surrender', C.good);
      const parts = []; const o = m.offer; if(o.scrap) parts.push(`${o.scrap} scrap`); if(o.fuel) parts.push(`${o.fuel} fuel`); if(o.missiles) parts.push(`${o.missiles} missiles`); if(o.parts) parts.push(`${o.parts} drone parts`); if(o.weapon) parts.push('a weapon');
      para(`"Enough! Enough!" The ${m.name} offers ${parts.join(', ')} if you let them go.`, f.x+32, f.y+104, f.w-64, { s:21 });
      btn(f.x+32, f.y+f.h-92, 340, 62, 'Accept surrender', () => { G.modal = null; finishCombat('surrender', o); }, { fill:true, col:C.good });
      btn(f.x+f.w-332, f.y+f.h-92, 300, 62, 'Keep firing', () => { G.modal = null; }, { col:C.hostile }); break; }
  }
}
function drawEventModal(m){
  const ev = DATA.events[m.id]; if(!ev){ G.modal = null; return; }
  const f = mframe(1080, 800, G.map?.nodes[G.map.cur]?.distress ? 'Distress beacon' : 'Beacon');
  const th = para(ev.text, f.x+32, f.y+104, f.w-64, { s:21 });
  let y = f.y + 126 + th;
  const choices = ev.choices.filter(c => !(reqHidden(c.req) && !reqMet(c.req)));
  choices.forEach((c,i) => {
    const ok = reqMet(c.req), blue = reqHidden(c.req);
    const txt = `${i+1}. ${reqLabel(c.req)}${c.text}${costLabel(c.cost)}`;
    const ls = lines(txt, f.w-110, `400 20px ${FM}`); const h = ls.length*28 + 24;
    const hov = ok && hovered(f.x+32, y, f.w-64, h);
    rr(f.x+32, y, f.w-64, h, 8); ctx.fillStyle = hov ? hexA(blue?C.cyan:C.amber,.16) : C.panel2; ctx.fill(); ctx.lineWidth = hov?3:1.5; ctx.strokeStyle = !ok ? C.line : blue ? C.cyan : (hov?C.amber:C.line); ctx.stroke();
    ls.forEach((l,k) => T(l, f.x+54, y+33+k*28, { s:20, c: !ok ? C.muted : blue ? C.cyan : C.ink }));
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
    const inner = !n.visited && !['store','exit','base','start'].includes(n.type) ? (scan ? (n.type==='combat' ? '!' : n.type==='event' ? '?' : '·') : '?') : '';
    if(inner) T(inner, x, y+1, { s:20, f:FD, w:700, a:'center', b:'middle', c: inner==='!' ? C.hostile : C.muted });
    if(tag) label(tag, x, y+48, col, 'center', 13);
    if(n.hazard && (scan || n.visited || reach)) label(HAZARDS[n.hazard].split(' ')[0], x, y-30, C.warn, 'center', 11);
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
        ['Hull repair ×1', `Hull ${s.hull}/${s.maxHull}`, 2, () => { s.hull = Math.min(s.maxHull, s.hull+1); }, s.hull>=s.maxHull], ['Hull repair ×5', `Hull ${s.hull}/${s.maxHull}`, 9, () => { s.hull = Math.min(s.maxHull, s.hull+5); }, s.hull>=s.maxHull] ];
      rows.forEach((r,i) => { const c = price(r[2], st); const y = y0 + i*82; panel(cx, y, 640, 72, 8); T(r[0], cx+20, y+32, { s:20, f:FD, w:700 }); T(r[1], cx+20, y+56, { s:14, c:C.muted });
        btn(cx+420, y+12, 200, 48, `Buy · ${c}`, () => buy(c, r[3]), { disabled: r[4] || G.scrap < c, col:C.good }); });
      const race = DATA.races[st.crewRace]; const rx = cx+680; panel(rx, y0, 680, 300, 8); label('Crew for hire', rx+20, y0+34, C.muted);
      const crewN = s.crew.filter(c=>c.owner==='p'&&!c.drone).length; const cc = price(50, st);
      if(race && !st.crewSold){ T(race.name, rx+20, y0+80, { s:26, f:FD, w:700, c:race.color }); para(race.desc||'', rx+20, y0+116, 640, { s:16, lh:22, c:C.muted });
        btn(rx+20, y0+220, 240, 54, `Hire · ${cc}`, () => buy(cc, () => { addCrew(s, st.crewRace, 'p'); st.crewSold = true; checkCrewAch(); }), { disabled: G.scrap<cc || crewN>=R.maxCrew, fill:G.scrap>=cc && crewN<R.maxCrew, col:C.good });
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
function sysDesc(k){ return { drones:'Power drones that fight, defend, repair or board.', teleporter:'Send up to 4 crew to the enemy ship and bring them back.', cloaking:'Vanish: +60% evasion and enemy weapons stop charging.',
  hacking:'Attach a drone to an enemy system, then pulse it to shut it down.', mindcontrol:'Turn an enemy crew member to your side for a while.', medbay:'Heals crew standing inside it.', clonebay:'Brings dead crew back after a short delay.',
  battery:'A backup battery that adds temporary reactor power.', sensors:'See inside enemy ships: damage at level 1, crew at 2, weapon charge at 3.', doors:'Lets you open and close doors. Stronger doors slow boarders.' }[k] || ''; }
function drawShipModal(){
  const s = G.ship, f = mframe(1440, 880, s.name);
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:26, f:FD, w:700, c:C.amber });
  tabs(f.x+32, f.y+76, [['systems','Systems'],['crew','Crew'],['gear','Weapons & drones'],['augments','Augments']], UI.tab, t => UI.tab = t, 230);
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
      panel(x, y, 670, 138, 8); ctx.beginPath(); ctx.arc(x+30, y+32, 12, 0, 7); ctx.fillStyle = race.color||'#fff'; ctx.fill();
      T(c.name, x+52, y+40, { s:22, f:FD, w:700 }); T(`${race.name} · ${Math.ceil(c.hp)}/${c.maxHp} hp · ${c.kills} kills`, x+52, y+64, { s:14, c:C.muted });
      SKILLS.forEach((k,j) => { const lv = skillLvl(c,k), t = SKILLT[k], v = c.sk[k]||0; const sx = x+20 + j*106, sy = y+86;
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
  if(e.target && e.target.closest && e.target.closest('dialog,#modPanel,#renameDlg')) return;
  if(UI.screen!=='game' || !G) return;
  if(e.code==='Space'){ e.preventDefault(); if(!G.modal) G.paused = !G.paused; }
  else if(e.key==='m' || e.key==='M'){ if(G.modal?.type==='map') G.modal = null; else if(!G.modal) openMap(); }
  else if(e.key==='c' || e.key==='C'){ if(!G.modal) activateCloak(G.ship); }
  else if(e.key==='v' || e.key==='V'){ G.hold = !G.hold; }
  else if(/^[1-4]$/.test(e.key) && !G.modal){ const i = +e.key-1, w = G.ship.weapons[i]; if(w && w.on) { UI.selWeapon = UI.selWeapon===i ? null : i; UI.mode = null; } }
  else if(e.key==='Escape'){ if(G.modal && ['map','ship','store'].includes(G.modal.type)) G.modal = null; UI.selCrew = null; UI.selWeapon = null; UI.mode = null; }
});
