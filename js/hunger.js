'use strict';
/* =========================================================================
   Crew hunger.
   Every crew member who eats has a fullness from 0 to 100 (c.food). It drops
   a little with every jump, and more the harder they work: fighting hand to
   hand, repairing systems and patching breaches all burn it. Big eaters
   (Pebblekin, Mantlis) burn it faster; some people barely eat (Voltan,
   Glassborn) and some never do (light, wisps, robots, holograms).

   Hungry crew lose maximum health until they eat (c.hungerHp, given back as
   soon as they are fed), and the starving slow down. Well-fed crew work a
   little harder. The medbay heals up to the maximum but can't feed anyone,
   so food, and the health rewards from events, matter.

   Food: a ship's store of meals (G.food, bought at any store's Supplies tab,
   salvaged after fights and found in events). Between jumps the crew eat by
   themselves, hungriest first. When the store is empty they eat what's in the
   hold: rations, fish and crops, leaving what Haven's Rest needs unless
   they're starving.
   ========================================================================= */
const FOOD_VAL = { rations:40, star_potato:25, ion_berry:15, void_pepper:10, moon_melon:45, space_fish:30, deep_eel:50, starfruit:40, frostfire_root:30, solar_grape:20 };
const RACE_APPETITE = { voltan:.5, glassborn:.5, crystalline:.5, pebblekin:1.3, mantlis:1.2, hiveborn:.8, gz_flitter:.8, rp_ironclad:.6, rp_gloomkin:.7, rp_lumen:0, pv_archon:0, ss_wisp:0,
  rd_hologram:0, rd_mechanoid:0, rd_simulant:0, rd_waxdroid:0, rd_agonoid:0, rd_felis:1.2, rd_gelf:1.3 };
/* two rule sets: Relaxed (the default) only bites when crew are properly hungry and rewards a well-fed crew;
   Hardcore is the full survival version. Off turns it all off. */
const HUNGER_RELAXED = [
  { at:85, key:'full',     name:'Well fed', col:'#7be0a0', pen:-.1, text:'Well fed: 10% more maximum health, and 5% more damage and repair speed.' },
  { at:60, key:'fed',      name:'Fed',      col:'#9fdc7a', pen:0,   text:'Fed: no effect.' },
  { at:35, key:'peckish',  name:'Peckish',  col:'#ffd166', pen:0,   text:'Peckish: no effect yet. They\'ll eat at the next jump if there\'s food.' },
  { at:15, key:'hungry',   name:'Hungry',   col:'#ff9f45', pen:.1,  text:'Hungry: maximum health 10% lower until they eat.' },
  { at:0,  key:'starving', name:'Starving', col:'#ff5a7a', pen:.2,  text:'Starving: maximum health 20% lower until they eat.' } ];
const HUNGER_HARD = [
  { at:85, key:'full',     name:'Well fed', col:'#7be0a0', pen:0,   text:'Well fed: 5% more damage and repair speed.' },
  { at:60, key:'fed',      name:'Fed',      col:'#9fdc7a', pen:0,   text:'Fed: no effect.' },
  { at:35, key:'peckish',  name:'Peckish',  col:'#ffd166', pen:.1,  text:'Peckish: maximum health 10% lower until they eat.' },
  { at:15, key:'hungry',   name:'Hungry',   col:'#ff9f45', pen:.25, text:'Hungry: maximum health 25% lower until they eat.' },
  { at:0,  key:'starving', name:'Starving', col:'#ff5a7a', pen:.4,  text:'Starving: maximum health 40% lower and 10% slower until they eat.' } ];
function hungerMode(){ return SET.hunger===false || SET.hunger==='off' ? 'off' : SET.hunger==='hardcore' ? 'hardcore' : 'relaxed'; }
let HUNGER_TIERS = HUNGER_RELAXED;
const HUNGER_JUMP = 4, HUNGER_FIGHT = .06, HUNGER_REPAIR = 1.5, HUNGER_KILL = 2, MEAL_VAL = 35, EAT_BELOW = 62;

