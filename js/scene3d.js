'use strict';
/* =========================================================================
   3D world for VR: a lit starship bridge around the player, a holotable
   with extruded 3D models of both ships (crew, turrets, shields, alerts),
   and the live battle outside the canopy (enemy ship, shots, explosions).
   Built for Quest 2: no shadows, low poly, one environment map.
   ========================================================================= */
const HS = .0009;                 // holotable metres per canvas pixel
let holo = null, bridge = null, space3d = null, ENV = null;
const TEXC = new WeakMap();

function texFrom(canvas){ const t = new THREE.CanvasTexture(canvas); t.encoding = THREE.sRGBEncoding; return t; }
function cachedTex(canvas){ let t = TEXC.get(canvas); if(!t){ t = texFrom(canvas); TEXC.set(canvas, t); } return t; }
function glowTex(color){ const k = '3d' + color; if(GLOW[k]) return GLOW[k]; return GLOW[k] = texFrom(glowSprite(color, 64)); }
function glowSpriteMesh(color, scale){ const m = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(color), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false })); m.scale.setScalar(scale); return m; }
function holoXZ(x, y){ return [(x-800)*HS, (y-330)*HS]; }

/* ---------------- procedural textures ---------------- */
function plateTex(base='#3a4256', seed=5, n=4){
  const c = mkCanvas(512, 512), g = c.getContext('2d'), r = srng(seed);
  g.fillStyle = base; g.fillRect(0,0,512,512);
  const s = 512/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x = i*s, y = j*s, tone = (r()-.5)*.12;
    const gr = g.createLinearGradient(x, y, x+s, y+s); gr.addColorStop(0, `rgba(255,255,255,${.06+tone})`); gr.addColorStop(1, `rgba(0,0,0,${.12-tone})`);
    g.fillStyle = gr; g.fillRect(x+2, y+2, s-4, s-4);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, s, 2); g.fillRect(x, y, 2, s);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x+2, y+2, s-4, 1);
    g.fillStyle = 'rgba(0,0,0,.4)'; for(const [a,b] of [[8,8],[s-10,8],[8,s-10],[s-10,s-10]]){ g.beginPath(); g.arc(x+a, y+b, 2.2, 0, 7); g.fill(); }
    if(r()<.3){ g.fillStyle = 'rgba(0,0,0,.25)'; for(let k=0;k<5;k++) g.fillRect(x + s*.3 + k*8, y + s*.35, 4, s*.3); }
  }
  for(let i=0;i<300;i++){ g.fillStyle = `rgba(0,0,0,${r()*.12})`; g.fillRect(r()*512, r()*512, 1 + r()*30, 1); }
  const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function gratingTex(){
  const c = mkCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#20263a'; g.fillRect(0,0,256,256);
  for(let i=0;i<16;i++){ g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(i*16+3, 0, 6, 256); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(i*16+9, 0, 1, 256); }
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0,0,256,4); g.fillRect(0,128,256,4);
  const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function envCanvas(){
  const c = mkCanvas(512, 256), g = c.getContext('2d');
  const sky = g.createLinearGradient(0,0,0,256); sky.addColorStop(0,'#2a3a66'); sky.addColorStop(.5,'#0c1020'); sky.addColorStop(1,'#1a1420'); g.fillStyle = sky; g.fillRect(0,0,512,256);
  const sun = g.createRadialGradient(400, 70, 0, 400, 70, 70); sun.addColorStop(0,'#fff4d8'); sun.addColorStop(.25,'rgba(255,210,140,.8)'); sun.addColorStop(1,'rgba(255,210,140,0)'); g.fillStyle = sun; g.fillRect(0,0,512,256);
  const neb = g.createRadialGradient(120, 110, 0, 120, 110, 120); neb.addColorStop(0,'rgba(95,211,230,.55)'); neb.addColorStop(1,'rgba(95,211,230,0)'); g.fillStyle = neb; g.fillRect(0,0,512,256);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 118, 512, 3);
  return c;
}
function buildSky(){
  const c = mkCanvas(2048, 1024), g = c.getContext('2d'); const rnd = srng(12345);
  paintSpace(g, 2048, 1024, rnd, '#5fd3e6', { nebula:true });
  g.save(); g.globalCompositeOperation = 'lighter'; const band = g.createLinearGradient(0, 380, 0, 640); band.addColorStop(0,'rgba(180,170,255,0)'); band.addColorStop(.5,'rgba(180,170,255,.12)'); band.addColorStop(1,'rgba(180,170,255,0)'); g.fillStyle = band; g.fillRect(0, 380, 2048, 260);
  for(let i=0;i<2500;i++){ g.fillStyle = `rgba(230,235,255,${.2+rnd()*.6})`; g.fillRect(rnd()*2048, 400 + (rnd()+rnd()+rnd()-1.5)*160, 1, 1); } g.restore();
  return c;
}
function planetTex(base){ const c = mkCanvas(1024, 512), g = c.getContext('2d'); const rnd = srng(777);
  g.fillStyle = base; g.fillRect(0,0,1024,512);
  for(let i=0;i<70;i++){ const y = rnd()*512, h = 4 + rnd()*40; g.fillStyle = rnd()<.5 ? `rgba(255,255,255,${.04+rnd()*.1})` : `rgba(0,0,0,${.06+rnd()*.14})`; g.fillRect(0, y, 1024, h); }
  for(let i=0;i<40;i++){ g.fillStyle = `rgba(0,0,0,${.05+rnd()*.12})`; g.beginPath(); g.ellipse(rnd()*1024, rnd()*512, 20+rnd()*80, 8+rnd()*30, 0, 0, 7); g.fill(); }
  for(let i=0;i<25;i++){ g.fillStyle = `rgba(255,255,255,${.05+rnd()*.12})`; g.beginPath(); g.ellipse(rnd()*1024, rnd()*512, 30+rnd()*120, 3+rnd()*8, 0, 0, 7); g.fill(); }
  return texFrom(c); }

