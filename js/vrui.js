'use strict';
/* =========================================================================
   VR interactive elements: small world-space widgets you point at and click.
   - Wrist menu: glance at your left hand for Map, Pause, bring the console,
     height, run, play position, magnifier and beam buttons.
   - Room consoles: float above each machine on your ship, live status plus
     power + / - and the buttons that system needs (autofire, vent, doors, cloak).
   Every widget gives hover feedback (highlight + tiny haptic tick) and a click
   sound, and reads like the main console so it feels like one interface.
   ========================================================================= */
const VUI = { wrist:null, items:[], hover:[null, null], t:0, lastBuild:null };
const VCOL = { bg:'rgba(10,16,34,.94)', line:'#26324f', amber:'#ffb547', cyan:'#5fd3e6', good:'#7be0a0', bad:'#ff5a7a', ink:'#e8eef9', muted:'#8592b0' };

function vuiMake(w, h, pxW, pxH, draw){
  const c = mkCanvas(pxW, pxH), g = c.getContext('2d'), t = texFrom(c);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:t, transparent:true, side:THREE.DoubleSide, depthWrite:false, toneMapped:false }));
  mesh.renderOrder = 5;
  const W_ = { mesh, c, g, t, pxW, pxH, regions:[], draw, dirty:true, hoverKey:'' };
  mesh.userData.vui = W_; VUI.items.push(W_); return W_;
}
function vuiBtn(W_, x, y, w, h, label, cb, o={}){
  const g = W_.g, hov = VUI.hover.some(hv => hv && hv.W === W_ && hv.idx === W_.regions.length);
  g.fillStyle = o.disabled ? 'rgba(255,255,255,.04)' : hov ? (o.col || VCOL.amber) : o.fill ? (o.col || VCOL.amber) : 'rgba(255,255,255,.07)';
  g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 14) : g.rect(x, y, w, h); g.fill();
  g.lineWidth = 3; g.strokeStyle = o.disabled ? '#2a3350' : (o.col || VCOL.amber); g.stroke();
  g.font = `700 ${o.s || 30}px 'Chakra Petch', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = o.disabled ? VCOL.muted : (hov || o.fill) ? '#10141f' : (o.col || VCOL.amber); g.fillText(label, x + w/2, y + h/2 + 2);
  W_.regions.push({ x, y, w, h, cb: o.disabled ? null : cb });
}
function vuiFrame(W_, title, col){ const g = W_.g; g.clearRect(0, 0, W_.pxW, W_.pxH); g.fillStyle = VCOL.bg; g.beginPath(); g.roundRect ? g.roundRect(2, 2, W_.pxW-4, W_.pxH-4, 22) : g.rect(2, 2, W_.pxW-4, W_.pxH-4); g.fill(); g.lineWidth = 4; g.strokeStyle = col || VCOL.amber; g.stroke();
  if(title){ g.font = "700 30px 'Chakra Petch', sans-serif"; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = col || VCOL.amber; g.fillText(title, 24, 46); } W_.regions = []; }
function vuiRedraw(W_){ W_.draw(W_); W_.t.needsUpdate = true; W_.dirty = false; }

/* ---------------- wrist menu ---------------- */
function vuiInitWrist(){
  const W_ = vuiMake(.3, .281, 640, 600, (Wd) => {
    vuiFrame(Wd, 'CAPTAIN', VCOL.amber); const g = Wd.g; const paused = !!(G && G.paused);
    const bw = 192, bh = 92, gx = 20, gy = 70, gap = 12;
    const cell = (i) => ({ x: gx + (i%3)*(bw+gap), y: gy + Math.floor(i/3)*(bh+gap) });
    let c;
    c = cell(0); vuiBtn(Wd, c.x, c.y, bw, bh, 'MAP', () => { if(G && !G.modal) openMap(); else if(G && G.modal?.type==='map') G.modal = null; });
    c = cell(1); vuiBtn(Wd, c.x, c.y, bw, bh, paused ? 'RESUME' : 'PAUSE', () => { if(G && !G.modal) G.paused = !G.paused; }, { fill:paused, col:VCOL.good });
    c = cell(2); vuiBtn(Wd, c.x, c.y, bw, bh, 'CONSOLE', () => { bringConsole(); }, { col:VCOL.cyan, s:26 });
    const h = SET.vrHeight || 0;
    c = cell(3); vuiBtn(Wd, c.x, c.y, bw, bh, 'HEIGHT −', () => setVrHeight((SET.vrHeight||0) - 3), { col:VCOL.cyan, s:26 });
    c = cell(4); vuiBtn(Wd, c.x, c.y, bw, bh, 'HEIGHT +', () => setVrHeight((SET.vrHeight||0) + 3), { col:VCOL.cyan, s:26 });
    c = cell(5); vuiBtn(Wd, c.x, c.y, bw, bh, 'POSE: ' + ({ standing:'STAND', seated:'SEAT', lying:'LIE' }[SET.vrPose||'standing']), () => { const o = ['standing','seated','lying']; setPlayPose(o[(o.indexOf(SET.vrPose||'standing')+1)%3]); }, { s:24 });
    c = cell(6); vuiBtn(Wd, c.x, c.y, bw, bh, SET.vrRunMode==='off' ? 'RUN: OFF' : 'RUN: ON', () => { SET.vrRunMode = SET.vrRunMode==='off' ? 'push' : 'off'; saveProfile(); }, { s:26, fill:SET.vrRunMode!=='off', col:VCOL.good });
    c = cell(7); vuiBtn(Wd, c.x, c.y, bw, bh, SET.vrLoupe===false ? 'ZOOM: OFF' : 'ZOOM: ON', () => { SET.vrLoupe = SET.vrLoupe===false; saveProfile(); if(!SET.vrLoupe && loupe) loupe.visible = false; }, { s:26, fill:SET.vrLoupe!==false, col:VCOL.cyan });
    const aboard = typeof IN!=='undefined' && IN.aboard, canGo = typeof IN!=='undefined' && IN.foe && G && G.enemy && !G.enemy.dead;
    c = cell(8); vuiBtn(Wd, c.x, c.y, bw, bh, aboard ? 'BEAM BACK' : 'BEAM OVER', () => { if(aboard) beamCaptain(false); else if(canGo) beamCaptain(true); else toast('No ship to board right now.'); }, { s:24, col:'#b48cff', disabled:!aboard && !canGo });
    const nAl = typeof alertRooms==='function' ? alertRooms().length : 0, inShip = typeof IN!=='undefined' && IN.own && IN.own.group.visible;
    c = cell(9); vuiBtn(Wd, c.x, c.y, bw, bh, nAl ? `ALERT ×${nAl}` : 'NO ALERTS', () => goToAlert(), { s:24, col:VCOL.bad, fill:nAl>0 && (Math.floor(VUI.t*2)%2===0), disabled:!nAl || !!aboard });
    c = cell(10); vuiBtn(Wd, c.x, c.y, bw, bh, 'TO BRIDGE', () => goToBridge(), { s:24, col:VCOL.amber, disabled:!!aboard });
    c = cell(11); vuiBtn(Wd, c.x, c.y, bw, bh, 'TO TELEPORT', () => goToRoomSys('teleporter'), { s:22, col:'#b48cff', disabled:!inShip || !!aboard });
    const sp = SET.speed || 1;
    c = cell(12); vuiBtn(Wd, c.x, c.y, bw, bh, `SPEED ${Math.round(sp*100)}%`, () => { const L = [.5,.75,1,1.25]; SET.speed = L[(L.indexOf(sp)+1) % L.length]; saveProfile(); }, { s:22, col:VCOL.cyan, fill:sp!==1 });
    c = cell(13); vuiBtn(Wd, c.x, c.y, bw, bh, G && G.autofire ? 'AUTOFIRE' : 'FIRE: HOLD', () => { if(G) G.autofire = !G.autofire; }, { s:22, col:VCOL.bad, fill:!!(G && G.autofire), disabled:!G });
    c = cell(14); vuiBtn(Wd, c.x, c.y, bw, bh, 'STATIONS', () => { if(G){ returnToStations(G.ship); toast('Crew back to stations.'); } }, { s:22, col:VCOL.good, disabled:!G });
    g.font = "500 22px 'IBM Plex Mono', monospace"; g.fillStyle = VCOL.muted; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillText(`height ${h>0?'+':''}${h} cm`, 618, 46);
  });
  W_.mesh.visible = false; VUI.wrist = W_;
}
function vuiUpdateWrist(){
  const W_ = VUI.wrist; if(!W_) return;
  const left = controllers.find(c => c.userData.src && c.userData.src.handedness==='left');
  if(!left || SET.vrWrist === false){ W_.mesh.visible = false; return; }
  if(W_.mesh.parent !== left){ left.add(W_.mesh); W_.mesh.position.set(.0, .145, -.04); W_.mesh.rotation.set(-.9, 0, 0); }
  const camP = headWorld(), camD = new THREE.Vector3(); camera.getWorldDirection(camD);
  const cp = new THREE.Vector3().setFromMatrixPosition(left.matrixWorld), to = cp.clone().sub(camP), dist = to.length(); to.normalize();
  const want = dist < .8 && to.dot(camD) > .82 || VUI.hover.some(hv => hv && hv.W === W_);
  W_.mesh.visible = want; W_.shown = want;
}

/* ---------------- quick travel: jump to the next emergency, the bridge or a system's room ---------------- */
function alertRooms(){ const I = IN && IN.own, sh = G && G.ship; if(!I || !sh || !I.rooms || !I.rooms.length) return []; const out = [];
  sh.rooms.forEach((r, ri) => { const st = typeof hoState==='function' ? hoState(sh, r) : null; if(st && I.rooms[ri]) out.push({ ri, st, sev:st==='fire' ? 3 : st==='breach' ? 2 : 1 }); }); return out; }
function standNear(I, p){ // a spot beside p that you can stand on, on the side you are coming from
  const h = headLocal(I); const d = new THREE.Vector3(h.x - p.x, 0, h.z - p.z); if(d.lengthSq() < .01) d.set(1, 0, 0); d.normalize();
  for(const dist of [1.1, .8, 1.5, .5, 0]){ const q = new THREE.Vector3(p.x + d.x*dist, 1.6, p.z + d.z*dist); const w = I.group.localToWorld(q.clone()); if(canStand(w)) return w; } return null; }
function goToAlert(){ const I = IN.own, al = alertRooms(); if(!al.length){ toast('No emergencies right now.'); return; }
  const h = headLocal(I); al.sort((a, b) => (b.sev - a.sev) || (Math.hypot(I.rooms[a.ri].c.x - h.x, I.rooms[a.ri].c.z - h.z) - Math.hypot(I.rooms[b.ri].c.x - h.x, I.rooms[b.ri].c.z - h.z)));
  const a = al[0], spot = typeof hoSpot==='function' ? hoSpot(I, a.ri, a.st) : I.rooms[a.ri].c; const w = standNear(I, spot); if(w){ teleportTo(w); toast(`To the ${a.st==='fire' ? 'fire' : a.st==='breach' ? 'breach' : 'damaged system'} in ${G.ship.rooms[a.ri].sys ? (SYSN[G.ship.rooms[a.ri].sys]||'the room') : 'the room'}.`); } }
function goToBridge(){ if(playPose()!=='standing'){ applyPlayMode(); return; } if(!anchor.pos) return; teleportTo(new THREE.Vector3(anchor.pos.x, 1.6, anchor.pos.z)); }
function goToRoomSys(k){ const I = IN.own, sh = G && G.ship; if(!I || !sh) return; const ri = sh.rooms.findIndex(r => r.sys === k); if(ri < 0 || !I.rooms[ri]){ toast('No such room on this ship.'); return; }
  const w = standNear(I, I.rooms[ri].c); if(w) teleportTo(w); }

/* ---------------- room consoles ---------------- */
const VUI_SYS = { shields:'SHIELDS', engines:'ENGINES', oxygen:'LIFE SUPPORT', weapons:'WEAPONS', drones:'DRONES', medbay:'MEDBAY', piloting:'HELM', sensors:'SENSORS', doors:'DOORS', teleporter:'TELEPORTER', cloaking:'CLOAKING', hacking:'HACKING', mindcontrol:'MIND CONTROL', battery:'BATTERY', clonebay:'CLONE BAY' };
function vuiRoomConsole(I, R){
  const r = R.r, k = r.sys; const col = (typeof SYSC!=='undefined' && SYSC[k]) || VCOL.cyan;
  const W_ = vuiMake(1.0, .56, 512, 288, (Wd) => {
    const sh = G && G.ship, s = sh && sh.systems[k]; vuiFrame(Wd, VUI_SYS[k] || k.toUpperCase(), col); const g = Wd.g; if(!s) return;
    g.font = "500 22px 'IBM Plex Mono', monospace"; g.fillStyle = VCOL.muted; g.textAlign = 'right'; g.fillText(`LV ${s.max}`, 490, 44);
    // power pips
    for(let i=0;i<s.max;i++){ const x = 24 + i*34; g.fillStyle = i >= s.max - s.dmg ? VCOL.bad : i < s.power ? col : 'rgba(255,255,255,.12)'; g.fillRect(x, 64, 26, 16); }
    g.font = "600 20px 'IBM Plex Mono', monospace"; g.textAlign = 'left'; g.fillStyle = s.dmg ? VCOL.bad : VCOL.ink; g.fillText(s.dmg ? `${s.dmg} damaged · crew repairing` : s.ionT>0 ? 'ION LOCKED' : `${s.power}/${s.max} powered`, 24, 108);
    const free = typeof reactorFree==='function' ? reactorFree(sh) : null;
    const bx = 24, by = 126, bw = 120, bh = 70;
    vuiBtn(Wd, bx, by, bw, bh, '−', () => { removePower(sh, k); sfx('power'); }, { col, s:44 });
    vuiBtn(Wd, bx + bw + 14, by, bw, bh, '+', () => { const rs = addPower(sh, k); sfx(rs==='ok' ? 'power' : 'error'); if(rs==='reactor') toast('No reactor power free.'); else if(rs==='damaged') toast('Damaged. Crew are repairing it.'); }, { col, s:44, fill:true });
    // system-specific actions on the right
    const ax = 290, aw = 200;
    if(k==='weapons') vuiBtn(Wd, ax, by, aw, bh, G.autofire ? 'AUTOFIRE ON' : 'AUTOFIRE OFF', () => { G.autofire = !G.autofire; }, { s:22, fill:G.autofire, col:VCOL.bad });
    else if(k==='oxygen'){ const vent = sh.doors.some(d => d.b<0 && d.open); vuiBtn(Wd, ax, by, aw, bh, vent ? 'SEAL AIRLOCKS' : 'VENT AIRLOCKS', () => { for(const d of sh.doors) if(d.b<0) d.open = !vent; }, { s:20, fill:vent, col:VCOL.cyan }); }
    else if(k==='doors'){ vuiBtn(Wd, ax, by, 96, bh, 'OPEN', () => { for(const d of sh.doors) if(d.b>=0){ d.open = true; d.broken = 0; } }, { s:22, col:VCOL.good }); vuiBtn(Wd, ax + 104, by, 96, bh, 'SHUT', () => { for(const d of sh.doors) if(d.b>=0) d.open = false; }, { s:22, col:VCOL.bad }); }
    else if(k==='cloaking'){ const on = sh.cloak && sh.cloak.t > 0; vuiBtn(Wd, ax, by, aw, bh, on ? 'CLOAKED' : 'CLOAK', () => { if(!activateCloak(sh)) toast('Cloak not ready.'); }, { s:24, fill:on, col:'#9fe8ff' }); }
    else if(k==='piloting'){ vuiBtn(Wd, ax, by, aw, bh, G.crewAuto ? 'AUTO CREW ON' : 'AUTO CREW OFF', () => { G.crewAuto = !G.crewAuto; }, { s:20, fill:G.crewAuto, col:VCOL.good }); }
    else if(k==='teleporter'){ const can = IN.foe && G.enemy && !G.enemy.dead; vuiBtn(Wd, ax, by, aw, bh, 'BEAM OVER', () => beamCaptain(true), { s:24, col:'#b48cff', disabled:!can }); }
    else { g.font = "500 20px 'IBM Plex Mono', monospace"; g.fillStyle = VCOL.muted; g.textAlign = 'left'; const t = { shields:`${Math.floor(s.power/2)} shield layers`, engines:`Evade ${Math.round(typeof evasion==='function' ? evasion(sh) : 0)}%`, medbay:'Heals crew in this room', sensors:'Shows enemy rooms', battery:'Backup power', drones:'Drones need parts' }[k] || 'Power it to use it'; g.fillText(t, ax, by + 42); }
    if(k==='weapons'){ // aim each gun at an enemy system from here: each press picks the next target
      const e = G.enemy && !G.enemy.dead ? G.enemy : null; const ws = sh.weapons.slice(0, 4), bw = 112;
      ws.forEach((w,i) => { const d = DATA.weapons[w.id]; const tgt = w.target!=null && e && e.rooms[w.target] ? (SYSS[e.rooms[w.target].sys] || 'ROOM') : '—';
        vuiBtn(Wd, 24 + i*(bw+8), 206, bw, 64, `${i+1}:${tgt}`, () => cycleWeaponTarget(i), { s:20, col: w.on ? VCOL.amber : VCOL.muted, disabled: !w.on || !e || !!(d && d.heal) }); });
      if(!ws.length){ g.font = "500 18px 'IBM Plex Mono', monospace"; g.fillStyle = VCOL.muted; g.textAlign = 'left'; g.fillText('No weapons mounted', 24, 246); } }
    else { g.font = "500 18px 'IBM Plex Mono', monospace"; g.fillStyle = VCOL.muted; g.textAlign = 'left'; g.fillText('Point at a button and pull the trigger', 24, 262); }
  });
  W_.mesh.userData.room = R; W_.key = ''; return W_;
}

/* weapons console: each press aims a gun at the next enemy system (shields, weapons, helm, engines, oxygen, then any other), or clears it */
function cycleWeaponTarget(i){
  const sh = G && G.ship, e = G && G.enemy && !G.enemy.dead ? G.enemy : null, w = sh && sh.weapons[i]; if(!w || !e || !w.on) return;
  const order = ['shields','weapons','piloting','engines','oxygen','drones','medbay','teleporter','cloaking','hacking','mindcontrol','sensors','doors','clonebay','battery'];
  const rooms = order.map(k => roomOf(e,k)).filter(r => r>=0 && e.systems[e.rooms[r].sys]);
  const cur = rooms.indexOf(w.target); w.target = cur + 1 < rooms.length ? rooms[cur + 1] : null; if(w.target==null && cur<0 && rooms.length) w.target = rooms[0];
  toast(`Weapon ${i+1}: ${w.target==null ? 'no target' : SYSN[e.rooms[w.target].sys] || 'room'}`);
}

/* ---------------- per-frame, picking, clicking ---------------- */
function vuiInit(){ if(!VUI.wrist) vuiInitWrist(); }
function vuiUpdate(dt){
  vuiInit(); vuiUpdateWrist(); VUI.t += dt;
  const I = IN && IN.own, here = I && I.group.visible && !IN.aboard && headInOwn();
  // room consoles on your own ship
  if(I && VUI.lastBuild !== I){ VUI.items = VUI.items.filter(w => w === VUI.wrist || (w.mesh.parent && w.mesh.parent.parent)); VUI.lastBuild = I; for(const R of I.rooms) R.vui = null; }
  if(I) for(const R of I.rooms){ const k = R.r.sys; if(!k) continue; const s = G && G.ship && G.ship.systems[k];
    const near = here && s && Math.hypot(headLocal(I).x - R.c.x, headLocal(I).z - R.c.z) < 5.5;
    if(near && !R.vui){ R.vui = vuiRoomConsole(I, R); I.group.add(R.vui.mesh); }
    if(R.vui){ R.vui.mesh.visible = !!near; if(R.label) R.label.s.visible = R.label.s.visible && !near;
      if(near && !R.vui.placed){ R.vui.placed = true; // wall-mount it on the side of the room with the most free wall (no doors), at chest height
        const hx = R.d/2 - .45, hz = R.w/2 - .45; let best = null, bd = -1;
        for(const [ox, oz] of [[hx,0],[-hx,0],[0,hz],[0,-hz]]){ const px = R.c.x + ox, pz = R.c.z + oz; let md = 9; for(const D of I.doors) md = Math.min(md, Math.hypot(D.pos.x - px, D.pos.z - pz)); for(const w of (I.windows||[])) md = Math.min(md, Math.hypot(w.cx - px, w.cz - pz)*.8); if(md > bd){ bd = md; best = [ox, oz]; } }
        R.vui.mesh.position.set(R.c.x + best[0], 1.55, R.c.z + best[1]); R.vui.mesh.rotation.set(-.12, Math.atan2(-best[0], -best[1]), 0); R.vui.mesh.scale.setScalar(1.15); } } }
  // redraw widgets that are visible (4 times a second, or right away after a click / hover change)
  for(const W_ of VUI.items){ if(!W_.mesh.visible) continue; const hk = VUI.hover.map(hv => hv && hv.W === W_ ? hv.idx : -1).join(','); W_.tick = (W_.tick||0) + dt;
    if(W_.dirty || hk !== W_.hoverKey || W_.tick > .25){ W_.hoverKey = hk; W_.tick = 0; vuiRedraw(W_); } }
}
function headLocal(I){ return I.group.worldToLocal(headWorld()); }
function vuiPick(i, origin, dir){
  const meshes = VUI.items.filter(w => w.mesh.visible).map(w => w.mesh); if(!meshes.length){ VUI.hover[i] = null; return null; }
  raycaster.set(origin, dir); const hit = raycaster.intersectObjects(meshes, false)[0];
  if(!hit || !hit.uv || hit.distance > 8){ VUI.hover[i] = null; return null; }
  const W_ = hit.object.userData.vui, x = hit.uv.x*W_.pxW, y = (1 - hit.uv.y)*W_.pxH;
  const idx = W_.regions.findIndex(rg => rg.cb && x >= rg.x && x <= rg.x + rg.w && y >= rg.y && y <= rg.y + rg.h);
  const prev = VUI.hover[i]; VUI.hover[i] = idx >= 0 ? { W:W_, idx } : { W:W_, idx:-1 };
  return { W:W_, idx, hit, newHover: idx >= 0 && (!prev || prev.W !== W_ || prev.idx !== idx) };
}
function vuiClick(pk){ if(!pk || pk.idx < 0) return false; const rg = pk.W.regions[pk.idx]; if(!rg || !rg.cb) return false; rg.cb(); sfx('click'); pk.W.dirty = true; return true; }
