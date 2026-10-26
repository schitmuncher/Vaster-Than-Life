'use strict';
/* =========================================================================
   Versus modes.
   Duel arena: each player builds a ship in a store that sells everything,
   on the same budget, then the two ships fight. Each player's own game runs
   their own ship (power, crew, shields, dodging, damage); the opponent's ship
   on screen is a copy kept up to date ten times a second. Shots, boarders,
   hacking pulses and mind control cross over as messages, and whoever is hit
   works out the hit and reports what it looked like. Best of three.
   Boarding brawl: the host's game runs one ship with both crews aboard; the
   guest's copy shows their own crew as theirs. Last crew standing takes the round.
   ========================================================================= */
const DUEL = { phase:'idle', round:0, wins:{}, build:null, builds:{}, opp:null, myPrev:null, sendT:0, roundT:0, landed:{}, downs:{}, countEnd:0, result:null, ready:{}, last:null };
const DUEL_BUDGET = { small:150, medium:300, large:500 };
function duelOn(){ return NET.on && NET.mode==='duel'; }
function duelOppId(){ const o = NET.players.find(p => p.id!==NET.id && !p.spect); return o ? o.id : null; }
function duelOppName(){ const o = NET.players.find(p => p.id!==NET.id && !p.spect); return o ? o.name : 'Opponent'; }
const FLIPK = new Set(['owner','side','orbit','by','from','to','lastBy']);
function flipDeep(o){ if(!o || typeof o!=='object') return o; if(Array.isArray(o)){ for(const x of o) flipDeep(x); return o; }
  for(const k in o){ const v = o[k]; if(FLIPK.has(k) && (v==='p' || v==='e')) o[k] = v==='p' ? 'e' : 'p'; else if(v && typeof v==='object') flipDeep(v); } return o; }

/* ---------------- the room ---------------- */
function duelOptions(opt, sx, sy){
  opt('Budget', 'Scrap each player gets to build with', { small:'Small · 150', medium:'Medium · 300', large:'Large · 500' }[MP.opts.budget] || 'Medium', () => { const k = Object.keys(DUEL_BUDGET); MP.opts.budget = k[(k.indexOf(MP.opts.budget) + 1) % k.length]; mpBroadcastOpts(); });
  opt('Rounds', 'First to win most of them takes the match', `Best of ${MP.opts.rounds||3}`, () => { MP.opts.rounds = ({ 1:3, 3:5, 5:1 })[MP.opts.rounds||3]; mpBroadcastOpts(); });
  return sy;
}
function duelStartBtn(host){
  if(!host){ T('The host starts the match when you\'re both here.', W-80, H-48, { s:16, a:'right', c:C.muted }); return true; }
  const two = !!duelOppId();
  btn(W-410, H-86, 330, 60, two ? 'Start: build your ships' : 'Waiting for an opponent…', () => { const m = { t:'dstart', budget:DUEL_BUDGET[MP.opts.budget] || 300, rounds:MP.opts.rounds || 3 }; for(const P of NET.peers.values()) if(P.open && P.joined) netSend({ t:'data', data:DATA }, P.id); netSend(m); duelBegin(m); }, { fill:two, disabled:!two, s:20 });
  return true;
}
netOn('dstart', (m) => { if(duelOn() && NET.role==='guest') duelBegin(m); });
function duelBegin(m){ DUEL.phase = 'pick'; DUEL.round = 0; DUEL.wins = {}; DUEL.builds = {}; DUEL.ready = {}; DUEL.budget = m.budget; DUEL.rounds = m.rounds; DUEL.result = null;
  UI._thumbs = {}; UI.selShip = UI.selShip && DATA.ships[UI.selShip] ? UI.selShip : Object.keys(DATA.ships)[0]; UI.shipName = null; UI.seed = null; MP.toHangar = true; UI.screen = 'select'; toast('Pick a hull to build on.'); }