/* fresnel rim shader: shields, atmospheres, holo cones */
function fresnelMat(color, power=2.5, strength=1){
  return new THREE.ShaderMaterial({
    uniforms:{ color:{ value:new THREE.Color(color) }, op:{ value:strength }, power:{ value:power } },
    vertexShader:'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 color; uniform float op; uniform float power; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0-abs(dot(normalize(vN),normalize(vV))), power); gl_FragColor = vec4(color*(f*1.6+.04)*op, 1.0); }',
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function stdMat(o){ return new THREE.MeshStandardMaterial(Object.assign({ metalness:.6, roughness:.45, envMapIntensity:1 }, o)); }

/* ---------------- ship models ---------------- */
/* Built in canvas-pixel units around the ship centre; callers scale the group. */
function buildShipModel(sh, opts={}){
  const b = sh._b, a = sh._art; if(!b || !a) return null;
  const col = new THREE.Color(sh.color || C.amber);
  const mx = (b.x0 + b.x1)/2, my = (b.y0 + b.y1)/2, Hh = b.y1 - b.y0, L = b.x1 - b.x0, f = b.facing;
  const X = x => f>0 ? x : 2*mx - x;
  const ax = b.x0 + a.dx, ay = b.y0 + a.dy, aw = a.c.width, ah = a.c.height;
  const group = new THREE.Group(), mats = [];
  const depth = Math.max(26, Hh*.16), bev = 7;
  // hull: extruded outline, top textured with the ship art (rooms visible like a cutaway)
  const shape = new THREE.Shape(); hullPoints(b).forEach(([x,y],i) => i ? shape.lineTo(x - mx, -(y - my)) : shape.moveTo(x - mx, -(y - my)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:true, bevelThickness:bev, bevelSize:bev*.8, bevelSegments:2, curveSegments:4 });
  geo.rotateX(-Math.PI/2); geo.translate(0, -depth/2, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for(let i=0;i<pos.count;i++){ const x = pos.getX(i) + mx, z = pos.getZ(i) + my; uv.setXY(i, (x - ax)/aw, 1 - (z - ay)/ah); }
  geo.computeVertexNormals();
  const artTex = texFrom(a.c); artTex.anisotropy = 4;
  const hullMat = stdMat({ map:artTex, metalness:.45, roughness:.5, emissive:new THREE.Color(0xffffff), emissiveMap:artTex, emissiveIntensity:opts.glowArt ?? .35 });
  mats.push(hullMat); const hull = new THREE.Mesh(geo, hullMat); group.add(hull);
  const trimMat = stdMat({ color:col.clone().multiplyScalar(.6), metalness:.8, roughness:.3, emissive:col.clone(), emissiveIntensity:.35 }); mats.push(trimMat);
  const darkMat = stdMat({ color:0x2a3150, metalness:.85, roughness:.35 }); mats.push(darkMat);
  const greyMat = stdMat({ color:0x8a95b8, metalness:.9, roughness:.25 }); mats.push(greyMat);
  // dorsal spine & keel
  const keel = new THREE.Mesh(new THREE.BoxGeometry(L*.6, depth*.5, Hh*.22), darkMat); keel.position.set(X(b.x0 + L*.42) - mx, -(depth/2 + bev + depth*.15), 0); group.add(keel);
  const keelS = new THREE.Mesh(new THREE.BoxGeometry(L*.61, 2.5, Hh*.05), trimMat); keelS.position.set(keel.position.x, keel.position.y, Hh*.11); group.add(keelS);
  // nacelles with glowing engines
  const engines = [];
  for(const n of nacelles(b)){
    const xa = Math.min(n.x0, n.x1), xb = Math.max(n.x0, n.x1), len = xb - xa, r = n.h*.62;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r*.9, len, 18, 1), darkMat); cyl.rotation.z = Math.PI/2;
    const zc = (n.y + n.h/2) - my + (n.top ? -r*.25 : r*.25); cyl.position.set((xa+xb)/2 - mx, -depth*.1, zc); group.add(cyl);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r*1.04, r*1.04, len*.22, 18, 1, true), trimMat); band.rotation.z = Math.PI/2; band.position.copy(cyl.position); band.position.x += f*len*.12; group.add(band);
    const capX = f>0 ? xb : xa; const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI*2, 0, Math.PI/2), greyMat);
    cap.rotation.z = -f*Math.PI/2; cap.position.set(capX - mx, cyl.position.y, zc); group.add(cap);
    const backX = f>0 ? xa : xb;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(r*.85, r*1.15, r*.9, 18, 1, true), greyMat); nozzle.rotation.z = Math.PI/2; nozzle.position.set(backX - mx - f*r*.4, cyl.position.y, zc); group.add(nozzle);
    const eMat = new THREE.MeshBasicMaterial({ color:0xffd8a0 }); mats.push(eMat);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r*.8, 18), eMat); disc.rotation.y = -f*Math.PI/2; disc.position.set(backX - mx - f*r*.82, cyl.position.y, zc); group.add(disc);
    const gl = glowSpriteMesh(opts.hostile ? '#ff5a7a' : '#ffb547', r*7); gl.position.copy(disc.position); gl.position.x -= f*r*.6; group.add(gl);
    const plume = glowSpriteMesh('#ffffff', r*3); plume.position.copy(gl.position); group.add(plume);
    engines.push({ gl, plume, base:r*7, disc });
  }
  // wings
  for(const top of [true,false]){
    const y = top ? b.y0 : b.y1, d = top ? -1 : 1, fh = Math.max(16, Hh*.16);
    const s = new THREE.Shape(); const P = [[X(b.x0+L*.46), y],[X(b.x0+L*.58), y + d*fh],[X(b.x0+L*.7), y + d*fh],[X(b.x0+L*.68), y]];
    P.forEach(([x,yy],i) => i ? s.lineTo(x - mx, -(yy - my)) : s.moveTo(x - mx, -(yy - my)));
    const wg = new THREE.ExtrudeGeometry(s, { depth:5, bevelEnabled:true, bevelThickness:1.5, bevelSize:1.5, bevelSegments:1 }); wg.rotateX(-Math.PI/2); wg.translate(0, -2.5, 0);
    const w = new THREE.Mesh(wg, darkMat); group.add(w);
    const tipL = glowSpriteMesh(top ? '#ff5a7a' : '#7be0a0', 14); tipL.position.set(X(b.x0+L*.64) - mx, 0, y + d*fh - my); group.add(tipL);
  }
  // tail fin
  { const s = new THREE.Shape(); const h = depth*1.5; s.moveTo(0,0); s.lineTo(L*.16, 0); s.lineTo(L*.05, h); s.lineTo(-L*.02, h); s.closePath();
    const fg = new THREE.ExtrudeGeometry(s, { depth:4, bevelEnabled:true, bevelThickness:1, bevelSize:1, bevelSegments:1 }); fg.translate(0, 0, -2);
    const fin = new THREE.Mesh(fg, darkMat); if(f<0) fin.scale.x = -1; fin.position.set(X(b.x0 + L*.08) - mx, depth/2 + bev*.6, 0); group.add(fin);
    const bl = glowSpriteMesh('#ff5a7a', 12); bl.position.set(X(b.x0 + L*.1) - mx, depth/2 + bev + h, 0); group.add(bl); }
  // cockpit canopy
  const glassMat = stdMat({ color:0x5fb8d0, metalness:.95, roughness:.06, emissive:new THREE.Color(0x0e4a60), emissiveIntensity:.8, transparent:true, opacity:.92 }); mats.push(glassMat);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI*2, 0, Math.PI/2), glassMat);
  canopy.scale.set(Math.max(18, b.nose*.55), depth*.55, Hh*.12); canopy.position.set(X(b.x1 + b.nose*.05) - mx, depth/2 + bev*.5, 0); group.add(canopy);
  // turrets
  const turrets = [];
  for(let i=0;i<Math.min(4, sh.weapons.length);i++){
    const top = i%2===0, xx = X(b.x0 + L*(.55 + .1*Math.floor(i/2))), zz = (top ? b.y0 + Hh*.1 : b.y1 - Hh*.1) - my;
    const t = new THREE.Group(); t.position.set(xx - mx, depth/2 + bev, zz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 6, 14), darkMat); base.position.y = 3; t.add(base);
    const head = new THREE.Mesh(new THREE.SphereGeometry(7.5, 14, 8, 0, Math.PI*2, 0, Math.PI/2), greyMat); head.position.y = 6; t.add(head);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 22, 8), greyMat); barrel.rotation.z = -f*Math.PI/2; barrel.position.set(f*11, 9, 0); t.add(barrel);
    const tip = glowSpriteMesh('#ffd27a', 10); tip.position.set(f*23, 9, 0); tip.material.opacity = 0; t.add(tip);
    group.add(t); turrets.push({ t, tip, flash:0 });
  }
  // room alert overlays (fire, damage, breaches, low air)
  const rooms = [];
  const topY = depth/2 + bev + .6;
  if(opts.rooms !== false) sh._rects.forEach(q => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(q.w*.94, q.h*.94), new THREE.MeshBasicMaterial({ color:0xff5a7a, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI/2; m.position.set(q.x + q.w/2 - mx, topY, q.y + q.h/2 - my); m.visible = false; group.add(m); rooms.push(m);
  });
  // shield: fresnel ellipsoid
  const e = sh._shieldE || { cx:mx, cy:my, rx:(b.x1-b.x0)/2 + 60, ry:Hh/2 + 40 };
  const shMat = fresnelMat(0x5fd3e6, 2.2, .7);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18), shMat); shield.scale.set(e.rx, Math.max(e.ry*.55, depth*2.2), e.ry); shield.position.set(e.cx - mx, 0, e.cy - my); group.add(shield);
  return { group, hull, hullMat, mats, engines, turrets, rooms, shield, shMat, topY, mx, my, depth, cell:b.cell, key:sh.id + ':' + sh._artKey, sh };
}
function disposeModel(M){ if(!M) return; M.group.parent?.remove(M.group); M.group.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material && !o.isSprite){ o.material.dispose(); } }); M.hullMat.map?.dispose(); }

