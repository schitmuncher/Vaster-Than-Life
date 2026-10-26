'use strict';
/* =========================================================================
   Multiplayer networking, free and serverless:
   - Players connect directly, browser to browser, over WebRTC data channels
     (a reliable channel for game state, a fast lossy one for head and hand poses).
   - To find each other they swap connection details through free public
     meeting points: the PeerJS cloud server and a few Nostr relays, both at
     once, whichever answers first. Room codes are 5 letters; the host's id is
     made from the code, so joining needs nothing but the code.
   - Same-device testing uses a BroadcastChannel instead (two tabs).
   - Star layout: guests connect to the host, the host relays what others need.
   Also here: a small Nostr client (public lobby list, scoreboards).
   ========================================================================= */
const NET_V = 2;                       // bump when messages change shape
const NET_CODE_CH = 'ACDEFGHJKLMNPQRTUVWXY3479';
const NET_COLORS = ['#ffb547', '#5fd3e6', '#7be0a0', '#ff8ad8'];
const NOSTR_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://nostr.mom', 'wss://relay.nostr.band'];
const NET = { on:false, role:null, code:null, mode:null, id:null, hostId:null, name:'', status:'', error:'', public:false, max:4,
  peers:new Map(), sig:[], handlers:{}, players:[], pending:new Map(), answered:new Map(), started:0, joinT:null, retryT:null };

function netName(){ return typeof mpName==='function' ? mpName() : ((PROFILE.mpName || '').trim() || 'Captain'); }
function netDev(){ return typeof inXR==='function' && inXR() ? 'vr' : (typeof MOB!=='undefined' && MOB.touch) ? 'touch' : 'flat'; }
function netMakeCode(){ let s = ''; for(let i=0;i<5;i++) s += NET_CODE_CH[Math.floor(Math.random()*NET_CODE_CH.length)]; return s; }
function netCleanCode(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g,'0').replace(/I/g,'1').slice(0, 5); }
function netIce(){ const L = [{ urls:'stun:stun.l.google.com:19302' }, { urls:'stun:stun.cloudflare.com:3478' }];
  if(SET.turnUrl) L.push({ urls:SET.turnUrl.split(',').map(s => s.trim()).filter(Boolean), username:SET.turnUser||'', credential:SET.turnPass||'' }); return L; }
function netOn(type, fn){ NET.handlers[type] = fn; }
function netLog(t){ NET.status = t; if(typeof console!=='undefined') console.log('[net]', t); }

