'use strict';
/* =========================================================================
   Run flow: new runs, sectors and the map, events, stores, combat start and
   end, the Flaggship chase, saving and the main update loop.
   ========================================================================= */
let G = null;
const UI = { screen:'title', selCrew:null, selCrews:[], selWeapon:null, mode:null, page:0, selShip:null, toast:null, tab:'systems', storeTab:'weapons', overReason:'', modsPage:0 };
function toast(t){ UI.toast = { text:t, t:2.6 }; }

/* ---------------- seeds ----------------
   Every run has a seed. The same seed gives the same sector maps, beacon events,
   enemies, stores, sector choices and loot, so a run can be replayed or shared.
   The daily challenge is a seed made from the date, on a ship picked by the date,
   at Normal difficulty with mods off, so everyone plays the same run that day. */
const SEED_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomSeed(){ let s = ''; for(let i=0;i<8;i++){ s += SEED_ABC[Math.floor(Math.random()*SEED_ABC.length)]; if(i===3) s += '-'; } return s; }
function cleanSeed(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,24); }
function todayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function dailyShip(k){ const ids = Object.keys(BASE.ships); return ids[hashStr('ship' + (k||todayKey())) % ids.length]; }
function withSeed(key, fn){ if(!G || !G.seed) return fn(); const prev = Math.random; Math.random = srng(hashStr(G.seed + '|' + key) || 1); try{ return fn(); } finally { Math.random = prev; } }
function startDaily(){ const k = todayKey(); newRun(dailyShip(k), null, { seed:'DAILY-' + k, daily:k }); }

function newRun(shipId, name, o={}){
  if(!o.keepData) applyMods(!!(o.daily || o.cup));   // multiplayer races keep the host's game data
  const ch = o.challenge && typeof challengeDef==='function' ? challengeDef(o.challenge) : null; if(ch) challengeRules(ch);
  const def = DATA.ships[shipId] || Object.values(DATA.ships)[0];
  const diffKey = o.daily || o.cup ? 'normal' : ch ? (DIFFICULTY[ch.difficulty] ? ch.difficulty : 'normal') : o.diff && DIFFICULTY[o.diff] ? o.diff : SET.difficulty, diff = DIFFICULTY[diffKey] || DIFFICULTY.normal;
  G = { seed:cleanSeed(o.seed) || randomSeed(), daily:o.daily || null, cup:o.cup || null, seedDuel:o.seedDuel || null, challenge:ch ? o.challenge : null, chDone:false, diff:diffKey, shipDef:def.id, ship:null, enemy:null, proj:[], fx:[], units:[], sector:1, sectorType:'civilian',
    scrap:Math.max(0, R.startScrap + diff.startScrap), fuel:def.fuel ?? 16, missiles:def.missiles ?? 8, parts:def.parts ?? R.startParts,
    paused:false, modal:null, ftl:0, warp:0, warpNode:null, fleetX:-.2, boss:false, dieT:0, shake:0, flash:0, map:null,
    hazard:null, hzT:6, hzWarn:false, nebula:false, autofire:true, combatT:0, time:0, afterWin:null, flag:null, questQueue:[],
    stats:{ kills:0, scrap:0, jumps:0, shotDown:0, boardKills:0 }, dna:[], lost:[], flags:{}, seen:{}, later:[], log:[], chat:[], mapPieces:0, hold:false, crewAuto:true,
    bay:{}, seeds:{ star_potato:3, ion_berry:2 }, garden:{ plots:[null, null] }, spent:0, fed:0 };
  G.ship = withSeed('start', () => makeShip(def,'p',{ name }));
  if(ch) challengeLoadout(ch);
  if(!o.daily && !o.cup && MODS.filter(m => m.enabled).length >= 5) grant('modsquad');
  genSector(1, 'civilian');
  if(o.crewNames || o.crewQuirks){ G.ship.crew.filter(c => c.owner==='p' && !c.drone).forEach((c, i) => {   // the crew you named in the hangar
    if(o.crewNames && o.crewNames[i]) c.name = String(o.crewNames[i]).slice(0, 16); if(o.crewQuirks && o.crewQuirks[i]){ c.quirk = o.crewQuirks[i]; c.quirkSet = true; } }); }
  if(typeof sagaRunStart==='function') sagaRunStart();
  PROFILE.runs++; saveProfile();
  UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; UI.crewPanel = false; if(typeof svReset==='function') svReset();
  emit('runStart', G);
  logEntry(`Took command of ${G.ship.name}.`);
  G.modal = { type:'msg', title: G.daily ? `Daily challenge · ${G.daily}` : G.cup ? `Weekly cup · ${G.cup}` : ch ? `Challenge · ${ch.name}` : G.seedDuel ? `Seed duel · vs ${G.seedDuel.n || 'a friend'}` : 'Sector 1 · Civilian Sector', text:`${G.daily ? 'Everyone flies the same run today: same ship, same maps, same events. ' : G.cup ? 'Everyone flies the same run all week. Post your best score to the cup board. ' : G.seedDuel ? `The same maps, events and shops ${G.seedDuel.n || 'your friend'} had. ${G.seedDuel.sc ? 'Score to beat: ' + fmtNum(G.seedDuel.sc) + '. ' : ''}` : ''}${ch ? `${ch.desc} Goal: ${challengeGoalText(ch).toLowerCase()}. ` : ''}You command ${G.ship.name}. Your hold carries data that could win the war for the Fedoration, and the Rebuff Fleet wants it back. Cross ${R.sectors} sectors and stop the Flaggship before it reaches Fedoration command.`, btn:'Open map', then:openMap };
  if(typeof mpRunStarted==='function') mpRunStarted(o);
  save();
}
function saveReplacer(k, v){ if(k==='adj' || k==='modal' || (typeof k==='string' && k[0]==='_')) return undefined; return v; }
function save(){ if(!G || G.enemy || UI.screen!=='game' || (typeof SYNC!=='undefined' && SYNC.guest) || G.noSave) return;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify({ G:Object.assign({}, G, { proj:[], fx:[], units:[], warp:0, warpNode:null }), DATA }, saveReplacer)); }catch(e){} }
function loadSave(){
  const s = LS.get(SAVE_KEY, null); if(!s || !s.G || !s.DATA) return false;
  DATA = s.DATA; R = DATA.rules; G = s.G; G.modal = null; G.fx = []; G.proj = []; G.units = [];
  if(G.crewAuto===undefined) G.crewAuto = true; G.flags = G.flags||{}; G.seen = G.seen||{}; G.later = G.later||[]; G.log = G.log||[]; G.chat = []; G.mapPieces = G.mapPieces||0;
  buildGraph(G.ship); if(typeof sagaRunStart==='function') sagaRunStart(true); UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null;
  if(typeof mpRunStarted==='function') mpRunStarted({ loaded:true });
  return true;
}

