'use strict';
/* =========================================================================
   Market: stores worth stopping at.
   - Every sector has its own kind of store (a Rebuff surplus depot, a pyrate
     black market, an Enjinn workshop...) with a named keeper, its own stock,
     its own prices, and things it pays well for.
   - Bigger stock, a deal of the day, mystery crates, haggling, and a guild
     loyalty card that rewards regular customers.
   - Crew are worth what they are worth: race, skills, veterancy, health and
     the store all count, for hiring and for selling.
   - Trade goods: things to buy where they are made and sell where they are
     wanted, kept in the cargo hold. Crops, fish and meals (homestead.js) are
     goods too.
   ========================================================================= */

/* ---------------- trade goods ----------------
   base: a fair price. from: sector kinds that make it (cheap there). want: sector kinds that pay well. kind: what it is.
   illegal: Rebuff stores will not touch it, and Rebuff patrols may confiscate it. */
BASE.goods = {
  // crops (grown in the garden, homestead.js)
  star_potato: { name:'Star potato',    base:6,  kind:'crop',  from:['civilian','pebblekin'], want:['mantlis','laststand'], desc:'Lumpy, filling, grows anywhere. Every cook\'s best friend.' },
  ion_berry:   { name:'Ion berries',    base:5,  kind:'crop',  from:['voltan'], want:['sloog','civilian'], desc:'Fizz on the tongue. Slightly charged.' },
  void_pepper: { name:'Void pepper',    base:11, kind:'crop',  from:['nebula'], want:['mantlis','pyrate'], desc:'So hot it bends light. The Mantlis eat them whole.' },
  nebula_bloom:{ name:'Nebula bloom',   base:12, kind:'crop',  from:['nebula'], want:['sloog','glass','civilian'], desc:'A flower that glows the colour of the cloud it grew in. Romantic.' },
  moon_melon:  { name:'Moon melon',     base:22, kind:'crop',  from:['civilian'], want:['rebuff','voltan'], desc:'Huge, sweet, takes ages to grow. A delicacy on every station.' },
  glass_lily:  { name:'Glass lily',     base:40, kind:'crop',  from:['glass'], want:['civilian','rebuff','sloog'], desc:'A crystal flower that rings when you touch it. Collectors adore them.' },
  // fish (fishing, homestead.js)
  space_fish:  { name:'Space fish',     base:7,  kind:'fish',  from:['nebula'], want:['pebblekin','civilian'], desc:'Swims in vacuum. Tastes of chicken, somehow.' },
  deep_eel:    { name:'Deep eel',       base:24, kind:'fish',  from:[], want:['mantlis','sloog','pyrate'], desc:'Long, glowing and furious. A rare catch.' },
  // trade
  sloog_silk:  { name:'Sloog silk',     base:18, kind:'trade', from:['sloog'], want:['civilian','rebuff','voltan'], desc:'Spun by Sloogs, who refuse to say how.' },
  pebble_geode:{ name:'Pebblekin geode',base:15, kind:'trade', from:['pebblekin'], want:['enjinn','glass','civilian'], desc:'Plain rock outside, a galaxy inside.' },
  voltan_cell: { name:'Voltan cells',   base:16, kind:'trade', from:['voltan'], want:['enjinn','civilian','pyrate'], desc:'Batteries charged by Voltan monks. Still warm.' },
  enjinn_spice:{ name:'Enjinn spice',   base:14, kind:'trade', from:['enjinn'], want:['sloog','mantlis','civilian'], desc:'Makes engines run smoother and soup run hotter.' },
  mantlis_chitin:{ name:'Mantlis chitin',base:13, kind:'trade', from:['mantlis'], want:['pebblekin','enjinn'], desc:'Shed armour plates. Light and tough. Do not ask whose.' },
  rations:     { name:'Rebuff rations', base:4,  kind:'trade', from:['rebuff','laststand'], want:['pyrate','nebula'], desc:'Grey bricks of food. Technically edible.' },
  pyrate_rum:  { name:'Pyrate rum',     base:10, kind:'trade', from:['pyrate'], want:['rebuff','civilian','laststand'], desc:'Strong enough to strip paint. Often used for that.' },
  space_wine:  { name:'Space wine',     base:20, kind:'trade', from:['civilian','voltan'], want:['pyrate','mantlis','laststand'], desc:'A good vintage from a terraformed moon. Goes to the head fast in zero-g.' },
  nebula_crystal:{ name:'Nebula crystal',base:26, kind:'trade', from:['nebula'], want:['glass','voltan','enjinn'], desc:'Condensed nebula. Hums in the dark.' },
  old_books:   { name:'Old books',      base:9,  kind:'trade', from:['rebuff','civilian'], want:['sloog','glass'], desc:'Paper! Real paper! Some of it is even the right way up.' },
  toy_robots:  { name:'Toy robots',     base:8,  kind:'trade', from:['enjinn'], want:['civilian','laststand'], desc:'Wind-up, beeping, mildly self-aware.' },
  love_potion: { name:'"Love potion"',  base:22, kind:'trade', from:['sloog','nebula'], want:['pyrate','civilian','mantlis'], illegal:true, desc:'Pink, fizzy, very much not approved by any health authority. Sells like mad.' },
  contraband:  { name:'Contraband',     base:30, kind:'trade', from:['pyrate','nebula'], want:['laststand','rebuff'], illegal:true, desc:'Sealed crates. Best not to look inside. Pays very well, if nobody checks.' },
  relic:       { name:'Ancient relic',  base:60, kind:'curio', from:[], want:['glass','sloog','voltan'], desc:'Older than the Fedoration. Collectors will pay a fortune.' },
  junk:        { name:'Interesting junk', base:3, kind:'curio', from:[], want:[], desc:'A rubber duck, a single boot, a toaster from the future. Collectors pay a little.' },
  // meals (cooked in the galley, homestead.js)
  spicy_hash:  { name:'Spicy hash',     base:24, kind:'meal',  from:[], want:['mantlis','pyrate'], desc:'Star potato and void pepper. Warms you to your boots.' },
  star_stew:   { name:'Star stew',      base:22, kind:'meal',  from:[], want:['pebblekin','laststand'], desc:'Fish and potato in a thick broth. A crew favourite.' },
  berry_pie:   { name:'Ion berry pie',  base:20, kind:'meal',  from:[], want:['civilian','voltan'], desc:'Fizzes slightly. Nobody minds.' },
  melon_sorbet:{ name:'Moon melon sorbet', base:45, kind:'meal', from:[], want:['rebuff','glass','sloog'], desc:'Cold, sweet and absurdly fancy.' },
  fish_supper: { name:'Fish supper',    base:18, kind:'meal',  from:[], want:['civilian','laststand'], desc:'Battered space fish and chunky potato. Proper food.' }
};
function goodsDef(id){ return (DATA && DATA.goods && DATA.goods[id]) || BASE.goods[id] || null; }
function holdCap(){ return (R.hold || 16) + (G.holdBonus || 0); }
function holdUsed(){ return Object.values(G.bay || {}).reduce((a, b) => a + b, 0); }
function goodsHave(id){ return (G.bay && G.bay[id]) || 0; }
/* add goods to the hold; returns how many fitted */
function addGoods(id, n){ if(!goodsDef(id) || n <= 0) return 0; G.bay = G.bay || {}; const fit = Math.max(0, Math.min(n, holdCap() - holdUsed())); if(fit) G.bay[id] = (G.bay[id] || 0) + fit; return fit; }
function takeGoods(id, n){ if(goodsHave(id) < n) return false; G.bay[id] -= n; if(G.bay[id] <= 0) delete G.bay[id]; return true; }

/* ---------------- kinds of store ----------------
   mod: price multipliers by category (weapon, drone, aug, system, supply, crew, goods). w/d/a: how many weapons, drones, augments.
   pays: what it pays extra for when you sell (goods kinds, or 'gear', 'crew'). bar: chance of a bar (homestead.js). */
