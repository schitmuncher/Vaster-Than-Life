'use strict';
/* =========================================================================
   Ship classes: create-a-class for the ship itself.

   MASTERY. Every ship has its own level, 1 to 20, earned by flying it:
   jumps, ships beaten, sectors crossed, wins. Mastery opens class slots,
   class points, fitting slots, augment slots and heavier weapon tiers.

   GUNNERY. Every ship weapon has its own level, 1 to 10, earned by firing
   it and winning fights with it aboard, on any ship. Level 2 ("Qualified")
   lets you start a run with it; higher levels charge it faster wherever you
   carry it, and at level 10 it starts each fight part-charged.

   CLASSES. A class is a starting loadout for one ship: weapons, drones,
   augments and up to three fittings (small permanent perks: more hull, a
   bigger reactor, an extra hand...). Everything costs points; the budget is
   whatever the ship's Standard class is worth, plus a point every third
   mastery level. Standard is always there and can't be changed.

   Classes and gunnery bonuses are for your own voyages: dailies, the Cup,
   challenges, seed duels and multiplayer always fly Standard, unboosted.
   Kept in PROFILE.ships { id: { xp, classes:[{ name, w, d, a, p }], sel } }
   and PROFILE.gxp { weaponId: xp }.
   ========================================================================= */
const SC_MAX = 20, GUN_MAX = 10;
const GUN_XP = [0, 60, 150, 300, 500, 750, 1050, 1400, 1800, 2250];
const GUN_RANK = ['', 'Recruit', 'Qualified', 'Drilled', 'Practised', 'Tuned', 'Sharp', 'Veteran', 'Expert', 'Ace', 'Mastered'];
function scXpFor(L){ return 120*(L - 1) + 40*(L - 1)*(L - 1); }   // total xp to reach mastery L
function scBook(id){ PROFILE.ships = PROFILE.ships || {}; const b = PROFILE.ships[id] = PROFILE.ships[id] || { xp:0, classes:[], sel:-1 }; b.classes = b.classes || []; if(b.sel == null) b.sel = -1; return b; }
function scXp(id){ return (PROFILE.ships && PROFILE.ships[id] && PROFILE.ships[id].xp) || 0; }
function scLevelAt(x){ let L = 1; while(L < SC_MAX && x >= scXpFor(L + 1)) L++; return L; }
function scLevel(id){ return scLevelAt(scXp(id)); }
function gunXp(id){ return (PROFILE.gxp && PROFILE.gxp[id]) || 0; }
function gunLevelAt(x){ let L = 1; while(L < GUN_MAX && x >= GUN_XP[L]) L++; return L; }
function gunLevel(id){ return gunLevelAt(gunXp(id)); }
function gunBonus(id){ const L = gunLevel(id); return L >= 10 ? .15 : L >= 7 ? .12 : L >= 5 ? .08 : L >= 3 ? .04 : 0; }
/* runs where everyone must be on level terms */
function scFair(g){ g = g || G; return !!(g && (g.daily || g.cup || g.seedDuel || g.challenge || g.duel || g.par || g.tut)) || (typeof NET!=='undefined' && NET.on); }
/* sim.js asks this for every weapon as it charges */
function refitMult(sh, w){ if(!G || sh!==G.ship || scFair()) return 1; return 1 + gunBonus(w.id); }

/* ---------------- what mastery gives ---------------- */
function scClassSlots(L){ return 1 + (L >= 4) + (L >= 8) + (L >= 13) + (L >= 18); }
function scPerkSlots(L){ return (L >= 2) + (L >= 6) + (L >= 12); }
function scAugSlots(L, def){ return Math.min(R.augmentSlots || 3, Math.max((def.augments || []).length, (L >= 5) + (L >= 10))); }
function scTierOK(t, L){ t = t || 1; return t <= 1 || (t===2 && L >= 3) || (t===3 && L >= 7) || (t >= 4 && L >= 12); }
function scTierLevel(t){ return (t || 1) <= 1 ? 1 : t===2 ? 3 : t===3 ? 7 : 12; }
function scBonusPoints(L){ return 1 + Math.floor(L/3); }   // a point to play with from the start, and one more every third level
/* fittings: small permanent perks, one slot each. [id, name, mastery level, text, apply(G, ship)] */
const SC_PERKS = [
  ['plating', 'Reinforced Plating', 2, '+4 hull.', (g, s) => { s.maxHull += 4; s.hull += 4; }],
  ['cells', 'Spare Fuel Cells', 2, '+4 fuel.', g => { g.fuel += 4; }],
  ['rack', 'Missile Rack', 2, '+4 missiles.', g => { g.missiles += 4; }],
  ['parts', 'Parts Locker', 3, '+4 drone parts.', g => { g.parts += 4; }],
  ['purse', 'Petty Cash', 4, '+25 scrap to start.', g => { g.scrap += 25; }],
  ['pantry', 'Stocked Pantry', 4, '+8 food.', g => { g.food = (g.food || 0) + 8; }],
  ['doors', 'Blast Doors', 5, 'Doors start one level higher.', (g, s) => scSysUp(s, 'doors')],
  ['reactor', 'Tuned Reactor', 6, '+1 reactor power.', (g, s) => { s.reactor += 1; }],
  ['drill', 'Drilled Crew', 7, 'Your starting crew already know their stations.', (g, s) => { const sk = ['pilot', 'engines', 'weapons', 'shields']; s.crew.filter(c => c.owner==='p' && !c.drone).forEach((c, i) => { try{ gainXP(c, sk[i % sk.length], 40); }catch(e){} }); }],
  ['sensors', 'Good Sensors', 8, 'Sensors start one level higher.', (g, s) => scSysUp(s, 'sensors')],
  ['medbay', 'Field Hospital', 8, 'Medbay (or Clone Bay) starts one level higher.', (g, s) => scSysUp(s, s.systems.medbay ? 'medbay' : 'clonebay')],
  ['engines', 'Racing Engines', 9, 'Engines start one level higher.', (g, s) => scSysUp(s, 'engines')],
  ['hand', 'Extra Hand', 10, 'One more crew member (a human).', (g, s) => { try{ if(s.crew.filter(c => c.owner==='p' && !c.drone).length < R.maxCrew) addCrew(s, 'human', 'p'); }catch(e){} }],
  ['luck', 'Lucky Charm', 11, '10% more scrap all voyage.', g => { g.chScrap = (g.chScrap || 1)*1.1; }],
  ['shields', 'Shield Capacitor', 14, 'Shields start one level higher.', (g, s) => scSysUp(s, 'shields')],
  ['gunroom', 'Bigger Gun Room', 16, 'Weapons system starts one level higher.', (g, s) => scSysUp(s, 'weapons')] ];
