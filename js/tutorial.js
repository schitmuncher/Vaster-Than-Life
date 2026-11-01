'use strict';
/* =========================================================================
   Flight school: the tutorial on the title screen.
   1. Guided practice: a real fight against a training target, step by step,
      with each control lit up as you need it (fight, power, targeting, fire,
      breaches, boarders, the medbay, doors, the map, a store, an upgrade).
   2. Lessons: every system in the game, one short page at a time.
   ========================================================================= */
const TUT_LESSONS = [
  { id:'goal', icon:'🎯', name:'The mission', pages:[
    { h:'What you are doing', pts:['You fly a Fedoration courier carrying data that could end the war.', 'Cross 8 sectors, one map at a time, and reach the exit beacon of each.', 'In the last sector, find the Rebuff Flaggship and beat it three times before it wears down Fedoration command.', 'Lose your hull, or your whole crew, and the run is over. Every run is different.'] },
    { h:'Jumping', pts:['Each jump to a linked beacon costs 1 fuel. Run out and you are stranded until the fleet catches you.', 'Your VTL drive needs to charge before you can jump out of a fight. The Jump button lights up green when it is ready.', 'Beacons hold fights, events, stores, hazards or nothing at all. Quiet beacons let your crew patch the hull a little.'] },
    { h:'The Rebuff Fleet', pts:['The red band on the left of the map is the fleet. It moves forward every time you jump.', 'The dashed line shows where it will be after your next jump.', 'Beacons it reaches are taken: fights there are hard and pay almost nothing.', 'Explore what you can, but keep heading for EXIT.'] },
    { h:'Reading the map', pts:['STORE, EXIT, distress calls and quests are always marked.', 'A crosshair means a known ship, ? means a known event. Long-Range Scanners show everything.', 'Orange chevrons are veteran crews: tough, but they always carry gear.', 'Hazards: asteroids hit both ships, suns start fires, ion storms halve your reactor, pulsars knock out systems, nebulas blind sensors but slow the fleet.', '🐟 marks a fishing spot. At each exit you choose the next sector, and some exits show a situation (a crackdown, a salvage boom, storms...).'] } ] },
  { id:'ship', icon:'🚀', name:'Your ship', pages:[
    { h:'Hull and shields', pts:['Top left: your hull. When it reaches zero, the ship is lost.', 'Under it: your shield layers. Each layer blocks one laser, ion or flak shot, then recharges in about 2 seconds.', 'Missiles fly straight through shields. Beams lose 1 damage per layer. Bombs teleport past them.', 'Also up there: fuel, missiles, drone parts and scrap.'] },
    { h:'Rooms and systems', pts:['Each system lives in a room: Shields, Engines, Oxygen, Weapons, Drones, Medbay, Helm, Sensors, Doors, and more you can install.', 'A hit on a room damages its system. Damaged bars turn red until a crew member repairs them.', 'Helm, Engines, Shields and Weapons work better with someone at the station. Helm needs someone there or you cannot dodge or jump.', 'Install new systems (Teleporter, Cloaking, Hacking, Mind control, Battery, Clone bay) at stores.'] },
    { h:'Power', pts:['Your reactor has a fixed number of bars, shown at the bottom left.', 'Use + and − under each system to move power around. Shields need 2 power per layer.', 'Weapons and Drones hold exactly what their powered items use: power a weapon on and it takes its bars.', 'Ion hits lock bars for a few seconds. An ion storm halves your reactor. Upgrade the reactor at any time from the Ship screen.'] },
    { h:'The Ship screen', pts:['Press Ship (S) any time outside a fight.', 'Systems: upgrade with scrap. Ship gear: weapons, drones, augments and cargo. Crew: names, skills, hearts.', 'Garden & galley, Hold & gifts: crops, cooking, goods and presents.', 'A green dot on the Ship button means something is waiting for you there.'] } ] },
  { id:'weapons', icon:'🔫', name:'Weapons', pages:[
    { h:'Firing', pts:['Power a weapon (Power on, or + under Weapons). It charges up.', 'Press Target, then tap a room on the enemy ship. With Autofire on, it keeps firing at that room every time it charges.', 'Keys 1-4 pick a weapon. Clear stops it firing.', 'Hover or press and hold any weapon card to read exactly what it does.'] },
    { h:'Kinds of weapon', pts:['Lasers: several shots, blocked by shields one layer each. The bread and butter.', 'Missiles: ignore shields, use 1 missile each. Save them for shields rooms and tough fights.', 'Ion: knock out shield layers and lock systems for a while.', 'Beams: sweep across rooms after shields are down. Flak: a burst of shots. Bombs: teleport into a room, no shields involved.'] },
    { h:'Breaking shields', pts:['Shots that arrive together count. Press Hold fire (V), let everything charge, then Fire volley.', 'The first shots strip layers, the rest hit. Aim at the Shields room first, then Weapons.', 'Hitting Helm or Engines stops them dodging and escaping.', 'Store workshops refit guns you own to Mk II and Mk III: each refit charges 15% faster.'] } ] },
  { id:'defence', icon:'🛡', name:'Staying alive', pages:[
    { h:'Dodging', pts:['Evasion is your chance to dodge each shot. It comes from Engines power, a crewed Helm and Engines, and skill.', 'No one at the Helm means no dodging at all.', 'Cloaking adds a lot of evasion for a few seconds and stalls enemy weapons.', 'Defense drones shoot down missiles (and better ones lasers too).'] },
    { h:'Running away', pts:['When the VTL drive is charged, open the Map and jump out of any fight.', 'It costs fuel and you lose the salvage, but you keep your ship.', 'Some enemies surrender when beaten down: accepting gives a sure reward now, refusing lets you finish them for the normal salvage.'] },
    { h:'Upgrades that matter', pts:['A second shield layer (Shields to 4) is the single best early buy.', 'Then Engines for dodging, a bigger reactor, and a second weapon.', 'Do not hoard scrap. It only helps once it is spent.'] } ] },
  { id:'crew', icon:'🧑‍🚀', name:'Your crew', pages:[
    { h:'Giving orders', pts:['Tap a crew member (on the ship or on the list under it), then tap a room. Drag a box to select several.', 'Tapping a crew member shows a slim card under your ship: health, job, skills and hearts. ⓘ opens their full card.', 'Stations (H) sends everyone back to their posts.', 'Crew autopilot (Auto on) lets idle crew handle fires, breaches, repairs and boarders by themselves.'] },
    { h:'Skills', pts:['Crew learn by doing: piloting at the Helm, Engines, Shields, Weapons, repairing and fighting.', 'Each skill has three levels, from untrained to expert, and each level is a real bonus.', 'Keep people at the same post and they improve fast.'] },
    { h:'Peoples', pts:['Humans: all-rounders. Pebblekin: tough and fireproof, slow. Enjinn: great repairers, poor fighters.', 'Voltan: power their room, hate fighting. Sloog: telepathic, see through walls. Mantlis: fierce fighters, poor repairers.', 'More peoples turn up on the way. Press and hold any crew member to read theirs.'] },
    { h:'Personalities', pts:['Every crew member has a personality: a cook, a gambler, a poet, a daredevil...', 'It changes what they say, adds a small perk, and unlocks blue choices in events.', 'Name your crew and pick personalities in the hangar with Name your crew. Your last crew\'s names are remembered.'] },
    { h:'Health', pts:['Crew heal in the Medbay while it is powered. Send hurt crew there before they die.', 'Rooms without air hurt everyone in them. Keep Oxygen powered and repaired.', 'Dead crew are gone for good unless you have a Clone bay or a DNA Bank.'] } ] },
  { id:'damage', icon:'🔥', name:'Damage control', pages:[
    { h:'Fire', pts:['Fire spreads, burns crew and wrecks systems.', 'Send crew into the room to put it out, or open the doors to space: no air, no fire.', 'Fireproof peoples are the best firefighters.'] },
    { h:'Breaches', pts:['A breach is a hole in the hull. It drains the room\'s air until someone patches it.', 'Send a crew member to the room to fix it.'] },
    { h:'Doors and air', pts:['Tap a door to open or close it. The Doors buttons can open everything at once.', 'Opening airlocks vents rooms: it starves fires and boarders, but your crew need air too.', 'Stronger Doors slow down boarders.'] },
    { h:'Boarders', pts:['Enemy crew can teleport aboard. Fight them in groups, never one at a time.', 'The Medbay is a good place to fight: your crew heal as they go.', 'You can board them too: gather crew in the Teleporter and press Send. Kill their whole crew and the ship is yours to strip.'] } ] },
  { id:'systems', icon:'🛰', name:'Drones and gadgets', pages:[
    { h:'Drones', pts:['Drones need power in the Drones system and use 1 drone part each time they launch.', 'Attack drones orbit the enemy and shoot. Defense drones shoot down missiles.', 'Internal drones repair systems or fight boarders. Hull drones fix the hull out of combat.'] },
    { h:'Special systems', pts:['Teleporter: send boarders, bring them back.', 'Cloaking: dodge almost everything for a few seconds.', 'Hacking: fire a drone into a room, then pulse it to disable that system.', 'Mind control: turn an enemy crew member to your side for a while. Battery: extra power for 30 seconds.'] },
    { h:'Augments', pts:['Augments are permanent upgrades you find or buy: faster guns, scrap magnets, super shields, faster crew...', 'You can carry three. Sell one at a store to make room.'] } ] },
  { id:'events', icon:'❓', name:'Events and stores', pages:[
    { h:'Choices', pts:['Most beacons tell a little story and ask what you do.', 'Choices in blue need something you have: a people, a personality, a system or a bit of gear. They are usually the best option.', 'Some choices take a risk. Some start quests, marked on the map.'] },
    { h:'Stores', pts:['Hull repairs, fuel, missiles, drone parts, weapons, drones, augments, systems and crew for hire.', 'Each sector has its own kind of store with its own stock and prices. Haggle once per store, look for the daily deal, or try a mystery crate.', 'Your guild card gets a discount the more you spend. Sell gear you are not using.', 'Good buys, in order: hull if you are low, fuel up to 6-8, then a weapon that fits your power.'] },
    { h:'Trade goods', pts:['Goods ride in your cargo hold. Each is cheap where it is made and dear where it is wanted.', 'Store request boards pay extra for deliveries. Crew love some goods as gifts.', 'Travellers turn up between beacons: Mags Vetch trades, Kestrel Jones pays bounties, Doctor Oddly fits implants.'] } ] },
  { id:'life', icon:'🌱', name:'Life aboard', pages:[
    { h:'Garden and galley', pts:['Plant seeds in your planters (Ship → Garden & galley). Crops grow every jump, faster near a sun.', 'Harvest to sell, give as gifts, or cook.', 'A meal gives the whole crew an edge for three fights: melee, guns, repairs or dodging. The Medbay does the healing.'] },
    { h:'Hearts and gifts', pts:['Every crew member has ten hearts. Gifts they love, meals, nights out and fights survived together win hearts.', '3 hearts: 5% better at everything. 6: 10%. 8: +10 health. 10: devoted, 15%.', 'A gift they love also gives them a burst of practice at their job.'] },
    { h:'Birthdays', pts:['A cake icon means a birthday. It lasts two jumps.', 'A present on the day counts triple and makes them better at their job, a whole skill level.', 'Forget, and they sulk: 10% worse for three fights.'] },
    { h:'Pets', pts:['A pet can join you from an event. Tap it to pat it (once a jump, for hearts).', 'Each pet has a job: the kitten fights boarders, the slug seals breaches, the moth eats fires, the goat headbutts intruders and eats junk for scrap, and the cloud helps you dodge and heals its room.'] },
    { h:'Fishing', pts:['You need a rod first: buy one at a store (Supplies), or choose it as a send-off gift.', 'You can only fish in nebulas, asteroid fields and spots marked 🐟 on the map.', 'Every extra cast is riskier: snags, bites, snapped rods, fires, even a patrol. Deeper casts catch rarer fish.'] } ] },
  { id:'story', icon:'📖', name:'Stories and career', pages:[
    { h:'Four stories', pts:['Every run follows one story, a scene per sector: Pip the data core, the Defector, the Lost Flotilla or the Rival.', 'How you treat its people changes the last sector, the Flaggship fight and how a win ends.', 'Pick a story in the hangar, or leave it on Surprise me to get one you have seen least. Endings are listed under Career.'] },
    { h:'Admiral Hale', pts:['Hale sees you off at the start of every run and lets you pick a parting gift.', 'Higher ranks mean better gifts and more choice. Hale remembers how your last run went.'] },
    { h:'Renown and ranks', pts:['Every run earns renown, won or lost. Renown raises your rank from Cadet to Admiral.', 'Ranks unlock ships and better send-offs. Medals unlock ships sooner.', 'Win on Normal or Hard to unlock Rebuff alert levels: harder runs for more renown and score.'] },
    { h:'The saga', pts:['Your crew\'s adventures are written up as a saga: who joined, who fell, what they did.', 'Read it at the end of a run, or in Record.'] } ] },
  { id:'modes', icon:'🌌', name:'More ways to play', pages:[
    { h:'Runs with a twist', pts:['Daily run: the same ship, maps and events for everyone today.', 'Challenges: hand-made runs with a rule twist. Seeds: replay or share any run.', 'Weekly cup and daily boards: post your score.'] },
    { h:'Multiplayer', pts:['Host a room and share the five-letter code. Quest, laptop and phone mix freely.', 'Co-op on one ship, navigator and captain, away teams, races to the Flaggship, wingmen, duels and boarding brawls.', 'Hunter and hunted: one player flies, the other commands the fleet.'] },
    { h:'Mods and campaigns', pts:['Mods add ships, weapons, peoples, sectors and events. Install them from the Mods library or from a file.', 'Campaign mods are whole new stories with their own crew and villain. Turn one on, then pick it with the Campaign arrows in the hangar.', 'Try Red Dwarf: Three Million Years Late (an unofficial fan campaign) in the Stories tab of the library.'] },
    { h:'Meta Quest', pts:['Enter VR or mixed reality from the bar under the game.', 'Trigger selects. Left stick click holds up your datapad. A or X pauses, B or Y opens the map.', 'In mixed reality the console floats in your own room.'] } ] },
  { id:'controls', icon:'🎮', name:'Controls', pages:[
    { h:'Mouse and keyboard', pts:['Click to act. Hover anything for details.', 'Space pause · M map · S ship · 1-4 pick a weapon · V hold fire · F autofire · C cloak · H crew to stations · + and − game speed · Esc cancel.'] },
    { h:'Touch', pts:['Tap to act. Press and hold for details.', 'Pinch or double-tap to zoom, drag to look around. Two-finger tap pauses.', 'Turn your phone sideways, and use Full screen (or install the game) for the most room.'] },
    { h:'Game controller', pts:['D-pad jumps between buttons and rooms. Left stick moves a cursor. A selects, B backs out, Start pauses.', 'X hold fire · Y map · LB/RB weapons · LT stations · RT autofire · View ship.'] } ] }
];
const TUT_PAGES = TUT_LESSONS.reduce((t, l) => t + l.pages.length, 0);
function tutSeen(){ return (PROFILE.tut = PROFILE.tut || {}); }
function openTutorial(lesson){ UI.screen = 'tutorial'; UI.tutL = lesson != null ? lesson : (UI.tutL || 0); UI.tutP = 0; }

