'use strict';
/* =========================================================================
   Loadouts: a create-a-class system for the crew, on top of the Armoury.
   Every crew member has:
     primary   (c.arm)   assault, SMG, LMG, shotgun, marksman, special
     secondary (c.side)  pistol, launcher, melee (or any light weapon)
       each with up to two attachments (it.att), unlocked as that weapon
       levels up across all your runs (kills and time in fights with it)
     armour    (c.suit)
     lethal and tactical grenades (c.lethal, c.tactical): one of each per
       fight, thrown as the fight in their room starts
     three perks (c.perks), each with a Pro version unlocked by a challenge
     a crew level (c.lvl, c.cxp) that unlocks slots, grenades and perks,
     abilities at levels 10, 15, 20 and 25, and prestige at level 30.
   Weapons, attachment unlocks and perk Pro progress are kept in PROFILE.
   ========================================================================= */

/* ---------------- weapons ---------------- */
const LO_CLASS = {
  ar:       { name:'Assault rifle', slot:'primary',   kind:'gun',   base:{ dmg:1.45, reach:.5,  dur:90 } },
  smg:      { name:'SMG',           slot:'primary',   kind:'gun',   base:{ dmg:1.35, reach:.35, dur:80, spd:.1 } },
  lmg:      { name:'LMG',           slot:'primary',   kind:'gun',   base:{ dmg:1.65, reach:.6,  dur:130, spd:-.1 } },
  shotgun:  { name:'Shotgun',       slot:'primary',   kind:'gun',   base:{ dmg:2.0,  reach:.15, dur:70, knock:.06 } },
  marksman: { name:'Marksman',      slot:'primary',   kind:'gun',   base:{ dmg:1.15, reach:1.0, dur:70, crit:.15 } },
  special:  { name:'Special',       slot:'primary',   kind:'weird', base:{ dmg:1.3,  reach:.4,  dur:60 } },
  pistol:   { name:'Pistol',        slot:'secondary', kind:'gun',   base:{ dmg:1.25, reach:.3,  dur:70, quick:.5 } },
  launcher: { name:'Launcher',      slot:'secondary', kind:'gun',   base:{ dmg:1.0,  reach:.8,  dur:25, splash:22 } },
  melee:    { name:'Melee',         slot:'secondary', kind:'blade', base:{ dmg:1.4,  dur:80 } }
};
// [id, name, class, tier, cost, overrides, desc]
const LO_WEAPONS = [
  ['ar_kestrel',  'Courier AR-7',        'ar', 1, 45, {}, 'A dependable rifle. Every courier crew has one, and every one jams on a Tuesday.'],
  ['ar_vanguard', 'Vanguard Carbine',    'ar', 1, 50, { spd:.04 }, 'Short and light. Good in narrow corridors.'],
  ['ar_lancer',   'Lancer Battle Rifle', 'ar', 2, 70, { dmg:1.55, reach:.55 }, 'Heavier rounds, slower fire. Hits like a door slamming.'],
  ['ar_fang',     'Fang Burst Rifle',    'ar', 2, 65, { crit:.08 }, 'Three-round bursts. Now and then all three find the same spot.'],
  ['ar_ion',      'Ionclad Rifle',       'ar', 2, 75, { stun:.06 }, 'Fires ionised slugs that make muscles twitch.'],
  ['ar_tempest',  'Tempest AR',          'ar', 3, 95, { dmg:1.6, reach:.6, dur:110 }, 'Commonwealth special forces issue. Spare parts not included.'],
  ['ar_harbinger','Harbinger Rifle',     'ar', 3, 100, { dmg:1.55, bleed:2 }, 'Serrated flechettes. Nasty.'],
  ['ar_cobalt',   'Cobalt Pulse Rifle',  'ar', 3, 105, { dmg:1.5, reach:.7, stun:.04 }, 'A pulse weapon from the Tinkari foundries. Hums politely.'],
  ['smg_wasp',    'Wasp SMG',            'smg', 1, 40, {}, 'Buzzes. Stings. Mostly hits the right person.'],
  ['smg_ferret',  'Ferret Machine Pistol','smg', 1, 38, { spd:.14, dmg:1.3 }, 'Tiny, fast and hard to keep still.'],
  ['smg_hornet',  'Hornet PDW',          'smg', 2, 60, { dmg:1.42 }, 'Personal defence weapon. Defends very personally.'],
  ['smg_vortex',  'Vortex SMG',          'smg', 2, 62, { crit:.06 }, 'A spinning magazine and a spinning reputation.'],
  ['smg_scythe',  'Scythe SMG',          'smg', 2, 66, { bleed:1.5 }, 'Shreds armour and the people inside it.'],
  ['smg_blitz',   'Blitz Auto',          'smg', 3, 85, { dmg:1.5, spd:.12 }, 'For crews who prefer to arrive first.'],
  ['smg_mirage',  'Mirage Silenced SMG', 'smg', 3, 88, { quick:.4 }, 'Built-in suppressor. The first they hear of it is the last.'],
  ['lmg_bulwark', 'Bulwark LMG',         'lmg', 1, 55, {}, 'A wall of noise and brass.'],
  ['lmg_ox',      'Ox Squad Gun',        'lmg', 2, 75, { dmg:1.72, dur:150 }, 'Needs two people to carry. One will do, grumbling.'],
  ['lmg_thresher','Thresher Minigun',    'lmg', 3, 110, { dmg:1.85, reach:.7, spd:-.18 }, 'Spins up, then never stops. Neither does the ringing in your ears.'],
  ['lmg_warden',  'Warden Suppressor',   'lmg', 2, 72, { stun:.05 }, 'Not so much aimed as poured.'],
  ['lmg_hailstorm','Hailstorm LMG',      'lmg', 3, 105, { dmg:1.75, ignite:.02 }, 'Tracer rounds. Lots of them. Things catch fire.'],
  ['sg_breacher', 'Breacher Shotgun',    'shotgun', 1, 45, {}, 'Opens doors. Opens people. Opens debates.'],
  ['sg_mule',     'Mule Double-Barrel',  'shotgun', 1, 40, { dmg:2.1, dur:55 }, 'Two barrels, two chances, then a long reload.'],
  ['sg_cyclone',  'Cyclone Auto-Shotgun','shotgun', 2, 70, { dmg:1.9, dur:90 }, 'Drum-fed. Do not stand in front of it. Or near it.'],
  ['sg_dragon',   'Dragon\'s Breath',    'shotgun', 2, 72, { ignite:.04 }, 'Incendiary shells. Bring an extinguisher.'],
  ['sg_hammerhead','Hammerhead Slug Gun','shotgun', 3, 95, { dmg:2.2, knock:.12 }, 'One heavy slug. Throws people down corridors.'],
  ['sg_tidal',    'Tidal Riot Gun',      'shotgun', 3, 90, { dmg:1.8, stun:.1 }, 'Rubber slugs, mostly. Painfully mostly.'],
  ['mk_needle',   'Needle Marksman',     'marksman', 1, 50, {}, 'Long, thin and very patient.'],
  ['mk_longshot', 'Longshot DMR',        'marksman', 2, 75, { dmg:1.25, reach:1.1 }, 'Picks off boarders two rooms away. Well, one room. It feels like two.'],
  ['mk_hawk',     'Hawkeye Rifle',       'marksman', 2, 78, { crit:.22 }, 'An old hunting rifle with a very good scope.'],
  ['mk_railgun',  'Personal Railgun',    'marksman', 3, 120, { dmg:1.3, reach:1.2, crit:.2 }, 'Goes through the target, the wall and the target\'s opinion of you.'],
  ['mk_whisper',  'Whisper Rifle',       'marksman', 3, 100, { quick:.6 }, 'Silent. Lethal. Smells faintly of lavender, for some reason.'],
  ['sp_flamer',   'Hab Flamer',          'special', 1, 55, { dmg:1.4, reach:.2, ignite:.08 }, 'Meant for burning out fungus. Works on everything.'],
  ['sp_arc',      'Arc Caster',          'special', 2, 75, { stun:.14 }, 'Throws lightning between people. Everyone dances.'],
  ['sp_cryo',     'Cryo Projector',      'special', 2, 70, { slow:1 }, 'Freezes boarders in their tracks. Literally, a bit.'],
  ['sp_grav',     'Grav Thrower',        'special', 3, 95, { knock:.2, dmg:1.35 }, 'A little Gravity Hammer that works at range.'],
  ['sp_plasma',   'Plasma Caster',       'special', 3, 110, { dmg:1.7, ignite:.03 }, 'Glowing, hissing, lovely. Dangerous to everyone.'],
  ['sp_spore',    'Spore Projector',     'special', 2, 65, { bleed:2.5, dmg:1.2 }, 'Grown, not built. Do not ask by whom.'],
  ['pi_sidearm',  'Commonwealth Sidearm',  'pistol', 1, 25, {}, 'Standard issue. Reliable, unremarkable, always there.'],
  ['pi_viper',    'Viper Revolver',      'pistol', 1, 30, { dmg:1.4, quick:.3 }, 'Six shots. Each one a sentence.'],
  ['pi_dart',     'Dart Pistol',         'pistol', 1, 28, { stun:.08 }, 'Tranquilliser darts. Very relaxing for the target.'],
  ['pi_magnum',   'Hand Cannon',         'pistol', 2, 50, { dmg:1.55, knock:.05 }, 'Heavier than it looks. Kicks like a Jabbit.'],
  ['pi_machine',  'Auto Pistol',         'pistol', 2, 45, { dmg:1.3, spd:.05 }, 'A pistol that wishes it were an SMG.'],
  ['pi_flare',    'Flare Pistol',        'pistol', 2, 35, { ignite:.06 }, 'For signalling. And for starting fires on purpose.'],
  ['pi_ionic',    'Ionic Repeater',      'pistol', 3, 70, { dmg:1.45, stun:.06 }, 'A Thrumm design. Hums a little hymn when it fires.'],
  ['pi_gold',     'Gilded Duelist',      'pistol', 3, 80, { dmg:1.5, crit:.12 }, 'A pyrate captain\'s pride. Polished between shots.'],
  ['ln_tube',     'Tube Launcher',       'launcher', 2, 60, {}, 'One rocket, one room, one very surprised boarding party.'],
  ['ln_grenade',  'Grenade Launcher',    'launcher', 2, 65, { splash:18, dur:35 }, 'Lobs grenades round corners. Mostly round corners.'],
  ['ln_swarm',    'Swarm Launcher',      'launcher', 3, 95, { splash:30 }, 'A volley of micro-missiles that chase heat. Including yours. Careful.'],
  ['ln_foam',     'Foam Launcher',       'launcher', 1, 40, { splash:8, stun:.2 }, 'Sticky foam that sets in seconds. Non-lethal. Mostly.'],
  ['me_knife',    'Combat Knife',        'melee', 1, 15, { bleed:1.5, spd:.04 }, 'Quick and quiet.'],
  ['me_hatchet',  'Boarding Hatchet',    'melee', 1, 22, { dmg:1.55 }, 'For doors, cables and anyone in the way.'],
  ['me_baton',    'Shock Baton',         'melee', 1, 20, { stun:.15, dmg:1.2 }, 'Security\'s favourite argument.'],
  ['me_cutlass',  'Pyrate Cutlass',      'melee', 2, 40, { dmg:1.6, bleed:2 }, 'Swashbuckling, as advertised.'],
  ['me_shard',    'Glass Shard Blade',   'melee', 3, 70, { dmg:1.8, bleed:3 }, 'Sharpened by the Glassborn. Hums when it\'s hungry.'],
  ['me_maul',     'Pebble Maul',         'melee', 2, 45, { dmg:1.7, knock:.1, spd:-.05 }, 'A Pebblekin heirloom: a rock on a stick, but a very good rock.'],
  ['me_claws',    'Jabbit Claw Gloves', 'melee', 2, 50, { dmg:1.5, bleed:2.5 }, 'For people who miss having claws.'],
  ['me_sword',    'Ceremonial Sabre',    'melee', 3, 75, { dmg:1.75, crit:.1 }, 'Commonwealth officers carry them to parades. You carry one to boarding actions.']
];
(function(){ for(const [id, name, cls, tier, cost, o, desc] of LO_WEAPONS){ const C_ = LO_CLASS[cls]; if(!C_ || BASE.arms[id]) continue;
  BASE.arms[id] = Object.assign({ name, kind:C_.kind, cls, slot:C_.slot, tier, cost, desc }, C_.base, o); } })();
