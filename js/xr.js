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
const HS = .0009;
let holo = null;
function holoXZ(x, y){ return [(x-800)*HS, (y-330)*HS]; }
function initHolo(){
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CircleGeometry(.8, 64), new THREE.MeshBasicMaterial({ color:0x0e1426, transparent:true, opacity:.85 }));
  top.rotation.x = -Math.PI/2; top.scale.set(1, .42, 1); g.add(top);
  const rim = new THREE.Mesh(new THREE.RingGeometry(.79, .8, 96), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.6, side:THREE.DoubleSide }));
  rim.rotation.x = -Math.PI/2; rim.scale.set(1, .42, 1); rim.position.y = .001; g.add(rim);
  const sphereGeo = new THREE.SphereGeometry(.009, 10, 8);
  holo = { group:g, ships:{}, crewPool:[], projPool:[], unitPool:[], sphereGeo };
  scene.add(g);
}
function poolGet(pool, i, color, size){
  if(!pool[i]){ const m = new THREE.Mesh(holo.sphereGeo, new THREE.MeshBasicMaterial({ color })); holo.group.add(m); pool[i] = m; }
  const m = pool[i]; m.visible = true; m.material.color.set(color); m.scale.setScalar(size||1); return m;
}
function holoShip(sh, side){
  let H_ = holo.ships[side];
  const key = sh ? sh.id + ':' + (sh._rects||[]).map(q => `${q.x|0},${q.y|0},${q.w|0}`).join('|') : '';
  if(!H_ || H_.key!==key){
    if(H_){ holo.group.remove(H_.group); H_.group.traverse(o => { if(o.geometry && o.geometry!==holo.sphereGeo) o.geometry.dispose(); if(o.material) o.material.dispose(); }); }
    H_ = holo.ships[side] = { key, group:new THREE.Group(), rooms:[], shield:null };
    holo.group.add(H_.group);
    if(sh && sh._rects && sh._b){
      const b = sh._b; const [cx, cz] = holoXZ((b.x0+b.x1)/2, (b.y0+b.y1)/2);
      const hull = new THREE.Mesh(new THREE.BoxGeometry((b.x1-b.x0+b.nose)*HS, .012, (b.y1-b.y0)*HS), new THREE.MeshBasicMaterial({ color:new THREE.Color(sh.color).multiplyScalar(.35) }));
      hull.position.set(cx + b.facing*b.nose*.5*HS, .02, cz); H_.group.add(hull);
      sh._rects.forEach(q => { const m = new THREE.Mesh(new THREE.BoxGeometry(q.w*HS*.94, .03, q.h*HS*.94), new THREE.MeshBasicMaterial({ color:0x1a2442 }));
        const [x, z] = holoXZ(q.x+q.w/2, q.y+q.h/2); m.position.set(x, .042, z); H_.group.add(m); H_.rooms.push(m); });
      const sm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color:0x5fd3e6, transparent:true, opacity:.15, depthWrite:false }));
      sm.scale.set((b.x1-b.x0)*HS*.62 + .03, .06, (b.y1-b.y0)*HS*.62 + .03); sm.position.set(cx + b.facing*b.nose*.3*HS, .05, cz); H_.group.add(sm); H_.shield = sm;
    }
  }
  if(!sh) return;
  const col = new THREE.Color();
  sh.rooms.forEach((r,i) => { const m = H_.rooms[i]; if(!m) return; const s = r.sys ? sh.systems[r.sys] : null;
    if(r.fire>0) col.set(Math.sin(G.time*10)>0 ? 0xff8a3d : 0xffb547);
    else if(s && s.dmg>0) col.set(0xff5a7a);
    else if(s && s.ionT>0) col.set(0x5fd3e6);
    else if(r.o2<40) col.set(0x6a2a3a);
    else if(r.sys && s) col.set(SYSC[r.sys]).multiplyScalar(.45);
    else col.set(0x1a2442);
    m.material.color.copy(col); });
  if(H_.shield){ H_.shield.visible = sh.shield>0 || sh.super>0; H_.shield.material.opacity = .06 + .05*sh.shield; H_.shield.material.color.set(sh.super>0 ? 0x7be0a0 : 0x5fd3e6); }
  H_.group.visible = !sh.dead || (G.dieT>0 && Math.sin(G.time*30)>0);
}
function updateHolo(){
  if(!holo) return;
  const show = SET.holotable && UI.screen==='game' && !!G;
  holo.group.visible = show; if(!show) return;
  holoShip(G.ship, 'p');
  if(G.enemy) holoShip(G.enemy, 'e'); else if(holo.ships.e){ holo.ships.e.group.visible = false; holo.ships.e.key = ''; }
  let ci = 0;
  for(const s of [G.ship, G.enemy]) if(s) for(const c of s.crew){ if(c._sx==null) continue; const [x,z] = holoXZ(c._sx, c._sy);
    const m = poolGet(holo.crewPool, ci++, c.owner==='p' ? (DATA.races[c.race]?.color || '#ffffff') : '#ff5a7a', 1); m.position.set(x, .07, z); }
  for(let i=ci;i<holo.crewPool.length;i++) holo.crewPool[i].visible = false;
  let pi = 0;
  for(const p of G.proj){ if(p._x==null || p.t<0) continue; const [x,z] = holoXZ(p._x, p._y); const m = poolGet(holo.projPool, pi++, p.from==='p' ? '#ffb547' : '#ff5a7a', .8);
    m.position.set(x, .09 + Math.sin(clamp(p.t/p.dur,0,1)*Math.PI)*.08, z); }
  for(let i=pi;i<holo.projPool.length;i++) holo.projPool[i].visible = false;
  let ui_ = 0;
  for(const u of G.units){ if(u._x==null) continue; const [x,z] = holoXZ(u._x, u._y); const m = poolGet(holo.unitPool, ui_++, u.side==='p' ? '#f0a6ff' : '#ff5a7a', .7); m.position.set(x, .1, z); }
  for(let i=ui_;i<holo.unitPool.length;i++) holo.unitPool[i].visible = false;
}

