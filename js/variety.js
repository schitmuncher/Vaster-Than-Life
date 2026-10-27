'use strict';
/* =========================================================================
   Variety: more of the things a captain meets again and again, so long runs
   and repeat runs stay fresh. Found by playtesting hundreds of runs:
   - more hails for every faction (a run no longer sees the same hail twice
     until it has seen the rest), with more ways to talk your way out
   - more crew chatter, taunts, victory and surrender lines, store greetings,
     quiet beacons, hazard arrivals and sector intros
   - six new early and mid-game ships, so sectors 1 and 2 aren't the same
     handful of hulls
   Placeholders as in story.js: {crew}, {who}, {ship}, {enemy}.
   ========================================================================= */
const MORE_HAILS = {
  /* Rebuff */
  hail_rebuff4:{ hail:'rebuff', text:'"This is a routine customs inspection, {ship}. Please do not resist. Resisting is a separate form and the queue is very long."', choices:[
    { text:'Open fire before they finish the sentence.', effect:fightNow },
    { text:'Fill in the form. All forty pages.', effect:{ text:'{crew} fills in every box, including the one marked "do not fill in this box". The inspector, defeated by paperwork, lets you go with a stamp and a sigh.', dismiss:true, xp:{ skill:'pilot', amt:2 } } },
    { text:'Smuggle {who} into their ship while they inspect yours.', req:{ race:'mantlis' }, chance:.6, success:{ text:'{who} comes back with a bag of their scrap and a Rebuff hat. The inspectors never notice.', dismiss:true, scrap:30 }, fail:{ text:'{who} is spotted eating their coffee machine. Alarms everywhere.', begin:true } } ] },
  hail_rebuff5:{ hail:'rebuff', text:'The {enemy} broadcasts your picture on every channel. Underneath: WANTED. The reward is insultingly small.', choices:[
    { text:'Make them pay for that number.', effect:fightNow },
    { text:'Call in to complain about the reward.', chance:.4, success:{ text:'The duty officer agrees it is far too low, raises it, and in the paperwork chaos forgets to shoot. You slip away.', dismiss:true }, fail:{ text:'"Complaint noted. Response: lasers."', begin:true } },
    { text:'Jam their broadcast and vanish behind it.', req:{ system:'sensors', level:2 }, effect:{ text:'Their screens fill with static and a looping clip of a cat. By the time it clears you are long gone.', dismiss:true } } ] },
  hail_rebuff6:{ hail:'rebuff', text:'"Captain of the {ship}: you are in violation of six regulations, nine statutes and one very strongly worded memo."', choices:[
    { text:'"Only one memo? Let\'s fix that."', effect:fightNow },
    { text:'Accept a fine of 15 scrap.', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'They issue a receipt, in triplicate, and leave you in peace.', dismiss:true } },
    { text:'Bluff that you outrank them.', chance:.3, success:{ text:'You invent a rank. They salute it. You even get a little ration of their fuel for your "inspection tour".', dismiss:true, fuel:2 }, fail:{ text:'"There is no such rank as Grand Admiral of Snacks." Weapons hot.', begin:true } } ] },
  /* Pyrates */
  hail_pyrate4:{ hail:'pyrate', text:'"Oi! This is a toll space-lane. Tolls be: everything. Pay up or swim home."', choices:[
    { text:'Pay in lasers.', effect:fightNow },
    { text:'Pay a fair toll (10 scrap) and haggle hard.', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'After ten minutes of shouting they accept your 10 scrap and throw in a drone part to stop you talking.', dismiss:true, parts:1 } },
    { text:'Ask {who} to explain, slowly, what a geode does to a hull.', req:{ race:'pebblekin' }, effect:{ text:'{who} taps on the window with one finger. The pyrates decide the toll is waived for rocks.', dismiss:true } } ] },
  hail_pyrate5:{ hail:'pyrate', text:'The {enemy} plays a sea shanty at full volume across every channel. It is very long. There are more verses coming. Their guns roll out on the chorus.', choices:[
    { text:'End the song. Fire!', effect:fightNow },
    { text:'Sing back.', chance:.45, success:{ text:'{crew} belts out a counter-shanty so good the pyrates weep, applaud and toss you a crate of missiles for the encore you will never perform.', dismiss:true, missiles:2 }, fail:{ text:'{crew} forgets the words after "Oh". The pyrates are offended on behalf of music.', begin:true } } ] },
  hail_pyrate6:{ hail:'pyrate', text:'"We\'re not pyrates! We\'re, er, freelance redistribution consultants. Please stand still while we consult your cargo hold."', choices:[
    { text:'Decline the consultation.', effect:fightNow },
    { text:'Hire them instead: 20 scrap for a tip about the road ahead.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'They take the job seriously. Their charts show you everything in the sector.', dismiss:true, reveal:true } },
    { text:'Have {who} read their real intentions.', req:{ race:'sloog' }, effect:{ text:'{who} reads out their plan, which is mostly a list of snacks. Embarrassed, they leave you some scrap to keep quiet.', dismiss:true, scrap:15 } } ] },
  /* Mantlis */
  hail_mantlis3:{ hail:'mantlis', text:'The {enemy} is already matching your course. On screen, a Mantlis is sharpening something against something else. It does not look up.', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Throw them a crate of rations as a distraction.', req:{ crewCount:2 }, chance:.55, success:{ text:'The whole crew piles onto the crate. You are three beacons away before anyone remembers you.', dismiss:true }, fail:{ text:'They eat the rations in a second and want dessert.', begin:true } } ] },
  hail_mantlis4:{ hail:'mantlis', text:'"WE CHALLENGE YOUR STRONGEST TO SINGLE COMBAT. THEN WE FIGHT EVERYONE ELSE ANYWAY."', choices:[
    { text:'Skip the single combat. Fight.', effect:fightNow },
    { text:'Send {who} to fight their champion.', req:{ race:'mantlis' }, chance:.65, success:{ text:'{who} wins, very loudly. The raiders honour the result, salute, and leave tribute behind.', dismiss:true, scrap:20, xp:{ skill:'combat', amt:4 } }, fail:{ text:'{who} limps back, bruised but proud. The raiders, delighted, attack anyway.', crewHurt:30, begin:true } } ] },
  /* Voltan */
  hail_voltan3:{ hail:'voltan', text:'"We sense your reactor is unhappy, {ship}. We will relieve its suffering. By turning it off. Permanently."', choices:[
    { text:'Defend the reactor.', effect:fightNow },
    { text:'Let {who} bless the reactor themselves.', req:{ race:'voltan' }, effect:{ text:'{who} lays a glowing hand on the core. The Peacemongers declare it healed, and leave you a little extra light.', dismiss:true, scrap:10, crewHeal:30 } },
    { text:'Meditate with them over comms.', chance:.35, success:{ text:'Ten minutes of deep breathing later they forget why they came.', dismiss:true }, fail:{ text:'{crew} sneezes during the silence. "Disrespect!"', begin:true } } ] },
  hail_voltan4:{ hail:'voltan', text:'The {enemy} glows brighter and brighter until your screens white out. "BEHOLD. Sorry. Too bright? We will dim it. Then attack."', choices:[ { text:'Squint and fire.', effect:fightNow },
    { text:'Turn down your screen brightness and run.', req:{ system:'engines', level:3 }, effect:{ text:'While they fiddle with their glow you slip away.', dismiss:true } } ] },
  /* Pebblekin */
  hail_pebble3:{ hail:'pebblekin', text:'"THIS. IS. A. ROCK. STOP." The {enemy} has painted STOP on an asteroid and parked it in your way.', choices:[
    { text:'Shoot the rock. And them.', effect:fightNow },
    { text:'Stop. Politely.', effect:{ text:'You stop. They nod. Everyone sits in silence for twenty minutes. Then they move the rock and wave you through.', dismiss:true } },
    { text:'Buy the rock (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'They are delighted. The rock turns out to be full of ore and fuel ice.', dismiss:true, fuel:2, scrap:8 } } ] },
  hail_pebble4:{ hail:'pebblekin', text:'"WE. COLLECT. HULLS. YOURS. IS. NICE."', choices:[ { text:'"It\'s not for sale."', effect:fightNow },
    { text:'Give them some spare hull plating.', req:{ crewCount:1 }, effect:{ text:'You unbolt a panel and toss it over. They add it to their collection and leave, delighted.', dismiss:true, hull:-2 } } ] },
  /* Sloog */
  hail_sloog3:{ hail:'sloog', text:'"Greetings! We are selling an incredible opportunity. Just transmit your shield codes for a free trial."', choices:[
    { text:'Unsubscribe. With lasers.', effect:fightNow },
    { text:'Send them the wrong codes on purpose.', req:{ system:'hacking', level:1 }, effect:{ text:'Their own shields start a "free trial" of being off. They panic and run.', dismiss:true, parts:2 } },
    { text:'Have {who} out-sell them.', req:{ race:'sloog' }, effect:{ text:'{who} sells them a timeshare on your ship\'s broom cupboard. They pay up front.', dismiss:true, scrap:25 } } ] },
  hail_sloog4:{ hail:'sloog', text:'The {enemy} says nothing. Somewhere behind your eyes, a voice says, very kindly, "Lower your shields."', choices:[
    { text:'Shake it off. Fight.', effect:fightNow },
    { text:'Hum loudly to block them out.', chance:.5, success:{ text:'The whole crew hums. The Sloog find it unbearable and leave.', dismiss:true }, fail:{ text:'Humming makes it worse. Everyone has a headache now.', begin:true, crewHurt:10 } } ] },
  /* Enjinn */
  hail_enjinn2:{ hail:'enjinn', text:'"Unregistered modifications detected on {ship}. Please hold still for corrective disassembly."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Ask them to register your ship instead (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'They fill in your registration with obvious joy and leave a free drone part as a "welcome pack".', dismiss:true, parts:1 } },
    { text:'Let {who} show them your best repairs.', req:{ race:'enjinn' }, effect:{ text:'They are moved to tears by {who}\'s welding. They leave a gift of salvage.', dismiss:true, scrap:20 } } ] },
  hail_enjinn3:{ hail:'enjinn', text:'"Efficiency audit in progress. Your ship scored 31%. Low scores are recycled."', choices:[
    { text:'Appeal the score. Violently.', effect:fightNow },
    { text:'Dump spare parts to raise your score.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'"Revised score: 52%. Pass." They leave you be.', dismiss:true } } ] },
  /* Automated ships */
  hail_auto3:{ hail:'auto', text:'"GREETINGS, VALUED TARGET. YOUR DESTRUCTION IS IMPORTANT TO US. PLEASE STAY ON THE LINE."', choices:[
    { text:'Hang up. Fire.', effect:fightNow },
    { text:'Stay on the line.', chance:.4, success:{ text:'Hold music plays for an hour. The drone ship\'s battery dies. You salvage it.', dismiss:true, parts:2, scrap:10 }, fail:{ text:'"THANK YOU FOR WAITING. FIRING NOW."', begin:true } } ] },
  hail_auto4:{ hail:'auto', text:'The {enemy} broadcasts a countdown in seventeen languages. You do not want to find out what happens at zero.', choices:[ { text:'Strike first.', effect:{ text:'Your weapons come online before the countdown ends.', begin:true, primeWeapons:true } },
    { text:'Broadcast "zero" back at it.', req:{ system:'hacking', level:1 }, chance:.6, success:{ text:'It thinks the countdown is over, celebrates, and powers down. You strip it for parts.', dismiss:true, parts:3 }, fail:{ text:'It is not fooled.', begin:true } } ] },
  /* the Rebuff Fleet catching up */
  hail_fleet2:{ hail:'fleet', text:'Warning lights everywhere. The front of the Rebuff Fleet has reached you, and one of its warships peels off with its guns already charged.', choices:[ { text:'Fight your way out.', effect:fightNow } ] },
  hail_fleet3:{ hail:'fleet', text:'"Fleet command to {ship}: you have been very annoying. This is the part where you stop." A warship drops out of jump right beside you.', choices:[ { text:'Fight.', effect:fightNow },
    { text:'Burn everything and run for it.', req:{ fuel:2 }, cost:{ fuel:1 }, chance:.5, success:{ text:'You push the engines past every safety limit and break away before it locks on. The fleet will be faster next time.', dismiss:true, fleetPush:.05 }, fail:{ text:'Not fast enough. It locks on.', begin:true } } ] },
  hail_fleet4:{ hail:'fleet', text:'The stars ahead fill with red running lights. The Rebuff Fleet is here, and a picket ship is already hailing: "Surrender, or be made an example of."', choices:[ { text:'"Make an example of this."', effect:fightNow } ] },
  /* anyone */
  hail_generic3:{ hail:'generic', text:'The {enemy} drifts closer with its transponder switched off. Nobody answers your hails.', choices:[ { text:'Battle stations.', effect:fightNow },
    { text:'Fire a warning shot first.', chance:.3, success:{ text:'The warning works. They turn and leave in a hurry.', dismiss:true }, fail:{ text:'They take the warning as a hello.', begin:true } } ] },
  hail_generic4:{ hail:'generic', text:'"Sorry about this, {ship}. Someone paid us very well to ruin your day."', choices:[ { text:'"Let\'s see you earn it."', effect:fightNow },
    { text:'Offer them more to go away (30 scrap).', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'"Pleasure doing business." They tell you who hired them: the Rebuff, of course.', dismiss:true } } ] },
  hail_glass2:{ hail:'glass', text:'A chord rings out from the {enemy}, so pure it rattles your teeth. It is either a greeting or a battle hymn. It is a battle hymn.', choices:[ { text:'Fight.', effect:fightNow } ] }
};
Object.assign(BASE.events, MORE_HAILS);

/* ---------------- new ships to meet ---------------- */
Object.assign(BASE.enemies, {
  rebuff_cutter:  { name:'Rebuff Patrol Cutter', tags:['rebuff'], hull:9, sectors:[1,4], systems:{ shields:2, engines:2, weapons:2, oxygen:1, piloting:1, doors:1 }, weapons:['ion','basic'], crew:['human','human'] },
  pyrate_skiff:   { name:'Pyrate Skiff', tags:['pyrate'], hull:8, sectors:[1,4], systems:{ engines:3, weapons:2, oxygen:1, piloting:1, doors:1 }, weapons:['bust1'], crew:['human','mantlis'] },
  pebble_hauler:  { name:'Pebblekin Ore Hauler', tags:['pebblekin'], hull:13, sectors:[1,5], systems:{ shields:2, engines:1, weapons:1, oxygen:1, medbay:1, piloting:1, doors:2 }, weapons:['lego'], crew:['pebblekin','pebblekin'] },
  auto_picket:    { name:'Auto-Picket', tags:['auto'], auto:true, hull:7, sectors:[1,3], systems:{ shields:2, engines:1, weapons:2, piloting:1 }, weapons:['basic','basic'], crew:[] },
  mantlis_skirm:  { name:'Mantlis Skirmisher', tags:['mantlis'], hull:9, sectors:[2,5], systems:{ shields:2, engines:2, weapons:1, teleporter:1, oxygen:1, piloting:1, doors:1 }, weapons:['basic'], crew:['mantlis','mantlis','mantlis'] },
  voltan_runner:  { name:'Voltan Lightrunner', tags:['voltan'], hull:9, sectors:[2,6], super:2, systems:{ shields:2, engines:3, weapons:2, oxygen:1, piloting:1, doors:1 }, weapons:['pike'], crew:['voltan','voltan'] }
});
CALLSIGNS.rebuff.push('Writ', 'Due Process', 'Form 27B', 'Sanction', 'Last Warning');
CALLSIGNS.pyrate.push('Grog Hog', 'Mutiny Mabel', 'Doubloon', 'Cannonbelly', 'Scurvy Dog');
CALLSIGNS.mantlis.push('Chitin Storm', 'Many Legs', 'Hungerclaw');
CALLSIGNS.voltan.push('Quiet Dawn', 'Soft Thunder', 'Halo');
CALLSIGNS.pebblekin.push('Bedrock', 'Pumice', 'Landslide');
CALLSIGNS.sloog.push('Damp Promise', 'Velvet Ooze', 'Kind Words');
CALLSIGNS.enjinn.push('Sprocket', 'Torque Wrench', 'Gimbal');
CALLSIGNS.auto.push('Unit 12', 'QX-5', 'Picket 3', 'Warden 0');

/* ---------------- what the crew say ---------------- */
const more = (o, add) => { for(const k in add) (o[k] = o[k] || []).push(...add[k]); };
more(CHATTER, {
  hit:['Took one amidships!','Damage control!','They found the range.','That rattled my teeth.','Hull is holding. Mostly.','Somebody patch that!','Right in the paintwork.'],
  fire:['Fire in the corridor!','It\'s getting toasty in here.','Vent it or fight it!','Who left the stove on?'],
  breach:['Air is leaving the building!','Patch kit, now!','Mind the hole!','That\'s a draught we don\'t need.'],
  boarders:['Repel boarders!','They\'re in the corridors!','Hands off my ship!','Wipe your feet, you animals!'],
  shieldsDown:['Shields are gone, brace!','Get those shields back up!','Nothing between us and them now!','Shield generator\'s down!'],
  victory:['Next!','And stay down.','Another one for the log.','Salvage time!','Nobody touch the wreck until it stops sparking.','Did everyone see that?'],
  lowHull:['We\'re held together with tape!','Hull integrity critical!','One more hit and we\'re done!','I can see stars through the floor!'],
  jump:['Punch it!','See you on the other side.','Spinning up the drive.','Strap in.','Leaving this place behind.','Where are we off to, Captain?'],
  enemyHurt:['They\'re smoking!','Hit them again!','Their hull is cracking!','One more volley!'],
  repair:['Patched!','That should hold.','Nobody touch it.','Running again.','Fixed. Probably.'],
  death:['Not like this...','Man down!','They were the best of us.'],
  idle:['Did anyone feed the ship\'s cat? Do we have a ship\'s cat?','I\'ve named that star Gary.','Who keeps moving my mug?','If we survive this I\'m opening a bakery.','Quiet shift. I\'ll take it.','Fun fact: I\'ve never seen the Flaggship. I\'d like to keep it that way.','Is the reactor supposed to hum in B flat?','My bunk smells of engine grease. Again.']
});
more(RACE_CHATTER.pebblekin, { jump:['MOVING. FAST. TOO. FAST.'], repair:['FIXED. WITH. FIST.'], shieldsDown:['SHIELDS. GONE. ME. STILL. HERE.'] });
more(RACE_CHATTER.enjinn, { shieldsDown:['Re-routing! Re-routing!'], victory:['Recycling their parts in my head already.'], jump:['Drive timing perfect. You\'re welcome.'] });
more(RACE_CHATTER.mantlis, { hit:['They will pay for that.','Ha! Again!'], jump:['Somewhere with enemies, please.'], shieldsDown:['Good. Let them come to me.'] });
more(RACE_CHATTER.voltan, { repair:['The light returns.'], jump:['Into the bright unknown.'], fire:['The flames are only another kind of light.'] });
more(RACE_CHATTER.sloog, { boarders:['I heard them coming before they did.'], jump:['I already know where we\'re going. Don\'t ask.'], repair:['As I foresaw.'] });
more(RACE_CHATTER.glassborn, { boarders:['*a warning chord*'], jump:['*a rising chime*'] });
for(const kind of ['start','hurt','gloat']) TAUNTS[kind] = TAUNTS[kind] || {};
more(TAUNTS.start, { rebuff:['Halt in the name of the Directorate!','This will go on your record.','Weapons free!'], pyrate:['Fresh loot!','Run out the guns, lads!','Your hull or your scrap!'], mantlis:['HUNT!','*shriek*'],
  voltan:['Hold still. This is for your own good.','Peace be with you. Briefly.'], pebblekin:['ROLL. OVER. THEM.','YOU. WILL. CRUMBLE.'], sloog:['This is going exactly as we planned.','We have already won. You just don\'t know it.'],
  enjinn:['Commencing scheduled maintenance. Of you.','Deconstruction protocol engaged.'], auto:['ENGAGING.','HOSTILE CONFIRMED.','BEGIN PROGRAM: DESTROY.'], glass:['*a sharp, rising note*'], generic:['Nothing personal!','Open fire!'] });
more(TAUNTS.hurt, { rebuff:['Request backup!','That\'s Directorate property!','Hull breach on deck two!'], pyrate:['Me beautiful ship!','Patch it with something! Anything!'], mantlis:['MORE!','PAIN IS GOOD.'], voltan:['Our patience dims.'], pebblekin:['CHIPPED.','RUDE.'],
  sloog:['We did not foresee that.'], enjinn:['That will void the warranty!'], auto:['SYSTEM INTEGRITY FALLING.','REROUTING.'], glass:['*a discordant wail*'], generic:['They\'re hurting us!'] });
more(TAUNTS.gloat, { rebuff:['Surrender now and save the paperwork!','The Directorate always wins.'], pyrate:['Ye\'re taking water, matey!','Your scrap is ours!'], mantlis:['SOON. MEAT.','YOU BREAK.'], voltan:['Your light fades.'], pebblekin:['CRACKING. NICE.'],
  sloog:['As we said.'], enjinn:['Your systems are sub-optimal.'], auto:['ANALYSIS: YOU ARE LOSING.'], glass:['*a smug chime*'], generic:['Nearly done!'] });

/* the end of a fight, and enemies giving up */
for(const k in VICTORY_LINES) if(!Array.isArray(VICTORY_LINES[k])) VICTORY_LINES[k] = [VICTORY_LINES[k]];
more(VICTORY_LINES, {
  rebuff:['The {enemy} comes apart in a neat, regulation-approved fireball.','The {enemy}\'s reactor fails, and with it every form in its archive.','The {enemy} spins away, burning, still broadcasting a cease-and-desist order.'],
  pyrate:['The {enemy} goes down with all its ill-gotten gains.','The {enemy} breaks in two. Somewhere in the wreck, a parrot complains.','The {enemy} sinks into the dark, its jolly flag the last thing to burn.'],
  mantlis:['The {enemy} falls silent at last. Even the wreck looks angry.','The {enemy} bursts open, its hive banners curling in the flames.'],
  voltan:['The {enemy} dims, flickers and goes dark, peacefully for once.','The {enemy} lets out one last flash of light and falls still.'],
  pebblekin:['The {enemy} crumbles into a very expensive cloud of gravel.','The {enemy} finally stops. Pebblekin ships are very hard to stop.'],
  sloog:['The {enemy} pops, and the comms fill with a smug "we knew".','The {enemy} melts into a cloud of glittering goo.'],
  enjinn:['The {enemy} comes apart, every bolt labelled.','The {enemy} shuts down with a polite error message.'],
  auto:['The {enemy} blinks "THANK YOU FOR PLAYING" and explodes.','The {enemy} reboots one last time, then doesn\'t.'],
  glass:['The {enemy} rings like a bell as it breaks.'],
  generic:['The {enemy} goes up in a ball of fire.','What is left of the {enemy} tumbles away into the dark.','The {enemy}\'s hull gives way and the lights go out.']
});
for(const k in SURRENDER_LINES) if(!Array.isArray(SURRENDER_LINES[k])) SURRENDER_LINES[k] = [SURRENDER_LINES[k]];
more(SURRENDER_LINES, {
  rebuff:['"Hold your fire! We surrender! Please do not tell my superiors."','"Under section 12, we formally request to stop being shot."'],
  pyrate:['"Avast! Belay! Truce! Take the loot, leave the ship!"','"Alright, alright! Ye win! Take what ye like, just not the parrot."'],
  mantlis:['"...Enough. Take. Go. Before we change our minds."'],
  voltan:['"We have seen enough light for one day. Take our gift."'],
  pebblekin:['"FINE. FINE. YOU. WIN. TAKE. ROCKS."'],
  sloog:['"We foresaw this ending. Take our tribute and let us be friends."'],
  enjinn:['"Cease fire. We offer our spares. Please do not scratch the paint further."'],
  generic:['"We give up! Take the cargo!"','"Stop! Stop! You win! Take it and go!"']
});

/* stores, quiet beacons, hazards and sector arrivals */
more(STORE_GREETS, {
  civilian:['"Browse all you like. Shoplifters will be spaced."','"Fuel, missiles, hull plates. Cheap prices, cheaper coffee."','"Back again? Thought you were dead. Good news for business!"'],
  rebuff:['"Directorate surplus. Don\'t ask where it came from."','"Cash only. No receipts. No questions."'],
  pyrate:['"Stolen fresh this morning!"','"Buy something or walk the plank. Joking. Mostly."'],
  nebula:['"Mind the gas. And the prices."','"First customer in a month! Everything is very slightly dusty."'],
  sloog:['"I already know what you want. Let\'s talk about the price you\'ll pay."','"Welcome, friend! Don\'t touch the goo."'],
  pebblekin:['"PRICES. ARE. SET. IN. STONE."','"BUY. SLOWLY. WE. LIKE. SLOW."'],
  enjinn:['"Everything comes with a lifetime guarantee. Our lifetime, not yours."','"Lovingly refurbished. Some of it twice."'],
  voltan:['"Light and scrap make all things possible."','"Take what glows to you."'],
  mantlis:['"WE. SELL. WEAPONS. MOSTLY. WEAPONS."','"Spend fast. We get hungry."'],
  laststand:['"Fedoration prices. War prices. Same thing today."','"Everything must go. Including us, soon."'],
  glass:['"Every item rings true."']
});
QUIET_TEXTS.push(
  'A derelict satellite tumbles slowly past, still broadcasting a weather report for a planet that is no longer there.',
  'A comet streams by close enough to see the ice glitter. {crew} presses their face to the window like a child.',
  'Nothing here but a faded billboard: "VISIT THE CIVILIAN SECTOR. IT\'S FINE!"',
  'The sensors pick up a single sock, drifting. Nobody claims it.',
  'A distant nebula paints the viewport pink and gold. For a few minutes nobody talks.',
  'Static on every channel, and under it, faintly, someone\'s radio playing the same three songs on a loop.',
  'A beacon marks the wreck of an old Fedoration frigate. The crew stand for a moment of silence.',
  '{crew} swears they saw a whale out there. A space whale. Everyone agrees not to discuss it further.',
  'Empty. Utterly, wonderfully empty. {crew} takes the chance for a nap.',
  'A cluster of tiny moons, none bigger than your ship. {crew} wants to name them all.',
  'A cargo pod floats past, stamped PROPERTY OF THE REBUFF. It is empty except for a strongly worded note.',
  'The beacon here is broken, and has been looping the words "please hold" for eleven years.',
  'Two old warships lie locked together, still pointing their guns at each other. Nobody won.',
  'A lighthouse station, long abandoned. Its lamp still turns, for nobody.',
  'Sensors detect a faint distress signal. It turns out to be from 400 years ago. Too late, by some way.',
  'The stars here are packed so close they look like spilled sugar.',
  'A small asteroid has "{crew} WAS HERE" scratched into it. {crew} denies everything.',
  'A drifting probe sends you a cheerful survey: "How was your journey through this sector? 1 to 5." You give it a 3.'
);
const QUIET_FINDS = [
  { p:.10, text:'A drifting supply pod holds a few spare parts.', parts:1 },
  { p:.08, text:'The crew fish a forgotten missile out of a debris field.', missiles:1 },
  { p:.12, text:'Wreckage nearby yields some salvage.', scrap:[6, 14] },
  { p:.06, text:'An hour of drills while it\'s quiet sharpens the crew up.', xp:true }
];
// After a kill, now and then someone gets out of the wreck alive.
const SURVIVOR_LINES = [
  'An escape pod tumbles out of the wreck. The survivor inside says their old captain had it coming.',
  'A lone survivor waves at you from a cargo hatch. They would very much like a ride.',
  'One of their crew made it to a pod. They ask to sign on, and promise to be less shooty.',
  'Somebody is hammering on the hull of a drifting pod. You let them in. They want to stay.',
];
const HAZARD_ARRIVALS = {
  asteroid:['Rocks the size of houses tumble lazily past the viewport.','The beacon sits in the middle of a slow, grinding asteroid field.','{crew} counts the asteroids, gives up at forty, and goes back to work.'],
  sun:['The viewport tints itself dark against a huge, angry star.','Heat warnings blink on every console. The star here is very close.','A star fills half the sky. It is beautiful, and it would like you to be on fire.'],
  ionstorm:['Blue lightning crawls across the hull.','Your lights flicker. The ion storm is not happy to see you.','Every screen fills with crackling blue static.'],
  pulsar:['A spinning dead star sweeps the beacon like a lighthouse beam.','Every few seconds, everything electrical on the ship hiccups.','The pulsar ticks like a clock, and every tick hurts the systems.'],
  nebula:['Thick violet gas swallows the ship.','Visibility: zero. Sensors: also zero. Vibes: eerie.','The nebula wraps around you like a blanket. A blanket full of static.']
};
more(SECTOR_INTROS, {
  civilian:['Trade lanes, tourist beacons and the occasional pyrate. A gentle start, as these things go.'],
  rebuff:['Every beacon here has a Rebuff flag on it. Every second Rebuff flag has a gun behind it.','Directorate checkpoints everywhere. Keep your head down and your shields up.'],
  pyrate:['Somebody has painted a skull on the sector beacon. Then someone else painted a bigger one.','Black markets, broken treaties and very good deals. Count your fingers after every handshake.'],
  nebula:['Your sensors go quiet as the gas closes in. The Rebuff Fleet will have trouble following you in here, and so will you.'],
  sloog:['The Sloog greet you before you have even arrived. They knew you were coming.'],
  pebblekin:['Huge rocks drift through the lanes, some of them inhabited. It is hard to tell which.'],
  enjinn:['Every beacon is spotless and perfectly maintained. The drone ships guarding them are less friendly.'],
  voltan:['The light here is strange and warm. The Voltan say it means you are welcome. Their guns say otherwise.'],
  mantlis:['Hive-ships drift in the dark like sleeping beasts. Try not to wake them.'],
  laststand:['This is it. Everything you have done comes down to this sector.']
});

/* ---------------- the engine side of variety ---------------- */
/* a hail the crew haven't heard yet this run: every hail of that faction (and some generic ones) before any repeat */
function pickHailFresh(tag){
  const all = Object.values(DATA.events).filter(e => e.hail);
  let own = all.filter(e => e.hail===tag); const gen = tag==='fleet' ? [] : all.filter(e => e.hail==='generic' && e.hail!==tag);
  if(!own.length) own = gen;
  const seen = (G && G.seen) || {}, freshOwn = own.filter(e => !seen[e.id]), freshGen = gen.filter(e => !seen[e.id]);
  let pool = freshOwn.length ? freshOwn.concat(freshGen.length && Math.random() < .25 ? [pick(freshGen)] : []) : (freshGen.length ? freshGen : own.filter(e => e.id!==G?.lastHail));
  if(!pool.length) pool = own;
  const id = pick(pool).id; if(G) G.lastHail = id; return id;
}
/* an enemy's guns vary a little from ship to ship: one gun may be swapped for a different one of the same power and price */
function varyEnemyGuns(list, sector){
  if(!list.length || Math.random() > .45) return list;
  const i = Math.floor(Math.random()*list.length), old = DATA.weapons[list[i]]; if(!old) return list;
  const tierMax = 1 + Math.floor(sector/4);
  const pool = Object.values(DATA.weapons).filter(w => w.id!==old.id && !w.heal && !w.noEnemy && !w.noLoot && (w.tier||1) <= tierMax && (w.power||1) === (old.power||1) && Math.abs((w.cost||40) - (old.cost||40)) <= 15);
  if(!pool.length) return list;
  const out = list.slice(); out[i] = pick(pool).id; return out;
}
/* a line nobody has heard in the last few lines */
function pickFresh(pool, recent){ if(!pool || !pool.length) return null; const fresh = pool.filter(t => !recent.includes(t)); return pick(fresh.length ? fresh : pool); }
