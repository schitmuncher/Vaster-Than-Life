'use strict';
/* =========================================================================
   Procedural encounters: events built on the spot from parts, so beacons
   aren't only hand-written scenes.
   An encounter = who (16 kinds of people and ships, with generated names)
   + what's wrong (12 kinds of trouble) + choices built from what you have
   (fuel, parts, scrap, systems, crew races and personalities, cargo)
   + outcomes drawn from pools, scaled to the sector, sometimes with a twist
   (a trap, a bonus), and sometimes with consequences: a thank-you or a
   grudge a few jumps later, or a short quest to a beacon on the map.
   Settings → Gameplay → Story variety: Hand-made, Mixed (default) or Wild.
   The run's seed drives it; dailies and seed duels always use Mixed, so
   they stay fair, and multiplayer uses hand-made scenes only.
   ========================================================================= */
const PG_ADJ = ['Wandering', 'Stubborn', 'Lucky', 'Patient', 'Rusty', 'Last', 'Brave', 'Quiet', 'Crooked', 'Golden', 'Hungry', 'Little', 'Second', 'Midnight', 'Honest', 'Leaky', 'Proud', 'Restless', 'Silver', 'Sleepy'];
const PG_NOUN = ['Ledger', 'Heron', 'Promise', 'Kettle', 'Lantern', 'Comet', 'Thimble', 'Mule', 'Anchor', 'Duchess', 'Biscuit', 'Compass', 'Harvest', 'Orchid', 'Bargain', 'Pilgrim', 'Wren', 'Teapot', 'Banner', 'Errand'];
function pgShip(){ return `the ${pick(PG_ADJ)} ${pick(PG_NOUN)}`; }
const PG_ACTORS = [
  { k:'freighter', art:'ship', fac:() => pick(['sloog', 'pebblekin', 'enjinn']), who:n => `a battered freighter, ${n}`, them:'the freighter crew' },
  { k:'refugees', art:'distress', fac:() => 'voltan', who:() => 'a refugee convoy, three ships tied together with cable', them:'the refugees' },
  { k:'miners', art:'asteroid', fac:() => 'pebblekin', who:n => `a Pebblekin mining crew aboard ${n}`, them:'the miners' },
  { k:'pilgrims', art:'ship', fac:() => 'voltan', who:n => `Voltan pilgrims aboard ${n}`, them:'the pilgrims' },
  { k:'lab', art:'station', fac:() => 'enjinn', who:() => 'a small research station, lights flickering', them:'the researchers' },
  { k:'smugglers', art:'ship', fac:() => 'pyrate', who:n => `smugglers in ${n}, pretending to be a fishing boat`, them:'the smugglers' },
  { k:'probe', art:'space', fac:() => 'enjinn', who:() => 'an old Enjinn survey probe with a very anxious voice', them:'the probe' },
  { k:'hospital', art:'station', fac:() => 'voltan', who:n => `a hospital frigate, ${n}`, them:'the medics' },
  { k:'colony', art:'planet', fac:() => pick(['pebblekin', 'sloog']), who:() => 'a frontier colony on a grey little moon', them:'the colonists' },
  { k:'yacht', art:'ship', fac:() => 'sloog', who:n => `a Sloog racing yacht, ${n}, far off course`, them:'the yacht\'s owner' },
  { k:'duellists', art:'ship', fac:() => 'mantlis', who:n => `a Mantlis duelling school aboard ${n}`, them:'the duellists' },
  { k:'scrappers', art:'wreck', fac:() => 'pebblekin', who:n => `scrappers cutting up a wreck from ${n}`, them:'the scrappers' },
  { k:'circus', art:'ship', fac:() => 'sloog', who:n => `a travelling circus, ${n}, painted every colour there is`, them:'the performers' },
  { k:'deserters', art:'ship', fac:() => 'pyrate', who:n => `Rebuff deserters in a stolen cutter, ${n}`, them:'the deserters' },
  { k:'monks', art:'station', fac:() => 'voltan', who:() => 'a monastery built into a hollow asteroid', them:'the monks' },
  { k:'hunter', art:'ship', fac:() => 'pyrate', who:n => `a bounty hunter in ${n}, guns cold for once`, them:'the hunter' } ];
