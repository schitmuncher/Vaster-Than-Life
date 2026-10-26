'use strict';
/* =========================================================================
   Shared-ship multiplayer: one host runs the game, everyone else sees a copy
   (co-op crew, navigator, away team, spectators, the hunter's commander).
   - The host, ten times a second, works out what changed since the last send
     and sends only that (a "patch"), together with the sounds, toasts and
     sparks the game made meanwhile.
   - Guests apply each patch to their copy. Whatever a guest does to that copy
     (power, targets, doors, crew orders, upgrades, store buys, VR hands-on
     work) is spotted by comparing it with how it looked a moment ago, and sent
     to the host as a small change. Until the host confirms it, the guest keeps
     showing their own change, so clicks feel instant.
   - Pop-ups everyone shares (events, results, surrender offers) are run by the
     host: a guest's click on one is sent as "this button was pressed".
   - The map, ship screen and store are each player's own window, so two
     players can browse different things at once.
   ========================================================================= */
const SYNC = { on:false, host:false, guest:false, spect:false, prev:null, S:null, B:null, smodal:null, overlay:null, u:{}, mid:0,
  seq:0, pend:[], cmdq:[], acks:{}, out:[], relay:false, inShared:false, sendT:0, capT:0, ptrT:0, dirty:false, ptrs:{}, react:[], says:[], lastPtr:'', team:'p', run:0 };
const BROWSE = new Set(['map','ship','store']);
const SKIPK = new Set(['adj','aiT','restT','stSig','fireOut','fireDmg','lastSay','fx','modal','brk','capMan']);
const KEYED = new Set(['crew','proj','units','dna']);
const NOUPD = new Set(['t','ang']);   // the guest animates these itself once the thing exists
const QK = { o2:10, hp:10, charge:100, x:100, y:100, t:100, ang:100, shieldT:100, superT:100, ionT:10, passT:10, fleeT:10, cd:10, pulseT:10, mcT:10, stunT:10, manualT:10, combatT:10, time:100, warp:100, shake:100, flash:100, fleetX:1000 };
const DELTA = new Set(['scrap','fuel','missiles','parts','hp','hull','fire','fireP','breach','breachP','sab','dmg','rep','power']);
const CAP_IGN = new Set(['x','y','t','ang','time','warp','look','gender','path','tx','ty','hitAt','hitN','scorch','shake','flash']);
const DEL = { '$-':1 };
const CAPM = { ign:CAP_IGN, delta:DELTA, cap:true };