const STORE_KINDS = {
  civilian: { title:'General store',            w:3, d:2, a:2, mod:{ supply:.9 }, bar:.75, pays:{ crop:1.15, meal:1.2 } },
  rebuff:   { title:'Rebuff surplus depot',     w:4, d:2, a:2, mod:{ weapon:.9, aug:1.1, supply:.95 }, bar:.35, noIllegal:true, pays:{ gear:1.1 } },
  pyrate:   { title:'Black market',             w:4, d:2, a:3, mod:{ weapon:.85, drone:.9, supply:1.1 }, bar:1, pays:{ gear:1.15, crew:1.2, trade:1.1 }, shady:true },
  nebula:   { title:"Smugglers' den",           w:3, d:3, a:2, mod:{ drone:.9, supply:1.05 }, bar:.8, pays:{ trade:1.1, curio:1.2 }, shady:true },
  sloog:    { title:'Sloog emporium',           w:3, d:2, a:4, mod:{ aug:.85 }, bar:.6, pays:{ curio:1.3, crop:1.1 } },
  pebblekin:{ title:'Pebblekin quarry exchange',w:3, d:2, a:2, mod:{ supply:.85, repair:.7 }, bar:.5, pays:{ fish:1.2, meal:1.15 } },
  enjinn:   { title:'Enjinn workshop',          w:3, d:4, a:2, mod:{ drone:.8, system:.85, part:.75 }, bar:.4, pays:{ gear:1.2 } },
  voltan:   { title:'Voltan bazaar',            w:3, d:2, a:3, mod:{ system:.9, aug:.9 }, bar:.5, pays:{ curio:1.2 } },
  mantlis:  { title:'Mantlis arms',             w:5, d:2, a:2, mod:{ weapon:.85, missile:.85 }, bar:.7, pays:{ crew:1.3, meal:1.2 }, fighters:true },
  laststand:{ title:'Fedoration quartermaster', w:4, d:2, a:2, mod:{ supply:.8, repair:.8 }, bar:.5, pays:{ meal:1.3, gear:1.1 } },
  glass:    { title:'Glass gallery',            w:3, d:2, a:4, mod:{ aug:.9 }, bar:.3, pays:{ curio:1.5, crop:1.2 } }
};
function storeKind(st){ return STORE_KINDS[(st && st.kind) || 'civilian'] || STORE_KINDS.civilian; }
const KEEPER_MOODS = ['cheerful','grumpy','sleepy','chatty','suspicious','dramatic','very relaxed','nervous'];

/* called at the end of makeStore_ (run.js), inside the store's seed */
function marketStock(st){
  if(!G) return st; const s = G.ship, kind = STORE_KINDS[G.sectorType] ? G.sectorType : 'civilian', K = STORE_KINDS[kind];
  st.kind = kind; st.title = K.title;
  const kr = pick(Object.keys(DATA.races).filter(k => !DATA.races[k].secret)); st.keeper = { name:pick(NAMES), race:kr, mood:pick(KEEPER_MOODS) };
  // more stock: weapons and drones by store kind, never what you already carry if it can be helped
  const wp = Object.values(DATA.weapons).filter(w => !w.noLoot && (w.tier||1) <= 1 + Math.ceil(G.sector/2)).map(w => w.id); shuffle(wp);
  const dp = Object.values(DATA.drones).filter(d => !d.noLoot).map(d => d.id); shuffle(dp);
  const ap = Object.keys(DATA.augments).filter(k => !s.augments.includes(k)); shuffle(ap);
  st.weapons = [...new Set([...st.weapons, ...wp])].slice(0, K.w); st.drones = [...new Set([...st.drones, ...dp])].slice(0, K.d); st.augments = [...new Set([...st.augments, ...ap])].slice(0, K.a);
  // per item prices wobble a little, so it pays to compare stores
  st.wob = {}; for(const id of [...st.weapons, ...st.drones, ...st.augments]) st.wob[id] = 0.88 + Math.random()*0.24;
  // today's deal: one thing at 30% off
  const pool = [...st.weapons.map(id => 'w:' + id), ...st.drones.map(id => 'd:' + id), ...st.augments.map(id => 'a:' + id)]; st.deal = pool.length ? pick(pool) : null;
  // two crew looking for work, of different races
  const races = Object.keys(DATA.races).filter(k => !DATA.races[k].secret || G.sectorType==='glass'); shuffle(races); st.crewRaces = races.slice(0, 2); st.crewRace = st.crewRaces[0]; st.hired = [];
  // goods: some of what this sector makes, a couple of other things, and seeds
  const here = Object.keys(BASE.goods).filter(id => { const g = goodsDef(id); return g.kind!=='meal' && g.kind!=='curio' && g.kind!=='fish' && (!g.illegal || K.shady) && g.from.includes(kind); });
  const other = Object.keys(BASE.goods).filter(id => { const g = goodsDef(id); return (g.kind==='trade') && !g.from.includes(kind) && (!g.illegal || K.shady); }); shuffle(other);
  st.goods = [...new Set([...here, ...other.slice(0, 2)])].filter(id => goodsDef(id).kind!=='crop').map(id => ({ id, n:ri(2, 6) }));
  st.seeds = Object.keys(typeof SEEDS!=='undefined' ? SEEDS : {}).filter(k => !SEEDS[k].only || SEEDS[k].only===kind); shuffle(st.seeds); st.seeds = st.seeds.slice(0, 3);
  st.moodMult = ({ grumpy:1.06, cheerful:.96, suspicious:1.04, 'very relaxed':.95 })[st.keeper.mood] || 1;
  st.bar = Math.random() < (K.bar ?? .5); st.haggled = null; st.crate = 0;
  return st;
}
/* the price of something at this store (run.js price() calls this) */
function marketMult(st, cat, id){
  if(!st || st.arena || !G) return 1;
  const K = storeKind(st); let m = (K.mod && (K.mod[cat] ?? (['fuel','missile','part','repair'].includes(cat) ? K.mod.supply : null))) || 1;
  m *= (1 + .03*((G.sector||1) - 1)) * (st.moodMult || 1);   // later sectors cost a bit more
  if(id && st.wob && st.wob[id]) m *= st.wob[id];
  if(st.haggled==='won') m *= .85; else if(st.haggled==='lost') m *= 1.1;
  m *= 1 - loyaltyOff();
  if(K.shady && G.ship.crew.some(c => c.owner==='p' && c.quirk==='expyrate')) m *= .9;   // an ex-pyrate knows the right people
  return m;
}
function dealOff(st, key){ return st && st.deal===key ? .7 : 1; }
/* the merchant guild card: spend more, pay less */
const LOYALTY = [[0, 0, 'None'], [150, .05, 'Bronze'], [400, .08, 'Silver'], [800, .12, 'Gold']];
function loyaltyTier(){ const s = G ? (G.spent||0) : 0; let t = LOYALTY[0]; for(const l of LOYALTY) if(s >= l[0]) t = l; return t; }
function loyaltyOff(){ return loyaltyTier()[1]; }
function nextLoyalty(){ const s = G.spent||0; return LOYALTY.find(l => l[0] > s) || null; }

/* what a store pays for something (the sell price) */
function sellMult(st, kind){ const K = storeKind(st); let m = (K.pays && K.pays[kind]) || 1;
  if(G.ship.crew.some(c => c.owner==='p' && !c.drone && c.quirk==='collector')) m *= 1.1;   // collectors know what things are worth
  if(st && st.haggled==='won') m *= 1.08; return m; }
function goodsPrice(id, st, selling){
  const g = goodsDef(id); if(!g) return 0; const kind = (st && st.kind) || G.sectorType;
  let p = g.base * (g.from.includes(kind) ? .6 : g.want.includes(kind) ? 1.65 : 1) * (1 + .02*((G.sector||1) - 1));
  if(selling){ p *= .75 * sellMult(st, g.kind) * sellMagsBonus(st, g.kind); return Math.max(1, Math.round(p)); }
  return Math.max(1, Math.round(p * (st ? marketMult(st, 'goods') : 1)));
}