const PG_OPEN = ['Your sensors pick up', 'You drop out of the jump beside', 'A weak hail comes in from', 'Drifting by the beacon is', 'Somebody is waiting at this beacon:', 'The long-range scanner wakes everyone up:'];
const PG_COLOUR = ['Everyone over there looks exhausted.', 'Their captain is trying very hard to sound calm.', 'Someone is singing badly on an open channel.', 'They keep apologising for the mess.', 'A child waves at your ship from a porthole.', 'Their comms officer is eating soup throughout.', 'They clearly haven\'t slept.', 'They seem very glad to see anyone at all.'];
/* troubles: text, and the choices they offer (each returns [choice, ...]) */
const PG_TROUBLE = {
  drive:   { t:'Their drive is dead, and they\'ve been drifting for days.', c:(A) => [ pgHelp(A, 'Give them fuel (2).', { fuel:2 }, 'You pump fuel across. Their engines cough, then catch.'),
             pgSkill(A, 'Have {who} fix the drive.', { race:'enjinn' }, '{who} spends an hour inside their drive and comes out humming. It works better than new.'),
             pgSkill(A, 'Talk them through the repair (engines 2+).', { system:'engines', level:2 }, 'Your engineers walk them through it over comms. Slowly. Twice.') ] },
  raiders: { t:'Pyrate raiders are circling them, closing in.', c:(A) => [ pgFight(A, 'Drive the raiders off.', 'Weapons hot. The raiders turn to face you.', 'pyrate'), pgRisk(A, 'Fire a warning shot (1 missile).', { missiles:1 }, .6, 'The raiders decide this isn\'t worth it and leave.', 'The raiders don\'t scare. They come for you instead.', 'pyrate') ] },
  plague:  { t:'A fever is spreading through the ship.', c:(A) => [ pgSkill(A, 'Send your medics (medbay 2+).', { system:'medbay', level:2 }, 'Your medbay crew work through the night. The fever breaks.'),
             pgHelp(A, 'Share a hot meal.', { goodsKind:'meal' }, 'Soup does more than anyone expected.'), pgRisk(A, 'Go over and help, masks on.', null, .55, 'Nobody catches it. Everyone over there is grateful.', 'You help, but {crew} comes back with the fever.', null, { crewHurt:25 }) ] },
  breach:  { t:'Their hull is holed and the air is going.', c:(A) => [ pgHelp(A, 'Send patching kits (2 drone parts).', { parts:2 }, 'The patches hold. They can breathe again.'),
             pgSkill(A, 'Let {who} weld it shut.', { race:'pebblekin' }, '{who} walks across the hull and welds the breach with their bare hands.'), pgSkill(A, 'Let {who} feel out where the air is going.', { race:'sloog' }, '{who} closes their eyes, points at a wall panel, and is right. The breach is sealed in minutes.') ] },
  lost:    { t:'One of their crew was knocked out of an airlock, and they can\'t find her.', c:(A) => [ pgSkill(A, 'Sweep with your sensors (sensors 2+).', { system:'sensors', level:2 }, 'There she is, spinning slowly, furious and alive.'),
             pgSkill(A, 'Teleport her aboard.', { system:'teleporter' }, 'One flash, and a very cold woman is standing in your teleporter, swearing.'), pgRisk(A, 'Send someone out on a tether.', null, .5, 'Your crew reel her in.', 'Your crew get tangled and bruised. She drifts off; they find her later.', null, { crewHurt:15 }) ] },
  debt:    { t:'They owe money to some very dangerous people, and the people are on their way.', c:(A) => [ pgHelp(A, 'Pay off the debt (30 scrap).', { scrap:30 }, 'They weep. Actually weep. They swear they\'ll pay you back.', true),
             pgSkill(A, 'Let {who} win it back at cards.', { quirk:'gambler' }, '{who} plays the collectors at cards and wins the whole debt, plus their hats.') ] },
  rogue:   { t:'Their ship\'s computer has decided it\'s in charge.', c:(A) => [ pgSkill(A, 'Hack it into submission.', { system:'hacking' }, 'Your hacking drone has a long talk with their computer. It apologises.'),
             pgSkill(A, 'Let {who} talk to it.', { race:'enjinn' }, '{who} and the computer chat in clicks for a minute. It hands control back, sulking.'), pgRisk(A, 'Board them and pull the plug.', null, .6, 'You find the right plug first time.', 'You pull the wrong plug. The lights go out, and the defences come on.', 'auto') ] },
  hungry:  { t:'They ran out of food a week ago.', c:(A) => [ pgHelp(A, 'Give them crops from the hold.', { goodsKind:'crop' }, 'Fresh food. They hardly know what to do with it.'), pgHelp(A, 'Give them a meal.', { goodsKind:'meal' }, 'A hot meal. They name a child after your ship.') ] },
  feud:    { t:'Two of their officers are about to settle an argument with knives.', c:(A) => [ pgSkill(A, 'Have {who} quote the regulations at them.', { quirk:'bookworm' }, '{who} talks for forty minutes. Both officers give up out of sheer exhaustion.'),
             pgSkill(A, 'Have {who} make them laugh.', { quirk:'optimist' }, '{who} tells the one about the Sloog and the airlock. Everyone laughs. Feud over.'), pgRisk(A, 'Step in between them.', null, .5, 'You calm them down. Barely.', 'Both of them turn on you. Your crew pull you out, bruised.', null, { crewHurt:15 }) ] },
  cargo:   { t:'Their cargo is leaking something that glows.', c:(A) => [ pgHelp(A, 'Help them dump it.', null, 'You help jettison the cargo. They insist you keep a crate that didn\'t leak.', false, true),
             pgRisk(A, 'Salvage the glowing stuff.', null, .5, 'It\'s valuable, and it only glows a little now.', 'It glows a lot. Your hold catches fire.', null, { fire:true }) ] },
  signal:  { t:'They\'re picking up a strange signal and are too scared to look.', c:(A) => [ pgSkill(A, 'Decode it with your sensors (sensors 2+).', { system:'sensors', level:2 }, 'It\'s a cache beacon. You split what\'s inside with them.'),
             pgRisk(A, 'Go and look for yourself.', null, .55, 'A cache of old supplies, still sealed.', 'An automated guardian wakes up.', 'auto') ] },
  hostage: { t:'Raiders took one of their crew and are holding him nearby.', c:(A) => [ pgQuest(A, 'Go and get him back.'), pgHelp(A, 'Pay the ransom (25 scrap).', { scrap:25 }, 'The raiders take the scrap and let him go, mostly unharmed.') ] },
  bored:   { t:'Nothing is wrong, actually. They just want company.', c:(A) => [ pgHelp(A, 'Share a drink and swap stories.', null, 'An hour of stories and terrible jokes. Everyone feels better.', false, false, { crewHeal:20 }), pgTrade(A) ] } };
