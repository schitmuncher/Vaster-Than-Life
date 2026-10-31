'use strict';
/* =========================================================================
   VR command deck. Turns the bridge from "a screen you sit in front of"
   into a cockpit you work with your hands.

   - Datapad: the whole game screen on a tablet in your hand (left stick
     click), so you can command from anywhere aboard.
   - Pop-out windows: events, stores, the ship screen, the map and tips open
     as a window in front of you, wherever you are standing.
   - Touch: press any VR button or screen by touching it with your controller.
   - Tactical and engineering stations either side of the holotable: weapons,
     drones, cloak, teleporter, hacking, power, doors and crew at arm's reach.
   - Point at the enemy ship outside the canopy (or on the holotable) and pull
     the trigger: every powered gun locks onto that room, or only the gun you
     picked. Locked rooms carry a marker on the real ship.
   - Holographic star map over the holotable: point at a beacon to jump.
   - A fire extinguisher you can grab and spray, and a short guided tour the
     first time you put the headset on.
   ========================================================================= */
const DECK = { init:false, pad:null, padScreen:null, padOpen:false, padIdx:-1,
  pop:null, popScreen:null, popEdge:null, popFor:null, popRect:'', popAway:0, popMove:0, popTo:null,
  poke:[{ d:1, latched:false }, { d:1, latched:false }], dots:[], st:[], spaceHover:[-1,-1], marks:[], map:null, ext:null, tour:null, sparks:[] };
const FDF = "'Chakra Petch', sans-serif", FMF = "'IBM Plex Mono', monospace";

/* ---------------- small canvas helpers for the VR panels ---------------- */
function vT(g, t, x, y, o={}){ g.font = `${o.w||600} ${o.s||24}px ${o.f||FMF}`; g.fillStyle = o.c || VCOL.ink; g.textAlign = o.a || 'left'; g.textBaseline = 'alphabetic'; if(o.max) g.fillText(String(t), x, y, o.max); else g.fillText(String(t), x, y); }
function vRect(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function vBar(g, x, y, w, h, f, col){ g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(x, y, w, h); g.fillStyle = col; g.fillRect(x, y, w*clamp(f||0, 0, 1), h); }
function vWrap(g, text, maxW, font){ g.font = font; const out = []; let line = ''; for(const w of String(text).split(' ')){ const t = line ? line + ' ' + w : w; if(g.measureText(t).width > maxW && line){ out.push(line); line = w; } else line = t; } out.push(line); return out; }
const _dv = () => new THREE.Vector3();
function camFlat(){ const d = _dv(); camera.getWorldDirection(d); d.y = 0; if(d.lengthSq() < 1e-4) d.set(0, 0, -1); return d.normalize(); }

/* ---------------- setup ---------------- */
function deckInit(){
  if(DECK.init || !bridge || typeof THREE==='undefined') return; DECK.init = true;
  deckInitPad(); deckInitPop(); deckInitStations(); deckInitMarks(); deckMapInit(); deckExtInit(); deckLeverInit();
  for(let i=0;i<2;i++){ const d = glowSpriteMesh('#ffd27a', .03); d.visible = false; d.renderOrder = 30; d.material.depthTest = false; scene.add(d); DECK.dots.push(d); }
}

/* ---------------- datapad ---------------- */
function deckInitPad(){
  const g = new THREE.Group(), w = .44, h = .275;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + .034, h + .034, .016), stdMat({ color:0x1f2640, metalness:.8, roughness:.35 })); body.position.z = -.0095; g.add(body);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(w + .036, .008, .018), new THREE.MeshBasicMaterial({ color:0xffb547 })); lip.position.set(0, -(h/2 + .017), -.009); g.add(lip);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:tex, toneMapped:false })); g.add(scr);
  g.rotation.order = 'YXZ'; g.visible = false; DECK.pad = g; DECK.padScreen = scr;
}
function deckPadHand(){ const want = SET.vrPadHand==='right' ? 'right' : 'left'; return controllers.find(c => c.userData.src && c.userData.src.handedness===want) || controllers.find(c => c.userData.src) || null; }
function deckTogglePad(on){
  DECK.padOpen = on ?? !DECK.padOpen; sfx('click');
  if(DECK.padOpen && !PROFILE.padTold){ PROFILE.padTold = 1; saveProfile(); toast('Your datapad. Point at it with your other hand, or tap it. Click the left stick again to put it away.'); }
}
function deckUpdatePad(){
  const c = deckPadHand(), show = DECK.padOpen && !!c;
  if(show && DECK.pad.parent !== c){ c.add(DECK.pad); const L = c.userData.src.handedness !== 'right'; DECK.pad.position.set(L ? .05 : -.05, .11, -.08); DECK.pad.rotation.set(-.8, L ? .35 : -.35, 0); }
  DECK.pad.visible = show; DECK.padIdx = show ? c.userData.idx : -1;
}

/* ---------------- pop-out windows ---------------- */
function deckInitPop(){
  const g = new THREE.Group();
  const halo = glowSpriteMesh('#ffb547', 1); halo.material.opacity = .22; halo.material.depthTest = false; halo.renderOrder = 19;
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.85, depthTest:false, depthWrite:false })); edge.position.z = -.003; edge.renderOrder = 20;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:tex, toneMapped:false, transparent:true, depthTest:false, depthWrite:false })); scr.renderOrder = 21;
  g.add(halo, edge, scr); g.visible = false; scene.add(g);
  DECK.pop = g; DECK.popScreen = scr; DECK.popEdge = edge; DECK.popHalo = halo;
}
/* what the pop-out shows: the open window, a captain's tip, or the whole screen (menus) when the main screen is far away */
function deckPopSource(){
  if(SET.vrPopups === false) return null;
  if(UI.screen==='game' && G){
    if(typeof KB!=='undefined' && KB.open && UI.kbRect) return { r:UI.kbRect, key:'kb' };
    // standing at the holotable with the 3D star map up: no need for a flat copy of the map floating in front of you
    if(G.modal && G.modal.type==='map' && deckMapActive() && holo.group.getWorldPosition(_dv()).distanceTo(headWorld()) < 2.5) return null;
    if(G.modal && UI.modalRect) return { r:UI.modalRect, key:G.modal }; if(UI.hint && UI.hintRect) return { r:UI.hintRect, key:UI.hint }; return null; }
  const pp = panelGroup.getWorldPosition(_dv()), h = headWorld();
  if(!panelGroup.visible || pp.distanceTo(h) > 3.4) return { r:{ x:0, y:0, w:W, h:H }, key:'menu' };
  return null;
}
function deckPopTarget(){
  const h = headWorld(), d = camFlat();
  if(panelGroup.visible){ const pp = panelGroup.getWorldPosition(_dv()), to = pp.clone().sub(h), dist = to.length(); to.y = 0; to.normalize();
    if(dist < 3 && to.dot(d) > .82){ const pos = h.clone().addScaledVector(to, Math.min(1.3, dist*.68)); pos.y = Math.max(.9, h.y - .12); return pos; } }   // lift the window out of the main screen towards you
  const pos = h.clone().addScaledVector(d, 1.25); pos.y = Math.max(.9, h.y - .12); return pos;
}
function deckUpdatePop(dt){
  const P = DECK.pop, src = (UI.screen!=='game' || G) ? deckPopSource() : null;
  if(!src){ P.visible = false; DECK.popFor = null; return; }
  const r = src.r, key = `${r.x|0},${r.y|0},${r.w|0},${r.h|0}`;
  if(key !== DECK.popRect){ DECK.popRect = key;
    const uv = DECK.popScreen.geometry.attributes.uv, u0 = r.x/W, u1 = (r.x + r.w)/W, v1 = 1 - r.y/H, v0 = 1 - (r.y + r.h)/H;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
    const k = Math.min(.00085, 1.32/r.w), w = r.w*k, h = r.h*k;
    DECK.popScreen.scale.set(w, h, 1); DECK.popEdge.scale.set(w + .016, h + .016, 1); DECK.popHalo.scale.set(w*1.5, h*1.6, 1); }
  const h = headWorld();
  if(src.key !== DECK.popFor){ DECK.popFor = src.key; const t = deckPopTarget(); P.position.copy(t); P.lookAt(h.x, t.y, h.z); P.visible = true; DECK.popAway = 0; DECK.popMove = 0; return; }
  // keep it within reach: if you walk off or turn away for a moment, it glides back in front of you
  const to = P.position.clone().sub(h), dist = to.length(); to.normalize(); const look = _dv(); camera.getWorldDirection(look);
  if(dist > 2.6 || to.dot(look) < .25) DECK.popAway += dt; else DECK.popAway = 0;
  if(DECK.popAway > 1.1){ DECK.popAway = 0; DECK.popMove = 1; DECK.popTo = deckPopTarget(); }
  if(DECK.popMove > 0){ DECK.popMove = Math.max(0, DECK.popMove - dt*2.2); P.position.lerp(DECK.popTo, Math.min(1, dt*7)); P.lookAt(h.x, P.position.y, h.z); }
}
/* every mesh that shows the game screen and can be pointed at (the hand holding the datapad cannot point at its own pad) */
function deckSurfaces(i){ const L = []; if(panelGroup.visible) L.push(panelMesh); if(DECK.pop && DECK.pop.visible) L.push(DECK.popScreen); if(DECK.pad && DECK.pad.visible && DECK.padIdx !== i) L.push(DECK.padScreen); return L; }
function deckNeedsTex(){ return !!((DECK.pop && DECK.pop.visible) || (DECK.pad && DECK.pad.visible)); }