/* ---------------- plain copies, differences and patches ---------------- */
function qn(v, k){ if(Number.isInteger(v)) return v; if(!isFinite(v)) return 0; const m = QK[k] || 1000; return Math.round(v*m)/m; }
function skipKey(k){ return k.charCodeAt(0)===95 /* _ */ || k.charCodeAt(0)===36 /* $ */ || SKIPK.has(k); }
function san(v, k){
  if(v===null) return null; const t = typeof v;
  if(t==='number') return qn(v, k); if(t==='string' || t==='boolean') return v; if(t!=='object') return undefined;
  if(Array.isArray(v)){ const a = new Array(v.length); for(let i=0;i<v.length;i++){ const s = san(v[i], k); a[i] = s===undefined ? null : s; } return a; }
  const o = {}; for(const key in v){ if(skipKey(key)) continue; const s = san(v[key], key); if(s!==undefined) o[key] = s; } return o;
}
function isNode(c){ return c!==null && typeof c==='object' && !Array.isArray(c); }
function keyedOk(arr){ const s = new Set(); for(const e of arr){ if(!e || typeof e!=='object' || e.id==null) return false; const id = String(e.id); if(s.has(id)) return false; s.add(id); } return true; }
/* a: the old plain copy; b: the live value. Returns what to send, or undefined when nothing changed. */
function dif(a, b, k, M){
  if(b===undefined || typeof b==='function') return a===undefined ? undefined : DEL;
  if(b===null || typeof b!=='object'){
    if(typeof b==='number'){ b = qn(b, k); if(M && M.delta && typeof a==='number' && M.delta.has(k)){ const d = Math.round((b - a)*1000)/1000; return d ? { '$d':d } : undefined; } }
    return a===b ? undefined : b; }
  if(a===null || typeof a!=='object') return { '$=':san(b, k) };
  if(Array.isArray(b)){ if(!Array.isArray(a)) return { '$=':san(b, k) }; return KEYED.has(k) && keyedOk(b) ? difKeyed(a, b, k, M) : difIdx(a, b, k, M); }
  if(Array.isArray(a)) return { '$=':san(b, k) };
  if((b.uid!==undefined && a.uid!==b.uid) || (b.mid!==undefined && a.mid!==b.mid)) return { '$=':san(b, k) };
  let p;
  for(const key in b){ if(skipKey(key) || (M && M.ign && M.ign.has(key)) || (!M && NOUPD.has(key) && key in a)) continue;
    const c = dif(a[key], b[key], key, M); if(c!==undefined) (p = p || {})[key] = c; }
  for(const key in a){ if(!(key in b) && !(M && M.ign && M.ign.has(key))) (p = p || {})[key] = DEL; }
  return p;
}
function difIdx(a, b, k, M){
  let p; const n = b.length;
  if(a.length!==n) (p = {})['$#'] = n;
  for(let i=0;i<n;i++){ const c = dif(a[i], b[i]===undefined ? null : b[i], k, M); if(c!==undefined){ p = p || {}; (p['$@'] = p['$@'] || {})[i] = c; } }
  return p;
}
function difKeyed(a, b, k, M){
  let p; const am = new Map(); for(const e of a) if(e && e.id!=null) am.set(String(e.id), e);
  let same = a.length===b.length;
  for(let i=0;i<b.length;i++){ const e = b[i], id = String(e.id), pe = am.get(id);
    if(same && (!a[i] || String(a[i].id)!==id)) same = false;
    const c = pe ? dif(pe, e, k, M) : { '$=':san(e, k) };
    if(c!==undefined){ p = p || {}; (p['$K'] = p['$K'] || {})[id] = c; } }
  if(!same){ p = p || {}; p['$+'] = b.map(e => String(e.id)); }
  return p;
}
function applyChild(t, k, c){
  if(!isNode(c)){ t[k] = c; return; }
  if('$=' in c){ t[k] = clone(c['$=']); return; }
  if('$-' in c){ if(Array.isArray(t)) t[k] = null; else delete t[k]; return; }
  if('$d' in c){ t[k] = (typeof t[k]==='number' ? t[k] : 0) + c['$d']; return; }
  if('$K' in c || '$+' in c){ if(!Array.isArray(t[k])) t[k] = []; applyKeyed(t[k], c); return; }
  if('$#' in c || '$@' in c){ if(!Array.isArray(t[k])) t[k] = []; const arr = t[k];
    if('$#' in c) arr.length = c['$#']; const at = c['$@']; if(at) for(const i in at) applyChild(arr, +i, at[i]); return; }
  if(t[k]===null || typeof t[k]!=='object' || Array.isArray(t[k])) t[k] = {};
  const o = t[k]; for(const kk in c) applyChild(o, kk, c[kk]);
}
function applyKeyed(arr, c){
  const by = new Map(); for(const e of arr) if(e && e.id!=null) by.set(String(e.id), e);
  const K = c['$K'];
  if(K) for(const id in K){ const ch = K[id];
    if(isNode(ch) && '$=' in ch) by.set(id, clone(ch['$=']));
    else { const e = by.get(id); if(e){ const box = { v:e }; applyChild(box, 'v', ch); by.set(id, box.v); } } }
  const order = c['$+'];
  if(order){ const out = []; for(const id of order){ const e = by.get(String(id)); if(e) out.push(e); } arr.length = 0; for(const e of out) arr.push(e); }
  else if(K){ for(let i=0;i<arr.length;i++){ const e = arr[i]; if(e && e.id!=null){ const n = by.get(String(e.id)); if(n && n!==e) arr[i] = n; } } }
}
function applyPatch(t, p){ if(p) for(const k in p) applyChild(t, k, p[k]); }
/* make the live value t look like the plain value s, keeping the same objects where it can (the 3D scene holds on to them) */
function syncTo(t, s, k){
  if(s===null || typeof s!=='object') return s;
  if(Array.isArray(s)){
    if(!Array.isArray(t)) return clone(s);
    if(KEYED.has(k) && keyedOk(s)){ const by = new Map(); for(const e of t) if(e && e.id!=null) by.set(String(e.id), e);
      const out = s.map(se => { const te = by.get(String(se.id)); if(te && typeof te==='object' && !Array.isArray(te)){ syncObj(te, se); return te; } return clone(se); });
      t.length = 0; for(const e of out) t.push(e); return t; }
    t.length = s.length; for(let i=0;i<s.length;i++) t[i] = syncTo(t[i], s[i], k); return t; }
  if(!t || typeof t!=='object' || Array.isArray(t)) return clone(s);
  syncObj(t, s); return t;
}
function syncObj(t, s){
  for(const k in t){ if(!(k in s) && !skipKey(k) && typeof t[k]!=='function') delete t[k]; }
  for(const k in s) t[k] = syncTo(t[k], s[k], k);
}
/* the places a guest's change touched, so they can be put back to the host's version once the host has had its say */
function opTouches(p, path, out){
  for(const k in p){ const c = p[k], here = path.concat([k]);
    if(!isNode(c) || '$=' in c || '$-' in c || '$d' in c){ out.push(here); continue; }
    if('$+' in c || '$#' in c){ out.push(here); continue; }
    if('$K' in c){ for(const id in c['$K']){ const ch = c['$K'][id], pp = here.concat([{ id }]); if(isNode(ch) && !('$=' in ch) && !('$-' in ch)) opTouches(ch, pp, out); else out.push(pp); } continue; }
    if('$@' in c){ for(const i in c['$@']){ const ch = c['$@'][i], pp = here.concat([+i]); if(isNode(ch) && !['$=','$-','$d','$K','$+','$#','$@'].some(x => x in ch)) opTouches(ch, pp, out); else out.push(pp); } continue; }
    opTouches(c, here, out);
  }
}
function pathStep(o, s){ if(o==null || typeof o!=='object') return undefined; if(s!==null && typeof s==='object'){ if(!Array.isArray(o)) return undefined; return o.find(e => e && String(e.id)===s.id); } return o[s]; }
function syncPath(V, S, path){
  let v = V, s = S;
  for(let i=0;i<path.length-1;i++){ v = pathStep(v, path[i]); s = pathStep(s, path[i]); if(v==null || s==null || typeof v!=='object' || typeof s!=='object') return; }
  const last = path[path.length-1];
  if(last!==null && typeof last==='object'){ if(!Array.isArray(v) || !Array.isArray(s)) return;
    const vi = v.findIndex(e => e && String(e.id)===last.id), si = s.findIndex(e => e && String(e.id)===last.id);
    if(si<0){ if(vi>=0) v.splice(vi, 1); return; }
    if(vi<0){ v.push(clone(s[si])); return; }
    v[vi] = syncTo(v[vi], s[si], ''); return; }
  if(!(last in s) || s[last]===undefined){ if(Array.isArray(v)) v[last] = null; else delete v[last]; return; }
  v[last] = syncTo(v[last], s[last], typeof last==='string' ? last : '');
}