/* ---------------- crew worth ---------------- */
const RACE_WORTH = { human:34, pebblekin:44, enjinn:44, voltan:48, sloog:50, mantlis:52, glassborn:85 };
function crewWorth(c){
  if(!c) return 0; const r = DATA.races[c.race] || {};
  let v = RACE_WORTH[c.race] ?? Math.round(30 + (r.hp||100)/10);
  v += SKILLS.reduce((t, k) => t + skillLvl(c, k)*9, 0);   // trained crew are worth a lot more
  if(c.trait) v += 10; if(c.vet) v += 25; v += Math.min(30, (c.kills||0)*2);
  if(typeof heartsOf==='function') v += 0;   // friendship is not for sale (it costs you, see sellCrew)
  return Math.round(v);
}
/* what this store pays for one of your crew */
function crewSellPrice(c, st){
  const K = storeKind(st); let m = .9 * (.55 + .45*clamp(c.hp/c.maxHp, 0, 1)) * ((K.pays && K.pays.crew) || 1);
  if(K.fighters && (skillLvl(c,'combat') > 0 || (DATA.races[c.race]||{}).combat > 1)) m *= 1.2;   // Mantlis arms pay extra for fighters
  if(st && st.haggled==='won') m *= 1.08;
  let v = Math.round(crewWorth(c) * m);
  if(st && (st.hired||[]).includes(c.id)) v = Math.round(v*.5);   // they only just signed on here
  return Math.max(10, Math.min(v, Math.round(hirePrice(c, st)*.8)));   // a store never pays more than it would charge
}
function hirePrice(c, st){ return price(Math.round(crewWorth(c) * 1.35 + (c.quirk ? 4 : 0)), st, 'crew'); }
function storeCandidates(st, node){
  if(!st.cands) st.cands = withSeed(`s${G.sector}n${node}cands`, () => (st.crewRaces || [st.crewRace]).map(r => newCrew(DATA.races[r] ? r : 'human', 'p')));
  return st.cands;
}
/* selling one of your crew to the store: the money is good, the crew will not forget it */
function sellCrew(c, st){
  const v = crewSellPrice(c, st), fighting = G.enemy && !G.enemy.dead; if(fighting){ toast('Not while fighting.'); return; }
  const b = typeof bondOf==='function' ? bondOf(c) : null;
  crewLeaves(c); G.scrap += v; sfx('buy');
  for(const o of G.ship.crew) if(o.owner==='p' && !o.drone && typeof addHearts==='function') addHearts(o, b && b.other===o ? -400 : -60);
  if(b && b.other){ const o = b.other; o.bond = { id:c.id, kind:b.kind, lost:true };
    const line = { friends:`You SOLD ${c.name}? I'll never forgive this.`, siblings:`That was my ${c.gender==='f' ? 'sister' : c.gender==='m' ? 'brother' : 'sibling'}!`, rivals:`...I actually miss arguing with ${c.name}.`, sweethearts:`${c.name}! Come back! Captain, how could you?` }[b.kind];
    G.chat = (G.chat||[]).filter(x => x.t>0).slice(-2); G.chat.push({ text:line, id:o.id, t:3.4 }); }
  const K = storeKind(st);
  toast(`${c.name} signs on with the ${K.title.toLowerCase()}. +${v} scrap`);
  if(typeof sagaNote==='function') sagaNote('sold', `In sector ${G.sector}, the captain sold ${c.name} the ${typeof quirkName==='function' ? quirkName(c).toLowerCase() || 'crew member' : 'crew member'} to a ${K.title.toLowerCase()} for ${v} scrap.${b ? ` ${b.other.name} never quite forgave it.` : ' The crew went quiet for a while.'}`);
  save();
}

/* ---------------- haggling, mystery crates ---------------- */
function haggleOdds(st){ let p = .38; const mine = G.ship.crew.filter(c => c.owner==='p' && !c.drone);
  if(mine.some(c => c.quirk==='gambler')) p += .17; if(storeKind(st).shady && mine.some(c => c.quirk==='expyrate')) p += .15; if(mine.some(c => c.quirk==='grump')) p -= .05;
  if(st.keeper && st.keeper.mood==='grumpy') p -= .1; if(st.keeper && st.keeper.mood==='chatty') p += .08; return clamp(p, .1, .85); }
function haggle(st){
  if(st.haggled) return; const win = Math.random() < haggleOdds(st); st.haggled = win ? 'won' : 'lost';
  const who = G.ship.crew.find(c => c.owner==='p' && (c.quirk==='gambler' || c.quirk==='expyrate')) || G.ship.crew.find(c => c.owner==='p' && !c.drone);
  const k = st.keeper || { name:'The keeper' };
  st.haggleText = win ? pick([`${who ? who.name : 'You'} haggles like a legend. ${k.name} throws up their hands: everything is 15% off, and they pay a little more for what you sell.`, `${k.name} laughs, says you remind them of their mother, and knocks 15% off everything.`, `After twenty minutes of shouting, ${k.name} gives in. 15% off. ${who ? who.name : 'Your crew'} is insufferable for the rest of the day.`])
    : pick([`${k.name} is not amused. Prices go up 10% "for time wasters".`, `${k.name} pretends not to understand you, then adds a 10% "attitude surcharge".`, `${who ? who.name : 'You'} pushes too hard. ${k.name} now charges you 10% extra out of spite.`]);
  sfx(win ? 'buy' : 'error');
}
function crateCost(){ return 18 + G.sector*5; }
function openCrate(st){
  const c = crateCost(); if(G.scrap < c){ toast('Not enough scrap.'); return; } G.scrap -= c; G.spent = (G.spent||0) + c; st.crate = (st.crate||0) + 1; sfx('buy');
  const r = Math.random(); let msg;
  if(r < .22) msg = 'Inside: ' + giveWeapon('random');
  else if(r < .31) msg = 'Inside: ' + giveDrone('random');
  else if(r < .38) msg = 'Inside: ' + giveAugment('random');
  else if(r < .66){ const ids = Object.keys(BASE.goods).filter(id => ['trade','curio'].includes(goodsDef(id).kind)); const id = pick(ids), n = ri(2, 5), got = addGoods(id, n); msg = got ? `Inside: ${got} × ${goodsDef(id).name}.` : 'Inside: goods, but your hold is full, so you leave them.'; }
  else if(r < .8 && typeof SEEDS!=='undefined'){ const k = pick(Object.keys(SEEDS)); G.seeds = G.seeds || {}; G.seeds[k] = (G.seeds[k]||0) + 3; msg = `Inside: 3 packets of ${SEEDS[k].name} seeds.`; }
  else if(r < .86){ G.missiles += 4; G.parts += 2; msg = 'Inside: 4 missiles and 2 drone parts, packed in straw.'; }
  else msg = pick(['Inside: four hundred rubber ducks. You keep one for luck.','Inside: a single, very old sandwich.','Inside: another, smaller mystery crate. It is empty.','Inside: a love letter addressed to someone called "Big Dave". You read it. It is very detailed.']) + ' ' + (addGoods('junk', 2) ? '(+2 interesting junk)' : '');
  UI.storeMsg = msg; save();
}

