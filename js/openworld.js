'use strict';
/* =========================================================================
   A more open galaxy, without losing the chase.
   - Heat: how much attention the Mandate Directorate is paying to you. Loud
     play (destroying Mandate ships, beating fleet ships, boarding) raises it;
     quiet play (empty beacons, nebulas, going home, cloaking) lets it cool.
     At 40 the Fleet moves faster; at 70 hunter-killers drop in on you; at 90
     the exit beacon is blockaded and you must fight through. Forged
     transponder codes and bribes bring it down.
   - Contracts: side jobs from store noticeboards and Haven's Rest:
     deliveries to a later sector, bounties on a faction's ships, and survey
     jobs. Reward scrap and faction standing; a few at a time.
   - Home between sectors: at an exit beacon you can drop in at Haven's Rest
     before choosing the next sector.
   - Faction ships: become Revered by a faction and it gives you one of its
     ship designs for good.
   - Pip at home: with Pip living at Haven's Rest, the Dreadnought's defences
     are decoded before every final battle.
   ========================================================================= */

/* ---------------- heat ---------------- */
function heat(){ return (G && G.heat) || 0; }
function heatAdd(n, why){ if(!G || !havenPerksOn() || !n) return; const b = heatTier(); G.heat = clamp(heat() + n, 0, 100); const a = heatTier();
  syncHeatChip(); if(a[0] > b[0]) toast(`Heat: ${a[1]}. ${a[2]}${why ? ' (' + why + ')' : ''}`); else if(a[0] < b[0] && a[0]===0) toast('The Mandate have lost interest in you, for now.'); }
function syncHeatChip(){ if(!G) return; G.anom = G.anom || {}; if(heat() >= 20) G.anom.heatShow = true; else delete G.anom.heatShow; }
function heatTier(){ const h = heat(); return h >= 90 ? [3, 'Blockade', 'The exit beacon will be blockaded.'] : h >= 70 ? [2, 'Hunted', 'Hunter-killers are looking for you.'] : h >= 40 ? [1, 'Noticed', 'The Fleet is moving faster.'] : [0, 'Quiet', '']; }
function heatFleetMult(){ return heat() >= 40 ? 1.1 : 1; }
function heatArrive(node, first){
  if(!G || !havenPerksOn()) return; let d = 0;
  if(node.type==='haven') d -= 12; else if(node.type==='store') d -= 3; else if(first && (node.type==='empty' || node.nebula)) d -= node.nebula ? 8 : 5;
  if(G.ship.systems.cloaking || (typeof hasAug==='function' && hasAug(G.ship, 'stealth'))) d -= 1;
  if(d) G.heat = clamp(heat() + d, 0, 100); syncHeatChip();
}
function heatCombatEnd(kind, e){
  if(!e || e.boss || !havenPerksOn()) return; const f = e.faction;
  if(kind==='destroyed') heatAdd(f==='rebuff' || e.fleet ? 10 : 4, f==='rebuff' ? 'a Mandate ship destroyed' : '');
  else if(kind==='crew') heatAdd(f==='rebuff' ? 6 : 2);
  if(e.hunter) G.heat = clamp(heat() - 15, 0, 100);   // beat the hunters and the trail goes cold for a while
}
/* hunters and blockades, before a beacon's own business */
function heatIntercept(node, first){
  if(!G || !havenPerksOn() || !first || G.flag) return false;
  if(node.type==='exit' && heat() >= 90 && !G.blockadeBeat){ G.blockadeBeat = true; startCombat('rb_blockade', { hail:'hunter', afterWin:{ text:'The blockade breaks. The exit is yours.', heatDrop:30, scrap:40 } }); return true; }
  if(['event','combat','empty'].includes(node.type) && !node.quest && heat() >= 70 && Math.random() < .18){ startCombat('rb_hunter', { hail:'hunter' }); if(G.enemy) G.enemy.hunter = true; return true; }
  return false;
}

/* ---------------- contracts ---------------- */
const CONTRACT_GOODS = ['space_wine','sloog_silk','voltan_cell','enjinn_spice','old_books','toy_robots','pebble_geode','mantlis_chitin'];
function contracts(){ G.contracts = G.contracts || []; return G.contracts; }
function makeOffers(seed){
  return withSeed('jobs' + seed, () => { const out = [], fs = Object.keys(FACTIONS), last = R.sectors - 1;
    if(G.sector < last){ const g = pick(CONTRACT_GOODS), to = Math.min(last, G.sector + ri(1, 2)); out.push({ kind:'deliver', goods:g, n:2, to, pay:40 + 25*(to - G.sector) + 6*G.sector, fac:pick(fs), title:`Deliver 2 ${goodsDef(g).name.toLowerCase()} to any store in sector ${to}` }); }
    const tf = pick(['pyrate','rebuff','mantlis','auto']); const ally = tf==='pyrate' ? 'voltan' : tf==='rebuff' ? 'pyrate' : tf==='mantlis' ? 'sloog' : 'enjinn';
    out.push({ kind:'bounty', target:tf, n:2, got:0, pay:55 + 10*G.sector, fac:ally, title:`Beat 2 ${tf==='auto' ? 'automated' : tf==='rebuff' ? 'Mandate' : tf.charAt(0).toUpperCase() + tf.slice(1)} ships (destroy, board or make them surrender)` });
    out.push({ kind:'survey', n:3, got:0, pay:35 + 8*G.sector, fac:pick(fs), title:'Survey 3 quiet or nebula beacons you haven\'t visited before' });
    return out; }); }