function hungerOn(){ HUNGER_TIERS = hungerMode()==='hardcore' ? HUNGER_HARD : HUNGER_RELAXED; return hungerMode()!=='off' && !!G && !G.tut; }
function appetite(c){ if(!c || c.drone) return 0; const r = DATA.races[c.race] || {}; if(r.food != null) return +r.food || 0; if(c.race in RACE_APPETITE) return RACE_APPETITE[c.race]; return r.noAir ? 0 : 1; }
function eats(c){ return appetite(c) > 0; }
function fullness(c){ return c.food == null ? 80 : c.food; }
function hungerTier(c){ if(!eats(c)) return null; HUNGER_TIERS = hungerMode()==='hardcore' ? HUNGER_HARD : HUNGER_RELAXED; const f = fullness(c); return HUNGER_TIERS.find(t => f >= t.at) || HUNGER_TIERS[HUNGER_TIERS.length - 1]; }
function hungerDrain(c, n){ if(!hungerOn() || !c || c.owner!=='p' || !eats(c)) return; c.food = clamp(fullness(c) - n*appetite(c), 0, 100); }
function hungerFeed(c, n){ if(!c || !eats(c)) return 0; const f0 = fullness(c); c.food = clamp(f0 + n, 0, 100); hungerSync(c); return c.food - f0; }
/* the max-health penalty follows the tier: taken off while hungry, handed back the moment they eat */
function hungerSync(c){ if(!c || c.drone) return; const tier = hungerOn() && c.owner==='p' ? hungerTier(c) : null, base = c.maxHp + (c.hungerHp || 0);
  const want = tier ? Math.round(base * tier.pen) : 0, cur = c.hungerHp || 0; if(want===cur) return;
  c.maxHp = base - want; c.hungerHp = want; { const gain = Math.max(0, Math.min(cur, 0) - want); if(gain) c.hp = Math.min(c.maxHp, c.hp + gain); } if(c.hp > c.maxHp) c.hp = c.maxHp;   // the well-fed bonus arrives as health, not an empty bar
  if(want > cur && want > 0 && c.owner==='p' && tier && tier.pen > 0 && G && !G._hungerSaid){ G._hungerSaid = true; toast(`${c.name} is ${tier.name.toLowerCase()}. ${G.food > 0 ? 'They\'ll eat at the next jump.' : 'You\'re out of food: buy some at a store (Supplies).'}`); } }
function crewMine(){ return G && G.ship ? [G.ship, G.enemy].filter(Boolean).flatMap(s => s.crew).filter(c => c.owner==='p' && !c.drone) : []; }
/* what's edible in the hold, cheapest first; Haven's Rest goods only when someone is starving */
function hungerPantry(desperate){ const need = typeof havenOpen==='function' && G && !(typeof havenPerksOn==='function' && !havenPerksOn()) ? new Set(havenOpen().flatMap(w => w.needs.map(n => n[0]))) : new Set();
  const out = []; for(const [id, n] of Object.entries(G.bay || {})){ if(n <= 0) continue; const g = goodsDef(id); if(!g) continue; const v = FOOD_VAL[id] || (g.kind==='meal' ? 70 : 0); if(!v) continue;
    if(g.kind==='meal' && !desperate) continue; if(need.has(id) && !desperate) continue; out.push({ id, v, cost:g.base || 10 }); }
  return out.sort((a, b) => a.cost/a.v - b.cost/b.v); }
function hungerEatOne(c, desperate){
  if((G.food || 0) > 0){ G.food--; hungerFeed(c, MEAL_VAL); return 'a meal'; }
  const p = hungerPantry(desperate)[0]; if(!p || !takeGoods(p.id, 1)) return null; hungerFeed(c, p.v); return goodsDef(p.id).name.toLowerCase(); }