function scSysUp(s, k){ const y = s.systems[k]; if(y && y.max < (CAPS[k] || 8)) y.max++; }
function scPerk(id){ return SC_PERKS.find(p => p[0]===id); }
/* everything a mastery level hands over, as short lines (for the track and the level-up notice) */
function scRewards(L, def){ const out = [];
  if(scClassSlots(L) > scClassSlots(L - 1)) out.push(`Class slot ${scClassSlots(L)}`);
  if(scPerkSlots(L) > scPerkSlots(L - 1)) out.push(`Fitting slot ${scPerkSlots(L)}`);
  if(def && scAugSlots(L, def) > scAugSlots(L - 1, def)) out.push(`Augment slot ${scAugSlots(L, def)}`); else if(!def && (L===5 || L===10)) out.push(`Augment slot ${L===5 ? 1 : 2}`);
  for(const t of [2, 3, 4]) if(scTierLevel(t)===L) out.push(`Tier ${t} weapons`);
  if(L > 1 && scBonusPoints(L) > scBonusPoints(L - 1)) out.push('+1 class point');
  for(const p of SC_PERKS) if(p[2]===L) out.push(p[1]);
  if(L===SC_MAX) out.push('Mastered: a gold ★ by the ship\'s name');
  return out; }

/* ---------------- costs and what you may pick ---------------- */
function scCost(kind, id){ const d = kind==='w' ? DATA.weapons[id] : kind==='d' ? DATA.drones[id] : DATA.augments[id]; if(!d) return 0; return Math.max(kind==='a' ? 2 : 1, Math.round((d.cost || 40)/25)); }
function scStd(def){ return { name:'Standard', w:(def.weapons || []).filter(id => DATA.weapons[id]).slice(0, R.weaponSlots), d:(def.drones || []).filter(id => DATA.drones[id]).slice(0, R.droneSlots), a:(def.augments || []).filter(id => DATA.augments[id]), p:[], std:true }; }
function scClassCost(c){ return (c.w || []).reduce((t, id) => t + scCost('w', id), 0) + (c.d || []).reduce((t, id) => t + scCost('d', id), 0) + (c.a || []).reduce((t, id) => t + scCost('a', id), 0); }
function scBudget(def){ return scClassCost(scStd(def)) + scBonusPoints(scLevel(def.id)); }
function scSeen(k, id){ try{ return !!(codex()[k] || {})[id]; }catch(e){ return false; } }
/* may this go in a class for this ship? returns '' for yes, or the reason why not */
function scWhyNot(kind, id, def){ const L = scLevel(def.id), std = scStd(def);
  if(kind==='w'){ const w = DATA.weapons[id]; if(!w) return 'Unknown'; if(std.w.includes(id)) return ''; if(w.noLoot || w.eventOnly || w.boss) return 'Cannot be fitted at the dock';
    if(!scTierOK(w.tier, L)) return `Tier ${w.tier}: needs mastery ${scTierLevel(w.tier)} with this ship`; if(gunLevel(id) < 2) return gunXp(id) ? `Gunnery ${gunXp(id)}/${GUN_XP[1]} xp to qualify` : 'Carry it on a voyage to start learning it'; return ''; }
  if(kind==='d'){ const d = DATA.drones[id]; if(!d) return 'Unknown'; if(std.d.includes(id)) return ''; if(!(def.systems || {}).drones) return 'This ship has no drone system'; if(d.noLoot) return 'Cannot be fitted at the dock'; if(!scSeen('dr', id)) return 'Fly one on a voyage first'; return ''; }
  if(kind==='a'){ const a = DATA.augments[id]; if(!a) return 'Unknown'; if(std.a.includes(id)) return ''; if(a.noLoot) return 'Cannot be fitted at the dock'; if(!scSeen('au', id)) return 'Fit one on a voyage first'; return ''; }
  if(kind==='p'){ const p = scPerk(id); if(!p) return 'Unknown'; if(L < p[2]) return `Needs mastery ${p[2]} with this ship`; if(id==='medbay' && !((def.systems || {}).medbay || (def.systems || {}).clonebay)) return 'This ship has no medbay'; if(id==='parts' && !(def.systems || {}).drones && !(def.reserve || []).includes('drones')) return ''; return ''; }
  return ''; }
/* a class as it will actually be flown: anything no longer allowed is dropped, and it is trimmed to the budget */
function scClean(def, c){ if(!c || c.std) return scStd(def); const L = scLevel(def.id), out = { name:String(c.name || 'Class').slice(0, 18), w:[], d:[], a:[], p:[] };
  for(const id of (c.w || []).slice(0, R.weaponSlots)) if(!scWhyNot('w', id, def)) out.w.push(id);
  if((def.systems || {}).drones) for(const id of (c.d || []).slice(0, R.droneSlots)) if(!scWhyNot('d', id, def)) out.d.push(id);
  for(const id of (c.a || []).slice(0, scAugSlots(L, def))) if(!scWhyNot('a', id, def) && !out.a.includes(id)) out.a.push(id);
  for(const id of (c.p || []).slice(0, scPerkSlots(L))) if(!scWhyNot('p', id, def) && !out.p.includes(id)) out.p.push(id);
  const B = scBudget(def); let guard = 0; while(scClassCost(out) > B && guard++ < 12){ if(out.a.length) out.a.pop(); else if(out.d.length) out.d.pop(); else if(out.w.length > 1) out.w.pop(); else break; }
  return out; }
