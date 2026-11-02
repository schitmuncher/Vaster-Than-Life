'use strict';
/* =========================================================================
   Haven's Rest, in person. The run is no longer only A to B: every sector
   (but the last) has a Haven relay beacon on its map that jumps you home and
   back. At home:
     Bunks      rest a night: everyone healed, cabin fever gone, hearts up
                (the Fleet gains a little while you sleep)
     Drydock    cheap or free hull repairs, scars patched, rooms swapped at
                half price, and a weapon locker that keeps guns between runs
     Greenhouse beds that keep growing across runs, for crops too big for a
                ship (starfruit), and a bigger harvest from station soil
     Cantina    hire visiting specialists (once the Cantina wing is restored)
     Market     sells rare augments and starfruit seeds, buys goods for more
                (once the Promenade is restored)
     Freight    send goods to finish the wings' bundles
   Long stretches away from any port give the crew cabin fever: they grow
   unhappy, work slower and things start to rattle loose. Stores and home
   cure it.
   Madame Ossery will lease the whole station for you: every wing restored
   at once, but rent comes out of every run and no ally will move in.
   ========================================================================= */
HAVEN_WINGS.push({ id:'cantina', name:'The Cantina', bundle:'The Host\'s Table', needs:[['star_stew',2],['space_wine',2],['pyrate_rum',2]], reward:'The Cantina reopens: hire visiting specialists when you call home, and every run starts with one extra trained crew member.', renown:1000 });
ACHIEVEMENTS.push({ id:'haven_cantina', name:'The Cantina', desc:'Restore The Cantina at Haven\'s Rest.' });
if(typeof SEEDS!=='undefined') SEEDS.starfruit = { name:'Starfruit tree', crop:'starfruit', grow:10, yield:[3,5], cost:40, only:true, greenhouse:true };
Object.assign(BASE.goods, { starfruit:{ name:'Starfruit', base:85, kind:'crop', from:[], want:['glass','voltan','sloog','rebuff'], desc:'Grown only in Haven\'s Rest greenhouse. Tastes like a supernova, gently.' } });

/* ---------------- the relay beacon on each sector map ---------------- */
function havenPlace(nodes, cols, final){
  if(final || !havenPerksOn()) return; const cand = nodes.filter(nd => nd.col>=2 && nd.col<=cols-3 && ['event','empty','combat'].includes(nd.type) && !nd.quest);
  if(!cand.length) return; const nd = pick(cand); nd.type = 'haven'; nd.distress = false; nd.elite = false; }
function havenArrive(node, i){
  G.away = 0; if(G.anom) delete G.anom.fever; G.havenVisit = { node:i, rested:false, repaired:false, cands:null, offers:null };
  if(haven().leased){ const fee = Math.min(G.scrap, 15); G.scrap -= fee; if(fee) toast(`Madame Ossery's docking fee: ${fee} scrap.`); }
  sfx('store'); UI.havenTab = 'home'; G.modal = { type:'haven', node:i }; save(); }

/* ---------------- greenhouse (persists across runs) ---------------- */
function greenhouse(){ const H_ = haven(); H_.gh = H_.gh || { plots:[null, null, null] }; const want = 3 + (havenDone('biodome') ? 3 : 0); while(H_.gh.plots.length < want) H_.gh.plots.push(null); return H_.gh; }
function havenJump(){ if(!havenPerksOn()) return; const gh = greenhouse(); for(const p of gh.plots) if(p) p.g += 1; }
function ghPlant(i, k){ const gh = greenhouse(); if(gh.plots[i] || !SEEDS[k] || !(G.seeds && G.seeds[k] > 0)) return; G.seeds[k]--; if(!G.seeds[k]) delete G.seeds[k]; gh.plots[i] = { seed:k, g:0 }; saveProfile(); sfx('click'); }
function ghHarvest(i){ const gh = greenhouse(), p = gh.plots[i]; if(!ripe(p)) return; const sd = SEEDS[p.seed]; const n = Math.round(ri(sd.yield[0], sd.yield[1]) * 1.5);
  const got = addGoods(sd.crop, n); if(!got){ toast('Your hold is full.'); return; } gh.plots[i] = null; saveProfile(); sfx('buy'); toast(`Harvested ${got} ${goodsDef(sd.crop).name} from the greenhouse.`); }
