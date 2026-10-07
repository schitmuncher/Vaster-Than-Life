'use strict';
/* =========================================================================
   Run flow: new runs, sectors and the map, events, stores, combat start and
   end, the Flaggship chase, saving and the main update loop.
   ========================================================================= */
let G = null;
const UI = { screen:'title', selCrew:null, selCrews:[], selWeapon:null, mode:null, page:0, selShip:null, toast:null, tab:'systems', storeTab:'weapons', overReason:'', modsPage:0 };
function toast(t){ UI.toast = { text:t, t:2.6 }; }

function newRun(shipId, name){
  applyMods();
  const def = DATA.ships[shipId] || Object.values(DATA.ships)[0];
  const diff = DIFFICULTY[SET.difficulty] || DIFFICULTY.normal;
  G = { shipDef:def.id, ship:makeShip(def,'p',{ name }), enemy:null, proj:[], fx:[], units:[], sector:1, sectorType:'civilian',
    scrap:Math.max(0, R.startScrap + diff.startScrap), fuel:def.fuel ?? 16, missiles:def.missiles ?? 8, parts:def.parts ?? R.startParts,
    paused:false, modal:null, ftl:0, warp:0, warpNode:null, fleetX:-.2, boss:false, dieT:0, shake:0, flash:0, map:null,
    hazard:null, hzT:6, hzWarn:false, nebula:false, autofire:true, combatT:0, time:0, afterWin:null, flag:null, questQueue:[],
    stats:{ kills:0, scrap:0, jumps:0, shotDown:0, boardKills:0 }, dna:[], lost:[] };
  genSector(1, 'civilian');
  PROFILE.runs++; saveProfile();
  UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null;
  emit('runStart', G);
  G.modal = { type:'msg', title:'Sector 1 · Civilian Sector', text:`You command ${G.ship.name}. Your hold carries data that could win the war for the Fedoration, and the Rebuff Fleet wants it back. Cross ${R.sectors} sectors and stop the Flaggship before it reaches Fedoration command.`, btn:'Open map', then:openMap };
  save();
}
function saveReplacer(k, v){ if(k==='adj' || k==='modal' || (typeof k==='string' && k[0]==='_')) return undefined; return v; }
function save(){ if(!G || G.enemy || UI.screen!=='game') return;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify({ G:Object.assign({}, G, { proj:[], fx:[], units:[], warp:0, warpNode:null }), DATA }, saveReplacer)); }catch(e){} }
function loadSave(){
  const s = LS.get(SAVE_KEY, null); if(!s || !s.G || !s.DATA) return false;
  DATA = s.DATA; R = DATA.rules; G = s.G; G.modal = null; G.fx = []; G.proj = []; G.units = [];
  buildGraph(G.ship); UI.screen = 'game'; UI.selCrew = null; UI.selCrews = []; UI.selWeapon = null; UI.mode = null; return true;
}