/* ---------------- what you can sell ---------------- */
function sellables(st){
  const s = G.ship, L = [];
  for(const o of orders()) if(goodsHave(o.id) >= o.n) L.push({ key:'o:' + o.id, name:`Order: ${o.n} × ${goodsDef(o.id).name}`, sub:`for ${o.from}`, v:o.pay, hot:true, sell:() => { deliver(o); return 'order'; } });
  (s.cargo||[]).forEach((c, i) => { const d = c.kind==='weapon' ? DATA.weapons[c.id] : DATA.drones[c.id]; L.push({ key:'c'+i, name:d?.name || c.id, sub:`${c.kind} in cargo`, v:Math.round(sellValue(c.kind, c.id) * sellMult(st, 'gear')), sell:() => { s.cargo.splice(i, 1); } }); });
  s.augments.forEach((a, i) => L.push({ key:'a'+i, name:DATA.augments[a]?.name || a, sub:'augment (installed)', v:Math.round(sellValue('augment', a) * sellMult(st, 'gear')), sell:() => { s.augments.splice(i, 1); } }));
  for(const id of Object.keys(G.bay || {})){ const g = goodsDef(id); if(!g || !goodsHave(id)) continue; if(g.illegal && storeKind(st).noIllegal) continue;
    const v = goodsPrice(id, st, true), tag = g.want.includes(st.kind) ? ' · in demand here!' : g.from.includes(st.kind) ? ' · common here' : '';
    L.push({ key:'g:'+id, name:`${g.name} ×${goodsHave(id)}`, sub:`${g.kind}${tag}`, v, sell:() => takeGoods(id, 1), more:goodsHave(id) > 1 ? () => { const n = goodsHave(id); takeGoods(id, n); return n; } : null, hot:!!tag && tag.includes('demand') }); }
  const sup = [['fuel', 'Fuel cell', 1, () => G.fuel > 0, () => G.fuel--], ['missiles', 'Missile', 3, () => G.missiles > 0, () => G.missiles--], ['parts', 'Drone part', 4, () => G.parts > 0, () => G.parts--]];
  for(const [k, n, v, ok, take] of sup) if(ok()) L.push({ key:'s:'+k, name:`${n} (you have ${G[k]})`, sub:'supplies', v, sell:take });
  return L;
}

/* ---------------- loot: goods turn up in wrecks and beacons ---------------- */
function factionGood(faction){ const map = { pyrate:['pyrate_rum','contraband','space_wine'], rebuff:['rations','old_books'], sloog:['sloog_silk','love_potion'], pebblekin:['pebble_geode'], enjinn:['enjinn_spice','toy_robots'], voltan:['voltan_cell'], mantlis:['mantlis_chitin'], glass:['nebula_crystal'], auto:['voltan_cell','toy_robots'] };
  return pick(map[faction] || ['rations','space_wine','old_books','pebble_geode','sloog_silk']); }
/* effects for events and loot (called from applyEffect): goods:{id:n} or goods:'loot', seeds:{id:n} */
function marketEffect(e, L){
  if(!G || !e) return;
  if(e.goods){ const list = e.goods==='loot' ? { [factionGood(G.enemy && G.enemy.faction)]:ri(1,3) } : e.goods==='random' ? { [pick(Object.keys(BASE.goods).filter(id => goodsDef(id).kind==='trade'))]:ri(2,4) } : e.goods;
    for(const [id, n] of Object.entries(list)){ const got = addGoods(id, n); if(got) L.push(`+${got} ${goodsDef(id).name}`); else if(n > 0) L.push(`${goodsDef(id)?.name || id} left behind (hold full)`); } }
  if(e.seeds && typeof SEEDS!=='undefined'){ G.seeds = G.seeds || {}; const list = e.seeds==='random' ? { [pick(Object.keys(SEEDS))]:ri(2,3) } : e.seeds;
    for(const [k, n] of Object.entries(list)) if(SEEDS[k]){ G.seeds[k] = (G.seeds[k]||0) + n; L.push(`+${n} ${SEEDS[k].name} seeds`); } }
  if(e.hold){ G.holdBonus = (G.holdBonus||0) + e.hold; L.push(`+${e.hold} cargo hold space`); }
  if(typeof magsEffect==='function') magsEffect(e, L);
}
/* a Rebuff patrol finds contraband in your hold */
function contrabandCheck(){ if(!G || !G.bay) return null; const bad = Object.keys(G.bay).filter(id => goodsDef(id)?.illegal); if(!bad.length) return null;
  const n = bad.reduce((t, id) => t + goodsHave(id), 0); for(const id of bad) delete G.bay[id]; return `Rebuff inspectors find your illegal cargo (${n} crates) and confiscate the lot.`; }

