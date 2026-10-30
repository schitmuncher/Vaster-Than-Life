'use strict';
/* =========================================================================
   Homestead: a little home life between the gunfights (in the spirit of
   farming games, kept light so the run stays a run).
   - A hydroponic garden: plant seeds, crops grow as you jump (faster under
     a sun, not at all in an ion storm), harvest them into the hold.
   - The galley: cook crops and fish into meals. A meal heals the crew and
     leaves them well fed for the next fights.
   - Friendship hearts: give crew gifts they love, eat together, survive
     together. Close crew work a little harder, and open up to you.
   - Fishing at quiet beacons.
   - Shore leave: the bar at many stores, and what happens the morning after.
   ========================================================================= */

/* ---------------- seeds ---------------- */
const SEEDS = {
  star_potato: { name:'Star potato',  crop:'star_potato',  grow:3, yield:[2,3], cost:4 },
  ion_berry:   { name:'Ion berry',    crop:'ion_berry',    grow:3, yield:[2,4], cost:3 },
  void_pepper: { name:'Void pepper',  crop:'void_pepper',  grow:4, yield:[1,3], cost:7, nebula:true },
  nebula_bloom:{ name:'Nebula bloom', crop:'nebula_bloom', grow:5, yield:[1,2], cost:6, nebula:true },
  moon_melon:  { name:'Moon melon',   crop:'moon_melon',   grow:6, yield:[1,2], cost:12 },
  glass_lily:  { name:'Glass lily',   crop:'glass_lily',   grow:8, yield:[1,1], cost:20, only:'glass' }
};
const PLANTER_COST = 30, PLANTER_MAX = 6;
function garden(){ G.garden = G.garden || { plots:[null, null] }; return G.garden; }
function gardener(){ return G && G.ship ? G.ship.crew.find(c => c.owner==='p' && !c.drone && c.quirk==='gardener') : null; }
function plant(i, k){ const gd = garden(); if(gd.plots[i] || !SEEDS[k] || !(G.seeds && G.seeds[k] > 0)) return false; G.seeds[k]--; if(!G.seeds[k]) delete G.seeds[k]; gd.plots[i] = { seed:k, g:0 }; sfx('click'); return true; }
function ripe(p){ return p && p.g >= SEEDS[p.seed].grow; }
function harvest(i){ const gd = garden(), p = gd.plots[i]; if(!ripe(p)) return; const sd = SEEDS[p.seed]; let n = ri(sd.yield[0], sd.yield[1]); if(gardener()) n++;
  const bumper = Math.random() < (gardener() ? .25 : .12); if(bumper){ n *= 2; G.bumpers = (G.bumpers||0) + 1; }   // now and then, a bumper crop
  const got = addGoods(sd.crop, n); if(!got){ toast('Your hold is full. Sell or eat something first.'); return; }
  gd.plots[i] = null; sfx('buy'); toast(`${bumper ? 'Bumper crop! ' : ''}Harvested ${got} ${goodsDef(sd.crop).name}${got < n ? ' (the rest would not fit)' : ''}.`);
  if(bumper && typeof sagaNote==='function' && G.bumpers===1) sagaNote('garden', `The ship's garden produced a bumper crop of ${goodsDef(sd.crop).name.toLowerCase()} in sector ${G.sector}. Everyone had seconds.`);
  G.harvests = (G.harvests||0) + 1; if(G.harvests===1 && typeof sagaNote==='function') sagaNote('garden', `In sector ${G.sector} the crew brought in their first harvest from the ship's garden: ${got} ${goodsDef(sd.crop).name.toLowerCase()}.`);
  if(G.harvests >= 5) grant('home_harvest'); }
/* each jump, the garden grows */
function gardenJump(){
  if(!G || !G.garden) return; const hz = G.hazard, gr = gardener(); let ready = 0;
  for(const p of G.garden.plots){ if(!p) continue; const sd = SEEDS[p.seed]; const was = ripe(p);
    if(hz==='ionstorm') continue;                         // ion storms stunt everything
    p.g += 1 + (hz==='sun' ? 1 : 0) + (G.nebula && sd.nebula ? .5 : 0) + (gr ? .35 : 0);   // sunlight is a growth spurt
    if(!was && ripe(p)) ready++; }
  if(ready) toast(`${ready === 1 ? 'A crop is' : ready + ' crops are'} ready to harvest (Ship → Garden).`);
}

/* ---------------- the galley ---------------- */
const RECIPES = {
  spicy_hash:  { need:{ star_potato:1, void_pepper:1 }, heal:35, fed:2 },
  fish_supper: { need:{ space_fish:2, star_potato:1 }, heal:30, fed:2 },
  star_stew:   { need:{ star_potato:1, space_fish:1 }, heal:30, fed:2 },
  berry_pie:   { need:{ ion_berry:2, rations:1 },     heal:25, fed:2 },
  melon_sorbet:{ need:{ moon_melon:1, ion_berry:1 },  heal:50, fed:3 }
};
function cook(){ return G && G.ship ? G.ship.crew.find(c => c.owner==='p' && !c.drone && c.quirk==='cook') : null; }
function canCook(k){ const r = RECIPES[k]; return r && Object.entries(r.need).every(([id, n]) => goodsHave(id) >= n); }
function cookMeal(k){ if(!canCook(k)) return; const r = RECIPES[k]; for(const [id, n] of Object.entries(r.need)) takeGoods(id, n);
  const n = cook() ? 2 : 1; addGoods(k, n) || (G.bay[k] = (G.bay[k]||0) + n); sfx('buy');
  toast(`${cook() ? cook().name + ' cooks' : 'You cook'} ${n > 1 ? n + ' portions of ' : ''}${goodsDef(k).name.toLowerCase()}.`); }
