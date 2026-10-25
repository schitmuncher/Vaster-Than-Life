'use strict';
/* =========================================================================
   Hands-on ship (VR). Two optional ways to use your body instead of the console:

   1. Emergencies. A burning, breached or damaged room on your own ship shows
      a glowing marker on the spot. Put either hand close to it and hold the
      trigger to fix it yourself. You work at the same speed as a crew member (HANDS_BONUS):
      the edge is being there at once, not being faster. Playtests showed any speed bonus on top made the captain too strong.
   2. Captain's station. Rooms with a crewable system have a pad on the floor.
      Stand on it for a moment and you man that system, but only when no
      crew member already does. Step off to stand down.

   Both are bonuses on top of the normal game: everything here can also be done
   by crew from the console, nothing is required, and Settings > Gameplay >
   Hands-on bonuses turns it all off.
   ========================================================================= */
const HANDS_BONUS = 1.0, HAND_REACH = .8, PAD_R = .6, PAD_HOLD = 1.0;
const PAD_SYS = ['piloting','engines','weapons','shields','sensors','doors','oxygen','medbay'];
const HO = { work:null, prog:0, padT:0, padRoom:-1, hint:0, wasWorking:false, geo:null };
const CAPTAIN_CREW = { id:-9, name:'Captain', owner:'cap', drone:null, path:[], room:-1, sk:{}, race:'human', hp:100, maxHp:100, stunT:0, mcT:0 };

function handsOnEnabled(){ return SET.handsOn !== false; }
function hoState(sh, r){
  if(r.fire > 0) return 'fire'; if(r.breach > 0) return 'breach';
  const s = r.sys && sh.systems[r.sys]; if(s && s.dmg > 0) return 'sys'; return null;
}
function hoGeo(){
  if(HO.geo) return HO.geo;
  const lab = (txt, col) => { const c = mkCanvas(512, 96), g = c.getContext('2d'); g.fillStyle = 'rgba(8,14,30,.85)'; g.beginPath(); if(g.roundRect) g.roundRect(4,4,504,88,18); else g.rect(4,4,504,88); g.fill(); g.strokeStyle = col; g.lineWidth = 4; g.stroke();
    let fs = 38; g.textAlign = 'center'; g.textBaseline = 'middle'; do { g.font = `700 ${fs}px 'Chakra Petch', sans-serif`; fs -= 2; } while(g.measureText(txt).width > 470 && fs > 16); g.fillStyle = col; g.fillText(txt, 256, 50); return texFrom(c); };
  HO.geo = { ring: new THREE.RingGeometry(.42, .5, 40), disc: new THREE.CircleGeometry(.4, 32), beam: new THREE.CylinderGeometry(.34, .34, 1.5, 24, 1, true),
    fixTex: lab('HOLD TRIGGER · FIX IT', '#ffd27a'), padTex: lab('STAND HERE · MAN STATION', '#5fd3e6'), downTex: lab('SYSTEM DOWN', '#8592b0'), salTex: lab('HOLD TRIGGER · SALVAGE', '#ffd27a'), sabTex: lab('HOLD TRIGGER · SABOTAGE', '#ff5a7a'), onTex: lab('MANNING · STEP OFF TO STAND DOWN', '#7be0a0') };
  return HO.geo;
}
const glowMat = (col, op) => new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:op, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
function hoLabel(tex){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false, toneMapped:false })); s.scale.set(1.15, .22, 1); return s; }

