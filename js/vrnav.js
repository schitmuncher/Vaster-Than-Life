'use strict';
/* =========================================================================
   VR movement and clarity: walk around the bridge (smooth or teleport),
   snap turning, a comfort vignette, a magnifier loupe over the console,
   hover haptics, and controller help labels you can glance at.
   ========================================================================= */
let rig = null, vignette = null, fader = null, tpMarker = null, loupe = null, ctrlLabels = [];
const nav = { fade:0, fadeTo:null, turnLatch:{}, moving:0, hoverIdx:[-1,-1], lastActive:1, sessionT:0, home:null };
const BRIDGE_BOUNDS = { x0:-2.7, x1:2.7, z0:-2.55, z1:3.6 };   // bridge-local metres the player may stand in

function initNav(){
  if(!rig){ rig = new THREE.Group(); scene.add(rig); rig.add(camera); }
  // comfort vignette: a soft black ring hugging the view while moving
  const vc = mkCanvas(256, 256), vg = vc.getContext('2d'); const gr = vg.createRadialGradient(128,128,40,128,128,128); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.55,'rgba(0,0,0,.1)'); gr.addColorStop(1,'rgba(0,0,0,1)'); vg.fillStyle = gr; vg.fillRect(0,0,256,256);
  vignette = new THREE.Mesh(new THREE.PlaneGeometry(.42, .42), new THREE.MeshBasicMaterial({ map:texFrom(vc), transparent:true, opacity:0, depthTest:false, depthWrite:false }));
  vignette.position.z = -.12; vignette.renderOrder = 999; camera.add(vignette);
  fader = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 8), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0, side:THREE.BackSide, depthTest:false, depthWrite:false }));
  fader.renderOrder = 1000; camera.add(fader);
  // teleport target
  tpMarker = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(.22, .27, 48), new THREE.MeshBasicMaterial({ color:0x5fd3e6, transparent:true, opacity:.9, depthWrite:false })); ring.rotation.x = -Math.PI/2; tpMarker.add(ring);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(.2, 40), new THREE.MeshBasicMaterial({ color:0x5fd3e6, transparent:true, opacity:.18, depthWrite:false })); inner.rotation.x = -Math.PI/2; tpMarker.add(inner);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.05, .12, 3), new THREE.MeshBasicMaterial({ color:0x5fd3e6 })); arrow.rotation.x = -Math.PI/2; arrow.position.set(0, .02, -.33); tpMarker.add(arrow);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, .5, 32, 1, true), fresnelMat(0x5fd3e6, 1.5, .25)); beam.position.y = .25; tpMarker.add(beam);
  tpMarker.visible = false; scene.add(tpMarker);
  // magnifier loupe: samples the console texture around the pointer, no extra texture upload
  const lg = new THREE.PlaneGeometry(.62, .38);
  loupe = new THREE.Group();
  const lm = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ map:tex, toneMapped:false })); loupe.add(lm); loupe.userData.mesh = lm;
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(.65, .41), new THREE.MeshBasicMaterial({ color:0x5fd3e6 })); fr.position.z = -.002; loupe.add(fr);
  const cross = new THREE.Mesh(new THREE.RingGeometry(.012, .017, 24), new THREE.MeshBasicMaterial({ color:0xffb547 })); cross.position.z = .002; loupe.add(cross);
  loupe.visible = false; panelGroup.add(loupe);
  // glanceable controller help
  for(const c of controllers){ const L = makeCtrlLabel(c.userData.idx); c.add(L); ctrlLabels.push(L); }
}
function makeCtrlLabel(i){
  const c = mkCanvas(640, 300), g = c.getContext('2d'); g.textBaseline = 'alphabetic';
  const lines_ = i===0
    ? [['Left stick','Walk around the bridge'],['Stick click','Magnifier on/off'],['Trigger','Select · aim at floor: teleport'],['X','Pause'],['Y','Map'],['Grip','Bring the console to you']]
    : [['Trigger','Select · aim at floor: teleport'],['Stick ← →','Turn'],['Stick ↑ ↓','Console nearer / further'],['Stick click','Back to the captain\'s spot'],['A','Pause'],['B','Map'],['Grip','Bring the console to you']];
  g.fillStyle = 'rgba(8,14,30,.92)'; g.beginPath(); if(g.roundRect) g.roundRect(4,4,632,292,20); else g.rect(4,4,632,292); g.fill(); g.strokeStyle = i ? '#5fd3e6' : '#ffb547'; g.lineWidth = 4; g.stroke();
  g.font = "700 26px 'Chakra Petch', sans-serif"; g.fillStyle = i ? '#5fd3e6' : '#ffb547'; g.fillText(i ? 'RIGHT HAND' : 'LEFT HAND', 22, 40);
  lines_.forEach(([k,v],n) => { const y = 78 + n*(i ? 31 : 36); g.font = "700 22px 'IBM Plex Mono', monospace"; g.fillStyle = '#ffd27a'; g.fillText(k, 22, y); g.font = "400 21px 'IBM Plex Mono', monospace"; g.fillStyle = '#e8eef9'; g.fillText(v, 196, y); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.21, .1), new THREE.MeshBasicMaterial({ map:texFrom(c), transparent:true, depthWrite:false, toneMapped:false }));
  m.position.set(i ? .07 : -.07, .085, -.02); m.rotation.x = -.5; m.visible = false; return m;
}