function scCurrent(def){ const b = scBook(def.id); if(b.sel < 0 || b.sel >= scClassSlots(scLevel(def.id)) || !b.classes[b.sel]) return scStd(def); return scClean(def, b.classes[b.sel]); }
function scAllowed(o){ o = o || {}; return !(o.daily || o.cup || o.challenge || o.seedDuel || o.par || o.practice || o.keepData) && !(typeof NET!=='undefined' && NET.on) && !(typeof CAMP!=='undefined' && CAMP); }
/* fit a class to a ship. run: also apply the fittings (they change the run, not just the ship) */
function scApply(sh, def, c, run){
  if(!c || c.std) return;
  sh.weapons = c.w.map(id => ({ id, charge:0, on:false, target:null })); sh.drones = c.d.map(id => ({ id, on:false, unit:null })); sh.augments = c.a.slice();
  if(run) for(const id of c.p){ const p = scPerk(id); if(p){ try{ p[4](G, sh); }catch(e){} } }
  else for(const id of c.p){ const p = scPerk(id); if(p && /^(plating|reactor|doors|sensors|medbay|engines|shields|gunroom)$/.test(id)){ try{ p[4]({}, sh); }catch(e){} } }   // the hangar preview shows what changes the ship itself
  // power follows the loadout, as it does for a ship straight from the yard
  try{ const needW = sh.weapons.reduce((t, w) => t + (DATA.weapons[w.id]?.power || 0), 0), needD = sh.drones.reduce((t, d) => t + (DATA.drones[d.id] && DATA.drones[d.id].kind!=='hull' ? DATA.drones[d.id].power || 0 : 0), 0);
    for(const k in sh.systems) if(!SUB.includes(k)) sh.systems[k].power = 0; let left = sh.reactor;
    const give = (k, n) => { const y = sh.systems[k]; if(!y || SUB.includes(k)) return; const p = Math.max(0, Math.min(y.max - y.power, n, left)); y.power += p; left -= p; };
    give('shields', 99); give('oxygen', 1); give('engines', 1); give('weapons', needW); give('drones', needD); give('medbay', 1); give('clonebay', 1); give('engines', 99); give('oxygen', 99);
    for(const k of ['teleporter', 'cloaking', 'hacking', 'mindcontrol']) give(k, 99);
    if(typeof autoPowerWeapons==='function') autoPowerWeapons(sh); }catch(e){} }

/* ---------------- earning it ---------------- */
function scOn(){ return !!(G && G.ship && G.shipDef && !G.tut && !G.noSave); }
function scDiffMult(){ return ({ easy:.8, normal:1, hard:1.25 })[G && G.diff] || 1; }
function scNews(t){ if(G){ G.prog = G.prog || {}; (G.prog.news = G.prog.news || []).push(t); } }
function scGain(n){ if(!scOn() || !n) return; const id = G.shipDef, def = DATA.ships[id]; if(!def) return; const b = scBook(id), L0 = scLevelAt(b.xp); b.xp += Math.round(n*scDiffMult()); const L1 = scLevelAt(b.xp);
  for(let L = L0 + 1; L <= L1; L++){ const rw = scRewards(L, def); if(typeof sfx==='function') sfx('achieve'); if(typeof capGain==='function') capGain(20 + L*2);
    const line = `${def.name}: mastery ${L}${rw.length ? '. New: ' + rw.slice(0, 3).join(', ') + (rw.length > 3 ? '…' : '') : ''}`; if(typeof toast==='function') toast('⬆ ' + line); scNews(line); if(typeof logEntry==='function') logEntry(`Mastery ${L} with ${def.name}.`, 'level'); } }
function gunGain(id, n){ if(!scOn() || !id || !DATA.weapons[id] || !n) return; PROFILE.gxp = PROFILE.gxp || {}; const L0 = gunLevel(id); PROFILE.gxp[id] = (PROFILE.gxp[id] || 0) + n; const L1 = gunLevel(id);
  if(L1 > L0){ const nm = DATA.weapons[id].name, extra = L1===2 ? ' You can now start a voyage with it.' : L1===10 ? ' It charges 15% faster and starts every fight part-charged.' : gunBonus(id) > (L1 > 1 ? [0, 0, 0, .04, .04, .08, .08, .12, .12, .12, .15][L1 - 1] : 0) ? ` It now charges ${Math.round(gunBonus(id)*100)}% faster.` : '';
    const line = `${nm}: gunnery ${L1}, ${GUN_RANK[L1]}.${extra}`; if(typeof toast==='function') toast('🎯 ' + line); scNews(line); if(typeof sfx==='function') sfx('achieve'); } }
(function(){
  // a new voyage: fit the chosen class, and note where everything stood for the progress report
  if(typeof newRun==='function'){ const n0 = newRun; newRun = function(shipId, name, o){ o = o || {}; const r = n0(shipId, name, o);
    try{ if(G && G.ship){ const def = DATA.ships[G.shipDef];
        if(def && scAllowed(o) && !G.tut){ const c = scCurrent(def); if(!c.std){ scApply(G.ship, def, c, true); G.className = c.name; if(typeof logEntry==='function') logEntry(`Fitted out as "${c.name}".`, 'start'); } }
        G.prog = { sx0:scXp(G.shipDef), cx0:typeof capXp==='function' ? capXp() : 0, g0:Object.assign({}, PROFILE.gxp || {}), news:[] }; if(typeof save==='function') save(); } }catch(e){}
    return r; }; }
  if(typeof arrive==='function'){ const a0 = arrive; arrive = function(i){ const r = a0(i); try{ scGain(6); }catch(e){} return r; }; }
  if(typeof genSector==='function'){ const g0 = genSector; genSector = function(n, type){ const r = g0(n, type); try{ if(n > 1) scGain(60); }catch(e){} return r; }; }
  if(typeof fireWeapon==='function'){ const f0 = fireWeapon; fireWeapon = function(sh, w, foe){ const r = f0(sh, w, foe); try{ if(G && sh===G.ship && w) gunGain(w.id, 2); }catch(e){} return r; }; }
  if(typeof finishCombat==='function'){ const f0 = finishCombat; finishCombat = function(kind, offer){ const guns = G && G.ship ? G.ship.weapons.filter(w => w && w.on).map(w => w.id) : [], boss = !!(G && G.enemy && G.enemy.boss); const r = f0(kind, offer);
    try{ if(kind && kind!=='fled'){ scGain(boss ? 80 : 25); for(const id of new Set(guns)) gunGain(id, boss ? 30 : 12); if(typeof saveProfile==='function') saveProfile(); } }catch(e){} return r; }; }
  // gunnery 10: the gun starts each fight part-charged
  if(typeof startCombat==='function'){ const s0 = startCombat; startCombat = function(id, o){ const r = s0(id, o); try{ if(G && G.ship && !scFair()) for(const w of G.ship.weapons){ const d = DATA.weapons[w.id]; if(d && w.on && gunLevel(w.id) >= GUN_MAX) w.charge = Math.max(w.charge || 0, (d.charge || 10)*.3); } }catch(e){} return r; }; }
  if(typeof endRun==='function'){ const e0 = endRun; endRun = function(win, reason){ try{ if(win) scGain(400); }catch(e){} const g = G, r = e0(win, reason);
    try{ if(g && g.prog && g.shipDef && !g.tut){ const P = g.prog, def = DATA.ships[g.shipDef] || { id:g.shipDef, name:g.ship ? g.ship.name : g.shipDef };
        const guns = Object.keys(PROFILE.gxp || {}).map(id => ({ id, x0:P.g0[id] || 0, x1:PROFILE.gxp[id] })).filter(x => x.x1 > x.x0 && DATA.weapons[x.id]).sort((a, b) => (b.x1 - b.x0) - (a.x1 - a.x0)).slice(0, 4);
        UI.progress = { t0:performance.now(), ship:{ id:g.shipDef, name:def.name, x0:P.sx0 || 0, x1:scXp(g.shipDef) }, cap:{ x0:P.cx0 || 0, x1:typeof capXp==='function' ? capXp() : 0 }, guns, news:(P.news || []).slice(-6), open:true }; if(typeof saveProfile==='function') saveProfile(); } }catch(e){}
    return r; }; }
})();