function hoMark(I, ri){
  I.ho = I.ho || { marks:{}, pads:{} }; if(I.ho.marks[ri]) return I.ho.marks[ri];
  const G_ = hoGeo(), g = new THREE.Group();
  const ring = new THREE.Mesh(G_.ring, glowMat(0xffb547, .9)); ring.rotation.x = -Math.PI/2; ring.position.y = .03; g.add(ring);
  const fill = new THREE.Mesh(G_.disc, glowMat(0xffd27a, .55)); fill.rotation.x = -Math.PI/2; fill.position.y = .04; fill.scale.setScalar(.001); g.add(fill);
  const beam = new THREE.Mesh(G_.beam, glowMat(0xffb547, .14)); beam.position.y = .75; g.add(beam);
  const label = hoLabel(G_.fixTex); label.position.y = 1.9; g.add(label);
  g.visible = false; I.group.add(g); return (I.ho.marks[ri] = { g, ring, fill, beam, label });
}
function hoPad(I, ri, r){
  I.ho = I.ho || { marks:{}, pads:{} }; if(I.ho.pads[ri]) return I.ho.pads[ri];
  const G_ = hoGeo(), g = new THREE.Group(); const R_ = I.rooms[ri];
  const ring = new THREE.Mesh(G_.ring, glowMat(0x5fd3e6, .8)); ring.rotation.x = -Math.PI/2; ring.position.y = .03; g.add(ring);
  const disc = new THREE.Mesh(G_.disc, glowMat(0x5fd3e6, .16)); disc.rotation.x = -Math.PI/2; disc.position.y = .025; g.add(disc);
  const label = hoLabel(G_.padTex); label.position.y = 1.55; g.add(label);
  // beside the machine in the middle of the room, on whichever side has more room
  const c = R_.c.clone(); if(R_.d >= R_.w) c.x += R_.d/2 - .8; else c.z += R_.w/2 - .8;
  g.position.set(c.x, 0, c.z); g.visible = false; I.group.add(g);
  return (I.ho.pads[ri] = { g, ring, disc, label, pos:c, sys:r.sys, on:false });
}
/* the point in ship-local space where a room's emergency is */
function hoSpot(I, ri, st){
  const R_ = I.rooms[ri]; if(!R_) return null;
  if(st === 'fire' && R_.fire[0]) return R_.fire[0].p; if(st === 'breach' && R_.breach[0]) return R_.breach[0].p; return R_.c;
}
/* ---------------- salvage: a wrecked enemy leaves a crate aboard your ship ---------------- */
function hoCrate(I, sh, hands, head, dt, active){
  const C = HO.crate;
  if(G.enemy && G.enemy.dead && G.enemy.deadKind === 'destroyed' && HO.crateFor !== G.enemy){ HO.crateFor = G.enemy;
    const opts = sh.rooms.map((r, i) => i).filter(i => I.rooms[i] && !hostilesFor(sh, i, 'p')); const ri = opts.length ? opts[Math.floor(Math.random()*opts.length)] : -1;
    if(ri >= 0){ const R_ = I.rooms[ri]; const pos = R_.c.clone(); if(R_.d >= R_.w) pos.x -= R_.d/2 - .8; else pos.z -= R_.w/2 - .8;
      const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(.5, .35, .35), stdMat({ color:0x8a6a3a, metalness:.4, roughness:.5, emissive:0x3a2208, emissiveIntensity:.6 })); box.position.y = .2; g.add(box);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(.52, .08, .37), stdMat({ color:0xffb547, emissive:0xffb547, emissiveIntensity:.8 })); strap.position.y = .2; g.add(strap);
      const glow = glowSpriteMesh('#ffd27a', 1.1); glow.position.y = .4; g.add(glow); const fill = new THREE.Mesh(hoGeo().disc, glowMat(0xffd27a, .5)); fill.rotation.x = -Math.PI/2; fill.position.y = .04; fill.scale.setScalar(.001); g.add(fill);
      const label = hoLabel(hoGeo().salTex); label.position.y = 1.2; g.add(label);
      g.position.set(pos.x, 0, pos.z); I.group.add(g); HO.crate = { I, g, fill, label, pos, p:0, ri }; toast('Salvage from the wreck is aboard. Find the glowing crate.'); } }
  const c = HO.crate; if(!c) return;
  if(c.I !== I || G.warp > 0 || (G.enemy && !G.enemy.dead && HO.crateFor !== G.enemy)){ c.I.group.remove(c.g); HO.crate = null; return; }
  const t = performance.now()/1000; c.g.children[0].rotation.y = Math.sin(t)*.2; c.g.children[2].material.opacity = .7 + Math.sin(t*3)*.2; c.label.visible = Math.hypot(head.x - c.pos.x, head.z - c.pos.z) < 3.5;
  let hand = null; for(const h of hands) if(Math.hypot(h.local.x - c.pos.x, h.local.z - c.pos.z) < HAND_REACH && Math.abs(h.local.y - .6) < .9) hand = h;
  if(hand){ hand.c.userData.ho = true; }
  if(hand && hand.trig && active){ c.p += dt/1.0; if(Math.random() < dt*8) pulse(hand.c.userData.src, .2, 15);
    if(c.p >= 1){ const n = 2 + Math.floor(Math.random()*4); G.scrap += n; sfx('buy'); pulse(hand.c.userData.src, .7, 60); toast('Salvaged ' + n + ' scrap from the wreck.'); I.group.remove(c.g); HO.crate = null; return; } }
  else c.p = Math.max(0, c.p - dt*2);
  c.fill.scale.setScalar(Math.max(.001, c.p));
}
/* ---------------- pointing feedback + alerts ---------------- */
function hoHoverMark(){
  if(HO.hov) return HO.hov; const g = new THREE.Group();
  const ring = new THREE.Mesh(hoGeo().ring, glowMat(0xffd27a, .95)); ring.rotation.x = -Math.PI/2; ring.position.y = .035; g.add(ring);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), glowMat(0xffd27a, .16)); door.position.y = DH/2; g.add(door);
  g.visible = false; scene.add(g); return (HO.hov = { g, ring, door });
}
function hoHover(){
  const m = hoHoverMark(); let hit = null, door = false;
  for(const c of controllers){ const ip = c.userData.ipick; if(!ip || !c.userData.src) continue;
    if(ip.kind === 'crew' || ip.kind === 'floor'){ hit = ip.hit.point.clone(); if(ip.kind === 'crew'){ const I = IN.aboard ? IN.foe : IN.own; const P = I && I.crew.get(ip.c.id); if(P) hit = P.g.getWorldPosition(new THREE.Vector3()); } }
    else if(ip.kind === 'door'){ hit = ip.D.g.getWorldPosition(new THREE.Vector3()); door = true; m.g.quaternion.copy(ip.D.g.getWorldQuaternion(new THREE.Quaternion())); }
    if(hit) break; }
  m.g.visible = !!hit; if(!hit) return; if(!door) m.g.quaternion.identity(); m.g.position.copy(hit); if(!door) m.g.position.y = hit.y + .01; m.ring.visible = !door; m.door.visible = door;
  m.ring.scale.setScalar(1 + Math.sin(performance.now()/160)*.08);
}
function hoAlerts(dt){
  const n = typeof alertRooms === 'function' ? alertRooms().length : 0; HO.alertT = Math.max(0, (HO.alertT || 0) - dt);
  if(n > (HO.alertN || 0) && HO.alertT <= 0 && !IN.aboard && typeof hapticFn === 'function'){ hapticFn(.35, 120); HO.alertT = 6;
    if(!HO.alertTold){ HO.alertTold = true; toast('Emergency aboard. Glance at your left wrist and tap ALERT to jump straight there.'); } }
  HO.alertN = n;
}
function handsOnClear(){
  if(G && G.ship) G.ship.capMan = null;
  HO.work = null; HO.padT = 0; HO.padRoom = -1;
  for(const c of controllers) if(c.userData) c.userData.ho = false;
}

