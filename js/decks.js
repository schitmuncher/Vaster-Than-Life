'use strict';
/* =========================================================================
   Capital ships: two decks.
   Picked as a game option (Ship: Capital). Your ship gets a lower deck of
   rooms under the main one, joined by ladders, and bigger enemies get one
   too. The lower deck is drawn as a cutaway beneath the main deck.
   - Protected: only missiles and bombs reach the lower deck. Lasers, ion,
     flak and beams hit the room above it instead. Moving a vital system
     downstairs keeps it safe, at the price of longer walks for the crew.
   - High ground: crew on the upper end of a ladder fire down the hatch at
     enemies in the room below, and can't be hit back from there.
   - Falling: a Gravity Hammer's knockback at the top of a ladder sends the
     foe through the hatch with a crunch.
   - Sabotage: enemy capitals keep their oxygen (and medbay) below decks:
     missiles, bombs or a boarding party are the only ways in.
   ========================================================================= */
function deckOf(sh, i){ const r = sh && sh.rooms && sh.rooms[i]; return r && r.deck ? 1 : 0; }
function hasDecks(sh){ return !!(sh && sh.rooms && sh.rooms.some(r => r.deck===1)); }
function ladders(sh){ return (sh && sh.doors || []).filter(d => d.ladder); }
function upperH(sh){ let h = 0; for(const r of sh.rooms) if(!r.deck) h = Math.max(h, r.y + r.h); return h; }
/* add a lower deck of n rooms (2x2) under the middle of the ship, with up to two ladders */
function addLowerDeck(sh, n){
  if(!sh || hasDecks(sh)) return false; const H = upperH(sh), y = H + 1; let gw = 0; for(const r of sh.rooms) gw = Math.max(gw, r.x + r.w);
  const xs = []; for(let x = 2; x + 2 <= gw - 1 && xs.length < n; x += 2) xs.push(x); if(xs.length < 2) return false;
  const first = sh.rooms.length;
  for(const x of xs) sh.rooms.push({ sys:'', x, y, w:2, h:2, deck:1, o2:100, fire:0, fireP:0, fireOut:0, fireDmg:0, breach:0, breachP:0, sab:0 });
  sh.doors = null; buildGraph(sh);
  const want = xs.length >= 3 ? [first, sh.rooms.length - 1] : [first]; let made = 0;
  for(const li of want){ const r = sh.rooms[li]; for(const xx of [r.x, r.x + 1]){ const ui = sh.cellRoom[xx + ',' + (H - 1)]; if(ui!=null && !sh.rooms[ui].deck){ sh.doors.push({ a:ui, b:li, ca:[xx, H - 1], cb:[xx, y], open:false, passT:0, brk:0, broken:0, ladder:true }); made++; break; } } }
  if(!made){ sh.rooms.splice(first); sh.doors = null; buildGraph(sh); return false; }
  buildGraph(sh); sh._combos = null; sh._art = null; return true; }
/* the room on the main deck right above a lower-deck room */
function roomAbove(sh, li){ const r = sh.rooms[li], H = upperH(sh); for(const xx of [r.x, r.x + 1]){ const ui = sh.cellRoom[xx + ',' + (H - 1)]; if(ui!=null && !sh.rooms[ui].deck) return ui; }
  let best = 0, bd = 1e9; sh.rooms.forEach((q, i) => { if(q.deck) return; const d = Math.abs((q.x + q.w/2) - (r.x + r.w/2)); if(d < bd){ bd = d; best = i; } }); return best; }
/* move a system downstairs (enemy capitals hide their life support) */
function sysBelow(sh, k){ const from = roomOf(sh, k); if(from < 0 || sh.rooms[from].deck) return; const li = sh.rooms.findIndex(r => r.deck===1 && !r.sys); if(li < 0) return;
  sh.rooms[li].sys = k; sh.rooms[from].sys = ''; for(const c of sh.crew) if(c.station===from) c.station = li; sh._combos = null; }
