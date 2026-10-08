'use strict';
/* =========================================================================
   Life-size 3D crew for the walkable ship. Low-poly figures for every race
   (humans of every look, Pebblekin, Enjinn, Voltans, Sloogs, Mantlis,
   Glassborn, drones), animated from the simulation: walking, manning
   stations, repairing, fighting fires with extinguishers, brawling with
   boarders, healing, stunned, mind-controlled, and falling when they die.
   Nameplates show name, job and health. Enemy boarders wear red.
   ========================================================================= */
const C3 = { geo:null, mats:{} };
function c3Geo(){
  if(C3.geo) return C3.geo;
  const cyl = (rt, rb, h, s=10) => new THREE.CylinderGeometry(rt, rb, h, s);
  C3.geo = {
    head: new THREE.SphereGeometry(.12, 20, 16), hairCap: new THREE.SphereGeometry(.128, 16, 10, 0, Math.PI*2, 0, Math.PI*.55),
    torso: cyl(.17, .14, .5, 12), hips: cyl(.14, .13, .14, 12), limb: cyl(.045, .038, .42, 12), hand: new THREE.SphereGeometry(.05, 8, 6),
    eye: new THREE.SphereGeometry(.018, 8, 6), long: new THREE.BoxGeometry(.24, .32, .08), bun: new THREE.SphereGeometry(.07, 10, 8),
    rock: new THREE.DodecahedronGeometry(.3, 1), rockHead: new THREE.DodecahedronGeometry(.13, 1), rockLimb: cyl(.085, .07, .42, 7),
    tail: new THREE.ConeGeometry(.16, .7, 12), stalk: cyl(.018, .022, .32, 6), slug: new THREE.ConeGeometry(.26, 1.0, 14), slugBase: new THREE.SphereGeometry(.28, 14, 8, 0, Math.PI*2, 0, Math.PI/2),
    thorax: cyl(.08, .1, .45, 8), abdomen: new THREE.SphereGeometry(.16, 12, 8), triHead: new THREE.ConeGeometry(.13, .2, 3), scythe: new THREE.BoxGeometry(.035, .4, .06), thin: cyl(.022, .016, .55, 8),
    crystal: new THREE.OctahedronGeometry(.16, 0), crystalBody: new THREE.OctahedronGeometry(.3, 0),
    droneBody: new THREE.SphereGeometry(.22, 16, 12), droneEye: new THREE.CircleGeometry(.08, 16), box: new THREE.BoxGeometry(1,1,1),
    ext: cyl(.06, .06, .3, 10), nozzle: cyl(.02, .03, .1, 6), ring: new THREE.RingGeometry(.32, .4, 32), shadow: new THREE.CircleGeometry(.3, 20)
  };
  return C3.geo;
}
function c3Mat(key, mk){ return C3.mats[key] || (C3.mats[key] = mk()); }
function lin(col){ return new THREE.Color(col).convertSRGBToLinear(); }
function sm(col, o={}){ if(o.emissive) o.emissive = new THREE.Color(o.emissive).convertSRGBToLinear(); return new THREE.MeshStandardMaterial(Object.assign({ color:lin(col), roughness:.6, metalness:.1 }, o)); }
/* smooth body parts from lathe profiles: [radius, height] pairs */
function lathe(pts, seg=18){ return new THREE.LatheGeometry(pts.map(([r,h]) => new THREE.Vector2(r, h)), seg); }
function humanGeo(f){
  const k = f ? 'f' : 'm'; C3.hg = C3.hg || {}; if(C3.hg[k]) return C3.hg[k];
  const torso = f ? lathe([[.0,0],[.13,0],[.15,.06],[.12,.2],[.13,.3],[.155,.4],[.15,.48],[.1,.53],[.05,.56],[0,.56]])
                  : lathe([[.0,0],[.14,0],[.15,.08],[.15,.22],[.17,.36],[.19,.46],[.17,.52],[.1,.56],[.05,.58],[0,.58]]);
  torso.scale(1, 1, .68);
  const head = lathe([[0,-.12],[.05,-.115],[.085,-.09],[.1,-.04],[.11,.02],[.108,.07],[.09,.11],[.055,.135],[0,.145]], 20); head.scale(1, 1, 1.05);
  const upper = lathe([[0,0],[.05,0],[.058,.06],[.054,.2],[.045,.3],[0,.3]], 12); upper.translate(0, -.3, 0);
  const fore = lathe([[0,0],[.042,0],[.046,.05],[.04,.2],[.032,.27],[0,.27]], 12); fore.translate(0, -.27, 0);
  const thigh = lathe([[0,0],[.06,0],[.075,.06],[.07,.24],[.055,.42],[0,.42]], 12); thigh.translate(0, -.42, 0);
  const shin = lathe([[0,0],[.05,0],[.056,.08],[.05,.22],[.04,.4],[0,.4]], 12); shin.translate(0, -.4, 0);
  const boot = new THREE.SphereGeometry(.07, 12, 8); boot.scale(.85, .6, 1.6);
  const hand = new THREE.SphereGeometry(.042, 10, 8); hand.scale(.8, 1.15, .6);
  const shoulder = new THREE.SphereGeometry(.07, 12, 8); const neck = new THREE.CylinderGeometry(.045, .05, .1, 12);
  const nose = new THREE.ConeGeometry(.018, .05, 8); nose.rotateX(Math.PI/2); const ear = new THREE.SphereGeometry(.025, 8, 6); ear.scale(.5, 1, .8);
  const belt = new THREE.TorusGeometry(f ? .135 : .145, .02, 6, 24); belt.rotateX(Math.PI/2); belt.scale(1, 1, .7);
  const collar = new THREE.TorusGeometry(.06, .018, 6, 20); collar.rotateX(Math.PI/2);
  const hairTop = new THREE.SphereGeometry(.118, 18, 12, 0, Math.PI*2, 0, Math.PI*.58);
  return C3.hg[k] = { torso, head, upper, fore, thigh, shin, boot, hand, shoulder, neck, nose, ear, belt, collar, hairTop };
}