function updateShipModel(M, sh, t){
  if(!M) return;
  const col = new THREE.Color();
  sh.rooms.forEach((r,i) => { const m = M.rooms[i]; if(!m) return; const s = r.sys ? sh.systems[r.sys] : null; let op = 0;
    if(r.fire>0){ col.set(Math.sin(t*10 + i)>0 ? 0xff8a3d : 0xffb547); op = .75; }
    else if(r.breach>0){ col.set(0x9fe8ff); op = .5 + .3*Math.sin(t*8); }
    else if(s && s.dmg>0){ col.set(0xff3050); op = .4 + .25*Math.sin(t*6); }
    else if(s && s.ionT>0){ col.set(0x5fd3e6); op = .5; }
    else if(r.o2<40){ col.set(0xff3050); op = .25; }
    m.material.color.copy(col); m.material.opacity = op; m.visible = op>0; });
  const up = sh.shield>0 || sh.super>0;
  M.shield.visible = up || M.shHit>0;
  M.shMat.uniforms.color.value.set(sh.super>0 ? 0x7be0a0 : 0x5fd3e6);
  M.shMat.uniforms.op.value = (.35 + .18*sh.shield + .08*Math.sin(t*2)) + (M.shHit>0 ? M.shHit*3 : 0);
  const eng = sh.systems.engines ? eff(sh,'engines')/Math.max(1, sh.systems.engines.max) : .2, warp = typeof warpAmt==='function' ? warpAmt() : 0;
  for(const e_ of M.engines){ const fl = .85 + Math.random()*.2; const s_ = e_.base*(.5 + eng*.7 + warp*1.5)*fl; e_.gl.scale.setScalar(s_); e_.plume.scale.setScalar(s_*.45); }
  for(const tr of M.turrets){ tr.flash = Math.max(0, tr.flash - .06); tr.tip.material.opacity = tr.flash; }
  const cloaked = !!(sh.cloak && sh.cloak.t>0);
  if(M.cloaked!==cloaked){ M.cloaked = cloaked; for(const m of M.mats){ if(m.userData.op==null){ m.userData.op = m.opacity; m.userData.tr = m.transparent; } m.transparent = cloaked || m.userData.tr; m.opacity = cloaked ? .25 : m.userData.op; m.needsUpdate = true; } }
  if(M.hitT>0){ M.hitT = Math.max(0, M.hitT - .03); M.hullMat.emissive.setRGB(1 + M.hitT*3, 1 - M.hitT*.7, 1 - M.hitT*.7); } else M.hullMat.emissive.setRGB(1,1,1);
  if(M.shHit>0) M.shHit = Math.max(0, M.shHit - .025);
}

/* crew figures standing on the holotable (camera-facing sprites) */
function crewSprite3D(pool, i, parent){
  if(!pool[i]){ const m = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthWrite:false })); m.center.set(.5, .05); parent.add(m); pool[i] = m; }
  const m = pool[i]; m.visible = true; if(m.parent!==parent) parent.add(m); return m;
}
function glowPool(pool, i, parent, color, size){
  if(!pool[i]){ const m = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex('#ffffff'), color:new THREE.Color(color), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false })); pool[i] = m; }
  const m = pool[i]; if(m.parent!==parent) parent.add(m); m.visible = true; m.material.color.set(color); m.scale.setScalar(size); return m;
}

