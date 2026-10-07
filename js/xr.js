'use strict';
/* =========================================================================
   WebXR: floating console, holotable with 3D ships, controllers, haptics,
   flat-screen sizing, mod and rename dialogs, and boot.
   ========================================================================= */
let renderer = null, scene, camera, panelGroup, panelMesh, tex, starPts, raycaster, controllers = [], xrMode = null, recenterIn = 0, panelDist = 1.8;
const anchor = { pos:null, dir:null };
const btnPrev = {};
let tmpM = null;
function inXR(){ return !!(renderer && renderer.xr.isPresenting); }

/* ---------------- holotable ---------------- */
function texFrom(canvas){ const t = new THREE.CanvasTexture(canvas); t.encoding = THREE.sRGBEncoding; return t; }
function glowTex(color){ const k = '3d' + color; if(GLOW[k]) return GLOW[k]; return GLOW[k] = texFrom(glowSprite(color, 64)); }
function glowSpriteMesh(color, scale){ const m = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(color), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false })); m.scale.setScalar(scale); return m; }
function buildSky(){
  const c = mkCanvas(2048, 1024), g = c.getContext('2d'); const rnd = srng(12345);
  paintSpace(g, 2048, 1024, rnd, '#5fd3e6', { nebula:true });
  g.save(); g.globalCompositeOperation = 'lighter'; const band = g.createLinearGradient(0, 380, 0, 640); band.addColorStop(0,'rgba(180,170,255,0)'); band.addColorStop(.5,'rgba(180,170,255,.12)'); band.addColorStop(1,'rgba(180,170,255,0)'); g.fillStyle = band; g.fillRect(0, 380, 2048, 260);
  for(let i=0;i<2500;i++){ g.fillStyle = `rgba(230,235,255,${.2+rnd()*.6})`; g.fillRect(rnd()*2048, 400 + (rnd()+rnd()+rnd()-1.5)*160, 1, 1); } g.restore();
  return c;
}
function planetTex(base){ const c = mkCanvas(1024, 512), g = c.getContext('2d'); const rnd = srng(777);
  g.fillStyle = base; g.fillRect(0,0,1024,512);
  for(let i=0;i<60;i++){ const y = rnd()*512, h = 4 + rnd()*40; g.fillStyle = rnd()<.5 ? `rgba(255,255,255,${.04+rnd()*.1})` : `rgba(0,0,0,${.06+rnd()*.14})`; g.fillRect(0, y, 1024, h); }
  for(let i=0;i<40;i++){ g.fillStyle = `rgba(0,0,0,${.05+rnd()*.12})`; g.beginPath(); g.ellipse(rnd()*1024, rnd()*512, 20+rnd()*80, 8+rnd()*30, 0, 0, 7); g.fill(); }
  return texFrom(c); }
const HS = .0009;
let holo = null;
function holoXZ(x, y){ return [(x-800)*HS, (y-330)*HS]; }
function initHolo(){
  const g = new THREE.Group();
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, .6, 32), new THREE.MeshLambertMaterial({ color:0x1a2240 })); ped.position.y = -.31; g.add(ped);
  const pr = new THREE.Mesh(new THREE.TorusGeometry(.2, .006, 8, 48), new THREE.MeshBasicMaterial({ color:0xffb547 })); pr.rotation.x = Math.PI/2; pr.position.y = -.05; g.add(pr);
  const top = new THREE.Mesh(new THREE.CircleGeometry(.8, 64), new THREE.MeshBasicMaterial({ color:0x0e1426, transparent:true, opacity:.88 }));
  top.rotation.x = -Math.PI/2; top.scale.set(1, .42, 1); g.add(top);
  const grid = mkCanvas(256,256), gg = grid.getContext('2d'); gg.strokeStyle = 'rgba(95,211,230,.35)'; gg.lineWidth = 1; for(let i=0;i<=256;i+=16){ gg.beginPath(); gg.moveTo(i,0); gg.lineTo(i,256); gg.moveTo(0,i); gg.lineTo(256,i); gg.stroke(); }
  const gt = texFrom(grid); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(8, 3.4);
  const gm = new THREE.Mesh(new THREE.CircleGeometry(.79, 64), new THREE.MeshBasicMaterial({ map:gt, transparent:true, opacity:.5, depthWrite:false })); gm.rotation.x = -Math.PI/2; gm.scale.set(1,.42,1); gm.position.y = .001; g.add(gm);
  const rim = new THREE.Mesh(new THREE.RingGeometry(.79, .805, 96), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.8, side:THREE.DoubleSide }));
  rim.rotation.x = -Math.PI/2; rim.scale.set(1, .42, 1); rim.position.y = .002; g.add(rim);
  const sphereGeo = new THREE.SphereGeometry(.009, 10, 8);
  holo = { group:g, ships:{}, crewPool:[], projPool:[], unitPool:[], sphereGeo };
  scene.add(g);
}