/* rewards, scaled to the sector */
function pgReward(big){ const s = G.sector || 1, r = rand(0, 1), e = {};
  if(r < .38) e.scrap = ri(10, 18) + s*3 + (big ? 15 : 0); else if(r < .52) e.fuel = ri(2, 4); else if(r < .64) e.missiles = ri(2, 4); else if(r < .74) e.parts = ri(2, 3);
  else if(r < .84) e.goods = 'random'; else if(r < .9) e.arm = 'random'; else if(r < .95) e.weapon = 'random'; else e.augment = 'random';
  if(big && !e.scrap) e.scrap = ri(8, 14) + s*2; if(rand(0, 1) < .3) e.xp = { skill:pick(['pilot', 'engines', 'shields', 'weapons', 'repair', 'combat']), amt:10 }; return e; }
const PG_THANKS = ['They load you up with what they can spare.', 'Their captain presses a crate into your hands.', 'They insist you take something for your trouble.', 'They pay you back the only way they can.'];
/* choice builders */
let PG_PEND = {};   // follow-up scenes waiting for their choice to be taken
function pgCost(req){ if(!req) return null; const c = {}; for(const k of ['fuel', 'parts', 'scrap', 'missiles']) if(req[k]) c[k] = req[k]; return Object.keys(c).length ? c : null; }
function pgFollow(A, good){ if(rand(0, 1) > .28) return {}; const id = pgId();
  PG_PEND[id] = good ? { id, questOnly:true, title:'A message', art:A.art, text:`A message finds you, routed through three relays: ${A.them} made it, and haven't forgotten you.`, choices:[{ text:'Read on.', effect:Object.assign({ text:pick(PG_THANKS) }, pgReward(true), A.fac ? { rep:{ [A.fac]:8 } } : {}) }] }
    : { id, questOnly:true, title:'Old grudge', art:'ship', text:`A ship drops in beside you, guns out. It's ${A.them}, or friends of theirs, and they remember what you did.`, choices:[{ text:'Fight.', effect:{ text:'They came for a fight.', fight:'random' } }, { text:'Pay them off (30 scrap).', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'They take it and go. Lesson learned, maybe.' } }] };
  return { later:{ event:id, jumps:ri(3, 6) } }; }