/* eat together: heals, makes everyone a bit fonder of you, and they fight better while well fed */
function eatMeal(k){ const r = RECIPES[k]; if(!r || !takeGoods(k, 1)) return; const ck = cook(), mult = ck ? 1.5 : 1;
  for(const c of G.ship.crew) if(c.owner==='p' && !c.drone){ c.hp = Math.min(c.maxHp, c.hp + r.heal*mult); addHearts(c, 15); }
  G.fed = Math.max(G.fed||0, r.fed + (ck ? 1 : 0)); sfx('buy');
  toast(`The crew eat ${goodsDef(k).name.toLowerCase()} together. Well fed for the next ${G.fed} fights: +10% repair, melee and weapon charge.`); }

/* ---------------- friendship hearts ---------------- */
const GIFT_LOVES = {
  gambler:['space_wine','pyrate_rum','contraband'], poet:['nebula_bloom','glass_lily','old_books'], cook:['void_pepper','moon_melon','enjinn_spice'],
  superstitious:['relic','pebble_geode','glass_lily'], daredevil:['void_pepper','pyrate_rum','deep_eel'], worrier:['rations','berry_pie','star_stew'],
  tinkerer:['toy_robots','voltan_cell','junk'], romantic:['nebula_bloom','love_potion','space_wine'], conspiracy:['old_books','contraband','relic'],
  sleepwalker:['melon_sorbet','star_stew','sloog_silk'], collector:['junk','relic','pebble_geode'], expyrate:['pyrate_rum','contraband','deep_eel'],
  mystic:['nebula_crystal','glass_lily','nebula_bloom'], optimist:['berry_pie','ion_berry','toy_robots'], grump:['old_books','fish_supper'],
  bookworm:['old_books','relic'], gardener:['nebula_bloom','glass_lily','moon_melon']
};
const RACE_LOVES = { human:['space_wine','fish_supper'], pebblekin:['pebble_geode'], enjinn:['enjinn_spice','toy_robots'], voltan:['voltan_cell','ion_berry'], sloog:['sloog_silk','love_potion'], mantlis:['void_pepper','deep_eel','spicy_hash'], glassborn:['nebula_crystal','glass_lily'] };
const GIFT_HATES = { rations:'*', junk:'*', contraband:['worrier','bookworm'], love_potion:['grump','worrier'], void_pepper:['worrier','sleepwalker'], pyrate_rum:['worrier'] };
function heartsOf(c){ return Math.floor(clamp(c && c.hearts || 0, 0, 1000)/100); }
function addHearts(c, n){ if(!c || c.drone || c.owner!=='p') return; if(n > 0 && G && G.ship && G.ship.crew.some(o => o.owner==='p' && o.quirk==='romantic')) n *= 1.2; const before = heartsOf(c); c.hearts = clamp((c.hearts||0) + n, 0, 1000); const now = heartsOf(c);
  if(now > before){ if(now >= 8 && !c.hpBonusH){ c.hpBonusH = true; c.maxHp += 10; c.hp += 10; }
    for(const lv of [4, 8, 10]) if(before < lv && now >= lv && !(c.heartScenes||[]).includes(lv)){ (c.heartScenes = c.heartScenes || []).push(lv); G.later.push({ event:'m_heart' + lv, jumps:ri(1,3), star:c.id }); }
    if(now===10) grant('home_bestie'); } }
function giftReaction(c, id){
  const g = goodsDef(id); if(!g) return 0; const hates = GIFT_HATES[id];
  if((GIFT_LOVES[c.quirk]||[]).includes(id) || (RACE_LOVES[c.race]||[]).includes(id)) return 2;
  if(hates && (hates==='*' ? !(GIFT_LOVES[c.quirk]||[]).includes(id) : hates.includes(c.quirk))) return -1;
  if(g.kind==='meal' || id==='nebula_bloom' || id==='glass_lily' || g.base >= 25) return 1;
  return 0; }
function giveGift(c, id){
  if(!c || !goodsHave(id)) return; if(c.giftJ===G.stats.jumps){ toast(`You already gave ${c.name} something today. Give it a jump.`); return; }
  takeGoods(id, 1); c.giftJ = G.stats.jumps; const r = giftReaction(c, id), g = goodsDef(id);
  const bday = c.bday===G.stats.jumps; addHearts(c, [-30, 20, 45, 85][r + 1] * (bday && r >= 0 ? 3 : 1));
  if(bday && r >= 0){ if(typeof sagaNote==='function') sagaNote('bday', `The captain remembered ${c.name}'s birthday, and gave them ${aN(g.name.toLowerCase())}.`); }
  if(c.wish===id){ c.wish = null; addHearts(c, 110); UI.toast = { text:`${c.name} has wanted ${g.name.toLowerCase()} for ages. They are over the moon. (+ lots of hearts)`, t:4 }; sfx('buy'); if(typeof sagaNote==='function') sagaNote('wish', `The captain found ${c.name} the ${g.name.toLowerCase()} they had been dreaming about.`); return; }
  const line = r===2 ? pick([`${g.name}! How did you know? I love this!`, `You remembered! This is my favourite thing in the galaxy.`, `Oh, captain. You shouldn't have. (You definitely should have.)`])
    : r===1 ? pick([`Thanks, captain. That's really nice.`, `For me? That's lovely.`]) : r===0 ? pick([`Oh. Thanks.`, `Huh. ${g.name}. Okay!`, `I'll... find a use for it.`])
    : pick([`...Why would you give me this?`, `Is this a joke? It's a joke, right?`, `I'm going to pretend this didn't happen.`]);
  G.chat = (G.chat||[]).filter(x => x.t>0).slice(-2); G.chat.push({ text:line, id:c.id, t:3.4 }); sfx(r > 0 ? 'buy' : 'click');
  toast(`${bday && r >= 0 ? '🎂 Birthday present! ' : ''}${c.name} ${['did not like', 'accepted', 'liked', 'loved'][r + 1]} the ${g.name.toLowerCase()}${bday && r >= 0 ? ' (triple hearts)' : ''}. ${'♥'.repeat(heartsOf(c))}${'♡'.repeat(10 - heartsOf(c))}`);
}