function poolGet(pool, i, color, size){
  if(!pool[i]){ const m = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex('#ffffff'), color:new THREE.Color(color), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false })); holo.group.add(m); pool[i] = m; }
  const m = pool[i]; m.visible = true; m.material.color.set(color); m.scale.setScalar(.035*(size||1)); return m;
}

function holoShip(sh, side){
  let H_ = holo.ships[side];
  const key = sh && sh._art ? sh.id + ':' + sh._artKey : '';
  if(!H_ || H_.key!==key){
    if(H_){ holo.group.remove(H_.group); H_.group.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map && o.material.map!==H_.keepMap) o.material.map.dispose(); o.material.dispose(); } }); }
    H_ = holo.ships[side] = { key, group:new THREE.Group(), rooms:[], shield:null };
    holo.group.add(H_.group);
    if(sh && sh._rects && sh._b && sh._art){
      const b = sh._b, a = sh._art; const ax = b.x0 + a.dx, ay = b.y0 + a.dy, aw = a.c.width, ah = a.c.height;
      const hull = new THREE.Mesh(new THREE.PlaneGeometry(aw*HS, ah*HS), new THREE.MeshBasicMaterial({ map:texFrom(a.c), transparent:true, depthWrite:false }));
      hull.rotation.x = -Math.PI/2; const [hx, hz] = holoXZ(ax + aw/2, ay + ah/2); hull.position.set(hx, .03, hz); H_.group.add(hull);
      sh._rects.forEach(q => { const m = new THREE.Mesh(new THREE.BoxGeometry(q.w*HS*.92, .012, q.h*HS*.92), new THREE.MeshBasicMaterial({ color:0x1a2442, transparent:true, opacity:.0, depthWrite:false }));
        const [x, z] = holoXZ(q.x+q.w/2, q.y+q.h/2); m.position.set(x, .04, z); H_.group.add(m); H_.rooms.push(m); });
      const e = sh._shieldE || { cx:(b.x0+b.x1)/2, cy:(b.y0+b.y1)/2, rx:(b.x1-b.x0)/2, ry:(b.y1-b.y0)/2 };
      const sm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color:0x5fd3e6, transparent:true, opacity:.15, depthWrite:false, blending:THREE.AdditiveBlending }));
      sm.scale.set(e.rx*HS, .07, e.ry*HS); const [sx, sz] = holoXZ(e.cx, e.cy); sm.position.set(sx, .045, sz); H_.group.add(sm); H_.shield = sm;
    }
  }
  if(!sh) return;
  const col = new THREE.Color();
  sh.rooms.forEach((r,i) => { const m = H_.rooms[i]; if(!m) return; const s = r.sys ? sh.systems[r.sys] : null; let op = 0;
    if(r.fire>0){ col.set(Math.sin(G.time*10)>0 ? 0xff8a3d : 0xffb547); op = .7; }
    else if(s && s.dmg>0){ col.set(0xff5a7a); op = .45 + .25*Math.sin(G.time*6); }
    else if(s && s.ionT>0){ col.set(0x5fd3e6); op = .5; }
    else if(r.o2<40){ col.set(0xff3050); op = .3; }
    m.material.color.copy(col); m.material.opacity = op; m.visible = op>0; });
  if(H_.shield){ H_.shield.visible = sh.shield>0 || sh.super>0; H_.shield.material.opacity = .05 + .05*sh.shield; H_.shield.material.color.set(sh.super>0 ? 0x7be0a0 : 0x5fd3e6); }
  H_.group.visible = !sh.dead || (G.dieT>0 && Math.sin(G.time*30)>0);
}