function loClass(d){ if(!d) return null; if(d.cls) return d.cls; return d.kind==='gun' ? 'ar' : d.kind==='blade' || d.kind==='blunt' ? 'melee' : 'special'; }
function loSlotOf(d){ if(!d || d.kind==='suit') return 'suit'; if(d.slot) return d.slot; return 'any'; }   // older kit fits either hand
function loFits(d, slot){ const s = loSlotOf(d); return s==='suit' ? slot==='suit' : slot!=='suit' && (s==='any' || s===slot); }

/* ---------------- attachments ---------------- */
const LO_ATT = {
  red_dot:  { name:'Red Dot Sight',  lvl:1, cls:['ar','smg','lmg','shotgun','pistol','marksman','special'], fx:{ dmg:.06 }, text:'+6% damage.' },
  stock:    { name:'Light Stock',    lvl:2, cls:['ar','smg','shotgun','marksman'], fx:{ spd:.06 }, text:'Move 6% faster.' },
  grip:     { name:'Foregrip',       lvl:2, cls:['ar','lmg','smg','shotgun'], fx:{ dmg:.08 }, text:'+8% damage.' },
  ext_mag:  { name:'Extended Mag',   lvl:3, cls:['ar','smg','lmg','pistol','marksman'], fx:{ wear:-.3 }, text:'Wears out 30% slower.' },
  suppressor:{name:'Suppressor',     lvl:3, cls:['ar','smg','pistol','marksman'], fx:{ quick:.3 }, text:'+30% damage in the first seconds of a fight.' },
  scope:    { name:'Scope',          lvl:4, cls:['ar','marksman','lmg'], fx:{ reach:.25 }, text:'Shoots further into the next room.' },
  laser:    { name:'Laser Sight',    lvl:4, cls:['ar','smg','pistol','shotgun','lmg'], fx:{ crit:.08 }, text:'8% chance of a critical hit.' },
  bayonet:  { name:'Bayonet',        lvl:5, cls:['ar','shotgun','marksman'], fx:{ bleed:1.5 }, text:'Close hits make foes bleed.' },
  hollow:   { name:'Hollow Points',  lvl:5, cls:['ar','smg','pistol','lmg','marksman'], fx:{ dmg:.12, wear:.2 }, text:'+12% damage, but wears faster.' },
  drum:     { name:'Drum Mag',       lvl:6, cls:['lmg','smg','shotgun','launcher'], fx:{ wear:-.45 }, text:'Wears out 45% slower.' },
  incend:   { name:'Incendiary Rounds', lvl:7, cls:['ar','smg','lmg','shotgun','pistol'], fx:{ ignite:.03 }, text:'Hits can start fires.' },
  stunrnd:  { name:'Stun Rounds',    lvl:8, cls:['ar','smg','shotgun','pistol','marksman'], fx:{ stun:.06 }, text:'Hits can stun.' },
  edge:     { name:'Monofilament Edge', lvl:3, cls:['melee'], fx:{ bleed:2, dmg:.05 }, text:'Sharper. Much sharper.' },
  wrap:     { name:'Shock Wrap',     lvl:5, cls:['melee'], fx:{ stun:.08 }, text:'A stun coil round the grip.' },
  weight:   { name:'Weighted Head',  lvl:7, cls:['melee'], fx:{ dmg:.12, knock:.05 }, text:'Heavier swings, sometimes knocking foes back.' },
  bigwarhead:{name:'Big Warhead',    lvl:4, cls:['launcher'], fx:{ splash:10 }, text:'A bigger bang.' }
};
function wpnXP(id){ return ((PROFILE.wxp || {})[id]) || 0; }
function wpnLvl(id){ return Math.min(10, 1 + Math.floor(Math.sqrt(wpnXP(id) / 20))); }
function wpnAddXP(id, n){ if(!id || !n) return; PROFILE.wxp = PROFILE.wxp || {}; const b = wpnLvl(id); PROFILE.wxp[id] = (PROFILE.wxp[id] || 0) + n; const a = wpnLvl(id);
  if(a > b && DATA.arms[id]){ const un = Object.entries(LO_ATT).filter(([k, A]) => A.lvl===a && A.cls.includes(loClass(DATA.arms[id]))).map(([k, A]) => A.name); toast(`${DATA.arms[id].name} is level ${a}${un.length ? ': ' + un.join(', ') + ' unlocked' : ''}.`); } }