/* bridge-local helpers */
function headWorld(){ const p = new THREE.Vector3(); camera.getWorldPosition(p); return p; }
function toBridge(v){ return bridge ? bridge.group.worldToLocal(v.clone()) : v.clone(); }
function inBounds(local){ const B = BRIDGE_BOUNDS; if(local.x < B.x0 || local.x > B.x1 || local.z < B.z0 || local.z > B.z1) return false;
  // keep out of the holotable and side consoles
  if(local.z > .9 && local.x*local.x + (local.z-.9)*(local.z-.9) > 2.95*2.95) return false;
  const ht = (local.x/0.85)**2 + ((local.z + .8)/0.45)**2 < 1; const cons = Math.abs(Math.abs(local.x) - 1.35) < .45 && Math.abs(local.z + .45) < .35;
  return !ht && !cons; }
function moveRigBy(dx, dz){
  if(!bridge || !bridge.group.visible){ rig.position.x += dx; rig.position.z += dz; return; }
  const h = headWorld(); const n = new THREE.Vector3(h.x + dx, h.y, h.z + dz);
  if(inBounds(toBridge(n))){ rig.position.x += dx; rig.position.z += dz; return true; }
  // slide along walls
  const nx = new THREE.Vector3(h.x + dx, h.y, h.z); if(inBounds(toBridge(nx))){ rig.position.x += dx; return true; }
  const nz = new THREE.Vector3(h.x, h.y, h.z + dz); if(inBounds(toBridge(nz))){ rig.position.z += dz; return true; }
  return false;
}
function teleportTo(world){ nav.fadeTo = world.clone(); nav.fade = .001; }
function applyTeleport(){ const h = headWorld(); rig.position.x += nav.fadeTo.x - h.x; rig.position.z += nav.fadeTo.z - h.z; nav.fadeTo = null; }
function snapTurn(angle){ const h = headWorld(); rig.position.sub(h); rig.position.applyAxisAngle(new THREE.Vector3(0,1,0), angle); rig.position.add(h); rig.rotateY(angle); hapticFn?.(.15, 20); }
function goHome(){ if(playPose()!=='standing'){ applyPlayMode(); return; } if(!anchor.pos) return; const h = headWorld(); rig.position.x += anchor.pos.x - h.x; rig.position.z += anchor.pos.z - h.z;
  const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; d.normalize(); const want = Math.atan2(-anchor.dir.x, -anchor.dir.z), cur = Math.atan2(-d.x, -d.z); snapTurn(want - cur); }
function bringConsole(){ const p = headWorld(), d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; if(d.lengthSq()<1e-4) d.set(0,0,-1); d.normalize();
  panelGroup.position.set(p.x + d.x*panelDist, Math.max(.9, p.y - .1), p.z + d.z*panelDist); panelGroup.lookAt(p.x, panelGroup.position.y, p.z);
  const arm = panelGroup.userData.arm; if(arm){ const h = Math.max(.2, panelGroup.position.y - .75); arm.scale.y = h; arm.position.y = -.75 - h/2; } }