function buildCrew3D(c){
  const g = new THREE.Group(), L = ensureLook(c), G_ = c3Geo(); const hostile = c.owner==='e';
  const uniform = c3Mat('uni'+(hostile?'e':'p'), () => sm(hostile ? '#7a2233' : '#2c4a86', { roughness:.7 }));
  const uniform2 = c3Mat('uni2'+(hostile?'e':'p'), () => sm(hostile ? '#4a1420' : '#1a2c55', { roughness:.75 }));
  const trim = c3Mat('trim'+(hostile?'e':'p'), () => sm(hostile ? '#ff9aa8' : '#ffb547', { emissive:new THREE.Color(hostile ? '#ff5a7a' : '#ffb547'), emissiveIntensity:.35 }));
  const boots = c3Mat('boots', () => sm('#15161c', { roughness:.5 }));
  const parts = { g, legs:[], arms:[], body:null, head:null, kind:'biped', hostile };
  const add = (geo, mat, x, y, z, parent=g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const limbPivot = (x, y, z, geo, mat, len, parent=g) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); const m = new THREE.Mesh(geo, mat); m.position.y = -len/2; p.add(m); return p; };
  const race = c.drone ? 'drone' : (DATA.races[c.race] ? c.race : 'human');
  const morph = L.morph || '#ffffff';
  switch(race){
    case 'pebblekin': { parts.kind = 'rock'; const rock = c3Mat('rock'+morph, () => sm(new THREE.Color(morph).multiplyScalar(.75), { roughness:.95, flatShading:true }));
      parts.body = add(G_.rock, rock, 0, 1.0, 0); parts.body.scale.set(1.1, 1.25, .9);
      parts.head = add(G_.rockHead, rock, 0, 1.52, .05); add(G_.eye, c3Mat('ambereye', () => sm('#ffd166', { emissive:new THREE.Color('#ffd166'), emissiveIntensity:1 })), .05, 1.53, .16, g);
      for(const s of [-1,1]){ parts.legs.push(limbPivot(s*.14, .62, 0, G_.rockLimb, rock, .42)); parts.arms.push(limbPivot(s*.36, 1.25, 0, G_.rockLimb, rock, .42)); }
      if(L.g==='f') for(let i=0;i<3;i++){ const cr = add(G_.crystal, c3Mat('pkcr'+(L.acc>.5), () => sm(L.acc>.5 ? '#ff9de2' : '#7fe8ff', { emissive:new THREE.Color(L.acc>.5 ? '#ff9de2' : '#7fe8ff'), emissiveIntensity:.6 })), -.08 + i*.08, 1.66, -.02); cr.scale.setScalar(.35); }
      break; }
    case 'enjinn': { parts.kind = 'float'; const skin = c3Mat('enj'+morph, () => sm(morph, { roughness:.4 }));
      const tail = add(G_.tail, c3Mat('enjt'+morph, () => sm(morph, { transparent:true, opacity:.6, emissive:new THREE.Color(morph), emissiveIntensity:.4 })), 0, .55, 0); tail.rotation.x = Math.PI; parts.tail = tail;
      parts.body = add(G_.torso, c3Mat('enjvest', () => sm('#e07a2c')), 0, 1.12, 0); add(G_.hips, c3Mat('belt', () => sm('#5a4630')), 0, .86, 0);
      parts.head = add(G_.head, skin, 0, 1.5, 0); add(G_.box, c3Mat('goggle', () => sm('#3a3f52', { metalness:.6 })), 0, 1.54, .08).scale.set(.22, .06, .06);
      for(const s of [-1,1]){ add(G_.eye, c3Mat('cyaneye', () => sm('#7ff7ff', { emissive:new THREE.Color('#7ff7ff'), emissiveIntensity:1.2 })), s*.05, 1.54, .115); parts.arms.push(limbPivot(s*.21, 1.33, 0, G_.limb, skin, .42)); }
      if(L.g==='f') add(G_.long, c3Mat('enjhair', () => sm('#1a1a2a')), 0, 1.45, -.09);
      break; }
    case 'voltan': { parts.kind = 'float'; const glow = c3Mat('volt'+morph, () => sm(morph, { emissive:new THREE.Color(morph), emissiveIntensity:1.1, transparent:true, opacity:.85, roughness:.2 }));
      parts.body = add(G_.torso, glow, 0, 1.05, 0); parts.body.scale.set(.9, 1.4, .8); parts.head = add(G_.head, glow, 0, 1.55, 0);
      const tail = add(G_.tail, glow, 0, .45, 0); tail.rotation.x = Math.PI; tail.scale.set(.7, .9, .7); parts.tail = tail;
      for(const s of [-1,1]) parts.arms.push(limbPivot(s*.2, 1.32, 0, G_.limb, glow, .42));
      const aura = glowSpriteMesh(morph, 1.4); aura.position.y = 1.1; aura.material.opacity = .5; g.add(aura); parts.aura = aura;
      break; }
    case 'sloog': { parts.kind = 'slug'; const skin = c3Mat('slug'+morph, () => sm(morph, { roughness:.25, metalness:.05 }));
      parts.body = add(G_.slug, skin, 0, .62, 0); add(G_.slugBase, skin, 0, .02, 0).scale.set(1.1, .4, 1.6);
      parts.head = new THREE.Group(); parts.head.position.y = 1.1; g.add(parts.head);
      for(const s of [-1,1]){ const st = add(G_.stalk, skin, s*.06, .16, .02, parts.head); st.rotation.z = -s*.25; const eye = add(G_.head, c3Mat('white', () => sm('#f4f6ff', { roughness:.3 })), s*.11, .34, .04, parts.head); eye.scale.setScalar(.45); add(G_.eye, c3Mat('black', () => sm('#111111')), s*.11, .34, .095, parts.head); }
      for(const s of [-1,1]) parts.arms.push(limbPivot(s*.2, .95, .05, G_.limb, skin, .36));
      add(G_.box, c3Mat('bow'+L.g, () => sm(L.g==='f' ? '#e07ab0' : '#4a6ad8')), 0, .98, .2).scale.set(.18, .06, .04);
      break; }
    case 'mantlis': { parts.kind = 'insect'; const shell = c3Mat('mant'+morph, () => sm(morph, { roughness:.35, metalness:.2 })); const dk = c3Mat('mantd'+morph, () => sm(new THREE.Color(morph).multiplyScalar(.55), { roughness:.4 }));
      const abd = add(G_.abdomen, dk, 0, .82, -.22); abd.scale.set(1, .8, 1.6);
      parts.body = add(G_.thorax, shell, 0, 1.15, 0); parts.body.rotation.x = -.25;
      parts.head = add(G_.triHead, shell, 0, 1.52, .08); parts.head.rotation.x = Math.PI; parts.head.scale.set(1.2, 1, 1);
      for(const s of [-1,1]){ const e = add(G_.head, c3Mat('mantEye', () => sm('#1a3020', { roughness:.1, metalness:.5 })), s*.08, 1.56, .11); e.scale.setScalar(.45);
        const an = add(G_.thin, shell, s*.05, 1.78, .06); an.scale.set(.6, .45, .6); an.rotation.z = -s*.4; }
      for(const s of [-1,1]) for(const z of [-.12, .08]) parts.legs.push(limbPivot(s*.1, .85, z, G_.thin, dk, .55));
      for(const s of [-1,1]){ const a = limbPivot(s*.15, 1.32, .08, G_.limb, shell, .42); const sc = new THREE.Mesh(G_.scythe, c3Mat('scy'+morph, () => sm(new THREE.Color(morph).multiplyScalar(1.3)))); sc.position.set(0, -.5, .12); sc.rotation.x = .9; a.add(sc); parts.arms.push(a); }
      break; }
    case 'glassborn': { parts.kind = 'biped'; const glass = c3Mat('glass'+morph, () => sm(morph, { transparent:true, opacity:.75, roughness:.05, metalness:.6, emissive:new THREE.Color(morph), emissiveIntensity:.25 }));
      parts.body = add(G_.crystalBody, glass, 0, 1.12, 0); parts.body.scale.set(.75, 1.15, .55); parts.head = add(G_.crystal, glass, 0, 1.58, 0); parts.head.scale.set(.9, 1.2, .9);
      for(const s of [-1,1]){ parts.legs.push(limbPivot(s*.09, .78, 0, G_.limb, glass, .42)); parts.arms.push(limbPivot(s*.22, 1.36, 0, G_.limb, glass, .42)); }
      const core = glowSpriteMesh(hostile ? '#ff9aa8' : '#bff4ff', .5); core.position.y = 1.15; g.add(core);
      break; }
    case 'drone': { parts.kind = 'drone'; const role = DATA.drones?.[c.drone]?.role; const shell = c3Mat('droneShell', () => sm('#5a6080', { metalness:.7, roughness:.3 }));
      parts.body = add(G_.droneBody, shell, 0, 1.0, 0); const eye = add(G_.droneEye, c3Mat('droneEye'+(hostile?'e':role), () => new THREE.MeshBasicMaterial({ color: hostile ? 0xff5a7a : role==='repair' ? 0x7be0a0 : 0xf0a6ff })), 0, 1.02, .215);
      for(const s of [-1,1]) parts.arms.push(limbPivot(s*.22, 1.0, 0, G_.limb, shell, .34));
      const jet = glowSpriteMesh(hostile ? '#ff5a7a' : '#f0a6ff', .5); jet.position.y = .7; g.add(jet);
      break; }
    default: { // humans: smooth lathed bodies, two builds, many hairstyles
      const f = L.g==='f'; const H = humanGeo(f);
      const skin = c3Mat('skin'+L.skin, () => sm(L.skin, { roughness:.7 })); const hair = c3Mat('hair'+L.hair, () => sm(L.hair, { roughness:.8 }));
      const accent = c3Mat('acc'+(hostile?'e':'p'), () => sm(hostile ? '#ff9aa8' : '#ffb547', { roughness:.4, metalness:.4 }));
      const dark = c3Mat('eyeDark', () => sm('#1a1420'));
      parts.body = add(H.torso, uniform, 0, .92, 0);
      add(H.belt, c3Mat('beltM', () => sm('#2a2018', { roughness:.5 })), 0, .98, 0); add(G_.box, accent, 0, .99, .1).scale.set(.06, .04, .02);
      add(H.collar, accent, 0, 1.47, 0); add(G_.box, accent, f ? -.06 : -.07, 1.33, .1).scale.set(.05, .05, .015);
      for(const sx of [-1,1]){ const pad = add(H.shoulder, uniform, sx*(f ? .16 : .19), 1.41, 0); pad.scale.set(1, .8, 1); const pip = add(G_.box, accent, sx*(f ? .17 : .2), 1.45, 0); pip.scale.set(.09, .015, .09); }
      add(H.neck, skin, 0, 1.5, 0);
      parts.head = add(H.head, skin, 0, 1.63, 0); add(H.nose, skin, 0, 1.62, .11); add(H.ear, skin, -.105, 1.63, 0); add(H.ear, skin, .105, 1.63, 0);
      for(const sx of [-1,1]){ add(G_.eye, c3Mat('eyeW', () => sm('#f4f0ea')), sx*.04, 1.655, .094).scale.set(1.2, .9, .6); add(G_.eye, dark, sx*.04, 1.655, .103).scale.setScalar(.6); }
      add(G_.box, c3Mat('mouth', () => sm('#8a4a4a')), 0, 1.575, .1).scale.set(.04, .008, .01);
      if(L.style!=='bald'){ const cap = add(H.hairTop, hair, 0, 1.635, -.008); cap.scale.set(1, L.style==='crop' ? .78 : 1, 1.02);
        const back = add(G_.box, hair, 0, 1.6, -.075); back.scale.set(.2, .14, .06);
        if(L.style==='long'){ const lh = add(G_.box, hair, 0, 1.46, -.09); lh.scale.set(.24, .34, .06); for(const sx of [-1,1]){ const sd = add(G_.box, hair, sx*.105, 1.52, -.01); sd.scale.set(.04, .24, .12); } }
        if(L.style==='bob') for(const sx of [-1,1]){ const sd = add(G_.box, hair, sx*.105, 1.58, -.01); sd.scale.set(.05, .16, .17); }
        if(L.style==='ponytail' || L.style==='braid'){ const pt = add(G_.box, hair, 0, 1.5, -.13); pt.scale.set(.06, .26, .06); pt.rotation.x = .25; }
        if(L.style==='bun') add(G_.bun, hair, 0, 1.75, -.06);
        if(L.style==='mohawk'){ const m = add(G_.box, hair, 0, 1.77, -.01); m.scale.set(.04, .08, .2); }
        if(L.style==='swept'){ const sw = add(G_.box, hair, .03, 1.73, .06); sw.scale.set(.18, .05, .08); sw.rotation.z = -.3; }
        if(L.style==='curly') for(let i=0;i<7;i++){ const cu = add(G_.bun, hair, Math.cos(i)*.09, 1.72 + Math.sin(i*2)*.02, Math.sin(i)*.07 - .02); cu.scale.setScalar(.6); }
        if(L.style==='beardshort'){ const bd = add(G_.box, hair, 0, 1.56, .07); bd.scale.set(.16, .07, .06); } }
      if(L.acc > .7 && !hostile) add(G_.box, c3Mat('headset', () => sm('#5fd3e6', { metalness:.6, roughness:.3 })), .11, 1.62, .03).scale.set(.02, .05, .1);
      // limbs on pivots (shoulder and hip), each a single baked mesh
      for(const sx of [-1,1]){
        const leg = new THREE.Group(); leg.position.set(sx*(f ? .075 : .085), .93, 0); g.add(leg);
        const th = new THREE.Mesh(H.thigh, uniform2); leg.add(th); const sn = new THREE.Mesh(H.shin, uniform2); sn.position.y = -.42; leg.add(sn);
        const bt = new THREE.Mesh(H.boot, boots); bt.position.set(0, -.84, .04); leg.add(bt); parts.legs.push(leg);
        const arm = new THREE.Group(); arm.position.set(sx*(f ? .19 : .22), 1.41, 0); g.add(arm);
        const up = new THREE.Mesh(H.upper, uniform); arm.add(up); const fo = new THREE.Mesh(H.fore, uniform); fo.position.y = -.3; arm.add(fo);
        const cuff = new THREE.Mesh(G_.box, accent); cuff.scale.set(.085, .02, .085); cuff.position.y = -.55; arm.add(cuff);
        const hd = new THREE.Mesh(H.hand, skin); hd.position.y = -.6; arm.add(hd); parts.arms.push(arm); }
      parts.handY = -.6;
    }
  }
  // ground shadow & selection ring
  const sh = new THREE.Mesh(G_.shadow, c3Mat('shadow', () => new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:.35, depthWrite:false }))); sh.rotation.x = -Math.PI/2; sh.position.y = .012; g.add(sh);
  const ring = new THREE.Mesh(G_.ring, c3Mat('selRing', () => new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.9, depthWrite:false, side:THREE.DoubleSide }))); ring.rotation.x = -Math.PI/2; ring.position.y = .02; ring.visible = false; g.add(ring); parts.ring = ring;
  if(hostile && race!=='drone'){ const hr = new THREE.Mesh(G_.ring, c3Mat('hostRing', () => new THREE.MeshBasicMaterial({ color:0xff3050, transparent:true, opacity:.6, depthWrite:false, side:THREE.DoubleSide }))); hr.rotation.x = -Math.PI/2; hr.position.y = .015; hr.scale.setScalar(.85); g.add(hr); }
  // extinguisher, shown while fighting fires
  const ext = new THREE.Group(); const can = new THREE.Mesh(G_.ext, c3Mat('ext', () => sm('#c8202a', { metalness:.4 }))); ext.add(can); const nz_ = new THREE.Mesh(G_.nozzle, boots); nz_.position.set(0, .18, .04); nz_.rotation.x = 1.2; ext.add(nz_);
  ext.visible = false; if(parts.arms[1]){ ext.position.set(0, (parts.handY ?? -.42) + .02, .08); parts.arms[1].add(ext); } parts.ext = ext;
  // nameplate
  const pc = mkCanvas(256, 72); const pt = texFrom(pc); const plate = new THREE.Sprite(new THREE.SpriteMaterial({ map:pt, transparent:true, depthWrite:false, depthTest:true })); plate.scale.set(.62, .175, 1); plate.position.y = 2.0; g.add(plate);
  parts.plate = { sprite:plate, c:pc, tex:pt, key:'' };
  parts.height = race==='sloog' ? 1.6 : race==='pebblekin' ? 1.8 : 1.85;
  // bake rigid parts to cut draw calls: the body, then each limb on its own pivot
  ext.userData.noBake = true; if(race==='sloog' && parts.body) parts.body.userData.noBake = true;
  const pivots = [...parts.legs, ...parts.arms]; pivots.forEach(p => p.userData.noBake = true);
  bakeGroup(g); pivots.forEach(p => { p.userData.noBake = false; bakeGroup(p); p.userData.noBake = true; });
  plate.position.y = parts.height + .1;
  return parts;
}
function drawPlate(P, c, job, hostile){
  const key = c.name + '|' + Math.ceil(c.hp) + '|' + (job?.k||'') + '|' + (c.mcT>0);
  if(P.plate.key===key) return; P.plate.key = key;
  const g = P.plate.c.getContext('2d'); g.clearRect(0,0,256,72);
  g.fillStyle = 'rgba(8,12,24,.78)'; if(g.roundRect){ g.beginPath(); g.roundRect(2,2,252,68,12); g.fill(); } else g.fillRect(2,2,252,68);
  g.font = "700 24px 'Chakra Petch', sans-serif"; g.textAlign = 'center'; g.fillStyle = hostile ? '#ff9aa8' : c.mcT>0 ? '#b48cff' : '#ffffff'; g.fillText(c.name, 128, 28);
  if(job){ g.font = "500 15px 'IBM Plex Mono', monospace"; g.fillStyle = JOB_COL?.[job.k] || '#c8ccd8'; g.fillText(job.text.slice(0, 28), 128, 48); }
  const fr = clamp(c.hp/c.maxHp, 0, 1); g.fillStyle = '#1a2440'; g.fillRect(28, 56, 200, 8); g.fillStyle = fr>.5 ? '#7be0a0' : fr>.25 ? '#ffd166' : '#ff5a7a'; g.fillRect(28, 56, 200*fr, 8);
  P.plate.tex.needsUpdate = true;
}
/* pose a crew figure for this frame. ctx: { moving, dir(Vector3), job, foeDir, t, dt } */
function animateCrew3D(P, c, o){
  const t = o.t, k = P.kind; const m = o.moving;
  const swing = m ? Math.sin(t*11 + P.phase) : 0;
  P.legs.forEach((l, i) => { l.rotation.x = (i%2 ? 1 : -1) * swing * .6; });
  let armA = [0, 0], armZ = [0, 0];
  const job = o.job?.k || 'idle';
  if(m) armA = [swing*.55, -swing*.55];
  else if(job==='repair'){ const h = Math.max(0, Math.sin(t*9 + P.phase)); armA = [-1.2 - h*.6, -.6]; }
  else if(job==='fire'){ armA = [-1.0, -1.25]; }
  else if(job==='man'){ armA = [-.9 + Math.sin(t*3 + P.phase)*.08, -.95 + Math.sin(t*3.4 + P.phase)*.08]; }
  else if(job==='fight' || job==='board' && o.foe){ const p = Math.sin(t*12 + P.phase); armA = [-1.3 - Math.max(0,p)*.5, -1.3 - Math.max(0,-p)*.5]; }
  else if(job==='heal'){ armA = [-.2, -.2]; armZ = [.3, -.3]; }
  else if(job==='stun'){ armZ = [.6, -.6]; }
  else if(job==='mind'){ armA = [-2.4, -2.4]; }
  else { armA = [Math.sin(t*1.2 + P.phase)*.04, -Math.sin(t*1.2 + P.phase)*.04]; }
  P.arms.forEach((a, i) => { a.rotation.x += (armA[i%2] - a.rotation.x) * Math.min(1, o.dt*12); a.rotation.z += (armZ[i%2]*(i%2?1:-1) - a.rotation.z) * Math.min(1, o.dt*12); });
  P.ext.visible = job==='fire';
  // body bob / float / slither
  const bob = m ? Math.abs(Math.sin(t*11 + P.phase))*.04 : Math.sin(t*2 + P.phase)*.008;
  if(k==='float' || k==='drone') P.g.position.y = o.y + .08 + Math.sin(t*2.4 + P.phase)*.05;
  else P.g.position.y = o.y + bob;
  if(k==='slug' && P.body){ P.body.scale.set(1, 1 + (m ? Math.sin(t*8)*.06 : 0), 1); }
  if(P.tail) P.tail.rotation.z = Math.sin(t*3 + P.phase)*.15;
  if(job==='stun') P.g.rotation.z = Math.sin(t*6)*.08; else P.g.rotation.z = 0;
  if(job==='fight' && o.lunge) P.g.position.addScaledVector(o.lunge, Math.max(0, Math.sin(t*12 + P.phase))*.12);
}