/* ---------------- who is in the session ---------------- */
function syncIsGuestPlayer(){ return SYNC.guest && !SYNC.spect; }
function mpMe(){ return NET.players.find(p => p.id===NET.id) || { id:NET.id, name:NET.name, color:NET_COLORS[0], role:'crew' }; }
function mpPlayer(id){ return NET.players.find(p => p.id===id); }
function mpColor(id){ return mpPlayer(id)?.color || C.muted; }

/* ---------------- the shared pop-up and each player's own windows ----------------
   G.modal is replaced by an accessor while a session runs: shared pop-ups live in SYNC.smodal (sent to everyone),
   the map, ship screen and store in SYNC.overlay (this player only). Shared ones show on top. */
function syncInstallModal(g){
  if(!g) return; const d = Object.getOwnPropertyDescriptor(g, 'modal'); if(d && d.get) return;
  const cur = g.modal; delete g.modal;
  Object.defineProperty(g, 'modal', { configurable:true, enumerable:false, get(){ return SYNC.smodal || SYNC.overlay || null; }, set(v){ syncSetModal(v); } });
  if(cur) syncSetModal(cur);
}
function syncRemoveModal(g){ if(!g) return; const d = Object.getOwnPropertyDescriptor(g, 'modal'); if(!d || !d.get) return; const v = SYNC.smodal || null; delete g.modal; g.modal = v && !SYNC.guest ? v : null; }
function syncSetModal(v){
  if(v==null){ if(SYNC.host && SYNC.smodal && (SYNC.inShared || !SYNC.overlay)) SYNC.smodal = null; else SYNC.overlay = null; return; }
  if(SYNC.guest){ SYNC.overlay = v; v.ov = true; return; }
  if(BROWSE.has(v.type) || v.ov || (!SYNC.inShared && SYNC.overlay)){ SYNC.overlay = v; v.ov = true; if(SYNC.inShared && BROWSE.has(v.type)) syncEvent(['o', san(v, 'm')]); return; }
  v.mid = ++SYNC.mid; SYNC.smodal = v;
}

