'use strict';
/* =========================================================================
   Living sky and cinematic effects for VR.
   - Shooting stars, a sky that tints and flashes with the beacon's hazard
     (nebula clouds, ion-storm lightning, a blazing nearby sun, pulsar pulses,
     an asteroid belt), red alert pulses in combat, and a new planet at
     every beacon.
   - Hyperspace: a streaking light tunnel builds up as the drive spools,
     whites out at the jump, and you drop out in a shockwave.
   - Battle: bolt-shaped laser fire with muzzle flashes, smoking missiles,
     impact shockwaves, shield flares and big multi-stage explosions.
   Everything scales with Settings > Graphics (effects quality, sky effects).
   ========================================================================= */
let sky = null;
function fxq(){ return { low:.4, medium:.75, high:1, ultra:1.4 }[SET.gfx || 'high'] || 1; }
function streakTex(){
  const c = mkCanvas(64, 512), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.75, 'rgba(200,230,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(30, 0); g.lineTo(34, 0); g.lineTo(40, 512); g.lineTo(24, 512); g.closePath(); g.fill(); return texFrom(c);
}
function tunnelTex(){
  const c = mkCanvas(512, 1024), g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 1024);
  const r = srng(99);
  for(let i=0;i<420;i++){ const x = r()*512, y = r()*1024, l = 40 + r()*260, w = .6 + r()*2.2; const hue = r()<.5 ? 200 + r()*40 : 260 + r()*40;
    const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, `hsla(${hue},90%,75%,0)`); gr.addColorStop(.5, `hsla(${hue},90%,${70 + r()*25}%,${.4 + r()*.6})`); gr.addColorStop(1, `hsla(${hue},90%,75%,0)`);
    g.fillStyle = gr; g.fillRect(x, y, w, l); }
  const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
}
function cloudTex(seed){
  const c = mkCanvas(256, 256), g = c.getContext('2d'), r = srng(seed);
  for(let i=0;i<18;i++){ const x = 60 + r()*136, y = 60 + r()*136, rad = 30 + r()*70; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,256,256); }
  return texFrom(c);
}
function initSky(){
  const g = new THREE.Group(); scene.add(g);
  const tint = new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0, side:THREE.BackSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  g.add(tint);
  // shooting stars
  const st = streakTex(); const stars = [];
  for(let i=0;i<5;i++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 40), new THREE.MeshBasicMaterial({ map:st, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })); m.visible = false; g.add(m); stars.push({ m, t:0, dur:1, p:new THREE.Vector3(), v:new THREE.Vector3() }); }
  // nebula clouds
  const clouds = []; for(let i=0;i<9;i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:cloudTex(100+i), color:0x9a6cff, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }));
    const a = i/9*Math.PI*2, el = rand(-.4,.5); s.position.set(Math.cos(a)*300*Math.cos(el), Math.sin(el)*300, Math.sin(a)*300*Math.cos(el)); s.scale.setScalar(rand(220, 360)); g.add(s); clouds.push(s); }
  // nearby sun for sun hazards
  const bigSun = glowSpriteMesh('#ffb070', 1); bigSun.material.opacity = 0; bigSun.position.set(180, 60, -260); g.add(bigSun);
  const corona = glowSpriteMesh('#ffffff', 1); corona.material.opacity = 0; corona.position.copy(bigSun.position); g.add(corona);
  // asteroid belt
  const rocks = []; const rockMat = new THREE.MeshStandardMaterial({ color:0x6a6460, roughness:.95, metalness:.05, flatShading:true });
  for(let i=0;i<34;i++){ const geo = new THREE.DodecahedronGeometry(rand(.6, 3.2), 0); const pos = geo.attributes.position; for(let k=0;k<pos.count;k++) pos.setXYZ(k, pos.getX(k)*rand(.7,1.3), pos.getY(k)*rand(.6,1.2), pos.getZ(k)*rand(.7,1.3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, rockMat); const a = rand(0, Math.PI*2), rr_ = rand(35, 140); m.position.set(Math.cos(a)*rr_, rand(-18, 26), Math.sin(a)*rr_); m.userData = { a, r:rr_, w:rand(.004,.02)*(Math.random()<.5?-1:1), spin:new THREE.Vector3(rand(-.5,.5), rand(-.5,.5), rand(-.5,.5)) }; m.visible = false; g.add(m); rocks.push(m); }
  // hyperspace tunnel and flash
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 520, 40, 1, true), new THREE.MeshBasicMaterial({ map:tunnelTex(), transparent:true, opacity:0, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false }));
  tun.rotation.x = Math.PI/2; tun.visible = false; g.add(tun);
  const tunCore = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 520, 24, 1, true), new THREE.MeshBasicMaterial({ map:tunnelTex(), color:0xb0d8ff, transparent:true, opacity:0, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false }));
  tunCore.rotation.x = Math.PI/2; tunCore.visible = false; g.add(tunCore);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 8), new THREE.MeshBasicMaterial({ color:0xeaf4ff, transparent:true, opacity:0, side:THREE.BackSide, depthTest:false, depthWrite:false }));
  flash.renderOrder = 998; camera.add(flash);
  const shock = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 96), new THREE.MeshBasicMaterial({ color:0x9fd8ff, transparent:true, opacity:0, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false })); shock.visible = false; g.add(shock);
  sky = { g, tint, stars, starT:rand(2,5), clouds, bigSun, corona, rocks, tun, tunCore, flash, shock, shockT:0, lastNode:null, lastWarp:0, bolt:null, lightning:0, pulse:0, fx:[] };
}
function planetForBeacon(){
  const P = scene.userData.planet; if(!P || !G?.map) return;
  const node = G.map.cur; if(node===sky.lastNode) return; sky.lastNode = node;
  const r = srng(hashStr((G.sector||1) + ':' + node));
  const [, , , atmo, ring] = scene.userData.space;
  const show = r() < .8; P.visible = show; if(atmo) atmo.visible = show; if(ring) ring.visible = show && r() < .5;
  if(!show) return;
  const hue = r(), a = r()*Math.PI*2, el = (r()-.3)*.5, dist = 130 + r()*80;
  P.material.color.setHSL(hue, .35 + r()*.4, .55 + r()*.25); P.scale.setScalar(.6 + r()*1.1);
  P.position.set(Math.cos(a)*dist, Math.sin(el)*dist, Math.sin(a)*dist - 40);
  for(const o of [atmo, ring]) if(o){ o.position.copy(P.position); o.scale.copy(P.scale); }
  if(atmo?.material?.uniforms) atmo.material.uniforms.color.value.setHSL(hue, .7, .7);
}
function spawnShootingStar(){
  const s = sky.stars.find(x => !x.m.visible); if(!s) return;
  const a = rand(0, Math.PI*2), el = rand(.15, .9), R = 260;
  s.p.set(Math.cos(a)*Math.cos(el)*R, Math.sin(el)*R, Math.sin(a)*Math.cos(el)*R);
  const tang = new THREE.Vector3(-Math.sin(a), rand(-.6,-.1), Math.cos(a)).normalize();
  s.v.copy(tang).multiplyScalar(rand(140, 260)); s.t = 0; s.dur = rand(.5, 1.1); s.m.visible = true;
  s.m.scale.set(1, rand(.7, 1.6), 1);
  if(Math.random()<.4) sfx('shoot_star', { vol:.6 });
}
function updateSky(dt){
  if(!sky) return;
  const fxOn = SET.skyFx !== false, inGame = UI.screen==='game' && G;
  const hz = inGame ? G.hazard : null, t = performance.now()/1000;
  sky.g.position.copy(camera.getWorldPosition(new THREE.Vector3()));   // sky effects follow the player
  if(inGame) planetForBeacon();
  // shooting stars
  if(fxOn && SET.shootingStars !== false && !inXR_ar()){ sky.starT -= dt; if(sky.starT <= 0){ spawnShootingStar(); sky.starT = rand(2.5, 9) / (hz==='asteroid' ? 2 : 1); } }
  for(const s of sky.stars){ if(!s.m.visible) continue; s.t += dt; s.p.addScaledVector(s.v, dt); s.m.position.copy(s.p);
    const dir = s.v.clone().normalize(), nrm = s.p.clone().negate().normalize(); nrm.addScaledVector(dir, -nrm.dot(dir)).normalize();
    s.m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(dir, nrm), dir, nrm));
    const k = s.t/s.dur; s.m.material.opacity = Math.sin(Math.min(1,k)*Math.PI) * .95; if(k>=1) s.m.visible = false; }
  // hazard tint + flashes
  let col = new THREE.Color(0,0,0), op = 0;
  const reduce = SET.reduceFlashes;
  if(fxOn && inGame){
    if(hz==='nebula' || G.nebula){ col.set(0x6a3cbf); op = .22 + .04*Math.sin(t*.4); }
    else if(hz==='ionstorm'){ col.set(0x2f8fbf); op = .12; sky.lightning -= dt; if(sky.lightning <= 0){ sky.lightning = rand(1.2, 4); sky.bolt = .18; if(!reduce) sfx('zap', { vol:.35, pitch:.5 }); } }
    else if(hz==='sun'){ col.set(0xff7a2a); op = .2 + .03*Math.sin(t*1.3); }
    else if(hz==='pulsar'){ sky.pulse = (sky.pulse + dt) % 4; col.set(0xc8d8ff); op = .06 + (sky.pulse < .5 ? (1 - sky.pulse*2) * (reduce ? .1 : .35) : 0); }
    if(G.enemy && !G.enemy.dead){ col.lerp(new THREE.Color(G.boss ? 0x8a0018 : 0x5a0a14), .5); op = Math.max(op, G.boss ? .14 : .06); }
    const s = G.ship; if(s && s.hull <= s.maxHull*.25){ col.lerp(new THREE.Color(0xff1030), .6); op = Math.max(op, .05 + (reduce ? .02 : .08)*(.5+.5*Math.sin(t*4))); }
  }
  if(sky.bolt > 0){ sky.bolt -= dt; op += reduce ? .08 : .45 * Math.max(0, sky.bolt/.18); col.lerp(new THREE.Color(0xbfefff), .7); }
  sky.tint.material.color.lerp(col, Math.min(1, dt*3)); sky.tint.material.opacity += (op - sky.tint.material.opacity) * Math.min(1, dt*4);
  sky.tint.visible = sky.tint.material.opacity > .003;
  const neb = fxOn && inGame && (hz==='nebula' || G.nebula); sky.clouds.forEach((c,i) => { c.material.opacity += ((neb ? .55 : 0) - c.material.opacity)*Math.min(1, dt*1.5); c.visible = c.material.opacity > .01; c.material.rotation += dt*.01*(i%2?1:-1); });
  const sun = fxOn && inGame && hz==='sun'; for(const [m, sc, o] of [[sky.bigSun, 420, .95],[sky.corona, 160, .9]]){ m.material.opacity += ((sun ? o : 0) - m.material.opacity)*Math.min(1, dt*1.5); m.scale.setScalar(sc*(1 + .03*Math.sin(t*2))); m.visible = m.material.opacity > .01; }
  const ast = fxOn && inGame && hz==='asteroid'; sky.rocks.forEach(m => { m.visible = ast; if(!ast) return; const u = m.userData; u.a += u.w*dt; m.position.x = Math.cos(u.a)*u.r; m.position.z = Math.sin(u.a)*u.r; m.rotation.x += u.spin.x*dt; m.rotation.y += u.spin.y*dt; });
  updateWarpFx(dt);
  updateBattleFx(dt);
}
function inXR_ar(){ return xrMode==='immersive-ar'; }
/* ---------------- hyperspace ---------------- */
function updateWarpFx(dt){
  const w = warpAmt(), phase = G && G.warp>0 ? G.warp : 0; const q = fxq();
  const on = w > .01 && SET.skyFx !== false;
  sky.tun.visible = sky.tunCore.visible = on;
  if(on){ const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; d.normalize(); const yaw = Math.atan2(d.x, d.z);
    for(const m of [sky.tun, sky.tunCore]){ m.rotation.set(Math.PI/2, 0, 0); m.rotateOnWorldAxis(new THREE.Vector3(0,1,0), yaw); m.material.map.offset.y -= dt*(.6 + w*4.5); }
    sky.tun.material.opacity = Math.min(1, w*1.6) * q; sky.tunCore.material.opacity = Math.max(0, w*1.4 - .3) * q; }
  // white-out at the moment of the jump, gentle fade back in
  const white = SET.reduceFlashes ? Math.max(0, w - .6)*1.2 : Math.max(0, w - .45)*2.2; sky.flash.material.opacity = Math.min(.95, white); sky.flash.visible = sky.flash.material.opacity > .01;
  if(sky.lastWarp > 0 && phase === 0){ // arrived: shockwave ring sweeps past
    sky.shockT = 1.4; sky.shock.visible = true; hapticFn?.(.5, 250); }
  sky.lastWarp = phase;
  if(sky.shockT > 0){ sky.shockT -= dt; const k = 1 - sky.shockT/1.4; const d = new THREE.Vector3(); camera.getWorldDirection(d);
    sky.shock.position.copy(d.multiplyScalar(-4 + k*30)); sky.shock.lookAt(new THREE.Vector3(0,0,0)); sky.shock.scale.setScalar(2 + k*40); sky.shock.material.opacity = (1-k)*.7*fxq(); if(sky.shockT<=0) sky.shock.visible = false; }
}
/* ---------------- battle effects (used by updateSpace in scene3d.js) ---------------- */
function fxSprite(col, size, pos, life, vel, grow=1.5){ if(!space3d) return; const m = glowSpriteMesh(col, size); m.position.copy(pos); space3d.group.add(m); sky.fx.push({ m, life, max:life, vel:vel||new THREE.Vector3(), size, grow }); return m; }
function fxRing(pos, col, size, life, faceTo){ const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 64), new THREE.MeshBasicMaterial({ color:new THREE.Color(col), transparent:true, opacity:.9, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
  m.position.copy(pos); if(faceTo) m.lookAt(faceTo); space3d.group.add(m); sky.fx.push({ m, life, max:life, ring:true, size }); }
function fxMuzzle(pos, col){ const q = fxq(); fxSprite('#ffffff', 2.2*q, pos, .12); fxSprite(col, 4*q, pos, .25); }
function fxImpact(pos, col, big, viewer){ const q = fxq(); const n = Math.round((big ? 14 : 7)*q);
  fxSprite('#ffffff', (big?7:4)*q, pos, .15); fxSprite(col, (big?10:6)*q, pos, .4);
  for(let i=0;i<n;i++) fxSprite(i%2 ? '#ffd27a' : col, rand(.6,1.6)*q, pos, rand(.4,.9), new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(6, 18)), .3);
  fxRing(pos, col, (big ? 9 : 5)*q, .5, viewer); }