/* ---------------- 3D scene ---------------- */
function init3D(){
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x070a14);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .05, 600);
  tmpM = new THREE.Matrix4();
  tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  panelGroup = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 1.56), new THREE.MeshBasicMaterial({ color:0x26324f })); frame.position.z = -.005;
  panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map:tex }));
  panelGroup.add(frame, panelMesh); panelGroup.position.set(0, 1.4, -panelDist); scene.add(panelGroup);
  const N = 2500, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ const v = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize().multiplyScalar(rand(80,220)); pos.set([v.x,v.y,v.z], i*3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  starPts = new THREE.Points(sg, new THREE.PointsMaterial({ color:0xdfe6f5, size:.7, sizeAttenuation:true })); scene.add(starPts);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 32), new THREE.MeshLambertMaterial({ color:0x3b4f7a })); planet.position.set(-70, 5, -150); scene.add(planet);
  const ring = new THREE.Mesh(new THREE.RingGeometry(40, 52, 96), new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.25, side:THREE.DoubleSide })); ring.position.copy(planet.position); ring.rotation.x = 1.25; scene.add(ring);
  scene.add(new THREE.AmbientLight(0x404a66, .6)); const sun = new THREE.DirectionalLight(0xffd9a0, 1.1); sun.position.set(60, 40, 20); scene.add(sun);
  scene.userData.space = [starPts, planet, ring];
  initHolo();
  raycaster = new THREE.Raycaster();
  for(let i=0;i<2;i++){
    const c = renderer.xr.getController(i);
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]);
    const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color:0xffb547, transparent:true, opacity:.8 })); c.add(line);
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
    starPts.rotation.y += dt*(.004 + warp*.8); starPts.scale.z = 1 + warp*6;
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