/* ---------------- the store screen ---------------- */
function storeTabs(st){ return [['weapons','Weapons'],['drones','Drones'],['augments','Augments'],['systems','Systems'],['supplies','Supplies'],['crew','Crew'],['goods','Goods'], ...(st.bar ? [['bar','Bar']] : []), ['sell','Sell']]; }
function spend(cost, fn){ if(G.scrap < cost){ toast('Not enough scrap.'); return false; } G.scrap -= cost; G.spent = (G.spent||0) + cost; fn(); sfx('buy'); save(); return true; }
function earn(v){ G.scrap += v; G.stats.scrap = G.stats.scrap; G.earnedSelling = (G.earnedSelling||0) + v; if(G.earnedSelling >= 300) grant('market_mogul'); }
function drawMarket(m){
  const node = G.map.nodes[m.node], st = m.mags && G.magsShop ? G.magsShop : node.store, s = G.ship;
  if(!st.title) withSeed(`s${G.sector}n${m.node}market`, () => marketStock(st));   // a store from an older save
  const K = storeKind(st), k = st.keeper || { name:'The keeper', race:'human', mood:'cheerful' };
  const f = mframe(1440, 880, st.title, C.good);
  if(!m.greet) m.greet = st.mags ? pick(MAGS_LINES) : pick(STORE_GREETS[G.sectorType] || STORE_GREETS.civilian);
  ctx.font = `700 24px ${FD}`; const tx = f.x + 32 + Math.min(520, ctx.measureText(st.title.toUpperCase()).width + 70);
  T(`${k.name}, ${(DATA.races[k.race]||{}).name || ''} keeper (${k.mood}): "${String(m.greet).replace(/^"|"$/g, '')}"`, tx, f.y+44, { s:15, c:C.muted, max:f.x+f.w-260-tx });
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:26, f:FD, w:700, c:C.amber });
  const list = storeTabs(st); if(!list.some(t => t[0]===UI.storeTab)) UI.storeTab = 'weapons';
  const tw = Math.floor((f.w - 64 - (list.length-1)*8)/list.length);
  tabs(f.x+32, f.y+76, list, UI.storeTab, t => { UI.storeTab = t; UI.storePage = 0; UI.storeMsg = null; UI.confirmTrade = null; }, tw);
  const y0 = f.y+146, cx = f.x+32, W2 = f.w-64;
  const row = (i, name, sub, cost, onBuy, o={}) => { const y = y0 + i*94; panel(cx, y, W2, 84, 8);
    T(name, cx+20, y+34, { s:21, f:FD, w:700, c: o.soldTxt ? C.muted : C.ink, max:W2-360 }); para(sub, cx+20, y+60, W2-380, { s:14, lh:18, c:C.muted, max:1 });
    if(o.deal){ rr(cx+W2-430, y+24, 104, 34, 17); ctx.fillStyle = hexA(C.good,.2); ctx.fill(); T('DEAL −30%', cx+W2-378, y+47, { s:13, f:FD, w:700, a:'center', c:C.good }); }
    btn(cx+W2-300, y+16, 280, 52, o.soldTxt || `Buy · ${cost}`, onBuy, { disabled: !!o.soldTxt || o.disabled || G.scrap < cost, fill:!o.soldTxt && !o.disabled && G.scrap>=cost, col:C.good }); };
  switch(UI.storeTab){
    case 'weapons': {
      st.weapons.forEach((id, i) => { const d = DATA.weapons[id]; if(!d) return; const sold = st.sold.includes('w:'+id), c = Math.round(price(d.cost, st, 'weapon', id) * dealOff(st, 'w:'+id));
        row(i, d.name, `${d.type} · ${d.heal ? 'heals '+d.heal : d.type==='bomb' ? (d.sysDamage||0)+' system damage' : d.damage+' damage × '+(d.shots||1)} · ${d.power} power · ${d.charge}s${d.fire?' · fire':''}${d.breach?' · breach':''}${d.heal ? '' : ' · ' + vsShields(d)}${d.desc?' · '+d.desc:''}`, c,
          () => spend(c, () => { st.sold.push('w:'+id); toast(giveWeapon(id)); }), { soldTxt:sold ? 'Sold' : null, deal:st.deal==='w:'+id }); });
      const adv = storeAdvice(); para(adv[0], cx, y0 + st.weapons.length*94 + 18, W2, { s:16, lh:22, c:adv[1], max:2 }); break; }
    case 'drones':
      if(!s.systems.drones) T('Your ship has no Drone system yet. Install one from the Systems tab to use these.', cx, y0 + st.drones.length*94 + 30, { s:17, c:C.warn });
      st.drones.forEach((id, i) => { const d = DATA.drones[id]; if(!d) return; const sold = st.sold.includes('d:'+id), c = Math.round(price(d.cost, st, 'drone', id) * dealOff(st, 'd:'+id));
        row(i, d.name, `${d.kind} drone · ${d.power} power${d.desc?' · '+d.desc:''}`, c, () => spend(c, () => { st.sold.push('d:'+id); toast(giveDrone(id)); }), { soldTxt:sold ? 'Sold' : null, deal:st.deal==='d:'+id }); }); break;
    case 'augments':
      st.augments.forEach((id, i) => { const a = DATA.augments[id]; if(!a) return; const sold = st.sold.includes('a:'+id) || s.augments.includes(id), c = Math.round(price(a.cost, st, 'aug', id) * dealOff(st, 'a:'+id));
        row(i, a.name, a.desc||'', c, () => { if(s.augments.length>=R.augmentSlots){ toast('All augment slots are full. Sell one first.'); return; } spend(c, () => { st.sold.push('a:'+id); toast(giveAugment(id)); }); }, { soldTxt:sold ? 'Owned' : null, deal:st.deal==='a:'+id }); });
      T(`Augment slots: ${s.augments.length}/${R.augmentSlots}`, cx, y0 + st.augments.length*94 + 30, { s:16, c:C.muted }); break;
    case 'systems':
      st.systems.forEach((k2, i) => { const have = !!s.systems[k2], c = price(INSTALL[k2]||60, st, 'system'), clash = (k2==='clonebay' && s.systems.medbay) || (k2==='medbay' && s.systems.clonebay);
        row(i, `${SYSN[k2]} system`, clash ? 'You can only have a Medbay or a Clone Bay, not both.' : sysDesc(k2), c, () => spend(c, () => { installSystem(s, k2); toast(`${SYSN[k2]} installed.`); }), { soldTxt:have ? 'Installed' : clash ? 'Unavailable' : null }); });
      if(!st.systems.length) T('No new systems for sale here.', cx, y0+40, { s:18, c:C.muted }); break;
    case 'supplies': drawStoreSupplies(st, cx, y0, W2); break;
    case 'crew': drawStoreCrew(st, m, cx, y0, W2); break;
    case 'goods': drawStoreGoods(st, cx, y0, W2); break;
    case 'bar': drawStoreBar(st, cx, y0, W2); break;
    case 'sell': drawStoreSell(st, cx, y0, W2, f); break;
  }
  // the counter: haggling, a mystery crate, your guild card, and whatever just happened
  const by = f.y+f.h-80, msg = UI.storeMsg || st.haggleText;
  if(msg){ rr(cx, by-62, W2, 50, 8); ctx.fillStyle = 'rgba(6,9,18,.85)'; ctx.fill(); para(msg, cx+16, by-31, W2-32, { s:16, lh:20, c:C.cyan, max:2 }); }
  if(!st.haggled) btn(cx, by, 230, 56, `Haggle (${Math.round(haggleOdds(st)*100)}%)`, () => { haggle(st); UI.storeMsg = null; save(); }, { s:17, col:C.warn });
  else T(st.haggled==='won' ? 'Haggled: 15% off' : 'Haggled: +10% prices', cx+10, by+36, { s:16, c: st.haggled==='won' ? C.good : C.hostile });
  btn(cx+246, by, 270, 56, `Mystery crate · ${crateCost()}`, () => { if((st.crate||0) >= 2){ toast('Sold out of crates.'); return; } openCrate(st); }, { s:17, col:C.violet, disabled:(st.crate||0) >= 2 || G.scrap < crateCost() });
  tip(cx+246, by, 270, 56, 'Mystery crate', 'Could be a weapon, a drone, an augment, goods, seeds, supplies... or four hundred rubber ducks. Two per store.');
  const lt = loyaltyTier(), nx = nextLoyalty(); T(`Guild card: ${lt[2]}${lt[1] ? ` (${Math.round(lt[1]*100)}% off)` : ''}`, cx+540, by+24, { s:16, f:FD, w:700, c:C.amber });
  T(nx ? `Spend ${nx[0] - (G.spent||0)} more for ${nx[2]} (${Math.round(nx[1]*100)}% off)` : 'Top tier. The guild loves you.', cx+540, by+48, { s:14, c:C.muted });
  tip(cx+540, by, 360, 56, 'Merchant guild card', 'Every scrap you spend at stores counts. Bronze at 150 (5% off), Silver at 400 (8%), Gold at 800 (12%), at every store for the rest of the run.');
  btn(f.x+f.w-232, by, 200, 56, 'Leave', () => { G.modal = null; UI.storeMsg = null; save(); });
}
function drawStoreSupplies(st, cx, y0, W2){
  const s = G.ship, rep = 2 + Math.floor((G.sector-1)/3), miss = s.crew.filter(c => c.owner==='p' && !c.drone).reduce((t, c) => t + Math.max(0, c.maxHp - c.hp), 0);
  const rows = [ ['Fuel cell', `One jump's worth. You have ${G.fuel}.`, price(3, st, 'fuel'), () => G.fuel++], ['Missile', `Ammo for missiles and bombs. You have ${G.missiles}.`, price(6, st, 'missile'), () => G.missiles++],
    ['Drone part', `For drones and hacking. You have ${G.parts}.`, price(8, st, 'part'), () => G.parts++],
    ['Hull repair ×1', `Hull ${s.hull}/${s.maxHull}`, price(rep, st, 'repair'), () => { s.hull = Math.min(s.maxHull, s.hull+1); }, s.hull>=s.maxHull],
    ['Hull repair ×5', `Hull ${s.hull}/${s.maxHull}`, price(5*rep - 1, st, 'repair'), () => { s.hull = Math.min(s.maxHull, s.hull+5); }, s.hull>=s.maxHull],
    ['Medical care', miss ? `Heal every crew member fully (${Math.round(miss)} health missing).` : 'Your crew are all healthy.', price(Math.max(3, Math.ceil(miss/14)), st, 'supply'), () => { for(const c of s.crew) if(c.owner==='p') c.hp = c.maxHp; }, miss < 1],
    ['Cargo racks (+4 hold)', `Hold ${holdUsed()}/${holdCap()}. Up to 16 extra space.`, price(25, st, 'supply'), () => { G.holdBonus = (G.holdBonus||0) + 4; }, (G.holdBonus||0) >= 16],
    ['Hydroponic planter', `Grow crops as you fly. You have ${garden().plots.length} of ${PLANTER_MAX}.`, price(PLANTER_COST, st, 'supply'), () => { garden().plots.push(null); }, garden().plots.length >= PLANTER_MAX] ];
  rows.forEach((r, i) => { const col = i < 5 ? 0 : 1, j = i < 5 ? i : i - 5, x = cx + col*(W2/2 + 10), w = W2/2 - 10, y = y0 + j*86;
    panel(x, y, w, 76, 8); T(r[0], x+20, y+32, { s:19, f:FD, w:700, max:w-260 }); T(r[1], x+20, y+56, { s:13, c:C.muted, max:w-260 });
    btn(x+w-220, y+12, 200, 52, `Buy · ${r[2]}`, () => spend(r[2], r[3]), { disabled: r[4] || G.scrap < r[2], col:C.good }); });
}
function drawStoreCrew(st, m, cx, y0, W2){
  const s = G.ship, mine = s.crew.filter(c => c.owner==='p' && !c.drone), half = W2/2 - 10, full = mine.length >= R.maxCrew, cands = storeCandidates(st, m.node);
  label('Looking for work', cx, y0+10, C.muted, 'left', 14);
  cands.forEach((cand, i) => { const y = y0 + 22 + i*250, race = DATA.races[cand.race] || {}, tr = cand.trait && DATA.traits?.[cand.trait], qd = typeof quirkDef==='function' ? quirkDef(cand.quirk) : null, hired = (st.hired||[]).includes(cand.id);
    panel(cx, y, half, 238, 8); ensureLook(cand); drawPortrait(cx+56, y+64, 38, cand, false);
    T(cand.name, cx+112, y+44, { s:24, f:FD, w:700, max:half-130 }); T(`${race.name || cand.race} · ${pronouns(cand)}${tr ? ' · ' + tr.name : ''}`, cx+112, y+70, { s:15, c:race.color||C.ink, max:half-130 });
    if(qd){ T(qd.name, cx+112, y+96, { s:16, f:FD, w:700, c:C.amber }); para(`${qd.desc} ${QUIRK_PERK_TEXT[cand.quirk] || ''}`, cx+20, y+124, half-40, { s:14, lh:18, c:C.muted, max:3 }); }
    const hp = hirePrice(cand, st);
    if(hired) T('Hired', cx+20, y+214, { s:18, c:C.good });
    else if(!full) btn(cx+20, y+178, 240, 50, `Hire · ${hp}`, () => spend(hp, () => { joinCrew(cand); (st.hired = st.hired || []).push(cand.id); toast(`${cand.name} joins the crew.`); }), { disabled:G.scrap < hp, fill:G.scrap >= hp, col:C.good });
    else { const low = Math.min(...mine.map(c => crewSellPrice(c, st))), sc = Math.max(0, hp - low), node = m.node;
      btn(cx+20, y+178, 280, 50, `Swap someone · ${sc}`, () => openSwap(cand, sc, ok => { if(ok) (st.hired = st.hired || []).push(cand.id); G.modal = { type:'store', node }; UI.storeTab = 'crew'; }), { disabled:G.scrap < sc, fill:G.scrap >= sc, col:C.good });
      T('Bunks full: the store takes one of yours in part exchange.', cx+310, y+208, { s:12, c:C.warn, max:half-320 }); }
    T(`Worth about ${crewWorth(cand)}`, cx+half-20, y+44, { s:14, a:'right', c:C.muted }); });
  // selling crew: it pays, and it costs you
  const qx = cx + half + 20; label('Sell a crew member', qx, y0+10, C.muted, 'left', 14);
  T(storeKind(st).fighters ? 'Mantlis arms pay extra for fighters.' : storeKind(st).pays?.crew > 1 ? 'No questions asked here. Good prices.' : 'Trained, healthy veterans fetch the most.', qx+half, y0+10, { s:13, a:'right', c:C.cyan });
  mine.slice(0, 8).forEach((c, k2) => { const y = y0 + 22 + k2*64, v = crewSellPrice(c, st), conf = UI.confirmTrade===c.id, b = typeof bondOf==='function' ? bondOf(c) : null;
    panel(qx, y, half, 56, 8); drawPortrait(qx+28, y+28, 19, c, false);
    T(c.name, qx+56, y+24, { s:17, f:FD, w:700, max:150 }); T(`${DATA.races[c.race]?.name||c.race}${c.vet ? ' · veteran' : ''} · ${Math.ceil(c.hp)}/${c.maxHp} hp${typeof heartsOf==='function' && heartsOf(c) ? ' · ' + '♥'.repeat(heartsOf(c)) : ''}${b ? ' · ' + b.kind.replace(/s$/,'') + ' of ' + b.other.name : ''}`, qx+56, y+44, { s:12, c:C.muted, max:half-260 });
    btn(qx+half-196, y+9, 182, 38, conf ? 'Really sell?' : `Sell · ${v}`, () => { if(mine.length<=1){ toast('You need at least one crew member.'); return; } if(!conf){ UI.confirmTrade = c.id; UI.storeMsg = b ? `${b.other.name} will not take this well.` : `${c.name}'s friends aboard will remember this.`; return; } UI.confirmTrade = null; UI.storeMsg = null; sellCrew(c, st); }, { s:14, col:C.hostile, fill:conf, disabled:mine.length<=1 }); });
}
function drawStoreGoods(st, cx, y0, W2){
  const half = W2/2 - 10; label('Trade goods', cx, y0+10, C.muted, 'left', 14); T(`Hold ${holdUsed()}/${holdCap()}`, cx+half, y0+10, { s:15, a:'right', c: holdUsed() >= holdCap() ? C.hostile : C.amber });
  let y = y0 + 22;
  for(const it of st.goods){ const g = goodsDef(it.id); if(!g) continue; const p = goodsPrice(it.id, st, false), cheap = g.from.includes(st.kind);
    panel(cx, y, half, 70, 8); T(`${g.name}${cheap ? ' · local' : ''}${g.illegal ? ' · illegal' : ''}`, cx+18, y+28, { s:18, f:FD, w:700, c: g.illegal ? C.hostile : C.ink, max:half-250 });
    T(`${it.n} in stock · sells best in ${g.want.slice(0,2).map(w => (STORE_KINDS[w]||{}).title || w).join(', ') || 'collectors\' hands'}`, cx+18, y+52, { s:12, c:C.muted, max:half-250 });
    tip(cx, y, half-230, 70, g.name, g.desc + (g.illegal ? ' Illegal: Rebuff patrols may confiscate it.' : ''));
    btn(cx+half-220, y+12, 200, 46, it.n ? `Buy 1 · ${p}` : 'Sold out', () => { if(holdUsed() >= holdCap()){ toast('Your hold is full.'); return; } spend(p, () => { addGoods(it.id, 1); it.n--; }); }, { s:15, disabled:!it.n || G.scrap < p, col:C.good });
    y += 78; }
  // seeds for the garden
  const qx = cx + half + 20; label('Seeds and the garden', qx, y0+10, C.muted, 'left', 14); T(`Planters ${garden().plots.length}/${PLANTER_MAX}`, qx+half, y0+10, { s:15, a:'right', c:C.amber });
  let sy = y0 + 22;
  for(const k2 of st.seeds || []){ const sd = SEEDS[k2]; if(!sd) continue; const p = price(sd.cost, st, 'goods'), g = goodsDef(sd.crop);
    panel(qx, sy, half, 70, 8); T(`${sd.name} seeds`, qx+18, sy+28, { s:18, f:FD, w:700, max:half-250 }); T(`Ready in ${sd.grow} jumps · ${sd.yield[0]}-${sd.yield[1]} per harvest · worth ~${g.base} each`, qx+18, sy+52, { s:12, c:C.muted, max:half-250 });
    tip(qx, sy, half-230, 70, `${sd.name} seeds`, `${g.desc}${sd.nebula ? ' Grows faster in a nebula.' : ''} Every crop grows faster under a sun.`);
    btn(qx+half-220, sy+12, 200, 46, `Buy 2 · ${p*2}`, () => spend(p*2, () => { G.seeds = G.seeds || {}; G.seeds[k2] = (G.seeds[k2]||0) + 2; toast(`+2 ${sd.name} seeds. Plant them from Ship → Garden.`); }), { s:15, disabled:G.scrap < p*2, col:C.good });
    sy += 78; }
  const wants = Object.keys(BASE.goods).filter(id => goodsDef(id).want.includes(st.kind)).map(id => goodsDef(id).name);
  para(st.mags ? 'Mags buys relics and curios for far more than anyone else.' : `${storeKind(st).title} pays well for: ${wants.length ? wants.slice(0, 6).join(', ') : 'nothing in particular'}.`, qx, sy + 14, half, { s:15, lh:20, c:C.cyan, max:2 });
  drawRequestBoard(st, qx, sy + 70, half);
}
function drawStoreBar(st, cx, y0, W2){
  st.barName = st.barName || pick(BAR_NAMES);
  st.barSub = st.barSub || pick(['Low lights, loud music, sticky floors.', 'A bar at the edge of everything.', 'The drinks are cheap. The company is cheaper.', 'Nobody here asks questions. Everybody here tells stories.']);
  T(st.barName, cx, y0+30, { s:28, f:FD, w:700, c:C.amber }); T(st.barSub, cx, y0+58, { s:15, c:C.muted });
  const acts = [
    ['round', `Buy a round for the crew · ${barRound(st)}`, 'Heals the crew a little, and they like you more for it. Nights out have a way of carrying on into the morning.', barRound(st), (st.barDone||0) >= 2],
    ['night', 'Shore leave: a proper night out · 22', 'The whole crew off the leash until dawn. Full health, a lot more love for the captain, a bit of learning, and almost certainly a story.', 22, st.nightOut],
    ['rumour', 'Buy a drink for a navigator · 5', 'Spacers talk. A few drinks buys you a map of every beacon in this sector.', 5, st.rumour],
    ['cards', 'Sit in on a card game · 15', `Win 40 scrap, or lose your stake. ${G.ship.crew.some(c => c.owner==='p' && c.quirk==='gambler') ? 'Your gambler improves the odds.' : 'A gambler aboard would help.'}`, 15, st.cards] ];
  acts.forEach(([id, name, sub, c, done], i) => { const y = y0 + 84 + i*104; panel(cx, y, W2, 92, 8); T(name, cx+20, y+36, { s:20, f:FD, w:700, max:W2-340 }); para(sub, cx+20, y+64, W2-360, { s:14, lh:18, c:C.muted, max:2 });
    btn(cx+W2-300, y+20, 280, 52, done ? 'Done' : 'Do it', () => barAct(st, id), { disabled:done || G.scrap < c, fill:!done && G.scrap >= c, col:C.violet }); });
}
function drawStoreSell(st, cx, y0, W2, f){
  const L = sellables(st), per = 12, pages = Math.max(1, Math.ceil(L.length/per)), pg = clamp(UI.storePage||0, 0, pages-1), half = W2/2 - 10;
  if(!L.length){ para('Nothing to sell. Move weapons or drones to cargo from the Ship screen, or fill your hold with goods.', cx, y0+30, W2, { s:17, lh:24, c:C.muted }); return; }
  L.slice(pg*per, pg*per + per).forEach((it, i) => { const x = cx + (i%2)*(half+20), y = y0 + 8 + Math.floor(i/2)*84;
    panel(x, y, half, 74, 8); T(it.name, x+18, y+30, { s:18, f:FD, w:700, c: it.hot ? C.good : C.ink, max:half-(it.more ? 380 : 250) }); T(it.sub, x+18, y+54, { s:13, c: it.hot ? C.good : C.muted, max:half-(it.more ? 380 : 250) });
    if(it.more) btn(x+half-366, y+14, 130, 46, `All · ${it.v * (goodsHave(it.key.slice(2)) || 1)}`, () => { const n = it.more(); earn(it.v*n); sfx('buy'); save(); }, { s:14, col:C.amber });
    btn(x+half-226, y+14, 210, 46, it.key.startsWith('o:') ? `Deliver · ${it.v}` : `Sell · ${it.v}`, () => { if(it.sell()==='order') return; earn(it.v); sfx('buy'); save(); }, { s:16, col: it.key.startsWith('o:') ? C.violet : C.amber, fill:it.key.startsWith('o:') }); });
  // one tap: sell every good that is in demand here
  const hot = L.filter(it => it.hot && it.key.startsWith('g:')); if(hot.length > 1){ const tot = hot.reduce((t, it) => t + it.v*goodsHave(it.key.slice(2)), 0);
    btn(cx+W2-330, y0 + 8 + 6*84, 330, 44, `Sell everything in demand · ${tot}`, () => { let v = 0; for(const it of hot){ const n = goodsHave(it.key.slice(2)); takeGoods(it.key.slice(2), n); v += it.v*n; } earn(v); sfx('buy'); save(); }, { s:15, col:C.good, fill:true }); }
  if(pages > 1){ const py = y0 + 8 + 6*84; btn(cx, py, 70, 44, '‹', () => { UI.storePage = pg-1; }, { disabled:pg<=0 }); T(`${pg+1} / ${pages}`, cx+110, py+30, { s:16, a:'center', c:C.muted }); btn(cx+150, py, 70, 44, '›', () => { UI.storePage = pg+1; }, { disabled:pg>=pages-1 }); }
}

