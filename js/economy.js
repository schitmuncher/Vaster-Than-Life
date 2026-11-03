'use strict';
/* =========================================================================
   A living economy: convoys on the map.
   - Each sector has a couple of trade convoys (a faction's freighters, or a
     Rebuff payroll barge) crawling one beacon per jump towards a store.
     They show on the map with their route.
   - Meet one and you can raid it (the faction is furious, unless you run
     dark with a cloak or stealth plating), fly escort (they pay, and like
     you for it), trade with it, or let it pass.
   - Raid a convoy and its store goes short: that store pays far more for
     the cargo, and charges more for it too. Escort it in, and the store is
     well stocked: cheaper to buy there.
   ========================================================================= */
BASE.enemies.ec_freighter = { name:'Convoy Freighter', tags:['convoy'], eventOnly:true, hull:9, sectors:[1, 9], systems:{ shields:2, engines:1, oxygen:1, weapons:1, piloting:1, doors:1 }, weapons:['basic'], crew:['human', 'human'], style:'fed' };
BASE.enemies.ec_payroll = { name:'Rebuff Payroll Barge', tags:['rebuff'], eventOnly:true, hull:11, sectors:[1, 9], systems:{ shields:2, engines:1, oxygen:1, weapons:2, piloting:1, doors:1 }, weapons:['basic', 'ion'], crew:['human', 'human'], style:'rebuff' };
const CONVOY_FACS = ['sloog', 'pebblekin', 'enjinn', 'voltan', 'mantlis', 'rebuff'];
function convoys(){ return (G && G.convoys) || []; }
/* a route from a beacon to a store, shortest first */
function convoyPath(nodes, from, to){ const prev = { [from]:null }, q = [from]; while(q.length){ const k = q.shift(); if(k===to) break; for(const n of nodes[k].links) if(!(n in prev)){ prev[n] = k; q.push(n); } }
  if(!(to in prev)) return null; const path = []; for(let k = to; k!=null; k = prev[k]) path.unshift(k); return path; }
function makeConvoys(){
  if(!G || !G.map || sectorDef().final || (typeof campDef==='function' && campDef()) || G.daily || G.cup) { if(G) G.convoys = []; return; }
  const nodes = G.map.nodes, stores = nodes.map((n, i) => i).filter(i => nodes[i].type==='store'); G.convoys = [];
  withSeed(`convoy${G.sector}`, () => { const n = stores.length ? ri(1, 2) : 0;
    for(let k = 0; k < n; k++){ const dest = pick(stores), starts = nodes.map((nd, i) => i).filter(i => i!==dest && nodes[i].type!=='exit' && nodes[i].type!=='store' && Math.abs(nodes[i].col - nodes[dest].col) >= 2);
      if(!starts.length) continue; const from = pick(starts), path = convoyPath(nodes, from, dest); if(!path || path.length < 3) continue;
      const fac = pick(CONVOY_FACS), good = (typeof factionGood==='function' && factionGood(fac)) || 'rations';
      G.convoys.push({ id:k, fac, good, path, pos:0, dest, gone:false, escort:false }); } }); }
(function(){ if(typeof genSector!=='function') return; const g0 = genSector; genSector = function(n, type){ const r = g0(n, type); try{ makeConvoys(); }catch(e){} return r; }; })();
function convoyName(c){ return c.fac==='rebuff' ? 'Rebuff payroll barge' : `${FACTIONS[c.fac] ? FACTIONS[c.fac].name.split(' ')[0] : c.fac} convoy`; }
/* every jump the convoys move one beacon on */
function convoyJump(){ for(const c of convoys()){ if(c.gone) continue; c.pos++;
    if(c.pos >= c.path.length - 1){ c.gone = true; const nd = G.map.nodes[c.dest]; if(!nd) continue;
      nd.market = { id:c.good, kind:'surplus' };   // it got there: plenty of stock
      if(c.escort){ G.scrap += 30; G.stats.scrap += 30; if(FACTIONS[c.fac] && typeof repAdd==='function') repAdd(c.fac, 10, 'a safe delivery'); toast(`The ${convoyName(c)} you escorted made it to port. They pay 30 scrap, with thanks.`); } } } }