function updateHolo(){
  if(!holo) return;
  const show = SET.holotable && UI.screen==='game' && !!G;
  holo.group.visible = show; if(!show) return;
  holoShip(G.ship, 'p');
  if(G.enemy) holoShip(G.enemy, 'e'); else if(holo.ships.e){ holo.ships.e.group.visible = false; }
  let ci = 0;
  for(const s of [G.ship, G.enemy]) if(s) for(const c of s.crew){ if(c._sx==null) continue; const [x,z] = holoXZ(c._sx, c._sy);
    const m = poolGet(holo.crewPool, ci++, c.owner==='p' ? (DATA.races[c.race]?.color || '#ffffff') : '#ff5a7a', .8); m.position.set(x, .065, z); }
  for(let i=ci;i<holo.crewPool.length;i++) holo.crewPool[i].visible = false;
  let pi = 0;
  for(const p of G.proj){ if(p._x==null || p.t<0) continue; const [x,z] = holoXZ(p._x, p._y); const m = poolGet(holo.projPool, pi++, p.d?.type==='ion' ? '#5fd3e6' : p.from==='p' ? '#ffb547' : '#ff5a7a', 1.3);
    m.position.set(x, .09 + Math.sin(clamp(p.t/p.dur,0,1)*Math.PI)*.08, z); }
  for(let i=pi;i<holo.projPool.length;i++) holo.projPool[i].visible = false;
  let ui_ = 0;
  for(const u of G.units){ if(u._x==null) continue; const [x,z] = holoXZ(u._x, u._y); const m = poolGet(holo.unitPool, ui_++, u.side==='p' ? '#f0a6ff' : '#ff5a7a', 1); m.position.set(x, .1, z); }
  for(let i=ui_;i<holo.unitPool.length;i++) holo.unitPool[i].visible = false;
}

/* ---------------- 3D scene ---------------- */
function init3D(){
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070f);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .05, 900);
  tmpM = new THREE.Matrix4();
  tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.MeshBasicMaterial({ map:texFrom(buildSky()), side:THREE.BackSide, depthWrite:false })); scene.add(sky);
  panelGroup = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.56, 1.66, .05), new THREE.MeshLambertMaterial({ color:0x161d36 })); back.position.z = -.035;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 1.56), new THREE.MeshBasicMaterial({ color:0x26324f })); frame.position.z = -.005;
  panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map:tex }));
  const edgePts = [[-1.25,-.8],[1.25,-.8],[1.25,.8],[-1.25,.8],[-1.25,-.8]].map(([x,y]) => new THREE.Vector3(x, y, .002));
  const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePts), new THREE.LineBasicMaterial({ color:0xffb547, transparent:true, opacity:.7 }));
  const brackets = new THREE.Group(); for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const b = new THREE.Mesh(new THREE.BoxGeometry(.16, .025, .03), new THREE.MeshBasicMaterial({ color:0xffb547 })); b.position.set(sx*1.22, sy*.82, .01); const b2 = b.clone(); b2.scale.set(.18, 6.4, 1); b2.position.set(sx*1.29, sy*.76, .01); brackets.add(b, b2); }
  panelGroup.add(back, frame, panelMesh, edge, brackets); panelGroup.position.set(0, 1.4, -panelDist); scene.add(panelGroup);
  const N = 1500, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ const v = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(80,220)); pos.set([v.x,v.y,v.z], i*3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  starPts = new THREE.Points(sg, new THREE.PointsMaterial({ map:glowTex('#dfe6f5'), color:0xffffff, size:1.6, sizeAttenuation:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })); scene.add(starPts);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 64, 32), new THREE.MeshLambertMaterial({ map:planetTex('#3b4f7a') })); planet.position.set(-70, 5, -150); planet.rotation.z = .3; scene.add(planet);
  const atmo = glowSpriteMesh('#8fc1ff', 92); atmo.position.copy(planet.position); atmo.material.opacity = .45; scene.add(atmo);
  const ring = new THREE.Mesh(new THREE.RingGeometry(40, 52, 96), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.22, side:THREE.DoubleSide })); ring.position.copy(planet.position); ring.rotation.x = 1.25; scene.add(ring);
  const sunS = glowSpriteMesh('#ffd27a', 120); sunS.position.set(260, 160, 120); scene.add(sunS);
  scene.add(new THREE.AmbientLight(0x404a66, .5)); const sun = new THREE.DirectionalLight(0xffd9a0, 1.3); sun.position.set(260, 160, 120); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.RingGeometry(.35, 1.4, 64), new THREE.MeshBasicMaterial({ map:glowTex('#5fd3e6'), transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false })); floor.rotation.x = -Math.PI/2; floor.position.y = .005; scene.add(floor);
  scene.userData.space = [sky, starPts, planet, atmo, ring, sunS];
  scene.userData.planet = planet;
  initHolo();
  raycaster = new THREE.Raycaster();
  for(let i=0;i<2;i++){
    const c = renderer.xr.getController(i);
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]);
    const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color:0xffb547, transparent:true, opacity:.8 })); c.add(line);
    const tipS = glowSpriteMesh('#ffb547', .05); c.add(tipS);
    c.userData = { line, idx:i, hit:null, src:null };
    c.addEventListener('selectstart', () => { if(c.userData.hit){ click(c.userData.hit.x, c.userData.hit.y); pulse(c.userData.src, .25, 25); } });
    c.addEventListener('connected', e => { c.userData.src = e.data; });
    c.addEventListener('disconnected', () => { c.userData.src = null; PTR[1+i].on = false; });
    scene.add(c); controllers.push(c);
  }
  hapticFn = (v, ms) => { const s = renderer.xr.getSession(); if(!s) return; for(const src of s.inputSources) pulse(src, v, ms); };
  renderer.setAnimationLoop(loop);
  window.addEventListener('resize', () => { if(!inXR()){ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); } });
}