function attFor(d){ const cl = loClass(d); return Object.keys(LO_ATT).filter(k => LO_ATT[k].cls.includes(cl)); }
function attOn(it, k){ return !!(it && it.att && it.att.includes(k)); }
function attSum(it, key){ let v = 0; if(it && it.dur <= 1 && key!=='wear') return 0; for(const k of (it && it.att) || []) if(LO_ATT[k] && LO_ATT[k].fx[key]) v += LO_ATT[k].fx[key]; return v; }

/* ---------------- perks ---------------- */
const LO_PERKS = {
  scavenger: { slot:1, name:'Scavenger',      text:'Each kill mends their weapon a little.', pro:'Pro: an extra grenade of each kind every fight.', goal:20, stat:'kills' },
  lightweight:{slot:1, name:'Lightweight',    text:'Move 10% faster.', pro:'Pro: move 20% faster.', goal:20, stat:'kills' },
  medic:     { slot:1, name:'Field Medic',    text:'Heals people in the same room 1 health a second.', pro:'Pro: 2 a second.', goal:400, stat:'heal' },
  engineer:  { slot:1, name:'Engineer',       text:'Repairs and fights fires 20% faster.', pro:'Pro: 35% faster.', goal:30, stat:'fixes' },
  stopping:  { slot:2, name:'Stopping Power', text:'+12% damage.', pro:'Pro: +20% damage.', goal:25, stat:'kills' },
  hardened:  { slot:2, name:'Hardened',       text:'Take 12% less damage.', pro:'Pro: 20% less.', goal:25, stat:'kills' },
  flak:      { slot:2, name:'Flak Jacket',    text:'Grenades hurt them half as much.', pro:'Pro: grenades barely scratch them (a quarter).', goal:15, stat:'kills' },
  bloodlust: { slot:2, name:'Bloodlust',      text:'+8% damage for every kill this fight (up to 3).', pro:'Pro: up to 5 kills.', goal:25, stat:'kills' },
  steady:    { slot:3, name:'Steady Aim',     text:'Shots into the next room do 30% more.', pro:'Pro: 50% more, and 5% critical hits.', goal:20, stat:'kills' },
  mask:      { slot:3, name:'Tactical Mask',  text:'Flashbangs, smoke and concussion grenades don\'t affect them.', pro:'Pro: no weapon can stun them either.', goal:20, stat:'kills' },
  silence:   { slot:3, name:'Dead Silence',   text:'For the first 4 seconds of a fight, foes can\'t hurt them.', pro:'Pro: 7 seconds.', goal:20, stat:'kills' },
  sleight:   { slot:3, name:'Sleight of Hand',text:'Their secondary does 25% more.', pro:'Pro: 50% more, and it never wears out.', goal:20, stat:'kills' }
};
function perkPro(id){ return !!(PROFILE.perkPro && PROFILE.perkPro[id]); }
function perkOn(c, id){ if(!c || !c.perks || !LO_PERKS[id]) return false; const i = c.perks.indexOf(id); if(i < 0) return false; return i===3 ? (c.pres || 0) >= 1 : perkUnlocked(c, LO_PERKS[id].slot) && LO_PERKS[id].slot===i + 1; }   // slot 4 is the prestige wildcard: any perk
function perkProg(id, n){ if(!LO_PERKS[id] || perkPro(id) || !n) return; PROFILE.perkProgress = PROFILE.perkProgress || {}; const v = (PROFILE.perkProgress[id] || 0) + n; PROFILE.perkProgress[id] = v;
  if(v >= LO_PERKS[id].goal){ PROFILE.perkPro = PROFILE.perkPro || {}; PROFILE.perkPro[id] = true; toast(`${LO_PERKS[id].name} Pro unlocked! ${LO_PERKS[id].pro}`); if(typeof sfx==='function') sfx('achieve'); saveProfile(); } }
function perkCredit(c, stat, n){ for(const id of c.perks || []) if(LO_PERKS[id] && LO_PERKS[id].stat===stat && perkOn(c, id)) perkProg(id, n); }

