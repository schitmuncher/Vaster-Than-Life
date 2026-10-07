'use strict';
/* =========================================================================
   Simulation: power, systems, crew, fire, oxygen, weapons, drones, AI, hazards.
   ========================================================================= */
const SKILL_FOR = { piloting:'pilot', engines:'engines', shields:'shields', weapons:'weapons' };
function shipBySide(s){ return s==='p' ? G.ship : s==='e' ? G.enemy : null; }
function otherSide(s){ return s==='p' ? 'e' : 'p'; }
function hasAug(sh, id){ return !!(sh && sh.augments && sh.augments.includes(id)); }
function hackedNow(sh, k){ const h = sh.hacked; return !!(h && h.attached && h.pulseT>0 && sh.rooms[h.room] && sh.rooms[h.room].sys===k); }
function bonusPower(sh, k){ const i = roomOf(sh,k); if(i<0) return 0; let b = 0;
  for(const c of sh.crew){ if(c.drone || c.path.length || c.room!==i || crewSide(c)!==sh.side) continue; b += (DATA.races[c.race]?.power||0); } return b; }
function eff(sh, k){
  const s = sh.systems[k]; if(!s) return 0;
  if(k==='sensors' && G && G.nebula) return 0;
  let e = SUB.includes(k) ? s.max : s.power + bonusPower(sh,k);
  e = Math.min(e, s.max - s.dmg);
  if(s.ionT>0) e -= s.ion;
  if(hackedNow(sh,k)) return 0;
  return Math.max(0, e);
}
function lvlIdx(sh, k){ return clamp(eff(sh,k)-1, 0, 2); }
function reactorAvail(sh){ let r = sh.reactor; if(G && G.hazard==='ionstorm') r = Math.floor(r/2); if(sh.battery.t>0) r += sh.battery.extra||2; return r; }
function reactorUsed(sh){ let u = 0; for(const k of MAIN) u += sh.systems[k]?.power||0; return u; }
function reactorFree(sh){ return reactorAvail(sh) - reactorUsed(sh); }
function shedPower(sh){
  let over = reactorUsed(sh) - reactorAvail(sh); if(over<=0) return;
  for(const k of SHED_ORDER){ const s = sh.systems[k]; while(over>0 && s && s.power>0){ if(!sh.isEnemy) s.prev = Math.max(s.prev, s.power); s.power--; over--; } }
  weaponBudget(sh); droneBudget(sh);
}
const SHED_ORDER = ['clonebay','medbay','mindcontrol','hacking','cloaking','teleporter','drones','engines','weapons','oxygen','shields'];
/* when power comes back (storm passes, battery recharged, repairs), restore what was lost */
function restorePower(sh){
  if(sh.isEnemy || reactorFree(sh)<=0) return;
  for(const k of [...SHED_ORDER].reverse()){ const s = sh.systems[k]; if(!s || s.prev<=s.power) continue;
    if(s.power < s.max - s.dmg && reactorFree(sh)>0){ s.power++; if(k==='weapons') autoPowerWeapons(sh); if(s.power>=s.prev) s.prev = 0; return; } }
}
function addPower(sh, k){
  const s = sh.systems[k]; if(!s || SUB.includes(k)) return 'none';
  if(s.power >= s.max - s.dmg) return s.dmg ? 'damaged' : 'full';
  if(reactorFree(sh)<=0) return 'reactor';
  s.power++; if(k==='weapons') autoPowerWeapons(sh); return 'ok';
}
function removePower(sh, k){ const s = sh.systems[k]; if(!s || s.power<=0) return; s.power--; s.prev = 0; if(k==='weapons') weaponBudget(sh); if(k==='drones') droneBudget(sh); }
function shieldLayers(sh){ return Math.floor(eff(sh,'shields')/2); }
function hostilesFor(sh, i, side){ for(const o of sh.crew) if(o.room===i && crewSide(o)!==side) return true; return false; }
function enemySkill(){ return G ? clamp(Math.floor((G.sector-1)/3), 0, 2) : 0; }
function skillLvl(c, s){ if(!c || c.drone) return 0; if(c.owner==='e') return enemySkill(); const t = SKILLT[s], v = c.sk[s]||0; return v>=t[1] ? 2 : v>=t[0] ? 1 : 0; }
function gainXP(c, s, amt){ if(!c || c.drone || c.owner!=='p') return; const before = skillLvl(c,s); c.sk[s] = (c.sk[s]||0) + amt*(DATA.races[c.race]?.learn||1);
  if(skillLvl(c,s) > before) toast(`${c.name} is now ${skillLvl(c,s)===2?'an expert':'skilled'} at ${SKILLN[s]}.`); }
function mannedCrew(sh, k){
  if(sh.auto) return null; const i = roomOf(sh,k); if(i<0 || !sh.systems[k]) return null;
  let best = null;
  for(const c of sh.crew){ if(c.drone || c.path.length || c.room!==i || crewSide(c)!==sh.side || c.stunT>0) continue;
    if(hostilesFor(sh, i, sh.side)) continue;
    if(!best || skillLvl(c, SKILL_FOR[k]||'repair') > skillLvl(best, SKILL_FOR[k]||'repair')) best = c; }
  return best;
}
function manned(sh, k){ return sh.auto ? !!sh.systems[k] : !!mannedCrew(sh,k); }
function evasion(sh){
  let base = 0; const eng = eff(sh,'engines'), pil = eff(sh,'piloting');
  if(eng>0 && pil>0){
    base = eng*5;
    if(sh.auto) base += 5;
    else { const pc = mannedCrew(sh,'piloting');
      if(pc) base += [5,7,10][skillLvl(pc,'pilot')];
      else if(pil>=2) base *= pil>=3 ? .8 : .5; else base = 0;
      const ec = mannedCrew(sh,'engines'); if(ec && base>0) base += [5,7,10][skillLvl(ec,'engines')]; }
  }
  if(sh.cloak.t>0) base += 60;
  if(hasAug(sh,'stealth')) base += 5;
  return Math.min(95, Math.round(base));
}
function weaponPowerUsed(sh){ return sh.weapons.reduce((t,w)=>t + (w.on ? (DATA.weapons[w.id]?.power||0) : 0), 0); }
function weaponBudget(sh){ let cap = eff(sh,'weapons'); for(const w of sh.weapons){ if(!w.on) continue; const p = DATA.weapons[w.id]?.power||0; if(p<=cap) cap -= p; else { w.on = false; w.target = null; } } }
function autoPowerWeapons(sh){ let free = eff(sh,'weapons') - weaponPowerUsed(sh); for(const w of sh.weapons){ const p = DATA.weapons[w.id]?.power||0; if(!w.on && p<=free){ w.on = true; free -= p; } } }
function dronePowerUsed(sh){ return sh.drones.reduce((t,d)=>t + (d.on ? (DATA.drones[d.id]?.power||0) : 0), 0); }
function droneBudget(sh){ let cap = eff(sh,'drones'); for(const d of sh.drones){ if(!d.on) continue; const p = DATA.drones[d.id]?.power||0; if(p<=cap) cap -= p; else { d.on = false; removeDrone(sh, d); } } }
function autoPowerDrones(sh){ let free = eff(sh,'drones') - dronePowerUsed(sh); for(const d of sh.drones){ const p = DATA.drones[d.id]?.power||0; if(!d.on && p<=free && DATA.drones[d.id].kind!=='hull'){ d.on = true; free -= p; } } }