/* =========================================================================
   Requests, the travelling merchant, crew wishes
   ========================================================================= */
/* ---------------- request boards: deliver goods for good money ---------------- */
function makeRequest(st){
  const ids = Object.keys(BASE.goods).filter(id => { const g = goodsDef(id); return g && !g.illegal && g.kind!=='curio' && !g.from.includes(st.kind) && (g.kind!=='meal' || G.sector >= 2); });
  if(!ids.length) return null; const id = pick(ids), g = goodsDef(id), n = g.base >= 20 ? ri(1, 2) : ri(2, 4);
  return { id, n, pay:Math.round(g.base * n * 1.9 + 10 + G.sector*3), by:Math.min(R.sectors, G.sector + 1), from:st.title, taken:false };
}
function orders(){ G.orders = (G.orders || []).filter(o => { if(o.by < G.sector){ toast(`The order for ${o.n} ${goodsDef(o.id)?.name.toLowerCase()} has expired.`); return false; } return true; }); return G.orders; }
function deliver(o){ if(goodsHave(o.id) < o.n) return false; takeGoods(o.id, o.n); G.orders = (G.orders||[]).filter(x => x!==o); earn(o.pay); G.spent = (G.spent||0) + Math.round(o.pay/2);   // the guild counts deliveries too
  G.delivered = (G.delivered||0) + 1; if(G.delivered >= 3) grant('market_courier'); sfx('buy'); toast(`Delivered ${o.n} ${goodsDef(o.id).name.toLowerCase()}: +${o.pay} scrap.`);
  if(o.mags && G.mags){ G.mags.hearts = (G.mags.hearts||0) + 2; G.mags.done = (G.mags.done||0) + 1; }
  if(typeof sagaNote==='function' && G.delivered===1) sagaNote('trade', `In sector ${G.sector} the crew filled their first delivery order: ${o.n} ${goodsDef(o.id).name.toLowerCase()} for ${o.pay} scrap.`);
  save(); return true; }