/* ---------------- boarding: sabotage the enemy's systems while you are aboard ---------------- */
function hoSabPad(I, ri, r){
  I.ho = I.ho || { marks:{}, pads:{}, sab:{} }; I.ho.sab = I.ho.sab || {}; if(I.ho.sab[ri]) return I.ho.sab[ri];
  const G_ = hoGeo(), g = new THREE.Group(), R_ = I.rooms[ri];
  const ring = new THREE.Mesh(G_.ring, glowMat(0xff5a7a, .9)); ring.rotation.x = -Math.PI/2; ring.position.y = .03; g.add(ring);
  const fill = new THREE.Mesh(G_.disc, glowMat(0xff5a7a, .5)); fill.rotation.x = -Math.PI/2; fill.position.y = .04; fill.scale.setScalar(.001); g.add(fill);
  const beam = new THREE.Mesh(G_.beam, glowMat(0xff5a7a, .14)); beam.position.y = .75; g.add(beam);
  const label = hoLabel(G_.sabTex); label.position.y = 1.9; g.add(label);
  const c = R_.c.clone(); if(R_.d >= R_.w) c.x += R_.d/2 - .8; else c.z += R_.w/2 - .8;
  g.position.set(c.x, 0, c.z); I.group.add(g);
  return (I.ho.sab[ri] = { g, ring, fill, beam, label, pos:c, p:0 });
}
function hoSabotage(dt){
  const I = IN.foe, sh = G.enemy; if(!I || !sh || sh.dead || !I.rooms) return;
  const active = !G.paused && !G.modal; const head = I.group.worldToLocal(headWorld()); const t = performance.now()/1000;
  const hands = controllers.map(c => { const p = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld); const gp = c.userData.src && c.userData.src.gamepad; return { c, local:I.group.worldToLocal(p), trig:!!(gp && gp.buttons[0] && gp.buttons[0].pressed) }; });
  for(const c of controllers) c.userData.ho = false;
  sh.rooms.forEach((r, ri) => {
    if(!r.sys || !sh.systems[r.sys] || SUB.includes(r.sys)) return;
    const P = hoSabPad(I, ri, r), s = sh.systems[r.sys]; const near = Math.hypot(head.x - P.pos.x, head.z - P.pos.z) < 7;
    P.g.visible = near; if(!near) return;
    const down = s.ionT > 0 || s.max - s.dmg <= 0; P.ring.material.color.setHex(down ? 0x8592b0 : 0xff5a7a); P.beam.material.opacity = down ? .05 : .14;
    P.label.material.map = down ? HO.geo.downTex : HO.geo.sabTex; P.label.visible = Math.hypot(head.x - P.pos.x, head.z - P.pos.z) < 3.2;
    P.ring.scale.setScalar(1 + (down ? 0 : Math.sin(t*5 + ri)*.06));
    let hand = null; if(!down) for(const h of hands) if(Math.hypot(h.local.x - P.pos.x, h.local.z - P.pos.z) < HAND_REACH && Math.abs(h.local.y - .9) < .9) hand = h;
    if(hand){ hand.c.userData.ho = true; P.beam.material.opacity = .32; }
    if(hand && hand.trig && active){ P.p += dt/2.2; if(Math.random() < dt*10) pulse(hand.c.userData.src, .25, 20); if(Math.random() < dt*6) sfx('hack'); if(Math.random() < dt*10) interiorSpark(I, new THREE.Vector3(P.pos.x, .8, P.pos.z));
      if(P.p >= 1){ P.p = 0; ionize(sh, r.sys, 2); PROFILE.sabotages = (PROFILE.sabotages||0) + 1; if(PROFILE.sabotages >= 5) grant('saboteur'); saveProfile(); sfx('zap'); pulse(hand.c.userData.src, .8, 80); toast('Sabotaged the enemy ' + (SYSN[r.sys] || r.sys) + ' for 10 seconds.'); if(IN.own && typeof crewBarkNear==='function') for(const [, P_] of I.crew){ if(P_.c.owner==='p' && !P_.c.drone){ crewBark(P_, 'sabo'); break; } } } }
    else P.p = Math.max(0, P.p - dt*2);
    P.fill.scale.setScalar(Math.max(.001, P.p));
  });
}

