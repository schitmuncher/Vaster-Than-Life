'use strict';
/* =========================================================================
   The frontier: more ideas from the open-world simulation research.
   - Ship facilities (Kairosoft-style layout): fit an empty room with a
     Hydroponics Bay, Crew Lounge, Galley, Armoury or Vending Machine. Each
     does something between jumps, and they make new room combos with each
     other and with systems. A vending machine is a "bridge": two rooms on
     either side of it count as linked.
   - Grief: lose a friend, sibling or sweetheart and the one left behind
     is furious: harder hits, slower repairs, until revenge or a few jumps.
   - The Long Lights: relight an old relay beacon (or restore the
     Communications Relay at Haven's Rest) and you can be called home from
     any beacon, once a sector.
   - Supply and demand: each sector has a shortage that stores pay double
     for, and selling a lot of one thing at one store floods its market.
   - Maximum heat: the blockade can be fought, bribed, or dodged through an
     uncharted wormhole.
   - Factions: the Mantlis despise running from a fight, and peoples who
     dislike you won't sign on as crew.
   ========================================================================= */

/* ---------------- facilities ---------------- */
const FACILITIES = {
  garden:  { name:'Hydroponics Bay', short:'Bay', icon:'🌱', cost:40, text:'One more planter, and every crop grows a little faster.' },
  lounge:  { name:'Crew Lounge', short:'Lounge', icon:'🛋', cost:35, text:'Downtime: everyone gains hearts each jump, and cabin fever sets in later.' },
  galley:  { name:'Galley', short:'Galley', icon:'🍲', cost:35, text:'Cooking makes one more portion of every meal.' },
  armoury: { name:'Armoury Rack', short:'Armoury', icon:'⚔', cost:40, text:'Personal kit is mended a little every jump.' },
  vending: { name:'Vending Machine', short:'Vending', icon:'🥤', cost:15, text:'A small cheer every jump. A bridge: the rooms either side of it count as linked for combos.' }
};
// combos that use facilities (living.js reads "f:" keys)
COMBOS.push(
  { id:'oasis',      name:'The Oasis',          sys:[['f:garden'], ['f:lounge']],           fx:{},           text:'Crops grow faster still, and the lounge gives twice the hearts.' },
  { id:'botanist',   name:'Botanist\'s Delight', sys:[['f:garden'], ['oxygen']],            fx:{ heal:.1 },  text:'Plants freshen the air: crew slowly heal anywhere.' },
  { id:'triage',     name:'Triage Centre',      sys:[['medbay','clonebay'], ['f:armoury']], fx:{ heal:.12 }, text:'Crew slowly heal anywhere, and kit is mended twice as fast.' },
  { id:'kitchen',    name:'The Galley Garden',  sys:[['f:galley'], ['f:garden']],           fx:{},           text:'Fresh from the planter to the pot: one more portion again.' },
  { id:'mess',       name:'Mess Hall',          sys:[['f:galley'], ['f:lounge']],           fx:{},           text:'Meals together: hearts for everyone every jump.' },
  { id:'arcade',     name:'Snack Corner',       sys:[['f:vending'], ['f:lounge']],          fx:{ speed:.05 }, text:'Sugar and gossip: crew move 5% faster.' }
);
function facRoomOk(sh, i){ const r = sh.rooms[i]; return !!r && !(r.sys && sh.systems[r.sys]); }
function facCount(f){ return G && G.ship ? G.ship.rooms.filter(r => r.fac===f).length : 0; }
function hasFac(f){ return facCount(f) > 0; }
function comboOn(id){ return !!(G && G.ship && typeof combosOf==='function' && combosOf(G.ship).some(c => c.id===id)); }
function facFit(i, f){ const sh = G.ship, r = sh.rooms[i], F = FACILITIES[f]; if(!r || !F || !facRoomOk(sh, i)) return;
  const free = (G.facStash || []).indexOf(f); const done = () => { if(r.fac) facStashAdd(r.fac); r.fac = f; sh._combos = null; UI.layoutShip = null; if(f==='garden' && typeof garden==='function'){ garden().plots.push(null); } toast(`${F.name} fitted.${combosOf(sh).length ? ' ' + combosOf(sh).length + ' combos active.' : ''}`); };
  if(free >= 0){ G.facStash.splice(free, 1); done(); sfx('buy'); save(); } else spend(F.cost, done); }
