'use strict';
/* =========================================================================
   The walkable 3D ship. Built from the same room grid the simulation uses,
   so every room, door, airlock, crew member, fire, breach and boarder you
   see is the real game state. The bridge you start on is the cockpit: walk
   through its rear door and down the corridor into the ship.

   - Rooms: plated floors, walls, ceiling light panels, hull windows, labels
     with live power and damage, and a working machine for each system.
   - Doors: slide open and shut with the simulation (and for you as you walk
     up); airlocks vent to space; broken doors spark.
   - Hazards: flames and smoke, hull breaches with escaping air, low-oxygen
     haze, sparks and arcing on damaged or ionised systems, impact flashes.
   - Crew: life-size figures for every race doing their real jobs.
   - Captain: walk or teleport anywhere, point at crew to select them,
     point at a floor to send them there, point at a door to open/close it,
     and beam over to the enemy ship with your away team from the teleporter.
   - Settings > Graphics > Ship: "Full 3D ship" or "Classic cockpit".
   ========================================================================= */
const CS = 1.5, WH = 2.5, CORR = 1.8;
let IN = { own:null, foe:null, aboard:null, beamT:0, beamTo:null, saved:null, buttons:[], lastHurt:{} };
function shipMode(){ return SET.shipMode || 'full'; }

/* ---------------- shared materials & textures ---------------- */
let IM = null;
function interiorMats(){
  if(IM) return IM;
  const floorT = plateTex('#2b3246', 21, 2); floorT.repeat.set(1, 1);
  const wallT = plateTex('#3a4256', 33, 2); wallT.repeat.set(1, 1);
  const hazard = (() => { const c = mkCanvas(128, 32), g = c.getContext('2d'); for(let i=-2;i<10;i++){ g.fillStyle = i%2 ? '#151515' : '#e8b62c'; g.beginPath(); g.moveTo(i*16,0); g.lineTo(i*16+16,0); g.lineTo(i*16,32); g.lineTo(i*16-16,32); g.fill(); } const t = texFrom(c); t.wrapS = THREE.RepeatWrapping; return t; })();
  IM = {
    floor: stdMat({ map:floorT, metalness:.6, roughness:.55 }), wall: stdMat({ map:wallT, metalness:.55, roughness:.5 }), hull: stdMat({ map:wallT, color:0xc8d0e8, metalness:.7, roughness:.4 }),
    trim: stdMat({ color:0x1d2338, metalness:.85, roughness:.3 }), ceil: stdMat({ color:0x1a2034, metalness:.6, roughness:.6 }),
    light: new THREE.MeshBasicMaterial({ color:0xffffff }), dark: stdMat({ color:0x10141f, metalness:.8, roughness:.4 }), metal: stdMat({ color:0x8a95b8, metalness:.9, roughness:.25 }),
    door: stdMat({ color:0x4a536e, metalness:.8, roughness:.35 }), doorStripe: new THREE.MeshBasicMaterial({ color:0xffb547 }), hazard: new THREE.MeshStandardMaterial({ map:hazard, metalness:.4, roughness:.6 }),
    glow: (c) => new THREE.MeshBasicMaterial({ color:new THREE.Color(c) }), glass: stdMat({ color:0x5fb8d0, metalness:.95, roughness:.05, transparent:true, opacity:.35 }),
    box: new THREE.BoxGeometry(1,1,1), cyl: new THREE.CylinderGeometry(1,1,1,16), sph: new THREE.SphereGeometry(1, 16, 12), torus: new THREE.TorusGeometry(1, .06, 8, 32), plane: new THREE.PlaneGeometry(1,1)
  };
  return IM;
}
const DOOR_MATS = {};
function doorLeafMat(airlock, side){ const k = (airlock ? 'a' : 'd') + side; if(DOOR_MATS[k]) return DOOR_MATS[k];
  const c = mkCanvas(128, 512), g = c.getContext('2d');
  if(airlock){ for(let i=-8;i<40;i++){ g.fillStyle = i%2 ? '#1a1a1a' : '#d8a628'; g.beginPath(); g.moveTo(0, i*24); g.lineTo(128, i*24 - 60); g.lineTo(128, i*24 - 36); g.lineTo(0, i*24 + 24); g.fill(); } }
  else { const gr = g.createLinearGradient(0,0,128,0); gr.addColorStop(0,'#58627e'); gr.addColorStop(1,'#3c4560'); g.fillStyle = gr; g.fillRect(0,0,128,512);
    g.fillStyle = 'rgba(0,0,0,.35)'; for(const y of [120, 380]) g.fillRect(8, y, 112, 4); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(8, 0, 2, 512); }
  g.fillStyle = '#0c1a2c'; g.fillRect(36, 70, 56, 110); g.fillStyle = 'rgba(95,211,230,.35)'; g.fillRect(40, 74, 48, 102);
  const sx = side < 0 ? 116 : 0; g.fillStyle = '#ffb547'; g.fillRect(sx, 0, 12, 512);
  const t = texFrom(c); return DOOR_MATS[k] = stdMat({ map:t, metalness:.6, roughness:.4 }); }
/* ---------------- layout helpers ---------------- */
function cellLocal(I, x, y){ return new THREE.Vector3((y + .5 - I.gh/2)*CS, 0, (I.gw - x - .5)*CS); }
function localCell(I, lx, lz){ return { x: I.gw - .5 - lz/CS, y: lx/CS + I.gh/2 - .5 }; }
function roomCenterLocal(I, r){ const a = cellLocal(I, r.x, r.y), b = cellLocal(I, r.x + r.w - 1, r.y + r.h - 1); return a.add(b).multiplyScalar(.5); }
function edgeKey(a, b){ const k1 = a.join(','), k2 = b.join(','); return k1 < k2 ? k1+'|'+k2 : k2+'|'+k1; }

