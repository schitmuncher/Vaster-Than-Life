'use strict';
/* =========================================================================
   Grab, move, rotate and resize in VR.
   - Console: point at it and hold grip to carry it (any position, any angle).
     Grip on the outer edge or a corner handle stretches it bigger or smaller.
     Grab it with both hands to move and scale at once.
   - Holotable: point at the table and hold grip to move and turn it; two hands
     scale the ships up into a big tactical display. Point at a room on a 3D
     ship and pull the trigger to use it exactly like the console (target,
     move crew, select).
   - Grip pointing at nothing still brings the console in front of you.
   ========================================================================= */
const GRAB = { hands:[null, null], handles:[], hoverEdge:[false,false], holoHit:[null,null], ring:null };
const _m4 = () => new THREE.Matrix4(), _v3 = () => new THREE.Vector3(), _q = () => new THREE.Quaternion();

function initGrab(){
  // corner handles on the console: L-brackets that light up when you can stretch
  const hm = new THREE.MeshBasicMaterial({ color:0x5fd3e6, transparent:true, opacity:.35 });
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(.22, .035, .03), hm); a.position.set(-sx*.11, 0, 0);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.035, .22, .03), hm); b.position.set(0, -sy*.11, 0);
    g.add(a, b); g.position.set(sx*1.33, sy*.88, .03); panelGroup.add(g); GRAB.handles.push(g);
  }
  GRAB.handleMat = hm;
  // hover ring on the holotable ships
  GRAB.ring = new THREE.Mesh(new THREE.RingGeometry(.012, .018, 24), new THREE.MeshBasicMaterial({ color:0xffd27a, transparent:true, depthTest:false }));
  GRAB.ring.rotation.x = -Math.PI/2; GRAB.ring.renderOrder = 5; GRAB.ring.visible = false; scene.add(GRAB.ring);
  if(SET.vrPanelScale) panelGroup.scale.setScalar(SET.vrPanelScale);
  if(SET.vrHoloScale && holo) holo.top.scale.setScalar(SET.vrHoloScale);
  controllers.forEach((c, i) => {
    c.addEventListener('squeezestart', () => grabStart(i));
    c.addEventListener('squeezeend', () => grabEnd(i));
  });
}
function ctrlRay(c){ const m = _m4().extractRotation(c.matrixWorld); const o = _v3().setFromMatrixPosition(c.matrixWorld); const d = _v3().set(0,0,-1).applyMatrix4(m); return { o, d }; }
function panelTargets(){ const t = []; panelGroup.traverse(o => { if(o.isMesh && o !== loupe?.userData?.mesh && !(loupe && loupe.children.includes(o))) t.push(o); }); return t; }
function holoTargets(){ if(!holo || !holo.top.visible) return []; const t = []; holo.top.traverse(o => { if(o.isMesh) t.push(o); }); holo.ped.traverse(o => { if(o.isMesh) t.push(o); }); return t; }
function edgeZone(localPt){ return Math.abs(localPt.x) > 1.12 || Math.abs(localPt.y) > .66; }