/* ---------------- host ---------------- */
function syncU(){
  const sc = UI.screen==='over' || UI.screen==='win' ? UI.screen : G ? 'game' : 'wait';
  return { screen:sc, reason:UI.overReason||'', last:UI.lastRun||null, speed:SET.speed||1, mode:NET.mode, run:SYNC.run, pausedBy:SYNC.pausedBy||'', choices:MP.opts.choices||'any', strict:!!MP.opts.strict };
}
function syncLive(){ return { g:G || null, m:SYNC.smodal || null, u:syncU() }; }
function syncStartHost(){
  SYNC.on = true; SYNC.host = true; SYNC.guest = SYNC.spect = false; SYNC.prev = null; SYNC.acks = {}; SYNC.out = []; SYNC.overlay = null;
  if(G){ syncInstallModal(G); SYNC.run = SYNC.run || 1; } else SYNC.smodal = null;
  syncWrapRelay();
}
function syncStop(){
  if(SYNC.host && G) syncRemoveModal(G);
  SYNC.on = SYNC.host = SYNC.guest = SYNC.spect = false; SYNC.prev = SYNC.S = SYNC.B = null; SYNC.pend = []; SYNC.cmdq = []; SYNC.overlay = null; SYNC.smodal = null; SYNC.ptrs = {}; SYNC.react = []; SYNC.says = [];
}
/* a new game object (new run, loaded save) while hosting */
function syncNewG(){ if(!SYNC.host) return; SYNC.run++; SYNC.overlay = null; const m = G && G.modal; if(G){ delete G.modal; G.modal = null; syncInstallModal(G); if(m) G.modal = m; } SYNC.dirty = true; }
function syncEvent(e){ if(SYNC.host && SYNC.relay && NET.peers.size) SYNC.out.push(e); }
function syncHostSend(){
  const live = syncLive();
  if(!SYNC.prev){ SYNC.prev = { g:san(live.g, 'g'), m:san(live.m, 'm'), u:san(live.u, 'u') }; for(const P of NET.peers.values()) P.synced = false; }
  const p = {}; let any = false;
  for(const k of ['g','m','u']){ const c = dif(SYNC.prev[k], live[k], k); if(c!==undefined){ p[k] = c; any = true; } }
  if(any) for(const k in p) applyChild(SYNC.prev, k, p[k]);
  const ev = SYNC.out; SYNC.out = [];
  const msg = any || ev.length || SYNC.ackDirty ? JSON.stringify({ t:'p', p, e:ev.length ? ev : undefined, a:SYNC.acks, f:NET.id }) : null;
  SYNC.ackDirty = false;
  for(const P of NET.peers.values()){
    if(!P.open || !P.joined || !P.shared) continue;
    if(!P.synced){ if(netBuffered(P.id) < 64e3){ netSend({ t:'full', root:SYNC.prev, a:SYNC.acks, run:SYNC.run }, P.id); P.synced = true; } continue; }
    if(!msg) continue;
    if(netBuffered(P.id) > 768e3){ P.synced = false; continue; }   // fell too far behind: send a full copy once it catches up
    if(P.dc && P.dc.readyState==='open'){ if(msg.length <= 15000) try{ P.dc.send(msg); }catch(e){} else netRaw(P, JSON.parse(msg), false); }
  }
}
/* a guest's changes, applied to the real game */
function syncApplyOp(m, P){
  if(!G || !m.p || typeof m.p!=='object') return;
  const p = m.p;
  for(const k of ['seed','daily','challenge','diff','shipDef','map','stats','seen','log','flags','later','questQueue']) if(k in p && isNode(p[k]) && ('$=' in p[k] || '$-' in p[k])) delete p[k];
  for(const k of ['ship','enemy']) if(isNode(p[k]) && ('$=' in p[k] || '$-' in p[k])) delete p[k];
  if('paused' in p){ SYNC.pausedBy = p.paused ? (P.name || 'A crewmate') : ''; }
  if(!mpOpAllowed(p, P)) return;
  try{ applyPatch(G, p); }catch(e){ console.warn('[sync] op failed', e); }
  syncClampAll();
}
function syncClampAll(){
  for(const k of ['scrap','fuel','missiles','parts']) G[k] = Math.max(0, Math.round(+G[k]||0));
  for(const sh of [G.ship, G.enemy]){ if(!sh) continue; sh.hull = clamp(Math.round(sh.hull), 0, sh.maxHull);
    for(const k in sh.systems){ const s = sh.systems[k]; s.dmg = clamp(Math.round(s.dmg), 0, s.max); s.power = clamp(Math.round(s.power), 0, Math.max(0, s.max - s.dmg)); s.rep = clamp(+s.rep||0, 0, .999); }
    for(const r of sh.rooms){ r.fire = clamp(Math.round(r.fire||0), 0, r.w*r.h); r.breach = clamp(Math.round(r.breach||0), 0, r.w*r.h); r.fireP = clamp(+r.fireP||0, 0, .999); r.breachP = clamp(+r.breachP||0, 0, .999); r.sab = clamp(+r.sab||0, 0, .999); }
    for(const c of sh.crew) c.hp = Math.min(c.maxHp, +c.hp||0);
    if(sh===G.ship){ shedPower(sh); weaponBudget(sh); droneBudget(sh); }
    if(sh.cellRoom && !sh.adj) buildGraph(sh); }
}
function syncCrewById(id){ for(const sh of [G.ship, G.enemy]) if(sh){ const c = sh.crew.find(x => String(x.id)===String(id)); if(c) return [c, sh]; } return [null, null]; }
function syncCmd(c, P){
  if(!G || !c || typeof c!=='object') return;
  if(MP.opts.strict && !mpCmdAllowed(c, P)) return;
  const team = P.team || 'p', foeOf = sh => sh===G.ship ? G.enemy : G.ship;
  switch(c.c){
    case 'order': { const sh = c.s==='enemy' ? G.enemy : G.ship; const cr = sh && sh.crew.find(x => String(x.id)===String(c.id)); if(!cr || cr.drone || cr.owner!==team || cr.mcT>0) return;
      if(sh.rooms[c.room] && orderMove(sh, cr, c.room)){ if(c.man) cr.manualT = 10; } return; }
    case 'jump': if(G.map && G.map.nodes[c.i] && G.map.nodes[G.map.cur].links.includes(c.i) && G.warp<=0) jumpTo(c.i); return;
    case 'sector': if(typeof c.v==='string' && DATA.sectors[c.v] && G.map.nodes[G.map.cur].type==='exit' && !G.enemy) nextSector(c.v); return;
    case 'tele': if(G.enemy && G.enemy.rooms[c.room]) teleSend(G.ship, G.enemy, c.room); return;
    case 'recall': teleRecall(G.ship, G.enemy); return;
    case 'hack': if(G.enemy && G.enemy.rooms[c.room]) hackLaunch(G.ship, G.enemy, c.room); return;
    case 'mind': { const [cr] = syncCrewById(c.id); if(cr) mindControl(G.ship, cr); return; }
    case 'cap': (G.ship.capMen = G.ship.capMen || {})[P.id] = typeof c.v==='string' ? c.v : null; return;
    case 'store': { const n = G.map && G.map.nodes[G.map.cur]; if(n && !n.store && (n.type==='store' || c.any)) n.store = makeStore(); return; }
  }
  if(typeof mpModeCmd==='function') mpModeCmd(c, P);
}
/* a guest pressed a button on the shared pop-up: press the same one here */
function syncModalClick(m, P){
  if(!SYNC.smodal || SYNC.smodal.mid!==m.mid || !G) return;
  if((MP.opts.choices||'any')==='captain' && !P.host && !(m.l==='skip')) { netSend({ t:'toast', text:'The captain makes this call.' }, P.id); return; }
  const scr = UI.screen; UI.screen = 'game'; SYNC.smodal._skip = true;
  try{ draw(); } catch(e){}
  let r = null; const lab = m.l;
  if(lab){ const same = HR.filter(q => q.t===lab); r = same[Math.min(m.n||0, same.length-1)] || null; }
  if(!r && typeof m.x==='number'){ for(let i=HR.length-1;i>=0;i--){ const q = HR[i]; if(m.x>=q.x && m.x<=q.x+q.w && m.y>=q.y && m.y<=q.y+q.h){ r = q; break; } } }
  UI.screen = scr;
  if(!r || r.t==='skip') return;
  SYNC.inShared = SYNC.relay = true; try{ r.cb(m.x, m.y); }catch(e){ console.warn('[sync] modal click', e); } finally { SYNC.inShared = SYNC.relay = false; }
  sfx('click'); SYNC.dirty = true;
}
/* host: things the game does that guests should see and hear too */
let SYNC_WRAPPED = false;
function syncWrapRelay(){
  if(SYNC_WRAPPED) return; SYNC_WRAPPED = true;
  const wrap = (name, code, n) => { const f = window[name]; if(typeof f!=='function') return; window[name] = function(...a){ if(SYNC.relay && SYNC.host) syncEvent([code, ...a.slice(0, n).map(x => typeof x==='number' ? qn(x, '') : (x && typeof x==='object') ? san(x, '') : x)]); return f.apply(this, a); }; };
  wrap('sfx', 's', 2); wrap('toast', 'T', 1); wrap('fx', 'f', 4); wrap('burst', 'b', 4); wrap('sparks', 'k', 4); wrap('debris', 'd', 4); wrap('haptic', 'h', 2); wrap('grant', 'g', 1);
}
function syncPlayEvents(ev){
  if(!ev) return;
  for(const e of ev){ const [k, ...a] = e;
    try{ switch(k){
      case 's': sfx(a[0], a[1] || {}); break;
      case 'T': toast(a[0]); break;
      case 'f': if(G) G.fx.push({ type:a[0], x:a[1], y:a[2], t:0, text:a[3] }); break;
      case 'b': burst(a[0], a[1], a[2], a[3]); break;
      case 'k': sparks(a[0], a[1], a[2], a[3]); break;
      case 'd': debris(a[0], a[1], a[2], a[3]); break;
      case 'h': haptic(a[0], a[1]); break;
      case 'g': if(!SYNC.spect) grant(a[0]); break;
      case 'o': if(a[0] && BROWSE.has(a[0].type)){ SYNC.overlay = Object.assign(a[0], { ov:true }); if(a[0].type==='map') sfx('map'); } break;
      case 'x': if(typeof mpModeEvent==='function') mpModeEvent(a); break;
    } }catch(err){}
  }
}