/* the hangar picks the hull; every ship is open in the arena */
function duelHangar(sel){
  btn(1240, 890, 300, 70, 'Build it', () => duelArena(sel, UI.shipName), { fill:true, s:26 });
  btn(1060, 890, 160, 70, 'Leave', () => { mpLeave(); UI.screen = 'mp'; MP.view = 'menu'; });
  return true;
}
/* a small game with one beacon: a store that sells everything */
function duelArena(shipId, name){
  const def = DATA.ships[shipId] || Object.values(DATA.ships)[0];
  G = { seed:randomSeed(), daily:null, cup:null, challenge:null, chDone:false, diff:'normal', shipDef:def.id, ship:null, enemy:null, proj:[], fx:[], units:[], sector:3, sectorType:'civilian',
    scrap:DUEL.budget || 300, fuel:0, missiles:def.missiles ?? 8, parts:def.parts ?? R.startParts, paused:false, modal:null, ftl:0, warp:0, warpNode:null, fleetX:-9, boss:false, dieT:0, shake:0, flash:0,
    map:{ nodes:[{ x:.5, y:.5, col:0, type:'store', links:[], visited:true, store:null, hazard:null, nebula:false, distress:false, quest:null }], cur:0, trail:[0] },
    hazard:null, hzT:99, hzWarn:false, nebula:false, autofire:true, combatT:0, time:0, afterWin:null, flag:null, questQueue:[],
    stats:{ kills:0, scrap:0, jumps:0, shotDown:0, boardKills:0 }, dna:[], lost:[], flags:{}, seen:{}, later:[], log:[], chat:[], mapPieces:0, hold:false, crewAuto:true, duel:true, noSave:true, noInvite:true };
  G.ship = makeShip(def, 'p', { name });
  const all = k => Object.values(DATA[k]).filter(x => !x.noLoot).map(x => x.id);
  G.map.nodes[0].store = { weapons:all('weapons'), drones:all('drones'), augments:Object.keys(DATA.augments), systems:Object.keys(INSTALL).filter(k => !G.ship.systems[k]), sold:[], crewRace:'human', crewSold:false, discount:1, arena:true };
  DUEL.phase = 'build'; UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; UI.storeTab = 'weapons'; UI.storePage = 0;
  G.modal = { type:'store', node:0 };
}
function duelReady(){
  if(!G || DUEL.phase!=='build') return; G.modal = null;
  for(const r of G.ship.rooms){ r.fire = 0; r.breach = 0; r.o2 = 100; }
  for(const c of G.ship.crew){ c.hp = c.maxHp; c.path = []; }
  autoPowerWeapons(G.ship);
  DUEL.build = { ship:san(G.ship, 'ship'), missiles:G.missiles, parts:G.parts, name:G.ship.name }; DUEL.phase = 'ready';
  if(mpAmHost()){ DUEL.builds[NET.id] = DUEL.build; duelMaybeRound(); } else netSend({ t:'dready', build:DUEL.build });
  toast(`Ready. Waiting for ${duelOppName()}…`); sfx('lock');
}
netOn('dready', (m, P) => { if(!duelOn() || !mpAmHost() || !m.build) return; DUEL.builds[P.id] = m.build; mpFeed(`${P.name} is ready.`, mpColor(P.id)); duelMaybeRound(); });
function duelMaybeRound(){ const o = duelOppId(); if(DUEL.builds[NET.id] && o && DUEL.builds[o]) duelNextRound(); }
function duelNextRound(){ const m = { t:'dround', round:DUEL.round + 1, builds:DUEL.builds, inMs:3500 }; netSend(m); duelRound(m); }
netOn('dround', (m) => { if(duelOn() && NET.role==='guest') duelRound(m); });
/* a round: both ships fresh from the build, a countdown, then fight */
function duelRound(m){
  const mine = m.builds[NET.id] || DUEL.build, oid = duelOppId(), theirs = oid && m.builds[oid]; if(!mine || !theirs) return;
  DUEL.builds = m.builds; DUEL.build = mine; DUEL.round = m.round; DUEL.phase = 'count'; DUEL.countEnd = performance.now() + (m.inMs || 3500); DUEL.roundT = 0; DUEL.downs = {}; DUEL.downSent = false; DUEL.landed = {}; DUEL.result = null;
  if(!G || !G.duel) duelArena(mine.ship.id in DATA.ships ? mine.ship.id : Object.keys(DATA.ships)[0], mine.name);
  G.modal = null; G.ship = clone(mine.ship); buildGraph(G.ship); G.missiles = mine.missiles; G.parts = mine.parts; G.scrap = 0;
  for(const c of G.ship.crew){ c.hp = c.maxHp; c.path = []; c.aiT = Math.random(); c.mcT = 0; c.stunT = 0; c.manualT = 0; }
  const e = flipDeep(clone(theirs.ship)); e.isEnemy = true; e.name = `${theirs.name || e.name} (${duelOppName()})`; buildGraph(e); G.enemy = e; G.enemy.faction = 'generic';
  DUEL.opp = clone(theirs.ship); DUEL.myPrev = clone(mine.ship);
  G.proj = []; G.units = []; G.fx = []; G.combatT = 0; G.time = 0; G.ftl = 0; G.dieT = 0; G.paused = false;
  const s = G.ship; if(hasAug(s,'voltanShield')) s.super = Math.max(s.super, 5); if(augFx(s,'superShield') > 0) s.super = Math.max(s.super, Math.round(augFx(s,'superShield')));
  UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; sfx('alarm');
}
function duelFrame(dt){
  if(!duelOn() || !G || !G.duel) return;
  if(DUEL.phase==='count' && performance.now() >= DUEL.countEnd){ DUEL.phase = 'fight'; sfx('ftlready'); toast('Fight!'); }
  if(DUEL.phase==='fight'){ if(G.paused){ G.paused = false; if(!DUEL.pauseWarn){ DUEL.pauseWarn = true; toast('No pausing in the arena: your opponent is still fighting.'); } }
    DUEL.sendT -= dt; if(DUEL.sendT <= 0){ DUEL.sendT = .1; duelSend(); } }
  if(DUEL.phase==='round' && mpAmHost() && performance.now() >= DUEL.nextAt){ DUEL.nextAt = Infinity; const need = Math.ceil((DUEL.rounds||3)/2), done = Object.values(DUEL.wins).some(n => n >= need) || DUEL.round >= (DUEL.rounds||3);
    if(done){ const m = { t:'dfinal', wins:DUEL.wins }; netSend(m); duelFinal(m); } else duelNextRound(); }
}
function duelHold(){ return !!(G && G.duel && DUEL.phase!=='fight' && DUEL.phase!=='build'); }
/* my ship, ten times a second */
function duelSend(){
  const p = dif(DUEL.myPrev, G.ship, 'ship'); if(p) applyChild(DUEL, 'myPrev', p);
  netFast({ t:'du', u:G.units.filter(u => !u.pup).map(u => san(u, 'units')) });
  if(p) netSend({ t:'ds', p });
}
netOn('ds', (m) => { if(!duelOn() || !G || !G.duel || !DUEL.opp || !G.enemy) return; applyChild(DUEL, 'opp', m.p);
  const f = flipDeep(clone(DUEL.opp)); f.isEnemy = true; f.name = G.enemy.name; f.faction = 'generic'; G.enemy = syncTo(G.enemy, f, 'enemy'); if(!G.enemy.adj) buildGraph(G.enemy); });