/* ---------------- touch: press screens and buttons with the controller tip ---------------- */
function deckTip(c){ return c.localToWorld(new THREE.Vector3(0, 0, -.03)); }
function deckPoke(){
  controllers.forEach((c, i) => {
    const P = DECK.poke[i], dot = DECK.dots[i]; if(!c.userData.src){ P.d = 1; P.latched = false; if(dot) dot.visible = false; return; }
    const tip = deckTip(c); let best = null;
    const targets = deckSurfaces(i).map(m => ({ m, canvas:true }));
    for(const W_ of VUI.items) if(vuiShown(W_.mesh) && W_.mesh.parent !== c) targets.push({ m:W_.mesh, W:W_ });
    for(const T_ of targets){ const m = T_.m, gp = m.geometry.parameters; if(!gp || !gp.width) continue;
      const n = _dv().set(0, 0, 1).transformDirection(m.matrixWorld), o = _dv().setFromMatrixPosition(m.matrixWorld);
      const dist = tip.clone().sub(o).dot(n); if(dist < -.025 || dist > .07) continue;
      const lp = m.worldToLocal(tip.clone()); if(Math.abs(lp.x) > gp.width/2 || Math.abs(lp.y) > gp.height/2) continue;
      if(!best || Math.abs(dist) < Math.abs(best.dist)) best = { T_, dist, n }; }
    if(!best){ P.d = 1; P.latched = false; if(dot) dot.visible = false; return; }
    raycaster.set(tip.clone().addScaledVector(best.n, .1), best.n.clone().negate()); const hit = raycaster.intersectObject(best.T_.m, false)[0];
    if(!hit || !hit.uv){ P.d = 1; return; }
    if(dot){ dot.visible = true; dot.position.copy(hit.point); dot.scale.setScalar(.012 + Math.max(0, best.dist)*.25); }
    let act = null;
    if(best.T_.canvas){ const x = hit.uv.x*W, y = (1 - hit.uv.y)*H; PTR[1+i].x = x; PTR[1+i].y = y; PTR[1+i].on = true; act = () => click(x, y); }
    else { const W_ = best.T_.W, x = hit.uv.x*W_.pxW, y = (1 - hit.uv.y)*W_.pxH; const idx = W_.regions.findIndex(rg => rg.cb && x >= rg.x && x <= rg.x + rg.w && y >= rg.y && y <= rg.y + rg.h);
      VUI.hover[i] = { W:W_, idx }; if(idx >= 0) act = () => vuiClick({ W:W_, idx }); }
    if(best.dist < .012 && P.d >= .012 && !P.latched && act){ P.latched = true; act(); pulse(c.userData.src, .45, 25); }
    if(best.dist > .03) P.latched = false;
    P.d = best.dist;
  });
}