function drawRequestBoard(st, x, y, w){
  if(st.request===undefined) st.request = withSeed(`s${G.sector}n${G.map.cur}req`, () => makeRequest(st));
  const o = st.request; panel(x, y, w, 120, 8); label('Request board', x+18, y+28, C.violet, 'left', 13);
  if(!o){ T('Nothing wanted today.', x+18, y+64, { s:16, c:C.muted }); return; }
  const g = goodsDef(o.id), have = goodsHave(o.id);
  T(`Wanted: ${o.n} × ${g.name}`, x+18, y+60, { s:19, f:FD, w:700, max:w-250 }); T(`Pays ${o.pay} scrap · deliver to any store by the end of sector ${o.by} · you have ${have}`, x+18, y+86, { s:12, c:C.muted, max:w-250 });
  tip(x, y, w-230, 120, `${g.name} wanted`, `${g.desc} You can grow, catch, cook or buy it elsewhere, then deliver it at any store (the Sell tab) before you leave sector ${o.by}.`);
  if(o.taken) T('Accepted', x+w-120, y+64, { s:16, a:'center', c:C.good });
  else if(have >= o.n) btn(x+w-220, y+36, 200, 50, `Deliver now · ${o.pay}`, () => { o.taken = true; G.orders = G.orders || []; const ord = Object.assign({}, o); G.orders.push(ord); deliver(ord); }, { s:15, fill:true, col:C.violet });
  else btn(x+w-220, y+36, 200, 50, (orders().length >= 4) ? 'Too many orders' : 'Accept', () => { o.taken = true; (G.orders = G.orders || []).push(Object.assign({}, o)); toast('Order accepted. Deliver it at any store.'); save(); }, { s:15, col:C.violet, disabled:orders().length >= 4 });
}