/* ---------------- sectors & map ---------------- */
function sectorDef(t){ return DATA.sectors[t || G.sectorType] || DATA.sectors.civilian || Object.values(DATA.sectors)[0]; }
function genSector(n, type){ return withSeed(`sector${n}:${type}`, () => genSector_(n, type)); }
function genSector_(n, type){ if(G) G.fleetFights = 0;
  G.sector = n; G.sectorType = type; const sd = sectorDef(type); const final = !!sd.final; if(typeof sagaSector==='function') sagaSector(n, type);
  PROFILE.maxSector = Math.max(PROFILE.maxSector, n); saveProfile();
  if(n>=3) grant('sector3'); if(n>=5) grant('sector5'); if(final) grant('laststand');
  if(typeof challengeCheck==='function'){ challengeCheck(false); runAchCheck(); }
  const cols = final ? 8 : 7, nodes = [], mix = sd.mix || { event:50, combat:30, store:10, empty:10 };
  for(let c=0;c<cols;c++){
    const count = (c===0 || c===cols-1) ? 1 : ri(2,3);
    for(let k=0;k<count;k++){
      const x = clamp((c + (c>0 && c<cols-1 ? rand(-.18,.18) : 0))/(cols-1), 0, 1);
      const y = count===1 ? .5 : clamp((k+.5)/count + rand(-.08,.08), .08, .92);
      let type = wpick(Object.keys(mix), t => mix[t]); if(type==='store') type = Math.random()<.6 ? 'event' : 'combat';
      if(c===0) type = 'start'; if(c===cols-1) type = final ? 'base' : 'exit';
      const node = { x, y, col:c, type, links:[], visited:c===0, store:null, hazard:null, nebula:false, distress:false, quest:null };
      if(c>0 && c<cols-1){
        if(Math.random() < (sd.nebula||0)) node.nebula = true;
        const hz = sd.hazards || {}; for(const h in hz) if(!node.hazard && Math.random() < hz[h]) node.hazard = h;
        if(type==='event' && Math.random()<.22) node.distress = true;
      }
      nodes.push(node);
    }
  }
  for(const a of nodes){
    const next = nodes.filter(b => b.col===a.col+1).sort((p,q)=>Math.abs(p.y-a.y)-Math.abs(q.y-a.y));
    next.slice(0, next.length>1 && Math.random()<.6 ? 2 : 1).forEach(b => link(nodes, a, b));
    const same = nodes.filter(b => b.col===a.col && b!==a && Math.abs(b.y-a.y)<.45);
    if(same.length && Math.random()<.35) link(nodes, a, same[0]);
  }
  for(const b of nodes) if(b.col>0 && !b.links.some(i => nodes[i].col<b.col)) link(nodes, pick(nodes.filter(a=>a.col===b.col-1)), b);
  const mids = nodes.filter(nd => nd.col>=2 && nd.col<=cols-2);
  const storeN = Math.random() < .25 ? 3 : 2; const placed = [];
  for(const nd of shuffle(mids.slice())){ if(placed.length>=storeN) break; if(placed.some(p => Math.abs(p.col - nd.col) < 2)) continue; nd.type = 'store'; nd.distress = false; placed.push(nd); }
  G.map = { nodes, cur:0, trail:[0] }; G.fleetX = -.2; G.hazard = null; G.nebula = false;
  if(G.ship && G.ship.crew.some(c => c.owner==='p' && c.quirk==='mystic') && Math.random() < .6){ const hid = nodes.filter(nd => !nd.revealed); shuffle(hid); for(const nd of hid.slice(0, 4)) nd.revealed = true; G.mysticSaw = true; }   // a mystic dreams the way ahead
  while(G.questQueue.length){ const q = G.questQueue.shift(); placeQuest(q); }
  G.flag = null;
  if(sd.secret){ G.flags.glassDone = true; grant('glasswork'); placeQuest('glass_welcome'); }
  logEntry(`Entered sector ${n}: ${sd.name}.`);
  if(typeof mpSector==='function') mpSector(n);
  if(final){ const cand = nodes.map((nd,i)=>i).filter(i => nodes[i].col===3);
    G.flag = { node:pick(cand), phase:0, baseHP:R.baseHP, step:0 };
    nodes[G.flag.node].type = 'combat'; }
}
function link(nodes, a, b){ const ia = nodes.indexOf(a), ib = nodes.indexOf(b); if(ia===ib) return; if(!a.links.includes(ib)) a.links.push(ib); if(!b.links.includes(ia)) b.links.push(ia); }
function placeQuest(evId){
  const cur = G.map.nodes[G.map.cur]; const cands = G.map.nodes.map((n,i)=>i).filter(i => { const n = G.map.nodes[i]; return !n.visited && n.col > cur.col && !['exit','base','store','start'].includes(n.type) && !n.quest; });
  if(!cands.length){ G.questQueue.push(evId); return false; }
  const n = G.map.nodes[pick(cands)]; n.quest = evId; n.type = 'event'; return true;
}
function openMap(){ UI.selWeapon = null; UI.mode = null; save(); G.modal = { type:'map' }; sfx('map'); }
function canJump(){ return !G.enemy || G.enemy.dead || G.ftl>=1; }
function jumpTo(i){
  if(!canJump()){ toast('The VTL drive is still charging.'); return; }
  if(typeof netGuestCmd==='function' && netGuestCmd({ c:'jump', i })){ if(G.fuel<=0) toast('Out of fuel.'); SYNC.overlay = null; return; }
  if(G.fuel<=0){ G.modal = { type:'stranded' }; return; }
  if(G.enemy && !G.enemy.dead && typeof sagaEnemyGotAway==='function') sagaEnemyGotAway(G.enemy, 'when the crew fled the fight');
  if(G.enemy && !G.enemy.dead){ const aboard = G.enemy.crew.filter(c=>c.owner==='p' && !c.drone); if(aboard.length){ for(const c of aboard) killCrew(G.enemy, c); toast('Crew left aboard the enemy ship are lost.'); } }
  G.fuel--; G.modal = null; leaveCombat(); G.warp = 1; G.warpNode = i; sfx('jump'); haptic(.4, 300); if(Math.random()<.35) say('jump');
}
function leaveCombat(){
  if(G.enemy){ for(const c of [...G.ship.crew]) if(c.owner==='e' && c.drone) G.ship.crew.splice(G.ship.crew.indexOf(c),1); }
  for(const r of G.ship.rooms) if(r.scorch>0) r.scorch = Math.max(0, r.scorch - 2);
  for(const c of G.ship.crew) if(c.owner==='p') c.mcT = 0;
  G.enemy = null; G.proj = []; G.units = []; G.ftl = 0; G.boss = false; G.jam = 0; UI.selWeapon = null; UI.mode = null;
  for(const w of G.ship.weapons){ w.charge = 0; w.target = null; w.autoTarget = null; }
  for(const d of G.ship.drones){ const bp = DATA.drones[d.id]; if(bp && bp.kind!=='internal') d.unit = null; }
  G.ship.hackLaunched = false; G.ship.hacked = null; G.ship.super = 0; G.ship.cloak.t = 0;
}
function flagNext(){ const f = G.flag; if(!f) return null; const nodes = G.map.nodes, base = nodes.findIndex(n=>n.type==='base'); if(f.node===base) return base;
  const prev = { [f.node]:null }, q = [f.node]; while(q.length){ const k = q.shift(); if(k===base) break; for(const n of nodes[k].links) if(!(n in prev)){ prev[n] = k; q.push(n); } }
  let k = base; if(!(k in prev)) return f.node; while(prev[k]!==f.node && prev[k]!=null) k = prev[k]; return k; }