/* ---------------- damage ---------------- */
function damageSystem(sh, k, n){
  const s = sh.systems[k]; if(!s || n<=0) return;
  if(!sh.isEnemy) s.prev = Math.max(s.prev, s.power);
  s.dmg = Math.min(s.max, s.dmg + n);
  if(!sh.isEnemy) s.power = Math.min(s.power, s.max - s.dmg);
  if(k==='weapons') weaponBudget(sh);
  if(k==='drones') droneBudget(sh);
  if(k==='cloaking' && eff(sh,'cloaking')<=0 && sh.cloak.t>0){ sh.cloak.t = 0; sh.cloak.cd = 20; }
}
function ionize(sh, k, n){
  const s = sh.systems[k]; if(!s) return;
  if(hasAug(sh,'ionField') && Math.random()<.2){ fxAtRoom(sh, roomOf(sh,k), 'text', 'RESISTED'); return; }
  s.ion = Math.min(s.max, s.ion + n); s.ionT = 6;
  if(k==='weapons') weaponBudget(sh); if(k==='drones') droneBudget(sh);
}
function igniteRoom(sh, ri_){ const r = sh.rooms[ri_]; if(!r) return; r.fire = Math.min(r.w*r.h, r.fire + 1); }
function roomCenter(sh, ri_){ const q = sh._rects?.[ri_]; return q ? { x:q.x+q.w/2, y:q.y+q.h/2 } : { x: sh.isEnemy ? 1200 : 400, y:330 }; }
function fx(type, x, y, text){ G.fx.push({ type, x, y, t:0, text }); }
function fxAtProj(p, sh, type){ if(p._x!=null){ fx(type, p._x, p._y); sparks(p._x, p._y, type==='super' ? '#7be0a0' : '#bff4ff', 8); } else fxAtRoom(sh, p.room, type); }
function fxAtRoom(sh, ri_, type, text){ const c = roomCenter(sh, ri_); fx(type, c.x, c.y - (type==='text'?30:0), text); }
function hitRoom(sh, ri_, d, o={}){
  const r = sh.rooms[ri_]; if(!r) return;
  const dmg = d.damage||0;
  if(dmg>0 && !o.noHull) sh.hull = Math.max(0, sh.hull - dmg);
  const sysd = dmg + (d.sysDamage||0);
  if(r.sys && sh.systems[r.sys] && sysd>0){ if(!(hasAug(sh,'casing') && Math.random()<.15)) damageSystem(sh, r.sys, sysd); }
  const crewDmg = 15*dmg + (d.crewDamage||0);
  if(crewDmg>0) for(const c of sh.crew) if(c.room===ri_){ c.hp -= crewDmg*(raceOf(c).armor||1); c.lastBy = o.by || null; }
  if(d.fire && Math.random() < d.fire){ igniteRoom(sh, ri_); if(sh.side==='p') say('fire', { force:true }); }
  if(d.breach && Math.random() < d.breach*(hasAug(sh,'rockPlating')?.5:1)){ r.breach = Math.min(r.w*r.h, r.breach + 1); if(sh.side==='p') say('breach', { force:true }); }
  if(d.ion && d.type!=='ion') { if(r.sys) ionize(sh, r.sys, d.ion); }
  if(d.stun) for(const c of sh.crew) if(c.room===ri_) c.stunT = Math.max(c.stunT, d.stun);
  const c = roomCenter(sh, ri_); burst(c.x, c.y, .5 + .3*Math.max(1,dmg), '#ffb547'); if(dmg>1) debris(c.x, c.y, sh.color, 4); if(dmg>0) fx('text', c.x, c.y-34, `-${dmg}`);
  if(sh.side==='p' && dmg>0 && Math.random()<.4) say('hit');
  sfx('hit');
  if(!sh.isEnemy){ G.shake = Math.min(1, G.shake + .35*Math.max(1,dmg)); haptic(.5 + .15*dmg, 90 + 40*dmg); }
}

/* ---------------- projectiles ---------------- */
function flightTime(d, kind){ if(kind==='hack' || kind==='bdrone') return 2.4; if(kind==='asteroid') return 1.6;
  switch(d.type){ case 'beam': return .6; case 'bomb': return .7; case 'missile': return 1.5; case 'flak': return 1.1; default: return 1.0; } }