/* ---------------- the tutorial screen ---------------- */
function drawTutorial(){
  label('Flight school', 60, 70, C.cyan, 'left', 18);
  T('Tutorial', 60, 122, { s:50, f:FD, w:700 });
  const seen = tutSeen(), read = TUT_LESSONS.reduce((t, l) => t + l.pages.filter((p, i) => seen[l.id + i]).length, 0);
  T(`${read} of ${TUT_PAGES} pages read${PROFILE.tutDone ? ' · practice complete ✓' : ''}`, 360, 116, { s:16, c:C.muted });
  // the hands-on part
  { const x = 1060, y = 54, w = 480, h = 84, pl = PROFILE.tutDone ? 0 : .5 + .5*Math.sin(performance.now()/300);
    if(!PROFILE.tutDone) glow(x + w/2, y + h/2, 260, C.good, .08 + .1*pl);
    btn(x, y, w, h, PROFILE.tutDone ? '▶  Guided practice again' : '▶  Start guided practice', () => tutStartPractice(), { fill:true, s:22, col:C.good });
    tip(x, y, w, h, 'Guided practice', 'A real fight against a training target, one step at a time: power, weapons, shields, fires, breaches, boarders, the medbay, doors, the map, a store and an upgrade. Your ship cannot be destroyed. Takes about five minutes.'); }
  // lesson list
  const L = clamp(UI.tutL||0, 0, TUT_LESSONS.length-1), les = TUT_LESSONS[L];
  panel(60, 160, 400, 790, 12);
  TUT_LESSONS.forEach((l, i) => { const y = 176 + i*60, cur = i===L, done = l.pages.every((p, k) => seen[l.id + k]);
    rr(72, y, 376, 52, 9); ctx.fillStyle = cur ? hexA(C.amber,.14) : hovered(72, y, 376, 52) ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,0)'; ctx.fill(); if(cur){ ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke(); }
    region(72, y, 376, 52, () => { UI.tutL = i; UI.tutP = 0; }, l.name);
    T(l.icon, 98, y+35, { s:24, a:'center' }); T(l.name, 128, y+34, { s:19, f:FD, w:700, c: cur ? C.amber : C.ink, max:260 });
    T(done ? '✓' : `${l.pages.filter((p, k) => seen[l.id + k]).length}/${l.pages.length}`, 430, y+33, { s:15, a:'right', c: done ? C.good : C.muted }); });
  // the page
  const P = clamp(UI.tutP||0, 0, les.pages.length-1), pg = les.pages[P]; seen[les.id + P] = 1; if(!UI._tutSaved || UI._tutSaved !== les.id + P){ UI._tutSaved = les.id + P; saveProfile(); }
  panel(480, 160, 1060, 690, 12);
  label(`${les.name} · ${P+1} of ${les.pages.length}`, 512, 202, C.cyan, 'left', 15);
  T(pg.h, 512, 254, { s:38, f:FD, w:700, max:980 });
  const ax = 1180, ay = 300; tutArt(les.id, P, ax, ay, 330, 300);
  let y = 300; for(const p of pg.pts){ ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(522, y+8, 5, 0, 7); ctx.fill(); y += para(p, 544, y+14, 600, { s:19, lh:28, c:C.ink }) + 22; }
  // page dots
  les.pages.forEach((p, i) => { ctx.beginPath(); ctx.arc(512 + i*22, 820, i===P ? 7 : 5, 0, 7); ctx.fillStyle = i===P ? C.amber : seen[les.id + i] ? C.muted : C.line; ctx.fill(); region(502 + i*22, 808, 20, 24, () => { UI.tutP = i; }); });
  btn(480, 870, 200, 70, '‹ Back', () => { if(P > 0) UI.tutP = P-1; else if(L > 0){ UI.tutL = L-1; UI.tutP = TUT_LESSONS[L-1].pages.length-1; } }, { s:20, disabled:L===0 && P===0 });
  const last = L===TUT_LESSONS.length-1 && P===les.pages.length-1;
  btn(1300, 870, 240, 70, P < les.pages.length-1 ? 'Next ›' : last ? 'Done' : `${TUT_LESSONS[L+1].name} ›`, () => { if(P < les.pages.length-1) UI.tutP = P+1; else if(!last){ UI.tutL = L+1; UI.tutP = 0; } else UI.screen = 'title'; }, { fill:true, s:20, max:220 });
  btn(700, 870, 200, 70, 'Title', () => { UI.screen = 'title'; }, { s:20 });
  if(les.id==='story' || les.id==='crew') btn(920, 870, 360, 70, 'To the hangar ›', () => openHangar(), { s:18, col:C.cyan });
  else if(les.id==='modes') btn(920, 870, 360, 70, 'Open the Mods library ›', () => { UI.screen = 'mods'; if(typeof loadLibrary==='function') loadLibrary(); }, { s:18, col:C.cyan });
  else if(['goal','ship','weapons','defence','damage','events'].includes(les.id)) btn(920, 870, 360, 70, 'Practise this ›', () => tutStartPractice(), { s:18, col:C.good });
}
/* small pictures for the lessons, drawn with the game's own parts */
function tutArt(id, p, x, y, w, h){
  rr(x, y, w, h, 12); ctx.fillStyle = 'rgba(6,9,18,.7)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
  const cx = x + w/2, cy = y + h/2, ship = typeof hangarThumb==='function' ? hangarThumb('pestrel') : null;
  const big = (g, c) => T(g, cx, cy + 34, { s:110, a:'center', c });
  if(id==='ship' || (id==='defence' && p===0) || (id==='crew' && p<2) || id==='damage'){ if(ship){ drawShip(ship, { x:x+10, y:y+40, w:w-20, h:h-80 }, 1, false, true); ctx.globalAlpha = 1; } if(id==='damage'){ T(['🔥','🕳','🚪','⚔'][p] || '🔥', cx, y+h-20, { s:40, a:'center' }); } return; }
  if(id==='weapons'){ const ks = p===1 ? ['laser','missile','ion','beam','flak','bomb'] : ['laser','laser','missile'];
    ks.forEach((k, i) => { const yy = y + 34 + i*(p===1 ? 44 : 70); const col = { laser:'#ff7a5a', missile:'#ffd166', ion:'#5fd3e6', beam:'#ff5a7a', flak:'#c9a0ff', bomb:'#7be0a0' }[k];
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x+30, yy); ctx.lineTo(x+150, yy); ctx.stroke(); glow(x+150, yy, 18, col, .6); T(k[0].toUpperCase() + k.slice(1), x+180, yy+6, { s:18, f:FD, w:700, c:col }); });
    if(p===2){ for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(x+250, y+h/2, 50 + i*14, -1.2, 1.2); ctx.strokeStyle = hexA(C.cyan, .7 - i*.2); ctx.lineWidth = 3; ctx.stroke(); } } return; }
  if(id==='goal'){ if(p===2){ const g = ctx.createLinearGradient(x, 0, x+130, 0); g.addColorStop(0, 'rgba(255,90,122,.7)'); g.addColorStop(1, 'rgba(255,90,122,0)'); ctx.fillStyle = g; ctx.fillRect(x+2, y+2, 130, h-4); }
    const pts = [[.18,.5],[.38,.3],[.38,.72],[.6,.45],[.82,.28],[.82,.66]]; ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5]].forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(x+pts[a][0]*w, y+pts[a][1]*h); ctx.lineTo(x+pts[b][0]*w, y+pts[b][1]*h); ctx.stroke(); });
    pts.forEach(([u,v], i) => { ctx.beginPath(); ctx.arc(x+u*w, y+v*h, 12, 0, 7); ctx.fillStyle = i===0 ? C.amber : i===5 ? C.good : C.panel; ctx.fill(); ctx.strokeStyle = i===5 ? C.good : C.muted; ctx.stroke(); });
    T('EXIT', x+.82*w, y+.66*h+34, { s:14, f:FD, w:700, a:'center', c:C.good }); T('STORE', x+.82*w, y+.28*h-20, { s:14, f:FD, w:700, a:'center', c:C.amber }); return; }
  if(id==='life' && p===3 && typeof petSprite==='function'){ ['kitten','slug','moth','goat','cloud'].forEach((k, i) => { const px = x + 70 + (i%3)*95, py = y + 100 + Math.floor(i/3)*120; petSprite(k, px, py, 3.2, 1, 1); T(k, px, py + 46, { s:13, a:'center', c:C.muted }); }); return; }
  const icons = { defence:['🛡','🏃','⬆'], crew:['','','👥','🎭','➕'], systems:['🛸','📡','💎'], events:['❓','🛒','📦'], life:['🌱','❤','🎂','🐈','🎣'], story:['📖','🎖','⭐','📜'], modes:['📅','👫','🧩','🥽'], controls:['⌨','👆','🎮'] };
  big((icons[id] || [])[p] || TUT_LESSONS.find(l => l.id===id).icon);
}