netOn('du', (m) => { if(!G || !G.duel) return; const mine = G.units.filter(u => !u.pup); for(const u of m.u || []){ flipDeep(u); u.pup = true; const old = G.units.find(x => x.pup && x.id===u.id); if(old){ u._x = old._x; u._y = old._y; } mine.push(u); } G.units = mine; });
/* shots: mine fly to their game; theirs land in mine */
function duelLaunch(p){
  if(!G || !G.duel || p.from!=='p' || p.to!=='e' || DUEL.phase!=='fight') return;
  netSend({ t:'dsh', id:p.id, d:san(p.d, 'd'), room:p.room, rooms:p.rooms, dur:p.dur, t0:p.t, kind:p.kind, bp:p.bp, unit:p.unit });
}
netOn('dsh', (m) => { if(!G || !G.duel || DUEL.phase!=='fight' || !m.d) return; const room = G.ship.rooms[m.room] ? m.room : 0;
  launch('e', 'p', m.d, room, { id:m.id, rooms:m.rooms ? m.rooms.filter(r => G.ship.rooms[r]) : undefined, dur:m.dur, t:m.t0 || 0, kind:m.kind, bp:m.bp, unit:m.unit }); });
function duelResolve(p){
  if(p.to==='e'){ if(p.kind==='bdrone') DUEL.landed[p.id] = performance.now(); return; }   // their game works out what my shot did
  FX_CAP = []; const before = G.ship.hull;
  try{ if(p.kind==='bdrone' && G.duel){ resolve_(p); const c = G.ship.crew[G.ship.crew.length-1]; if(c && c.drone) c.id = p.id; } else resolve_(p); } finally { const cap = FX_CAP; FX_CAP = null; netSend({ t:'dres', id:p.id, room:p.room, fx:cap.slice(0, 6), dmg:before - G.ship.hull }); }
}
netOn('dres', (m) => { if(!G || !G.duel || !G.enemy) return; G.proj = G.proj.filter(q => q.id!==m.id); const e = G.enemy;
  for(const [type, text] of m.fx || []) fxAtRoom(e, m.room, type, text);
  const c = roomCenter(e, m.room); if(m.dmg > 0){ burst(c.x, c.y, .5 + .3*m.dmg, '#ffb547'); if(m.dmg > 1) debris(c.x, c.y, e.color, 4); sfx('hit'); } else if((m.fx||[]).some(f => f[0]==='shield' || f[0]==='super')) sfx('shield'); else if((m.fx||[]).some(f => f[1]==='MISS')) sfx('miss'); });
function duelZap(tg){ if(tg.from==='e') netSend({ t:'dzap', id:tg.id }); }
netOn('dzap', (m) => { if(!G || !G.duel) return; const p = G.proj.find(q => q.id===m.id); if(p){ fx('zap', p._x ?? 1100, p._y ?? 330); G.proj = G.proj.filter(q => q!==p); } });
function duelUnitKill(u){ netSend({ t:'dukill', id:u.id }); }
netOn('dukill', (m) => { if(!G || !G.duel) return; const u = G.units.find(x => !x.pup && x.id===m.id); if(u) destroyUnit(u); });
function duelUnitAlive(id){ const t = DUEL.landed[id]; if(t && performance.now() - t < 2500) return true; return !!(G.enemy && G.enemy.crew.some(c => c.id===id)); }
/* boarding parties */
function duelBoard(group, room){ const sh = G.ship; for(const c of group){ const k = sh.crew.indexOf(c); if(k>=0) sh.crew.splice(k, 1); }
  netSend({ t:'dboard', room, crew:group.map(c => san(c, 'crew')) }); if(UI.selCrew && group.some(c => c.id===UI.selCrew)) UI.selCrew = null; }