function launch(from, to, d, room, o={}){ const p = Object.assign({ id:uid(), from, to, d, room, t:0 }, o); p.dur = o.dur || flightTime(d, o.kind); G.proj.push(p); return p; }
function beamRooms(sh, ri_, n){ return sh.rooms.map((r,i)=>i).sort((a,b) => roomDist(sh,ri_,a) - roomDist(sh,ri_,b)).slice(0, Math.max(1,n)); }
function nearbyRoom(sh, ri_, rad){ const c = sh.rooms.map((r,i)=>i).filter(i => roomDist(sh, ri_, i) <= rad + 1.3); return c.length ? pick(c) : ri_; }
function fireWeapon(sh, w, foe){
  const d = DATA.weapons[w.id]; if(!d) return false;
  const ammo = d.type==='missile' || d.type==='bomb';
  if(ammo && sh.side==='p'){ if(G.missiles<=0) return false; if(!(hasAug(sh,'replicator') && Math.random()<.33)) G.missiles--; }
  w.charge = 0;
  const mc = mannedCrew(sh,'weapons'); if(mc) gainXP(mc, 'weapons', 1);
  const to = d.heal ? sh.side : foe.side;
  if(d.type==='flak'){ for(let i=0;i<(d.shots||1);i++) launch(sh.side, to, d, nearbyRoom(foe, w.target, d.radius||1), { t:-i*.04 }); }
  else if(d.type==='beam') launch(sh.side, to, d, w.target, { rooms:beamRooms(foe, w.target, d.rooms||2) });
  else for(let i=0;i<(d.shots||1);i++) launch(sh.side, to, d, w.target, { t:-i*.22 });
  sfx(d.type==='missile'?'missile':d.type==='ion'?'ion':d.type==='beam'?'beam':d.type==='flak'?'flak':d.type==='bomb'?'bomb':'laser');
  if(sh.side==='e' || !G.autofire) w.target = null;
  emit('fire', { ship:sh, weapon:w });
  return true;
}
function projKind(p){ return p.kind || p.d.type; }
function resolve(p){
  const tgt = shipBySide(p.to); if(!tgt || tgt.dead) return;
  const d = p.d, src = shipBySide(p.from);
  if(p.kind==='hack'){ tgt.hacked = { room:p.room, attached:true, pulseT:0, cd:2, by:p.from }; fxAtRoom(tgt, p.room, 'ion'); sfx('zap'); return; }
  if(p.kind==='bdrone'){ const owner = shipBySide(p.from); const dr = owner?.drones.find(x=>x.unit===p.id);
    const c = newDroneUnit(p.bp, p.from); tgt.crew.push(c); placeCrew(tgt, c, p.room); if(dr) dr.unit = c.id;
    const r = tgt.rooms[p.room]; if(r) r.breach = Math.min(r.w*r.h, r.breach+1); fxAtRoom(tgt, p.room, 'boom'); sfx('hit'); return; }
  if(d.heal){ for(const c of tgt.crew) if(c.room===p.room && crewSide(c)===p.from) c.hp = Math.min(c.maxHp, c.hp + d.heal); fxAtRoom(tgt, p.room, 'heal'); return; }
  if(d.type==='bomb'){
    if(tgt.cloak.t>0){ fxAtRoom(tgt, p.room, 'text', 'MISS'); sfx('miss'); return; }
    if(tgt.super>0){ tgt.super = Math.max(0, tgt.super-1); fxAtProj(p, tgt, 'super'); sfx('shield'); return; }
    hitRoom(tgt, p.room, d, { noHull:true, by:p.from }); return;
  }
  if(d.type==='beam'){
    if(tgt.super>0){ tgt.super = Math.max(0, tgt.super - Math.max(1, d.damage||1)); fxAtProj(p, tgt, 'super'); sfx('shield'); return; }
    const pen = (d.damage||0) - tgt.shield;
    if(tgt.shield>0 && pen<=0){ fxAtRoom(tgt, p.room, 'shield'); sfx('shield'); return; }
    for(const r of (p.rooms||[p.room])) hitRoom(tgt, r, Object.assign({}, d, { damage:Math.max(0,pen) }), { by:p.from });
    return;
  }
  if(Math.random()*100 < evasion(tgt)){
    fxAtRoom(tgt, p.room, 'text', 'MISS'); sfx('miss');
    const pc = mannedCrew(tgt,'piloting'); if(pc) gainXP(pc,'pilot',2); const ec = mannedCrew(tgt,'engines'); if(ec) gainXP(ec,'engines',2);
    return;
  }
  if(tgt.super>0){ tgt.super = Math.max(0, tgt.super - Math.max(1, d.damage||1)); fxAtProj(p, tgt, 'super'); sfx('shield'); return; }
  if(d.type!=='missile' && tgt.shield>0 && !((d.pierce||0) >= tgt.shield)){
    tgt.shield--; tgt.shieldT = 0; fxAtProj(p, tgt, 'shield'); sfx('shield'); if(tgt.side==='p' && tgt.shield===0) say('shieldsDown');
    if(d.type==='ion') ionize(tgt, 'shields', d.damage||1);
    return;
  }
  if(d.type==='ion'){ const r = tgt.rooms[p.room]; if(r && r.sys) ionize(tgt, r.sys, d.damage||1); fxAtRoom(tgt, p.room, 'ion'); sfx('ion'); if(d.stun) for(const c of tgt.crew) if(c.room===p.room) c.stunT = d.stun; return; }
  hitRoom(tgt, p.room, d, { by:p.from });
}

/* ---------------- drones ---------------- */
function removeDrone(sh, dr){
  if(!dr.unit) return;
  G.units = (G.units||[]).filter(u => u.id!==dr.unit);
  for(const s of [G.ship, G.enemy]) if(s){ const i = s.crew.findIndex(c => c.id===dr.unit); if(i>=0) s.crew.splice(i,1); }
  G.proj = (G.proj||[]).filter(p => p.id!==dr.unit);
  dr.unit = null;
}
function unitAlive(dr){
  if(!dr.unit) return false;
  if((G.units||[]).some(u=>u.id===dr.unit)) return true;
  if(G.proj.some(p=>p.id===dr.unit)) return true;
  for(const s of [G.ship, G.enemy]) if(s && s.crew.some(c=>c.id===dr.unit)) return true;
  return false;
}
function deployDrones(sh, foe){
  droneBudget(sh);
  for(const dr of sh.drones){
    const bp = DATA.drones[dr.id]; if(!bp) continue;
    if(!dr.on){ if(dr.unit) removeDrone(sh, dr); continue; }
    if(dr.unit && !unitAlive(dr)) dr.unit = null;
    if(dr.unit) continue;
    const space = ['attack','defense','anti','boarding'].includes(bp.kind);
    if(space && (!foe || foe.dead)) continue;
    if(bp.kind==='hull'){
      if(foe){ continue; }
      if(sh.side==='p' && sh.hull < sh.maxHull && G.parts>0){ G.parts--; sh.hull = Math.min(sh.maxHull, sh.hull + (bp.heal||4)); toast(`Hull repair drone patched ${bp.heal||4} hull.`); }
      dr.on = false; continue;
    }
    if(sh.side==='p'){ if(G.parts<=0) continue; if(!hasAug(sh,'recovery') && !(hasAug(sh,'replicator') && Math.random()<.33)) G.parts--; }
    if(bp.kind==='internal'){ const c = newDroneUnit(dr.id, sh.side); sh.crew.push(c); placeCrew(sh, c, Math.max(0, roomOf(sh,'drones'))); dr.unit = c.id; }
    else if(bp.kind==='boarding'){ const p = launch(sh.side, foe.side, { type:'bdrone', name:bp.name }, aiTargetRoom(foe), { kind:'bdrone', bp:dr.id }); dr.unit = p.id; }
    else { const u = { id:uid(), bp:dr.id, side:sh.side, orbit: bp.kind==='attack' ? foe.side : sh.side, ang:Math.random()*6.28, cd:(bp.rate||3)*.7 }; G.units.push(u); dr.unit = u.id; }
  }
}
function tickUnits(dt){
  for(const u of [...G.units]){
    const bp = DATA.drones[u.bp]; const owner = shipBySide(u.side), foe = shipBySide(otherSide(u.side));
    if(!owner || !bp){ G.units = G.units.filter(x=>x!==u); continue; }
    u.ang += dt*(bp.kind==='attack' ? .7 : .9); u.cd -= dt;
    if(u.cd>0) continue;
    if(bp.kind==='attack' && foe && !foe.dead){
      const shot = Object.assign({ name:bp.name }, bp.shot); const room = aiTargetRoom(foe, shot);
      launch(u.side, foe.side, shot, room, { unit:u.id, rooms: shot.type==='beam' ? beamRooms(foe, room, shot.rooms||2) : undefined, dur: shot.type==='beam' ? .5 : .7 });
      sfx(shot.type==='ion'?'ion':shot.type==='beam'?'beam':'laser'); u.cd = (bp.rate||4) * (u.side==='e' ? 1.35 : 1);
    } else if(bp.kind==='defense'){
      const tg = G.proj.find(p => p.to===u.side && p.from!==u.side && p.t > .15*p.dur && p.t < .85*p.dur && (bp.targets||['missile']).includes(projKind(p)));
      if(tg){ G.proj = G.proj.filter(p=>p!==tg); fx('zap', tg._x ?? 800, tg._y ?? 330); sfx('zap'); u.cd = bp.rate||2.5;
        if(tg.kind==='bdrone'){ const o = shipBySide(tg.from); const dr = o?.drones.find(x=>x.unit===tg.id); if(dr) dr.unit = null; }
        if(tg.kind==='hack'){ const o = shipBySide(tg.from); if(o) o.hackLaunched = false; }
        if(u.side==='p'){ G.stats.shotDown = (G.stats.shotDown||0) + 1; if(G.stats.shotDown>=10) grant('missilecmd'); } }
      else u.cd = .2;
    } else if(bp.kind==='anti'){
      const tu = G.units.find(x => x.side!==u.side);
      if(tu){ destroyUnit(tu); sfx('zap'); u.cd = bp.rate||4; } else u.cd = .3;
    }
  }
}
function destroyUnit(u){ G.units = G.units.filter(x=>x!==u); fx('boom', u._x ?? 800, u._y ?? 330); const o = shipBySide(u.side); const dr = o?.drones.find(d=>d.unit===u.id); if(dr) dr.unit = null; }