/* ---------------- Mags Vetch, travelling merchant ----------------
   She turns up a few times a run with her caravan: odd stock, rare seeds, and a buyer for relics. Each visit she likes you a
   little more; fill her orders and she likes you a lot more. */
const MAGS_LINES = ['"Back again! I knew you\'d survive. I bet on it, in fact."', '"My favourite customer. Don\'t tell the others."', '"Look what the solar wind blew in."', '"You look terrible, love. Buy something, it\'ll cheer you up."'];
function magsStore(){
  const st = { arena:false, kind:'civilian', title:"Mags Vetch's caravan", keeper:{ name:'Mags Vetch', race:'human', mood:'cheerful' }, mags:true, sold:[], hired:[], crate:0, haggled:G.mags && G.mags.hearts >= 4 ? 'won' : null,
    weapons:[], drones:[], augments:[], systems:[], crewRaces:[], cands:[], wob:{}, bar:false, moodMult:.95 };
  const wp = Object.values(DATA.weapons).filter(w => !w.noLoot && (w.tier||1) >= 2).map(w => w.id); shuffle(wp); st.weapons = wp.slice(0, 2);
  const ap = Object.keys(DATA.augments).filter(k => !G.ship.augments.includes(k)); shuffle(ap); st.augments = ap.slice(0, 2);
  for(const id of [...st.weapons, ...st.augments]) st.wob[id] = .9;
  st.goods = shuffle(Object.keys(BASE.goods).filter(id => ['trade','curio'].includes(goodsDef(id).kind) && !goodsDef(id).illegal)).slice(0, 4).map(id => ({ id, n:ri(1, 3) }));
  st.seeds = ['glass_lily', 'moon_melon', 'nebula_bloom']; st.deal = st.weapons[0] ? 'w:' + st.weapons[0] : null;
  st.request = makeRequest(st); if(st.request){ st.request.pay = Math.round(st.request.pay * 1.4); st.request.mags = true; st.request.by = Math.min(R.sectors, G.sector + 2); }
  return st;
}
function sellMagsBonus(st, kind){ return st && st.mags && kind==='curio' ? 1.6 : 1; }   // Mags collects old things

/* ---------------- crew wishes ---------------- */
const WISH_LINES = ['I\'d give anything for some {good} right now.', 'Is it weird that I dream about {good}?', 'If anyone finds {good}, I\'m just saying, I wouldn\'t say no.', 'Captain. Captain. {good}. Think about it.'];
function wishJump(){
  if(!G || !G.ship || typeof GIFT_LOVES==='undefined') return; const crew = G.ship.crew.filter(c => c.owner==='p' && !c.drone);
  for(const c of crew) if(c.wish && G.stats.jumps - (c.wishJ||0) > 12){ c.wish = null; }
  if(Math.random() < .08){ const c = pick(crew.filter(c => !c.wish)); if(!c) return; const loves = [...(GIFT_LOVES[c.quirk]||[]), ...(RACE_LOVES[c.race]||[])].filter(id => goodsDef(id)); if(!loves.length) return;
    c.wish = pick(loves); c.wishJ = G.stats.jumps; (c.knownLoves = c.knownLoves || []).includes(c.wish) || c.knownLoves.push(c.wish);
    G.chat = (G.chat||[]).filter(x => x.t>0).slice(-2); G.chat.push({ text:pick(WISH_LINES).replace('{good}', goodsDef(c.wish).name.toLowerCase()), id:c.id, t:3.4 }); }
}
ACHIEVEMENTS.push({ id:'market_courier', name:'Special Delivery', desc:'Fill three delivery orders in one run.' }, { id:'market_mags', name:'Mags\'s Favourite', desc:'Become Mags Vetch\'s favourite customer.' });
function magsEffect(e, L){
  if(e.magsMeet){ G.mags = G.mags || { met:0, hearts:0 }; G.mags.met++; G.mags.hearts += e.magsMeet;
    if(G.mags.met < 5 && !G.later.some(l => l.event==='m_mags_again')) G.later.push({ event:'m_mags_again', jumps:ri(5, 8) });
    if(G.mags.hearts >= 6 && !G.mags.gifted && !G.later.some(l => l.event==='m_mags_gift')) G.later.push({ event:'m_mags_gift', jumps:ri(2, 4) });
    if(G.mags.met===1 && typeof sagaNote==='function') sagaNote('mags', `In sector ${G.sector} the crew met Mags Vetch, a travelling merchant with a ship full of bells and opinions.`); }
  if(e.magsStall){ G.magsShop = magsStore(); G.openMags = true; }
  if(e.magsGift && G.mags){ G.mags.gifted = true; garden().plots.length < PLANTER_MAX && garden().plots.push(null); G.seeds = G.seeds || {}; G.seeds.glass_lily = (G.seeds.glass_lily||0) + 2; L.push('+1 hydroponic planter', '+2 Glass lily seeds'); L.push(giveAugment('random'));
    grant('market_mags'); if(typeof sagaNote==='function') sagaNote('mags', `Mags Vetch called the captain her favourite customer, and meant it. She gave them her late husband's lucky charm.`); }
}
Object.assign(BASE.events, {
  m_mags_meet:{ moment:true, star:'any', minSector:2, weight:1.4, art:'market', text:'A battered caravan ship covered in bells and bunting pulls alongside. On screen, a small grey-haired woman in welding goggles. "Mags Vetch, purveyor of fine and questionable goods. I\'ve got rare seeds, old relics, and I pay better than anyone for curios. Fancy a browse, love?"', choices:[
    { text:'Browse her wares.', effect:{ text:'The airlock opens onto a cloud of incense and a lot of shelves.', magsMeet:1, magsStall:true } },
    { text:'Invite her aboard for a cup of tea.', effect:{ text:'Mags drinks four cups, tells you three stories about her late husband and one about a pyrate king she "definitely did not marry", and draws you a map on a napkin before she goes.', magsMeet:2, reveal:true, crewHeal:10 } },
    { text:'"Not today, thanks."', effect:{ text:'"Suit yourself. I\'ll find you again. I always do." The bells jingle as she goes.', magsMeet:0 } } ] },
  m_mags_again:{ moment:true, questOnly:true, once:false, star:'any', art:'market', text:'Bells on the comms: Mags Vetch\'s caravan is back. {magsline}', choices:[
    { text:'Browse her wares.', effect:{ text:'She has new stock, and as always, she remembers what you like.', magsMeet:1, magsStall:true } },
    { text:'Tell her about the voyage.', effect:{ text:'She listens to all of it, laughs at the right bits, and goes quiet at the sad ones. She leaves a tin of biscuits for the crew.', magsMeet:2, crewHeal:15 } } ] },
  m_mags_gift:{ moment:true, questOnly:true, star:'any', art:'market', text:'Mags Vetch\'s caravan, again, but she does not open her shop. She comes aboard with a box. "You lot are my favourite customers. Don\'t tell the others. This was my husband\'s lucky charm, and these are the best seeds I\'ve got. Go and win, alright?"', choices:[
    { text:'Hug her.', effect:{ text:'She pretends to hate it. She does not hate it.', magsGift:true, crewHeal:20 } } ] }
});