netOn('dboard', (m) => { if(!G || !G.duel) return; const room = G.ship.rooms[m.room] ? m.room : 0;
  for(const c of m.crew || []){ flipDeep(c); c.netCtl = true; c.path = []; c.aiT = 0; G.ship.crew.push(c); placeCrew(G.ship, c, room); }
  fxAtRoom(G.ship, room, 'tele'); sfx('intruder'); toast(`${duelOppName()}'s crew beam aboard!`); });
function duelOrder(group, room){ netSend({ t:'dorder', ids:group.map(c => c.id), room }); for(const c of group) c.manualT = 10; sfx('lock'); }
netOn('dorder', (m) => { if(!G || !G.duel) return; for(const id of m.ids || []){ const c = G.ship.crew.find(x => x.id===id && x.netCtl); if(c && G.ship.rooms[m.room]) orderMove(G.ship, c, m.room); } });
function duelRecall(){ netSend({ t:'drecall' }); }
netOn('drecall', () => { if(!G || !G.duel) return; const back = G.ship.crew.filter(c => c.netCtl && !c.drone && c.mcT<=0); G.ship.crew = G.ship.crew.filter(c => !back.includes(c));
  netSend({ t:'dreturn', crew:back.map(c => san(c, 'crew')) }); });
netOn('dreturn', (m) => { if(!G || !G.duel) return; const tr = Math.max(0, roomOf(G.ship, 'teleporter'));
  for(const c of m.crew || []){ flipDeep(c); delete c.netCtl; c.path = []; c.mcT = 0; G.ship.crew.push(c); placeCrew(G.ship, c, tr); } fxAtRoom(G.ship, tr, 'tele'); });
function duelDied(c){ netSend({ t:'ddied', c:san(c, 'crew') }); }
netOn('ddied', (m) => { if(!G || !G.duel || !m.c) return; const c = flipDeep(m.c); delete c.netCtl; c.path = [];
  if(G.ship.systems.clonebay){ G.ship.clones.push({ c, t:12 }); toast(`${c.name} died aboard the enemy. The clone bay is regrowing them.`); } else { toast(`${c.name} died aboard the enemy ship.`); G.lost.push(c.name); sfx('death'); } });
function duelMind(c){ netSend({ t:'dmind', id:c.id, t2:c.mcT }); }
netOn('dmind', (m) => { if(!G || !G.duel) return; const c = G.ship.crew.find(x => x.id===m.id); if(c){ c.mcT = clamp(+m.t2||10, 1, 30); c.path = []; toast(`${c.name} has been mind controlled!`); sfx('mind'); } });
function duelPulse(t){ netSend({ t:'dpulse', t2:t }); }
netOn('dpulse', (m) => { if(!G || !G.duel) return; const h = G.ship.hacked; if(h && h.by==='e'){ h.pulseT = clamp(+m.t2||4, 1, 12); sfx('zap'); } });
/* the end of a round: the host referees */
function duelTick(dt){
  if(!G || !G.duel) return false;
  if(DUEL.phase==='fight'){ DUEL.roundT += dt;
    if(!DUEL.downSent && (G.ship.hull<=0 || ownerCrewCount('p')===0)){ DUEL.downSent = true; G.ship.hull = Math.max(0, G.ship.hull); const b = G.ship._b; if(b) for(let i=0;i<6;i++) burst(rand(b.x0,b.x1), rand(b.y0,b.y1), 1.4, '#ff8a3d'); sfx('explode');
      if(mpAmHost()) duelDown(NET.id); else netSend({ t:'ddown', round:DUEL.round }); }
    if(mpAmHost() && DUEL.roundT > 240 && !DUEL.timeUp){ DUEL.timeUp = true; const a = G.ship.hull/G.ship.maxHull, b = G.enemy ? G.enemy.hull/G.enemy.maxHull : 0; duelDecide(Math.abs(a - b) < .02 ? null : a > b ? NET.id : duelOppId(), 'Time! The ship with more hull left takes it.'); }
  }
  return true;   // no ordinary run ending in the arena
}
netOn('ddown', (m, P) => { if(duelOn() && mpAmHost() && m.round===DUEL.round) duelDown(P.id); });
function duelDown(id){ if(DUEL.phase!=='fight' || DUEL.downs[id]) return; DUEL.downs[id] = performance.now(); if(!DUEL.decideT) DUEL.decideT = setTimeout(() => { DUEL.decideT = null; const ids = Object.keys(DUEL.downs); duelDecide(ids.length >= 2 ? null : ids[0]===NET.id ? duelOppId() : NET.id); }, 500); }
function duelDecide(winner, why){ if(DUEL.phase!=='fight') return; if(winner) DUEL.wins[winner] = (DUEL.wins[winner]||0) + 1; const m = { t:'dresult', round:DUEL.round, winner, wins:DUEL.wins, why:why||'' }; netSend(m); duelResult(m); DUEL.nextAt = performance.now() + 4500; DUEL.timeUp = false; }
netOn('dresult', (m) => { if(duelOn() && NET.role==='guest') duelResult(m); });
function duelResult(m){ DUEL.phase = 'round'; DUEL.wins = m.wins || DUEL.wins; DUEL.result = m; const me = m.winner===NET.id;
  sfx(m.winner ? (me ? 'victory' : 'defeat') : 'alarm'); toast(m.winner ? (me ? `Round ${m.round} is yours!` : `${duelOppName()} takes round ${m.round}.`) : `Round ${m.round} is a draw.`); }
