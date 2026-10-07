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
const UPCOST = { shields:[30,15], engines:[15,10], oxygen:[25,25], weapons:[25,12], drones:[25,12], medbay:[30,25], clonebay:[30,25], teleporter:[40,30],
  cloaking:[50,35], hacking:[40,30], mindcontrol:[40,30], piloting:[20,20], sensors:[25,25], doors:[20,20], battery:[35,30] };
const INSTALL = { drones:60, teleporter:75, cloaking:120, hacking:80, mindcontrol:75, medbay:60, clonebay:65, battery:35, sensors:40, doors:40 };
const SKILLS = ['pilot','engines','shields','weapons','repair','combat'];
const SKILLN = { pilot:'Piloting', engines:'Engines', shields:'Shields', weapons:'Weapons', repair:'Repair', combat:'Combat' };
const SKILLT = { pilot:[60,150], engines:[60,150], shields:[20,50], weapons:[25,60], repair:[15,40], combat:[6,15] };
const NAMES = ['Ash','Bryn','Coll','Dara','Eli','Fen','Gale','Hollis','Ione','Jory','Kit','Lark','Mosi','Noor','Oren','Pell','Quin','Rhea','Sol','Tam',
  'Ude','Vale','Wren','Yara','Zeb','Moss','Pip','Juno','Bex','Cato','Dex','Ezra','Faye','Gus','Halo','Iggy','Jax','Kai','Lumi','Milo','Nix','Ozzy','Pax','Rook','Sage','Tibs','Vex','Wim','Zara'];
const SHIP_NAMES = ['Kestrel Junior','Big Dipper','Space Oddity','Cosmic Latte','Nebula Nugget','Void Biscuit','Star Trekkie','Hull Monty','Ion Maiden','Warp Speedo'];