/* ---------------- build ---------------- */
function interiorKey(sh){ return sh.id + ':' + sh.rooms.map(r => r.sys + (sh.systems[r.sys] ? 1 : 0)).join(',') + ':' + sh.doors.length + ':' + (sh.weapons?.length||0); }
function buildInterior(sh, own){
  const M = interiorMats(); const I = { sh, own, gw:sh.gw, gh:sh.gh, group:new THREE.Group(), rooms:[], doors:[], crew:new Map(), fx:[], key:interiorKey(sh), cellIdx:{}, floorCells:[] };
  const g = I.group;
  const cells = Object.keys(sh.cellRoom).map(k => k.split(',').map(Number));
  // floors and ceilings (instanced: one draw call each)
  const floorGeo = new THREE.PlaneGeometry(CS*.995, CS*.995); floorGeo.rotateX(-Math.PI/2);
  const floors = new THREE.InstancedMesh(floorGeo, M.floor, cells.length); const ceilGeo = floorGeo.clone(); ceilGeo.rotateX(Math.PI);
  const ceils = new THREE.InstancedMesh(ceilGeo, M.ceil, cells.length);
  const lightGeo = new THREE.PlaneGeometry(CS*.5, CS*.18); lightGeo.rotateX(Math.PI/2);
  const lights = new THREE.InstancedMesh(lightGeo, M.light, cells.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  cells.forEach(([x,y], i) => { const p = cellLocal(I, x, y); m4.makeTranslation(p.x, 0, p.z); floors.setMatrixAt(i, m4); floors.setColorAt(i, col.set(0xffffff));
    m4.makeTranslation(p.x, WH, p.z); ceils.setMatrixAt(i, m4); m4.makeTranslation(p.x, WH - .01, p.z); lights.setMatrixAt(i, m4); lights.setColorAt(i, col.set(0xdfe8ff));
    I.cellIdx[x+','+y] = i; I.floorCells.push([x,y]); });
  floors.userData.interior = I; g.add(floors, ceils, lights); I.floor = floors; I.lights = lights;
  // walls: every cell edge that isn't inside a room becomes a wall, a doorway or a hull window
  const doorEdges = {}; sh.doors.forEach((d, di) => { doorEdges[edgeKey(d.ca, d.cb)] = di; });
  const segs = { wall:[], hull:[], trim:[] };
  const addSeg = (list, cx, cz, alongX, len, y0, y1) => list.push({ cx, cz, alongX, len, y0, y1 });
  const seen = new Set();
  // the hatch to the bridge goes in the very front room, on the ship's centre line
  const nose = sh.rooms.reduce((a,r) => { const fa = a.x+a.w, fr = r.x+r.w; const ca = a.y <= I.gh/2-1 && a.y+a.h >= I.gh/2+1, cr = r.y <= I.gh/2-1 && r.y+r.h >= I.gh/2+1; return fr > fa || (fr===fa && cr && !ca) ? r : a; }, sh.rooms[0]);
  for(const [x,y] of cells){
    const ri = sh.cellRoom[x+','+y];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x+dx, ny = y+dy, nk = nx+','+ny, nri = sh.cellRoom[nk];
      if(nri===ri) continue; const ek = edgeKey([x,y],[nx,ny]); if(seen.has(ek)) continue; seen.add(ek);
      const a = cellLocal(I, x, y), b = cellLocal(I, nx, ny); const cx = (a.x+b.x)/2, cz = (a.z+b.z)/2; const alongX = dx!==0;   // wall runs across X when cells differ in x
      const hull = nri==null; const di = doorEdges[ek];
      // the bridge hatch: front of the nose room, centred on the ship's axis
      if(hull && own && ri===sh.rooms.indexOf(nose) && dx===1){ addSeg(segs.hull, cx, cz, alongX, CS, 0, WH); continue; }
      if(di!=null){ // doorway: side pieces + lintel, door leaves built separately
        const L = segs[hull ? 'hull' : 'wall'];
        addSeg(L, cx + (alongX ? -.52*CS/1.5 - (CS-1.04)/4 : 0), cz + (alongX ? 0 : -.52 - (CS-1.04)/4), alongX, (CS-1.04)/2, 0, WH);
        addSeg(L, cx + (alongX ? .52 + (CS-1.04)/4 : 0), cz + (alongX ? 0 : .52 + (CS-1.04)/4), alongX, (CS-1.04)/2, 0, WH);
        addSeg(L, cx, cz, alongX, 1.04, 2.15, WH);
        addSeg(segs.trim, cx, cz, alongX, 1.1, 2.12, 2.2);
        I.doors.push(buildDoor(I, sh.doors[di], di, cx, cz, alongX, hull)); continue; }
      if(hull && (x + y) % 2 === 0){ // hull window: wall below and above, frame, open to space
        addSeg(segs.hull, cx, cz, alongX, CS, 0, .95); addSeg(segs.hull, cx, cz, alongX, CS, 1.95, WH);
        addSeg(segs.trim, cx, cz, alongX, CS, .93, 1.0); addSeg(segs.trim, cx, cz, alongX, CS, 1.9, 1.97);
        for(const s of [-1,1]) addSeg(segs.trim, cx + (alongX ? s*CS*.47 : 0), cz + (alongX ? 0 : s*CS*.47), alongX, .08, .95, 1.95);
        continue; }
      addSeg(segs[hull ? 'hull' : 'wall'], cx, cz, alongX, CS, 0, WH);
    }
  }
  // nose hatch to the bridge corridor (player ship only)
  if(own){ const nl = roomCenterLocal(I, nose); const front = cellLocal(I, nose.x + nose.w - 1, nose.y).z - CS/2;
    I.hatch = { x:nl.x, z:front };
    const hw = nose.h*CS/2; // replace the front hull with two pieces and a doorway
    segs.hull = segs.hull.filter(s => !(Math.abs(s.cz - front) < .01 && s.alongX && Math.abs(s.cx - nl.x) < hw));
    addSeg(segs.hull, nl.x - (hw + .55)/2, front, true, hw - .55, 0, WH); addSeg(segs.hull, nl.x + (hw + .55)/2, front, true, hw - .55, 0, WH); addSeg(segs.hull, nl.x, front, true, 1.1, 2.2, WH);
    // corridor to the bridge
    const cw = 1.3, ch = 2.3, cz0 = front - CORR/2;
    addSeg(segs.hull, nl.x - cw/2, cz0, false, CORR, 0, ch); addSeg(segs.hull, nl.x + cw/2, cz0, false, CORR, 0, ch);
    const cf = new THREE.Mesh(M.box, M.floor); cf.scale.set(cw, .02, CORR); cf.position.set(nl.x, -.01, cz0); g.add(cf);
    const cc = new THREE.Mesh(M.box, M.ceil); cc.scale.set(cw, .05, CORR); cc.position.set(nl.x, ch, cz0); g.add(cc);
    for(const s of [-1,1]){ const ls = new THREE.Mesh(M.box, M.glow('#5fd3e6')); ls.scale.set(.03, .03, CORR); ls.position.set(nl.x + s*(cw/2 - .03), .05, cz0); g.add(ls); I.corrLights = I.corrLights || []; I.corrLights.push(ls); }
    I.corridor = { x:nl.x, z0:front - CORR, z1:front, w:cw };
  }
  for(const [k, mat] of [['wall', M.wall], ['hull', M.hull], ['trim', M.trim]]){
    const list = segs[k]; if(!list.length) continue; const im = new THREE.InstancedMesh(M.box, mat, list.length);
    list.forEach((sg, i) => { const thick = k==='trim' ? .16 : k==='hull' ? .2 : .12; const h = sg.y1 - sg.y0;
      m4.compose(new THREE.Vector3(sg.cx, sg.y0 + h/2, sg.cz), new THREE.Quaternion(), new THREE.Vector3(sg.alongX ? sg.len : thick, h, sg.alongX ? thick : sg.len)); im.setMatrixAt(i, m4); });
    g.add(im); }
  // rooms: label, system machine, hazard containers
  sh.rooms.forEach((r, ri) => {
    const c = roomCenterLocal(I, r); const R = { r, ri, c, w:r.w*CS, d:r.h*CS, fire:[], smoke:[], breach:[], sparks:0, lastDmg:0, hitT:0 };
    // low-oxygen haze
    const fog = new THREE.Mesh(M.box, new THREE.MeshBasicMaterial({ color:0xff2040, transparent:true, opacity:0, depthWrite:false, side:THREE.BackSide }));
    fog.scale.set(r.h*CS - .1, WH - .05, r.w*CS - .1); fog.position.set(c.x, WH/2, c.z); fog.visible = false; g.add(fog); R.fog = fog;
    if(r.sys){ R.prop = buildProp(I, r.sys, c, r); if(R.prop) g.add(R.prop.g);
      const lc = mkCanvas(384, 96); const lt = texFrom(lc); const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map:lt, transparent:true, depthWrite:false })); lab.scale.set(1.2, .3, 1); lab.position.set(c.x, WH - .35, c.z); g.add(lab); R.label = { s:lab, c:lc, t:lt, key:'' }; }
    I.rooms.push(R);
  });
  I.sparks = makeParticles(500, true); I.smoke = makeParticles(260, false); g.add(I.sparks.pts, I.smoke.pts);
  I.group.userData.interior = I;
  return I;
}
function buildDoor(I, d, di, cx, cz, alongX, hull){
  const M = interiorMats(); const g = new THREE.Group(); g.position.set(cx, 0, cz); if(!alongX) g.rotation.y = Math.PI/2;
  const airlock = d.b < 0; const leaves = [];
  for(const s of [-1,1]){ const lf = new THREE.Group(); const pane = new THREE.Mesh(M.box, doorLeafMat(airlock, s)); pane.scale.set(.52, 2.12, .08); lf.add(pane);
    lf.position.set(s*.26, 1.06, 0); g.add(lf); leaves.push({ g:lf, s, pane }); }
  const lamp = new THREE.Mesh(M.box, new THREE.MeshBasicMaterial({ color:0x7be0a0 })); lamp.scale.set(.12, .05, .2); lamp.position.set(0, 2.25, 0); g.add(lamp);
  I.group.add(g);
  return { d, di, g, leaves, lamp, open:0, airlock, hull, pos:new THREE.Vector3(cx, 1, cz) };
}