/* ---------------- signalling: three interchangeable meeting points ---------------- */
function sigLocal(){
  let bc = null; const S = { kind:'local', ok:false,
    start(){ bc = new BroadcastChannel('vtl-sig-' + NET.code); bc.onmessage = e => { const o = e.data; if(!o || o.from===NET.id || (o.to && o.to!==NET.id)) return; netSignal(o, S); }; S.ok = true; return Promise.resolve(true); },
    send(o){ if(bc) bc.postMessage(o); }, stop(){ if(bc) bc.close(); bc = null; S.ok = false; } };
  return S;
}
/* PeerJS cloud server protocol: our messages ride inside OFFER / ANSWER / CANDIDATE payloads */
function sigPeerJS(){
  let ws = null, hb = null; const S = { kind:'peerjs', ok:false,
    start(){ return new Promise(res => {
      const host = SET.peerHost || '0.peerjs.com', url = `wss://${host}/peerjs?key=peerjs&id=${encodeURIComponent(NET.id)}&token=${Math.random().toString(36).slice(2)}&version=1.5.4`;
      try{ ws = new WebSocket(SET.peerUrl ? `${SET.peerUrl}?key=peerjs&id=${encodeURIComponent(NET.id)}&token=t` : url); }catch(e){ res(false); return; }
      const fail = setTimeout(() => res(false), 8000);
      ws.onmessage = e => { let m; try{ m = JSON.parse(e.data); }catch(x){ return; }
        if(m.type==='OPEN'){ S.ok = true; clearTimeout(fail); hb = setInterval(() => { try{ ws.send(JSON.stringify({ type:'HEARTBEAT' })); }catch(x){} }, 5000); res(true); }
        else if(m.type==='ID-TAKEN'){ S.taken = true; clearTimeout(fail); res(false); }
        else if(m.type==='ERROR' || m.type==='INVALID-KEY'){ clearTimeout(fail); res(false); }
        else if(m.type==='EXPIRE'){ if(NET.role==='guest' && !NET.peers.size) S.expired = true; }
        else if(m.payload && (m.type==='OFFER' || m.type==='ANSWER' || m.type==='CANDIDATE')){ const o = m.payload; if(o && o.from!==NET.id) netSignal(o, S); } };
      ws.onclose = () => { S.ok = false; clearInterval(hb); };
      ws.onerror = () => { clearTimeout(fail); res(false); }; }); },
    send(o){ if(!ws || ws.readyState!==1 || !o.to) return; ws.send(JSON.stringify({ type: o.k==='offer' ? 'OFFER' : o.k==='answer' ? 'ANSWER' : 'CANDIDATE', dst:o.to, payload:o })); },
    stop(){ clearInterval(hb); try{ if(ws) ws.close(); }catch(e){} ws = null; S.ok = false; } };
  return S;
}
/* Nostr relays: encrypted, short-lived events tagged with a hash of the room code */
const SIG_KIND = 24133;
function sigNostr(){
  let sub = null, topic = null; const S = { kind:'nostr', ok:false,
    async start(){ topic = NC.hex(await NC.sha256('vtl-topic:' + NET.code)).slice(0, 40);
      sub = nostrSub([{ kinds:[SIG_KIND], '#t':[topic], since:Math.floor(Date.now()/1000) - 30 }], async ev => { const o = await NC.open(NET.code, ev.content); if(!o || o.from===NET.id || (o.to && o.to!==NET.id)) return; netSignal(o, S); });
      S.ok = await nostrReady(6000); return S.ok; },
    async send(o){ if(!topic) return; nostrPublish({ kind:SIG_KIND, tags:[['t', topic]], content:await NC.seal(NET.code, o) }); },
    stop(){ if(sub) nostrClose(sub); sub = null; S.ok = false; } };
  return S;
}
function netSigKinds(){ const want = SET.netSignal || 'auto'; if(want==='local' || /[?&]net=local/.test(location.search)) return ['local']; if(want==='peerjs') return ['peerjs']; if(want==='nostr') return ['nostr']; return ['peerjs', 'nostr']; }
async function netStartSignals(){
  NET.sig = netSigKinds().map(k => k==='local' ? sigLocal() : k==='peerjs' ? sigPeerJS() : sigNostr());
  const ok = await Promise.all(NET.sig.map(s => s.start().catch(() => false)));
  return { any:ok.some(Boolean), taken:NET.sig.some(s => s.taken) };
}
function netSigSend(o, via){ for(const s of (via ? [via] : NET.sig)) if(s.ok) try{ s.send(o); }catch(e){} }

