'use strict';
/* =========================================================================
   Ships: layout generation, doors and airlocks, pathfinding, crew.
   Rooms sit on a cell grid. Doors join adjacent rooms; airlocks open to space.
   ========================================================================= */
const BIG_ORDER = ['shields','weapons','medbay','clonebay','drones','teleporter','cloaking','hacking','mindcontrol','engines','oxygen'];
const SMALL_ORDER = ['oxygen','sensors','doors','battery'];

function autoPattern(list){
  const smalls = list.filter(k => SMALL_ORDER.includes(k)).length;
  const bigs = list.filter(k => !SMALL_ORDER.includes(k) && k!=='piloting' && k!=='engines').length;
  const cols = ['T']; let bigCap = 1, smallCap = 0;
  const seq = ['A','B','A','C','B','A'];
  let i = 0;
  while(bigCap < bigs + 2 || smallCap < smalls){ const c = seq[i++ % seq.length]; cols.push(c);
    if(c==='A'){ bigCap += 1; smallCap += 2; } else if(c==='B') bigCap += 2; else if(c==='C') bigCap += 1; if(cols.length>9) break; }
  cols.push('N'); return cols.join('');
}
function genLayout(list, pattern){
  pattern = pattern || autoPattern(list);
  const slots = []; let x = 0;
  for(const col of pattern){
    if(col==='T'){ slots.push({ x, y:1, w:2, h:2, big:true, tail:true }); x += 2; }
    else if(col==='A'){ slots.push({ x, y:0, w:2, h:1 }, { x, y:1, w:2, h:2, big:true }, { x, y:3, w:2, h:1 }); x += 2; }
    else if(col==='B'){ slots.push({ x, y:0, w:2, h:2, big:true }, { x, y:2, w:2, h:2, big:true }); x += 2; }
    else if(col==='C'){ slots.push({ x, y:1, w:2, h:2, big:true }); x += 2; }
    else if(col==='D'){ slots.push({ x, y:0, w:1, h:2 }, { x, y:2, w:1, h:2 }); x += 1; }
    else if(col==='N'){ slots.push({ x, y:1, w:1, h:2, nose:true }); x += 1; }
  }
  const rooms = slots.map(s => ({ sys:'', x:s.x, y:s.y, w:s.w, h:s.h }));
  const used = new Set(), done = new Set();
  const nose = slots.findIndex(s=>s.nose);
  if(nose>=0){ rooms[nose].sys = 'piloting'; used.add(nose); done.add('piloting'); }
  const tail = slots.findIndex(s=>s.tail);
  if(tail>=0 && list.includes('engines')){ rooms[tail].sys = 'engines'; used.add(tail); done.add('engines'); }
  const bigFree = () => slots.map((s,i)=>i).filter(i => slots[i].big && !used.has(i));
  const smallFree = () => slots.map((s,i)=>i).filter(i => !slots[i].big && !slots[i].nose && !used.has(i));
  const want = list.filter(k => !done.has(k));
  // weapons and shields toward the front, life support toward the back
  const bigWant = want.filter(k => !SMALL_ORDER.includes(k)).sort((a,b)=>BIG_ORDER.indexOf(a)-BIG_ORDER.indexOf(b));
  const smallWant = want.filter(k => SMALL_ORDER.includes(k));
  for(const k of bigWant){ const free = bigFree(); let i;
    if(k==='weapons' || k==='shields') i = free[free.length-1]; else i = free[Math.floor(free.length/2)] ?? free[0];
    if(i==null){ const sf = smallFree(); i = sf[0]; }
    if(i==null){ rooms.push({ sys:k, x, y:1, w:2, h:2 }); x += 2; continue; }
    rooms[i].sys = k; used.add(i); }
  for(const k of smallWant){ let i = smallFree()[0]; if(i==null) i = bigFree()[0];
    if(i==null){ rooms.push({ sys:k, x, y:1, w:1, h:2 }); x += 1; continue; }
    rooms[i].sys = k; used.add(i); }
  return rooms;
}
function cellsOf(r){ const out=[]; for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) out.push([x,y]); return out; }
function makeDoors(sh){
  const doors = [], rooms = sh.rooms, key = (x,y)=>x+','+y;
  for(let i=0;i<rooms.length;i++) for(let j=i+1;j<rooms.length;j++){
    const pairs = [];
    for(const [x,y] of cellsOf(rooms[i])) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if(sh.cellRoom[key(x+dx,y+dy)]===j) pairs.push([[x,y],[x+dx,y+dy]]); }
    if(pairs.length){ const p = pairs[Math.floor((pairs.length-1)/2)]; doors.push({ a:i, b:j, ca:p[0], cb:p[1], open:false, passT:0, brk:0, broken:0 }); }
  }
  // airlocks: one on top edge and one on bottom edge, preferring empty rooms
  const pickEdge = (top) => {
    const cand = rooms.map((r,i)=>i).filter(i => top ? rooms[i].y===0 : rooms[i].y+rooms[i].h===sh.gh).filter(i => rooms[i].sys!=='piloting');
    cand.sort((a,b) => (rooms[a].sys?1:0) - (rooms[b].sys?1:0)); return cand[0];
  };
  const t = pickEdge(true), b = pickEdge(false);
  if(t!=null){ const r = rooms[t]; const cx = r.x + Math.floor(r.w/2); doors.push({ a:t, b:-1, ca:[cx,r.y], cb:[cx,r.y-1], open:false, passT:0, brk:0, broken:0 }); }
  if(b!=null && b!==t){ const r = rooms[b]; const cx = r.x + Math.floor(r.w/2); doors.push({ a:b, b:-1, ca:[cx,r.y+r.h-1], cb:[cx,r.y+r.h], open:false, passT:0, brk:0, broken:0 }); }
  return doors;
}
function buildGraph(sh){
  sh.cellRoom = {}; sh.gw = 0; sh.gh = 0;
  sh.rooms.forEach((r,i) => { for(const [x,y] of cellsOf(r)) sh.cellRoom[x+','+y] = i; sh.gw = Math.max(sh.gw, r.x+r.w); sh.gh = Math.max(sh.gh, r.y+r.h); });
  if(!sh.doors || !sh.doors.length) sh.doors = makeDoors(sh);
  const adj = {};
  for(const k in sh.cellRoom){ const [x,y] = k.split(',').map(Number), ri_ = sh.cellRoom[k]; adj[k] = [];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nk = (x+dx)+','+(y+dy); if(sh.cellRoom[nk]===ri_) adj[k].push({ k:nk, d:-1 }); } }
  sh.doors.forEach((d,i) => { if(d.b<0) return; const ka = d.ca.join(','), kb = d.cb.join(','); if(adj[ka] && adj[kb]){ adj[ka].push({ k:kb, d:i }); adj[kb].push({ k:ka, d:i }); } });
  sh.adj = adj;
}
function findPath(sh, from, to){
  const s = from.join(','), t = to.join(','); if(s===t) return [];
  if(!sh.adj[s] || !sh.adj[t]) return null;
  const prev = { [s]:null }, q = [s];
  while(q.length){ const k = q.shift(); if(k===t) break; for(const n of sh.adj[k]) if(!(n.k in prev)){ prev[n.k] = k; q.push(n.k); } }
  if(!(t in prev)) return null;
  const path = []; let k = t; while(k!==s){ path.unshift(k.split(',').map(Number)); k = prev[k]; }
  return path;
}
function doorBetween(sh, a, b){ const ka = a.join(','), kb = b.join(','); for(const n of (sh.adj[ka]||[])) if(n.k===kb) return n.d; return -1; }
function roomDist(sh, a, b){ const ra = sh.rooms[a], rb = sh.rooms[b]; return Math.hypot((ra.x+ra.w/2)-(rb.x+rb.w/2), (ra.y+ra.h/2)-(rb.y+rb.h/2)); }