/* ---------------- grenades ---------------- */
const LO_LETHAL = {
  frag:   { name:'Frag Grenade',       lvl:2,  text:'25 damage to every foe in the room.' },
  semtex: { name:'Sticky Grenade',     lvl:6,  text:'45 damage to one foe.' },
  fire:   { name:'Incendiary Grenade', lvl:11, text:'12 damage to every foe and sets the room on fire.' },
  plasma: { name:'Plasma Grenade',     lvl:16, text:'30 damage to every foe, and their armour is wrecked.' },
  cluster:{ name:'Cluster Grenade',    lvl:21, text:'18 damage to every foe in the room and the rooms next to it.' } };
const LO_TACT = {
  flash:  { name:'Flashbang',      lvl:5,  text:'Stuns every foe in the room for 2.5 seconds.' },
  stim:   { name:'Stim Shot',      lvl:8,  text:'Heals them 35 and they move faster for a while.' },
  smoke:  { name:'Smoke Grenade',  lvl:12, text:'Foes in the room do half damage for 6 seconds.' },
  concuss:{ name:'Concussion',     lvl:17, text:'Foes are slowed for 5 seconds and stunned for 1.' },
  emp:    { name:'EMP Grenade',    lvl:22, text:'Wrecks drones in the room and shuts down its system for 4 seconds.' } };

/* ---------------- crew levels, abilities, prestige ---------------- */
const LO_MAXL = 30, LO_UNLOCK = { lethal:2, secondary:3, perk1:4, tactical:5, perk2:7, perk3:9 }, LO_ABIL_L = [10, 15, 20, 25];
const LO_ABIL = {
  second_wind: { name:'Second Wind',   text:'Once a fight, when badly hurt, they get 40 health back.' },
  last_stand:  { name:'Last Stand',    text:'Once a fight, a blow that would kill them leaves them on 1 health and untouchable for 2 seconds.' },
  war_cry:     { name:'War Cry',       text:'When a fight starts in their room, everyone on their side there does 20% more for 8 seconds.' },
  surgeon:     { name:'Field Surgeon', text:'Everyone in their room heals 1.5 health a second.' },
  breacher:    { name:'Breacher',      text:'+30% damage aboard an enemy ship.' },
  quartermaster:{name:'Quartermaster', text:'All their kit wears out 30% slower.' },
  juggernaut:  { name:'Juggernaut',    text:'+30 maximum health.' },
  sprinter:    { name:'Sprinter',      text:'Move 15% faster.' } };
function loNeed(L){ return 25 + 12*L; }
function loLvl(c){ return (c && c.lvl) || 1; }
function perkUnlocked(c, slot){ return loLvl(c) >= LO_UNLOCK['perk' + slot]; }
function abilOn(c, id){ return !!(c && c.abil && c.abil.includes(id)); }
function loGain(c, n){ if(!c || c.drone || c.owner!=='p' || !n) return; c.lvl = c.lvl || 1; c.cxp = (c.cxp || 0) + n;
  while(c.lvl < LO_MAXL && c.cxp >= loNeed(c.lvl)){ c.cxp -= loNeed(c.lvl); c.lvl++; loLevelUp(c); } if(c.lvl >= LO_MAXL) c.cxp = Math.min(c.cxp, loNeed(LO_MAXL)); }
function loLevelUp(c){ const un = []; for(const [k, L] of Object.entries(LO_UNLOCK)) if(L===c.lvl) un.push({ lethal:'a lethal grenade slot', secondary:'a secondary weapon', perk1:'perk slot 1', tactical:'a tactical grenade slot', perk2:'perk slot 2', perk3:'perk slot 3' }[k]);
  for(const [k, G_] of Object.entries(LO_LETHAL)) if(G_.lvl===c.lvl && G_.lvl > 2) un.push(G_.name); for(const [k, G_] of Object.entries(LO_TACT)) if(G_.lvl===c.lvl && G_.lvl > 5) un.push(G_.name);
  if(LO_ABIL_L.includes(c.lvl)) un.push('a new ability');
  if(c.lvl===LO_MAXL) un.push('Prestige');
  if(typeof loSyncHp==='function') loSyncHp(c);
  toast(`${c.name} reached level ${c.lvl}: tougher and stronger${un.length ? ', and ' + un.join(', ') : ''}. Tap Crew to see.`); if(typeof sfx==='function') sfx('levelup');
  if(c.lvl===LO_UNLOCK.lethal && !c.lethal) c.lethal = 'frag'; if(c.lvl===LO_UNLOCK.tactical && !c.tactical) c.tactical = 'flash'; }
function loPrestige(c){ if(!c || loLvl(c) < LO_MAXL || (c.pres||0) >= 10) return; c.pres = (c.pres || 0) + 1; c.lvl = 1; c.cxp = 0; c.perks = []; c.lethal = null; c.tactical = null; if(typeof loSyncHp==='function') loSyncHp(c);
  toast(`${c.name} prestiges: ★${c.pres}. Back to level 1 with +5 health and +3% damage for good, abilities kept${c.pres===1 ? ', and a wildcard perk slot that takes any perk' : ''}.`); if(typeof sfx==='function') sfx('achieve'); if(typeof grant==='function' && c.pres===1) grant('first_prestige'); }
if(typeof ACHIEVEMENTS!=='undefined' && !ACHIEVEMENTS.some(a => a.id==='first_prestige')) ACHIEVEMENTS.push({ id:'first_prestige', name:'Once More, With Feeling', desc:'Prestige a crew member.' }, { id:'perk_pro', name:'Professional', desc:'Unlock a Pro perk.' }, { id:'wpn_max', name:'Old Faithful', desc:'Take a crew weapon to level 10.' });

