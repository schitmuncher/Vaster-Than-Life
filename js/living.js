'use strict';
/* =========================================================================
   A living galaxy: ideas from the open-world simulation research, the ones
   that fit a roguelike run.
   - Faction standing: the Mantlis, Sloog, Voltan, Pyrates, Enjinn and
     Pebblekin remember what you do. Each has its own values (Mantlis respect
     strength, Voltans peace, Sloogs trade...). Standing changes store prices,
     lets friendly ships wave you through, brings allies into fights, and a
     little of it carries into your next run.
   - Room combos: systems in rooms joined by a door work together (engines
     next to weapons: faster guns...). At a store you can swap two rooms'
     systems to build combos.
   - The workshop: machines in the hold that turn raw goods into something
     worth more (preserves, wine, aged vintages, seeds, drone parts, cloth),
     a few jumps at a time.
   - Crew off duty: personalities do things between jumps (the daredevil
     spars, the poet writes, the tinkerer scrounges, the cook cooks).
     Rivals sharing a station may come to blows; sweethearts on the shields
     work harder; veterans teach rookies who share their room.
   - Haven's Rest: a station you restore across runs by sending goods home
     from stores. Each finished wing gives every future run a perk. Or buy
     the wings outright with renown.
   - The wreck of your last ship: lose a run and, next time, you may find
     what's left of it. Its guns, its logs, and sometimes its crew.
   ========================================================================= */

/* ---------------- faction standing ---------------- */
const FACTIONS = {
  mantlis:  { name:'Mantlis Hives',      col:'#9be26a', likes:'Strength: destroying ships and winning boarding fights.', hates:'Weakness: surrenders, and killing their own warriors.' },
  sloog:    { name:'Sloog Consortium',   col:'#c98ae6', likes:'Trade: spending scrap at their stores.', hates:'Wrecking their freighters.' },
  voltan:   { name:'Voltan Temples',     col:'#ffd166', likes:'Peace: accepting surrenders, sparing crews.', hates:'Destroying ships with people on them.' },
  pyrate:   { name:'Pyrate Kings',       col:'#ff8a5a', likes:'Piracy: hitting the Rebuff, spending at black markets.', hates:'Sinking pyrate ships.' },
  enjinn:   { name:'Enjinn Collective',  col:'#5fd3e6', likes:'Machines: sparing crews, trading at their workshops.', hates:'Scrapping automated ships.' },
  pebblekin:{ name:'Pebblekin Quarries', col:'#d0a070', likes:'Honest business at their exchanges.', hates:'Wrecking their haulers.' }
};
const REP_TIERS = [[-50,'Despised','#ff5a7a'], [-10,'Disliked','#ff8a5a'], [25,'Neutral','#8592b0'], [60,'Favoured','#7be0a0'], [999,'Revered','#ffd166']];
function rep(f){ return (G && G.rep && G.rep[f]) || 0; }
function repTier(f){ const v = rep(f); for(const t of REP_TIERS) if(v < t[0]) return t; return REP_TIERS[4]; }
function repAdd(f, n, why){ if(!G || !FACTIONS[f] || !n) return; G.rep = G.rep || {}; const before = repTier(f)[1]; G.rep[f] = clamp((G.rep[f]||0) + n, -100, 100); const after = repTier(f)[1];
  if(after==='Revered' && before!=='Revered' && typeof factionRevered==='function') factionRevered(f);
  if(after!==before) toast(`${FACTIONS[f].name}: you are now ${after}${why ? ' (' + why + ')' : ''}.`); }
function repPriceMult(kind){ if(!FACTIONS[kind]) return 1; const t = repTier(kind)[1]; return { Despised:1.4, Disliked:1.2, Neutral:1, Favoured:.9, Revered:.82 }[t]; }
function repCombatEnd(kind, e){
  const f = e.faction, aut = !!e.auto;
  if(kind==='destroyed'){ if(FACTIONS[f]) repAdd(f, -12, 'you destroyed one of their ships'); if(f!=='mantlis') repAdd('mantlis', 4); if(!aut) repAdd('voltan', -4); if(aut) repAdd('enjinn', -3); if(f==='rebuff') repAdd('pyrate', 4); }
  else if(kind==='crew'){ if(FACTIONS[f]) repAdd(f, -6); repAdd('mantlis', 8, 'a boarding victory'); if(f==='rebuff') repAdd('pyrate', 3); }
  else if(kind==='surrender'){ if(FACTIONS[f]) repAdd(f, 5); repAdd('voltan', 6, 'mercy'); repAdd('enjinn', 2); repAdd('mantlis', -2); }
}
/* friendly ships wave you through; despised ones come in hot; revered allies join your fights */
function repCombatStart(e, def, o){
  if(!G || def.boss || e.fleet) return; const f = e.faction, t = FACTIONS[f] ? repTier(f)[1] : 'Neutral';
  if((t==='Favoured' || t==='Revered') && o.hail) o.hail = 'repfriend';
  if(t==='Despised'){ e.hull += 2; e.maxHull += 2; if(o.hail) o.hail = 'rephate'; }
  const home = G.sectorType; if(FACTIONS[home] && repTier(home)[1]==='Revered' && f!==home && Math.random() < .4){ e.hull = Math.max(1, e.hull - 3); const ks = Object.keys(e.systems); if(ks.length) damageSystem(e, pick(ks), 1); toast(`${FACTIONS[home].name.split(' ')[0]} allies jump in and open fire on the ${e.name}!`); }
}

/* ---------------- room combos ---------------- */
const COMBOS = [
  { id:'iron_artery', name:'Iron Artery',     sys:[['engines'], ['weapons']],            fx:{ charge:.06 }, text:'Weapons charge 6% faster: power runs straight from the engines.' },
  { id:'war_room',    name:'War Room',        sys:[['piloting'], ['sensors']],           fx:{ evade:3 },    text:'+3% evasion: the helm sees everything.' },
  { id:'clean_ward',  name:'Clean-Air Ward',  sys:[['medbay','clonebay'], ['oxygen']],   fx:{ heal:.2 },    text:'Fresh air from next door: crew slowly heal anywhere on the ship.' },
  { id:'fortress',    name:'Fortress',        sys:[['shields'], ['doors']],              fx:{ shield:.08 }, text:'Shields recharge 8% faster behind reinforced bulkheads.' },
  { id:'hive_mind',   name:'Hive Mind',       sys:[['drones'], ['teleporter']],          fx:{ ammo:.15 },   text:'15% chance a missile or drone part isn\'t used up.' },
  { id:'ghost_wing',  name:'Ghost Wing',      sys:[['cloaking'], ['piloting']],          fx:{ evade:3 },    text:'+3% evasion: the pilot flies with the cloak.' },
  { id:'gun_deck',    name:'Gun Deck',        sys:[['weapons'], ['shields']],            fx:{ sysRes:.1 },  text:'10% chance hits on any system do no system damage: the gunners brace it.' },
  { id:'engine_bay',  name:'Engine Bay',      sys:[['engines'], ['oxygen']],             fx:{ speed:.08 },  text:'Crew move 8% faster on warm, thick air.' }
];
function comboPartName(k){ return k.startsWith('f:') ? ((typeof FACILITIES!=='undefined' && FACILITIES[k.slice(2)]) || {}).name || k.slice(2) : SYSN[k] || k; }
function linked(sh, a, b){ if(a < 0 || b < 0) return false; return sh.doors.some(d => (d.a===a && d.b===b) || (d.a===b && d.b===a)); }
/* the rooms that count for one part of a combo: an installed system, or a facility ("f:lounge") fitted in a room (frontier.js) */
function roomsFor(sh, k){ if(k.startsWith('f:')){ const f = k.slice(2), out = []; sh.rooms.forEach((r, i) => { if(r.fac===f) out.push(i); }); return out; } return sh.systems[k] ? [roomOf(sh, k)].filter(i => i >= 0) : []; }
/* two rooms work together when a door joins them, or when a vending machine sits between them (a "bridge" room) */
function comboLinked(sh, a, b){ if(linked(sh, a, b)) return true; return sh.rooms.some((r, v) => r.fac==='vending' && v!==a && v!==b && linked(sh, a, v) && linked(sh, v, b)); }
function combosOf(sh){
  if(!sh || !sh.rooms) return []; const key = sh.rooms.map(r => (r.sys || '-') + (r.fac ? '+' + r.fac : '')).join(',');
  if(sh._comboKey===key && sh._combos) return sh._combos;
  const out = []; for(const C_ of COMBOS){ const A = [].concat(...C_.sys[0].map(k => roomsFor(sh, k))), B = [].concat(...C_.sys[1].map(k => roomsFor(sh, k)));
    if(A.some(a => B.some(b => a!==b && comboLinked(sh, a, b)))) out.push(C_); }
  sh._comboKey = key; sh._combos = out; return out; }