/* ---------------- holotable ---------------- */
function initHolo(){
  const g = new THREE.Group();
  const top = new THREE.Group(); g.add(top);
  // pedestal: unit-height column, rescaled to reach the floor
  const ped = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, 1, 32, 1), stdMat({ color:0x2a3150, metalness:.85, roughness:.3 })); col.position.y = -.5; ped.add(col);
  const ribM = stdMat({ color:0x111522, metalness:.9, roughness:.4 });
  for(let i=0;i<8;i++){ const r_ = new THREE.Mesh(new THREE.BoxGeometry(.02, 1, .05), ribM); const a = i/8*Math.PI*2; r_.position.set(Math.cos(a)*.2, -.5, Math.sin(a)*.2); r_.rotation.y = -a; ped.add(r_); }
  const lightRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .008, 8, 64), new THREE.MeshBasicMaterial({ color:0xffb547 })); lightRing.rotation.x = Math.PI/2; lightRing.position.y = -.12; ped.add(lightRing);
  g.add(ped);
  // table top: bevelled ellipse disc with a glass projection surface
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.82, .78, .05, 72, 1), stdMat({ color:0x1d2338, metalness:.9, roughness:.25 })); disc.scale.set(1, 1, .46); disc.position.y = -.03; top.add(disc);
  const rimM = new THREE.MeshBasicMaterial({ color:0xffb547 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.8, .007, 6, 120), rimM); rim.rotation.x = Math.PI/2; rim.scale.set(1, .46, 1); rim.position.y = .0; top.add(rim);
  const grid = mkCanvas(512,512), gg = grid.getContext('2d'); gg.fillStyle = 'rgba(10,20,40,.9)'; gg.fillRect(0,0,512,512);
  gg.strokeStyle = 'rgba(95,211,230,.28)'; gg.lineWidth = 1; for(let i=0;i<=512;i+=16){ gg.beginPath(); gg.moveTo(i,0); gg.lineTo(i,512); gg.moveTo(0,i); gg.lineTo(512,i); gg.stroke(); }
  gg.strokeStyle = 'rgba(95,211,230,.55)'; for(let i=0;i<=512;i+=128){ gg.beginPath(); gg.moveTo(i,0); gg.lineTo(i,512); gg.moveTo(0,i); gg.lineTo(512,i); gg.stroke(); }
  const gt = texFrom(grid); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(4, 1.8);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(.79, 72), new THREE.MeshBasicMaterial({ map:gt, transparent:true, opacity:.85 })); glass.rotation.x = -Math.PI/2; glass.scale.set(1, .46, 1); glass.position.y = .002; top.add(glass);
  // projection haze
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.78, .7, .22, 48, 1, true), fresnelMat(0x5fd3e6, 1.5, .25)); cone.scale.set(1, 1, .46); cone.position.y = .11; top.add(cone);
  holo = { group:g, top, ped, cone, ships:{}, crewPool:[], projPool:[], unitPool:[], lightRing };
  scene.add(g);
}
function holoShip(sh, side){
  let M = holo.ships[side];
  const key = sh && sh._art && sh._b ? sh.id + ':' + sh._artKey : '';
  if(!M || M.key!==key){
    disposeModel(M); M = null; holo.ships[side] = null;
    if(!key) return null;
    M = buildShipModel(sh, { hostile: side==='e' }); if(!M) return null;
    M.group.scale.setScalar(HS); holo.top.add(M.group); holo.ships[side] = M;
  }
  const [x, z] = holoXZ(M.mx, M.my); M.group.position.set(x, (M.depth/2 + 9)*HS + .01, z);
  M.group.visible = !sh.dead || (G.dieT>0 && Math.sin(G.time*30)>0);
  updateShipModel(M, sh, G.time);
  M.group.position.y += Math.sin(G.time*1.3 + (side==='e'?1:0))*.004;
  return M;
}
function updateHolo(){
  if(!holo) return;
  const show = SET.holotable && UI.screen==='game' && !!G;
  holo.top.visible = show; holo.lightRing.material.color.set(show ? 0xffb547 : 0x5fd3e6);
  if(!show) return;
  const Mp = holoShip(G.ship, 'p');
  const Me = G.enemy ? holoShip(G.enemy, 'e') : null;
  if(!G.enemy && holo.ships.e){ disposeModel(holo.ships.e); holo.ships.e = null; }
  // crew as tiny holographic figures
  let ci = 0;
  for(const [s, M] of [[G.ship, Mp], [G.enemy, Me]]) if(s && M) for(const c of s.crew){
    if(c._sx==null) continue;
    const m = crewSprite3D(holo.crewPool, ci++, M.group);
    const pose = crewPose(c, s); const cvs = spriteFor(c, pose, c.owner==='e');
    const tx = cachedTex(cvs); if(m.material.map!==tx){ m.material.map = tx; m.material.needsUpdate = true; }
    const h = M.cell*.95; m.scale.set(h*SPR_W/SPR_H*(c._face<0 ? -1 : 1), h, 1);
    m.position.set(c._sx - M.mx, M.topY + 1, c._sy + M.cell*.3 - M.my);
  }
  for(let i=ci;i<holo.crewPool.length;i++) holo.crewPool[i].visible = false;
  // projectiles arc over the table
  let pi = 0;
  for(const p of G.proj){ if(p._x==null || p.t<0) continue; const [x,z] = holoXZ(p._x, p._y);
    const m = glowPool(holo.projPool, pi++, holo.top, p.d?.type==='ion' ? '#5fd3e6' : p.from==='p' ? '#ffb547' : '#ff5a7a', .045);
    m.position.set(x, .1 + Math.sin(clamp(p.t/p.dur,0,1)*Math.PI)*.1, z); }
  for(let i=pi;i<holo.projPool.length;i++) holo.projPool[i].visible = false;
  let ui_ = 0;
  for(const u of G.units){ if(u._x==null) continue; const [x,z] = holoXZ(u._x, u._y); const m = glowPool(holo.unitPool, ui_++, holo.top, u.side==='p' ? '#f0a6ff' : '#ff5a7a', .03); m.position.set(x, .12, z); }
  for(let i=ui_;i<holo.unitPool.length;i++) holo.unitPool[i].visible = false;
  holo.cone.material.uniforms.op.value = .2 + .05*Math.sin(G.time*3);
}