/* ---------------- guided practice ---------------- */
BASE.enemies.tut_target = { name:'Training Target', eventOnly:true, auto:true, hull:10, sectors:[1,9], systems:{ shields:2, engines:1, weapons:1, piloting:1 }, weapons:['basic'], drones:[], crew:[] };
const TUT_STEPS = [
  { id:'hello', title:'Welcome to flight school', text:'This is your ship, on the left. Top left is your hull: if it reaches zero, the ship is lost (not today: this is practice). Under it are your shield layers, fuel, missiles and scrap. The game is paused while you read.', read:true, at:() => RECT.hull },
  { id:'foe', title:'Your target', text:'On the right is a training target. It will shoot back, gently. Your job: knock its shields down, then its hull. Everything you need is on the panels along the bottom.', read:true, at:() => tutShipBox(G.enemy) },
  { id:'power', title:'Power a weapon', text:'Weapons need reactor power. Tap "Power on" on a weapon card at the bottom right (or + under Weapons). Its charge bar starts filling.', done:() => G.ship.weapons.some(w => w.on && !DATA.weapons[w.id]?.heal), at:() => tutBtn('Power on') || RECT.armory },
  { id:'aim', title:'Pick a target', text:'Tap "Target" on the powered weapon, then tap the enemy\'s Shields room (it has a shield symbol). The weapon will keep firing at that room on its own.', done:() => G.ship.weapons.some(w => w.on && w.target!=null), at:() => UI.selWeapon!=null ? roomRect(G.enemy, 'shields') : (tutBtn('Target') || tutBtn('Pick room') || RECT.armory) },
  { id:'watch', title:'Watch it work', text:'Lasers are blocked one shot per shield layer. When a shot gets through to the Shields room, the enemy loses a layer. Power your other weapons and aim them too, if you like.', done:() => { const e = G.enemy; return !e || e.dead || (e.systems.shields && e.systems.shields.dmg > 0) || e.hull < e.maxHull; }, at:() => roomRect(G.enemy, 'shields'), live:true },
  { id:'pause', title:'Pause any time', text:'Space, or the Pause button, freezes the fight. You can still give every order while paused: aim, move crew, change power. Pause whenever things get busy.', read:true, at:() => tutBtn('Pause') || RECT.pause },
  { id:'fire', title:'Fire aboard!', text:'Something has caught fire. Tap one of your crew (on the ship, or on the list under it), then tap the burning room. Crew put fires out by standing in them.', setup:() => { G.crewAuto = false; const i = tutRoom(); igniteRoom(G.ship, i); igniteRoom(G.ship, i); G.tut.room = i; }, done:() => !G.ship.rooms.some(r => r.fire > 0), at:() => tutRoomRect(G.tut.room), live:true },
  { id:'breach', title:'Hull breach', text:'A hit has holed the hull. The air in that room is leaking out. Send a crew member there to patch it.', setup:() => { const i = tutRoom(); G.ship.rooms[i].breach = Math.max(1, G.ship.rooms[i].breach||0); G.tut.room = i; }, done:() => !G.ship.rooms.some(r => r.breach > 0), at:() => tutRoomRect(G.tut.room), live:true },
  { id:'board', title:'Intruder!', text:'A boarder has teleported aboard. Send two or more of your crew into its room: crew fight much better together. (Drag a box to select several, or send them one by one.)', setup:() => { const i = tutRoom(); const c = newCrew('human', 'e'); c.hp = c.maxHp = 45; G.ship.crew.push(c); placeCrew(G.ship, c, i); G.tut.room = i; G.tut.foe = c.id; }, done:() => !G.ship.crew.some(c => c.owner==='e' && c.hp > 0), at:() => { const c = G.ship.crew.find(c => c.id===G.tut.foe); return c && c.hp > 0 ? tutRoomRect(c.room) : null; }, live:true },
  { id:'heal', title:'Patch them up', text:'Hurt crew heal in the Medbay (the green cross) while it has power. Send anyone hurt there now, or tap Next if everyone is fine.', read:true, at:() => roomRect(G.ship, 'medbay') },
  { id:'doors', title:'Doors and air', text:'Tap any door to open or close it. Opening the airlocks to space vents the air: fires go out and boarders choke, but so do your own crew, so move them out first.', read:true, at:() => RECT.doors },
  { id:'auto', title:'Crew autopilot', text:'You did all that by hand. Turn crew autopilot back on ("Auto off" under your crew list) and idle crew will fight fires, patch breaches and fight boarders by themselves.', done:() => G.crewAuto, at:() => tutBtn('Auto off') },
  { id:'volley', title:'Fire together', text:'Against stronger shields, press "Hold fire" (V): your weapons charge but wait. Press "Fire volley" and they all shoot at once, so the first shots strip the shields and the rest hit.', read:true, at:() => tutBtn('Hold fire') || tutBtn('Fire volley') },
  { id:'kill', title:'Finish it', text:'The target is nearly done. Keep firing until it breaks apart.', setup:() => { const e = G.enemy; if(e && !e.dead){ e.hull = Math.min(e.hull, 3); } }, done:() => !G.enemy || G.enemy.dead || (G.modal && G.modal.type!=='msg'), at:() => tutShipBox(G.enemy), live:true },
  { id:'loot', title:'Salvage', text:'Every fight you win pays out: scrap to spend, and sometimes fuel, missiles, drone parts or gear. Close the window to carry on.', done:() => !G.modal && !G.enemy, live:true, noAt:true },
  { id:'map', title:'The map', text:'Open the Map (M) to choose where to go next.', setup:() => tutStoresAhead(), done:() => G.modal && G.modal.type==='map', at:() => tutBtn('Map') || tutBtn('Jump') || RECT.map },
  { id:'jump', title:'Jump', text:'You are at the amber beacon. Tap a beacon linked to it, then Jump. Each jump costs 1 fuel, and the Rebuff Fleet (the red band on the left) moves up every time. The beacons ahead are stores, just for practice.', done:() => G.stats.jumps >= 1, live:true, noAt:true },
  { id:'store', title:'A store', text:'Stores sell hull repairs, fuel, missiles, gear and crew, and buy what you do not need. Look around the tabs. Close the store when you are done.', done:() => !G.modal && G.warp <= 0 && (G.tut.sawStore || G.tut.t > 6), live:true, noAt:true },
  { id:'upgrade', title:'Upgrade', text:'Scrap is for spending. Here are 60 scrap from the instructors. Open Ship (S), go to Systems, and upgrade Shields. Two more shield power is a whole extra layer.', setup:() => { G.scrap += 60; G.tut.sh = G.ship.systems.shields.max; }, done:() => G.ship.systems.shields.max > G.tut.sh, at:() => G.modal && G.modal.type==='ship' ? null : (tutBtn('Ship') || RECT.ship), live:true },
  { id:'end', title:'Practice complete', text:'That is the heart of the game: power, aim, fix, jump, shop, upgrade. The Tutorial pages cover everything else: crew skills, drones, stories, the garden, pets, fishing and more. Good luck out there, Captain.', read:true, last:true, noAt:true }
];
ACHIEVEMENTS.push({ id:'graduate', name:'Flight School Graduate', desc:'Finish the guided practice.' });
function tutOn(){ return !!(G && G.tut && UI.screen==='game'); }
function tutStartPractice(){
  const runs = PROFILE.runs, arcs = JSON.stringify(PROFILE.arcs || {}), wasHints = SET.hints, camp = SET.campaign; SET.campaign = null;
  newRun('pestrel', 'Practice Pestrel', { seed:'PRACTICE', noSendoff:true, practice:true });
  SET.campaign = camp; PROFILE.runs = runs; PROFILE.arcs = JSON.parse(arcs); saveProfile();   // practice doesn't count as a run
  G.tut = { step:0, hints:wasHints }; G.noSave = true; G.noStory = true; G.crewAuto = false; G.fuel = 8; G.arc = null; G.alert = 0; SET.hints = false;
  G.modal = null; startCombat('tut_target', { title:'Practice', text:'' }); G.modal = null;
  for(const w of G.ship.weapons) w.on = false; if(G.ship.systems.weapons) G.ship.systems.weapons.power = 0;
  G.paused = true; tutEnter();
}
function tutStep(){ return G && G.tut ? TUT_STEPS[G.tut.step] : null; }
function tutEnter(){ const s = tutStep(); if(!s) return; G.tut.t = 0; if(s.setup) s.setup(); G.paused = !!s.read; }
function tutNext(){ G.tut.step++; if(G.tut.step >= TUT_STEPS.length){ tutFinish(true); return; } tutEnter(); }
function tutFinish(done){
  if(!G || !G.tut) return; SET.hints = G.tut.hints; if(done){ PROFILE.tutDone = 1; grant('graduate'); }
  saveProfile(); G = null; UI.screen = 'tutorial'; UI.hint = null; UI.hintQ = [];
}
function tutTick(dt){
  if(!tutOn()) return; const s = tutStep(); if(!s) return; G.tut.t += dt;
  if(G.ship.hull < 8) G.ship.hull = 8;   // practice: the ship can't be lost
  for(const c of G.ship.crew) if(c.owner==='p' && c.hp < 15) c.hp = 15;
  if(G.enemy && !G.enemy.dead && s.id!=='kill' && G.enemy.hull <= 2) G.enemy.hull = 3;   // don't win before the lesson gets there
  if(G.modal && G.modal.type==='store') G.tut.sawStore = true;
  if(!s.read && s.done && G.tut.t > .4 && s.done()) tutNext();
}
/* where things are on screen */
function tutBtn(label){ const r = (typeof HR!=='undefined' ? HR : []).find(r => r.t===label && r.w > 0); return r ? [r.x, r.y, r.w, r.h] : null; }
function tutRoom(){ const s = G.ship, own = new Set(s.crew.filter(c => c.owner==='p').map(c => c.room)); let best = 0, bd = -1;
  s.rooms.forEach((r, i) => { if(r.fire > 0 || r.breach > 0 || !s._rects?.[i]) return; const d = own.has(i) ? 0 : (r.sys ? 2 : 1); if(d > bd){ bd = d; best = i; } }); return best; }