/* ---------------- special systems ---------------- */
const CLOAK_T = [5,10,15], HACK_T = [4,7,10], MIND_T = [14,20,28], TELE_CD = [20,15,10];
function canCloak(sh){ return eff(sh,'cloaking')>0 && sh.cloak.t<=0 && sh.cloak.cd<=0; }
function activateCloak(sh){ if(!canCloak(sh)) return false; sh.cloak.t = CLOAK_T[lvlIdx(sh,'cloaking')]; sfx('cloak'); return true; }
function canBattery(sh){ return eff(sh,'battery')>0 && sh.battery.t<=0 && sh.battery.cd<=0; }
function activateBattery(sh){ if(!canBattery(sh)) return false; sh.battery.t = 30; sh.battery.extra = 2*eff(sh,'battery'); sfx('buy'); return true; }
function canHackLaunch(sh, foe){ return !!foe && !foe.dead && eff(sh,'hacking')>0 && !sh.hackLaunched && !(foe.hacked && foe.hacked.by===sh.side); }
function hackLaunch(sh, foe, room){
  if(!canHackLaunch(sh, foe)) return false;
  if(sh.side==='p'){ if(G.parts<=0){ toast('You need a drone part to launch a hacking drone.'); return false; } G.parts--; }
  sh.hackLaunched = true; launch(sh.side, foe.side, { type:'hack', name:'Hacking drone' }, room, { kind:'hack' }); sfx('missile'); return true;
}
function canHackPulse(sh, foe){ return !!foe && !!foe.hacked && foe.hacked.by===sh.side && eff(sh,'hacking')>0 && foe.hacked.pulseT<=0 && foe.hacked.cd<=0; }
function hackPulse(sh, foe){ if(!canHackPulse(sh, foe)) return false; foe.hacked.pulseT = HACK_T[lvlIdx(sh,'hacking')]; sfx('zap'); return true; }
function canMind(sh){ return eff(sh,'mindcontrol')>0 && sh.mc.cd<=0; }
function mindControl(sh, c){
  if(!canMind(sh)) return false;
  const race = DATA.races[c.race];
  if(c.drone || race?.mindImmune){ toast(`${c.drone ? 'Drones' : race.name+' crew'} cannot be mind controlled.`); return false; }
  if(crewSide(c)===sh.side) return false;
  c.mcT = MIND_T[lvlIdx(sh,'mindcontrol')]; c.path = []; sh.mc.cd = 20; sfx('tele'); if(sh.side==='p') grant('mind'); return true;
}
function canTele(sh, foe){ return eff(sh,'teleporter')>0 && sh.tele.cd<=0 && !!foe && !foe.dead && foe.super<=0 && foe.cloak.t<=0; }
function teleSend(sh, foe, room, group){
  if(!canTele(sh, foe)) return false;
  if(!group){ const tr = roomOf(sh,'teleporter'); group = sh.crew.filter(c => c.room===tr && !c.path.length && c.owner===sh.side && crewSide(c)===sh.side && !c.drone).slice(0,4); }
  if(!group.length) return false;
  for(const c of group){ sh.crew.splice(sh.crew.indexOf(c),1); foe.crew.push(c); placeCrew(foe, c, room); }
  sh.tele.cd = TELE_CD[lvlIdx(sh,'teleporter')]; fxAtRoom(foe, room, 'tele'); sfx('tele'); return true;
}
function teleRecall(sh, foe){
  if(!foe || eff(sh,'teleporter')<=0 || sh.tele.cd>0) return false;
  const group = foe.crew.filter(c => c.owner===sh.side && !c.drone); if(!group.length) return false;
  for(const c of group){ foe.crew.splice(foe.crew.indexOf(c),1); sh.crew.push(c); placeCrew(sh, c, Math.max(0, roomOf(sh,'teleporter'))); c.mcT = 0; }
  sh.tele.cd = TELE_CD[lvlIdx(sh,'teleporter')]; sfx('tele'); return true;
}
function doorStrength(sh){ if(!sh.systems.doors) return 3; return [1.5,4,7,10][eff(sh,'doors')]; }
function doorOpen(d){ return d.open || d.passT>0 || d.broken>0; }
function canDoors(sh){ return !sh.systems.doors || eff(sh,'doors')>0; }
function setAllDoors(sh, open, airlocks){ if(!canDoors(sh)) return false; for(const d of sh.doors){ if(d.b<0 && !airlocks) continue; d.open = open; } return true; }
function returnToStations(sh){ for(const c of sh.crew){ if(c.owner!==sh.side || c.drone || c.mcT>0 || c.station==null) continue; orderMove(sh, c, c.station); } }

/* ---------------- targeting AI ---------------- */
function aiTargetRoom(foe, d){
  const at = k => { const i = roomOf(foe,k); return i>=0 && foe.systems[k] ? i : -1; };
  if(d && G && G.sector>=2){ const r = Math.random();
    if(d.type==='ion'){ const s = at('shields'); if(s>=0 && r<.8) return s; }
    if(d.type==='missile' || d.type==='bomb'){ const s = at(r<.5 ? 'weapons' : 'shields'); if(s>=0) return s; }
    if(d.type==='beam'){ const c = ['weapons','piloting','shields','oxygen'].map(at).filter(i=>i>=0); if(c.length && r<.75) return pick(c); }
    if(d.type==='laser' || d.type==='flak'){ if(foe.shield>0 && r<.45){ const s = at('shields'); if(s>=0) return s; } const c = ['weapons','shields','piloting','engines','oxygen','medbay'].map(at).filter(i=>i>=0); if(c.length && r<.85) return pick(c); }
  }
  const opts = [];
  foe.rooms.forEach((r,i) => { if(!r.sys || !foe.systems[r.sys]) return; const wgt = ['weapons','shields'].includes(r.sys) ? 4 : ['piloting','engines','oxygen'].includes(r.sys) ? 2 : 1; for(let k=0;k<wgt;k++) opts.push(i); });
  return opts.length ? pick(opts) : Math.floor(Math.random()*foe.rooms.length);
}
function ownerCrewCount(side){ let n = 0; for(const s of [G.ship, G.enemy]) if(s && !s.dead) for(const c of s.crew) if(c.owner===side && !c.drone) n++; return n; }