function acceptContract(c, st){ if(contracts().length >= 3){ toast('You can only take three contracts at a time.'); return; }
  if(c.kind==='deliver'){ if(!addGoods(c.goods, c.n)){ toast('No room in the hold for the cargo.'); return; } }
  c.taken = true; contracts().push(Object.assign({}, c, { taken:true, got:0, sector:G.sector })); toast(`Contract taken: ${c.title}.`); sfx('buy'); }
function payContract(c, why){ const i = contracts().indexOf(c); if(i < 0) return; contracts().splice(i, 1); G.scrap += c.pay; G.stats.scrap += c.pay; if(typeof repAdd==='function') repAdd(c.fac, 10);
  G.jobsDone = (G.jobsDone||0) + 1; if(G.jobsDone >= 5) grant('jobs5'); toast(`Contract complete${why ? ': ' + why : ''}. +${c.pay} scrap, and the ${FACTIONS[c.fac] ? FACTIONS[c.fac].name : 'client'} are pleased.`); sfx('buy'); }
function jobsArrive(node, first){
  for(const c of [...contracts()]){
    if(c.kind==='deliver' && node.type==='store' && G.sector >= c.to){ if(goodsHave(c.goods) >= c.n){ takeGoods(c.goods, c.n); payContract(c, 'cargo delivered'); } }
    else if(c.kind==='deliver' && G.sector > c.to){ contracts().splice(contracts().indexOf(c), 1); if(typeof repAdd==='function') repAdd(c.fac, -10); toast('A delivery contract ran out of time. The client is not pleased.'); }
    else if(c.kind==='survey' && first && (node.type==='empty' || node.nebula)){ c.got++; if(c.got >= c.n) payContract(c, 'survey filed'); }
  } }
function jobsCombatEnd(kind, e){ if(!e || kind==='fled') return; const f = e.auto ? 'auto' : e.faction;
  for(const c of [...contracts()]) if(c.kind==='bounty' && c.target===f){ c.got++; if(c.got >= c.n) payContract(c, 'bounty claimed'); } }
function drawContracts(offers, cx, y0, W2, canTake){
  label('Noticeboard', cx, y0+10, C.amber, 'left', 15); T('Up to three at a time. Paid in scrap, and the client\'s faction remembers.', cx + 170, y0+12, { s:13, c:C.muted });
  offers.forEach((c, i) => { const y = y0 + 24 + i*82; panel(cx, y, W2, 74, 8); T(c.title, cx+18, y+30, { s:17, f:FD, w:700, max:W2-280 });
    T(`Pays ${c.pay} scrap · ${FACTIONS[c.fac] ? FACTIONS[c.fac].name + ' +10' : ''}${c.kind==='deliver' ? ' · cargo goes in your hold now' : ''}`, cx+18, y+56, { s:13, c:C.muted, max:W2-280 });
    btn(cx+W2-220, y+14, 200, 46, c.taken ? 'Taken' : 'Take it', () => acceptContract(c), { disabled:c.taken || !canTake, col:C.good, s:15 }); });
  const y1 = y0 + 24 + offers.length*82 + 20; label(`Your contracts · ${contracts().length}/3`, cx, y1, C.amber, 'left', 15);
  if(!contracts().length) T('None yet.', cx, y1+30, { s:14, c:C.muted });
  contracts().forEach((c, i) => T(`• ${c.title}${c.kind!=='deliver' ? ` (${c.got}/${c.n})` : ''} · ${c.pay} scrap`, cx, y1 + 30 + i*28, { s:15, max:W2 }));
}
function storeOffers(st){ if(!st.jobs) st.jobs = makeOffers(`s${G.sector}n${G.map.cur}`); return st.jobs; }

/* ---------------- home between sectors ---------------- */
function exitHomeButton(f){ if(!havenPerksOn() || G.sector+1 >= R.sectors) return;
  btn(f.x+32, f.y+f.h-82, 320, 56, 'Drop in at Haven\'s Rest', () => { const i = G.map.cur; havenArrive(G.map.nodes[i], i); G.havenVisit.fromExit = true; }, { col:'#9fdc7a', s:16 });
  tip(f.x+32, f.y+f.h-82, 320, 56, 'Home first', 'Visit Haven\'s Rest before the next sector: rest, repair, sell, store guns, take contracts. Leaving brings you back to this exit.'); }

