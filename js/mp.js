'use strict';
/* =========================================================================
   Multiplayer: the menu, rooms, players and roles, and the shared-ship modes
   (co-op crew, navigator, away team, go live, hunter and hunted).
   Versus and parallel modes live in mpversus.js and mprun.js; share links,
   challenge codes and scoreboards in mpcodes.js.
   Everything here is drawn on the game canvas, so it works the same on a
   laptop, a phone and the floating VR console.
   ========================================================================= */
const MP_MODES = {
  coop:  { name:'Co-op crew', kind:'shared', max:4, col:'#ffb547', short:'One ship, 2 to 4 captains. Share it all or take a station each.', blurb:'One ship, two to four captains. Share everything, or take a station each.' },
  nav:   { name:'Navigator', kind:'shared', max:2, col:'#5fd3e6', short:'A VR captain fights; a navigator on a laptop or phone plots the course.', blurb:'A captain in VR flies and fights. A navigator on a laptop or phone plots the course, reads events and runs the shop.' },
  away:  { name:'Away team', kind:'shared', max:4, col:'#c6e05a', short:'Co-op with a boarding specialist who beams over in VR.', blurb:'Co-op with a boarding specialist: beam over in VR, sabotage systems and fight hand to hand while the crew back home flies.' },
  spect: { name:'Go live', kind:'shared', max:8, col:'#ff8ad8', short:'Stream your run. Friends watch live and send emoji.', blurb:'Stream your run. Friends watch live from any device and send emoji reactions.' },
  hunt:  { name:'Hunter and hunted', kind:'shared', max:2, col:'#ff5a7a', short:'One flies the courier, the other commands the Rebuff fleet.', blurb:'One player flies the courier. The other commands the Rebuff fleet: ambushes, hazards, fleet surges and enemy gunnery.' },
  duel:  { name:'Duel arena', kind:'duel', max:2, col:'#ff7a45', short:'Build a ship on a budget and fight a friend. Best of three.', blurb:'Build a ship on a budget, then fight a friend ship to ship. Best of three.' },
  brawl: { name:'Boarding brawl', kind:'brawl', max:2, col:'#e05aa0', short:'Two crews, one ship, no way off. Last crew standing wins.', blurb:'Two crews on one ship and no way off. Last crew standing takes the round.' },
  race:  { name:'Race to the Flaggship', kind:'parallel', max:4, col:'#7be0a0', short:'Same seed, same time. Race to the end and play trouble cards.', blurb:'Everyone flies the same seed at once. Watch each other\'s progress and play trouble cards on the leader.' },
  wing:  { name:'Wingmen', kind:'parallel', max:4, col:'#9fb8ff', short:'Your own ships, the same sectors. Fight together, share supplies.', blurb:'Your own ships, the same sectors. Fight side by side at the same beacon and send each other supplies.' },
};
ACHIEVEMENTS.push(
  { id:'mp_coop',   name:'Two Captains',        desc:'Win a fight with a friend aboard.' },
  { id:'mp_live',   name:'Live From Deep Space', desc:'Have three viewers watching your run at once.' },
  { id:'mp_courier',name:'Slippery',            desc:'Escape a fleet commander in Hunter and hunted.' },
  { id:'mp_hunter', name:'Fleet Admiral',       desc:'Catch the courier as fleet commander.' },
  { id:'duelwin',   name:'Arena Champion',      desc:'Win a duel.' },
  { id:'brawlwin',  name:'Last Crew Standing',  desc:'Win a boarding brawl.' },
  { id:'racewin',   name:'First Past the Post', desc:'Win a race to the Flaggship.' },
  { id:'mp_wing',   name:'Care Package',        desc:'Send supplies to a wingmate.' },
  { id:'seedwin',   name:'Same Seed, Better Captain', desc:'Win a seed duel.' },
  { id:'cuppost',   name:'On the Board',        desc:'Post a score to the weekly cup.' }
);
const ROLES = {
  captain:{ name:'Captain', desc:'Everything', col:'#ffb547' },
  helm:{ name:'Helm', desc:'Map, jumps, events, Helm and Engines', col:'#5fd3e6' },
  tactical:{ name:'Tactical', desc:'Weapons, drones, targeting, hacking, mind control, cloak', col:'#ff5a7a' },
  engineer:{ name:'Engineer', desc:'Power, doors, crew, repairs, upgrades, store', col:'#7be0a0' },
  navigator:{ name:'Navigator', desc:'Map, jumps, events, store and ship screen', col:'#5fd3e6' },
  boarder:{ name:'Away team', desc:'Teleporter, boarders, sabotage', col:'#c6e05a' },
  viewer:{ name:'Viewer', desc:'Watching', col:'#ff8ad8' },
  courier:{ name:'Courier', desc:'Flies the ship', col:'#ffb547' },
  commander:{ name:'Fleet commander', desc:'Hunts the courier', col:'#ff5a7a' },
  crew:{ name:'Crew', desc:'Everything', col:'#ffb547' },
};
/* each mode file registers what it adds: room options, start buttons, the in-game HUD, game hooks */
const MP_UI = {};
function mpHook(name, ...a){ const U = NET.mode && MP_UI[NET.mode]; return U && typeof U[name]==='function' ? U[name](...a) : undefined; }
function mpHold(){ return NET.on && !!mpHook('hold'); }
function mpGameTick(dt){ return NET.on && G ? !!mpHook('gameTick', dt) : false; }
function netLaunch(p){ if(NET.on) mpHook('launch', p); }
function mpFightWon(kind, e){ if(NET.on) mpHook('fightWon', kind, e); }
function mpRunEnded(win, reason){ if(NET.on) mpHook('runEnded', win, reason); }
function mpHangarLaunch(sel, open){ return NET.on ? !!mpHook('hangar', sel, open) : false; }
const MP = { view:'menu', opts:{}, code:'', err:'', rooms:[], stopBrowse:null, sel:null, chatOpen:false, feed:[], ended:null, hostedFrom:null, ready:false, cmd:{ cp:0, card:null } };
const MP_ADJ = ['Brave','Lucky','Quiet','Rusty','Swift','Plucky','Stellar','Gentle','Bold','Clever','Cosmic','Dusty','Fearless','Jolly','Nimble','Steady','Wild','Witty','Mellow','Daring'];
const MP_NOUN = ['Comet','Nebula','Quasar','Otter','Falcon','Badger','Pulsar','Meteor','Lantern','Rocket','Beacon','Voyager','Pilot','Wombat','Orbit','Ranger','Sparrow','Starling','Vortex','Kestrel'];
function mpRandomName(){ return pick(MP_ADJ) + ' ' + pick(MP_NOUN); }
function mpName(){ if(!PROFILE.mpName){ PROFILE.mpName = mpRandomName(); saveProfile(); } return PROFILE.mpName; }
const QUICK = ['Fire!','Hull breach!','Intruders!','Need power','Jump now?','Wait!','Nice shot!','On it','Yes','No','Help!','Thanks!'];
const EMOJI = ['👍','😂','😮','😱','🔥','💥','❤️','👏'];
function mpMode(){ return MP_MODES[NET.mode] || null; }
function mpReplicated(){ const k = mpKind(); return k==='shared' || k==='brawl'; }   // one game, run by the host, copied to everyone
function mpKind(){ return mpMode()?.kind || null; }
function mpOn(){ return NET.on && NET.welcomed !== false && !!NET.mode; }
function mpAmHost(){ return NET.on && NET.role==='host'; }
function mpRole(id){ return (NET.players.find(p => p.id===(id||NET.id)) || {}).role || 'crew'; }