function pulse(src, v, ms){ try{ const a = src?.gamepad?.hapticActuators?.[0]; if(a && a.pulse) a.pulse(clamp(v,0,1), ms); }catch(e){} }
function xrPointers(){
  for(const c of controllers){
    const i = c.userData.idx;
    if(!c.userData.src){ c.userData.line.visible = false; PTR[1+i].on = false; continue; }
    c.userData.line.visible = true;
    tmpM.identity().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(tmpM);
    const hits = raycaster.intersectObject(panelMesh);
    if(hits.length && hits[0].uv){ const uv = hits[0].uv; const x = uv.x*W, y = (1-uv.y)*H; c.userData.hit = { x, y }; PTR[1+i].x = x; PTR[1+i].y = y; PTR[1+i].on = true; c.userData.line.scale.z = hits[0].distance; }
    else { c.userData.hit = null; PTR[1+i].on = false; c.userData.line.scale.z = 4; }
  }
}
function xrButtons(dt){
  const sess = renderer.xr.getSession(); if(!sess) return;
  for(const src of sess.inputSources){
    const gp = src.gamepad; if(!gp) continue; const key = src.handedness || 'none'; const prev = btnPrev[key] || [];
    const pressed = gp.buttons.map(b => b.pressed);
    const edge = n => pressed[n] && !prev[n];
    if(UI.screen==='game' && G){
      if(edge(4) && !G.modal) G.paused = !G.paused;
      if(edge(5)){ if(G.modal?.type==='map') G.modal = null; else if(!G.modal) openMap(); }
    }
    if(edge(1)) recenterIn = 1;
    if(gp.axes.length>=4 && Math.abs(gp.axes[3])>.3 && anchor.pos){ panelDist = clamp(panelDist + gp.axes[3]*dt*1.2, .9, 3.5); placePanel(); }
    btnPrev[key] = pressed;
  }
}
function recenter(){
  const p = new THREE.Vector3(), d = new THREE.Vector3();
  camera.getWorldPosition(p); camera.getWorldDirection(d); d.y = 0; if(d.lengthSq()<1e-4) d.set(0,0,-1); d.normalize();
  anchor.pos = p; anchor.dir = d; placePanel();
}
function placePanel(){
  const p = anchor.pos, d = anchor.dir;
  panelGroup.position.set(p.x + d.x*panelDist, Math.max(.9, p.y - .1), p.z + d.z*panelDist); panelGroup.lookAt(p.x, panelGroup.position.y, p.z);
  if(holo){ holo.group.position.set(p.x + d.x*.8, Math.max(.4, p.y - .72), p.z + d.z*.8); holo.group.lookAt(p.x, holo.group.position.y, p.z); }
}
async function enterXR(mode){
  if(inXR()) return;
  try{
    ensureAudio();
    const sess = await navigator.xr.requestSession(mode, { optionalFeatures:['local-floor','hand-tracking'] });
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(sess);
    xrMode = mode; const ar = mode==='immersive-ar';
    scene.background = ar ? null : new THREE.Color(0x070a14); scene.userData.space.forEach(o => o.visible = !ar);
    recenterIn = 3;
    sess.addEventListener('end', () => { xrMode = null; PTR[1].on = PTR[2].on = false; scene.background = new THREE.Color(0x070a14); scene.userData.space.forEach(o => o.visible = true); });
  }catch(err){ document.getElementById('xrNote').textContent = 'Could not start VR: ' + (err.message || err); }
}
let last = performance.now(), fc = 0;
function loop(){
  const now = performance.now(), dt = Math.min(.05, (now-last)/1000); last = now;
  const xr = inXR();
  if(xr){ xrPointers(); xrButtons(dt); }
  update(dt); draw();
  if(xr){
    if(recenterIn>0){ recenterIn--; if(recenterIn===0) recenter(); }
    if((++fc & 1)===0) tex.needsUpdate = true;
    updateHolo();
    const warp = warpAmt();
    starPts.rotation.y += dt*(.004 + warp*.8); starPts.scale.z = 1 + warp*6; if(scene.userData.planet) scene.userData.planet.rotation.y += dt*.01;
    renderer.render(scene, camera);
  }
}
function fallbackLoop(){ const now = performance.now(), dt = Math.min(.05,(now-last)/1000); last = now; update(dt); draw(); requestAnimationFrame(fallbackLoop); }

