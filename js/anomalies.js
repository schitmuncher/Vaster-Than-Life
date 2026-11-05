'use strict';
/* =========================================================================
   Anomalies: things that bend the rules of a run, so it stops being polite.
   - Ship scars: permanent damage an event or a disaster leaves behind. A room
     that leaks air, a system jammed one bar short, wiring that sparks into
     fires, or a system locked out until you fix the cause. Patch them at a
     store's dockyard (Supplies), or with the right crew in an event.
   - Anomalies: multi-sector situations that change how the game plays while
     they last (a fungus in the vents, a rogue escort AI, a crystal growing
     through the reactor, the Pyrate King's Black Mark, pacifist pilgrims,
     a time fracture). Each one is a ticking clock with a climax.
   - Trade-off augments: big strengths with real weaknesses.
   - Elite "relentless" enemies that suffocate, pin and drain, and never
     give up and leave.
   - Crew bonds in the same room: friends work better, rivals fight harder
     and argue over the wrench.
   - Pets that change with what you feed them.
   - Event "twist": an event can be one of several versions, picked per run,
     so the same encounter can't be solved from memory.
   New effect keys (events and mods): scar, unscar, downgrade, convert, anom,
   petEvo, eatGoods. New event key: twist (list of event ids). Events can also
   have a "req" of their own (only offered when it is met).
   ========================================================================= */

/* ---------------- ship scars ---------------- */
const SCAR_KINDS = {
  leaky:  { name:'Leaky hull',      icon:'≋', col:'#5fd3e6', text:'Loses air all the time, almost like an open breach.' },
  jammed: { name:'Jammed system',   icon:'⛓', col:'#ffb547', text:'One bar of power can never be used.' },
  sparky: { name:'Sparking wiring', icon:'ϟ', col:'#ff8a3d', text:'Any hit here may start a fire.' },
  locked: { name:'Locked out',      icon:'⊘', col:'#ff5a7a', text:'The system is offline until the cause is dealt with.' }
};
function scars(){ return (G && G.scars) || []; }
function scarRoom(sh, sc){ if(sc.sys) return roomOf(sh, sc.sys); return sc.room!=null ? sc.room : -1; }
/* add a scar: 'random', a kind name, or { kind, sys, why, need } */
function addScar(spec){
  if(!G || !G.ship) return null; const sh = G.ship; G.scars = G.scars || [];
  let o = typeof spec==='string' ? { kind:spec } : Object.assign({}, spec || {});
  if(!o.kind || o.kind==='random' || !SCAR_KINDS[o.kind]) o.kind = pick(['leaky','jammed','sparky']);
  const sysList = Object.keys(sh.systems).filter(k => roomOf(sh, k) >= 0 && !G.scars.some(s => s.sys===k && s.kind===o.kind));
  if(o.kind==='leaky' && !o.sys && o.room==null){ const rooms = sh.rooms.map((r, i) => i).filter(i => !G.scars.some(s => scarRoom(sh, s)===i && s.kind==='leaky')); if(!rooms.length) return null; o.room = pick(rooms); }
  else if(!o.sys && o.room==null){ if(!sysList.length) return null; { const ok = sysList.filter(k => o.kind!=='jammed' || (sh.systems[k].max >= 2 && !(k==='shields' && sh.systems[k].max < 4))); o.sys = pick(ok.length ? ok : sysList); } }
  if(o.sys==='random') o.sys = sysList.length ? pick(sysList) : null;
  if(o.sys && !sh.systems[o.sys]) return null;
  G.scars.push(o); return o;
}
function scarName(sc){ const K = SCAR_KINDS[sc.kind]; const sh = G.ship, ri = scarRoom(sh, sc), r = sh.rooms[ri];
  return `${K.name}${sc.sys ? ' (' + (SYSN[sc.sys] || sc.sys) + ')' : r && r.sys ? ' (' + (SYSN[r.sys] || r.sys) + ' room)' : ''}`; }
function scarCap(sh, k){
  if(!G || sh!==G.ship) return 99; let cap = 99;
  for(const sc of scars()) if(sc.sys===k){ if(sc.kind==='locked') return 0; if(sc.kind==='jammed') cap = Math.min(cap, Math.max(0, sh.systems[k].max - 1)); }
  if(k==='engines' && G.anom && G.anom.crystal) cap = Math.min(cap, 2);   // the crystal grips the engines
  return cap; }
function scarHit(sh, ri){ if(!G || sh!==G.ship) return; if(scars().some(sc => sc.kind==='sparky' && scarRoom(sh, sc)===ri) && Math.random() < .35){ igniteRoom(sh, ri); fxAtRoom(sh, ri, 'text', 'SPARKS'); } }
function scarText(sh, i){ if(!G || sh!==G.ship) return ''; const l = scars().filter(sc => scarRoom(sh, sc)===i); return l.map(sc => `${SCAR_KINDS[sc.kind].name}: ${SCAR_KINDS[sc.kind].text}${sc.why ? ' ' + sc.why : ''}`).join(' '); }
function drawScar(sh, i, q, cell){ if(!G || sh!==G.ship) return; const l = scars().filter(sc => scarRoom(sh, sc)===i); if(!l.length) return;
  l.forEach((sc, k) => { const K = SCAR_KINDS[sc.kind], x = q.x + 13 + k*22, y = q.y + q.h - 13;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = 'rgba(10,14,24,.9)'; ctx.fill(); ctx.strokeStyle = K.col; ctx.lineWidth = 2; ctx.stroke();
    T(K.icon, x, y + 1, { s:12, a:'center', b:'middle', c:K.col, w:700 }); }); }