function facStashAdd(f){ (G.facStash = G.facStash || []).push(f); if(f==='garden' && typeof garden==='function'){ const gd = garden(), k = gd.plots.lastIndexOf(null); if(k >= 0 && gd.plots.length > 2) gd.plots.splice(k, 1); } }
function facRemove(i){ const r = G.ship.rooms[i]; if(!r || !r.fac) return; facStashAdd(r.fac); toast(`${FACILITIES[r.fac].name} packed away. Fit it again for free.`); r.fac = null; G.ship._combos = null; UI.layoutShip = null; save(); }
/* the row of facility buttons under the ship when a room is picked (Layout tab) */
function drawFacilityPicker(sh, i, x, y, w, here){
  const r = sh.rooms[i]; if(!r) return;
  if(!facRoomOk(sh, i)){ T('Rooms with a working system can\'t hold a facility.', x, y+34, { s:13, c:C.muted, max:w }); return; }
  const ks = Object.keys(FACILITIES), bw = Math.floor((w - (ks.length - 1)*8) / ks.length);
  ks.forEach((k, j) => { const F = FACILITIES[k], bx = x + j*(bw + 8), free = (G.facStash || []).includes(k), cur = r.fac===k;
    btn(bx, y+14, bw, 56, cur ? `${F.icon} ${F.short} ✓` : `${F.icon} ${F.short} · ${free ? 'free' : F.cost}`, () => { if(cur) return; if(!here){ toast('Fit facilities at a store or at home.'); return; } facFit(i, k); }, { s:13, disabled:cur || (!here) || (!free && G.scrap < F.cost), col:C.good, fill:cur });
    tip(bx, y+14, bw, 56, F.name, `${F.text}${free ? ' You have one packed away: fitting it is free.' : ` Costs ${F.cost} scrap.`}`); });
  if(r.fac) btn(x, y+78, 240, 40, 'Pack this one away', () => facRemove(i), { s:13, disabled:!here });
}
/* drawn in the room on the ship view (ui.js) */
function drawFacility(sh, i, q, cell){ const r = sh.rooms[i]; if(!r || !r.fac || (r.sys && sh.systems[r.sys]) || !FACILITIES[r.fac]) return;
  const F = FACILITIES[r.fac]; ctx.save(); ctx.globalAlpha *= .9; T(F.icon, q.x + q.w/2, q.y + q.h/2 + Math.min(14, cell*.3), { s:Math.max(14, Math.min(34, cell*.75)), a:'center' }); ctx.restore(); }
function facilityText(sh, i){ const r = sh.rooms[i]; return r && r.fac && FACILITIES[r.fac] ? `${FACILITIES[r.fac].name}: ${FACILITIES[r.fac].text}` : ''; }
// swapping rooms carries facilities along; installing a system packs a facility away
(function(){
  if(typeof swapRooms==='function'){ const s0 = swapRooms; swapRooms = function(a, b){ s0(a, b); const sh = G.ship, ra = sh.rooms[a], rb = sh.rooms[b]; if(!ra || !rb) return; const t = ra.fac; ra.fac = rb.fac; rb.fac = t;
    for(const r of [ra, rb]) if(r.fac && r.sys && sh.systems[r.sys]){ facStashAdd(r.fac); toast(`${FACILITIES[r.fac].name} packed away: that room has a system now.`); r.fac = null; } sh._combos = null; }; }
  if(typeof installSystem==='function'){ const i0 = installSystem; installSystem = function(sh, k){ const ok = i0(sh, k); if(ok && G && sh===G.ship){ const r = sh.rooms.find(x => x.sys===k); if(r && r.fac){ facStashAdd(r.fac); toast(`${FACILITIES[r.fac].name} packed away to make room for the new system. Fit it somewhere else in Ship → Layout.`); r.fac = null; sh._combos = null; } } return ok; }; }
  if(typeof cookMeal==='function'){ const c0 = cookMeal; cookMeal = function(k){ const before = goodsHave(k); c0(k); if(goodsHave(k) > before){ const extra = (hasFac('galley') ? 1 : 0) + (comboOn('kitchen') ? 1 : 0); if(extra && addGoods(k, extra)) toast(`The galley stretches it: +${extra} portion${extra > 1 ? 's' : ''}.`); } }; }
})();
/* between jumps */
function facilityJump(){
  const s = G.ship, crew = s.crew.filter(c => c.owner==='p' && !c.drone);
  if(hasFac('garden') && G.garden && G.hazard!=='ionstorm') for(const p of G.garden.plots) if(p) p.g += .2 + (comboOn('oasis') ? .2 : 0);
  let h = 0; if(hasFac('lounge')) h += comboOn('oasis') ? 10 : 5; if(hasFac('vending')) h += 2; if(comboOn('mess')) h += 6;
  if(h && typeof addHearts==='function') for(const c of crew) addHearts(c, h);
  if(hasFac('lounge') && G.away > 0) G.away = Math.max(0, G.away - .4);   // cabin fever comes later
  if(hasFac('armoury') && typeof armDef==='function'){ const m = comboOn('triage') ? 8 : 4; for(const c of crew) for(const it of [c.arm, c.suit]){ const d = it && armDef(it); if(d && it.dur > 0) it.dur = Math.min(d.dur, it.dur + m); } }
}