/* ---------------- sessions ---------------- */
function mpDefaults(mode){
  const o = { public:false, strict:false, choices:'any', viewers:true, smartPause:false };
  if(mode==='spect') o.public = true;
  if(mode==='nav'){ o.strict = true; o.choices = 'any'; }
  if(mode==='hunt'){ o.hunt = 'full'; }
  if(mode==='duel'){ o.budget = 'medium'; o.rounds = 3; }
  if(mode==='brawl'){ o.budget = 'medium'; o.rounds = 3; o.arena = 'random'; }
  if(mode==='race'){ o.cards = true; o.ship = 'host'; o.diff = 'normal'; }
  if(mode==='wing'){ o.ship = 'each'; o.diff = 'normal'; }
  return o;
}
function mpRoleFor(mode, n, dev){
  if(mode==='spect') return n===0 ? 'captain' : 'viewer';
  if(mode==='nav') return n===0 ? 'captain' : 'navigator';
  if(mode==='away') return n===0 ? 'captain' : n===1 ? 'boarder' : 'crew';
  if(mode==='hunt') return n===0 ? 'courier' : 'commander';
  if(mode==='coop') return n===0 ? 'captain' : ['tactical','engineer','helm'][(n-1) % 3];
  return 'crew';
}
async function mpHost(mode, extra){
  const def = MP_MODES[mode]; if(!def) return false;
  MP.opts = Object.assign(mpDefaults(mode), extra || {}); MP.err = ''; MP.view = 'room'; UI.screen = 'mp'; MP.feed = []; MP.ready = false;
  const ok = await netHost(mode, { max:def.max, public:MP.opts.public, role:mpRoleFor(mode, 0) });
  if(!ok){ MP.err = NET.error || 'Could not open a room.'; MP.view = 'menu'; return false; }
  NET.welcomed = true;
  NET.players[0].color = NET_COLORS[0]; NET.players[0].role = mpRoleFor(mode, 0, netDev());
  if(def.kind==='shared') syncStartHost();
  mpHook('hosted', mode);
  if(G && UI.screen!=='mp' && def.kind==='shared') UI.screen = 'game';
  return true;
}
/* invite friends into the run you're already flying */
async function mpHostFromGame(mode){
  const keep = G; if(!keep) return;
  MP.hostedFrom = 'game'; const ok = await mpHost(mode || 'coop'); if(!ok){ toast(MP.err); UI.screen = 'game'; return; }
  syncNewG(); UI.screen = 'game'; G.paused = true; toast(`Room ${NET.code} is open. Friends join with this code.`);
}
async function mpJoin(code, o={}){
  code = netCleanCode(code); MP.err = ''; MP.code = code;
  if(code.length < 5){ MP.err = 'Room codes have 5 letters.'; return false; }
  MP.view = 'joining'; UI.screen = 'mp'; MP.wantSpect = !!o.spect; MP.feed = []; MP.ready = false;
  NET.welcomed = false;
  const ok = await netJoin(code); if(!ok){ MP.err = NET.error || 'Could not join.'; MP.view = 'menu'; return false; }
  return true;
}
function mpLeave(){ netLeave(); }
function mpJoinInfo(){ return { spect:!!MP.wantSpect }; }
/* net.js calls this when a session ends, for whatever reason */
function netEnded(quiet){
  const wasGuest = SYNC.guest, wasShared = SYNC.on, why = NET.error;
  if(typeof VCHAT!=='undefined'){ if(VCHAT.on && VCHAT.stream) for(const t of VCHAT.stream.getTracks()) t.stop(); VCHAT.on = false; VCHAT.stream = null; for(const k in VCHAT.els){ VCHAT.els[k].srcObject = null; } VCHAT.els = {}; VCHAT.remote = []; }
  if(typeof AV!=='undefined'){ AV.peers = {}; }
  mpHook('ended');
  if(wasGuest && wasShared && G && (UI.screen==='game' || UI.screen==='over' || UI.screen==='win')){
    MP.ended = { why: why || 'The session ended.', g:G, data:DATA }; syncStop(); UI.screen = 'mp'; MP.view = 'ended'; return; }
  if(wasShared && SYNC.host){ syncStop(); if(G) G.modal = null; }
  else syncStop();
  if(MP.guestData && !(G && G.par)){ MP.guestData = false; applyMods(); if(wasGuest) G = null; }
  if(UI.screen==='mp' || (wasGuest && UI.screen==='game')){ UI.screen = 'mp'; MP.view = 'menu'; }
  if(why && !quiet) MP.err = why;
  MP.stopBrowse && MP.stopBrowse(); MP.stopBrowse = null;
}
/* the host has gone: keep flying their run on your own */
function mpKeepSolo(){
  const e = MP.ended; if(!e || !e.g) return; MP.ended = null; MP.guestData = false;
  DATA = e.data; R = DATA.rules; G = e.g; const m = Object.getOwnPropertyDescriptor(G, 'modal'); if(m && m.get) delete G.modal; G.modal = null;
  for(const sh of [G.ship, G.enemy]) if(sh){ sh.aiT = 0; sh.restT = 0; for(const c of sh.crew){ c.aiT = Math.random(); c.path = c.path || []; } for(const r of sh.rooms){ r.fireOut = 0; r.fireDmg = 0; } for(const d of sh.doors||[]) d.brk = 0; buildGraph(sh); }
  G.fx = []; G.proj = G.proj || []; G.units = G.units || []; G.paused = true; delete G.noSave;
  UI.screen = 'game'; toast('This run is yours now. It saves like any other.'); save();
}
function mpBroadcastPlayers(){ if(mpAmHost()){ netSend({ t:'players', list:NET.players }); } }
function mpBroadcastOpts(){ if(mpAmHost()){ netSend({ t:'opts', opts:MP.opts }); if(MP.opts.public) netAdvertise(); } }
function netPlayerLeft(P, why){ const p = P && P.name; if(p) toast(`${p} left.`); mpFeed(`${p || 'Someone'} left${why==='timeout' ? ' (connection lost)' : ''}.`, C.muted);
  if(G && G.ship && G.ship.capMen) delete G.ship.capMen[P.id];
  mpHook('left', P);
  if(MP.opts.public) netAdvertise(); }