/* ---------------- bridge environment ---------------- */
function consoleScreen(w, h){ const c = mkCanvas(w, h); const t = texFrom(c); t.minFilter = THREE.LinearFilter; return { c, g:c.getContext('2d'), t }; }
function initBridge(){
  const g = new THREE.Group();
  const plate = plateTex('#353d52', 11, 4), grate = gratingTex();
  const metal = stdMat({ map:plate, metalness:.75, roughness:.42 });
  const dark = stdMat({ color:0x161b2b, metalness:.85, roughness:.35 });
  const frameM = stdMat({ color:0x2b3350, metalness:.9, roughness:.28 });
  const lights = [];
  const strip = (col, alert) => { const m = new THREE.MeshBasicMaterial({ color:col }); if(alert) lights.push(m); return m; };
  // floor: plated deck with a central grating walkway
  const floorT = plate.clone(); floorT.needsUpdate = true; floorT.repeat.set(5, 5);
  floorT.repeat.set(5, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 7.6), stdMat({ map:floorT, metalness:.7, roughness:.5 })); floor.rotation.x = -Math.PI/2; floor.position.z = .5; g.add(floor);
  const grT = grate.clone(); grT.needsUpdate = true; grT.repeat.set(2, 6);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 5), stdMat({ map:grT, metalness:.8, roughness:.5 })); walk.rotation.x = -Math.PI/2; walk.position.set(0, .004, .2); g.add(walk);
  for(const s of [-1,1]){ const ls = new THREE.Mesh(new THREE.BoxGeometry(.025, .012, 5), strip(0x5fd3e6, true)); ls.position.set(s*.56, .008, .2); g.add(ls); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.42, .46, 64), strip(0xffb547)); ring.rotation.x = -Math.PI/2; ring.position.y = .006; g.add(ring);
  // raised floor edge
  // low dashboard under the forward window
  const dash = new THREE.Mesh(new THREE.BoxGeometry(6.6, .85, .5), metal); dash.position.set(0, .42, -3.05); g.add(dash);
  const dashTop = new THREE.Mesh(new THREE.BoxGeometry(6.6, .06, .7), frameM); dashTop.position.set(0, .87, -2.98); g.add(dashTop);
  const dashL = new THREE.Mesh(new THREE.BoxGeometry(6.4, .03, .02), strip(0x5fd3e6, true)); dashL.position.set(0, .8, -2.79); g.add(dashL);
  // canopy ribs arching overhead (open to space between them)
  const R = 3.3;
  for(const z of [-2.7, -1.5, -.3, .9]){
    const rib = new THREE.Mesh(new THREE.TorusGeometry(R, .055, 8, 64, Math.PI), frameM); rib.position.z = z; g.add(rib);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R - .07, .012, 6, 64, Math.PI), strip(0x5fd3e6, true)); inner.position.z = z; g.add(inner);
  }
  // longitudinal spars
  for(const a of [.35, .8, Math.PI/2, Math.PI - .8, Math.PI - .35]){ const sp = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 3.6, 8), frameM); sp.rotation.x = Math.PI/2; sp.position.set(Math.cos(a)*R, Math.sin(a)*R, -.9); g.add(sp); }
  // rear bulkhead (behind the player) with a door and light panels
  const wallT = plate.clone(); wallT.needsUpdate = true; wallT.repeat.set(8, 2);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 3.2, 48, 1, true, -Math.PI/2, Math.PI), stdMat({ map:wallT, metalness:.7, roughness:.45, side:THREE.BackSide })); wall.position.set(0, 1.6, .9); g.add(wall);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, .05), dark); door.position.set(0, 1.05, .9 + R - .05); g.add(door);
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(.04, 2.1, .06), strip(0xffb547)); doorL.position.set(0, 1.05, .9 + R - .07); g.add(doorL);
  const ceilT = plate.clone(); ceilT.needsUpdate = true; ceilT.repeat.set(4, 4);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 48, 0, Math.PI), stdMat({ map:ceilT, metalness:.7, roughness:.5, side:THREE.DoubleSide })); ceil.rotation.x = Math.PI/2; ceil.position.set(0, 3.2, .9); g.add(ceil);
  const ceilRim = new THREE.Mesh(new THREE.BoxGeometry(2*R, .12, .14), frameM); ceilRim.position.set(0, 3.17, .9); g.add(ceilRim);
  const ceilL = new THREE.Mesh(new THREE.BoxGeometry(2*R - .2, .025, .03), strip(0x5fd3e6, true)); ceilL.position.set(0, 3.1, .82); g.add(ceilL);
  for(const sx of [-1,1]){ const jamb = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.3, .14), frameM); jamb.position.set(sx*.62, 1.15, .9 + R - .07); g.add(jamb); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.36, .14, .14), frameM); lintel.position.set(0, 2.25, .9 + R - .07); g.add(lintel);
  for(const sx of [-1,1]){ const pipe = new THREE.Mesh(new THREE.TorusGeometry(R - .12, .045, 8, 40, Math.PI*.32), frameM); pipe.rotation.x = Math.PI/2; pipe.rotation.z = sx>0 ? -Math.PI*.04 : Math.PI*.72; pipe.position.set(0, .35, .9); g.add(pipe); }
  for(const s of [-1,1]) for(let k=0;k<3;k++){ const lp = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .04), strip(0x5fd3e6, true)); const a = s*(.55 + k*.32); lp.position.set(Math.sin(a)*(R-.06), 2.3, .9 + Math.cos(a)*(R-.06)); lp.rotation.y = a; g.add(lp); }
  // side consoles with live screens
  const screens = [];
  for(const s of [-1, 1]){
    const cg = new THREE.Group(); cg.position.set(s*1.35, 0, -.45); cg.rotation.y = -s*1.0;
    const base = new THREE.Mesh(new THREE.BoxGeometry(.9, .72, .5), metal); base.position.y = .36; cg.add(base);
    const kick = new THREE.Mesh(new THREE.BoxGeometry(.92, .06, .52), dark); kick.position.y = .03; cg.add(kick);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(.96, .05, .62), frameM); desk.position.set(0, .76, -.04); desk.rotation.x = .32; cg.add(desk);
    const sc = consoleScreen(512, 288); const scr = new THREE.Mesh(new THREE.PlaneGeometry(.72, .405), new THREE.MeshBasicMaterial({ map:sc.t }));
    scr.position.set(0, .79, -.07); scr.rotation.x = -Math.PI/2 + .32; cg.add(scr);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(.96, .5, .04), dark); hood.position.set(0, 1.08, -.36); hood.rotation.x = -.15; cg.add(hood);
    const sc2 = consoleScreen(512, 256); const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(.88, .44), new THREE.MeshBasicMaterial({ map:sc2.t })); scr2.position.set(0, 1.08, -.335); scr2.rotation.x = -.15; cg.add(scr2);
    for(let k=0;k<6;k++){ const bt = new THREE.Mesh(new THREE.BoxGeometry(.05, .015, .035), strip([0xffb547,0x5fd3e6,0x7be0a0,0xff5a7a][k%4])); bt.position.set(-.3 + k*.12, .755, .21); bt.rotation.x = .32; cg.add(bt); }
    g.add(cg); screens.push({ side:s, low:sc, high:sc2 });
  }
  // captain's chair behind the player position
  const chair = new THREE.Group(); chair.position.set(0, 0, .55);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.55, .1, .5), stdMat({ color:0x3a2a26, metalness:.2, roughness:.7 })); seat.position.y = .48; chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(.55, .75, .09), stdMat({ color:0x3a2a26, metalness:.2, roughness:.7 })); back.position.set(0, .88, .23); back.rotation.x = -.12; chair.add(back);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .14, .45, 16), frameM); post.position.y = .22; chair.add(post);
  for(const s of [-1,1]){ const arm = new THREE.Mesh(new THREE.BoxGeometry(.07, .06, .45), frameM); arm.position.set(s*.31, .66, 0); chair.add(arm); const al = new THREE.Mesh(new THREE.BoxGeometry(.071, .012, .3), strip(0xffb547)); al.position.set(s*.31, .695, -.04); chair.add(al); }
  g.add(chair); chair.visible = false;   // shown only when the player is seated far enough back
  // alert light
  const pl = new THREE.PointLight(0x7fb0ff, .8, 6, 2); pl.position.set(0, 2.6, -.4); g.add(pl);
  bridge = { group:g, lights, screens, pl, chair, alert:0, scrT:0 };
  scene.add(g);
}
function drawConsoles(){
  if(!bridge || !G) return;
  const s = G.ship, e = G.enemy && !G.enemy.dead ? G.enemy : null;
  for(const S of bridge.screens){
    const { g } = S.low, W_ = 512, H_ = 288;
    g.fillStyle = '#071020'; g.fillRect(0,0,W_,H_); g.strokeStyle = 'rgba(95,211,230,.18)'; for(let y=0;y<H_;y+=4){ g.fillStyle = 'rgba(95,211,230,.03)'; g.fillRect(0,y,W_,1); }
    g.font = "700 30px 'Chakra Petch', sans-serif"; g.textBaseline = 'alphabetic';
    if(S.side<0){
      g.fillStyle = '#ffb547'; g.fillText('HULL', 24, 46); g.fillStyle = '#e8eef9'; g.fillText(`${s.hull}/${s.maxHull}`, 380, 46);
      const fr = s.hull/s.maxHull; g.fillStyle = '#1a2440'; g.fillRect(24, 60, 464, 24); g.fillStyle = fr>.5 ? '#7be0a0' : fr>.25 ? '#ffd166' : '#ff5a7a'; g.fillRect(24, 60, 464*fr, 24);
      g.fillStyle = '#5fd3e6'; g.fillText('SHIELDS', 24, 132); for(let i=0;i<4;i++){ g.beginPath(); g.arc(250 + i*56, 122, 20, 0, 7); g.fillStyle = i < s.shield ? '#5fd3e6' : '#1a2440'; g.fill(); }
      const o2 = typeof shipO2==='function' ? shipO2(s) : Math.round(s.rooms.reduce((a,r)=>a+(r.o2??100),0)/Math.max(1,s.rooms.length));
      g.fillStyle = o2<40 ? '#ff5a7a' : '#9fe8ff'; g.fillText(`O2 ${o2|0}%`, 24, 190); g.fillStyle = '#e8eef9'; g.fillText(`EVADE ${evasion(s)}%`, 260, 190);
      const fires = s.rooms.filter(r=>r.fire>0).length, br = s.rooms.filter(r=>r.breach>0).length;
      g.fillStyle = fires||br ? '#ff8a3d' : '#7be0a0'; g.font = "600 24px 'IBM Plex Mono', monospace"; g.fillText(fires||br ? `${fires} fire · ${br} breach` : 'All compartments nominal', 24, 250);
    } else {
      g.fillStyle = '#ffb547'; g.fillText(`SECTOR ${G.sector}`, 24, 46);
      g.font = "600 26px 'IBM Plex Mono', monospace"; g.fillStyle = '#e8eef9';
      g.fillText(`Scrap ${G.scrap}   Fuel ${G.fuel}`, 24, 96); g.fillText(`Missiles ${G.missiles}   Parts ${G.parts}`, 24, 136);
      if(e){ g.fillStyle = '#ff5a7a'; g.font = "700 26px 'Chakra Petch', sans-serif"; g.fillText(e.name.slice(0, 28).toUpperCase(), 24, 196);
        g.fillStyle = '#1a2440'; g.fillRect(24, 212, 464, 20); g.fillStyle = '#ff5a7a'; g.fillRect(24, 212, 464*e.hull/e.maxHull, 20);
        g.fillStyle = '#5fd3e6'; g.font = "600 22px 'IBM Plex Mono', monospace"; g.fillText(`Shields ${e.shield}   Evade ${evasion(e)}%`, 24, 266); }
      else { g.fillStyle = '#7be0a0'; g.font = "600 24px 'IBM Plex Mono', monospace"; g.fillText('No hostile contacts', 24, 210); }
    }
    S.low.t.needsUpdate = true;
    const h = S.high.g; h.fillStyle = '#050a16'; h.fillRect(0,0,512,256);
    if(S.side<0){ // crew roster
      h.font = "700 22px 'Chakra Petch', sans-serif"; h.fillStyle = '#5fd3e6'; h.fillText('CREW', 18, 32);
      const crew = s.crew.filter(c=>c.owner==='p' && !c.drone).concat((e?.crew||[]).filter(c=>c.owner==='p' && !c.drone)).slice(0, 8);
      crew.forEach((c,i) => { const x = 18 + (i%4)*124, y = 50 + Math.floor(i/4)*100; const img = spriteFor(c, 'idle', false);
        h.drawImage(img, x - 6, y - 8, 64, 88); h.fillStyle = '#e8eef9'; h.font = "600 15px 'IBM Plex Mono', monospace"; h.fillText(c.name.slice(0,7), x + 50, y + 30);
        h.fillStyle = '#1a2440'; h.fillRect(x + 50, y + 40, 60, 7); h.fillStyle = c.hp/c.maxHp>.5 ? '#7be0a0' : '#ff5a7a'; h.fillRect(x + 50, y + 40, 60*c.hp/c.maxHp, 7); });
    } else { // reactor / power bars
      h.font = "700 22px 'Chakra Petch', sans-serif"; h.fillStyle = '#ffb547'; h.fillText('POWER', 18, 32);
      const keys = Object.keys(s.systems).filter(k => !SUB.includes(k)).slice(0, 9);
      keys.forEach((k,i) => { const sy = s.systems[k], x = 24 + i*54; for(let j=0;j<sy.max;j++){ const y = 200 - j*20; h.fillStyle = j < sy.power ? (sy.dmg > j ? '#ff5a7a' : '#7be0a0') : j >= sy.max - sy.dmg ? '#ff5a7a33' : '#1a2440'; h.fillRect(x, y, 40, 15); }
        h.fillStyle = SYSC?.[k] || '#e8eef9'; h.font = "600 13px 'IBM Plex Mono', monospace"; h.fillText((SYSS[k]||k).slice(0,4), x, 236); });
    }
    S.high.t.needsUpdate = true;
  }
}
function updateBridge(dt){
  if(!bridge) return;
  const s = G?.ship; let target = 0;   // 0 calm, 1 combat, 2 danger
  if(s && UI.screen==='game'){ if(G.enemy && !G.enemy.dead) target = 1; if(s.hull < s.maxHull*.34 || s.rooms.some(r=>r.fire>0||r.breach>0)) target = 2; }
  bridge.alert = target;
  const t = performance.now()/1000;
  const col = target===2 ? (Math.sin(t*5)>0 ? 0xff3050 : 0x5a1020) : target===1 ? 0xffb547 : 0x5fd3e6;
  for(const m of bridge.lights) m.color.set(col);
  bridge.pl.color.set(target===2 ? 0xff5060 : target===1 ? 0xffd0a0 : 0x9fc0ff); bridge.pl.intensity = target===2 ? .9 + .5*Math.sin(t*5) : .8;
  if((bridge.scrT -= dt) <= 0){ bridge.scrT = .5; drawConsoles(); }
}