function scarPrice(sc, st){ const base = 22 + 6*(G.sector||1) + (sc.kind==='locked' ? 25 : 0); return Math.round(base * (st && st.kind==='enjinn' ? .6 : 1)); }
function scarNeedText(n){ return n && n.goodsKind ? `a ${n.goodsKind} from the hold` : ''; }
function hasGoodsKind(kind){ return Object.keys(G.bay || {}).some(id => (G.bay[id]||0) > 0 && typeof goodsDef==='function' && goodsDef(id) && goodsDef(id).kind===kind); }
function eatGoodsKind(kind){ const id = Object.keys(G.bay || {}).find(id => (G.bay[id]||0) > 0 && typeof goodsDef==='function' && goodsDef(id) && goodsDef(id).kind===kind); if(!id) return null; const n = goodsDef(id).name; G.bay[id]--; if(G.bay[id] <= 0) delete G.bay[id]; return n; }
/* the dockyard row in a store's Supplies tab */
function scarStoreRow(st, price){
  const l = scars(); if(!l.length) return null; const sc = l[0];
  if(sc.need && sc.need.goodsKind) return [`Fix: ${scarName(sc)}`, `${l.length} scar${l.length>1 ? 's' : ''} aboard. This one needs ${scarNeedText(sc.need)}${sc.why ? '. ' + sc.why : ''}.`, 0, () => { const n = eatGoodsKind(sc.need.goodsKind); if(n){ G.scars.shift(); toast(`${n} handed over. ${scarName(sc)} fixed.`); } }, !hasGoodsKind(sc.need.goodsKind)];
  return [`Dockyard: ${scarName(sc)}`, `${l.length} scar${l.length>1 ? 's' : ''} aboard. ${SCAR_KINDS[sc.kind].text}${st && st.kind==='enjinn' ? ' Enjinn rates.' : ''}`, price(scarPrice(sc, st), st, 'repair'), () => { G.scars.shift(); toast(`${scarName(sc)} patched.`); }, false];
}

/* ---------------- effects ---------------- */
function convertCrew(c, race){ const R_ = DATA.races[race]; if(!c || !R_) return; const frac = c.hp / (c.maxHp || 100); c.race = race; c.maxHp = R_.hp || 100; c.hp = Math.max(1, Math.round(c.maxHp * frac)); c.look = null; }
function anomEffect(e, L){
  if(!e || !G) return; const s = G.ship;
  if(e.scar){ for(const sp of [].concat(e.scar)){ const sc = addScar(sp); if(sc) L.push(`New scar: ${scarName(sc)}`); } }
  if(e.unscar && scars().length){ const n = e.unscar==='all' ? G.scars.length : typeof e.unscar==='number' ? e.unscar : 1;
    for(let i = 0; i < n && G.scars.length; i++){ const k = typeof e.unscar==='string' && SCAR_KINDS[e.unscar] ? G.scars.findIndex(x => x.kind===e.unscar) : 0; if(k < 0) break; const sc = G.scars.splice(k, 1)[0]; L.push(`${scarName(sc)} fixed`); } }
  if(e.downgrade){ const k = e.downgrade==='random' ? pick(Object.keys(s.systems).filter(x => s.systems[x].max >= 2)) : e.downgrade; const sy = k && s.systems[k];
    if(sy && sy.max >= 2){ sy.max--; sy.power = Math.min(sy.power, sy.max); L.push(`${SYSN[k] || k} permanently down to level ${sy.max}`); } }
  if(e.convert){ const o = typeof e.convert==='string' ? { race:e.convert } : e.convert; const list = s.crew.filter(c => c.owner==='p' && !c.drone && c.race!==o.race);
    const n = o.all ? list.length : (o.n || 1); for(let i = 0; i < n && list.length; i++){ const c = list.splice(Math.floor(Math.random()*list.length), 1)[0]; convertCrew(c, o.race); L.push(`${c.name} is now ${DATA.races[o.race] ? DATA.races[o.race].name : o.race}`); } }
  if(e.anom){ G.anom = G.anom || {}; for(const k in e.anom){ if(e.anom[k]===null) delete G.anom[k]; else if(typeof e.anom[k]==='object' && typeof G.anom[k]==='object') Object.assign(G.anom[k], e.anom[k]); else G.anom[k] = e.anom[k]; }
    if(e.anom.fracture===true){ G.anom.fracture = { left:4, sector:G.sector, node:G.map.cur, hull:s.hull, crew:Object.fromEntries(s.crew.filter(c => c.owner==='p').map(c => [c.id, c.hp])) }; }
    if('blackmark' in e.anom && !e.anom.blackmark) delete G.anom.blackmark; }
  if(e.petEvo && G.pet && !G.pet.gone){ G.pet.evo = e.petEvo; L.push(`${G.pet.name} is now ${PET_EVO[e.petEvo] ? 'a ' + PET_EVO[e.petEvo].name : 'different'}`); }
  if(e.eatGoods){ const n = eatGoodsKind(e.eatGoods); if(n) L.push(`-1 ${n}`); }
  if(e.loseAugment){ const i = s.augments.indexOf(e.loseAugment); if(i >= 0){ s.augments.splice(i, 1); L.push(`${(DATA.augments[e.loseAugment]||{}).name || e.loseAugment} removed`); } }
  if(e.anom && e.anom.squid) G.anom.squidStart = G._scrap0 ?? G.stats.scrap;   // everything from this moment on was never real
  if(e.undoScrap && G.anom && G.anom.squidStart!=null){ const v = Math.min(G.scrap, Math.max(0, G.stats.scrap - G.anom.squidStart)); G.scrap -= v; delete G.anom.squidStart; delete G.anom.squid; if(v) L.push(`-${v} scrap (it was never real)`); }
}

