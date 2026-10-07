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

/* ---------------- 3D scene ---------------- */
function init3D(){
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070f);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .05, 900);
  tmpM = new THREE.Matrix4();
  tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
  const gl2 = renderer.capabilities.isWebGL2; tex.generateMipmaps = gl2; tex.minFilter = gl2 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;   // mipmaps keep small text crisp at a distance
  rig = new THREE.Group(); scene.add(rig); rig.add(camera);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  panelGroup = new THREE.Group();
  // console frame: bevelled metal bezel with lit edges, on a support arm
  const rr_ = (sh_, w, h, r) => { sh_.moveTo(-w/2 + r, -h/2); sh_.lineTo(w/2 - r, -h/2); sh_.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r); sh_.lineTo(w/2, h/2 - r); sh_.quadraticCurveTo(w/2, h/2, w/2 - r, h/2); sh_.lineTo(-w/2 + r, h/2); sh_.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r); sh_.lineTo(-w/2, -h/2 + r); sh_.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2); };
  const fs = new THREE.Shape(); rr_(fs, 2.62, 1.72, .08); const hole = new THREE.Path(); rr_(hole, 2.42, 1.52, .02); fs.holes.push(hole);
  const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth:.05, bevelEnabled:true, bevelThickness:.012, bevelSize:.012, bevelSegments:2, curveSegments:6 }), stdMat({ color:0x2b3350, metalness:.9, roughness:.28 }));
  bezel.position.z = -.045;
  const backS = new THREE.Shape(); rr_(backS, 2.6, 1.7, .08);
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(backS, { depth:.04, bevelEnabled:false }), stdMat({ color:0x141a2c, metalness:.8, roughness:.4 })); back.position.z = -.09;
  panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map:tex }));
  const edgeM = new THREE.MeshBasicMaterial({ color:0xffb547 });
  const strips = new THREE.Group(); for(const [w,h,x,y] of [[2.2,.012,0,.87],[2.2,.012,0,-.87],[.012,1.3,1.32,0],[.012,1.3,-1.32,0]]){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), edgeM); m.position.set(x, y, .02); strips.add(m); }
  for(const sx of [-1,1]){ const cl = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, .06), stdMat({ color:0x8a95b8, metalness:.9, roughness:.25 })); cl.position.set(sx*1.15, -.9, -.02); strips.add(cl); }
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 1, 12), stdMat({ color:0x2b3350, metalness:.9, roughness:.3 })); arm.position.set(0, -1.35, -.12); panelGroup.userData.arm = arm;
  panelGroup.add(back, bezel, panelMesh, strips, arm); panelGroup.userData.edge = edgeM; panelGroup.position.set(0, 1.4, -panelDist); scene.add(panelGroup);
  initWorld();
  raycaster = new THREE.Raycaster();
  for(let i=0;i<2;i++){
    const c = renderer.xr.getController(i);
    const bg = new THREE.CylinderGeometry(.0015, .004, 1, 8, 1, true); bg.translate(0, .5, 0); bg.rotateX(-Math.PI/2);
    const line = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color:0xffb547, transparent:true, opacity:.75, blending:THREE.AdditiveBlending, depthWrite:false })); c.add(line);
    const dot = glowSpriteMesh('#ffd27a', .06); dot.position.z = -1; line.add(dot); line.userData.dot = dot;
    const body = new THREE.Group(); const bm = stdMat({ color:0x2b3350, metalness:.85, roughness:.3 });
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(.017, .02, .11, 16), bm); grip.rotation.x = Math.PI/2 - .5; grip.position.set(0, -.02, .05); body.add(grip);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.024, 16, 10), bm); head.position.set(0, .005, -.005); body.add(head);
    const ringC = new THREE.Mesh(new THREE.TorusGeometry(.026, .003, 6, 32), new THREE.MeshBasicMaterial({ color:i ? 0x5fd3e6 : 0xffb547 })); ringC.position.set(0, .005, -.005); ringC.rotation.x = Math.PI/2; body.add(ringC);
    const emit = glowSpriteMesh(i ? '#5fd3e6' : '#ffb547', .03); emit.position.set(0, .005, -.03); body.add(emit);
    c.add(body);
    c.userData = { line, idx:i, hit:null, src:null };
    c.addEventListener('selectstart', () => { if(c.userData.holo){ click(c.userData.holo.x, c.userData.holo.y); pulse(c.userData.src, .25, 25); return; } if(c.userData.hit){ click(c.userData.hit.x, c.userData.hit.y); pulse(c.userData.src, .25, 25); } else if(c.userData.aim){ teleportTo(c.userData.aim.p); pulse(c.userData.src, .2, 30); } });
    c.addEventListener('connected', e => { c.userData.src = e.data; });
    c.addEventListener('disconnected', () => { c.userData.src = null; PTR[1+i].on = false; });
    rig.add(c); controllers.push(c);
  }
  initNav(); initGrab();
  hapticFn = (v, ms) => { const s = renderer.xr.getSession(); if(!s) return; for(const src of s.inputSources) pulse(src, v, ms); };
  renderer.setAnimationLoop(loop);
  window.addEventListener('resize', () => { if(!inXR()){ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); } });
}