function handsOnUpdate(dt){
  medalWall();
  if(IN.aboard && IN.foe && G && handsOnEnabled() && UI.screen === 'game'){ if(IN.own && IN.own.ho) for(const k in IN.own.ho.marks) IN.own.ho.marks[k].g.visible = false; hoSabotage(dt); return; }
  const I = IN.own; const sh = G && G.ship;
  const live = !!(I && sh && I.group.visible && I.rooms && !IN.aboard && handsOnEnabled() && UI.screen === 'game');
  if(!live){ if(I && I.ho) for(const k in I.ho.marks) I.ho.marks[k].g.visible = false, I.ho.pads[k] && (I.ho.pads[k].g.visible = false);
    if(sh && sh.capMan) handsOnClear(); return; }
  const active = typeof inXR === 'function' && inXR() && !G.paused && !G.modal;
  hoHover(); hoAlerts(dt);
  const head = I.group.worldToLocal(headWorld());
  const t = performance.now()/1000;
  const hands = controllers.map(c => { const p = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld); const gp = c.userData.src && c.userData.src.gamepad; return { c, local:I.group.worldToLocal(p), trig:!!(gp && gp.buttons[0] && gp.buttons[0].pressed) }; });
  let work = null, padHit = -1;
  sh.rooms.forEach((r, ri) => {
    const R_ = I.rooms[ri]; if(!R_) return;
    const st = hoState(sh, r), near = Math.hypot(head.x - R_.c.x, head.z - R_.c.z) < 7;
    // emergency marker
    const m = hoMark(I, ri);
    if(st && near){
      const spot = hoSpot(I, ri, st); m.g.visible = true; m.g.position.set(spot.x, 0, spot.z);
      const col = st === 'fire' ? 0xff8a3d : st === 'breach' ? 0xff5a7a : 0xffd27a; m.ring.material.color.setHex(col); m.beam.material.color.setHex(col); m.fill.material.color.setHex(col);
      m.ring.scale.setScalar(1 + Math.sin(t*5 + ri)*.06); m.label.visible = Math.hypot(head.x - spot.x, head.z - spot.z) < 3.2;
      const safe = !hostilesFor(sh, ri, 'p');
      for(const h of hands){ const d = Math.hypot(h.local.x - spot.x, h.local.z - spot.z), dy = Math.abs(h.local.y - .9);
        if(safe && d < HAND_REACH && dy < .9){ m.beam.material.opacity = .32; if(!work) work = { ri, st, h, m }; } else m.beam.material.opacity = Math.max(m.beam.material.opacity, .14); }
      if(!(work && work.ri === ri)) m.beam.material.opacity = .14;
    } else m.g.visible = false;
    // captain's station pad
    if(r.sys && PAD_SYS.includes(r.sys) && sh.systems[r.sys]){
      const p = hoPad(I, ri, r); p.g.visible = near;
      const mine = sh.capMan === r.sys && HO.padRoom === ri, other = !mine && mannedCrewReal(sh, r.sys);
      p.ring.material.color.setHex(mine ? 0x7be0a0 : 0x5fd3e6); p.disc.material.opacity = mine ? .35 : .16;
      p.label.material.map = mine ? HO.geo.onTex : HO.geo.padTex; p.label.visible = near && Math.hypot(head.x - p.pos.x, head.z - p.pos.z) < 3.2 && !other;
      p.ring.visible = !other || mine;
      if(active && near && !other && Math.hypot(head.x - p.pos.x, head.z - p.pos.z) < PAD_R && !hostilesFor(sh, ri, 'p')) padHit = ri;
    }
  });
  // hands-on repair
  for(const h of hands) h.c.userData.ho = false;
  hoCrate(I, sh, hands, head, dt, active);
  const trigWork = work && work.h.trig && active;
  if(work){ work.h.c.userData.ho = true; }
  if(trigWork){
    const r = sh.rooms[work.ri], rate = 1 * R.repairRate * HANDS_BONUS * dt; let done = false;
    if(work.st === 'fire'){ r.fireP += rate*2.6*(hasAug(sh,'fireSup') ? 2 : 1); if(r.fireP >= 1){ r.fireP = 0; r.fire--; done = true; } HO.prog = r.fireP; }
    else if(work.st === 'breach'){ r.breachP += rate; if(r.breachP >= 1){ r.breachP = 0; r.breach--; done = true; } HO.prog = r.breachP; }
    else { const s = sh.systems[r.sys]; s.rep += rate; if(s.rep >= 1){ s.rep = 0; s.dmg--; done = true;
        if(s.prev > s.power && reactorFree(sh) > 0 && s.power < s.max - s.dmg){ s.power++; if(s.power >= s.prev) s.prev = 0; } if(r.sys === 'weapons' && sh.isEnemy) autoPowerWeapons(sh); } HO.prog = s.rep; }
    work.m.fill.scale.setScalar(Math.max(.001, Math.min(1, HO.prog)));
    if(Math.random() < dt*10){ pulse(work.h.c.userData.src, .25, 20); }
    if(Math.random() < dt*5){ sfx('repair'); }
    if(typeof interiorSpark === 'function' && Math.random() < dt*10) interiorSpark(I, new THREE.Vector3(work.m.g.position.x, .7, work.m.g.position.z));
    if(done){ PROFILE.handFix = (PROFILE.handFix||0) + 1; if(PROFILE.handFix >= 10) grant('handson'); saveProfile(); sfx('levelup', { vol:.5 }); pulse(work.h.c.userData.src, .7, 60); toast(work.st === 'fire' ? 'Fire out.' : work.st === 'breach' ? 'Breach patched.' : 'System repaired.'); if(typeof crewBarkNear==='function') crewBarkNear(I, new THREE.Vector3(work.m.g.position.x, 0, work.m.g.position.z), 'thanks'); work.m.fill.scale.setScalar(.001); }
    HO.work = work.ri;
  } else {
    if(HO.work != null){ const m = I.ho.marks[HO.work]; if(m) m.fill.scale.setScalar(.001); HO.work = null; }
  }
  // captain's station
  if(padHit >= 0){
    if(HO.padRoom !== padHit){ HO.padRoom = padHit; HO.padT = 0; }
    HO.padT += dt;
    if(HO.padT >= PAD_HOLD && sh.capMan !== sh.rooms[padHit].sys){ sh.capMan = sh.rooms[padHit].sys; sfx('power'); pulse(controllers[0].userData.src, .4, 40); pulse(controllers[1].userData.src, .4, 40);
      toast('Manning ' + (SYSN[sh.capMan] || sh.capMan) + '. Step off the pad to stand down.'); if(typeof crewBarkNear==='function') crewBarkNear(I, I.ho.pads[padHit].pos, 'cover'); }
    const p = I.ho.pads[padHit]; if(p && sh.capMan !== sh.rooms[padHit].sys) p.disc.material.opacity = .16 + .2*Math.min(1, HO.padT/PAD_HOLD);
  } else if(sh.capMan || HO.padRoom >= 0){
    if(sh.capMan) toast('Station stood down.'); sh.capMan = null; HO.padRoom = -1; HO.padT = 0; }
}
function mannedCrewReal(sh, k){ const c = mannedCrew(sh, k); return c && c !== CAPTAIN_CREW ? c : null; }