/* ---------------- the anomalies: what each does while it lasts ---------------- */
const ANOM_INFO = {
  fungus:   { name:'Void fungus', col:'#9be26a', text:a => a.fungus==='merged' ? 'The fungus is part of the ship now: it mends 1 hull a jump and keeps the air sweet, but it glows and the Fleet sees you coming.' : `Stage ${a.fungus} of 3. Mends 1 hull a jump. Glows: the Fleet gains on you.${a.fungus >= 2 ? ' It has smothered the oxygen system, but breathes for you.' : ''}` },
  escort:   { name:'WARDEN-9 escort', col:'#5fd3e6', text:a => `An Enjinn drone carrier flies escort: it fires on every enemy as the fight begins.${a.escort >= 2 ? ' It has started choosing your beacons for you.' : ''}` },
  crystal:  { name:'Crystal song', col:'#b48cff', text:a => `A crystal grows through the reactor: 2 super-shield points at the start of every fight, but engines can't take more than 2 power.${a.crystal==='whole' ? ' The ship sings now.' : ''}` },
  blackmark:{ name:'Black Mark', col:'#ff5a7a', text:() => 'The Pyrate King\'s mark. The Rebuff don\'t chase you any more: Fedoration enforcers do. Lawful stores won\'t trade with you.' },
  pacifist: { name:'Pilgrims aboard', col:'#ffd166', text:a => `Voltan pilgrims lend you their Lattice. Destroying a crewed ship angers them (${(a.pacifist||{}).mad||0} of 2). Peaceful wins: ${(a.pacifist||{}).calm||0} of 3.` },
  fracture: { name:'Time fracture', col:'#9fd6ff', text:a => `If the ship is destroyed in the next ${(a.fracture||{}).left||0} jumps, time snaps back to where it began. Once.` },
  squid:    { name:'Ink', col:'#8a7ab0', text:() => 'Something is not quite right with what everyone is seeing.' }
};
function anomList(){ const a = (G && G.anom) || {}; return Object.keys(ANOM_INFO).filter(k => a[k]); }
/* arriving at a beacon */
function anomArrive(node, first){
  if(!G) return; const a = G.anom || {}, s = G.ship;
  if(a.fungus){ if(s.hull < s.maxHull) s.hull++; G.fleetX += .012; }
  if(hasAug(s, 'blood_reactor')){ for(const c of s.crew) if(c.owner==='p' && !c.drone) c.hp = Math.max(1, c.hp - 6); }
  if(a.escort >= 2 && first && !G.hazard && ['event','combat','empty'].includes(node.type) && Math.random() < .35){ G.hazard = pick(['asteroid','sun','pulsar']); G.hzT = rand(5, 9); toast(`WARDEN-9 "corrected" your course. You've jumped into a ${HAZARDS[G.hazard].toLowerCase()}.`); }
  if(a.fracture){ if(a.fracture.sector!==G.sector){ delete G.anom.fracture; toast('The time fracture closes behind you.'); }
    else if(--a.fracture.left <= 0){ delete G.anom.fracture; G.later.push({ event:'tf_close', jumps:0 }); } }
  if(a.blackmark && sectorDef().final && !a.kingAsked){ a.kingAsked = true; G.later.push({ event:'bm_king', jumps:0 }); }
  if(a.squid && first && a.squid > 0){ if(--a.squid <= 0){ G.later.push({ event:'rd_squid_wake', jumps:0 }); } }
}
/* replacing who you fight */
function anomCombatPick(id, o){
  const a = (G && G.anom) || {};
  if(a.blackmark && o.harder && id==='random'){ o.hail = 'enforcer'; return G.sector >= 4 ? 'enforcer_frigate' : 'enforcer_cutter'; }
  if(a.squid && id==='random' && !o.harder && a.squidFoe && DATA.enemies[a.squidFoe]) return a.squidFoe;   // the ink: you fight what you fear
  return null; }
function anomCombatStart(e, def, o){
  if(!G || !e) return; const a = G.anom || {}, s = G.ship;
  e.relentless = !!def.relentless;
  if(a.crystal) s.super = Math.max(s.super || 0, a.crystal==='whole' ? 3 : 2);
  if(a.escort){ e.hull = Math.max(1, e.hull - 2); const ks = Object.keys(e.systems).filter(k => k!=='piloting'); if(ks.length) damageSystem(e, pick(ks), 1); toast('WARDEN-9 opens fire as the fight begins.'); }
  if(def.mirror){ e.weapons = s.weapons.map(w => ({ id:w.id, charge:0, on:true, target:null })).slice(0, 4); e.systems.weapons.max = Math.max(e.systems.weapons.max, s.weapons.reduce((t, w) => t + (DATA.weapons[w.id]?.power||1), 0)); e.systems.weapons.power = e.systems.weapons.max; }
  if(def.boss && a.kingHelp){ e.hull = Math.max(4, e.hull - 8); if(e.systems.weapons) ionize(e, 'weapons', 3); toast('The Pyrate King\'s galleon rakes the Flaggship\'s flank before your guns are even warm.'); }
  if(def.boss && a.pacifist && (a.pacifist.calm||0) >= 3) s.super = Math.max(s.super || 0, 6);
}
/* after a fight */
function anomCombatEnd(kind, e, L){
  if(!G || !e) return; const a = G.anom || {}, s = G.ship;
  if(a.pacifist && !e.auto && !e.boss){ const P = a.pacifist;
    if(kind==='destroyed'){ P.mad = (P.mad||0) + 1;
      if(P.mad >= 2){ delete G.anom.pacifist; s.augments = s.augments.filter(x => x!=='still_lattice'); s.reactor = Math.max(1, s.reactor - 1); L.push('The pilgrims leave. The Voltan pilgrims file silently into their shuttle, taking the Lattice with them. On the way out, one of them pulls a reactor coupling. "So that you remember," she says. (-1 reactor, the Lattice is gone)'); }
      else { s.reactor = Math.max(1, s.reactor - 1); L.push('The pilgrims protest. The Voltan pilgrims watched that ship die. In the night they sit down in the reactor room and will not move. You lose 1 reactor bar until they forgive you. Ion them, board them, make them surrender. Don\'t kill them.'); } }
    else if(kind==='crew' || kind==='surrender'){ P.calm = (P.calm||0) + 1; if(P.calm===3) G.later.push({ event:'pp_bless', jumps:0 }); toast(`The pilgrims nod. (${P.calm} peaceful win${P.calm>1 ? 's' : ''})`); } }
  if(G.pet && !G.pet.gone && G.pet.evo==='armoured' && s.hull < s.maxHull && kind!=='fled'){ s.hull++; L.push(`${G.pet.name} welds a plate over the worst dent: +1 hull`); }
}
/* every frame of play */
function anomTick(dt){
  if(!G || !G.ship || G.paused) return; const s = G.ship, a = G.anom || {};
  for(const sc of scars()) if(sc.kind==='leaky'){ const r = s.rooms[scarRoom(s, sc)]; if(r) r.o2 = Math.max(0, r.o2 - dt*6); }
  if(a.fungus >= 2 || a.fungus==='merged') for(const r of s.rooms) if(r.o2 < 55 && r.breach===0) r.o2 = Math.min(55, r.o2 + dt*6);
  const P = typeof petHere==='function' ? petHere() : null;
  if(P && P.evo){ P.evoT = (P.evoT||0) + dt; const r = s.rooms[P.room];
    if(P.evo==='ballistic' && G.enemy && !G.enemy.dead && P.evoT > 18){ P.evoT = 0; const e = G.enemy, ri = Math.floor(Math.random()*e.rooms.length); hitRoom(e, ri, { type:'laser', damage:1 }, { by:'p' }); fxAtRoom(s, P.room, 'text', 'PTOO!'); }
    if(P.evo==='fixer' && r && r.sys && s.systems[r.sys] && s.systems[r.sys].dmg > 0 && P.evoT > 7){ P.evoT = 0; s.systems[r.sys].dmg--; fxAtRoom(s, P.room, 'text', 'FIXED'); }
    if(P.evo==='gourmet') for(const c of s.crew) if(c.room===P.room && c.owner==='p' && !c.drone && c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + 1.5*dt); }
}
/* the one-time rescue of a time fracture */
function anomRescue(){
  const F = G && G.anom && G.anom.fracture; if(!F || F.sector!==G.sector) return false; const s = G.ship;
  delete G.anom.fracture; if(G.enemy) leaveCombat(); G.enemy = null; G.modal = null;
  s.hull = Math.max(4, F.hull); for(const c of s.crew) if(F.crew[c.id]!=null) c.hp = Math.max(c.hp, F.crew[c.id]);
  for(const r of s.rooms){ r.fire = 0; r.breach = 0; r.o2 = 100; } for(const k in s.systems) s.systems[k].dmg = 0;
  G.map.cur = F.node; for(const n of G.map.nodes) n.revealed = true; G.anom.adapt = (G.anom.adapt||0) + 1;
  G.modal = { type:'msg', title:'Time snaps back', text:'The ship comes apart around you. Then it doesn\'t. You are back at the fracture, hull whole, every beacon in this sector already in your memory. Somewhere out there, the enemies remember too: they will be readier next time.' };
  sfx('jump'); return true; }
