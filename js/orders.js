/* Admiral's orders: three small goals handed out at the start of each run: one about fighting, one about the voyage,
   one about life aboard. They are there to give a run some shape and to nudge captains towards parts of the game they
   might fly straight past. Each pays scrap and captain xp; all three pay a commendation bonus.
   Shown under "No hostiles in range" between fights, and on the Ship → Log tab. Not used in dailies, the Cup,
   challenges, the tutorial or multiplayer, so scores there stay comparable. */
const ORDER_PAY = 25, ORDER_XP = 20, ORDER_BONUS = 40;
function ordSys(){ return G && G.ship ? Object.values(G.ship.systems || {}).reduce((a, s) => a + (s && s.max || 0), 0) : 0; }
const ORDERS = {
  // fighting
  kills3:   { g:'fight', text:'Destroy 3 enemy ships', n:3, at:() => G.stats.kills || 0 },
  kills5:   { g:'fight', text:'Destroy 5 enemy ships', n:5, at:() => G.stats.kills || 0, min:2 },
  flawless: { g:'fight', text:'Win a fight without a scratch on the hull', n:1, at:() => G.stats.flawless || 0 },
  mercy:    { g:'fight', text:'Accept an enemy\'s surrender', n:1, key:'mercy' },
  crewkill: { g:'fight', text:'Win a fight by dealing with the crew, not the ship', n:1, key:'crewkill', ok:() => !!(G.ship.systems.teleporter) },
  quick:    { g:'fight', text:'Win a fight in under 40 seconds', n:1, key:'quick' },
  // the voyage
  sector4:  { g:'voyage', text:'Reach sector 4 with everyone still alive', n:1, at:() => G.sector >= 4 && !(G.lost || []).length ? 1 : 0, fail:() => (G.lost || []).length > 0 && G.sector < 4 },
  sector5:  { g:'voyage', text:'Reach sector 5', n:5, at:() => G.sector, show:false },
  distress: { g:'voyage', text:'Answer 2 distress calls', n:2, key:'distress' },
  stores:   { g:'voyage', text:'Visit 3 stores', n:3, key:'stores' },
  fuel:     { g:'voyage', text:'Enter a new sector with 10 or more fuel', n:1, key:'fuel10' },
  hull:     { g:'voyage', text:'Enter a new sector with a full hull', n:1, key:'fullhull' },
  // life aboard
  plant:    { g:'life', text:'Plant something in the garden (Ship → Cargo → Garden)', n:1, key:'plant', ok:() => typeof plant==='function' && Object.keys(G.seeds || {}).length > 0 },
  harvest:  { g:'life', text:'Harvest a crop from the garden', n:1, key:'harvest', ok:() => typeof harvest==='function' && Object.keys(G.seeds || {}).length > 0 },
  haggle:   { g:'life', text:'Haggle at a store, and win', n:1, key:'haggle', ok:() => typeof haggle==='function' },
  recruit:  { g:'life', text:'Take on a new crew member', n:1, key:'recruit' },
  upgrade:  { g:'life', text:'Upgrade 3 system levels', n:3, at:() => ordSys() - (G.orders.sys0 || 0) },
  spend:    { g:'life', text:'Spend 100 scrap in stores', n:100, at:() => G.spent || 0 },
  gift:     { g:'life', text:'Give one of the crew a gift (Ship → Crew)', n:1, key:'gift', ok:() => typeof giveGift==='function' } };