const BASE = {
  rules: { sectors:8, startScrap:20, fleetSpeed:0.11, shieldRegen:2, repairRate:0.16, enemyPace:0.7, bossId:'flaggship',
    maxCrew:8, weaponSlots:4, droneSlots:3, augmentSlots:3, baseHP:4, startParts:2 },

  races: {
    human:     { name:'Human',     color:'#e8c49a', hp:100, repair:1,   combat:1,   speed:1,    learn:1.1, desc:'Perfectly average. Learns skills a bit faster. Proud of it.' },
    pebblekin: { name:'Pebblekin', color:'#9aa7b8', hp:150, repair:0.5, combat:1,   speed:0.5,  fireproof:true, desc:'Huge health and fireproof. Slow on their feet and slower with a wrench.' },
    enjinn:    { name:'Enjinn',    color:'#b9f3ff', hp:100, repair:2,   combat:0.5, speed:1,    desc:'Wish-granting mechanics. Repair twice as fast, fight like a wet towel.' },
    voltan:    { name:'Voltan',    color:'#ffe27a', hp:70,  repair:1,   combat:1,   speed:1,    power:1, deathBurst:15, desc:'Add 1 free power to the system they stand in. Explode when they die.' },
    sloog:     { name:'Sloog',     color:'#9fdc7a', hp:100, repair:1,   combat:1,   speed:1,    telepathic:true, mindImmune:true, desc:'Telepathic: always see enemy crew. Immune to mind control. Smug.' },
    mantlis:   { name:'Mantlis',   color:'#c6e05a', hp:100, repair:0.5, combat:1.5, speed:1.25, desc:'Born brawlers. Fast and deadly in a fight, hopeless with tools.' }
  },

  weapons: {
    basic:      { name:'Basic Laser',        type:'laser',   damage:1, shots:1, charge:10, power:1, cost:20, tier:1 },
    bust1:      { name:'Bust Laser I',       type:'laser',   damage:1, shots:2, charge:11, power:2, cost:50, tier:1 },
    bust2:      { name:'Bust Laser II',      type:'laser',   damage:1, shots:3, charge:12, power:2, cost:80, tier:2 },
    bust3:      { name:'Bust Laser III',     type:'laser',   damage:1, shots:5, charge:19, power:4, cost:95, tier:3 },
    heavy1:     { name:'Heavy Laser I',      type:'laser',   damage:2, shots:1, charge:9,  power:1, cost:55, tier:1, fire:0.1, breach:0.1 },
    heavy2:     { name:'Heavy Laser II',     type:'laser',   damage:2, shots:2, charge:13, power:3, cost:65, tier:2, fire:0.2, breach:0.2 },
    duel:       { name:'Duel Lasers',        type:'laser',   damage:1, shots:4, charge:16, power:3, cost:70, tier:2, desc:'Two lasers settling their differences on your enemy.' },
    lego:       { name:'Lego Missile',       type:'missile', damage:1, shots:1, charge:9,  power:1, cost:30, tier:1, breach:0.3, desc:'Small, but they will remember stepping on it.' },
    arty:       { name:'Arty Missile',       type:'missile', damage:2, shots:1, charge:11, power:1, cost:38, tier:1, breach:0.2 },
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
    reloader:     { name:'Auto-Reloader',          cost:50, desc:'Weapons charge 10% faster.' },
    booster:      { name:'Shield Charge Booster',  cost:55, desc:'Shield layers recharge 15% faster.' },
    preigniter:   { name:'Weapon Pre-Igniter',     cost:90, desc:'Weapons start every fight fully charged.' },
    scanners:     { name:'Long-Range Scanners',    cost:40, desc:'See ships and hazards at every beacon on the map.' },
    replicator:   { name:'Explosive Replicator',   cost:55, desc:'33% chance a missile or drone part is not used up.' },
    recovery:     { name:'Drone Recovery Arm',     cost:60, desc:'Deploying drones costs no drone parts.' },
    voltanShield: { name:'Voltan Super Shield',    cost:85, desc:'A 5-point super shield that blocks anything at the start of every fight.' },
    stealth:      { name:'Stealth Plating',        cost:45, desc:'+5% evasion.' },
    casing:       { name:'Titanium System Casing', cost:60, desc:'15% chance to shrug off system damage.' },
    dna:          { name:'Backup DNA Bank',        cost:50, desc:'Crew killed in a fight are cloned back once it ends.' },
    pheromones:   { name:'Mantlis Pheromones',     cost:40, desc:'Crew move 25% faster.' },
    gel:          { name:'Sloog Repair Gel',       cost:40, desc:'Your crew slowly heal anywhere.' },
    fireSup:      { name:'Fire Suppression',       cost:45, desc:'Crew put out fires twice as fast.' },
    rockPlating:  { name:'Rock Plating',           cost:45, desc:'Halves the chance of hull breaches.' },
    ionField:     { name:'Reverse Ion Field',      cost:50, desc:'20% chance to ignore ion damage.' }
  },

  ships: {
    pestrel:  { name:'The Pestrel', layout:'A', cls:'Fedoration Cruiser', color:'#ffb547', pattern:'TABAN', hull:30, reactor:8, fuel:16, missiles:8, parts:2,
      desc:'Annoyingly reliable. The classic start.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter','cloaking'], weapons:['bust1','arty'], drones:[], crew:['human','human','human'] },
    redtale:  { name:'The Red Tale', layout:'B', cls:'Fedoration Cruiser', color:'#ff7b5a', pattern:'TBAAN', hull:30, reactor:8, fuel:16, missiles:3, parts:2,
      desc:'Four basic lasers and a story to tell. Lots of shots, little bite.', systems:{ shields:2, engines:2, oxygen:1, weapons:4, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['basic','basic','basic','basic'], crew:['human','human','human','human'], unlock:{ win:'pestrel' } },
    taurus:   { name:'The Taurus', layout:'A', cls:'Enjinn Cruiser', color:'#5fd3e6', pattern:'TBACN', hull:30, reactor:8, fuel:16, missiles:3, parts:15,
      desc:'Bull-headed ion fire backed by a combat drone.', systems:{ shields:2, engines:2, oxygen:1, weapons:2, drones:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['teleporter','hacking'], weapons:['ion'], drones:['combat1'], crew:['enjinn','enjinn','human'], unlock:{ sector:3 } },
    bortex:   { name:'The Bortex', layout:'B', cls:'Enjinn Cruiser', color:'#8fc1ff', pattern:'TBBCN', hull:30, reactor:9, fuel:16, missiles:0, parts:20,
      desc:'All drones, no fuss. Very bortex.', systems:{ shields:2, engines:2, oxygen:1, weapons:1, drones:6, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['teleporter'], weapons:['heavy1'], drones:['combat1','beamd'], crew:['enjinn','enjinn','enjinn'], unlock:{ kills:25 } },
    stone:    { name:'The Rolling Stone', layout:'A', cls:'Pebblekin Cruiser', color:'#c9a27e', pattern:'TABAN', hull:30, reactor:8, fuel:14, missiles:10, parts:2,
      desc:'Gathers no moss. Takes a beating, dishes out missiles.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:2 },
      reserve:['drones','teleporter'], weapons:['heavy1','arty'], crew:['pebblekin','pebblekin','human'], unlock:{ sector:4 } },
    rockbottom:{ name:'The Rock Bottom', layout:'B', cls:'Pebblekin Cruiser', color:'#a88c74', pattern:'TBACN', hull:35, reactor:8, fuel:14, missiles:12, parts:2,
      desc:'Set things on fire and stand in the flames. You are fireproof.', systems:{ shields:2, engines:1, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:2 },
      reserve:['drones','teleporter'], weapons:['firebomb','arty'], crew:['pebblekin','pebblekin','pebblekin'], unlock:{ ach:'firestarter' } },
    zap:      { name:'The Zapjudicator', layout:'A', cls:'Voltan Cruiser', color:'#ffe27a', pattern:'TABCN', hull:28, reactor:8, fuel:16, missiles:3, parts:2,
      desc:'Voltan shield up front, ion fire behind it.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['ion','bust1'], augments:['voltanShield'], crew:['voltan','voltan','human'], unlock:{ sector:5 } },
    voltface: { name:'The Volt Face', layout:'B', cls:'Voltan Cruiser', color:'#fff0a8', pattern:'TBACN', hull:26, reactor:7, fuel:16, missiles:0, parts:4,
      desc:'Changed its mind about lasers. Beams and pure Voltan power.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones','teleporter'], weapons:['pike','ion'], augments:['voltanShield'], crew:['voltan','voltan','voltan'], unlock:{ ach:'augs3' } },
    slime:    { name:'The Slime of War', layout:'A', cls:'Sloog Cruiser', color:'#9fdc7a', pattern:'TBAAN', hull:30, reactor:9, fuel:16, missiles:8, parts:4,
      desc:'Hacks your shields, then cooks your crew.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, hacking:1, medbay:1, piloting:1, sensors:2, doors:1 },
      reserve:['drones','teleporter'], weapons:['biobeam','arty'], crew:['sloog','sloog','human'], unlock:{ ach:'boardkill' } },
    gastropod:{ name:'The Gastropod', layout:'B', cls:'Sloog Cruiser', color:'#c2f08a', pattern:'TBACN', hull:30, reactor:9, fuel:16, missiles:4, parts:2,
      desc:'Slow, sticky and in your head. Comes with mind control.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, mindcontrol:1, clonebay:1, piloting:1, sensors:2, doors:1 },
      reserve:['drones','teleporter'], weapons:['bust1','lego'], crew:['sloog','sloog','sloog'], unlock:{ win:'slime' } },
    mantlis:  { name:'The Preying Mantlis', layout:'A', cls:'Mantlis Cruiser', color:'#c6e05a', pattern:'TBAAN', hull:30, reactor:9, fuel:16, missiles:2, parts:2,
      desc:'Teleport in, start swinging. Questions later.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, teleporter:1, medbay:1, piloting:1, sensors:1, doors:1 },
      reserve:['drones'], weapons:['bust1','basic'], crew:['mantlis','mantlis','mantlis','human'], unlock:{ ach:'mind' } },
    basilisk: { name:'The Basil-isk', layout:'B', cls:'Mantlis Cruiser', color:'#9fcf3f', pattern:'TBBAN', hull:30, reactor:10, fuel:16, missiles:2, parts:2,
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
    rebuff_scout:   { name:'Rebuff Scout',      tags:['rebuff'], hull:8,  sectors:[1,3], systems:{ engines:1, weapons:1, oxygen:1, piloting:1, doors:1 }, weapons:['basic'], crew:['human','human'] },
    rebuff_fighter: { name:'Rebuff Fighter',    tags:['rebuff'], hull:10, sectors:[1,8], systems:{ shields:2, engines:2, weapons:2, oxygen:1, medbay:1, piloting:1, sensors:1, doors:1 }, weapons:['basic','basic'], crew:['human','human','human'] },
    rebuff_cloaker: { name:'Rebuff Shade',      tags:['rebuff'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:3, cloaking:1, oxygen:1, piloting:1, doors:1 }, weapons:['bust1','arty'], crew:['human','human','human'] },
    rebuff_elite:   { name:'Rebuff Enforcer',   tags:['rebuff'], hull:14, sectors:[5,8], systems:{ shields:4, engines:2, weapons:4, teleporter:1, oxygen:1, medbay:1, piloting:1, sensors:1, doors:2 }, weapons:['bust2','heavy1'], crew:['human','human','mantlis','pebblekin'] },
    pyrate_gunship: { name:'Pyrate Gunship',    tags:['pyrate'], hull:11, sectors:[1,8], systems:{ shields:2, engines:2, weapons:3, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['basic','arty'], crew:['human','sloog','mantlis'] },
    pyrate_bomber:  { name:'Pyrate Boom-barge', tags:['pyrate'], hull:11, sectors:[2,8], systems:{ shields:2, engines:1, weapons:3, oxygen:1, piloting:1, doors:1 }, weapons:['firebomb','basic'], crew:['human','pebblekin','human'] },
    auto_scoundrel: { name:'Auto-Scoundrel',    tags:['auto','enjinn'], auto:true, hull:9, sectors:[1,8], systems:{ shields:2, engines:2, weapons:3, drones:2, piloting:1 }, weapons:['basic','lego'], drones:['combat1'], crew:[] },
    auto_assault:   { name:'Auto-Assaulter',    tags:['auto','rebuff'], auto:true, hull:12, sectors:[4,8], systems:{ shields:4, engines:2, weapons:4, drones:4, piloting:1 }, weapons:['bust1','hermies'], drones:['defense1'], crew:[] },
    mantlis_raider: { name:'Mantlis Raider',    tags:['mantlis'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:2, teleporter:2, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['basic','lego'], crew:['mantlis','mantlis','mantlis','mantlis'] },
    voltan_peace:   { name:'Voltan Peacemonger',tags:['voltan'], hull:10, sectors:[3,8], super:4, systems:{ shields:2, engines:3, weapons:3, oxygen:1, piloting:1, doors:1 }, weapons:['ion','pike'], crew:['voltan','voltan','voltan'] },
    pebble_brute:   { name:'Pebblekin Brute',   tags:['pebblekin'], hull:14, sectors:[2,8], systems:{ shields:2, engines:1, weapons:3, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['heavy1','arty'], crew:['pebblekin','pebblekin','pebblekin'] },
    sloog_hacker:   { name:'Sloog Interloper',  tags:['sloog'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:3, hacking:2, oxygen:1, piloting:1, sensors:2, doors:1 }, weapons:['biobeam','basic'], crew:['sloog','sloog','sloog'] },
    sloog_mind:     { name:'Sloog Puppeteer',   tags:['sloog'], hull:10, sectors:[3,8], systems:{ shields:2, engines:2, weapons:2, mindcontrol:2, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['bust1'], crew:['sloog','sloog','human'] },
    enjinn_carrier: { name:'Enjinn Dronecarrier',tags:['enjinn'], hull:11, sectors:[3,8], systems:{ shields:2, engines:2, weapons:1, drones:5, oxygen:1, medbay:1, piloting:1, doors:1 }, weapons:['ion'], drones:['combat1','defense1'], crew:['enjinn','enjinn','enjinn'] },
    flaggship:      { name:'The Flaggship', boss:true, color:'#ff5a7a', hull:24, pattern:'TBBABBAN', sectors:[99,99],
      systems:{ shields:4, engines:2, weapons:8, drones:6, teleporter:2, oxygen:2, medbay:2, piloting:2, sensors:2, doors:3 },
      weapons:['bust2','heavy2','hermies','ion2'], drones:[], crew:['pebblekin','pebblekin','human','human','human','mantlis'],
      phases:[
        { name:'Phase 1: Boarders', hull:24, weapons:['bust2','heavy2','hermies','ion2'], drones:[], board:true },
        { name:'Phase 2: Drones and Super Shield', hull:24, weapons:['bust2','ion2'], drones:['combat2','defense1','beamd'], super:8, superRegen:6 },
        { name:'Phase 3: Power Surge', hull:28, weapons:['bust2','heavy2','flak1'], drones:['defense1'], surge:26 } ] }
  },

  sectors: {
    civilian:  { name:'Civilian Sector',      color:'#7be0a0', mix:{ event:46, combat:40, empty:14 }, tags:[],          enemyTags:[],            hazards:{ asteroid:.06, sun:.05, ionstorm:.04, pulsar:.02 }, nebula:0 },
    rebuff:    { name:'Rebuff Stronghold',    color:'#ff5a7a', mix:{ event:32, combat:56, empty:12 }, tags:['rebuff'],  enemyTags:['rebuff'],    hazards:{ asteroid:.06, sun:.06, ionstorm:.05, pulsar:.03 }, nebula:.05 },
    pyrate:    { name:'Pyrate Haven',         color:'#ffd166', mix:{ event:42, combat:48, empty:10 },  tags:['pyrate'],  enemyTags:['pyrate'],    hazards:{ asteroid:.1,  sun:.05 }, nebula:0 },
    nebula:    { name:'Uncharted Nebula',     color:'#8b6fd6', mix:{ event:48, combat:36, empty:16 }, tags:['nebula'],  enemyTags:[],            hazards:{ ionstorm:.08 }, nebula:.85, fleetMult:.6 },
    sloog:     { name:'Sloog Nebula',         color:'#9fdc7a', mix:{ event:46, combat:42, empty:12 }, tags:['sloog','nebula'], enemyTags:['sloog'], hazards:{ ionstorm:.06 }, nebula:.7, fleetMult:.6 },
    pebblekin: { name:'Pebblekin Homeworlds', color:'#c9a27e', mix:{ event:46, combat:44, empty:10 }, tags:['pebblekin'], enemyTags:['pebblekin'], hazards:{ asteroid:.16, sun:.04 }, nebula:0 },
    enjinn:    { name:'Enjinn Controlled',    color:'#5fd3e6', mix:{ event:46, combat:44, empty:10 }, tags:['enjinn'],  enemyTags:['enjinn','auto'], hazards:{ asteroid:.06, pulsar:.04 }, nebula:0 },
    voltan:    { name:'Voltan Homeworlds',    color:'#ffe27a', mix:{ event:48, combat:42, empty:10 }, tags:['voltan'],  enemyTags:['voltan'],    hazards:{ pulsar:.08, sun:.05 }, nebula:0 },
    mantlis:   { name:'Mantlis Hives',        color:'#c6e05a', mix:{ event:36, combat:54, empty:10 }, tags:['mantlis'], enemyTags:['mantlis'],   hazards:{ asteroid:.06, sun:.06 }, nebula:0 },
    laststand: { name:'The Last Stand',       color:'#ff5a7a', final:true, mix:{ event:30, combat:58, empty:12 }, tags:['rebuff'], enemyTags:['rebuff'], hazards:{ asteroid:.05, sun:.05 }, nebula:0, fleetMult:.5 }
  },

  events: {
    derelict:{ text:'A gutted freighter tumbles through the beacon light. Its cargo doors hang open, but the reactor still glows.', choices:[
      { text:'Send a team aboard to search it.', chance:.6, success:{ text:'Your team returns with salvage and a crate of missile casings.', scrap:22, missiles:2 }, fail:{ text:'A rigged power coupling blows as the team leaves. Your hull takes the blast.', hull:-3, scrap:8 } },
      { text:'Have your Enjinn trace the live circuits first.', req:{ race:'enjinn' }, effect:{ text:'Your Enjinn spend all three wishes on not exploding. You strip the ship clean.', scrap:30, fuel:2 } },
      { text:'Leave it alone.', effect:{ text:'You give the wreck a wide berth.' } } ] },
    distress:{ distress:true, text:'A looping distress call: "Life support failing. Anyone. Please." The signal is weak but steady.', choices:[
      { text:'Answer the call.', chance:.55, success:{ text:'A lone survivor stumbles aboard, grateful and eager to work.', crew:'random' }, fail:{ text:'It was bait. A ship drops its cloak off your bow.', fight:'random' } },
      { text:'Keep moving.', effect:{ text:'The call fades behind you. Nobody mentions it.' } } ] },
    fueltrader:{ text:'A tanker captain hails you. "Fuel for scrap, fair and simple. Four cells, twenty scrap. I am not fuelling around."', choices:[
      { text:'Buy four fuel cells.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'The cells transfer cleanly.', fuel:4 } },
      { text:'Sell two fuel cells for fifteen scrap.', req:{ fuel:3 }, cost:{ fuel:2 }, effect:{ text:'The captain pays without haggling.', scrap:15 } },
      { text:'Decline.', effect:{ text:'"Your loss," the captain says, and cuts the channel.' } } ] },
    miners:{ text:'Asteroid miners are pinned under a rockslide. "Please, we are between a rock and a hard place."', choices:[
      { text:'Give them two missiles to blast it clear.', req:{ missiles:2 }, cost:{ missiles:2 }, effect:{ text:'The charges clear the slide. The miners load your hold with refined ore.', scrap:32 } },
      { text:'Ask your Pebblekin to talk to the rocks.', req:{ race:'pebblekin' }, effect:{ text:'A long, low conversation follows. The rocks move. The miners are unsettled but pay well.', scrap:28, fuel:1 } },
      { text:'You cannot spare anything.', effect:{ text:'You leave them to dig.' } } ] },
    toll:{ tags:['pyrate',''], text:'Three Pyrate gunships block the beacon. "Toll is twenty-five scrap. Pay up or walk the plank. Into space. Without a suit."', choices:[
      { text:'Pay the toll.', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'They wave you through, laughing.' } },
      { text:'Outrun them on full engines.', req:{ system:'engines', level:4 }, effect:{ text:'Your engines scream and the gunships fall behind.', fuel:-1 } },
      { text:'Slip past under cloak.', req:{ system:'cloaking', level:1 }, effect:{ text:'You vanish. They argue among themselves about who let you go.' } },
      { text:'Refuse and fight.', effect:{ text:'One gunship peels off to deal with you.', fight:'pyrate_gunship' } } ] },
    storm:{ text:'An ion storm boils across the beacon. Scrap from old wrecks glitters inside it.', choices:[
      { text:'Dive in and grab what you can.', chance:.6, success:{ text:'You haul in a full net of salvage before the storm closes.', scrap:28 }, fail:{ text:'Lightning arcs through the hull before you escape.', hull:-4, scrap:10 } },
      { text:'Burn extra fuel to go around.', req:{ fuel:2 }, cost:{ fuel:1 }, effect:{ text:'You skirt the storm without trouble.' } },
      { text:'Let your Voltan drink the lightning.', req:{ race:'voltan' }, effect:{ text:'Your Voltan glow with smug satisfaction. The salvage is yours.', scrap:32 } } ] },
    pod:{ distress:true, text:'An escape pod drifts past, its occupant waving through the frost on the window.', choices:[
      { text:'Bring the pod aboard.', effect:{ text:'The survivor thanks you and asks for a job. Pod-ner for life.', crew:'random' } },
      { text:'Tow it toward the nearest station.', effect:{ text:'You set the pod on a safe course. A small reward pings your account.', scrap:12 } } ] },
    cache:{ text:'A sealed weapons locker floats among old battle debris. Its lock still blinks red.', choices:[
      { text:'Cut it open.', chance:.5, success:{ text:'Inside is a working weapon, packed in foam.', weapon:'random' }, fail:{ text:'The locker was rigged. An Auto-Scoundrel wakes and opens fire.', fight:'auto_scoundrel' } },
      { text:'Let your Pebblekin crack it by hand.', req:{ race:'pebblekin' }, effect:{ text:'Stone fingers crush the lock before the trap can fire.', weapon:'random' } },
      { text:'Leave it.', effect:{ text:'Some things stay sealed for a reason.' } } ] },
    smuggler:{ text:'A Sloog smuggler slides up. "Got something with real bite. Forty scrap and it is yours. No questions. Especially from you."', choices:[
      { text:'Pay forty scrap.', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'The crate is exactly what was promised, which surprises everyone.', weapon:'random' } },
      { text:'Use your own Sloog to read the smuggler\'s mind first.', req:{ race:'sloog' }, effect:{ text:'Your Sloog finds the good stuff hidden under the counter. Half price, and a drone thrown in.', scrap:-20, drone:'random' } },
      { text:'No deal.', effect:{ text:'The smuggler leaves a faint trail of disappointment.' } } ] },
    comet:{ text:'A comet streaks through the system, shedding ice and volatile gas.', choices:[
      { text:'Skim its tail for fuel.', chance:.75, success:{ text:'The scoops fill with usable fuel.', fuel:3 }, fail:{ text:'A chunk of ice slams into the hull. Cool.', hull:-2, fuel:1 } },
      { text:'Just watch it pass.', effect:{ text:'The crew gathers at the viewports. Morale improves. Morale is not a stat.' } } ] },
    ghost:{ text:'A signal repeats one coordinate, over and over, in a language nobody aboard knows.', choices:[
      { text:'Hold position behind strong shields and listen.', req:{ system:'shields', level:4 }, effect:{ text:'Whatever was out there tests your shields, gives up, and leaves a cache behind.', scrap:35, augment:'random' } },
      { text:'Follow the coordinate.', chance:.5, success:{ text:'You find an abandoned depot with spare parts.', scrap:20, missiles:2, parts:2 }, fail:{ text:'It leads straight into a minefield.', hull:-5 } },
      { text:'Ignore it.', effect:{ text:'You log the signal and move on.' } } ] },
    dock:{ text:'A Sloog repair dock floats here, tended by slow, patient hands. "Stay a while. Let us goo-p you up."', choices:[
      { text:'Accept repairs.', effect:{ text:'Your hull is patched with something warm and alarmingly alive.', hull:8 } },
      { text:'Politely refuse.', effect:{ text:'The Sloog look hurt. Slowly.' } } ] },
    fedscout:{ minSector:2, text:'A Fedoration scout tips its hat. "M\'lady. The Rebuff Fleet is right behind you. Take this, and godspeed."', choices:[
      { text:'Accept the supplies.', effect:{ text:'They hand over fuel, missiles and a slightly smug salute.', fuel:3, missiles:2, parts:1 } } ] },
    deserter:{ minSector:2, text:'A Rebuff deserter wants out. "Take me with you. I know how they fight."', choices:[
      { text:'Welcome aboard.', effect:{ text:'The deserter joins your crew and rebuffs their old life.', crew:'human', scrap:10 } },
      { text:'Could be a trap. Refuse.', effect:{ text:'They sigh and drift away.' } } ] },
    quiet:{ weight:.5, text:'The beacon is silent. Stars, dust and the hum of your own engines.', choices:[
      { text:'Continue.', effect:{ text:'You use the calm to run diagnostics.' } } ] },
    merchant:{ weight:.2, text:'A merchant convoy flashes its open sign. "Everything must go! Mostly because we are being chased."', choices:[
      { text:'Browse their wares.', effect:{ text:'The cargo bay doors slide open.', store:true } },
      { text:'Not today.', effect:{ text:'They wave and keep running.' } } ] },
    augdealer:{ weight:.7, text:'A twitchy dealer offers ship augments "that fell off a cruiser". Fifty scrap.', choices:[
      { text:'Buy one, no questions.', req:{ scrap:50 }, cost:{ scrap:50 }, effect:{ text:'It slots in with a satisfying clunk.', augment:'random' } },
      { text:'Walk away.', effect:{ text:'"Your loss," says the dealer, already gone.' } } ] },
    droneyard:{ text:'A derelict drone factory still hums. Its assembly arms twitch when you approach.', choices:[
      { text:'Salvage the parts bins.', chance:.65, success:{ text:'You fill a crate with drone parts.', parts:5 }, fail:{ text:'The factory\'s guard drones wake up.', fight:'auto_scoundrel' } },
      { text:'Let your Enjinn sweet-talk the factory computer.', req:{ race:'enjinn' }, effect:{ text:'The factory builds you a present.', drone:'random', parts:3 } },
      { text:'Leave it be.', effect:{ text:'The arms wave goodbye. Creepily.' } } ] },
    colony:{ distress:true, text:'A colony at a nearby beacon is being raided. They beg for help and promise a reward.', choices:[
      { text:'Mark it on the map and promise to come.', effect:{ text:'The beacon is marked as a quest on your map.', quest:'colony_saved' } },
      { text:'You cannot risk it.', effect:{ text:'The channel goes quiet.' } } ] },
    colony_saved:{ questOnly:true, text:'The colony is still holding out. A Pyrate gunship circles it like a shark.', choices:[
      { text:'Drive them off.', effect:{ text:'You move to engage.', fight:'pyrate_gunship', afterWin:{ text:'The grateful colonists load you up and one volunteers to join.', scrap:40, crew:'random' } } } ] },
    weevils:{ text:'A derelict is crawling with Space Weevils, each the size of a dog and twice as hungry.', choices:[
      { text:'Send a team to grab the cargo.', chance:.55, success:{ text:'Your team returns, a little chewed, with a full crate.', scrap:30 }, fail:{ text:'The weevils win. Your crew retreat, minus one.', crewLoss:1 } },
      { text:'Send your Mantlis. They have been bored lately.', req:{ race:'mantlis' }, effect:{ text:'There are no more weevils. There is a lot of cargo.', scrap:45, weapon:'random' } },
      { text:'Nope.', effect:{ text:'Wise.' } } ] },
    station:{ text:'An abandoned research station drifts here. One module still has its experimental system intact.', choices:[
      { text:'Strip the module.', effect:{ text:'You haul the system aboard and find a room for it.', install:'random' } },
      { text:'Take the spare scrap instead.', effect:{ text:'Practical choice.', scrap:30 } } ] },
    lostenjinn:{ tags:['enjinn',''], text:'A lone Enjinn mechanic floats outside an airlock, fixing a ship that is no longer there.', choices:[
      { text:'Offer a job.', effect:{ text:'"Finally, something to fix." They join your crew.', crew:'enjinn' } },
      { text:'Leave them to it.', effect:{ text:'They wave a spanner as you go.' } } ] },
    casino:{ tags:['pyrate',''], text:'A Pyrate casino blinks in a hollowed-out asteroid. "Double your scrap! Probably!"', choices:[
      { text:'Bet twenty scrap.', req:{ scrap:20 }, cost:{ scrap:20 }, chance:.45, success:{ text:'Jackpot! Mostly.', scrap:50 }, fail:{ text:'The house always wins. The house is also armed.' } },
      { text:'Have your Sloog count the cards.', req:{ race:'sloog' }, effect:{ text:'You leave rich and permanently banned.', scrap:45 } },
      { text:'Keep your scrap.', effect:{ text:'A rare act of wisdom.' } } ] },
    relay:{ text:'A Fedoration relay station is damaged. Its operator asks if you can help with repairs.', choices:[
      { text:'Spend two drone parts on repairs.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'The relay comes back online and they share their fuel.', fuel:4 } },
      { text:'Send your Enjinn to fix it by hand.', req:{ race:'enjinn' }, effect:{ text:'Fixed in minutes. They pay in fuel and gratitude.', fuel:4, scrap:15 } },
      { text:'You have your own problems.', effect:{ text:'You jump on.' } } ] },
    refugees:{ distress:true, text:'A refugee ship is out of fuel and drifting toward a star.', choices:[
      { text:'Give them two fuel cells.', req:{ fuel:3 }, cost:{ fuel:2 }, effect:{ text:'They thank you, and one of them insists on joining.', crew:'random' } },
      { text:'You cannot spare the fuel.', effect:{ text:'You hope someone else comes.' } } ] },
    checkpoint:{ tags:['rebuff','laststand'], text:'A Rebuff checkpoint demands your ID. Yours says "definitely not a rebel".', choices:[
      { text:'Pay a fifteen scrap "processing fee".', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'They process you right through.' } },
      { text:'Sneak past under cloak.', req:{ system:'cloaking', level:1 }, effect:{ text:'You ghost past the checkpoint.' } },
      { text:'Blast your way through.', effect:{ text:'The checkpoint guard ship scrambles.', fight:'rebuff_fighter' } } ] },
    monks:{ tags:['pebblekin'], text:'Pebblekin monks meditate on a slowly spinning asteroid. One opens an eye. Eventually.', choices:[
      { text:'Ask for their blessing.', effect:{ text:'The monks bless your hull. It is now slightly harder.', augment:'rockPlating' } },
      { text:'Ask your Pebblekin to stay and talk.', req:{ race:'pebblekin' }, effect:{ text:'A monk decides to join you on your pilgrimage.', crew:'pebblekin', scrap:10 } } ] },
    genie:{ tags:['enjinn'], text:'An Enjinn genie offers you three wishes. Unfortunately they are all about engines.', choices:[
      { text:'Wish for better engines.', effect:{ text:'Your engines purr like a much more expensive ship.', upgrade:'engines' } },
      { text:'Wish for drone parts.', effect:{ text:'Parts rain down. Some are still warm.', parts:6 } },
      { text:'Wish for hull repairs.', effect:{ text:'Done before you finish the sentence.', hull:10 } } ] },
    voltanmonks:{ tags:['voltan'], text:'Voltan monks offer to bless your shields with pure energy. For a donation.', choices:[
      { text:'Donate thirty scrap.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'Your shield generator hums a new note.', upgrade:'shields' } },
      { text:'Let your Voltan ask nicely.', req:{ race:'voltan' }, effect:{ text:'They bless your shields for free, as a family discount.', upgrade:'shields' } },
      { text:'No thanks.', effect:{ text:'They hum disapprovingly.' } } ] },
    sloogscam:{ tags:['sloog','nebula'], text:'A Sloog offers you a "once in a lifetime" deal on a premium weapon. Thirty scrap, up front.', choices:[
      { text:'Pay up.', req:{ scrap:30 }, cost:{ scrap:30 }, chance:.3, success:{ text:'Shockingly, it is real.', weapon:'random' }, fail:{ text:'The crate contains a smaller crate. That one is empty.' } },
      { text:'Your Sloog reads their mind and turns the tables.', req:{ race:'sloog' }, effect:{ text:'The scammer pays you to go away.', scrap:25 } },
      { text:'Not a chance.', effect:{ text:'The Sloog slides off to find someone else.' } } ] },
    warparty:{ tags:['mantlis'], text:'A Mantlis war party hails you. They want a fight. Any fight. Please.', choices:[
      { text:'Give them a fight.', effect:{ text:'They whoop and open fire.', fight:'mantlis_raider', afterWin:{ text:'Their survivors salute you and send a gift.', scrap:25 } } },
      { text:'Bribe them with twenty-five scrap.', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'They take the scrap and look disappointed.' } },
      { text:'Offer a duel with your own Mantlis.', req:{ race:'mantlis' }, effect:{ text:'Your champion wins in a flurry of limbs. The war party pays tribute.', scrap:35, weapon:'random' } } ] },
    duel:{ tags:['pyrate'], text:'A Pyrate captain challenges you to a duel. "Loser walks the airlock!"', choices:[
      { text:'Accept the duel.', effect:{ text:'Guns out.', fight:'pyrate_gunship', afterWin:{ text:'The captain walks the airlock. Their treasure stays.', scrap:35 } } },
      { text:'Decline.', effect:{ text:'"Coward!" they shout, which you can live with.' } } ] },
    whispers:{ nebula:true, text:'Voices drift through the nebula, whispering coordinates.', choices:[
      { text:'Follow the voices.', chance:.5, success:{ text:'A wreck, perfectly preserved, with treasure.', augment:'random', scrap:15 }, fail:{ text:'The voices lead you into a gas pocket that ignites.', hull:-4, fire:true } },
      { text:'Ignore them.', effect:{ text:'The whispers sulk.' } } ] },
    nebtrader:{ nebula:true, text:'A trader hides in the nebula, selling fuel to anyone desperate enough to find them.', choices:[
      { text:'Buy three fuel for fifteen scrap.', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'Fair price for the middle of nowhere.', fuel:3 } },
      { text:'Leave.', effect:{ text:'They disappear back into the mist.' } } ] },
    bounty:{ minSector:4, tags:['rebuff','laststand'], text:'A Rebuff bounty hunter has your ship\'s face on a poster. It is not a good likeness.', choices:[
      { text:'Fight.', effect:{ text:'The hunter locks weapons.', fight:'rebuff_elite', afterWin:{ text:'The hunter\'s ship had a fat bounty purse of its own.', scrap:40 } } },
      { text:'Run under cloak.', req:{ system:'cloaking', level:2 }, effect:{ text:'The hunter loses you completely.' } } ] },
    graveyard:{ text:'A ship graveyard stretches across the beacon. Some wrecks are newer than others.', choices:[
      { text:'Search the newest wreck.', chance:.6, success:{ text:'A weapon, still in its rack.', weapon:'random' }, fail:{ text:'Its owners are still here and still angry.', fight:'random' } },
      { text:'Search the oldest wreck.', effect:{ text:'Ancient but useful scrap.', scrap:20 } } ] },
    lostdrone:{ text:'A lonely drone pings your ship, looking for a new owner.', choices:[
      { text:'Adopt it.', effect:{ text:'It beeps happily and installs its own blueprint.', drone:'random' } },
      { text:'Shoo it away.', effect:{ text:'It beeps sadly and wanders off.' } } ] },
    repairstation:{ text:'An automated repair station offers hull patching for twenty scrap.', choices:[
      { text:'Pay twenty scrap.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Patched and polished.', hull:12 } },
      { text:'Move on.', effect:{ text:'The station beeps "come again".' } } ] },
    sunflare:{ text:'You jumped in a little close to a sun. The hull creaks.', choices:[
      { text:'Pull away fast.', chance:.6, success:{ text:'You escape the worst of it.', hull:-1 }, fail:{ text:'A flare catches you. Something is on fire.', hull:-2, fire:true } } ] },
    crewswap:{ text:'A Fedoration transport asks if you can spare a crew member for a vital mission. They offer scrap in return.', choices:[
      { text:'Send someone. (lose 1 crew)', req:{ crewCount:3 }, effect:{ text:'Your crew member salutes and leaves. The pay is good.', crewLoss:1, scrap:40 } },
      { text:'Refuse.', effect:{ text:'They understand.' } } ] }
  }
};

const ACHIEVEMENTS = [
  { id:'first_jump',  name:'One Small Jump',        desc:'Make your first jump.' },
  { id:'sector3',     name:'Halfway Hopeful',       desc:'Reach sector 3.' },
  { id:'sector5',     name:'Deep Space Nein',       desc:'Reach sector 5.' },
  { id:'laststand',   name:'Last Stand-up Comedy',  desc:'Reach the Last Stand.' },
  { id:'phase1',      name:'Flag Down',             desc:'Beat the Flaggship once.' },
  { id:'win',         name:'Vaster Than Life',      desc:'Destroy the Flaggship for good.' },
  { id:'kills25',     name:'Rebuff-erer',           desc:'Defeat 25 ships across all runs.' },
  { id:'boardkill',   name:'Hostile Takeover',      desc:'Win a fight by killing the enemy crew.' },
  { id:'fullcrew',    name:'Full House',            desc:'Have 8 crew at once.' },
  { id:'augs3',       name:'Augmented Reality',     desc:'Hold 3 augments.' },
  { id:'mind',        name:'Mind Over Matter',      desc:'Mind control an enemy.' },
  { id:'firestarter', name:'Fire Starter',          desc:'Have fires in 4 enemy rooms at once.' },
  { id:'missilecmd',  name:'Missile Command',       desc:'Shoot down 10 shots with defense drones in one run.' },
  { id:'hullbreadth', name:"By a Hull's Breadth",   desc:'Win a fight with 3 hull or less.' },
  { id:'surrender',   name:'White Flag Waver',      desc:'Accept an enemy surrender.' },
  { id:'shieldwall',  name:'Shield Wall',           desc:'Reach 4 shield layers.' },
  { id:'rebuffed',    name:'Rebuffed',              desc:'Lose a run. It happens to everyone.' }
];

const DIFFICULTY = {
  easy:   { name:'Easy',   scrap:1.35, pace:.5,  startScrap:20,  enemyHull:-2, evade:10 },
  normal: { name:'Normal', scrap:1,   pace:.7,  startScrap:0,   enemyHull:0 },
  hard:   { name:'Hard',   scrap:.8,  pace:.85, startScrap:-10, enemyHull:2, evade:-5 }
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