/* ---------------- grief ---------------- */
(function(){ if(typeof sagaDeath!=='function') return; const d0 = sagaDeath;
  sagaDeath = function(c, sh, cause){ const b = typeof bondOf==='function' ? bondOf(c) : null; d0(c, sh, cause);
    if(b && b.other && b.other.owner==='p' && b.kind!=='rivals' && G){ const o = b.other; o.grief = 3; if(typeof addHearts==='function') addHearts(o, -100); toast(`${o.name} is grieving, and furious: they fight harder and repair a little slower until you win a fight or a few jumps pass.`);
      G.later.push({ event:'fr_grief', jumps:ri(1, 2), star:o.id }); } }; })();
/* grief is fury, not a slump: +25% hand-to-hand damage, 8% slower repairs, and winning the next fight settles it */
(function(){ if(typeof bondMult!=='function') return; const b0 = bondMult; bondMult = function(c, kind){ const m = b0(c, kind); return c && c.grief > 0 ? (kind==='dps' ? m * 1.25 : kind==='rep' ? m * .92 : m) : m; }; })();
(function(){ if(typeof finishCombat!=='function') return; const f0 = finishCombat; finishCombat = function(kind, offer){ const had = !!(G && G.enemy); f0(kind, offer);
  if(had && kind!=='fled' && G && G.ship) for(const c of G.ship.crew) if(c.owner==='p' && c.grief > 0){ c.grief = 0; toast(`${c.name} has had their revenge. They're ready to carry on.`); } }; })();
function griefJump(){ for(const c of G.ship.crew) if(c.grief > 0){ c.grief--; if(!c.grief) toast(`${c.name} is starting to smile again.`); } }
BASE.events.fr_grief = { id:'fr_grief', moment:true, star:'any', once:false, title:'Grief', art:'ship', text:'{crew} hasn\'t said much since the funeral. They sit alone in the mess with a cold cup of tea, turning a keepsake over and over in their hands.',
  choices:[
    { text:'Cook something and sit with them.', req:{ goodsKind:'meal' }, effect:{ text:'You eat together without talking much. At the end {crew} says "Thanks, captain," and means it.', eatGoods:'meal', griefEnd:true, starHearts:60 } },
    { text:'Give them the next few watches off.', effect:{ text:'{crew} sleeps for a whole day. It helps, a bit.', griefEnd:'half', starHearts:20 } },
    { text:'Ask {crew} to tell you about them.', chance:.6, success:{ text:'The stories go on for hours, and by the end {crew} is laughing as much as crying.', griefEnd:true, starHearts:40 }, fail:{ text:'{crew} gets up and walks out. It\'s too soon.', starHearts:0 } },
    { text:'Leave them be.', effect:{ text:'Some things only time can do.', starHearts:0 } } ] };
function griefEffect(e, L){ if(!e.griefEnd || !G) return; const cx = G.evCtx || {}, c = cx.starId && typeof crewById==='function' ? crewById(cx.starId) : null; if(!c || !c.grief) return;
  c.grief = e.griefEnd==='half' ? Math.floor(c.grief/2) : 0; L.push(c.grief ? `${c.name} feels a little better` : `${c.name} is ready to carry on`); }