function moveFlagship(){
  const f = G.flag; if(!f) return; const nodes = G.map.nodes; const base = nodes.findIndex(n=>n.type==='base');
  if(f.node===base){ f.baseHP--; sfx('alarm');
    if(f.baseHP<=0){ endRun(false, 'The Flaggship destroyed Fedoration command while you were elsewhere. To win the last sector, jump onto the Flaggship\'s beacon and beat it three times before it wears command down.'); return; }
    toast(`The Flaggship is attacking Fedoration command! It holds for ${f.baseHP} more jump${f.baseHP===1?'':'s'}: jump to command to fight it.`);
    return; }
  f.step = (f.step||0) + 1; if(f.step % 2) return;
  const prev = { [f.node]:null }, q = [f.node];
  while(q.length){ const k = q.shift(); if(k===base) break; for(const n of nodes[k].links) if(!(n in prev)){ prev[n] = k; q.push(n); } }
  let k = base; if(!(k in prev)) return; while(prev[k]!==f.node && prev[k]!=null) k = prev[k];
  if(nodes[f.node].type==='combat' && !nodes[f.node].visited) nodes[f.node].type = 'empty';
  f.node = k;
}
function arrive(i){ G.fightsHere = 0; return withSeed(`s${G.sector}n${i}arrive`, () => arrive_(i)); }
function arrive_(i){
  const node = G.map.nodes[i]; G.map.cur = i; (G.map.trail || (G.map.trail = [])).push(i);
  const sd = sectorDef();
  G.fleetX += fleetStep() * (node.nebula ? .7 : 1); G.stats.jumps++; grant('first_jump'); if(typeof runAchCheck==='function') runAchCheck();
  G.hazard = node.hazard || (node.nebula ? 'nebula' : null); G.nebula = !!node.nebula; G.hzT = rand(5,9); G.hzWarn = false;
  if(G.ship.systems.clonebay && eff(G.ship,'clonebay')>0) for(const c of G.ship.crew) if(c.owner==='p') c.hp = Math.min(c.maxHp, c.hp + 20);
  const first = !node.visited; node.visited = true;
  if(typeof homeJump==='function') homeJump();   // the garden grows (homestead.js)
  emit('arrive', node);
  if(G.flag){ if(G.flag.node!==i) moveFlagship(); if(UI.screen!=='game') return;   // jumping onto the Flaggship's beacon catches it before it can move on
    if(G.flag.node===i){ startCombat('flag', { boss:true, phase:G.flag.phase, title:G.flag.phase ? 'The Flaggship returns' : 'The Flaggship', text: DATA.enemies[R.bossId]?.phases?.[G.flag.phase]?.name || 'The Rebuff Flaggship fills your viewport.' }); return; } }
  if(node.x < G.fleetX - .02 && node.type!=='base'){
    startCombat('random', { harder:true, hail:'fleet' }); return; }
  if(typeof mpArrive==='function' && mpArrive(i, node, first)) return;
  // scenes scheduled for later: every countdown ticks each jump; one that is due waits for a beacon where it fits (never a store, an exit or a quest)
  for(const l of G.later) l.jumps--;
  const free = ['event','combat','empty'].includes(node.type) && !node.quest && first;
  const due = free ? G.later.find(l => l.jumps <= (node.type==='combat' ? -2 : 0) && DATA.events[l.event] && !(DATA.events[l.event].moment && typeof momentOk==='function' && !momentOk(DATA.events[l.event]))) : null;
  G.later = G.later.filter(l => l!==due && (l.jumps > -12 || !DATA.events[l.event]?.moment));   // a scene that never found a beacon is dropped eventually
  if(due){ startEvent(due.event, { star:due.star }); return; }
  if(node.type==='base'){ if(first){ G.ship.hull = G.ship.maxHull; G.modal = { type:'msg', title:'Fedoration Command', text:'The base crews patch your hull completely and wish you luck. The Flaggship is coming here. Stop it.' }; } else G.modal = { type:'msg', title:'Fedoration Command', text:'The base is holding. For now.' }; save(); return; }
  if(node.type==='store'){ sfx('store'); if(!node.store) node.store = makeStore(); G.modal = { type:'store', node:i }; save(); return; }
  if(!first){ toast(pick(['Familiar beacon: nothing new on sensors.', 'You have been here before. Still nothing here.', 'Same old beacon. Your crew waves at the scorch marks.'])); save(); return; }   // no box to close: going back somewhere empty should cost no taps
  if(node.quest){ startEvent(node.quest); return; }
  switch(node.type){
    case 'event': startEvent(pickEvent(node)); break;
    case 'combat': startCombat('random', { hail:true }); break;
    case 'exit': G.modal = { type:'exit', opts:sectorOptions() }; save(); break;
    default: { if(!G.hazard && typeof pickMoment==='function'){ const mo = pickMoment(node, .3); if(mo){ startEvent(mo); break; } }
      const hzFlavour = G.hazard && typeof HAZARD_ARRIVALS!=='undefined' && HAZARD_ARRIVALS[G.hazard] ? fillText(pick(HAZARD_ARRIVALS[G.hazard]), { crew:randomCrewName() }) + ' ' : '';
      let text = G.hazard ? hzFlavour + hazardText(G.hazard) : fillText(pick(QUIET_TEXTS), { crew:randomCrewName() });
      if(Math.random() < .3){ const f = ri(1,2); G.fuel += f; text += ` Sensors find a drifting fuel canister. +${f} fuel.`; }
      else if(typeof QUIET_FINDS!=='undefined'){ for(const fd of QUIET_FINDS){ if(Math.random() >= fd.p) continue;   // now and then, something small
        if(fd.parts){ G.parts += fd.parts; text += ` ${fd.text} +${fd.parts} drone part.`; } else if(fd.missiles){ G.missiles += fd.missiles; text += ` ${fd.text} +${fd.missiles} missile.`; }
        else if(fd.scrap){ const v = ri(fd.scrap[0], fd.scrap[1]); G.scrap += v; G.stats.scrap += v; text += ` ${fd.text} +${v} scrap.`; }
        else if(fd.xp){ for(const c of G.ship.crew) if(c.owner==='p' && !c.drone) gainXP(c, pick(['pilot','engines','shields','weapons','repair']), 2); text += ` ${fd.text}`; }
        break; } }
      if(!G.hazard && G.ship.hull < G.ship.maxHull && Math.random() < .6){ const n = Math.min(G.ship.maxHull - G.ship.hull, ri(1,3)); G.ship.hull += n; text += ` With nobody shooting at you, the crew bolt on spare plating. +${n} hull.`; }
      G.modal = { type:'msg', title: G.hazard ? HAZARDS[G.hazard] : 'Quiet beacon', text, extra: typeof startFishing==='function' && G.hazard!=='sun' ? [{ id:'fish', label:'🎣 Cast a line', fn:startFishing }] : null }; save(); }
  }
}
function fleetStep(){ return R.fleetSpeed * (sectorDef().fleetMult||1) * (curDiff().fleet||1) * (G.ship && G.ship.crew.some(c => c.owner==='p' && c.quirk==='conspiracy') ? .95 : 1); }
function hazardText(h){ return { asteroid:'Asteroids drift through this beacon. Expect the odd rock to hit your shields.', sun:'You are close to a star. Solar flares will start fires aboard.',
  ionstorm:'An ion storm halves your reactor power while you stay here.', pulsar:'A pulsar sends out ion waves that knock out systems and shields.', nebula:'Nebula gas blinds your sensors. The Rebuff Fleet is slower in here too.' }[h]; }
function sectorOptions(){ return withSeed(`s${G.sector}exit`, sectorOptions_); }
function sectorOptions_(){
  if(G.sector+1 >= R.sectors) return ['laststand'];
  const types = Object.keys(DATA.sectors).filter(t => !DATA.sectors[t].final && !DATA.sectors[t].secret && t!=='civilian');
  shuffle(types); const opts = types.slice(0,2);
  if(G.flags.coords && !G.flags.glassDone && DATA.sectors.glass) opts.push('glass');
  return opts;
}
function nextSector(type){ if(typeof netGuestCmd==='function' && netGuestCmd({ c:'sector', v:type })){ SYNC.overlay = null; return; } G.modal = null; G.warp = 1; G.warpNode = 'sector:' + type; sfx('jump'); haptic(.4, 300); }

/* ---------------- events ---------------- */
/* what an event can hand out (worked out once per event), so recent rewards can make similar events rarer */
const EV_KINDS = new Map();
function eventKinds(e){
  if(EV_KINDS.has(e)) return EV_KINDS.get(e); const K = new Set();
  const walk = (x, d) => { if(!x || d > 6) return; for(const k of ['crew','weapon','augment','drone','fight']) if(x[k]!=null) K.add(k); if(x.afterWin) walk(x.afterWin, d+1); for(const c of x.choices||[]){ walk(c.effect, d+1); walk(c.success, d+1); walk(c.fail, d+1); } };
  walk(e, 0); EV_KINDS.set(e, K); return K;
}
function pickEvent(node){
  if(typeof pickMoment==='function'){ const mo = pickMoment(node); if(mo) return mo; }   // now and then the beacon is about your crew (saga.js)
  const sd = sectorDef(); const tags = sd.tags || [];
  let list = Object.values(DATA.events).filter(e => !e.questOnly && !e.hail && !e.moment && !(e.once && G.seen[e.id]) && (!e.flag || G.flags[e.flag]) && (!e.noFlag || !G.flags[e.noFlag]) && (e.minSector||1) <= G.sector && (e.maxSector||99) >= G.sector
    && (!e.tags || e.tags.includes('') || e.tags.some(t => tags.includes(t) || t===G.sectorType)) && (!e.nebula || node?.nebula));
  // no reruns: events already met this run only come back once everything else has been seen
  const fresh = list.filter(e => !G.seen[e.id]); if(fresh.length) list = fresh;
  // distress calls draw from their own pool while it lasts, then from everything (so a run isn't a string of rescues)
  if(node?.distress){ const d = list.filter(e => e.distress); if(d.length) list = d; }
  if(!list.length) return null;
  // whatever the last few beacons gave you is rarer for a while: three free crew in three jumps should not happen
  const recent = G.gains || {}, jumps = G.stats?.jumps || 0, since = k => recent[k]==null ? 99 : jumps - recent[k];
  const damp = e => { const K = eventKinds(e); let m = 1;
    if(K.has('crew') && since('crew') < 4) m *= since('crew') < 2 ? .12 : .35;
    if(K.has('augment') && since('augment') < 3) m *= .45;
    if(K.has('weapon') && since('weapon') < 3) m *= .5;
    if(K.has('drone') && since('drone') < 3) m *= .6;
    return m; };
  return wpick(list, e => (e.weight ?? 1) * (e.tags && e.tags.some(t => tags.includes(t)) ? 1.5 : 1) * (e.nebula ? 2 : 1) * damp(e)).id;
}
function noteGain(k){ if(!G) return; (G.gains = G.gains || {})[k] = G.stats?.jumps || 0; }
function randomCrewName(race){ const l = G.ship.crew.filter(c => c.owner==='p' && !c.drone && (!race || c.race===race)); return l.length ? pick(l).name : 'Someone'; }
function fillText(t, cx={}){ const out = String(t||'').replace(/\{crew\}/g, cx.crew||'Your crew').replace(/\{who\}/g, cx.who||cx.crew||'Your crew').replace(/\{ship\}/g, G?.ship?.name||'your ship')
  .replace(/\{enemy\}/g, G?.enemy?.name||'enemy ship').replace(/\{sector\}/g, G ? sectorDef().name : ''); return typeof sagaFill==='function' ? sagaFill(out, cx) : out; }