/* host: someone wants in */
netOn('join', (m, P) => {
  if(NET.role!=='host') return;
  if(m.v!==NET_V){ netSend({ t:'kick', why:'Different game versions: both players should reload the game.' }, P.id); return; }
  const def = mpMode(); if(!def) return;
  const spect = !!m.spect || NET.mode==='spect';
  if(spect && def.kind!=='shared'){ netSend({ t:'kick', why:'This game has no room for viewers.' }, P.id); return; }
  if(spect && !MP.opts.viewers && NET.mode!=='spect'){ netSend({ t:'kick', why:'This game is not taking viewers.' }, P.id); return; }
  const players = NET.players.filter(p => !p.spect || p.host);
  if(!spect && players.length >= def.max){ netSend({ t:'kick', why:'That game is full.' }, P.id); return; }
  P.name = String(m.name || 'Guest').slice(0, 22); P.dev = m.dev || 'flat'; P.joined = true; P.team = 'p';
  const used = new Set(NET.players.map(p => p.color)); const color = spect ? '#8592b0' : NET_COLORS.find(c => !used.has(c)) || NET_COLORS[NET.players.length % NET_COLORS.length];
  const role = spect ? 'viewer' : mpRoleFor(NET.mode, players.length, P.dev);
  NET.players = NET.players.filter(p => p.id!==P.id); NET.players.push({ id:P.id, name:P.name, color, dev:P.dev, role, spect, ready:false });
  netSend({ t:'hello', mode:NET.mode, opts:MP.opts, players:NET.players, you:P.id, code:NET.code, run:!!G }, P.id);
  mpBroadcastPlayers(); toast(`${P.name} joined${spect ? ' to watch' : ''}.`); mpFeed(`${P.name} joined${spect ? ' to watch' : ''}.`, color); sfx('hail');
  if(def.kind==='shared'){ P.spect = spect || role==='commander'; if(G) mpShareWith(P); }
  mpHook('joined', P);
  if(MP.opts.public) netAdvertise();
});
function mpShareWith(P){ if(NET.mode==='spect' && NET.players.filter(p => p.spect && !p.host).length >= 3) grant('mp_live'); netSend({ t:'data', data:DATA }, P.id); P.shared = true; P.synced = false; SYNC.dirty = true; }
/* host: a run starts or loads while people are in the room */
function mpRunStarted(o){
  if(!mpAmHost()) return;
  if(mpReplicated()){ if(G && G.uid==null) G.uid = uid(); syncNewG(); for(const P of NET.peers.values()) if(P.open && P.joined) mpShareWith(P); if(MP.opts.public) netAdvertise(); }
  mpHook('runStarted', o);
}
/* guest: answers from the host */
netOn('hello', (m) => {
  NET.welcomed = true; clearTimeout(NET.joinT); NET.mode = m.mode; MP.opts = m.opts || {}; NET.players = m.players || []; NET.id = m.you || NET.id; NET.code = m.code || NET.code;
  const def = mpMode(), me = mpMe();
  UI.screen = 'mp'; MP.view = 'room'; MP.err = '';
  if(def && (def.kind==='shared' || def.kind==='brawl')) syncStartGuest(!!me.spect || me.role==='commander' || me.role==='viewer');
  mpHook('hello', m);
  mpFeed(`Joined ${def ? def.name : 'the room'}${m.run ? '. A run is under way: you\'ll be aboard in a moment.' : '. Waiting for the host to start.'}`, C.good);
  sfx('hail');
});
netOn('kick', (m) => { netFail(m.why || 'The host turned you away.'); });
netOn('players', (m) => { if(NET.role!=='guest') return; NET.players = m.list || []; const me = mpMe(); if(SYNC.guest) SYNC.spect = !!me.spect || me.role==='commander' || me.role==='viewer'; });
netOn('opts', (m) => { if(NET.role==='guest') MP.opts = m.opts || {}; });
netOn('data', (m) => { if(NET.role!=='guest' || !m.data) return; DATA = m.data; R = DATA.rules; MP.guestData = true; if(typeof EV_KINDS!=='undefined') EV_KINDS.clear(); UI._thumbs = {}; MAPBG.key = null; });
netOn('end', (m) => { netFail(m.why || 'The host closed the room.'); });
/* everyone: quick chat, emotes and reactions */
netOn('say', (m, P) => { const id = m.id || P.id; if(NET.role==='host') netSend(Object.assign({}, m, { id }), null, P.id); mpShowSay(id, m); });
netOn('role', (m, P) => { if(!mpAmHost()) return; const p = NET.players.find(x => x.id===(m.who || P.id)); if(!p) return; if(m.who && m.who!==P.id) return;
  if(ROLES[m.role] && !['viewer','commander','courier'].includes(m.role)) { p.role = m.role; mpBroadcastPlayers(); } });
netOn('ready', (m, P) => { if(!mpAmHost()) return; const p = NET.players.find(x => x.id===P.id); if(p){ p.ready = !!m.on; mpBroadcastPlayers(); } });