/* ---------------- guest ---------------- */
function syncStartGuest(spect){
  SYNC.on = true; SYNC.guest = true; SYNC.host = false; SYNC.spect = !!spect; SYNC.S = null; SYNC.B = null; SYNC.pend = []; SYNC.cmdq = []; SYNC.seq = 0; SYNC.overlay = null; SYNC.smodal = null; SYNC.u = {};
}
function syncPrepShips(){ if(!G) return; for(const sh of [G.ship, G.enemy]) if(sh && sh.rooms){ const sig = sh.rooms.length + ':' + (sh.doors||[]).length + ':' + (sh.uid||'');
  if(!sh.adj || sh._sig!==sig){ if(!sh.cellRoom) sh.cellRoom = {}; buildGraph(sh); sh._sig = sig; } }
  for(const sh of [G.ship, G.enemy]) if(sh && sh.crew) for(const c of sh.crew){ c._pi = 0; if(!c.path) c.path = []; } }
function syncAdoptG(plain){
  if(!plain){ if(G) syncRemoveModal(G); G = null; return; }
  if(G && G.__syncRun===SYNC.run){ syncObj(G, plain); }
  else { G = clone(plain); Object.defineProperty(G, '__syncRun', { value:SYNC.run, enumerable:false, writable:true, configurable:true }); G.fx = G.fx || []; G.proj = G.proj || []; G.units = G.units || []; }
  syncInstallModal(G); syncPrepShips();
}
function syncGuestFull(m){
  SYNC.S = m.root; SYNC.run = m.run || 1;
  const plain = SYNC.S.g;
  syncAdoptG(plain ? clone(plain) : null);
  SYNC.smodal = SYNC.S.m ? clone(SYNC.S.m) : null; SYNC.u = clone(SYNC.S.u || {});
  syncAcks(m.a); if(G) for(const op of SYNC.pend) applyPatch(G, op.p);
  mpHook('viewFix');
  SYNC.B = G ? san(G, 'g') : null;
  syncScreen();
}
function syncAcks(a){ const n = (a && a[NET.id]) || 0; const acked = SYNC.pend.filter(o => o.s <= n); SYNC.pend = SYNC.pend.filter(o => o.s > n); return acked; }
function syncGuestPatch(m){
  if(!SYNC.S){ return; }
  syncCapture();
  const p = m.p || {};
  const runBefore = SYNC.S.u && SYNC.S.u.run;
  for(const k in p) applyChild(SYNC.S, k, p[k]);
  if(SYNC.S.u && SYNC.S.u.run!==runBefore) SYNC.run = SYNC.S.u.run;
  // our copy
  if('g' in p){ const pg = p.g;
    if(!SYNC.S.g){ syncAdoptG(null); }
    else if(!G || !isNode(pg) || '$=' in pg || G.__syncRun!==SYNC.run){ syncAdoptG(clone(SYNC.S.g)); }
    else { for(const k in pg) applyChild(G, k, pg[k]); syncPrepShips(); } }
  if('m' in p){ const box = { v:SYNC.smodal }; applyChild(box, 'v', p.m); const before = SYNC.smodal; SYNC.smodal = box.v; if(SYNC.smodal && before && SYNC.smodal!==before){ delete SYNC.smodal._t0; delete SYNC.smodal._skip; } if(SYNC.smodal && SYNC.overlay && (!before || SYNC.smodal.mid!==before.mid) && SYNC.overlay.type==='map') SYNC.overlay = null; }
  if('u' in p){ const box = { v:SYNC.u }; applyChild(box, 'v', p.u); SYNC.u = box.v || {}; }
  // what the host has done with our own changes
  const acked = syncAcks(m.a);
  if(G && SYNC.S.g && (acked.length || SYNC.pend.length)){
    const touch = []; for(const op of acked.concat(SYNC.pend)){ opTouches(op.p || {}, [], touch); for(const c of op.c||[]) if(c.c==='order') for(const f of ['path','tx','ty']) touch.push([c.s, 'crew', { id:String(c.id) }, f]); }
    for(const t of touch) try{ syncPath(G, SYNC.S.g, t); }catch(e){}
    for(const op of SYNC.pend) try{ applyPatch(G, op.p); }catch(e){}
    syncPrepShips();
  }
  mpHook('viewFix');
  SYNC.B = G ? san(G, 'g') : null;
  syncPlayEvents(m.e);
  syncScreen();
}
/* follow the host between the waiting room, the game and the end screens */
function syncScreen(){
  const want = SYNC.u.screen, waiting = UI.screen==='mp';
  if(want==='over' || want==='win'){ if(UI.screen==='game' || waiting){ UI.screen = want; UI.overReason = SYNC.u.reason || ''; UI.lastRun = SYNC.u.last || UI.lastRun; } return; }
  if(want==='game' && G){ if(waiting || UI.screen==='over' || UI.screen==='win'){ UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; } return; }
  if(want==='wait' && (UI.screen==='game' || UI.screen==='over' || UI.screen==='win')){ UI.screen = 'mp'; MP.view = 'room'; }
}
/* spot what this player changed on their copy since last time, and send it */
function syncCapture(){
  if(!syncIsGuestPlayer() || !G || !SYNC.B || UI.screen!=='game' && !SYNC.cmdq.length) return;
  const p = dif(SYNC.B, G, 'g', CAPM);
  const cmds = SYNC.cmdq.splice(0);
  for(const sk of ['ship','enemy']){ const sv = G[sk], sb = SYNC.B[sk]; if(!sv || !sb || sv.uid!==sb.uid || !sv.cellRoom) continue;
    const bm = new Map(); for(const c of sb.crew||[]) bm.set(String(c.id), c);
    for(const c of sv.crew){ const o = bm.get(String(c.id)); if(!o || !c.path || !c.path.length) continue;
      if(c.tx!==o.tx || c.ty!==o.ty || !(o.path && o.path.length)){ const room = sv.cellRoom[c.tx+','+c.ty]; if(room!=null) cmds.push({ c:'order', s:sk, id:c.id, room, man:c.manualT>0 ? 1 : 0 }); } } }
  const cap = G.ship && G.ship._capMan || null; if(cap!==(SYNC.lastCap||null)){ SYNC.lastCap = cap; cmds.push({ c:'cap', v:cap }); }
  if(p && ('$=' in p || '$-' in p)) return;
  if(!p && !cmds.length) return;
  const op = { s:++SYNC.seq, p:p || {}, c:cmds.length ? cmds : undefined };
  SYNC.pend.push(op); netSend(Object.assign({ t:'op' }, op));
  SYNC.B = san(G, 'g');
}
/* guests: actions that can't be worked out on their own copy go to the host as commands */
function netGuestCmd(c){ if(!SYNC.guest) return false; if(SYNC.spect) return true; SYNC.cmdq.push(c); syncCapture(); return true; }
function syncAfterInput(){ if(syncIsGuestPlayer()) syncCapture(); else if(SYNC.host) SYNC.dirty = true; }
/* guests animate their copy between patches: shots fly, crew walk, drones circle */
function syncGuestTick(dt){
  if(!G) return;
  if(G.warp>0) G.warp = Math.max(0, G.warp - dt);
  if(G.paused || SYNC.smodal || G.warp>0) return;
  const d = dt*(SYNC.u.speed || 1); G.time = (G.time||0) + d;
  for(const p of G.proj||[]) if(p.t < p.dur) p.t = Math.min(p.dur, p.t + d);
  for(const u of G.units||[]){ const bp = DATA.drones[u.bp]; u.ang = (u.ang||0) + d*(bp && bp.kind==='attack' ? .7 : .9); }
  for(const sh of [G.ship, G.enemy]) if(sh && sh.crew) for(const c of sh.crew) syncWalk(c, d);
  for(const b of G.chat||[]) b.t -= dt;
  if(typeof updateParts==='function') updateParts(dt);
}
function syncWalk(c, dt){
  if(!c.path || !c.path.length || c.stunT>0) return; const i = c._pi||0; if(i >= c.path.length) return;
  const sp = 1.7*(raceOf(c).speed||1)*(traitOf(c).speed||1)*dt, n = c.path[i]; if(!n) return;
  const dx = n[0] - c.x, dy = n[1] - c.y, dist = Math.hypot(dx, dy);
  if(dist <= sp){ c.x = n[0]; c.y = n[1]; c._pi = i + 1; } else { c.x += dx/dist*sp; c.y += dy/dist*sp; }
}
/* clicks: a guest's click on a shared pop-up goes to the host; spectators only use their own buttons.
   Returns true when the click has been dealt with here. */