function comboFx(sh, k){
  if(!G || sh!==G.ship) return 0; let v = 0; for(const C_ of combosOf(sh)) if(typeof C_.fx[k]==='number') v += C_.fx[k];
  if(k==='shield'){ const sr = roomOf(sh, 'shields'); if(sr >= 0 && sh.crew.some(c => c.room===sr && c.bond && c.bond.kind==='sweethearts' && sh.crew.some(o => o.id===c.bond.id && o.room===sr))) v += .1; }   // sweethearts guard each other
  return v; }
function swapCost(){ const home = G && G.map && G.map.nodes[G.map.cur] && G.map.nodes[G.map.cur].type==='haven'; return Math.round((30 + 8*(G.sector||1)) * (havenDone('engineering') ? .5 : 1) * (home ? .5 : 1)); }
function atStore(){ return !!(G && G.map && G.map.nodes[G.map.cur] && ['store','haven'].includes(G.map.nodes[G.map.cur].type)); }
function swapRooms(a, b){ const sh = G.ship, ra = sh.rooms[a], rb = sh.rooms[b]; if(!ra || !rb) return; const t = ra.sys; ra.sys = rb.sys; rb.sys = t; sh._combos = null; if(typeof shipArt==='function') sh._art = null; }

/* ---------------- the workshop ---------------- */
const MACHINES = {
  jar:     { name:'Preserves jar',    cost:30, jumps:3, take:g => g.kind==='crop', out:'preserves', text:'Any crop becomes preserves: worth twice as much, and it never spoils.' },
  keg:     { name:'Fermentation keg', cost:45, jumps:6, take:(g, id) => ['ion_berry','moon_melon','nebula_bloom','glass_lily','solar_grape'].includes(id), out:'fruit_wine', text:'Berries, melons and blooms become fruit wine. Pyrates and Voltans pay well.' },
  cask:    { name:'Zero-G cask',      cost:70, jumps:8, deep:true, take:(g, id) => ['space_wine','fruit_wine'].includes(id), out:'vintage_wine', text:'Ages wine into a vintage worth a fortune. Only ages on jumps into deep space (not at stores).' },
  seeds:   { name:'Seed maker',       cost:35, jumps:1, take:(g, id) => !!seedFor(id), out:'seeds', text:'Turns a crop back into 1-3 seeds of the same plant.' },
  recycler:{ name:'Recycler',         cost:30, jumps:2, take:(g, id) => id==='junk' || g.kind==='fish', out:'parts', text:'Junk or fish become drone parts.' },
  loom:    { name:'Loom',             cost:40, jumps:4, take:(g, id) => ['sloog_silk','mantlis_chitin'].includes(id), out:'ballistic_cloth', text:'Silk or chitin become ballistic cloth: sell it, or use it to mend all your crew\'s kit.' }
};
function seedFor(crop){ return typeof SEEDS!=='undefined' ? Object.keys(SEEDS).find(k => SEEDS[k].crop===crop && !SEEDS[k].only) : null; }
function machines(){ G.machines = G.machines || []; return G.machines; }
function machineJump(node){
  const deep = !['store','base'].includes(node && node.type); const done = [];
  for(const m of machines()){ const M = MACHINES[m.id]; if(!m.input || m.ready) continue; if(M.deep && !deep) continue; m.left--; if(m.left <= 0){ m.ready = true; done.push(M.name); } }
  if(done.length) toast(`Workshop: ${done.join(', ')} ${done.length>1 ? 'are' : 'is'} done (Ship → Workshop).`); }
function machineCollect(m){
  const M = MACHINES[m.id]; let txt = '';
  if(M.out==='seeds'){ const k = seedFor(m.input), n = ri(1, 3); G.seeds = G.seeds || {}; G.seeds[k] = (G.seeds[k]||0) + n; txt = `${n} ${SEEDS[k].name} seed${n>1?'s':''}`; }
  else if(M.out==='parts'){ const n = Math.random() < .5 ? 2 : 1; G.parts += n; txt = `${n} drone part${n>1?'s':''}`; }
  else { if(!addGoods(M.out, 1)){ toast('No room in the hold.'); return; } txt = goodsDef(M.out).name; }
  m.input = null; m.ready = false; m.left = 0; toast(`Collected: ${txt}.`); }
function machineLoad(m, id){ const M = MACHINES[m.id]; if(!takeGoods(id, 1)) return; m.input = id; m.left = M.jumps; m.ready = false; }
function mendAllKit(){ if(!takeGoods('ballistic_cloth', 1)) return; let n = 0;
  for(const c of G.ship.crew) for(const k of ['arm','suit']) if(c[k] && DATA.arms[c[k].id]){ c[k].dur = DATA.arms[c[k].id].dur; n++; }
  for(const it of (G.arms || [])) if(DATA.arms[it.id]){ it.dur = DATA.arms[it.id].dur; n++; }
  toast(`Ballistic cloth: ${n} pieces of kit mended good as new.`); }

