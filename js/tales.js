'use strict';
/* =========================================================================
   Tales: more beacons, so no two runs (or three jumps) feel alike.
   - Twelve new distress calls. Most end in salvage, trouble, a choice or a
     favour owed, not a free crew member.
   - Everyday oddities, small quest chains, and follow-ups that remember what
     you did earlier in the run (story flags).
   - A beacon or two for every kind of sector.
   Placeholders: {crew} a random crew member, {who} the crew member who meets a
   choice's race requirement, {ship} your ship, {enemy} the enemy.
   ========================================================================= */
const TALES = {
  /* ---------------- distress calls ---------------- */
  d_mayday_loop:{ distress:true, art:'wreck', text:'A distress call on a loop: "Mayday, mayday, this is the Corran Hope, our reactor is failing..." The ship is here, cold and dark. From the dust on her hull, the call has been looping for decades.', choices:[
    { text:'Salvage what you can.', effect:{ text:'Old ships were built to last. Her spare parts still fit.', scrap:22, parts:2 } },
    { text:'Recover the flight recorder for the families.', effect:{ text:'You find the recorder in the captain\'s chair. A memorial station two sectors away keeps records like this. Someone there will want it.', setFlag:'recorder', later:{ event:'d_recorder_home', jumps:5 } } },
    { text:'Hold a short service, then move on.', effect:{ text:'{crew} reads out the crew list from the hull plates. Nobody says much for a while, but everyone stands a little straighter.', crewHeal:25, xp:{ skill:'pilot', amt:6 } } } ] },
  d_recorder_home:{ questOnly:true, art:'station', text:'A memorial station hails you. "We understand you carry the Corran Hope\'s recorder. Her families have waited a long time for this."', choices:[
    { text:'Hand it over.', effect:{ text:'The families insist you take something for your trouble: fuel, missiles and a ship\'s blessing painted on your hull.', scrap:30, fuel:3, missiles:2, clearFlag:'recorder' } } ] },
  d_bait:{ distress:true, text:'"Help! Pyrates! Please, anyone!" The signal comes from a freighter drifting with its engines off. Its hull is spotless.', choices:[
    { text:'Approach with weapons hot.', effect:{ text:'The "freighter" was a pyrate trap. They are surprised you came ready.', fight:'pyrate_gunship', afterWin:{ text:'The trap ship\'s hold is full of things taken from people who were not ready.', scrap:30, missiles:2 } } },
    { text:'Scan it before you go in.', req:{ system:'sensors', level:2 }, effect:{ text:'Your sensors find three armed ships hiding behind a moon. You slip away and drop a warning buoy for the next ship. Someone leaves you a thank-you in the beacon\'s cache.', scrap:15, fleetPush:-.02 } },
    { text:'Answer, but keep your distance.', chance:.5, success:{ text:'The pyrates give up on you and you pick up a crate they dropped to look convincing.', scrap:12 }, fail:{ text:'They lose patience and open fire from behind the moon.', fight:'pyrate_gunship' } } ] },
  d_plague:{ distress:true, art:'distress', text:'A passenger liner is under quarantine. A fever is spreading and their medics have run out of everything. "We need help, but please, do not come aboard."', choices:[
    { text:'Send over your medical kits (5 drone parts).', req:{ parts:5 }, cost:{ parts:5 }, effect:{ text:'The kits are just what they needed. The captain promises to tell everyone what you did.', setFlag:'healer', scrap:15 } },
    { text:'Have your medbay synthesise medicine.', req:{ system:'medbay', level:2 }, effect:{ text:'Your medbay works through the night. The fever breaks by morning. The liner\'s crew insist on paying you.', scrap:35, setFlag:'healer' } },
    { text:'Wish them luck and keep your distance.', effect:{ text:'It is the safe choice. It does not feel like a good one.' } } ] },
  d_meltdown:{ distress:true, art:'star', text:'A freighter\'s reactor is overloading. Its crew are packed into one escape pod that will not launch. You have minutes.', choices:[
    { text:'Dock and pull them out.', chance:.65, success:{ text:'You get everyone out with seconds to spare. The captain transfers her whole cargo account to you.', scrap:40 }, fail:{ text:'Everyone gets out, but the blast catches your hull on the way.', scrap:20, hull:-4, fire:1 } },
    { text:'Tow the pod clear with your engines.', req:{ system:'engines', level:3 }, effect:{ text:'You yank the pod free and outrun the blast. The crew are fine, and their cargo is yours as thanks.', scrap:35, missiles:2 } },
    { text:'You can\'t risk the ship.', effect:{ text:'You watch the explosion from a safe distance. Nobody talks about it.', crewHurt:5 } } ] },
  d_miner:{ distress:true, art:'asteroid', text:'A miner is trapped in a collapsed tunnel on a small asteroid. You can hear her knocking on the rock through your hull sensors.', choices:[
    { text:'Send a team in to dig her out.', chance:.7, success:{ text:'She comes out dusty and grinning and shows you her secret seam of ore.', scrap:30 }, fail:{ text:'The tunnel shifts. Your team gets her out, but they take some knocks.', scrap:18, crewHurt:15 } },
    { text:'Have {who} punch through the rock.', req:{ race:'pebblekin' }, effect:{ text:'{who} walks through the asteroid like it is wet sand. The miner is so impressed she gives you her whole stash.', scrap:40, parts:1 } },
    { text:'Cut her out with a laser from the ship.', chance:.4, success:{ text:'A precise cut. She is free.', scrap:20 }, fail:{ text:'Less precise than hoped. She is free, and very cross, and keeps her ore.', scrap:5 } } ] },
  d_lonely_ai:{ distress:true, art:'station', text:'A cargo ship\'s computer is broadcasting a distress call because its crew left it at this beacon years ago. "Please. I have been alone for 6,214 days. I have counted."', choices:[
    { text:'Give it something to do: run your drone fabricator.', effect:{ text:'The AI is overjoyed. It prints you a pile of drone parts before you leave, and promises to keep counting, happily this time.', parts:5 } },
    { text:'Download it into your ship\'s spare computer.', chance:.5, success:{ text:'It settles in and quietly tunes your targeting software.', xp:{ skill:'weapons', amt:15 } }, fail:{ text:'It settles in and spends a week reorganising your music library. Alphabetically. By drummer.', crewHeal:10 } },
    { text:'Let it sleep, gently.', effect:{ text:'"Thank you," it says, and the lights go out one by one. It leaves its cargo hold unlocked.', scrap:18 } } ] },
  d_school_trip:{ distress:true, art:'ship', text:'A school shuttle has broken down on a field trip. Twenty children are pressed against the windows, waving at your ship. Their teacher looks exhausted.', choices:[
    { text:'Fix their engine (1 fuel).', req:{ fuel:1 }, cost:{ fuel:1 }, effect:{ text:'The children cheer. One of them draws a picture of {ship} and sends it over. It goes on the bridge wall.', crewHeal:30, later:{ event:'d_school_thanks', jumps:4 } } },
    { text:'Escort them to the next beacon.', chance:.6, success:{ text:'An uneventful trip. The teacher thanks you with a box of homemade snacks.', crewHeal:20, fuel:1 }, fail:{ text:'A pyrate raider spots the shuttle. You put yourself between them.', fight:'pyrate_bomber', afterWin:{ text:'The children think this is the best field trip ever.', scrap:20 } } },
    { text:'Radio the nearest station for a tow.', effect:{ text:'Help is on its way. The children boo you, but politely.' } } ] },
  d_school_thanks:{ questOnly:true, art:'station', text:'A message arrives from a school three systems away: a video of twenty children shouting "THANK YOU {ship}!" and a donation from their parents.', choices:[ { text:'Play it again.', effect:{ text:'You play it four more times.', scrap:25, crewHeal:20 } } ] },
  d_decoy:{ distress:true, art:'fleet', text:'A Fedoration courier is begging for help, but its transponder code is three years out of date. Your comms officer frowns.', minSector:2, choices:[
    { text:'It\'s a Rebuff decoy. Hit them first.', effect:{ text:'The "courier" drops its disguise and powers up its weapons, a little late.', fight:'rebuff_fighter', primeWeapons:true } },
    { text:'Answer with an old Fedoration challenge code.', chance:.6, success:{ text:'They answer wrong. You jump away before the trap closes and leave them a rude message.', fleetPush:-.03 }, fail:{ text:'They answer right, by luck, and you fly straight into the ambush.', fight:'rebuff_fighter' } },
    { text:'Slip away quietly.', effect:{ text:'You leave them to wait for someone more trusting.' } } ] },
  d_cryo:{ distress:true, art:'wreck', text:'A colony transport, every cryo pod failing one by one. Most of the sleepers are already gone. Three pods still have power.', choices:[
    { text:'Wake the sleepers.', chance:.35, success:{ text:'One of the three wakes up and asks, very calmly, if they can come with you.', crew:'random' }, fail:{ text:'The sleepers wake confused, and you take them to a colony ship nearby. They pay you with what they had.', scrap:20 } },
    { text:'Move the pods to a colony ship nearby.', effect:{ text:'It costs you time, but the colony takes the pods, and the sleepers will wake up home.', fleetPush:.03, scrap:25 } },
    { text:'Strip the dead pods for parts.', effect:{ text:'Grim, practical work.', parts:3, scrap:10 } } ] },
  d_singer:{ distress:true, art:'station', text:'The distress call turns out to be someone singing. Badly. A lighthouse keeper has not seen another ship in a year and wanted company.', choices:[
    { text:'Stay for a song.', effect:{ text:'You stay for six. The keeper sends you off with fuel and a hand-drawn map of the local beacons.', fuel:2, reveal:true } },
    { text:'Teach them a better song.', req:{ race:'voltan' }, effect:{ text:'{who} sings a Voltan hymn that makes the lighthouse glow. The keeper weeps and gives you everything in the supply room.', fuel:3, missiles:2, scrap:15 } },
    { text:'Politely make your excuses.', effect:{ text:'The singing follows you on comms for three more beacons.' } } ] },
  d_lifeboats:{ distress:true, art:'distress', text:'Two lifeboats from the same wreck, drifting apart. The Rebuff Fleet is close: you only have time for one. One carries a scientist and her research. The other, a family of four.', minSector:2, choices:[
    { text:'Save the scientist.', effect:{ text:'She thanks you, quietly, and gives you a prototype from her research case. You watch the other lifeboat\'s light until it is gone.', augment:'random', crewHurt:5 } },
    { text:'Save the family.', effect:{ text:'The children sleep in the medbay all the way to the next station. Their parents leave you their savings, and you hear later the scientist was picked up by a trader.', scrap:25, crewHeal:30 } },
    { text:'Try for both.', chance:.4, success:{ text:'It works, somehow. Everyone is aboard as the fleet\'s scouts arrive.', scrap:20, augment:'random', fleetPush:.05 }, fail:{ text:'You reach both, barely, but the fleet\'s scouts reach you too.', fight:'rebuff_scout', fleetPush:.04 } } ] },
  d_station_fire:{ distress:true, art:'station', text:'A refuelling station is on fire. Its crew are fighting it with hand extinguishers and losing.', choices:[
    { text:'Send a firefighting team.', req:{ crewCount:4 }, effect:{ text:'Your crew bring the fire under control. The station refuels you for free, forever. Well, for today.', fuel:5, crewHurt:10 } },
    { text:'Send {who}, who doesn\'t burn.', req:{ race:'pebblekin' }, effect:{ text:'{who} walks into the fire and starts closing valves. The station crew cheer.', fuel:6, scrap:10 } },
    { text:'Vent the burning section for them.', req:{ system:'doors', level:2 }, effect:{ text:'Your door control hacks theirs. The fire dies in the vacuum. They lose some cargo, but not their station.', fuel:3 } },
    { text:'Buy fuel cheaply on your way past (5 scrap).', req:{ scrap:5 }, cost:{ scrap:5 }, effect:{ text:'They have bigger problems than haggling.', fuel:3 } } ] },

  /* ---------------- everyday oddities ---------------- */
  t_chess:{ text:'A chess move arrives on an open channel: "Pawn to E4." It is from a computer on a moon, and it has been waiting a long time for an opponent.', tags:[''], art:'planet', choices:[
    { text:'Play it properly.', chance:.4, success:{ text:'A long, careful game. You win. The computer is delighted and sends you its whole archive of flight data.', xp:{ skill:'pilot', amt:20 }, scrap:10 }, fail:{ text:'It checkmates you in nineteen moves. It sends a polite "good game" and a tip on your opening.', xp:{ skill:'pilot', amt:8 } } },
    { text:'Let {who} play.', req:{ race:'sloog' }, effect:{ text:'{who} wins in eleven moves, then reads the computer\'s mind to apologise. It pays out its prize fund.', scrap:30 } },
    { text:'Resign and move on.', effect:{ text:'"Coward," it says, kindly.' } } ] },
  t_mailbag:{ text:'A mail drone has broken down at the beacon, its belly full of letters that were never delivered.', tags:[''], art:'ship', choices:[
    { text:'Deliver them on your way.', effect:{ text:'You take the mailbag. The drone\'s route passes right along yours.', later:{ event:'t_mail_done', jumps:3 } } },
    { text:'Read a few aloud. Just a few.', effect:{ text:'Love letters, complaints about neighbours, a recipe for moon-cake. The crew are thoroughly entertained.', crewHeal:20 } },
    { text:'Recycle the drone.', effect:{ text:'Good parts. You feel slightly bad about the letters.', parts:3 } } ] },
  t_mail_done:{ questOnly:true, art:'station', text:'The post office at this beacon takes the mailbag with tears in its eyes. Well, its clerk does. "Some of these are eleven years late!"', choices:[ { text:'Collect the delivery fee.', effect:{ text:'Postage was expensive back then.', scrap:30, fuel:1 } } ] },
  t_capsule:{ text:'A time capsule drifts past, covered in children\'s stickers. "DO NOT OPEN UNTIL 3000." It is 3027.', tags:[''], art:'space', choices:[
    { text:'Open it.', chance:.5, success:{ text:'Inside: photos, a toy ship and a prototype gadget someone thought the future would like.', augment:'random' }, fail:{ text:'Inside: photos, a toy ship and an extremely old sandwich. {crew} eats it before anyone can stop them.', crewHurt:5, scrap:5 } },
    { text:'Add your own message and send it on.', effect:{ text:'Your crew write messages to whoever finds it next. It feels good.', crewHeal:20, setFlag:'capsule' } } ] },
  t_capsule_reply:{ flag:'capsule', once:true, text:'A ship hails you, laughing. "We found your message in the time capsule! We were nearby, so we thought we would say hello in person."', tags:[''], art:'ship', choices:[
    { text:'Say hello back.', effect:{ text:'They are traders, and very friendly. They give you a "message delivery" discount.', scrap:20, fuel:2, clearFlag:'capsule' } } ] },
  t_vending:{ text:'A vending machine is floating in space, still lit, still humming. It has three items left.', tags:[''], art:'space', choices:[
    { text:'Put 10 scrap in.', req:{ scrap:10 }, cost:{ scrap:10 }, chance:.6, success:{ text:'Clunk. Out drops a sealed box of missiles. Odd vending machine.', missiles:4 }, fail:{ text:'It keeps your scrap. Of course it does.' } },
    { text:'Kick it.', chance:.5, success:{ text:'Everything falls out: fuel cells, drone parts and a sticky bun.', fuel:2, parts:2 }, fail:{ text:'It kicks back. Specifically, it fires its anti-theft charge into your hull.', hull:-2 } },
    { text:'Tow it home and plug it in.', effect:{ text:'It now lives in the crew lounge. Morale is excellent.', crewHeal:25 } } ] },
  t_hitchhiker:{ text:'A hitchhiker in a spacesuit is standing on an asteroid with a sign: "ANYWHERE BUT HERE".', tags:[''], art:'asteroid', choices:[
    { text:'Give them a lift.', effect:{ text:'They are good company and very interested in your cargo hold. They\'ll get off at the next stop.', later:{ event:'t_hitchhiker_end', jumps:2 } } },
    { text:'Throw them a ration pack and wave.', effect:{ text:'They wave back. Then they flag down the next ship, which is much nicer than yours.' } } ] },
  t_hitchhiker_end:{ questOnly:true, art:'station', text:'Your hitchhiker grabs their bag. "This is my stop. Thanks for everything."', choices:[
    { text:'Wish them well.', chance:.6, success:{ text:'They leave a tip on the console: the codes to a cache they hid years ago.', scrap:30, parts:2 }, fail:{ text:'They leave. So does a fuel cell, and the captain\'s good mug.', fuel:-1 } },
    { text:'Search their bag first.', chance:.5, success:{ text:'Stolen Rebuff codes. You keep those. You let them keep the bag.', fleetPush:-.04 }, fail:{ text:'Socks. Lots of socks. They are very offended.' } } ] },
  t_rival:{ text:'"Well, well. If it isn\'t {ship}." Your captain\'s old flight-school rival is here, in a ship with three more guns than yours, and she wants you to know it.', tags:[''], art:'ship', choices:[
    { text:'Race her to the next beacon.', req:{ system:'engines', level:3 }, effect:{ text:'You win by a hull length. She pays the bet, grumbling.', scrap:30 } },
    { text:'Challenge her to a race anyway.', chance:.3, success:{ text:'She stalls her engine at the start line. You win.', scrap:25 }, fail:{ text:'She wins by a mile and tells everyone.', scrap:-10 } },
    { text:'Buy her a drink and swap stories.', effect:{ text:'You end up laughing about old instructors. She tips you off about a patrol route.', reveal:true, crewHeal:10 } } ] },
  t_wrong_crate:{ text:'A courier drone delivers a crate addressed to someone else. The label says "FRAGILE: PROTOTYPE". The return address is a weapons lab.', tags:[''], art:'ship', choices:[
    { text:'Keep it.', chance:.45, success:{ text:'It is a working prototype gun.', weapon:'random' }, fail:{ text:'It is a prototype toaster. It does not even make toast.', parts:1 } },
    { text:'Send it back.', effect:{ text:'The lab is grateful, and pays a finder\'s fee.', scrap:25, setFlag:'honest' } } ] },
  t_honest_reward:{ flag:'honest', once:true, minSector:3, text:'The weapons lab you returned the crate to hails you. "Honest couriers are rare. We have a gift."', tags:[''], art:'station', choices:[
    { text:'Accept the gift.', effect:{ text:'A crate, correctly addressed this time.', weapon:'random', clearFlag:'honest' } } ] },
  t_engine_noise:{ text:'Your engines have started making a noise. A sort of "bwong". {crew} insists it is fine. {crew} also put a rubber duck in the coolant tank last week.', tags:[''], art:'ship', choices:[
    { text:'Stop and fix it properly.', effect:{ text:'It was the duck. The engines run beautifully now, but you have lost time.', fleetPush:.03, xp:{ skill:'engines', amt:15 } } },
    { text:'Ignore it.', chance:.6, success:{ text:'The noise stops on its own. Nobody asks where the duck went.' }, fail:{ text:'The "bwong" becomes a "BWONG" and something important falls off.', damageSystem:'engines' } },
    { text:'Let {who} take a look.', req:{ race:'enjinn' }, effect:{ text:'{who} removes the duck, tunes the injectors and adds a small extra coil while they are in there.', upgrade:'engines' } } ] },
  t_coffee:{ text:'There is one cup of real coffee left on board, and two of your crew both claim it. The argument has reached the weapons bay.', tags:[''], art:'ship', choices:[
    { text:'Split it fairly.', effect:{ text:'Half a cup each. Both are unhappy. Peace is restored.', crewHeal:10 } },
    { text:'Drink it yourself. Captain\'s privilege.', effect:{ text:'Excellent coffee. Your crew will never forgive you, but you\'ve never flown better.', xp:{ skill:'pilot', amt:15 } } },
    { text:'Buy a coffee machine at the next stop (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'You order one through the beacon\'s trade link. The crew build a small shrine around it.', crewHeal:35 } } ] },
  t_birthday:{ text:'It is {crew}\'s birthday, and nobody remembered. {crew} has been very quiet about it, very loudly.', tags:[''], art:'ship', choices:[
    { text:'Throw a party (5 scrap).', req:{ scrap:5 }, cost:{ scrap:5 }, effect:{ text:'Streamers in the corridors, a cake shaped like the reactor. Best day of the run.', crewHeal:40 } },
    { text:'Give them the day off.', effect:{ text:'They spend it asleep in the medbay. It is all they wanted.', crewHeal:20, fleetPush:.01 } } ] },
  t_prime_signal:{ text:'A signal from deep space: pulses in prime numbers. 2, 3, 5, 7, 11... then a pause, then a long string of digits.', tags:[''], art:'star', choices:[
    { text:'Decode it.', req:{ system:'sensors', level:2 }, effect:{ text:'The digits are coordinates and a password. They open a cache someone hid near this beacon long ago.', scrap:35, reveal:true } },
    { text:'Reply with the next prime.', effect:{ text:'13. The signal stops. A moment later, a small cargo pod drifts out of the dark.', fuel:2, scrap:10 } },
    { text:'Pretend you didn\'t hear it.', effect:{ text:'It keeps counting, a little sadly, as you leave.' } } ] },
  t_admiral:{ text:'An old woman in a faded Fedoration uniform runs a tea shop on this station. She was an admiral once, and she has opinions about your ship.', tags:[''], art:'station', choices:[
    { text:'Ask for tactical advice.', effect:{ text:'She sketches your next fight on a napkin. It is uncomfortably accurate.', xp:{ skill:'weapons', amt:20 } } },
    { text:'Ask about the Rebuff Fleet.', effect:{ text:'She knows their patrol rhythms by heart. She tells you where they will be slowest.', fleetPush:-.04 } },
    { text:'Just have the tea.', effect:{ text:'The best tea in the sector. Everyone feels more themselves.', crewHeal:30 } } ] },
  t_tugs:{ text:'Two salvage tugs have their grapples on the same wreck and are pulling in opposite directions. Both captains are shouting at you to settle it.', tags:[''], art:'wreck', choices:[
    { text:'Side with the older tug.', effect:{ text:'The old captain wins and shares the find.', scrap:20 } },
    { text:'Side with the younger tug.', effect:{ text:'The young captain wins and gives you a crate of drone parts she does not need.', parts:4 } },
    { text:'Suggest they cut the wreck in half.', chance:.5, success:{ text:'They stare at you. Then they do it, and both pay you for the idea.', scrap:30 }, fail:{ text:'They agree, then turn their grapples on you for wasting their time.', fight:'auto_scoundrel' } } ] },
  t_bottle:{ text:'A sealed bottle drifts past with a note inside: a treasure map, drawn in crayon. The X is suspiciously close.', tags:[''], art:'space', choices:[
    { text:'Follow the map.', effect:{ text:'The X is marked on your star chart.', quest:'t_bottle_x' } },
    { text:'Keep the bottle as a souvenir.', effect:{ text:'It looks nice on the bridge.' } } ] },
  t_bottle_x:{ questOnly:true, art:'asteroid', text:'The X. A small asteroid with a door painted on it in crayon. The door is real.', choices:[
    { text:'Knock.', chance:.6, success:{ text:'It opens onto a child\'s secret hideout, long abandoned, full of collected treasures. Some of them are actually valuable.', scrap:35, augment:'random' }, fail:{ text:'An automated guard drone wakes up and takes this very seriously.', fight:'auto_scoundrel', afterWin:{ text:'Behind the guard: a small fortune in old coins.', scrap:45 } } } ] },
  t_food_poisoning:{ text:'Last night\'s stew was a mistake. Half the crew are green and the other half are pretending they aren\'t.', tags:[''], art:'ship', choices:[
    { text:'Everyone to the medbay.', req:{ system:'medbay' }, effect:{ text:'A long night, but by morning everyone is fine and swearing off stew.', fleetPush:.02 } },
    { text:'Tough it out.', effect:{ text:'Grim faces, steady hands. Mostly steady.', crewHurt:15 } },
    { text:'Have {who} eat the rest of the stew.', req:{ race:'sloog' }, effect:{ text:'{who} finishes the pot with relish. Sloog stomachs are a marvel. The crew feel better just watching.', crewHeal:10 } } ] },
  t_refinery:{ text:'A fuel refinery orbits a gas giant, run by one very bored technician.', tags:[''], art:'planet', choices:[
    { text:'Buy fuel (12 scrap for 4).', req:{ scrap:12 }, cost:{ scrap:12 }, effect:{ text:'Full tanks, fair price.', fuel:4 } },
    { text:'Trade missiles for fuel (2 missiles).', req:{ missiles:2 }, cost:{ missiles:2 }, effect:{ text:'The technician collects missiles. Do not ask why.', fuel:4 } },
    { text:'Keep the technician company for an hour.', effect:{ text:'They tell you about every pipe in the refinery. All of them. You leave with a free fuel cell.', fuel:1, crewHeal:5 } } ] },
  t_drone_flock:{ text:'A flock of lost mining drones has started following your ship, beeping hopefully.', tags:[''], art:'space', choices:[
    { text:'Adopt them.', effect:{ text:'They are mostly made of drone parts, and they want to help.', parts:5 } },
    { text:'Reprogram one for combat.', req:{ system:'hacking' }, chance:.6, success:{ text:'One of them becomes a very keen combat drone.', drone:'combat1' }, fail:{ text:'It becomes a very keen ornament.', parts:2 } },
    { text:'Lead them home.', effect:{ text:'You find their mining base. The miners pay you for the delivery.', scrap:20, fleetPush:.02 } } ] },
  t_reporter:{ text:'A reporter from the Galactic Gazette wants an interview. "Courier carrying secret data, chased across the stars! Our readers will love it."', tags:[''], art:'station', choices:[
    { text:'Give a heroic interview.', effect:{ text:'You are famous. Unfortunately, so is your route.', scrap:25, fleetPush:.04 } },
    { text:'Give a boring interview on purpose.', effect:{ text:'The article is titled "Local Pilot Flies Ship". Nobody reads it. Perfect.', scrap:5 } },
    { text:'Feed them a false route.', chance:.6, success:{ text:'The Rebuff Fleet reads the Gazette too. They go the wrong way.', fleetPush:-.06 }, fail:{ text:'The reporter checks your story and prints the truth.', fleetPush:.03 } } ] },
  t_comet:{ text:'A comet is passing close, its tail streaming across your path. Your pilot thinks you could ride its gravity well for a free boost.', tags:[''], art:'star', choices:[
    { text:'Ride the comet.', chance:.7, success:{ text:'Whoosh. You gain a lot of ground on the fleet.', fleetPush:-.06 }, fail:{ text:'Whoosh, then crunch. Ice in the vents.', fleetPush:-.03, hull:-3 } },
    { text:'Collect ice from the tail.', effect:{ text:'Fresh water and coolant. The crew take long showers.', crewHeal:20, fuel:1 } } ] },
  t_honesty_box:{ text:'An unmanned trading post with a sign: "Take what you need. Pay what you can. Honesty box below."', tags:[''], art:'market', choices:[
    { text:'Take a weapon and pay fairly (35 scrap).', req:{ scrap:35 }, cost:{ scrap:35 }, effect:{ text:'You leave the scrap in the box. Somewhere, the owner smiles.', weapon:'random' } },
    { text:'Take supplies and pay (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'Fuel, missiles and a jar of good jam.', fuel:2, missiles:2 } },
    { text:'Take a weapon and don\'t pay.', effect:{ text:'You take it. Nobody is watching. It sits a little heavy in the weapons bay.', weapon:'random', setFlag:'thief' } } ] },
  t_thief_caught:{ flag:'thief', once:true, minSector:2, text:'A small, furious ship hails you. "You took from my honesty box and paid NOTHING. I tracked you across a whole sector."', tags:[''], art:'ship', choices:[
    { text:'Pay what you owe, with interest (40 scrap).', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'"Hmph. Better late." They leave, slightly less furious.', clearFlag:'thief' } },
    { text:'Refuse.', effect:{ text:'The trading post owner is also a retired pyrate.', fight:'pyrate_gunship', clearFlag:'thief' } } ] },
  t_lost_pet:{ text:'A small furry creature is clinging to your hull camera, looking in at you. It has a collar with a name tag: "Biscuit".', tags:[''], art:'creature', choices:[
    { text:'Bring Biscuit aboard.', effect:{ text:'Biscuit takes over the captain\'s chair immediately. The crew are in love.', crewHeal:30, setFlag:'biscuit' } },
    { text:'Look up the address on the collar.', effect:{ text:'Biscuit lives two beacons away. Its owner pays you in fuel and gratitude.', fuel:3 } } ] },
  t_biscuit_home:{ flag:'biscuit', once:true, minSector:2, text:'A worried owner hails every ship in the sector: "Has anyone seen Biscuit?" On your bridge, Biscuit looks up from the captain\'s chair.', tags:[''], art:'ship', choices:[
    { text:'Return Biscuit.', effect:{ text:'A tearful reunion. The owner gives you a reward and Biscuit gives the crew one last look.', scrap:30, clearFlag:'biscuit' } },
    { text:'Keep quiet.', effect:{ text:'Biscuit stays. Biscuit was always going to stay. The crew are very happy.', crewHeal:20, clearFlag:'biscuit' } } ] },
  t_karaoke:{ text:'A karaoke bar on a tiny moon is holding its annual Sing-Off. The prize is a full set of shield capacitors.', tags:[''], art:'planet', choices:[
    { text:'Enter {crew}.', chance:.4, success:{ text:'{crew} brings the house down with a power ballad. You win.', augment:'booster' }, fail:{ text:'{crew} brings the house down, but not in a good way. Second-to-last place still gets a fuel cell.', fuel:1 } },
    { text:'Enter {who}.', req:{ race:'voltan' }, chance:.7, success:{ text:'{who} glows on every high note. The judges weep.', augment:'booster' }, fail:{ text:'The judges think the glowing is cheating.', crewHeal:10 } },
    { text:'Just watch.', effect:{ text:'A wonderful night out.', crewHeal:20 } } ] },
  t_survey:{ text:'A Fedoration survey station asks if you would fill in a short questionnaire about your journey so far. It has 140 questions.', tags:[''], art:'station', choices:[
    { text:'Fill it in honestly.', effect:{ text:'It takes an hour. They thank you with a care package and better charts of the sector.', reveal:true, missiles:1 } },
    { text:'Tick "strongly agree" to everything.', effect:{ text:'Your answers are flagged as suspiciously positive. They send you a free hull patch anyway.', hull:3 } } ] },
  t_ghost_crewmate:{ text:'{crew} swears they keep seeing an extra crew member in the corridors, out of the corner of their eye. Today, so does everyone else.', tags:[''], art:'ship', minSector:2, choices:[
    { text:'Search the ship.', chance:.5, success:{ text:'A stowaway mechanic, living in the vents for weeks, quietly fixing things. She is mortified to be caught.', crew:'human' }, fail:{ text:'Nobody. Only a cold spot in the engine room and some very unsettled crew.', crewHurt:5 } },
    { text:'Leave a plate of food out.', effect:{ text:'In the morning the plate is clean and your weapons have been oiled.', xp:{ skill:'weapons', amt:10 } } } ] },

  /* ---------------- one or two for each kind of sector ---------------- */
  t_rebuff_recruiter:{ tags:['rebuff'], art:'fleet', text:'A Rebuff recruiting station is broadcasting cheerful adverts: "Tired of running? Join the winning side! Free uniform!"', choices:[
    { text:'Sign up under a false name to steal the uniform.', chance:.6, success:{ text:'You walk out with a uniform and a set of patrol schedules.', fleetPush:-.05 }, fail:{ text:'The recruiter recognises your face from a poster.', fight:'rebuff_scout' } },
    { text:'Jam their adverts.', req:{ system:'hacking' }, effect:{ text:'You replace the adverts with a looping video of a cat. Recruitment drops sharply.', fleetPush:-.03, scrap:5 } },
    { text:'Fly past.', effect:{ text:'The adverts follow you on every channel for an hour.' } } ] },
  t_rebuff_mess:{ tags:['rebuff'], art:'station', text:'A Rebuff supply depot has left its cargo bay doors open. The guards are watching a sports match.', choices:[
    { text:'Help yourself, quietly.', chance:.55, success:{ text:'Missiles, fuel and a crate of officers\' biscuits.', missiles:4, fuel:2 }, fail:{ text:'The match goes to a break at the worst moment.', fight:'rebuff_fighter' } },
    { text:'Leave a rude note and go.', effect:{ text:'It is a very good note. Your crew will be quoting it for days.', crewHeal:10 } } ] },
  t_pyrate_auction:{ tags:['pyrate'], art:'market', text:'A pyrate auction is selling stolen goods. Half of them are probably yours from the last time pyrates raided a Fedoration convoy.', choices:[
    { text:'Bid on a mystery crate (30 scrap).', req:{ scrap:30 }, cost:{ scrap:30 }, chance:.6, success:{ text:'A gun, still in its packing.', weapon:'random' }, fail:{ text:'Socks. A crate of very nice socks.', crewHeal:10 } },
    { text:'Browse the stalls.', effect:{ text:'A pyrate trader sets up shop just for you.', store:true } },
    { text:'Report the auction to the authorities.', effect:{ text:'The pyrates find out who called. They are not pleased.', fight:'pyrate_bomber' } } ] },
  t_pyrate_parrot:{ tags:['pyrate'], art:'creature', text:'A pyrate\'s pet space-parrot has escaped and landed on your hull. It keeps squawking a string of numbers.', choices:[
    { text:'Write the numbers down.', effect:{ text:'It\'s the combination to a pyrate stash nearby. Thanks, bird.', scrap:35 } },
    { text:'Return it to the pyrates.', effect:{ text:'The pyrate captain is so happy she lets you go without a fight, and adds a little reward.', scrap:15, fleetPush:-.02 } } ] },
  t_nebula_echo:{ tags:['nebula'], nebula:true, art:'nebula', text:'In the thick gas, your sensors pick up a ship. It is yours, a few seconds in the future, flying a different course.', choices:[
    { text:'Follow your future self.', chance:.6, success:{ text:'Your future self knew a shortcut.', fleetPush:-.05, fuel:1 }, fail:{ text:'Your future self was also lost.', fleetPush:.02 } },
    { text:'Wave.', effect:{ text:'Your future self waves back, then gestures wildly at your shields. A minute later, an asteroid. You\'re ready.', xp:{ skill:'shields', amt:12 } } } ] },
  t_nebula_harvester:{ tags:['nebula'], art:'nebula', text:'A gas harvester crew is stuck: their scoop is jammed and the nebula\'s static has fried their radio.', choices:[
    { text:'Help unjam the scoop.', effect:{ text:'It takes a few hours. They fill your tanks from the scoop by way of thanks.', fuel:5 } },
    { text:'Relay a message for them.', effect:{ text:'Their company sends a tug and a thank-you payment.', scrap:20 } } ] },
  t_sloog_library:{ tags:['sloog'], art:'nebula', text:'A Sloog library holds memories instead of books. A librarian offers to lend your crew a few.', choices:[
    { text:'Borrow a soldier\'s memories.', effect:{ text:'Your crew now remember a lifetime of close-quarters fighting. It\'s very unsettling, and very useful.', xp:{ skill:'combat', amt:20 } } },
    { text:'Borrow an engineer\'s memories.', effect:{ text:'Your crew remember every repair manual ever written. They fix things in their sleep.', xp:{ skill:'repair', amt:20 } } },
    { text:'Donate a memory of your own (the crew\'s favourite meal).', effect:{ text:'The librarian is thrilled. Nobody can quite remember what the meal was.', scrap:25 } } ] },
  t_pebble_concert:{ tags:['pebblekin'], art:'planet', text:'A Pebblekin rock concert. Literally: the band are rocks, the stage is a rock, and the music is two mountains grinding together.', choices:[
    { text:'Buy tickets for the crew (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'Loud, slow and strangely moving. Everyone comes back happy and a little deaf.', crewHeal:40 } },
    { text:'Sell drinks to the crowd.', effect:{ text:'Pebblekin get thirsty. You make a tidy profit.', scrap:25 } },
    { text:'Let {who} join the band.', req:{ race:'pebblekin' }, effect:{ text:'{who} grinds a solo that cracks the stage. The crowd go wild and throw scrap.', scrap:40 } } ] },
  t_enjinn_hackathon:{ tags:['enjinn'], art:'station', text:'An Enjinn hackathon: forty-eight hours, one hundred engineers, and one question shouted over and over: "What can we improve?"', choices:[
    { text:'Offer your ship as the challenge.', chance:.7, success:{ text:'They return it with an upgraded system and a lot of opinions.', upgrade:'random' }, fail:{ text:'They return it with a coffee maker built into the helm and no other changes.', crewHeal:15 } },
    { text:'Ask them for a drone.', effect:{ text:'They build you one from your spare parts in twenty minutes, then apologise for taking so long.', drone:'random', parts:-2 } } ] },
  t_voltan_eclipse:{ tags:['voltan'], art:'star', text:'The Voltans gather for an eclipse, and the whole sector goes dark except for their glow. A priest invites your ship to stay for the light.', choices:[
    { text:'Stay for the eclipse.', effect:{ text:'When the light returns, your hull feels newer and your crew calmer.', hull:6, crewHeal:20 } },
    { text:'Use the darkness to slip past the fleet.', effect:{ text:'Nobody can see you in the eclipse.', fleetPush:-.05 } } ] },
  t_mantlis_feast:{ tags:['mantlis'], art:'creature', text:'A Mantlis clan is holding a victory feast and has decided you are invited. Declining is considered an insult. So is eating too slowly.', choices:[
    { text:'Eat as fast as you can.', chance:.5, success:{ text:'You win their respect, and a share of the spoils.', scrap:25, missiles:2 }, fail:{ text:'You do not win their respect. You do win indigestion.', crewHurt:10 } },
    { text:'Let {who} represent you.', req:{ race:'mantlis' }, effect:{ text:'{who} out-eats the clan champion. They chant your ship\'s name.', scrap:35, xp:{ skill:'combat', amt:10 } } },
    { text:'Make a speech instead.', effect:{ text:'They find the speech hilarious. It was meant to be serious.', crewHeal:15 } } ] }
};
Object.assign(BASE.events, TALES);