function netRegion(r, x, y){
  if(!SYNC.guest || UI.screen!=='game' || !G) return false;
  if(SYNC.spect){ if(r && spectAllowed(r)){ r.cb(x, y); sfx('click'); } return true; }
  if(!r) return false;
  if(SYNC.smodal && G.modal===SYNC.smodal && !r.loc){
    if(r.t==='skip'){ r.cb(x, y); return true; }
    const same = HR.filter(q => q.t===r.t), n = Math.max(0, same.indexOf(r));
    netSend({ t:'mc', mid:SYNC.smodal.mid, l:r.t || null, n, x:Math.round(x), y:Math.round(y) }); sfx('click');
    SYNC.smodal._sent = performance.now(); return true; }
  if(MP.opts.strict && !r.loc && !mpClickAllowed(x, y, r)) return true;
  return false;
}
/* the host runs the callbacks of its own clicks on shared pop-ups as shared actions */
function syncRunClick(r, x, y){
  if(SYNC.host && G && SYNC.smodal && G.modal===SYNC.smodal){ SYNC.inShared = SYNC.relay = true; try{ r.cb(x, y); } finally { SYNC.inShared = SYNC.relay = false; } SYNC.dirty = true; return; }
  if(SYNC.host && MP.opts.strict && !r.loc && !mpClickAllowed(x, y, r)) return;
  r.cb(x, y);
}