/* ---------------- crew off duty ---------------- */
function crewDowntime(){
  const s = G.ship, crew = s.crew.filter(c => c.owner==='p' && !c.drone); if(!crew.length) return; const notes = [];
  for(const c of crew){
    if(c.quirk==='daredevil' && Math.random() < .3){ gainXP(c, 'combat', 3); if(Math.random() < .12 && G.parts > 0){ G.parts--; notes.push(`${c.name} wrecked a sparring drone (-1 part)`); } }
    else if(c.quirk==='poet' && Math.random() < .08){ if(addGoods('epic_poem', 1)) notes.push(`${c.name} finished an epic poem. Glass galleries will pay for it`); }
    else if(c.quirk==='tinkerer' && Math.random() < .2){ G.scrap += 4; G.stats.scrap += 4; if(skillLvl(c, 'repair')===0 && Math.random() < .15){ igniteRoom(s, Math.floor(Math.random()*s.rooms.length)); notes.push(`${c.name} was tinkering with the wiring. Something is on fire`); } }
    else if(c.quirk==='cook' && Math.random() < .15){ const crop = Object.keys(G.bay || {}).find(id => goodsDef(id)?.kind==='crop'); if(crop && takeGoods(crop, 1) && addGoods('star_stew', 1)) notes.push(`${c.name} turned some ${goodsDef(crop).name.toLowerCase()} into star stew`); }
    else if(c.quirk==='collector' && Math.random() < .1){ if(addGoods('junk', 1)) notes.push(`${c.name} found something interesting behind a panel`); }
    else if(c.quirk==='bookworm' && Math.random() < .1){ const sk = pick(['pilot','engines','shields','weapons','repair']); for(const o of crew) gainXP(o, sk, 2); notes.push(`${c.name} read the crew a manual on ${SKILLN[sk].toLowerCase()}. Some of it went in`); }
  }
  if(notes.length) toast(notes[0] + '.');
}
/* rivals at the same station come to blows; veterans teach rookies who share their room */
let livingT = 0;
function livingTick(dt){
  if(!G || !G.ship || G.paused) return; livingT += dt; if(livingT < 1) return; const step = livingT; livingT = 0; const s = G.ship;
  for(const c of s.crew){ if(c.owner!=='p' || c.drone || !c.bond || c.bond.kind!=='rivals' || c.path.length) continue; const o = s.crew.find(x => x.id===c.bond.id); const r = s.rooms[c.room];
    if(o && o.room===c.room && r && r.sys && G.enemy && c.id < o.id && Math.random() < .006*step){ c.hp = Math.max(1, c.hp - 10); o.hp = Math.max(1, o.hp - 10); damageSystem(s, r.sys, 1); fxAtRoom(s, c.room, 'text', 'FISTFIGHT'); toast(`${c.name} and ${o.name} are fighting in the ${SYSN[r.sys] || 'room'}! Keep rivals apart.`); } }
  if(Math.random() < .1*step){ for(const sk of ['combat','repair','pilot','weapons']){ const vets = s.crew.filter(c => c.owner==='p' && !c.drone && skillLvl(c, sk)===2);
    for(const v of vets) for(const r of s.crew) if(r!==v && r.owner==='p' && !r.drone && r.room===v.room && skillLvl(r, sk)===0) gainXP(r, sk, 1); } }
}

/* ---------------- Haven's Rest ---------------- */
const HAVEN_WINGS = [
  { id:'biodome',     name:'The Biodome',            bundle:'The Exotic Botanist',      needs:[['star_potato',5],['ion_berry',5],['moon_melon',2]], reward:'Grand Greenhouse: every run starts with a third planter and three seed packets, and crops grow faster.', renown:900 },
  { id:'aqua',        name:'Aquaculture Bay',        bundle:'The Deep Void Angler',     needs:[['space_fish',6],['deep_eel',1]], reward:'Every run starts with a fishing rod and two space fish.', renown:700 },
  { id:'promenade',   name:'The Promenade',          bundle:'The Artisan\'s Requisite', needs:[['space_wine',2],['sloog_silk',3],['preserves',3],['nebula_crystal',1]], reward:'The Intergalactic Market: every store stocks one extra augment.', renown:1200 },
  { id:'engineering', name:'The Engineering Deck',   bundle:'The Scrapper\'s Dream',    needs:[['scrap',400],['parts',12]], reward:'The Automated Shipyard: room swaps cost half, and every run starts with +3 max hull.', renown:1200 },
  { id:'relay',       name:'The Communications Relay', bundle:'The Diplomat\'s Ledger', needs:[['fuel',20],['voltan_cell',3],['old_books',2]], reward:'The Gate Network: every run starts with +4 fuel and the first sector\'s map revealed.', renown:1000 },
  { id:'fence',       name:'The Smuggler\'s Fence',  bundle:'The Smuggler\'s Cache',    needs:[['contraband',2],['pyrate_rum',3],['rations',6]], reward:'The Black Market Fence: goods you sell fetch 10% more.', renown:1000 },
  { id:'cellar',      name:'The Cellar',             bundle:'The Vintner',              needs:[['fruit_wine',2],['vintage_wine',1],['epic_poem',1]], reward:'The cellar sells well: every run starts with 60 extra scrap.', renown:1100 }
];
function haven(){ PROFILE.haven = PROFILE.haven || { given:{}, done:{} }; return PROFILE.haven; }
function havenDone(id){ return !!(typeof PROFILE!=='undefined' && PROFILE.haven && PROFILE.haven.done && PROFILE.haven.done[id]); }
function havenGiven(w, item){ return ((haven().given[w.id] || {})[item]) || 0; }
function needName(item){ return item==='scrap' ? 'Scrap' : item==='fuel' ? 'Fuel' : item==='parts' ? 'Drone parts' : (goodsDef(item) || {}).name || item; }
function haveForHaven(item){ return item==='scrap' ? G.scrap : item==='fuel' ? Math.max(0, G.fuel - 3) : item==='parts' ? G.parts : goodsHave(item); }
function havenGive(w, item, want){ const left = want - havenGiven(w, item), n = Math.min(left, haveForHaven(item)); if(n <= 0) return;
  if(item==='scrap') G.scrap -= n; else if(item==='fuel') G.fuel -= n; else if(item==='parts') G.parts -= n; else takeGoods(item, n);
  const H_ = haven(); H_.given[w.id] = H_.given[w.id] || {}; H_.given[w.id][item] = (H_.given[w.id][item]||0) + n; havenCheck(w); saveProfile(); sfx('buy'); }
function havenCheck(w){ if(havenDone(w.id)) return; if(w.needs.every(([it, n]) => havenGiven(w, it) >= n)){ haven().done[w.id] = Date.now(); toast(`${w.name} at Haven's Rest is restored! ${w.reward}`); grant('haven_' + w.id); if(HAVEN_WINGS.every(x => havenDone(x.id))) grant('haven_all'); saveProfile(); } }
function renownFree(){ return (PROFILE.renown || 0) - (PROFILE.renownSpent || 0); }
function havenBuy(w){ if(havenDone(w.id) || renownFree() < w.renown) return; PROFILE.renownSpent = (PROFILE.renownSpent||0) + w.renown; haven().done[w.id] = Date.now(); haven().bought = (haven().bought||0) + 1; saveProfile(); toast(`${w.name} rebuilt by Directorate contractors. ${w.reward}`); }
function havenPerksOn(){ return G && !G.daily && !G.cup && !G.challenge && !G.seedDuel && !G.tut && typeof campaignPure==='function' && campaignPure() && !(typeof NET!=='undefined' && NET.on && NET.mode); }

/* ---------------- the wreck of your last ship ---------------- */
function wreckFill(t){ const W_ = G && G.wreck; if(!W_) return t; return String(t).replace(/\{wreck\}/g, W_.name).replace(/\{wreckCrew\}/g, W_.crew.slice(0, 3).join(', ') || 'her crew').replace(/\{wreckSector\}/g, W_.sector); }
(function(){ if(typeof fillText!=='function') return; const f0 = fillText; fillText = function(t, cx){ return f0(wreckFill(t), cx); }; })();