/* ---------------- sectors & map ---------------- */
function sectorDef(t){ return DATA.sectors[t || G.sectorType] || DATA.sectors.civilian || Object.values(DATA.sectors)[0]; }
function genSector(n, type){
  G.sector = n; G.sectorType = type; const sd = sectorDef(type); const final = !!sd.final;
  PROFILE.maxSector = Math.max(PROFILE.maxSector, n); saveProfile();
  if(n>=3) grant('sector3'); if(n>=5) grant('sector5'); if(final) grant('laststand');
  const cols = final ? 8 : 7, nodes = [], mix = sd.mix || { event:50, combat:30, store:10, empty:10 };
  for(let c=0;c<cols;c++){
    const count = (c===0 || c===cols-1) ? 1 : ri(2,3);
    for(let k=0;k<count;k++){
      const x = clamp((c + (c>0 && c<cols-1 ? rand(-.18,.18) : 0))/(cols-1), 0, 1);
      const y = count===1 ? .5 : clamp((k+.5)/count + rand(-.08,.08), .08, .92);
      let type = wpick(Object.keys(mix), t => mix[t]);
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
  if(!nodes.some(nd=>nd.type==='store') && mids.length) pick(mids).type = 'store';
  G.map = { nodes, cur:0 }; G.fleetX = -.2; G.hazard = null; G.nebula = false;
  while(G.questQueue.length){ const q = G.questQueue.shift(); placeQuest(q); }
  G.flag = null;
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
function openMap(){ UI.selWeapon = null; UI.mode = null; save(); G.modal = { type:'map' }; }
function canJump(){ return !G.enemy || G.enemy.dead || G.ftl>=1; }
function jumpTo(i){
  if(!canJump()){ toast('The VTL drive is still charging.'); return; }
  if(G.fuel<=0){ G.modal = { type:'stranded' }; return; }
  if(G.enemy && !G.enemy.dead){ const aboard = G.enemy.crew.filter(c=>c.owner==='p' && !c.drone); if(aboard.length){ for(const c of aboard) killCrew(G.enemy, c); toast('Crew left aboard the enemy ship are lost.'); } }
  G.fuel--; G.modal = null; leaveCombat(); G.warp = 1; G.warpNode = i; sfx('jump'); haptic(.4, 300);
}
function leaveCombat(){
  if(G.enemy){ for(const c of [...G.ship.crew]) if(c.owner==='e' && c.drone) G.ship.crew.splice(G.ship.crew.indexOf(c),1); }
  G.enemy = null; G.proj = []; G.units = []; G.ftl = 0; G.boss = false; UI.selWeapon = null; UI.mode = null;
  for(const w of G.ship.weapons){ w.charge = 0; w.target = null; }
  for(const d of G.ship.drones){ const bp = DATA.drones[d.id]; if(bp && bp.kind!=='internal') d.unit = null; }
  G.ship.hackLaunched = false; G.ship.hacked = null; G.ship.super = 0; G.ship.cloak.t = 0;
}
function moveFlagship(){
  const f = G.flag; if(!f) return; const nodes = G.map.nodes; const base = nodes.findIndex(n=>n.type==='base');
  if(f.node===base){ f.baseHP--; toast(`The Flaggship is attacking Fedoration command! ${Math.max(0,f.baseHP)} jumps left.`); sfx('alarm');
    if(f.baseHP<=0){ endRun(false, 'The Flaggship destroyed Fedoration command. The war is over, and not in your favour.'); } return; }
  f.step = (f.step||0) + 1; if(f.step % 2) return;
  const prev = { [f.node]:null }, q = [f.node];
  while(q.length){ const k = q.shift(); if(k===base) break; for(const n of nodes[k].links) if(!(n in prev)){ prev[n] = k; q.push(n); } }
  let k = base; if(!(k in prev)) return; while(prev[k]!==f.node && prev[k]!=null) k = prev[k];
  if(nodes[f.node].type==='combat' && !nodes[f.node].visited) nodes[f.node].type = 'empty';
  f.node = k;
}
function arrive(i){
  const node = G.map.nodes[i]; G.map.cur = i;
  const sd = sectorDef();
  G.fleetX += R.fleetSpeed * (sd.fleetMult||1) * (node.nebula ? .7 : 1); G.stats.jumps++; grant('first_jump');
  G.hazard = node.hazard || (node.nebula ? 'nebula' : null); G.nebula = !!node.nebula; G.hzT = rand(5,9); G.hzWarn = false;
  if(G.ship.systems.clonebay && eff(G.ship,'clonebay')>0) for(const c of G.ship.crew) if(c.owner==='p') c.hp = Math.min(c.maxHp, c.hp + 20);
  const first = !node.visited; node.visited = true;
  emit('arrive', node);
  if(G.flag){ moveFlagship(); if(UI.screen!=='game') return;
    if(G.flag.node===i){ startCombat('flag', { boss:true, phase:G.flag.phase, title:G.flag.phase ? 'The Flaggship returns' : 'The Flaggship', text: DATA.enemies[R.bossId]?.phases?.[G.flag.phase]?.name || 'The Rebuff Flaggship fills your viewport.' }); return; } }
  if(node.x < G.fleetX - .02 && node.type!=='base'){
    startCombat('random', { harder:true, title:'Rebuff Fleet', text:'The Rebuff Fleet has overrun this beacon. A fleet warship locks on before your drive cools.' }); return; }
  if(node.type==='base'){ if(first){ G.ship.hull = G.ship.maxHull; G.modal = { type:'msg', title:'Fedoration Command', text:'The base crews patch your hull completely and wish you luck. The Flaggship is coming here. Stop it.' }; } else G.modal = { type:'msg', title:'Fedoration Command', text:'The base is holding. For now.' }; save(); return; }
  if(node.type==='store'){ if(!node.store) node.store = makeStore(); G.modal = { type:'store', node:i }; save(); return; }
  if(!first){ G.modal = { type:'msg', title:'Familiar beacon', text:'You have been here before. Nothing new on sensors.' }; save(); return; }
  if(node.quest){ startEvent(node.quest); return; }
  switch(node.type){
    case 'event': startEvent(pickEvent(node)); break;
    case 'combat': startCombat('random'); break;
    case 'exit': G.modal = { type:'exit', opts:sectorOptions() }; save(); break;
    default: G.modal = { type:'msg', title: G.hazard ? HAZARDS[G.hazard] : 'Quiet beacon', text: hazardText(G.hazard) || 'Empty space. A good place to breathe, patch up and plan.' }; save();
  }
}
function hazardText(h){ return { asteroid:'Asteroids drift through this beacon. Expect the odd rock to hit your shields.', sun:'You are close to a star. Solar flares will start fires aboard.',
  ionstorm:'An ion storm halves your reactor power while you stay here.', pulsar:'A pulsar sends out ion waves that knock out systems and shields.', nebula:'Nebula gas blinds your sensors. The Rebuff Fleet is slower in here too.' }[h]; }
function sectorOptions(){
  if(G.sector+1 >= R.sectors) return ['laststand'];
  const types = Object.keys(DATA.sectors).filter(t => !DATA.sectors[t].final && t!=='civilian');
  shuffle(types); return types.slice(0,2);
}
function nextSector(type){ G.modal = null; G.warp = 1; G.warpNode = 'sector:' + type; sfx('jump'); haptic(.4, 300); }

/* ---------------- events ---------------- */
function pickEvent(node){
  const sd = sectorDef(); const tags = sd.tags || [];
  let list = Object.values(DATA.events).filter(e => !e.questOnly && (e.minSector||1) <= G.sector && (e.maxSector||99) >= G.sector
    && (!e.tags || e.tags.includes('') || e.tags.some(t => tags.includes(t) || t===G.sectorType)) && (!e.nebula || node?.nebula));
  if(node?.distress){ const d = list.filter(e => e.distress); if(d.length) list = d; }
  if(!list.length) return null;
  return wpick(list, e => (e.weight ?? 1) * (e.tags && e.tags.some(t => tags.includes(t)) ? 1.5 : 1) * (e.nebula ? 2 : 1)).id;
}
function startEvent(id){ const ev = id && DATA.events[id]; if(!ev){ G.modal = { type:'msg', title:'Quiet beacon', text:'Static on every channel.' }; return; } emit('event', ev); G.modal = { type:'event', id }; }
function reqHidden(q){ return !!(q && (q.race || q.system || q.weaponType || q.drone || q.augment)); }
function reqMet(q){
  if(!q) return true; const s = G.ship;
  if(q.race && !s.crew.some(c=>c.race===q.race && c.owner==='p')) return false;
  if(q.system && (!s.systems[q.system] || s.systems[q.system].max < (q.level||1))) return false;
  if(q.weaponType && !s.weapons.some(w=>DATA.weapons[w.id]?.type===q.weaponType)) return false;
  if(q.drone && !s.drones.some(d=>d.id===q.drone || DATA.drones[d.id]?.kind===q.drone)) return false;
  if(q.augment && !s.augments.includes(q.augment)) return false;
  if(q.scrap!=null && G.scrap < q.scrap) return false;
  if(q.fuel!=null && G.fuel < q.fuel) return false;
  if(q.missiles!=null && G.missiles < q.missiles) return false;
  if(q.parts!=null && G.parts < q.parts) return false;
  if(q.crewCount!=null && s.crew.filter(c=>c.owner==='p'&&!c.drone).length < q.crewCount) return false;
  return true;
}
function reqLabel(q){ if(!q) return '';
  if(q.race) return `[${DATA.races[q.race]?.name||q.race}] `; if(q.system) return `[${SYSN[q.system]||q.system} ${q.level||1}] `;
  if(q.weaponType) return `[${q.weaponType}] `; if(q.drone) return `[${DATA.drones[q.drone]?.name||q.drone}] `; if(q.augment) return `[${DATA.augments[q.augment]?.name||q.augment}] `; return ''; }
function costLabel(c){ if(!c) return ''; const p=[]; for(const k of ['scrap','fuel','missiles','parts']) if(c[k]) p.push(`${c[k]} ${k==='parts'?'drone parts':k}`); return p.length ? ` (costs ${p.join(', ')})` : ''; }
function chooseOption(ch){
  if(ch.cost){ G.scrap -= ch.cost.scrap||0; G.fuel -= ch.cost.fuel||0; G.missiles -= ch.cost.missiles||0; G.parts -= ch.cost.parts||0; }
  let e = ch.effect || {};
  if(ch.chance!=null) e = Math.random() < ch.chance ? (ch.success||{}) : (ch.fail||{});
  const lines = applyEffect(e);
  G.modal = { type:'result', title:'Outcome', text:e.text||'', lines, after:{ fight:e.fight, event:e.event, store:e.store, afterWin:e.afterWin } };
}
function sign(n){ return (n>0?'+':'') + n; }
function applyEffect(e){
  const L = [], s = G.ship; if(!e) return L;
  const sm = (DIFFICULTY[SET.difficulty]||DIFFICULTY.normal).scrap * (hasAug(s,'scrapArm') ? 1.1 : 1);
  if(e.scrap){ const v = e.scrap>0 ? Math.round(e.scrap*sm) : e.scrap; G.scrap = Math.max(0, G.scrap + v); if(v>0) G.stats.scrap += v; L.push(`${sign(v)} scrap`); }
  if(e.fuel){ G.fuel = Math.max(0, G.fuel + e.fuel); L.push(`${sign(e.fuel)} fuel`); }
  if(e.missiles){ G.missiles = Math.max(0, G.missiles + e.missiles); L.push(`${sign(e.missiles)} missiles`); }
  if(e.parts){ G.parts = Math.max(0, G.parts + e.parts); L.push(`${sign(e.parts)} drone parts`); }
  if(e.hull){ s.hull = clamp(s.hull + e.hull, 0, s.maxHull); L.push(`${sign(e.hull)} hull`); }
  if(e.crew){ const races = Object.keys(DATA.races); const race = e.crew==='random' ? pick(races) : e.crew;
    if(s.crew.filter(c=>c.owner==='p'&&!c.drone).length < R.maxCrew){ const c = addCrew(s, race, 'p'); L.push(`${c.name} the ${DATA.races[c.race].name} joins your crew`); checkCrewAch(); } else L.push('No bunk free for a new crew member'); }
  if(e.crewLoss){ for(let i=0;i<e.crewLoss;i++){ const list = s.crew.filter(c=>c.owner==='p'&&!c.drone); if(list.length<=1) break; const c = pick(list); s.crew.splice(s.crew.indexOf(c),1); L.push(`${c.name} is lost`); } }
  if(e.weapon) L.push(giveWeapon(e.weapon));
  if(e.drone) L.push(giveDrone(e.drone));
  if(e.augment) L.push(giveAugment(e.augment));
  if(e.install){ const opts = Object.keys(INSTALL).filter(k => !s.systems[k] && !(k==='clonebay' && s.systems.medbay) && !(k==='medbay' && s.systems.clonebay));
    const k = e.install==='random' ? pick(opts) : (opts.includes(e.install) ? e.install : null);
    if(k && installSystem(s, k)) L.push(`${SYSN[k]} system installed`); else { G.scrap += 30; L.push('+30 scrap (nothing new to install)'); } }
  if(e.upgrade && s.systems[e.upgrade]){ if(s.systems[e.upgrade].max < (CAPS[e.upgrade]||8)){ s.systems[e.upgrade].max++; L.push(`${SYSN[e.upgrade]} upgraded to level ${s.systems[e.upgrade].max}`); } else { G.scrap += 25; L.push('+25 scrap (already at max)'); } }
  if(e.damageSystem && s.systems[e.damageSystem]){ damageSystem(s, e.damageSystem, 1); L.push(`${SYSN[e.damageSystem]} damaged`); }
  if(e.reactor){ s.reactor = clamp(s.reactor + e.reactor, 1, 25); L.push(`${sign(e.reactor)} reactor power`); }
  if(e.fire){ igniteRoom(s, Math.floor(Math.random()*s.rooms.length)); L.push('A fire has broken out aboard'); }
  if(e.quest){ placeQuest(e.quest); L.push('Quest beacon marked on your map'); }
  if(e.unlock && DATA.ships[e.unlock]){ PROFILE.wins[e.unlock] = PROFILE.wins[e.unlock] || 0; saveProfile(); L.push(`Ship unlocked: ${DATA.ships[e.unlock].name}`); }
  if(e.achievement) grant(e.achievement);
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
function closeResult(m){
  G.modal = null; const a = m.after || {};
  if(a.fight) startCombat(a.fight, { afterWin:a.afterWin });
  else if(a.event) startEvent(a.event);
  else if(a.store){ const n = G.map.nodes[G.map.cur]; if(!n.store) n.store = makeStore(); G.modal = { type:'store', node:G.map.cur }; }
  else save();
}

/* ---------------- combat lifecycle ---------------- */
function pickEnemy(n){
  const sd = sectorDef(); const bias = sd.enemyTags || [];
  let pool = Object.values(DATA.enemies).filter(e => !e.boss && (!e.sectors || (e.sectors[0]<=n && e.sectors[1]>=n)));
  if(!pool.length) pool = Object.values(DATA.enemies).filter(e => !e.boss);
  return wpick(pool, e => (e.tags||[]).some(t=>bias.includes(t)) ? 4 : 1);
}
function startCombat(id, o={}){
  const n = Math.min(G.sector + (o.harder?1:0), 9);
  const def = id==='flag' ? DATA.enemies[R.bossId] : (id && id!=='random' && DATA.enemies[id]) ? DATA.enemies[id] : pickEnemy(n);
  if(!def){ G.modal = { type:'msg', title:'All clear', text:'Sensors show no hostiles.' }; return; }
  G.enemy = makeShip(def, 'e', { sector:n, phase:o.phase||0 });
  G.boss = !!def.boss; G.proj = []; G.units = []; G.ftl = 0; G.dieT = 0; G.combatT = 0; G.afterWin = o.afterWin || null;
  const s = G.ship; s.hacked = null; s.hackLaunched = false;
  if(hasAug(s,'voltanShield')) s.super = Math.max(s.super, 5);
  if(hasAug(s,'preigniter')) for(const w of s.weapons) if(w.on) w.charge = DATA.weapons[w.id]?.charge || 0;
  G.enemy.super = G.enemy.superMax;
  sfx('alarm'); haptic(.3, 200); emit('combatStart', G.enemy);
  G.modal = { type:'msg', title:o.title || 'Hostile contact', text:o.text || `The ${G.enemy.name} powers its weapons. Pick targets, then fire. Pause any time to think.`, btn:'Battle stations' };
}
function offerSurrender(e){
  const n = G.sector; const offer = { scrap: 12 + n*5 + ri(0,10) }; const r = Math.random();
  if(r<.33) offer.fuel = ri(2,4); else if(r<.66) offer.missiles = ri(2,4); else offer.parts = ri(2,4);
  if(Math.random()<.15) offer.weapon = 'random';
  G.modal = { type:'surrender', offer, name:e.name };
}
function finishCombat(kind, offer){
  const e = G.enemy; if(!e) return; const wasBoss = G.boss;
  const aboard = e.crew.filter(c => c.owner==='p' && !c.drone);
  if(kind==='destroyed'){ for(const c of aboard) killCrew(e, c); }
  else for(const c of aboard){ e.crew.splice(e.crew.indexOf(c),1); G.ship.crew.push(c); placeCrew(G.ship, c, Math.max(0, roomOf(G.ship,'teleporter'))); c.mcT = 0; }
  if(kind!=='fled') for(const c of [...G.ship.crew]) if(c.owner==='e') G.ship.crew.splice(G.ship.crew.indexOf(c),1);
  leaveCombat();
  for(const c of G.dna){ c.hp = c.maxHp; c.path = []; c.mcT = 0; G.ship.crew.push(c); placeCrew(G.ship, c, c.station ?? 0); } G.dna = [];
  if(kind==='fled'){ G.modal = { type:'msg', title:'They got away', text:`The ${e.name} jumps away before you can finish it.` }; save(); return; }
  if(wasBoss){ flagDefeated(); return; }
  G.stats.kills++; PROFILE.kills++; saveProfile(); if(PROFILE.kills>=25) grant('kills25');
  if(kind==='crew') grant('boardkill'); if(kind==='surrender') grant('surrender');
  if(G.ship.hull<=3) grant('hullbreadth');
  emit('combatEnd', { kind, enemy:e });
  const L = [];
  if(kind==='surrender') L.push(...applyEffect(offer));
  else {
    const reward = { scrap: ri(10,16) + G.sector*5 + (kind==='crew' ? 12 : 0) };
    if(Math.random()<.45) reward.fuel = ri(1,2); if(Math.random()<.35) reward.missiles = ri(1,3); if(Math.random()<.3) reward.parts = ri(1,2);
    if(Math.random() < (kind==='crew' ? .3 : .12)) reward.weapon = 'random';
    if(Math.random() < .05) reward.augment = 'random';
    if(Math.random() < (kind==='crew' ? .08 : .04)) reward.drone = 'random';
    L.push(...applyEffect(reward));
  }
  if(G.afterWin){ const aw = G.afterWin; G.afterWin = null; L.push(...applyEffect(aw)); if(aw.text) L.unshift(aw.text); }
  G.modal = { type:'result', title: kind==='surrender' ? 'Surrender accepted' : 'Hostile defeated',
    text: kind==='crew' ? `The ${e.name} drifts silent, its crew gone. You strip it bare.` : kind==='surrender' ? `The ${e.name} hands over its cargo and limps away.` : `The ${e.name} breaks apart. Your crew sweeps the debris for anything useful.`, lines:L, after:{} };
}
function flagDefeated(){
  const f = G.flag; grant('phase1');
  if(!f || f.phase >= 2){ endRun(true); return; }
  f.phase++; f.step = 1; moveFlagship();
  G.modal = { type:'msg', title:'The Flaggship retreats', text:`The Flaggship jumps away, damaged but not done. It is heading for Fedoration command. Chase it down. Next: ${DATA.enemies[R.bossId]?.phases?.[f.phase]?.name || 'phase ' + (f.phase+1)}.`, btn:'Open map', then:openMap };
  save();
}
function endRun(win, reason){
  if(win){ PROFILE.wins[G.shipDef] = (PROFILE.wins[G.shipDef]||0) + 1; grant('win'); UI.screen = 'win'; }
  else { grant('rebuffed'); UI.screen = 'over'; UI.overReason = reason || ''; }
  saveProfile(); LS.del(SAVE_KEY); emit('runEnd', { win });
}

/* ---------------- stores & upgrades ---------------- */
function makeStore(){
  const s = G.ship;
  const wp = Object.values(DATA.weapons).filter(w=>!w.noLoot).map(w=>w.id); shuffle(wp);
  const dp = Object.values(DATA.drones).filter(d=>!d.noLoot).map(d=>d.id); shuffle(dp);
  const ap = Object.keys(DATA.augments).filter(k => !s.augments.includes(k)); shuffle(ap);
  const sp = Object.keys(INSTALL).filter(k => !s.systems[k] && !(k==='clonebay' && s.systems.medbay) && !(k==='medbay' && s.systems.clonebay)); shuffle(sp);
  return { weapons:wp.slice(0,3), drones:dp.slice(0,2), augments:ap.slice(0,2), systems:sp.slice(0,2), sold:[], crewRace:pick(Object.keys(DATA.races)), crewSold:false, discount: G.sectorType==='pyrate' ? .85 : 1 };
}
function price(v, st){ return Math.round(v * (st?.discount||1)); }
function buy(cost, fn){ if(G.scrap < cost){ toast('Not enough scrap.'); return false; } G.scrap -= cost; fn(); sfx('buy'); save(); return true; }
function upgradeCost(k, lv){ const c = UPCOST[k] || [25,15]; return c[0] + c[1]*lv; }
function reactorCost(){ return 15 + G.ship.reactor*3; }
function sellValue(kind, id){ const d = kind==='weapon' ? DATA.weapons[id] : kind==='drone' ? DATA.drones[id] : DATA.augments[id]; return Math.floor((d?.cost||20)/2); }

/* ---------------- main update ---------------- */
function update(dt){
  updateStars(dt);
  if(UI.toast){ UI.toast.t -= dt; if(UI.toast.t<=0) UI.toast = null; }
  if(UI.screen!=='game' || !G) return;
  for(const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < 1.1);
  G.shake = Math.max(0, G.shake - dt*2); G.flash = Math.max(0, (G.flash||0) - dt*1.5);
  if(G.warp>0){ G.warp -= dt;
    if(G.warpNode!=null && G.warp < .5){ const n = G.warpNode; G.warpNode = null;
      if(typeof n==='string' && n.startsWith('sector:')){ const t = n.slice(7); genSector(G.sector+1, t);
        G.modal = { type:'msg', title:`Sector ${G.sector} · ${sectorDef().name}`, text: sectorDef().final ? 'The Last Stand. The Flaggship is heading for Fedoration command at the far end of this sector. Catch it, three times, before it gets there.' : 'A fresh sector, and the Rebuff Fleet is already plotting its pursuit.', btn:'Open map', then:openMap }; save(); }
      else arrive(n); } }
  const live = !G.paused && !G.modal && G.warp<=0;
  if(live){
    G.time += dt;
    const foe = G.enemy && !G.enemy.dead ? G.enemy : null;
    if(foe) G.combatT += dt;
    tickShip(G.ship, dt, foe);
    if(foe){ tickShip(foe, dt, G.ship); enemyBrain(foe, G.ship, dt); }
    deployDrones(G.ship, foe); if(foe) deployDrones(foe, G.ship);
    tickUnits(dt);
    for(const p of G.proj) p.t += dt;
    const done = G.proj.filter(p => p.t >= p.dur); G.proj = G.proj.filter(p => p.t < p.dur);
    done.forEach(resolve);
    tickHazard(dt);
    if(foe){
      const s = G.ship; const ok = eff(s,'engines')>0 && eff(s,'piloting')>0 && (manned(s,'piloting') || eff(s,'piloting')>=2);
      if(ok && G.ftl<1) G.ftl = Math.min(1, G.ftl + dt*(.02 + .006*eff(s,'engines')));
      if(foe.fleeT!=null && !foe.dead){ if(eff(foe,'engines')>0 && (manned(foe,'piloting') || foe.auto)) foe.fleeT -= dt; if(foe.fleeT<=0){ finishCombat('fled'); return; } }
    }
    if(G.enemy && G.enemy.dead){ G.dieT -= dt; if(G.dieT<=0){ finishCombat(G.enemy.deadKind || 'destroyed'); } }
    emit('tick', dt);
  }
  if(G.enemy && !G.enemy.dead && !G.modal){
    const e = G.enemy;
    if(e.hull<=0){ e.dead = true; e.deadKind = 'destroyed'; G.dieT = 1.3; G.proj = G.proj.filter(p=>p.from!=='e'); G.units = G.units.filter(u=>u.side!=='e');
      const b = e._b; if(b) for(let i=0;i<6;i++) fx('boom', rand(b.x0,b.x1), rand(b.y0,b.y1)); sfx('hit'); haptic(.6, 300); }
    else if(!e.auto && ownerCrewCount('e')===0){ e.dead = true; e.deadKind = 'crew'; G.dieT = .8; G.proj = G.proj.filter(p=>p.from!=='e'); G.units = G.units.filter(u=>u.side!=='e'); }
  }
  if(UI.screen==='game' && (G.ship.hull<=0 || ownerCrewCount('p')===0)){
    endRun(false, G.ship.hull<=0 ? 'Your hull gave out. The Rebuff Fleet collects the pieces.' : 'Your last crew member is gone. The ship drifts on, empty.'); }
}