/* ---------------- WebRTC peers ---------------- */
function netWaitIce(pc, ms){ return new Promise(res => { if(pc.iceGatheringState==='complete') return res(); const t = setTimeout(res, ms); pc.addEventListener('icegatheringstatechange', () => { if(pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }); }); }
function netNewPeer(id, info){
  const P = { id, name:info?.name || '?', dev:info?.dev || 'flat', color:info?.color || NET_COLORS[0], role:info?.role || 'crew', pc:null, dc:null, du:null, open:false, last:performance.now(), rtt:0, chunks:{}, inbox:[] };
  NET.peers.set(id, P); return P;
}
function netWire(P, ch){
  if(ch.label==='u') P.du = ch; else P.dc = ch;
  ch.onopen = () => { if(ch.label==='r'){ P.open = true; P.last = performance.now(); netPeerOpen(P); } };
  ch.onclose = () => { if(ch.label==='r') netPeerGone(P, 'closed'); };
  ch.onmessage = e => { P.last = performance.now(); let m; try{ m = JSON.parse(e.data); }catch(x){ return; }
    if(m._c){ const c = P.chunks[m._c] = P.chunks[m._c] || []; c[m.i] = m.d; if(c.filter(x => x!=null).length===m.n){ delete P.chunks[m._c]; try{ m = JSON.parse(c.join('')); }catch(x){ return; } } else return; }
    netDispatch(m, P); };
}
function netPC(P){
  const pc = new RTCPeerConnection({ iceServers:netIce() }); P.pc = pc;
  pc.ondatachannel = e => netWire(P, e.channel);
  pc.onconnectionstatechange = () => { if(['failed','closed'].includes(pc.connectionState)) netPeerGone(P, pc.connectionState); };
  pc.ontrack = e => { if(typeof netVoiceTrack==='function') netVoiceTrack(P, e); };
  pc.onnegotiationneeded = async () => { if(!P.open) return; try{ P.making = true; await pc.setLocalDescription(); netSend({ t:'rtc', d:pc.localDescription.toJSON() }, P.id); }catch(e){} finally{ P.making = false; } };
  return pc;
}
/* renegotiation over the data channel (used when voice is switched on mid-session); the guest is the polite side */
async function netRtc(m, P){ const pc = P.pc, d = m.d; if(!pc || !d) return;
  try{ if(d.type==='offer'){ const glare = P.making || pc.signalingState!=='stable'; if(glare && NET.role==='host') return; if(glare) await pc.setLocalDescription({ type:'rollback' });
      await pc.setRemoteDescription(d); await pc.setLocalDescription(); netSend({ t:'rtc', d:pc.localDescription.toJSON() }, P.id); }
    else await pc.setRemoteDescription(d); }catch(e){} }

/* guest: one connection attempt, offered through every meeting point at once */
async function netGuestOffer(){
  const P = netNewPeer(NET.hostId, { name:'Host' }); const pc = netPC(P);
  netWire(P, pc.createDataChannel('r', { ordered:true })); netWire(P, pc.createDataChannel('u', { ordered:false, maxRetransmits:0 }));
  await pc.setLocalDescription(await pc.createOffer()); await netWaitIce(pc, 3500);
  const cid = Math.random().toString(36).slice(2), msg = { k:'offer', from:NET.id, to:NET.hostId, cid, sdp:pc.localDescription.sdp, v:NET_V, name:NET.name, dev:netDev() };
  NET.pending.set(cid, P); netSigSend(msg);
  let tries = 0; clearInterval(NET.retryT);
  NET.retryT = setInterval(() => { if(P.open || !NET.on){ clearInterval(NET.retryT); return; } if(++tries > 7){ clearInterval(NET.retryT); netFail(NET.sig.some(s => s.expired) ? 'No game with that code is open.' : 'Could not reach the host. Check the code, or try again.'); return; } netSigSend(msg); }, 3500);
}
/* host: answer each offer once, through the meeting point it came from */
async function netSignal(o, via){
  if(!NET.on) return;
  if(o.k==='offer' && NET.role==='host' && o.to===NET.id){
    if(NET.answered.has(o.cid)){ netSigSend(NET.answered.get(o.cid), via); return; }
    if(o.v!==NET_V){ netSigSend({ k:'nope', from:NET.id, to:o.from, why:'Different game versions. Both players should reload the game.' }, via); return; }
    if([...NET.peers.values()].filter(p => p.open).length >= NET.max - 1){ netSigSend({ k:'nope', from:NET.id, to:o.from, why:'That game is full.' }, via); return; }
    const old = NET.peers.get(o.from); if(old){ try{ old.pc.close(); }catch(e){} NET.peers.delete(o.from); }
    const P = netNewPeer(o.from, { name:o.name, dev:o.dev }); const pc = netPC(P);
    await pc.setRemoteDescription({ type:'offer', sdp:o.sdp }); await pc.setLocalDescription(await pc.createAnswer()); await netWaitIce(pc, 3500);
    const ans = { k:'answer', from:NET.id, to:o.from, cid:o.cid, sdp:pc.localDescription.sdp }; NET.answered.set(o.cid, ans); netSigSend(ans, via); return; }
  if(o.k==='answer' && NET.role==='guest'){ const P = NET.pending.get(o.cid); if(!P || P.pc.remoteDescription) return; try{ await P.pc.setRemoteDescription({ type:'answer', sdp:o.sdp }); }catch(e){} return; }
  if(o.k==='nope' && NET.role==='guest'){ netFail(o.why || 'The host turned the connection down.'); }
}

/* ---------------- sessions ---------------- */
async function netHost(mode, o={}){
  netLeave(true); NET.on = true; NET.role = 'host'; NET.mode = mode; NET.max = o.max || 4; NET.public = !!o.public; NET.name = netName(); NET.error = ''; NET.started = Date.now();
  for(let tries=0; tries<4; tries++){
    NET.code = o.code || netMakeCode(); NET.id = NET.hostId = 'vtl-' + NET.code; netLog('Opening room ' + NET.code + '…');
    const r = await netStartSignals(); if(!NET.on) return false;
    if(r.taken && !o.code){ netStopSignals(); continue; }
    if(!r.any){ netFail('Could not reach a meeting server. Check your internet connection.'); return false; }
    break; }
  NET.players = [{ id:NET.id, name:NET.name, color:NET_COLORS[0], dev:netDev(), role:o.role || 'captain', host:true, ready:true }];
  netLog('Room ' + NET.code + ' is open.'); if(NET.public && typeof netAdvertise==='function') netAdvertise();
  return true;
}
async function netJoin(code, o={}){
  netLeave(true); code = netCleanCode(code); if(code.length < 5){ NET.error = 'Room codes have 5 letters.'; return false; }
  NET.on = true; NET.role = 'guest'; NET.code = code; NET.hostId = 'vtl-' + code; NET.id = 'vtl-' + code + '-' + Math.random().toString(36).slice(2, 8); NET.name = netName(); NET.error = ''; NET.mode = null;
  netLog('Looking for room ' + code + '…');
  const r = await netStartSignals(); if(!NET.on) return false;
  if(!r.any){ netFail('Could not reach a meeting server. Check your internet connection.'); return false; }
  clearTimeout(NET.joinT); NET.joinT = setTimeout(() => { if(NET.on && NET.role==='guest' && !NET.welcomed) netFail('The host did not answer.'); }, 30000);
  netGuestOffer(); return true;
}
function netStopSignals(){ for(const s of NET.sig) try{ s.stop(); }catch(e){} NET.sig = []; }
function netLeave(quiet){
  if(NET.on){ try{ netSend({ t:'bye' }); }catch(e){} }
  clearInterval(NET.retryT); clearTimeout(NET.joinT); netStopSignals();
  for(const P of NET.peers.values()){ try{ P.pc.close(); }catch(e){} }
  NET.peers.clear(); NET.pending.clear(); NET.answered.clear();
  const was = NET.on; NET.on = false; NET.role = null; NET.mode = null; NET.welcomed = false; NET.players = [];
  if(was && typeof netEnded==='function') netEnded(quiet);
}
function netFail(why){ NET.error = why; netLog(why); const keep = NET.error; netLeave(true); NET.error = keep; if(typeof toast==='function') toast(why); }

/* ---------------- messages ---------------- */
function netRaw(P, m, fast){ const ch = fast ? P.du : P.dc; if(!ch || ch.readyState!=='open') return false;
  if(fast){ if(ch.bufferedAmount > 64e3) return false; try{ ch.send(JSON.stringify(m)); }catch(e){ return false; } return true; }
  const s = JSON.stringify(m);
  if(s.length <= 15000){ try{ ch.send(s); }catch(e){ return false; } return true; }
  const id = Math.random().toString(36).slice(2, 9), n = Math.ceil(s.length/15000);
  for(let i=0;i<n;i++) try{ ch.send(JSON.stringify({ _c:id, i, n, d:s.slice(i*15000, (i+1)*15000) })); }catch(e){ return false; }
  return true; }
/* to: a peer id, or nothing (host: every guest; guest: the host). except: skip this peer */
function netSend(m, to, except){ m.f = m.f || NET.id; let n = 0; for(const P of NET.peers.values()){ if(!P.open || (to && P.id!==to) || P.id===except) continue; if(netRaw(P, m, false)) n++; } return n; }
function netFast(m, to, except){ m.f = m.f || NET.id; for(const P of NET.peers.values()){ if(!P.open || (to && P.id!==to) || P.id===except) continue; netRaw(P, m, true); } }
function netBuffered(id){ const P = NET.peers.get(id); return P && P.dc ? P.dc.bufferedAmount : 0; }
function netDispatch(m, P){
  if(m.t==='ping'){ netFast({ t:'pong', ts:m.ts }, P.id); return; }
  if(m.t==='pong'){ P.rtt = Math.round(performance.now() - m.ts); return; }
  if(m.t==='rtc'){ netRtc(m, P); return; }
  if(m.t==='bye'){ netPeerGone(P, 'left'); return; }
  const h = NET.handlers[m.t]; if(h) try{ h(m, P); }catch(e){ console.error('[net] handler', m.t, e); }
}
function netPeerOpen(P){
  if(typeof voiceNewPeer==='function') setTimeout(() => voiceNewPeer(P), 300);
  if(NET.role==='guest'){ clearInterval(NET.retryT); netStopSignalsSoon(); netSend(Object.assign({ t:'join', v:NET_V, name:NET.name, dev:netDev() }, typeof mpJoinInfo==='function' ? mpJoinInfo() : {})); netLog('Connected. Joining…'); }
  else netLog(P.name + ' connected.');
}
/* once connected, the meeting servers are no longer needed by a guest */
function netStopSignalsSoon(){ setTimeout(() => { if(NET.role==='guest' && NET.peers.get(NET.hostId)?.open) netStopSignals(); }, 4000); }
function netPeerGone(P, why){
  if(!NET.peers.has(P.id)) return; NET.peers.delete(P.id); try{ P.pc.close(); }catch(e){}
  if(NET.role==='guest' && P.id===NET.hostId){ const was = NET.welcomed; netFail(was ? 'Lost the connection to the host.' : 'Could not connect to the host.'); return; }
  if(NET.role==='host'){ NET.players = NET.players.filter(p => p.id!==P.id); if(typeof netPlayerLeft==='function') netPlayerLeft(P, why); netSend({ t:'players', list:NET.players }); }
}
/* keepalive and round-trip times; drop peers that go silent */
let NET_PINGT = 0;
function netTick(dt){
  if(!NET.on) return; NET_PINGT += dt;
  if(NET_PINGT > 2){ NET_PINGT = 0; const now = performance.now();
    for(const P of [...NET.peers.values()]){ if(!P.open) continue; netFast({ t:'ping', ts:now }, P.id); if(now - P.last > 15000) netPeerGone(P, 'timeout'); } }
}

/* ---------------- a small Nostr client: lobby list, scoreboards, signalling ---------------- */
const NOSTR = { socks:{}, subs:{}, seen:new Set(), sk:null, queue:[] };
function nostrKey(){ if(!PROFILE.nostrSk){ PROFILE.nostrSk = NC.newKey(); saveProfile(); } return PROFILE.nostrSk; }
function nostrRelays(){ const s = (SET.nostrRelays || '').split(',').map(x => x.trim()).filter(x => /^wss?:\/\//.test(x)); return s.length ? s : NOSTR_RELAYS; }
function nostrConnect(){
  for(const url of nostrRelays()){
    const S = NOSTR.socks[url]; if(S && (S.ws.readyState===0 || S.ws.readyState===1)) continue;
    if(S && performance.now() < S.retryAt) continue;
    let ws; try{ ws = new WebSocket(url); }catch(e){ continue; }
    const sock = NOSTR.socks[url] = { ws, url, retryAt:0, fails:(S?.fails||0) };
    ws.onopen = () => { sock.fails = 0; for(const id in NOSTR.subs) ws.send(JSON.stringify(['REQ', id, ...NOSTR.subs[id].filters])); for(const m of NOSTR.queue) ws.send(m); };
    ws.onmessage = e => { let m; try{ m = JSON.parse(e.data); }catch(x){ return; }
      if(m[0]==='EVENT'){ const sub = NOSTR.subs[m[1]], ev = m[2]; if(!sub || !ev || NOSTR.seen.has(m[1] + ev.id)) return; NOSTR.seen.add(m[1] + ev.id); try{ sub.on(ev, url); }catch(x){} }
      else if(m[0]==='EOSE'){ const sub = NOSTR.subs[m[1]]; if(sub && sub.eose){ sub.eoseN = (sub.eoseN||0) + 1; if(sub.eoseN===1) setTimeout(() => sub.eose && sub.eose(), 600); } } };
    ws.onclose = () => { sock.fails++; sock.retryAt = performance.now() + Math.min(60000, 2000*sock.fails); };
    ws.onerror = () => {};
  }
}
function nostrOpenCount(){ return Object.values(NOSTR.socks).filter(s => s.ws.readyState===1).length; }
function nostrReady(ms){ nostrConnect(); return new Promise(res => { const t0 = performance.now(); const iv = setInterval(() => { if(nostrOpenCount() > 0){ clearInterval(iv); res(true); } else if(performance.now() - t0 > ms){ clearInterval(iv); res(false); } }, 100); }); }
function nostrSub(filters, on, eose){ nostrConnect(); const id = 'v' + Math.random().toString(36).slice(2, 10); NOSTR.subs[id] = { filters, on, eose };
  for(const s of Object.values(NOSTR.socks)) if(s.ws.readyState===1) s.ws.send(JSON.stringify(['REQ', id, ...filters])); return id; }
function nostrClose(id){ delete NOSTR.subs[id]; for(const s of Object.values(NOSTR.socks)) if(s.ws.readyState===1) try{ s.ws.send(JSON.stringify(['CLOSE', id])); }catch(e){} }
async function nostrPublish(tpl){ nostrConnect(); const ev = await NC.signEvent(tpl, nostrKey()); const m = JSON.stringify(['EVENT', ev]); let n = 0;
  for(const s of Object.values(NOSTR.socks)) if(s.ws.readyState===1){ s.ws.send(m); n++; }
  if(!n){ NOSTR.queue.push(m); if(NOSTR.queue.length > 20) NOSTR.queue.shift(); } return ev; }

/* ---------------- the public room list ---------------- */
const LOBBY_KIND = 30078, LOBBY_TAG = 'vtl-lobby-v1';
let NET_ADV = null;
async function netAdvertise(closed){
  if(NET.role!=='host' || !NET.public) return; clearTimeout(NET_ADV);
  const now = Math.floor(Date.now()/1000);
  nostrPublish({ kind:LOBBY_KIND, tags:[['d', 'vtl-lobby-' + NET.code], ['t', LOBBY_TAG], ['expiration', String(now + 240)]],
    content:JSON.stringify({ code:NET.code, mode:NET.mode, name:NET.name, players:NET.players.length, max:NET.max, v:NET_V, closed:!!closed, at:now, live:!!(G && UI.screen==='game') }) });
  if(!closed) NET_ADV = setTimeout(() => { if(NET.on && NET.role==='host') netAdvertise(); }, 90000);
}
function netBrowse(onList){
  const rooms = new Map(); const now = () => Math.floor(Date.now()/1000);
  const sub = nostrSub([{ kinds:[LOBBY_KIND], '#t':[LOBBY_TAG], since:now() - 600, limit:100 }], ev => {
    let c; try{ c = JSON.parse(ev.content); }catch(e){ return; } if(!c || !c.code || c.v!==NET_V) return;
    const exp = +(ev.tags.find(t => t[0]==='expiration')?.[1] || 0); const prev = rooms.get(c.code);
    if(prev && prev.at > c.at) return; rooms.set(c.code, Object.assign(c, { exp }));
    onList([...rooms.values()].filter(r => !r.closed && (!r.exp || r.exp > now())).sort((a,b) => b.at - a.at)); });
  return () => nostrClose(sub);
}