/* ---------------- crew ---------------- */
function crewSide(c){ return c.mcT>0 ? (c.owner==='p' ? 'e' : 'p') : c.owner; }
function newCrew(race, owner, name){
  const rid = DATA.races[race] ? race : 'human', r = DATA.races[rid];
  return { id:uid(), name:name||pick(NAMES), race:rid, hp:r.hp, maxHp:r.hp, owner, mcT:0, stunT:0, x:0, y:0, tx:0, ty:0, path:[], room:0,
    station:null, sk:{ pilot:0, engines:0, shields:0, weapons:0, repair:0, combat:0 }, kills:0, drone:null, aiT:Math.random() };
}
function newDroneUnit(bpId, owner){
  const bp = DATA.drones[bpId]; const hp = 150;
  return { id:uid(), name:bp.name, race:'drone', hp, maxHp:hp, owner, mcT:0, stunT:0, x:0, y:0, tx:0, ty:0, path:[], room:0,
    station:null, sk:{ pilot:0, engines:0, shields:0, weapons:0, repair:0, combat:0 }, kills:0, drone:bpId, aiT:0 };
}
function raceOf(c){ return c.drone ? { name:'Drone', color:'#f0a6ff', hp:150, repair: DATA.drones[c.drone]?.role==='repair' ? 2 : 0,
  combat: DATA.drones[c.drone]?.role==='repair' ? 0 : DATA.drones[c.drone]?.kind==='boarding' ? 1.2 : 1.5, speed:1, fireproof:true, noAir:true } : (DATA.races[c.race] || DATA.races.human); }