/* ---------------- faction ships, Pip's intel ---------------- */
function factionShipFor(f){ const want = f==='pebblekin' ? 'pebble' : f; return Object.keys(DATA.ships).find(id => { const d = DATA.ships[id]; if(typeof shipUnlocked==='function' ? shipUnlocked(d) : (!d.unlock || (PROFILE.unlocked||{})[id])) return false; try{ return typeof shipStyle==='function' && shipStyle({ id, cls:d.cls, name:d.name })===want; }catch(e){ return false; } }); }
function factionRevered(f){ if(!havenPerksOn()) return; const id = factionShipFor(f); if(!id) return; PROFILE.unlocked = PROFILE.unlocked || {}; PROFILE.unlocked[id] = true; saveProfile(); toast(`The ${FACTIONS[f].name} give you the plans for the ${DATA.ships[id].name}. It's in your hangar now.`); }
function pipIntel(e){ const R_ = (PROFILE.haven && PROFILE.haven.residents) || []; if(!R_.includes('Pip') || !havenPerksOn()) return; e.hull = Math.max(6, e.hull - 3); if(e.systems.weapons) ionize(e, 'weapons', 2); toast('Pip, at home in Haven\'s Rest, has decoded the Dreadnought\'s defences: its guns stutter and its hull is weaker.'); }

/* ---------------- effects ---------------- */
function openEffect(e, L){ if(!e || !G) return;
  if(e.heat){ G.heat = clamp(heat() + e.heat, 0, 100); L.push(`Heat ${e.heat > 0 ? '+' : ''}${e.heat}`); }
  if(e.heatDrop){ G.heat = clamp(heat() - e.heatDrop, 0, 100); L.push(`Heat -${e.heatDrop}`); } if(e.heat || e.heatDrop) syncHeatChip(); }
if(typeof ANOM_INFO!=='undefined') ANOM_INFO.heatShow = { name:'Heat', label:() => `Heat ${Math.round(heat())} · ${heatTier()[1]}`, col:'#ff5a7a', text:() => `Mandate attention: ${Math.round(heat())} of 100 (${heatTier()[1]}). 40: the Fleet moves faster. 70: hunter-killers. 90: the exit is blockaded. Quiet beacons, nebulas and going home cool it; destroying Mandate ships heats it up.` };

/* ======================= content ======================= */
Object.assign(BASE.enemies, {
  rb_hunter:  { name:'Mandate Hunter-Killer', eventOnly:true, relentless:true, tags:['rebuff'], hull:13, sectors:[1,9], style:'rebuff', systems:{ shields:4, engines:4, weapons:5, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['heavy1','ion','basic'], crew:['human','human','human'] },
  rb_blockade:{ name:'Mandate Blockade Cruiser', eventOnly:true, relentless:true, tags:['rebuff'], hull:18, sectors:[1,9], style:'flag', systems:{ shields:6, engines:2, weapons:6, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['heavy1','choke_bomb','basic'], crew:['human','human','human','pebblekin'] }
});
Object.assign(BASE.events, {
  hunter_hail:{ hail:'hunter', pack:'open', title:'Hunted', art:'fleet', text:'"Courier {ship}. Mandate Intelligence has been following your trail for some time." The {enemy} has its guns charged before it finishes the sentence.', choices:[
    { text:'Fight.', effect:{ begin:true } },
    { text:'Bribe them to lose your trail.', req:{ scrap:60 }, cost:{ scrap:60 }, effect:{ text:'The captain pockets it and logs you as "debris".', heatDrop:20, dismiss:true } },
    { text:'{who} broadcasts a fake transponder.', req:{ quirk:'conspiracy' }, effect:{ text:'{who} has been ready for this moment for years. The hunters chase a ghost into the next system.', heatDrop:25, dismiss:true } } ] },
  heat_forger:{ pack:'open', once:true, minSector:2, tags:['pyrate','nebula'], weight:1.2, title:'A code forger', art:'station', text:'A Mullock in a tiny workshop forges transponder codes. "New name, new history, new ship as far as the Mandate know. Sixty scrap."', choices:[
    { text:'New codes, please.', req:{ scrap:60 }, cost:{ scrap:60 }, effect:{ text:'Your ship is now, officially, a fertiliser tanker. The heat drains away.', heatDrop:50 } },
    { text:'{who} forges them for free.', req:{ quirk:'expyrate' }, effect:{ text:'{who} watches the forger work for ten minutes, then does it better. The forger is furious, then impressed.', heatDrop:40 } },
    { text:'Not today.', effect:{ text:'"Come back when they are on your tail."' } } ] },
  heat_decoy:{ pack:'open', once:true, minSector:3, weight:.9, title:'A decoy offer', art:'ship', text:'A battered freighter captain offers to fly a decoy course broadcasting your codes. "For the right price, they\'ll chase me halfway to the rim."', choices:[
    { text:'Pay him.', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'The freighter limps off, loudly being you.', heatDrop:30, fleetPush:-.03 } },
    { text:'No thanks.', effect:{ text:'He shrugs and goes looking for another desperate courier.' } } ] }
});
ACHIEVEMENTS.push({ id:'jobs5', name:'Odd-Jobber', desc:'Finish five contracts in one run.' });