/* ---------------- medal wall: the achievements you have earned, on the bridge wall ---------------- */
function medalWall(){
  if(!bridge) return; const n = ACHIEVEMENTS.filter(a => PROFILE.ach[a.id]).length, key = n + '/' + ACHIEVEMENTS.length;
  if(HO.wall && HO.wall.key === key) return;
  if(!HO.wall){ const c = mkCanvas(1024, 512), tex = texFrom(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .8), new THREE.MeshBasicMaterial({ map:tex, transparent:true, toneMapped:false, side:THREE.DoubleSide }));
    m.position.set(-2.1, 1.7, 2.3); m.rotation.y = Math.PI/2 + .45; bridge.group.add(m); HO.wall = { m, c, tex }; }
  const W_ = HO.wall, g = W_.c.getContext('2d'); g.clearRect(0, 0, 1024, 512); g.fillStyle = 'rgba(10,16,34,.9)'; g.beginPath(); if(g.roundRect) g.roundRect(4, 4, 1016, 504, 28); else g.rect(4, 4, 1016, 504); g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffb547'; g.stroke();
  g.font = "700 44px 'Chakra Petch', sans-serif"; g.fillStyle = '#ffb547'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('MEDAL WALL', 36, 66); g.textAlign = 'right'; g.font = "600 34px 'IBM Plex Mono', monospace"; g.fillStyle = '#8592b0'; g.fillText(key, 988, 64);
  const cols = 8, cw = 116, ch = 96;
  ACHIEVEMENTS.forEach((a, i) => { const x = 40 + (i % cols)*cw + cw/2, y = 140 + Math.floor(i / cols)*ch + 30, got = !!PROFILE.ach[a.id];
    g.beginPath(); g.arc(x, y, 30, 0, 7); g.fillStyle = got ? '#ffb547' : 'rgba(255,255,255,.07)'; g.fill(); g.lineWidth = 4; g.strokeStyle = got ? '#ffe2a6' : '#2a3350'; g.stroke();
    g.font = "700 28px 'Chakra Petch', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = got ? '#10141f' : '#2f3a58'; g.fillText((a.name || '?').charAt(0), x, y + 2); });
  W_.key = key; W_.tex.needsUpdate = true;
}