/* ---------------- the battle outside ---------------- */
function initSpace(){
  const g = new THREE.Group();
  const flash = new THREE.PointLight(0xffc080, 0, 120, 2); g.add(flash);
  space3d = { group:g, enemy:null, shots:[], boom:[], debris:[], flash, lastHull:null, lastShield:null, lastPHull:null, lastPShield:null, deadT:0, bubble:null };
  // the player's own shield bubble around the bridge
  const hc = mkCanvas(512, 256), hg = hc.getContext('2d'); hg.strokeStyle = 'rgba(255,255,255,.9)'; hg.lineWidth = 2;
  for(let y=0, row=0; y<280; y+=22, row++) for(let x=(row%2)*19; x<530; x+=38){ hg.beginPath(); for(let k=0;k<6;k++){ const a = k/6*Math.PI*2 + Math.PI/6; hg[k?'lineTo':'moveTo'](x + Math.cos(a)*12, y + Math.sin(a)*12); } hg.closePath(); hg.stroke(); }
  const ht = texFrom(hc); ht.wrapS = ht.wrapT = THREE.RepeatWrapping; ht.repeat.set(3, 2);
  const bub = new THREE.Mesh(new THREE.SphereGeometry(6, 40, 20), new THREE.MeshBasicMaterial({ map:ht, color:0x5fd3e6, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.BackSide })); g.add(bub); space3d.bubble = bub; bub.userData.hit = 0;
  scene.add(g);
}
function spaceFrame(){ // anchor basis: position, forward, right
  const p = anchor.pos || new THREE.Vector3(0, 1.6, 0), d = anchor.dir || new THREE.Vector3(0, 0, -1);
  const r = new THREE.Vector3(-d.z, 0, d.x); return { p, d, r };
}
function enemySpot(){ const { p, d, r } = spaceFrame(); return new THREE.Vector3().copy(p).addScaledVector(d, 30).addScaledVector(r, 30).add(new THREE.Vector3(0, 10, 0)); }
let _bx, _by, _bz, _bm;
function orientEnemy(M, p, r, t){
  const to = new THREE.Vector3().subVectors(p, M.group.position); to.y = 0; to.normalize();
  const perp = new THREE.Vector3(-to.z, 0, to.x); if(perp.dot(r) > 0) perp.negate();
  const nose = new THREE.Vector3().addScaledVector(to, .55).add(perp).normalize();
  nose.applyAxisAngle(new THREE.Vector3(0,1,0), Math.sin(t*.25)*.12);
  _bx.copy(nose).negate();                                   // model -X is the nose
  _by.set(0, 1, 0).addScaledVector(to, 1.1).normalize(); _by.addScaledVector(_bx, -_bx.dot(_by)).normalize();
  _bz.crossVectors(_bx, _by);
  _bm.makeBasis(_bx, _by, _bz); M.group.quaternion.setFromRotationMatrix(_bm); M.group.rotateX(Math.sin(t*.4)*.04);
}
function boomAt(pos, scale=1, color='#ffb547'){
  for(let i=0;i<14*scale;i++){ const m = glowSpriteMesh(i%3 ? color : '#ffffff', 1); m.position.copy(pos); const v = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(2, 9)*scale);
    space3d.group.add(m); space3d.boom.push({ m, v, life:rand(.5, 1.2), max:1.2, size:rand(1.5, 4)*scale }); }
  space3d.flash.position.copy(pos); space3d.flash.intensity = 4*scale;
}
function updateSpace(dt){
  if(!space3d) return;
  const inGame = UI.screen==='game' && G;
  const e = inGame ? G.enemy : null;
  // enemy model out in space
  const key = e && e._art && e._b ? e.id + ':' + e._artKey : '';
  if(!space3d.enemy || space3d.enemy.key!==key){
    if(space3d.enemy){ disposeModel(space3d.enemy); space3d.enemy = null; }
    if(key){ const M = buildShipModel(e, { hostile:true, rooms:false, glowArt:.7 }); if(M){ M.group.scale.setScalar(.042); space3d.group.add(M.group); space3d.enemy = M; space3d.lastHull = e.hull; space3d.lastShield = e.shield; space3d.deadT = 0; M.arrive = 1; } }
  }
  const M = space3d.enemy, t = G ? G.time : 0;
  if(M && e){
    const spot = enemySpot(); const { p, d, r } = spaceFrame();
    if(M.arrive>0){ M.arrive = Math.max(0, M.arrive - dt*.6); spot.addScaledVector(d, M.arrive*M.arrive*200); }
    M.group.position.copy(spot); M.group.position.y += Math.sin(t*.6)*.6;
    // face across toward the player's ship (its nose points along -X in canvas space)
    orientEnemy(M, p, r, t);
    if(e.hull < space3d.lastHull){ M.hitT = 1; const hp = M.group.localToWorld(new THREE.Vector3(rand(-150,150), 20, rand(-60,60))); boomAt(hp, .8); hapticFn?.(.4, 60); }
    if(e.shield < space3d.lastShield) M.shHit = 1;
    space3d.lastHull = e.hull; space3d.lastShield = e.shield;
    if(e.dead){ space3d.deadT += dt; if(space3d.deadT < 1.4 && Math.random() < .3){ boomAt(M.group.localToWorld(new THREE.Vector3(rand(-200,200), rand(-30,30), rand(-80,80))), 1.2, Math.random()<.5 ? '#ff8a3d' : '#ffd27a'); }
      if(space3d.deadT > 1.2 && M.group.visible){ boomAt(M.group.position, 3.5, '#ffd27a'); M.group.visible = false;
        for(let i=0;i<14;i++){ const chunk = new THREE.Mesh(new THREE.TetrahedronGeometry(rand(.4, 1.4)), M.mats[2]); chunk.position.copy(M.group.position); space3d.group.add(chunk);
          space3d.debris.push({ m:chunk, v:new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(3, 10)), w:new THREE.Vector3(rand(-3,3), rand(-3,3), rand(-3,3)), life:6 }); } } }
    else M.group.visible = true;
    updateShipModel(M, e, t);
  }
  // shots: player guns fire from beside the bridge to the enemy; enemy fire comes at the bridge
  const want = new Set();
  if(M && e && inGame) for(const pj of G.proj){
    if(pj.t<0 || pj.from==='h') continue; want.add(pj.id);
    let S = space3d.shots.find(s => s.id===pj.id);
    const { p, d, r } = spaceFrame();
    if(!S){ const mine = pj.from==='p', col = pj.d?.type==='ion' ? '#5fd3e6' : pj.d?.type==='beam' ? '#ff6a8a' : mine ? '#ffb547' : '#ff5a7a';
      const from = mine ? new THREE.Vector3().copy(p).addScaledVector(r, rand(-5,5)).addScaledVector(d, 4).add(new THREE.Vector3(0, -2.5, 0)) : M.group.localToWorld(new THREE.Vector3(-200, 10, rand(-40,40)));
      const to = mine ? M.group.localToWorld(new THREE.Vector3(rand(-120,120), 10, rand(-50,50))) : new THREE.Vector3().copy(p).addScaledVector(d, 5.5).addScaledVector(r, rand(-2.5,2.5)).add(new THREE.Vector3(0, rand(-1,1.5), 0));
      const head = glowSpriteMesh(col, pj.d?.type==='missile' || pj.d?.type==='bomb' ? 1.4 : 1.1); const core = glowSpriteMesh('#ffffff', .45);
      const trailGeo = new THREE.BufferGeometry().setFromPoints([from.clone(), from.clone()]); const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color:new THREE.Color(col), transparent:true, opacity:.8, blending:THREE.AdditiveBlending }));
      space3d.group.add(head, core, trail); S = { id:pj.id, from, to, head, core, trail, mine, beam:pj.d?.type==='beam' }; space3d.shots.push(S);
      if(mine){ const tr = holo?.ships?.p?.turrets?.[0]; if(tr) tr.flash = 1; }
    }
    const k = clamp(pj.t/pj.dur, 0, 1);
    const cur = new THREE.Vector3().lerpVectors(S.from, S.to, S.beam ? 1 : k); cur.y += Math.sin(k*Math.PI)*(S.mine ? 3 : 2);
    S.head.position.copy(cur); S.core.position.copy(cur);
    const tail = S.beam ? S.from : new THREE.Vector3().lerpVectors(S.from, S.to, Math.max(0, k - .08));
    const a = S.trail.geometry.attributes.position; a.setXYZ(0, tail.x, tail.y, tail.z); a.setXYZ(1, cur.x, cur.y, cur.z); a.needsUpdate = true;
  }
  for(let i=space3d.shots.length-1;i>=0;i--){ const S = space3d.shots[i]; if(want.has(S.id)) continue;
    if(!S.mine) boomAt(S.head.position, .35, '#9fe8ff');
    space3d.group.remove(S.head, S.core, S.trail); S.trail.geometry.dispose(); S.trail.material.dispose(); S.head.material.dispose(); S.core.material.dispose(); space3d.shots.splice(i, 1); }
  // own shield bubble ripples when it stops a shot; red flash when the hull is hit
  const s = inGame ? G.ship : null, bub = space3d.bubble;
  if(s){ if(space3d.lastPShield!=null && s.shield < space3d.lastPShield) bub.userData.hit = 1;
    if(space3d.lastPHull!=null && s.hull < space3d.lastPHull){ bub.userData.red = 1; }
    space3d.lastPShield = s.shield; space3d.lastPHull = s.hull; }
  bub.userData.hit = Math.max(0, (bub.userData.hit||0) - dt*1.5); bub.userData.red = Math.max(0, (bub.userData.red||0) - dt*1.2);
  const { p } = spaceFrame(); bub.position.copy(p);
  bub.material.opacity = Math.max(bub.userData.hit*.55, bub.userData.red*.45, 0);
  bub.material.color.set(bub.userData.red > bub.userData.hit ? 0xff3050 : (s?.super>0 ? 0x7be0a0 : 0x5fd3e6)); bub.visible = bub.material.opacity > .005;
  // particles
  for(let i=space3d.boom.length-1;i>=0;i--){ const B = space3d.boom[i]; B.life -= dt; if(B.life<=0){ space3d.group.remove(B.m); B.m.material.dispose(); space3d.boom.splice(i,1); continue; }
    B.m.position.addScaledVector(B.v, dt); B.v.multiplyScalar(.97); const k = B.life/B.max; B.m.scale.setScalar(B.size*(1.6 - k)); B.m.material.opacity = Math.min(1, k*1.5); }
  for(let i=space3d.debris.length-1;i>=0;i--){ const D = space3d.debris[i]; D.life -= dt; if(D.life<=0){ space3d.group.remove(D.m); D.m.geometry.dispose(); space3d.debris.splice(i,1); continue; }
    D.m.position.addScaledVector(D.v, dt); D.m.rotation.x += D.w.x*dt; D.m.rotation.y += D.w.y*dt; }
  space3d.flash.intensity *= .9;
}