/* ---------------- tactical and engineering stations ---------------- */
function deckTactical(){
  return vuiMake(.52, .33, 1024, 650, (Wd) => {
    const g = Wd.g; vuiFrame(Wd, 'TACTICAL', VCOL.bad);
    if(!G || UI.screen!=='game'){ vT(g, 'Standing by', 24, 120, { s:30, c:VCOL.muted }); return; }
    const s = G.ship, e = G.enemy && !G.enemy.dead ? G.enemy : null;
    if(e){ vT(g, e.name, 1000, 42, { s:24, a:'right', c:VCOL.bad, f:FDF, w:700, max:560 }); vBar(g, 560, 54, 300, 14, e.hull/e.maxHull, VCOL.bad); vT(g, `SHIELDS ${e.shield}`, 1000, 70, { s:20, a:'right', c:VCOL.cyan }); }
    else vT(g, G.enemy && G.enemy.dead ? 'Target destroyed' : 'No hostile contacts', 1000, 44, { s:24, a:'right', c:VCOL.good });
    // weapon cards
    const n = Math.max(1, R.weaponSlots), cw = (976 - (n-1)*12)/n, y0 = 84, ch = 300;
    for(let i=0;i<n;i++){ const x = 24 + i*(cw + 12), wp = s.weapons[i], d = wp && DATA.weapons[wp.id];
      g.fillStyle = 'rgba(255,255,255,.05)'; vRect(g, x, y0, cw, ch, 14); g.fill();
      if(!d){ g.setLineDash([10, 8]); g.strokeStyle = '#2a3350'; g.lineWidth = 3; vRect(g, x, y0, cw, ch, 14); g.stroke(); g.setLineDash([]); vT(g, 'EMPTY', x + cw/2, y0 + ch/2, { s:22, a:'center', c:VCOL.muted }); continue; }
      const sel = UI.selWeapon===i, ready = wp.on && wp.charge >= d.charge;
      g.lineWidth = sel ? 5 : 2; g.strokeStyle = sel ? VCOL.amber : wp.on ? 'rgba(255,181,71,.55)' : '#2a3350'; vRect(g, x, y0, cw, ch, 14); g.stroke();
      vWrap(g, `${i+1} ${d.name}`, cw - 24, `700 23px ${FDF}`).slice(0, 2).forEach((l, k) => vT(g, l, x + 12, y0 + 32 + k*26, { s:23, f:FDF, w:700, c: wp.on ? VCOL.ink : VCOL.muted }));
      vT(g, d.heal ? `HEAL ${d.heal}` : d.type==='bomb' ? `BOMB ${d.sysDamage||0} SYS` : `${d.type.toUpperCase()} ${d.damage||0}×${d.shots||1}`, x + 12, y0 + 98, { s:18, c:VCOL.muted, max:cw - 24 });
      vBar(g, x + 12, y0 + 108, cw - 24, 14, wp.on ? wp.charge/d.charge : 0, ready ? VCOL.good : VCOL.amber);
      vT(g, !wp.on ? 'OFF' : ready ? (wp.target==null ? 'READY' : 'FIRING') : `${Math.max(0, d.charge - wp.charge).toFixed(1)}s`, x + 12, y0 + 148, { s:20, c: ready ? VCOL.good : VCOL.muted });
      const tg = wp.target!=null && e && e.rooms[wp.target] ? '→ ' + (SYSN[e.rooms[wp.target].sys] || 'room') : sel ? '→ pick a room' : '';
      if(tg) vT(g, tg, x + 12, y0 + 176, { s:19, c: sel ? VCOL.amber : VCOL.bad, max:cw - 24 });
      vuiBtn(Wd, x + 10, y0 + 186, cw - 20, 50, wp.on ? 'POWER OFF' : 'POWER ON', () => weaponToggle(i), { s:20, col: wp.on ? VCOL.muted : VCOL.amber, fill:!wp.on && eff(s,'weapons') - weaponPowerUsed(s) >= d.power });
      vuiBtn(Wd, x + 10, y0 + 242, cw - 20, 50, wp.target!=null ? 'CLEAR' : sel ? 'CANCEL' : 'AIM', () => weaponAim(i), { s:22, col:VCOL.bad, fill:sel, disabled:!wp.on }); }
    // fire control and special systems
    const acts = [[G.autofire ? 'AUTOFIRE ON' : 'AUTOFIRE OFF', () => { G.autofire = !G.autofire; }, false, !!G.autofire, VCOL.bad],
      [G.hold ? 'FIRE VOLLEY' : 'HOLD FIRE', () => { G.hold = !G.hold; }, false, !!G.hold, VCOL.amber]];
    for(const k of ['cloaking','teleporter','hacking','mindcontrol','battery']){ if(!s.systems[k]) continue;
      const a = k==='battery' ? [s.battery.t>0 ? `BATT ${s.battery.t.toFixed(0)}s` : s.battery.cd>0 ? `BATT ${Math.ceil(s.battery.cd)}s` : 'BATTERY', () => activateBattery(s), !canBattery(s)] : sysAction(k);
      if(a) acts.push([String(a[0]).toUpperCase(), a[1], a[2] || !a[1], (k==='teleporter'&&UI.mode==='tele')||(k==='hacking'&&UI.mode==='hack')||(k==='mindcontrol'&&UI.mode==='mind'), SYSC[k] || VCOL.cyan]); }
    const bw = (976 - (acts.length-1)*10)/acts.length;
    acts.forEach((a, i) => vuiBtn(Wd, 24 + i*(bw + 10), 398, bw, 76, a[0], a[1] || (() => {}), { s: acts.length > 5 ? 18 : 22, col:a[4], fill:a[3], disabled:a[2] }));
    // drones
    const ds = s.drones;
    if(!s.systems.drones && !ds.length) vT(g, 'No drone bay', 24, 534, { s:20, c:VCOL.muted });
    else { const m = Math.max(1, R.droneSlots), dw = (976 - (m-1)*10)/m; for(let i=0;i<m;i++){ const dr = ds[i], bp = dr && DATA.drones[dr.id], x = 24 + i*(dw + 10);
        if(!bp){ g.setLineDash([8, 8]); g.strokeStyle = '#2a3350'; g.lineWidth = 2; vRect(g, x, 488, dw, 66, 12); g.stroke(); g.setLineDash([]); continue; }
        vuiBtn(Wd, x, 488, dw, 66, `${bp.name.toUpperCase()}${dr.on ? (dr.unit ? ' · OUT' : ' · ON') : ''}`, () => droneToggle(i), { s:18, col:'#f0a6ff', fill:dr.on }); } }
    // what the trigger does right now
    const hint = UI.selWeapon!=null ? 'Point at an enemy room and pull the trigger' : UI.mode==='tele' ? 'Point at an enemy room to beam your team over' : UI.mode==='hack' ? 'Point at an enemy room to launch the hacking drone' : UI.mode==='mind' ? 'Point at an enemy crew member to take control'
      : e ? 'Trigger on the enemy ship outside: all guns aim at that room' : `Missiles ${G.missiles} · Drone parts ${G.parts}`;
    vT(g, hint, 512, 612, { s:21, a:'center', c: UI.selWeapon!=null || UI.mode ? VCOL.amber : VCOL.muted, max:980 });
  }, { back:false });   // the lectern is its housing
}
function deckEngineering(){
  return vuiMake(.52, .33, 1024, 650, (Wd) => {
    const g = Wd.g; vuiFrame(Wd, 'ENGINEERING', VCOL.cyan);
    if(!G || UI.screen!=='game'){ vT(g, 'Standing by', 24, 120, { s:30, c:VCOL.muted }); return; }
    const s = G.ship, free = reactorFree(s), avail = reactorAvail(s);
    vT(g, `REACTOR ${free} FREE OF ${avail}`, 1000, 42, { s:22, a:'right', c: free ? VCOL.good : VCOL.muted });
    for(let i=0;i<avail;i++){ g.fillStyle = i < free ? VCOL.good : 'rgba(123,224,160,.15)'; g.fillRect(1000 - (i+1)*22, 52, 16, 14); }
    const list = MAIN.filter(k => s.systems[k]).slice(0, 9), tw = (976 - 24)/3, th = 150;
    list.forEach((k, i) => { const x = 24 + (i%3)*(tw + 12), y = 78 + Math.floor(i/3)*(th + 10), sy = s.systems[k], col = SYSC[k] || VCOL.cyan, ef = eff(s, k);
      g.fillStyle = 'rgba(255,255,255,.05)'; vRect(g, x, y, tw, th, 14); g.fill(); g.lineWidth = 2; g.strokeStyle = sy.dmg ? VCOL.bad : 'rgba(255,255,255,.12)'; vRect(g, x, y, tw, th, 14); g.stroke();
      vT(g, (VUI_SYS[k] || SYSN[k] || k).toUpperCase(), x + 14, y + 32, { s:22, f:FDF, w:700, c:col, max:tw - 90 }); vT(g, `LV ${sy.max}`, x + tw - 14, y + 32, { s:18, a:'right', c:VCOL.muted });
      const pw = Math.min(30, (tw - 28 - (sy.max - 1)*4)/sy.max);
      for(let b=0;b<sy.max;b++){ g.fillStyle = b >= sy.max - sy.dmg ? VCOL.bad : b < ef ? col : 'rgba(255,255,255,.12)'; g.fillRect(x + 14 + b*(pw + 4), y + 44, pw, 18); }
      const st = sy.dmg ? `${sy.dmg} damaged` : sy.ionT>0 ? 'ion locked' : k==='shields' ? `${shieldLayers(s)} layer${shieldLayers(s)===1?'':'s'}` : manned(s, k) ? 'manned' : `${sy.power}/${sy.max}`;
      vT(g, st, x + 14, y + 86, { s:18, c: sy.dmg ? VCOL.bad : VCOL.muted, max:tw - 28 });
      vuiBtn(Wd, x + 12, y + 94, 136, 46, '−', () => sysMinus(k), { s:40, col, disabled:sy.power<=0 });
      vuiBtn(Wd, x + tw - 148, y + 94, 136, 46, '+', () => sysPlus(k), { s:40, col, fill:free>0 && sy.power < sy.max - sy.dmg }); });
    const vent = s.doors.some(d => d.b<0 && d.open);
    const acts = [['DOORS OPEN', () => { if(!setAllDoors(s, true, false)) toast('Door control is down.'); }, VCOL.good, false], ['DOORS SHUT', () => { if(!setAllDoors(s, false, true)) toast('Door control is down.'); }, '#c9a27e', false],
      [vent ? 'SEAL AIRLOCKS' : 'VENT AIRLOCKS', () => { if(!canDoors(s)){ toast('Door control is down.'); return; } for(const d of s.doors) if(d.b<0) d.open = !vent; }, VCOL.cyan, vent],
      ['STATIONS', () => { returnToStations(s); toast('Crew back to stations.'); }, VCOL.amber, false], [G.crewAuto ? 'AUTO CREW ON' : 'AUTO CREW OFF', () => { G.crewAuto = !G.crewAuto; }, VCOL.good, !!G.crewAuto]];
    const bw = (976 - (acts.length-1)*10)/acts.length;
    acts.forEach((a, i) => vuiBtn(Wd, 24 + i*(bw + 10), 566, bw, 70, a[0], a[1], { s:19, col:a[2], fill:a[3] }));
  }, { back:false });
}
function deckInitStations(){
  const mk = (side) => {
    const g = new THREE.Group(), frameM = stdMat({ color:0x2b3350, metalness:.9, roughness:.3 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .06, 1, 12), frameM); g.add(post);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.17, .21, .04, 28), stdMat({ color:0x1d2338, metalness:.85, roughness:.35 })); foot.position.y = .02; g.add(foot);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.19, .006, 6, 40), new THREE.MeshBasicMaterial({ color: side<0 ? 0xff5a7a : 0x5fd3e6 })); ring.rotation.x = Math.PI/2; ring.position.y = .045; g.add(ring);
    const head = new THREE.Group(); g.add(head);
    const back = new THREE.Mesh(new THREE.BoxGeometry(.555, .365, .03), frameM); back.position.z = -.018; head.add(back);
    const lit = new THREE.Mesh(new THREE.BoxGeometry(.557, .008, .032), new THREE.MeshBasicMaterial({ color: side<0 ? 0xff5a7a : 0x5fd3e6 })); lit.position.set(0, -.18, -.016); head.add(lit);
    const W_ = side < 0 ? deckTactical() : deckEngineering(); W_.mesh.position.z = .002; W_.cull = true; head.add(W_.mesh); head.scale.setScalar(1.12);
    bridge.group.add(g); return { g, post, head, W:W_, side };
  };
  DECK.st = [mk(-1), mk(1)]; deckPlaceStations();
}
/* either side of the holotable, at chest height for how you play (standing or seated), tilted towards you like a lectern */
const STATION_X = .7, STATION_Z = -.34;
function deckPlaceStations(){
  if(!DECK.st.length) return; const hy = anchor.pos ? anchor.pos.y : 1.6, py = Math.max(.62, hy - .47);
  for(const S of DECK.st){ const x = S.side*STATION_X, z = STATION_Z; S.g.position.set(x, 0, z); S.g.rotation.y = Math.atan2(-x, -z);
    S.post.scale.y = py - .1; S.post.position.y = (py - .1)/2; S.head.position.set(0, py, 0); S.head.rotation.set(-.62, 0, 0);
    S.g.visible = SET.vrStations !== false; }
  deckPlaceLever();
}