function quirkCrewName(q){ const l = G.ship.crew.filter(c => c.owner==='p' && !c.drone && c.quirk===q); return l.length ? pick(l).name : 'Someone'; }
function logEntry(t){ if(!G) return; (G.log = G.log||[]).push({ s:G.sector, t }); if(G.log.length>80) G.log.shift(); }
function startEvent(id, o={}){ sfx(o.combat ? 'hail' : 'event'); const ev = id && DATA.events[id]; if(!ev){ G.modal = { type:'msg', title:'Quiet beacon', text:'Static on every channel.' }; return; }
  emit('event', ev); G.seen[id] = 1; G.modal = { type:'event', id, combat:!!o.combat, ctx:(ev.moment && typeof sagaCtx==='function' && sagaCtx(ev, o.star)) || { crew:randomCrewName() } }; }
function pickHail(tag){ if(typeof pickHailFresh==='function') return pickHailFresh(tag); const all = Object.values(DATA.events).filter(e => e.hail); let l = all.filter(e => e.hail===tag); if(!l.length) l = all.filter(e => e.hail==='generic'); return l.length ? pick(l).id : null; }
function reqHidden(q){ return !!(q && (q.race || q.system || q.weaponType || q.drone || q.augment || q.quirk || q.pet)); }
function reqMet(q){
  if(!q) return true; const s = G.ship;
  if(q.race && !s.crew.some(c=>c.race===q.race && c.owner==='p')) return false;
  if(q.quirk && !s.crew.some(c=>c.quirk===q.quirk && c.owner==='p' && !c.drone)) return false;
  if(q.pet && !(G.pet && !G.pet.gone)) return false;
  if(q.goodsKind && !Object.keys(G.bay || {}).some(id => (G.bay[id]||0) > 0 && typeof goodsDef==='function' && goodsDef(id)?.kind===q.goodsKind)) return false;   // needs a crop, a meal... in the hold
  if(q.system && (!s.systems[q.system] || s.systems[q.system].max < (q.level||1))) return false;
  if(q.weaponType && !s.weapons.some(w=>DATA.weapons[w.id]?.type===q.weaponType)) return false;
  if(q.drone && !s.drones.some(d=>d.id===q.drone || DATA.drones[d.id]?.kind===q.drone)) return false;
  if(q.augment && !s.augments.includes(q.augment)) return false;
  if(q.scrap!=null && G.scrap < q.scrap) return false;
  if(q.fuel!=null && G.fuel < q.fuel) return false;
  if(q.missiles!=null && G.missiles < q.missiles) return false;
  if(q.parts!=null && G.parts < q.parts) return false;
  if(q.crewCount!=null && s.crew.filter(c=>c.owner==='p'&&!c.drone).length < q.crewCount) return false;
  if(q.flag && !G.flags[q.flag]) return false;
  if(q.noFlag && G.flags[q.noFlag]) return false;
  return true;
}
function reqLabel(q){ if(!q) return '';
  if(q.race) return `[${DATA.races[q.race]?.name||q.race}] `; if(q.quirk) return `[${(typeof quirkDef==='function' && quirkDef(q.quirk)?.name)||q.quirk}] `; if(q.pet) return `[${G.pet ? G.pet.name : 'Pet'}] `; if(q.system) return `[${SYSN[q.system]||q.system} ${q.level||1}] `;
  if(q.weaponType) return `[${q.weaponType}] `; if(q.drone) return `[${DATA.drones[q.drone]?.name||q.drone}] `; if(q.augment) return `[${DATA.augments[q.augment]?.name||q.augment}] `; return ''; }