/* ---------------- perks: personalities, hearts and good food ----------------
   traitOf (core.js) merges these into each crew member's trait: repair, dps, speed, charge, shield multiply; evade, heal add. */
const QUIRK_PERKS = {
  tinkerer:{ repair:1.15 }, grump:{ repair:1.08 }, daredevil:{ evade:3, speed:1.08 }, worrier:{ shield:1.07 }, expyrate:{ dps:1.15 },
  optimist:{ heal:.6 }, superstitious:{ evade:2 }, gambler:{ charge:1.03 }, sleepwalker:{ speed:1.05 }, poet:{ heal:.3 }
};
const QUIRK_PERK_TEXT = {
  tinkerer:'Repairs 15% faster.', grump:'Repairs 8% faster (complaining all the while).', daredevil:'+3% evasion at the helm and moves a little faster.', worrier:'Shields recharge 7% faster while they man them.',
  expyrate:'Hits 15% harder in a brawl. Gets you 10% off at black markets.', optimist:'Slowly lifts the health of everyone in the same room.', superstitious:'+2% evasion at the helm (lucky charms).',
  gambler:'Better at haggling. Weapons charge a touch faster.', sleepwalker:'Moves a little faster.', poet:'Their verses soothe the room a little.', collector:'Stores pay 10% more for what you sell.',
  cook:'Cooks two portions of every meal; meals heal more and keep the crew fed longer.', bookworm:'Learns skills 20% faster.', gardener:'Crops grow faster and give an extra portion.',
  mystic:'Sometimes sees the shape of a new sector before you arrive.', romantic:'Makes friends fast: gifts and good times win more hearts.', conspiracy:'Smells a trap: sometimes spots ambushes.'
};
const NOPERK = {};
function perkOf(c){
  if(!c || c.owner!=='p' || c.drone) return null; const q = QUIRK_PERKS[c.quirk], h = heartsOf(c), fed = G && G.fed > 0, ven = c.vengeT > 0;
  const ip = typeof implantPerk==='function' ? implantPerk(c) : null;   // Doctor Oddly's handiwork (travellers.js)
  if(!q && h < 6 && !fed && !ip) return null;
  const k = h >= 10 ? 1.1 : h >= 6 ? 1.05 : 1, f = fed ? 1.1 : 1, I = ip || { repair:1, dps:1, charge:1, speed:1, shield:1, evade:0, heal:0 };
  return { repair:(q && q.repair || 1)*k*f*I.repair, dps:(q && q.dps || 1)*k*f*I.dps, charge:(q && q.charge || 1)*f*I.charge, speed:(q && q.speed || 1)*I.speed, shield:(q && q.shield || 1)*I.shield, evade:(q && q.evade || 0) + I.evade, heal:(q && q.heal || 0) + I.heal };
}
function mergeTrait(t, p){ return { name:t.name, desc:t.desc, repair:(t.repair||1)*p.repair, dps:(t.dps||1)*p.dps, charge:(t.charge||1)*p.charge, speed:(t.speed||1)*p.speed, shield:(t.shield||1)*p.shield, hp:t.hp||0, evade:(t.evade||0) + p.evade, heal:(t.heal||0) + p.heal }; }

/* ---------------- fishing ---------------- */
function canFish(node){ return node && !node.fished && !G.enemy; }
/* what bites: decided when the line goes in (nebulas hold rarer things) */
function rollBite(){ const neb = G.nebula, r = Math.random();
  return r < (neb ? .3 : .4) ? 'fish' : r < .5 ? 'eel' : r < .66 ? 'junk' : r < .78 ? 'seeds' : r < .81 ? 'relic' : 'none'; }
const BITES = { fish:{ zone:.26, speed:2.2, name:'Something small and quick' }, eel:{ zone:.13, speed:3.3, name:'Something big and angry' }, junk:{ zone:.34, speed:1.6, name:'Something heavy and lazy' },
  seeds:{ zone:.3, speed:1.9, name:'Something light, drifting' }, relic:{ zone:.09, speed:3.7, name:'Something old, deep and very heavy' } };