/* ---------------- particles: one point cloud per ship (additive) + one for smoke ---------------- */
function makeParticles(max, additive){
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(max*3), col = new Float32Array(max*3), size = new Float32Array(max), alpha = new Float32Array(max);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms:{ scale:{ value:600 } },
    vertexShader:'attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size*scale/max(.1,-mv.z); gl_Position = projectionMatrix*mv; }',
    fragmentShader:'varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float r = dot(d,d)*4.; if(r>1.) discard; float a = (1.-r); a *= a; gl_FragColor = vec4(vC, a*vA); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3;
  return { pts, max, n:0, p:[], geo };
}
let _pc = null;
function emit(I, kind, pos, vel, life, size, col, grav=0, grow=0){
  const S = kind==='smoke' ? I.smoke : I.sparks; if(!S) return; if(S.p.length >= S.max) S.p.shift();
  (_pc = _pc || new THREE.Color()).set(col); S.p.push({ x:pos.x, y:pos.y, z:pos.z, vx:vel.x, vy:vel.y, vz:vel.z, life, max:life, size, r:_pc.r, g:_pc.g, b:_pc.b, grav, grow });
}
function stepParticles(S, dt){
  if(!S) return; const P = S.geo.attributes; let n = 0;
  for(let i=S.p.length-1;i>=0;i--){ const q = S.p[i]; q.life -= dt; if(q.life<=0){ S.p.splice(i,1); continue; } q.vy -= q.grav*dt; q.x += q.vx*dt; q.y += q.vy*dt; q.z += q.vz*dt; q.vx *= .97; q.vz *= .97; }
  for(const q of S.p){ const k = 1 - q.life/q.max; P.position.array[n*3] = q.x; P.position.array[n*3+1] = q.y; P.position.array[n*3+2] = q.z;
    P.color.array[n*3] = q.r; P.color.array[n*3+1] = q.g; P.color.array[n*3+2] = q.b; P.size.array[n] = q.size*(1 + k*q.grow); P.alpha.array[n] = 1 - k; n++; }
  S.geo.setDrawRange(0, n); for(const k of ['position','color','size','alpha']) P[k].needsUpdate = true;
}
function interiorSpark(I, pos){ emit(I, 'spark', pos, new THREE.Vector3(rand(-1.5,1.5), rand(0,2), rand(-1.5,1.5)), rand(.3,.7), .05, '#ffd27a', 6); }
function interiorSparks(I, R, n){ n = Math.round(n*fxq()); for(let i=0;i<n;i++) interiorSpark(I, new THREE.Vector3(R.c.x + rand(-R.d/3, R.d/3), rand(1.2, 2.3), R.c.z + rand(-R.w/3, R.w/3))); }
function fxPuff(I, pos, v, col, size){ emit(I, /#[0-4]/.test(col) ? 'smoke' : 'spark', pos, v, 1.2, size*.6, col, 0, 1.5); }

/* ---------------- system machines ---------------- */
function buildProp(I, sys, c, r){
  const M = interiorMats(); const g = new THREE.Group(); g.position.set(c.x, 0, c.z); const P = { g, sys, anim:[], glow:[], spin:[] };
  const add = (geo, mat, x, y, z, sx, sy, sz, parent=g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy ?? sx, sz ?? sx); parent.add(m); return m; };
  const glowM = (c) => { const m = new THREE.MeshBasicMaterial({ color:new THREE.Color(c) }); m.userData.base = c; P.glow.push(m); return m; };
  const console_ = (x, z, rot, col) => { const k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = rot; g.add(k);
    add(M.box, M.dark, 0, .45, 0, .7, .9, .4, k); const top = add(M.box, M.trim, 0, .93, .04, .74, .06, .5, k); top.rotation.x = -.35;
    const scr = add(M.plane, glowM(col), 0, .98, .02, .6, .32, 1, k); scr.rotation.x = -Math.PI/2 - .35 + Math.PI/2*0; scr.rotation.set(-1.2, 0, 0); return k; };
  const big = r.w>=2 && r.h>=2;
  switch(sys){
    case 'shields': { add(M.cyl, M.dark, 0, .15, 0, .7, .3, .7); const core = add(M.sph, glowM('#5fd3e6'), 0, 1.15, 0, .32); P.core = core;
      for(let i=0;i<3;i++){ const ring = add(M.torus, M.metal, 0, 1.15, 0, .42 + i*.08); ring.rotation.x = i*1.1; P.spin.push([ring, .6 + i*.4, i%2 ? 'y' : 'x']); }
      add(M.cyl, M.metal, 0, 2.2, 0, .2, .6, .2); const halo = glowSpriteMesh('#5fd3e6', 1.6); halo.position.y = 1.15; g.add(halo); P.halo = halo; break; }
    case 'engines': for(const s of [-1,1]){ const bx = s*(r.h*CS)*.25; add(M.cyl, M.metal, bx, .9, 0, .34, 1.6, .34).rotation.x = Math.PI/2; add(M.box, M.dark, bx, .3, 0, .5, .6, 1.4);
        for(let k=0;k<3;k++){ const coil = add(M.torus, glowM('#ffb547'), bx, .9, -.5 + k*.5, .38); P.anim.push([coil, k]); }
        const exh = glowSpriteMesh('#ffb547', 1.0); exh.position.set(bx, .9, .85); g.add(exh); P.glowSprites = (P.glowSprites||[]).concat(exh); } P.engine = true; break;
    case 'weapons': { const n = Math.max(1, Math.min(4, I.sh.weapons.length)); P.bars = [];
      for(let i=0;i<n;i++){ const x = (i - (n-1)/2)*.62; add(M.box, M.dark, x, .7, .2, .5, 1.4, .5); add(M.cyl, M.metal, x, 1.5, .2, .1, .4, .1);
        const bar = add(M.box, glowM('#ffb547'), x, .25, -.06, .36, .05, .02); bar.userData.base = .25; P.bars.push(bar); }
      console_(0, -.8, 0, '#ff5a7a'); break; }
    case 'oxygen': { for(const s of [-1,1]){ add(M.cyl, M.metal, s*.35, .8, .3, .22, 1.6, .22); add(M.sph, M.metal, s*.35, 1.6, .3, .22); }
      const fan = add(M.cyl, M.dark, 0, 1.1, -.35, .45, .08, .45); fan.rotation.x = Math.PI/2; P.fan = fan; const blades = new THREE.Group(); blades.position.set(0, 1.1, -.3); g.add(blades);
      for(let i=0;i<4;i++){ const b = add(M.box, M.metal, 0, 0, 0, .08, .4, .02, blades); b.rotation.z = i*Math.PI/2; b.position.set(Math.sin(i*Math.PI/2)*.18, Math.cos(i*Math.PI/2)*.18, 0); }
      P.spin.push([blades, 4, 'z']); const ind = add(M.box, glowM('#9fe8ff'), 0, .4, -.35, .4, .08, .04); P.ind = ind; break; }
    case 'medbay': { const beds = big ? 2 : 1; for(let i=0;i<beds;i++){ const x = (i - (beds-1)/2)*1.2; add(M.box, M.metal, x, .45, 0, .7, .1, 1.6); add(M.box, M.dark, x, .25, 0, .5, .4, 1.4); add(M.box, glowM('#e8eef9'), x, .52, .55, .5, .06, .3); }
      const cross = new THREE.Group(); cross.position.set(0, 2.0, 0); g.add(cross); add(M.box, glowM('#7be0a0'), 0, 0, 0, .5, .14, .02, cross); add(M.box, glowM('#7be0a0'), 0, 0, 0, .14, .5, .02, cross); P.cross = cross; break; }
    case 'clonebay': { const tube = add(M.cyl, M.glass, 0, 1.1, 0, .45, 2, .45); add(M.cyl, M.metal, 0, .08, 0, .55, .16, .55); add(M.cyl, M.metal, 0, 2.14, 0, .55, .16, .55); const fl = add(M.cyl, new THREE.MeshBasicMaterial({ color:0x7be0a0, transparent:true, opacity:.25 }), 0, 1.0, 0, .4, 1.7, .4); P.fluid = fl; break; }
    case 'piloting': { const ch = new THREE.Group(); ch.position.set(0, 0, .25); g.add(ch); add(M.box, M.dark, 0, .45, 0, .5, .1, .5, ch); add(M.box, M.dark, 0, .85, .25, .5, .7, .08, ch); add(M.cyl, M.metal, 0, .22, 0, .06, .45, .06, ch);
      console_(0, -.45, 0, '#5fd3e6'); break; }
    case 'sensors': { add(M.cyl, M.metal, 0, .7, 0, .08, 1.4, .08); const dish = add(M.sph, M.metal, 0, 1.5, 0, .5, .15, .5); P.spin.push([dish, .8, 'y']); add(M.sph, glowM('#ffd27a'), 0, 1.6, 0, .06); break; }
    case 'doors': console_(0, 0, 0, '#ffd166'); add(M.box, M.hazard, 0, 1.7, .25, .8, .2, .04); break;
    case 'drones': { add(M.box, M.dark, 0, .35, 0, 1.2, .7, .9); for(let i=0;i<2;i++){ const dr = add(M.sph, M.metal, -.3 + i*.6, 1.0, 0, .2); P.anim.push([dr, i]); } console_(0, -.75, 0, '#f0a6ff'); break; }
    case 'teleporter': { const pad = add(M.cyl, M.metal, 0, .06, 0, .8, .12, .8); add(M.torus, glowM('#b48cff'), 0, .14, 0, .75).rotation.x = Math.PI/2; const beam = add(M.cyl, new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:.0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }), 0, 1.2, 0, .75, 2.3, .75); P.beam = beam; add(M.cyl, M.metal, 0, 2.4, 0, .8, .1, .8); break; }
    case 'cloaking': { const cr = add(new THREE.OctahedronGeometry(1, 0), stdMat({ color:0x9fe8ff, transparent:true, opacity:.6, metalness:.9, roughness:.05, emissive:new THREE.Color(0x2a6a8a), emissiveIntensity:.6 }), 0, 1.2, 0, .35, .6, .35); P.spin.push([cr, .5, 'y']); add(M.cyl, M.dark, 0, .25, 0, .45, .5, .45); P.cloakGem = cr; break; }
    case 'hacking': console_(-.35, 0, .3, '#7be0a0'); console_(.35, 0, -.3, '#7be0a0'); break;
    case 'mindcontrol': { const orb = add(M.sph, stdMat({ color:0xb48cff, emissive:new THREE.Color(0x6a3cbf), emissiveIntensity:1, transparent:true, opacity:.85 }), 0, 1.3, 0, .3); P.orb = orb; add(M.cyl, M.dark, 0, .5, 0, .2, 1, .2); for(let i=0;i<2;i++){ const t_ = add(M.torus, M.metal, 0, 1.3, 0, .45); t_.rotation.x = i*1.5; P.spin.push([t_, .7, i ? 'y' : 'z']); } break; }
    case 'battery': for(let i=0;i<3;i++){ add(M.box, M.dark, -.4 + i*.4, .6, 0, .3, 1.2, .3); const cellG = add(M.box, glowM('#ffe27a'), -.4 + i*.4, .6, -.16, .2, 1.0, .02); P.anim.push([cellG, i]); } break;
    default: console_(0, 0, 0, '#c8ccd8');
  }
  // damage effects anchor
  P.top = new THREE.Vector3(c.x, 1.4, c.z);
  // bake the static parts of the machine into one or two meshes (animated parts stay separate)
  const keep = new Set(); for(const [m] of P.spin) keep.add(m); for(const [m] of P.anim) keep.add(m); (P.bars||[]).forEach(m => keep.add(m)); [P.core, P.cross, P.fan, P.ind].forEach(m => m && keep.add(m));
  keep.forEach(m => m.userData.noBake = true);
  const baked = bakeGroup(g); P.glowBaked = baked.filter(m => m.userData.baked==='basic').map(m => m.material);
  const animGlow = new Set(); for(const m of keep) m.traverse?.(o => { if(o.material) animGlow.add(o.material); }); P.glow = P.glow.filter(m => animGlow.has(m));
  return P;
}