/* ---------------- crew behaviour ---------------- */
function controlled(c){ return c.owner==='p' && c.mcT<=0 && !c.drone; }
function crewAI(sh, c){
  if(controlled(c) || c.stunT>0) return;
  const side = crewSide(c), friendly = side===sh.side, here = c.room;
  const role = c.drone ? (DATA.drones[c.drone]?.role || 'board') : null;
  if(hostilesFor(sh, here, side) && role!=='repair') return;
  const dest = c.path.length ? sh.cellRoom[c.tx+','+c.ty] : here;
  if(friendly){
    let best = null, bd = 1e9;
    const consider = (i, w, cap_) => { if(i!==here && roomCount(sh, i, side) >= cap_) return; const d = (roomDist(sh, here, i)+1)/w; if(d<bd){ bd = d; best = i; } };
    sh.rooms.forEach((r,i) => {
      const host = hostilesFor(sh, i, side);
      if(role==='repair'){ if(r.sys && sh.systems[r.sys]?.dmg>0) consider(i, 2, 2); return; }
      if(role==='fight'){ if(host) consider(i, 3, 6); return; }
      if(host) consider(i, 3, 5);
      else if(r.fire>0) consider(i, 2.2, 2);
      else if(r.breach>0) consider(i, 1.8, 2);
      else if(r.sys && sh.systems[r.sys]?.dmg>0) consider(i, 1.4, 2);
    });
    if(best==null) best = c.station!=null && sh.rooms[c.station] ? c.station : (role ? Math.max(0, roomOf(sh,'drones')) : here);
    if(best!==dest) orderMove(sh, c, best);
  } else {
    const r = sh.rooms[here];
    const intact = r && r.sys && sh.systems[r.sys] && sh.systems[r.sys].dmg < sh.systems[r.sys].max;
    if(intact && !c.path.length) return;
    if(c.path.length) return;
    const cands = sh.rooms.map((x,i)=>i).filter(i => { const y = sh.rooms[i]; return y.sys && sh.systems[y.sys] && sh.systems[y.sys].dmg < sh.systems[y.sys].max && roomCount(sh,i,side) < 3; });
    if(!cands.length) return;
    cands.sort((a,b) => roomDist(sh,here,a) - roomDist(sh,here,b));
    orderMove(sh, c, Math.random()<.7 ? cands[0] : pick(cands));
  }
}
/* crew autopilot: idle player crew answer emergencies, then go back to their posts */
function autoCrew(sh, c){
  if(c.path.length || c.stunT>0) return;
  const here = c.room, race = raceOf(c);
  if(hostilesFor(sh, here, 'p')){
    const foeStr = sh.crew.filter(o => o.room===here && crewSide(o)!=='p').reduce((t,o)=>t + o.hp*(raceOf(o).combat||1), 0);
    const ourStr = sh.crew.filter(o => o.room===here && crewSide(o)==='p').reduce((t,o)=>t + o.hp*(raceOf(o).combat||1), 0);
    if((race.combat<=.5 || c.hp < c.maxHp*.3) && ourStr < foeStr*.7){ const safe = sh.rooms.map((r,i)=>i).filter(i => !hostilesFor(sh, i, 'p') && sh.rooms[i].o2 > 30 && sh.rooms[i].fire===0);
      const med = roomOf(sh,'medbay'); const dest = safe.includes(med) && eff(sh,'medbay')>0 ? med : safe.sort((a,b) => roomDist(sh,here,a) - roomDist(sh,here,b))[0];
      if(dest!=null){ orderMove(sh, c, dest); c.manualT = 6; } }
    return; }
  const helm = roomOf(sh,'piloting');
  const soleOn = k => { const i = roomOf(sh,k); return here===i && !sh.crew.some(o => o!==c && controlled(o) && o.room===i && !o.path.length); };
  const med = roomOf(sh,'medbay');
  if(c.hp < c.maxHp*(G.enemy ? .35 : .75) && med>=0 && eff(sh,'medbay')>0 && !hostilesFor(sh, med, 'p') && sh.rooms[med].fire===0){ if(here!==med && !(soleOn('piloting') && G.enemy)) orderMove(sh, c, med); return; }
  const intruderRooms = sh.rooms.map((r,i)=>i).filter(i => hostilesFor(sh, i, 'p'));
  if(intruderRooms.length && race.combat > .5){
    const pilotStays = G.enemy && soleOn('piloting');
    if(!pilotStays){
      const strength = i => sh.crew.filter(o => o.room===i && crewSide(o)!=='p').reduce((t,o)=>t + o.hp*(raceOf(o).combat||1), 0);
      const defense = i => sh.crew.filter(o => crewSide(o)==='p' && (o.path.length ? sh.cellRoom[o.tx+','+o.ty]===i : o.room===i)).reduce((t,o)=>t + o.hp*(raceOf(o).combat||1), 0);
      const needy = intruderRooms.filter(i => defense(i) < strength(i)*1.6 && roomCount(sh, i, 'p') < cap2(sh, i)).sort((a,b) => roomDist(sh,here,a) - roomDist(sh,here,b));
      if(needy.length){ if(needy[0]!==here) orderMove(sh, c, needy[0]); return; } }
  }
  let best = null, bd = 1e9;
  sh.rooms.forEach((r,i) => {
    let w = 0, cap = 2; const host = hostilesFor(sh, i, 'p');
    if(host){ w = 3*(race.combat>=1.5 ? 1.6 : race.combat<=.5 ? .35 : 1); cap = 5; }
    else if(r.fire>0 && r.o2>=8){ w = 2.2; }
    else if(r.breach>0){ w = 1.8; }
    else if(r.sys && sh.systems[r.sys]?.dmg>0){ w = 1.4*(race.repair>=2 ? 1.6 : race.repair<=.5 ? .6 : 1);
      if(r.sys==='oxygen'){ const avg = sh.rooms.reduce((t,x)=>t+x.o2,0)/sh.rooms.length; w *= avg < 50 ? 4 : 2; }
      if(r.sys==='shields' || r.sys==='weapons' || r.sys==='piloting') w *= 1.4; }
    if(!w) return; if(!host && r.o2 < 8 && r.breach===0 && r.sys!=='oxygen') return;
    if(i!==here && roomCount(sh, i, 'p') >= cap) return;
    const d = (roomDist(sh, here, i) + 1)/w; if(d < bd){ bd = d; best = i; } });
  if(best!=null && best!==here){
    if(G.enemy && (soleOn('piloting') || soleOn('weapons')) && !hostilesFor(sh, best, 'p')) return;
    orderMove(sh, c, best); return; }
  if(best===here) return;
  if(sh.rooms[here].o2 < 10 && !raceOf(c).noAir){ const ok = sh.rooms.map((r,i)=>i).filter(i => sh.rooms[i].o2 > 40).sort((a,b) => roomDist(sh,here,a) - roomDist(sh,here,b)); if(ok.length){ orderMove(sh, c, ok[0]); return; } }
  if(c.station!=null && sh.rooms[c.station] && here!==c.station && sh.rooms[c.station].o2 > 15) orderMove(sh, c, c.station);
}
function cap2(sh, i){ const r = sh.rooms[i]; return r.w*r.h; }
function moveCrewStep(sh, c, dt){
  if(!c.path.length || c.stunT>0) return;
  const [nx, ny] = c.path[0]; const cx = Math.round(c.x), cy = Math.round(c.y);
  const atCell = Math.abs(c.x-cx) < .02 && Math.abs(c.y-cy) < .02;
  if(atCell && sh.cellRoom[cx+','+cy] !== sh.cellRoom[nx+','+ny]){
    const di = doorBetween(sh, [cx,cy], [nx,ny]);
    if(di>=0){ const d = sh.doors[di];
      if(!doorOpen(d)){
        if(crewSide(c)===sh.side){ d.passT = .8; }
        else { d.brk += dt*(c.drone?1:raceOf(c).combat); if(d.brk >= doorStrength(sh)){ d.broken = 12; d.brk = 0; sfx('punch'); } else return; }
      } else d.passT = Math.max(d.passT, .5);
    }
  }
  const sp = 1.7 * (raceOf(c).speed||1) * (hasAug(sh.side===c.owner ? sh : shipBySide(c.owner), 'pheromones') ? 1.25 : 1) * dt;
  const dx = nx - c.x, dy = ny - c.y, dist = Math.hypot(dx, dy);
  if(dist <= sp){ c.x = nx; c.y = ny; c.path.shift(); }
  else { c.x += dx/dist*sp; c.y += dy/dist*sp; }
  const k = Math.round(c.x)+','+Math.round(c.y); if(sh.cellRoom[k]!=null) c.room = sh.cellRoom[k];
}
function crewDps(c){ const r = raceOf(c); if(c.drone) return DATA.drones[c.drone]?.role==='repair' ? 0 : 12; return 9*(r.combat??1)*[1,1.1,1.2][skillLvl(c,'combat')]; }
function killCrew(sh, c){
  const i = sh.crew.indexOf(c); if(i<0) return; sh.crew.splice(i,1);
  const race = DATA.races[c.race];
  if(race?.deathBurst) for(const o of sh.crew) if(o.room===c.room && crewSide(o)!==crewSide(c)) o.hp -= race.deathBurst;
  if(c.lastBy==='p' || c.lastByCrew) { /* credit */ }
  if(c.drone){ for(const s of [G.ship, G.enemy]) if(s){ const dr = s.drones.find(d=>d.unit===c.id); if(dr) dr.unit = null; } return; }
  if(c.owner==='e' && sh===G.enemy && c.killedByBoarder) G.stats.boardKills = (G.stats.boardKills||0) + 1;
  const home = shipBySide(c.owner);
  if(home && !home.dead && home.systems.clonebay){ home.clones.push({ c, t:12 }); if(c.owner==='p') toast(`${c.name} died. The clone bay is regrowing them.`); }
  else if(c.owner==='p' && hasAug(G.ship,'dna')){ G.dna.push(c); toast(`${c.name} died. Their DNA backup will restore them after the fight.`); }
  else if(c.owner==='p'){ toast(`${c.name} has died.`); G.lost.push(c.name); }
  if(c.owner==='p'){ say('death', { force:true }); smartPause(`${c.name} died`); }
  if(UI.selCrew===c.id) UI.selCrew = null;
  if(UI.selCrews) UI.selCrews = UI.selCrews.filter(id => id!==c.id);
}

