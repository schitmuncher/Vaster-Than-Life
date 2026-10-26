'use strict';
/* =========================================================================
   Together in VR, and talking.
   - Avatars: in a shared-ship game, each headset sends where its head and
     hands are (relative to the bridge, or to the enemy ship when beamed
     over) fifteen times a second. Other headsets draw a simple helmet, hands
     and a name tag in that player's colour. Flat-screen players see a marker
     in the room a VR player is standing in.
   - Voice: an optional microphone, sent straight to the other players over
     the same connection. The host passes each voice on to everyone else.
   ========================================================================= */
const AV = { sendT:0, peers:{}, objs:{}, geo:null };
function avShared(){ return NET.on && ['coop','nav','away'].includes(NET.mode); }
const r3 = v => Math.round(v*1000)/1000;
function avRoomAt(I, worldPos){ if(!I || !I.group.visible) return -1; const L = I.group.worldToLocal(worldPos.clone()); const c = localCell(I, L.x, L.z); const ri = I.sh.cellRoom[Math.round(c.x)+','+Math.round(c.y)]; return ri==null ? -1 : ri; }
function avSend(dt){
  if(!avShared() || typeof inXR!=='function' || !inXR() || !bridge) return;
  AV.sendT -= dt; if(AV.sendT > 0) return; AV.sendT = 1/15;
  const aboard = !!(IN.aboard && IN.foe), ref = aboard ? IN.foe.group : bridge.group, head = headWorld();
  const h = ref.worldToLocal(head.clone()), q = camera.getWorldQuaternion(new THREE.Quaternion()), rq = ref.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q);
  const hand = i => { const c = controllers[i]; if(!c || !c.visible) return null; const p = ref.worldToLocal(c.getWorldPosition(new THREE.Vector3())); return [r3(p.x), r3(p.y), r3(p.z)]; };
  const rm = aboard ? avRoomAt(IN.foe, head) : avRoomAt(IN.own, head);
  netFast({ t:'pose', id:NET.id, a:aboard ? 1 : 0, h:[r3(h.x), r3(h.y), r3(h.z)], q:[r3(rq.x), r3(rq.y), r3(rq.z), r3(rq.w)], l:hand(0), r:hand(1), rm, sk:aboard ? 'enemy' : 'ship' });
}
netOn('pose', (m, P) => { const id = m.id || P.id; if(id===NET.id) return; if(NET.role==='host') netFast(m, null, P.id); AV.peers[id] = { m, t:performance.now() }; });
function avMake(id){
  const p = mpPlayer(id); const col = new THREE.Color(p ? p.color : '#ffffff');
  if(!AV.geo) AV.geo = { head:new THREE.SphereGeometry(.13, 20, 14), visor:new THREE.SphereGeometry(.105, 20, 10, -Math.PI*.42, Math.PI*.84, Math.PI*.3, Math.PI*.38), hand:new THREE.SphereGeometry(.045, 12, 8), body:new THREE.CylinderGeometry(.13, .18, .62, 14, 1, true) };
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color:col, roughness:.45, metalness:.3, emissive:col, emissiveIntensity:.15 });
  const head = new THREE.Mesh(AV.geo.head, mat), visor = new THREE.Mesh(AV.geo.visor, new THREE.MeshStandardMaterial({ color:0x0b1530, roughness:.1, metalness:.8, emissive:0x2a4a8a, emissiveIntensity:.4 }));
  visor.scale.set(1.25, 1.05, 1.3); visor.rotation.y = Math.PI; visor.position.z = -.02; head.add(visor);
  const body = new THREE.Mesh(AV.geo.body, new THREE.MeshStandardMaterial({ color:col, roughness:.7, transparent:true, opacity:.55 }));
  const L = new THREE.Mesh(AV.geo.hand, mat), Rr = new THREE.Mesh(AV.geo.hand, mat);
  const c = mkCanvas(384, 72), x = c.getContext('2d'); x.fillStyle = 'rgba(8,12,24,.85)'; if(x.roundRect){ x.beginPath(); x.roundRect(2, 2, 380, 68, 18); x.fill(); } x.font = "700 40px 'Chakra Petch', sans-serif"; x.textAlign = 'center'; x.fillStyle = p ? p.color : '#fff'; x.fillText((p ? p.name : 'Crew').slice(0, 18), 192, 50);
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map:texFrom(c), transparent:true, depthWrite:false })); tag.scale.set(.42, .08, 1);
  g.add(head, body, L, Rr, tag); return { g, head, body, L, R:Rr, tag, mat };
}
function avUpdate(dt){
  if(!avShared() || !bridge) { for(const id in AV.objs){ AV.objs[id].g.parent?.remove(AV.objs[id].g); } AV.objs = {}; return; }
  avSend(dt);
  const now = performance.now(), k = Math.min(1, dt*12);
  for(const id in AV.peers){ const e = AV.peers[id], m = e.m;
    let o = AV.objs[id]; const stale = now - e.t > 4000 || !mpPlayer(id);
    if(stale){ if(o){ o.g.parent?.remove(o.g); delete AV.objs[id]; } if(now - e.t > 10000) delete AV.peers[id]; continue; }
    if(!o) o = AV.objs[id] = avMake(id);
    // stand on the bridge, or inside the enemy ship when they've beamed over (only visible to someone there too)
    const parent = m.a ? (IN.foe ? IN.foe.group : null) : bridge.group;
    if(!parent){ o.g.visible = false; continue; } if(o.g.parent!==parent) parent.add(o.g); o.g.visible = !!m.a === !!IN.aboard;
    const hp = new THREE.Vector3(m.h[0], m.h[1], m.h[2]); o.head.position.lerp(hp, k);
    const tq = new THREE.Quaternion(m.q[0], m.q[1], m.q[2], m.q[3]); o.head.quaternion.slerp(tq, k);
    o.body.position.set(o.head.position.x, o.head.position.y - .48, o.head.position.z);
    o.tag.position.set(o.head.position.x, o.head.position.y + .26, o.head.position.z);
    for(const [mesh, v] of [[o.L, m.l], [o.R, m.r]]){ mesh.visible = !!v; if(v) mesh.position.lerp(new THREE.Vector3(v[0], v[1], v[2]), k); }
  }
}
/* flat screens: where the VR players are standing */
function drawAvatarMarkers(){
  if(!avShared() || !G || UI.screen!=='game' || G.modal) return;
  const now = performance.now();
  for(const id in AV.peers){ const e = AV.peers[id], m = e.m; if(now - e.t > 3000 || m.rm==null || m.rm < 0) continue; const sh = m.sk==='enemy' ? G.enemy : G.ship, p = mpPlayer(id); if(!sh || !p || !sh._rects || !sh._rects[m.rm]) continue;
    const q = sh._rects[m.rm], x = q.x + q.w - 16, y = q.y + 16;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = p.color; ctx.fill(); ctx.strokeStyle = '#0b0f1c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#0b1530'; ctx.fillRect(x - 7, y - 4, 14, 6); T('VR', x, y + 23, { s:10, f:FD, w:700, a:'center', c:p.color });
    tip(x - 12, y - 12, 24, 24, `${p.name} (VR)`, m.a ? 'Beamed aboard the enemy ship.' : 'Walking around inside your ship.'); }
}