/* ---------------- targeting the enemy ship outside ---------------- */
function deckInitMarks(){
  for(let i=0;i<4;i++){ const c = mkCanvas(128, 128), g = c.getContext('2d');
    g.strokeStyle = '#ff5a7a'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.stroke(); g.lineWidth = 5;
    for(const [a, b, cx, cy] of [[64,4,64,30],[64,98,64,124],[4,64,30,64],[98,64,124,64]]){ g.beginPath(); g.moveTo(a, b); g.lineTo(cx, cy); g.stroke(); }
    g.font = `700 40px ${FDF}`; g.fillStyle = '#ffd0d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i+1), 64, 66);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:texFrom(c), transparent:true, depthTest:false, depthWrite:false })); s.renderOrder = 12; s.visible = false; DECK.marks.push(s); }
}
function deckSpacePick(i, o, d){
  const M = space3d && space3d.enemy, e = G && G.enemy; DECK.spaceHover[i] = -1;
  if(!M || !e || e.dead || !M.group.visible || (typeof IN!=='undefined' && IN.aboard) || UI.screen!=='game' || G.modal) return null;
  raycaster.set(o, d); const hit = raycaster.intersectObject(M.hull, false)[0]; if(!hit) return null;
  const lp = M.group.worldToLocal(hit.point.clone()), x = lp.x + M.mx, y = lp.z + M.my;
  const ri = (e._rects||[]).findIndex(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
  DECK.spaceHover[i] = ri; return { x, y, ri, point:hit.point, dist:hit.distance };
}
/* trigger on an enemy room: the picked gun or mode acts as on the console; with nothing picked, every powered gun locks on */
function deckTargetRoom(pk){
  if(!G || !G.enemy || G.enemy.dead) return false;
  if(UI.selWeapon!=null || UI.mode || UI.selCrew || (UI.selCrews||[]).length){ click(pk.x, pk.y); if(UI.selWeapon!=null || UI.mode) sfx('lock'); return true; }
  if(pk.ri < 0) return false;
  const guns = G.ship.weapons.filter(w => w.on && !DATA.weapons[w.id]?.heal); if(!guns.length){ toast('No powered weapons. Power them at the tactical station.'); return true; }
  for(const w of guns) w.target = pk.ri; sfx('lock'); toast(`All guns on the enemy ${SYSN[G.enemy.rooms[pk.ri].sys] || 'room'}.`); return true;
}
function deckUpdateMarks(t){
  const M = space3d && space3d.enemy, e = G && G.enemy, live = M && e && !e.dead && M.group.visible && UI.screen==='game' && !(typeof IN!=='undefined' && IN.aboard);
  for(const m of DECK.marks) m.visible = false; if(!live) return;
  const rects = e._rects || [];
  G.ship.weapons.slice(0, 4).forEach((w, i) => { if(w.target==null || !rects[w.target]) return; const q = rects[w.target], m = DECK.marks[i];
    if(m.parent !== M.group) M.group.add(m); const off = (G.ship.weapons.filter((v, k) => k < i && v.target===w.target).length)*.32;
    m.position.set(q.x + q.w/2 - M.mx + off*q.w, M.topY + 6, q.y + q.h/2 - M.my); m.scale.setScalar(Math.max(q.w, q.h)*.85*(1 + .06*Math.sin(t*6 + i))); m.visible = true; });
  // hovered room glows on the real ship
  const hov = DECK.spaceHover.find(v => v >= 0); if(hov!=null && hov >= 0 && M.rooms[hov]){ const r = M.rooms[hov]; r.visible = true; r.material.color.set(UI.selWeapon!=null || UI.mode ? 0xffb547 : 0xff5a7a); r.material.opacity = .45 + .2*Math.sin(t*8); }
}

/* ---------------- holographic star map ---------------- */
const MAPTEX = {};
function deckMapIcon(kind, col){ const k = kind + col; if(MAPTEX[k]) return MAPTEX[k];
  const c = mkCanvas(96, 96), g = c.getContext('2d'); g.fillStyle = 'rgba(8,12,24,.85)'; g.beginPath(); g.arc(48, 48, 40, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = col; g.stroke();
  if(kind==='unknown' || kind==='event'){ g.font = `700 50px ${FDF}`; g.fillStyle = kind==='event' ? '#e8eef9' : '#8592b0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 48, 51); }
  else if(kind!=='visited' && kind!=='start') mapIcon(kind, 48, 48, 46, col, g);
  return MAPTEX[k] = texFrom(c); }
function deckMapKind(n, i){
  const scan = hasAug(G.ship, 'scanners'), known = scan || n.revealed, flagHere = G.flag && G.flag.node===i;
  const kind = flagHere ? 'flag' : n.type==='store' ? 'store' : n.type==='exit' ? 'exit' : n.type==='base' ? 'base' : n.type==='start' ? 'start' : n.quest && !n.visited ? 'quest' : n.distress && !n.visited ? 'distress' : n.visited ? 'visited' : known ? (n.type==='combat' ? 'hostile' : n.type==='event' ? 'event' : 'empty') : 'unknown';
  const col = { flag:'#ff5a7a', store:'#7be0a0', exit:'#7be0a0', base:'#7be0a0', quest:'#ffd166', distress:'#ffd166', hostile:'#ff5a7a', visited:'#8592b0', start:'#8592b0', empty:'#8592b0' }[kind] || '#dfe6f5';
  const name = { flag:'The Flaggship', store:'Store', exit:'Exit beacon', base:'Fedoration command', start:'Start', quest:'Quest beacon', distress:'Distress signal', visited:'Visited beacon', hostile:'Hostile ship', event:'Event', empty:'Empty beacon', unknown:'Unknown beacon' }[kind];
  return { kind, col, name };
}
function deckMapInit(){
  if(!holo) return; const g = new THREE.Group(); g.visible = false; holo.top.add(g);
  const info = vuiMake(.42, .13, 640, 200, (Wd) => { const D = DECK.map, i = D.hover; vuiFrame(Wd, '', '#5fd3e6'); if(i < 0 || !G || !G.map) return; const n = G.map.nodes[i], k = deckMapKind(n, i), gg = Wd.g;
    vT(gg, k.name.toUpperCase(), 24, 50, { s:32, f:FDF, w:700, c:k.col });
    const cur = G.map.nodes[G.map.cur], reach = cur.links.includes(i), ahead = (n.x - G.fleetX)/fleetStep();
    const bits = []; if(n.hazard && (hasAug(G.ship,'scanners') || n.revealed || n.visited || reach)) bits.push(HAZARDS[n.hazard]); if(n.nebula) bits.push('Nebula');
    bits.push(n.x < G.fleetX ? 'Held by the fleet' : ahead < 1.6 ? 'Fleet arrives next jump' : `Fleet in ~${Math.floor(ahead)} jumps`);
    vT(gg, bits.join(' · '), 24, 98, { s:24, c:VCOL.ink, max:592 });
    vT(gg, i===G.map.cur ? 'You are here' : reach ? (canJump() && G.warp<=0 ? 'Trigger or jump lever: jump here' : 'The VTL drive is charging') : 'Not connected to where you are', 24, 150, { s:24, c: reach ? VCOL.amber : VCOL.muted, max:592 }); });
  info.mesh.visible = false; info.mesh.renderOrder = 8; g.add(info.mesh);
  DECK.map = { g, nodes:[], key:'', hover:-1, info, geo:new THREE.SphereGeometry(.014, 14, 10) };
}
function deckMapBuild(){
  const D = DECK.map; for(const o of [...D.g.children]) if(o !== D.info.mesh){ D.g.remove(o); if(o.geometry && o.geometry !== D.geo) o.geometry.dispose(); }
  D.nodes = []; const nodes = G.map.nodes, X = v => -.66 + v*1.32, Z = v => -.26 + v*.52;
  nodes.forEach((n, i) => { const p = new THREE.Vector3(X(n.x), .07 + ((i*7)%5)*.009, Z(n.y));
    const ball = new THREE.Mesh(D.geo, new THREE.MeshBasicMaterial({ color:0xdfe6f5 })); ball.position.copy(p); D.g.add(ball);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthWrite:false })); icon.scale.setScalar(.042); icon.position.copy(p).add(new THREE.Vector3(0, .04, 0)); D.g.add(icon);
    const stem = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().setY(.004), p]), new THREE.LineBasicMaterial({ color:0x2f4a78, transparent:true, opacity:.6 })); D.g.add(stem);
    D.nodes.push({ i, p, ball, icon, k:'' }); });
  const pos = []; nodes.forEach((a, i) => a.links.forEach(j => { if(j < i) return; pos.push(...D.nodes[i].p.toArray(), ...D.nodes[j].p.toArray()); }));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  D.links = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color:0x5f7aa8, transparent:true, opacity:.45 })); D.g.add(D.links);
  D.live = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color:0x5fd3e6 })); D.g.add(D.live);
  D.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color:0xffb547 })); D.g.add(D.trail);
  D.fleet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color:0xff3050, transparent:true, opacity:.28, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })); D.fleet.rotation.y = Math.PI/2; D.g.add(D.fleet);
  D.fleetFloor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color:0xff3050, transparent:true, opacity:.16, depthWrite:false })); D.fleetFloor.rotation.x = -Math.PI/2; D.g.add(D.fleetFloor);
  D.cur = new THREE.Mesh(new THREE.TorusGeometry(.027, .004, 8, 36), new THREE.MeshBasicMaterial({ color:0xffb547 })); D.cur.rotation.x = Math.PI/2; D.g.add(D.cur);
  D.ship = new THREE.Mesh(new THREE.ConeGeometry(.012, .035, 3), new THREE.MeshBasicMaterial({ color:0xffd27a })); D.ship.rotation.z = -Math.PI/2; D.g.add(D.ship);
  D.X = X;
}
function deckMapActive(){ return !!(DECK.map && inXR() && UI.screen==='game' && G && G.map && G.modal && G.modal.type==='map' && SET.holotable !== false && holo && holo.top.visible); }
function deckMapUpdate(t){
  const D = DECK.map; if(!D) return; const want = deckMapActive();
  D.g.visible = want;
  if(!want){ D.hover = -1; D.info.mesh.visible = false; return; }
  const key = `${G.sector}:${G.map.nodes.length}:${G.seed||''}:${G.map.nodes.map(n => n.links.length).join('')}`; if(key !== D.key){ D.key = key; deckMapBuild(); }
  const nodes = G.map.nodes, cur = nodes[G.map.cur], jumpable = canJump() && G.warp<=0;
  D.nodes.forEach(N => { const n = nodes[N.i], k = deckMapKind(n, N.i), reach = cur.links.includes(N.i), hov = D.hover===N.i || (DECK.lever && DECK.lever.dest===N.i);
    if(N.k !== k.kind + k.col){ N.k = k.kind + k.col; N.icon.material.map = deckMapIcon(k.kind, k.col); N.icon.material.needsUpdate = true; N.ball.material.color.set(k.col); }
    const s = hov ? 1.9 : reach && jumpable ? 1.25 + .2*Math.sin(t*4 + N.i) : 1; N.ball.scale.setScalar(s); N.icon.scale.setScalar(hov ? .06 : .042);
    N.icon.material.opacity = n.x < G.fleetX && N.i !== G.map.cur ? .45 : 1; });
  const lp = []; for(const j of cur.links) lp.push(...D.nodes[G.map.cur].p.toArray(), ...D.nodes[j].p.toArray()); D.live.geometry.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); D.live.material.color.set(jumpable ? 0x5fd3e6 : 0x8592b0);
  const tr = (G.map.trail || []).filter(k => D.nodes[k]).map(k => D.nodes[k].p.clone().setY(D.nodes[k].p.y - .004)); D.trail.geometry.setFromPoints(tr.length > 1 ? tr : [new THREE.Vector3(), new THREE.Vector3()]); D.trail.visible = tr.length > 1;
  const c = D.nodes[G.map.cur].p; D.cur.position.copy(c); D.cur.scale.setScalar(1 + .15*Math.sin(t*3)); D.ship.position.set(c.x, c.y + .075, c.z);
  const fx = D.X(clamp(G.fleetX, -.2, 1.2)); const show = fx > -.66;
  D.fleet.visible = D.fleetFloor.visible = show; if(show){ D.fleet.position.set(Math.min(fx, .7), .09, 0); D.fleet.scale.set(.58, .16, 1); const w = Math.min(fx, .7) + .7; D.fleetFloor.scale.set(w, .58, 1); D.fleetFloor.position.set(-.7 + w/2, .003, 0); D.fleet.material.opacity = .22 + .08*Math.sin(t*3); }
  D.hover = DECK.mapHov.find(v => v >= 0) ?? -1;
  D.info.mesh.visible = D.hover >= 0; if(D.hover >= 0){ const p = D.nodes[D.hover].p; D.info.mesh.position.set(clamp(p.x, -.45, .45), p.y + .17, p.z); const h = holo.top.worldToLocal(headWorld()); D.info.mesh.lookAt(holo.top.localToWorld(new THREE.Vector3(h.x, D.info.mesh.position.y, h.z))); D.info.dirty = true; }
}
DECK.mapHov = [-1, -1];
function deckMapPick(i, o, d){
  const D = DECK.map; DECK.mapHov[i] = -1; if(!D || !D.g.visible) return null;
  const r = .03*(holo.top.scale.x || 1); let best = null;
  for(const N of D.nodes){ const wp = N.ball.getWorldPosition(_dv()), tt = wp.clone().sub(o).dot(d); if(tt < 0) continue; const perp = o.clone().addScaledVector(d, tt).distanceTo(wp); if(perp < r && (!best || tt < best.t)) best = { N, t:tt }; }
  if(!best) return null; DECK.mapHov[i] = best.N.i; return { idx:best.N.i, dist:best.t };
}
function deckMapClick(idx){
  const cur = G.map.nodes[G.map.cur]; if(idx===G.map.cur) return true;
  if(!cur.links.includes(idx)){ toast('Not connected to where you are.'); sfx('error'); return true; }
  if(!(canJump() && G.warp<=0)){ toast('The VTL drive must charge before you can jump.'); sfx('error'); return true; }
  jumpTo(idx); return true;
}