function pulse(src, v, ms){ try{ const a = src?.gamepad?.hapticActuators?.[0]; if(a && a.pulse) a.pulse(clamp(v,0,1), ms); }catch(e){} }
function xrPointers(){
  if(GRAB.ring) GRAB.ring.visible = false;
  for(const c of controllers){
    const i = c.userData.idx;
    if(!c.userData.src){ c.userData.line.visible = false; PTR[1+i].on = false; continue; }
    c.userData.line.visible = true;
    tmpM.identity().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(tmpM);
    const hits = raycaster.intersectObject(panelMesh);
    c.userData.aim = null; c.userData.holo = null; GRAB.hoverEdge[i] = false;
    if(hits.length && hits[0].uv){ const uv = hits[0].uv; const x = uv.x*W, y = (1-uv.y)*H; c.userData.hit = { x, y }; PTR[1+i].x = x; PTR[1+i].y = y; PTR[1+i].on = true; c.userData.line.scale.z = hits[0].distance; c.userData.line.userData.dot.visible = true;
      c.userData.line.material.color.set(0xffb547); updateLoupe(c, hits[0]); hoverTick(i, x, y, c.userData.src); noteEdgeHover(i, hits[0]); }
    else { c.userData.hit = null; PTR[1+i].on = false; updateLoupe(c, null);
      const ro = raycaster.ray.origin.clone(), rd = raycaster.ray.direction.clone();
      const hp = holoPick(i, ro, rd);
      if(hp){ c.userData.holo = hp; PTR[1+i].x = hp.x; PTR[1+i].y = hp.y; PTR[1+i].on = true; c.userData.line.scale.z = hp.dist; c.userData.line.userData.dot.visible = true; c.userData.line.material.color.set(0xffd27a); hoverTick(i, hp.x, hp.y, c.userData.src); continue; }
      const aim = aimFloor(c, ro, rd); c.userData.aim = aim;
      c.userData.line.scale.z = aim ? aim.t : 3; c.userData.line.userData.dot.visible = !!aim; c.userData.line.material.color.set(aim ? 0x5fd3e6 : 0xffb547); }
  }
  updateTeleportMarker(controllers.map(c => c.userData.aim));
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
    // grip is handled by vrgrab.js (grab, move, resize, or bring the console to you)
    if(edge(3)){ if(src.handedness==='left'){ SET.vrLoupe = SET.vrLoupe===false; saveProfile(); toast(SET.vrLoupe ? 'Magnifier on' : 'Magnifier off'); if(!SET.vrLoupe) loupe.visible = false; } else goHome(); }
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
  const arm = panelGroup.userData.arm; if(arm){ const h = Math.max(.2, panelGroup.position.y - .75); arm.scale.y = h; arm.position.y = -.75 - h/2; }
  placeWorld(p, d);
}
async function enterXR(mode){
  if(inXR()) return;
  try{
    ensureAudio();
    const sess = await navigator.xr.requestSession(mode, { optionalFeatures:['local-floor','hand-tracking'] });
    renderer.xr.setReferenceSpaceType('local-floor'); renderer.xr.setFramebufferScaleFactor(SET.vrRes || 1);
    await renderer.xr.setSession(sess);
    try{ const bl = sess.renderState.baseLayer; if(bl && 'fixedFoveation' in bl) bl.fixedFoveation = SET.vrFov ?? .66; }catch(e){}
    xrMode = mode; const ar = mode==='immersive-ar';
    scene.background = ar ? null : new THREE.Color(0x070a14); scene.userData.space.forEach(o => o.visible = !ar); setMixedReality(ar);
    recenterIn = 3;
    sess.addEventListener('end', () => { xrMode = null; PTR[1].on = PTR[2].on = false; scene.background = new THREE.Color(0x070a14); scene.userData.space.forEach(o => o.visible = true); setMixedReality(false); });
  }catch(err){ document.getElementById('xrNote').textContent = 'Could not start VR: ' + (err.message || err); }
}
let last = performance.now(), fc = 0;
function loop(){
  const now = performance.now(), dt = Math.min(.05, (now-last)/1000); last = now;
  const xr = inXR();
  if(xr){ updateNav(dt); xrPointers(); xrButtons(dt); updateGrab(dt); }
  update(dt); draw();
  if(xr){
    if(recenterIn>0){ recenterIn--; if(recenterIn===0){ applyPlayMode(); nav.sessionT = 0; } }
    if((++fc & 1)===0) tex.needsUpdate = true;
    update3D(dt);
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