function costLabel(c, text){ if(!c) return ''; if(text && /\d+\s*(scrap|fuel|missile|drone part)/i.test(text)) return ''; const p=[]; for(const k of ['scrap','fuel','missiles','parts']) if(c[k]) p.push(`${c[k]} ${k==='parts'?'drone parts':k}`); return p.length ? ` (costs ${p.join(', ')})` : ''; }
function chooseOption(ch){
  const prev = G.modal || {}; const cx = Object.assign({}, prev.ctx||{ crew:randomCrewName() });
  cx.who = ch.req?.race ? randomCrewName(ch.req.race) : ch.req?.quirk ? quirkCrewName(ch.req.quirk) : cx.crew;
  if(ch.cost){ G.scrap -= ch.cost.scrap||0; G.fuel -= ch.cost.fuel||0; G.missiles -= ch.cost.missiles||0; G.parts -= ch.cost.parts||0; }
  const ck = `s${G.sector}n${G.map?.cur}c${hashStr(ch.text||'')}`;
  let e = ch.effect || {};
  if(ch.chance!=null) e = withSeed(ck + 'roll', () => Math.random()) < ch.chance ? (ch.success||{}) : (ch.fail||{});
  G.evCtx = cx; const lines = withSeed(ck + 'fx', () => applyEffect(e)); G.evCtx = null;
  logEntry(`${fillText(ch.text, cx)} ${e.text ? '— ' + fillText(e.text, cx) : ''}`.trim());
  if(UI.screen!=='game') return;
  const after = { fight:e.fight || (e.nemFight && G.nemesis ? G.nemesis.def : undefined), event:e.event, store:e.store, afterWin:e.afterWin, begin:e.begin, dismiss:e.dismiss };
  if(Array.isArray(e.choices) && e.choices.length){ G.modal = { type:'event', inline:{ text:e.text||'', choices:e.choices, art:prev.inline?.art || DATA.events[prev.id]?.art }, id:prev.id, lines, ctx:cx, combat:prev.combat }; return; }
  if(!e.text && !lines.length && (e.begin || e.dismiss)){ closeResult({ after }); return; }
  G.modal = { type:'result', title: prev.combat ? 'Comms' : 'Outcome', text:fillText(e.text||'', cx), lines, after };
}
function sign(n){ return (n>0?'+':'') + n; }
function applyEffect(e){
  const L = [], s = G.ship; if(!e) return L;
  const sm = curDiff().scrap * (hasAug(s,'scrapArm') ? 1.1 : 1) * (1 + augFx(s,'scrap')) * (G.chScrap || 1);
  if(e.scrap){ const v = e.scrap>0 ? Math.round(e.scrap*sm*(1 + .12*((G?.sector||1)-1))) : e.scrap; G.scrap = Math.max(0, G.scrap + v); if(v>0) G.stats.scrap += v; L.push(`${sign(v)} scrap`); }
  if(e.fuel){ G.fuel = Math.max(0, G.fuel + e.fuel); L.push(`${sign(e.fuel)} fuel`); }
  if(e.missiles){ G.missiles = Math.max(0, G.missiles + e.missiles); L.push(`${sign(e.missiles)} missiles`); }
  if(e.parts){ G.parts = Math.max(0, G.parts + e.parts); L.push(`${sign(e.parts)} drone parts`); }
  if(e.hull){ s.hull = clamp(s.hull + e.hull, 0, s.maxHull); L.push(`${sign(e.hull)} hull`); }
  if(e.crew){ noteGain('crew'); const races = Object.keys(DATA.races).filter(k => !DATA.races[k].secret); const race = e.crew==='random' ? pick(races) : e.crew;
    if(s.crew.filter(c=>c.owner==='p'&&!c.drone).length < R.maxCrew){ const c = addCrew(s, race, 'p'); if(typeof sagaJoined==='function') sagaJoined(c); L.push(`${c.name} the ${DATA.races[c.race].name}${c.quirk && typeof quirkName==='function' ? ' (' + quirkName(c).toLowerCase() + ')' : ''} joins your crew`); checkCrewAch(); }
    else { const cand = newCrew(race, 'p'); G.recruitOffer = cand; L.push(`${cand.name} the ${DATA.races[cand.race].name} wants to join, but every bunk is full. You can swap someone out next`); } }
  if(e.crewLoss){ for(let i=0;i<e.crewLoss;i++){ const list = s.crew.filter(c=>c.owner==='p'&&!c.drone); if(list.length<=1) break; const c = pick(list); s.crew.splice(s.crew.indexOf(c),1); L.push(`${c.name} is lost`); G.lost.push(c.name); if(typeof sagaDeath==='function') sagaDeath(c, null, 'lost on the way'); } }
  if(e.weapon){ L.push(giveWeapon(e.weapon)); noteGain('weapon'); }
  if(e.drone){ L.push(giveDrone(e.drone)); noteGain('drone'); }
  if(e.augment){ L.push(giveAugment(e.augment)); noteGain('augment'); }
  if(e.install){ const opts = Object.keys(INSTALL).filter(k => !s.systems[k] && !(k==='clonebay' && s.systems.medbay) && !(k==='medbay' && s.systems.clonebay));
    const k = e.install==='random' ? pick(opts) : (opts.includes(e.install) ? e.install : null);
    if(k && installSystem(s, k)) L.push(`${SYSN[k]} system installed`); else { G.scrap += 30; L.push('+30 scrap (nothing new to install)'); } }
  if(e.upgrade){ const up_ = e.upgrade==='random' ? pick(Object.keys(s.systems).filter(k => s.systems[k].max < (CAPS[k]||8))) : e.upgrade; if(up_ && s.systems[up_]){ if(s.systems[up_].max < (CAPS[up_]||8)){ s.systems[up_].max++; L.push(`${SYSN[up_]} upgraded to level ${s.systems[up_].max}`); } else { G.scrap += 25; L.push('+25 scrap (already at max)'); } } }
  if(e.damageSystem){ const k = e.damageSystem==='random' ? pick(Object.keys(s.systems)) : e.damageSystem; if(k && s.systems[k]){ damageSystem(s, k, 1); L.push(`${SYSN[k]} damaged`); } }
  if(e.reactor){ s.reactor = clamp(s.reactor + e.reactor, 1, 25); L.push(`${sign(e.reactor)} reactor power`); }
  if(e.fire){ igniteRoom(s, Math.floor(Math.random()*s.rooms.length)); L.push('A fire has broken out aboard'); }
  if(e.quest){ placeQuest(e.quest); L.push('Quest beacon marked on your map'); }
  if(e.unlock && DATA.ships[e.unlock]){ PROFILE.unlocked = PROFILE.unlocked || {}; if(!PROFILE.unlocked[e.unlock]){ PROFILE.unlocked[e.unlock] = true; saveProfile(); L.push(`Ship unlocked: ${DATA.ships[e.unlock].name}`); } }
  if(e.achievement) grant(e.achievement);
  if(e.setFlag) for(const f of [].concat(e.setFlag)) G.flags[f] = true;
  if(e.clearFlag) for(const f of [].concat(e.clearFlag)) delete G.flags[f];
  if(e.later) G.later.push({ event:e.later.event, jumps:e.later.jumps||3 });
  if(e.maxHull){ s.maxHull += e.maxHull; L.push(`+${e.maxHull} max hull`); }
  if(e.crewHeal){ for(const c of s.crew) if(c.owner==='p') c.hp = Math.min(c.maxHp, c.hp + e.crewHeal); L.push('Crew healed'); }
  if(e.crewHurt){ for(const c of s.crew) if(c.owner==='p' && !c.drone) c.hp = Math.max(1, c.hp - e.crewHurt*(.5+Math.random()*.5)); L.push('Crew injured'); }
  if(e.xp){ for(const c of s.crew) if(c.owner==='p' && !c.drone) gainXP(c, e.xp.skill, e.xp.amt); L.push(`Crew trained in ${SKILLN[e.xp.skill]||e.xp.skill}`); }
  if(e.reveal && G.map){ for(const n of G.map.nodes) n.revealed = true; L.push('Sector map revealed'); }
  if(e.fleetPush){ G.fleetX += e.fleetPush; L.push(e.fleetPush>0 ? 'The Rebuff Fleet draws closer' : 'The Rebuff Fleet falls behind'); }
  if(e.primeWeapons){ for(const w of s.weapons) if(w.on) w.charge = DATA.weapons[w.id]?.charge||0; }
  if(e.mapPiece){ G.mapPieces = (G.mapPieces||0) + e.mapPiece; L.push(`Treasure map piece ${Math.min(3,G.mapPieces)} of 3`);
    if(G.mapPieces>=3 && !G.flags.mapDone){ G.flags.mapDone = true; placeQuest('treasure_vault'); L.push('The map is complete! The treasure is marked on your map'); } }
  if(typeof marketEffect==='function') marketEffect(e, L);
  if(typeof sagaEffect==='function') sagaEffect(e, L);
  return L;
}
function checkCrewAch(){ if(G.ship.crew.filter(c=>c.owner==='p'&&!c.drone).length>=8) grant('fullcrew'); if(G.ship.augments.length>=3) grant('augs3'); }
function giveWeapon(id){
  const pool = Object.values(DATA.weapons).filter(w => !w.noLoot);
  const w = (id==='random' || !DATA.weapons[id]) ? pick(pool) : DATA.weapons[id]; if(!w) return 'Nothing useful inside';
  if(G.ship.weapons.length < R.weaponSlots){ G.ship.weapons.push({ id:w.id, charge:0, on:false, target:null }); return `${w.name} mounted (power it up)`; }
  G.ship.cargo = G.ship.cargo || []; G.ship.cargo.push({ kind:'weapon', id:w.id }); return `${w.name} stowed in cargo`;
}
function giveDrone(id){
  const pool = Object.values(DATA.drones).filter(d => !d.noLoot);
  const d = (id==='random' || !DATA.drones[id]) ? pick(pool) : DATA.drones[id]; if(!d) return 'Nothing useful inside';
  G.parts += 2;
  if(G.ship.drones.length < R.droneSlots){ G.ship.drones.push({ id:d.id, on:false, unit:null });
    if(!G.ship.systems.drones) return `${d.name} blueprint (install a Drone system to use it) and 2 drone parts`;
    return `${d.name} ready, plus 2 drone parts`; }
  G.ship.cargo = G.ship.cargo || []; G.ship.cargo.push({ kind:'drone', id:d.id }); return `${d.name} stowed in cargo, plus 2 drone parts`;
}
function giveAugment(id){
  const have = G.ship.augments; const pool = Object.keys(DATA.augments).filter(k => !have.includes(k));
  const k = id==='random' ? pick(pool) : (DATA.augments[id] ? id : null); if(!k) { G.scrap += 30; return '+30 scrap'; }
  if(have.length >= R.augmentSlots){ const v = Math.floor((DATA.augments[k].cost||40)/2); G.scrap += v; return `${DATA.augments[k].name} found, but no slot free. Sold for ${v} scrap`; }
  have.push(k); checkCrewAch(); if(k==='voltanShield' && G.enemy) G.ship.super = Math.max(G.ship.super, 5); return `Augment installed: ${DATA.augments[k].name}`;
}
/* crew swaps: a recruit joins in place of someone who leaves (events and stores, when every bunk is full) */
const TRADE_IN = 20;
function joinCrew(cand){ const nc = addCrew(G.ship, cand.race, 'p', cand.name); nc.gender = cand.gender; nc.look = cand.look; nc.trait = cand.trait || null; nc.maxHp = cand.maxHp || nc.maxHp; nc.hp = nc.maxHp; nc.quirk = cand.quirk || nc.quirk; checkCrewAch(); if(typeof sagaJoined==='function') sagaJoined(nc); return nc; }
function crewLeaves(c){ for(const sh of [G.ship, G.enemy]) if(sh){ const k = sh.crew.indexOf(c); if(k>=0) sh.crew.splice(k,1); } if(UI.selCrew===c.id) UI.selCrew = null; UI.selCrews = (UI.selCrews||[]).filter(id => id!==c.id); }
function openSwap(cand, cost, done){ G.modal = { type:'swapcrew', cand, cost:cost||0, done }; }
function finishSwap(m, swapped){ G.modal = null; if(m.done) m.done(swapped); else save(); }
function closeResult(m){
  G.modal = null; const a = m.after || {};
  if(G.petNaming){ G.petNaming = false; if(typeof sagaNamePet==='function') sagaNamePet(); }
  if(G.openClinic){ G.openClinic = false; G.modal = { type:'clinic' }; return; }   // Doctor Oddly (travellers.js)
  if(G.openMags){ G.openMags = false; G.modal = { type:'store', node:G.map.cur, mags:true }; UI.storeTab = 'goods'; return; }   // Mags's caravan (market.js)   // a new pet needs a name
  if(G.recruitOffer){ const cand = G.recruitOffer; G.recruitOffer = null; openSwap(cand, 0, () => closeResult({ after:a })); return; }
  if(a.begin){ if(G.enemy) taunt('start'); return; }
  if(a.dismiss){ leaveCombat(); save(); return; }
  if(a.fight) startCombat(a.fight, { afterWin:a.afterWin });
  else if(a.event) startEvent(a.event);
  else if(a.store){ const n = G.map.nodes[G.map.cur]; if(!n.store) n.store = makeStore(); G.modal = { type:'store', node:G.map.cur }; }
  else save();
}