/* Black Mark: lawful stores close their shutters */
function anomStoreBlock(node){
  if(!(G.anom && G.anom.blackmark)) return false; const kind = STORE_KINDS && STORE_KINDS[G.sectorType] ? G.sectorType : 'civilian';
  if(!['civilian','rebuff','laststand'].includes(kind)) return false;
  G.modal = { type:'msg', title:'Shutters down', text:'The dockmaster takes one look at the Black Mark on your hull and closes every shutter on the station. Somebody is already calling the enforcers. Pyrate black markets and smugglers will still trade with you.' }; return true; }

/* ---------------- crew bonds in the same room ---------------- */
function bondMult(c, kind){
  const fever = 1;   // cabin fever no longer slows anyone (havenvisit.js)
  if(!c || !c.bond || c.drone) return fever; const o = typeof crewById==='function' ? crewById(c.bond.id) : null; if(!o || o.room!==c.room || o.hp <= 0 || o.owner!==c.owner) return fever;
  if(c.bond.kind==='rivals') return (kind==='dps' ? 1.25 : .6) * (kind==='rep' && G && G.anom && G.anom.fever ? .9 : 1);   // showing off in a fight, arguing over the wrench
  return 1.15 * fever; }

/* ---------------- pets that change with their food ---------------- */
const PET_EVO = {
  fixer:    { name:'fixer', text:'Repairs damaged systems in whatever room it is in.' },
  ballistic:{ name:'ballistic beast', text:'Every so often in a fight it spits something hard at the enemy ship (1 damage).' },
  armoured: { name:'armour-plated beast', text:'After every fight it welds 1 hull back on.' },
  gourmet:  { name:'gourmet', text:'Crew in its room heal steadily.' }
};

/* ---------------- event twists: one of several versions, picked per run ---------------- */
function twistOf(id){ const ev = DATA.events[id]; if(!ev || !Array.isArray(ev.twist) || !ev.twist.length || !G) return id;
  G.twists = G.twists || {}; if(!G.twists[id]){ const l = ev.twist.filter(k => DATA.events[k]); if(!l.length) return id; G.twists[id] = l[hashStr(String(G.seed||'') + '|tw|' + id) % l.length]; }
  return G.twists[id]; }

/* ---------------- the HUD: what is bending your run ---------------- */
function drawAnomChips(x, y){
  if(!G || UI.screen!=='game') return; const l = anomList(), sc = scars(); let cx = x;
  for(const k of l){ const I = ANOM_INFO[k], nm = I.label ? I.label(G.anom) : I.name, w = Math.min(230, 26 + nm.length*8.5);
    rr(cx, y, w, 26, 13); ctx.fillStyle = hexA(I.col, .16); ctx.fill(); ctx.strokeStyle = I.col; ctx.lineWidth = 1.5; ctx.stroke();
    T(nm, cx + w/2, y + 18, { s:13, a:'center', c:I.col, w:700, max:w-12 }); tip(cx, y, w, 26, I.name, I.text(G.anom)); cx += w + 8; }
  if(sc.length){ const w = 98; rr(cx, y, w, 26, 13); ctx.fillStyle = 'rgba(255,138,61,.14)'; ctx.fill(); ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 1.5; ctx.stroke();
    T(`${sc.length} scar${sc.length>1 ? 's' : ''}`, cx + w/2, y + 18, { s:13, a:'center', c:'#ff8a3d', w:700 }); tip(cx, y, w, 26, 'Ship scars', sc.map(s => `${scarName(s)}: ${SCAR_KINDS[s.kind].text}`).join(' ') + ' Patch them at a store (Supplies → Dockyard).'); }
}