/* per-frame: sticks, turning, teleport aim, vignette, loupe, labels, hover ticks */
function updateNav(dt){
  if(!inXR()) return;
  nav.sessionT += dt;
  const sess = renderer.xr.getSession(); let moveMag = 0;
  if(sess) for(const src of sess.inputSources){
    const gp = src.gamepad; if(!gp || gp.axes.length < 4) continue; const hand = src.handedness; const ax = gp.axes[2], ay = gp.axes[3];
    if(hand==='left' && SET.vrMove !== 'teleport'){ const mag = Math.hypot(ax, ay); if(mag > .18){ const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; d.normalize(); const r = new THREE.Vector3(-d.z, 0, d.x);
        const sp = 1.4*dt*Math.min(1, (mag-.18)/.7); if(moveRigBy((d.x*-ay + r.x*ax)/mag*sp, (d.z*-ay + r.z*ax)/mag*sp)) moveMag = Math.max(moveMag, mag); } }
    if(hand==='right'){
      if(SET.vrTurn==='smooth'){ if(Math.abs(ax) > .25) { const h = headWorld(); const a = -ax*dt*1.6; rig.position.sub(h); rig.position.applyAxisAngle(new THREE.Vector3(0,1,0), a); rig.position.add(h); rig.rotateY(a); moveMag = Math.max(moveMag, Math.abs(ax)); } }
      else { const lat = nav.turnLatch[hand]; if(Math.abs(ax) > .7 && !lat){ nav.turnLatch[hand] = true; snapTurn(-Math.sign(ax) * (SET.vrTurn==='45' ? Math.PI/4 : Math.PI/6)); } else if(Math.abs(ax) < .3) nav.turnLatch[hand] = false; }
      if(Math.abs(ay) > .35 && Math.abs(ay) > Math.abs(ax) && anchor.pos){ panelDist = clamp(panelDist + ay*dt*1.2, .9, 3.5); bringConsole(); }
    }
  }
  // comfort vignette
  nav.moving += ((moveMag>0 ? 1 : 0) - nav.moving) * Math.min(1, dt*8);
  vignette.material.opacity = SET.vrVignette === false ? 0 : nav.moving*.95; vignette.visible = vignette.material.opacity > .01;
  // teleport fade
  if(nav.fadeTo || nav.fade>0){ if(nav.fadeTo){ nav.fade = Math.min(1, nav.fade + dt*8); if(nav.fade>=1) applyTeleport(); } else nav.fade = Math.max(0, nav.fade - dt*6); }
  fader.material.opacity = nav.fade; fader.visible = nav.fade > .01;
  // controller labels when you glance at your hands
  const camP = headWorld(), camD = new THREE.Vector3(); camera.getWorldDirection(camD);
  ctrlLabels.forEach((L, i) => { const c = controllers[i]; if(!c || !c.userData.src || SET.vrLabels===false){ L.visible = false; return; }
    const cp = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld); const to = cp.clone().sub(camP); const dist = to.length(); to.normalize();
    L.visible = (dist < .75 && to.dot(camD) > .88) || nav.sessionT < 25; });
}
/* called from xrPointers for a ray that missed the console: aim at the floor to teleport */
function aimFloor(c, origin, dir){
  if(!bridge || !bridge.group.visible || dir.y > -.05){ return null; }
  const t = -origin.y/dir.y; if(t > 8) return null; const p = origin.clone().addScaledVector(dir, t);
  if(!inBounds(toBridge(p))) return null; return { p, t };
}
function updateTeleportMarker(aims){
  const a = aims.find(x => x); if(!a){ tpMarker.visible = false; return; }
  tpMarker.visible = true; tpMarker.position.copy(a.p); tpMarker.position.y = .01; const h = headWorld(); tpMarker.lookAt(h.x, .01, h.z); tpMarker.rotateY(Math.PI);
  const s = 1 + Math.sin(performance.now()/180)*.05; tpMarker.scale.set(s, 1, s);
}
function updateLoupe(c, hit){
  if(!loupe) return;
  if(SET.vrLoupe === false || !hit){ if(c.userData.idx===nav.lastActive) loupe.visible = false; return; }
  nav.lastActive = c.userData.idx;
  const zoom = 2.3, pw = 2.4, ph = 1.5, lw = .62, lh = .38;
  const uw = lw/zoom/pw, uh = lh/zoom/ph; const u = clamp(hit.uv.x, uw/2, 1-uw/2), v = clamp(hit.uv.y, uh/2, 1-uh/2);
  const uv = loupe.userData.mesh.geometry.attributes.uv; // PlaneGeometry uv order: TL, TR, BL, BR
  uv.setXY(0, u-uw/2, v+uh/2); uv.setXY(1, u+uw/2, v+uh/2); uv.setXY(2, u-uw/2, v-uh/2); uv.setXY(3, u+uw/2, v-uh/2); uv.needsUpdate = true;
  const lx = (hit.uv.x - .5)*pw, ly = (hit.uv.y - .5)*ph; const above = hit.uv.y < .7;
  loupe.position.set(clamp(lx, -pw/2 + lw/2, pw/2 - lw/2), ly + (above ? .3 : -.3), .16);
  loupe.children[2].position.set(((hit.uv.x - u)/uw)*lw, ((hit.uv.y - v)/uh)*lh, .002);
  loupe.visible = true;
}
function hoverTick(i, x, y, src){
  let idx = -1; for(let k=HR.length-1;k>=0;k--){ const r = HR[k]; if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){ idx = k + Math.round(r.x)*1000 + Math.round(r.y)*7; break; } }
  if(idx!==nav.hoverIdx[i]){ if(idx!==-1) pulse(src, .07, 8); nav.hoverIdx[i] = idx; }
}