function convoyAt(i){ return convoys().find(c => !c.gone && c.path[c.pos]===i); }
/* meeting one: the event is rewritten for this convoy each time */
function convoyEvent(c){ const nm = convoyName(c), gd = goodsDef(c.good), store = G.map.nodes[c.dest], rebuff = c.fac==='rebuff', price = Math.max(4, Math.round((gd ? gd.base : 10) * .6));
  const dark = { text:'Run dark and take it.', req:{ hide:true, system:'cloaking' }, effect:{ text:'Transponder off, cloak up. They never see who hit them.', fight:rebuff ? 'ec_payroll' : 'ec_freighter', afterWin:{ text:`The holds are full of ${gd ? gd.name.toLowerCase() : 'cargo'}.`, goods:{ [c.good]:3 }, scrap:20, convoyRaid:true }, heat:4 } };
  const darkAug = { text:'Run dark behind the stealth plating and take it.', req:{ augment:'stealth' }, effect:dark.effect };
  DATA.events.ec_convoy = { id:'ec_convoy', questOnly:true, triggered:true, title:nm, art:'ship', text:`A ${nm.toLowerCase()} is crawling past, heavy with ${gd ? gd.name.toLowerCase() : 'cargo'}, bound for the store ${Math.max(1, c.path.length - 1 - c.pos)} jump${c.path.length - 1 - c.pos === 1 ? '' : 's'} on. ${rebuff ? 'Payroll for a whole Rebuff garrison. The Pyrate Kings would love you for this.' : 'Its escort is thin.'}`,
    choices:[
      { text:'Raid it.', effect:{ text:'Guns out. They scramble to defend the cargo.', fight:rebuff ? 'ec_payroll' : 'ec_freighter', afterWin:{ text:`The holds are full of ${gd ? gd.name.toLowerCase() : 'cargo'}.`, goods:{ [c.good]:3 }, scrap:rebuff ? 45 : 20, convoyRaid:true }, rep:rebuff ? { pyrate:8 } : { [c.fac]:-15 }, heat:rebuff ? 12 : 6 } },
      dark, darkAug,
      ...(rebuff ? [] : [{ text:'Fly escort to port.', effect:{ text:'You fall in beside them. The convoy captain sounds relieved.', convoyEscort:true } }]),
      { text:`Buy some cargo (3 for ${price*3} scrap).`, req:{ scrap:price*3 }, cost:{ scrap:price*3 }, effect:{ text:'A quick, honest trade between hulls.', goods:{ [c.good]:3 } } },
      { text:'Let it pass.', effect:{ text:'You watch it go.' } } ] };
  G.convoyHere = c.id; startEvent('ec_convoy'); }
function economyEffect(e, L){ if(!e || !G) return; const c = convoys().find(x => x.id===G.convoyHere); if(!c) return;
  if(e.convoyRaid){ c.gone = true; const nd = G.map.nodes[c.dest]; if(nd){ nd.market = { id:c.good, kind:'deficit' }; L.push(`The store ${c.path.length - 1 - c.pos} jumps on will be short of ${goodsDef(c.good).name.toLowerCase()}`); } }
  if(e.convoyEscort){ c.escort = true; L.push('Stay out of trouble till it docks, and they will pay'); } }
/* store prices: a raided store is desperate, a supplied one is cheap */
function nodeOfStore(st){ return G && G.map && st ? G.map.nodes.find(n => n.store===st) : null; }
(function(){
  if(typeof goodsPrice==='function'){ const g0 = goodsPrice; goodsPrice = function(id, st, selling){ let p = g0(id, st, selling); const nd = nodeOfStore(st), mk = nd && nd.market; if(!mk || mk.id!==id) return p;
    p *= mk.kind==='deficit' ? (selling ? 2.5 : 1.6) : (selling ? .8 : .6); return Math.max(1, Math.round(p)); }; }
  if(typeof sellables==='function'){ const s0 = sellables; sellables = function(st){ const L = s0(st), mk = (nodeOfStore(st) || {}).market; if(mk && mk.kind==='deficit') for(const it of L) if(it.key==='g:' + mk.id){ it.hot = true; it.sub = 'Convoy raided: paying ×2.5'; } return L; }; }
})();
/* the map: convoys and where they are heading */
function drawConvoys(mx, my, nodes, t){
  for(const c of convoys()){ if(c.gone) continue; const here = nodes[c.path[c.pos]]; if(!here) continue; const col = c.fac==='rebuff' ? C.hostile : (FACTIONS[c.fac] || {}).col || C.amber;
    ctx.save(); ctx.setLineDash([4, 6]); ctx.lineDashOffset = -t*10; ctx.strokeStyle = hexA(col, .55); ctx.lineWidth = 2; ctx.beginPath();
    for(let k = c.pos; k < c.path.length; k++){ const n = nodes[c.path[k]]; if(k===c.pos) ctx.moveTo(mx(n), my(n)); else ctx.lineTo(mx(n), my(n)); } ctx.stroke(); ctx.restore();
    const x = mx(here) + 22, y = my(here) - 22; ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -6); ctx.lineTo(-4, 0); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    T(convoyName(c), x + 14, y + 5, { s:11, c:col }); tip(x - 12, y - 12, 24, 24, convoyName(c), `Carrying ${goodsDef(c.good).name.toLowerCase()} to a store ${c.path.length - 1 - c.pos} jumps away. It moves one beacon each time you jump. Meet it to raid it, escort it or trade.`); } }
/* meeting a convoy comes before the beacon's own business (wraps the hunters check) */
(function(){ if(typeof heatIntercept!=='function') return; const h0 = heatIntercept;
  heatIntercept = function(node, first){ const r = h0(node, first); if(r) return r; if(!G || G.flag) return false; const c = convoyAt(G.map.cur); if(c && node.type!=='store' && node.type!=='haven' && node.type!=='base'){ convoyEvent(c); return true; } return false; }; })();
function economyArrive(){ if(G && G.convoys) convoyJump(); }