/* ---------------- the Long Lights: called home from anywhere ---------------- */
BASE.events.fr_longlight = { id:'fr_longlight', tags:[''], flag:'havenOn', weight:.55, minSector:1, art:'station', title:'A dark relay', text:'A relay beacon, one of the old Long Lights that once tied this sector to Haven\'s Rest. Its lamp is cold, but the coils look sound.',
  choices:[
    { text:'Relight it with spare parts (2 drone parts).', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'The lamp blinks, then burns steady. Haven\'s Rest can call you home from anywhere in this sector, once.', longLight:true } },
    { text:'Let {who} coax it back to life.', req:{ race:'enjinn' }, effect:{ text:'{who} hums at the coils until they hum back. The Long Light burns again: Haven\'s Rest can call you home from anywhere in this sector, once.', longLight:true } },
    { text:'Strip the copper and sell it.', effect:{ text:'Good copper, too. Nobody will be relighting this one.', scrap:16 } },
    { text:'Leave it dark.', effect:{ text:'Maybe someone else will fix it.' } } ] };
function relayHomeOk(){ if(!G || !havenPerksOn() || G.sector+1 >= R.sectors || G.relayUsed===G.sector || G.enemy) return false; return havenDone('relay') || G.longLight===G.sector; }
function relayHome(){ if(!relayHomeOk()) return; if(G.fuel < 2){ toast('The relay needs 2 fuel.'); return; } G.fuel -= 2; G.relayUsed = G.sector; G.fleetX += fleetStep()*.5; sfx('tele');
  const i = G.map.cur; havenArrive(G.map.nodes[i], i); toast('The Long Light pulls you home. The Fleet creeps a little closer.'); }
function drawRelayButton(f, ay, ah){ if(!relayHomeOk()) return; const x = f.x + f.w - 330, y = ay + ah - 66;
  btn(x, y, 300, 54, 'Relay home · 2 fuel', () => relayHome(), { s:16, col:'#9fdc7a', disabled:G.fuel < 2 });
  tip(x, y, 300, 54, 'Relay home', `${havenDone('relay') ? 'The Communications Relay at Haven\'s Rest' : 'The Long Light you relit'} can pull you home from here, once a sector. Rest, repair, sell and store guns, then come back to this beacon. Costs 2 fuel, and the Fleet moves half a jump.`); }

/* ---------------- supply and demand ---------------- */
const SHORTAGE_POOL = ['space_wine','sloog_silk','voltan_cell','enjinn_spice','old_books','toy_robots','pebble_geode','mantlis_chitin','rations','pyrate_rum','nebula_crystal','preserves','star_stew','fish_supper'];
function shortageGood(){ if(!G) return null; if(!G.shortage || G.shortage.s!==G.sector){ const pool = SHORTAGE_POOL.filter(id => goodsDef(id)); if(!pool.length) return null;
    G.shortage = { s:G.sector, id:withSeed(`short${G.sector}`, () => pick(pool)) }; const nm = goodsDef(G.shortage.id).name, gs = G; setTimeout(() => { if(G===gs && typeof toast==='function') toast(`Shortage in this sector: ${nm}. Stores here pay double for it.`); }, 2600); } return G.shortage.id; }
function storeOf(){ const m = G && G.modal; return m && m.type==='store' && G.map && G.map.nodes[m.node] ? G.map.nodes[m.node].store : null; }
(function(){
  if(typeof goodsPrice==='function'){ const g0 = goodsPrice; goodsPrice = function(id, st, selling){ let p = g0(id, st, selling); if(!selling || !G) return p;
    if(G.shortage && G.shortage.s===G.sector && G.shortage.id===id) p *= 2;
    const n = st && st.soldN ? st.soldN[id] || 0 : 0; if(n) p *= Math.max(.55, Math.pow(.9, n));
    return Math.max(1, Math.round(p)); }; }
  if(typeof takeGoods==='function'){ const t0 = takeGoods; takeGoods = function(id, n){ const r = t0(id, n); const st = storeOf(); if(r && st && UI.storeTab==='sell'){ st.soldN = st.soldN || {}; st.soldN[id] = (st.soldN[id] || 0) + (typeof n==='number' ? n : 1); } return r; }; }
  if(typeof sellables==='function'){ const s0 = sellables; sellables = function(st){ const L = s0(st), sh = G.shortage && G.shortage.s===G.sector ? G.shortage.id : null;
    for(const it of L){ if(!it.key || !it.key.startsWith('g:')) continue; const id = it.key.slice(2), n = st && st.soldN ? st.soldN[id] || 0 : 0;
      if(id===sh){ it.hot = true; it.sub = 'Shortage here: paying double'; }
      if(n >= 2) it.sub = `Market flooded: ${Math.round(Math.max(.55, Math.pow(.9, n))*100)}% price`; } return L; }; }
})();