/* ---------------- hooks from the game ---------------- */
function livingRunStart(){
  if(!G) return; G.rep = {};
  const carry = PROFILE.repCarry || {}; for(const f in FACTIONS) if(carry[f]) G.rep[f] = carry[f];   // a little of your last run's reputation
  if(!havenPerksOn()) return; const s = G.ship;
  if(havenDone('biodome')){ const gd = garden(); if(gd.plots.length < PLANTER_MAX) gd.plots.push(null); G.seeds = G.seeds || {}; for(let i = 0; i < 3; i++){ const k = pick(Object.keys(SEEDS).filter(x => !SEEDS[x].only)); G.seeds[k] = (G.seeds[k]||0) + 1; } }
  if(havenDone('aqua')){ G.rod = true; addGoods('space_fish', 2); }
  if(havenDone('engineering')){ s.maxHull += 3; s.hull += 3; }
  if(havenDone('relay')){ G.fuel += 4; if(G.map) for(const n of G.map.nodes) n.revealed = true; }
  if(havenDone('cellar')) G.scrap += 60;
  if(typeof havenRunStart==='function') havenRunStart();
  if(PROFILE.lastWreck){ G.wreck = PROFILE.lastWreck; G.later.push({ event:'old_wreck', jumps:ri(7, 15) }); }
}
function livingRunEnd(win, reason){
  if(!G) return; const carry = {}; for(const f in FACTIONS){ const v = Math.round(rep(f) * .25); if(v) carry[f] = clamp(v, -25, 25); } PROFILE.repCarry = carry;
  if(!win && havenPerksOn() && !G.noSave){ PROFILE.lastWreck = { name:G.ship.name, def:G.shipDef, weapons:G.ship.weapons.map(w => w.id).slice(0, 3), crew:[...(G.lost || []), ...G.ship.crew.filter(c => c.owner==='p' && !c.drone).map(c => c.name)].slice(0, 6), sector:G.sector, boarded:/crew/.test(reason || '') }; }
}
function livingArrive(node, first){
  if(!G) return; machineJump(node); crewDowntime(); if(typeof heatArrive==='function'){ heatArrive(node, first); jobsArrive(node, first); } if(typeof feverJump==='function') feverJump(node); if(typeof havenJump==='function') havenJump(); if(typeof frontierArrive==='function') frontierArrive(node, first);
  if(havenDone('biodome') && havenPerksOn() && G.garden && G.hazard!=='ionstorm') for(const p of G.garden.plots) if(p) p.g += .25;
  if(G._shop){ const spent = (G.spent||0) - G._shop.spent; if(spent > 0){ const k = G._shop.kind, gain = Math.floor(spent / 25) * (k==='sloog' ? 2 : 1); if(FACTIONS[k]) repAdd(k, gain, 'good business'); if(k==='nebula') repAdd('pyrate', Math.floor(spent / 40)); } G._shop = null; }
  if(node && node.type==='store'){ const kind = STORE_KINDS[G.sectorType] ? G.sectorType : 'civilian'; G._shop = { kind, spent:G.spent||0 }; const cs = typeof havenCanSend==='function' && havenCanSend(true); if(cs) toast(`You're carrying ${needName(cs.it)} for ${cs.w.name}. Send it home: Trade → Send home.`); }
}
function livingStock(st){ if(havenDone('promenade') && havenPerksOn()){ const extra = Object.keys(DATA.augments).filter(k => !DATA.augments[k].noLoot && !st.augments.includes(k) && !G.ship.augments.includes(k)); if(extra.length) st.augments.push(pick(extra)); } return st; }
function livingSellMult(){ return havenDone('fence') && havenPerksOn() ? 1.1 : 1; }
function livingEffect(e, L){
  if(!e || !G) return;
  if(e.rep){ for(const k in e.rep){ const f = k==='enemy' ? (G.enemy && G.enemy.faction) : k; if(FACTIONS[f]){ repAdd(f, e.rep[k]); L.push(`${FACTIONS[f].name} ${e.rep[k] > 0 ? '+' : ''}${e.rep[k]}`); } } }
  if(e.wreckLoot && G.wreck){ const w = G.wreck.weapons.find(id => DATA.weapons[id]); if(w) L.push(giveWeapon(w)); delete PROFILE.lastWreck; saveProfile(); }
  if(e.wreckDone){ delete PROFILE.lastWreck; saveProfile(); }
}
function livingCombatStart(e, def, o){ repCombatStart(e, def, o); if(def.boss && !(o && o.phase)){ havenResidentsHelp(e); if(typeof pipIntel==='function') pipIntel(e); }
  if(def.revenant && G.wreck){ e.name = `The ${G.wreck.name}`; const ws = G.wreck.weapons.filter(id => DATA.weapons[id]); if(ws.length){ e.weapons = ws.map(id => ({ id, charge:0, on:true, target:null })); e.systems.weapons.max = Math.max(e.systems.weapons.max, ws.reduce((t, id) => t + (DATA.weapons[id].power||1), 0)); e.systems.weapons.power = e.systems.weapons.max; }
    e.crew.filter(c => c.owner==='e' && !c.drone).forEach((c, i) => { if(G.wreck.crew[i]) c.name = G.wreck.crew[i]; }); } }