/* the catch itself; outcome: a bite, 'none' (nothing bit) or 'lost' (it got away) */
function goFish(m, outcome){
  const node = G.map.nodes[G.map.cur]; if(!canFish(node) && !outcome) return; node.fished = true;
  if(!m || typeof m!=='object'){ m = { type:'msg', title:'Fishing', text:'' }; G.modal = m; }   // called without its beacon message (old save, or a mod)
  const o = outcome || rollBite(); let text;
  const who = pick(G.ship.crew.filter(c => c.owner==='p' && !c.drone)) || { name:'You' };
  if(o==='fish'){ const n = ri(1,3), got = addGoods('space_fish', n); text = got ? `${who.name} reels in ${got} space fish. They flap about in zero-g until someone catches them.` : 'You catch fish, but there is no room in the hold.'; }
  else if(o==='eel'){ const got = addGoods('deep_eel', 1); text = got ? `Something huge takes the line. After an hour of shouting, ${who.name} lands a deep eel, glowing and furious.` : 'A deep eel! But your hold is full, so it gets away.'; }
  else if(o==='junk'){ addGoods('junk', 1); text = pick([`${who.name} reels in a single boot. It is, somehow, still warm.`, `You catch a rubber duck. It squeaks at you, accusingly.`, `The line comes back with half a toaster on it. ${who.name} keeps it.`]); }
  else if(o==='seeds'){ const k = pick(Object.keys(SEEDS).filter(s => !SEEDS[s].only)); G.seeds = G.seeds || {}; G.seeds[k] = (G.seeds[k]||0) + 2; text = `The line snags a drifting seed pod: 2 ${SEEDS[k].name} seeds.`; }
  else if(o==='relic'){ addGoods('relic', 1); text = `${who.name} hooks something heavy and old: an ancient relic, older than the Fedoration. Collectors will go mad for this.`; grant('home_angler'); if(typeof sagaNote==='function') sagaNote('fish', `${who.name} fished an ancient relic out of empty space in sector ${G.sector}.`); }
  else if(o==='lost') text = pick(['It got away. It was, everyone agrees, enormous.', `The line snaps. ${who.name} swears at the stars for a full minute.`, 'Whatever it was, it is still out there, laughing.']);
  else text = pick(['Nothing bites. It is peaceful, though.', `${who.name} falls asleep holding the rod. Nobody wakes them.`, 'A fish looks at the bait, looks at you, and swims away.']);
  if(typeof addHearts==='function' && who.id) addHearts(who, 10);
  m.text = m.text ? m.text + '\n\n' + text : text; m._skip = true; m.extra = (m.extra||[]).filter(x => x.id!=='fish'); sfx('click'); save();
}
/* fishing, the fun way: a marker sweeps the bar, reel in while it is inside the zone. Three tries. */
function startFishing(m){ const node = G.map.nodes[G.map.cur]; if(!canFish(node)) return; const bite = rollBite();
  if(bite==='none'){ goFish(m, 'none'); return; }
  G.modal = { type:'fishing', back:m, bite, tries:3, zc:.25 + Math.random()*.5, t0:performance.now(), note:'' }; sfx('click'); }
function fishPos(f){ const b = BITES[f.bite], t = (performance.now() - f.t0)/1000; return .5 + .5*Math.sin(t*b.speed + Math.sin(t*1.3)*.8); }
function reel(f){ const b = BITES[f.bite], hit = Math.abs(fishPos(f) - f.zc) < b.zone/2;
  if(hit){ G.modal = f.back; goFish(f.back, f.bite); haptic(.4, 40); G.fishCaught = (G.fishCaught||0) + 1; return; }
  f.tries--; haptic(.2, 15); sfx('error');
  if(f.tries <= 0){ G.modal = f.back; goFish(f.back, 'lost'); return; }
  f.note = pick(['Too early! It is still on.', 'Missed! The line goes slack, then tight again.', 'Not yet... it is pulling hard.']); f.zc = .2 + Math.random()*.6; }
function drawFishing(f){
  const fr = mframe(900, 460, 'Fishing', C.cyan, f), b = BITES[f.bite];
  T(`${b.name} is on the line! Reel in while the marker is in the green.`, fr.x+32, fr.y+110, { s:18, c:C.ink, max:fr.w-64 });
  const bx = fr.x+60, by = fr.y+170, bw = fr.w-120, bh = 54, pos = fishPos(f);
  rr(bx, by, bw, bh, 12); ctx.fillStyle = '#0d1630'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  rr(bx + bw*(f.zc - b.zone/2), by+4, bw*b.zone, bh-8, 8); ctx.fillStyle = hexA(C.good, .55); ctx.fill();
  const mx = bx + bw*pos; ctx.fillStyle = C.amber; rr(mx-6, by-10, 12, bh+20, 6); ctx.fill();
  T('🐟', mx, by+bh+42, { s:26, a:'center' });
  T(`Tries left: ${'●'.repeat(f.tries)}${'○'.repeat(3 - f.tries)}`, fr.x+32, fr.y+fr.h-110, { s:16, c:C.muted }); if(f.note) T(f.note, fr.x+fr.w-32, fr.y+fr.h-110, { s:16, a:'right', c:C.warn });
  region(bx, by-20, bw, bh+40, () => reel(f), 'reel bar');
  btn(fr.x+fr.w/2-160, fr.y+fr.h-90, 320, 64, 'Reel in!', () => reel(f), { fill:true, col:C.cyan, s:22 });
  btn(fr.x+fr.w-170, fr.y+fr.h-82, 140, 50, 'Give up', () => { G.modal = f.back; goFish(f.back, 'lost'); }, { s:15 });
}