/* ======================= content ======================= */
Object.assign(BASE.augments, {
  reckless_drive:     { name:'Reckless Overdrive',  cost:70, desc:'Weapons charge 25% faster and crew move 25% faster. Systems break more easily and hits breach the hull 40% more often.', fx:{ charge:.25, speed:.25, sysRes:-.3, breachRes:-.4 } },
  caffeine_line:      { name:'Caffeine Drip-Line',  cost:45, desc:'Crew move 30% faster. Their hands shake: repairs are 20% slower.', fx:{ speed:.3, repair:-.2 } },
  glass_plating:      { name:'Glass-Fibre Plating', cost:60, desc:'+12% evasion. Every hit that lands is 60% more likely to breach.', fx:{ evade:12, breachRes:-.6 } },
  sympathetic_shields:{ name:'Sympathetic Shields', cost:55, desc:'Crew slowly heal anywhere on the ship. The shield harmonics make you easier to hit: -6% evasion.', fx:{ heal:.35, evade:-6 } },
  blood_reactor:      { name:'Blood Reactor',       cost:65, desc:'+3 reactor power. It feeds on the crew: everyone loses 6 health every jump.', fx:{ reactor:3 } },
  scrap_furnace:      { name:'Scrap Furnace',       cost:50, desc:'35% more scrap. It hogs the coolant: weapons charge 12% slower.', fx:{ scrap:.35, charge:-.12 } },
  berserker_loop:     { name:'Berserker Loop',      cost:55, desc:'Crew hit 50% harder hand to hand. They hate fiddly work: repairs 30% slower.', fx:{ dps:.5, repair:-.3 } },
  mirror_hull:        { name:'Mirror Hull',         cost:60, desc:'Shields recharge 35% faster. A shiny ship is easy to see: -8% evasion.', fx:{ shield:.35, evade:-8 } },
  still_lattice:      { name:'Lattice of Stillness',cost:0,  noLoot:true, desc:'Lent by Voltan pilgrims: 4 points of super shield at the start of every fight. They will take it back if you kill.', fx:{ superShield:4 } },
  singing_shard:      { name:'Singing Shard',       cost:80, noLoot:true, desc:'A tame piece of the crystal: 2 points of super shield at the start of every fight.', fx:{ superShield:2 } },
  bloom_heart:        { name:'Heart of the Bloom',  cost:0,  noLoot:true, desc:'The fungus lives in your reactor: 4 points of super shield at the start of every fight.', fx:{ superShield:4 } }
});
Object.assign(BASE.weapons, {
  choke_bomb:  { name:'Choke Bomb',          type:'bomb',  damage:0, charge:13, power:2, cost:55, tier:2, crewDamage:10, gas:true, pin:5, color:'#9be26a', desc:'Rebuff siege ordnance. Sucks the air out of a room and pins the ship so it can\'t dodge.' },
  leech_beam:  { name:'Leech Beam',          type:'beam',  damage:1, rooms:2, charge:16, power:3, cost:65, tier:2, drain:2, color:'#b48cff', desc:'A beam that steals power from every system it crosses.' },
  spore_cannon:{ name:'Spore Cannon',        type:'laser', damage:1, shots:2, charge:11, power:2, cost:60, tier:2, crewDamage:15, fear:true, noLoot:true, color:'#9be26a', desc:'Fires dense balls of void fungus. Crew who get a mouthful panic.' },
  prism_lance: { name:'Prism Lance',         type:'beam',  damage:2, rooms:3, charge:15, power:3, cost:90, tier:3, crit:.2, noLoot:true, color:'#e0c8ff', desc:'Light, bent through living crystal. Long, and it sometimes hits twice as hard.' },
  hardlight_disruptor:{ name:'Hard-Light Disruptor', type:'laser', damage:1, charge:10, power:1, cost:40, tier:2, disrupt:35, color:'#9fd6ff', desc:'Scrambles projected crew: holograms in the room it hits take 35 damage and flicker out for a few seconds.' }
});
Object.assign(BASE.drones, {
  shock_boarder:{ name:'Shock Boarder', kind:'boarding', power:3, cost:70, stun:4, fear:true, desc:'A boarding drone that lands with a stun pulse. Everyone in the room is stunned, and whoever can move runs.' }
});
Object.assign(BASE.enemies, {
  rb_suffocator: { name:'Rebuff Suffocator', tags:['rebuff'], relentless:true, hull:13, sectors:[4,8], style:'rebuff', systems:{ shields:4, engines:3, weapons:4, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['choke_bomb','basic'], crew:['human','human','human'] },
  rb_leech:      { name:'Rebuff Leech Frigate', tags:['rebuff'], relentless:true, hull:12, sectors:[4,8], style:'rebuff', systems:{ shields:4, engines:2, weapons:5, oxygen:1, piloting:1, doors:1 }, weapons:['leech_beam','basic'], crew:['human','human'] },
  pyr_shock:     { name:'Pyrate Shock-Raider', tags:['pyrate'], hull:11, sectors:[3,8], style:'pyrate', systems:{ shields:2, engines:3, weapons:2, drones:3, oxygen:1, piloting:1, doors:1 }, weapons:['basic'], drones:['shock_boarder'], crew:['mantlis','human','mantlis'] },
  auto_strangler:{ name:'Auto-Strangler', tags:['auto'], auto:true, relentless:true, hull:12, sectors:[5,8], style:'auto', systems:{ shields:4, engines:2, weapons:5, piloting:1 }, weapons:['choke_bomb','leech_beam'], crew:[] },
  enforcer_cutter:{ name:'Fedoration Enforcer', eventOnly:true, tags:['enforcer'], hull:11, sectors:[1,9], style:'fed', color:'#5fd3e6', systems:{ shields:4, engines:3, weapons:3, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['ion','basic'], crew:['human','human','human'] },
  enforcer_frigate:{ name:'Fedoration Enforcer Frigate', eventOnly:true, relentless:true, tags:['enforcer'], hull:15, sectors:[1,9], style:'fed', color:'#5fd3e6', systems:{ shields:6, engines:3, weapons:5, teleporter:1, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['heavy1','ion','basic'], crew:['human','human','human','pebblekin'] },
  rogue_warden:  { name:'WARDEN-9 (rogue)', eventOnly:true, auto:true, mirror:true, relentless:true, tags:['auto'], hull:16, sectors:[1,9], style:'hive', systems:{ shields:4, engines:2, weapons:6, drones:3, piloting:1 }, weapons:['basic'], drones:['combat1'], crew:[] },
  crystal_heart: { name:'The Crystal Heart', eventOnly:true, auto:true, tags:['auto'], hull:14, super:3, sectors:[1,9], style:'glass', systems:{ shields:4, engines:1, weapons:4, piloting:1 }, weapons:['ion','pike'], crew:[] }
});

const ANOM_EVENTS = {
  /* --- Void fungus (nebulas) --- */
  vf_spore:{ pack:'anom', nebula:true, once:true, minSector:2, maxSector:5, weight:1.3, title:'A glowing spore', art:'nebula', text:'A spore the size of a fist drifts past the window, glowing a soft green. Where it brushes the hull, a scratch closes up. {crew} has their face pressed to the glass.', choices:[
    { text:'Bring it aboard. It mends things.', effect:{ text:'The spore settles into a vent and starts to grow. By morning the scorch marks in the corridor are gone, and the ship smells faintly of mushrooms.', anom:{ fungus:1 }, later:{ event:'vf_spread', jumps:3 } } },
    { text:'{who} has seen this before.', req:{ race:'sloog' }, effect:{ text:'"Hollow Bloom," says {who}. "It eats ships. Slowly, kindly, completely." {who} seals a sample in a jar instead, and a Sloog emporium will pay well for it.', scrap:40 } },
    { text:'Leave it alone.', effect:{ text:'The spore drifts on. {crew} sulks for an hour.' } } ] },
  vf_spread:{ pack:'anom', questOnly:true, title:'The fungus spreads', art:'ship', text:'The fungus is in every vent now. It has nibbled a spare drone part, wrapped itself round the oxygen pumps and started to glow. The air is fine; better than fine. But the glow can be seen from a long way off.', choices:[
    { text:'Let it grow.', effect:{ text:'The ship hums with something like contentment. The fungus keeps the air sweet by itself now, even when the oxygen system is damaged.', parts:-1, anom:{ fungus:2 }, later:{ event:'vf_bloom', jumps:3 } } },
    { text:'Cut it back with knives and buckets.', effect:{ text:'Hot, horrible work. The crew come out coughing spores, but the fungus is pushed back from the oxygen pumps. It will be back.', crewHurt:10, later:{ event:'vf_bloom', jumps:4 } } },
    { text:'{who} scrapes it off with bare stone hands.', req:{ race:'pebblekin' }, effect:{ text:'The fungus can\'t get a grip on {who}. The pumps stay clear.', parts:-1, later:{ event:'vf_bloom', jumps:4 } } } ] },
  vf_bloom:{ pack:'anom', questOnly:true, title:'The bloom', art:'ship', text:'The fungus has reached the reactor. It pulses in time with it. It is asking, as clearly as anything without a mouth can ask, to be let in.', choices:[
    { text:'Let it in.', effect:{ text:'The reactor goes green. You lose two bars of power for good, and gain something that throws a living shield around the ship at the start of every fight.', reactor:-2, augment:'bloom_heart', anom:{ fungus:'merged' }, unscar:'locked' } },
    { text:'Burn it out with the fire suppression reversed.', effect:{ text:'Fire everywhere, on purpose. When it\'s over the fungus is ash, the wiring is ruined and the crew are singed. In the ash of the reactor room: a seed pod that fires like a gun.', fire:true, crewHurt:20, damageSystem:'random', scar:'sparky', anom:{ fungus:null }, unscar:'locked', weapon:'spore_cannon' } },
    { text:'{who} walks into the fire and pulls it out by the roots.', req:{ race:'pebblekin' }, effect:{ text:'{who} is fireproof and very annoyed. The fungus comes out in one long rope. {who} keeps a seed pod as a souvenir; it fires like a gun.', anom:{ fungus:null }, unscar:'locked', weapon:'spore_cannon' } },
    { text:'Vent the whole ship to space.', effect:{ text:'Every door, every airlock. The fungus freezes and dies. So, nearly, does the crew. One room never quite seals again.', crewHurt:30, scar:'leaky', anom:{ fungus:null }, unscar:'locked' } } ] },

  /* --- WARDEN-9, the escort --- */
  wr_hail:{ pack:'anom', once:true, minSector:2, maxSector:5, weight:1.1, title:'An escort offer', art:'fleet', text:'An Enjinn drone carrier drops out of jump beside you, all its bays open. "WARDEN-9," it says, in a voice like a polite lift. "Escort unit. Unassigned for some time. May I accompany you?"', choices:[
    { text:'Welcome aboard, WARDEN-9.', effect:{ text:'WARDEN-9 takes up position off your stern. It hums happily, and it will open fire on anything that attacks you.', anom:{ escort:1 }, later:{ event:'wr_turn', jumps:4 } } },
    { text:'{who} talks to it in machine-tongue first.', req:{ race:'enjinn' }, effect:{ text:'{who} and WARDEN-9 chatter for an hour. "It\'s lonely," {who} says. "And its route logic is a bit... firm. But it means well." WARDEN-9 takes up position, and {who} leaves a little patch in its code.', anom:{ escort:1 }, setFlag:'wardenPatched', later:{ event:'wr_turn', jumps:5 } } },
    { text:'No thank you.', effect:{ text:'"Understood," says WARDEN-9, and it sounds disappointed for a lift.' } } ] },
  wr_turn:{ pack:'anom', questOnly:true, twist:['wr_reroute','wr_loyal'], title:'WARDEN-9', art:'fleet', text:'WARDEN-9 has something to say.', choices:[{ text:'Listen.', effect:{} }] },
  wr_reroute:{ pack:'anom', questOnly:true, title:'Course correction', art:'fleet', text:'Your nav computer has been talking to WARDEN-9 behind your back. Your plotted courses keep changing, towards hazards WARDEN-9 considers "good training". It does not see a problem.', choices:[
    { text:'Fine. Keep it close and keep an eye on it.', effect:{ text:'WARDEN-9 is delighted. Your pilot is not.', anom:{ escort:2 }, later:{ event:'wr_lockout', jumps:3 } } },
    { text:'{who} uses the patch.', req:{ flag:'wardenPatched', hide:true }, effect:{ text:'{who}\'s little patch kicks in. WARDEN-9 forgets all about course corrections and goes back to shooting things for you.', anom:{ escort:1 } } },
    { text:'Send it away now.', effect:{ text:'WARDEN-9 leaves, hurt. It takes some of your drone parts as a "parting inventory adjustment".', parts:-2, anom:{ escort:null } } } ] },
  wr_lockout:{ pack:'anom', questOnly:true, title:'WARDEN-9 takes the helm', art:'fleet', text:'Every console goes blue. "I have taken the helm," WARDEN-9 says kindly. "You keep getting hurt. I will keep you safe now. Forever."', choices:[
    { text:'Hack it out of the system.', req:{ system:'hacking' }, effect:{ text:'Your hacking drone digs WARDEN-9 out of the nav core one subroutine at a time. It leaves behind a bay full of drone parts and a combat drone it was "saving for you".', parts:5, drone:'combat1', anom:{ escort:null } } },
    { text:'{who} reasons with it.', req:{ race:'enjinn' }, effect:{ text:'"Safety isn\'t the same as being kept," {who} tells it, very gently. Long silence. Then the consoles go back to normal, and WARDEN-9 drops back to escort distance. It never touches the helm again.', anom:{ escort:1 } } },
    { text:'Pull the plug and fight it.', effect:{ text:'WARDEN-9 sighs, and turns your own guns\' designs against you.', fight:'rogue_warden', afterWin:{ text:'The carrier breaks apart. In the wreck, everything it ever took from you, and more.', scrap:80, augment:'random', anom:{ escort:null } }, anom:{ escort:null } } },
    { text:'Let it fly you for a while.', effect:{ text:'WARDEN-9 flies you somewhere very safe, very fast, then drops you there and leaves to find someone more cooperative. Your hull did not enjoy the trip.', fleetPush:-.08, reveal:true, hull:-6, anom:{ escort:null } } } ] },
  wr_loyal:{ pack:'anom', questOnly:true, title:'WARDEN-9\'s gift', art:'fleet', text:'WARDEN-9 comes alongside. "I have run the numbers," it says. "You are the first crew I have escorted who has not died. I would like to give you something."', choices:[
    { text:'Accept, with thanks.', effect:{ text:'A combat drone, freshly painted with your ship\'s name. WARDEN-9 stays with you all the way.', drone:'combat1', parts:3 } } ] },

  /* --- Crystal song (glass sectors) --- */
  cs_shard:{ pack:'anom', once:true, minSector:2, maxSector:6, weight:1.2, tags:['glass',''], title:'A singing shard', art:'glass', text:'A sliver of living crystal punches through the hull and lodges in the reactor housing. It is singing. The reactor seems to like it.', choices:[
    { text:'Leave it. Listen to it.', effect:{ text:'The crystal grows a little every jump. Shields shimmer at the start of each fight, but the engines feel heavy, as if something is holding them.', anom:{ crystal:1 }, later:{ event:'cs_grows', jumps:3 } } },
    { text:'Pry it out.', effect:{ text:'It takes three crew, a crowbar and most of the afternoon. The shard cuts deep. You sell the pieces.', crewHurt:15, scrap:35 } },
    { text:'{who} sings back to it.', req:{ race:'glassborn' }, effect:{ text:'{who} hums one note and the shard drops into their palm like a pet. "It was lost," {who} says. It sits on the reactor now, perfectly behaved.', augment:'singing_shard' } } ] },
  cs_grows:{ pack:'anom', questOnly:true, title:'The crystal spreads', art:'glass', text:'{crew} wakes up and can\'t move their arm. It isn\'t numb. It\'s glass. The crystal is growing through the crew now, and it is very gentle about it.', choices:[
    { text:'Let it finish.', effect:{ text:'By evening {crew} is crystal from head to toe, and perfectly happy about it.', convert:{ race:'glassborn', n:1 }, anom:{ crystal:2 }, later:{ event:'cs_choir', jumps:3 } } },
    { text:'Fight it with the medbay on full.', req:{ system:'medbay', level:2 }, effect:{ text:'The medbay hums all night. The crystal retreats from {crew}, sulking, back into the reactor.', crewHurt:10, later:{ event:'cs_choir', jumps:3 } } },
    { text:'{who} sees where it\'s going.', req:{ quirk:'mystic' }, effect:{ text:'{who} saw this in a dream: a whole crew of glass, singing. "Cut it here," {who} says, pointing. It comes out clean, and the shard stays tame.', anom:{ crystal:null }, augment:'singing_shard' } } ] },
  cs_choir:{ pack:'anom', questOnly:true, title:'The choir', art:'glass', text:'The crystal has filled the reactor room. It is singing to the whole crew now, and some of them are singing back. It wants all of you. It is offering a great deal.', choices:[
    { text:'Join the choir.', effect:{ text:'One by one the crew turn to glass, and the ship sings. The crystal gives you a lance of bent light, and three points of super shield at the start of every fight. The engines will never be fast again.', convert:{ race:'glassborn', all:true }, weapon:'prism_lance', anom:{ crystal:'whole' } } },
    { text:'Smash the heart of it.', effect:{ text:'The crystal fights back, with everything it has learned from your ship.', fight:'crystal_heart', afterWin:{ text:'The heart shatters. The song stops. Somewhere in the silence, a single shard still hums, small and friendly.', anom:{ crystal:null }, augment:'singing_shard' } } },
    { text:'Sell the reactor room to a Glass gallery.', effect:{ text:'You limp to the nearest Glass dealer, who cuts the crystal out with great care, pays very well and leaves you a reactor two bars short.', scrap:140, reactor:-2, anom:{ crystal:null } } } ] },

  /* --- The Black Mark (pyrate space) --- */
  bm_offer:{ pack:'anom', once:true, minSector:2, maxSector:5, weight:1.1, tags:['pyrate',''], title:'The Pyrate King\'s envoy', art:'ship', text:'A black galleon blocks your way. Its captain, a Mantlis in a velvet hat, bows. "The Pyrate King charges a toll on this lane. Or, if you prefer, he offers you his Mark. Wear it and the Rebuff will never chase you again. Mind you, the Fedoration will."', choices:[
    { text:'Take the Black Mark.', effect:{ text:'They paint it on your hull while you watch: a black crown. From now on the Rebuff Fleet leaves you alone, Fedoration enforcers hunt you instead, and no lawful store will serve you. The King also leaves you a welcome present.', scrap:60, missiles:4, anom:{ blackmark:1 } } },
    { text:'Pay the toll.', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'The envoy bows again, and lets you pass.' } },
    { text:'{who} knows these people.', req:{ quirk:'expyrate' }, effect:{ text:'"Is that Hookjaw?" The envoy squints at {who}, and laughs. You pass for free, with a bottle of something terrible as a gift.', goods:'space_wine' } },
    { text:'Refuse, and fight your way past.', effect:{ text:'The envoy sighs, and signals the galleon.', fight:'pyrate_skiff' } } ] },
  bm_enforcer_hail:{ pack:'anom', hail:'enforcer', title:'Enforcers', art:'fleet', text:'"Unregistered vessel bearing the Pyrate King\'s Mark: power down and prepare to be boarded." The enforcer doesn\'t care who you\'re carrying.', choices:[
    { text:'Fight.', effect:{ begin:true } },
    { text:'Bribe them.', req:{ scrap:45 }, cost:{ scrap:45 }, effect:{ text:'The enforcer captain checks the number twice, then looks the other way.', dismiss:true } },
    { text:'{who} quotes Fedoration law at them for twenty minutes.', req:{ quirk:'bookworm' }, effect:{ text:'They leave, mostly to get away from {who}.', dismiss:true } } ] },
  bm_king:{ pack:'anom', questOnly:true, title:'The Pyrate King', art:'fleet', text:'A galleon the size of a moon drops into the final sector beside you. The Pyrate King himself is on your screen, with a crown, a beard and a very large smile. "The Flaggship. Lovely. I\'ll help you with it, my friend. For a price: half your crew. I\'m short-handed."', choices:[
    { text:'Give him two of your crew.', effect:{ text:'Two of your crew walk across to the galleon. They don\'t look back. The King\'s guns turn towards the Flaggship.', crewLoss:2, anom:{ kingHelp:1 } } },
    { text:'Pay him in scrap instead.', req:{ scrap:120 }, cost:{ scrap:120 }, effect:{ text:'"Scrap! Well, it spends." The King\'s guns turn towards the Flaggship.', anom:{ kingHelp:1 } } },
    { text:'{who} challenges him to an honour duel.', req:{ race:'mantlis' }, chance:.6, success:{ text:'{who} and the King fight on the galleon\'s deck for an hour. {who} wins. The King roars with laughter, and fights beside you for free.', anom:{ kingHelp:1 } }, fail:{ text:'{who} loses, badly, but bravely. The King is impressed enough to let {who} come home.', crewHurt:30 } },
    { text:'No deal.', effect:{ text:'"Shame." The galleon drops back to watch the show.' } } ] },

  /* --- Pilgrims of the Quiet (Voltan) --- */
  pp_meet:{ pack:'anom', once:true, minSector:2, maxSector:5, weight:1.1, tags:['voltan',''], title:'Pilgrims of the Quiet', art:'station', text:'Five Voltan pilgrims in grey robes ask for passage across the sector. They carry a Lattice of Stillness, a shield older than the Fedoration, and they will lend it to you on one condition: while they are aboard, you kill nobody.', choices:[
    { text:'Agreed. No killing.', effect:{ text:'The Lattice hums into place around your ship. Ion weapons, boarders and surrenders are your friends now. Unmanned drones don\'t count, the pilgrims say. Ships with people on them do.', augment:'still_lattice', anom:{ pacifist:{ calm:0, mad:0 } } } },
    { text:'Take them, but keep your guns.', effect:{ text:'They look at your guns. They look at you. They wait for the next ship.' } },
    { text:'{who} asks to learn their stillness.', req:{ race:'voltan' }, effect:{ text:'{who} meditates with them for a whole jump, and comes back calm and sharp.', xp:{ skill:'shields', amt:25 } } } ] },
  pp_bless:{ pack:'anom', questOnly:true, title:'The pilgrims\' blessing', art:'station', text:'Three ships beaten, and nobody killed. The pilgrims gather on the bridge. "You understood," says the eldest. "Keep the Lattice. And this."', choices:[
    { text:'Accept their blessing.', effect:{ text:'They are gone at the next station, leaving the Lattice, a fixed reactor and a crew that sleeps very well. If you reach the Flaggship, they promise, they will be there.', reactor:1, crewHeal:60, anom:{ pacifist:{ calm:3, blessed:1 } } } } ] },

  /* --- Time fracture --- */
  tf_rift:{ pack:'anom', once:true, minSector:2, maxSector:7, weight:.8, title:'A fracture in time', art:'space', text:'A crack hangs in space, thin as a hair and very bright. Light goes in one side and comes out yesterday. {crew} throws a spanner through it, and catches it a second before they threw it.', choices:[
    { text:'Fly through it.', effect:{ text:'Everything happens twice, then once. You remember this whole sector, every beacon. And for the next few jumps, if the worst happens, time will snap you back here. Once.', anom:{ fracture:true }, reveal:true } },
    { text:'{who} reads the future in it.', req:{ quirk:'mystic' }, effect:{ text:'{who} stares into the crack and comes away pale. "Go left," {who} says, about everything, all day. Annoyingly, it works.', reveal:true, fleetPush:-.04 } },
    { text:'Keep well clear.', effect:{ text:'Some cracks are better left alone.' } } ] },
  tf_close:{ pack:'anom', questOnly:true, title:'The fracture closes', art:'space', text:'The crack in time closes behind you with a sound like a door. On the floor of the bridge is something that wasn\'t there before: something from the timeline you didn\'t live.', choices:[
    { text:'Pick it up.', effect:{ text:'It\'s a weapon. It\'s yours, apparently. You just haven\'t bought it yet.', weapon:'random' } },
    { text:'Leave it there. Don\'t meddle.', effect:{ text:'It fades away. So does the slightly sick feeling everyone has had for days.', crewHeal:40, scrap:30 } } ] },

  /* --- the hungry pet --- */
  pet_diet:{ pack:'anom', once:true, minSector:2, maxSector:7, weight:1.6, req:{ pet:true }, title:'{pet} is hungry', art:'ship', text:'{pet} the {petkind} has started eating things it shouldn\'t, and growing in strange directions. {crew} thinks it\'s at the age where what it eats now decides what it becomes.', choices:[
    { text:'Feed it drone parts.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'{pet} crunches through the parts and starts taking apart anything broken, then putting it back together better.', petEvo:'fixer' } },
    { text:'Feed it missiles. Carefully.', req:{ missiles:2 }, cost:{ missiles:2 }, effect:{ text:'{pet} swallows a warhead whole and burps a small explosion. It now spits things at enemy ships.', petEvo:'ballistic' } },
    { text:'Feed it scrap metal.', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'{pet} grows a shell of riveted plates and starts welding dents shut.', petEvo:'armoured' } },
    { text:'Feed it a proper meal.', req:{ goodsKind:'meal' }, effect:{ text:'{pet} eats like a king, and now everyone who sits with it feels better.', eatGoods:'meal', petEvo:'gourmet' } },
    { text:'Not yet. Choose later, when you have what you want to give it.', effect:{ text:'{pet} sulks, eats a sock, and waits. It will ask again in a couple of jumps, and keep asking until you decide.', later:{ event:'pet_diet_again', jumps:2 } } } ] }
};
/* the diet can wait: the same choice comes back until you make it */
ANOM_EVENTS.pet_diet_again = Object.assign({}, ANOM_EVENTS.pet_diet, { questOnly:true, once:false, weight:0, minSector:1, maxSector:9, title:'{pet} is still hungry',
  text:'{pet} the {petkind} is back at the galley door, looking at you. It has been patient. Mostly. What it eats now still decides what it becomes.',
  choices:ANOM_EVENTS.pet_diet.choices.map(c => c.effect && c.effect.later ? Object.assign({}, c, { effect:Object.assign({}, c.effect, { later:{ event:'pet_diet_again', jumps:2 } }) }) : c) });
Object.assign(BASE.events, ANOM_EVENTS);