/* ---------------- in a fight ---------------- */
function loSideOk(c){ return c.owner!=='p' || loLvl(c) >= LO_UNLOCK.secondary; }   // your crew carry a secondary from level 3
/* the secondary takes over when the primary is missing, or worn out while the secondary is still in good shape */
function loPrimDown(c){ const w = it => typeof armWorn==='function' && armWorn(it); return !armLive(c.arm) || (w(c.arm) && c.side && armLive(c.side) && !w(c.side)); }
function loActive(c){ if(!loPrimDown(c)) return c.arm; if(c.side && armLive(c.side) && loSideOk(c)) return c.side; return armLive(c.arm) ? c.arm : null; }
function loActiveDef(c){ const it = loActive(c); return it ? armDef(it) : null; }
function loFightingT(c){ return c._fT || 0; }
(function(){
  // damage from the weapon in hand, its attachments, perks, abilities and prestige
  const m0 = armMult; armMult = function(c){ if(!c || c.drone) return m0(c); const it = loActive(c), d = it && armDef(it); let m = d ? (d.dmg || 1) : 1;
    if(it){ m += attSum(it, 'dmg'); const crit = (d.crit || 0) + attSum(it, 'crit') + (perkOn(c, 'steady') && perkPro('steady') ? .05 : 0); m *= 1 + crit; const qk = (d.quick || 0) + attSum(it, 'quick'); if(qk && loFightingT(c) < 3) m *= 1 + qk;
      if(it===c.side && perkOn(c, 'sleight')) m *= perkPro('sleight') ? 1.5 : 1.25; }
    if(perkOn(c, 'stopping')) m *= perkPro('stopping') ? 1.2 : 1.12;
    if(perkOn(c, 'bloodlust')) m *= 1 + .08*Math.min(perkPro('bloodlust') ? 5 : 3, c._fk || 0);
    if(c._cryT > 0) m *= 1.2; if(c._smokeT > 0) m *= .5; if(abilOn(c, 'breacher') && G && G.enemy && G.enemy.crew.includes(c)) m *= 1.3;
    if(c.pres) m *= 1 + .03*c.pres; return m; };
  const t0 = armTake; armTake = function(c){ let t = t0(c); if(!c || c.drone) return t; if(c._invT > 0) return 0; if(perkOn(c, 'silence') && loFightingT(c) < (perkPro('silence') ? 7 : 4)) return 0;
    if(perkOn(c, 'hardened')) t *= perkPro('hardened') ? .8 : .88; return t; };
  const r0 = armRepair; armRepair = function(c){ let r = r0(c); if(perkOn(c, 'engineer')) r *= perkPro('engineer') ? 1.35 : 1.2; return r; };
  const f0 = armFire; armFire = function(c){ let r = f0(c); if(perkOn(c, 'engineer')) r *= perkPro('engineer') ? 1.35 : 1.2; return r; };
  // the secondary takes over when the primary breaks; tricks from the weapon in hand and its attachments
  const h0 = armHit; armHit = function(a, tgt, dt, dealt, sh, room){ const swap = loPrimDown(a) && a.side && armLive(a.side) && loSideOk(a); const keep = a.arm; if(swap) a.arm = a.side;
    try{ h0(a, tgt, dt, dealt, sh, room); } finally { if(swap){ a.side = a.arm; a.arm = keep; } }
    const it = loActive(a); if(!it) return; const d = armDef(it); wpnAddXP(it.id, dt*.5);
    const stun = attSum(it, 'stun'), bleed = attSum(it, 'bleed'), ign = (d.ignite || 0) + attSum(it, 'ignite'), kn = attSum(it, 'knock');
    if(stun && Math.random() < stun*dt && !(perkOn(tgt, 'mask') && perkPro('mask'))){ tgt.stunT = Math.max(tgt.stunT||0, 1.4); armFx(sh, room, 'STUNNED'); }
    if(bleed){ tgt.bleed = Math.max(tgt.bleed||0, bleed); tgt.bleedT = 4; }
    if(ign && Math.random() < ign*dt){ igniteRoom(sh, room); armFx(sh, room, 'FIRE!'); }
    if(kn && Math.random() < kn*dt) armShove(sh, tgt, room);
    if(d.slow) tgt._slowT = 3; };
  // wear: attachments, perks and abilities
  const w0 = wear; wear = function(it, c, n){ if(!it) return; let k = 1 + attSum(it, 'wear'); if(c && abilOn(c, 'quartermaster')) k *= .7; if(c && it===c.side && perkOn(c, 'sleight') && perkPro('sleight')) k = 0; w0(it, c, n*Math.max(0, k)); };
  // speed from weapons, attachments, perks and abilities (itemBuff feeds movement)
  const i0 = itemBuff; itemBuff = function(c, k){ let v = i0(c, k); if(!c || c.drone) return v;
    if(k==='spd'){ const it = loActive(c), d = it && armDef(it); if(d && d.spd) v += d.spd; if(it) v += attSum(it, 'spd'); if(perkOn(c, 'lightweight')) v += perkPro('lightweight') ? .2 : .1; if(abilOn(c, 'sprinter')) v += .15; if(c._slowT > 0) v -= .35; if(c._stimT > 0) v += .25; }
    return v; };
  // last stand
  if(typeof devotedSave==='function'){ const d0 = devotedSave; devotedSave = function(c){ if(d0(c)) return true; if(c && c.owner==='p' && abilOn(c, 'last_stand') && !c._lsUsed){ c._lsUsed = true; c.hp = 1; c._invT = 2; toast(`${c.name} refuses to go down!`); return true; } return false; }; }
  // skill practice counts towards crew levels
  const g0 = gainXP; gainXP = function(c, s, amt){ g0(c, s, amt); if(c && c.owner==='p' && !c.drone){ loGain(c, amt); if(s==='repair') perkCredit(c, 'fixes', 1); } };
})();
/* grenades, abilities, reach for the secondary, kills and fight timers: every tick, for each ship */
function loTick(sh, dt){
  if(!sh || !G || !sh.crew) return;
  for(const c of sh.crew){ if(c.drone) continue; for(const k of ['_invT', '_smokeT', '_cryT', '_slowT', '_stimT']) if(c[k] > 0) c[k] -= dt; }
  const foesIn = (room, side) => sh.crew.filter(o => o.room===room && o.hp > 0 && crewSide(o)!==side && !o.path.length);
  for(const c of [...sh.crew]){ if(c.drone || c.hp <= 0) continue; const side = crewSide(c), here = c.path.length ? [] : foesIn(c.room, side);
    if(here.length){ c._fT = (c._fT || 0) + dt;
      if(!c._gUsed && G.enemy){ c._gUsed = true; loThrow(sh, c, here); }
      if(abilOn(c, 'war_cry') && !c._wcUsed){ c._wcUsed = true; for(const o of sh.crew) if(o.room===c.room && crewSide(o)===side) o._cryT = 8; armFx(sh, c.room, 'WAR CRY'); }
      if(abilOn(c, 'second_wind') && !c._swUsed && c.hp < c.maxHp*.25){ c._swUsed = true; c.hp = Math.min(c.maxHp, c.hp + 40); armFx(sh, c.room, 'SECOND WIND'); } }
    else c._fT = 0;
    // healers
    const heal = (perkOn(c, 'medic') ? (perkPro('medic') ? 2 : 1) : 0) + (abilOn(c, 'surgeon') ? 1.5 : 0);
    if(heal && !c.path.length) for(const o of sh.crew) if(o.room===c.room && crewSide(o)===side && !o.drone && o.hp < o.maxHp){ const h = Math.min(o.maxHp - o.hp, heal*dt); o.hp += h; if(c.owner==='p') perkCredit(c, 'heal', h); }
    // kills: crew xp, weapon xp, perk progress, scavenger, bloodlust
    const k = c.kills || 0; if(c._k0==null) c._k0 = k; if(k > c._k0){ const n = k - c._k0; c._k0 = k; c._fk = (c._fk || 0) + n;
      if(c.owner==='p'){ loGain(c, 10*n); const it = loActive(c); if(it){ wpnAddXP(it.id, 10*n); if(wpnLvl(it.id) >= 10 && typeof grant==='function') grant('wpn_max'); } perkCredit(c, 'kills', n);
        if(perkOn(c, 'scavenger') && it){ const d = armDef(it); it.dur = Math.min(d.dur, it.dur + 12*n); } } }
    // the secondary's reach, when the primary is broken
    if(loPrimDown(c) && c.side && armLive(c.side) && loSideOk(c) && !c.path.length && c.stunT <= 0 && G.enemy){ const d = armDef(c.side), reach = (d.reach || 0) + attSum(c.side, 'reach'); if(reach){
      const near = sh.rooms.map((r, i) => i).filter(i => i!==c.room && roomDist(sh, c.room, i) <= 1.4); let tgt = null;
      for(const i of near) for(const o of sh.crew) if(o.room===i && o.hp > 0 && !o.path.length && crewSide(o)!==side && (!tgt || o.hp < tgt.hp)) tgt = o;
      if(tgt){ tgt.hp -= crewDps(c)*armMult(c)*reach*armTake(tgt)*dt*(perkOn(c, 'steady') ? (perkPro('steady') ? 1.5 : 1.3) : 1); tgt.lastByCrew = c.id; wear(c.side, c, dt*.6);
        if(tgt.hp <= 0 && !tgt._counted){ tgt._counted = true; c.kills = (c.kills||0) + 1; }
        if(d.splash && !c._spUsed){ c._spUsed = true; for(const o of sh.crew) if(o.room===tgt.room && crewSide(o)!==side && o.hp > 0) o.hp -= (d.splash + attSum(c.side, 'splash')) * armTake(o); armFx(sh, tgt.room, 'BOOM'); } } } } }
}
function loThrow(sh, c, foes){
  const side = crewSide(c), n = c.owner==='e' ? 1 : (perkOn(c, 'scavenger') && perkPro('scavenger') ? 2 : 1), room = c.room, flak = o => perkOn(o, 'flak') ? (perkPro('flak') ? .25 : .5) : 1, masked = o => perkOn(o, 'mask');
  for(let k = 0; k < n; k++){
    const T_ = c.tactical && loLvl(c) >= (LO_TACT[c.tactical] || {}).lvl ? c.tactical : null;
    if(T_==='flash'){ for(const o of foes) if(!masked(o)) o.stunT = Math.max(o.stunT||0, 2.5); armFx(sh, room, 'FLASHBANG'); }
    else if(T_==='stim'){ c.hp = Math.min(c.maxHp, c.hp + 35); c._stimT = 8; armFx(sh, room, 'STIM'); }
    else if(T_==='smoke'){ for(const o of foes) if(!masked(o)) o._smokeT = 6; armFx(sh, room, 'SMOKE'); }
    else if(T_==='concuss'){ for(const o of foes) if(!masked(o)){ o._slowT = 5; o.stunT = Math.max(o.stunT||0, 1); } armFx(sh, room, 'CONCUSSION'); }
    else if(T_==='emp'){ const r = sh.rooms[room]; if(r && r.sys && sh.systems[r.sys] && typeof ionize==='function') ionize(sh, r.sys, 1); for(const o of foes) if(o.drone) o.hp -= 60; armFx(sh, room, 'EMP'); }
    const L_ = c.lethal && loLvl(c) >= (LO_LETHAL[c.lethal] || {}).lvl ? c.lethal : null;
    if(L_==='frag'){ for(const o of foes) o.hp -= 25*flak(o)*armTake(o); armFx(sh, room, 'FRAG OUT'); }
    else if(L_==='semtex'){ let t = foes[0]; for(const o of foes) if(o.hp > t.hp) t = o; t.hp -= 45*flak(t)*armTake(t); armFx(sh, room, 'STUCK!'); }
    else if(L_==='fire'){ for(const o of foes) o.hp -= 12*flak(o); igniteRoom(sh, room); armFx(sh, room, 'INCENDIARY'); }
    else if(L_==='plasma'){ for(const o of foes){ o.hp -= 30*flak(o)*armTake(o); if(o.suit) o.suit.dur = Math.min(o.suit.dur, 1); } armFx(sh, room, 'PLASMA'); }
    else if(L_==='cluster'){ const near = sh.rooms.map((r, i) => i).filter(i => i===room || roomDist(sh, room, i) <= 1.4); for(const o of sh.crew) if(near.includes(o.room) && crewSide(o)!==side && o.hp > 0) o.hp -= 18*flak(o)*armTake(o); armFx(sh, room, 'CLUSTER'); }
    for(const o of foes) if(o.hp <= 0 && !o._counted){ o._counted = true; c.kills = (c.kills||0) + 1; o.lastByCrew = c.id; } }
}
(function(){ if(typeof armsTick==='function'){ const a0 = armsTick; armsTick = function(sh, dt){
  // the primary's reach code in arms.js only looks at c.arm: let a working secondary stand in when the primary is broken
  const swapped = []; for(const c of sh.crew) if(!c.drone && loPrimDown(c) && c.side && armLive(c.side) && loSideOk(c) && armDef(c.side).reach){ swapped.push([c, c.arm]); c.arm = c.side; }
  try{ a0(sh, dt); } finally { for(const [c, keep] of swapped){ c.side = c.arm; c.arm = keep; } }
  try{ loTick(sh, dt); }catch(e){} }; } })();