/* starfruit is too big for a ship's planter */
(function(){ if(typeof plant!=='function') return; const p0 = plant; plant = function(i, k){ if(SEEDS[k] && SEEDS[k].greenhouse){ toast('Too big for a ship\'s planter. Plant it in the greenhouse at Haven\'s Rest.'); return false; } return p0(i, k); }; })();

/* ---------------- weapon locker (persists across runs) ---------------- */
function locker(){ PROFILE.locker = PROFILE.locker || []; return PROFILE.locker; }
function lockerMax(){ return havenDone('engineering') ? 6 : 4; }
function lockerStore(i){ const w = G.ship.weapons[i]; if(!w || locker().length >= lockerMax()) return; G.ship.weapons.splice(i, 1); locker().push(w.id); saveProfile(); toast(`${DATA.weapons[w.id].name} is in the Haven locker. It will be here next run too.`); }
function lockerTake(i){ const id = locker()[i]; if(!id || !DATA.weapons[id]) return; locker().splice(i, 1); saveProfile(); toast(giveWeapon(id) + '.'); }

/* ---------------- cabin fever ---------------- */
function feverJump(node){
  if(['store','haven','base'].includes(node && node.type)){ G.away = 0; if(G.anom) delete G.anom.fever; return; }
  G.away = (G.away || 0) + 1; if(G.away < 11 || (typeof campDef==='function' && campDef())) return; G.anom = G.anom || {}; G.anom.fever = true;
  for(const c of G.ship.crew) if(c.owner==='p' && !c.drone && typeof addHearts==='function') addHearts(c, -25);
  if(G.away===11) toast('Cabin fever: eleven jumps without a port. The crew are getting short with each other. Find a store, or go home.');
  if(G.away >= 16 && Math.random() < .08 && typeof addScar==='function'){ const sc = addScar(pick(['sparky','leaky'])); if(sc) toast(`Something has rattled loose after so long out here: ${scarName(sc)}.`); }
}
if(typeof ANOM_INFO!=='undefined') ANOM_INFO.fever = { name:'Cabin fever', col:'#ff8a5a', text:() => `${G.away} jumps since the last port. The crew lose hearts every jump and repair 10% slower; after 16 jumps things start to rattle loose. Any store, or Haven's Rest, cures it.` };

/* ---------------- run start: the Cantina's recruit, Ossery's rent ---------------- */
function havenRunStart(){
  if(!havenPerksOn()) return;
  if(haven().leased){ G.scrap = Math.max(0, G.scrap - 50); }
  if(havenDone('cantina')){ const races = Object.keys(DATA.races).filter(k => !DATA.races[k].secret); if(G.ship.crew.filter(c => c.owner==='p' && !c.drone).length < R.maxCrew){ const c = addCrew(G.ship, pick(races), 'p'); gainXP(c, pick(['pilot','engines','shields','weapons','repair']), 40); } }
}
function havenLease(){ const H_ = haven(); for(const w of HAVEN_WINGS) if(!H_.done[w.id]) H_.done[w.id] = 'leased'; H_.leased = true; H_.residents = []; saveProfile(); toast('Madame Ossery\'s contractors restore every wing overnight. The rent starts next run.'); }