/* ---------------- combat lifecycle ---------------- */
function pickEnemy(n){
  const sd = sectorDef(); const bias = sd.enemyTags || []; n = Math.min(n, 8);   // longer runs (Marathon rules) keep meeting late-game ships
  let pool = Object.values(DATA.enemies).filter(e => !e.boss && !e.eventOnly && (!e.onlyTagged || (e.tags||[]).some(t=>bias.includes(t))) && (!e.sectors || (e.sectors[0]<=n && e.sectors[1]>=n)));
  if(!pool.length) pool = Object.values(DATA.enemies).filter(e => !e.boss && !e.eventOnly);
  return wpick(pool, e => (e.tags||[]).some(t=>bias.includes(t)) ? 4 : 1);
}
function startCombat(id, o={}){ G.fightsHere = (G.fightsHere||0) + 1; return withSeed(`s${G.sector}n${G.map?.cur}f${G.fightsHere}`, () => startCombat_(id, o)); }
function startCombat_(id, o={}){
  if(o.harder) G.fleetFights = (G.fleetFights||0) + 1;
  const n = Math.max(1, Math.min(G.sector + (o.harder ? 1 + Math.floor(((G.fleetFights||1)-1)/3) : 0), 9) - (curDiff().ease||0));   // Easy: enemies are a sector behind
  const def = id==='flag' ? DATA.enemies[R.bossId] : (id && id!=='random' && DATA.enemies[id]) ? DATA.enemies[id] : pickEnemy(n);
  if(!def){ G.modal = { type:'msg', title:'All clear', text:'Sensors show no hostiles.' }; return; }
  G.enemy = makeShip(def, 'e', { sector:n, phase:o.phase||0 }); G.enemy.fleet = !!o.harder;
  const tags = def.tags || []; G.enemy.faction = tags.find(t => TAUNTS.start[t]) || (def.auto ? 'auto' : 'generic');
  // mods can add hails for their own tags ("bounty", "ghost"...): use one when the faction has none of its own
  const hasHail = t => Object.values(DATA.events).some(ev => ev.hail===t);
  G.enemy.hailTag = (tags.includes(G.enemy.faction) && hasHail(G.enemy.faction)) ? G.enemy.faction : (tags.find(hasHail) || G.enemy.faction);
  const cs = CALLSIGNS[G.enemy.faction]; if(cs && !def.boss) G.enemy.name = `${def.name} "${pick(cs)}"`;
  // now and then a veteran crew: tougher and faster, but they carry better salvage
  if(!def.boss && !o.harder && G.sector >= 3 && Math.random() < .12){ const e = G.enemy; e.elite = true; e.name = 'Veteran ' + e.name; e.hull += 3; e.maxHull += 3;
    for(const k of ['engines','weapons']) if(e.systems[k]){ e.systems[k].max = Math.min(8, e.systems[k].max + 1); e.systems[k].power = e.systems[k].max; } }
  if(typeof sagaCombatStart==='function') sagaCombatStart(G.enemy, o);   // your nemesis, back for more
  if(def.boss && G.flags.intel){ G.enemy.hull = G.enemy.maxHull = Math.max(10, G.enemy.maxHull - 6); }
  if(def.boss && G.flags.sabotage && G.enemy.weapons.length>1) G.enemy.weapons.pop();
  G.hull0 = G.ship.hull; G.boss = !!def.boss; G.proj = []; G.units = []; G.ftl = 0; G.dieT = 0; G.combatT = 0; G.stT = 0; G.stSig = null; G.stProg = null; G.afterWin = o.afterWin || null;
  const s = G.ship; s.hacked = null; s.hackLaunched = false;
  if(hasAug(s,'voltanShield')) s.super = Math.max(s.super, 5); if(augFx(s,'superShield') > 0) s.super = Math.max(s.super, Math.round(augFx(s,'superShield')));
  if(hasAug(s,'preigniter')) for(const w of s.weapons) if(w.on) w.charge = DATA.weapons[w.id]?.charge || 0;
  G.enemy.super = G.enemy.superMax;
  sfx('alarm'); haptic(.3, 200); emit('combatStart', G.enemy); logEntry(`Engaged the ${G.enemy.name}.`);
  if(typeof mpCombatStart==='function') mpCombatStart(G.enemy);
  if(o.hail){ const hid = pickHail(o.hail===true ? (G.enemy.hailTag || G.enemy.faction) : o.hail); if(hid){ startEvent(hid, { combat:true }); return; } }
  if(def.boss && (G.flags.intel || G.flags.sabotage)) o.text = (o.text||'') + (G.flags.intel ? ' Commander Vane\'s codes expose a flaw in its hull.' : '') + (G.flags.sabotage ? ' Your spy\'s sabotage has knocked out one of its weapons.' : '');
  G.modal = { type:'msg', title:o.title || 'Hostile contact', text:o.text || `The ${G.enemy.name} powers its weapons. Pick targets, then fire. Pause any time to think.`, btn:'Battle stations' };
}
function offerSurrender(e){
  const n = G.sector; const offer = { scrap: 12 + n*5 + ri(0,10) }; const r = Math.random();
  if(r<.33) offer.fuel = ri(2,4); else if(r<.66) offer.missiles = ri(2,4); else offer.parts = ri(2,4);
  if(Math.random()<.15) offer.weapon = 'random';
  const theirs = e.crew.filter(c => c.owner==='e' && !c.drone && DATA.races[c.race] && !DATA.races[c.race].secret);
  if(theirs.length && Math.random() < .12) offer.crew = pick(theirs).race;
  G.modal = { type:'surrender', offer, name:e.name, line:[].concat(SURRENDER_LINES[e.faction] || SURRENDER_LINES.generic).length ? pick([].concat(SURRENDER_LINES[e.faction] || SURRENDER_LINES.generic)) : '' };
}
function finishCombat(kind, offer){
  const e = G.enemy; if(!e) return; const wasBoss = G.boss;
  const aboard = e.crew.filter(c => c.owner==='p' && !c.drone);
  if(kind==='destroyed'){ for(const c of aboard) killCrew(e, c); }
  else for(const c of aboard){ e.crew.splice(e.crew.indexOf(c),1); G.ship.crew.push(c); placeCrew(G.ship, c, Math.max(0, roomOf(G.ship,'teleporter'))); c.mcT = 0; }
  if(kind!=='fled') for(const c of [...G.ship.crew]) if(c.owner==='e') G.ship.crew.splice(G.ship.crew.indexOf(c),1);
  leaveCombat();
  for(const c of G.dna){ c.hp = c.maxHp; c.path = []; c.mcT = 0; G.ship.crew.push(c); placeCrew(G.ship, c, c.station ?? 0); } G.dna = [];
  if(kind==='fled'){ const lf = []; if(typeof sagaFightLines==='function') sagaFightLines(lf); G.modal = { type:'msg', title:'They got away', text:`The ${e.name} jumps away before you can finish it.${lf.length ? ' ' + lf.join(' ') : ''}` }; if(typeof sagaEnemyGotAway==='function') sagaEnemyGotAway(e, 'by jumping out before the crew could finish them'); save(); return; }
  if(wasBoss){ flagDefeated(); return; }
  G.stats.kills++; PROFILE.kills++; saveProfile(); if(PROFILE.kills>=25) grant('kills25'); if(PROFILE.kills>=100) grant('kills100');
  if(kind!=='surrender' && (G.combatT||0) < 20) grant('quickdraw');
  if(G.ship.hull >= (G.hull0 ?? 0)){ G.stats.flawless = (G.stats.flawless||0) + 1; if(G.stats.flawless >= 5) grant('flawless5'); }
  if(kind==='crew') grant('boardkill'); if(kind==='surrender') grant('surrender');
  if(typeof mpFightWon==='function') mpFightWon(kind, e);
  if(G.ship.hull<=3) grant('hullbreadth');
  emit('combatEnd', { kind, enemy:e });
  const L = [];
  if(kind==='surrender') L.push(...applyEffect(offer));
  else {
    if(e.fleet){ L.push(...applyEffect({ scrap: ri(3,8) })); L.unshift('Fleet warships are stripped for war: there is almost nothing worth salvaging. Get ahead of the fleet!'); }
    else { withSeed(`s${G.sector}n${G.map?.cur}loot${G.fightsHere||0}`, () => {
    const reward = { scrap: Math.round((ri(20,30) + G.sector*10) * (kind==='crew' ? 1.5 : 1) * (e.elite ? 1.5 : 1)) };
    if(e.elite){ if(Math.random() < .5) reward.weapon = 'random'; else reward.augment = 'random'; grant('veteran'); }
    if(Math.random()<.6) reward.fuel = ri(1,3); if(Math.random()<.35) reward.missiles = ri(1,3); if(Math.random()<.3) reward.parts = ri(1,2);
    if(!reward.weapon && Math.random() < (kind==='crew' ? .35 : .2)) reward.weapon = 'random';
    if(!reward.augment && Math.random() < .05) reward.augment = 'random';
    if(Math.random() < (kind==='crew' ? .08 : .04)) reward.drone = 'random';
    if(Math.random() < .35) reward.goods = 'loot';   // cargo worth trading (market.js)
    const races = [...new Set(e.crew.filter(c => c.owner==='e' && !c.drone && DATA.races[c.race] && !DATA.races[c.race].secret).map(c => c.race))];
    if(kind==='destroyed' && Math.random() < .07){ reward.crew = races.length ? pick(races) : 'random'; L.push(pick(SURVIVOR_LINES)); }
    L.push(...applyEffect(reward)); }); }
  }
  if(G.afterWin){ const aw = G.afterWin; G.afterWin = null; L.push(...applyEffect(aw)); if(aw.text) L.unshift(aw.text); }
  { const pt = curDiff().patch || 0, sh = G.ship; if(pt && sh.hull < sh.maxHull){ const h = Math.min(pt, sh.maxHull - sh.hull); sh.hull += h; L.push(`Your crew patches ${h} hull from the wreckage`); } }   // Easy: a little mercy between fights
  if(typeof sagaFightWon==='function') sagaFightWon(kind, e, L);
  if(typeof homeFight==='function') homeFight();
  if(typeof bountyKill==='function'){ const bl = bountyKill(e); if(bl) L.push(bl); }   // Kestrel Jones's contracts (travellers.js)
  G.modal = { type:'result', title: kind==='surrender' ? 'Surrender accepted' : 'Hostile defeated',
    text: kind==='crew' ? `The ${e.name} drifts silent, its crew gone. You strip it bare.` : kind==='surrender' ? `The ${e.name} hands over its cargo and limps away.` : pick([].concat(VICTORY_LINES[e.faction]||VICTORY_LINES.generic)).replace('{enemy}', e.name) + ' Your crew sweeps the debris for anything useful.', lines:L, after:{} };
  logEntry(`Defeated the ${e.name}.`); say('victory', { force:true }); sfx('victory', { vol:.6 });
}
function flagDefeated(){
  const f = G.flag; grant('phase1'); if(typeof sagaNote==='function') sagaNote('boss', f && f.phase >= 2 ? 'At Fedoration command, the Flaggship finally broke apart.' : `They beat the Flaggship${f && f.phase ? ' a second time' : ''}, and it ran.`);
  if(!f || f.phase >= 2){ endRun(true); return; }
  f.phase++; f.step = 1; moveFlagship();
  G.modal = { type:'msg', title:'The Flaggship retreats', text:`The Flaggship jumps away, damaged but not done. It is heading for Fedoration command. Chase it down. Next: ${DATA.enemies[R.bossId]?.phases?.[f.phase]?.name || 'phase ' + (f.phase+1)}.`, btn:'Open map', then:openMap };
  save();
}
function runScore(win){ return (win ? 10000 : 0) + G.sector*1000 + G.stats.kills*40 + Math.round(G.stats.scrap/5) + (G.flag ? G.flag.phase*500 : 0); }
function recordRun(win, reason){
  const st = G.stats, entry = { t:Date.now(), ship:G.shipDef, name:G.ship.name, diff:G.diff || SET.difficulty, seed:G.seed||'', daily:G.daily||null, win:!!win, sector:G.sector,
    kills:st.kills, scrap:st.scrap, jumps:st.jumps, lost:(G.lost||[]).length, reason:win ? '' : String(reason||'').slice(0,80), time:Math.round(G.time||0), score:runScore(win) };
  PROFILE.history = [entry, ...(PROFILE.history||[])].slice(0, 30);
  const b = (PROFILE.best = PROFILE.best || {})[G.shipDef] || {}; PROFILE.best[G.shipDef] = { sector:Math.max(b.sector||0, G.sector), wins:(b.wins||0) + (win?1:0), score:Math.max(b.score||0, entry.score) };
  if(G.daily){ const d = (PROFILE.daily = PROFILE.daily || {})[G.daily]; if(!d || entry.score > d.score) PROFILE.daily[G.daily] = { score:entry.score, sector:G.sector, win:!!win, kills:st.kills, ship:G.shipDef };
    const keys = Object.keys(PROFILE.daily).sort(); while(keys.length > 60) delete PROFILE.daily[keys.shift()]; }
  UI.lastRun = entry;
  if(G.daily){ grant('daily'); if(typeof dailyStreak==='function' && dailyStreak() >= 3) grant('streak3'); if(typeof dailyStreak==='function' && dailyStreak() >= 7) grant('streak7'); }
  if(typeof challengeRecord==='function') challengeRecord();
  if(typeof codesRecordRun==='function') codesRecordRun(entry, win);
  if(win){ if(G.diff==='hard') grant('hardwin'); if(!(G.lost||[]).length) grant('noloss'); if((G.time||0) < 2400) grant('speedwin'); if(R.sectors >= 10) grant('marathonwin'); }
}
function endRun(win, reason){
  if(typeof challengeCheck==='function') challengeCheck(win);
  sfx(win ? 'victory' : 'defeat'); recordRun(win, reason); if(typeof sagaRunEnd==='function') sagaRunEnd(win, reason);
  if(win){ PROFILE.wins[G.shipDef] = (PROFILE.wins[G.shipDef]||0) + 1; grant('win'); UI.screen = 'win'; }
  else { grant('rebuffed'); UI.screen = 'over'; UI.overReason = reason || ''; }
  saveProfile(); LS.del(SAVE_KEY); emit('runEnd', { win });
  if(typeof mpRunEnded==='function') mpRunEnded(win, reason);
}