/* ---------------- one-time world setup ---------------- */
function initWorld(){
  _bx = new THREE.Vector3(); _by = new THREE.Vector3(); _bz = new THREE.Vector3(); _bm = new THREE.Matrix4();
  // image-based lighting for all the metal
  try{ const pm = new THREE.PMREMGenerator(renderer); const et = texFrom(envCanvas()); et.mapping = THREE.EquirectangularReflectionMapping; ENV = pm.fromEquirectangular(et).texture; pm.dispose(); et.dispose(); scene.environment = ENV; }catch(e){ ENV = null; }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.MeshBasicMaterial({ map:texFrom(buildSky()), side:THREE.BackSide, depthWrite:false })); scene.add(sky);
  const N = 1500, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ const v = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(80,220)); pos.set([v.x,v.y,v.z], i*3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  starPts = new THREE.Points(sg, new THREE.PointsMaterial({ map:glowTex('#dfe6f5'), color:0xffffff, size:1.6, sizeAttenuation:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })); scene.add(starPts);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 64, 32), stdMat({ map:planetTex('#3b4f7a'), metalness:0, roughness:1, envMapIntensity:.2 })); planet.position.set(-70, 5, -150); planet.rotation.z = .3; scene.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(31.5, 48, 24), fresnelMat(0x8fc1ff, 3, 1)); atmo.position.copy(planet.position); scene.add(atmo);
  const ring = new THREE.Mesh(new THREE.RingGeometry(40, 52, 96), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.2, side:THREE.DoubleSide, depthWrite:false })); ring.position.copy(planet.position); ring.rotation.x = 1.25; scene.add(ring);
  const sunS = glowSpriteMesh('#ffd27a', 120); sunS.position.set(260, 160, 120); scene.add(sunS);
  scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x20141a, .55));
  const sun = new THREE.DirectionalLight(0xffe0b0, 1.6); sun.position.set(260, 160, 120); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5fd3e6, .35); fill.position.set(-100, 30, -60); scene.add(fill);
  scene.userData.space = [sky, starPts, planet, atmo, ring, sunS];
  scene.userData.planet = planet;
  initBridge(); initHolo(); initSpace();
}
function placeWorld(p, d){
  const yaw = Math.atan2(-d.x, -d.z);
  if(bridge){ bridge.group.position.set(p.x, 0, p.z); bridge.group.rotation.set(0, yaw, 0); }
  if(holo){
    const hy = Math.max(.55, p.y - .72);
    holo.group.position.set(p.x + d.x*.8, hy, p.z + d.z*.8); holo.group.rotation.set(0, yaw, 0);
    holo.ped.scale.set(1, hy, 1);
  }
}
function update3D(dt){ updateHolo(); updateBridge(dt); updateSpace(dt); }
function setMixedReality(ar){ if(bridge) bridge.group.visible = !ar; if(space3d) space3d.group.visible = !ar; }