/* ---------------- per-ship tick ---------------- */
function tickShip(sh, dt, foe){
  for(const k in sh.systems){ const s = sh.systems[k]; if(s.ionT>0){ s.ionT -= dt; if(s.ionT<=0){ s.ion = 0; s.ionT = 0; } } }
  if(sh.cloak.t>0){ sh.cloak.t -= dt; if(sh.cloak.t<=0 || eff(sh,'cloaking')<=0){ sh.cloak.t = 0; sh.cloak.cd = 20; } } else if(sh.cloak.cd>0) sh.cloak.cd -= dt;
  if(sh.battery.t>0){ sh.battery.t -= dt; if(sh.battery.t<=0){ sh.battery.t = 0; sh.battery.cd = 20; } } else if(sh.battery.cd>0) sh.battery.cd -= dt;
  if(sh.tele.cd>0) sh.tele.cd -= dt; if(sh.mc.cd>0) sh.mc.cd -= dt;
  if(sh.hacked){ const h = sh.hacked; const hacker = shipBySide(h.by);
    if(!hacker || hacker.dead || hacker===sh){ sh.hacked = null; }
    else if(h.pulseT>0){ h.pulseT -= dt; if(eff(hacker,'hacking')<=0 && !hackedNow(sh,'hacking')) h.pulseT = 0; if(h.pulseT<=0){ h.pulseT = 0; h.cd = 15; } }
    else if(h.cd>0) h.cd -= dt; }
  shedPower(sh); sh.restT = (sh.restT||0) - dt; if(sh.restT<=0){ sh.restT = .5; restorePower(sh); }
  if(sh.side==='p' && sh.systems.oxygen){ const avg = sh.rooms.reduce((t,r)=>t+r.o2,0)/sh.rooms.length;
    if(avg < 35 && !sh.o2Warned){ sh.o2Warned = true; toast('Oxygen is running low! Power and repair the Oxygen system.'); say('breach', { force:true }); smartPause('oxygen low'); }
    else if(avg > 60) sh.o2Warned = false; }
  // shields
  const layers = shieldLayers(sh);
  if(sh.shield > layers) sh.shield = layers;
  if(sh.shield < layers){
    const sc = mannedCrew(sh,'shields');
    const mult = (sc ? [1.1,1.2,1.3][skillLvl(sc,'shields')] : 1) * (hasAug(sh,'booster') ? 1.15 : 1);
    sh.shieldT += dt*mult; if(sh.shieldT >= R.shieldRegen){ sh.shield++; sh.shieldT = 0; if(sc && foe) gainXP(sc,'shields',1); }
  } else sh.shieldT = 0;
  if(sh.superRegen && sh.super < sh.superMax){ sh.superT += dt; if(sh.superT >= sh.superRegen){ sh.super++; sh.superT = 0; } }
  if(sh.side==='p' && layers>=4) grant('shieldwall');
  // oxygen
  const ox = eff(sh,'oxygen'), oxHack = hackedNow(sh,'oxygen') || (sh.hacked?.pulseT>0 && sh.rooms[sh.hacked.room]?.sys==='oxygen');
  for(const r of sh.rooms){
    if(sh.systems.oxygen){ r.o2 += ox>0 ? dt*(1.2 + ox*1.2) : -dt*.8; if(oxHack) r.o2 -= dt*4; }
    r.o2 -= dt*(6*r.breach + 1.4*r.fire);
  }
  for(const d of sh.doors){
    if(d.passT>0) d.passT -= dt;
    if(d.broken>0){ d.broken -= dt; if(d.broken<=0){ d.broken = 0; } }
    if(!doorOpen(d)) continue;
    const ra = sh.rooms[d.a]; if(!ra) continue;
    if(d.b<0){ ra.o2 -= dt*45; continue; }
    const rb = sh.rooms[d.b]; const f = (ra.o2 - rb.o2)*Math.min(1, dt*1.5)*.5; ra.o2 -= f; rb.o2 += f;
  }
  for(const r of sh.rooms) r.o2 = clamp(r.o2, 0, 100);
  // fire
  sh.rooms.forEach((r,i) => {
    if(r.fire<=0) return;
    if(r.o2 < 10){ r.fireOut += dt; if(r.fireOut > 2){ r.fire--; r.fireOut = 0; } }
    if(Math.random() < dt*.025*r.fire && r.fire < r.w*r.h) r.fire++;
    if(Math.random() < dt*.02*r.fire){ const ds = sh.doors.filter(d => d.b>=0 && (d.a===i || d.b===i)); if(ds.length){ const d = pick(ds); if(doorOpen(d) || Math.random()<.4) igniteRoom(sh, d.a===i ? d.b : d.a); } }
    if(r.sys && sh.systems[r.sys]){ r.fireDmg += dt*.06*r.fire; if(r.fireDmg>=1){ r.fireDmg = 0; damageSystem(sh, r.sys, 1); } }
    if(sh.side==='p' && Math.random()<dt*.5) sfx('fire');
  });
  if(sh.isEnemy && sh.rooms.filter(r=>r.fire>0).length>=4) grant('firestarter');
  // crew: timers, AI, walking
  const medR = roomOf(sh,'medbay'), medE = eff(sh,'medbay'), medHack = sh.hacked?.pulseT>0 && sh.rooms[sh.hacked.room]?.sys==='medbay';
  for(const c of sh.crew){
    if(c.stunT>0) c.stunT -= dt;
    if(c.mcT>0){ c.mcT -= dt; if(c.mcT<=0){ c.mcT = 0; c.path = []; } }
    if(c.manualT>0) c.manualT -= dt;
    c.aiT -= dt; if(c.aiT<=0){ c.aiT = .6 + Math.random()*.4; if(controlled(c)){ if(G.crewAuto && sh===G.ship && !(c.manualT>0)) autoCrew(sh, c); } else crewAI(sh, c); }
    moveCrewStep(sh, c, dt);
    const race = raceOf(c), r = sh.rooms[c.room];
    if(r){
      if(r.fire>0 && !race.fireproof) c.hp -= Math.min(6, 2*r.fire)*dt;
      if(r.o2 < 5 && !race.noAir) c.hp -= 5*dt;
    }
    if(race.heal) c.hp = Math.min(c.maxHp, c.hp + race.heal*dt);
    if(c.owner===sh.side && crewSide(c)===sh.side && c.room===medR && !c.path.length && medE>0) c.hp = Math.min(c.maxHp, c.hp + 6.4*medE*dt);
    if(medHack && c.room===medR && crewSide(c)===sh.side) c.hp -= 8*dt;
    if(c.owner==='p' && hasAug(G.ship,'gel') && !c.drone) c.hp = Math.min(c.maxHp, c.hp + .6*dt);
  }
  // per-room: fights, repairs, sabotage
  const byRoom = sh.rooms.map(()=>[]);
  for(const c of sh.crew) if(!c.path.length && byRoom[c.room]) byRoom[c.room].push(c);
  byRoom.forEach((grp, i) => {
    if(!grp.length) return;
    const friends = grp.filter(c => crewSide(c)===sh.side), foes = grp.filter(c => crewSide(c)!==sh.side);
    const r = sh.rooms[i];
    if(friends.length && foes.length){
      for(const a of grp){ if(a.stunT>0) continue; const dps = crewDps(a); if(dps<=0) continue;
        const opp = crewSide(a)===sh.side ? foes : friends; let tgt = null; for(const o of opp) if(o.hp>0 && (!tgt || o.hp < tgt.hp)) tgt = o;
        if(!tgt) continue; tgt.hp -= dps*dt; tgt.lastByCrew = a.id; if(a.owner==='p' && sh.isEnemy) tgt.killedByBoarder = true;
        if(tgt.hp<=0 && !tgt._counted){ tgt._counted = true; a.kills++; gainXP(a,'combat',1); }
        if(Math.random()<dt*.6 && (sh.side==='p' || a.owner==='p')) sfx('punch'); }
    } else if(friends.length){
      const workers = friends.filter(c => c.stunT<=0 && raceOf(c).repair>0 && !(c.drone && DATA.drones[c.drone]?.role!=='repair'));
      if(!workers.length) return;
      let rate = workers.reduce((t,c)=>t + raceOf(c).repair*[1,1.1,1.2][skillLvl(c,'repair')], 0) * R.repairRate * dt;
      if(r.fire>0){ r.fireP += rate*2.6*(hasAug(shipBySide(workers[0].owner)||sh,'fireSup')?2:1); if(r.fireP>=1){ r.fireP = 0; r.fire--; workers.forEach(c=>gainXP(c,'repair',.5)); } }
      else if(r.breach>0){ r.breachP += rate; if(r.breachP>=1){ r.breachP = 0; r.breach--; workers.forEach(c=>gainXP(c,'repair',1)); } }
      else if(r.sys && sh.systems[r.sys] && sh.systems[r.sys].dmg>0){ const s = sh.systems[r.sys]; s.rep += rate;
        if(s.rep>=1){ s.rep = 0; s.dmg--; workers.forEach(c=>gainXP(c,'repair',1)); if(sh.side==='p' && Math.random()<.25) say('repair', { crew:workers[0] });
          if(!sh.isEnemy && s.prev > s.power && reactorFree(sh)>0 && s.power < s.max - s.dmg){ s.power++; if(s.power>=s.prev) s.prev = 0; }
          if(r.sys==='weapons') sh.isEnemy ? autoPowerWeapons(sh) : null; } }
    } else {
      const sabo = foes.filter(c => c.stunT<=0);
      if(r.sys && sh.systems[r.sys] && sh.systems[r.sys].dmg < sh.systems[r.sys].max && sabo.length){
        r.sab += dt*.12*sabo.reduce((t,c)=>t + (raceOf(c).combat||1), 0);
        if(r.sab>=1){ r.sab = 0; damageSystem(sh, r.sys, 1); }
      }
    }
  });
  for(const c of [...sh.crew]) if(c.hp<=0) killCrew(sh, c);
  // auto-ship self repair
  if(sh.auto) for(const k in sh.systems){ const s = sh.systems[k]; if(s.dmg>0){ s.rep += dt*.06; if(s.rep>=1){ s.rep = 0; s.dmg--; } } }
  // clone bay
  if(sh.clones.length){ const ce = eff(sh,'clonebay');
    for(const cl of [...sh.clones]){ if(ce>0) cl.t -= dt*(1 + .3*(ce-1));
      if(cl.t<=0){ sh.clones.splice(sh.clones.indexOf(cl),1); const c = cl.c; c.hp = c.maxHp; c.path = []; c.mcT = 0; c.stunT = 0; c._counted = false;
        for(const s of SKILLS) c.sk[s] = Math.max(0, (c.sk[s]||0)*.75);
        sh.crew.push(c); placeCrew(sh, c, Math.max(0, roomOf(sh,'clonebay'))); if(sh.side==='p') toast(`${c.name} stepped out of the clone bay.`); } } }
  // pilot and engine XP while in combat
  if(foe && sh.side==='p'){ const pc = mannedCrew(sh,'piloting'); if(pc) gainXP(pc,'pilot',dt*.5); const ec = mannedCrew(sh,'engines'); if(ec) gainXP(ec,'engines',dt*.5); }
  // weapons
  weaponBudget(sh); if(sh.isEnemy) autoPowerWeapons(sh);
  const diff = DIFFICULTY[SET.difficulty] || DIFFICULTY.normal;
  for(const w of sh.weapons){
    const d = DATA.weapons[w.id]; if(!d) continue;
    if(!foe || foe.dead || !w.on){ w.charge = Math.max(0, w.charge - dt*3); continue; }
    if(foe.cloak.t>0 && !d.heal) continue;
    let mult = 1; const wc = mannedCrew(sh,'weapons'); if(wc) mult *= [1.1,1.15,1.2][skillLvl(wc,'weapons')]; else if(sh.auto) mult *= 1.05;
    if(hasAug(sh,'reloader')) mult *= 1.1;
    if(sh.isEnemy && !sh.boss) mult *= Math.min(1, (R.enemyPace ?? diff.pace) * (diff.pace/.7) + .05*(G.sector-1));
    if(hackedNow(sh,'weapons')) { w.charge = Math.max(0, w.charge - dt*2); continue; }
    w.charge = Math.min(d.charge, w.charge + dt*mult);
    if(w.charge >= d.charge){
      if(sh.isEnemy && w.target==null) w.target = aiTargetRoom(foe, d);
      if(sh.isEnemy && G.sector>=2 && foe.shield>0 && ['laser','flak','ion'].includes(d.type)){
        const ready = sh.weapons.filter(x => x.on && DATA.weapons[x.id] && x.charge >= DATA.weapons[x.id].charge).reduce((t,x) => t + (DATA.weapons[x.id].shots||1), 0);
        const soon = sh.weapons.some(x => x.on && DATA.weapons[x.id] && x.charge < DATA.weapons[x.id].charge && x.charge > DATA.weapons[x.id].charge*.55);
        if(ready <= foe.shield && soon && (w.hold = (w.hold||0) + dt) < 5) continue;
      }
      w.hold = 0;
      if(w.target!=null && !(sh.side==='p' && G.hold) && !((d.type==='missile'||d.type==='bomb') && sh.side==='p' && G.missiles<=0)) fireWeapon(sh, w, foe);
    }
  }
  if(sh.surge && foe && !foe.dead){ sh.surgeT -= dt; if(sh.surgeT<=0){ sh.surgeT = sh.surge; toast('POWER SURGE! The Flaggship fires everything.'); sfx('alarm');
    for(let i=0;i<6;i++) launch(sh.side, foe.side, { type:'laser', damage:1, name:'Surge' }, aiTargetRoom(foe), { t:-i*.15 }); } }
}