/* ---------------- the hangar button ---------------- */
function drawClassButton(x, y, w, h, def){
  const L = scLevel(def.id), xp = scXp(def.id), a = scXpFor(L), b = L < SC_MAX ? scXpFor(L + 1) : a, c = scCurrent(def), ok = scAllowed({});
  btn(x, y, w, h, '', () => { UI.classOpen = { ship:def.id, edit:scBook(def.id).sel, tab:'track', page:0 }; }, { s:14, col:C.cyan });
  T(`⚙ ${ok ? c.name : 'Standard'}`, x + 12, y + 21, { s:15, f:FD, w:700, c:C.cyan, max:w - 86 }); T(L >= SC_MAX ? '★ Mastered' : `Mastery ${L}`, x + w - 10, y + 21, { s:12, a:'right', c:L >= SC_MAX ? C.amber : C.ink });
  bar(x + 12, y + h - 15, w - 24, 5, L >= SC_MAX ? 1 : (xp - a)/Math.max(1, b - a), C.cyan);
  tip(x, y, w, h, 'Ship class', `Your starting loadout for this ship: weapons, drones, augments and fittings. Flying a ship raises your mastery with it, which opens more class slots, points and fittings. ${ok ? '' : 'This kind of run always flies Standard. '}Click to edit.`);
}

/* ---------------- the class editor ---------------- */
function scEditing(){ const O = UI.classOpen, def = O && DATA.ships[O.ship]; if(!def) return null; const b = scBook(def.id); return { O, def, b, L:scLevel(def.id), cls:O.edit < 0 ? scStd(def) : b.classes[O.edit] || null }; }
function scTouch(def){ UI._prev = null; const O = UI.classOpen, b = def && scBook(def.id);   // the class you're working on is the one you'll fly
  if(b && O && O.edit >= 0 && b.sel!==O.edit && b.classes[O.edit]){ b.sel = O.edit; if(typeof toast==='function') toast(`${def.name} will launch as "${b.classes[O.edit].name}". Pick Standard to go back.`); }
  if(typeof saveProfile==='function') saveProfile(); }
function scStat(kind, id){ if(kind==='w'){ const d = DATA.weapons[id]; if(!d) return ''; return `${typeof cap==='function' ? cap(d.type || 'weapon') : d.type}${d.damage ? ' · ' + d.damage + ' dmg' : ''}${d.shots > 1 ? ' ×' + d.shots : ''} · ${d.charge}s · ${d.power} power`; }
  if(kind==='d'){ const d = DATA.drones[id]; return d ? `${typeof cap==='function' ? cap(d.kind || 'drone') : d.kind} · ${d.power} power` : ''; }
  if(kind==='a'){ const d = DATA.augments[id]; return d ? d.desc || '' : ''; } const p = scPerk(id); return p ? p[3] : ''; }
