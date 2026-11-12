'use strict';
/* =========================================================================
   VASTER THAN LIFE — game data. Mods merge over BASE by id.
   ========================================================================= */
const C = { void:'#070a14', panel:'#0e1426', panel2:'#141c33', room:'#1a2442', line:'#26324f', ink:'#dfe6f5',
  muted:'#8592b0', amber:'#ffb547', cyan:'#5fd3e6', hostile:'#ff5a7a', good:'#7be0a0', warn:'#ffd166', violet:'#b49cff',
  fire:'#ff8a3d', nebula:'#8b6fd6' };

const SYS = ['shields','engines','oxygen','weapons','drones','medbay','clonebay','teleporter','cloaking','hacking','mindcontrol','piloting','sensors','doors','battery'];
const SUB = ['piloting','sensors','doors','battery'];
const MAIN = SYS.filter(k => !SUB.includes(k));
const SYSN = { shields:'Shields', engines:'Engines', oxygen:'Oxygen', weapons:'Weapons', drones:'Drones', medbay:'Medbay', clonebay:'Clone Bay',
  teleporter:'Teleporter', cloaking:'Cloaking', hacking:'Hacking', mindcontrol:'Mind Ctrl', piloting:'Helm', sensors:'Sensors', doors:'Doors', battery:'Battery' };
const SYSS = { shields:'SHLD', engines:'ENG', oxygen:'O2', weapons:'WEAP', drones:'DRN', medbay:'MED', clonebay:'CLONE', teleporter:'TELE',
  cloaking:'CLOAK', hacking:'HACK', mindcontrol:'MIND', piloting:'HELM', sensors:'SENS', doors:'DOOR', battery:'BATT' };
const SYSC = { shields:C.cyan, engines:C.amber, oxygen:'#9fd8ff', weapons:C.hostile, drones:'#f0a6ff', medbay:C.good, clonebay:'#7be0d0',
  teleporter:'#c6e05a', cloaking:'#a9b4d0', hacking:'#ff9de2', mindcontrol:'#d78cff', piloting:C.violet, sensors:'#8fc1ff', doors:'#c9a27e', battery:C.warn };
const CAPS = { shields:8, engines:8, oxygen:3, weapons:8, drones:8, medbay:3, clonebay:3, teleporter:3, cloaking:3, hacking:3, mindcontrol:3, piloting:3, sensors:3, doors:3, battery:2 };
const UPCOST = { shields:[25,12], engines:[15,10], oxygen:[25,25], weapons:[25,12], drones:[25,12], medbay:[30,25], clonebay:[30,25], teleporter:[40,30],
  cloaking:[50,35], hacking:[40,30], mindcontrol:[40,30], piloting:[20,20], sensors:[25,25], doors:[20,20], battery:[35,30] };
const INSTALL = { drones:60, teleporter:75, cloaking:120, hacking:80, mindcontrol:75, medbay:60, clonebay:65, battery:35, sensors:40, doors:40 };
const SKILLS = ['pilot','engines','shields','weapons','repair','combat'];
const SKILLN = { pilot:'Piloting', engines:'Engines', shields:'Shields', weapons:'Weapons', repair:'Repair', combat:'Combat' };
const SKILLT = { pilot:[60,150], engines:[60,150], shields:[20,50], weapons:[25,60], repair:[15,40], combat:[6,15] };
const NAMES = ['Ash','Bryn','Coll','Dara','Eli','Fen','Gale','Hollis','Ione','Jory','Kit','Lark','Mosi','Noor','Oren','Pell','Quin','Rhea','Sol','Tam',
  'Ude','Vale','Wren','Yara','Zeb','Moss','Pim','Juno','Bex','Cato','Dex','Ezra','Faye','Gus','Halo','Iggy','Jax','Kai','Lumi','Milo','Nix','Ozzy','Pax','Rook','Sage','Tibs','Vex','Wim','Zara'];
const SHIP_NAMES = ['Wren Junior','Big Dipper','Space Oddity','Cosmic Latte','Nebula Nugget','Void Biscuit','Star Trekkie','Hull Monty','Ion Maiden','Warp Speedo'];