/* ---------------- play position: standing, seated or lying down ----------------
   Standing uses your real height. Seated lifts your view to captain's-chair height
   and puts the chair under you. Lying down pitches the whole world so that looking
   at the ceiling shows the bridge in front of you, then seats you in the chair. */
const POSE_EYE = { seated:1.22, lying:1.22 };
function playPose(){ return SET.vrPose || 'standing'; }
function applyPlayMode(){
  if(!rig || !camera) return;
  rig.position.set(0,0,0); rig.quaternion.identity(); rig.updateMatrixWorld(true);
  const pose = playPose();
  if(pose==='lying'){
    const head = headWorld(), d = new THREE.Vector3(), up = new THREE.Vector3(0,1,0);
    camera.getWorldDirection(d);
    const H = up.clone().applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));   // towards the top of your head
    // only pitch the world when you are actually looking mostly upward
    if(d.y > .35){
      H.addScaledVector(d, -H.dot(d)).normalize();
      const S = new THREE.Matrix4().makeBasis(d, H, new THREE.Vector3().crossVectors(d, H));
      const f = H.clone().setY(0); if(f.lengthSq() < 1e-4) f.set(0,0,1); f.normalize().negate();
      const T = new THREE.Matrix4().makeBasis(f, up, new THREE.Vector3().crossVectors(f, up));
      const R = new THREE.Quaternion().setFromRotationMatrix(T.multiply(S.clone().transpose()));
      rig.position.sub(head).applyQuaternion(R).add(head); rig.quaternion.premultiply(R); rig.updateMatrixWorld(true);
    }
  }
  if(POSE_EYE[pose]){ const h = headWorld(); rig.position.y += POSE_EYE[pose] - h.y; rig.updateMatrixWorld(true); }
  recenter();
  if(bridge && bridge.chair){
    const seated = pose!=='standing'; bridge.chair.visible = seated;
    if(seated){ bridge.group.updateMatrixWorld(true); const local = toBridge(headWorld()); bridge.chair.position.set(local.x, 0, local.z + .12); }
  }
}
function setPlayPose(p){ SET.vrPose = p; saveProfile(); if(inXR()){ applyPlayMode(); toast(p==='lying' ? 'Lying down: look at the ceiling, then click the right stick to re-aim.' : p==='seated' ? 'Seated mode: the bridge is set to chair height.' : 'Standing mode: walk around the bridge.'); } }