function pgTwist(base){ const r = rand(0, 1); if(r < .12) return { text:base.text + ' Then their guns come up. It was a trap all along.', fight:'random' };
  if(r < .24) return Object.assign({}, base, { text:base.text + ' And they insist on giving you more.' }, pgReward(true)); return base; }
function pgHelp(A, text, req, outcome, follow, crate, extra){ const e = pgTwist(Object.assign({ text:outcome + ' ' + pick(PG_THANKS) }, pgReward(false), crate ? { goods:'random' } : {}, extra || {}, req && req.goodsKind ? { eatGoods:req.goodsKind } : {}, A.fac ? { rep:{ [A.fac]:6 } } : {}, follow ? pgFollow(A, true) : {}));
  return Object.assign({ text, effect:e }, req ? { req, cost:pgCost(req) || undefined } : {}); }
function pgSkill(A, text, req, outcome){ const e = pgTwist(Object.assign({ text:outcome + ' ' + pick(PG_THANKS) }, pgReward(true), A.fac ? { rep:{ [A.fac]:10 } } : {}, pgFollow(A, true))); return { text, req, effect:e }; }
function pgRisk(A, text, req, chance, win, lose, fightTag, hurt){ const succ = Object.assign({ text:win + ' ' + pick(PG_THANKS) }, pgReward(true), A.fac ? { rep:{ [A.fac]:6 } } : {});
  const fail = Object.assign({ text:lose }, fightTag ? { fight:'random' } : {}, hurt || (fightTag ? {} : { hull:-ri(2, 4) }));
  return Object.assign({ text, chance, success:succ, fail }, req ? { req, cost:pgCost(req) } : {}); }
function pgFight(A, text, intro){ return { text, effect:{ text:intro, fight:'random', afterWin:Object.assign({ text:`${A.them.charAt(0).toUpperCase() + A.them.slice(1)} cheer over the comms. ${pick(PG_THANKS)}` }, pgReward(true), A.fac ? { rep:{ [A.fac]:12 } } : {}) } }; }
function pgQuest(A, text){ const id = pgId(); PG_PEND[id] = { id, questOnly:true, title:'The raiders\' hideout', art:'asteroid', text:'The raiders\' hideout: a cutter tucked behind a rock, and somebody banging on the inside of its hull.',
    choices:[{ text:'Get him out.', effect:{ text:'They see you coming.', fight:'random', afterWin:Object.assign({ text:`You bring him home to ${A.them}. ${pick(PG_THANKS)}` }, pgReward(true), A.fac ? { rep:{ [A.fac]:15 } } : {}) } }, { text:'Not worth it.', effect:{ text:'You leave him to it.' } }] };
  return { text, effect:{ text:'They mark the raiders\' hideout on your map. It\'s close.', quest:id } }; }