/* ---------------- the bar: shore leave ---------------- */
const BAR_NAMES = ['The Rusty Airlock','The Leaky Reactor','Ma Kettle\'s Spacers\' Rest','The Wobbly Comet','The Last Orbit','The Velvet Thruster','Zero-G Lounge','The Drunken Nebula'];
function barRound(st){ const c = 6 + 2*G.ship.crew.filter(x => x.owner==='p' && !x.drone).length; return c; }
function barAct(st, what){
  const crew = G.ship.crew.filter(c => c.owner==='p' && !c.drone);
  if(what==='round'){ const c = barRound(st); if(G.scrap < c){ toast('Not enough scrap.'); return; } G.scrap -= c; G.spent = (G.spent||0) + c; st.barDone = (st.barDone||0) + 1;
    for(const x of crew){ x.hp = Math.min(x.maxHp, x.hp + 20); addHearts(x, crew.some(o => o.quirk==='romantic') ? 50 : 40); }
    UI.storeMsg = pick(['The crew drink, sing, and tell the same three stories louder each time.', 'Somebody starts a dance on the table. Somebody else falls off it. Everyone agrees it was a great night.', 'Your crew make friends with a table of off-duty Rebuff gunners. Nobody mentions the war.']);
    if(Math.random() < .45) queueMorning(); }
  else if(what==='night'){ const c = 22; if(G.scrap < c){ toast('Not enough scrap.'); return; } G.scrap -= c; G.spent = (G.spent||0) + c; st.barDone = (st.barDone||0) + 1; st.nightOut = true;
    for(const x of crew){ x.hp = x.maxHp; addHearts(x, 75); gainXP(x, pick(['pilot','engines','shields','weapons','repair','combat']), 3); }
    UI.storeMsg = pick(['Shore leave! The crew vanish into the station\'s lights and come back at dawn, exhausted, happy and a little ashamed of themselves.', 'A full night out: dancing, karaoke, a brawl that turns into a friendship, and a very expensive bar tab you somehow avoid paying.']);
    if(Math.random() < .8) queueMorning(); }
  else if(what==='rumour'){ if(G.scrap < 5){ toast('Not enough scrap.'); return; } G.scrap -= 5; st.rumour = true; for(const n of G.map.nodes) n.revealed = true;
    UI.storeMsg = pick(['A drunk navigator draws you the whole sector on a napkin, beacons and all.', 'The barkeep slides you a datachip with every beacon in the sector. "You did not get this from me."']) + ' (Sector map revealed.)'; }
  else if(what==='cards'){ if(G.scrap < 15){ toast('Not enough scrap.'); return; } G.scrap -= 15; st.cards = true; const odds = .42 + (crew.some(c => c.quirk==='gambler') ? .15 : 0);
    if(Math.random() < odds){ G.scrap += 40; UI.storeMsg = `You win the pot: 40 scrap.${crew.some(c => c.quirk==='gambler') ? ' Your gambler takes all the credit.' : ''}`; } else UI.storeMsg = 'You lose. The dealer smiles the smile of someone who has never lost.'; }
  sfx('buy'); save();
}
function queueMorning(){ if(typeof MORNINGS==='undefined' || G.later.some(l => MORNINGS.includes(l.event))) return; const fresh = MORNINGS.filter(id => !G.seen[id]); G.later.push({ event:pick(fresh.length ? fresh : MORNINGS), jumps:1 }); }

/* something waiting for you on the Ship screen: ripe crops, or a wish you can grant now */
function homeAttention(){ if(!G || !G.ship) return null; if(G.garden && G.garden.plots.some(p => ripe(p))) return 'Crops are ready to harvest';
  const w = G.ship.crew.find(c => c.owner==='p' && !c.drone && c.wish && goodsHave(c.wish) && c.giftJ!==G.stats.jumps); if(w) return `${w.name} wishes for something you have`;
  const bd = G.ship.crew.find(c => c.owner==='p' && !c.drone && c.bday===G.stats.jumps && c.giftJ!==G.stats.jumps); if(bd) return `It is ${bd.name}'s birthday`; return null; }
/* ---------------- hook: each jump (run.js arrive) ---------------- */
function birthdays(){ if(!G || !G.ship) return; for(const c of G.ship.crew) if(c.owner==='p' && !c.drone){ if(c.bday==null) c.bday = G.stats.jumps + ri(4, 40);
    if(c.bday===G.stats.jumps){ G.chat = (G.chat||[]).filter(x => x.t>0).slice(-2); G.chat.push({ text:pick(['It\'s my birthday! Not that anyone remembered.','Guess who\'s a year older today?','Birthday! Cake? Anyone? No?']), id:c.id, t:3.6 }); toast(`It's ${c.name}'s birthday! A gift today counts triple.`); } } }
function homeJump(){ gardenJump(); birthdays();
  if(G.sector >= 2 && !G.fairPlanned && !G.daily && !G.cup){ G.fairPlanned = true; if(Math.random() < .7) G.later.push({ event:'m_fair', jumps:ri(5, 12) }); }   // the Harvest Fair, once a run if(typeof wishJump==='function') wishJump(); if(typeof travellersJump==='function') travellersJump();
  if(G.sector >= 2 && !G.mags && !G.magsPlanned && !G.daily && !G.cup){ G.magsPlanned = true; if(Math.random() < .75) G.later.push({ event:'m_mags_meet', jumps:ri(2, 5) }); }   // Mags finds most crews sooner or later
  // Rebuff space: patrols search ships, and illegal cargo goes
  if(G.sectorType==='rebuff' && Math.random() < .2 && typeof contrabandCheck==='function'){ const t = contrabandCheck(); if(t){ UI.toast = { text:t, t:5 }; if(typeof sagaNote==='function') sagaNote('law', `In sector ${G.sector} a Rebuff patrol found the smuggled cargo and took the lot.`); } }
  if(G.bay) for(const id of Object.keys(G.bay)) if(goodsDef(id)?.kind==='fish' && Math.random() < .08){ G.bay[id]--; if(!G.bay[id]) delete G.bay[id]; }   // fish do not keep forever: cook them
}
/* each fight won: the crew grow closer, and a full belly wears off */
function homeFight(){ for(const c of G.ship.crew) if(c.owner==='p' && !c.drone) addHearts(c, 6); if(G.fed > 0) G.fed--; }