/* ---------------- flat-screen sizing ---------------- */
const barEl = document.getElementById('bar');
function fit(){ const availW = window.innerWidth - 32, availH = window.innerHeight - barEl.offsetHeight - 28;
  const w = Math.max(200, Math.min(availW, availH*1.6)); cv.style.width = w + 'px'; cv.style.height = (w/1.6) + 'px'; }
window.addEventListener('resize', fit);

/* ---------------- mod panel ---------------- */
const modPanel = document.getElementById('modPanel'), modMsg = document.getElementById('modMsg');
function openModPanel(){ renderModList(); modMsg.textContent = ''; modPanel.hidden = false; document.getElementById('modClose').focus(); }
function closeModPanel(){ modPanel.hidden = true; }
function setMsg(t, ok){ modMsg.textContent = t; modMsg.className = ok ? 'ok' : 'err'; }
function renderModList(){
  const ul = document.getElementById('modList'); if(!ul) return; ul.innerHTML = '';
  if(!MODS.length){ const li = document.createElement('li'); li.textContent = 'No mods added yet.'; ul.appendChild(li); return; }
  MODS.forEach((m) => {
    const li = document.createElement('li'); const meta = document.createElement('div'); meta.className = 'meta';
    const b = document.createElement('b'); b.textContent = m.name; const sm = document.createElement('small');
    sm.textContent = `${m.version ? 'v'+m.version+' · ' : ''}${m.author ? m.author+' · ' : ''}${modSummary(m.data)}`; meta.append(b, sm);
    const tg = document.createElement('button'); tg.textContent = m.enabled ? 'On' : 'Off'; if(!m.enabled) tg.className = 'ghost';
    tg.onclick = () => { m.enabled = !m.enabled; saveMods(); renderModList(); };
    const rm = document.createElement('button'); rm.textContent = 'Remove'; rm.className = 'ghost';
    rm.onclick = () => { MODS.splice(MODS.indexOf(m),1); saveMods(); renderModList(); setMsg(`Removed ${m.name}.`, true); };
    const row = document.createElement('div'); row.className = 'row'; row.append(tg, rm); li.append(meta, row); ul.appendChild(li);
  });
}
document.getElementById('modBtn').onclick = openModPanel;
document.getElementById('modClose').onclick = closeModPanel;
modPanel.addEventListener('keydown', e => { if(e.key==='Escape') closeModPanel(); });
document.getElementById('modFile').addEventListener('change', async e => {
  const out = [], ok = [];
  for(const f of e.target.files){ const txt = await f.text(); const r = addModText(txt, f.name); (r.ok ? ok : out).push(r.msg); }
  e.target.value = ''; renderModList(); setMsg([...ok, ...out].join('\n\n'), out.length===0);
});
document.getElementById('modPasteBtn').onclick = () => { const t = document.getElementById('modPaste').value.trim(); if(!t){ setMsg('Paste some mod JSON into the box first.', false); return; }
  const r = addModText(t, 'Pasted mod'); setMsg(r.msg, r.ok); if(r.ok) document.getElementById('modPaste').value = ''; renderModList(); };