/* ---------------- roles: who may press what (only when "stick to stations" is on) ---------------- */
const MP_ZONES = [   // [x, y, w, h, area]
  [1268, 12, 104, 52, 'nav'], [1380, 12, 92, 52, 'ship'], [1480, 12, 100, 52, 'any'],
  [24, 96, 760, 466, 'crew'], [816, 96, 760, 466, 'target'], [24, 572, 760, 66, 'crew'], [24, 652, 904, 328, 'power'], [940, 652, 636, 328, 'weapons'] ];
const ROLE_AREAS = { captain:'*', crew:'*', helm:['nav','events','any','helm'], tactical:['weapons','target','any','events'], engineer:['power','crew','ship','store','any','events'], navigator:['nav','events','store','ship','any'], boarder:['crew','target','any','events'], courier:'*' };
function mpArea(x, y){ if(G && G.modal){ const t = G.modal.type; return t==='map' ? 'nav' : t==='store' ? 'store' : t==='ship' ? 'ship' : 'events'; } for(const z of MP_ZONES) if(x>=z[0] && x<=z[0]+z[2] && y>=z[1] && y<=z[1]+z[3]) return z[4]; return 'any'; }
function mpRoleAllows(role, area){ const a = ROLE_AREAS[role]; if(!a || a==='*') return true; if(a.includes(area)) return true;
  if(area==='power' && role==='helm') return true;   // helm still balances power on the bridge
  return false; }
function mpClickAllowed(x, y, r){ if(!G || UI.screen!=='game') return true; const role = mpRole(), area = mpArea(x, y);
  if(mpRoleAllows(role, area)) return true; if(performance.now() - (MP.denyT||0) > 1500){ MP.denyT = performance.now(); toast(`${ROLES[role]?.name || role}: that's another station's job.`); sfx('error'); } return false; }
function mpOpAllowed(p, P){
  if(G && G.brawl){ for(const k of ['scrap','fuel','missiles','parts','paused']) delete p[k]; if(p.ship) for(const k of ['systems','weapons','drones','reactor','augments','hull']) delete p.ship[k]; }
  return true; }
function mpCmdAllowed(c, P){ const role = mpRole(P.id); if(c.c==='jump' || c.c==='sector') return mpRoleAllows(role, 'nav'); if(c.c==='hack' || c.c==='mind') return mpRoleAllows(role, 'weapons'); return true; }

/* ---------------- quick chat ---------------- */
function mpSay(i, emoji){ const m = { t:'say', i, e:emoji ? 1 : 0, id:NET.id }; netSend(m); mpShowSay(NET.id, m); MP.chatOpen = false; }
function mpShowSay(id, m){ const p = mpPlayer(id), name = p ? p.name : 'Someone', col = p ? p.color : C.muted;
  if(m.e){ const e = EMOJI[m.i] || '👍'; SYNC.react.push({ e, x:W/2 + rand(-300, 300), t:0, col, name }); if(SYNC.react.length > 30) SYNC.react.shift(); return; }
  const text = QUICK[m.i] || String(m.text||'').slice(0, 60); SYNC.says.push({ id, text, name, col, t:0 }); mpFeed(`${name}: ${text}`, col); sfx('event', { vol:.4 }); }
function mpFeed(text, col){ MP.feed.push({ text, col:col || C.ink, t:performance.now() }); if(MP.feed.length > 40) MP.feed.shift(); }
function mpKey(e){
  if(!NET.on) return false;
  if(e.key==='t' || e.key==='T' || e.key==='Enter'){ if(UI.screen==='game' && !e.repeat){ MP.chatOpen = !MP.chatOpen; e.preventDefault(); return true; } }
  if(MP.chatOpen && /^[1-9]$/.test(e.key)){ mpSay(+e.key - 1); e.preventDefault(); return true; }
  if(SYNC.spect && UI.screen==='game') return true;   // viewers have no hotkeys in someone else's game
  return false;
}