(function(){ if(typeof livingCombatStart!=='function') return; const l0 = livingCombatStart; livingCombatStart = function(e, def, o){ l0(e, def, o);
  for(const sh of [G.ship, e]) if(sh) for(const c of sh.crew){ c._gUsed = false; c._wcUsed = false; c._swUsed = false; c._lsUsed = false; c._spUsed = false; c._fk = 0; c._fT = 0; c._k0 = c.kills || 0; }
  if(e && G.sector >= 4) for(const c of e.crew) if(!c.drone && Math.random() < .12 + .05*G.sector){ c.lvl = 30; c.lethal = pick(['frag', 'semtex', 'frag']); c.tactical = G.sector >= 6 && Math.random() < .5 ? pick(['flash', 'smoke']) : null; } }; })();
// a fight won: everyone who lived through it learns something
(function(){ if(typeof repCombatEnd!=='function') return; const r0 = repCombatEnd; repCombatEnd = function(kind, e){ r0(kind, e); if(!G || !G.ship) return; for(const c of G.ship.crew) if(c.owner==='p' && !c.drone && c.hp > 0){ loGain(c, kind==='fled' ? 5 : 15); const it = loActive(c); if(it && (c._fT || c._fk)) wpnAddXP(it.id, 5); } }; })();
(function(){ if(typeof perkProg!=='function') return; const p0 = perkProg; perkProg = function(id, n){ const was = perkPro(id); p0(id, n); if(!was && perkPro(id) && typeof grant==='function') grant('perk_pro'); }; })();
// juggernaut adds health when picked (and takes it back when unpicked)
function loSetAbil(c, i, id){ c.abil = c.abil || []; const old = c.abil[i]; if(old==='juggernaut'){ c.maxHp -= 30; c.hp = Math.min(c.hp, c.maxHp); } c.abil[i] = id; if(id==='juggernaut'){ c.maxHp += 30; c.hp += 30; } }