/* ---------------- screens ---------------- */
function drawLayoutTab(f, cx, y0){
  const s = G.ship, W2 = f.w - 64, act = combosOf(s), here = atStore(), LW = Math.round(W2*.6);
  // your ship, drawn: tap two rooms to swap their systems
  label('Your ship', cx, y0+10, C.amber, 'left', 15);
  T(here ? `Tap a room, then another, to swap their systems: ${swapCost()} scrap.` : 'Room swaps happen at a store or at home. Glowing links are active combos.', cx + 130, y0+12, { s:14, c: here ? C.ink : C.muted, max:LW-140 });
  const key = s.rooms.map(r => (r.sys || '-') + (r.fac || '')).join(','); if(!UI.layoutShip || UI.layoutShip._key!==key || UI.layoutShip._src!==s){ UI.layoutShip = Object.assign({}, s, { crew:[], _rects:null, _src:s, _key:key, _style:s._style }); UI.layoutShip._src = s; UI.layoutShip._key = key; }
  const T_ = UI.layoutShip; T_.rooms = s.rooms; T_.systems = s.systems;
  drawShip(T_, { x:cx, y:y0+40, w:LW, h:380 }, 1, false, false); ctx.globalAlpha = 1;
  const R_ = T_._rects || [], ctr = q => [q.x + q.w/2, q.y + q.h/2];
  // combo links
  for(const C_ of act){ const A = [].concat(...C_.sys[0].map(k => roomsFor(s, k))), B = [].concat(...C_.sys[1].map(k => roomsFor(s, k)));
    for(const a of A) for(const b of B) if(a!==b && comboLinked(s, a, b) && R_[a] && R_[b]){ const [x1, y1] = ctr(R_[a]), [x2, y2] = ctr(R_[b]); const pl = .55 + .45*Math.sin(performance.now()/300);
      ctx.save(); ctx.strokeStyle = hexA(C.good, .5 + .4*pl); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.shadowColor = C.good; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
      const mx = (x1+x2)/2, my = (y1+y2)/2; ctx.font = `700 13px ${FD}`; const tw = ctx.measureText(C_.name).width + 14; rr(mx - tw/2, my - 11, tw, 22, 11); ctx.fillStyle = 'rgba(6,20,14,.92)'; ctx.fill(); T(C_.name, mx, my + 5, { s:13, a:'center', c:C.good, w:700 }); } }
  // tap targets on each room
  R_.forEach((q, i) => { if(!q) return; const r = s.rooms[i], sel = UI.swapA===i;
    if(sel){ ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.setLineDash([8, 5]); ctx.lineDashOffset = -performance.now()/40; ctx.strokeRect(q.x+2, q.y+2, q.w-4, q.h-4); ctx.restore(); }
    region(q.x, q.y, q.w, q.h, () => { if(!here){ toast('Dock at a store or at home to swap rooms.'); return; } if(UI.swapA==null){ UI.swapA = i; return; } if(UI.swapA===i){ UI.swapA = null; return; }
      const a = UI.swapA; UI.swapA = null; if(!s.rooms[a].sys && !r.sys && !s.rooms[a].fac && !r.fac) return; spend(swapCost(), () => { swapRooms(a, i); toast(`Swapped. ${combosOf(s).length} combo${combosOf(s).length===1 ? '' : 's'} active.`); }); }, 'room:' + i);
    tip(q.x, q.y, q.w, q.h, (r.sys ? (SYSN[r.sys] || r.sys) + (s.systems[r.sys] ? '' : ' (not installed)') : 'Empty room') + (r.fac && typeof FACILITIES!=='undefined' && FACILITIES[r.fac] ? ' · ' + FACILITIES[r.fac].name : ''), here ? (UI.swapA==null ? 'Tap to pick this room, then tap another to swap.' : 'Tap to swap with the picked room.') : 'Swaps only at a store or at home.'); });
  if(UI.swapA!=null && s.rooms[UI.swapA]){ const r = s.rooms[UI.swapA]; T(`Picked: ${r.sys && s.systems[r.sys] ? SYSN[r.sys] || r.sys : r.sys ? 'empty room (kept for ' + (SYSN[r.sys] || r.sys) + ')' : r.fac && typeof FACILITIES!=='undefined' ? FACILITIES[r.fac].name : 'empty room'}. Tap another room to swap with it.`, cx, y0+452, { s:16, c:C.amber, max:LW });
    if(typeof drawFacilityPicker==='function') drawFacilityPicker(s, UI.swapA, cx, y0+468, LW, here); }
  else if(typeof drawFacilityPicker==='function') T(here ? 'Pick an empty room to fit a facility (a lounge, a galley...).' : 'Facilities are fitted at a store or at home.', cx, y0+452, { s:14, c:C.muted, max:LW });
  // the combo list, a page at a time
  const rx = cx + LW + 24, rw = W2 - LW - 24, per = 9, pages = Math.ceil(COMBOS.length / per), pg = clamp(UI.comboPg || 0, 0, pages - 1);
  label(`Room combos · ${act.length} active`, rx, y0+10, C.amber, 'left', 15);
  if(pages > 1){ btn(rx + rw - 104, y0-8, 48, 34, '‹', () => { UI.comboPg = pg - 1; }, { s:14, disabled:pg <= 0 }); btn(rx + rw - 50, y0-8, 48, 34, '›', () => { UI.comboPg = pg + 1; }, { s:14, disabled:pg >= pages - 1 }); }
  const list = COMBOS.slice().sort((a, b) => (act.includes(b) ? 1 : 0) - (act.includes(a) ? 1 : 0)).slice(pg*per, pg*per + per);
  list.forEach((C_, i) => { const y = y0 + 32 + i*58, on = act.includes(C_), has = C_.sys.every(g => g.some(k => roomsFor(s, k).length));
    panel(rx, y, rw, 52, 8); if(on){ rr(rx, y, rw, 52, 8); ctx.strokeStyle = C.good; ctx.lineWidth = 2; ctx.stroke(); }
    T(C_.name, rx+12, y+21, { s:15, f:FD, w:700, c: on ? C.good : has ? C.ink : C.muted }); T(on ? 'ACTIVE' : has ? 'not linked' : 'missing a room', rx+rw-12, y+21, { s:11, a:'right', w:700, c: on ? C.good : C.muted });
    T(`${C_.sys.map(g => g.map(k => comboPartName(k)).join('/')).join(' + ')}: ${C_.text}`, rx+12, y+42, { s:11, c: on ? C.ink : C.muted, max:rw-24 });
    tip(rx, y, rw, 52, C_.name, `${C_.sys.map(g => g.map(k => comboPartName(k)).join(' or ')).join(' next to ')}. ${C_.text} The rooms must share a door, or have a vending machine room between them.`); });
}
function drawWorkshopTab(f, cx, y0){
  const W2 = f.w - 64, ms = machines(), here = atStore();
  label('Workshop machines', cx, y0+10, C.amber, 'left', 15); T(`${ms.length} of 4 · they work while you jump`, cx + 220, y0+12, { s:14, c:C.muted });
  ms.forEach((m, i) => { const M = MACHINES[m.id], x = cx, y = y0 + 26 + i*86, w = W2/2 - 10; panel(x, y, w, 78, 8);
    T(M.name, x+16, y+28, { s:18, f:FD, w:700 }); T(M.text, x+16, y+52, { s:12, c:C.muted, max:w-300 });
    if(m.ready) btn(x+w-200, y+16, 184, 46, 'Collect', () => machineCollect(m), { fill:true, col:C.good, s:16 });
    else if(m.input) T(`${goodsDef(m.input)?.name || m.input}: ${m.left} jump${m.left===1?'':'s'}${M.deep ? ' (deep space)' : ''}`, x+w-16, y+44, { s:14, a:'right', c:C.cyan });
    else { const ok = Object.keys(G.bay || {}).filter(id => G.bay[id] > 0 && goodsDef(id) && M.take(goodsDef(id), id)); if(ok.length){ const id = ok[(UI.wsPick && UI.wsPick[i]) || 0] || ok[0];
        btn(x+w-260, y+16, 40, 46, '‹', () => { UI.wsPick = UI.wsPick || {}; UI.wsPick[i] = ((UI.wsPick[i]||0) + ok.length - 1) % ok.length; }, { s:16 });
        btn(x+w-214, y+16, 198, 46, `Load ${goodsDef(id).name}`, () => machineLoad(m, id), { s:13, col:C.good }); }
      else T('Nothing in the hold it can use', x+w-16, y+44, { s:13, a:'right', c:C.muted }); } });
  if(goodsHave('ballistic_cloth') > 0) btn(cx, y0 + 26 + 4*86, W2/2 - 10, 50, `Use ballistic cloth: mend all kit (${goodsHave('ballistic_cloth')})`, () => mendAllKit(), { s:15, col:C.good });
  // buy machines
  const bx = cx + W2/2 + 10, bw = W2/2 - 10; label(here ? 'Buy a machine' : 'Machines are sold at stores', bx, y0+10, C.amber, 'left', 15);
  Object.keys(MACHINES).forEach((k, i) => { const M = MACHINES[k], y = y0 + 26 + i*58; panel(bx, y, bw, 52, 6); T(M.name, bx+14, y+22, { s:16, f:FD, w:700 }); T(`${M.jumps} jump${M.jumps>1?'s':''}`, bx+14, y+42, { s:12, c:C.muted });
    btn(bx+bw-170, y+6, 156, 40, `Buy · ${M.cost}`, () => spend(M.cost, () => { machines().push({ id:k, input:null, left:0, ready:false }); }), { s:14, disabled:!here || ms.length >= 4 || G.scrap < M.cost, col:C.good }); });
  drawHavenDeliver(bx, y0 + 26 + 6*58 + 16, bw);
}
function drawHavenDeliver(x, y, w){
  const here = atStore(); label('Haven\'s Rest', x, y+10, '#9fdc7a', 'left', 15); T(here ? 'A freighter can take goods home from here. Full list: store → Trade → Send home.' : 'Send goods home from any store (Trade → Send home).', x + 140, y+12, { s:13, c:C.muted, max:w-140 });
  let row = 0; for(const W_ of HAVEN_WINGS){ if(havenDone(W_.id) || row >= 4) continue;
    const needs = W_.needs.filter(([it, n]) => havenGiven(W_, it) < n && haveForHaven(it) > 0); if(!needs.length) continue;
    const [it, n] = needs[0], yy = y + 24 + row*44; T(`${W_.name}: ${needName(it)} ${havenGiven(W_, it)}/${n}`, x, yy+28, { s:14, max:w-180 });
    btn(x+w-160, yy+6, 160, 38, `Send ${Math.min(n - havenGiven(W_, it), haveForHaven(it))}`, () => havenGive(W_, it, n), { s:14, disabled:!here, col:'#9fdc7a' }); row++; }
  if(!row) T('Nothing in the hold Haven\'s Rest needs right now.', x, y+50, { s:13, c:C.muted });
}
function drawFactionsTab(f, cx, y0){
  const W2 = f.w - 64; label('Faction standing', cx, y0+10, C.amber, 'left', 15); T('They remember what you do. A quarter of it carries into your next run.', cx + 220, y0+12, { s:14, c:C.muted });
  Object.keys(FACTIONS).forEach((k, i) => { const F = FACTIONS[k], t = repTier(k), v = rep(k), x = cx + (i % 2)*(W2/2 + 10), y = y0 + 28 + Math.floor(i/2)*150, w = W2/2 - 10;
    panel(x, y, w, 140, 8); T(F.name, x+18, y+32, { s:20, f:FD, w:700, c:F.col }); T(t[1], x+w-18, y+32, { s:18, a:'right', w:700, c:t[2] });
    const bx = x+18, bw2 = w-36; rr(bx, y+48, bw2, 12, 6); ctx.fillStyle = '#141b31'; ctx.fill(); const mid = bx + bw2/2; ctx.fillStyle = v >= 0 ? C.good : C.hostile; ctx.fillRect(Math.min(mid, mid + bw2/2*v/100), y+48, Math.abs(bw2/2*v/100), 12); ctx.fillStyle = C.muted; ctx.fillRect(mid-1, y+46, 2, 16);
    T(`Likes: ${F.likes}`, x+18, y+84, { s:13, max:w-36 }); T(`Hates: ${F.hates}`, x+18, y+104, { s:13, c:C.muted, max:w-36 });
    T({ Despised:'Their ships come in hot. Their stores charge 40% more.', Disliked:'Their stores charge 20% more.', Neutral:'Normal prices.', Favoured:'10% off at their stores. Their ships may let you pass.', Revered:'18% off. Their ships let you pass, and in their space allies join your fights.' }[t[1]], x+18, y+126, { s:12, c:t[2], max:w-36 }); });
}
function drawHaven(){
  const H_ = haven(); T('Haven\'s Rest', 60, 122, { s:50, f:FD, w:700, c:'#9fdc7a' });
  label(`Restored ${HAVEN_WINGS.filter(w => havenDone(w.id)).length} of ${HAVEN_WINGS.length} wings · renown to spend ${fmtNum(renownFree())}`, 62, 152, C.muted, 'left', 16);
  if(typeof drawStation==='function') drawStation(1380, 110, 92);
  if(typeof openWiki==='function') btn(900, 100, 300, 50, '? How it works', () => openWiki('g_haven_restore', 'haven'), { s:16, col:C.cyan });
  para('How to restore a wing: in any run, collect the goods it needs (grow, cook, fish, brew in the workshop or buy at stores), then at any store open Trade → Send home. What you send is kept for good. Or rebuild a wing with renown (your rank stays). Tap a good to see where to find it.', 62, 180, 1200, { s:15, lh:20, c:C.ink, max:3 });
  HAVEN_WINGS.forEach((w, i) => { const x = 60 + (i % 2)*740, y = 236 + Math.floor(i/2)*150, done = havenDone(w.id); panel(x, y, 720, 140, 10);
    if(done){ rr(x, y, 720, 140, 10); ctx.strokeStyle = '#9fdc7a'; ctx.lineWidth = 2; ctx.stroke(); }
    T(w.name, x+20, y+34, { s:22, f:FD, w:700, c: done ? '#9fdc7a' : C.ink }); T(done ? 'RESTORED' : w.bundle, x+700, y+34, { s:15, a:'right', c: done ? '#9fdc7a' : C.amber, w:700 });
    if(done) T(w.needs.map(([it, n]) => `${needName(it)} ${n}/${n}`).join(' · '), x+20, y+64, { s:14, c:C.muted, max:680 });
    else { UI._hvWrap = false; let nx = x+20, ny = y+64; for(const [it, n] of w.needs){ const gv = Math.min(n, havenGiven(w, it)), src = havenSrc(it), t = `${needName(it)} ${gv}/${n} (${src.tag})`;
      T('', 0, -99, { s:14 }); const tw = ctx.measureText(t).width; if(nx + tw > x + (ny > y+64 ? 490 : 700)){ nx = x+20; ny += 22; UI._hvWrap = true; }
      T(t, nx, ny, { s:14, c: gv >= n ? '#9fdc7a' : C.ink }); tip(nx, ny-18, tw, 26, needName(it), src.long); nx += tw + 18; } }
    const wrapped = !done && UI._hvWrap; para(w.reward, x+20, wrapped ? y+110 : y+88, done ? 680 : 460, { s:13, lh:18, c:C.muted, max: wrapped ? 1 : 2 });
    if(!done) btn(x+500, y+80, 200, 44, `Renown · ${fmtNum(w.renown)}`, () => havenBuy(w), { s:14, disabled:renownFree() < w.renown }); });
  const res = H_.residents || []; label('Residents', 840, 856, '#9fdc7a', 'left', 15);
  para(res.length ? `${res.join(', ')}. They fly with you against the Flaggship in every run (up to four).` : 'Nobody yet. Win a story with its best ending, and whoever you saved will move in, and fly with you against the Flaggship.', 840, 880, 680, { s:14, lh:20, c:C.ink });
  if(!H_.leased){ btn(300, 870, 420, 64, UI.leaseAsk ? 'Sure? Rent every run, no residents' : 'Lease it to Madame Ossery', () => { if(!UI.leaseAsk){ UI.leaseAsk = true; return; } UI.leaseAsk = false; havenLease(); }, { s:16, col:C.hostile });
    tip(300, 870, 420, 64, 'Madame Ossery\'s lease', 'Every wing restored overnight. But Ossery takes 50 scrap at the start of every run and 15 every time you dock, and no ally will move into a station she owns.'); }
  else T('Leased to Madame Ossery: 50 scrap rent every run, 15 to dock.', 300, 908, { s:15, c:C.hostile });
  btn(60, 870, 200, 64, 'Back', () => { UI.screen = 'title'; UI.leaseAsk = false; });
}