/* ---------------- the multiplayer screens ---------------- */
function drawMP(){
  if(typeof drawWallpaper==='function' && MP.view!=='room') drawWallpaper();
  switch(MP.view){
    case 'keypad': return drawMPKeypad();
    case 'browse': return drawMPBrowse();
    case 'room': return drawMPRoom();
    case 'joining': return drawMPJoining();
    case 'ended': return drawMPEnded();
    case 'codes': case 'seed': case 'cup': if(typeof drawMPCodes==='function') return drawMPCodes(); break;
    case 'brawlpick': return drawBrawlPick();
    case 'vsres': return drawVsResult();
  }
  drawMPMenu();
}
function mpTitle(t, sub){ label(sub || 'Multiplayer', 80, 92, C.cyan, 'left', 18); T(t, 76, 152, { s:56, f:FD, w:700, c:C.amber, ls:4 }); }
function mpNameChip(x, y){
  panel(x, y, 520, 64, 10); label('Your name', x+18, y+26, C.muted, 'left', 12); T(mpName(), x+18, y+52, { s:22, f:FD, w:700, max:250 });
  btn(x+290, y+12, 104, 40, 'Change', () => { if(typeof openRename==='function' && !inXR()) openRename('mp'); else { PROFILE.mpName = mpRandomName(); saveProfile(); } }, { s:14 });
  btn(x+402, y+12, 104, 40, 'Random', () => { PROFILE.mpName = mpRandomName(); saveProfile(); }, { s:14 });
}
function drawMPMenu(){
  mpTitle('PLAY TOGETHER'); mpNameChip(W-600, 70);
  para('Free and simple: players connect directly, browser to browser. Share a five-letter room code and you\'re in. Works between a Quest, a laptop and a phone.', 80, 196, 780, { s:18, c:C.muted, lh:26 });
  label('Host a game', 80, 286, C.amber, 'left', 16);
  const ids = Object.keys(MP_MODES), cw = 372, ch = 104;
  ids.forEach((id, i) => { const d = MP_MODES[id], x = 80 + (i%2)*(cw+16), y = 300 + Math.floor(i/2)*(ch+12), hov = hovered(x, y, cw, ch);
    rr(x, y, cw, ch, 10); ctx.fillStyle = hov ? hexA(d.col, .16) : 'rgba(14,20,38,.92)'; ctx.fill(); ctx.lineWidth = hov ? 3 : 1.5; ctx.strokeStyle = hov ? d.col : C.line; ctx.stroke();
    ctx.fillStyle = d.col; ctx.fillRect(x, y+10, 4, ch-20);
    T(d.name, x+20, y+34, { s:21, f:FD, w:700, c:d.col, max:cw-110 }); T(`${d.max===8 ? 'up to 8' : d.max===2 ? '2 players' : '2–' + d.max + ' players'}`, x+cw-16, y+32, { s:12, a:'right', c:C.muted });
    para(d.short || d.blurb, x+20, y+58, cw-36, { s:13, lh:18, c:C.ink, max:2 });
    region(x, y, cw, ch, () => mpHost(id), 'host:' + id); });
  const rx = 880, ry = 286;
  label('Join a game', rx, ry, C.amber, 'left', 16);
  panel(rx, ry+14, 640, 228, 12);
  T('Got a code from a friend?', rx+24, ry+56, { s:20, f:FD, w:700 });
  btn(rx+24, ry+76, 290, 62, 'Enter room code', () => { MP.view = 'keypad'; MP.code = ''; MP.err = ''; }, { fill:true });
  btn(rx+326, ry+76, 290, 62, 'Watch with a code', () => { MP.view = 'keypad'; MP.code = ''; MP.err = ''; MP.wantSpect = true; }, { col:'#ff8ad8' });
  btn(rx+24, ry+152, 592, 62, 'Browse public games', () => mpOpenBrowse(), { col:C.cyan });
  label('No room needed', rx, ry+290, C.amber, 'left', 16);
  panel(rx, ry+304, 640, 268, 12);
  const items = [['Seed duel', 'Send a friend your exact run as a link. Same maps, same events. Who scores higher?', 'seed', C.good],
    ['Challenge codes', 'Build a custom challenge, share its code, or play one a friend made.', 'codes', C.warn],
    ['Weekly cup & daily boards', 'Everyone flies the same run this week. Post your score to the public board.', 'cup', C.cyan]];
  items.forEach(([t, d, v, c], i) => { const y = ry+318 + i*82; rr(rx+14, y, 612, 72, 8); const hov = hovered(rx+14, y, 612, 72); ctx.fillStyle = hov ? hexA(c,.14) : 'rgba(10,15,30,.7)'; ctx.fill(); ctx.strokeStyle = hov ? c : C.line; ctx.lineWidth = hov ? 2.5 : 1; ctx.stroke();
    T(t, rx+32, y+30, { s:19, f:FD, w:700, c }); T(d, rx+32, y+54, { s:13, c:C.muted, max:570 }); region(rx+14, y, 612, 72, () => { MP.view = v; MP.err = ''; if(typeof mpCodesOpen==='function') mpCodesOpen(v); }, 'v:' + v); });
  if(MP.err){ panel(80, 902, 1440, 44, 8); T(MP.err, 100, 931, { s:17, c:C.hostile, max:1400 }); }
  btn(80, H-86, 200, 60, 'Back', () => { UI.screen = 'title'; }, { s:18 });
  label('Rooms meet through free public servers (PeerJS and Nostr). Nothing about you is stored there.', W-80, H-48, C.muted, 'right', 12);
}
function drawMPKeypad(){
  mpTitle(MP.wantSpect ? 'WATCH A GAME' : 'JOIN A GAME');
  const code = MP.code || '', bx = W/2 - 5*92/2;
  for(let i=0;i<5;i++){ const x = bx + i*92; rr(x, 210, 80, 96, 10); ctx.fillStyle = C.panel2; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = i===code.length ? C.amber : C.line; ctx.stroke();
    if(code[i]) T(code[i], x+40, 274, { s:56, f:FD, w:700, a:'center', c:C.ink }); }
  const keys = NET_CODE_CH.split(''); const kw = 104, kh = 76, cols = 7, kx = W/2 - (cols*kw + (cols-1)*10)/2;
  keys.forEach((k, i) => { const x = kx + (i%cols)*(kw+10), y = 350 + Math.floor(i/cols)*(kh+10);
    btn(x, y, kw, kh, k, () => { if(MP.code.length < 5) MP.code += k; if(MP.code.length===5) sfx('lock'); }, { s:30 }); });
  const n = keys.length, y2 = 350 + Math.ceil(n/cols)*(kh+10);
  btn(kx + (n%cols)*(kw+10), 350 + Math.floor(n/cols)*(kh+10), kw*2+10, kh, '⌫ Delete', () => { MP.code = MP.code.slice(0, -1); }, { s:20, col:C.hostile });
  btn(W/2 - 310, y2 + 20, 300, 70, 'Cancel', () => { MP.view = 'menu'; MP.wantSpect = false; }, { s:20 });
  btn(W/2 + 10, y2 + 20, 300, 70, MP.wantSpect ? 'Watch' : 'Join', () => mpJoin(MP.code, { spect:MP.wantSpect }), { fill:code.length===5, disabled:code.length<5, s:22 });
  if(!inXR() && !MOB.touch) label('You can also type the code on your keyboard', W/2, y2 + 130, C.muted, 'center', 13);
  if(MP.err) T(MP.err, W/2, y2 + 160, { s:18, a:'center', c:C.hostile });
}
window.addEventListener('keydown', e => {
  if(UI.screen!=='mp' || MP.view!=='keypad') return;
  if(e.key==='Backspace'){ MP.code = MP.code.slice(0, -1); e.preventDefault(); return; }
  if(e.key==='Enter' && MP.code.length===5){ mpJoin(MP.code, { spect:MP.wantSpect }); return; }
  if(e.key==='Escape'){ MP.view = 'menu'; return; }
  const k = netCleanCode(e.key); if(k.length===1 && NET_CODE_CH.includes(k) && MP.code.length < 5) MP.code += k;
});
window.addEventListener('paste', e => { if(UI.screen==='mp' && MP.view==='keypad'){ const t = netCleanCode((e.clipboardData || window.clipboardData)?.getData('text') || ''); if(t) MP.code = t.slice(0, 5); } });
function mpOpenBrowse(){ MP.view = 'browse'; MP.rooms = []; MP.browseT = performance.now(); MP.stopBrowse && MP.stopBrowse(); MP.stopBrowse = netBrowse(list => { MP.rooms = list; }); }
function drawMPBrowse(){
  mpTitle('PUBLIC GAMES');
  para('Games their hosts chose to list. Rooms stay listed for a few minutes after the last update.', 80, 196, 900, { s:17, c:C.muted });
  panel(80, 230, 1440, 600, 12);
  const list = MP.rooms.slice(0, 8);
  if(!list.length) T(performance.now() - (MP.browseT||0) < 5000 ? 'Looking for games…' : 'No public games right now. Host one and tick "List publicly"!', 110, 290, { s:20, c:C.muted });
  list.forEach((r, i) => { const y = 248 + i*72, d = MP_MODES[r.mode] || { name:r.mode, col:C.ink }; rr(100, y, 1400, 62, 8); ctx.fillStyle = 'rgba(10,15,30,.8)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    T(r.code, 124, y+40, { s:26, f:FD, w:700, c:C.amber }); T(d.name, 260, y+28, { s:18, f:FD, w:700, c:d.col }); T(`Hosted by ${String(r.name||'?').slice(0,22)} · ${r.players||1}/${r.max||4}${r.live ? ' · in a run' : ' · in the lobby'}`, 260, y+50, { s:14, c:C.muted });
    if(r.mode==='spect' || r.live) btn(1110, y+9, 180, 44, 'Watch', () => mpJoin(r.code, { spect:true }), { s:16, col:'#ff8ad8', disabled:MP_MODES[r.mode]?.kind!=='shared' });
    btn(1302, y+9, 180, 44, 'Join', () => mpJoin(r.code), { s:16, fill:true, disabled:(r.players||1) >= (r.max||4) || r.mode==='spect' }); });
  btn(80, H-86, 200, 60, 'Back', () => { MP.stopBrowse && MP.stopBrowse(); MP.stopBrowse = null; MP.view = 'menu'; }, { s:18 });
  btn(300, H-86, 220, 60, 'Refresh', () => mpOpenBrowse(), { s:18, col:C.cyan });
}
function drawMPJoining(){
  mpTitle('CONNECTING');
  const t = performance.now()/1000; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(W/2 - 40 + i*40, 420, 10 + 6*Math.max(0, Math.sin(t*4 - i)), 0, 7); ctx.fillStyle = C.amber; ctx.fill(); }
  T(`Room ${MP.code}`, W/2, 330, { s:40, f:FD, w:700, a:'center', c:C.ink, ls:6 });
  T(NET.status || 'Looking for the host…', W/2, 500, { s:20, a:'center', c:C.muted });
  btn(W/2 - 150, 600, 300, 64, 'Cancel', () => { netLeave(true); MP.view = 'menu'; }, { s:20 });
}
function drawMPEnded(){
  mpTitle('THE HOST HAS GONE');
  para(`${MP.ended?.why || 'The session ended.'} You still have the run as it was. Keep flying it on your own, or head back.`, 80, 220, 1100, { s:21, lh:30 });
  btn(80, 340, 420, 72, 'Keep playing solo', () => mpKeepSolo(), { fill:true, s:22, col:C.good });
  btn(520, 340, 300, 72, 'Back to menu', () => { MP.ended = null; if(MP.guestData){ MP.guestData = false; applyMods(); } G = null; MP.view = 'menu'; }, { s:20 });
  if(MP.code) btn(840, 340, 300, 72, `Rejoin ${MP.code}`, () => { MP.ended = null; if(MP.guestData){ MP.guestData = false; applyMods(); } G = null; mpJoin(MP.code); }, { s:20, col:C.cyan });
  para('Rejoining works if the host is still there: say, after a dropped connection.', 80, 450, 1100, { s:16, c:C.muted });
}