/* only missiles and bombs reach the lower deck */
(function(){
  const f0 = fireWeapon; fireWeapon = function(sh, w, foe){ const d = DATA.weapons[w.id]; let keep = null;
    if(foe && d && !d.heal && w.target!=null && deckOf(foe, w.target) && d.type!=='missile' && d.type!=='bomb'){ keep = w.target; w.target = roomAbove(foe, w.target); }
    const r = f0(sh, w, foe); if(keep!=null && w.target!=null) w.target = keep; return r; };
  const n0 = nearbyRoom; nearbyRoom = function(sh, ri_, rad){ const r = n0(sh, ri_, rad); return hasDecks(sh) && deckOf(sh, r) && !deckOf(sh, ri_) ? ri_ : r; };
  const b0 = beamRooms; beamRooms = function(sh, ri_, n){ const r = b0(sh, ri_, n + (hasDecks(sh) ? 2 : 0)); return hasDecks(sh) ? r.filter(i => !deckOf(sh, i)).slice(0, Math.max(1, n)) : r; };
})();
/* high ground: fire down the hatch; knockbacks become falls */
function deckTick(sh, dt){
  if(!hasDecks(sh)) return;
  for(const d of ladders(sh)){ const up = d.a, lo = d.b; const inUp = sh.crew.filter(c => c.room===up && !c.path.length && c.hp > 0 && c.stunT <= 0), inLo = sh.crew.filter(c => c.room===lo && c.hp > 0);
    for(const side of ['p', 'e']){ const shooters = inUp.filter(c => crewSide(c)===side && !c.drone); if(!shooters.length || inUp.some(c => crewSide(c)!==side)) continue;
      const targets = inLo.filter(c => crewSide(c)!==side); if(!targets.length) continue; let tgt = targets[0]; for(const o of targets) if(o.hp < tgt.hp) tgt = o;
      for(const a of shooters){ const dealt = crewDps(a) * (typeof armMult==='function' ? armMult(a) : 1) * .4 * dt * (typeof armTake==='function' ? armTake(tgt) : 1); tgt.hp -= dealt; tgt.lastByCrew = a.id;
        if(tgt.hp <= 0 && !tgt._counted){ tgt._counted = true; a.kills = (a.kills||0) + 1; gainXP(a, 'combat', 1); } }
      if(sh._rects && Math.random() < dt*.8){ const q = roomCenter(sh, lo); fx('text', q.x, q.y - 34, 'FIRE FROM ABOVE'); } } } }
(function(){ if(typeof armsTick==='function'){ const a0 = armsTick; armsTick = function(sh, dt){ a0(sh, dt); try{ deckTick(sh, dt); }catch(e){} }; }
  if(typeof armShove==='function'){ const s0 = armShove; armShove = function(sh, c, room){ const L = ladders(sh).find(d => d.a===room); if(L && Math.random() < .6){ placeCrew(sh, c, L.b); c.hp -= 15; c.stunT = Math.max(c.stunT||0, 1.2);
      if(sh._rects){ const q = roomCenter(sh, L.b); fx('text', q.x, q.y - 40, 'THROUGH THE FLOOR'); } if(typeof sfx==='function') sfx('crunch'); return; } s0(sh, c, room); }; } })();
/* drawing: ladders through the gap, and a label for the lower deck */
function drawLadders(sh, cell, mini){
  if(!hasDecks(sh) || !sh._b) return;
  for(const d of ladders(sh)){ const a = cellXY(sh, d.ca[0], d.ca[1]), b = cellXY(sh, d.cb[0], d.cb[1]); const w = cell*.34;
    ctx.save(); ctx.strokeStyle = '#b89f74'; ctx.lineWidth = Math.max(2, cell*.05); ctx.beginPath(); ctx.moveTo(a.x - w/2, a.y + cell*.3); ctx.lineTo(b.x - w/2, b.y - cell*.3); ctx.moveTo(a.x + w/2, a.y + cell*.3); ctx.lineTo(b.x + w/2, b.y - cell*.3);
    for(let k = 1; k < 5; k++){ const yy = a.y + cell*.3 + (b.y - a.y - cell*.6)*k/5; ctx.moveTo(a.x - w/2, yy); ctx.lineTo(a.x + w/2, yy); } ctx.stroke(); ctx.restore(); }
  if(!mini){ const lo = sh.rooms.findIndex(r => r.deck===1), q = sh._rects && sh._rects[lo]; if(q) label('Lower deck', q.x, q.y - 6, '#8592b0', 'left', Math.max(9, Math.min(12, cell*.2))); } }
function deckText(sh, i){ return deckOf(sh, i) ? 'Lower deck: only missiles and bombs reach it; other shots hit the deck above.' : ''; }
/* the capital option: your ship and the bigger enemies get a lower deck */
function capitalAllowed(o){ return typeof expAllowed==='function' ? expAllowed(o) : !(o && (o.daily || o.cup || o.challenge)); }
(function(){ const n0 = newRun; newRun = function(id, name, o = {}){ n0(id, name, o);
  if(G && SET.shipMode==='capital' && capitalAllowed(o)){ if(addLowerDeck(G.ship, 3)){ G.capital = true; G.ship.maxHull += 5; G.ship.hull += 5; G.ship.reactor += 1; logEntry(`${G.ship.name} was refitted as a capital ship, with a lower deck.`); save(); } } }; })();
(function(){ if(typeof livingCombatStart!=='function') return; const l0 = livingCombatStart;
  livingCombatStart = function(e, def, o){ l0(e, def, o); if(!G || !G.capital || !e || e.auto) return;
    const big = (def && def.boss) || (o && o.elite) || e.hunter || (G.sector >= 3 && Math.random() < .35);
    if(big && addLowerDeck(e, def && def.boss ? 3 : 2)){ sysBelow(e, 'oxygen'); sysBelow(e, 'medbay'); e.hull += 3; e.maxHull = (e.maxHull||e.hull) + 3; } }; })();