/* ---------------- fire extinguisher ---------------- */
function deckExtInit(){
  const g = new THREE.Group(), red = stdMat({ color:0xc8202a, metalness:.45, roughness:.35 }), dark = stdMat({ color:0x1d2338, metalness:.8, roughness:.35 });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .36, 18), red); can.rotation.x = Math.PI/2; can.position.z = .1; g.add(can);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 8, 0, Math.PI*2, 0, Math.PI/2), red); top.rotation.x = -Math.PI/2; top.position.z = -.08; g.add(top);
  const hose = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .14, 10), dark); hose.rotation.x = Math.PI/2; hose.position.set(0, .03, -.15); g.add(hose);
  const nozzle = new THREE.Object3D(); nozzle.position.set(0, .03, -.23); g.add(nozzle);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.057, .057, .04, 18), new THREE.MeshBasicMaterial({ color:0xffd27a })); band.rotation.x = Math.PI/2; band.position.z = .02; g.add(band);
  const rack = new THREE.Group(); const plate = new THREE.Mesh(new THREE.BoxGeometry(.24, .5, .03), dark); rack.add(plate);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(.22, .07), new THREE.MeshBasicMaterial({ map:texFrom((() => { const c = mkCanvas(256, 80), x = c.getContext('2d'); x.fillStyle = '#c8202a'; x.fillRect(0, 0, 256, 80); x.font = `700 30px ${FDF}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('GRAB ME', 128, 52); return c; })()) })); sign.position.set(0, .3, .017); rack.add(sign);
  const rx = 1.3, rz = .9 + Math.sqrt(3.3*3.3 - rx*rx) - .05; rack.position.set(rx, 1.05, rz); rack.rotation.y = Math.atan2(-rx, .9 - rz); bridge.group.add(rack);
  g.position.copy(rack.position).add(new THREE.Vector3(0, 0, 0).addScaledVector(new THREE.Vector3(Math.sin(rack.rotation.y), 0, Math.cos(rack.rotation.y)), .08)); g.rotation.set(Math.PI/2, rack.rotation.y, 0, 'YXZ'); bridge.group.add(g);
  DECK.ext = { g, nozzle, rack, held:-1, home:g.position.clone(), homeQ:g.quaternion.clone(), back:0, sprayT:0, puffs:[] };
}
/* grip near the extinguisher picks it up (called from vrgrab before anything else) */
function deckExtGrab(i){
  const E = DECK.ext, c = controllers[i]; if(!E || E.held >= 0 || !E.g.visible) return false;
  const hp = _dv().setFromMatrixPosition(c.matrixWorld), ep = E.g.getWorldPosition(_dv()); if(hp.distanceTo(ep) > .3) return false;
  c.add(E.g); E.g.position.set(0, -.04, .02); E.g.rotation.set(-.25, 0, 0, 'XYZ'); E.held = i; pulse(c.userData.src, .4, 40); sfx('click');
  if(!PROFILE.extTold){ PROFILE.extTold = 1; saveProfile(); toast('Point it at a fire and hold the trigger to spray.'); }
  return true;
}
function deckExtDrop(i){ const E = DECK.ext; if(!E || E.held !== i) return false; E.held = -1; bridge.group.attach(E.g); E.g.visible = true; E.back = 1; return true; }
function deckExtUpdate(dt){
  const E = DECK.ext; if(!E) return;
  if(E.held < 0){ if(E.back > 0){ E.back = Math.max(0, E.back - dt*1.2); E.g.position.lerp(E.home, Math.min(1, dt*4)); E.g.quaternion.slerp(E.homeQ, Math.min(1, dt*4)); } return; }
  const c = controllers[E.held], gp = c && c.userData.src && c.userData.src.gamepad; if(!gp){ deckExtDrop(E.held); return; }
  const spraying = !!(gp.buttons[0] && gp.buttons[0].pressed) && !(G && G.paused);
  if(!spraying) return;
  const np = E.nozzle.getWorldPosition(_dv()), dir = _dv().set(0, 0, -1).transformDirection(E.nozzle.matrixWorld).normalize();
  E.sprayT -= dt; if(E.sprayT <= 0){ E.sprayT = .2; sfx('spray', { vol:.7 }); pulse(c.userData.src, .12, 30); }
  // white puffs (in the ship's particle cloud when inside it, else simple sprites)
  const I = typeof IN!=='undefined' && IN.own && IN.own.group.visible ? IN.own : null;
  if(I && Math.random() < .9){ const lp = I.group.worldToLocal(np.clone()), ld = dir.clone().transformDirection(new THREE.Matrix4().copy(I.group.matrixWorld).invert()); for(let k=0;k<2;k++) emit(I, 'smoke', lp, ld.clone().multiplyScalar(rand(3, 5)).add(new THREE.Vector3(rand(-.4,.4), rand(-.3,.3), rand(-.4,.4))), .7, .35, '#f4f8ff', 0, 2.5); }
  // put out the fires it hits: anything within 3.5 m inside a narrow cone
  if(!I || !G || !G.ship) return; const sh = G.ship;
  I.rooms.forEach(Rm => { if(!Rm.fire.length) return; const r = sh.rooms[Rm.ri]; if(!r || r.fire <= 0) return;
    const hit = Rm.fire.some(F => { const wp = I.group.localToWorld(new THREE.Vector3(F.p.x, .5, F.p.z)), to = wp.sub(np), dist = to.length(); return dist < 3.5 && to.normalize().dot(dir) > .9; });
    if(hit){ r.fireP = (r.fireP||0) + R.repairRate*dt*6; if(r.fireP >= 1){ r.fireP = 0; r.fire = Math.max(0, r.fire - 1); sfx('repair'); pulse(c.userData.src, .5, 40); if(r.fire===0){ toast('Fire out.'); PROFILE.handFix = (PROFILE.handFix||0) + 1; if(PROFILE.handFix >= 10) grant('handson'); saveProfile(); } } } });
}

/* ---------------- the jump lever: grab it and pull it back to engage the VTL drive ----------------
   Charging: the gauge fills and the knob glows amber. Ready: it glows green.
   Pull it with no window open and the star map opens; with the map open, point at a beacon
   with your other hand and pull it again to jump there. */
const LEVER_REST = -.45, LEVER_PULL = .42;
function deckLeverInit(){
  const g = new THREE.Group(), dark = stdMat({ color:0x1d2338, metalness:.85, roughness:.35 }), steel = stdMat({ color:0x9aa6c4, metalness:.95, roughness:.2 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.028, .045, 1, 10), dark); g.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .03, 20), dark); foot.position.y = .015; g.add(foot);
  const head = new THREE.Group(); g.add(head);
  const box = new THREE.Mesh(new THREE.BoxGeometry(.15, .06, .2), dark); head.add(box);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.03, .004, .16), new THREE.MeshBasicMaterial({ color:0x0a0e1a })); slot.position.y = .031; head.add(slot);
  const gaugeBg = new THREE.Mesh(new THREE.PlaneGeometry(.12, .016), new THREE.MeshBasicMaterial({ color:0x2a3350 })); gaugeBg.position.set(0, 0, .1011); head.add(gaugeBg);
  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(.12, .016), new THREE.MeshBasicMaterial({ color:0x5fd3e6 })); gauge.position.set(0, 0, .1012); head.add(gauge);
  const lc = mkCanvas(256, 64), lx = lc.getContext('2d'); lx.font = `700 34px ${FDF}`; lx.fillStyle = '#ffb547'; lx.textAlign = 'center'; lx.fillText('VTL JUMP', 128, 44);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.12, .03), new THREE.MeshBasicMaterial({ map:texFrom(lc), transparent:true })); label.rotation.x = -Math.PI/2; label.position.set(0, .0315, .07); head.add(label);
  const pivot = new THREE.Group(); pivot.position.y = .03; head.add(pivot);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.01, .012, .2, 8), steel); arm.position.y = .1; pivot.add(arm);
  const knobM = new THREE.MeshBasicMaterial({ color:0xffb547 }), knob = new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 12), knobM); knob.position.y = .21; pivot.add(knob);
  const glow = glowSpriteMesh('#ffb547', .11); glow.position.y = .21; glow.material.opacity = .5; pivot.add(glow);
  bridge.group.add(g);
  DECK.lever = { g, post, head, pivot, knob, knobM, glow, gauge, held:-1, ang:LEVER_REST, fired:false, tick:0, dest:-1 };
  deckPlaceLever();
}
/* just right of the captain's spot, at hip height, so a right hand drops onto it */
function deckPlaceLever(){
  const L = DECK.lever; if(!L) return; const hy = anchor.pos ? anchor.pos.y : 1.6, py = Math.max(.5, hy - .66), x = .42, z = -.14;
  L.g.position.set(x, 0, z); L.g.rotation.y = Math.atan2(-x, -z);   // local +z faces the captain, so pulling towards you is "back"
  L.post.scale.y = py - .03; L.post.position.y = (py - .03)/2; L.head.position.y = py;
}
function deckLeverGrab(i){
  const L = DECK.lever, c = controllers[i]; if(!L || L.held >= 0 || !L.g.visible) return false;
  const hp = _dv().setFromMatrixPosition(c.matrixWorld), kp = L.knob.getWorldPosition(_dv()); if(hp.distanceTo(kp) > .14) return false;
  L.held = i; pulse(c.userData.src, .35, 30); sfx('click');
  if(!PROFILE.leverTold){ PROFILE.leverTold = 1; saveProfile(); toast('The jump lever. Pull it back towards you to engage the VTL drive.'); }
  return true;
}
function deckLeverDrop(i){ const L = DECK.lever; if(!L || L.held !== i) return false; L.held = -1; return true; }
function deckLeverPull(){
  const c = controllers[DECK.lever.held]; pulse(c && c.userData.src, .8, 90);
  if(!G || UI.screen!=='game' || G.warp > 0){ sfx('error'); return; }
  const m = G.modal;
  if(m && m.type==='map'){ const d = DECK.lever.dest;
    if(d >= 0 && d !== G.map.cur){ deckMapClick(d); if(G.warp > 0) grant('lever'); return; }
    toast('Point at a beacon on the star map with your other hand, then pull the lever.'); sfx('error'); return; }
  if(m){ toast('Close the open window first.'); sfx('error'); return; }
  if(!canJump()){ toast(`The VTL drive is still charging: ${Math.round((G.ftl||0)*100)}%.`); sfx('error'); return; }
  openMap(); toast(G.enemy && !G.enemy.dead ? 'Drive charged. Pick a beacon to escape to, then pull the lever.' : 'Pick a beacon on the star map, then pull the lever again.');
}
function deckLeverUpdate(dt, t){
  const L = DECK.lever; if(!L) return;
  L.g.visible = SET.vrStations !== false && !(typeof IN!=='undefined' && IN.deep);
  if(DECK.map && DECK.map.hover >= 0) L.dest = DECK.map.hover; if(!(G && G.modal && G.modal.type==='map')) L.dest = -1;
  if(L.held >= 0){ const c = controllers[L.held];
    if(!c || !c.userData.src){ L.held = -1; }
    else { const hp = L.head.worldToLocal(_dv().setFromMatrixPosition(c.matrixWorld)), a = clamp(Math.atan2(hp.z - L.pivot.position.z, Math.max(.02, hp.y - L.pivot.position.y)), LEVER_REST, LEVER_PULL + .08);
      if(Math.abs(a - L.ang) > .06){ L.tick = 0; pulse(c.userData.src, .1, 12); }
      L.ang = a; if(!L.fired && L.ang > LEVER_PULL){ L.fired = true; deckLeverPull(); } if(L.ang < LEVER_PULL - .3) L.fired = false; } }
  if(L.held < 0){ L.ang += (LEVER_REST - L.ang)*Math.min(1, dt*9); if(L.ang < LEVER_PULL - .3) L.fired = false; }
  L.pivot.rotation.x = L.ang;
  // charge gauge and knob colour
  const ready = !!(G && UI.screen==='game' && canJump() && G.warp<=0), f = !G ? 0 : ready ? 1 : (G.ftl||0);
  L.gauge.scale.x = Math.max(.001, f); L.gauge.position.x = -.06*(1 - f); L.gauge.material.color.set(ready ? 0x7be0a0 : 0x5fd3e6);
  const col = ready ? (G.enemy && !G.enemy.dead ? 0x7be0a0 : 0xffd27a) : 0x8592b0; L.knobM.color.set(col); L.glow.material.color.set(col);
  L.glow.material.opacity = ready ? .45 + .25*Math.sin(t*5) : .2;
}

/* ---------------- first-time tour ---------------- */
const TOUR = [
  { t:'Welcome aboard, Captain', b:'This is your bridge. You can play the whole game from here with your hands. NEXT shows you around, or skip it.', at:() => new THREE.Vector3(0, 1.45, -1.2) },
  { t:'Tactical station', b:'Power your guns, aim them and fire volleys. Point at the enemy ship outside the window and pull the trigger: every gun locks onto that room.', at:() => DECK.st[0] && DECK.st[0].head.getWorldPosition(_dv()), local:false },
  { t:'Engineering station', b:'Route reactor power with + and −. Open and shut doors, vent the airlocks and send crew to their stations. Touch the buttons or point and click.', at:() => DECK.st[1] && DECK.st[1].head.getWorldPosition(_dv()), local:false },
  { t:'Holotable', b:'Both ships, live. Open the map (B or Y) and it becomes a 3D star map: point at a beacon and pull the trigger to jump.', at:() => holo && holo.group.getWorldPosition(_dv()).add(new THREE.Vector3(0, .3, 0)), local:false },
  { t:'Jump lever', b:'Grip the lever and pull it back towards you to engage the drive: the star map opens. Point at a beacon with your other hand and pull it again to jump.', at:() => DECK.lever && DECK.lever.knob.getWorldPosition(_dv()), local:false },
  { t:'Datapad and windows', b:'Click the left stick for a datapad in your hand with the full game screen. Events, stores and maps pop up in front of you wherever you are.', at:() => new THREE.Vector3(0, 1.4, -1.0) } ];
function deckTourStart(force){
  if(DECK.tour || (!force && PROFILE.vrTourDone)) return;
  const W_ = vuiMake(.62, .3, 800, 388, (Wd) => { const T_ = DECK.tour, s = TOUR[T_.step], g = Wd.g; vuiFrame(Wd, s.t.toUpperCase(), VCOL.amber);
    vT(g, `${T_.step + 1}/${TOUR.length}`, 776, 46, { s:24, a:'right', c:VCOL.muted });
    vWrap(g, s.b, 750, `500 27px ${FMF}`).slice(0, 6).forEach((l, k) => vT(g, l, 24, 100 + k*36, { s:27, w:500 }));
    vuiBtn(Wd, 24, 306, 220, 66, 'SKIP TOUR', () => deckTourEnd(), { s:22, col:VCOL.muted });
    vuiBtn(Wd, 556, 306, 220, 66, T_.step < TOUR.length - 1 ? 'NEXT' : 'DONE', () => { T_.step++; if(T_.step >= TOUR.length) deckTourEnd(); else T_.placed = false; }, { s:26, fill:true }); });
  W_.mesh.renderOrder = 25; W_.mesh.material.depthTest = false; const holder = new THREE.Group(); scene.add(holder); holder.add(W_.mesh);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.04, .12, 12), new THREE.MeshBasicMaterial({ color:0xffb547, depthTest:false, transparent:true })); arrow.renderOrder = 26; scene.add(arrow);
  DECK.tour = { W:W_, arrow, holder, step:0, placed:false };
}
function deckTourEnd(){ const T_ = DECK.tour; if(!T_) return; scene.remove(T_.holder, T_.arrow); VUI.items = VUI.items.filter(w => w !== T_.W); DECK.tour = null; PROFILE.vrTourDone = 1; saveProfile(); }
function deckTourUpdate(t){
  const T_ = DECK.tour; if(!T_) return; const s = TOUR[T_.step]; if(!s){ deckTourEnd(); return; }
  let at = s.at(); if(!at){ T_.step++; return; }
  if(s.local !== false && bridge) at = bridge.group.localToWorld(at.clone());
  if(!T_.placed){ T_.placed = true; const h = headWorld(), dir = at.clone().sub(h); dir.y = 0; const dist = dir.length(); dir.normalize();
    const pos = h.clone().addScaledVector(dir, Math.min(1.0, Math.max(.75, dist*.55))).add(new THREE.Vector3(0, -.05, 0)); pos.y = clamp(pos.y, 1.0, 1.75);
    T_.W.mesh.position.copy(pos); T_.W.mesh.lookAt(h.x, pos.y, h.z); T_.W.dirty = true; T_.target = at.clone(); }
  // arrow bobbing above the thing being described
  const a = T_.target.clone().add(new THREE.Vector3(0, .32 + .05*Math.sin(t*4), 0)); T_.arrow.position.copy(a); T_.arrow.rotation.set(Math.PI, 0, 0); T_.arrow.visible = T_.step > 0 && T_.step < TOUR.length - 2 || T_.step === TOUR.length - 1;
}

/* ---------------- hull hits: sparks from the bridge consoles ---------------- */
function deckHitFx(dt){
  const s = G && G.ship; if(!s || !bridge) return;
  if(DECK.lastHull != null && s.hull < DECK.lastHull && UI.screen==='game'){ const n = Math.min(3, DECK.lastHull - s.hull);
    for(let k=0;k<n*6;k++){ const sp = glowSpriteMesh(Math.random() < .5 ? '#ffd27a' : '#ff8a3d', .05); const side = Math.random() < .5 ? -1 : 1;
      sp.position.set(side*rand(.5, 1.5), rand(.9, 1.6), rand(-.8, -.2)); bridge.group.add(sp); DECK.sparks.push({ m:sp, v:new THREE.Vector3(rand(-1,1), rand(.5, 2), rand(-1,1)), life:rand(.4, .8) }); } }
  DECK.lastHull = s.hull;
  for(let i=DECK.sparks.length-1;i>=0;i--){ const S = DECK.sparks[i]; S.life -= dt; if(S.life <= 0){ bridge.group.remove(S.m); S.m.material.dispose(); DECK.sparks.splice(i, 1); continue; } S.v.y -= 6*dt; S.m.position.addScaledVector(S.v, dt); S.m.material.opacity = Math.min(1, S.life*2); }
}

/* ---------------- the captain's blaster: shoot intruders aboard your ship, or the crew of a ship you beamed onto ---------------- */
const BLAST = { dmg:6, cd:.7 };   // about one crew member's punch: a help, never a cheat
function deckBlast(c, pk){
  if(!pk || pk.kind!=='crew' || !pk.c || UI.mode || SET.handsOn === false || typeof IN==='undefined') return false;
  const I = IN.aboard ? IN.foe : IN.own, sh = I && I.sh; if(!sh || !sh.crew.includes(pk.c) || crewSide(pk.c)==='p') return false;
  if(!(IN.aboard || headInOwn())) return false;   // you have to be aboard that ship
  const now = performance.now()/1000; if(now < (DECK.blastT||0)) return true; DECK.blastT = now + BLAST.cd;
  const tgt = pk.c; tgt.hp -= BLAST.dmg; tgt.lastByCrew = 'captain'; if(sh.isEnemy) tgt.killedByBoarder = true;
  const from = deckTip(c), P = I.crew.get(tgt.id), to = P ? P.g.getWorldPosition(_dv()).add(new THREE.Vector3(0, 1.2, 0)) : pk.hit.point.clone();
  const len = from.distanceTo(to), bolt = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, len, 6, 1, true), new THREE.MeshBasicMaterial({ color:0xffd27a, transparent:true, opacity:.95, blending:THREE.AdditiveBlending, depthWrite:false }));
  bolt.position.lerpVectors(from, to, .5); bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()); scene.add(bolt); DECK.bolts.push({ m:bolt, life:.14 });
  const lp = I.group.worldToLocal(to.clone()); for(let k=0;k<8;k++) interiorSpark(I, lp.clone().add(new THREE.Vector3(rand(-.1,.1), rand(-.2,.2), rand(-.1,.1))));
  sfx('laser', { vol:.6 }); pulse(c.userData.src, .55, 40);
  if(tgt.hp <= 0 && !tgt._counted){ tgt._counted = true; PROFILE.capKills = (PROFILE.capKills||0) + 1; saveProfile(); grant('sidearm'); if(PROFILE.capKills >= 5) grant('blaster5'); toast(`You took down ${tgt.name}.`); }
  if(!PROFILE.blastTold){ PROFILE.blastTold = 1; saveProfile(); toast('Your blaster: point at an intruder and pull the trigger. It hits about as hard as one crew member.'); }
  return true;
}
DECK.bolts = [];
function deckBolts(dt){ for(let i=DECK.bolts.length-1;i>=0;i--){ const B = DECK.bolts[i]; B.life -= dt; if(B.life <= 0){ scene.remove(B.m); B.m.geometry.dispose(); B.m.material.dispose(); DECK.bolts.splice(i, 1); continue; } B.m.material.opacity = B.life/.14; } }

/* ---------------- per frame (after the pointers) ---------------- */
function deckUpdate(dt){
  if(!inXR()) return; deckInit(); if(!DECK.init) return;
  const t = performance.now()/1000;
  deckUpdatePad(); deckUpdatePop(dt); deckPoke(); deckUpdateMarks(t); deckMapUpdate(t); deckExtUpdate(dt); deckLeverUpdate(dt, t); deckHitFx(dt); deckBolts(dt);
  if(nav.sessionT > 2.5 && UI.screen) deckTourStart(); deckTourUpdate(t);
  for(const S of DECK.st) S.g.visible = SET.vrStations !== false && !(typeof IN!=='undefined' && IN.deep);
  panelGroup.visible = SET.vrMainScreen !== false;   // the big screen can be switched off for a clear canopy
}
function deckReplayTour(){ PROFILE.vrTourDone = 0; saveProfile(); if(inXR()) deckTourStart(true); else toast('The tour starts next time you enter VR.'); }