/* the room: who's here, the settings, and the start button */
function drawMPRoom(){
  const def = mpMode() || { name:'Room', col:C.amber }, host = mpAmHost(), me = mpMe();
  label(host ? 'Your room' : 'You joined', 80, 92, C.cyan, 'left', 18); T(def.name.toUpperCase(), 76, 152, { s:52, f:FD, w:700, c:def.col, ls:3, max:900 });
  // the code, big enough to read across a room
  panel(W-600, 60, 520, 150, 12); label('Room code', W-576, 92, C.muted, 'left', 13);
  T(NET.code || '-----', W-576, 170, { s:72, f:FD, w:700, c:C.amber, ls:14 });
  if(!inXR() && navigator.clipboard) btn(W-210, 104, 110, 44, 'Copy link', () => { navigator.clipboard.writeText(mpInviteLink()).then(() => toast('Invite link copied.')).catch(() => toast('Could not copy. Read out the code instead.')); }, { s:14, loc:true });
  para(def.blurb || '', 80, 196, 860, { s:17, c:C.muted, lh:24, max:2 });
  // players
  label('Aboard', 80, 268, C.amber, 'left', 16);
  const list = NET.players;
  list.forEach((p, i) => { const y = 282 + i*76; panel(80, y, 860, 66, 10); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(116, y+33, 14, 0, 7); ctx.fill();
    T(p.name + (p.id===NET.id ? ' (you)' : ''), 146, y+30, { s:20, f:FD, w:700, max:340 }); const dv = p.dev==='vr' ? 'VR headset' : p.dev==='touch' ? 'Phone or tablet' : 'Computer';
    T(`${p.host ? 'Host · ' : ''}${dv}${p.ready ? ' · ready' : ''}`, 146, y+54, { s:13, c: p.ready ? C.good : C.muted });
    const R_ = ROLES[p.role] || ROLES.crew; T(R_.name, 600, y+30, { s:18, f:FD, w:700, c:R_.col }); T(R_.desc, 600, y+52, { s:12, c:C.muted, max:250 });
    const P = NET.peers.get(p.id); if(P && P.rtt) label(`${P.rtt} ms`, 920, y+30, P.rtt < 120 ? C.good : C.warn, 'right', 11);
    if(p.id===NET.id && mpKind()==='shared' && !['spect','hunt'].includes(NET.mode) && !p.spect) btn(780, y+12, 120, 42, 'Role ▾', () => mpCycleRole(), { s:14, loc:true }); });
  if(!list.length) T('Opening the room…', 100, 320, { s:18, c:C.muted });
  // settings
  const sx = 980; label('Settings', sx, 268, C.amber, 'left', 16); panel(sx, 282, 540, 470, 12);
  let sy = 300; const opt = (name, desc, val, onClick) => { T(name, sx+20, sy+26, { s:17, f:FD, w:700 }); T(desc, sx+20, sy+48, { s:12, c:C.muted, max:330 });
    btn(sx+360, sy+8, 160, 44, val, host ? onClick : null, { s:15, disabled:!host, col:C.cyan }); sy += 66; };
  sy = mpHook('options', opt, sx, sy) ?? sy;
  if(mpKind()==='shared'){
    if(NET.mode!=='spect' && NET.mode!=='hunt'){ opt('Stick to stations', 'Each player only works their own role\'s panels', MP.opts.strict ? 'On' : 'Off', () => { MP.opts.strict = !MP.opts.strict; mpBroadcastOpts(); });
      opt('Event choices', 'Who answers beacons, hails and offers', MP.opts.choices==='captain' ? 'Captain' : 'Anyone', () => { MP.opts.choices = MP.opts.choices==='captain' ? 'any' : 'captain'; mpBroadcastOpts(); });
      opt('Viewers', 'Let friends watch without playing', MP.opts.viewers ? 'Welcome' : 'No', () => { MP.opts.viewers = !MP.opts.viewers; mpBroadcastOpts(); }); }
    opt('Auto-pause', 'Pause for everyone when crew die or hull is critical', MP.opts.smartPause ? 'On' : 'Off', () => { MP.opts.smartPause = !MP.opts.smartPause; mpBroadcastOpts(); });
  }
  opt('List publicly', 'Show this room in Browse public games', MP.opts.public ? 'Listed' : 'Private', () => { MP.opts.public = !MP.opts.public; NET.public = MP.opts.public; mpBroadcastOpts(); if(!MP.opts.public) netAdvertise(true); });
  // status and feed
  const fy = 282 + Math.max(1, list.length)*76 + 16; panel(80, fy, 860, Math.max(120, 752 - fy), 10); label('Room log', 100, fy+28, C.muted, 'left', 12);
  MP.feed.slice(-Math.max(1, Math.floor((752 - fy - 40)/24))).forEach((f, i) => T(f.text, 100, fy+56 + i*24, { s:14, c:f.col, max:820 }));
  // buttons
  btn(80, H-86, 220, 60, host ? 'Close room' : 'Leave', () => { if(host) netSend({ t:'end', why:'The host closed the room.' }); mpLeave(); UI.screen = 'mp'; MP.view = 'menu'; }, { s:18, col:C.hostile, loc:true });
  btn(320, H-86, 220, 60, 'Quick chat', () => { MP.chatOpen = !MP.chatOpen; }, { s:18, loc:true });
  if(typeof voiceButton==='function') voiceButton(560, H-86, 200, 60);
  if(mpHook('start', host)) {}
  else if(host){ const hasSave = !!LS.get(SAVE_KEY, null);
    if(mpKind()==='shared'){ if(hasSave) btn(W-760, H-86, 330, 60, 'Continue saved run', () => { if(!loadSave()) toast('That save could not be loaded.'); }, { s:18 });
      btn(W-410, H-86, 330, 60, G ? 'Back to the run' : 'Pick a ship', () => { if(G){ UI.screen = 'game'; return; } MP.toHangar = true; openHangar(); }, { fill:true, s:20 }); } }
  else T(mpKind()==='shared' ? 'The host picks the ship. You\'ll be aboard as soon as the run starts.' : 'Waiting for the host to start…', W-80, H-48, { s:16, a:'right', c:C.muted });
}
function mpInviteLink(){ return location.origin + location.pathname + '#join=' + NET.code; }
function mpCycleRole(){ const opts = { coop:['captain','helm','tactical','engineer','crew'], nav:['captain','navigator','crew'], away:['captain','boarder','tactical','engineer','crew'] }[NET.mode] || ['crew'];
  const cur = mpRole(); const next = opts[(opts.indexOf(cur) + 1) % opts.length];
  if(mpAmHost()){ const p = NET.players.find(x => x.id===NET.id); if(p) p.role = next; mpBroadcastPlayers(); } else { netSend({ t:'role', role:next }); const p = NET.players.find(x => x.id===NET.id); if(p) p.role = next; } }
