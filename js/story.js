'use strict';
/* =========================================================================
   Story: faction hails, quest chains, a secret sector, extra events, crew
   chatter, enemy taunts, sector intros and store greetings.
   Placeholders: {crew} a random crew member, {who} the crew member who
   meets a choice's race requirement, {ship} your ship, {enemy} the enemy.
   ========================================================================= */
const fightNow = { begin:true };
const STORY_EVENTS = {
  /* ---------------- hails before ship fights ---------------- */
  hail_rebuff1:{ hail:'rebuff', text:'"Fedoration vessel {ship}, this is the {enemy}. Power down your weapons and prepare to be boarded. Resistance will be noted in your file. Your very thick file."', choices:[
    { text:'Open fire.', effect:fightNow },
    { text:'Try to bluff: claim you are a Rebuff supply run.', chance:.35, success:{ text:'"Supply run? Why didn\'t you say so." They wave you on, then realise their mistake far too late to follow.', dismiss:true, scrap:5 }, fail:{ text:'"Nice try. Your transponder says Fedoration and your paint job says idiot." Weapons lock.', begin:true } },
    { text:'Have {who} slip under their sensors.', req:{ system:'cloaking', level:1 }, effect:{ text:'You vanish from their screens. They spend the next hour scanning an empty patch of space.', dismiss:true } } ] },
  hail_rebuff2:{ hail:'rebuff', text:'A stern face fills your screen. "By order of the Rebuff Directorate, your journey ends here. Any last words for the report?"', choices:[
    { text:'"Yes. Duck."', effect:fightNow },
    { text:'Offer a 25 scrap "processing fee".', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'The officer pockets the scrap and suddenly remembers an appointment elsewhere.', dismiss:true } },
    { text:'{who} quotes Rebuff regulations at them until they give up.', req:{ race:'human' }, chance:.5, success:{ text:'Section 14, paragraph 9: no engagements during scheduled lunch. They check the time, swear and leave.', dismiss:true }, fail:{ text:'"That regulation was repealed." Of course it was.', begin:true } } ] },
  hail_rebuff3:{ hail:'rebuff', text:'"Attention, rebel scum. Surrender your data core and we will let your crew live. Probably. Ninety percent chance. Seventy."', choices:[
    { text:'"Come and get it."', effect:fightNow },
    { text:'Pretend to comply, then fire first.', effect:{ text:'You power down for a moment, then bring everything back online at once. Your weapons start warm.', begin:true, primeWeapons:true } } ] },
  hail_pyrate1:{ hail:'pyrate', text:'"Ahoy, {ship}! Hand over your scrap and nobody gets spaced!" The {enemy} runs out its guns with a lot of unnecessary shouting.', choices:[
    { text:'Never. Open fire!', effect:fightNow },
    { text:'Pay them off (20 scrap).', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'They take the scrap and sail off singing badly.', dismiss:true } },
    { text:'Have {who} explain what Mantlis do to pirates.', req:{ race:'mantlis' }, effect:{ text:'{who} describes it in detail. The pirates go pale, throw a crate of scrap out of the airlock and flee.', scrap:15, dismiss:true } } ] },
  hail_pyrate2:{ hail:'pyrate', text:'The {enemy} hails you with a laugh. "Nice ship. We\'ll take it. You can keep the crew. Actually, no, we\'ll take them too."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Offer to join forces against the Rebuff Fleet.', chance:.3, success:{ text:'"A common enemy, eh?" They share a little loot and wish you well.', dismiss:true, scrap:20, fuel:1 }, fail:{ text:'"We\'re pirates. We don\'t have friends." They open fire.', begin:true } },
    { text:'Challenge their captain to a game of cards. {who} counts cards.', req:{ race:'sloog' }, effect:{ text:'{who} wins their scrap, their dignity and a weird hat. They leave, furious and poorer.', scrap:25, dismiss:true } } ] },
  hail_pyrate3:{ hail:'pyrate', text:'"Yarr! Stand and deliver! That means stop moving. And give us stuff."', choices:[
    { text:'Give them something to remember. Fire!', effect:fightNow },
    { text:'Dump 3 missiles out the airlock as a "gift".', req:{ missiles:3 }, cost:{ missiles:3 }, effect:{ text:'They scoop up the missiles, delighted, and leave you alone.', dismiss:true } } ] },
  hail_mantlis1:{ hail:'mantlis', text:'The {enemy}\'s captain clacks its mandibles at the camera. The translator struggles, then settles on: "MEAT. SHINY. FIGHT."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Let {who} answer in their own language.', req:{ race:'mantlis' }, chance:.6, success:{ text:'A long series of clicks. The raiders bow, salute {who} and leave a "tribute" floating behind them.', dismiss:true, scrap:20 }, fail:{ text:'{who} accidentally insults its mother. Battle stations.', begin:true } } ] },
  hail_mantlis2:{ hail:'mantlis', text:'"Your ship is weak. Your crew are soft. We will enjoy this." The {enemy} sweeps you with targeting lasers.', choices:[ { text:'Prove them wrong.', effect:fightNow } ] },
  hail_voltan1:{ hail:'voltan', text:'A serene Voltan glows on your screen. "You trespass in sacred space. We must ask you to leave. Then we must ask you to explode."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Pay a 20 scrap tithe to the temple.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'"Your offering is accepted. Go in peace, and in fewer pieces."', dismiss:true } },
    { text:'Let {who} ask for safe passage.', req:{ race:'voltan' }, effect:{ text:'They recognise {who}\'s glow. "Sister-light. Pass freely." They even top up your shields\' super-charge.', dismiss:true, scrap:10 } } ] },
  hail_voltan2:{ hail:'voltan', text:'"The Peacemongers bring peace. Mostly by force. Please hold still."', choices:[ { text:'Not today.', effect:fightNow } ] },
  hail_pebble1:{ hail:'pebblekin', text:'The {enemy} drifts closer very, very slowly. "YOU. ARE. IN. OUR. WAY." It takes a while.', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Move out of their way.', effect:{ text:'You shift ten metres to the left. They seem satisfied and continue on their way. Eventually.', dismiss:true } },
    { text:'Have {who} trade rock jokes with them.', req:{ race:'pebblekin' }, effect:{ text:'They are still laughing as you leave. One of them throws you some ore.', scrap:15, dismiss:true } } ] },
  hail_pebble2:{ hail:'pebblekin', text:'"YOUR. HULL. LOOKS. SOFT." The {enemy} cracks its knuckles. You did not know ships could do that.', choices:[ { text:'Fight.', effect:fightNow } ] },
  hail_sloog1:{ hail:'sloog', text:'"Hello friend! We are definitely not about to hack your ship and steal everything. Please lower your shields so we can say hello properly."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Let {who} read their minds.', req:{ race:'sloog' }, effect:{ text:'{who} reads out the Sloog captain\'s embarrassing secrets on an open channel. They pay you to stop.', scrap:25, dismiss:true } } ] },
  hail_sloog2:{ hail:'sloog', text:'"We know what you are thinking," the {enemy} oozes. "You are thinking about losing."', choices:[ { text:'"I\'m thinking about shooting."', effect:fightNow } ] },
  hail_enjinn1:{ hail:'enjinn', text:'"Unidentified vessel. Your engine timing is off by 0.3%. It offends us. We will fix it. By destroying it."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Ask {who} to talk shop with them.', req:{ race:'enjinn' }, effect:{ text:'An hour of excited mechanic talk later, they tune your engines for free and go home happy.', dismiss:true, upgrade:'engines' } } ] },
  hail_auto1:{ hail:'auto', text:'No reply. The {enemy}\'s targeting lasers sweep your hull in a lazy, mechanical arc.', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Spoof its friend-or-foe code with your hacking system.', req:{ system:'hacking', level:1 }, effect:{ text:'The drone ship decides you are its mother and follows you for a while before wandering off.', dismiss:true, parts:2 } },
    { text:'Let {who} sweet-talk its AI.', req:{ race:'enjinn' }, chance:.7, success:{ text:'The AI was lonely. It gives you its spare parts and powers down.', dismiss:true, parts:4 }, fail:{ text:'It does not want to be friends.', begin:true } } ] },
  hail_auto2:{ hail:'auto', text:'"HOSTILE DETECTED. HOSTILE DETECTED. HAVE A NICE DAY. HOSTILE DETECTED."', choices:[ { text:'Fight.', effect:fightNow } ] },
  hail_fleet:{ hail:'fleet', text:'The Rebuff Fleet has caught up. A warship breaks formation, its guns already hot. "End of the line, {ship}."', choices:[ { text:'Fight your way out.', effect:fightNow } ] },
  hail_generic1:{ hail:'generic', text:'The {enemy} powers its weapons without a word.', choices:[ { text:'Battle stations.', effect:fightNow } ] },
  hail_generic2:{ hail:'generic', text:'"Nothing personal, {ship}. Business is business." The {enemy} locks on.', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Make them a better business offer (25 scrap).', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'"Pleasure doing business." They leave.', dismiss:true } } ] },
  hail_glass1:{ hail:'glass', text:'A chiming tone fills the bridge. The {enemy} rotates slowly, light bending through its hull. "INTRUDERS. YOU ARE SOFT AND OPAQUE."', choices:[
    { text:'Fight.', effect:fightNow },
    { text:'Let {who} sing the old harmonics.', req:{ race:'glassborn' }, effect:{ text:'The sentinel rings in reply and lets you pass.', dismiss:true } } ] },

  /* ---------------- quest: the glass shard and the secret sector ---------------- */
  glass_shard:{ once:true, minSector:2, weight:1.2, art:'glass', text:'A sliver of crystal clings to your hull after the jump. It is warm, and it hums a note nobody can quite hear.', choices:[
    { text:'Bring it aboard and study it.', effect:{ text:'{crew} swears it changes pitch when nobody is looking. The shard is locked away in the hold. Maybe someone out there can read it.', setFlag:'shard' } },
    { text:'Scrape it off and flick it into space.', effect:{ text:'The humming stops. Everyone pretends to be relieved.' } } ] },
  glass_decode:{ flag:'shard', noFlag:'coords', weight:3, minSector:3, art:'station', text:'A scholar\'s outpost floats at this beacon. Its keeper notices the humming in your hold before you even dock. "That is a Glassborn song-shard. May I?"', choices:[
    { text:'Hand it over.', effect:{ text:'The keeper listens for a long time. "It is a map. Coordinates to a sector that does not appear on any chart." They copy the coordinates into your nav computer.', setFlag:'coords', clearFlag:'shard', choices:[
      { text:'"What is out there?"', effect:{ text:'"The Glassborn. Living crystal. Nobody who goes looking comes back unchanged." At your next exit beacon, a third route will appear.' } } ] } },
    { text:'Let {who} decode it instead.', req:{ race:'voltan' }, effect:{ text:'{who} glows in harmony with the shard. "It\'s a map home. Not my home. Someone\'s." The coordinates are logged. The keeper gives you scrap for the recording.', setFlag:'coords', clearFlag:'shard', scrap:20 } },
    { text:'Not yet.', effect:{ text:'You keep your secrets. The shard keeps humming.' } } ] },
  glass_welcome:{ questOnly:true, art:'glass', text:'Towers of living glass rise from the beacon\'s asteroid. A Glassborn envoy, all facets and slow light, drifts out to meet you. "Opaque ones. You carried our song home."', choices:[
    { text:'"We just followed the map."', effect:{ text:'"Then you are the first in a long age." The envoy chimes. "We will remember your ship."', unlock:'glasscannon', choices:[
      { text:'Ask if any of them want to see the galaxy.', effect:{ text:'A young Glassborn steps forward, refracting nervously. It joins your crew.', crew:'glassborn' } },
      { text:'Ask for help against the Rebuff Fleet.', effect:{ text:'They reinforce your hull with crystal lattice.', maxHull:5, hull:5 } } ] } },
    { text:'Ask to trade.', effect:{ text:'They open their vaults.', store:true } } ] },
  glass_trial:{ tags:['glass'], once:true, art:'glass', text:'A crystal spire flashes a challenge: a test of patience, it seems. The light pulses in a slow pattern.', choices:[
    { text:'Wait and match the pattern with your shields.', req:{ system:'shields', level:3 }, effect:{ text:'Your shield harmonics match the spire. It shatters into a shower of valuable shards.', scrap:45 } },
    { text:'Shoot it.', effect:{ text:'The spire screams. Glass sentinels wake.', fight:'glass_sentinel' } },
    { text:'Leave quietly.', effect:{ text:'The light dims. You feel judged.' } } ] },
  glass_garden:{ tags:['glass'], art:'glass', text:'A garden of crystal flowers turns to follow your ship. Some are growing in the shape of weapons.', choices:[
    { text:'Pick one of the weapon-shaped flowers.', chance:.6, success:{ text:'It comes away cleanly and turns out to be a working beam emitter.', weapon:'halbird' }, fail:{ text:'The garden does not like being picked.', hull:-4 } },
    { text:'Admire them and move on.', effect:{ text:'Your crew feels oddly rested.', crewHeal:40 } } ] },

  /* ---------------- quest: the defector ---------------- */
  defector:{ once:true, minSector:3, tags:['rebuff',''], art:'ship', text:'A Rebuff shuttle limps toward you, flashing an old Fedoration surrender code. "This is Commander Ilsa Vane. I have codes for the Flaggship. I want asylum."', choices:[
    { text:'Bring her aboard.', effect:{ text:'Vane comes aboard with a datapad and a nervous smile. "Its shield generators have a flaw. When you face it, aim for the seams."', crew:'human', setFlag:'intel', choices:[
      { text:'"Why are you helping us?"', effect:{ text:'"Because I\'ve seen what the Rebuff do with victory." She doesn\'t say more.' } } ] } },
    { text:'It\'s a trap. Destroy the shuttle.', effect:{ text:'The shuttle explodes. A Rebuff ship that was hiding behind it opens fire.', fight:'rebuff_fighter' } },
    { text:'Have {who} read her mind first.', req:{ race:'sloog' }, effect:{ text:'{who} frowns, then nods. "She\'s telling the truth. She\'s also terrified." Vane comes aboard with the codes.', crew:'human', setFlag:'intel', scrap:10 } } ] },
  defector_doubt:{ flag:'intel', noFlag:'trusted', minSector:5, weight:4, once:true, text:'Commander Vane asks to send a short coded message from your comms. "My family. They need to know I\'m alive."', choices:[
    { text:'Allow it.', chance:.8, success:{ text:'She sends the message and quietly thanks you. Later, a Fedoration courier drops off supplies, "from a friend of Vane".', fuel:3, missiles:3, setFlag:'trusted' }, fail:{ text:'The message was a beacon. A Rebuff ship arrives within minutes. Vane is gone in the confusion.', fight:'rebuff_elite', clearFlag:'intel' } },
    { text:'Refuse.', effect:{ text:'She nods. "I understand." She doesn\'t ask again.' } },
    { text:'Let {who} check her intentions.', req:{ race:'sloog' }, effect:{ text:'{who} confirms she\'s loyal. You let her send it. The courier\'s gift includes an augment.', augment:'random', setFlag:'trusted' } } ] },

  /* ---------------- quest: weevil nest ---------------- */
  weevil_nest:{ questOnly:true, art:'creature', text:'The Space Weevils\' nest is a hollowed-out freighter, wriggling with larvae. At its heart, something big is breathing.', choices:[
    { text:'Send in a team to grab the royal jelly.', chance:.5, success:{ text:'Your team returns sticky, terrified and carrying a fortune in weevil jelly.', scrap:70 }, fail:{ text:'The queen is awake. Your team retreats, chewed.', crewHurt:40, scrap:15 } },
    { text:'Burn it out with fire bombs.', req:{ weaponType:'bomb' }, effect:{ text:'The nest goes up like a torch. Among the ashes: a stash of salvaged weapons.', weapon:'random', scrap:30 } },
    { text:'Send your Mantlis. They\'re already drooling.', req:{ race:'mantlis' }, effect:{ text:'There is a lot of crunching. {who} returns, very pleased, with the queen\'s hoard.', scrap:60, augment:'random' } },
    { text:'Leave the weevils be.', effect:{ text:'A wise and itch-free choice.' } } ] },

  /* ---------------- quest: treasure map ---------------- */
  map_piece_a:{ once:true, art:'wreck', text:'In a drifting pyrate lifeboat you find a skeleton in a ridiculous hat, clutching a scrap of a star chart.', choices:[ { text:'Take the map piece.', effect:{ text:'One third of a treasure map. It\'s marked with an X and a doodle of a skull.', mapPiece:1 } } ] },
  map_piece_b:{ once:true, tags:['pyrate','',''], art:'market', text:'A trader is selling "authentic pyrate memorabilia". One item is a torn star chart with a very familiar skull doodle.', choices:[
    { text:'Buy it for 15 scrap.', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'Another piece of the map.', mapPiece:1 } },
    { text:'Pass.', effect:{ text:'The trader shrugs.' } } ] },
  map_piece_c:{ once:true, minSector:2, art:'ship', text:'A Pyrate captain is drunk-broadcasting on an open channel about "the old captain\'s treasure". She\'s waving a map fragment around.', choices:[
    { text:'Challenge her for it.', effect:{ text:'She\'s too drunk to aim well, but she\'ll try.', fight:'pyrate_gunship', afterWin:{ text:'Among the wreckage you find the map fragment.', mapPiece:1 } } },
    { text:'Offer her 30 scrap for it.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'"Sold! Who needs treasure anyway?"', mapPiece:1 } },
    { text:'Have {who} lift it off her during the bargaining.', req:{ race:'sloog' }, effect:{ text:'{who} comes back with the map and her wallet.', mapPiece:1, scrap:12 } } ] },
  treasure_vault:{ questOnly:true, art:'asteroid', text:'The X marks a hollow asteroid. Inside, under centuries of dust, a vault door shaped like a grinning skull.', choices:[
    { text:'Open it carefully.', effect:{ text:'The treasure of the old Pyrate King: scrap, a gleaming weapon and an augment still in its packaging.', scrap:80, weapon:'random', augment:'random', achievement:'treasure' } },
    { text:'Blast it open.', effect:{ text:'The vault\'s guardian drone wakes up.', fight:'auto_assault', afterWin:{ text:'Past the wrecked guardian, the treasure is yours.', scrap:90, weapon:'random', achievement:'treasure' } } } ] },

  /* ---------------- quest: the loan shark ---------------- */
  loanshark:{ once:true, tags:['sloog','pyrate',''], art:'market', text:'A Sloog in a sharp suit oozes onto your screen. "Short on scrap, friend? I can lend you 50 right now. Pay me back later. With a little interest."', choices:[
    { text:'Take the loan.', effect:{ text:'"Pleasure doing business. I\'ll find you." The scrap lands in your account.', scrap:50, setFlag:'loan', later:{ event:'debt_collector', jumps:6 } } },
    { text:'No thanks.', effect:{ text:'"Your loss, friend."' } } ] },
  debt_collector:{ questOnly:true, art:'ship', text:'A heavily armed Sloog ship drops in beside you. "The boss sends his regards. You owe 80 scrap. Pay now, or we take it out of your hull."', choices:[
    { text:'Pay 80 scrap.', req:{ scrap:80 }, cost:{ scrap:80 }, effect:{ text:'"Lovely. The boss will be pleased." They leave.', clearFlag:'loan' } },
    { text:'Fight them.', effect:{ text:'"Wrong answer."', fight:'sloog_mind', clearFlag:'loan' } },
    { text:'Have {who} convince them you already paid.', req:{ race:'sloog' }, chance:.6, success:{ text:'{who} plants a false memory of the payment. They leave happy.', clearFlag:'loan' }, fail:{ text:'Sloog don\'t fall for Sloog tricks. They open fire.', fight:'sloog_mind', clearFlag:'loan' } } ] },

  /* ---------------- quest: Mantlis honour ---------------- */
  mantlis_honor:{ once:true, tags:['mantlis'], art:'creature', text:'A Mantlis war-chief hails you. "Your ship smells of victory. We demand a duel of champions. Choose."', choices:[
    { text:'Send your toughest fighter.', chance:.45, success:{ text:'Against all odds, {crew} wins. The war-chief bows. "You have honour, soft one."', scrap:30, setFlag:'mantlisFriend' }, fail:{ text:'{crew} is carried back, battered but alive. The Mantlis laugh and leave.', crewHurt:30 } },
    { text:'Send {who}.', req:{ race:'mantlis' }, effect:{ text:'{who} wins in a flurry of limbs. The war-chief offers a warrior to serve on your ship.', crew:'mantlis', setFlag:'mantlisFriend' } },
    { text:'Refuse the duel.', effect:{ text:'"Cowards!" They open fire.', fight:'mantlis_raider' } } ] },
  mantlis_gift:{ flag:'mantlisFriend', once:true, tags:['mantlis'], weight:3, text:'A Mantlis warband recognises your ship and salutes you with a burst of clicking. "Honoured one! Take these spoils."', choices:[ { text:'Accept.', effect:{ text:'They hand over a weapon taken from some unfortunate pirate.', weapon:'random', missiles:3 } } ] },

  /* ---------------- quest: Voltan prophecy ---------------- */
  prophecy1:{ once:true, tags:['voltan',''], minSector:2, art:'star', text:'A Voltan oracle stops you. "I have seen a ship vaster than life. It carries a burning secret and outruns a fleet. Is it you?"', choices:[
    { text:'"Probably."', effect:{ text:'"Then we will meet again, Vaster One." The oracle fades away.', setFlag:'prophecy', later:{ event:'prophecy2', jumps:7 } } },
    { text:'"Definitely not. Wrong ship."', effect:{ text:'"Hmm. You are lying, but that is part of the prophecy too."', setFlag:'prophecy', later:{ event:'prophecy2', jumps:7 } } } ] },
  prophecy2:{ questOnly:true, art:'star', text:'The Voltan oracle appears on your viewscreen without using the comms. "Vaster One. The prophecy says you will need light when the darkness comes."', choices:[
    { text:'Accept the oracle\'s gift.', effect:{ text:'A pulse of pure energy wraps your ship.', augment:'voltanShield', achievement:'prophecy' } },
    { text:'Ask {who} to join with the oracle\'s light.', req:{ race:'voltan' }, effect:{ text:'{who} and the oracle glow as one. Your reactor hums stronger.', reactor:2, augment:'voltanShield', achievement:'prophecy' } } ] },

  /* ---------------- quest: the ghost ship ---------------- */
  ghostship:{ once:true, minSector:2, art:'wreck', text:'A ship drifts here with every light on and every airlock open. Its name has been scratched off. Your sensors show no life signs, yet someone keeps waving from a porthole.', choices:[
    { text:'Board it.', effect:{ text:'The corridors are spotless. Dinner is laid out on the mess table, still warm. {crew} insists they heard laughter.', choices:[
      { text:'Check the captain\'s log.', effect:{ text:'The last entry reads: "We found it. We should never have taken it." There is a glowing core on the captain\'s desk.', choices:[
        { text:'Take the core.', effect:{ text:'The lights go out the moment you lift it. Your team runs. The core is worth a fortune.', scrap:60, setFlag:'ghostCore', later:{ event:'ghost_return', jumps:4 } } },
        { text:'Leave it. Leave now.', effect:{ text:'You back away slowly. The waving figure waves goodbye.' } } ] } },
      { text:'Leave immediately.', effect:{ text:'Your team returns, pale. Nobody talks about it.' } } ] } },
    { text:'Fly away. Fast.', effect:{ text:'The waving figure watches you go.' } } ] },
  ghost_return:{ questOnly:true, art:'wreck', text:'Every screen on your ship flickers at once. The ghost ship is beside you, though you never saw it arrive. A voice, everywhere: "Return what you took."', choices:[
    { text:'Give back the core.', effect:{ text:'The core vanishes from your hold. The voice sighs, satisfied. Something new is sitting in its place.', augment:'random', clearFlag:'ghostCore' } },
    { text:'Refuse.', effect:{ text:'The ghost ship\'s guns are very real.', fight:'rebuff_cloaker', clearFlag:'ghostCore', afterWin:{ text:'As the phantom ship breaks up, a choir of relieved voices fades away.', scrap:40 } } } ] },

  /* ---------------- quest: the Enjinn lamp ---------------- */
  lamp_find:{ once:true, art:'wreck', text:'Floating among some junk: an ornate brass lamp, rather out of place in space.', choices:[
    { text:'Take it.', effect:{ text:'It feels warm. {crew} rubs it a bit, but nothing happens. Yet.', setFlag:'lamp' } },
    { text:'Leave it.', effect:{ text:'You have quite enough junk.' } } ] },
  lamp_genie:{ flag:'lamp', weight:4, minSector:3, once:true, text:'The brass lamp starts rattling in the hold. A small, very tired Enjinn genie pops out. "Three wishes. Make them quick, my shift ends soon."', choices:[
    { text:'Wish for a stronger ship.', effect:{ text:'"Done." Your hull thickens.', maxHull:6, hull:6, clearFlag:'lamp', choices:[
      { text:'Second wish: more firepower.', effect:{ text:'"Fine." A weapon appears in your cargo hold.', weapon:'random', choices:[
        { text:'Third wish: "Join my crew."', effect:{ text:'"...Huh. Nobody\'s ever asked that." The genie shrugs and joins you.', crew:'enjinn' } },
        { text:'Third wish: lots of scrap.', effect:{ text:'"Classic." Scrap pours out of the lamp.', scrap:60 } } ] } } ] } },
    { text:'Wish for the war to end.', effect:{ text:'"I\'m a genie, not a miracle worker." The genie gives you a drone part out of pity and vanishes.', parts:3, clearFlag:'lamp' } } ] },

  /* ---------------- quest: escort ---------------- */
  escort:{ once:true, minSector:2, art:'ship', text:'A damaged Fedoration medical frigate asks for an escort to the next beacon. "We have wounded aboard. We can pay."', choices:[
    { text:'Agree to escort them.', effect:{ text:'The frigate falls in behind you.', later:{ event:'escort_end', jumps:1 } } },
    { text:'You can\'t risk the delay.', effect:{ text:'"We understand." They limp off alone.' } } ] },
  escort_end:{ questOnly:true, art:'ship', text:'The frigate made the jump with you. Then a Rebuff ship drops out of nowhere, guns trained on the frigate.', choices:[
    { text:'Put yourself between them.', effect:{ text:'You draw their fire.', fight:'rebuff_fighter', afterWin:{ text:'The frigate\'s captain thanks you and sends over medical supplies and a volunteer.', crewHeal:100, crew:'random', scrap:25 } } },
    { text:'Run for it.', effect:{ text:'The frigate is caught. You hear their final transmission as you jump. Nobody speaks for a while.' } } ] },

  /* ---------------- standalone events ---------------- */
  spacewhale:{ art:'creature', text:'A space whale, kilometres long, glides past the beacon, singing. Barnacle-like ships cling to its hide.', choices:[
    { text:'Scrape some barnacle-ships for scrap.', chance:.7, success:{ text:'Easy salvage. The whale doesn\'t even notice.', scrap:25 }, fail:{ text:'The whale notices. It flicks its tail.', hull:-5 } },
    { text:'Just listen to the song.', effect:{ text:'Your crew sits in silence on the observation deck. Everyone feels a little better.', crewHeal:50 } } ] },
  spiders:{ minSector:2, art:'creature', text:'A research station is overrun by giant space arachnids. A survivor waves frantically from a window, and the spiders are between you and her.', choices:[
    { text:'Send a rescue team.', chance:.5, success:{ text:'Your team fights through and brings her back. She has station codes worth a fortune.', crew:'human', scrap:30 }, fail:{ text:'The spiders swarm the team. They barely make it back, without the survivor.', crewHurt:45 } },
    { text:'Vent the station\'s atmosphere from outside.', req:{ system:'doors', level:2 }, effect:{ text:'You hack the station airlocks. The spiders tumble out into space, and so does a crate of equipment.', scrap:20, parts:3 } },
    { text:'Send {who} first.', req:{ race:'mantlis' }, effect:{ text:'{who} has a great time. The survivor is rescued and very grateful.', crew:'random', scrap:20 } },
    { text:'Leave.', effect:{ text:'You try not to think about it.' } } ] },
  probe:{ text:'An ancient probe from a long-dead civilisation drifts across your path, broadcasting a recorded greeting.', choices:[
    { text:'Salvage it.', effect:{ text:'Its power cell is still good.', scrap:18, parts:1 } },
    { text:'Record the greeting and send it on its way.', effect:{ text:'The greeting is just a voice saying "hello" in a thousand languages. {crew} is moved.' } },
    { text:'Have {who} translate it.', req:{ race:'enjinn' }, effect:{ text:'It is actually a manual for a weapon system. Your engineers build it from the instructions.', weapon:'random' } } ] },
  wedding:{ art:'station', text:'A Pebblekin wedding is underway on a nearby asteroid. They invite you to the reception, which may last several months.', choices:[
    { text:'Send a gift (15 scrap).', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'They send back a slice of cake made of compressed gravel and a crate of missiles.', missiles:4 } },
    { text:'Have {who} give a speech.', req:{ race:'pebblekin' }, effect:{ text:'The speech lasts nine hours. Everyone cries. They give you a gift.', augment:'rockPlating', scrap:10 } },
    { text:'Politely decline.', effect:{ text:'They are too slow to notice you leaving.' } } ] },
  race_track:{ tags:['pyrate',''], art:'asteroid', text:'Pyrates are running illegal ship races through an asteroid field. "Entry fee 20 scrap! Winner takes the pot!"', choices:[
    { text:'Enter the race.', req:{ scrap:20 }, cost:{ scrap:20 }, chance:.4, success:{ text:'You win by a nose cone! The crowd goes wild.', scrap:70 }, fail:{ text:'You clip an asteroid on the last turn.', hull:-3 } },
    { text:'Enter with your high-power engines.', req:{ system:'engines', level:4 }, cost:{ scrap:20 }, effect:{ text:'Nobody else stands a chance.', scrap:75 } },
    { text:'Watch from a safe distance.', effect:{ text:'Three ships crash. Pyrate racing is mostly crashing.' } } ] },
  clone_vat:{ minSector:2, art:'station', text:'An abandoned medical station still has a working clone vat. A clone is half-grown inside, labelled "SPARE".', choices:[
    { text:'Finish growing the clone.', chance:.75, success:{ text:'The clone wakes up confused but eager to help. They join your crew.', crew:'human' }, fail:{ text:'Something went wrong. You turn the vat off and leave quickly.' } },
    { text:'Salvage the equipment.', effect:{ text:'Medical gear and scrap.', scrap:25, crewHeal:100 } } ] },
  refugee_choice:{ art:'ship', text:'Two ships hail you at once. A refugee transport begs for fuel. A Rebuff patrol orders you to stop it from fleeing.', choices:[
    { text:'Give the refugees 2 fuel.', req:{ fuel:3 }, cost:{ fuel:2 }, effect:{ text:'The refugees escape. The patrol turns on you.', fight:'rebuff_fighter', afterWin:{ text:'The refugees send a thank-you message, and a volunteer.', crew:'random' } } },
    { text:'Fire on the patrol.', effect:{ text:'The refugees flee as you engage.', fight:'rebuff_fighter', afterWin:{ text:'The refugees leave you a gift of scrap.', scrap:20 } } },
    { text:'Do nothing.', effect:{ text:'The patrol catches the transport. You leave before you have to watch.' } } ] },
  mutiny:{ minSector:2, text:'{crew} bursts onto the bridge. "Half the crew want to turn back. They say we\'ll never make it."', choices:[
    { text:'Give a rousing speech.', chance:.65, success:{ text:'The crew cheers. Everyone gets back to work, inspired.', crewHeal:30 }, fail:{ text:'Your speech is boring. The grumbling continues, but at least they work.' } },
    { text:'Promise extra rations from the scrap fund.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Full bellies, happy crew.', crewHeal:50 } },
    { text:'Let {who} handle it.', req:{ race:'mantlis' }, effect:{ text:'{who} glares at the crew. The mutiny ends very quickly.' } } ] },
  stowaway:{ text:'A stowaway is found hiding in your cargo hold, eating your emergency rations.', choices:[
    { text:'Put them to work.', effect:{ text:'They are surprisingly good with tools.', crew:'random' } },
    { text:'Drop them at the next beacon.', effect:{ text:'They leave you a crumpled thank-you note and a few scrap.', scrap:8 } } ] },
  broken_drone:{ text:'A broken combat drone floats here, sparking. Its targeting light blinks on and off.', choices:[
    { text:'Repair it with 2 drone parts.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'It reboots and adopts you.', drone:'combat1' } },
    { text:'Strip it for parts.', effect:{ text:'Useful bits.', parts:2, scrap:8 } } ] },
  solar_sail:{ art:'star', text:'An enormous solar sail glides past, abandoned. Its silver fabric could patch hull plating.', choices:[
    { text:'Harvest the sail.', effect:{ text:'Your crew patches the hull with shimmering silver.', hull:6 } },
    { text:'Hitch a ride on the solar wind.', effect:{ text:'You save fuel coasting behind it.', fuel:2 } } ] },
  hacker_kid:{ art:'station', text:'A teenage hacker on a junk-station offers to "improve" your ship\'s computer for 25 scrap.', choices:[
    { text:'Pay.', req:{ scrap:25 }, cost:{ scrap:25 }, chance:.6, success:{ text:'Weapons now charge faster. And the coffee machine works.', augment:'reloader' }, fail:{ text:'Your ship now plays music when you open doors. That is all.' } },
    { text:'Decline.', effect:{ text:'"Your loss, grandpa."' } } ] },
  archives:{ art:'station', text:'A drifting library station invites travellers to browse its archives. It has records on almost everything.', choices:[
    { text:'Study Rebuff tactics.', effect:{ text:'Your gunners learn a few tricks.', xp:{ skill:'weapons', amt:15 } } },
    { text:'Study engine schematics.', effect:{ text:'Your pilots and engineers learn a lot.', xp:{ skill:'pilot', amt:30 } } },
    { text:'Study field medicine.', effect:{ text:'Everyone learns some first aid.', crewHeal:100 } } ] },
  cargo_drop:{ text:'A cargo container tumbles through the beacon, labelled "PROPERTY OF REBUFF FLEET. DO NOT OPEN."', choices:[
    { text:'Open it.', chance:.7, success:{ text:'Missiles! Lots of missiles.', missiles:6 }, fail:{ text:'It\'s a beacon. A Rebuff ship arrives to see who opened it.', fight:'rebuff_scout' } },
    { text:'Leave it.', effect:{ text:'Some things are clearly labelled for a reason.' } } ] },
  burning_colony:{ minSector:2, art:'planet', text:'A small mining colony is on fire. Its people are evacuating in tiny shuttles, and some are not going to make it.', choices:[
    { text:'Help evacuate.', effect:{ text:'You take on as many as you can. One stays to repay you.', crew:'random', fuel:-1 } },
    { text:'Fight the fire with your ship\'s extinguishers.', req:{ system:'oxygen', level:2 }, effect:{ text:'Your oxygen system vents across the colony dome and the flames gutter out. The colonists reward you.', scrap:40 } },
    { text:'Keep moving.', effect:{ text:'You hear their calls for a long time.' } } ] },
  pyrate_auction:{ tags:['pyrate'], art:'market', text:'A Pyrate auction is in full swing. Today\'s lot: "One slightly used augment, no questions asked."', choices:[
    { text:'Bid 45 scrap.', req:{ scrap:45 }, cost:{ scrap:45 }, chance:.7, success:{ text:'Sold, to the nervous ship at the back!', augment:'random' }, fail:{ text:'Outbid at the last second. They keep your deposit. Pirates.' } },
    { text:'Just watch.', effect:{ text:'A fight breaks out over a hat.' } } ] },
  pyrate_mutiny:{ tags:['pyrate'], text:'A Pyrate crew has mutinied. The old captain is floating in a lifepod, demanding you help him take his ship back.', choices:[
    { text:'Attack the mutineers.', effect:{ text:'The mutineers turn their guns on you.', fight:'pyrate_gunship', afterWin:{ text:'The grateful captain gives you his treasure and his parrot. The parrot leaves.', scrap:45 } } },
    { text:'Rescue the captain and leave.', effect:{ text:'He joins your crew. "Aye, I\'ll swab your decks."', crew:'human' } },
    { text:'Ignore the drama.', effect:{ text:'Pirates are exhausting.' } } ] },
  rebuff_propaganda:{ tags:['rebuff','laststand'], text:'A Rebuff propaganda beacon blares a looping message: "The Rebuff are your friends. Report suspicious Fedoration ships. Reward: 50 scrap."', choices:[
    { text:'Shoot the beacon.', effect:{ text:'Satisfying. Its scrap is useful too.', scrap:12 } },
    { text:'Report a "suspicious ship" (a passing asteroid).', chance:.5, success:{ text:'They pay out the reward without checking.', scrap:50 }, fail:{ text:'They check. They are not happy.', fight:'rebuff_scout' } },
    { text:'Hack it to broadcast a funny message.', req:{ system:'hacking', level:1 }, effect:{ text:'The beacon now plays "The Rebuff smell of feet" on loop. Morale soars.', crewHeal:30 } } ] },
  rebuff_prison:{ tags:['rebuff'], minSector:3, art:'station', text:'A Rebuff prison barge holds dozens of Fedoration prisoners. It\'s lightly guarded.', choices:[
    { text:'Attack the barge.', effect:{ text:'The guard ship moves to intercept.', fight:'rebuff_fighter', afterWin:{ text:'You free the prisoners. Two of them join you.', crew:'human', scrap:20 } } },
    { text:'Teleport in a rescue team.', req:{ system:'teleporter', level:1 }, chance:.7, success:{ text:'In and out. One prisoner, a veteran gunner, joins your crew.', crew:'human', xp:{ skill:'weapons', amt:10 } }, fail:{ text:'Alarms! Your team escapes, but the guards are coming.', fight:'rebuff_fighter' } },
    { text:'Not worth the risk.', effect:{ text:'You leave them behind.' } } ] },
  enjinn_market:{ tags:['enjinn'], weight:.4, art:'market', text:'An Enjinn bazaar floats here, selling everything from spare parts to suspiciously cheap drones.', choices:[
    { text:'Browse.', effect:{ text:'They are delighted to have a customer.', store:true } },
    { text:'Buy a bag of drone parts (20 scrap).', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Five parts, slightly used.', parts:5 } } ] },
  enjinn_overhaul:{ tags:['enjinn'], text:'An Enjinn mechanic offers a full ship overhaul. "Thirty scrap. I will fix everything. I will also fix some things that were not broken."', choices:[
    { text:'Pay 30 scrap.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'Your hull gleams. Your engines purr.', hull:10, upgrade:'engines' } },
    { text:'No thanks.', effect:{ text:'"Your loss. Your engine sounds sad."' } } ] },
  pebble_quarry:{ tags:['pebblekin'], art:'asteroid', text:'A Pebblekin quarry. Its workers are moving one boulder per day. They are very proud of this pace.', choices:[
    { text:'Offer to help with your ship\'s tractor beams.', effect:{ text:'They are amazed. "TEN. BOULDERS." They pay you in ore.', scrap:30 } },
    { text:'Let {who} join the work for a bit.', req:{ race:'pebblekin' }, effect:{ text:'{who} comes back calmer, slower and a lot stronger.', xp:{ skill:'repair', amt:15 }, crewHeal:100 } } ] },
  pebble_elder:{ tags:['pebblekin'], text:'A Pebblekin elder asks for passage to the next beacon. "I. WILL. NOT. TAKE. UP. MUCH. ROOM." They take up quite a lot of room.', choices:[
    { text:'Give them a lift.', effect:{ text:'At the next beacon they give you a blessing and a weapon.', weapon:'heavy1' } },
    { text:'Refuse.', effect:{ text:'They are still saying "OKAY" as you leave.' } } ] },
  voltan_library:{ tags:['voltan'], art:'station', text:'A Voltan library of light. Knowledge here is stored as glowing patterns. "Take what you need, but give something back."', choices:[
    { text:'Give 2 drone parts, take a schematic.', req:{ parts:2 }, cost:{ parts:2 }, effect:{ text:'A design for a beam drone.', drone:'beamd' } },
    { text:'Give a story. {crew} tells one.', effect:{ text:'The librarians love it. They give you energy cells.', fuel:3 } } ] },
  voltan_pilgrim:{ tags:['voltan'], text:'A Voltan pilgrim asks to ride along. "I seek the edge of the galaxy. Or at least the edge of this sector."', choices:[
    { text:'Welcome aboard.', effect:{ text:'The pilgrim joins your crew and glows contentedly.', crew:'voltan' } },
    { text:'No room.', effect:{ text:'"I understand. The universe provides." It does not provide.' } } ] },
  sloog_spa:{ tags:['sloog','nebula'], art:'nebula', text:'A Sloog mud spa offers "full crew rejuvenation" for 20 scrap. Customers emerge looking very relaxed and slightly damp.', choices:[
    { text:'Book the whole crew in.', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Everyone comes back refreshed. Mostly.', crewHeal:100 } },
    { text:'Decline.', effect:{ text:'"Your pores will regret this."' } } ] },
  sloog_oracle:{ tags:['sloog'], text:'A Sloog fortune teller reads your crew\'s minds and offers a prediction for 10 scrap.', choices:[
    { text:'Pay.', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'"I see a store in your future. Also a fight. Also a bad sandwich." The next beacons are revealed on your map.', reveal:true } },
    { text:'Decline.', effect:{ text:'"I knew you would say that."' } } ] },
  mantlis_arena:{ tags:['mantlis'], art:'creature', text:'A Mantlis fighting arena. "Fight a champion and win 50 scrap. Lose and we keep your crew member as a snack."', choices:[
    { text:'Send {who} to fight.', req:{ race:'mantlis' }, effect:{ text:'{who} wins. Easily. The crowd loves them.', scrap:50, xp:{ skill:'combat', amt:6 } } },
    { text:'Send your best fighter.', chance:.35, success:{ text:'{crew} wins! The crowd is stunned.', scrap:50 }, fail:{ text:'{crew} is badly hurt. You leave quickly before the "snack" part.', crewHurt:60 } },
    { text:'Leave.', effect:{ text:'Very sensible.' } } ] },
  mantlis_eggs:{ tags:['mantlis'], text:'You find a crate of Mantlis eggs floating in space. They\'re warm.', choices:[
    { text:'Return them to the nearest hive.', effect:{ text:'The hive is grateful. Very grateful. A little too grateful.', scrap:35 } },
    { text:'Sell them to a passing trader.', effect:{ text:'You make some scrap. Somewhere, a Mantlis mother is writing your name down.', scrap:45 } } ] },
  nebula_ghostlights:{ nebula:true, art:'nebula', text:'Lights dance in the nebula, forming shapes that look a lot like your crew\'s faces.', choices:[
    { text:'Follow them.', chance:.5, success:{ text:'They lead you to a hidden cache.', scrap:35, parts:2 }, fail:{ text:'They lead you in circles. You burn a fuel cell finding your way out.', fuel:-1 } },
    { text:'Ignore them.', effect:{ text:'{crew} keeps waving at them anyway.' } } ] },
  nebula_hideout:{ nebula:true, text:'A Fedoration hideout is buried in the nebula. "We can\'t do much, but we can refuel you."', choices:[ { text:'Accept.', effect:{ text:'They top up your fuel and wish you luck.', fuel:4, missiles:2 } } ] },
  nebula_storm:{ nebula:true, art:'nebula', text:'The nebula crackles with static. Your sensors are blind, and something big just pinged your hull.', choices:[
    { text:'Hold still and wait.', chance:.6, success:{ text:'It passes. Whatever it was.' }, fail:{ text:'It bumps you again, harder.', hull:-4 } },
    { text:'Fire into the fog.', effect:{ text:'You hit something. It hits back.', fight:'random' } } ] },
  laststand_refugees:{ tags:['laststand'], text:'Fedoration civilians are fleeing the front lines. "The Flaggship is coming. Please, stop it."', choices:[
    { text:'"We will."', effect:{ text:'They give you what little they have.', scrap:20, fuel:2 } } ] },
  laststand_veterans:{ tags:['laststand'], art:'fleet', text:'A battered Fedoration squadron salutes as you pass. "We can\'t win this. You can. Take our supplies."', choices:[ { text:'Accept.', effect:{ text:'Missiles, drone parts and a hull patch.', missiles:5, parts:4, hull:8 } } ] },
  laststand_sabotage:{ tags:['laststand'], text:'A Fedoration spy offers to sabotage the Flaggship\'s weapons, but needs a fast ship to reach it. "Lend me 30 scrap for a shuttle."', choices:[
    { text:'Pay 30 scrap.', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'The spy salutes and jumps away. You hope it works.', setFlag:'sabotage' } },
    { text:'No.', effect:{ text:'"Then may the stars help you."' } } ] },
  space_bar:{ art:'station', text:'A space bar hangs on the edge of the beacon. Its neon sign flickers: "THE BLACK HOLE. Everyone gets sucked in."', choices:[
    { text:'Let the crew have a drink.', effect:{ text:'The crew comes back happy, and {crew} comes back with a new friend who wants to join.', crew:'random', crewHeal:20 } },
    { text:'Ask around for rumours.', effect:{ text:'You learn the locations of the nearby beacons.', reveal:true } },
    { text:'Pass.', effect:{ text:'Probably for the best.' } } ] },
  satellite:{ text:'A Rebuff spy satellite is recording everything at this beacon, including you.', choices:[
    { text:'Shoot it down.', effect:{ text:'It explodes. The Rebuff Fleet will know where it lost contact.', scrap:10, fleetPush:.05 } },
    { text:'Hack it to send false data.', req:{ system:'hacking', level:1 }, effect:{ text:'The Rebuff Fleet now thinks you are three sectors away. They slow down.', fleetPush:-.12 } },
    { text:'Ignore it.', effect:{ text:'It watches you go.' } } ] },
  mirror_ship:{ minSector:3, art:'ship', text:'A ship identical to yours appears at the beacon. Same paint, same scratches. Its captain looks just like you.', choices:[
    { text:'Hail them.', effect:{ text:'"Oh no, not again," says the other you. They jump away. A dimensional rift closes behind them, leaving scrap.', scrap:30 } },
    { text:'Open fire.', effect:{ text:'The other you had the same idea.', fight:'random' } } ] },
  gravity_well:{ text:'A gravity well grabs your ship as you arrive. Your engines strain.', choices:[
    { text:'Burn hard to escape.', effect:{ text:'You break free, using extra fuel.', fuel:-1 } },
    { text:'Slingshot around it with a skilled pilot.', req:{ system:'engines', level:3 }, effect:{ text:'You whip around it and gain speed. The Rebuff Fleet falls further behind.', fleetPush:-.08 } } ] },
  data_cache:{ text:'You find a data cache with a map of this sector\'s beacons.', choices:[ { text:'Download it.', effect:{ text:'Your map lights up with the locations of stores and dangers.', reveal:true } } ] },
  frozen_crew:{ minSector:2, art:'wreck', text:'An old colony ship drifts here. Its cryo-pods are still running, holding sleeping colonists.', choices:[
    { text:'Wake one up.', chance:.7, success:{ text:'A groggy colonist emerges. "Is it the future yet?" They join your crew.', crew:'random' }, fail:{ text:'The pod fails. You leave the rest asleep.' } },
    { text:'Tow the ship to a safe beacon.', effect:{ text:'The colonists will wake up somewhere safe. Their ship\'s AI pays you.', scrap:25, fuel:-1 } } ] },
  tax:{ tags:['rebuff','',''], text:'A Rebuff "tax collector" demands 15 scrap for "space maintenance".', choices:[
    { text:'Pay.', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'You receive a receipt. It\'s blank.' } },
    { text:'Refuse.', effect:{ text:'"Then I\'ll take it from your wreckage."', fight:'rebuff_scout' } },
    { text:'Have {who} audit their paperwork.', req:{ race:'human' }, effect:{ text:'{who} finds so many errors that the collector pays you to go away.', scrap:15 } } ] },
  smuggled_crew:{ tags:['pyrate',''], text:'A smuggler is transporting "cargo" that turns out to be a group of kidnapped workers.', choices:[
    { text:'Free them.', effect:{ text:'The smuggler fights back.', fight:'pyrate_gunship', afterWin:{ text:'The freed workers thank you. One joins your crew.', crew:'random', scrap:15 } } },
    { text:'Buy their freedom (30 scrap).', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'The workers are free. One stays to help you.', crew:'random' } } ] },
  drifting_reactor:{ text:'A ship\'s reactor core drifts here, still glowing and very unstable.', choices:[
    { text:'Try to salvage it.', chance:.5, success:{ text:'You extract the core safely. Your engineers wire it in.', reactor:1 }, fail:{ text:'It goes critical as you approach.', hull:-6, fire:true } },
    { text:'Shoot it from a distance.', effect:{ text:'A beautiful explosion. Some useful scrap survives.', scrap:15 } } ] }
};

/* ---------------- secret sector content ---------------- */
const STORY_RACES = {
  glassborn:{ name:'Glassborn', secret:true, color:'#d8f6ff', hp:120, repair:1, combat:1.1, speed:.8, armor:.6, desc:'Living crystal. Takes 40% less damage from weapon hits. Rarely leaves home.' }
};
const STORY_SHIPS = {
  glasscannon:{ name:'The Glass Cannon', layout:'A', cls:'Glassborn Cruiser', color:'#bff4ff', pattern:'TBABN', hull:24, reactor:9, fuel:16, missiles:2, parts:2,
    desc:'Hits like a hammer, shatters like a window. Found only in the Glasswork Expanse.', systems:{ shields:2, engines:2, oxygen:1, weapons:4, medbay:1, piloting:1, sensors:2, doors:1 },
    reserve:['drones','teleporter'], weapons:['halbird','heavy1'], crew:['glassborn','glassborn','human'], unlock:{ ach:'glasswork' } },
  paneneck:{ name:'The Pane in the Neck', layout:'B', cls:'Glassborn Cruiser', color:'#9fe8ff', pattern:'TBACN', hull:30, reactor:8, fuel:16, missiles:6, parts:2,
    desc:'Tougher glass, nastier tricks. Ion fire and a stubborn crew.', systems:{ shields:2, engines:2, oxygen:1, weapons:3, medbay:1, piloting:1, sensors:2, doors:2 },
    reserve:['drones','teleporter'], weapons:['ion2','lego'], crew:['glassborn','glassborn','glassborn'], unlock:{ win:'glasscannon' } }
};
const STORY_ENEMIES = {
  glass_sentinel:{ name:'Glass Sentinel', tags:['glass'], onlyTagged:true, hull:12, sectors:[1,9], systems:{ shields:4, engines:2, weapons:4, oxygen:1, piloting:1, doors:2 }, weapons:['halbird','heavy1'], crew:['glassborn','glassborn','glassborn'], color:'#bff4ff' }
};
const STORY_SECTORS = {
  glass:{ name:'The Glasswork Expanse', secret:true, color:'#bff4ff', mix:{ event:52, combat:36, empty:12 }, tags:['glass'], enemyTags:['glass'], hazards:{ pulsar:.06 }, nebula:.25,
    intro:['Light bends strangely here. Every surface seems to hum. The Glassborn have been waiting a very long time for visitors.'] }
};
const SECTOR_INTROS = {
  civilian:['Busy trade lanes and nervous civilians. The Rebuff Fleet is not far behind.','Merchant beacons blink across the sector. A good place to stock up, if you are quick.'],
  rebuff:['Rebuff patrols everywhere. Keep your head down and your shields up.','Propaganda broadcasts fill every channel. This is enemy territory.'],
  pyrate:['Lawless space. Everyone here is a pirate, a victim or both.','The Pyrate Haven: cheap goods, expensive mistakes.'],
  nebula:['Thick gas swallows your sensors. The Rebuff Fleet will struggle to track you here, and so will you.','A sea of colour, and no idea what is inside it.'],
  sloog:['Sloog space. Hold on to your scrap and your thoughts.','The air tastes of slime and deception.'],
  pebblekin:['The Pebblekin homeworlds. Everything moves slowly here, except the asteroids.','Huge rocky worlds and huge rocky people.'],
  enjinn:['Enjinn space. Every ship here is perfectly maintained and slightly over-engineered.','Drones buzz between the beacons like bees.'],
  voltan:['The Voltan homeworlds glow with soft, peaceful light. The Peacemongers are less peaceful.','Monks, temples and a lot of very bright ships.'],
  mantlis:['The Mantlis hives. Everything here wants to fight you, and most of it will win.','Clicking echoes over every comm channel.'],
  laststand:['The Last Stand. The Flaggship is heading for Fedoration command. Catch it.','This is it. Everything has led here.']
};
const STORE_GREETS = {
  civilian:['"Welcome, welcome! Everything is half price. Of what, I won\'t say."','"Fedoration credit accepted. Rebuff credit accepted. Scrap preferred."'],
  rebuff:['"Keep it quick. If a patrol comes, you were never here."'],
  pyrate:['"Arr. Prices are firm. Mostly. Haggling costs extra."','"Everything here is stolen. That\'s why it\'s cheap."'],
  nebula:['"You found us! Most people don\'t."'],
  sloog:['"Trust me, friend. These are the best prices you\'ll ever see."'],
  pebblekin:['"WELCOME. TAKE. YOUR. TIME. WE. DO."'],
  enjinn:['"Everything here is tested, retested and tested again."'],
  voltan:['"May your purchases bring you light."'],
  mantlis:['"BUY OR DIE. MOSTLY BUY."'],
  laststand:['"Take what you need. If the Flaggship wins, money won\'t matter."'],
  glass:['"Our wares are clear. Literally."']
};
const QUIET_TEXTS = ['Empty space. A good place to breathe, patch up and plan.','An old navigation buoy blinks lazily. Nothing else stirs.','The stars are very quiet here. {crew} says it is too quiet. Nobody listens.','A cloud of frozen debris drifts by, glittering. Pretty, but useless.','Nothing on sensors. {crew} uses the break to fix the coffee machine.','Static on every channel. Somewhere, a beacon hums to itself.'];
const CALLSIGNS = {
  rebuff:['Grudge','Iron Ruling','Stern Warning','Final Notice','Red Tape','Compliance','Mandate','Overseer'],
  pyrate:['Salty Sally','Plank Walker','Loot Goose','Rusty Cutlass','Sea Dog','Buccaneer Bob','Barnacle'],
  mantlis:['Clickjaw','Gutripper','Mandible','Swarmfang','Hivecry'],
  voltan:['Gentle Light','Serene Wrath','Calm Before','Glowing Verdict'],
  pebblekin:['Boulder','Slab','Gravel Pit','Old Granite','Stubborn'],
  sloog:['Slick Deal','Ooze Wit','Mindslime','Smooth Talker'],
  enjinn:['Torque','Spanner','Overclock','Calibrator'],
  auto:['Unit 7','DX-41','Sentry Prime','Node 9'],
  glass:['Prism','Facet','Shard Choir','Refraction']
};
const CHATTER = {
  hit:['We\'re hit!','That one hurt!','Hull damage!','Ow. My ship.','They hit us!','Brace!'],
  fire:['Fire! Fire!','Something\'s burning!','Grab an extinguisher!','Smells like trouble.'],
  breach:['Hull breach!','We\'re losing air!','Seal that breach!'],
  boarders:['Intruders aboard!','We\'ve got company!','Boarders! Grab something heavy!'],
  shieldsDown:['Shields are down!','We\'re exposed!','Shields failing!'],
  victory:['Got \'em!','That\'s how it\'s done!','Scratch one bad guy.','Woo!','They won\'t bother anyone again.'],
  lowHull:['We can\'t take much more!','The hull is falling apart!','Captain, we need to go!'],
  jump:['Jumping!','Here we go again.','Hold on to something.','Next stop, who knows.'],
  enemyHurt:['They\'re breaking up!','Keep firing!','Nearly there!'],
  repair:['Fixed it!','Good as new. Ish.','Back online.'],
  death:['No!','We lost one...','Someone get the medbay ready!'],
  idle:['Anyone else hungry?','I miss gravity that works properly.','Is it just me or is the coffee getting worse?','Quiet out here.','I\'m bored. That\'s good, right?']
};
const RACE_CHATTER = {
  pebblekin:{ hit:['OW.','THAT. WAS. RUDE.'], fire:['FIRE. IS. FINE.','I. DO. NOT. BURN.'], victory:['ROCK. WINS.'], idle:['I. AM. RESTING.','...'] },
  enjinn:{ repair:['Purring like a kitten!','I could do this all day.'], hit:['My beautiful systems!'], idle:['I recalibrated the toaster.','Has anyone seen my spanner?'] },
  mantlis:{ boarders:['FOOD IS HERE.','Finally!'], victory:['More!','Too easy.'], idle:['I want to fight something.','When is the next fight?'] },
  voltan:{ hit:['A disturbance in the light.'], victory:['Peace has been restored. Forcefully.'], idle:['I am at one with the reactor.'] },
  sloog:{ hit:['Ugh, sticky.'], victory:['I knew that would happen.'], idle:['I know what you\'re thinking.','You\'re thinking about lunch.'] },
  glassborn:{ hit:['A crack. Just a small one.'], victory:['Clear victory.'], idle:['*chimes softly*'] }
};
const TAUNTS = {
  start:{ rebuff:['Surrender, rebel!','You\'re under arrest!','For the Directorate!'], pyrate:['Yarr!','Your scrap is mine!','Ahoy, victim!'], mantlis:['MEAT!','FIGHT!','*click click*'], voltan:['Be at peace. Permanently.'], pebblekin:['CRUSH.','SMASH. NOW.'], sloog:['We saw this coming.'], enjinn:['Commencing disassembly.'], auto:['TARGET ACQUIRED.'], glass:['*discordant chiming*'], generic:['Prepare to be boarded!','Nothing personal.'] },
  hurt:{ rebuff:['Hold formation!','Damage report!'], pyrate:['Ye scratched me paint!','Arr, that hurt!'], mantlis:['GOOD. FIGHT.'], voltan:['Our light dims!'], pebblekin:['OW.'], sloog:['That was not in the plan.'], enjinn:['Repairs! Repairs!'], auto:['DAMAGE DETECTED.'], glass:['*cracking sounds*'], generic:['They\'re tougher than they look!'] },
  gloat:{ rebuff:['Give up!','Your ship is finished!'], pyrate:['Ha! Sinking already?'], mantlis:['WEAK!'], voltan:['Accept your end.'], pebblekin:['SOFT. SHIP.'], sloog:['Told you.'], enjinn:['Your hull is inefficient.'], auto:['TARGET CRITICAL.'], glass:['You shatter easily.'], generic:['Almost done!'] }
};
const SURRENDER_LINES = {
  rebuff:'"We yield! Take our cargo, but spare the ship. The Directorate will never know."',
  pyrate:'"Parley! Parley! Ye can have the loot, just don\'t sink us!"',
  mantlis:'"...We. Yield. Do not tell the hive."',
  voltan:'"Our light fades. Take our offering and let us go in peace."',
  pebblekin:'"OKAY. OKAY. WE. STOP. TAKE. THIS."',
  sloog:'"Friend! Friend! Let\'s talk business."',
  enjinn:'"Ceasing hostilities. Offering spare parts in exchange for continued existence."',
  glass:'"*a mournful chord* We offer tribute."',
  generic:'"Enough! Enough! Take what you want."'
};
const VICTORY_LINES = {
  rebuff:'The {enemy} breaks apart, its Rebuff colours burning.', pyrate:'The {enemy} explodes in a shower of stolen loot.', mantlis:'The {enemy} goes down screaming war cries to the very end.',
  voltan:'The {enemy}\'s light flickers out.', pebblekin:'The {enemy} cracks open like a geode.', sloog:'The {enemy} bursts with a wet pop.', enjinn:'The {enemy} disintegrates into perfectly sorted parts.',
  auto:'The {enemy} powers down with a final "HAVE A NICE DAY".', glass:'The {enemy} shatters into a million glittering pieces.', generic:'The {enemy} breaks apart.'
};

Object.assign(BASE.events, STORY_EVENTS);
Object.assign(BASE.races, STORY_RACES);
Object.assign(BASE.ships, STORY_SHIPS);
Object.assign(BASE.enemies, STORY_ENEMIES);
Object.assign(BASE.sectors, STORY_SECTORS);
for(const k in SECTOR_INTROS) if(BASE.sectors[k]) BASE.sectors[k].intro = SECTOR_INTROS[k];
ACHIEVEMENTS.push({ id:'glasswork', name:'Through the Looking Glass', desc:'Find the hidden Glasswork Expanse.' },
  { id:'treasure', name:'X Marks the Spot', desc:'Find the Pyrate King\'s treasure.' },
  { id:'prophecy', name:'The Vaster One', desc:'Fulfil the Voltan prophecy.' });
/* hook a quest into an existing event: successful weevil raids reveal the nest */
if(BASE.events.weevils) BASE.events.weevils.choices[0].success.quest = 'weevil_nest';
if(BASE.events.colony) BASE.events.colony.art = 'planet';