/* between jumps: everyone burns a little, then the hungriest eat first */
function hungerJump(){
  if(!hungerOn()) return; G._hungerSaid = false; const crew = crewMine().filter(eats); if(!crew.length) return;
  for(const c of crew) hungerDrain(c, HUNGER_JUMP);
  const ate = []; let starved = 0;
  for(let pass = 0; pass < 3; pass++) for(const c of [...crew].sort((a, b) => fullness(a) - fullness(b))){ if(fullness(c) >= EAT_BELOW) continue;
    const what = hungerEatOne(c, fullness(c) < 15); if(what){ if(!ate.includes(c)) ate.push(c); } else if(pass===0 && fullness(c) < (hungerMode()==='hardcore' ? 35 : 20)) starved++; }
  for(const c of crew) hungerSync(c);
  if(starved) toast(`Out of food: ${starved===1 ? 'one of the crew is' : starved + ' of the crew are'} going hungry. Buy food at any store (Supplies).`);
  else if((G.food || 0) <= crew.length && !G._foodLow){ G._foodLow = true; toast(`Food is running low (${G.food || 0} left). Stores sell it under Supplies.`); }
  if((G.food || 0) > crew.length*2) G._foodLow = false;
}
/* a nudge for the bot and for anyone docking hungry: how much food would last a few jumps */
function foodWanted(){ const n = crewMine().filter(eats).length; return Math.max(0, n*4 - (G.food || 0)); }
function hungerBonus(c){ const t = hungerTier(c); return t && t.key==='full' && hungerOn() ? 1.05 : 1; }

(function(){
  // every jump
  if(typeof homeJump==='function'){ const j0 = homeJump; homeJump = function(){ j0(); try{ hungerJump(); }catch(e){} }; }
  // repairs and kills burn food
  if(typeof gainXP==='function'){ const g0 = gainXP; gainXP = function(c, s, amt){ g0(c, s, amt); if(c && c.owner==='p' && !c.drone){ if(s==='repair') hungerDrain(c, HUNGER_REPAIR*amt); else if(s==='combat') hungerDrain(c, HUNGER_KILL*amt); } }; }
  // hand-to-hand fighting burns food; keep the health penalty in step
  if(typeof armsTick==='function'){ const a0 = armsTick; armsTick = function(sh, dt){ a0(sh, dt); if(!sh || !hungerOn()) return; for(const c of sh.crew){ if(c.owner!=='p' || c.drone) continue; if(c._fT > 0) hungerDrain(c, HUNGER_FIGHT*dt); hungerSync(c); } }; }
  // the well fed work a little harder; the starving walk slower
  if(typeof armMult==='function'){ const m0 = armMult; armMult = function(c){ return m0(c) * (c && c.owner==='p' ? hungerBonus(c) : 1); }; }
  if(typeof armRepair==='function'){ const r0 = armRepair; armRepair = function(c){ return r0(c) * (c && c.owner==='p' ? hungerBonus(c) : 1); }; }
  if(typeof itemBuff==='function'){ const i0 = itemBuff; itemBuff = function(c, k){ let v = i0(c, k); if(k==='spd' && c && c.owner==='p' && hungerOn() && hungerMode()==='hardcore'){ const t = hungerTier(c); if(t && t.key==='starving') v -= .1; } return v; }; }
  // a new run starts with food for a few jumps and everyone fed
  if(typeof newRun==='function'){ const n0 = newRun; newRun = function(id, name, o = {}){ n0(id, name, o); if(!G || !G.ship) return; const n = crewMine().filter(eats).length; G.food = G.food != null ? G.food : n*4 + 2; for(const c of crewMine()){ c.food = 80; c.hungerHp = 0; } }; }
  // crew saved to the roster keep their real maximum health
  if(typeof rosterSnap==='function'){ const s0 = rosterSnap; rosterSnap = function(c, old){ const h = c && c.hungerHp; if(h){ c.maxHp += h; c.hungerHp = 0; } try{ return s0(c, old); } finally { if(h){ c.maxHp -= h; c.hungerHp = h; } } }; }
})();