/* ---------------- medals ---------------- */
ACHIEVEMENTS.push(
  { id:'home_harvest', name:'Space Farmer',   desc:'Harvest five crops from your ship\'s garden in one run.' },
  { id:'home_bestie',  name:'Best Captain Ever', desc:'Reach ten hearts with a crew member.' },
  { id:'market_mogul', name:'Merchant Prince', desc:'Earn 300 scrap from selling things in one run.' },
  { id:'home_angler',  name:'Deep Space Angler', desc:'Fish an ancient relic out of empty space.' }
);

/* ---------------- ship screen: the hold, gifts and hearts ---------------- */
function drawHoldTab(f, cx, y0){
  const W2 = f.w - 64, half = W2/2 - 10, ids = Object.keys(G.bay || {}).filter(id => goodsHave(id) && goodsDef(id));
  label(`Cargo hold · ${holdUsed()}/${holdCap()}`, cx, y0+10, C.muted, 'left', 14); T(G.fed > 0 ? `Well fed: ${G.fed} more fight${G.fed===1?'':'s'}` : '', cx+half, y0+10, { s:14, a:'right', c:C.good });
  if(!ids.length) para('Empty. Goods turn up in wrecks, at stores, from your garden and on the end of a fishing line. Sell them where they are wanted, cook them, or give them as gifts.', cx, y0+46, half, { s:16, lh:22, c:C.muted });
  const per = 8, pages = Math.max(1, Math.ceil(ids.length/per)), pg = clamp(UI.holdPage||0, 0, pages-1);
  ids.slice(pg*per, pg*per + per).forEach((id, i) => { const g = goodsDef(id), y = y0 + 22 + i*72, sel = UI.giftItem===id;
    panel(cx, y, half, 64, 8); if(sel){ rr(cx, y, half, 64, 8); ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.stroke(); }
    T(`${g.name} ×${goodsHave(id)}`, cx+16, y+26, { s:17, f:FD, w:700, c: g.illegal ? C.hostile : C.ink, max:half-300 }); T(`${g.kind} · worth about ${g.base}${g.want.length ? ' · wanted in ' + g.want.slice(0,2).map(w => (STORE_KINDS[w]||{}).title || w).join(', ') : ''}`, cx+16, y+48, { s:12, c:C.muted, max:half-300 });
    tip(cx, y, half-280, 64, g.name, g.desc);
    if(g.kind==='meal') btn(cx+half-284, y+10, 130, 44, 'Eat', () => eatMeal(id), { s:15, col:C.good });
    btn(cx+half-146, y+10, 132, 44, sel ? 'Cancel' : 'Give…', () => { UI.giftItem = sel ? null : id; }, { s:15, col:C.amber, fill:sel }); });
  if(pages > 1){ const py = y0 + 22 + per*72; btn(cx, py, 60, 40, '‹', () => { UI.holdPage = pg-1; }, { disabled:pg<=0 }); btn(cx+70, py, 60, 40, '›', () => { UI.holdPage = pg+1; }, { disabled:pg>=pages-1 }); }
  // delivery orders you have taken on
  const ords = typeof orders==='function' ? orders() : [];
  if(G.bounty && typeof bountyText==='function'){ const by_ = y0 + 22 + Math.min(per, ids.length)*72 + (pages > 1 ? 52 : 10) + (ords.length ? 44 + ords.length*24 : 0); label('Bounty contract (Kestrel Jones)', cx, by_+12, C.hostile, 'left', 13); T(bountyText(G.bounty), cx, by_+36, { s:14, c:C.ink, max:half }); }
  if(ords.length){ const oy = y0 + 22 + Math.min(per, ids.length)*72 + (pages > 1 ? 52 : 10); label('Delivery orders', cx, oy+12, C.violet, 'left', 13);
    ords.forEach((o, i) => { const g = goodsDef(o.id), ok = goodsHave(o.id) >= o.n; T(`${o.n} × ${g.name} for ${o.from} · ${o.pay} scrap · by sector ${o.by}${ok ? ' · ready to deliver at any store' : ` · you have ${goodsHave(o.id)}`}`, cx, oy + 36 + i*24, { s:14, c: ok ? C.good : C.ink, max:half }); }); }
  // the crew, their hearts, and what you know they love
  const qx = cx + half + 20, crew = G.ship.crew.filter(c => c.owner==='p' && !c.drone);
  label(UI.giftItem ? `Give ${goodsDef(UI.giftItem)?.name.toLowerCase() || ''} to…` : 'Your crew', qx, y0+10, UI.giftItem ? C.amber : C.muted, 'left', 14);
  crew.slice(0, 8).forEach((c, i) => { const y = y0 + 22 + i*72, h = heartsOf(c), today = c.giftJ===G.stats.jumps;
    panel(qx, y, half, 64, 8); drawPortrait(qx+30, y+32, 20, c, false);
    T(c.name, qx+60, y+26, { s:17, f:FD, w:700, max:150 }); T('♥'.repeat(h) + '♡'.repeat(10-h), qx+220, y+26, { s:16, c:C.hostile });
    const known = (c.knownLoves||[]).map(id => goodsDef(id)?.name).filter(Boolean);
    if(c.bday===G.stats.jumps) T(`🎂 Birthday today! Gifts count triple${c.giftJ===G.stats.jumps ? ' (got one)' : ''}`, qx+60, y+48, { s:12, c:C.good, max:half-250 });
    else if(c.wish && goodsDef(c.wish)) T(`Wishes for ${goodsDef(c.wish).name.toLowerCase()}${goodsHave(c.wish) ? ' (you have some!)' : ''}`, qx+60, y+48, { s:12, c: goodsHave(c.wish) ? C.good : C.warn, max:half-250 });
    else T(known.length ? `Loves: ${known.join(', ')}` : `${typeof quirkName==='function' ? quirkName(c) : ''}${h >= 6 ? ' · works harder for you' : ''}`, qx+60, y+48, { s:12, c:C.muted, max:half-250 });
    tip(qx, y, half-180, 64, `${c.name} · ${h} heart${h===1?'':'s'}`, `Hearts grow with gifts they like, meals eaten together, nights out and fights survived together. At 6 hearts they repair and fight 5% better (10% at 10); at 8 they get +10 health. At 4 and 8 hearts they open up to you.${known.length ? ' Known loves: ' + known.join(', ') + '.' : ''}`);
    if(UI.giftItem) btn(qx+half-170, y+10, 156, 44, today ? 'Had a gift today' : 'Give', () => { const id = UI.giftItem; giveGift(c, id); if(giftReaction(c, id)===2) (c.knownLoves = c.knownLoves || []).includes(id) || c.knownLoves.push(id); if(!goodsHave(id)) UI.giftItem = null; }, { s:14, disabled:today, col:C.amber, fill:!today }); });
}
/* ---------------- ship screen: the garden and the galley ---------------- */
function drawGardenTab(f, cx, y0){
  const W2 = f.w - 64, gd = garden(), seeds = Object.keys(G.seeds || {}).filter(k => G.seeds[k] > 0 && SEEDS[k]);
  label(`Hydroponic garden · ${gd.plots.length} planter${gd.plots.length===1?'':'s'}`, cx, y0+10, C.muted, 'left', 14);
  { const ready = gd.plots.filter(p => ripe(p)).length, empty = gd.plots.filter(p => !p).length;   // one tap for the whole garden
    if(ready > 1) btn(cx+620, y0-12, 170, 36, `Harvest all (${ready})`, () => gd.plots.forEach((p, i) => { if(ripe(p)) harvest(i); }), { s:13, fill:true, col:C.good });
    else if(empty > 1 && UI.seedSel && (G.seeds[UI.seedSel]||0) > 1) btn(cx+620, y0-12, 170, 36, 'Plant all', () => gd.plots.forEach((p, i) => { if(!p && UI.seedSel) plant(i, UI.seedSel); }), { s:13, col:C.good }); }
  T(gardener() ? `${gardener().name} tends the garden: crops grow faster and yield more.` : 'Crops grow a little every jump, faster under a sun. Ion storms stunt them.', cx+W2, y0+10, { s:13, a:'right', c:C.cyan });
  if(!seeds.includes(UI.seedSel)) UI.seedSel = seeds[0] || null;
  gd.plots.forEach((p, i) => { const x = cx + (i%3)*(W2/3 + 4), y = y0 + 24 + Math.floor(i/3)*150, w = W2/3 - 8;
    panel(x, y, w, 140, 10);
    if(!p){ T('Empty planter', x+18, y+34, { s:18, f:FD, w:700, c:C.muted });
      btn(x+18, y+76, w-36, 48, UI.seedSel ? `Plant ${SEEDS[UI.seedSel].name}` : 'No seeds', () => plant(i, UI.seedSel), { disabled:!UI.seedSel, col:C.good, s:16 }); return; }
    const sd = SEEDS[p.seed], fr = clamp(p.g/sd.grow, 0, 1), done = ripe(p);
    // a little plant that grows
    const px = x+w-60, py = y+108, hgt = 14 + fr*56; ctx.strokeStyle = '#7be0a0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px-10, py-hgt/2, px, py-hgt); ctx.stroke();
    for(let l=1;l<=Math.ceil(fr*4);l++){ ctx.fillStyle = '#5fc98a'; ctx.beginPath(); ctx.ellipse(px + (l%2 ? 10 : -10), py - l*hgt/5, 9, 4, l%2 ? -.5 : .5, 0, 7); ctx.fill(); }
    if(done){ ctx.fillStyle = { star_potato:'#d8b27a', ion_berry:'#7ad8ff', void_pepper:'#ff5a7a', nebula_bloom:'#c48bff', moon_melon:'#f4f0b0', glass_lily:'#bff4ff' }[p.seed] || C.amber; ctx.beginPath(); ctx.arc(px, py-hgt-6, 10, 0, 7); ctx.fill(); }
    T(sd.name, x+18, y+34, { s:18, f:FD, w:700, max:w-110 }); T(done ? 'Ready!' : `${Math.max(0, Math.ceil(sd.grow - p.g))} jump${Math.ceil(sd.grow - p.g)===1?'':'s'} to go`, x+18, y+58, { s:14, c: done ? C.good : C.muted });
    bar(x+18, y+68, w-110, 8, fr, done ? C.good : C.amber);
    btn(x+18, y+86, w-110, 42, done ? 'Harvest' : 'Growing…', () => harvest(i), { disabled:!done, fill:done, col:C.good, s:16 }); });
  // seed packets
  const sy = y0 + 24 + Math.ceil(gd.plots.length/3)*150 + 6;
  label('Seeds', cx, sy+12, C.muted, 'left', 14);
  if(!seeds.length) T('No seeds. Stores sell them on the Goods tab.', cx+90, sy+12, { s:14, c:C.muted });
  seeds.forEach((k, i) => btn(cx + 80 + i*180, sy-12, 170, 40, `${SEEDS[k].name} ×${G.seeds[k]}`, () => { UI.seedSel = k; }, { s:13, fill:UI.seedSel===k, col:C.good }));
  // the galley
  const gy = sy + 46; label(`Galley${cook() ? ' · ' + cook().name + ' is cooking: double portions' : ''}`, cx, gy+10, C.muted, 'left', 14);
  Object.entries(RECIPES).forEach(([k, r], i) => { const x = cx + (i%3)*(W2/3 + 4), y = gy + 22 + Math.floor(i/3)*86, w = W2/3 - 8, ok = canCook(k), g = goodsDef(k);
    panel(x, y, w, 78, 8); T(g.name, x+16, y+28, { s:17, f:FD, w:700, max:w-150 });
    T(Object.entries(r.need).map(([id, n]) => `${n} ${goodsDef(id).name.toLowerCase()} (${goodsHave(id)})`).join(' + '), x+16, y+52, { s:12, c: ok ? C.good : C.muted, max:w-150 });
    tip(x, y, w-140, 78, g.name, `${g.desc} Eating it heals the crew ${r.heal} and keeps them well fed for ${r.fed} fights (+10% repair, melee and weapon charge). Worth about ${g.base} at a store.`);
    btn(x+w-128, y+16, 114, 46, 'Cook', () => cookMeal(k), { disabled:!ok, fill:ok, col:C.good, s:15 }); });
}