/* ---------------- per-frame update ---------------- */
function updateInterior(I, dt, t, here){
  const sh = I.sh; if(!sh) return;
  const M = interiorMats(); const col = new THREE.Color();
  const alert = bridge?.alert || 0;
  // lights: per-cell ceiling panel colour by room state
  for(const R of I.rooms){ const r = sh.rooms[R.ri]; if(!r) continue; const s = r.sys ? sh.systems[r.sys] : null;
    let c = I.own ? (alert===2 ? (Math.sin(t*5)>0 ? 0xff4050 : 0x501018) : alert===1 ? 0xffe0b0 : 0xdfe8ff) : 0xffb0b0;
    if(r.o2 < 30) c = Math.sin(t*4 + R.ri)>0 ? 0xff3050 : 0x401018;
    if(R.hitT > 0){ R.hitT -= dt; if(Math.random()<.5) c = 0x101010; }
    if(s && (s.ionT||0) > 0 && Math.random()<.3) c = 0x5fd3e6;
    for(const [x,y] of cellsOf(r)){ const i = I.cellIdx[x+','+y]; if(i!=null) I.lights.setColorAt(i, col.set(c)); }
    // fog for low oxygen
    const o2bad = clamp((60 - r.o2)/60, 0, 1); R.fog.material.opacity = o2bad*.32; R.fog.visible = o2bad > .02;
    // hits: flash and sparks when the room takes new damage
    const dmgNow = (s?.dmg||0) + r.fire + r.breach; if(dmgNow > R.lastDmg){ R.hitT = .35; interiorSparks(I, R, 14); if(here===I) hapticFn?.(.3, 80); } R.lastDmg = dmgNow;
    // fires: flames on random cells, smoke under the ceiling
    syncFire(I, R, r, t, dt); syncBreach(I, R, r, t, dt);
    if(R.prop) animateProp(I, R, r, s, t, dt);
    if(R.label && ((t*4)|0) % 2 === 0) drawRoomLabel(R, r, s);
  }
  I.lights.instanceColor.needsUpdate = true;
  // doors
  const head = headWorld(); const hl = I.group.worldToLocal(head.clone());
  for(const D of I.doors){ const d = D.d; const near = here===I && Math.hypot(hl.x - D.pos.x, hl.z - D.pos.z) < 1.4 && !D.airlock;
    const want = (doorOpen(d) || near) ? 1 : 0; const was = D.open; D.open += (want - D.open)*Math.min(1, dt*7);
    if(here===I && Math.abs(want - was) > .5 && Math.hypot(hl.x - D.pos.x, hl.z - D.pos.z) < 8 && Math.abs(D.open - want) > .45) sfx('door', { vol:.5 });
    for(const L of D.leaves) L.g.position.x = L.s*(.26 + D.open*.5);
    D.lamp.material.color.set(d.broken>0 ? (Math.sin(t*12)>0 ? 0xff3050 : 0x300810) : doorOpen(d) ? 0x7be0a0 : 0xffb547);
    if(d.broken>0 && Math.random() < dt*3) interiorSpark(I, D.pos.clone().setY(2.1));
    if(D.airlock && doorOpen(d) && Math.random() < dt*12) fxPuff(I, D.pos.clone().setY(rand(.3,2)), new THREE.Vector3(rand(-.3,.3), rand(-.1,.1), rand(-.3,.3)).multiplyScalar(2), '#cfe6ff', .5);
  }
  if(I.corrLights) I.corrLights.forEach(m => m.material.color.set(alert===2 ? (Math.sin(t*5)>0 ? 0xff3050 : 0x501018) : alert===1 ? 0xffb547 : 0x5fd3e6));
  syncCrew3D(I, t, dt, here);
  stepParticles(I.sparks, dt); stepParticles(I.smoke, dt);
  // remaining mesh effects (beams)
  for(let i=I.fx.length-1;i>=0;i--){ const F = I.fx[i]; F.life -= dt; if(F.life<=0){ I.group.remove(F.m); F.m.material.dispose(); I.fx.splice(i,1); continue; }
    F.m.position.addScaledVector(F.v, dt); if(F.grav) F.v.y -= 6*dt; const k = 1 - F.life/F.max; F.m.material.opacity = (1-k)*(F.op||1); F.m.scale.setScalar(F.size*(1 + k*(F.grow||0))); }
}
function syncFire(I, R, r, t, dt){
  const want = Math.min(6, r.fire*2);
  while(R.fire.length < want){ const cells = cellsOf(r); const [x,y] = cells[Math.floor(Math.random()*cells.length)]; const p = cellLocal(I, x, y).add(new THREE.Vector3(rand(-.45,.45), 0, rand(-.45,.45)));
    const f = glowSpriteMesh('#ff8a3d', .9); f.position.set(p.x, .45, p.z); const core = glowSpriteMesh('#ffe08a', .45); core.position.set(p.x, .3, p.z); I.group.add(f, core); R.fire.push({ f, core, p, ph:Math.random()*10 }); }
  while(R.fire.length > want){ const F = R.fire.pop(); I.group.remove(F.f, F.core); F.f.material.dispose(); F.core.material.dispose(); }
  for(const F of R.fire){ const k = Math.sin(t*9 + F.ph)*.5 + .5; F.f.scale.set(.8 + k*.4, 1.2 + k*.6, 1); F.f.position.y = .5 + k*.15; F.core.scale.setScalar(.4 + k*.2);
    if(Math.random() < dt*6*fxq()) fxPuff(I, new THREE.Vector3(F.p.x, 1.2, F.p.z), new THREE.Vector3(rand(-.2,.2), .8, rand(-.2,.2)), '#3a3a40', .5);
    if(Math.random() < dt*4) interiorSpark(I, new THREE.Vector3(F.p.x, .6, F.p.z)); }
}
function syncBreach(I, R, r, t, dt){
  const want = Math.min(3, r.breach);
  while(R.breach.length < want){ const cells = cellsOf(r); const [x,y] = cells[Math.floor(Math.random()*cells.length)]; const p = cellLocal(I, x, y).add(new THREE.Vector3(rand(-.3,.3), 0, rand(-.3,.3)));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.32, 9), new THREE.MeshBasicMaterial({ color:0x02040c })); hole.rotation.x = -Math.PI/2; hole.position.set(p.x, .012, p.z);
    const rim = new THREE.Mesh(new THREE.RingGeometry(.3, .4, 9), new THREE.MeshBasicMaterial({ color:0xff8a3d, transparent:true, opacity:.8 })); rim.rotation.x = -Math.PI/2; rim.position.set(p.x, .014, p.z);
    I.group.add(hole, rim); R.breach.push({ hole, rim, p }); }
  while(R.breach.length > want){ const B = R.breach.pop(); I.group.remove(B.hole, B.rim); B.hole.geometry.dispose(); B.rim.geometry.dispose(); }
  for(const B of R.breach){ B.rim.material.opacity = .5 + .3*Math.sin(t*10); if(Math.random() < dt*10*fxq()){ const from = new THREE.Vector3(B.p.x + rand(-1,1), rand(.4, 1.8), B.p.z + rand(-1,1)); fxPuff(I, from, new THREE.Vector3(B.p.x - from.x, -from.y, B.p.z - from.z).multiplyScalar(1.4), '#cfe6ff', .25); } }
}
function animateProp(I, R, r, s, t, dt){
  const P = R.prop, sh = I.sh; const pw = s ? eff(sh, r.sys) : 0, on = pw > 0, dmg = s?.dmg||0, ion = (s?.ionT||0) > 0;
  for(const [m, sp, ax] of P.spin) m.rotation[ax] += dt*sp*(on ? 1 : .05);
  for(const gm of P.glow) gm.color.set(on ? gm.userData.base : '#30343e');
  for(const bm of P.glowBaked || []) bm.color.set(on ? '#ffffff' : '#30343e');
  if(dmg > 0 && Math.random() < dt*3*dmg) interiorSpark(I, P.top.clone().add(new THREE.Vector3(rand(-.3,.3), rand(-.4,.4), rand(-.3,.3))));
  if(dmg > 0 && Math.random() < dt*2) fxPuff(I, P.top.clone(), new THREE.Vector3(rand(-.1,.1), .5, rand(-.1,.1)), '#2a2a30', .4);
  if(ion && Math.random() < dt*10) emit(I, 'spark', P.top.clone().add(new THREE.Vector3(rand(-.4,.4), rand(-.5,.5), rand(-.4,.4))), new THREE.Vector3(), .12, .25, '#5fd3e6');
  if(P.core){ const sl = sh.shield||0; P.core.scale.setScalar(.22 + .05*sl + .02*Math.sin(t*4)); P.halo.material.opacity = on ? .4 + .15*sl : 0; }
  if(P.engine) P.anim.forEach(([coil, k]) => { coil.scale.setScalar(.5 + (on ? .04*Math.sin(t*6 + k) : 0)); });
  if(P.glowSprites) P.glowSprites.forEach(e => { e.material.opacity = on ? .5 + .1*pw : 0; e.scale.setScalar(.8 + .25*pw + (G?.warp>0 ? 2 : 0)); });
  if(P.bars) P.bars.forEach((b, i) => { const w = sh.weapons[i]; const d = w && DATA.weapons[w.id]; const k = w && w.on && d ? clamp(w.charge/d.charge, 0, 1) : 0; b.scale.y = .05 + k*1.1; b.position.y = .25 + k*.55; b.material.color.set(k>=1 ? '#7be0a0' : '#ffb547'); });
  if(P.cross) P.cross.rotation.y += dt*(on ? 1.2 : 0);
  if(P.beam){ const tp = sh.tele; const active = tp && tp.cd > (TELE_CD?.[lvlIdx(sh,'teleporter')] || 15) - 1.2; P.beam.material.opacity = active ? .5 + .3*Math.sin(t*20) : (on ? .04 + .03*Math.sin(t*2) : 0); }
  if(P.cloakGem) P.cloakGem.material.opacity = sh.cloak?.t > 0 ? .25 + .2*Math.sin(t*6) : .6;
  if(P.orb) P.orb.scale.setScalar(.28 + (on ? .04*Math.sin(t*3) : 0));
  if(P.fluid) P.fluid.material.opacity = on ? .25 + .1*Math.sin(t*2) : .05;
  if(P.anim && r.sys==='drones') P.anim.forEach(([dr, k]) => { dr.position.y = 1.0 + Math.sin(t*2 + k)*.1; });
  if(P.anim && r.sys==='battery') P.anim.forEach(([cl, k]) => { cl.scale.y = on ? .5 + .5*Math.abs(Math.sin(t*.5 + k)) : .1; });
}
function drawRoomLabel(R, r, s){
  const sh = R.prop ? null : null; const name = SYSN[r.sys] || r.sys; const pw = s ? s.power : 0, max = s ? s.max : 0, dmg = s ? s.dmg : 0;
  const key = name + pw + '/' + max + 'd' + dmg + 'o' + Math.round(r.o2/10) + 'f' + r.fire + 'b' + r.breach;
  if(R.label.key===key) return; R.label.key = key; const g = R.label.c.getContext('2d');
  g.clearRect(0,0,384,96); g.fillStyle = 'rgba(8,12,24,.72)'; if(g.roundRect){ g.beginPath(); g.roundRect(4,4,376,88,14); g.fill(); } else g.fillRect(4,4,376,88);
  g.font = "700 34px 'Chakra Petch', sans-serif"; g.textAlign = 'center'; g.fillStyle = dmg>0 ? '#ff5a7a' : SYSC?.[r.sys] || '#ffffff'; g.fillText(name.toUpperCase(), 192, 40);
  for(let i=0;i<max;i++){ const x = 192 - max*13 + i*26; g.fillStyle = i >= max - dmg ? '#ff5a7a' : i < pw ? '#7be0a0' : '#2a3450'; g.fillRect(x, 54, 20, 12); }
  g.font = "500 16px 'IBM Plex Mono', monospace"; g.fillStyle = r.o2 < 40 ? '#ff5a7a' : '#9fe8ff'; g.fillText(`O2 ${Math.round(r.o2)}%${r.fire ? '  FIRE' : ''}${r.breach ? '  BREACH' : ''}`, 192, 86);
  R.label.t.needsUpdate = true;
}