/* ---------------- crossbreeding: two different crops side by side ---------------- */
function crossBreed(i, sd){ const gd = garden(); const nb = [gd.plots[i-1], gd.plots[i+1]].filter(p => p && SEEDS[p.seed] && SEEDS[p.seed].crop!==sd.crop && !SEEDS[p.seed].only);
  if(!nb.length || sd.only || Math.random() > .25) return; const k = pick(['frostfire','solar_vine']); G.seeds = G.seeds || {}; G.seeds[k] = (G.seeds[k]||0) + 1;
  toast(`Crossbred! The ${sd.name.toLowerCase()} and the ${SEEDS[nb[0].seed].name.toLowerCase()} next to it left a hybrid seed: ${SEEDS[k].name}.`); }
if(typeof SEEDS!=='undefined') Object.assign(SEEDS, {
  frostfire:  { name:'Frostfire root', crop:'frostfire_root', grow:4, yield:[2,3], cost:20, only:true },
  solar_vine: { name:'Solar vine',     crop:'solar_grape',   grow:5, yield:[2,4], cost:24, only:true }
});

/* ---------------- Haven's Rest residents: the people your stories saved ---------------- */
const BEST_ENDINGS = { pip:['trusted','free'], vance:['vance_loyal'], flotilla:['fl_reborn','fl_few'], harte:['harte_wing','harte_rivals'] };
function havenResident(ek){ if(!G || !havenPerksOn() || haven().leased || !G.arc || !ARCS[G.arc]) return; const A = ARCS[G.arc], best = BEST_ENDINGS[G.arc] || (A.medal ? [A.medal] : []);
  if(!best.includes(ek)) return; const H_ = haven(); H_.residents = H_.residents || []; if(H_.residents.includes(A.who)) return; H_.residents.push(A.who); saveProfile(); toast(`${A.who} has moved into Haven's Rest, and will fly with you against the Flaggship in future runs.`); }