function tutRoomRect(i){ const sh = G.ship, q = sh && sh._rects && sh._rects[i]; if(!q) return null; if(typeof svOn==='function' && svOn()){ const a = svToScreen(q.x, q.y); return [a.x, a.y, q.w*SV.z, q.h*SV.z]; } return [q.x, q.y, q.w, q.h]; }
function tutShipBox(sh){ if(!sh || !sh._rects || !sh._rects.length) return null; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for(const q of sh._rects){ if(!q) continue; x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x+q.w); y1 = Math.max(y1, q.y+q.h); } return [x0, y0, x1-x0, y1-y0]; }
function tutStoresAhead(){ const M = G.map; if(!M) return; const cur = M.nodes[M.cur]; for(const i of cur.links){ const n = M.nodes[i]; if(n.col > cur.col && n.type!=='exit' && n.type!=='base'){ n.type = 'store'; n.store = null; n.hazard = null; n.revealed = true; } } }
/* the coach: a panel at the top, and a pulsing outline round whatever it is talking about */
function drawTutCoach(){
  if(!tutOn()) return; const s = tutStep(); if(!s) return;
  const at = !s.noAt && s.at ? s.at() : null, pulse = .5 + .5*Math.sin(performance.now()/180);
  if(at && !(G.modal && G.modal.type!=='msg' && s.id!=='upgrade')){ const [x, y, w, h] = at; ctx.save(); ctx.strokeStyle = C.good; ctx.lineWidth = 3 + pulse*2; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -performance.now()/40; rr(x-6, y-6, w+12, h+12, 10); ctx.stroke(); ctx.setLineDash([]); glow(x+w/2, y+h/2, Math.max(w, h)*.7, C.good, .14*pulse); ctx.restore(); }
  const side = at && !G.modal && at[1] < 540 ? (at[0] + at[2]/2 < W/2 ? 1 : -1) : 0;   // something on one ship: sit over the other one
  const bw = side ? 700 : 760, L = lines(s.text, bw - 60, `400 19px ${FM}`), bh = 104 + L.length*26 + (s.read ? 44 : 0);
  const bx = side > 0 ? W - bw - 40 : side < 0 ? 40 : W/2 - bw/2, by = G.modal ? H - bh - 16 : 92;
  rr(bx, by, bw, bh, 12); ctx.fillStyle = 'rgba(8,24,22,.97)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.good; ctx.stroke(); region(bx, by, bw, bh, () => {});
  label(`Practice · step ${G.tut.step+1} of ${TUT_STEPS.length}`, bx+24, by+30, C.good, 'left', 13);
  T(s.title, bx+24, by+62, { s:24, f:FD, w:700, max:bw-260 });
  L.forEach((l, i) => T(l, bx+24, by+94 + i*26, { s:19, c:C.ink }));
  if(s.read){ btn(bx+bw-190, by+18, 170, 50, s.last ? 'Finish' : 'Next ›', () => tutNext(), { fill:true, s:18, col:C.good }); if(!s.last) btn(bx+bw-190, by+bh-46, 170, 34, 'Leave practice', () => tutFinish(false), { s:13 }); }
  else { btn(bx+bw-190, by+18, 170, 34, 'Leave practice', () => tutFinish(false), { s:13 }); }
}