/* ---------------- enemy brain ---------------- */
function enemyBrain(sh, foe, dt){
  sh.aiT -= dt; if(sh.aiT>0) return; sh.aiT = .5;
  autoPowerWeapons(sh); autoPowerDrones(sh);
  const pw = foe.weapons.some(w => w.on && DATA.weapons[w.id] && w.charge/DATA.weapons[w.id].charge > .85 && w.target!=null);
  if(sh.systems.cloaking && pw) activateCloak(sh);
  if(sh.systems.battery && reactorFree(sh)<=0) activateBattery(sh);
  const boarding = foe.crew.some(c => c.owner==='e' && !c.drone);
  if(sh.systems.teleporter && (sh.board || !sh.boss) && !boarding && canTele(sh, foe) && G.combatT > 8 && Math.random()<.25){
    const home = sh.crew.filter(c => c.owner==='e' && crewSide(c)==='e' && !c.drone);
    const group = home.filter(c => c.room!==roomOf(sh,'piloting')).slice(0, 2 + (sh.boss?1:0));
    if(group.length>=2 && home.length>=3){ if(teleSend(sh, foe, aiTargetRoom(foe), group)){ sh.tele.cd = Math.max(sh.tele.cd, 30); toast('Intruders aboard!'); say('boarders', { force:true }); smartPause('intruders aboard'); } }
  }
  if(sh.systems.hacking && G.combatT>4 && canHackLaunch(sh, foe)){ const k = pick(['shields','weapons','piloting']); const r = roomOf(foe,k); if(r>=0 && foe.systems[k]) hackLaunch(sh, foe, r); }
  if(canHackPulse(sh, foe)) hackPulse(sh, foe);
  if(sh.systems.mindcontrol && canMind(sh) && G.combatT>5){
    const cands = foe.crew.filter(c => c.owner==='p' && !c.drone && !DATA.races[c.race]?.mindImmune && c.mcT<=0);
    if(cands.length){ const c = pick(cands); if(mindControl(sh, c)){ toast(`${c.name} has been mind controlled!`); smartPause('crew mind controlled'); } }
  }
  // surrender or flee
  if(!sh.boss && !sh.auto && !sh.surrenderAsked && sh.hull <= sh.maxHull*.4){
    sh.surrenderAsked = true; if(Math.random()<.4){ offerSurrender(sh); return; }
  }
  if(!sh.boss && sh.fleeT==null && sh.hull <= sh.maxHull*.3 && Math.random()<.5) { sh.fleeT = 22; toast(`The ${sh.name} is charging its jump drive to escape!`); }
}