function ordersAllowed(){ return !!G && !G.daily && !G.cup && !G.tut && !G.challenge && !G.seedDuel && !G.practice && !(typeof NET!=='undefined' && NET.on); }
function ordersDeal(){
  if(!ordersAllowed() || G.orders) return; const r = typeof gzRng==='function' ? gzRng([...String(G.seed || 'x')].reduce((a, c) => a*31 + c.charCodeAt(0) | 0, 7)) : Math.random;
  G.orders = { list:[], sys0:ordSys(), n:{}, paid:false };
  for(const g of ['fight', 'voyage', 'life']){ const pool = Object.keys(ORDERS).filter(k => ORDERS[k].g===g && (!ORDERS[k].ok || ORDERS[k].ok()) && (ORDERS[k].min || 0) <= ({ easy:1, normal:2, hard:3 }[G.diff] || 2));
    if(pool.length) G.orders.list.push({ k:pool[Math.floor(r()*pool.length)], done:false }); }
}
function orderCount(k, n){ if(!G || !G.orders) return; G.orders.n[k] = (G.orders.n[k] || 0) + (n == null ? 1 : n); ordersCheck(); }
function orderProg(o){ const d = ORDERS[o.k]; if(!d) return 0; return d.at ? d.at() : (G.orders.n[d.key] || 0); }
function ordersCheck(){
  if(!G || !G.orders || UI.screen!=='game') return; const O = G.orders;
  for(const o of O.list){ const d = ORDERS[o.k]; if(!d || o.done || o.failed) continue;
    if(d.fail && d.fail()){ o.failed = true; continue; }
    if(orderProg(o) >= d.n){ o.done = true; G.scrap += ORDER_PAY; if(typeof capGain==='function') capGain(ORDER_XP); if(typeof sfx==='function') sfx('achieve');
      if(typeof toast==='function') toast(`Orders carried out: ${d.text.replace(/ \(.*\)$/, '')}. +${ORDER_PAY} scrap.`); if(typeof logEntry==='function') logEntry(`Carried out the Admiral's order: ${d.text.replace(/ \(.*\)$/, '').toLowerCase()}. +${ORDER_PAY} scrap.`, 'level'); } }
  if(!O.paid && O.list.length && O.list.every(o => o.done)){ O.paid = true; G.scrap += ORDER_BONUS; if(typeof capGain==='function') capGain(ORDER_XP*2); PROFILE.commend = (PROFILE.commend || 0) + 1; if(typeof saveProfile==='function') saveProfile();
    if(typeof toast==='function') toast(`All three orders carried out. Commendation from Admiral Hale: +${ORDER_BONUS} scrap.`); if(typeof logEntry==='function') logEntry(`All of the Admiral's orders carried out. A commendation, and ${ORDER_BONUS} scrap to go with it.`, 'win'); }
}
function drawOrders(x, y, w){
  if(!G || !G.orders || !G.orders.list.length) return 0; const O = G.orders, done = O.list.filter(o => o.done).length;
  rr(x - 12, y - 22, w + 24, 34 + O.list.length*28, 8); ctx.fillStyle = 'rgba(7,10,20,.55)'; ctx.fill();
  label(`Admiral's orders · ${done}/${O.list.length}`, x, y, O.paid ? C.good : C.amber, 'left', 13); let yy = y + 26;
  for(const o of O.list){ const d = ORDERS[o.k]; if(!d) continue; const p = Math.min(d.n, orderProg(o)), col = o.done ? C.good : o.failed ? C.muted : C.ink;
    rr(x, yy - 13, 15, 15, 3); ctx.strokeStyle = o.done ? C.good : o.failed ? C.muted : C.amber; ctx.lineWidth = 1.5; ctx.stroke();
    if(o.done){ ctx.beginPath(); ctx.moveTo(x + 3, yy - 6); ctx.lineTo(x + 6.5, yy - 2); ctx.lineTo(x + 12.5, yy - 10); ctx.strokeStyle = C.good; ctx.lineWidth = 2; ctx.stroke(); }
    else if(o.failed){ ctx.beginPath(); ctx.moveTo(x + 3.5, yy - 9.5); ctx.lineTo(x + 11.5, yy - 1.5); ctx.moveTo(x + 11.5, yy - 9.5); ctx.lineTo(x + 3.5, yy - 1.5); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.stroke(); }
    const t = d.text + (!o.done && !o.failed && d.n > 1 && d.show!==false ? `  (${p}/${d.n})` : '') + (o.failed ? '  (too late)' : '');
    yy += para(t, x + 26, yy, w - 26, { s:15, lh:20, c:col, max:2 }) + 6; }
  return yy - y;
}
(function(){
  const n0 = newRun; newRun = function(...a){ const r = n0(...a); try{ ordersDeal(); if(G && G.orders && typeof logEntry==='function') logEntry(`Orders from Admiral Hale: ${G.orders.list.map(o => ORDERS[o.k].text.replace(/ \(.*\)$/, '').toLowerCase()).join('; ')}.`, 'start'); }catch(e){} return r; };
  const a0 = arrive; arrive = function(i){ const sec = G && G.sector, r = a0(i); try{ if(G && G.orders){ const n = G.map.nodes[i]; if(n){ if(n.distress) orderCount('distress'); if(n.type==='store') orderCount('stores'); } ordersCheck(); } }catch(e){} return r; };
  const f0 = finishCombat; finishCombat = function(kind, offer){ const t0 = G && G._logFight ? G._logFight.t : null, tt = G ? (G.combatT || 0) : 0; f0(kind, offer);
    try{ if(G && G.orders){ if(kind==='surrender') orderCount('mercy'); if(kind==='crew') orderCount('crewkill'); if(kind!=='fled' && t0 != null && tt - t0 < 40) orderCount('quick'); if(kind==='destroyed' && G.orders.refused){ orderCount('nomercy'); } G.orders.refused = false; ordersCheck(); } }catch(e){} };
  const s0 = startCombat; startCombat = function(id, o){ const r = s0(id, o); try{ if(G && G.orders) G.orders.refused = false; }catch(e){} return r; };
  if(typeof genSector==='function'){ const g0 = genSector; genSector = function(n, type){ const r = g0(n, type); try{ if(G && G.orders && n > 1){ if(G.fuel >= 10) orderCount('fuel10'); if(G.ship.hull >= G.ship.maxHull) orderCount('fullhull'); ordersCheck(); } }catch(e){} return r; }; }
  if(typeof offerSurrender==='function'){ const o0 = offerSurrender; offerSurrender = function(sh){ const r = o0(sh); try{ if(G && G.orders) G.orders.refused = true; }catch(e){} return r; }; }
  if(typeof plant==='function'){ const f = plant; plant = function(i, k){ const r = f(i, k); if(r && G && G.orders) orderCount('plant'); return r; }; }
  if(typeof harvest==='function'){ const f = harvest; harvest = function(i){ let had = false; try{ had = !!garden().plots[i]; }catch(e){} const r = f(i); try{ if(had && !garden().plots[i] && G && G.orders) orderCount('harvest'); }catch(e){} return r; }; }
  if(typeof haggle==='function'){ const f = haggle; haggle = function(st){ const was = st && st.haggled, r = f(st); if(st && !was && st.haggled==='won' && G && G.orders) orderCount('haggle'); return r; }; }
  if(typeof joinCrew==='function'){ const f = joinCrew; joinCrew = function(...a){ const n = G ? G.ship.crew.filter(c => c.owner==='p' && !c.drone).length : 0, r = f(...a); if(G && G.orders && G.ship.crew.filter(c => c.owner==='p' && !c.drone).length > n) orderCount('recruit'); return r; }; }
  if(typeof giveGift==='function'){ const f = giveGift; giveGift = function(c, id){ const was = c && c.giftJ, r = f(c, id); if(c && c.giftJ!==was && G && G.orders) orderCount('gift'); return r; }; }
  const q0 = drawQuiet; drawQuiet = function(){ q0(); try{ if(G && G.orders && !G.modal){ ordersCheck(); const b = EBOX, boarders = G.ship.crew.some(c => typeof crewSide==='function' && crewSide(c)!=='p'); drawOrders(b.x + 20, b.y + (boarders ? 186 : 160), 420); } }catch(e){} };
})();