function pgTrade(A){ const s = 20 + (G.sector||1)*2; return { text:`Trade with them (${s} scrap).`, req:{ scrap:s }, cost:{ scrap:s }, effect:Object.assign({ text:'A fair trade, between strangers.' }, { goods:'random', fuel:2 }) }; }
function pgId(){ G.pgN = (G.pgN || 0) + 1; return `pg_${G.sector}_${G.pgN}`; }
/* the encounter itself */
function pgMake(node){
  const A = pick(PG_ACTORS), fac = A.fac ? A.fac() : null, name = pgShip(), Ax = { art:A.art, fac:FACTIONS[fac] ? fac : null, them:A.them };
  const keys = Object.keys(PG_TROUBLE).filter(k => !(A.k==='probe' && ['plague', 'hungry', 'feud'].includes(k)) && !(A.k==='bored'));
  const tk = node && node.distress ? pick(['drive', 'raiders', 'plague', 'breach', 'lost', 'hostage']) : pick(keys), T_ = PG_TROUBLE[tk];
  let ch = T_.c(Ax); ch = ch.filter(Boolean); if(ch.length > 3) ch = shuffle(ch).slice(0, 3);
  if(rand(0, 1) < .4 && !['bored'].includes(tk)) ch.push({ text:'Rob them while they\'re helpless.', effect:Object.assign({ text:'You take what you want. Nobody stops you. Nobody will forget, either.', scrap:ri(15, 25) + (G.sector||1)*3, heat:8 }, Ax.fac ? { rep:{ [Ax.fac]:-15 } } : {}, pgFollow(Ax, false)) });
  ch.push({ text:pick(['Leave them to it.', 'Wish them luck and go.', 'Not your problem.']), effect:{ text:pick(['You move on.', 'They watch you go.', 'Space is big. Someone else will come.']) } });
  const id = pgId(); DATA.events[id] = { id, art:A.art, title:node && node.distress ? 'Distress beacon' : 'Encounter', text:`${pick(PG_OPEN)} ${A.who(name)}. ${T_.t} ${pick(PG_COLOUR)}`, choices:ch, proc:true, questOnly:true, pend:PG_PEND };
  PG_PEND = {}; return id; }
/* taking a choice installs the scenes it leads to; the rest are dropped */
function pgRefs(e, out, d){ if(!e || typeof e!=='object' || d > 5) return out; if(e.later && e.later.event) out.push(e.later.event); if(typeof e.quest==='string') out.push(e.quest);
  for(const k of ['success', 'fail', 'afterWin', 'effect']) pgRefs(e[k], out, d + 1); for(const c of e.choices || []) pgRefs(c, out, d + 1); return out; }
(function(){ const c0 = chooseOption; chooseOption = function(ch){ const ev = G && G.modal && G.modal.id && DATA.events[G.modal.id];
  if(ev && ev.pend && ch && !(ch.cost && !costOk(ch.cost))){ let todo = pgRefs(ch, [], 0); while(todo.length){ const id = todo.pop(); const def = ev.pend[id]; if(def && !DATA.events[id]){ DATA.events[id] = def; pgRefs(def, todo, 0); } } delete ev.pend; }
  return c0(ch); }; })();
/* tidy up: generated scenes nothing leads to any more are removed when you change sector */
function pgPrune(){ if(!G || !DATA || !DATA.events) return; const keep = new Set((G.later || []).map(l => l.event)); for(const nd of (G.map && G.map.nodes) || []) if(nd.quest) keep.add(nd.quest);
  for(const id of Object.keys(DATA.events)) if(id.startsWith('pg_') && !keep.has(id) && !(G.modal && G.modal.id===id)) delete DATA.events[id]; }