function havenResidentsHelp(e){ const R_ = (PROFILE.haven && PROFILE.haven.residents) || []; if(!R_.length || !havenPerksOn()) return; const n = Math.min(4, R_.length);
  e.hull = Math.max(6, e.hull - 2*n); if(e.systems.shields) ionize(e, 'shields', n); toast(`From Haven's Rest: ${R_.slice(-n).join(', ')} ${n>1 ? 'arrive' : 'arrives'} to help. The Flaggship takes ${2*n} damage before you fire.`); }

/* ======================= content ======================= */
Object.assign(BASE.goods, {
  preserves:      { name:'Star preserves',  base:26,  kind:'trade', from:[], want:['civilian','laststand','mantlis','pebblekin'], desc:'Jars of jam, pickles and chutney from your own garden. Never spoils.' },
  fruit_wine:     { name:'Fruit wine',      base:46,  kind:'trade', from:[], want:['pyrate','voltan','mantlis','civilian'], desc:'Brewed in your hold from berries, melons and blooms. Surprisingly good.' },
  vintage_wine:   { name:'Void vintage',    base:150, kind:'curio', from:[], want:['glass','voltan','rebuff','sloog'], desc:'Aged in zero gravity across a dozen star systems. Collectors weep.' },
  ballistic_cloth:{ name:'Ballistic cloth', base:38,  kind:'trade', from:[], want:['mantlis','pebblekin','rebuff'], desc:'Woven from silk or chitin. Stops a knife. Mends armour.' },
  frostfire_root: { name:'Frostfire root',  base:34,  kind:'crop',  from:[], want:['mantlis','voltan','glass'], desc:'A hybrid: ice-blue skin, a core hot enough to light a pipe. Grown from crossed seeds.' },
  solar_grape:    { name:'Solar grapes',    base:30,  kind:'crop',  from:[], want:['voltan','pyrate','civilian'], desc:'A hybrid vine that glows in the dark. Makes a famous wine.' },
  epic_poem:      { name:'An epic poem',    base:36,  kind:'curio', from:[], want:['glass','sloog','voltan'], desc:'Forty pages, in your crew\'s handwriting, about your ship. Mostly flattering.' }
});
Object.assign(BASE.augments, {
  keepsake:{ name:'Crew keepsake', cost:0, noLoot:true, desc:'Made by hand by a devoted crew member. Everyone works a little harder for it: +5% repairs and fighting, +2% evasion.', fx:{ repair:.05, dps:.05, evade:2 } }
});
Object.assign(BASE.enemies, {
  revenant_wreck:{ name:'Revenant wreck', eventOnly:true, revenant:true, tags:['auto'], hull:14, sectors:[1,9], style:'stealth', systems:{ shields:2, engines:1, weapons:5, oxygen:1, piloting:1, doors:1 }, weapons:['basic'], crew:['human','human','human'] }
});
Object.assign(BASE.events, {
  m_heart6:{ moment:true, questOnly:true, star:'any', once:false, pack:'living', text:'{crew} finds you alone on the bridge. "Can I ask a favour, captain? My sister runs a little outpost a jump off our route. I left something with her, years ago. I\'d like to get it back."', choices:[
    { text:'Of course. We\'ll swing by.', req:{ fuel:2 }, cost:{ fuel:1 }, effect:{ text:'The outpost is tiny, the sister is delighted, and the lockbox holds {crew}\'s savings and a very old, very good gun. {crew} insists the ship has it.', weapon:'random', scrap:30, starHearts:50 } },
    { text:'Not now. Maybe after the war.', effect:{ text:'{crew} nods. "After the war, then." They hold you to it.', starHearts:10 } } ] },
  m_keepsake:{ moment:true, questOnly:true, star:'any', once:false, pack:'living', text:'{crew} has been working on something in secret for days. It turns out to be a keepsake for the ship: something handmade, a bit lopsided, and lovely. "So we all remember who we are," {crew} says.', choices:[
    { text:'Hang it on the bridge.', effect:{ text:'Everyone touches it on the way past, for luck. It seems to work.', augment:'keepsake', crewHeal:20 } } ] },
  repfriend:{ hail:'repfriend', pack:'living', title:'Friends', art:'ship', text:'The {enemy} hails you, and its captain smiles. "We know your ship. Any friend of ours can pass in peace."', choices:[
    { text:'Pass in peace.', effect:{ text:'You trade waves and go your separate ways.', dismiss:true } },
    { text:'Trade news.', effect:{ text:'They tell you what they\'ve seen in this sector. It\'s a lot.', reveal:true, dismiss:true } },
    { text:'Attack them anyway.', effect:{ text:'Their captain looks hurt, then furious. Word will spread.', rep:{ enemy:-25 }, begin:true } } ] },
  rephate:{ hail:'rephate', pack:'living', title:'A grudge', art:'ship', text:'"We know that ship." The {enemy} comes in with every gun already charged. They are not here to talk.', choices:[
    { text:'Fight.', effect:{ begin:true, primeWeapons:false } },
    { text:'Offer reparations.', req:{ scrap:60 }, cost:{ scrap:60 }, effect:{ text:'They take the scrap, and some of the anger with it.', rep:{ enemy:20 }, dismiss:true } } ] },
  rep_temple:{ pack:'living', once:true, minSector:1, tags:['voltan'], weight:1.2, title:'A Voltan temple', art:'station', text:'A quiet temple station, all soft light. The monks ask nothing. A donation bowl glows by the door.', choices:[
    { text:'Donate 30 scrap.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'The monks bow. Word travels fast among Voltans.', rep:{ voltan:20 }, crewHeal:30 } },
    { text:'{who} sits with the monks.', req:{ race:'voltan' }, effect:{ text:'{who} meditates with the monks for a day. They remember your ship kindly.', rep:{ voltan:15 }, xp:{ skill:'shields', amt:15 } } },
    { text:'Walk on by.', effect:{ text:'The light follows you out, without judgement.' } } ] },
  rep_arena:{ pack:'living', once:true, minSector:2, tags:['mantlis'], weight:1.2, title:'The blood arena', art:'station', text:'A Mantlis arena ship. Crowds of clicking spectators. "Send a champion!" the herald roars. "Win, and the Hives will know your name."', choices:[
    { text:'Send your best fighter.', chance:.5, success:{ text:'{crew} wins to a roar that shakes the hull. The Hives will remember.', rep:{ mantlis:25 }, scrap:40 }, fail:{ text:'{crew} loses, bloodily, but stands up again. The Mantlis respect that a little.', rep:{ mantlis:8 }, crewHurt:25 } },
    { text:'{who} fights for the honour of the Hive.', req:{ race:'mantlis' }, effect:{ text:'{who} wins in nine seconds. The crowd goes wild.', rep:{ mantlis:30 }, scrap:50 } },
    { text:'Decline.', effect:{ text:'The herald hisses. "Cowards." The crowd agrees.', rep:{ mantlis:-10 } } } ] },
  rep_loan:{ pack:'living', once:true, minSector:2, tags:['sloog'], weight:1.1, title:'A Sloog banker', art:'station', text:'A Sloog banker in a glistening waistcoat offers you a loan. "Eighty scrap now. One hundred and twenty later. The Consortium adores a client in debt."', choices:[
    { text:'Take the loan.', effect:{ text:'The scrap is yours. The Consortium is delighted with you.', scrap:80, rep:{ sloog:15 }, later:{ event:'rep_loan_due', jumps:6 } } },
    { text:'No thank you.', effect:{ text:'"Pity." The banker oozes away.' } } ] },
  rep_loan_due:{ pack:'living', questOnly:true, title:'The Consortium calls', art:'station', text:'The Sloog banker is back, waistcoat glistening. "Repayment time. One hundred and twenty."', choices:[
    { text:'Pay up.', req:{ scrap:120 }, cost:{ scrap:120 }, effect:{ text:'"A pleasure doing business." The Consortium will lend to you any time.', rep:{ sloog:20 } } },
    { text:'Pay what you can, and promise the rest.', effect:{ text:'The banker takes everything you have and sighs wetly.', scrap:-60, rep:{ sloog:-10 } } },
    { text:'Refuse.', effect:{ text:'The banker writes your name in a little book. Every Sloog will read it.', rep:{ sloog:-40 } } } ] },
  rep_derelict:{ pack:'living', once:true, minSector:1, tags:['enjinn'], weight:1.2, title:'A broken Enjinn drone', art:'wreck', text:'An Enjinn survey drone, adrift and blinking sadly. Its fuel cell is cracked. It would be easy to strip.', choices:[
    { text:'Fix it with two drone parts.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'The drone chirps, spins and zooms home to tell everyone about you.', rep:{ enjinn:20 } } },
    { text:'Strip it for parts.', effect:{ text:'Useful bits. The Collective will hear about this.', parts:3, rep:{ enjinn:-15 } } },
    { text:'{who} talks it home.', req:{ race:'enjinn' }, effect:{ text:'{who} and the drone chatter for an hour. It flies home on its own, singing.', rep:{ enjinn:15 }, xp:{ skill:'repair', amt:10 } } } ] },
  rep_payroll:{ pack:'living', once:true, minSector:2, tags:['pyrate','rebuff'], weight:1, title:'A Rebuff payroll barge', art:'ship', text:'A fat Rebuff payroll barge, lightly escorted. A pyrate on an open channel whispers: "Hit it, and every pyrate from here to the rim will drink to your name."', choices:[
    { text:'Hit the barge.', effect:{ text:'The escort turns to fight.', fight:'rebuff_cutter', afterWin:{ text:'The payroll is yours. Pyrates everywhere raise a glass.', scrap:70, rep:{ pyrate:25 } } } },
    { text:'Report the pyrate instead.', effect:{ text:'The barge captain thanks you. The pyrate doesn\'t.', scrap:15, rep:{ pyrate:-15 } } },
    { text:'Fly on.', effect:{ text:'Not your fight.' } } ] },
  rep_quarry:{ pack:'living', once:true, minSector:1, tags:['pebblekin'], weight:1.1, title:'A quarry in trouble', art:'asteroid', text:'A Pebblekin mining crew is trapped under a rockslide on a moonlet. They have air for a day.', choices:[
    { text:'Dig them out.', effect:{ text:'Hot, slow work. The Pebblekin rumble their thanks and load your hold with geodes.', crewHurt:10, goods:{ pebble_geode:2 }, rep:{ pebblekin:20 } } },
    { text:'{who} lifts the rocks alone.', req:{ race:'pebblekin' }, effect:{ text:'{who} simply picks up the rockslide and puts it somewhere else.', goods:{ pebble_geode:3 }, rep:{ pebblekin:25 } } },
    { text:'Leave them to it.', effect:{ text:'Pebblekin are tough. Probably.', rep:{ pebblekin:-8 } } } ] },
  old_wreck:{ pack:'living', questOnly:true, title:'A familiar wreck', art:'wreck', text:'Sensors find a wreck, and the whole bridge goes quiet. It\'s the {wreck}: your old ship, lost in sector {wreckSector} of another run. Its name is still on the hull. Its guns are still in their mounts.', choices:[
    { text:'Salvage her guns.', effect:{ text:'You cut her weapons free. It feels like borrowing from an old friend.', wreckLoot:true, scrap:25 } },
    { text:'Hold a service for {wreckCrew}.', effect:{ text:'The crew stand in silence at the window. Then they tell stories about people they never met, and somehow it helps.', crewHeal:40, cmp:{ hearts:15 }, wreckDone:true } },
    { text:'Search the crew decks.', chance:.5, success:{ text:'Empty, cold and quiet. You find her logs, her spare parts and her guns.', wreckLoot:true, parts:3 }, fail:{ text:'The lights come on. Something is still aboard, and it is wearing your old crew\'s faces.', fight:'revenant_wreck', afterWin:{ text:'Whatever it was, it\'s gone. Your old guns are yours again.', wreckLoot:true, scrap:60 } } } ] }
});
ACHIEVEMENTS.push({ id:'haven_all', name:'Home Again', desc:'Restore every wing of Haven\'s Rest.' });
for(const w of HAVEN_WINGS) ACHIEVEMENTS.push({ id:'haven_' + w.id, name:w.name, desc:`Restore ${w.name} at Haven's Rest.` });