function scName(kind, id){ return kind==='w' ? DATA.weapons[id]?.name : kind==='d' ? DATA.drones[id]?.name : kind==='a' ? DATA.augments[id]?.name : (scPerk(id) || [])[1]; }
function drawClassOverlay(){
  const E = scEditing(); if(!E){ UI.classOpen = null; return; } const { O, def, b, L } = E;
  ctx.fillStyle = 'rgba(4,6,12,.9)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {});
  const f = { x:50, y:40, w:1500, h:920 }; panel(f.x, f.y, f.w, f.h, 14);
  // header: the ship and its mastery
  label('Ship classes', f.x + 30, f.y + 40, C.cyan, 'left', 14); T((L >= SC_MAX ? '★ ' : '') + def.name, f.x + 30, f.y + 86, { s:36, f:FD, w:700, c:def.color || C.amber, max:520 });
  const xp = scXp(def.id), xa = scXpFor(L), xb = L < SC_MAX ? scXpFor(L + 1) : xa;
  T(L >= SC_MAX ? 'Mastered' : `Mastery ${L}`, f.x + 600, f.y + 62, { s:24, f:FD, w:700, c:C.cyan }); T(L >= SC_MAX ? `${fmtNum(xp)} xp` : `${fmtNum(xp - xa)} / ${fmtNum(xb - xa)} xp to level ${L + 1}`, f.x + 1120, f.y + 62, { s:14, a:'right', c:C.muted });
  bar(f.x + 600, f.y + 74, 520, 10, L >= SC_MAX ? 1 : (xp - xa)/Math.max(1, xb - xa), C.cyan);
  if(L < SC_MAX){ const nx = scRewards(L + 1, def); T(`Next: ${nx.length ? nx.join(' · ') : 'a step closer'}`, f.x + 600, f.y + 108, { s:13, c:C.muted, max:520 }); }
  btn(f.x + f.w - 170, f.y + 24, 140, 50, 'Done', () => { UI.classOpen = null; UI.classPick = null; }, { s:17, fill:true });
  if(!scAllowed({})) T('This kind of run always flies the Standard class.', f.x + f.w - 190, f.y + 104, { s:13, a:'right', c:C.warn });
  // left: the classes
  const lx = f.x + 30, ly = f.y + 140, slots = scClassSlots(L); label('Classes', lx, ly + 4, C.muted, 'left', 13);
  const rows = [{ i:-1, name:'Standard', sub:'As built. Always available.' }]; for(let i = 0; i < 5; i++) rows.push(i < slots ? { i, name:b.classes[i] ? b.classes[i].name : `Empty slot ${i + 1}`, sub:b.classes[i] ? `${scClassCost(scClean(def, b.classes[i]))} of ${scBudget(def)} points` : 'Click to make a class', empty:!b.classes[i] } : { i, locked:[4, 8, 13, 18][i - 1] });
  rows.forEach((r, k) => { const y = ly + 16 + k*74, on = O.edit===r.i, use = b.sel===r.i;
    rr(lx, y, 320, 66, 8); ctx.fillStyle = r.locked ? 'rgba(8,11,22,.4)' : on ? hexA(C.amber, .16) : 'rgba(8,11,22,.7)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : 'rgba(120,135,170,.25)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    if(r.locked){ T(`🔒 Class slot ${r.i + 1}`, lx + 16, y + 28, { s:16, c:C.muted }); T(`Opens at mastery ${r.locked}`, lx + 16, y + 50, { s:12, c:C.muted }); return; }
    T(r.name, lx + 16, y + 28, { s:17, f:FD, w:700, c:on ? C.amber : r.empty ? C.muted : C.ink, max:210 }); T(r.sub, lx + 16, y + 50, { s:12, c:C.muted, max:290 });
    if(use){ rr(lx + 236, y + 10, 74, 22, 6); ctx.fillStyle = C.good; ctx.fill(); T('IN USE', lx + 273, y + 26, { s:11, a:'center', c:'#06231a', f:FD, w:700 }); }
    region(lx, y, 320, 66, () => { O.edit = r.i; if(r.i===-1 && b.sel!==-1){ b.sel = -1; scTouch(def); toast(`${def.name} will launch as Standard.`); } if(r.i >= 0 && b.classes[r.i] && b.sel!==r.i){ b.sel = r.i; scTouch(def); } if(r.i >= 0 && !b.classes[r.i]){ const s = scStd(def); b.classes[r.i] = { name:`Class ${r.i + 1}`, w:s.w.slice(), d:s.d.slice(), a:s.a.slice(), p:[] }; scTouch(def); } }, 'sc:cls' + r.i); });
  const cls = O.edit < 0 ? scStd(def) : b.classes[O.edit], by = ly + 16 + 6*74 + 8;
  if(cls){ const inUse = b.sel===O.edit;
    btn(lx, by, 320, 48, inUse ? '✓ Flying this class' : 'Fly this class', () => { b.sel = O.edit; scTouch(def); toast(`${def.name} will launch as "${cls.name}".`); }, { s:16, fill:!inUse, col:C.good, disabled:inUse });
    if(O.edit >= 0){ btn(lx, by + 56, 156, 40, 'Rename', () => openKeyboard({ title:'Name this class', value:cls.name, max:18, ok:'Save', onOk:v => { cls.name = String(v).trim().slice(0, 18) || cls.name; scTouch(def); } }), { s:14 });
      btn(lx + 164, by + 56, 156, 40, 'Reset to Standard', () => { const s = scStd(def); cls.w = s.w.slice(); cls.d = s.d.slice(); cls.a = s.a.slice(); cls.p = []; scTouch(def); }, { s:13 }); } }
  // middle: what is in the class
  const mx = f.x + 380, mw = 640; if(cls) drawClassSlots(E, cls, mx, f.y + 140, mw);
  // right: the mastery track, or gunnery
  const rx = f.x + 1050, rw = 420, ry = f.y + 140;
  btn(rx, ry - 8, 204, 40, 'Mastery track', () => { O.tab = 'track'; O.page = 0; }, { fill:O.tab==='track', s:14 }); btn(rx + 216, ry - 8, 204, 40, 'Gunnery', () => { O.tab = 'guns'; O.page = 0; }, { fill:O.tab==='guns', s:14, col:C.hostile });
  if(O.tab==='guns') drawGunnery(rx, ry + 44, rw, 660, O); else drawMasteryTrack(rx, ry + 44, rw, 660, def, L, O);
  if(UI.classPick) drawClassPicker(E, cls);
}
function drawClassSlots(E, cls, x, y, w){
  const { def, L, O } = E, std = O.edit < 0, clean = scClean(def, cls), cost = scClassCost(std ? cls : clean), B = scBudget(def);
  label(std ? 'Standard class' : `Editing: ${cls.name}`, x, y + 4, C.amber, 'left', 14);
  T(`${cost} / ${B} points`, x + w, y + 6, { s:17, a:'right', f:FD, w:700, c:cost > B ? C.hostile : C.ink }); bar(x, y + 16, w, 8, Math.min(1, cost/Math.max(1, B)), cost > B ? C.hostile : C.amber);
  if(std) T('Standard can\'t be changed. Pick a class slot on the left to build your own.', x, y + 46, { s:13, c:C.muted, max:w });
  else T(`Points: what Standard is worth (${scClassCost(scStd(def))}) plus ${scBonusPoints(L)} from mastery. Fittings are free.`, x, y + 46, { s:13, c:C.muted, max:w });
  const row = (title, kind, list, n, yy, lockText) => { label(title, x, yy, C.muted, 'left', 13); const cw = (w - 3*10)/4;
    for(let i = 0; i < Math.max(n, lockText ? lockText.length : 0, 1) && i < 4; i++){ const cx = x + i*(cw + 10), cy = yy + 10, id = list[i], locked = i >= n;
      rr(cx, cy, cw, 104, 8); ctx.fillStyle = locked ? 'rgba(8,11,22,.35)' : id ? 'rgba(18,24,44,.92)' : 'rgba(8,11,22,.6)'; ctx.fill(); ctx.strokeStyle = id && !locked ? hexA(kind==='w' ? C.hostile : kind==='d' ? '#f0a6ff' : kind==='a' ? C.amber : C.good, .5) : 'rgba(120,135,170,.22)'; ctx.lineWidth = 1.2; if(!id || locked) ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      if(locked){ T('🔒', cx + cw/2, cy + 44, { s:20, a:'center' }); T(lockText && lockText[i] ? lockText[i] : 'Locked', cx + cw/2, cy + 72, { s:11, a:'center', c:C.muted, max:cw - 12 }); continue; }
      if(id){ const bad = !std && scWhyNot(kind, id, def); para(scName(kind, id) || id, cx + 10, cy + 24, cw - 20, { s:14, lh:17, f:FD, w:700, c:bad ? C.hostile : C.ink, max:2 });
        if(kind!=='p') T(`${scCost(kind, id)} pt${scCost(kind, id)===1 ? '' : 's'}`, cx + cw - 10, cy + 96, { s:12, a:'right', c:C.amber });
        if(kind==='w'){ const gl = gunLevel(id); T(`Gunnery ${gl}`, cx + 10, cy + 96, { s:12, c:gl >= GUN_MAX ? C.amber : C.cyan }); T(bad || (gunBonus(id) ? `+${Math.round(gunBonus(id)*100)}% charge` : GUN_RANK[gl]), cx + 10, cy + 76, { s:11, c:bad ? C.hostile : C.muted, max:cw - 20 }); }
        else para(bad || scStat(kind, id), cx + 10, cy + 62, cw - 20, { s:11, lh:14, c:bad ? C.hostile : C.muted, max:kind==='p' ? 3 : 2 }); }
      else { T('+', cx + cw/2, cy + 52, { s:30, a:'center', c:C.muted }); T('Empty', cx + cw/2, cy + 80, { s:12, a:'center', c:C.muted }); }
      if(!std){ region(cx, cy, cw, 104, () => { UI.classPick = { kind, slot:i, page:0 }; }, `sc:${kind}${i}`); tip(cx, cy, cw, 104, id ? scName(kind, id) : 'Empty slot', id ? scStat(kind, id) + ' Click to change.' : 'Click to choose.'); } } };
  let yy = y + 78;
  row(`Weapons · ${R.weaponSlots} slots`, 'w', cls.w || [], R.weaponSlots, yy); yy += 138;
  if((def.systems || {}).drones){ row(`Drones · ${R.droneSlots} slots`, 'd', cls.d || [], R.droneSlots, yy); } else { label('Drones', x, yy, C.muted, 'left', 13); T('This ship starts without a drone system.', x, yy + 54, { s:14, c:C.muted }); } yy += 138;
  const an = scAugSlots(L, def), aLocks = []; for(let i = 0; i < 3; i++) aLocks.push(i < an ? '' : `Mastery ${i===0 ? 5 : i===1 ? 10 : '—'}`);
  row(`Augments · ${an} slot${an===1 ? '' : 's'}`, 'a', cls.a || [], an, yy, std ? null : aLocks.slice(0, 2)); yy += 138;
  const pn = scPerkSlots(L); row(`Fittings · ${pn} slot${pn===1 ? '' : 's'} · free`, 'p', cls.p || [], std ? 0 : pn, yy, std ? ['', '', ''].map(() => 'Custom classes only') : ['Mastery 2', 'Mastery 6', 'Mastery 12']); yy += 132;
  // does it fit the ship?
  const needW = (cls.w || []).reduce((t, id) => t + (DATA.weapons[id]?.power || 0), 0), haveW = (def.systems || {}).weapons || 0, bump = (cls.p || []).includes('gunroom') ? 1 : 0, notes = [];
  if(needW > haveW + bump) notes.push([`These weapons need ${needW} power; the weapons system starts at ${haveW + bump}. The last ones stay switched off until you upgrade it.`, C.warn]);
  if(!std && cost > B) notes.push([`Over budget by ${cost - B}. The last items will be left on the dock.`, C.hostile]);
  if(!std && !(cls.w || []).length) notes.push(['No weapons at all. Brave.', C.warn]);
  notes.slice(0, 2).forEach((n, i) => para(n[0], x, yy + i*34, w, { s:13, lh:16, c:n[1], max:2 }));
}
function drawMasteryTrack(x, y, w, h, def, L, O){
  const per = 10, pages = Math.ceil(SC_MAX/per); O.page = clamp(O.page == null ? Math.floor((L - 1)/per) : O.page, 0, pages - 1); if(O._auto!==def.id){ O._auto = def.id; O.page = Math.floor((Math.min(SC_MAX, L + 1) - 1)/per); }
  for(let i = 0; i < per; i++){ const lv = O.page*per + i + 1; if(lv > SC_MAX) break; const yy = y + i*60, got = L >= lv, next = lv===L + 1, rw = lv===1 ? ['Standard class', 'Class slot 1', 'Tier 1 weapons'] : scRewards(lv, def);
    rr(x, yy, w, 54, 8); ctx.fillStyle = got ? hexA(C.good, .1) : next ? hexA(C.cyan, .1) : 'rgba(8,11,22,.55)'; ctx.fill(); ctx.strokeStyle = next ? C.cyan : got ? hexA(C.good, .4) : 'rgba(120,135,170,.2)'; ctx.lineWidth = next ? 2 : 1; ctx.stroke();
    T(String(lv), x + 28, yy + 35, { s:22, f:FD, w:700, a:'center', c:got ? C.good : next ? C.cyan : C.muted }); if(got) T('✓', x + w - 20, yy + 34, { s:16, a:'center', c:C.good });
    para(rw.length ? rw.join(' · ') : 'A step closer', x + 56, yy + 23, w - 96, { s:13, lh:17, c:got ? C.ink : C.muted, max:2 }); if(!got) T(`${fmtNum(scXpFor(lv))} xp`, x + w - 12, yy + 48, { s:10, a:'right', c:C.muted }); }
  btn(x, y + per*60 + 6, 100, 38, '‹ 1–10', () => { O.page = 0; }, { s:13, fill:O.page===0 }); btn(x + 110, y + per*60 + 6, 100, 38, '11–20 ›', () => { O.page = 1; }, { s:13, fill:O.page===1 });
  T('Earned by flying this ship.', x + w, y + per*60 + 30, { s:12, a:'right', c:C.muted });
}
function drawGunnery(x, y, w, h, O){
  const ids = Object.keys(DATA.weapons).filter(id => gunXp(id) > 0 && DATA.weapons[id].name).sort((a, b) => gunXp(b) - gunXp(a)), per = 9, pages = Math.max(1, Math.ceil(ids.length/per)); O.page = clamp(O.page || 0, 0, pages - 1);
  if(!ids.length){ para('No gunnery yet. Every weapon you fire on a voyage earns xp, on any ship. At level 2 you can start with it; from level 3 it charges faster wherever you carry it.', x, y + 10, w, { s:14, lh:20, c:C.muted }); return; }
  ids.slice(O.page*per, O.page*per + per).forEach((id, i) => { const yy = y + i*66, d = DATA.weapons[id], gl = gunLevel(id), xp = gunXp(id), a = GUN_XP[gl - 1], b = gl < GUN_MAX ? GUN_XP[gl] : a;
    rr(x, yy, w, 60, 8); ctx.fillStyle = 'rgba(8,11,22,.6)'; ctx.fill(); ctx.strokeStyle = gl >= GUN_MAX ? hexA(C.amber, .6) : 'rgba(120,135,170,.22)'; ctx.lineWidth = 1; ctx.stroke();
    T((gl >= GUN_MAX ? '★ ' : '') + d.name, x + 14, yy + 24, { s:15, f:FD, w:700, c:gl >= GUN_MAX ? C.amber : C.ink, max:w - 150 }); T(`${gl} · ${GUN_RANK[gl]}`, x + w - 14, yy + 24, { s:13, a:'right', c:C.cyan });
    bar(x + 14, yy + 34, w - 28, 5, gl >= GUN_MAX ? 1 : (xp - a)/Math.max(1, b - a), gl >= GUN_MAX ? C.amber : C.hostile);
    T(gl >= GUN_MAX ? '+15% charge · starts fights part-charged' : gunBonus(id) ? `+${Math.round(gunBonus(id)*100)}% charge` : gl >= 2 ? 'Can start a voyage with it' : `${xp}/${GUN_XP[1]} xp to qualify`, x + 14, yy + 54, { s:11, c:C.muted }); if(gl < GUN_MAX) T(`${xp - a}/${b - a}`, x + w - 14, yy + 54, { s:11, a:'right', c:C.muted }); });
  if(pages > 1){ btn(x, y + per*66 + 6, 90, 36, '‹', () => O.page--, { disabled:O.page <= 0, s:15 }); T(`${O.page + 1}/${pages}`, x + w/2, y + per*66 + 30, { s:13, a:'center', c:C.muted }); btn(x + w - 90, y + per*66 + 6, 90, 36, '›', () => O.page++, { disabled:O.page >= pages - 1, s:15 }); }
}
/* choosing what goes in a slot */
function drawClassPicker(E, cls){
  const { def, L } = E, P = UI.classPick, kind = P.kind; ctx.fillStyle = 'rgba(4,6,12,.82)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { UI.classPick = null; });
  const w = 1240, h = 800, x = (W - w)/2, y = (H - h)/2; panel(x, y, w, h, 14); region(x, y, w, h, () => {});
  const key = { w:'w', d:'d', a:'a', p:'p' }[kind], list = cls[key] = cls[key] || [], cur = list[P.slot], B = scBudget(def), others = scClassCost(scClean(def, cls)) - (cur && kind!=='p' && !scWhyNot(kind, cur, def) ? scCost(kind, cur) : 0);
  label({ w:'Choose a weapon', d:'Choose a drone', a:'Choose an augment', p:'Choose a fitting' }[kind], x + 30, y + 42, C.amber, 'left', 17);
  if(kind!=='p') T(`${B - others} point${B - others===1 ? '' : 's'} to spend on this slot`, x + w - 200, y + 42, { s:15, a:'right', c:C.ink });
  btn(x + w - 170, y + 16, 140, 44, 'Cancel', () => { UI.classPick = null; }, { s:15 });
  let ids = kind==='w' ? Object.keys(DATA.weapons).filter(id => DATA.weapons[id].name && !DATA.weapons[id].boss) : kind==='d' ? Object.keys(DATA.drones) : kind==='a' ? Object.keys(DATA.augments) : SC_PERKS.map(p => p[0]);
  const std = scStd(def), known = id => kind==='w' ? (gunXp(id) > 0 || std.w.includes(id)) : kind==='d' ? (scSeen('dr', id) || std.d.includes(id)) : kind==='a' ? (scSeen('au', id) || std.a.includes(id)) : true;
  if(kind!=='p') ids = ids.filter(id => known(id) && !(kind==='w' ? DATA.weapons[id].noLoot && !std.w.includes(id) : kind==='d' ? DATA.drones[id].noLoot && !std.d.includes(id) : DATA.augments[id].noLoot && !std.a.includes(id)));
  const why = id => { const r = scWhyNot(kind, id, def); if(r) return r; if(kind!=='w' && list.includes(id) && list[P.slot]!==id) return 'Already in this class'; if(kind!=='p' && others + scCost(kind, id) > B) return `Costs ${scCost(kind, id)}: ${others + scCost(kind, id) - B} over budget`; return ''; };
  ids.sort((a, b2) => (why(a) ? 1 : 0) - (why(b2) ? 1 : 0) || (kind==='p' ? scPerk(a)[2] - scPerk(b2)[2] : scCost(kind, a) - scCost(kind, b2)) || String(scName(kind, a)).localeCompare(String(scName(kind, b2))));
  const cards = [null, ...ids], cols = 3, rowsN = 6, per = cols*rowsN, pages = Math.max(1, Math.ceil(cards.length/per)); P.page = clamp(P.page || 0, 0, pages - 1); const cw = (w - 60 - 2*12)/3, chh = 100;
  cards.slice(P.page*per, P.page*per + per).forEach((id, i) => { const cx = x + 30 + (i % cols)*(cw + 12), cy = y + 70 + Math.floor(i/cols)*(chh + 10);
    if(id===null){ rr(cx, cy, cw, chh, 8); ctx.fillStyle = 'rgba(8,11,22,.6)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,135,170,.3)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      T('Leave this slot empty', cx + 18, cy + 56, { s:16, c:C.muted }); region(cx, cy, cw, chh, () => { list.splice(P.slot, 1); UI.classPick = null; scTouch(def); }, 'sc:pk:none'); return; }
    const bad = why(id), on = cur===id; rr(cx, cy, cw, chh, 8); ctx.fillStyle = on ? hexA(C.amber, .16) : bad ? 'rgba(8,11,22,.45)' : 'rgba(18,24,44,.92)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : bad ? 'rgba(120,135,170,.18)' : hexA(C.cyan, .4); ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    T(scName(kind, id) || id, cx + 16, cy + 28, { s:16, f:FD, w:700, c:bad ? C.muted : C.ink, max:cw - 110 });
    if(kind!=='p') T(`${scCost(kind, id)} pt${scCost(kind, id)===1 ? '' : 's'}`, cx + cw - 14, cy + 28, { s:14, a:'right', c:bad ? C.muted : C.amber }); else T(`Mastery ${scPerk(id)[2]}`, cx + cw - 14, cy + 28, { s:12, a:'right', c:bad ? C.muted : C.good });
    para(scStat(kind, id), cx + 16, cy + 52, cw - 32, { s:12, lh:15, c:C.muted, max:2 });
    T(bad ? '🔒 ' + bad : kind==='w' ? `Gunnery ${gunLevel(id)} · ${GUN_RANK[gunLevel(id)]}${gunBonus(id) ? ' · +' + Math.round(gunBonus(id)*100) + '% charge' : ''}` : 'Available', cx + 16, cy + 90, { s:12, c:bad ? C.warn : C.good, max:cw - 32 });
    if(!bad) region(cx, cy, cw, chh, () => { if(P.slot >= list.length) list.push(id); else list[P.slot] = id; UI.classPick = null; scTouch(def); }, 'sc:pk:' + id); });
  if(pages > 1){ btn(x + 30, y + h - 62, 130, 44, '‹ Previous', () => P.page--, { disabled:P.page <= 0, s:14 }); T(`Page ${P.page + 1} of ${pages}`, x + w/2, y + h - 34, { s:14, a:'center', c:C.muted }); btn(x + w - 160, y + h - 62, 130, 44, 'Next ›', () => P.page++, { disabled:P.page >= pages - 1, s:14 }); }
  else T(kind==='w' ? 'Weapons appear here once you have fired them on a voyage. Gunnery 2 qualifies you to start with one.' : kind==='p' ? 'Fittings are free. More open as your mastery with this ship grows.' : 'Only things you have used on a voyage can be fitted at the dock.', x + w/2, y + h - 34, { s:13, a:'center', c:C.muted });
}

/* ---------------- the progress report, after every voyage ---------------- */
function drawProgress(){
  const P = UI.progress; if(!P || !P.open) return; const el = (performance.now() - P.t0)/1000, f = Math.min(1, Math.max(0, (el - .4)/1.8)), e = 1 - Math.pow(1 - f, 3);
  ctx.fillStyle = 'rgba(4,6,12,.88)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { if(el < 2.2) P.t0 = performance.now() - 3000; });
  const w = 1000, h = 190 + 150 + (P.cap && P.cap.x1 > P.cap.x0 ? 110 : 0) + Math.min(4, P.guns.length)*58 + (P.guns.length ? 40 : 0) + (P.news.length ? 34 + Math.min(4, P.news.length)*24 : 0), x = (W - w)/2, y = Math.max(30, (H - h)/2); panel(x, y, w, h, 14);
  label('Progress report', x + 36, y + 46, C.cyan, 'left', 16); T('What that voyage taught you', x + 36, y + 90, { s:30, f:FD, w:700, c:C.amber });
  let yy = y + 124; const lerp = (a, b) => a + (b - a)*e;
  { const S = P.ship, xp = lerp(S.x0, S.x1), L = scLevelAt(xp), a = scXpFor(L), b = L < SC_MAX ? scXpFor(L + 1) : a, up = scLevelAt(S.x1) - scLevelAt(S.x0);
    label('Ship mastery', x + 36, yy + 8, C.muted, 'left', 13); T(S.name, x + 36, yy + 44, { s:24, f:FD, w:700, c:C.ink, max:480 }); T(`+${fmtNum(S.x1 - S.x0)} xp`, x + w - 36, yy + 20, { s:18, a:'right', f:FD, w:700, c:C.good });
    T(L >= SC_MAX ? '★ Mastered' : `Mastery ${L}`, x + w - 36, yy + 48, { s:20, a:'right', f:FD, w:700, c:C.cyan }); bar(x + 36, yy + 60, w - 72, 14, L >= SC_MAX ? 1 : (xp - a)/Math.max(1, b - a), C.cyan);
    if(up > 0 && f >= 1){ T(`⬆ ${up} level${up > 1 ? 's' : ''} up`, x + 36, yy + 98, { s:15, c:C.good, f:FD, w:700 }); const rw = []; for(let l = scLevelAt(S.x0) + 1; l <= scLevelAt(S.x1); l++) rw.push(...scRewards(l, DATA.ships[S.id])); T(rw.length ? 'New: ' + rw.join(' · ') : '', x + 180, yy + 98, { s:14, c:C.ink, max:w - 216 }); }
    else if(L < SC_MAX) T(`${fmtNum(Math.round(b - xp))} xp to mastery ${L + 1}`, x + 36, yy + 98, { s:13, c:C.muted });
    yy += 130; }
  if(P.cap && P.cap.x1 > P.cap.x0 && typeof capLevelAt==='function'){ const xp = lerp(P.cap.x0, P.cap.x1), L = capLevelAt(xp), a = capXpFor(L), b = capXpFor(L + 1), up = capLevelAt(P.cap.x1) - capLevelAt(P.cap.x0);
    label('Captain', x + 36, yy + 8, C.muted, 'left', 13); T(`Level ${L}`, x + 36, yy + 40, { s:20, f:FD, w:700, c:C.amber }); T(`+${fmtNum(P.cap.x1 - P.cap.x0)} xp${up > 0 && f >= 1 ? `  ·  ⬆ ${up} level${up > 1 ? 's' : ''} up` : ''}`, x + w - 36, yy + 40, { s:15, a:'right', c:C.good });
    bar(x + 36, yy + 54, w - 72, 10, (xp - a)/Math.max(1, b - a), C.amber); yy += 100; }
  if(P.guns.length){ label('Gunnery', x + 36, yy + 8, C.muted, 'left', 13); yy += 24;
    P.guns.slice(0, 4).forEach(g => { const xp = lerp(g.x0, g.x1), L = gunLevelAt(xp), a = GUN_XP[L - 1], b = L < GUN_MAX ? GUN_XP[L] : a, up = gunLevelAt(g.x1) - gunLevelAt(g.x0), d = DATA.weapons[g.id];
      T(d ? d.name : g.id, x + 36, yy + 20, { s:16, f:FD, w:700, max:330 }); T(`${L} · ${GUN_RANK[L]}`, x + 390, yy + 20, { s:14, c:C.cyan }); bar(x + 540, yy + 10, 280, 10, L >= GUN_MAX ? 1 : (xp - a)/Math.max(1, b - a), C.hostile);
      T(`+${g.x1 - g.x0}${up > 0 && f >= 1 ? ' ⬆' : ''}`, x + w - 36, yy + 20, { s:14, a:'right', c:C.good });
      if(up > 0 && f >= 1) T(gunLevelAt(g.x0) < 2 && gunLevelAt(g.x1) >= 2 ? 'Qualified: you can start a voyage with it' : gunBonus(g.id) ? `Now charges ${Math.round(gunBonus(g.id)*100)}% faster` : '', x + 36, yy + 42, { s:12, c:C.good }); yy += 58; }); yy += 16; }
  if(P.news.length){ label('Along the way', x + 36, yy + 8, C.muted, 'left', 13); yy += 22; P.news.slice(-4).forEach(n => { T('• ' + n, x + 36, yy + 14, { s:13, c:C.ink, max:w - 72 }); yy += 24; }); }
  btn(x + w - 236, y + 30, 200, 50, 'Continue', () => { P.open = false; }, { fill:true, s:17 });
  btn(x + w - 446, y + 30, 200, 50, 'Edit classes', () => { P.open = false; const id = P.ship.id; G = null; if(typeof openHangar==='function') openHangar(); if(DATA.ships[id]){ UI.selShip = id; UI.classOpen = { ship:id, edit:scBook(id).sel, tab:'track', page:0 }; } }, { s:15, col:C.cyan });
}
(function(){
  if(typeof drawEnd==='function'){ const d0 = drawEnd; drawEnd = function(...a){ const r = d0(...a);
    try{ const P = UI.progress; if(P && !(typeof NET!=='undefined' && NET.on) && !UI.debrief){ if(!P.started){ P.started = true; P.t0 = performance.now(); }   // after the Admiralty has had its say
      if(!P.open) btn(660, 46, 280, 52, '📈 Progress report', () => { P.open = true; P.t0 = performance.now() - 3000; }, { s:16, col:C.cyan }); else drawProgress(); } }catch(e){} return r; }; }
})();