const exTxt = JSON.stringify(EXAMPLE_MOD, null, 2); document.getElementById('modExample').textContent = exTxt;
document.getElementById('copyEx').onclick = async () => { try{ await navigator.clipboard.writeText(exTxt); setMsg('Example copied. Paste it into a .json file to start your own mod.', true); }
  catch(e){ const r = document.createRange(); r.selectNodeContents(document.getElementById('modExample')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); setMsg('Copy did not work here, so the example is selected. Copy it manually.', false); } };

/* ---------------- rename dialog ---------------- */
const renameDlg = document.getElementById('renameDlg'), renameInput = document.getElementById('renameInput');
let renameTarget = null;
function openRename(kind, crew){
  renameTarget = { kind, crew };
  document.getElementById('renameTitle').textContent = kind==='ship' ? 'Name your ship' : `Rename ${crew.name}`;
  renameInput.value = kind==='ship' ? (UI.shipName || DATA.ships[UI.selShip]?.name || '') : crew.name;
  renameDlg.hidden = false; renameInput.focus(); renameInput.select();
}
function applyRename(){ const v = renameInput.value.trim().slice(0, 24); if(v && renameTarget){ if(renameTarget.kind==='ship') UI.shipName = v; else renameTarget.crew.name = v; } renameDlg.hidden = true; renameTarget = null; }
document.getElementById('renameOk').onclick = applyRename;
document.getElementById('renameCancel').onclick = () => { renameDlg.hidden = true; };
renameInput.addEventListener('keydown', e => { if(e.key==='Enter') applyRename(); if(e.key==='Escape') renameDlg.hidden = true; });
document.getElementById('renameRandom').onclick = () => { renameInput.value = renameTarget?.kind==='ship' ? pick(SHIP_NAMES) : pick(NAMES); };

/* ---------------- boot ---------------- */
applyMods();
fit();
(document.fonts ? document.fonts.load(`700 40px 'Chakra Petch'`).then(()=>document.fonts.load(`400 20px 'IBM Plex Mono'`)) : Promise.resolve()).catch(()=>{});
cv.addEventListener('pointerdown', ensureAudio, { once:true });
loadLibrary();
if(window.THREE){
  init3D();
  if(navigator.xr){
    navigator.xr.isSessionSupported('immersive-vr').then(ok => { const b = document.getElementById('vrBtn'); b.hidden = !ok; b.onclick = () => enterXR('immersive-vr'); if(!ok) document.getElementById('xrNote').textContent = 'No VR headset found. Playing in flat mode.'; fit(); }).catch(()=>{});
    navigator.xr.isSessionSupported('immersive-ar').then(ok => { const b = document.getElementById('arBtn'); b.hidden = !ok; b.onclick = () => enterXR('immersive-ar'); fit(); }).catch(()=>{});
  } else document.getElementById('xrNote').textContent = 'This browser has no WebXR. Playing in flat mode.';
} else { document.getElementById('xrNote').textContent = '3D engine failed to load. Playing in flat mode.'; requestAnimationFrame(fallbackLoop); }