function fxShieldFlare(pos, viewer){ fxRing(pos, '#7fe8ff', 6*fxq(), .6, viewer); fxSprite('#bff4ff', 6*fxq(), pos, .3); }
function fxSmoke(pos){ if(Math.random() > fxq()) return; const m = fxSprite('#8a8f9a', rand(.8, 1.4), pos, rand(.8, 1.4), new THREE.Vector3(rand(-.5,.5), rand(-.2,.6), rand(-.5,.5)), 2.5); if(m) m.material.blending = THREE.NormalBlending; }
function fxShipExplosion(pos, viewer){ const q = fxq();
  fxSprite('#ffffff', 40*q, pos, .4); fxSprite('#ffd27a', 60*q, pos, 1.1); fxSprite('#ff6a2a', 45*q, pos, 1.8);
  for(let i=0;i<4;i++) setTimeout(() => fxRing(pos, i%2 ? '#ffb547' : '#9fd8ff', 30*q, 1.2 + i*.2, viewer), i*120);
  for(let i=0;i<Math.round(40*q);i++) fxSprite(i%3 ? '#ff8a3d' : '#ffe08a', rand(1.5,4)*q, pos, rand(1,2.4), new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(8, 30)), .5);
  for(let i=0;i<Math.round(16*q);i++){ const m = fxSprite('#4a4e58', rand(4,8), pos.clone().add(new THREE.Vector3(rand(-6,6), rand(-6,6), rand(-6,6))), rand(2.5,4), new THREE.Vector3(rand(-1,1), rand(-.5,1), rand(-1,1)).multiplyScalar(4), 1.8); if(m) m.material.blending = THREE.NormalBlending; } }
function updateBattleFx(dt){
  for(let i=sky.fx.length-1;i>=0;i--){ const F = sky.fx[i]; F.life -= dt; if(F.life <= 0){ F.m.parent?.remove(F.m); if(F.ring) F.m.geometry.dispose(); F.m.material.dispose(); sky.fx.splice(i,1); continue; }
    const k = 1 - F.life/F.max;
    if(F.ring){ F.m.scale.setScalar(F.size*(.2 + k)); F.m.material.opacity = (1-k)*.85; continue; }
    F.m.position.addScaledVector(F.vel, dt); F.vel.multiplyScalar(.96); F.m.scale.setScalar(F.size*(1 + k*F.grow)); F.m.material.opacity = (1-k)*(F.m.material.blending===THREE.NormalBlending ? .5 : 1); }
}