/* ---------------- the Harvest Fair: once a run, a festival ---------------- */
function bestOfKind(kind){ return Object.keys(G.bay || {}).filter(id => goodsHave(id) && goodsDef(id)?.kind===kind).sort((a, b) => goodsDef(b).base - goodsDef(a).base)[0] || null; }
function fairEffect(e, L){
  if(e.fairCrop){ const id = bestOfKind('crop'); if(!id) return; takeGoods(id, 1); const g = goodsDef(id);
    if(g.base >= 30){ L.push(`First prize for your ${g.name.toLowerCase()}!`); G.scrap += 40; L.push('+40 scrap'); L.push(giveAugment('random')); grant('home_fair'); }
    else if(g.base >= 12){ L.push(`Second prize for your ${g.name.toLowerCase()}`); G.scrap += 30; L.push('+30 scrap'); G.seeds = G.seeds || {}; G.seeds.moon_melon = (G.seeds.moon_melon||0) + 2; L.push('+2 Moon melon seeds'); }
    else { L.push(`A "very enthusiastic" rosette for your ${g.name.toLowerCase()}`); G.scrap += 12; L.push('+12 scrap'); }
    if(typeof sagaNote==='function') sagaNote('fair', `At the Harvest Fair in sector ${G.sector}, the crew showed their ${g.name.toLowerCase()}${g.base >= 30 ? ' and won first prize' : g.base >= 12 ? ' and came second' : ', which won a rosette for enthusiasm'}.`); }
  if(e.fairStall){ let v = 0; for(const id of Object.keys(G.bay || {})) if(goodsDef(id)?.kind==='meal'){ const n = goodsHave(id); v += Math.round(goodsDef(id).base*1.8)*n; takeGoods(id, n); }
    if(v){ G.scrap += v; G.earnedSelling = (G.earnedSelling||0) + v; L.push(`Food stall takings: +${v} scrap`); } }
  if(e.fairDance){ for(const c of G.ship.crew) if(c.owner==='p' && !c.drone) addHearts(c, 70); L.push('The whole crew had the best night of the voyage'); }
}
Object.assign(BASE.events, {
  m_fair:{ title:'The Harvest Fair', moment:true, questOnly:true, noStar:true, art:'market', text:'Bunting, music and the smell of frying: the Harvest Fair, held every year on a farming moon and open to every passing crew. There is a crop show, a row of food stalls, a dance under paper lanterns, and a very competitive pie judge.', choices:[
    { text:'Enter your best crop in the show.', req:{ goodsKind:'crop' }, effect:{ text:'The judges walk the tables in silence, tapping produce with little hammers. Then they come back to yours.', fairCrop:true, crewHeal:10 } },
    { text:'Run a food stall with your meals.', req:{ goodsKind:'meal' }, effect:{ text:'The crowd queues around the block. Your crew sell out in an hour and spend the rest of the fair being congratulated.', fairStall:true } },
    { text:'Dance with your crew under the lanterns.', effect:{ text:'Everyone dances, even the grump, even the Pebblekin, very carefully. It is the best night of the voyage.', fairDance:true, crewHeal:30, saga:'The crew danced under paper lanterns at the Harvest Fair.' } },
    { text:'Try the pie contest.', chance:.4, success:{ text:'The pie judge takes one bite, closes her eyes, and gives you first prize: a year\'s supply of pie, which is two pies, and some scrap.', scrap:30, goods:{ berry_pie:2 } }, fail:{ text:'"Adequate," says the pie judge, which from her is high praise. You get a consolation pie.', goods:{ berry_pie:1 } } } ] }
});
ACHIEVEMENTS.push({ id:'home_fair', name:'Best in Show', desc:'Win first prize at the Harvest Fair.' });