netOn('dfinal', (m) => { if(duelOn() && NET.role==='guest') duelFinal(m); });
function duelFinal(m){ DUEL.phase = 'done'; DUEL.wins = m.wins || DUEL.wins; const mine = DUEL.wins[NET.id] || 0, theirs = DUEL.wins[duelOppId()] || 0;
  if(mine > theirs){ grant('duelwin'); PROFILE.duels = PROFILE.duels || { w:0, l:0 }; PROFILE.duels.w++; } else if(theirs > mine){ PROFILE.duels = PROFILE.duels || { w:0, l:0 }; PROFILE.duels.l++; } saveProfile();
  G = null; UI.screen = 'mp'; MP.view = 'vsres'; MP.vs = { kind:'duel', mine, theirs, opp:duelOppName() }; }
/* the arena's banner */
function duelHud(x){
  if(!G || !G.duel) return x; const opp = duelOppName(), mine = DUEL.wins[NET.id] || 0, theirs = DUEL.wins[duelOppId()] || 0;
  x = mpChip(x, C.amber, `Duel · round ${Math.max(1, DUEL.round)} of ${DUEL.rounds||3} · you ${mine} – ${theirs} ${opp}`, true);
  if(DUEL.phase==='build'){ panel(W/2-330, 100, 660, 64, 10); T(`Build your ship: ${G.scrap} scrap left`, W/2-310, 140, { s:20, f:FD, w:700, c:C.amber });
    btn(W/2+170, 108, 150, 48, 'Ready', () => duelReady(), { fill:true, s:18, col:C.good, loc:true }); }
  if(DUEL.phase==='ready'){ panel(W/2-260, 100, 520, 50, 10); T(`Waiting for ${opp} to finish building…`, W/2, 132, { s:18, a:'center', c:C.muted }); }
  if(DUEL.phase==='count'){ const n = Math.ceil((DUEL.countEnd - performance.now())/1000); T(n > 0 ? String(n) : 'FIGHT', W/2, 380, { s:160, f:FD, w:700, a:'center', b:'middle', c:C.amber }); T(`Round ${DUEL.round}`, W/2, 250, { s:30, f:FD, w:700, a:'center', c:C.ink }); }
  if(DUEL.phase==='round' && DUEL.result){ const r = DUEL.result, me = r.winner===NET.id; panel(W/2-360, 230, 720, 170, 14);
    T(r.winner ? (me ? 'ROUND WON' : 'ROUND LOST') : 'DRAW', W/2, 300, { s:56, f:FD, w:700, a:'center', c: r.winner ? (me ? C.good : C.hostile) : C.amber });
    T(r.why || `You ${mine} – ${theirs} ${opp}`, W/2, 352, { s:18, a:'center', c:C.muted }); }
  if(DUEL.phase==='fight' && DUEL.roundT > 200) T(`${Math.max(0, Math.ceil(240 - DUEL.roundT))}s`, W/2, 134, { s:18, f:FD, w:700, a:'center', c:C.warn });
  return x;
}