/* ---------------- draw-call savers: bake rigid parts into single vertex-coloured meshes ---------------- */
function bakeGroup(root, filter){
  // merges every opaque-standard (or basic) mesh directly under `root` (recursively, excluding sub-groups flagged noBake)
  const byKind = { std:[], flat:[], basic:[] }; const remove = [];
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  root.traverse(o => {
    if(o===root || !o.isMesh || o.isInstancedMesh) return;
    let p = o.parent, skip = false; while(p && p!==root){ if(p.userData.noBake) skip = true; p = p.parent; } if(skip || o.userData.noBake) return;
    if(filter && !filter(o)) return;
    const m = o.material; if(!m || m.transparent || m.map || m.vertexColors) return;
    const glowy = m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) * (m.emissiveIntensity ?? 1) > .02;
    const kind = m.isMeshStandardMaterial && !glowy ? (m.flatShading ? 'flat' : 'std') : m.isMeshBasicMaterial ? 'basic' : null; if(!kind) return;
    byKind[kind].push(o); remove.push(o);
  });
  const out = [];
  for(const kind of ['std','flat','basic']){ const list = byKind[kind]; if(list.length < 2){ remove.splice(0, remove.length, ...remove.filter(o => !list.includes(o))); continue; }
    const pos = [], nor = [], col = [];
    for(const o of list){ let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; const mat = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld); const nm = new THREE.Matrix3().getNormalMatrix(mat);
      const P = geo.attributes.position, N = geo.attributes.normal, c = o.material.color; const v = new THREE.Vector3(), n = new THREE.Vector3();
      for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P, i).applyMatrix4(mat); pos.push(v.x, v.y, v.z); if(N){ n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(n.x, n.y, n.z); } else nor.push(0,1,0); col.push(c.r, c.g, c.b); }
      if(geo!==o.geometry) geo.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const ref = list[0].material;
    const mat = kind!=='basic' ? new THREE.MeshStandardMaterial({ vertexColors:true, roughness:ref.roughness ?? .6, metalness:ref.metalness ?? .2, flatShading:kind==='flat' }) : new THREE.MeshBasicMaterial({ vertexColors:true });
    const mesh = new THREE.Mesh(g, mat); mesh.userData.baked = kind; root.add(mesh); out.push(mesh); }
  for(const o of remove) o.parent?.remove(o);
  return out;
}