function smartPause(reason){ if(typeof SYNC!=='undefined' && SYNC.on && !MP.opts.smartPause) return; if(SET.smartPause && G && !G.modal && !G.paused && UI.screen==='game'){ G.paused = true; toast(`Auto-paused: ${reason}`); } }
/* ---------------- crew chatter & enemy taunts ---------------- */
const SAY_GAP = { shieldsDown:35, hit:9, repair:20, fire:12, breach:12, jump:25, enemyHurt:30, boarders:20 };   // seconds before the same kind of line again
function say(trigger, o={}){
  if(!G) return; if(!o.force && G.time - (G.lastSay ?? -99) < 3.5) return;
  const gap = SAY_GAP[trigger], last = (G.sayT = G.sayT || {}); if(gap && G.time - (last[trigger] ?? -999) < gap) return;
  let c = o.crew; if(!c){ const list = G.ship.crew.filter(x => x.owner==='p' && !x.drone && x.mcT<=0); if(!list.length) return; c = pick(list); }
  if(!c || c.drone) return;
  const rc = RACE_CHATTER[c.race], ql = typeof quirkLine==='function' ? quirkLine(c, trigger) : null;
  const pool = ql && Math.random()<.4 ? ql : rc && rc[trigger] && Math.random()<.5 ? rc[trigger] : CHATTER[trigger]; if(!pool) return;
  const recent = (G.sayRecent = G.sayRecent || []), text = typeof pickFresh==='function' ? pickFresh(pool, recent) : pick(pool); recent.push(text); if(recent.length > 8) recent.shift();
  last[trigger] = G.time;
  G.chat = (G.chat||[]).filter(b => b.t>0).slice(-3); G.chat.push({ text, id:c.id, t:3 }); G.lastSay = G.time; if(typeof voiceOf==='function') sfx('voice', voiceOf(c.race));
}
function taunt(kind){ if(!G || !G.enemy || G.enemy.dead) return; const set = TAUNTS[kind]||{}; const pool = set[G.enemy.faction] || set.generic; if(!pool) return;
  const recent = (G.tauntRecent = G.tauntRecent || []), text = typeof pickFresh==='function' ? pickFresh(pool, recent) : pick(pool); recent.push(text); if(recent.length > 6) recent.shift();
  G.chat = (G.chat||[]).filter(b => b.t>0 && !b.enemy); G.chat.push({ text, enemy:true, t:3.2 }); if(typeof voiceOf==='function') sfx('voice', Object.assign(voiceOf(G.enemy.crew.find(c=>!c.drone)?.race), { base:(voiceOf(G.enemy.crew.find(c=>!c.drone)?.race).base||1)*.85, vol:.7 })); }

/* ---------------- stores & upgrades ---------------- */
function makeStore(){ return withSeed(`s${G.sector}n${G.map?.cur}store`, () => { const st = makeStore_(); return typeof marketStock==='function' ? marketStock(st) : st; }); }
function makeStore_(){
  const s = G.ship;
  const wp = Object.values(DATA.weapons).filter(w=>!w.noLoot).map(w=>w.id); shuffle(wp);
  const dp = Object.values(DATA.drones).filter(d=>!d.noLoot).map(d=>d.id); shuffle(dp);
  const ap = Object.keys(DATA.augments).filter(k => !s.augments.includes(k)); shuffle(ap);
  const sp = Object.keys(INSTALL).filter(k => !s.systems[k] && !(k==='clonebay' && s.systems.medbay) && !(k==='medbay' && s.systems.clonebay)); shuffle(sp);
  return { weapons:wp.slice(0,3), drones:dp.slice(0,2), augments:ap.slice(0,2), systems:sp.slice(0,2), sold:[], crewRace:pick(Object.keys(DATA.races).filter(k => !DATA.races[k].secret || G.sectorType==='glass')), crewSold:false, discount:1 };
}
function price(v, st, cat, id){ return Math.max(1, Math.round(v * (st?.discount||1) * (typeof marketMult==='function' ? marketMult(st, cat, id) : 1))); }   // store kind, sector, haggling, loyalty (market.js)
function buy(cost, fn){ if(G.scrap < cost){ toast('Not enough scrap.'); return false; } G.scrap -= cost; G.spent = (G.spent||0) + cost; fn(); sfx('buy'); save(); return true; }
function upgradeCost(k, lv){ const c = UPCOST[k] || [25,15]; return c[0] + c[1]*lv; }
function reactorCost(){ return Math.round(12 + G.ship.reactor*2.5); }
function sellValue(kind, id){ const d = kind==='weapon' ? DATA.weapons[id] : kind==='drone' ? DATA.drones[id] : DATA.augments[id]; return Math.floor((d?.cost||20)/2); }