/* ---------------- boarding brawl ---------------- */
const BRAWL = { picks:{}, ready:{}, sel:[], phase:'idle' };
const BRAWL_PTS = { small:6, medium:9, large:12 };
function brawlOn(){ return NET.on && NET.mode==='brawl'; }
function brawlCost(race){ const r = DATA.races[race] || {}; return clamp(Math.round((r.hp||100)/100*1.2 + (r.combat??1)*1.4 - .6), 1, 4); }
function brawlRaces(){ return Object.keys(DATA.races).filter(k => !DATA.races[k].secret); }
function brawlOptions(opt, sx, sy){
  opt('Crew budget', 'Points to spend on up to four crew', { small:'Small · 6', medium:'Medium · 9', large:'Large · 12' }[MP.opts.budget] || 'Medium', () => { const k = Object.keys(BRAWL_PTS); MP.opts.budget = k[(k.indexOf(MP.opts.budget) + 1) % k.length]; mpBroadcastOpts(); });
  opt('Rounds', 'First to win most of them takes the match', `Best of ${MP.opts.rounds||3}`, () => { MP.opts.rounds = ({ 1:3, 3:5, 5:1 })[MP.opts.rounds||3]; mpBroadcastOpts(); });
  return sy;
}
function brawlStartBtn(host){
  if(!host){ T('The host starts the brawl when you\'re both here.', W-80, H-48, { s:16, a:'right', c:C.muted }); return true; }
  const two = !!duelOppId();
  btn(W-410, H-86, 330, 60, two ? 'Start: pick your crews' : 'Waiting for an opponent…', () => { netSend({ t:'bstart' }); brawlPickOpen(); BRAWL.picks = {}; BRAWL.wins = {}; BRAWL.round = 0; }, { fill:two, disabled:!two, s:20 });
  return true;
}
netOn('bstart', () => { if(brawlOn()) brawlPickOpen(); });
function brawlPickOpen(){ BRAWL.sel = []; BRAWL.sent = false; UI.screen = 'mp'; MP.view = 'brawlpick'; }
function drawBrawlPick(){
  mpTitle('PICK YOUR CREW', 'Boarding brawl');
  const pts = BRAWL_PTS[MP.opts.budget] || 9, used = BRAWL.sel.reduce((t, r) => t + brawlCost(r), 0);
  para('Up to four crew. Tougher fighters cost more. Both crews start at opposite ends of the same ship; the medbay heals whoever stands in it.', 80, 196, 1100, { s:17, c:C.muted });
  brawlRaces().forEach((k, i) => { const r = DATA.races[k], x = 80 + (i%3)*480, y = 250 + Math.floor(i/3)*170, cost = brawlCost(k), can = !BRAWL.sent && BRAWL.sel.length < 4 && used + cost <= pts;
    panel(x, y, 460, 156, 10); drawPortrait(x+50, y+60, 32, { id:'brawl-' + k, race:k, owner:'p', name:r.name }, false);
    T(r.name, x+100, y+44, { s:22, f:FD, w:700, c:r.color||C.ink }); T(`${cost} pt${cost>1?'s':''}`, x+440, y+44, { s:18, f:FD, w:700, a:'right', c:C.amber });
    T(`${r.hp} hp · fights ×${r.combat ?? 1} · speed ×${r.speed||1}`, x+100, y+72, { s:14, c:C.muted }); para(raceTraits(r), x+100, y+92, 340, { s:12, lh:16, c:C.cyan, max:2 });
    btn(x+300, y+108, 140, 38, 'Add', () => BRAWL.sel.push(k), { s:15, disabled:!can, col:C.good }); });
  const y2 = 600; label(`Your crew · ${used}/${pts} points`, 80, y2, C.amber, 'left', 16);
  BRAWL.sel.forEach((k, i) => { const x = 80 + i*240; panel(x, y2+14, 228, 80, 8); drawPortrait(x+40, y2+54, 24, { id:'brawl-sel-' + i, race:k, owner:'p', name:'' }, false); T(DATA.races[k]?.name || k, x+76, y2+60, { s:17, f:FD, w:700 });
    if(!BRAWL.sent) btn(x+176, y2+30, 40, 40, '✕', () => BRAWL.sel.splice(i, 1), { s:14, col:C.hostile }); });
  if(BRAWL.sent) T(`Waiting for ${duelOppName()}…`, W-80, H-48, { s:18, a:'right', c:C.muted });
  else btn(W-410, H-86, 330, 60, 'Ready', () => { BRAWL.sent = true; if(mpAmHost()){ BRAWL.picks[NET.id] = BRAWL.sel.slice(); brawlMaybeStart(); } else netSend({ t:'bpick', races:BRAWL.sel.slice() }); }, { fill:BRAWL.sel.length>0, disabled:!BRAWL.sel.length, s:20, col:C.good });
  btn(80, H-86, 200, 60, 'Leave', () => { mpLeave(); UI.screen = 'mp'; MP.view = 'menu'; }, { s:18, col:C.hostile });
}
netOn('bpick', (m, P) => { if(!brawlOn() || !mpAmHost()) return; BRAWL.picks[P.id] = (m.races||[]).filter(k => DATA.races[k]).slice(0, 4); mpFeed(`${P.name} is ready.`, mpColor(P.id)); brawlMaybeStart(); });
function brawlMaybeStart(){ const o = duelOppId(); if(BRAWL.picks[NET.id] && o && BRAWL.picks[o]) brawlRound(1); }
/* host: one ship, both crews at opposite ends */
function brawlRound(n){
  const o = duelOppId(), P = NET.peers.get(o); if(!P) return; P.team = 'e';
  const ids = Object.keys(DATA.ships).filter(id => (DATA.ships[id].systems||{}).medbay || (DATA.ships[id].systems||{}).clonebay); const def = DATA.ships[BRAWL.arena && n>1 ? BRAWL.arena : pick(ids.length ? ids : Object.keys(DATA.ships))]; BRAWL.arena = def.id;
  BRAWL.round = n; BRAWL.wins = BRAWL.wins || {};
  G = { seed:randomSeed(), diff:'normal', shipDef:def.id, ship:null, enemy:null, proj:[], fx:[], units:[], sector:1, sectorType:'civilian', scrap:0, fuel:0, missiles:0, parts:0, paused:false, modal:null, ftl:0, warp:0, warpNode:null, fleetX:-9, boss:false, dieT:0, shake:0, flash:0,
    map:{ nodes:[{ x:.5, y:.5, col:0, type:'empty', links:[], visited:true }], cur:0, trail:[0] }, hazard:null, hzT:99, nebula:false, autofire:true, combatT:0, time:0, flag:null, questQueue:[],
    stats:{ kills:0, scrap:0, jumps:0 }, dna:[], lost:[], flags:{}, seen:{}, later:[], log:[], chat:[], hold:false, crewAuto:false, noSave:true, noInvite:true,
    brawl:{ round:n, rounds:MP.opts.rounds||3, wins:BRAWL.wins, t:0, names:{ p:mpMe().name, e:mpPlayer(o)?.name || 'Guest' }, sudden:false, over:false } };
  const sh = G.ship = makeShip(def, 'p', { name:'The Arena' }); sh.crew = []; sh.weapons = []; sh.drones = []; sh.augments = [];
  if(sh.systems.clonebay && !sh.systems.medbay){ const r = sh.rooms.find(q => q.sys==='clonebay'); if(r) r.sys = 'medbay'; sh.systems.medbay = sh.systems.clonebay; } delete sh.systems.clonebay;
  for(const k of ['teleporter','hacking','mindcontrol','drones','weapons','cloaking','battery']) if(sh.systems[k]) sh.systems[k].power = 0;
  for(const k in sh.systems) if(!SUB.includes(k)) sh.systems[k].power = Math.min(sh.systems[k].max, k==='medbay' || k==='oxygen' ? sh.systems[k].max : sh.systems[k].power);
  for(const d of sh.doors) if(d.b>=0) d.open = true;
  const byX = sh.rooms.map((r, i) => i).sort((a, b) => sh.rooms[a].x - sh.rooms[b].x), left = byX[0], right = byX[byX.length-1], flip = n % 2 === 0;
  for(const race of BRAWL.picks[NET.id]){ const c = newCrew(race, 'p'); c.station = null; sh.crew.push(c); placeCrew(sh, c, flip ? right : left); }
  for(const race of BRAWL.picks[o]){ const c = newCrew(race, 'e'); c.netCtl = true; sh.crew.push(c); placeCrew(sh, c, flip ? left : right); }
  UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null;
  if(!SYNC.on) syncStartHost(); mpRunStarted({});
  G.modal = { type:'msg', title:`Round ${n} of ${G.brawl.rounds}`, text:`Two crews, one ship. Click your crew, then click a room to send them. Fights happen when crews share a room; the medbay heals anyone inside. At two minutes, life support starts to fail.`, btn:'Fight!' };
}
function brawlTick(dt){
  if(!G || !G.brawl || !mpAmHost()) return !!(G && G.brawl);
  const B = G.brawl; if(B.over || blockingModal()) return true;
  if(!G.paused) B.t += dt;
  if(B.t > 120 && !B.sudden){ B.sudden = true; const ox = G.ship.systems.oxygen; if(ox){ ox.dmg = ox.max; ox.power = 0; } toast('Sudden death: life support is failing!'); sfx('alarm'); }
  const alive = side => G.ship.crew.filter(c => c.owner===side && !c.drone && c.hp > 0).length, a = alive('p'), b = alive('e');
  if(a===0 || b===0){ B.over = true; const winner = a===0 && b===0 ? null : a===0 ? 'e' : 'p'; if(winner) B.wins[winner] = (B.wins[winner]||0) + 1; BRAWL.wins = B.wins;
    const need = Math.ceil(B.rounds/2), done = (B.wins.p||0) >= need || (B.wins.e||0) >= need || B.round >= B.rounds, wname = winner ? B.names[winner] : null;
    G.modal = { type:'msg', title: done ? 'Match over' : `Round ${B.round}`, text:`${wname ? wname + '\'s crew takes the round.' : 'Both crews fell together: a draw.'} Score: ${B.names.p} ${B.wins.p||0} – ${B.wins.e||0} ${B.names.e}.${done ? ` ${(B.wins.p||0)===(B.wins.e||0) ? 'The match is drawn.' : ((B.wins.p||0) > (B.wins.e||0) ? B.names.p : B.names.e) + ' wins the brawl!'}` : ''}`,
      btn: done ? 'Back to the room' : 'Next round', then: done ? brawlEnd : () => brawlRound(B.round + 1) };
    sfx(winner ? 'victory' : 'alarm'); }
  return true;
}
function brawlEnd(){ const B = G && G.brawl; if(B && (B.wins.p||0) !== (B.wins.e||0)) netSend({ t:'bwin', winner:(B.wins.p||0) > (B.wins.e||0) ? NET.id : duelOppId() }); if(B && (B.wins.p||0) > (B.wins.e||0)) grant('brawlwin'); G = null; UI.screen = 'mp'; MP.view = 'room'; }
netOn('bwin', (m) => { if(m.winner===NET.id) grant('brawlwin'); });
/* the guest sees their own crew as theirs */
function brawlViewFix(){
  if(!G || !G.brawl || NET.role!=='guest' || !SYNC.S || !SYNC.S.g || !SYNC.S.g.ship) return;
  const so = new Map(); for(const c of SYNC.S.g.ship.crew||[]) so.set(String(c.id), c.owner);
  for(const c of G.ship.crew){ const o = so.get(String(c.id)); if(o) c.owner = o==='e' ? 'p' : 'e'; }
}
function drawBrawlSide(){
  const b = EBOX, B = G.brawl; panel(b.x, b.y, b.w, b.h, 12);
  const meSide = NET.role==='host' ? 'p' : 'e', themSide = meSide==='p' ? 'e' : 'p', mine = B.wins[meSide]||0, theirs = B.wins[themSide]||0;
  label('Boarding brawl', b.x+24, b.y+36, '#e05aa0', 'left', 16); T(`Round ${B.round} of ${B.rounds}`, b.x+b.w-24, b.y+36, { s:16, a:'right', c:C.muted });
  T(`${mine} – ${theirs}`, b.x+b.w/2, b.y+120, { s:72, f:FD, w:700, a:'center', c:C.amber });
  T('You', b.x+b.w/2 - 150, b.y+110, { s:20, f:FD, w:700, a:'center', c:C.good }); T(B.names[themSide] || 'Them', b.x+b.w/2 + 150, b.y+110, { s:20, f:FD, w:700, a:'center', c:C.hostile, max:220 });
  const t = Math.max(0, Math.round(B.t)); T(B.sudden ? 'Life support failing!' : `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · sudden death at 2:00`, b.x+b.w/2, b.y+170, { s:16, a:'center', c: B.sudden ? C.hostile : C.muted });
  const list = side => G.ship.crew.filter(c => c.owner===(NET.role==='host' ? side : (side==='p' ? 'p' : 'e')) && !c.drone);
  [['p', b.x+40, C.good], ['e', b.x+b.w/2+20, C.hostile]].forEach(([side, x, col]) => { list(side).forEach((c, i) => { const y = b.y+210 + i*58; drawPortrait(x+20, y+20, 18, c, false); T(c.name, x+48, y+16, { s:15, f:FD, w:700, max:200 }); bar(x+48, y+26, 200, 8, c.hp/c.maxHp, col); }); });
}
function brawlHud(x){ if(!G || !G.brawl) return x;
  const sx = 24, sy = 652; region(sx, sy, 904, 328, () => {}, null, true); panel(sx, sy, 904, 328, 10); label('Brawl rules', sx+20, sy+32, '#e05aa0', 'left', 15);
  para('Select your crew (click them, or a room they are in), then click a room to send them. Crews fight when they share a room. Stronger races hit harder; the medbay heals anyone standing in it, friend or foe. Doors are open. After two minutes, life support fails and the air runs out.', sx+20, sy+64, 860, { s:16, lh:24, c:C.ink });
  return x; }