function cellTaken(sh, x, y, side, except){ return sh.crew.some(o => o!==except && crewSide(o)===side && (o.path.length ? (o.tx===x && o.ty===y) : (Math.round(o.x)===x && Math.round(o.y)===y))); }
function freeCell(sh, ri_, c, side){
  const r = sh.rooms[ri_]; if(!r) return null; side = side || (c ? crewSide(c) : sh.side);
  for(const [x,y] of cellsOf(r)) if(!cellTaken(sh, x, y, side, c)) return { x, y };
  return null;
}
function roomCount(sh, ri_, side){ return sh.crew.filter(o => crewSide(o)===side && (o.path.length ? sh.cellRoom[o.tx+','+o.ty]===ri_ : o.room===ri_)).length; }
function placeCrew(sh, c, ri_){
  let cell = freeCell(sh, ri_, c);
  if(!cell){ for(let i=0;i<sh.rooms.length && !cell;i++){ cell = freeCell(sh, i, c); if(cell) ri_ = i; } }
  if(!cell){ const r = sh.rooms[ri_] || sh.rooms[0]; cell = { x:r.x, y:r.y }; }
  c.x = c.tx = cell.x; c.y = c.ty = cell.y; c.path = []; c.room = sh.cellRoom[cell.x+','+cell.y] ?? ri_;
}
function stationOrder(sh){ return ['piloting','weapons','shields','engines','sensors','doors','oxygen','medbay','drones','teleporter','cloaking','hacking','mindcontrol','clonebay','battery'].map(k=>roomOf(sh,k)).filter(i=>i>=0); }
function stationRoom(sh){
  for(const i of stationOrder(sh)) if(sh.crew.filter(c=>c.owner===sh.side && !c.drone && c.station===i).length < 1) return i;
  for(let i=0;i<sh.rooms.length;i++) if(freeCell(sh,i,null,sh.side)) return i;
  return 0;
}
function addCrew(sh, race, owner, name){
  owner = owner || sh.side; const c = newCrew(race, owner, name);
  const st = stationRoom(sh); c.station = st; sh.crew.push(c); placeCrew(sh, c, st); return c;
}
function orderMove(sh, c, ri_){
  const cell = freeCell(sh, ri_, c); if(!cell) return false;
  const from = [Math.round(c.x), Math.round(c.y)];
  const path = findPath(sh, from, [cell.x, cell.y]); if(!path) return false;
  c.path = path; c.tx = cell.x; c.ty = cell.y; return true;
}
function roomOf(sh, k){ return sh.rooms.findIndex(r => r.sys===k); }