/* how often: Settings → Story variety */
function pgRate(){ if(typeof NET!=='undefined' && NET.on) return 0; if(G && (G.daily || G.cup || G.challenge || G.seedDuel)) return .3;   // shared seeds: everyone gets the same mix
  const m = SET.storyMix || 'mixed', ex = typeof expOn==='function' && expOn(); return m==='classic' ? 0 : m==='wild' ? .6 : ex ? .42 : .3; }   // open-galaxy trips pass through more beacons, so they lean on generated ones more
const STORY_MIX = [['classic', 'Hand-made'], ['mixed', 'Mixed'], ['wild', 'Wild']];
function storyMixText(){ const m = SET.storyMix || 'mixed'; return m==='classic' ? 'Only the written events.' : m==='wild' ? 'Most beacons are generated: new people, new trouble, every run.' : 'About a third of beacons are generated encounters, the rest hand-written.'; }
(function(){ const p0 = pickEvent; pickEvent = function(node){ if(G && !(typeof CAMP!=='undefined' && CAMP) && !G.tut && rand(0, 1) < pgRate()){ try{ return pgMake(node); }catch(e){} } return p0(node); }; })();

/* =========================================================================
   Story pacing by game mode.
   The run's story (Pip, or another arc) plays one scene per sector. In the
   open galaxy you can strike after only a few trips, so there each trip can
   bring a second scene a few jumps in, and the chart warns you when you'd
   strike with scenes still unplayed.
   ========================================================================= */
function storyLeft(){ if(!G || G.noStory || (typeof campaignSolo==='function' && !campaignSolo()) || (typeof campDef==='function' && campDef())) return 0;
  if(typeof arcPure==='function' && arcPure()){ const A = arcDef(), S = arcState(); return A && A.beats ? Math.max(0, A.beats.length - S.beat) : 0; }
  if(typeof pipState!=='function') return 0; const P = pipState(); return P.sold || P.free ? 0 : Math.max(0, PIP_BEATS.length - P.beat); }
(function(){ const g0 = genSector; genSector = function(n, type){ try{ pgPrune(); }catch(e){} const r = g0(n, type); if(G){ G.secJ0 = (G.stats && G.stats.jumps) || 0; } return r; }; })();
(function(){ if(typeof heatIntercept!=='function') return; const h0 = heatIntercept;
  heatIntercept = function(node, first){ const r = h0(node, first); if(r) return r;
    if(!(typeof expOn==='function' && expOn()) || !first || G.enemy || node.quest || !['event', 'empty'].includes(node.type)) return false;
    const sd = sectorDef(); if(sd.final || sd.secret || G.sector < 2 || G.storyCatch===G.sector) return false;
    if(((G.stats && G.stats.jumps) || 0) - (G.secJ0 || 0) < 3 || storyLeft() < 1) return false;
    G.storyCatch = G.sector; return typeof campaignSector==='function' && campaignSector(); }; })();
(function(){ if(typeof expFinal!=='function') return; const f0 = expFinal;
  expFinal = function(){ const n = storyLeft(); if(n > 0 && UI.expSure!==G.sector){ UI.expSure = G.sector; toast(`Your story still has ${n} scene${n===1 ? '' : 's'} to play. Tap again to strike anyway.`); return; } UI.expSure = null; f0(); }; })();
(function(){ if(typeof drawExpeditionChart!=='function') return; const d0 = drawExpeditionChart;
  drawExpeditionChart = function(m){ d0(m); const n = storyLeft(); if(!n || !expCanFinal()) return;
    T(`Your story has ${n} scene${n===1 ? '' : 's'} left. Each trip plays one or two.`, W/2, H/2 + 410 - 120, { s:15, a:'center', c:C.amber }); }; })();

/* a campaign mod's sector-1 scene: plays when the send-off closes, before the first jump */
(function(){ if(typeof closeResult!=='function') return; const f0 = closeResult; closeResult = function(m){ f0(m);
  if(G && G.beat1 && G.sector===1 && (!G.modal || G.modal.type==='map') && !G.stats.jumps){ G.beat1 = false; const was = G.modal; G.modal = null; if(!campaignSector()) G.modal = was; } }; })();