/* ---------------- shared screens ---------------- */
function drawVsResult(){
  const v = MP.vs || { mine:0, theirs:0, opp:'Opponent' }; mpTitle(v.mine > v.theirs ? 'VICTORY' : v.mine < v.theirs ? 'DEFEAT' : 'A DRAW', v.kind==='duel' ? 'Duel arena' : 'Boarding brawl');
  T(`You ${v.mine} – ${v.theirs} ${v.opp}`, 80, 260, { s:48, f:FD, w:700, c:C.ink });
  const rec = PROFILE.duels || { w:0, l:0 }; T(`Your duel record: ${rec.w} won, ${rec.l} lost`, 80, 320, { s:20, c:C.muted });
  btn(80, 400, 340, 70, NET.on ? 'Back to the room' : 'Back to menu', () => { MP.view = NET.on ? 'room' : 'menu'; }, { fill:true, s:20 });
}
MP_UI.duel = { options:duelOptions, start:duelStartBtn, hangar:duelHangar, frame:duelFrame, hold:duelHold, launch:duelLaunch, gameTick:duelTick, hud:duelHud,
  left:() => { if(G && G.duel){ G = null; UI.screen = 'mp'; MP.view = 'room'; toast('Your opponent left the arena.'); DUEL.phase = 'idle'; } },
  ended:() => { if(G && G.duel){ G = null; UI.screen = 'mp'; MP.view = 'menu'; } DUEL.phase = 'idle'; } };
MP_UI.brawl = { options:brawlOptions, start:brawlStartBtn, gameTick:brawlTick, viewFix:brawlViewFix, hud:brawlHud,
  left:() => { if(G && G.brawl && mpAmHost()){ G = null; UI.screen = 'mp'; MP.view = 'room'; toast('Your opponent left the brawl.'); } } };