/* ---------------- ship construction ---------------- */
function scaledEnemySystems(def, sector){
  const s = Object.assign({}, def.systems||{});
  if(def.boss) return s;
  if(sector>=5 && ((s.shields||0)>0 || sector>=6)) s.shields = Math.min(8, (s.shields||0) + 2);
  if(sector>=8) s.shields = Math.min(8, (s.shields||0) + 2);
  s.weapons = Math.min(8, (s.weapons||1) + Math.floor((sector-1)/2));
  s.engines = Math.min(8, (s.engines||1) + Math.floor((sector-1)/3));
  if(s.drones) s.drones = Math.min(8, s.drones + Math.floor((sector-1)/3));
  if(sector>=4 && !s.sensors) s.sensors = 1;
  return s;
}
function makeShip(def, side, o={}){
  const sector = o.sector || 1, enemy = side==='e';
  const phase = def.phases ? def.phases[Math.min(o.phase||0, def.phases.length-1)] : null;
  const sys = enemy ? scaledEnemySystems(def, sector) : Object.assign({}, def.systems||{});
  sys.piloting = Math.max(1, sys.piloting||1);
  if(!sys.doors && !def.auto) sys.doors = 1;
  const installed = SYS.filter(k => (sys[k]||0) > 0);
  const roomSys = [...installed, ...((def.reserve||[]).filter(k => SYS.includes(k) && !installed.includes(k)))];
  let rooms = Array.isArray(def.rooms) && def.rooms.length ? clone(def.rooms) : genLayout(roomSys, def.pattern);
  let maxX = 0; rooms.forEach(r => maxX = Math.max(maxX, r.x + r.w));
  for(const k of installed){ if(!rooms.some(r=>r.sys===k)){ const free = rooms.find(r=>!r.sys); if(free) free.sys = k; else { rooms.push({ sys:k, x:maxX, y:1, w:2, h:2 }); maxX += 2; } } }
  rooms.forEach(r => Object.assign(r, { o2:100, fire:0, fireP:0, fireOut:0, fireDmg:0, breach:0, breachP:0, sab:0 }));
  const diff = DIFFICULTY[SET.difficulty] || DIFFICULTY.normal;
  let hull = phase?.hull ?? def.hull;
  if(enemy && !def.boss) hull += Math.round(1.5*(sector-1)) + diff.enemyHull;
  if(enemy && def.boss) hull += diff.enemyHull*2;
  const sh = { side, isEnemy:enemy, id:def.id, name:o.name || def.name || def.id, cls:def.cls||'', color:def.color || (enemy?C.hostile:C.amber),
    boss:!!def.boss, phase:o.phase||0, auto:!!def.auto, image:def.image||null,
    hull, maxHull:hull, reactor:def.reactor || (enemy ? 30 : 8), systems:{}, rooms, doors:null, weapons:[], drones:[], augments:[...(def.augments||[])],
    crew:[], shield:0, shieldT:0, super:0, superMax:phase?.super ?? def.super ?? 0, superRegen:phase?.superRegen||0, superT:0, surge:phase?.surge||0, surgeT:phase?.surge||0,
    board:!!phase?.board, cloak:{ t:0, cd:0 }, battery:{ t:0, cd:0 }, tele:{ cd:enemy?12:0 }, mc:{ cd:enemy?10:0 }, hacked:null, hackLaunched:false,
    clones:[], dead:false, fleeT:null, fled:false, surrenderAsked:false, aiT:0, ftl:0 };
  for(const k of SYS){ const lv = Math.round(sys[k]||0); if(lv>0) sh.systems[k] = { max:Math.min(CAPS[k]||8, lv), power:0, dmg:0, ion:0, ionT:0, rep:0, prev:0 }; }
  if(enemy){ for(const k of MAIN) if(sh.systems[k]) sh.systems[k].power = sh.systems[k].max; }
  else { let left = sh.reactor; const order = ['shields','engines','oxygen','weapons','drones','teleporter','cloaking','hacking','mindcontrol','medbay','clonebay'];
    for(const k of order){ const y = sh.systems[k]; if(!y) continue; const p = Math.min(y.max, left); y.power = p; left -= p; } }
  buildGraph(sh);
  let wl = (phase?.weapons || def.weapons || []).filter(id => DATA.weapons[id]);
  if(enemy && !def.boss){
    const want = Math.min(4, Math.max(wl.length, 1 + Math.floor(sector/2.5)));
    const pool = Object.values(DATA.weapons).filter(w => !w.heal && (w.tier||1) <= 1 + Math.floor(sector/3)).map(w=>w.id);
    while(wl.length < want && pool.length) wl.push(pick(pool));
  }
  sh.weapons = wl.slice(0, enemy ? 4 : R.weaponSlots).map(id => ({ id, charge:0, on:false, target:null }));
  sh.drones = (phase?.drones || def.drones || []).filter(id => DATA.drones[id]).slice(0, enemy ? 4 : R.droneSlots).map(id => ({ id, on:enemy, unit:null }));
  const crewList = [...(def.crew||[])];
  if(enemy && !def.auto && !def.boss) for(let i=0;i<Math.floor((sector-1)/3) && crewList.length<6;i++) crewList.push(pick(crewList.length?crewList:['human']));
  if(!enemy && !crewList.length) crewList.push('human');
  for(const r of crewList) addCrew(sh, r, side);
  autoPowerWeapons(sh); autoPowerDrones(sh, false);
  if(!enemy) sh.drones.forEach(d => d.on = false);
  return sh;
}
function installSystem(sh, k){
  if(sh.systems[k]) return false;
  let room = sh.rooms.find(r => r.sys===k);
  if(!room){ room = sh.rooms.find(r => !r.sys && r.w*r.h>=4) || sh.rooms.find(r => !r.sys); }
  if(!room){ const maxX = Math.max(...sh.rooms.map(r=>r.x+r.w)); room = { sys:k, x:maxX, y:1, w:2, h:2, o2:100, fire:0, fireP:0, fireOut:0, fireDmg:0, breach:0, breachP:0, sab:0 }; sh.rooms.push(room); sh.doors = null; buildGraph(sh); }
  room.sys = k;
  sh.systems[k] = { max:1, power:0, dmg:0, ion:0, ionT:0, rep:0, prev:0 };
  if(!SUB.includes(k) && reactorFree(sh)>0) sh.systems[k].power = 1;
  return true;
}