/* ---------------- crew sync ---------------- */
function crewLocal(I, c){ return cellLocal(I, c.x, c.y); }
function syncCrew3D(I, t, dt, here){
  const sh = I.sh, seen = new Set(), head = headWorld(), hl = I.group.worldToLocal(head.clone());
  for(const c of sh.crew){
    seen.add(c.id); let P = I.crew.get(c.id);
    const target = crewLocal(I, c);
    if(!P){ P = buildCrew3D(c); P.phase = Math.random()*10; P.id = c.id; P.c = c; P.prev = target.clone(); P.yaw = I.own ? Math.PI : 0; P.g.position.copy(target); I.group.add(P.g); I.crew.set(c.id, P);
      if(I.armed){ beamEffect(I, target); } }
    P.c = c;
    const moving = c.path && c.path.length > 0; const mv = target.clone().sub(P.prev); P.prev.copy(target);
    // face where they're going, or what they're working on
    let faceTo = null; const job = crewJob(c, sh);
    if(mv.lengthSq() > 1e-6) faceTo = mv;
    else if(job.k==='fight'){ const foe = sh.crew.find(o => o.room===c.room && crewSide(o)!==crewSide(c)); if(foe) faceTo = crewLocal(I, foe).sub(target); }
    else if(job.k==='fire'){ const R = I.rooms[c.room]; const f = R?.fire?.[0]; if(f) faceTo = f.p.clone().sub(target); }
    else if((job.k==='repair' || job.k==='man') && I.rooms[c.room]?.prop){ faceTo = I.rooms[c.room].c.clone().sub(target); }
    if(faceTo && faceTo.lengthSq() > 1e-4){ const want = Math.atan2(faceTo.x, faceTo.z); let d_ = want - P.yaw; while(d_ > Math.PI) d_ -= Math.PI*2; while(d_ < -Math.PI) d_ += Math.PI*2; P.yaw += d_*Math.min(1, dt*10); }
    P.g.rotation.y = P.yaw; P.g.position.x = target.x; P.g.position.z = target.z;
    const dist = Math.hypot(hl.x - target.x, hl.z - target.z); const q = fxq(); const vis = (here===I && dist < 10 + 8*q) || dist < 8 + 8*q; P.g.visible = vis;
    if(!vis) continue;
    const lunge = job.k==='fight' && faceTo ? faceTo.clone().setY(0).normalize() : null;
    animateCrew3D(P, c, { moving, job, t, dt, y:0, lunge });
    if(job.k==='fire' && Math.random() < dt*12*fxq()){ const fwd = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw)); fxPuff(I, target.clone().add(fwd.clone().multiplyScalar(.4)).setY(.9), fwd.multiplyScalar(2.2).setY(-.6), '#e8f2ff', .22); }
    if(job.k==='heal' && Math.random() < dt*5) emit(I, 'spark', target.clone().add(new THREE.Vector3(rand(-.3,.3), rand(.5,1.6), rand(-.3,.3))), new THREE.Vector3(0,.6,0), .8, .08, '#7be0a0');
    if(job.k==='repair' && Math.random() < dt*4) interiorSpark(I, target.clone().add(new THREE.Vector3(Math.sin(P.yaw)*.5, 1.0, Math.cos(P.yaw)*.5)));
    if(job.k==='mind' && P.aura==null){ P.mcAura = P.mcAura || (() => { const a = glowSpriteMesh('#b48cff', 1.3); a.position.y = 1.2; P.g.add(a); return a; })(); }
    if(P.mcAura) P.mcAura.visible = c.mcT > 0;
    P.ring.visible = c.owner==='p' && (UI.selCrew===c.id || (UI.selCrews||[]).includes(c.id));
    const plateD = 4 + 5*q; if(dist < plateD) drawPlate(P, c, c.owner==='p' ? job : null, c.owner==='e');
    P.plate.sprite.visible = dist < plateD;
  }
  // crew that left: died (fall and fade) or teleported (beam out)
  for(const [id, P] of I.crew){ if(seen.has(id)) continue; I.crew.delete(id);
    const died = !(G.ship?.crew.some(o=>o.id===id) || G.enemy?.crew.some(o=>o.id===id));
    if(died){ P.dieT = 1.6; I.dying = I.dying || []; I.dying.push(P); } else { beamEffect(I, P.g.position.clone()); I.group.remove(P.g); } }
  if(I.dying) for(let i=I.dying.length-1;i>=0;i--){ const P = I.dying[i]; P.dieT -= dt; P.g.rotation.x = Math.min(Math.PI/2, P.g.rotation.x + dt*3); P.g.position.y = Math.max(-.1, P.g.position.y - dt*.1);
    if(!P.faded){ P.faded = true; P.g.traverse(o => { if(o.material){ o.material = o.material.clone(); o.material.transparent = true; } }); }
    P.g.traverse(o => { if(o.material) o.material.opacity = Math.max(0, P.dieT/1.6); });
    if(P.dieT <= 0){ I.group.remove(P.g); I.dying.splice(i,1); } }
  I.armed = true;
}
function beamEffect(I, pos){
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 2.4, 20, 1, true), new THREE.MeshBasicMaterial({ color:0xb48cff, transparent:true, opacity:.8, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
  col.position.copy(pos).setY(1.2); I.group.add(col); I.fx.push({ m:col, life:.9, max:.9, v:new THREE.Vector3(), size:1, grow:-.5 });
  for(let i=0;i<24;i++) emit(I, 'spark', pos.clone().add(new THREE.Vector3(rand(-.4,.4), rand(0, 2.2), rand(-.4,.4))), new THREE.Vector3(0, rand(.5,1.5), 0), rand(.5,.9), .07, '#e0d0ff');
}

/* ---------------- manager: own ship, enemy ship, captain beaming ---------------- */
function sharedSet(){ const set = new Set(); if(IM) for(const v of Object.values(IM)) if(v && typeof v==='object') set.add(v); if(C3.geo) for(const v of Object.values(C3.geo)) set.add(v); for(const v of Object.values(C3.mats)) set.add(v); return set; }
function disposeInterior(I){ if(!I) return; const shared = sharedSet(); I.group.parent?.remove(I.group);
  I.group.traverse(o => { if(o.isInstancedMesh) o.dispose?.(); if(o.geometry && !shared.has(o.geometry)) o.geometry.dispose(); if(o.material && !shared.has(o.material)){ if(o.material.map && o.isSprite && o.material.map.image?.width < 400 && !(GLOW && Object.values(GLOW).includes(o.material.map))) o.material.map.dispose(); o.material.dispose(); } }); }
function headInOwn(){ const I = IN.own; if(!I || !I.group.visible) return false; const L = I.group.worldToLocal(headWorld()); if(I.corridor && Math.abs(L.x - I.corridor.x) < I.corridor.w/2 + .1 && L.z > I.corridor.z0 - .3 && L.z < I.corridor.z1) return true; const c = localCell(I, L.x, L.z); return I.sh.cellRoom[Math.round(c.x)+','+Math.round(c.y)]!=null; }
function updateInteriors(dt){
  if(!bridge) return;
  const full = shipMode()==='full' && xrMode!=='immersive-ar' && UI.screen==='game' && G;
  const t = performance.now()/1000;
  // own ship, docked behind the bridge's rear door
  if(full && G.ship && G.ship.cellRoom){
    if(!IN.own || IN.own.key!==interiorKey(G.ship) || IN.own.sh!==G.ship){ disposeInterior(IN.own); IN.own = buildInterior(G.ship, true); bridge.group.add(IN.own.group);
      IN.own.group.position.set(-IN.own.hatch.x, 0, 4.2 + CORR - IN.own.hatch.z); bridge.group.updateMatrixWorld(true); }
    IN.own.group.visible = true;
  } else if(IN.own){ IN.own.group.visible = false; }
  // bridge door opens when you walk up to it
  const bl = toBridge(headWorld()); const nearDoor = full && Math.abs(bl.x) < 1.1 && bl.z > 2.6 && bl.z < 5.5;
  bridge.doorOpen += ((nearDoor ? 1 : 0) - bridge.doorOpen)*Math.min(1, dt*6);
  if(nearDoor && !bridge._doorWas) sfx('door', { vol:.6 }); bridge._doorWas = nearDoor;
  bridge.doorLeaves.forEach(L => { L.g.position.x = L.sx*(.28 + bridge.doorOpen*.56); });
  bridge.doorSign.visible = shipMode()==='full';
  // enemy ship interior, far from yours: you only see it if you beam over
  const foeLive = full && G.enemy && !G.enemy.dead && G.enemy.cellRoom;
  if(foeLive){ if(!IN.foe || IN.foe.sh!==G.enemy || IN.foe.key!==interiorKey(G.enemy)){ disposeInterior(IN.foe); IN.foe = buildInterior(G.enemy, false); scene.add(IN.foe.group); placeFoeInterior(); } }
  else if(IN.foe){ if(IN.aboard) beamCaptain(false, true); disposeInterior(IN.foe); IN.foe = null; }
  if(IN.foe) IN.foe.group.visible = !!IN.aboard;
  // while you're aboard the enemy, your bridge and the enemy's outside view are out of sight
  bridge.group.visible = !IN.aboard && xrMode!=='immersive-ar' && SET.bridge !== false; if(holo) holo.group.visible = !IN.aboard; if(space3d?.enemy) space3d.enemy.group.visible = space3d.enemy.group.visible && !IN.aboard;
  const here = IN.aboard ? IN.foe : headInOwn() ? IN.own : null;
  if(nav.lamp) nav.lamp.intensity += ((here ? 1.1 : .2) - nav.lamp.intensity)*Math.min(1, dt*3);
  if(IN.own && IN.own.group.visible) updateInterior(IN.own, dt, t, here);
  if(IN.foe && IN.aboard) updateInterior(IN.foe, dt, t, here);
  // hide the far-away machinery you can't see from the bridge (keeps Quest framerates up)
  if(IN.own && IN.own.group.visible){ const inside = here===IN.own; const hl = IN.own.group.worldToLocal(headWorld());
    for(const R of IN.own.rooms){ const near = inside ? Math.hypot(hl.x - R.c.x, hl.z - R.c.z) < 8 + 6*fxq() : R.r.sys==='piloting'; if(R.prop) R.prop.g.visible = near; if(R.label) R.label.s.visible = near; }
    for(const D of IN.own.doors){ const dd = Math.hypot(hl.x - D.pos.x, hl.z - D.pos.z); D.g.visible = inside ? dd < 12 : D.pos.z < 3*CS; D.lamp.visible = dd < 7; } }
  // deep inside the ship, the bridge behind you can be skipped
  const deep = here===IN.own && !IN.aboard && toBridge(headWorld()).z > 4.2 + CORR + 3;
  if(deep !== IN.deep){ IN.deep = deep; bridge.group.children.forEach(o => { if(o!==IN.own?.group && o!==bridge.chair && !o.userData.shell) o.visible = !deep; }); }
  if(holo) holo.group.visible = !IN.aboard && !deep; if(space3d?.bubble && deep) space3d.bubble.visible = false;
  updateBeamButtons(t);
  if(IN.beamT > 0){ IN.beamT -= dt; if(IN.beamT <= .5 && IN.beamTo){ const f = IN.beamTo; IN.beamTo = null; f(); } }
}
function placeFoeInterior(){ const I = IN.foe; if(!I) return; const a = anchor.pos || new THREE.Vector3(); I.group.position.set(a.x + 40, -60, a.z); I.group.rotation.set(0, 0, 0); I.group.updateMatrixWorld(true); }
/* captain teleport between ships: fade, move rig, restore console */
function beamCaptain(toFoe, instant){
  const go = () => {
    if(toFoe && IN.foe){ IN.saved = { rig:rig.position.clone(), rq:rig.quaternion.clone(), panel:panelGroup.position.clone(), pq:panelGroup.quaternion.clone() };
      const I = IN.foe; const tr = I.sh.rooms.findIndex(r => r.sys==='teleporter'); const r = I.sh.rooms[tr >= 0 ? tr : Math.floor(I.sh.rooms.length/2)];
      const target = I.group.localToWorld(roomCenterLocal(I, r).setY(0)); const h = headWorld(); rig.position.x += target.x - h.x; rig.position.z += target.z - h.z; rig.position.y += I.group.position.y; IN.aboard = true; bringConsole(); toast('You beamed aboard the enemy ship. Use the beacon or grip to command; the return pad takes you home.'); }
    else if(IN.saved){ rig.position.copy(IN.saved.rig); rig.quaternion.copy(IN.saved.rq); panelGroup.position.copy(IN.saved.panel); panelGroup.quaternion.copy(IN.saved.pq); IN.aboard = false; IN.saved = null; }
    else IN.aboard = false;
    sfx('tele');
  };
  if(instant){ go(); return; }
  IN.beamT = 1; IN.beamTo = go; nav.fade = .001; nav.fadeTo = null; sfx('tele'); if(typeof hapticFn==='function') hapticFn(.4, 300);
}
function updateBeamButtons(t){
  if(!IN.btn){ const mk = (text, col) => { const c = mkCanvas(384, 96), g = c.getContext('2d'); g.fillStyle = 'rgba(14,10,30,.92)'; if(g.roundRect){ g.beginPath(); g.roundRect(4,4,376,88,20); g.fill(); } g.lineWidth = 5; g.strokeStyle = col; g.stroke(); g.font = "700 34px 'Chakra Petch', sans-serif"; g.textAlign = 'center'; g.fillStyle = col; g.fillText(text, 192, 60);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .225), new THREE.MeshBasicMaterial({ map:texFrom(c), transparent:true, side:THREE.DoubleSide })); m.visible = false; return m; };
    IN.btn = { go:mk('BEAM ME OVER', '#b48cff'), back:mk('BEAM ME BACK', '#7be0a0') }; }
  const B = IN.btn;
  // "beam over" floats above your teleporter pad during a fight
  const own = IN.own, tpR = own ? own.rooms.find(R => R.r.sys==='teleporter') : null;
  const canGo = !!(own && own.group.visible && tpR && IN.foe && !IN.aboard && G.enemy && !G.enemy.dead);
  if(canGo){ if(B.go.parent!==own.group) own.group.add(B.go); B.go.position.set(tpR.c.x, 1.6 + .05*Math.sin(t*2), tpR.c.z); B.go.lookAt(own.group.worldToLocal(headWorld()).setY(1.6)); }
  B.go.visible = canGo;
  const foe = IN.foe; const canBack = !!(foe && IN.aboard);
  if(canBack){ if(B.back.parent!==foe.group) foe.group.add(B.back); const tr = foe.rooms.find(R => R.r.sys==='teleporter') || foe.rooms[Math.floor(foe.rooms.length/2)]; B.back.position.set(tr.c.x + .9, 1.5 + .05*Math.sin(t*2), tr.c.z); B.back.lookAt(foe.group.worldToLocal(headWorld()).setY(1.5)); }
  B.back.visible = canBack;
}
/* walking: is this world point somewhere you can stand inside a ship? */
function interiorWalk(I, L){
  if(!I) return false;
  if(I.corridor && Math.abs(L.x - I.corridor.x) < (L.z < I.corridor.z0 ? .4 : I.corridor.w/2 - .15) && L.z > I.corridor.z0 - 1.2 && L.z < I.corridor.z1 + .3) return true;
  const cx = I.gw - L.z/CS, cy = L.x/CS + I.gh/2; const x = Math.floor(cx), y = Math.floor(cy); const ri = I.sh.cellRoom[x+','+y]; if(ri==null) return false;
  const fx = cx - x, fy = cy - y, m = .2;
  const blocked = (nx, ny, lateral) => { const nri = I.sh.cellRoom[nx+','+ny]; if(nri===ri) return false;
    // hatch to the corridor
    if(nri==null && I.corridor && nx===x+1 && Math.abs(L.x - I.corridor.x) < .5) return false;
    const di = I.sh.doors.findIndex(d => (d.ca[0]===x && d.ca[1]===y && d.cb[0]===nx && d.cb[1]===ny) || (d.cb[0]===x && d.cb[1]===y && d.ca[0]===nx && d.ca[1]===ny));
    if(di >= 0 && I.sh.doors[di].b >= 0 && Math.abs(lateral - .5) < .3) return false; return true; };
  if(fx > 1-m && blocked(x+1, y, fy)) return false; if(fx < m && blocked(x-1, y, fy)) return false;
  if(fy > 1-m && blocked(x, y+1, fx)) return false; if(fy < m && blocked(x, y-1, fx)) return false;
  return true;
}
/* pointing: crew, doors, floors and beam buttons inside the ships */
function interiorPick(origin, dir){
  const list = [], add = (I) => { if(!I || !I.group.visible) return; list.push(I.floor); for(const D of I.doors) for(const L of D.leaves) list.push(L.pane); for(const [id, P] of I.crew) if(P.g.visible) P.g.traverse(o => { if(o.isMesh && o.geometry!==C3.geo?.ring && o.geometry!==C3.geo?.shadow) list.push(o); }); };
  add(IN.aboard ? IN.foe : IN.own); if(IN.btn){ if(IN.btn.go.visible) list.push(IN.btn.go); if(IN.btn.back.visible) list.push(IN.btn.back); }
  if(!list.length) return null;
  raycaster.set(origin, dir); const hit = raycaster.intersectObjects(list, false)[0]; if(!hit || hit.distance > 25) return null;
  const o = hit.object;
  if(o===IN.btn?.go) return { kind:'beam', go:true, hit };
  if(o===IN.btn?.back) return { kind:'beam', go:false, hit };
  const I = IN.aboard ? IN.foe : IN.own;
  for(const D of I.doors) if(D.leaves.some(L => L.pane===o)) return { kind:'door', D, hit };
  for(const [id, P] of I.crew){ let f = false; P.g.traverse(m => { if(m===o) f = true; }); if(f){ const c = P.c; const p = cellXY(I.sh, c.x, c.y); return { kind:'crew', x:p.x, y:p.y, c, hit }; } }
  if(o===I.floor){ const L = I.group.worldToLocal(hit.point.clone()); const c = localCell(I, L.x, L.z); const x = Math.round(c.x), y = Math.round(c.y); if(I.sh.cellRoom[x+','+y]==null) return null; const p = cellXY(I.sh, x, y); return { kind:'floor', x:p.x, y:p.y, point:hit.point, hit, I }; }
  return null;
}
function interiorAct(pk){
  if(!pk) return false;
  if(pk.kind==='beam'){ beamCaptain(pk.go); return true; }
  if(pk.kind==='door'){ const d = pk.D.d; if(pk.D.airlock || (IN.aboard)) { toast(IN.aboard ? 'You can only work doors on your own ship.' : 'Use the console to vent airlocks.'); return true; } d.open = !d.open; d.broken = 0; sfx('door'); return true; }
  if(pk.kind==='crew' || pk.kind==='floor'){ click(pk.x, pk.y); return true; }
  return false;
}