/* ---------------- maximum heat: fight, bribe or the wormhole ---------------- */
BASE.events.fr_blockade = { id:'fr_blockade', questOnly:true, triggered:true, title:'Blockade', art:'fleet', text:'The exit beacon is ringed with Rebuff interdictors, guns out, transponders screaming. "Courier. Power down and prepare to be boarded." Behind them, sensors find something else: a ragged, uncharted wormhole, flickering in and out.',
  choices:[
    { text:'Break through.', effect:{ text:'All guns on the nearest interdictor.', fight:'rb_blockade', afterWin:{ text:'The blockade breaks. The exit is yours.', heatDrop:30, scrap:40, openExit:true } } },
    { text:'Pay the commander to look away (90 scrap).', req:{ scrap:90 }, cost:{ scrap:90 }, effect:{ text:'"We never saw you." The line opens just long enough.', heatDrop:20, openExit:true } },
    { text:'Dive into the wormhole.', chance:.55, success:{ text:'The ship screams through folded space and spits out beyond the blockade, the trail cold behind you.', heatDrop:40, openExit:true }, fail:{ text:'The wormhole chews on the hull before it lets you go. You come out past the blockade, but not in one piece.', hull:-6, scar:'random', heatDrop:25, openExit:true } } ] };
(function(){ if(typeof heatIntercept!=='function') return; const h0 = heatIntercept;
  heatIntercept = function(node, first){ if(G && havenPerksOn() && first && !G.flag && node.type==='exit' && heat() >= 90 && !G.blockadeBeat){ G.blockadeBeat = true; startEvent('fr_blockade'); return true; } return h0(node, first); }; })();
function frontierEffect(e, L){ if(!e || !G) return; griefEffect(e, L);
  if(e.longLight){ G.longLight = G.sector; L.push('Relay home unlocked for this sector (map)'); }
  if(e.openExit){ G.openExit = true; } }

/* ---------------- factions ---------------- */
const RACE_FACTION = { mantlis:'mantlis', sloog:'sloog', voltan:'voltan', enjinn:'enjinn', pebblekin:'pebblekin' };
function repRefuses(race){ const f = RACE_FACTION[race]; if(!f || typeof repTier!=='function' || !havenPerksOn()) return null; const t = repTier(f)[1]; return t==='Despised' || t==='Disliked' ? FACTIONS[f].name : null; }
(function(){ if(typeof jumpTo!=='function') return; const j0 = jumpTo; jumpTo = function(i){ const fleeing = G && G.enemy && !G.enemy.dead && !G.boss && canJump() && G.fuel > 0; j0(i); if(fleeing && typeof repAdd==='function' && havenPerksOn()) repAdd('mantlis', -3, 'running from a fight'); }; })();

/* ---------------- hooks ---------------- */
function frontierArrive(node, first){ if(!G || !G.ship) return; if(typeof economyArrive==='function') economyArrive(); if(typeof expeditionArrive==='function') expeditionArrive(node, first); facilityJump(); griefJump(); if(havenPerksOn()){ G.flags = G.flags || {}; G.flags.havenOn = true; shortageGood(); } }
if(typeof HAVEN_WINGS!=='undefined'){ const w = HAVEN_WINGS.find(x => x.id==='relay'); if(w) w.reward = 'The Gate Network: every run starts with +4 fuel and the first sector\'s map revealed, and the relay can call you home from any beacon once a sector.'; }