/* ---------------- voice ---------------- */
const VCHAT = { on:false, stream:null, remote:[], els:{}, meter:0 };
async function voiceToggle(){
  if(VCHAT.on){ voiceStop(); return; }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('This browser has no microphone access.'); return; }
  try{ VCHAT.stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true } }); }
  catch(e){ toast('The microphone was not allowed.'); return; }
  VCHAT.on = true; const tr = VCHAT.stream.getAudioTracks()[0];
  for(const P of NET.peers.values()) voiceSendTo(P, tr, VCHAT.stream);
  netSend({ t:'vo', on:true, id:NET.id }); toast('Voice on: the others can hear you.'); sfx('power');
}
function voiceStop(){
  for(const P of NET.peers.values()){ for(const s of P.vsend||[]) if(s.track===VCHAT.stream?.getAudioTracks()[0]) try{ P.pc.removeTrack(s); }catch(e){} P.vsend = (P.vsend||[]).filter(s => s.track && s.track.readyState==='live'); }
  if(VCHAT.stream) for(const t of VCHAT.stream.getTracks()) t.stop(); VCHAT.stream = null; VCHAT.on = false; netSend({ t:'vo', on:false, id:NET.id }); toast('Voice off.'); sfx('unpower');
}
function voiceSendTo(P, track, stream){ if(!P || !P.pc || !P.open || !track) return; if((P.vsend||[]).some(s => s.track===track)) return; try{ const s = P.pc.addTrack(track, stream); (P.vsend = P.vsend || []).push(s); }catch(e){} }
/* net.js hands us each incoming voice */
function netVoiceTrack(P, e){
  if(e.track.kind!=='audio') return; const stream = (e.streams && e.streams[0]) || new MediaStream([e.track]);
  const key = P.id + ':' + e.track.id; if(VCHAT.els[key]) return;
  const el = new Audio(); el.autoplay = true; el.srcObject = stream; el.play().catch(() => {}); VCHAT.els[key] = el;
  e.track.addEventListener('ended', () => { el.srcObject = null; delete VCHAT.els[key]; });
  if(NET.role==='host'){ VCHAT.remote.push({ from:P.id, track:e.track, stream }); for(const Q of NET.peers.values()) if(Q.id!==P.id) voiceSendTo(Q, e.track, stream); }
}
/* someone joins after voices are on: the host passes them along */
function voiceNewPeer(P){
  if(VCHAT.on && VCHAT.stream) voiceSendTo(P, VCHAT.stream.getAudioTracks()[0], VCHAT.stream);
  if(NET.role==='host') for(const r of VCHAT.remote) if(r.from!==P.id && r.track.readyState==='live') voiceSendTo(P, r.track, r.stream);
}
netOn('vo', (m, P) => { const id = m.id || P.id; if(NET.role==='host') netSend(m, null, P.id); const p = mpPlayer(id); if(p){ p.voice = !!m.on; mpFeed(`${p.name} ${m.on ? 'turned voice on' : 'turned voice off'}.`, p.color); } });
function voiceButton(x, y, w, h){ btn(x, y, w, h, VCHAT.on ? '🎤 On' : '🎤 Voice', () => voiceToggle(), { s:Math.min(15, h*.6), col:VCHAT.on ? C.good : C.muted, fill:VCHAT.on, loc:true }); }