/* ---------------- the visit screen ---------------- */
function drawHavenVisit(m){
  const f = mframe(1440, 880, 'Haven\'s Rest'), V = G.havenVisit || (G.havenVisit = { node:m.node }), s = G.ship, cx = f.x+32, W2 = f.w-64;
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:26, f:FD, w:700, c:C.amber });
  const tabsL = [['home','Home'],['bunks','Bunks'],['drydock','Drydock'],['greenhouse','Greenhouse'],['cantina','Cantina'],['market','Market']];
  tabs(cx, f.y+76, tabsL, UI.havenTab || 'home', t => UI.havenTab = t, 190);
  const y0 = f.y+146, tab = UI.havenTab || 'home';
  if(tab==='home'){
    para(`Great-uncle Tobiah's station, ${HAVEN_WINGS.filter(w => havenDone(w.id)).length} of ${HAVEN_WINGS.length} wings working${haven().leased ? ', on lease to Madame Ossery' : ''}. The relay holds a jump open: when you leave, you're back at the beacon you came from.`, cx, y0+16, W2, { s:17, lh:24 });
    HAVEN_WINGS.forEach((w, i) => { const x = cx + (i % 4)*(W2/4 + 2), y = y0 + 76 + Math.floor(i/4)*70, done = havenDone(w.id); panel(x, y, W2/4 - 8, 62, 8);
      T(w.name.replace(/^The /, ''), x+14, y+26, { s:16, f:FD, w:700, c: done ? '#9fdc7a' : C.muted }); T(done ? 'working' : 'dark: ' + w.bundle, x+14, y+48, { s:12, c: done ? C.ink : C.muted, max:W2/4 - 30 }); });
    const res = haven().residents || []; T(res.length ? `Residents: ${res.join(', ')}` : 'No residents yet.', cx, y0+240, { s:15, c:C.ink });
    drawHavenDeliver(cx, y0+266, W2/2);
  } else if(tab==='bunks'){
    para('The bunks are old and the blankets smell of somebody else\'s great-uncle, but it\'s home. A night here heals everyone, cures cabin fever and brings the crew closer. The Rebuff Fleet won\'t wait while you sleep.', cx, y0+16, W2, { s:17, lh:24 });
    btn(cx, y0+90, 360, 64, V.rested ? 'Rested' : 'Rest a night', () => { V.rested = true; for(const c of s.crew) if(c.owner==='p'){ c.hp = c.maxHp; if(!c.drone && typeof addHearts==='function') addHearts(c, 10); } G.away = 0; if(G.anom) delete G.anom.fever; G.fleetX += .04; toast('Everyone slept like a log. The Fleet crept a little closer.'); }, { disabled:V.rested, fill:!V.rested, col:C.good, s:18 });
    s.crew.filter(c => c.owner==='p' && !c.drone).forEach((c, i) => T(`${c.name}: ${Math.round(c.hp)}/${c.maxHp} health · ${typeof heartsOf==='function' ? heartsOf(c) : 0} hearts`, cx, y0+200 + i*28, { s:15 }));
  } else if(tab==='drydock'){
    const free = havenDone('engineering'), miss = s.maxHull - s.hull, cost = free ? 0 : miss*2;
    label('Repairs', cx, y0+10, C.amber, 'left', 15);
    btn(cx, y0+26, 380, 56, miss <= 0 ? 'Hull is whole' : V.repaired && free ? 'Repaired' : `Repair all hull · ${cost || 'free'}`, () => spend(cost, () => { s.hull = s.maxHull; V.repaired = true; }), { disabled:miss <= 0 || (V.repaired && free) || G.scrap < cost, col:C.good, s:16 });
    T(free ? 'The Automated Shipyard repairs you for free, once a visit.' : 'At cost: 2 scrap a point (half store prices). The Engineering Deck makes it free.', cx+400, y0+60, { s:13, c:C.muted });
    const sc = (G.scars||[])[0]; if(sc){ const pc = Math.round(scarPrice(sc) / 2); btn(cx, y0+92, 380, 50, `Patch ${scarName(sc)} · ${pc}`, () => spend(pc, () => { G.scars.shift(); }), { disabled:G.scrap < pc, s:14 }); }
    label(`Weapon locker · ${locker().length}/${lockerMax()} · kept between runs`, cx, y0+170, C.amber, 'left', 15);
    s.weapons.forEach((w, i) => { const y = y0 + 186 + i*50; T(DATA.weapons[w.id].name, cx, y+30, { s:16 }); btn(cx+280, y+6, 200, 40, 'Leave in locker', () => lockerStore(i), { s:13, disabled:locker().length >= lockerMax() }); });
    locker().forEach((id, i) => { const x = cx + W2/2, y = y0 + 186 + i*50; T(DATA.weapons[id] ? DATA.weapons[id].name : id, x, y+30, { s:16, c:'#9fdc7a' }); btn(x+280, y+6, 200, 40, 'Take aboard', () => lockerTake(i), { s:13 }); });
    if(!locker().length) T('Empty. Guns left here stay for every future run.', cx + W2/2, y0+216, { s:14, c:C.muted });
    label('Room swaps: half price here (Ship → Layout)', cx, y0+420, C.muted, 'left', 14);
  } else if(tab==='greenhouse'){
    const gh = greenhouse(), seeds = Object.keys(G.seeds || {}).filter(k => G.seeds[k] > 0 && SEEDS[k]); if(!seeds.includes(UI.ghSeed)) UI.ghSeed = seeds[0] || null;
    para(`Station soil: crops here grow on every jump of every run, even while you're out there, and give half as much again. ${havenDone('biodome') ? 'The Grand Greenhouse has six beds.' : 'Restore the Biodome for three more beds.'} Starfruit only grows here.`, cx, y0+10, W2, { s:15, lh:21 });
    if(seeds.length){ btn(cx, y0+56, 44, 40, '‹', () => { UI.ghSeed = seeds[(seeds.indexOf(UI.ghSeed) + seeds.length - 1) % seeds.length]; }, { s:16 }); T(`${SEEDS[UI.ghSeed].name} ×${G.seeds[UI.ghSeed]}`, cx+60, y0+82, { s:16 }); btn(cx+300, y0+56, 44, 40, '›', () => { UI.ghSeed = seeds[(seeds.indexOf(UI.ghSeed) + 1) % seeds.length]; }, { s:16 }); }
    else T('No seeds aboard.', cx, y0+82, { s:15, c:C.muted });
    gh.plots.forEach((p, i) => { const x = cx + (i%3)*(W2/3 + 4), y = y0 + 110 + Math.floor(i/3)*150, w = W2/3 - 8; panel(x, y, w, 140, 10);
      if(!p){ T('Empty bed', x+18, y+34, { s:18, f:FD, w:700, c:C.muted }); btn(x+18, y+76, w-36, 48, UI.ghSeed ? `Plant ${SEEDS[UI.ghSeed].name}` : 'No seeds', () => ghPlant(i, UI.ghSeed), { disabled:!UI.ghSeed, col:C.good, s:16 }); return; }
      const sd = SEEDS[p.seed], fr = clamp(p.g/sd.grow, 0, 1); T(sd.name, x+18, y+34, { s:18, f:FD, w:700 }); rr(x+18, y+52, w-36, 12, 6); ctx.fillStyle = '#141b31'; ctx.fill(); rr(x+18, y+52, (w-36)*fr, 12, 6); ctx.fillStyle = C.good; ctx.fill();
      if(ripe(p)) btn(x+18, y+76, w-36, 48, 'Harvest', () => ghHarvest(i), { fill:true, col:C.good, s:16 }); else T(`${Math.ceil(sd.grow - p.g)} more jumps`, x+18, y+100, { s:15, c:C.muted }); });
  } else if(tab==='cantina'){
    if(!havenDone('cantina')){ para('The Cantina is dark: chairs on the tables, a dead plant on the bar. Restore it (Home → send its bundle) and visiting specialists will drink here, looking for a ship.', cx, y0+16, W2, { s:17, lh:24, c:C.muted }); }
    else { if(!V.cands){ V.cands = [0,1,2].map(() => { const c = newCrew(pick(Object.keys(DATA.races).filter(k => !DATA.races[k].secret)), 'p'); const sk = pick(['pilot','engines','shields','weapons','repair']); c.sk[sk] = SKILLT[sk][1]; c._sk = sk; return c; }); }
      label('Specialists in the bar tonight', cx, y0+10, C.amber, 'left', 15);
      const full = s.crew.filter(c => c.owner==='p' && !c.drone).length >= R.maxCrew;
      V.cands.forEach((c, i) => { const x = cx + i*(W2/3 + 4), w = W2/3 - 8, y = y0+26, price = Math.round(crewWorth(c) * .7); panel(x, y, w, 200, 10); ensureLook(c); drawPortrait(x+56, y+64, 38, c, false);
        T(c.name, x+112, y+48, { s:22, f:FD, w:700, max:w-130 }); T(`${DATA.races[c.race].name} · expert ${SKILLN[c._sk].toLowerCase()}`, x+112, y+76, { s:14, c:C.muted, max:w-130 });
        if(c.hired) T('Hired', x+20, y+180, { s:18, c:C.good }); else btn(x+20, y+136, w-40, 48, full ? 'Bunks full' : `Hire · ${price}`, () => spend(price, () => { joinCrew(c); c.hired = true; toast(`${c.name} joins the crew.`); }), { disabled:full || G.scrap < price, col:C.good, s:16 }); }); }
  } else if(tab==='market'){
    if(!havenDone('promenade')){ para('The Promenade is boarded up. Restore it (Home → send its bundle) and traders will set up shop here: rare augments, starfruit seeds, and better prices for your goods.', cx, y0+16, W2, { s:17, lh:24, c:C.muted }); }
    else { if(!V.offers){ V.offers = shuffle(Object.keys(DATA.augments).filter(k => !DATA.augments[k].noLoot && !s.augments.includes(k))).slice(0, 2); }
      label('Buy', cx, y0+10, C.amber, 'left', 15);
      const rows = [['Starfruit seed', 'Greenhouse only. Ten jumps to grow, worth a fortune.', 40, () => { G.seeds = G.seeds || {}; G.seeds.starfruit = (G.seeds.starfruit||0) + 1; }], ...V.offers.map(k => [DATA.augments[k].name, DATA.augments[k].desc, Math.round((DATA.augments[k].cost||50) * .9), () => { s.augments.push(k); V.offers = V.offers.filter(x => x!==k); }])];
      rows.forEach((r, i) => { const y = y0 + 26 + i*76; panel(cx, y, W2/2 - 10, 68, 8); T(r[0], cx+16, y+28, { s:17, f:FD, w:700 }); T(r[1], cx+16, y+52, { s:12, c:C.muted, max:W2/2 - 240 }); btn(cx + W2/2 - 200, y+12, 180, 44, `Buy · ${r[2]}`, () => spend(r[2], r[3]), { disabled:G.scrap < r[2], col:C.good, s:15 }); });
      const x2 = cx + W2/2 + 10; label('Sell (20% over the going rate)', x2, y0+10, C.amber, 'left', 15);
      Object.keys(G.bay || {}).filter(id => G.bay[id] > 0 && goodsDef(id)).slice(0, 8).forEach((id, i) => { const y = y0 + 26 + i*56, pr = Math.round(goodsPrice(id, { kind:'laststand' }, true) * 1.2);
        T(`${goodsDef(id).name} ×${G.bay[id]}`, x2, y+30, { s:15 }); btn(x2 + W2/2 - 210, y+6, 190, 42, `Sell · ${pr}`, () => { if(takeGoods(id, 1)){ G.scrap += pr; G.stats.scrap += pr; sfx('sell'); } }, { s:14 }); }); }
  }
  btn(f.x+f.w-232, f.y+f.h-80, 200, 56, 'Leave', () => { G.modal = null; G.havenVisit = null; save(); });
}