function drawQuickChat(){
  const x = W/2 - 420, y = H/2 - 200, w = 840, h = 400; ctx.fillStyle = 'rgba(4,6,12,.6)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { MP.chatOpen = false; }, null, true);
  panel(x, y, w, h, 14); label('Quick chat', x+24, y+40, C.amber, 'left', 16); label('1–9 on the keyboard', x+w-24, y+40, C.muted, 'right', 12);
  region(x, y, w, h, () => {}, null, true);
  QUICK.forEach((q, i) => btn(x+24 + (i%4)*200, y+64 + Math.floor(i/4)*64, 188, 54, q, () => mpSay(i), { s:16, loc:true }));
  EMOJI.forEach((e, i) => btn(x+24 + i*100, y+h-90, 88, 64, e, () => mpSay(i, true), { s:30, loc:true }));
}

/* ---------------- in the game: who's aboard, where they point, what they say ---------------- */
function drawMPHud(){
  if(!NET.on || !NET.mode) return;
  let x = 400;
  if(mpKind()==='shared'){
    const list = NET.players.filter(p => !p.spect || p.host);
    for(const p of list){ const R_ = ROLES[p.role] || ROLES.crew, txt = `${p.name} · ${R_.name}`; x = mpChip(x, p.color, txt, p.id===NET.id); }
    const viewers = NET.players.filter(p => p.spect && !p.host).length; if(viewers) { T(`👁 ${viewers}`, x+6, 91, { s:12, f:FD, w:600, c:'#ff8ad8' }); x += 46; }
    if(mpAmHost()) T(`Room ${NET.code}`, 1576, 91, { s:12, f:FD, w:700, a:'right', c:C.amber });
    if(SYNC.pausedBy && G && G.paused) T(`Paused by ${SYNC.pausedBy}`, W/2, 134, { s:14, a:'center', c:C.muted });
    else if(SYNC.guest && SYNC.u.pausedBy && G && G.paused) T(`Paused by ${SYNC.u.pausedBy}`, W/2, 134, { s:14, a:'center', c:C.muted });
    if(SYNC.spect) { rr(W/2-150, 100, 300, 26, 13); ctx.fillStyle = 'rgba(60,16,48,.9)'; ctx.fill(); T(NET.mode==='hunt' ? 'FLEET COMMAND' : 'WATCHING LIVE', W/2, 118, { s:14, f:FD, w:700, a:'center', c:'#ff8ad8', ls:2 }); }
    if(typeof drawHuntPanel==='function') drawHuntPanel();
    if(SYNC.spect && NET.mode!=='hunt'){ const bx = W-8*62-24; panel(bx-10, H-74, 8*62+16, 64, 10); EMOJI.forEach((e, i) => btn(bx + i*62, H-68, 56, 52, e, () => mpSay(i, true), { s:26, loc:true })); }
  }
  const nx = mpHook('hud', x); if(typeof nx==='number') x = nx;
  btn(x+6, 77, 64, 19, 'Chat', () => { MP.chatOpen = !MP.chatOpen; }, { s:11, loc:true });
  if(typeof voiceButton==='function' && !SYNC.spect) voiceButton(x+76, 77, 84, 19);
}
/* a little name tag in the strip under the top bar */
function mpChip(x, col, txt, bold){ ctx.font = `600 13px ${FD}`; const w = Math.min(300, ctx.measureText(txt).width + 30);
  rr(x, 78, w, 17, 8); ctx.fillStyle = 'rgba(8,12,24,.88)'; ctx.fill(); ctx.strokeStyle = hexA(col, .8); ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.arc(x+10, 86.5, 4.5, 0, 7); ctx.fillStyle = col; ctx.fill(); T(txt, x+20, 91, { s:12, f:FD, w:600, c:bold ? C.ink : hexA(C.ink,.85), max:w-24 }); return x + w + 6; }