/* ---------------- the Loadouts view (Ship → Crew → Armoury) ---------------- */
function loCycle(list, cur, dir){ const i = list.indexOf(cur); return list[(i + dir + list.length) % list.length]; }
function drawLoadoutView(f, cx, y0){
  const s = G.ship, crew = s.crew.filter(c => c.owner==='p' && !c.drone), W2 = f.w - 64; if(!crew.length) return;
  // phones: bigger rows and text, using the space the help line would take
  const K = typeof readScale==='function' && readScale() > 1 ? 1.24 : 1, z = n => Math.round(n*K), ts = n => Math.round(n*(K > 1 ? 1.4 : 1));
  let c = crew.find(x => x.id===UI.loCrew) || crew[0]; UI.loCrew = c.id;
  // the crew list
  const LW = K > 1 ? 230 : 270, LH = z(58);
  crew.slice(0, 8).forEach((o, i) => { const y = y0 + 30 + i*(LH + 8), on = o===c; rr(cx, y, LW, LH, 8); ctx.fillStyle = on ? hexA(C.amber, .14) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : C.line; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    drawPortrait(cx + 28, y + LH/2, 20, o, false); T(o.name, cx + 58, y + LH/2 - 5, { s:ts(16), f:FD, w:700, max:LW - 66 }); T(`Lv ${loLvl(o)}${o.pres ? '  ' + '★'.repeat(Math.min(5, o.pres)) + (o.pres > 5 ? '+' : '') : ''}`, cx + 58, y + LH/2 + ts(17), { s:ts(13), c:C.amber });
    region(cx, y, LW, LH, () => { UI.loCrew = o.id; }, 'lo:' + o.id); });
  const x = cx + LW + 20, w = W2 - LW - 20, L = loLvl(c);
  // header: level, xp, prestige, roster
  T(c.name, x, y0 + 20, { s:ts(26), f:FD, w:700, max:260 }); T(`Level ${L}${c.pres ? ` · ★${c.pres}` : ''}`, x + 280, y0 + 18, { s:ts(17), f:FD, w:700, c:C.amber, max:w - 720 });
  const need = loNeed(L), fr = L >= LO_MAXL ? 1 : clamp((c.cxp || 0) / need, 0, 1); bar(x, y0 + 32, 480, 8, fr, C.amber, 'rgba(255,255,255,.08)'); T(L >= LO_MAXL ? 'Max level' : `${Math.floor(c.cxp || 0)} / ${need} xp`, x + 490, y0 + 41, { s:ts(12), c:C.muted });
  if(L >= LO_MAXL && (c.pres||0) < 10) btn(x + w - 420, y0 - 2, 200, z(44), UI.presAsk===c.id ? 'Sure? Tap again' : '★ Prestige', () => { if(UI.presAsk!==c.id){ UI.presAsk = c.id; return; } UI.presAsk = null; loPrestige(c); }, { s:ts(15), col:C.violet || '#c48bff', fill:UI.presAsk===c.id });
  if(typeof rosterSave==='function') btn(x + w - 210, y0 - 2, 210, z(44), 'Save to roster', () => rosterSave(c), { s:ts(14), col:C.cyan });
  // rows
  const RH = z(62), RG = 6, BH = z(38), by = (yy) => yy + (RH - BH)/2;
  const row = (y, title, locked, body) => { rr(x, y, w, RH, 8); ctx.fillStyle = 'rgba(6,9,18,.55)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); label(title, x + 14, y + ts(12) + 8, locked ? C.muted : C.amber, 'left', ts(12));
    if(locked){ T(`Unlocks at level ${locked}`, x + 14, y + RH - 14, { s:ts(14), c:C.muted }); return; } body(y); };
  const locker = armLocker(), AX = K > 1 ? 470 : 500;   // where the attachment / grenade columns start
  const cyc = (bx, yy, bw, cur, sub, onL, onR, col) => { btn(bx, by(yy), 34*K, BH, '‹', onL, { s:ts(14) }); btn(bx + bw - 34*K, by(yy), 34*K, BH, '›', onR, { s:ts(14) });
    T(cur.t, bx + bw/2, yy + RH/2 - (K > 1 ? 2 : 1), { s:ts(13), a:'center', c:cur.c, max:bw - 84*K }); T(sub, bx + bw/2, yy + RH/2 + ts(14), { s:ts(11), a:'center', c:C.muted, max:bw - 84*K }); };
  const weaponRow = (y, slot, key) => row(y, slot==='primary' ? 'Primary' : 'Secondary', slot==='secondary' && L < LO_UNLOCK.secondary ? LO_UNLOCK.secondary : 0, yy => {
    const it = c[key], d = it && armDef(it), opts = [null, ...locker.filter(o => armDef(o) && loFits(armDef(o), slot))]; if(it) opts.splice(1, 0, it);
    T(d ? d.name : 'Empty', x + 14, yy + RH - 14, { s:ts(16), f:FD, w:700, c: d ? (it.dur > 0 ? C.ink : C.hostile) : C.muted, max:K > 1 ? 230 : 250 });
    if(d){ if(K===1) T(`${(LO_CLASS[loClass(d)] || {}).name || ''} · Lv ${wpnLvl(it.id)}`, x + 270, yy + 22, { s:11, c:C.muted, max:124 }); else T(`Lv ${wpnLvl(it.id)}`, x + 250, yy + 24, { s:ts(11), c:C.muted });
      bar(x + (K > 1 ? 250 : 270), yy + RH/2 + 4, K > 1 ? 110 : 120, 6, armFrac(it), it.dur > 0 ? C.good : C.hostile, 'rgba(255,255,255,.08)'); tip(x, yy, 400, RH, d.name, `${(LO_CLASS[loClass(d)] || {}).name || ''}. ${d.desc} ${armStatLine(d)}`); }
    btn(x + AX - 100, by(yy), 40, BH, '‹', () => loSwap(c, key, opts, -1), { s:ts(15) }); btn(x + AX - 56, by(yy), 40, BH, '›', () => loSwap(c, key, opts, 1), { s:ts(15) });
    if(d){ const atts = attFor(d), lv = wpnLvl(it.id); it.att = it.att || []; for(let j = 0; j < 2; j++){ const ax = x + AX + j*(w - AX)/2, aw = (w - AX)/2 - 10, cur = it.att[j] || null, A = cur && LO_ATT[cur];
      const free = [null, ...atts.filter(k => LO_ATT[k].lvl <= lv && !it.att.includes(k)) ]; if(cur) free.splice(1, 0, cur);
      const set = dir => { const v = loCycle(free, cur, dir); it.att[j] = v; it.att = it.att.filter(Boolean); };
      cyc(ax, yy, aw, { t:A ? A.name : 'No attachment', c:A ? C.good : C.muted }, A ? A.text : `${atts.filter(k => LO_ATT[k].lvl <= lv).length}/${atts.length} unlocked`, () => set(-1), () => set(1)); } } });
  let y = y0 + 56 + (K > 1 ? 6 : 0); weaponRow(y, 'primary', 'arm'); y += RH + RG; weaponRow(y, 'secondary', 'side'); y += RH + RG;
  row(y, 'Armour', 0, yy => { const it = c.suit, d = it && armDef(it), opts = [null, ...locker.filter(o => armDef(o) && armDef(o).kind==='suit')]; if(it) opts.splice(1, 0, it);
    T(d ? d.name : 'None', x + 14, yy + RH - 14, { s:ts(16), f:FD, w:700, c: d ? C.ink : C.muted, max:AX - 120 }); btn(x + AX - 100, by(yy), 40, BH, '‹', () => loSwap(c, 'suit', opts, -1), { s:ts(15) }); btn(x + AX - 56, by(yy), 40, BH, '›', () => loSwap(c, 'suit', opts, 1), { s:ts(15) });
    // grenades
    const half = (w - AX)/2 - 10; [['lethal', LO_LETHAL, LO_UNLOCK.lethal, 'Lethal'], ['tactical', LO_TACT, LO_UNLOCK.tactical, 'Tactical']].forEach(([key, LIST, need_, nm], j) => { const gx = x + AX + j*(half + 10);
      if(L < need_){ T(`${nm}: level ${need_}`, gx + half/2, yy + RH/2 + 6, { s:ts(13), a:'center', c:C.muted }); return; }
      const opts_ = [null, ...Object.keys(LIST).filter(k => LIST[k].lvl <= L)], cur = c[key] || null, G_ = cur && LIST[cur];
      cyc(gx, yy, half, { t:G_ ? G_.name : `No ${nm.toLowerCase()}`, c:G_ ? (key==='lethal' ? C.hostile : C.cyan) : C.muted }, G_ ? G_.text : nm, () => { c[key] = loCycle(opts_, cur, -1); }, () => { c[key] = loCycle(opts_, cur, 1); }); }); });
  y += RH + RG + 2;
  // perks
  const PH = z(92), pw = (w - 20)/3; [1, 2, 3].forEach(sl => { const px = x + (sl - 1)*(pw + 10), need_ = LO_UNLOCK['perk' + sl]; c.perks = c.perks || [];
    rr(px, y, pw, PH, 8); ctx.fillStyle = 'rgba(6,9,18,.55)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); label(`Perk ${sl}`, px + 12, y + ts(12) + 8, [0, '#5fd3e6', '#ff5a7a', '#ffd166'][sl], 'left', ts(12));
    if(L < need_){ T(`Unlocks at level ${need_}`, px + 12, y + PH/2 + 8, { s:ts(14), c:C.muted }); return; }
    const opts = [null, ...Object.keys(LO_PERKS).filter(k => LO_PERKS[k].slot===sl)], cur = c.perks[sl - 1] || null, P = cur && LO_PERKS[cur];
    btn(px + pw - 82*K, y + 6, 36*K, 30*K, '‹', () => { c.perks[sl - 1] = loCycle(opts, cur, -1); }, { s:ts(13) }); btn(px + pw - 42*K, y + 6, 36*K, 30*K, '›', () => { c.perks[sl - 1] = loCycle(opts, cur, 1); }, { s:ts(13) });
    T(P ? P.name + (perkPro(cur) ? '  PRO' : '') : 'Choose…', px + 12, y + z(50), { s:ts(15), f:FD, w:700, c: P ? (perkPro(cur) ? C.amber : C.ink) : C.muted, max:pw - 24 });
    if(P){ T(perkPro(cur) ? P.pro : P.text, px + 12, y + z(70), { s:ts(11), c:C.muted, max:pw - 24 }); const prog = (PROFILE.perkProgress || {})[cur] || 0; if(!perkPro(cur)) T(`Pro: ${Math.floor(prog)}/${P.goal} ${P.stat==='heal' ? 'health healed' : P.stat==='fixes' ? 'repairs' : 'kills'}`, px + 12, y + z(87), { s:ts(10), c:C.cyan, max:pw - 24 }); tip(px, y, pw, PH, P.name, `${P.text} ${P.pro}`); } });
  y += PH + 8;
  // abilities
  const AH = z(76), aw = (w - 30)/4; LO_ABIL_L.forEach((need_, j) => { const ax = x + j*(aw + 10); c.abil = c.abil || []; rr(ax, y, aw, AH, 8); ctx.fillStyle = 'rgba(6,9,18,.55)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    label(`Ability ${j + 1}`, ax + 12, y + ts(12) + 8, C.violet || '#c48bff', 'left', ts(12));
    if(L < need_ && !c.abil[j] && !c.pres){ T(`Level ${need_}`, ax + 12, y + AH/2 + 12, { s:ts(14), c:C.muted }); return; }
    const taken = c.abil.filter((a, k) => k!==j), opts = [null, ...Object.keys(LO_ABIL).filter(k => !taken.includes(k))], cur = c.abil[j] || null, A = cur && LO_ABIL[cur];
    btn(ax + aw - 74*K, y + 6, 32*K, 28*K, '‹', () => loSetAbil(c, j, loCycle(opts, cur, -1)), { s:ts(12) }); btn(ax + aw - 38*K, y + 6, 32*K, 28*K, '›', () => loSetAbil(c, j, loCycle(opts, cur, 1)), { s:ts(12) });
    T(A ? A.name : 'Choose…', ax + 12, y + z(50), { s:ts(14), f:FD, w:700, c: A ? C.ink : C.muted, max:aw - 24 }); if(A){ if(K===1) T(A.text, ax + 12, y + 68, { s:10, c:C.muted, max:aw - 24 }); else T('Tap for details', ax + 12, y + z(68), { s:ts(10), c:C.muted }); tip(ax, y, aw, AH, A.name, A.text); } });
  y += AH + 10; if(K===1) para('Crew level up by fighting, repairing and manning stations, in every run. Weapons level up across all your runs, unlocking attachments. Use a perk enough and its Pro version unlocks for everyone. At level 30, prestige for a permanent edge.', x, y + 14, w, { s:12, lh:17, c:C.muted, max:2 });
}
function loSwap(c, key, opts, dir){ const cur = c[key] || null, next = loCycle(opts, cur, dir), L = armLocker();
  if(cur) L.push(cur); if(next){ const i = L.indexOf(next); if(i >= 0) L.splice(i, 1); } c[key] = next; sfx && sfx('click'); }
// the Armoury tab: Loadouts first
(function(){ if(typeof drawArmouryTab!=='function') return; const d0 = drawArmouryTab; drawArmouryTab = function(f, cx, y0){ const v = UI.armView || 'loadout';
  btn(cx + 640, y0 - 8, 220, 34, 'Loadouts', () => { UI.armView = 'loadout'; }, { s:13, fill:v==='loadout', col:C.amber });
  if(v==='loadout'){ btn(cx + 880, y0 - 8, 240, 34, 'Locker', () => { UI.armView = 'kit'; }, { s:13 }); btn(cx + 1128, y0 - 8, 220, 34, 'Tonics & treats', () => { UI.armView = 'tonics'; }, { s:13, col:C.good }); drawLoadoutView(f, cx, y0 + 44); return; }
  d0(f, cx, y0); }; })();
// new crew from the start of a run get a sidearm; level 1 everyone
(function(){ const n0 = newRun; newRun = function(id, name, o = {}){ n0(id, name, o); if(!G || !G.ship) return; for(const c of G.ship.crew) if(c.owner==='p' && !c.drone){ c.lvl = c.lvl || 1; c.cxp = c.cxp || 0; if(!c.side && !c.arm) c.side = armNew('pi_sidearm', 1); } }; })();