const BASE = {
  rules: { sectors:8, startScrap:20, fleetSpeed:0.11, shieldRegen:2, repairRate:0.16, enemyPace:0.7, bossId:'flaggship',
    maxCrew:8, weaponSlots:4, droneSlots:3, augmentSlots:3, baseHP:4, startParts:2 },

  /* every crew member you recruit has one trait: a small personal edge. Fields: repair, dps, speed, charge (weapons, when manning), shield (recharge, when manning) multiply; hp, evade (when piloting) and heal (hp per second to the whole room) add */
  traits: {
    quick:      { name:'Quick hands', repair:1.25, desc:'Repairs and fights fires 25% faster.' },
    tough:      { name:'Tough',       hp:25,       desc:'25 extra health.' },
    ace:        { name:'Ace pilot',   evade:5,     desc:'+5% evasion while flying the ship.' },
    gunner:     { name:'Gunner',      charge:1.08, desc:'Weapons charge 8% faster while they man the guns.' },
    brawler:    { name:'Brawler',     dps:1.25,    desc:'Hits 25% harder in a fight.' },
    medic:      { name:'Medic',       heal:2.5,    desc:'Slowly heals everyone in the same room, themselves too.' },
    shieldtech: { name:'Shield tech', shield:1.15, desc:'Shields recharge 15% faster while they man them.' },
    swift:      { name:'Swift',       speed:1.2,   desc:'Moves 20% faster.' }
  },

  races: {
    human:     { name:'Human',     color:'#e8c49a', hp:100, repair:1,   combat:1,   speed:1,    learn:1.1, desc:'Perfectly average. Learns skills a bit faster. Proud of it.' },
    pebblekin: { name:'Pebblekin', color:'#9aa7b8', hp:150, repair:0.5, combat:1,   speed:0.5,  fireproof:true, desc:'Huge health and fireproof. Slow on their feet and slower with a wrench.' },
    enjinn:    { name:'Tinkari',    color:'#b9f3ff', hp:100, repair:2,   combat:0.5, speed:1,    desc:'Wish-granting mechanics. Repair twice as fast, fight like a wet towel.' },
    voltan:    { name:'Thrumm',    color:'#ffe27a', hp:70,  repair:1,   combat:1,   speed:1,    power:1, deathBurst:15, desc:'Add 1 free power to the system they stand in. Explode when they die.' },
    sloog:     { name:'Mullock',     color:'#9fdc7a', hp:100, repair:1,   combat:1,   speed:1,    telepathic:true, mindImmune:true, desc:'Telepathic: always see enemy crew. Immune to mind control. Smug.' },
    mantlis:   { name:'Jabbit',   color:'#c6e05a', hp:100, repair:0.5, combat:1.5, speed:1.25, desc:'Born brawlers. Fast and deadly in a fight, hopeless with tools.' }
  },

  weapons: {
    basic:      { name:'Basic Laser',        type:'laser',   damage:1, shots:1, charge:10, power:1, cost:20, tier:1 },
    bust1:      { name:'Bust Laser I',       type:'laser',   damage:1, shots:2, charge:11, power:2, cost:50, tier:1 },
    bust2:      { name:'Bust Laser II',      type:'laser',   damage:1, shots:3, charge:12, power:2, cost:80, tier:2 },
    bust3:      { name:'Bust Laser III',     type:'laser',   damage:1, shots:5, charge:19, power:4, cost:95, tier:3 },
    heavy1:     { name:'Heavy Laser I',      type:'laser',   damage:2, shots:1, charge:9,  power:1, cost:55, tier:1, fire:0.3, breach:0.21 },
    heavy2:     { name:'Heavy Laser II',     type:'laser',   damage:2, shots:2, charge:13, power:3, cost:65, tier:2, fire:0.2, breach:0.2 },
    duel:       { name:'Duel Lasers',        type:'laser',   damage:1, shots:4, charge:16, power:3, cost:70, tier:2, desc:'Two lasers settling their differences on your enemy.' },
    lego:       { name:'Lego Missile',       type:'missile', damage:1, shots:1, charge:9,  power:1, cost:30, tier:1, fire:0.1, breach:0.09, desc:'Small, but they will remember stepping on it.' },
    arty:       { name:'Arty Missile',       type:'missile', damage:2, shots:1, charge:11, power:1, cost:38, tier:1, fire:0.1, breach:0.09 },
    hermies:    { name:'Hermies Missile',    type:'missile', damage:3, shots:1, charge:14, power:3, cost:45, tier:2, fire:0.3, breach:0.5 },
    breachm:    { name:'Breach Missile',     type:'missile', damage:4, shots:1, charge:22, power:3, cost:65, tier:3, breach:0.9 },
    pegasaurus: { name:'Pegasaurus Missile', type:'missile', damage:2, shots:2, charge:20, power:3, cost:60, tier:3, breach:0.2 },
    ion:        { name:'Ion Blast',          type:'ion',     damage:1, shots:1, charge:8,  power:1, cost:30, tier:1 },
    ion2:       { name:'Heavy Ion',          type:'ion',     damage:2, shots:1, charge:13, power:1, cost:45, tier:2 },
    ionstun:    { name:'Ion Stunner',        type:'ion',     damage:1, shots:1, charge:10, power:1, cost:35, tier:2, stun:10 },
    pike:       { name:'Pike Bream',         type:'beam',    damage:1, rooms:2, charge:16, power:2, cost:50, tier:1 },
    halbird:    { name:'Hal-Bird Beam',      type:'beam',    damage:2, rooms:2, charge:17, power:3, cost:65, tier:2 },
    glaive:     { name:'Glaive Bream',       type:'beam',    damage:3, rooms:3, charge:25, power:4, cost:95, tier:3 },
    bonfire:    { name:'Bonfire Beam',       type:'beam',    damage:0, rooms:3, charge:20, power:2, cost:50, tier:2, fire:0.6 },
    biobeam:    { name:'Anti-Bio-Logical Beam', type:'beam', damage:0, rooms:3, charge:16, power:2, cost:50, tier:2, crewDamage:45 },
    flak1:      { name:'Flak-o I',           type:'flak',    damage:1, shots:3, charge:10, power:2, cost:65, tier:2, radius:1 },
    flak2:      { name:'Flak-o II',          type:'flak',    damage:1, shots:7, charge:21, power:3, cost:80, tier:3, radius:2 },
    firebomb:   { name:'Fire Bomb',          type:'bomb',    damage:0, charge:15, power:2, cost:50, tier:2, fire:1, crewDamage:15 },
    breachbomb: { name:'Breach Bomb',        type:'bomb',    damage:0, charge:17, power:1, cost:50, tier:2, breach:1, sysDamage:2 },
    smallbomb:  { name:'Small Bomb',         type:'bomb',    damage:0, charge:11, power:1, cost:45, tier:1, sysDamage:1 },
    ionbomb:    { name:'Ion Bomb',           type:'bomb',    damage:0, charge:22, power:1, cost:55, tier:3, ion:4, sysDamage:1, crewDamage:15 },
    healbomb:   { name:'Heal-ium Burst',     type:'bomb',    damage:0, charge:15, power:1, cost:40, tier:2, heal:40, desc:'Targets your own ship. Heals everyone in the room.' }
  },

  drones: {
    combat1:  { name:'Combat Drone I',        kind:'attack',   power:2, cost:50, rate:4,   shot:{ type:'laser', damage:1 } },
    combat2:  { name:'Combat Drone II',       kind:'attack',   power:4, cost:75, rate:2.3, shot:{ type:'laser', damage:1 } },
    beamd:    { name:'Beam Drone I',          kind:'attack',   power:2, cost:50, rate:6.5, shot:{ type:'beam', damage:1, rooms:2 } },
    iond:     { name:'Ion Drone',             kind:'attack',   power:2, cost:45, rate:5,   shot:{ type:'ion', damage:1 } },
    defense1: { name:'Defense Drone I',       kind:'defense',  power:2, cost:50, rate:2.6, targets:['missile','hack','bdrone'] },
    defense2: { name:'Defense Drone II',      kind:'defense',  power:3, cost:70, rate:2.2, targets:['missile','hack','bdrone','laser','ion','flak','asteroid'] },
    antidrone:{ name:'Anti-Drone Drone',      kind:'anti',     power:2, cost:40, rate:4 },
    repair:   { name:'System Repair Drone',   kind:'internal', role:'repair', power:1, cost:30 },
    antip:    { name:'Anti-Personnel Drone',  kind:'internal', role:'fight',  power:2, cost:40 },
    boarding: { name:'Boarding Drone',        kind:'boarding', power:3, cost:55 },
    hullrep:  { name:'Hull Repair Drone',     kind:'hull',     power:1, cost:40, heal:4, desc:'Use out of combat. Repairs 4 hull per drone part.' }
  },

  augments: {
    scrapArm:     { name:'Scrapture Arm',          cost:50, desc:'Collect 10% more scrap.' },
    reloader:     { name:'Brisk Reloader',         cost:50, desc:'Weapons charge 10% faster.' },
    booster:      { name:'Shield Kettle',          cost:55, desc:'Shield layers recharge 15% faster.' },
    preigniter:   { name:'Warm-Up Coils',          cost:90, desc:'Weapons start every fight fully charged.' },
    scanners:     { name:'Nosy Neighbour Array',   cost:40, desc:'See ships and hazards at every beacon on the map.' },
    replicator:   { name:'Two-For-One Printer',    cost:55, desc:'33% chance a missile or drone part is not used up.' },
    recovery:     { name:'Drone Fetching Claw',    cost:60, desc:'Deploying drones costs no drone parts.' },
    voltanShield: { name:'Thrumm Super Shield',    cost:85, desc:'A 5-point super shield that blocks anything at the start of every fight.' },
    stealth:      { name:'Stealth Plating',        cost:45, desc:'+5% evasion.' },
    casing:       { name:'Bubble-Wrap Casing',     cost:60, desc:'15% chance to shrug off system damage.' },
    dna:          { name:'Spare Crew Gene Vault',  cost:50, desc:'Keeps a fresh copy of everyone aboard. Crew killed in a fight are cloned back once it ends, slightly damp.' },
    pheromones:   { name:'Jabbit Pheromones',     cost:40, desc:'Crew move 25% faster.' },
    gel:          { name:'Mullock Repair Gel',       cost:40, desc:'Your crew slowly heal anywhere.' },
    fireSup:      { name:'Sprinkler Ceiling',      cost:45, desc:'Crew put out fires twice as fast.' },
    rockPlating:  { name:'Pebblekin Plating',      cost:45, desc:'Halves the chance of hull breaches.' },
    ionField:     { name:'Ion Brolly',             cost:50, desc:'20% chance to ignore ion damage.' }
  },

  ships: {
    pestrel:  { name:'The Plucky', layout:'A', cls:'Commonwealth Cruiser', color:'#ffb547', pattern:'TABAN', hull:30, reactor:8, fuel:16, missiles:8, parts:2,
      desc:'Annoyingly reliable. The classic start.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter','cloaking'], weapons:['bust1','arty'], drones:[], crew:['human','human','human'] },
    redtale:  { name:'The Red Herring', layout:'B', cls:'Commonwealth Cruiser', color:'#ff7b5a', pattern:'TBAAN', hull:30, reactor:8, fuel:16, missiles:3, parts:2,
      desc:'Four basic lasers and a story to tell. Lots of shots, little bite.', systems:{ shields:2, engines:2, oxygen:1, weapons:4, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['basic','basic','basic','basic'], crew:['human','human','human','human'], unlock:{ win:'pestrel' } },
    taurus:   { name:'The Spanner in the Works', layout:'A', cls:'Tinkari Cruiser', color:'#5fd3e6', pattern:'TBACN', hull:30, reactor:8, fuel:16, missiles:3, parts:15,
      desc:'Bull-headed ion fire backed by a combat drone.', systems:{ shields:2, engines:2, oxygen:1, weapons:2, drones:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['teleporter','hacking'], weapons:['ion'], drones:['combat1'], crew:['enjinn','enjinn','human'], unlock:{ sector:3 } },
    bortex:   { name:'The Remote Control', layout:'B', cls:'Tinkari Cruiser', color:'#8fc1ff', pattern:'TBBCN', hull:30, reactor:9, fuel:16, missiles:0, parts:20,
      desc:'All drones, no fuss. Very remote.', systems:{ shields:2, engines:2, oxygen:1, weapons:1, drones:6, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['teleporter'], weapons:['heavy1'], drones:['combat1','beamd'], crew:['enjinn','enjinn','enjinn'], unlock:{ kills:25 } },
    stone:    { name:'The Rolling Stone', layout:'A', cls:'Pebblekin Cruiser', color:'#c9a27e', pattern:'TABAN', hull:30, reactor:8, fuel:14, missiles:10, parts:2,
      desc:'Gathers no moss. Takes a beating, dishes out missiles.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:2 },
      reserve:['drones','teleporter'], weapons:['heavy1','arty'], crew:['pebblekin','pebblekin','human'], unlock:{ sector:4 } },
    rockbottom:{ name:'The Rock Bottom', layout:'B', cls:'Pebblekin Cruiser', color:'#a88c74', pattern:'TBACN', hull:35, reactor:8, fuel:14, missiles:12, parts:2,
      desc:'Set things on fire and stand in the flames. You are fireproof.', systems:{ shields:2, engines:1, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:2 },
      reserve:['drones','teleporter'], weapons:['firebomb','arty'], crew:['pebblekin','pebblekin','pebblekin'], unlock:{ ach:'firestarter' } },
    zap:      { name:'The Zapjudicator', layout:'A', cls:'Thrumm Cruiser', color:'#ffe27a', pattern:'TABCN', hull:28, reactor:8, fuel:16, missiles:3, parts:2,
      desc:'Thrumm shield up front, ion fire behind it.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['ion','bust1'], augments:['voltanShield'], crew:['voltan','voltan','human'], unlock:{ sector:5 } },
    voltface: { name:'The Volt Face', layout:'B', cls:'Thrumm Cruiser', color:'#fff0a8', pattern:'TBACN', hull:26, reactor:7, fuel:16, missiles:0, parts:4,
      desc:'Changed its mind about lasers. Beams and pure Thrumm power.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['pike','ion'], augments:['voltanShield'], crew:['voltan','voltan','voltan'], unlock:{ ach:'augs3' } },
    slime:    { name:'The Slime of War', layout:'A', cls:'Mullock Cruiser', color:'#9fdc7a', pattern:'TBAAN', hull:30, reactor:9, fuel:16, missiles:8, parts:4,
      desc:'Hacks your shields, then cooks your crew.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, hacking:1, medbay:1, piloting:1, sensors:2, doors:1 },
      reserve:['drones','teleporter'], weapons:['biobeam','arty'], crew:['sloog','sloog','human'], unlock:{ ach:'boardkill' } },
    gastropod:{ name:'The Gastropod', layout:'B', cls:'Mullock Cruiser', color:'#c2f08a', pattern:'TBACN', hull:30, reactor:9, fuel:16, missiles:4, parts:2,
      desc:'Slow, sticky and in your head. Comes with mind control.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, mindcontrol:1, clonebay:1, piloting:1, sensors:2, doors:1 },
      reserve:['drones','teleporter'], weapons:['bust1','lego'], crew:['sloog','sloog','sloog'], unlock:{ win:'slime' } },
    mantlis:  { name:'The Preying Jabbit', layout:'A', cls:'Jabbit Cruiser', color:'#c6e05a', pattern:'TBAAN', hull:30, reactor:9, fuel:16, missiles:2, parts:2,
      desc:'Teleport in, start swinging. Questions later.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, teleporter:1, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones'], weapons:['bust1','basic'], crew:['mantlis','mantlis','mantlis','human'], unlock:{ ach:'mind' } },
    basilisk: { name:'The Elbow Room', layout:'B', cls:'Jabbit Cruiser', color:'#9fcf3f', pattern:'TBBAN', hull:30, reactor:10, fuel:16, missiles:2, parts:2,
      desc:'A herb-scented terror. Big teleporter, mind control, one heavy laser.', systems:{ shields:2, engines:2, oxygen:1, weapons:1, teleporter:2, mindcontrol:1, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones'], weapons:['heavy1'], crew:['mantlis','mantlis','mantlis','mantlis'], unlock:{ win:'mantlis' } },
    peekaboo: { name:'The Peekaboo', layout:'A', cls:'Stealth Cruiser', color:'#a9b4d0', pattern:'TBACN', hull:30, reactor:8, fuel:16, missiles:6, parts:2,
      desc:'No shields. Very good at not being there.', systems:{ engines:2, oxygen:1, weapons:4, cloaking:1, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['shields','drones','teleporter'], weapons:['duel','smallbomb'], crew:['human','human','human'], unlock:{ sector:6 } },
    nowyoudont:{ name:"The Now-You-Don't", layout:'B', cls:'Stealth Cruiser', color:'#c8d0e6', pattern:'TBABN', hull:30, reactor:9, fuel:16, missiles:0, parts:2,
      desc:'One enormous beam and a battery to feed it.', systems:{ engines:2, oxygen:1, weapons:4, cloaking:2, battery:1, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['shields','drones'], weapons:['glaive'], crew:['human','human','human'], unlock:{ win:'peekaboo' } }
  },

  enemies: {
    rebuff_scout:   { name:'Mandate Scout',      tags:['rebuff'], hull:8,  sectors:[1,3], systems:{ engines:1, weapons:1, oxygen:1, piloting:1, doors:1 }, weapons:['basic'], crew:['human','human'] },
    rebuff_fighter: { name:'Mandate Fighter',    tags:['rebuff'], hull:10, sectors:[1,8], systems:{ shields:2, engines:2, weapons:2, oxygen:1, medbay:1, piloting:1, sensors:1, doors:1 }, weapons:['basic','basic'], crew:['human','human','human'] },
    rebuff_cloaker: { name:'Mandate Shade',      tags:['rebuff'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:3, cloaking:1, oxygen:1, piloting:1, doors:1 }, weapons:['bust1','arty'], crew:['human','human','human'] },
    rebuff_elite:   { name:'Mandate Enforcer',   tags:['rebuff'], hull:14, sectors:[5,8], systems:{ shields:4, engines:2, weapons:4, teleporter:1, oxygen:1, medbay:1, piloting:1, sensors:1, doors:2 }, weapons:['bust2','heavy1'], crew:['human','human','mantlis','pebblekin'] },
    pyrate_gunship: { name:'Pyrate Gunship',    tags:['pyrate'], hull:11, sectors:[1,8], systems:{ shields:2, engines:2, weapons:3, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['basic','arty'], crew:['human','sloog','mantlis'] },
    pyrate_bomber:  { name:'Pyrate Boom-barge', tags:['pyrate'], hull:11, sectors:[2,8], systems:{ shields:2, engines:1, weapons:3, oxygen:1, piloting:1, doors:1 }, weapons:['firebomb','basic'], crew:['human','pebblekin','human'] },
    auto_scoundrel: { name:'Auto-Scoundrel',    tags:['auto','enjinn'], auto:true, hull:9, sectors:[1,8], systems:{ shields:2, engines:2, weapons:3, drones:2, piloting:1 }, weapons:['basic','lego'], drones:['combat1'], crew:[] },
    auto_assault:   { name:'Auto-Assaulter',    tags:['auto','rebuff'], auto:true, hull:12, sectors:[4,8], systems:{ shields:4, engines:2, weapons:4, drones:4, piloting:1 }, weapons:['bust1','hermies'], drones:['defense1'], crew:[] },
    mantlis_raider: { name:'Jabbit Raider',    tags:['mantlis'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:2, teleporter:2, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['basic','lego'], crew:['mantlis','mantlis','mantlis','mantlis'] },
    voltan_peace:   { name:'Thrumm Peacemonger',tags:['voltan'], hull:10, sectors:[3,8], super:4, systems:{ shields:2, engines:3, weapons:3, oxygen:1, piloting:1, doors:1 }, weapons:['ion','pike'], crew:['voltan','voltan','voltan'] },
    pebble_brute:   { name:'Pebblekin Brute',   tags:['pebblekin'], hull:14, sectors:[2,8], systems:{ shields:2, engines:1, weapons:3, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['heavy1','arty'], crew:['pebblekin','pebblekin','pebblekin'] },
    sloog_hacker:   { name:'Mullock Interloper',  tags:['sloog'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:3, hacking:2, oxygen:1, piloting:1, sensors:2, doors:1 }, weapons:['biobeam','basic'], crew:['sloog','sloog','sloog'] },
    sloog_mind:     { name:'Mullock Puppeteer',   tags:['sloog'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:2, mindcontrol:2, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['bust1'], crew:['sloog','sloog','human'] },
    enjinn_carrier: { name:'Tinkari Dronecarrier',tags:['enjinn'], hull:11, sectors:[3,8], systems:{ shields:2, engines:2, weapons:1, drones:5, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['ion'], drones:['combat1','defense1'], crew:['enjinn','enjinn','enjinn'] },
    flaggship:      { name:'The Dreadnought', boss:true, color:'#ff5a7a', hull:24, pattern:'TBBABBAN', sectors:[99,99],
      systems:{ shields:4, engines:2, weapons:8, drones:6, teleporter:2, oxygen:2, medbay:2, piloting:2, sensors:2, doors:3 },
      weapons:['bust2','heavy2','hermies','ion2'], drones:[], crew:['pebblekin','pebblekin','human','human','human','mantlis'],
      phases:[
        { name:'Phase 1: Boarders', hull:22, weapons:['bust2','heavy2','hermies','ion2'], drones:[], board:true },
        { name:'Phase 2: Drones and Super Shield', hull:22, weapons:['bust2','ion2'], drones:['combat2','defense1','beamd'], super:8, superRegen:6 },
        { name:'Phase 3: Power Surge', hull:22, weapons:['bust2','heavy2','flak1'], drones:['defense1'], surge:26 } ] }
  },

  sectors: {
    civilian:  { name:'Civilian Sector', blurb:'Traders, travellers and the odd pyrate. A gentle place to find your feet.',      color:'#7be0a0', mix:{ event:46, combat:40, empty:14 }, tags:[],          enemyTags:[],            hazards:{ asteroid:.06, sun:.05, ionstorm:.04, pulsar:.02 }, nebula:0 },
    rebuff:    { name:'Mandate Stronghold', blurb:'Mandate territory. More warships, tougher fights, better salvage.',    color:'#ff5a7a', mix:{ event:32, combat:56, empty:12 }, tags:['rebuff'],  enemyTags:['rebuff'],    hazards:{ asteroid:.06, sun:.06, ionstorm:.05, pulsar:.03 }, nebula:.05 },
    pyrate:    { name:'Pyrate Haven', blurb:'Pyrate gangs, black markets and deals too good to be true.',         color:'#ffd166', mix:{ event:42, combat:48, empty:10 },  tags:['pyrate'],  enemyTags:['pyrate'],    hazards:{ asteroid:.1,  sun:.05 }, nebula:0 },
    nebula:    { name:'Uncharted Nebula', blurb:'Thick gas hides you from the fleet, and hides everything from you.',     color:'#8b6fd6', mix:{ event:48, combat:36, empty:16 }, tags:['nebula'],  enemyTags:[],            hazards:{ ionstorm:.08 }, nebula:.85, fleetMult:.6 },
    sloog:     { name:'Mullock Nebula', blurb:'A slow, damp nebula. The Mullock are friendlier than they smell.',         color:'#9fdc7a', mix:{ event:46, combat:42, empty:12 }, tags:['sloog','nebula'], enemyTags:['sloog'], hazards:{ ionstorm:.06 }, nebula:.7, fleetMult:.6 },
    pebblekin: { name:'Pebblekin Homeworlds', blurb:'Rocky homeworlds ringed by asteroid fields.', color:'#c9a27e', mix:{ event:46, combat:44, empty:10 }, tags:['pebblekin'], enemyTags:['pebblekin'], hazards:{ asteroid:.16, sun:.04 }, nebula:0 },
    enjinn:    { name:'Tinkari Controlled', blurb:'Tinkari traders and the automated ships that guard them.',    color:'#5fd3e6', mix:{ event:46, combat:44, empty:10 }, tags:['enjinn'],  enemyTags:['enjinn','auto'], hazards:{ asteroid:.06, pulsar:.04 }, nebula:0 },
    voltan:    { name:'Thrumm Homeworlds', blurb:'Thrumm worlds crackling with pulsars and strange machines.',    color:'#ffe27a', mix:{ event:48, combat:42, empty:10 }, tags:['voltan'],  enemyTags:['voltan'],    hazards:{ pulsar:.08, sun:.05 }, nebula:0 },
    mantlis:   { name:'Jabbit Hives', blurb:'Hive space. Jabbit raiders board first and ask never.',        color:'#c6e05a', mix:{ event:36, combat:54, empty:10 }, tags:['mantlis'], enemyTags:['mantlis'],   hazards:{ asteroid:.06, sun:.06 }, nebula:0 },
    laststand: { name:'The Last Stand', blurb:"The Dreadnought's final push on Commonwealth command.",       color:'#ff5a7a', final:true, mix:{ event:30, combat:58, empty:12 }, tags:['rebuff'], enemyTags:['rebuff'], hazards:{ asteroid:.05, sun:.05 }, nebula:0, fleetMult:.5 }
  },

  events: {
    derelict:{ text:'A gutted freighter tumbles past, cargo doors flapping like a cardigan in the wind. The reactor is still glowing, which is either a good sign or the last sign.', choices:[
      { text:'Send a team over to have a rummage.', chance:.6, success:{ text:'The team comes back with salvage, a crate of missile casings and somebody else\'s lunchbox.', scrap:22, missiles:2 }, fail:{ text:'A booby-trapped coupling goes off as they leave. The team is fine. Your hull has opinions.', hull:-3, scrap:8 } },
      { text:'Have your Tinkari trace the live circuits first.', req:{ race:'enjinn' }, effect:{ text:'Your Tinkari spend all three wishes on not exploding. You strip the ship clean.', scrap:30, fuel:2 } },
      { text:'Leave it alone.', effect:{ text:'You give it a wide berth and a respectful nod.' } } ] },
    distress:{ distress:true, text:'A distress call, on a loop: "Life support failing. Anyone. Please." Then, quieter: "Not you, Gary."', choices:[
      { text:'Answer the call.', chance:.55, success:{ text:'A lone survivor tumbles aboard, hugs the nearest crew member, and asks where the kettle is. They\'ll fit right in.', crew:'random' }, fail:{ text:'It was bait. A ship drops its cloak off your bow, looking very pleased with itself.', fight:'random' } },
      { text:'Keep moving.', effect:{ text:'The call fades behind you. Nobody mentions it. Everybody thinks about it.' } } ] },
    fueltrader:{ text:'A tanker captain hails you, chewing something. "Fuel for scrap, fair and simple. Four cells, twenty scrap. I\'m not fuelling around. Sorry. I say that to everyone."', choices:[
      { text:'Buy four fuel cells.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'The cells transfer cleanly. The captain throws in a pine air freshener, for some reason.', fuel:4 } },
      { text:'Sell two fuel cells for fifteen scrap.', req:{ fuel:3 }, cost:{ fuel:2 }, effect:{ text:'The captain pays without haggling, which makes you think you undercharged.', scrap:15 } },
      { text:'Decline.', effect:{ text:'"Your loss, pal," says the captain, and cuts the channel mid-chew.' } } ] },
    miners:{ text:'Asteroid miners are trapped under a rockslide. "Help! We\'re between a rock and a hard place!" A pause. "Dave says that\'s not funny in the circumstances."', choices:[
      { text:'Give them two missiles to blast it clear.', req:{ missiles:2 }, cost:{ missiles:2 }, effect:{ text:'Two missiles, one very loud noise, and the miners are free. They load your hold with ore and offer to name a crater after you.', scrap:32 } },
      { text:'Ask your Pebblekin to talk to the rocks.', req:{ race:'pebblekin' }, effect:{ text:'A long, low conversation follows. The rocks shuffle aside, muttering. The miners pay well and try not to think about it.', scrap:28, fuel:1 } },
      { text:'You cannot spare anything.', effect:{ text:'You leave them to dig. They\'re miners. It\'s literally the job.' } } ] },
    toll:{ tags:['pyrate',''], text:'Three Pyrate gunships block the beacon. "Toll\'s twenty-five scrap. Pay up, or walk the plank. Into space. Without a suit. We\'re not doing a suit."', choices:[
      { text:'Pay the toll.', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'They wave you through and give you a receipt. A pyrate receipt. It just says "ta."' } },
      { text:'Outrun them on full engines.', req:{ system:'engines', level:4 }, effect:{ text:'Your engines scream, and so do the pyrates, though for different reasons.', fuel:-1 } },
      { text:'Slip past under cloak.', req:{ system:'cloaking', level:1 }, effect:{ text:'You vanish. Behind you, the pyrates start arguing about whose turn it was to watch.' } },
      { text:'Refuse and fight.', effect:{ text:'One gunship peels off to deal with you.', fight:'pyrate_gunship' } } ] },
    storm:{ text:'An ion storm is boiling across the beacon, and inside it, glittering like pound coins down the back of a sofa, is scrap from old wrecks.', choices:[
      { text:'Dive in and grab what you can.', chance:.6, success:{ text:'You haul in a full net of salvage before the storm closes. Nobody\'s hair will ever lie flat again.', scrap:28 }, fail:{ text:'Lightning arcs through the hull. Several crew discover they now have strong views on rubber-soled shoes.', hull:-4, scrap:10 } },
      { text:'Burn extra fuel to go around.', req:{ fuel:2 }, cost:{ fuel:1 }, effect:{ text:'You go round. It takes longer. It always takes longer. Nobody died, though.' } },
      { text:'Let your Thrumm drink the lightning.', req:{ race:'voltan' }, effect:{ text:'Your Thrumm stands in the airlock and drinks the lightning like a pint after a long shift. The salvage is yours.', scrap:32 } } ] },
    pod:{ distress:true, text:'An escape pod drifts past. Through the frosted window, someone is waving with both arms and mouthing what looks like "OH THANK GOD."', choices:[
      { text:'Bring the pod aboard.', effect:{ text:'The survivor thanks you, asks for a job and, unprompted, does the washing-up. Pod-ner for life.', crew:'random' } },
      { text:'Tow it toward the nearest station.', effect:{ text:'You nudge the pod towards the nearest station. A small reward arrives, along with a thank-you card that\'s a bit damp.', scrap:12 } } ] },
    cache:{ text:'A sealed weapons locker floats among the debris of an old battle. Its lock is still blinking red, the way a smoke alarm does when it wants you to know it\'s disappointed.', choices:[
      { text:'Cut it open.', chance:.5, success:{ text:'Inside, packed in foam like a posh mobile phone, is a working weapon.', weapon:'random' }, fail:{ text:'The locker was rigged. An Auto-Scoundrel wakes up, stretches, and opens fire.', fight:'auto_scoundrel' } },
      { text:'Let your Pebblekin crack it by hand.', req:{ race:'pebblekin' }, effect:{ text:'Stone fingers crush the lock before the trap has a chance to have a go.', weapon:'random' } },
      { text:'Leave it.', effect:{ text:'Some things stay sealed for a reason. Usually the reason is a bomb.' } } ] },
    smuggler:{ text:'A Mullock smuggler slides up, leaving a little trail. "Got something with real bite, mate. Forty scrap. No questions. Especially that one you\'re thinking."', choices:[
      { text:'Pay forty scrap.', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'The crate is exactly what was promised, which surprises everyone, including the smuggler.', weapon:'random' } },
      { text:'Use your own Mullock to read the smuggler\'s mind first.', req:{ race:'sloog' }, effect:{ text:'Your Mullock stares at the smuggler for a long moment. The smuggler sweats. The good stuff comes out from under the counter, at half price, with a drone thrown in to make it all go away.', scrap:-20, drone:'random' } },
      { text:'No deal.', effect:{ text:'The smuggler leaves a faint trail of disappointment. And of the other thing.' } } ] },
    comet:{ text:'A comet streaks through the system, shedding ice, volatile gas, and the occasional frozen pigeon.', choices:[
      { text:'Skim its tail for fuel.', chance:.75, success:{ text:'The scoops fill with usable fuel. And one frozen pigeon. Don\'t ask about the pigeon.', fuel:3 }, fail:{ text:'A chunk of ice slams into the hull. Cool. Literally. Sorry.', hull:-2, fuel:1 } },
      { text:'Just watch it pass.', effect:{ text:'The crew gathers at the viewports with mugs of tea. It\'s lovely. Morale improves. Morale is not a stat, but it should be.' } } ] },
    ghost:{ text:'A signal repeats one set of coordinates, over and over, in a language nobody aboard speaks. It sounds faintly like someone reading out a shopping list.', choices:[
      { text:'Hold position behind strong shields and listen.', req:{ system:'shields', level:4 }, effect:{ text:'Whatever was out there prods your shields for a bit, gets bored, and leaves something behind, like a cat with a mouse.', scrap:35, augment:'random' } },
      { text:'Follow the coordinate.', chance:.5, success:{ text:'The coordinates lead to an abandoned depot full of spare parts and a single, very old biscuit.', scrap:20, missiles:2, parts:2 }, fail:{ text:'The coordinates lead straight into a minefield. Whoever sent it has a dark sense of humour.', hull:-5 } },
      { text:'Ignore it.', effect:{ text:'You log the signal under "Things We Don\'t Talk About" and move on.' } } ] },
    dock:{ text:'A Mullock repair dock floats here, tended by slow, patient, slightly moist hands. "Stay a while, love. Let us goo-p you up."', choices:[
      { text:'Accept repairs.', effect:{ text:'Your hull is patched with something warm and alarmingly alive. It seems happy there. You decide not to ask.', hull:8 } },
      { text:'Politely refuse.', effect:{ text:'The Mullock look hurt. Slowly. Very slowly. You can still see them looking hurt three jumps later.' } } ] },
    fedscout:{ minSector:2, text:'A Commonwealth scout pulls alongside. "Morning! Thought I\'d say: the Mandate Fleet\'s right behind you. Like, right behind. Here, take this. Godspeed and all that."', choices:[
      { text:'Accept the supplies.', effect:{ text:'They hand over fuel, missiles, and a salute that\'s slightly too pleased with itself.', fuel:3, missiles:2, parts:1 } } ] },
    deserter:{ minSector:2, text:'A Mandate deserter wants out. "Take me with you. I know how they fight. I also know where they keep the good biscuits."', choices:[
      { text:'Welcome aboard.', effect:{ text:'The deserter joins your crew, takes off their perfectly pressed uniform, and immediately spills tea down the new one. They seem happier already.', crew:'human', scrap:10 } },
      { text:'Could be a trap. Refuse.', effect:{ text:'They sigh, salute out of habit, and drift away.' } } ] },
    quiet:{ weight:.5, text:'The beacon is silent. Stars, dust, and the hum of your own engines. Somebody puts the kettle on.', choices:[
      { text:'Continue.', effect:{ text:'You use the calm to run diagnostics. Everything is fine. Suspiciously fine.' } } ] },
    merchant:{ weight:.2, text:'A merchant convoy flashes its open sign. "EVERYTHING MUST GO! Mostly because we\'re being chased."', choices:[
      { text:'Browse their wares.', effect:{ text:'The cargo bay doors slide open.', store:true } },
      { text:'Not today.', effect:{ text:'They wave and keep running. Someone throws a free sample at you. It\'s a scented candle.' } } ] },
    augdealer:{ weight:.7, text:'A twitchy dealer in a long coat offers ship augments "that fell off the back of a cruiser." Fifty scrap. He keeps looking over his shoulder.', choices:[
      { text:'Buy one, no questions.', req:{ scrap:50 }, cost:{ scrap:50 }, effect:{ text:'It slots in with a satisfying clunk. The serial number has been filed off, lovingly.', augment:'random' } },
      { text:'Walk away.', effect:{ text:'"Your loss," says the dealer, and is somehow already gone.' } } ] },
    droneyard:{ text:'A derelict drone factory is still humming away to itself. Its assembly arms twitch hopefully as you approach, like a dog that\'s heard the lead.', choices:[
      { text:'Salvage the parts bins.', chance:.65, success:{ text:'You fill a crate with drone parts. The factory watches, sadly, as you take its babies.', parts:5 }, fail:{ text:'The factory\'s guard drones wake up, and they are not morning people.', fight:'auto_scoundrel' } },
      { text:'Let your Tinkari sweet-talk the factory computer.', req:{ race:'enjinn' }, effect:{ text:'Your Tinkari has a lovely chat with the factory computer. The factory builds you a present, wraps it, and asks you to visit more often.', drone:'random', parts:3 } },
      { text:'Leave it be.', effect:{ text:'The arms wave goodbye. All of them. At once. Creepily.' } } ] },
    colony:{ distress:true, text:'A colony at a nearby beacon is being raided. They beg for help and promise a reward, "and a cream tea, if the café\'s still standing."', choices:[
      { text:'Mark it on the map and promise to come.', effect:{ text:'You promise to come. The beacon is marked as a quest on your map.', quest:'colony_saved' } },
      { text:'You cannot risk it.', effect:{ text:'The channel goes quiet. You feel about two inches tall.' } } ] },
    colony_saved:{ questOnly:true, text:'The colony is still holding out, just. A Pyrate gunship circles it like a shark round a paddling pool.', choices:[
      { text:'Drive them off.', effect:{ text:'You move to engage.', fight:'pyrate_gunship', afterWin:{ text:'The colonists load you up, the café is still standing, and the cream tea is excellent. One of them asks to come with you.', scrap:40, crew:'random' } } } ] },
    weevils:{ text:'A derelict is crawling with Space Weevils, each the size of a Labrador and twice as hungry.', choices:[
      { text:'Send a team to grab the cargo.', chance:.55, success:{ text:'Your team comes back with a full crate and a few new holes in their jumpers.', scrap:30 }, fail:{ text:'The weevils win. Your crew retreat, minus one. The weevils are still hungry.', crewLoss:1 } },
      { text:'Send your Jabbit. They have been bored lately.', req:{ race:'mantlis' }, effect:{ text:'There are no more weevils. There is a lot of cargo. Your Jabbit comes back humming.', scrap:45, weapon:'random' } },
      { text:'Nope.', effect:{ text:'Wise. Very wise. Weevils are not worth it.' } } ] },
    station:{ text:'An abandoned research station drifts here. A sticky note on the airlock says "BACK IN 5 MINS." It\'s been about nine years. One module still has its experimental system intact.', choices:[
      { text:'Strip the module.', effect:{ text:'You haul the system aboard and find a room for it, which involves moving a lot of boxes.', install:'random' } },
      { text:'Take the spare scrap instead.', effect:{ text:'Practical choice. Your mum would be proud.', scrap:30 } } ] },
    lostenjinn:{ tags:['enjinn',''], text:'A lone Tinkari mechanic floats outside an airlock, still fixing a ship that is no longer there. They seem to be making good progress.', choices:[
      { text:'Offer a job.', effect:{ text:'"Oh, thank goodness. Something to fix." They join your crew and immediately sort out the dripping tap.', crew:'enjinn' } },
      { text:'Leave them to it.', effect:{ text:'They wave a spanner as you go, then go back to fixing the void.' } } ] },
    casino:{ tags:['pyrate',''], text:'A Pyrate casino blinks inside a hollowed-out asteroid. The sign says "DOUBLE YOUR SCRAP!" and, in smaller letters, "PROBABLY."', choices:[
      { text:'Bet twenty scrap.', req:{ scrap:20 }, cost:{ scrap:20 }, chance:.45, success:{ text:'Jackpot! Mostly! The croupier looks annoyed and counts it out very slowly.', scrap:50 }, fail:{ text:'The house always wins. The house is also armed, and has a bouncer called Big Kev.' } },
      { text:'Have your Mullock count the cards.', req:{ race:'sloog' }, effect:{ text:'You leave rich and permanently banned. Your photo goes up behind the bar, next to a Mullock from last year.', scrap:45 } },
      { text:'Keep your scrap.', effect:{ text:'A rare act of wisdom. Write it down.' } } ] },
    relay:{ text:'A Commonwealth relay station is damaged. Its operator, in a dressing gown, asks if you can help. "It\'s been like this for three weeks. I\'ve put in a ticket."', choices:[
      { text:'Spend two drone parts on repairs.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'The relay comes back online. The operator cries a bit, then shares their fuel.', fuel:4 } },
      { text:'Send your Tinkari to fix it by hand.', req:{ race:'enjinn' }, effect:{ text:'Your Tinkari fixes it in about four minutes, while humming. The operator pays in fuel, gratitude and a packet of custard creams.', fuel:4, scrap:15 } },
      { text:'You have your own problems.', effect:{ text:'You jump on. The operator closes the ticket themselves, out of spite.' } } ] },
    refugees:{ distress:true, text:'A refugee ship is out of fuel and drifting slowly towards a star. Someone aboard is holding up a sign that says "HELP" in very neat handwriting.', choices:[
      { text:'Give them two fuel cells.', req:{ fuel:3 }, cost:{ fuel:2 }, effect:{ text:'They thank you, and one of them insists on joining, "to make it even."', crew:'random' } },
      { text:'You cannot spare the fuel.', effect:{ text:'You tell yourself someone else will come. You tell yourself that a few times.' } } ] },
    checkpoint:{ tags:['rebuff','laststand'], text:'A Mandate checkpoint demands your ID. Your ID, which you made yourself, says "Definitely Not a Courier." The officer looks at it for a very long time.', choices:[
      { text:'Pay a fifteen scrap "processing fee".', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'They process you right through and give you a leaflet on the Mandate\'s commitment to transparency.' } },
      { text:'Sneak past under cloak.', req:{ system:'cloaking', level:1 }, effect:{ text:'You ghost past the checkpoint. Somewhere behind you, a form goes unfilled.' } },
      { text:'Blast your way through.', effect:{ text:'The checkpoint guard ship scrambles. Somebody is going to have to write a report about this.', fight:'rebuff_fighter' } } ] },
    monks:{ tags:['pebblekin'], text:'Pebblekin monks are meditating on a slowly spinning asteroid. One of them opens an eye. Eventually. Over the course of about an hour.', choices:[
      { text:'Ask for their blessing.', effect:{ text:'The monks bless your hull. It is now slightly harder. So are you, spiritually.', augment:'rockPlating' } },
      { text:'Ask your Pebblekin to stay and talk.', req:{ race:'pebblekin' }, effect:{ text:'After a long, slow conversation, one monk decides to come with you. They will tell you why by about sector 8.', crew:'pebblekin', scrap:10 } } ] },
    genie:{ tags:['enjinn'], text:'A Tinkari genie pops out of a toolbox and offers you three wishes. Unfortunately, they are all about engines.', choices:[
      { text:'Wish for better engines.', effect:{ text:'Your engines now purr like a much more expensive ship. The kind with heated seats.', upgrade:'engines' } },
      { text:'Wish for drone parts.', effect:{ text:'Drone parts rain down from nowhere. Some are still warm. Best not to think about whose they were.', parts:6 } },
      { text:'Wish for hull repairs.', effect:{ text:'Done before you finish the sentence. The genie looks smug about it.', hull:10 } } ] },
    voltanmonks:{ tags:['voltan'], text:'Thrumm monks hum at you from a glowing temple. They offer to bless your shields with pure energy, for a small donation. There\'s a card reader.', choices:[
      { text:'Donate thirty scrap.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'Your shield generator hums a new note. It\'s quite a nice one.', upgrade:'shields' } },
      { text:'Let your Thrumm ask nicely.', req:{ race:'voltan' }, effect:{ text:'They bless your shields for free. Family discount. Your Thrumm goes a bit pink.', upgrade:'shields' } },
      { text:'No thanks.', effect:{ text:'They hum disapprovingly. It\'s in a minor key.' } } ] },
    sloogscam:{ tags:['sloog','nebula'], text:'A Mullock offers you a "once in a lifetime" deal on a premium weapon. Thirty scrap, up front, cash only, "and don\'t tell my mum."', choices:[
      { text:'Pay up.', req:{ scrap:30 }, cost:{ scrap:30 }, chance:.3, success:{ text:'Shockingly, it\'s real. The Mullock looks more surprised than you are.', weapon:'random' }, fail:{ text:'The crate contains a smaller crate. That one contains a note that says "lol."' } },
      { text:'Your Mullock reads their mind and turns the tables.', req:{ race:'sloog' }, effect:{ text:'Your Mullock and theirs have a silent, terrible staring match. The scammer pays you to go away and leaves the sector.', scrap:25 } },
      { text:'Not a chance.', effect:{ text:'The Mullock slides off to find someone more gullible. There\'s always someone.' } } ] },
    warparty:{ tags:['mantlis'], text:'A Jabbit war party hails you. "FIGHT?" You hesitate. "FIGHT? PLEASE? WE\'VE BEEN SO BORED."', choices:[
      { text:'Give them a fight.', effect:{ text:'They whoop with joy and open fire. You\'ve made their week.', fight:'mantlis_raider', afterWin:{ text:'The survivors salute you with every limb they\'ve got left, and send over a thank-you gift.', scrap:25 } } },
      { text:'Bribe them with twenty-five scrap.', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'They take the scrap and look disappointed, like a dog that\'s been given a biscuit instead of a walk.' } },
      { text:'Offer a duel with your own Jabbit.', req:{ race:'mantlis' }, effect:{ text:'Your Jabbit wins in a whirl of elbows. The war party cheers, pays tribute, and asks if they can come again next week.', scrap:35, weapon:'random' } } ] },
    duel:{ tags:['pyrate'], text:'A Pyrate captain challenges you to a duel. "Loser walks the airlock! Winner gets the other one\'s hat!" They are wearing a very good hat.', choices:[
      { text:'Accept the duel.', effect:{ text:'Guns out.', fight:'pyrate_gunship', afterWin:{ text:'The captain walks the airlock, very dignified. Their treasure stays. So does the hat.', scrap:35 } } },
      { text:'Decline.', effect:{ text:'"COWARD!" they shout, which you can live with. You\'ve been called worse by your own crew.' } } ] },
    whispers:{ nebula:true, text:'Voices drift through the nebula, whispering coordinates. One of them is definitely your nan\'s, which is worrying, as your nan is in Swindon.', choices:[
      { text:'Follow the voices.', chance:.5, success:{ text:'The voices lead to a perfectly preserved wreck with treasure aboard. Thanks, nan.', augment:'random', scrap:15 }, fail:{ text:'The voices lead you into a pocket of gas, which catches fire. That wasn\'t your nan.', hull:-4, fire:true } },
      { text:'Ignore them.', effect:{ text:'The whispers sulk. You can hear them sulking.' } } ] },
    nebtrader:{ nebula:true, text:'A trader is hiding in the nebula, selling fuel to anyone desperate enough to find them. You are, apparently, that desperate.', choices:[
      { text:'Buy three fuel for fifteen scrap.', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'A fair price, for the middle of nowhere. They throw in a mint.', fuel:3 } },
      { text:'Leave.', effect:{ text:'They disappear back into the mist like a dodgy uncle at a wedding.' } } ] },
    bounty:{ minSector:4, tags:['rebuff','laststand'], text:'A Mandate bounty hunter has your ship\'s face on a WANTED poster. It\'s not a good likeness. They\'ve given you a moustache.', choices:[
      { text:'Fight.', effect:{ text:'The hunter locks weapons and adjusts their very expensive sunglasses.', fight:'rebuff_elite', afterWin:{ text:'The hunter\'s ship had a fat purse of bounty money aboard. You also keep the sunglasses.', scrap:40 } } },
      { text:'Run under cloak.', req:{ system:'cloaking', level:2 }, effect:{ text:'The hunter loses you completely, and has to explain to their boss why they came back with nothing but a poster.' } } ] },
    graveyard:{ text:'A ship graveyard stretches across the beacon. Some of the wrecks are a lot newer than others. One of them still has its hazards on.', choices:[
      { text:'Search the newest wreck.', chance:.6, success:{ text:'There\'s a weapon, still in its rack, still in its plastic.', weapon:'random' }, fail:{ text:'Its owners are still here, and still very cross about the whole thing.', fight:'random' } },
      { text:'Search the oldest wreck.', effect:{ text:'Ancient, dusty, perfectly usable scrap. And a postcard from someone\'s holiday, four hundred years ago.', scrap:20 } } ] },
    lostdrone:{ text:'A lonely little drone pings your ship, over and over, like a lost kid at the supermarket.', choices:[
      { text:'Adopt it.', effect:{ text:'It beeps happily, installs its own blueprint, and follows you everywhere from now on.', drone:'random' } },
      { text:'Shoo it away.', effect:{ text:'It beeps sadly and wanders off. You are a monster.' } } ] },
    repairstation:{ text:'An automated repair station offers hull patching for twenty scrap. A recorded voice says "we value your custom" in a way that suggests it doesn\'t.', choices:[
      { text:'Pay twenty scrap.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Patched, polished and given a little air freshener shaped like a tree.', hull:12 } },
      { text:'Move on.', effect:{ text:'The station beeps "come again." You won\'t.' } } ] },
    sunflare:{ text:'You\'ve jumped in a bit close to a sun. The hull creaks. Somebody says "it\'s warm in here, isn\'t it" and gets a look.', choices:[
      { text:'Pull away fast.', chance:.6, success:{ text:'You pull away and escape the worst of it. Everyone gets a slight tan.', hull:-1 }, fail:{ text:'A flare catches you. Something is on fire. Something is always on fire.', hull:-2, fire:true } } ] },
    crewswap:{ text:'A Commonwealth transport asks if you can spare one crew member for a "vital mission". They won\'t say what it is. They offer good money and refuse to make eye contact.', choices:[
      { text:'Send someone. (lose 1 crew)', req:{ crewCount:3 }, effect:{ text:'Your crew member salutes and leaves. The pay is good. You wonder, often, what the mission was.', crewLoss:1, scrap:40 } },
      { text:'Refuse.', effect:{ text:'They understand. They make a note of it, though.' } } ] }
  }
};

const ACHIEVEMENTS = [
  { id:'first_jump',  name:'One Small Jump',        desc:'Make your first jump.' },
  { id:'sector3',     name:'Halfway Hopeful',       desc:'Reach sector 3.' },
  { id:'sector5',     name:'Deep Space Nein',       desc:'Reach sector 5.' },
  { id:'laststand',   name:'Last Stand-up Comedy',  desc:'Reach the Last Stand.' },
  { id:'phase1',      name:'Flag Down',             desc:'Beat the Dreadnought once.' },
  { id:'win',         name:'Vaster Than Life',      desc:'Destroy the Dreadnought for good.' },
  { id:'kills25',     name:'Mandate-erer',           desc:'Defeat 25 ships across all runs.' },
  { id:'boardkill',   name:'Hostile Takeover',      desc:'Win a fight by killing the enemy crew.' },
  { id:'fullcrew',    name:'Full House',            desc:'Have 8 crew at once.' },
  { id:'augs3',       name:'Augmented Reality',     desc:'Hold 3 augments.' },
  { id:'mind',        name:'Mind Over Matter',      desc:'Mind control an enemy.' },
  { id:'firestarter', name:'Fire Starter',          desc:'Have fires in 4 enemy rooms at once.' },
  { id:'missilecmd',  name:'Missile Command',       desc:'Shoot down 10 shots with defense drones in one run.' },
  { id:'hullbreadth', name:"By a Hull's Breadth",   desc:'Win a fight with 3 hull or less.' },
  { id:'surrender',   name:'White Flag Waver',      desc:'Accept an enemy surrender.' },
  { id:'shieldwall',  name:'Shield Wall',           desc:'Reach 4 shield layers.' },
  { id:'rebuffed',    name:'Seen Off',              desc:'Lose a run. It happens to everyone.' },
  { id:'veteran',     name:'Old Soldiers',          desc:'Beat a veteran crew.' },
  { id:'daily',       name:'Daily Driver',          desc:'Finish a daily run, win or lose.' },
  { id:'streak3',     name:'Creature of Habit',     desc:'Fly the daily run three days in a row.' },
  { id:'handson',     name:'Hands-On Captain',      desc:'In VR, fix 10 fires, breaches or machines with your own hands.' },
  { id:'saboteur',    name:'Saboteur',              desc:'In VR, sabotage 5 enemy systems while aboard their ship.' },
  { id:'sidearm',     name:'Captain\'s Sidearm',     desc:'In VR, take down a hostile crew member with your own blaster.' }
];

const DIFFICULTY = {
  easy:   { name:'Easy',   scrap:1.4, pace:.5,  startScrap:20,  enemyHull:-2, evade:10, bossPace:.62, ease:1, fleet:.85, bossShields:-2, patch:3, foeMelee:.7, bossPatch:10, air:.5 },
  normal: { name:'Normal', scrap:1.05, pace:.64, startScrap:5,   enemyHull:-1, bossPace:.8, patch:1 },
  hard:   { name:'Hard',   scrap:.8,  pace:.85, startScrap:-10, enemyHull:2,  evade:-5, bossPace:1 }
};

const EXAMPLE_MOD = {
  name:'Space Pirates Ahoy', version:'2.0', author:'You',
  rules:{ startScrap:60 },
  races:[ { id:'parrot', name:'Squawkling', color:'#ff9de2', hp:90, repair:1.5, combat:1, speed:1.2, desc:'Repeats every order. Repairs fairly fast.' } ],
  weapons:[ { id:'cannon', name:'Broadside Cannon', type:'flak', damage:1, shots:4, charge:15, power:2, cost:70, radius:1 } ],
  drones:[ { id:'parrotdrone', name:'Parrot Drone', kind:'attack', power:2, cost:45, rate:3.5, shot:{ type:'laser', damage:1 } } ],
  augments:[ { id:'eyepatch', name:'Lucky Eyepatch', cost:30, desc:'Purely cosmetic. Arr.' } ],
  ships:[ { id:'jollyroger', name:'The Jolly Rover', cls:'Pirate Galleon', layout:'A', desc:'A pirate ship with a big broadside.', hull:28, reactor:9, color:'#ff9de2', pattern:'TBAAN',
    systems:{ shields:2, engines:2, oxygen:1, weapons:3, drones:2, medbay:1, piloting:1, sensors:1, doors:1 }, weapons:['cannon','arty'], drones:['parrotdrone'],
    crew:['parrot','human','sloog'], fuel:15, missiles:6, parts:6 } ],
  enemies:[ { id:'kraken', name:'Space Kraken Hunter', tags:['pyrate'], hull:15, systems:{ shields:2, engines:2, weapons:3, oxygen:1, piloting:1 }, weapons:['cannon'], crew:['parrot','human'], sectors:[2,8] } ],
  events:[ { id:'treasure', text:'A floating chest marked with an X. Probably fine.', weight:2, choices:[
    { text:'Open it.', chance:0.5, success:{ text:'Doubloons! Well, scrap.', scrap:40 }, fail:{ text:'The chest bites.', hull:-3 } },
    { text:'Ask the Squawkling what it thinks.', req:{ race:'parrot' }, effect:{ text:'It says "open it" eleven times. You do. Treasure!', scrap:45, augment:'eyepatch' } } ] } ]
};