/* drawn last, over everything: other players' pointers, speech and emoji */
function drawMPOverlay(){
  if(!NET.on || !NET.mode) return;
  const v = UI.screen!=='game' ? UI.screen : G && G.modal ? G.modal.type : 'game';
  if(typeof drawAvatarMarkers==='function') drawAvatarMarkers();
  for(const id in SYNC.ptrs){ const q = SYNC.ptrs[id]; if(!q.on || q.v!==v || q.age > 3) continue; const p = mpPlayer(id); if(!p) continue;
    const a = Math.max(0, 1 - Math.max(0, q.age - 2)); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x+4, q.y+20); ctx.lineTo(q.x+9, q.y+14); ctx.lineTo(q.x+18, q.y+14); ctx.closePath(); ctx.fillStyle = p.color; ctx.fill(); ctx.strokeStyle = '#0b0f1c'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `600 13px ${FD}`; const w = ctx.measureText(p.name).width + 14; rr(q.x+16, q.y+18, w, 20, 6); ctx.fillStyle = hexA(p.color, .9); ctx.fill(); T(p.name, q.x+23, q.y+33, { s:13, f:FD, w:600, c:'#0b0f1c' });
    ctx.globalAlpha = 1; }
  // speech: by the speaker's pointer, else along the left
  let k = 0; for(const s of SYNC.says){ const q = SYNC.ptrs[s.id], here = q && q.on && q.v===v && q.age < 3; const a = Math.min(1, (4 - s.t)*2);
    const x = here ? q.x + 20 : 40, y = here ? q.y - 34 : 420 - (k++)*40; ctx.globalAlpha = a;
    ctx.font = `700 17px ${FD}`; const txt = here ? s.text : `${s.name}: ${s.text}`, w = ctx.measureText(txt).width + 26;
    rr(x, y, w, 32, 10); ctx.fillStyle = 'rgba(244,247,255,.96)'; ctx.fill(); ctx.strokeStyle = s.col; ctx.lineWidth = 3; ctx.stroke(); T(txt, x+13, y+22, { s:17, f:FD, w:700, c:'#141b31' }); ctx.globalAlpha = 1; }
  if(MP.chatOpen && (UI.screen==='game' || UI.screen==='mp')){ UI.hint = null; drawQuickChat(); }
  for(const r of SYNC.react){ const k_ = r.t/3.2; ctx.globalAlpha = Math.min(1, (1 - k_)*2); T(r.e, r.x + Math.sin(r.t*3)*14, H - 120 - k_*520, { s:44 + 10*Math.sin(r.t*5), a:'center', b:'middle' }); ctx.globalAlpha = 1; }
}
/* the end-of-run screen in a shared game */
function mpEndButtons(win){
  if(NET.on && mpHook('endButtons', win)) return true;
  if(!NET.on || mpKind()!=='shared') return false;
  if(SYNC.guest){ T('The host decides what happens next.', W/2, 920, { s:18, a:'center', c:C.muted }); btn(W/2+340, 884, 300, 72, 'Leave', () => mpLeave(), { s:20, col:C.hostile, loc:true }); return true; }
  btn(W/2-640, 884, 300, 72, 'Back to the room', () => { G = null; UI.screen = 'mp'; MP.view = 'room'; }, { s:20 });
  btn(W/2-320, 884, 300, 72, 'New run together', () => { G = null; MP.toHangar = true; openHangar(); }, { fill:true, s:20 });
  btn(W/2+340, 884, 300, 72, 'End session', () => { netSend({ t:'end', why:'The host ended the session.' }); mpLeave(); UI.screen = 'title'; G = null; }, { s:20, col:C.hostile });
  return true;
}
/* host: keep the game going when the tab is in the background (browsers slow timers a lot, but not to zero) */
let MP_BG = null;
document.addEventListener('visibilitychange', () => {
  clearInterval(MP_BG); MP_BG = null;
  if(document.hidden && NET.on && NET.role==='host'){ let last = performance.now(); MP_BG = setInterval(() => { const now = performance.now(), dt = Math.min(.25, (now - last)/1000); last = now; try{ update(dt); }catch(e){} }, 100); }
});
/* each frame: network upkeep */
function netFrame(dt){
  if(!NET.on) return;
  netTick(dt);
  if(typeof syncFrame==='function') syncFrame(dt);
  mpHook('frame', dt);
}
/* open a room straight from an invite link: …index.html#join=ABCDE */
function mpCheckLink(){ if(typeof mpCodesCheckLink==='function' && mpCodesCheckLink()) return true; const m = /[#&]join=([A-Za-z0-9]{5})/.exec(location.hash || ''); if(m){ history.replaceState(null, '', location.pathname + location.search); setTimeout(() => mpJoin(m[1]), 300); return true; } return false; }