function grabStart(i){
  const c = controllers[i]; if(!c || !c.userData.src) return;
  const { o, d } = ctrlRay(c); raycaster.set(o, d);
  const other = GRAB.hands[1-i];
  const pHit = raycaster.intersectObjects(panelTargets(), false)[0];
  const hHit = raycaster.intersectObjects(holoTargets(), false)[0];
  let target = null, hit = null;
  if(pHit && (!hHit || pHit.distance < hHit.distance)){ target = 'panel'; hit = pHit; } else if(hHit){ target = 'holo'; hit = hHit; }
  if(!target){ bringConsole(); pulse(c.userData.src, .2, 30); return; }
  const obj = target==='panel' ? panelGroup : holo.group;
  const G_ = { target, obj, mode:'move' };
  if(target==='panel'){ const lp = panelGroup.worldToLocal(hit.point.clone()); if(edgeZone(lp)){ G_.mode = 'resize'; G_.s0 = panelGroup.scale.x; G_.d0 = hit.point.distanceTo(panelGroup.position); } }
  if(other && other.target===target){ // second hand on the same thing: two-handed scale
    G_.mode = 'two'; const p0 = _v3().setFromMatrixPosition(controllers[1-i].matrixWorld), p1 = _v3().setFromMatrixPosition(c.matrixWorld);
    G_.d0 = p0.distanceTo(p1); G_.s0 = target==='panel' ? panelGroup.scale.x : holo.top.scale.x; other.mode = 'lead';
  }
  G_.off = _m4().copy(c.matrixWorld).invert().multiply(obj.matrixWorld);
  G_.dist = hit.distance;
  GRAB.hands[i] = G_; pulse(c.userData.src, .35, 40); sfx('click');
}
function grabEnd(i){
  const G_ = GRAB.hands[i]; if(!G_) return; GRAB.hands[i] = null;
  const other = GRAB.hands[1-i]; if(other && (other.mode==='lead' || other.mode==='two')){ other.mode = 'move'; other.off = _m4().copy(controllers[1-i].matrixWorld).invert().multiply(other.obj.matrixWorld); }
  if(G_.target==='panel'){ SET.vrPanelScale = +panelGroup.scale.x.toFixed(3); } else { SET.vrHoloScale = +holo.top.scale.x.toFixed(3); }
  saveProfile();
}
function updateGrab(dt){
  if(!inXR()) return;
  GRAB.hands.forEach((G_, i) => {
    if(!G_) return; const c = controllers[i]; if(!c.userData.src){ grabEnd(i); return; }
    const sess = renderer.xr.getSession(); const src = c.userData.src; const ay = src?.gamepad?.axes?.[3] || 0;
    if(G_.mode==='move' || G_.mode==='lead'){
      if(Math.abs(ay) > .3){ G_.off.premultiply(_m4().makeTranslation(0, 0, ay*dt*1.5)); }   // push / pull along the ray
      const m = _m4().copy(c.matrixWorld).multiply(G_.off); const pos = _v3(), q = _q(), sc = _v3(); m.decompose(pos, q, sc);
      G_.obj.position.copy(pos);
      if(G_.target==='holo'){ const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); G_.obj.rotation.set(0, e.y, 0); G_.obj.position.y = clamp(pos.y, .35, 1.6); holo.ped.scale.y = G_.obj.position.y; }
      else G_.obj.quaternion.copy(q);
    } else if(G_.mode==='resize'){
      const { o, d } = ctrlRay(c); const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(_v3().set(0,0,1).applyQuaternion(panelGroup.quaternion), panelGroup.position);
      const p = _v3(); if(new THREE.Ray(o, d).intersectPlane(plane, p)){ const s = clamp(G_.s0 * p.distanceTo(panelGroup.position)/Math.max(.05, G_.d0), .35, 3); panelGroup.scale.setScalar(s); }
    } else if(G_.mode==='two'){
      const p0 = _v3().setFromMatrixPosition(controllers[1-i].matrixWorld), p1 = _v3().setFromMatrixPosition(c.matrixWorld);
      const s = clamp(G_.s0 * p0.distanceTo(p1)/Math.max(.05, G_.d0), G_.target==='panel' ? .35 : .5, G_.target==='panel' ? 3 : 3.5);
      if(G_.target==='panel') panelGroup.scale.setScalar(s); else holo.top.scale.setScalar(s);
    }
  });
  // handle glow: brighter when a pointer is in the stretch zone or resizing
  const active = GRAB.hands.some(h => h && h.target==='panel' && h.mode!=='move' && h.mode!=='lead') || GRAB.hoverEdge.some(Boolean);
  GRAB.handleMat.opacity = active ? .95 : .3; GRAB.handleMat.color.set(active ? 0xffd27a : 0x5fd3e6);
}
/* called from xrPointers: did this pointer land on the console's stretch zone? */
function noteEdgeHover(i, hit){ GRAB.hoverEdge[i] = !!hit && edgeZone(panelGroup.worldToLocal(hit.point.clone())); }
/* pointer over a holotable ship: map the 3D point back to the console canvas */
function holoPick(i, origin, dir){
  GRAB.holoHit[i] = null;
  if(!holo || !holo.top.visible) return null;
  raycaster.set(origin, dir);
  const meshes = []; for(const k of ['p','e']){ const M = holo.ships[k]; if(M && M.group.visible) meshes.push(M.hull); }
  const hit = raycaster.intersectObjects(meshes, false)[0]; if(!hit) return null;
  const M = holo.ships.p && hit.object===holo.ships.p.hull ? holo.ships.p : holo.ships.e; const sh = M===holo.ships.p ? G?.ship : G?.enemy; if(!sh) return null;
  const lp = M.group.worldToLocal(hit.point.clone()); const x = lp.x + M.mx, y = lp.z + M.my;
  GRAB.holoHit[i] = { x, y, point:hit.point, dist:hit.distance };
  GRAB.ring.visible = true; GRAB.ring.position.copy(hit.point); GRAB.ring.position.y += .004; GRAB.ring.scale.setScalar(holo.top.scale.x);
  return GRAB.holoHit[i];
}
