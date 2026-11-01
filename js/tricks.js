'use strict';
/* =========================================================================
   Weapon tricks: special behaviours any weapon (base game or mod) can have,
   on top of damage, shots and charge. Each is a plain field on the weapon:
     warm:   charges 'warm' faster after each shot (e.g. .12 = 12%), up to 3 times; resets when it stops firing
     homing: never misses (ignores evasion)
     pin:    a hit pins the target: no dodging for this many seconds
     splash: a hit also deals this much damage to a neighbouring room
     bounce: a hit ricochets: another random room takes this much damage
     crit:   chance (0-1) that a shot does double damage
     wild:   each shot does a random 0 to (damage + wild) damage
     salvage:scrap for you each time it hits (your weapons only)
     gas:    the room it hits loses all its air
     fear:   crew in the room it hits panic and run to another room
     toast:  every shot heals your own crew by this much
     decoy:  every shot gives your ship this many points of super shield (up to 3)
     drain:  a hit takes this many bars of power off the system it hits, for a while
     color:  the colour of its shots
   ========================================================================= */
const TRICK_KEYS = 'warm homing pin splash bounce crit wild salvage gas fear toast decoy drain color'.split(' ');
function hasTricks(d){ return !!d && TRICK_KEYS.some(k => d[k]); }
/* charge speed: a warming gun gets faster with each shot */
function trickCharge(w, d){ return d && d.warm ? 1 + d.warm * Math.min(3, w.warm||0) : 1; }
function trickCold(w){ if(w) w.warm = 0; }
/* on firing */
function trickFire(sh, w, d){
  if(d.warm) w.warm = Math.min(3, (w.warm||0) + 1);
  if(d.toast){ for(const c of sh.crew) if(crewSide(c)===sh.side && !c.drone) c.hp = Math.min(c.maxHp, c.hp + d.toast); }
  if(d.decoy){ sh.super = Math.min(Math.max(sh.super||0, 0) + d.decoy, 3); }
}
/* does this shot dodge? homing shots never miss */
function trickHoming(d){ return !!(d && d.homing); }
/* the damage a single shot does */
function trickDamage(d){
  if(!d || !(d.wild || d.crit)) return d;
  let dmg = d.damage||0;
  if(d.wild) dmg = Math.floor(Math.random() * (dmg + d.wild + 1));
  let crit = false; if(d.crit && Math.random() < d.crit){ dmg *= 2; crit = true; }
  return Object.assign({}, d, { damage:dmg, _crit:crit });
}
/* after a room is hit */
function trickHit(sh, ri_, d, o){
  if(o && o.trick) return; const by = o && o.by, r = sh.rooms[ri_]; if(!r) return; const c = roomCenter(sh, ri_);
  if(d._crit) fx('text', c.x, c.y - 58, 'CRITICAL!');
  if(d.pin){ sh.pinUntil = Math.max(sh.pinUntil||0, (G.time||0) + d.pin); fx('text', c.x, c.y - 58, 'PINNED'); }
  if(d.splash){ const near = sh.rooms.map((x, i) => i).filter(i => i!==ri_ && roomDist(sh, ri_, i) <= 1.4); if(near.length) hitRoom(sh, pick(near), { type:d.type, damage:d.splash }, { by, trick:true }); }
  if(d.bounce){ const others = sh.rooms.map((x, i) => i).filter(i => i!==ri_); if(others.length) hitRoom(sh, pick(others), { type:d.type, damage:d.bounce }, { by, trick:true }); }
  if(d.salvage && by==='p' && G && (d.damage||0) + (d.sysDamage||0) + (d.crewDamage||0) > 0){ G.scrap += d.salvage; G.stats.scrap += d.salvage; fx('text', c.x, c.y - 76, `+${d.salvage} scrap`); }
  if(d.gas){ r.o2 = 0; fx('text', c.x, c.y - 58, 'GASSED'); }
  if(d.fear){ const doors = sh.rooms.map((x, i) => i).filter(i => i!==ri_ && roomDist(sh, ri_, i) <= 1.4);
    for(const cr of sh.crew) if(cr.room===ri_ && crewSide(cr)===sh.side && !cr.drone && doors.length){ try{ orderMove(sh, cr, pick(doors)); }catch(e){} } }
  if(d.drain && r.sys && sh.systems[r.sys]) ionize(sh, r.sys, d.drain);
}
/* a pinned ship can't dodge */
function trickPinned(sh){ return !!(sh && sh.pinUntil && G && (G.time||0) < sh.pinUntil); }
/* plain words for the store and the weapon card */
function trickText(d){ if(!d) return ''; const t = [];
  if(d.warm) t.push(`warms up: charges ${Math.round(d.warm*100)}% faster after each shot (up to 3 times)`);
  if(d.homing) t.push('never misses');
  if(d.pin) t.push(`a hit stops the target dodging for ${d.pin}s`);
  if(d.splash) t.push(`splashes ${d.splash} damage into a neighbouring room`);
  if(d.bounce) t.push(`ricochets for ${d.bounce} damage into another room`);
  if(d.crit) t.push(`${Math.round(d.crit*100)}% chance of double damage`);
  if(d.wild) t.push(`unpredictable: each shot does 0 to ${(d.damage||0) + d.wild} damage`);
  if(d.salvage) t.push(`every hit salvages ${d.salvage} scrap`);
  if(d.gas) t.push('sucks the air out of the room it hits');
  if(d.fear) t.push('makes crew in the room panic and flee');
  if(d.toast) t.push(`each shot heals your crew by ${d.toast}`);
  if(d.decoy) t.push(`each shot adds ${d.decoy} point${d.decoy>1?'s':''} of super shield to your ship`);
  if(d.drain) t.push(`drains ${d.drain} power from the system it hits`);
  return t.length ? ' Special: ' + t.join('; ') + '.' : ''; }
/* a two-word tag for the weapon card */
function trickBadge(d, w){ if(!d) return '';
  if(d.warm) return w && w.warm ? `WARM ×${w.warm}` : 'WARMS UP';
  return d.homing ? 'HOMING' : d.pin ? 'PINS' : d.splash ? 'SPLASH' : d.bounce ? 'RICOCHET' : d.crit ? 'CRITS' : d.wild ? 'WILD' : d.salvage ? 'SALVAGE' : d.gas ? 'GAS' : d.fear ? 'PANIC' : d.toast ? 'TOAST' : d.decoy ? 'DECOY' : d.drain ? 'DRAIN' : ''; }