/* ---------------- hazards ---------------- */
const HAZARDS = { asteroid:'Asteroid field', sun:'Close to a sun', ionstorm:'Ion storm', pulsar:'Pulsar', nebula:'Nebula' };
function tickHazard(dt){
  const hz = G.hazard; if(!hz) return;
  G.hzT -= dt;
  const ships = [G.ship, G.enemy].filter(s => s && !s.dead);
  if(hz==='asteroid' && G.hzT<=0){ G.hzT = rand(5,9);
    for(const s of ships) if(Math.random()<.6) launch('h', s.side, { type:'laser', damage:1, fire:.1, breach:.3, name:'Asteroid' }, Math.floor(Math.random()*s.rooms.length), { kind:'asteroid' }); }
  if(hz==='sun'){ if(G.hzT<3 && !G.hzWarn){ G.hzWarn = true; toast('Solar flare incoming!'); sfx('alarm'); }
    if(G.hzT<=0){ G.hzT = 28; G.hzWarn = false; for(const s of ships) for(let i=0;i<ri(1,3);i++) igniteRoom(s, Math.floor(Math.random()*s.rooms.length)); G.flash = 1; } }
  if(hz==='pulsar' && G.hzT<=0){ G.hzT = 20; toast('Pulsar wave!'); G.flash = .6;
    for(const s of ships){ const ks = Object.keys(s.systems).filter(k=>!SUB.includes(k)); for(let i=0;i<2 && ks.length;i++) ionize(s, pick(ks), 1); s.shield = 0; } }
}