/* ---------------- each frame ---------------- */
function syncFrame(dt){
  if(!SYNC.on) return;
  if(SYNC.host){ SYNC.sendT -= dt; if(SYNC.sendT <= 0 || (SYNC.dirty && SYNC.sendT < .05)){ SYNC.sendT = .1; SYNC.dirty = false; syncHostSend(); } }
  else if(syncIsGuestPlayer()){ SYNC.capT -= dt; if(SYNC.capT <= 0){ SYNC.capT = 1/15; syncCapture(); } }
  // where everyone is pointing
  SYNC.ptrT -= dt; if(SYNC.ptrT <= 0){ SYNC.ptrT = 1/12; const p = PTR.find(q => q.on && q.xr) || PTR[0];
    const v = UI.screen!=='game' ? UI.screen : G && G.modal ? G.modal.type : 'game', key = p.on ? `${Math.round(p.x)},${Math.round(p.y)},${v}` : 'off';
    if(key!==SYNC.lastPtr){ SYNC.lastPtr = key; netFast({ t:'ptr', x:Math.round(p.x), y:Math.round(p.y), on:!!p.on, v, id:NET.id }); } }
  for(const id in SYNC.ptrs){ const q = SYNC.ptrs[id]; q.age = (q.age||0) + dt; if(q.age > 6) delete SYNC.ptrs[id]; }
  for(const r of SYNC.react) r.t += dt; SYNC.react = SYNC.react.filter(r => r.t < 3.2);
  for(const s of SYNC.says) s.t += dt; SYNC.says = SYNC.says.filter(s => s.t < 4);
}
/* message handlers */
netOn('p', (m) => { if(SYNC.guest) syncGuestPatch(m); });
netOn('full', (m) => { if(SYNC.guest) syncGuestFull(m); });
netOn('op', (m, P) => { if(!SYNC.host || !G) return; const last = SYNC.acks[P.id] || 0; if(m.s <= last) return;
  SYNC.relay = true; try{ syncApplyOp(m, P); for(const c of m.c||[]) syncCmd(c, P); }catch(e){ console.warn('[sync] op', e); } finally { SYNC.relay = false; }
  SYNC.acks[P.id] = m.s; SYNC.ackDirty = true; SYNC.dirty = true; });
netOn('mc', (m, P) => { if(SYNC.host) syncModalClick(m, P); });
netOn('ptr', (m, P) => { const id = m.id || P.id; if(id===NET.id) return; SYNC.ptrs[id] = { x:m.x, y:m.y, on:m.on, v:m.v, age:0 }; if(NET.role==='host') netFast(m, null, P.id); });
netOn('toast', (m) => toast(m.text));