/* ---------------- main update ---------------- */
function update(dt){
  if(typeof pollPad==='function') pollPad(dt);
  updateStars(dt);
  if(UI.toast){ UI.toast.t -= dt; if(UI.toast.t<=0) UI.toast = null; }
  if(typeof checkHints==='function') checkHints(dt);
  if(typeof updateAmbience==='function') updateAmbience(dt);
  if(typeof netFrame==='function') netFrame(dt);
  if(UI.screen!=='game' || !G) return;
  for(const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < 1.1);
  G.shake = Math.max(0, G.shake - dt*2); G.flash = Math.max(0, (G.flash||0) - dt*1.5);
  if(typeof SYNC!=='undefined' && SYNC.on){
    if(SYNC.guest){ syncGuestTick(dt); return; }   // the host runs the game; guests animate their copy
    if(SYNC.host){ SYNC.relay = SYNC.inShared = true; try{ updateGame(dt); } finally { SYNC.relay = SYNC.inShared = false; } return; } }
  updateGame(dt);
}
function updateGame(dt){
  if(G.warp>0){ G.warp -= dt;
    if(G.warpNode!=null && G.warp < .5){ const n = G.warpNode; G.warpNode = null;
      if(typeof n==='string' && n.startsWith('sector:')){ const t = n.slice(7); genSector(G.sector+1, t);
        G.modal = { type:'msg', title:`Sector ${G.sector} · ${sectorDef().name}`, text: (sectorDef().intro ? pick(sectorDef().intro) + ' ' : '') + (sectorDef().final ? 'The Flaggship is heading for Fedoration command at the far end of this sector. Catch it, three times, before it gets there.' : sectorDef().secret ? 'A quest beacon marks where the Glassborn are waiting.' : 'The Rebuff Fleet is already plotting its pursuit.'), btn:'Open map', then:openMap }; save(); }
      else arrive(n); } }
  const live = !G.paused && !blockingModal() && G.warp<=0 && !(typeof mpHold==='function' && mpHold());
  if(live){
    dt *= (G.duel ? 1 : (SET.speed || 1));   // Settings > Gameplay > Game speed: slower fights for VR or new captains (duels run at one speed)
    G.time += dt;
    const foe = G.enemy && !G.enemy.dead ? G.enemy : null;
    if(foe) G.combatT += dt;
    tickShip(G.ship, dt, foe);
    if(foe && !G.duel){ tickShip(foe, dt, G.ship); enemyBrain(foe, G.ship, dt); }   // a duel opponent's ship runs in their own game
    deployDrones(G.ship, foe); if(foe && !G.duel) deployDrones(foe, G.ship);
    tickUnits(dt);
    for(const p of G.proj) p.t += dt;
    const done = G.proj.filter(p => p.t >= p.dur); G.proj = G.proj.filter(p => p.t < p.dur);
    done.forEach(resolve);
    tickHazard(dt);
    if(foe && !G.duel){
      const s = G.ship; const ok = eff(s,'engines')>0 && eff(s,'piloting')>0 && (manned(s,'piloting') || eff(s,'piloting')>=2);
      if(ok && G.ftl<1){ G.ftl = Math.min(1, G.ftl + dt*(.02 + .006*eff(s,'engines'))); if(G.ftl>=1) sfx('ftlready'); }
      // stalemate breaker: if nobody has been able to hurt anybody for a while, the enemy gives up and leaves
      // a crew that keeps getting hurt and healed, or a system that keeps getting knocked out and fixed, is not progress:
      // only a ship losing hull, crew or a whole system for good counts
      if(!foe.dead && !foe.boss){ const st = G.stProg || (G.stProg = { ph:s.hull, eh:foe.hull, pc:99, ec:99, es:99 });
        const pc = s.crew.filter(c => c.owner==='p' && !c.drone).length + foe.crew.filter(c => c.owner==='p' && !c.drone).length, ec = foe.crew.filter(c => c.owner==='e' && !c.drone).length + s.crew.filter(c => c.owner==='e' && !c.drone).length;
        const es = Object.values(foe.systems).filter(y => y.dmg >= y.max).length;
        if(s.hull < st.ph || foe.hull < st.eh || pc < st.pc || ec < st.ec || es > (st.es===99 ? es : st.es)){ G.stT = 0; }
        else if(!G.paused) G.stT = (G.stT||0) + dt;
        st.ph = Math.min(st.ph, s.hull); st.eh = Math.min(st.eh, foe.hull); st.pc = Math.min(st.pc, pc); st.ec = Math.min(st.ec, ec); st.es = st.es===99 ? es : Math.max(st.es, es);
        if(G.stT > 45 && foe.fleeT==null){ foe.fleeT = 12; foe.stalemate = true; toast(`Neither ship can land a blow. The ${foe.name} gives up and spins up its jump drive.`); } }
      if(foe.fleeT!=null && !foe.dead){ if(foe.stalemate || (eff(foe,'engines')>0 && (manned(foe,'piloting') || foe.auto))) foe.fleeT -= dt; if(foe.fleeT<=0){ finishCombat('fled'); return; } }
    }
    if(G.enemy && G.enemy.dead){ G.dieT -= dt; const b = G.enemy._b; if(b && Math.random() < dt*10) burst(rand(b.x0,b.x1), rand(b.y0,b.y1), .8, '#ff8a3d'); if(G.dieT<=0){ finishCombat(G.enemy.deadKind || 'destroyed'); } }
    for(const b of (G.chat||[])){ if(b.d > 0) b.d -= dt; else b.t -= dt; }
    for(const c of G.ship.crew) if(c.vengeT > 0) c.vengeT -= dt;
    if(foe && !G.duel){ if(!foe.hurtSaid && foe.hull < foe.maxHull*.5){ foe.hurtSaid = true; taunt('hurt'); say('enemyHurt'); }
      if(!foe.gloatSaid && G.ship.hull < G.ship.maxHull*.4){ foe.gloatSaid = true; taunt('gloat'); }
      if(!foe.lowSaid && G.ship.hull < G.ship.maxHull*.3){ foe.lowSaid = true; say('lowHull', { force:true }); smartPause('hull critical'); } }
    else { G.idleT = (G.idleT||0) + dt; if(G.idleT > 22){ G.idleT = 0; if(!(typeof sagaIdle==='function' && Math.random()<.5 && sagaIdle()) && Math.random()<.35) say('idle'); } }
    updateParts(dt);
    emit('tick', dt);
  }
  if(G.enemy && !G.enemy.dead && !blockingModal() && !G.duel){
    const e = G.enemy;
    if(e.hull<=0){ e.dead = true; e.deadKind = 'destroyed'; G.dieT = 1.3; sfx('explode'); haptic(.8, 400); G.proj = G.proj.filter(p=>p.from!=='e'); G.units = G.units.filter(u=>u.side!=='e');
      const b = e._b; if(b){ for(let i=0;i<6;i++) burst(rand(b.x0,b.x1), rand(b.y0,b.y1), 1.4, '#ff8a3d'); debris((b.x0+b.x1)/2, (b.y0+b.y1)/2, e.color, 26); } sfx('hit'); haptic(.6, 300); }
    else if(!e.auto && ownerCrewCount('e')===0){ e.dead = true; e.deadKind = 'crew'; G.dieT = .8; G.proj = G.proj.filter(p=>p.from!=='e'); G.units = G.units.filter(u=>u.side!=='e'); }
  }
  if(typeof mpGameTick==='function' && mpGameTick(dt)) return;
  if(UI.screen==='game' && (G.ship.hull<=0 || ownerCrewCount('p')===0)){
    endRun(false, G.ship.hull<=0 ? 'Your hull gave out. The Rebuff Fleet collects the pieces.' : 'Your last crew member is gone. The ship drifts on, empty.'); }
}
