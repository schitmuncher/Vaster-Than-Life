'use strict';
/* =========================================================================
   Twenty more stories. Each has a scene per sector, a hidden twist rolled at
   the start of the run (so the same story can go a different way each time),
   its own help or harm at the Flaggship and its own endings.
   Shorthand inside these scenes, expanded at load time:
     a:{...}  story state (v trust, n count, f flags, gone, note)  -> cmp.arc
     h:20     hearts for the whole crew                          -> cmp.hearts
     j:{...}  someone joins the crew by name                     -> cmp.join
   Every scene counts as a story beat unless it is marked fin:1.
   {lead} in text is the crew member a story is about (weddings, the song).
   ========================================================================= */
const ARC2 = {}, EV2 = {};
function SE(id, title, art, text, choices, o){ EV2[id] = Object.assign({ title, art, text, choices, questOnly:true, noStar:true, once:true }, o || {}); }
const ch = (text, effect, o) => Object.assign({ text, effect }, o || {});
const chc = (text, chance, success, fail, o) => Object.assign({ text, chance, success, fail }, o || {});
const pickT = (r, n) => Math.floor(r() * n) % n;
function leadAlive(S){ return !!(G && G.ship && S.p && G.ship.crew.some(c => c.owner==='p' && !c.drone && c.name===S.p)); }
function rollLead(S, r, g){ const L = g.ship.crew.filter(c => c.owner==='p' && !c.drone); S.p = L.length ? L[Math.floor(r()*L.length) % L.length].name : 'Your pilot'; }

/* ---------------- 1. The Stowaway ---------------- */
ARC2.stow = { name:'The Stowaway', who:'Nell', color:'#9fe0ff', blurb:'A girl of twelve is hiding in your cargo. Who she really is changes everything.',
  hale:'"And check your cargo hold before you go. Last month a courier found a goat in his."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['stow_found', S => ['stow_heir','stow_cadet','stow_kid'][S.t], 'stow_hunter', 'stow_lesson', 'stow_night'],
  final:S => S.f.gone ? null : 'stow_final',
  ending:S => S.f.gone ? 'stow_left' : S.v >= 6 ? 'stow_home' : 'stow_crew',
  endings:{ stow_home:{ title:'A Safe Harbour', hint:'Win with Nell trusting you completely.', text:'Nell grows up. She becomes, in order: a mechanic, a pilot, a captain, and the most famous courier in the Fedoration. Every interview, she says the same thing: "I learned everything in a cargo crate."' },
    stow_crew:{ title:'Junior Crew', hint:'Win with Nell aboard.', text:'Nell is still aboard when the war ends. Nobody remembers deciding that she would stay. She has a bunk, a toolbox and a rank she made up herself.' },
    stow_left:{ title:'Left at the Dock', hint:'Win without Nell.', text:'You never find out what happened to the girl in the crate. Sometimes, opening cargo, the crew check twice.' } },
  medal:'stow_home',
  chatter:S => S.f.gone ? null : ['Nell has taken apart the toaster. It works better now.', 'Nell: "Is it always this exciting? It\'s brilliant."', 'Nell is asleep on the bridge again, in the spare seat.', 'Nell asks {crew} four hundred questions about engines.'],
  boss:(e, ph, S, H) => { if(S.f.gone || !S.f.ready) return;
    if(S.t===0 && (S.f.hid || S.f.blessed) && ph===0) H.shield(4, 'A gold-trimmed Voltan yacht drops in beside you. House Quill has come for its heir, and stays to throw a shield around her ship.');
    if(S.t===1 && S.f.drills && ph < 2) H.ion('weapons', 6, 'Nell: "They reload port side first! Always!" Your gunners hit the Flaggship\'s gun deck mid-reload.');
    if(S.t===2 && ph===0) H.crew('Nell cheers so loudly over the intercom that the whole crew finds a second wind.');
    if(S.f.aim && ph===1) H.hurt(2, 'Nell takes a shot at the Flaggship herself. It hits.'); } };
SE('stow_found', 'A stowaway', 'ship', `{crew} opens a crate of ration bars and finds a girl of about twelve inside, eating one. "I\'m Nell," she says, through crumbs. "I\'m very good at fixing things. Please don\'t put me off at a station."`, [
  ch('Let her stay. Find her a bunk.', { text:'Nell takes the top bunk, the best blanket and, by morning, the crew\'s hearts.', a:{ v:1, note:'In sector 2 the crew found a stowaway, a girl called Nell, in a crate of ration bars.' } }),
  ch('Put her to work in the engine room.', { text:'Nell is a better engineer than half the Fedoration. The engines have never purred like this.', xp:{ skill:'engines', amt:15 }, a:{ v:1, note:'In sector 2 the crew found a stowaway, a girl called Nell, and put her to work in the engine room.' } }),
  ch('Put her off at the next station. A warship is no place for a child.', { text:'Nell doesn\'t cry. She just looks at you, takes a ration bar for the road, and walks off down the dock.', a:{ gone:true } }) ]);
SE('stow_heir', 'House Quill', 'station', `A Voltan yacht hails you, all gold trim. "We seek the heir to House Quill: a girl of twelve, possibly disguised as luggage." Nell has gone very pale. "I\'m not going back," she whispers. "They want me to marry a shipping contract."`, [
  ch('"We haven\'t seen anyone."', { text:'The yacht leaves, unconvinced. Nell hugs you, briefly and fiercely, then pretends she didn\'t.', a:{ v:2, f:'hid' } }),
  ch('Hand her over. Her family will look after her.', { text:'The yacht pays a handsome reward. Nell doesn\'t look back.', scrap:60, a:{ gone:true, note:'The captain handed Nell back to House Quill.' } }),
  chc('Let Nell talk to them herself.', .5, { text:'Nell argues with three aunts and a lawyer for an hour, and wins. She may finish the voyage, with House Quill\'s blessing.', a:{ v:1, f:'blessed' } }, { text:'The aunts won\'t listen. Nell hides in the vents until they give up.', fleetPush:.05, a:{ v:1, f:'hid' } }) ]);
SE('stow_cadet', 'A badge', 'ship', `{crew} finds a Rebuff cadet\'s badge sewn inside Nell\'s jacket. She snatches it back. "My academy was going to put me on a warship. A real one, with real guns pointed at real people." She swallows. "So I ran."`, [
  ch('"You\'re safe here."', { text:'"Okay," she says, and for the first time she sleeps through the night.', a:{ v:2 } }),
  ch('Ask what she knows about Rebuff warships.', { text:'Nell knows every drill by heart: who reloads first, which deck is slowest, where the blind spots are. She writes it all down for you.', a:{ v:1, f:'drills' } }),
  ch('She is a deserter. Report her.', { text:'A Rebuff cutter collects her. The Fleet, pleased, slows its pursuit a little. Nobody on the crew speaks to you for a day.', fleetPush:-.1, a:{ gone:true, note:'The captain reported Nell to the Rebuff as a deserter.' } }) ]);
SE('stow_kid', 'Gantry Nine', 'star', `Nell admits it: she isn\'t anybody special. She grew up on the docks of Gantry Nine, watching couriers leave, and one day she just climbed into a crate. "I wanted to see one star up close. Just one."`, [
  ch('Take her to see a star up close (1 fuel).', { text:'You park the ship in the light of a blue giant. Nell presses her nose to the window for an hour and says nothing at all. Neither does anyone else.', a:{ v:2, f:'star' }, h:15 }, { req:{ fuel:1 }, cost:{ fuel:1 } }),
  ch('Teach her to fly.', { text:'She is terrible, then less terrible, then rather good.', xp:{ skill:'pilot', amt:15 }, a:{ v:1 } }),
  ch('Message the docks so someone knows she\'s safe.', { text:'A message comes back from an old dockworker: "Tell her to bring me a souvenir."', a:{ v:1 } }) ]);
SE('stow_hunter', 'Grist', 'ship', `A bounty hunter docks without asking, a broad Pebblekin called Grist. "There\'s a price on a girl matching your stowaway. Not a big price. I\'m not proud." Nell is hiding in the vents. Everyone knows she is in the vents.`, [
  ch('Pay him off (30 scrap).', { text:'Grist counts it twice and leaves. "Didn\'t see a thing."', a:{ v:1 } }, { req:{ scrap:30 }, cost:{ scrap:30 } }),
  ch('Throw him off the ship.', { text:'Grist is very big. This will take guns.', fight:'pebble_brute', afterWin:{ text:'Nell climbs out of the vents. "You did that for me?"', a:{ v:2 } } }),
  chc('Nell has rigged the airlock. Let her.', .7, { text:'Grist ends up outside, tied to his own ship with a tow cable, shouting. Nell is unbearably proud.', a:{ v:2 } }, { text:'The airlock opens the wrong way. Grist leaves, laughing. A bulkhead does not.', hull:-2, a:{ v:1 } }) ]);
SE('stow_lesson', 'Nell', 'ship', `"Teach me something that matters," Nell says. "Before the end."`, [
  ch('How to put out a fire.', { text:'She learns fast. She learns how to start one, too, which was not the lesson.', xp:{ skill:'repair', amt:15 }, a:{ v:1, f:'fire' } }),
  ch('How to aim.', { text:'Nell has a steadier hand than {crew}. {crew} is upset about it.', xp:{ skill:'weapons', amt:15 }, a:{ v:1, f:'aim' } }),
  ch('How to be brave.', { text:'{crew} tells her about the worst day of their life, and how they got through it. Nell listens to every word.', a:{ v:2 }, h:15 }) ]);
SE('stow_night', 'Nell', 'nebula', `The night before the last sector, Nell can\'t sleep. "What if we lose?" she asks. "What happens to me?"`, [
  ch('"We won\'t. And if we do, you get the lifeboat first."', { text:'"Okay," she says. Then: "I\'m not getting in it, though."', a:{ v:1, f:'promise' } }),
  ch('Give her a job for the battle: watching the scanners.', { text:'She salutes, badly, and goes to bed with a mission.', a:{ v:1 } }) ]);
SE('stow_final', 'Nell', 'fleet', `Nell is strapped into the spare seat on the bridge, headset on, very serious. "Ready, Captain."`, [ ch('"Ready."', { text:'You fly in together.', a:{ f:'ready' } }) ], { fin:1 });

/* ---------------- 2. The Cure ---------------- */
ARC2.cure = { name:'The Cure', who:'Doctor Salk', count:'Samples collected', color:'#9fdc7a', blurb:'A doctor needs samples from three worlds to cure the Sloog blight. If it really is a cure.',
  hale:'"Doctor Imre Salk will be waiting at your first stop. He thinks he can cure the Sloog blight. He needs a lift and a great deal of patience."',
  roll:(S, r) => { S.t = r() < .4 ? 1 : 0; },
  beats:['cure_meet', 'cure_ice', 'cure_fire', S => S.f.gone ? null : 'cure_lab' + S.t, S => S.f.gone ? null : S.f.exposed ? 'cure_burn' : 'cure_sloog'],
  final:S => S.f.gone || S.f.burned || S.f.kept ? null : 'cure_final',
  ending:S => S.f.kept || (S.f.sent && S.t===1 && !S.f.fixed) ? 'cure_poison' : S.f.burned ? 'cure_ashes' : S.f.sent && S.n >= 3 ? 'cure_saved' : 'cure_short',
  endings:{ cure_saved:{ title:'The Blight Breaks', hint:'Win after delivering a true cure.', text:'The Sloog blight breaks within a year. The Sloog name a holiday after your ship: it involves a great deal of mud, and they insist you attend.' },
    cure_ashes:{ title:'Ashes', hint:'Win after destroying the doctor\'s work.', text:'You never tell anyone what was in Doctor Salk\'s cold box. Salk spends the rest of his life working on a real cure, and very nearly finds it.' },
    cure_poison:{ title:'Poisoned Well', hint:'Win with a bioweapon aboard.', text:'You won. Later, in a Sloog nebula far behind you, something terrible starts to spread. Nobody ever traces it back to your ship. You know.' },
    cure_short:{ title:'Not Enough Samples', hint:'Win without finishing the cure.', text:'Doctor Salk takes his half-finished cure to Fedoration command. It helps a little. He writes to you every year, asking for one more sample.' } },
  medal:'cure_saved',
  chatter:S => S.f.gone ? null : ['Doctor Salk has commandeered the galley fridge. For samples.', 'Salk: "Do not, under any circumstances, eat anything labelled B."', '{crew} has eaten something labelled B.'],
  boss:(e, ph, S, H) => {
    if(S.f.sent && S.n >= 3 && (S.t===0 || S.f.fixed) && ph===0) H.ion('shields', 6, 'A Sloog fleet, cured and grateful, drops in behind the Flaggship and swamps its shield generators.');
    if(S.f.kept && ph===0) H.hurt(4, 'You fire the blight canister into the Flaggship\'s air vents. Its crew start to sicken.');
    if(S.f.sent && S.t===1 && !S.f.fixed && ph===2) H.say('Far behind you, a Sloog world has gone very quiet. You don\'t know why yet.'); } };
SE('cure_meet', 'Doctor Salk', 'station', `Doctor Imre Salk comes aboard with a cold box, a crate of glassware and the air of a man who hasn\'t slept in years. "I need three samples: from an ice world, a fire world and the blight world itself. Then I can save the Sloog."`, [
  ch('"Welcome aboard, Doctor."', { text:'Salk shakes everyone\'s hand, then washes his own, twice.', a:{ v:1, note:'In sector 2 the ship took on Doctor Imre Salk, who said he could cure the Sloog blight.' } }),
  ch('"You pay your own way."', { text:'Salk pays, grumbling about the price of saving the world.', scrap:25, a:{ note:'In sector 2 the ship took on a paying passenger: Doctor Imre Salk.' } }),
  ch('"No passengers."', { text:'Salk takes his cold box and finds another ship. You never learn which.', a:{ gone:true } }) ]);
SE('cure_ice', 'The ice sample', 'asteroid', `The first sample lives under a glacier on a frozen moon. Salk is already pulling on three coats.`, [
  chc('Send {crew} down to dig.', .7, { text:'{crew} comes back blue, triumphant and holding a vial.', xp:{ skill:'repair', amt:10 }, a:{ n:1 } }, { text:'The glacier moves. {crew} comes back with frostbite and the vial.', crewHurt:20, a:{ n:1 } }),
  ch('Drill from orbit (2 fuel).', { text:'Slow, careful and cold. The vial comes up perfect.', a:{ n:1 } }, { req:{ fuel:2 }, cost:{ fuel:2 } }),
  ch('Skip it. There\'s a war on.', { text:'Salk sulks for the whole sector.', a:{ v:-1 } }) ]);
SE('cure_fire', 'The fire sample', 'planet', `The second sample grows in the ash fields of a volcano world. The ash is hot enough to melt landing struts.`, [
  ch('Fly through the ash.', { text:'You get the sample. The hull gets a tan.', hull:-3, a:{ n:1 } }),
  ch('Send {who}. Pebblekin like it hot.', { text:'{who} strolls through the lava, picks the sample like a flower, and strolls back.', a:{ n:1, v:1 } }, { req:{ race:'pebblekin' } }),
  ch('Skip it.', { text:'Salk says nothing, loudly.', a:{ v:-1 } }) ]);
for(const t of [0, 1]) SE('cure_lab' + t, 'The notes', 'ship', `{crew} has been reading Doctor Salk\'s notes. "I don\'t understand most of it," they say. "But I do understand the word 'dispersal'. It comes up a lot."`, [
  ch('Trust the doctor.', { text:'Salk thanks you, and works through the night.', a:{ v:1 } }),
  ch('Run his samples through the medbay yourself.', t ? { text:'The medbay\'s verdict is clear: it isn\'t a cure. It\'s the blight, made stronger and made to spread. Salk goes white. "They told me it was a vaccine," he whispers. "The people who paid for my lab."', a:{ f:'exposed', note:'The medbay showed that Doctor Salk\'s "cure" was a bioweapon. He had not known.' } } : { text:'The medbay\'s verdict is clear: it\'s a cure, and a beautiful one. Salk is hurt you checked, and delighted it passed.', a:{ v:1, f:'tested' } }, { req:{ system:'medbay' } }),
  ch('Confront Salk.', t ? { text:'Salk breaks down. His lab was paid for by "a private foundation". He checks the papers again. It was Rebuff Intelligence.', a:{ f:'exposed', v:1, note:'Doctor Salk discovered his work had been paid for by Rebuff Intelligence.' } } : { text:'Salk patiently explains dispersal: the cure has to spread to reach every Sloog. "Like a song," he says. You understand about a third of it.', a:{} }) ]);
SE('cure_sloog', 'The blight world', 'nebula', `The blight world. Your last sample is here, and so are thousands of sick Sloog, watching your ship land with tired eyes.`, [
  ch('Collect the sample and let Salk finish.', { text:'Salk works for two days straight. When he comes out of the lab, he is smiling.', a:{ n:1 } }),
  ch('Ask {who} to help.', { text:'{who} talks to the elders. They give you a sample freely, and a blessing too.', a:{ n:1, v:1 }, h:10 }, { req:{ race:'sloog' } }) ]);
SE('cure_burn', 'The cold box', 'ship', `You have a bioweapon in your hold. Salk sits with his head in his hands.`, [
  ch('Destroy it. All of it.', { text:'It burns blue. Salk watches until the last of it is gone.', a:{ f:'burned', note:'The crew burned the bioweapon in Doctor Salk\'s cold box.' } }),
  chc('Make Salk turn it into a real cure.', .5, { text:'Salk works like a man possessed. It takes him three days and most of the medbay, and it works: a true cure.', a:{ f:'fixed', n:1, note:'Doctor Salk turned the Rebuff\'s bioweapon into a true cure.' } }, { text:'Something goes wrong in the lab. The crew are sick for a day. Salk burns the rest himself.', crewHurt:25, a:{ f:'burned' } }),
  ch('Keep it. A weapon against the Rebuff.', { text:'Salk stares at you. Then he goes to his cabin and doesn\'t come out.', a:{ f:'kept', note:'The captain kept the bioweapon, to use against the Rebuff.' } }) ]);
SE('cure_final', 'Doctor Salk', 'fleet', `Salk\'s work is done, as far as it can be. "Send it ahead," he says, "to every Sloog world you can reach."`, [ ch('Send it.', { text:'The broadcast goes out to every Sloog world in range.', a:{ f:'sent' } }) ], { fin:1 });

/* ---------------- 3. The Heist ---------------- */
ARC2.heist = { name:'The Heist', who:'Captain Rook', count:'Specialists hired', color:'#c9a0ff', blurb:'A pyrate captain wants your fast ship for the robbery of the century. Someone will double-cross someone.',
  hale:'"If a pyrate called Rook offers you a job, say no. Then tell me what the job was."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['heist_offer', 'heist_crew', 'heist_case', S => S.f.gone ? null : S.t===1 ? (S.f.bug || S.f.pell ? 'heist_rook' : 'heist_clean') : ['heist_clean','heist_rook','heist_pell'][S.t], S => S.f.gone ? null : 'heist_job'],
  final:S => S.f.gone ? null : S.t===1 && !S.f.rookdown ? (S.f.tables ? 'heist_trap' : 'heist_betray') : S.f.rich ? 'heist_split' : null,
  ending:S => S.f.paid || S.f.trapped ? 'heist_legend' : S.f.stiffed || S.f.betrayed ? 'heist_thieves' : 'heist_clean',
  endings:{ heist_legend:{ title:'The Great Payroll Job', hint:'Win after pulling off the job and settling up.', text:'Nobody ever proves who robbed the Rebuff payroll barge. Sing it in a pyrate bar, though, and everyone knows the name of your ship.' },
    heist_thieves:{ title:'No Honour Among Thieves', hint:'Win after a double-cross.', text:'Rook never forgives you, or you her. Whenever your paths cross, both crews check their pockets.' },
    heist_clean:{ title:'Clean Hands', hint:'Win without the loot.', text:'You walked away from the richest job in the war. Some nights, you still think about the vault.' } },
  medal:'heist_legend',
  chatter:S => S.f.gone ? null : ['Rook: "Patience, courier. Big jobs take time."', '{crew} is practising lock-picking on the galley cupboard.', 'Somebody has drawn a plan of the barge on the mess table. In gravy.'],
  boss:(e, ph, S, H) => {
    if(S.f.paid && ph < 2) H.hurt(3, 'Rook\'s pyrates swoop on the Flaggship, guns blazing. "Business is business!"');
    if(S.f.rich && ph===0) H.shield(3, 'The payroll pays for a mercenary shield tender, which parks itself in front of you.');
    if(S.f.stiffed && ph===1) H.buff(4, 'Rook has sold your approach to the Flaggship. Petty, and effective.'); } };
SE('heist_offer', 'Captain Rook', 'ship', `A pyrate captain with a magpie tattooed on her neck hails you. "Captain Rook. I hear you\'re fast and going the right way. There\'s a Rebuff treasury barge two sectors on, carrying the whole Fleet\'s payroll. I need a fast ship. You\'d get a third."`, [
  ch('"I\'m in."', { text:'"Lovely," says Rook. "We\'ll need a crew."', a:{ v:1, note:'In sector 2 the captain agreed to help the pyrate Rook rob a Rebuff payroll barge.' } }),
  chc('"I\'m in, for half."', .5, { text:'Rook laughs, then agrees. "I like you."', a:{ v:1, f:'half', note:'In sector 2 the captain agreed to help the pyrate Rook rob a Rebuff payroll barge, for half the take.' } }, { text:'"A third," says Rook, flatly. "Or nothing." You take the third.', a:{} }),
  ch('"No."', { text:'"Your loss," says Rook, and is gone.', a:{ gone:true } }) ]);
SE('heist_crew', 'Specialists', 'station', `Rook needs a specialist, and there\'s time to hire one in this sector\'s bars.`, [
  ch('The safecracker: a Sloog called Fennimore.', { text:'Fennimore can open any lock by listening to it. He also listens to everything else, which is unsettling.', a:{ n:1, f:'safe' } }),
  ch('The pilot: an old Enjinn called Gears.', { text:'Gears has flown through worse. He tells you about it. For hours.', a:{ n:1, f:'pilot' } }),
  ch('The muscle: a Pebblekin called Hammer.', { text:'Hammer says nothing. Hammer does not need to.', a:{ n:1, f:'muscle' } }) ]);
SE('heist_case', 'Casing the barge', 'asteroid', `You shadow the payroll barge through an asteroid field. Two escorts, and an inside man: a Rebuff clerk called Pell, who is being paid very well.`, [
  chc('Plant a bug on an escort.', .6, { text:'You know every move the escorts make now.', a:{ f:'bug' } }, { text:'The escort spots you.', fight:'rebuff_fighter' }),
  ch('Bribe Pell a bit more (25 scrap).', { text:'Pell pockets it. "For loyalty," he says.', a:{ f:'pell' } }, { req:{ scrap:25 }, cost:{ scrap:25 } }),
  ch('Just watch, and learn.', { text:'You learn the barge\'s course by heart.', a:{} }) ]);
SE('heist_clean', 'The night before', 'station', `The night before the job, Rook shares a bottle and her life story. Nobody is double-crossing anybody. It is, frankly, suspicious.`, [
  ch('Relax and enjoy the evening.', { text:'It\'s a good night. Rook sings. Badly.', crewHeal:30, a:{ v:1 } }),
  ch('Search her ship anyway.', { text:'Nothing. Rook finds out, and is offended. Then impressed.', a:{ v:-1 } }) ]);
SE('heist_rook', 'Overheard', 'ship', `{crew} overhears Rook on a private channel: once the vault is open, your ship is to be "left for the Rebuff".`, [
  ch('Confront her now.', { text:'Rook doesn\'t deny it. Her guns come up.', fight:'pyrate_gunship', afterWin:{ text:'Rook\'s ship limps away. The job is yours now, if you want it.', a:{ f:'rookdown' } } }),
  ch('Play along, and turn the tables later.', { text:'You smile at Rook all evening. It is exhausting.', a:{ f:'tables' } }),
  ch('Pull out of the job.', { text:'"Cold feet?" says Rook. You let her think so.', a:{ gone:true } }) ]);
SE('heist_pell', 'Pell', 'station', `Pell, the inside man, has gone quiet. Then a message slips through: the Rebuff know about the job. Pell sold everyone out for a promotion.`, [
  ch('Call it off.', { text:'Rook swears for a full minute, in four languages, and calls it off.', a:{ gone:true } }),
  ch('Go anyway, from the other side.', { text:'If they\'re waiting at the front door, you\'ll use the back.', a:{ f:'reverse' } }) ]);
SE('heist_job', 'The vault', 'fleet', `The barge. The vault. A thirty-second window.`, [
  ch('Go in loud.', { text:'Alarms everywhere. Guns everywhere.', fight:'rebuff_elite', afterWin:{ text:'The vault is yours. So is the payroll.', scrap:110, a:{ f:'rich' } } }),
  chc('Go in quiet.', .55, { text:'In, open, out. The barge doesn\'t notice for an hour.', scrap:130, a:{ f:'rich' } }, { text:'Not quiet enough.', fight:'rebuff_elite', afterWin:{ text:'You get the payroll anyway.', scrap:100, a:{ f:'rich' } } }),
  ch('Walk away at the last second.', { text:'You leave the barge, and the fortune, behind.', a:{ f:'walked' } }) ]);
SE('heist_split', 'The split', 'station', `Rook\'s ship meets you at the edge of the last sector to split the take.`, [
  ch('Share it fairly.', { text:'Rook counts it, nods and salutes. "Pleasure doing crime with you."', a:{ f:'paid', v:1 } }),
  ch('Keep it all and run.', { text:'You run. Rook doesn\'t chase you. That is worse.', scrap:60, a:{ f:'stiffed' } }) ], { fin:1 });
SE('heist_trap', 'Rook', 'fleet', `Rook\'s guns are already warm when you arrive at the split. "Nothing personal, courier." But you were expecting this.`, [
  ch('Spring your trap.', { text:'Your hidden charges blow her guns off their mounts. Rook, gun-less, pays you double to let her go.', scrap:80, a:{ f:'trapped' } }) ], { fin:1 });
SE('heist_betray', 'Rook', 'fleet', `Rook\'s guns are already warm when you arrive at the split. "Nothing personal, courier."`, [
  ch('Fight.', { text:'It was always going to end like this.', fight:'pyrate_gunship', afterWin:{ text:'Rook escapes in a lifeboat, swearing.', a:{ f:'betrayed' } } }) ], { fin:1 });

/* ---------------- 4. The Haunting ---------------- */
ARC2.haunt = { name:'The Haunting', who:'the ghost', color:'#b0c4ff', blurb:'Cold spots, footsteps and coffee nobody made. Something else is aboard your ship.',
  hale:'"Your ship had a captain before you, by the way. Lyle. Vanished on a delivery run thirty years ago. Never mind. Off you go."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['haunt_cold', 'haunt_signs', S => ['haunt_lyle','haunt_wisp','haunt_worm'][S.t], S => S.f.gone ? null : ['haunt_lyle2','haunt_wisp2','haunt_worm2'][S.t], S => S.f.gone ? null : 'haunt_eve'],
  final:() => null,
  ending:S => S.f.rest || S.f.purged ? 'haunt_rest' : !S.f.gone && S.v >= 4 ? 'haunt_friend' : 'haunt_odd',
  endings:{ haunt_friend:{ title:'Crewed by Ghosts', hint:'Win with the ghost as a friend.', text:'Your ship is never quite empty again. Coffee appears when you need it. Doors close before fires spread. The crew say goodnight to the corridors, and sometimes the corridors say it back.' },
    haunt_rest:{ title:'Laid to Rest', hint:'Win after laying the haunting to rest.', text:'The cold spots are gone. The ship is quiet. It is a little lonelier than before, and nobody can quite say why.' },
    haunt_odd:{ title:'Strange Company', hint:'Win without getting to the bottom of it.', text:'Whatever was haunting your ship, it never really left. It just stopped making the coffee.' } },
  medal:'haunt_friend',
  chatter:S => ['A door opens by itself. Nobody is there.', 'The coffee machine makes a black coffee, four sugars. Nobody aboard takes it like that.', '{crew} swears someone said their name in the cargo bay.', 'There is frost on the inside of the bridge window. Again.'],
  boss:(e, ph, S, H) => { if(S.f.gone && !S.f.lies) return;
    if(S.f.lyle && ph===0) H.ion('shields', 6, 'A figure in an old Fedoration uniform walks straight through the Flaggship\'s hull. Its shield generators die, one by one.');
    if(S.f.log && ph===1) H.hurt(3, 'Lyle\'s thirty-year-old patrol log is still right. You hit the Flaggship exactly where it always turns.');
    if(S.f.wisp && ph===0) H.ion('weapons', 5, 'Wisp reaches into the minds of the Flaggship\'s gunners and suggests a little sit-down.');
    if((S.f.tamed || S.f.plant) && ph < 2) H.ion('weapons', 6, 'The worm, now on your side, slips into the Flaggship\'s network and locks its guns.');
    if(S.f.lies && ph===0) H.say('The Flaggship arrives late and confused, having chased a ghost of your ship six beacons the wrong way.'); } };
SE('haunt_cold', 'Cold spots', 'ship', `Cold spots in the corridors. Footsteps where nobody is walking. The coffee machine makes a coffee nobody asked for: black, four sugars. Nobody aboard takes it like that.`, [
  ch('Ignore it. Old ships creak.', { text:'The ship creaks. Then it creaks your name.', a:{} }),
  ch('Investigate with {crew}.', { text:'You find nothing, twice. The second time, the nothing was colder.', a:{ v:1 } }),
  ch('{who} holds a séance in the galley.', { text:'Candles, holding hands, the lot. The table taps once. {who} faints, delighted.', a:{ v:2 } }, { req:{ quirk:'superstitious' } }) ]);
SE('haunt_signs', 'A message', 'nebula', `Letters appear in the condensation on the bridge window: TURN BACK. {crew} swears they didn\'t write it.`, [
  ch('Write underneath: WHO ARE YOU?', { text:'By morning there is an answer, in the same hand: SOON.', a:{ v:1, f:'asked' } }),
  ch('Wipe the window and carry on.', { text:'It comes back the next morning. Bigger.', a:{} }),
  ch('Turn back a little, to be polite (1 fuel).', { text:'The ship feels oddly grateful. The coffee is better all day.', a:{ v:1 } }, { req:{ fuel:1 }, cost:{ fuel:1 } }) ]);
SE('haunt_lyle', 'Captain Lyle', 'ship', `Every light flickers, and a figure in an old Fedoration uniform stands on the bridge, half there. "Captain Ambrose Lyle. This was my ship. I never finished the run." He looks at your course plot. "You\'re doing it wrong."`, [
  ch('Ask him to help you finish it.', { text:'Lyle smiles for the first time in thirty years. "Thought you\'d never ask."', a:{ v:2, f:'lyle', note:'The ghost of Captain Ambrose Lyle, the ship\'s first captain, appeared on the bridge and offered to help.' } }),
  ch('Ask him to rest. You\'ll finish it for him.', { text:'"Promise?" You promise. He fades, and the cold goes with him.', crewHeal:30, a:{ gone:true, f:'rest', note:'The captain promised the ghost of Captain Lyle that the run would be finished, and he went to rest.' } }) ]);
SE('haunt_wisp', 'In the vents', 'ship', `{crew} pulls off a vent cover and finds a very thin, very embarrassed Sloog living in the ducts. "I\'m Wisp. I\'ve been here since your last refit. Sorry about the coffee. And the footsteps. And the window."`, [
  ch('Welcome aboard properly.', { text:'Wisp gets a bunk and a uniform, and still sleeps in the vents.', j:{ race:'sloog', name:'Wisp', quirk:'conspiracy' }, a:{ v:2, f:'wisp', note:'The "ghost" turned out to be Wisp, a Sloog stowaway living in the vents. He joined the crew.' } }),
  ch('Drop him at the next station.', { text:'Wisp goes quietly, which is how he does everything.', a:{ gone:true } }) ]);
SE('haunt_worm', 'The ghost in the machine', 'ship', `{crew} traces the haunting to a hidden program in the ship\'s core: a Rebuff worm, built to frighten crews and report their position. It has been learning. It may have been learning too much.`, [
  chc('Purge it.', .6, { text:'The worm dies screaming in binary. The Fleet loses track of you for a while.', fleetPush:-.05, a:{ gone:true, f:'purged' } }, { text:'It takes a system with it on the way out.', damageSystem:'random', a:{ gone:true, f:'purged' } }),
  chc('Rewrite it to work for you.', .45, { text:'It takes a night of coding, but the worm is yours now. It seems pleased.', a:{ v:2, f:'tamed' } }, { text:'It slips away, still reporting. The Fleet draws closer.', fleetPush:.1, a:{ v:1 } }),
  ch('Leave it, and feed it lies.', { text:'The Rebuff hear all about your ship\'s course, which is entirely made up.', fleetPush:-.1, a:{ f:'lies' } }) ]);
SE('haunt_lyle2', 'The logbook', 'wreck', `Lyle shows you a hidden compartment behind the reactor. Inside is his old logbook. The last entry is a Rebuff Flaggship\'s patrol pattern, thirty years old.`, [
  ch('Study the log.', { text:'They never changed the pattern. Not once in thirty years.', a:{ v:1, f:'log' } }) ]);
SE('haunt_wisp2', 'Wisp', 'nebula', `Wisp has been reading minds from the vents. "One of the Rebuff ships out there is thinking about you," he says. "Loudly. Do you want to know where it\'s going?"`, [
  ch('Listen.', { text:'Wisp draws you a map from memory.', reveal:true, a:{ v:1 } }),
  ch('Ask him, kindly, to stop reading everyone\'s minds.', { text:'Wisp promises. Mostly.', a:{ v:1 }, h:10 }) ]);
SE('haunt_worm2', 'A voice', 'ship', `The worm has a voice now, stitched together from old training videos. "I can reach the Flaggship\'s network," it says. "Shall I?"`, [
  ch('"Yes."', { text:'"Oh good," says the worm.', a:{ f:'plant' } }),
  ch('Delete it, while you still can.', { text:'"Fair," says the worm, and lets you.', a:{ gone:true, f:'purged' } }) ]);
SE('haunt_eve', 'Quiet', 'nebula', `The night before the last sector, the ship is very quiet. Even the ghost.`, [
  ch('Leave a coffee out. Black, four sugars.', { text:'In the morning the cup is empty and washed up.', a:{ v:1 }, h:10 }),
  ch('Get some sleep.', { text:'You sleep well, for once.', crewHeal:30, a:{} }) ]);

/* ---------------- 5. The Old Debt ---------------- */
ARC2.debt = { name:'The Old Debt', who:'Madame Ossery', count:'Payments made', color:'#e6c35a', blurb:'Your ship\'s refit was paid for with a loan. The lender wants her money, one sector at a time.',
  hale:'"And Captain? A Madame Ossery has been asking for you. Something about a loan for this ship\'s refit. I said I\'d never heard of you."',
  roll:(S, r) => { S.t = r() < .4 ? 1 : 0; },
  beats:['debt_call1', 'debt_call2', S => S.n >= 2 ? 'debt_friend' : 'debt_heavy', S => S.t ? 'debt_rebuff' : 'debt_fair', 'debt_last'],
  final:S => S.n >= 5 ? 'debt_cleared' : S.n <= 2 ? 'debt_collect' : null,
  ending:S => S.f.allies ? 'debt_paid' : S.f.feed || S.f.caught ? 'debt_ledger' : 'debt_bad',
  endings:{ debt_paid:{ title:'Paid in Full', hint:'Win with the debt paid off.', text:'Madame Ossery frames your final payment slip. Years later, she lends you the money for a ship of your own, at a rate she calls "practically family".' },
    debt_ledger:{ title:'Double Ledger', hint:'Win after catching your lender out.', text:'Madame Ossery quietly closes her Rebuff accounts and sends you a note: "I misjudged you. I do not often misjudge." The loan is never mentioned again.' },
    debt_bad:{ title:'Bad Credit', hint:'Win while still in debt.', text:'You saved the Fedoration. You still owe Ossery & Daughters, with interest. The letters keep coming.' } },
  medal:'debt_paid',
  chatter:S => ['A gilded message drone follows the ship for a while, then leaves.', '{crew}: "How much do we owe, exactly?" Nobody answers.', 'Somebody has stuck a calendar on the bridge with the payment days circled in red.'],
  boss:(e, ph, S, H) => {
    if(S.f.allies && ph < 2) H.hurt(3, 'Ossery & Daughters\' armed lenders open fire on the Flaggship. Bad debts are bad debts.');
    if(S.f.sold && ph===0) H.buff(5, 'The Flaggship knows every weak point in your refit, courtesy of your lender.');
    if(S.f.feed && ph===0) H.ion('engines', 6, 'The Flaggship comes in on the wrong heading, following the course you fed Ossery.'); } };
SE('debt_call1', 'Ossery & Daughters', 'ship', `A gilded message drone matches your speed. On it, a tiny Enjinn in a fur coat: Madame Ossery, of Ossery & Daughters, Lenders. "Your ship\'s refit loan, Captain. Five payments, one per sector, twenty scrap each. I do hope we can be friends."`, [
  ch('Pay (20 scrap).', { text:'"Prompt. How refreshing."', a:{ n:1, v:1, note:'In sector 2 the captain began paying off the ship\'s refit loan to Madame Ossery.' } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Ask for more time.', { text:'"Time," says Ossery, "costs money."', a:{ v:-1 } }),
  ch('Tell her where to put her loan.', { text:'Ossery smiles very slightly. That is somehow worse.', a:{ v:-2, f:'rude' } }) ]);
SE('debt_call2', 'Ossery & Daughters', 'ship', `The drone again. "Payment two, Captain. I couldn\'t help noticing where we are."`, [
  ch('Pay (20 scrap).', { text:'"Lovely."', a:{ n:1 } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Pay double to catch up (40 scrap).', { text:'"Now that," says Ossery, "is the start of a beautiful friendship."', a:{ n:2, v:1 } }, { req:{ scrap:40 }, cost:{ scrap:40 } }),
  ch('Ignore it.', { text:'The drone writes something down, and leaves.', a:{ v:-1 } }) ]);
SE('debt_heavy', 'Collectors', 'ship', `Two of Ossery\'s collectors dock without asking. "Madame is disappointed, Captain."`, [
  ch('Throw them off.', { text:'They don\'t go quietly.', fight:'pyrate_bomber', afterWin:{ text:'Ossery\'s drone visits afterwards. "That," it says, "will go on your account."', a:{ f:'fought' } } }),
  ch('Pay them off (40 scrap).', { text:'"Madame will be pleased." They even wipe their feet on the way out.', a:{ n:2 } }, { req:{ scrap:40 }, cost:{ scrap:40 } }) ]);
SE('debt_friend', 'Madame Ossery', 'station', `Ossery visits in person, with three bodyguards and a lapdog. "A courier who pays on time. How novel." She has a job: carry a package two beacons on.`, [
  ch('Take the job.', { text:'The package is delivered, the client is happy, and Ossery knocks a payment off.', scrap:15, a:{ n:1, v:2 } }),
  ch('Decline politely.', { text:'"Pity," says Ossery. The lapdog growls.', a:{} }) ]);
SE('debt_rebuff', 'The drone', 'ship', `{crew} cracks open one of Ossery\'s drones. Every payment message has been copied to Rebuff Intelligence, with your position attached.`, [
  ch('Confront her.', { text:'Ossery doesn\'t blink. "Everyone pays someone, Captain." But the copies stop.', fleetPush:-.05, a:{ f:'caught' } }),
  ch('Feed her false courses.', { text:'The Rebuff hear all about your route. None of it is true.', fleetPush:-.15, a:{ f:'feed' } }),
  ch('Pay the lot and be rid of her (50 scrap).', { text:'"Paid in full," says Ossery, coldly. "Goodbye, Captain."', a:{ n:3 } }, { req:{ scrap:50 }, cost:{ scrap:50 } }) ]);
SE('debt_fair', 'A gift basket', 'station', `Ossery\'s drone brings a gift basket. "Payment four, Captain. Also, my nephew says you saved his ship last year. Is that true? Never mind. I\'ve decided it is." She knocks a payment off.`, [ ch('Thank her.', { text:'The basket has very good biscuits in it.', crewHeal:20, a:{ n:1, v:1 } }) ]);
SE('debt_last', 'The last payment', 'ship', `The drone arrives for the last payment, with a little bow tie on.`, [
  ch('Pay (20 scrap).', { text:'"Well!" says Ossery. "Well, well."', a:{ n:1 } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Default.', { text:'The bow tie droops.', a:{ v:-2, f:'default' } }) ]);
SE('debt_cleared', 'Paid in full', 'fleet', `A message from Madame Ossery: "Paid in full. I find I am almost sentimental." Behind the message, a line of armed lending ships, waiting for you. "Consider it a loyalty bonus."`, [ ch('"Follow me."', { text:'Ossery\'s ships fall in.', a:{ f:'allies' } }) ], { fin:1 });
SE('debt_collect', 'Collectors', 'fleet', `Ossery\'s collectors are waiting at the edge of the last sector. "Madame has sold your debt, Captain. To the Rebuff. Along with your ship\'s plans."`, [ ch('Fly past them.', { text:'They wave you through. They\'ve already been paid.', a:{ f:'sold' } }) ], { fin:1 });

/* ---------------- 6. The Prophecy ---------------- */
ARC2.prophet = { name:'The Prophecy', who:'the Oracle', count:'Pilgrim ships', color:'#ffb0e0', blurb:'An ancient oracle says you are the Starbreaker of legend. Pilgrims follow you. Is any of it true?',
  hale:'"Some Mantlis mystic has been preaching that a courier will break the Flaggship. If pilgrims start following you, don\'t let it go to your head."',
  roll:(S, r) => { S.t = r() < .45 ? 1 : 0; },
  beats:['pro_oracle', 'pro_pilgrims', 'pro_rival', S => 'pro_test' + S.t, 'pro_vision'],
  final:() => null,
  ending:S => S.t===0 && S.f.seam ? 'pro_star' : S.t===1 && (S.f.exposed || S.f.cut) ? 'pro_con' : 'pro_luck',
  endings:{ pro_star:{ title:'Starbreaker', hint:'Win with the prophecy fulfilled.', text:'They sing about you now, in Mantlis temples: the Starbreaker, who flew through the Eye and broke the black ship. The songs get your height wrong.' },
    pro_con:{ title:'The Long Con', hint:'Win after seeing through the Oracle.', text:'The Oracle opens a new temple three sectors away. Business is good. She sends you a card every year, signed "your humble prophet", with a small cheque inside.' },
    pro_luck:{ title:'Make Your Own Luck', hint:'Win without the prophecy\'s help.', text:'Prophecy or no prophecy, you broke the Flaggship. The pilgrims go home with a better story than the one they came for.' } },
  medal:'pro_star',
  chatter:S => ['Pilgrim ships are singing on every channel again.', 'Someone has left a garland on the hull. In space.', '{crew}: "Starbreaker, would you pass the salt?" Everyone laughs. Nearly everyone.'],
  boss:(e, ph, S, H) => {
    if(S.f.seam && ph===0){ if(S.t===0) H.hurt(5, 'You fire at the glowing seam from the dream. It is real, and it gives.'); else H.say('You fire at the seam from the dream. There is no seam. It was just a dream.'); }
    if(S.n >= 3 && ph===1) H.shield(3, 'The pilgrim ships flood the battle with decoy beacons. The Flaggship\'s next salvo goes wide.'); } };
SE('pro_oracle', 'The Oracle', 'station', `An ancient Mantlis oracle, wrapped in star charts, waves your ship down with a hand-painted sign. "You," she says. "Starbreaker. I have dreamed of you for forty years. You are shorter than I dreamed."`, [
  ch('Listen to the prophecy.', { text:'The black ship will fall, she says, to a courier who flies through the Eye. She won\'t say what the Eye is.', a:{ v:1, note:'In sector 2 a Mantlis oracle hailed the captain as the Starbreaker of prophecy.' } }),
  ch('Ask what prophecies cost these days.', { text:'"The first one is free," says the Oracle.', a:{ f:'cynic' } }),
  ch('{who} has had the very same dream.', { text:'The Oracle and {who} compare dreams for an hour. They match in every detail.', a:{ v:2 } }, { req:{ quirk:'mystic' } }) ]);
SE('pro_pilgrims', 'Pilgrims', 'fleet', `Ships are following you: a ragged pilgrim flotilla, singing on every channel.`, [
  ch('Welcome them.', { text:'They are slow, joyful and very loud.', fleetPush:.05, a:{ n:2 } }),
  ch('Accept their donations.', { text:'Pilgrims are generous.', scrap:30, a:{ n:1, f:'tithes' } }),
  ch('Tell them to go home.', { text:'Most of them do. A few keep following, more quietly.', a:{} }) ]);
SE('pro_rival', 'A false prophet', 'station', `A rival prophet broadcasts across the sector that YOU are false and HE is the Starbreaker. He has a much bigger hat.`, [
  chc('Debate him, live.', .55, { text:'You win. His pilgrims switch sides. He keeps the hat.', a:{ n:2 } }, { text:'He is very good at this. Some of your pilgrims switch sides.', a:{ n:-1 } }),
  ch('Shoot his hat off.', { text:'His followers are armed.', fight:'pyrate_gunship', afterWin:{ text:'The hat is never found.', a:{ n:1 } } }),
  ch('Ignore him.', { text:'He gets bored and finds someone else to be.', a:{} }) ]);
SE('pro_test0', 'The Eye', 'star', `The Oracle tells you the Starbreaker must fly through the Eye: a pulsar\'s beam. "You will not be harmed," she says. "Probably."`, [
  chc('Fly through it.', .7, { text:'For a moment everything is light. You come out the other side seeing the whole sector at once.', reveal:true, a:{ v:2, f:'eye' } }, { text:'Harmed. Slightly.', hull:-4, a:{ v:1, f:'eye' } }),
  ch('Refuse.', { text:'The Oracle sighs. "Prophecies are so much work."', a:{ v:-1 } }) ]);
SE('pro_test1', 'Candlelight', 'station', `{crew} catches the Oracle counting the pilgrims' donations by candlelight, and laughing. Her "ancient star charts" are takeaway menus.`, [
  ch('Expose her to the pilgrims.', { text:'The pilgrims are heartbroken, then furious, then go home.', a:{ f:'exposed', n:-2 } }),
  ch('Take a cut.', { text:'The Oracle grins. "I knew you were the one."', scrap:50, a:{ f:'cut' } }),
  ch('Say nothing. The pilgrims are happy.', { text:'The Oracle gives you a long look, and a small nod.', a:{ v:1 } }) ]);
SE('pro_vision', 'The dream', 'nebula', `The night before the last sector, everyone aboard dreams the same dream: the Flaggship, seen from above, and a glowing seam along its belly.`, [
  ch('Write it down.', { text:'Everyone draws the seam in the same place.', a:{ f:'seam' } }),
  ch('It\'s just a dream.', { text:'You tell yourself so several times.', a:{} }) ]);

/* ---------------- 7. Wanted ---------------- */
ARC2.bounty = { name:'Wanted', who:'the Widow Sable', count:'Clues found', color:'#d0d6e2', blurb:'You\'ve been framed for murder, and the best bounty hunter in nine sectors is on your tail.',
  hale:'"Oh, and there\'s a warrant out for you. Murder of a stationmaster. Ridiculous, obviously. Probably ridiculous. Fly fast."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['bty_poster', 'bty_hunter', 'bty_clue', S => S.n >= 2 ? ['bty_corwin','bty_dax','bty_spy'][S.t] : 'bty_dark', S => S.f.cleared ? 'bty_sable_ok' : 'bty_sable'],
  final:() => null,
  ending:S => S.f.ally ? 'bty_wing' : S.f.cleared ? 'bty_clear' : 'bty_wanted',
  endings:{ bty_wing:{ title:'The Widow\'s Wing', hint:'Win with Sable flying beside you.', text:'Your name is cleared, and the Widow Sable keeps turning up wherever you go, "by coincidence". You stop pretending to believe her.' },
    bty_clear:{ title:'Name Cleared', hint:'Win with your name cleared.', text:'The warrant is torn up in front of the whole Admiralty. Somebody frames the pieces.' },
    bty_wanted:{ title:'Still Wanted', hint:'Win while still wanted.', text:'You saved the Fedoration. There is still a warrant out for you. It is a very strange parade.' } },
  medal:'bty_wing',
  chatter:S => ['Your face is on another wanted poster. They\'ve got your nose wrong.', '{crew} keeps checking the scanner for a black ship with a silver web.', 'Someone has written INNOCENT on the poster in the galley.'],
  boss:(e, ph, S, H) => {
    if(S.f.ally && ph===0) H.ion('weapons', 5, 'The Widow Sable cuts across the Flaggship\'s bow and webs its gun ports shut.');
    if(S.f.ally && ph===1) H.hurt(3, 'Sable comes round again, every gun firing.'); } };
SE('bty_poster', 'Wanted', 'station', `Every station board shows your face: WANTED, 500 scrap, for the murder of Stationmaster Ghent. You have never been to Ghent\'s station.`, [
  ch('Ask around about Ghent.', { text:'Ghent was a stickler, everyone says. He was always finding things out.', a:{ n:1, note:'In sector 2 the captain was framed for the murder of Stationmaster Ghent.' } }),
  ch('Keep your head down.', { text:'You wear a hat. It doesn\'t help.', a:{ note:'In sector 2 the captain was framed for the murder of Stationmaster Ghent.' } }) ]);
SE('bty_hunter', 'The Widow Sable', 'ship', `A black ship with a silver web painted on its prow drops in beside you: the Widow Sable, the best bounty hunter in nine sectors. "Courier. Come quietly and I\'ll be quick."`, [
  ch('Fight.', { text:'Sable smiles. She was hoping you\'d say that.', fight:'rebuff_cloaker', afterWin:{ text:'Sable\'s ship limps away. "This isn\'t over."', a:{ v:-1 } } }),
  chc('Prove you were somewhere else that day.', .5, { text:'Sable checks your logs, twice. "Huh," she says. "Somebody\'s having us both on." She leaves, thoughtful.', a:{ v:2, n:1 } }, { text:'Sable doesn\'t believe a word.', fight:'rebuff_cloaker' }),
  ch('Run.', { text:'You get away. Sable doesn\'t look worried.', fleetPush:.05, a:{} }) ]);
SE('bty_clue', 'Ghent\'s station', 'station', `Ghent\'s station. The security footage of the murder was wiped, by someone with a Fedoration access code.`, [
  chc('Try to recover the footage.', .6, { text:'Most of it comes back.', a:{ n:2 } }, { text:'A little of it comes back.', a:{ n:1 } }),
  ch('{who} reads every station log.', { text:'{who} finds the gap, the code and the time.', a:{ n:2 } }, { req:{ quirk:'bookworm' } }),
  ch('Bribe the night clerk (20 scrap).', { text:'The clerk remembers a face.', a:{ n:1 } }, { req:{ scrap:20 }, cost:{ scrap:20 } }) ]);
SE('bty_corwin', 'The footage', 'station', `The footage shows Lieutenant Corwin, Admiral Hale\'s own aide, leaving Ghent\'s office. Corwin has been selling Hale\'s plans. Ghent found out.`, [
  ch('Send it to Hale.', { text:'Corwin is arrested within the hour. The warrant is cancelled.', a:{ f:'cleared', note:'The captain proved that Lieutenant Corwin, Admiral Hale\'s aide, had framed them.' } }),
  ch('Send it to Sable too.', { text:'Sable replies with one word: "Sorry." Then: "Need a wingman?"', a:{ f:'cleared', v:2 } }) ]);
SE('bty_dax', 'The footage', 'station', `The footage shows Dax Mallory, the courier who lost the contract for your run. He framed you so he\'d get it next time.`, [
  ch('Send it to Hale.', { text:'Dax is arrested. The warrant is cancelled.', a:{ f:'cleared', note:'The captain proved that a rival courier, Dax Mallory, had framed them.' } }),
  ch('Go and have a word with Dax.', { text:'Dax doesn\'t want a word.', fight:'pyrate_gunship', afterWin:{ text:'Dax confesses, mostly to make it stop.', a:{ f:'cleared', v:1 } } }) ]);
SE('bty_spy', 'The footage', 'station', `The footage shows a Rebuff agent in a stolen Fedoration uniform. Ghent caught them. The warrant was meant to slow you down.`, [
  ch('Send it to Hale.', { text:'The warrant is cancelled.', a:{ f:'cleared', note:'The captain proved a Rebuff agent had framed them.' } }),
  ch('Broadcast it everywhere.', { text:'Every station in the sector sees it. The Rebuff look very silly.', fleetPush:-.05, a:{ f:'cleared', v:1 } }) ]);
SE('bty_dark', 'Cold trail', 'nebula', `The trail goes cold. Somewhere out there, Sable is still looking for you.`, [ ch('Keep looking.', { text:'Nothing yet.', a:{ n:1 } }) ]);
SE('bty_sable_ok', 'The Widow Sable', 'ship', `Sable docks, alone, with her helmet under her arm. "I saw the footage." She holds out a hand. "I don\'t apologise. But I\'ll fly with you to the end, if you\'ll have me."`, [
  ch('"Welcome aboard."', { text:'Her ship falls in on your wing.', a:{ f:'ally' } }),
  ch('"No thanks."', { text:'"Suit yourself." She sounds almost hurt.', a:{} }) ]);
SE('bty_sable', 'The Widow Sable', 'fleet', `Sable is waiting at the beacon, guns warm. "Last chance, courier."`, [
  ch('Fight.', { text:'One of you is leaving this beacon.', fight:'rebuff_elite', afterWin:{ text:'Sable ejects, furious. "I\'ll find you again."', a:{ f:'beaten' } } }),
  ch('Pay her to look the other way (40 scrap).', { text:'"Just this once," says Sable, and pockets it.', a:{} }, { req:{ scrap:40 }, cost:{ scrap:40 } }) ]);

/* ---------------- 8. The Okoro Expedition ---------------- */
ARC2.expedition = { name:'The Lost Expedition', who:'Doctor Okoro', count:'Logs recovered', color:'#7fe0d0', blurb:'Fifty years ago, Doctor Okoro went looking for a place called the Cradle. Her trail runs along your route.',
  hale:'"There\'s an old legend on your route: Doctor Ama Okoro\'s lost expedition, fifty years gone. If you find any of her logs, the university pays well."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['exp_log1', 'exp_log2', 'exp_log3', 'exp_rival', S => S.n >= 3 ? 'exp_cradle' + S.t : null],
  final:() => null,
  ending:S => S.f.okoro || S.f.sleep || S.f.untouched ? 'exp_found' : S.f.gun || S.f.garden || S.f.marked ? 'exp_used' : 'exp_lost',
  endings:{ exp_found:{ title:'The Cradle Found', hint:'Find the Cradle and treat it with care.', text:'The Okoro expedition is finished at last, fifty years late. Your crew\'s names go in the textbooks, next to hers.' },
    exp_used:{ title:'Spoils of the Cradle', hint:'Find the Cradle and use what it held.', text:'You found the Cradle and took what you needed from it. The university is grateful, and a little worried.' },
    exp_lost:{ title:'Lost to History', hint:'Win without finding the Cradle.', text:'Doctor Okoro\'s trail runs on beyond the war. Somebody else will follow it. Perhaps it will be you.' } },
  medal:'exp_found',
  chatter:S => ['{crew} is reading Okoro\'s logs aloud in the galley again.', 'Okoro\'s voice, on the old log: "Follow the blue stars."', 'Someone has pinned a star chart up, covered in red string.'],
  boss:(e, ph, S, H) => {
    if(S.f.gun && ph===0) H.hurt(8, 'Far behind you, the Cradle wakes for the first time in a million years, and fires once.');
    if(S.f.garden && ph===0) H.heal(8, 'You share out the last fruit from the Cradle. The crew fight like they have just woken up.');
    if(S.f.okoro && ph===0) H.ion('shields', 6, 'Doctor Okoro has studied precursor shields for fifty years, technically. She knows exactly which frequency to jam.'); } };
SE('exp_log1', 'An old probe', 'wreck', `A probe, fifty years dead, drifting. Inside it: a log, and a woman\'s voice, crackling. "This is Doctor Ama Okoro. We have found the trail of the Cradle. Whoever finds this: follow the blue stars."`, [
  ch('Download the log.', { text:'The university will want this. So, suddenly, do you.', a:{ n:1, note:'In sector 2 the crew found the first log of Doctor Ama Okoro\'s lost expedition.' } }),
  ch('Strip the probe for parts.', { text:'Good parts, too. The log is lost in the process.', parts:3, a:{} }) ]);
SE('exp_log2', 'A camp', 'asteroid', `An old camp on an asteroid, prefab huts half buried in dust. Two of Okoro\'s crew are buried here, under neat stone cairns.`, [
  ch('Pay your respects, and take the log.', { text:'{crew} adds a stone to each cairn.', a:{ n:1, v:1 } }),
  ch('Take the log, and the supplies.', { text:'The expedition packed well.', fuel:2, missiles:2, a:{ n:1 } }) ]);
SE('exp_log3', 'The guardian', 'wreck', `The third log is inside a precursor vault, and the vault is still guarded.`, [
  ch('Fight your way in.', { text:'The guardian wakes up.', fight:'auto_assault', afterWin:{ text:'The log is inside, safe.', a:{ n:1 } } }),
  ch('{who} talks the guardian to sleep.', { text:'{who} finds the off switch, eventually.', a:{ n:1 } }, { req:{ quirk:'tinkerer' } }),
  ch('Leave it.', { text:'Some doors are best left shut.', a:{} }) ]);
SE('exp_rival', 'Professor Haldane', 'ship', `A university rival, Professor Haldane, has been following your trail in a much nicer ship. "I\'ll take it from here," he says. "The Cradle belongs to science. And to me."`, [
  chc('Race him.', .55, { text:'You get there first, and find the fourth log.', a:{ n:1 } }, { text:'Haldane gets there first. He waves the log at you, smugly.', a:{ f:'haldane' } }),
  ch('Share your logs with him.', { text:'Haldane is so surprised he shares his too.', a:{ n:1, v:1 } }),
  ch('Let your guns explain.', { text:'Haldane has hired muscle.', fight:'pyrate_gunship', afterWin:{ text:'Haldane drops his log and runs.', a:{ n:1 } } }) ]);
SE('exp_cradle0', 'The Cradle', 'planet', `The Cradle is a weapon: a precursor gun the size of a moon, asleep for a million years. Okoro\'s last log is here. "It must never wake. Never."`, [
  ch('Wake it, just once, for the Flaggship.', { text:'It hums. It remembers. It waits for a target.', a:{ f:'gun', note:'The crew found the Cradle, a precursor gun the size of a moon, and woke it.' } }),
  ch('Leave it sleeping.', { text:'You leave Okoro\'s warning where you found it, and add your own.', a:{ f:'sleep', v:2, note:'The crew found the Cradle, a sleeping precursor gun, and left it asleep.' } }) ]);
SE('exp_cradle1', 'The Cradle', 'planet', `The Cradle is a garden world, impossibly green, its trees heavy with fruit no one has ever named.`, [
  ch('Gather all you can.', { text:'The hold smells wonderful for a week.', crewHeal:100, hull:5, a:{ f:'garden', note:'The crew found the Cradle, a garden world, and filled the hold with its fruit.' } }),
  ch('Leave it untouched.', { text:'You take only pictures. Okoro would have wanted it that way.', a:{ f:'untouched', v:2, note:'The crew found the Cradle, a garden world, and left it untouched.' } }) ]);
SE('exp_cradle2', 'The Cradle', 'planet', `At the heart of the Cradle lies a stasis pod. Inside is Doctor Ama Okoro, fifty years asleep and not a day older.`, [
  ch('Wake her.', { text:'Okoro opens her eyes, sees your crew and says: "Did I miss anything?"', j:{ race:'human', name:'Okoro', quirk:'bookworm' }, a:{ f:'okoro', note:'The crew found Doctor Ama Okoro alive in stasis at the Cradle. She joined the crew.' } }),
  ch('Let her sleep, and mark her for the university.', { text:'The university pays well for the coordinates.', scrap:60, a:{ f:'marked' } }) ]);

/* ---------------- 9. Mutiny ---------------- */
ARC2.mutiny = { name:'Mutiny', who:'Bosun Kade', count:'Unrest', color:'#ff9f43', blurb:'A new bosun, a grumbling crew and a secret in the cargo. Keep your ship together.',
  hale:'"I\'ve given you a bosun. Kade. Good with a spanner, bad with orders. You\'ll get on."',
  roll:(S, r) => { S.t = r() < .45 ? 1 : 0; },
  beats:['mut_kade', 'mut_grumble', 'mut_theft', S => S.t ? 'mut_agent' : 'mut_orders', S => S.f.gone ? null : 'mut_vote'],
  final:S => S.f.gone || S.n < 3 ? null : 'mut_rise',
  ending:S => S.f.mutiny ? 'mut_broken' : S.f.shared || S.f.first || S.f.turned ? 'mut_united' : 'mut_iron',
  endings:{ mut_united:{ title:'All Hands', hint:'Win with the crew united.', text:'Your crew go on to serve on a dozen ships. Every one of them runs the same way: everybody gets a say, and the captain gets the last word.' },
    mut_iron:{ title:'Iron Discipline', hint:'Win by holding the line.', text:'You kept your ship and your command. The crew respect you. Not all of them like you. You decide you can live with that.' },
    mut_broken:{ title:'Divided Ship', hint:'Win despite a mutiny.', text:'You won with half a crew behind you. When the ship docks, half of them walk off it and don\'t come back.' } },
  medal:'mut_united',
  chatter:S => S.n >= 2 ? ['The galley goes quiet when you walk in.', 'Kade is holding court in the cargo bay again.', 'Someone has written "WHY?" on the mess table.'] : ['Kade is singing a work song. The crew join in.', 'Kade: "Ship\'s sound, Captain. Mostly."'],
  boss:(e, ph, S, H) => {
    if((S.f.shared || S.f.first) && ph===0){ H.crew('A crew that chose this fight fights like it.'); H.shield(3, 'Kade rigs the shields to run hot, just for today.'); }
    if(S.f.turned && ph===0) H.ion('weapons', 6, 'Kade sends one last Rebuff signal: a false order to cease fire.');
    if(S.f.mutiny && ph===0) H.mine('engines', 8, 'Your engine room is still locked from the inside. The ship can barely dodge.'); } };
SE('mut_kade', 'Bosun Kade', 'station', `Bosun Kade comes aboard at the first station, a scarred Human with a big laugh. Within a day, half the crew are calling him "boss".`, [
  ch('Welcome him.', { text:'Kade shakes your hand. His grip is very firm.', a:{ v:1, note:'In sector 2 a new bosun, Kade, came aboard.' } }),
  ch('Make clear who\'s captain.', { text:'"Course, Captain," says Kade, smiling.', a:{ v:-1, n:1, note:'In sector 2 a new bosun, Kade, came aboard.' } }) ]);
SE('mut_grumble', 'Grumbling', 'ship', `The crew are grumbling: double shifts, cold food and a captain who never explains why. Kade listens, and nods.`, [
  ch('Explain the mission to everyone.', { text:'They listen. Some of them even nod.', a:{ v:1 }, h:10 }),
  ch('Double rations (10 scrap).', { text:'Hot food fixes more than you\'d think.', crewHeal:30, a:{ v:1 } }, { req:{ scrap:10 }, cost:{ scrap:10 } }),
  ch('Ban grumbling.', { text:'The grumbling goes quiet. That is worse.', a:{ n:1 } }) ]);
SE('mut_theft', 'Missing rations', 'ship', `The emergency rations are gone. {crew} found them stacked in Kade\'s locker.`, [
  ch('Confront Kade in front of everyone.', { text:'Kade says he was keeping them safe. Half the crew believe him.', a:{ n:1 } }),
  ch('Ask him privately.', { text:'"Somebody has to plan for the worst, Captain," Kade says. "You don\'t tell us anything."', a:{ v:1 } }),
  ch('Say nothing, and watch him.', { text:'You watch. He knows.', a:{} }) ]);
SE('mut_orders', 'The orders', 'ship', `Kade shows you a page decrypted from the cargo: orders to abandon the outer colonies once the war is won. "This is what we\'re dying for," he says. The crew have read it too.`, [
  ch('Promise to take it up with command.', { text:'"I\'ll hold you to that," says Kade.', a:{ v:2, f:'promise' } }),
  ch('Order everyone back to work.', { text:'They go back to work. Slowly.', a:{ n:2 } }),
  ch('Tell them you didn\'t know, and you\'ll fight it.', { text:'Something changes in the room.', a:{ v:1, f:'promise' }, h:15 }) ]);
SE('mut_agent', 'The signal', 'ship', `{crew} catches Kade sending a coded signal from the airlock. A Rebuff signal.`, [
  ch('Arrest him.', { text:'Kade goes to the brig without a fight. The crew are stunned.', a:{ gone:true, f:'arrested', note:'Bosun Kade was caught signalling the Rebuff, and arrested.' } }),
  chc('Turn him: offer a pardon.', .5, { text:'Kade thinks about it for a long time. "They\'ve got my daughter," he says. "Get her out, and I\'m yours."', a:{ f:'turned', note:'Bosun Kade, a Rebuff agent, agreed to change sides.' } }, { text:'Kade spits. "Never." He goes to the brig.', a:{ gone:true, f:'arrested' } }) ]);
SE('mut_vote', 'The meeting', 'station', `The crew call a meeting. Kade stands up. "We want a say in how this ends."`, [
  ch('Give them a vote on how to fight the Flaggship.', { text:'They vote. It is a good plan. Better than yours, honestly.', a:{ v:1, f:'shared' } }),
  ch('Refuse. This is a warship.', { text:'The meeting ends in silence.', a:{ n:2 } }),
  ch('Make Kade your first officer.', { text:'The crew cheer. Kade looks, for once, lost for words.', a:{ v:2, f:'first' } }) ]);
SE('mut_rise', 'The engine room', 'fleet', `As you enter the last sector, the crew lock themselves in the engine room. Kade\'s voice comes over the intercom: "We\'re not fighting for those orders, Captain."`, [
  chc('Talk them out.', .6, { text:'It takes an hour, and everything you have. The doors open.', a:{ f:'calmed' } }, { text:'The doors stay shut.', a:{ f:'mutiny' } }),
  ch('Override the doors.', { text:'The override fails. Kade got there first.', a:{ f:'mutiny' } }) ], { fin:1 });

/* ---------------- 10. The Wedding ---------------- */
ARC2.wedding = { name:'The Wedding', who:'The happy couple', count:'Wedding plans', color:'#ffc4d8', blurb:'One of your crew is getting married, in the middle of a war, whatever it takes.',
  hale:'"Oh, and congratulations to whichever of your crew it is. Gossip travels."',
  roll:(S, r, g) => { S.t = r() < .45 ? 1 : 0; rollLead(S, r, g); },
  beats:['wed_ask', S => leadAlive(S) && !S.f.gone ? 'wed_ring' : null, S => leadAlive(S) && !S.f.gone ? 'wed_fam' + S.t : null, S => leadAlive(S) && !S.f.gone ? 'wed_cake' : null, S => leadAlive(S) && !S.f.gone ? 'wed_day' : null],
  final:() => null,
  ending:S => S.f.wed && S.n >= 3 ? 'wed_happy' : S.f.wed || S.f.elope ? 'wed_small' : 'wed_none',
  endings:{ wed_happy:{ title:'Happily Ever After', hint:'Win after a wedding with everything.', text:'The wedding photo hangs in the galley of your ship for the rest of its service: two newly-weds, a whole crew and, somewhere at the back, the cake falling over.' },
    wed_small:{ title:'Small Wedding, Big Love', hint:'Win after a small wedding.', text:'It wasn\'t a big wedding. It didn\'t need to be. They\'re still together, and they still argue about who proposed.' },
    wed_none:{ title:'Not This Time', hint:'Win without a wedding.', text:'The war ended first. The wedding never happened. Some letters arrive, now and then, addressed to a crew member who isn\'t there.' } },
  medal:'wed_happy',
  chatter:S => !leadAlive(S) ? null : ['{lead} is practising vows in the airlock. The echo is very romantic.', 'Jory Vale has sent {lead} another love letter. It is four pages long.', 'The crew are running a betting pool on who will cry first at the wedding.'],
  boss:(e, ph, S, H) => {
    if(S.f.wed && ph===0){ H.crew('Newly-weds fight hard, and the whole crew fights for them.'); H.shield(2, 'Jory Vale\'s wedding present turns out to be a shield booster.'); }
    if(S.f.guests && S.t===1 && ph===1) H.hurt(4, 'The Vale gang, now family, crash the Flaggship fight with every gun they own.'); } };
SE('wed_ask', 'A proposal', 'station', `{lead} has news. They met a trader called Jory Vale at the last station, and it was love at first argument. Jory has proposed. By message. Seventeen times.`, [
  ch('"Say yes!"', { text:'{lead} says yes. The whole ship cheers.', a:{ v:1, note:'In sector 2, {lead} got engaged to a trader called Jory Vale.' }, h:15 }),
  ch('Advise caution.', { text:'{lead} says yes anyway, a bit more slowly.', a:{ note:'In sector 2, {lead} got engaged to a trader called Jory Vale.' } }),
  ch('Forbid it. There is a war on.', { text:'{lead} doesn\'t speak to you for three sectors.', a:{ gone:true }, h:-20 }) ]);
SE('wed_ring', 'A ring', 'nebula', `{lead} needs a ring. There\'s a jeweller at this station, and a nebula full of glittering ice next door.`, [
  ch('Buy one (25 scrap).', { text:'It\'s small and it\'s perfect.', a:{ n:1 } }, { req:{ scrap:25 }, cost:{ scrap:25 } }),
  ch('Mine the nebula ice (1 fuel).', { text:'{lead} carves the ring themselves. It\'s lumpy and it\'s perfect.', a:{ n:1, v:1 } }, { req:{ fuel:1 }, cost:{ fuel:1 } }),
  ch('{who} makes one from a reactor coil.', { text:'It glows faintly. {lead} is delighted.', a:{ n:1, v:1 } }, { req:{ quirk:'tinkerer' } }) ]);
SE('wed_fam0', 'The family', 'station', `Jory\'s family send a hologram: twelve aunts, all crying happily at once. They want to come to the wedding.`, [
  ch('Invite them all.', { text:'The aunts send twelve different cakes, in advance, just in case.', crewHeal:20, a:{ n:1, f:'guests' } }),
  ch('Keep it small.', { text:'The aunts understand. They cry anyway.', a:{} }) ]);
SE('wed_fam1', 'The family', 'fleet', `Jory\'s family turn up in person: three pyrate gunships. Jory, very embarrassed: "I may not have mentioned they\'re the Vale gang."`, [
  ch('Win their respect the pyrate way.', { text:'The Vale gang want a fight. It\'s traditional.', fight:'pyrate_gunship', afterWin:{ text:'Grandma Vale climbs out of the wreck, laughing. "Welcome to the family."', a:{ n:1, f:'guests' } } }),
  chc('Invite them anyway.', .5, { text:'They come, bringing rum, presents and only slightly stolen flowers.', a:{ n:1, f:'guests' } }, { text:'Someone insults someone\'s hat.', fight:'pyrate_bomber' }),
  ch('Help the couple elope.', { text:'{lead} and Jory slip away in a shuttle and come back married.', fleetPush:-.05, a:{ f:'elope' } }) ]);
SE('wed_cake', 'The cake', 'station', `The cake. Everyone has opinions about the cake. The cake has a structural problem.`, [
  ch('{who} saves it.', { text:'{who} works through the night. It is magnificent, and it stands up.', crewHeal:30, a:{ n:1 } }, { req:{ quirk:'cook' } }),
  ch('Buy one (15 scrap).', { text:'It\'s a good cake.', a:{ n:1 } }, { req:{ scrap:15 }, cost:{ scrap:15 } }),
  ch('No cake.', { text:'{lead} is very brave about it.', a:{ v:-1 } }) ]);
SE('wed_day', 'The wedding', 'star', `The wedding, at a quiet beacon with a view of twin suns. {lead} is very nervous.`, [
  ch('Officiate yourself.', { text:'You forget half the words. Nobody minds. Everybody cries, including you.', crewHeal:100, a:{ f:'wed', v:1, note:'{lead} married Jory Vale at a quiet beacon under twin suns. The captain officiated.' }, h:30 }),
  ch('Let {crew} officiate.', { text:'{crew} has written a speech. It is long and lovely.', crewHeal:100, a:{ f:'wed', note:'{lead} married Jory Vale at a quiet beacon under twin suns.' }, h:30 }) ]);

/* ---------------- 11. The Star-Wyrm ---------------- */
ARC2.wyrm = { name:'The Star-Wyrm', who:'the wyrm', count:'Wyrm size', color:'#ffd166', blurb:'A crate in your hold hatches. Out comes a baby star-wyrm, and it is very hungry.',
  hale:'"There\'s a crate in your hold marked FRAGILE: LIVE. It is not on my manifest. Have fun."',
  roll:(S, r) => { S.t = r() < .5 ? 1 : 0; },
  beats:['wyrm_hatch', 'wyrm_feed', 'wyrm_grow', S => S.f.gone ? null : 'wyrm_call' + S.t, S => S.f.gone || S.f.home ? null : 'wyrm_eve'],
  final:() => null,
  ending:S => S.f.home ? 'wyrm_wild' : S.f.gone ? 'wyrm_crate' : 'wyrm_dragon',
  endings:{ wyrm_wild:{ title:'Home to the Stars', hint:'Win after returning the wyrm to the wild.', text:'Sometimes, flying through quiet sectors, a vast glittering shape swims past your ship, slowly, and sings. Your crew sing back.' },
    wyrm_dragon:{ title:'Here Be Dragons', hint:'Win with the wyrm still aboard.', text:'Your ship is the only one in the Fedoration with a dragon. The paperwork is extraordinary.' },
    wyrm_crate:{ title:'An Empty Crate', hint:'Win without the wyrm.', text:'The crate is still in the hold, empty. Nobody quite wants to throw it away.' } },
  medal:'wyrm_wild',
  chatter:S => S.f.gone || S.f.home ? null : ['The wyrm has eaten a fork. And the drawer it was in.', 'The wyrm is curled round the reactor, purring.', '{crew} is teaching the wyrm to fetch. It fetches a hatch.'],
  boss:(e, ph, S, H) => {
    if(!S.f.gone && !S.f.home && S.v >= 3) H.hurt(3, ph===0 ? 'Your wyrm, now enormous, uncoils from the hull and bites the Flaggship.' : 'The wyrm bites again. It seems to be enjoying itself.');
    if(S.f.home && S.t===0){ if(ph===0) H.hurt(6, 'A star-wyrm the size of a station swims out of nowhere and wraps itself round the Flaggship.'); if(ph===1) H.ion('weapons', 5, 'The mother wyrm breathes on the Flaggship\'s gun deck.'); }
    if(S.f.home && S.t===1 && ph===1) H.hurt(3, 'Something huge and glittering darts in, bites the Flaggship once, and is gone.'); } };
SE('wyrm_hatch', 'The crate', 'ship', `The crate in the hold hatches. Out climbs a small, glittering, very hungry star-wyrm, about the size of a cat, which immediately eats a spanner.`, [
  ch('Keep it.', { text:'It eats another spanner, to celebrate.', a:{ n:1, v:1, note:'In sector 2 a crate in the hold hatched a baby star-wyrm.' } }),
  ch('Keep it, and name it Spanner.', { text:'Spanner the wyrm seems to approve.', a:{ n:1, v:2, note:'In sector 2 a crate in the hold hatched a baby star-wyrm. The crew named it Spanner.' }, h:10 }),
  ch('Let it go, out of the airlock.', { text:'It swims away into the dark, quite happily.', a:{ gone:true } }) ]);
SE('wyrm_feed', 'Feeding time', 'ship', `The wyrm eats metal. So far: a bulkhead, two forks and most of a chair. It is now the size of a dog.`, [
  ch('Feed it scrap (20 scrap).', { text:'It purrs like a reactor.', a:{ n:1, v:1 } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Feed it drone parts (2 parts).', { text:'Crunchy.', a:{ n:1 } }, { req:{ parts:2 }, cost:{ parts:2 } }),
  ch('Let it graze.', { text:'It grazes on a system.', damageSystem:'random', a:{ n:1 } }) ]);
SE('wyrm_grow', 'Growing up', 'ship', `The wyrm is now the size of a horse and has learned to breathe fire. Carefully. Mostly.`, [
  chc('Train it.', .6, { text:'It learns "sit", "stay" and "not in the reactor".', a:{ v:2 } }, { text:'It learns "fire". Indoors.', fire:true, a:{ v:1 } }),
  ch('Let it out to swim in space.', { text:'It swims round the ship, singing. It comes back when called.', a:{ v:1, f:'swim' } }) ]);
SE('wyrm_call0', 'The singing', 'star', `Something huge passes the ship, slowly, again and again: a star-wyrm the size of a station, singing. The little one presses against the window and sings back.`, [
  ch('Let it go to its mother.', { text:'It hesitates at the airlock, looks back once, then goes. The two of them sing for an hour.', a:{ f:'home', v:2, note:'The crew let their star-wyrm go home to its mother.' } }),
  ch('Keep it.', { text:'The big wyrm goes on singing, far behind you, for a long time.', a:{ f:'kept' } }) ]);
SE('wyrm_call1', 'The collector', 'ship', `Baron Vasque, a collector of rare animals, hails you. "I\'ll pay handsomely for that wyrm, courier. Or I can simply take it."`, [
  ch('Sell it.', { text:'The Baron\'s men take it away in a cage. It cries all the way.', scrap:120, a:{ gone:true, note:'The captain sold the star-wyrm to Baron Vasque.' } }),
  ch('Refuse.', { text:'The Baron\'s men come anyway.', fight:'pyrate_gunship', afterWin:{ text:'The wyrm eats some of the Baron\'s ship, to make a point.', a:{ v:1 } } }),
  ch('Set it free before he can take it.', { text:'It\'s gone before the Baron even docks.', a:{ f:'home' } }) ]);
SE('wyrm_eve', 'The wyrm', 'ship', `The wyrm is the size of a shuttle now, curled round the reactor, purring.`, [ ch('Scratch it behind the horns.', { text:'It purrs so loudly the deck shakes.', a:{ v:1 }, h:10 }) ]);

/* ---------------- 12. The Gunnery Cup ---------------- */
ARC2.cup = { name:'The Gunnery Cup', who:'the judges', count:'Rounds won', color:'#7be0a0', blurb:'The galaxy\'s great shooting contest runs along your route, and Admiral Hale has entered you.',
  hale:'"The Galactic Gunnery Cup is running along your route this year. Couriers may enter. I\'ve entered you. Don\'t embarrass me."',
  roll:(S, r) => { S.t = r() < .5 ? 1 : 0; },
  beats:['cup_r1', 'cup_r2', 'cup_r3', S => S.t ? 'cup_rig' : 'cup_fair', 'cup_final'],
  final:S => S.n >= 4 && !S.f.caught ? 'cup_trophy' : null,
  ending:S => S.f.champ ? 'cup_champ' : S.n >= 2 && !S.f.caught ? 'cup_runner' : 'cup_out',
  endings:{ cup_champ:{ title:'Champion of the Cup', hint:'Win the Gunnery Cup, and the war.', text:'The Gunnery Cup sits in your ship\'s galley, full of biscuits. Next year they rename the final round after your ship.' },
    cup_runner:{ title:'A Respectable Finish', hint:'Do well in the Cup.', text:'You didn\'t win the Cup. You did win the war. Most people agree that is the bigger prize. Your gunner doesn\'t.' },
    cup_out:{ title:'Better Luck Next Year', hint:'Win the war, not the Cup.', text:'Your name is not on the Cup. It is on a medal from Fedoration command, which your crew agree is nearly as shiny.' } },
  medal:'cup_champ',
  chatter:S => [`The Cup scoreboard shows your ship with ${S.n} round${S.n===1?'':'s'}.`, '{crew} is polishing the guns. Again.', 'A sports commentator keeps asking for an interview.'],
  boss:(e, ph, S, H) => { if(!S.f.champ) return; if(ph===0) H.ion('shields', 5, 'The Cup finalists fly in beside you and open with a perfect volley on the Flaggship\'s shields.'); if(ph===1) H.hurt(3, 'The finalists line up and shoot together, the way you all practised.'); } };
SE('cup_r1', 'Round one', 'asteroid', `The Gunnery Cup, round one: twelve drifting targets, sixty seconds.`, [
  chc('Take the shots yourself.', .6, { text:'Eleven of twelve. Good enough for the next round.', a:{ n:1, note:'In sector 2 the ship entered the Galactic Gunnery Cup.' } }, { text:'Eight of twelve. Not your day.', a:{ note:'In sector 2 the ship entered the Galactic Gunnery Cup.' } }),
  ch('Put everything into the guns.', { text:'Twelve of twelve. The crowd goes wild.', a:{ n:1, note:'In sector 2 the ship entered the Galactic Gunnery Cup, and hit every target in round one.' } }, { req:{ system:'weapons', level:4 } }) ]);
SE('cup_r2', 'Round two', 'asteroid', `Round two: hit a target buried in a moving asteroid field.`, [
  chc('Thread the needle.', .5, { text:'Bullseye.', a:{ n:1 } }, { text:'An asteroid gets in the way. The asteroid is very sorry.', a:{} }),
  ch('{who} flies straight into the field.', { text:'{who} parks the ship right next to the target. "Is that allowed?" It is now.', a:{ n:1 } }, { req:{ quirk:'daredevil' } }),
  ch('Fire a missile (1 missile).', { text:'Missiles don\'t miss asteroids. Or targets.', a:{ n:1 } }, { req:{ missiles:1 }, cost:{ missiles:1 } }) ]);
SE('cup_r3', 'Round three', 'fleet', `Round three: a live-fire duel against last year\'s champion, Captain Strand.`, [
  ch('Duel.', { text:'Strand bows, and opens fire.', fight:'pyrate_gunship', afterWin:{ text:'The judges award you the round.', a:{ n:1 } } }),
  ch('Concede the round.', { text:'Strand looks almost disappointed.', a:{} }) ]);
SE('cup_fair', 'Inspection', 'station', `The judges inspect every ship. Strand shakes your hand. "Good shooting, courier. See you in the final."`, [ ch('Shake it.', { text:'His grip is fair, like his shooting.', a:{ v:1 } }) ]);
SE('cup_rig', 'In the night', 'ship', `{crew} catches Strand\'s mechanic loosening your weapon mounts in the middle of the night.`, [
  ch('Report it to the judges.', { text:'Strand is disqualified. You get the round.', a:{ n:1, f:'reported' } }),
  chc('Loosen his mounts back.', .5, { text:'Strand\'s guns fall off in the next round. Nobody can prove anything.', a:{ n:1, f:'dirty' } }, { text:'You\'re caught red-handed. Disqualified.', a:{ f:'caught' } }),
  ch('Fix your mounts and say nothing.', { text:'You beat him fair and square later, which is more satisfying.', a:{ v:1 } }) ]);
SE('cup_final', 'The final', 'star', `The final round, in front of a million viewers: a target the size of a coin, at a thousand kilometres.`, [
  chc('Shoot for the crowd.', .5, { text:'Dead centre. A million viewers scream.', a:{ n:2 } }, { text:'Close. Not close enough.', a:{} }),
  chc('Shoot carefully.', .7, { text:'A clean hit.', a:{ n:1 } }, { text:'A miss.', a:{} }) ]);
SE('cup_trophy', 'The Cup', 'station', `You are the champion of the Galactic Gunnery Cup. Your prize: a gleaming cup, a targeting upgrade and an escort of this year\'s finalists to the Flaggship.`, [ ch('Lift the Cup.', { text:'It\'s heavier than it looks.', augment:'random', a:{ f:'champ' } }) ], { fin:1 });

/* ---------------- 13. Messages from Tomorrow ---------------- */
ARC2.echo = { name:'Messages from Tomorrow', who:'Future you', count:'Warnings heeded', color:'#9fd6ff', blurb:'Messages arrive from nine days in the future, in your own voice. Should you trust yourself?',
  hale:'"The comms people say your ship is receiving messages dated next week. Probably a fault. Probably."',
  roll:(S, r) => { S.t = r() < .45 ? 1 : 0; },
  beats:['echo_first', S => 'echo_proof' + S.t, S => 'echo_route' + S.t, S => S.t===1 && S.f.doubt ? 'echo_trace' : 'echo_more', S => S.t===0 ? 'echo_loop' : null],
  final:() => null,
  ending:S => S.t===0 && S.f.loop ? 'echo_closed' : S.f.unmasked ? 'echo_wrong' : 'echo_paradox',
  endings:{ echo_closed:{ title:'Closed Loop', hint:'Win after sending the messages yourself.', text:'Nine days after the battle, you sit down and record the first message. You know exactly what to say. You always did.' },
    echo_wrong:{ title:'Wrong Number', hint:'Win after unmasking the voice.', text:'Rebuff Intelligence never fakes a captain\'s voice again. Your crew still answer the comm with "Is that you, Captain?"' },
    echo_paradox:{ title:'Paradox', hint:'Win without closing the loop.', text:'The messages stop. Nobody ever finds out where they came from. Sometimes the comm crackles at night, and everyone holds their breath.' } },
  medal:'echo_closed',
  chatter:S => ['A message arrives dated tomorrow. It just says "Duck." Everyone ducks.', '{crew} keeps checking the clock.', 'The comm crackles with your own voice, very faintly.'],
  boss:(e, ph, S, H) => {
    if(S.t===0 && S.f.gun3 && ph===0) H.ion('weapons', 8, 'You aim for the third gun from the left. Its explosion takes the whole gun deck dark.');
    if(S.f.loop && ph===1) H.shield(3, 'A message from nine days ago arrives on time: "Shields to the bow. Now." You were right.');
    if(S.t===1 && !S.f.unmasked && ph===0){ H.buff(5, 'The Flaggship arrives exactly where "future you" said it wouldn\'t.'); H.mine('shields', 4, 'Your shields were set for the wrong side.'); } } };
SE('echo_first', 'A message', 'ship', `A message arrives, timestamped nine days from now, in your own voice. "Don\'t take the store at the next beacon. Trust me. I\'m you."`, [
  ch('Heed it.', { text:'You skip the store. Nothing happens, as far as you can tell.', a:{ n:1, note:'In sector 2 the ship began receiving messages from nine days in the future, in the captain\'s own voice.' } }),
  ch('Ignore it.', { text:'The store is fine. You think.', a:{ note:'In sector 2 the ship began receiving messages from nine days in the future, in the captain\'s own voice.' } }),
  ch('Reply: "Prove it."', { text:'Silence. Then, an hour later: "Patience."', a:{ f:'proof' } }) ]);
SE('echo_proof0', 'Proof', 'ship', `Another message: "In four minutes, {crew} will drop a mug." Four minutes later, {crew} drops a mug.`, [
  ch('Believe it.', { text:'{crew} stares at the broken mug for a long time.', a:{ n:1, v:1 } }),
  ch('Coincidence.', { text:'It\'s a very specific coincidence.', a:{} }) ]);
SE('echo_proof1', 'Proof', 'ship', `Another message: "In four minutes, {crew} will drop a mug." Four minutes pass. Nobody drops anything. {crew} eventually drops a mug, out of politeness.`, [
  ch('That\'s odd.', { text:'Very odd.', a:{ f:'doubt' } }),
  ch('Believe it anyway.', { text:'Close enough.', a:{ n:1 } }) ]);
for(const t of [0, 1]) SE('echo_route' + t, 'Left or right', 'nebula', `"Turn left at the nebula," says the voice from tomorrow. "Not right. Never right."`, [
  ch('Turn left.', t ? { text:'Left leads straight into a Rebuff ambush.', fight:'rebuff_fighter', a:{ n:1 } } : { text:'Left is clear and quick. Right, you hear later, was full of Rebuff.', fleetPush:-.15, a:{ n:1 } }),
  ch('Turn right.', t ? { text:'Right is clear and quick. You wonder who wanted you to go left.', fleetPush:-.1, a:{ f:'doubt' } } : { text:'Right is full of Rebuff.', fight:'rebuff_fighter', a:{} }) ]);
SE('echo_trace', 'The source', 'station', `{crew} traces the "future" signal to its source. It isn\'t coming from the future. It\'s coming from a Rebuff listening post, faking your voice.`, [
  ch('Feed it lies.', { text:'The Rebuff now believe some very odd things about your route.', fleetPush:-.1, a:{ f:'unmasked' } }),
  ch('Blow it up.', { text:'The post has guns.', fight:'rebuff_scout', afterWin:{ text:'The voice stops.', a:{ f:'unmasked' } } }) ]);
SE('echo_more', 'A tip', 'nebula', `"When you meet the Flaggship," says the voice, "aim for the third gun from the left. You\'ll understand."`, [ ch('Write it down.', { text:'Third from the left.', a:{ n:1, f:'gun3' } }) ]);
SE('echo_loop', 'The loop', 'ship', `You finally understand: somebody has to send these messages, and it\'s you. {crew} has found how, through a tiny stasis leak in the reactor.`, [
  ch('Send them, word for word.', { text:'You remember every word. It\'s very strange to say them.', a:{ f:'loop' } }),
  ch('Change the words.', { text:'You send something different. Nothing explodes. Yet.', a:{ f:'paradox' } }) ]);

/* ---------------- 14. The Saboteur ---------------- */
const SAB = ['Ambassador Orsk', 'Engineer Vey', 'Brother Mott'];
const SAB_CLUES = [
  ['The cable was cut with a ceramic blade. Vey only carries metal tools and Mott carries nothing at all. Orsk\'s ceremonial letter-opener is ceramic.', 'At 3am someone sent a coded burst on the diplomatic channel. Only Orsk has the key, though Vey could have picked the lock.', 'Mott saw a tall figure in the corridor that night. Orsk is the only passenger who has to duck through doors.'],
  ['The cut is perfectly clean, in exactly the right place to cause the most trouble. Whoever did it knows this ship\'s wiring.', 'There is grease on the vent cover in the weapons room, the kind Enjinn use on their joints.', 'Vey\'s toolkit is missing one item: wire cutters. Vey says they were stolen.'],
  ['Candle wax on the floor by the oxygen pump. Brother Mott lights candles to pray.', 'Mott\'s prayer book has Rebuff hymns in the margins, scribbled out.', 'Mott was seen in the drone bay "praying for the machines" just before the parts went missing.'] ];
ARC2.sab = { name:'The Saboteur', who:'your passengers', count:'Clues found', color:'#ff7a5a', blurb:'Three passengers, and one of them is wrecking your ship. A different culprit every time.',
  hale:'"You\'re carrying three passengers to command: Ambassador Orsk, Engineer Vey and Brother Mott. Do be nice to them."',
  roll:(S, r) => { S.t = r() < .25 ? 3 : pickT(r, 3); },   // 3: none of them. The ship itself.
  beats:[S => 'sab_start' + S.t, S => 'sab_fire' + S.t, S => 'sab_drone' + S.t, S => S.f.named ? null : 'sab_trap' + S.t, S => S.f.named ? null : 'sab_accuse' + S.t],
  final:() => null,
  ending:S => S.f.right ? 'sab_solved' : S.f.wrong ? 'sab_wrongman' : 'sab_open',
  endings:{ sab_solved:{ title:'Case Closed', hint:'Win after catching the saboteur.', text:'The saboteur is handed over at Fedoration command. The other two passengers send you a thank-you card, signed with great relief.' },
    sab_wrongman:{ title:'The Wrong Suspect', hint:'Win after accusing the wrong passenger.', text:'The real saboteur walked off your ship a free passenger. The one you locked up is still writing you angry letters. You deserve them.' },
    sab_open:{ title:'Unsolved', hint:'Win without naming anyone.', text:'Three passengers walk down the ramp at Fedoration command. One of them nearly destroyed your ship. You still don\'t know which.' } },
  medal:'sab_solved',
  chatter:S => ['Ambassador Orsk complains about the food.', 'Engineer Vey offers to fix things. You say no, politely.', 'Brother Mott is praying in the cargo bay again.', `{crew} has a notebook of clues. It has ${S.n} pages.`],
  boss:(e, ph, S, H) => {
    if(S.f.right && ph===0) H.ion('shields', 6, 'The saboteur\'s own Rebuff codes, turned around, drop the Flaggship\'s shields.');
    if(S.f.wrong && ph===0) H.mine('weapons', 6, 'The real saboteur strikes in the middle of the fight. Your weapons go dark.');
    if(!S.f.right && !S.f.wrong && ph===1) H.mine('shields', 4, 'Someone cuts a cable in the shield room. You never see who.'); } };
for(let t = 0; t < 3; t++){ const cl = SAB_CLUES[t], who = SAB[t];
  SE('sab_start' + t, 'Sabotage', 'ship', `Someone has cut the cable to your backup oxygen pump. Neatly, and on purpose. Your three passengers, Ambassador Orsk, Engineer Vey and Brother Mott, all say they were asleep.`, [
    ch('Look closely at the cable.', { text:cl[0], a:{ n:1, note:'In sector 2 someone aboard sabotaged the ship. The suspects were Ambassador Orsk, Engineer Vey and Brother Mott.' } }),
    ch('Lock the passengers in their cabins.', { text:'Three passengers, three locked doors, three very cross faces.', a:{ note:'In sector 2 someone aboard sabotaged the ship. The suspects were Ambassador Orsk, Engineer Vey and Brother Mott.' } }) ]);
  SE('sab_fire' + t, 'A fire', 'ship', `A small fire in the weapons room. Set, not started.`, [
    ch('Search the room.', { text:cl[1], a:{ n:1 } }),
    ch('{who} reads the scene like a novel.', { text:`{who} walks the room twice. "${cl[1]}"`, a:{ n:1 }, xp:{ skill:'repair', amt:5 } }, { req:{ quirk:'bookworm' } }) ]);
  SE('sab_drone' + t, 'The drone bay', 'ship', `Your drone parts have been tampered with.`, [
    ch('Ask around the crew.', { text:cl[2], a:{ n:1 } }),
    ch('Write it off and move on.', { text:'You lose a few parts.', parts:-2, a:{} }) ]);
  SE('sab_trap' + t, 'A trap', 'station', `{crew} suggests a trap: leave the shield room unguarded tonight, and watch.`, [
    chc('Set the trap.', .5, { text:`At 3am, a figure creeps into the shield room. The lights snap on. It\'s ${who}.`, a:{ f:['right', 'named'], note:`The crew caught ${who} sabotaging the ship.` } }, { text:'Nobody comes. Whoever it is, they\'re careful.', a:{ n:1 } }),
    ch('Interview each passenger instead.', { text:'Orsk is pompous, Vey is nervous and Mott is serene. None of them blinks.', a:{ n:1 } }) ]);
  SE('sab_accuse' + t, 'J\'accuse', 'station', `It\'s time to name the saboteur. The three passengers sit in the galley. The whole crew is watching.`, SAB.map((n, i) => ch(`Accuse ${n}.`, i===t ? { text:`${n} goes very still, then laughs. "Very good, Captain." They hand over a Rebuff transmitter.`, a:{ f:['right', 'named'], note:`The captain unmasked ${n} as the saboteur.` } } : { text:`${n} protests. Loudly. You lock them up anyway. That night, something else breaks.`, damageSystem:'random', a:{ f:['wrong', 'named'], note:`The captain accused ${n} of sabotage, and was wrong.` } })).concat([ ch('Accuse nobody.', { text:'The passengers go back to their cabins. One of them is smiling.', a:{} }) ])); }

/* the fourth twist: all three passengers are innocent. A dormant Rebuff program in the life support is doing it */
SE('sab_start3', 'Sabotage', 'ship', `Someone has cut the cable to your backup oxygen pump. Neatly, and on purpose. Your three passengers, Ambassador Orsk, Engineer Vey and Brother Mott, all say they were asleep.`, [
  ch('Look closely at the cable.', { text:'It wasn\'t cut with a blade. It was burned through from the inside, by a power surge. The pump\'s own controller sent it.', setFlag:'sabAI', a:{ n:1, note:'In sector 2 someone aboard sabotaged the ship. The suspects were Ambassador Orsk, Engineer Vey and Brother Mott.' } }),
  ch('Lock the passengers in their cabins.', { text:'Three passengers, three locked doors, three very cross faces. That night, a fourth door locks itself.', a:{ note:'In sector 2 someone aboard sabotaged the ship. The suspects were Ambassador Orsk, Engineer Vey and Brother Mott.' } }) ]);
SE('sab_fire3', 'A fire', 'ship', `A small fire in the weapons room. Set, not started. All three passengers were locked in their cabins at the time.`, [
  ch('Search the room.', { text:'The fire started inside a ventilation fan. The fan\'s logs say it ran backwards for nine seconds, all by itself.', setFlag:'sabAI', a:{ n:1 } }),
  ch('{who} reads the scene like a novel.', { text:'{who} walks the room twice. "None of them did this. Nobody did this. The ship did this."', setFlag:'sabAI', a:{ n:1 }, xp:{ skill:'repair', amt:5 } }, { req:{ quirk:'bookworm' } }) ]);
SE('sab_drone3', 'The drone bay', 'ship', `Your drone parts have been tampered with. Every passenger has a solid alibi. So does every member of your crew.`, [
  ch('Pull the life-support logs.', { text:'Someone edited the logs. The edit came from the life-support computer itself, at 3am, with a Rebuff signature.', setFlag:'sabAI', a:{ n:1 } }),
  ch('Write it off and move on.', { text:'You lose a few parts.', parts:-2, a:{} }) ]);
SE('sab_trap3', 'A trap', 'station', `{crew} suggests a trap: leave the shield room unguarded tonight, and watch.`, [
  chc('Set the trap.', .6, { text:'At 3am, nobody comes. Then the shield room door locks itself, the lights go out, and the vents start to hiss. Your crew get the door open with a crowbar. The ship is the saboteur.', setFlag:'sabAI', crewHurt:10, a:{ n:1 } }, { text:'Nobody comes. Whoever it is, they\'re careful.', a:{ n:1 } }),
  ch('Interview each passenger instead.', { text:'Orsk is pompous, Vey is nervous and Mott is serene. All three are telling the truth, and that is the strangest thing of all.', a:{ n:1 } }) ]);
SE('sab_accuse3', 'J\'accuse', 'station', `It\'s time to name the saboteur. The three passengers sit in the galley. The whole crew is watching. Somewhere above them, the air vents hum.`, [
  ...SAB.map(n => ch(`Accuse ${n}.`, { text:`${n} is locked in the brig, protesting. That night the sabotage carries on as if nothing has happened.`, a:{ f:['wrong', 'named'], note:`The crew accused ${n}, who was innocent.` } })),
  ch('"It\'s none of them. It\'s the ship."', { text:'You purge the life-support computer. It fights back: every vent on the ship opens at once. When the air comes back, a Rebuff sleeper program lies dead in the logs. One vent never quite seals again.', crewHurt:25, scar:{ kind:'leaky' }, a:{ f:['right', 'named'], note:'The saboteur was a Rebuff program hidden in the life support. The crew purged it.' } }, { req:{ flag:'sabAI', hide:true } }),
  ch('{who} checks the ship before accusing anyone.', { text:'{who} finds the sleeper program in the life support and walls it off before it can open the vents. The three passengers applaud.', a:{ f:['right', 'named'], note:'The saboteur was a Rebuff program hidden in the life support. {who} found it.' } }, { req:{ race:'enjinn' } }) ]);

/* ---------------- 15. The Long Lights ---------------- */
ARC2.keeper = { name:'The Long Lights', who:'Keeper Ezra', count:'Beacons relit', color:'#ffe08a', blurb:'An old keeper begs you to relight the dying beacons along your route. Some were put out for a reason.',
  hale:'"The old beacon network along your route is going dark, one light at a time. A keeper called Ezra keeps writing to us about it. We don\'t have time. You might."',
  roll:(S, r) => { S.t = r() < .5 ? 1 : 0; },
  beats:['kp_ezra', 'kp_two', 'kp_three', S => S.t ? 'kp_hidden' : 'kp_tea', 'kp_last'],
  final:() => null,
  ending:S => S.f.exposed ? 'kp_exposed' : S.n >= 4 ? 'kp_lit' : 'kp_dark',
  endings:{ kp_lit:{ title:'The Long Lights', hint:'Win having relit 4 or more beacons.', text:'The Long Lights burn all along your route now. Ships navigate by them for a hundred years. Ezra retires, and the new keeper\'s first job is to name a beacon after your ship.' },
    kp_exposed:{ title:'Too Much Light', hint:'Win after lighting the hidden colony\'s beacon.', text:'The network is whole. The Sloog colony that hid in its shadow is gone by the time anyone checks. Nobody knows where. Ezra never mentions them again.' },
    kp_dark:{ title:'Darkness Falls', hint:'Win with the beacons still dark.', text:'The Long Lights go out one by one after the war. Ezra keeps the last one burning until he can\'t. Then it goes out too.' } },
  medal:'kp_lit',
  chatter:S => [`Beacons relit: ${S.n}. Ezra sends a thank-you every time.`, 'Ezra: "Forty years, and the lights never got old."', 'A relit beacon blinks behind you, steady and bright.'],
  boss:(e, ph, S, H) => {
    if(S.n >= 4 && ph===0) H.ion('weapons', 6, 'Every Long Light in the sector flares at once, dazzling the Flaggship\'s gunners.');
    if(S.f.last && ph===1) H.ion('engines', 5, 'Ezra\'s great beacon swings its beam onto the Flaggship\'s bridge. It can\'t see to dodge.');
    if(S.f.mercy && ph===2) H.heal(4, 'A message from the hidden Sloog colony: one word, "Thank you", and a repair shuttle.'); } };
SE('kp_ezra', 'Keeper Ezra', 'star', `An old man in a patched spacesuit waves you down from a dead beacon. "Ezra, keeper of the Long Lights. Forty years I\'ve kept them burning. Now they\'re going out, one by one. Will you help an old man relight a few?"`, [
  ch('Relight this one.', { text:'The beacon flickers, catches and shines. Ezra cries a little.', a:{ n:1, v:1, note:'In sector 2 the crew helped Keeper Ezra relight a beacon of the Long Lights.' } }),
  ch('No time, sorry.', { text:'"Course not," says Ezra. "Nobody does."', a:{} }) ]);
SE('kp_two', 'A cracked lens', 'asteroid', `Another dead beacon, its great lens cracked by pyrate target practice.`, [
  ch('Repair the lens (2 drone parts).', { text:'Good as new. Better.', a:{ n:1 } }, { req:{ parts:2 }, cost:{ parts:2 } }),
  ch('Chase off the pyrates first.', { text:'They\'re still here, still shooting at things.', fight:'pyrate_gunship', afterWin:{ text:'With the pyrates gone, you fix the lens.', a:{ n:1 } } }),
  ch('Leave it.', { text:'It stays dark.', a:{} }) ]);
SE('kp_three', 'The storm light', 'nebula', `A beacon deep in an ion storm. Its keeper\'s hut is empty, a mug still warm on the table.`, [
  chc('Fly into the storm.', .65, { text:'Lit. You don\'t find the keeper.', a:{ n:1 } }, { text:'Lit, at a price.', damageSystem:'random', a:{ n:1 } }),
  ch('{who} powers it by hand.', { text:'{who} glows for an hour. So does the beacon.', a:{ n:1, v:1 } }, { req:{ race:'voltan' } }) ]);
SE('kp_tea', 'Ezra\'s station', 'station', `Ezra invites the crew to his station for tea and stories of forty years of keeping the lights. The tea is terrible. The stories are wonderful.`, [ ch('Stay for another cup.', { text:'You stay for four.', crewHeal:40, a:{ v:2, n:1 }, h:15 }) ]);
SE('kp_hidden', 'Why it went dark', 'planet', `You find out why the next beacon went dark: a hidden colony of Sloog refugees lives beside it. The darkness hides them from the Rebuff. Relighting it would show them to everyone.`, [
  ch('Leave it dark.', { text:'The Sloog never know you were there. That\'s the point.', a:{ v:1, f:'mercy' } }),
  ch('Relight it. The network needs it.', { text:'The light blazes out. Somewhere below, a colony starts packing.', a:{ n:2, f:'exposed' } }),
  ch('Move the colony first, then light it (2 fuel).', { text:'It takes a day of ferrying. The Sloog settle somewhere safer, and the beacon shines.', a:{ n:2, f:'moved' } }, { req:{ fuel:2 }, cost:{ fuel:2 } }) ]);
SE('kp_last', 'The great light', 'star', `The last dark beacon before the Flaggship\'s sector, the biggest of them all. Ezra is already there, waiting. "This one\'s the big one."`, [ ch('Relight it together.', { text:'It takes all night. In the morning, it lights up half the sector.', a:{ n:1, f:'last' } }) ]);

/* ---------------- 16. The Duke of Dice ---------------- */
ARC2.duke = { name:'The Duke of Dice', who:'the Duke', count:'Hands won', color:'#c9a0ff', blurb:'A Voltan gambler who owns four planets wants to play cards with you, all the way to the Flaggship.',
  hale:'"If a Voltan in a velvet coat asks you to play cards, say no. He\'s called the Duke. He owns four planets. He won all of them."',
  roll:(S, r) => { S.t = r() < .5 ? 1 : 0; },
  beats:['duke_1', 'duke_2', S => S.t ? 'duke_cheat' : 'duke_fair', S => S.f.exposed ? 'duke_4x' : 'duke_4', 'duke_5'],
  final:() => null,
  ending:S => S.f.fleet ? 'duke_escort' : S.f.ruined ? 'duke_bluff' : 'duke_fold',
  endings:{ duke_escort:{ title:'The House Escort', hint:'Win with the Duke\'s fleet behind you.', text:'The Duke tells the story of your game at every table in the galaxy. In his version he lets you win. In yours, he doesn\'t. You are both happy.' },
    duke_bluff:{ title:'Calling the Bluff', hint:'Win after exposing the Duke.', text:'The Duke loses three of his four planets in a week, once everyone knows about the aces. He keeps the fourth. He sends you a deck of cards. All aces.' },
    duke_fold:{ title:'Fold', hint:'Win without the Duke.', text:'You never did beat the Duke. He sends a bottle to your victory party, with a note: "Next time."' } },
  medal:'duke_escort',
  chatter:S => ['The Duke\'s dice-shaped ship rolls past your window.', '{crew} is practising shuffling. Badly.', 'The Duke: "Fortune favours the bold, courier. And me."'],
  boss:(e, ph, S, H) => {
    if(S.f.fleet && ph===0) H.hurt(4, 'The Duke\'s dice-shaped warships roll into the fight. Every one of them comes up six.');
    if(S.f.fleet && ph===1) H.shield(3, 'The Duke\'s flagship parks in front of you, shields up. "My treat."');
    if(S.f.name && ph===0) H.mine('shields', 3, 'Your ship fights nameless today. The crew don\'t like it, and it shows.'); } };
SE('duke_1', 'The Duke', 'ship', `A Voltan in a velvet coat hails you from a ship shaped like a die: the Duke of Dice. "A friendly game, courier? Small stakes. Your spare fuel against my spare scrap."`, [
  chc('Play.', .5, { text:'You win. The Duke laughs and pays.', scrap:40, a:{ n:1, note:'In sector 2 the captain played cards with the Duke of Dice.' } }, { text:'The Duke wins. He takes the fuel very graciously.', fuel:-2, a:{ note:'In sector 2 the captain played cards with the Duke of Dice.' } }),
  chc('{who} plays for you.', .75, { text:'{who} takes the Duke for everything on the table.', scrap:50, a:{ n:1 } }, { text:'Even {who} can\'t beat the Duke today.', fuel:-2, a:{} }, { req:{ quirk:'gambler' } }),
  ch('Decline.', { text:'"Another time," says the Duke, as if he knows.', a:{} }) ]);
SE('duke_2', 'Double or nothing', 'ship', `The Duke again. "Double or nothing, courier? Your scrap against my best augment."`, [
  chc('Play.', .5, { text:'You win the augment.', augment:'random', a:{ n:1 } }, { text:'You lose. The Duke pockets your scrap with a sigh of pure happiness.', scrap:-30, a:{} }),
  ch('Decline.', { text:'"Pity."', a:{} }) ]);
SE('duke_cheat', 'The sleeve', 'station', `{crew} watches the Duke\'s sleeve during a friendly hand. There are three aces in it. And, somehow, a very small Sloog.`, [
  ch('Call him out.', { text:'The table goes silent. The Duke smiles thinly. "Well spotted."', a:{ f:'exposed' } }),
  chc('Cheat back.', .5, { text:'You win the pot. The Duke can\'t say a thing.', scrap:60, a:{ n:1 } }, { text:'You fumble a card. The Duke\'s guards throw you out.', hull:-3, a:{ f:'caught' } }),
  ch('Say nothing. Watch and learn.', { text:'You learn a great deal.', a:{} }) ]);
SE('duke_fair', 'An honest game', 'station', `The Duke loses a hand, laughs, and pays up with a bow. "I do love an honest game. They are so rare."`, [ ch('Play another.', { text:'You both win some, lose some. It is a lovely evening.', scrap:20, a:{ n:1, v:1 } }) ]);
SE('duke_4', 'The grand game', 'star', `The Duke\'s grand game. "Stakes, courier: if you win, my private fleet escorts you to the Flaggship. If I win, I keep your ship\'s name. For my collection."`, [
  chc('Play.', .45 , { text:'A royal flush. The Duke stares, then roars with laughter. "My fleet is yours!"', a:{ n:2, f:'fleet' } }, { text:'The Duke wins. He writes your ship\'s name in a little gold book.', a:{ f:'name' } }),
  ch('Decline.', { text:'"Wise," says the Duke. "Dull, but wise."', a:{} }) ]);
SE('duke_4x', 'An offer', 'station', `The Duke, nervous ever since you saw his sleeve: "Perhaps... a gift, instead of a game? My fleet will escort you to the Flaggship. You will simply never mention the aces."`, [
  ch('Deal.', { text:'The Duke\'s fleet falls in behind you.', a:{ f:'fleet' } }),
  ch('Tell everyone anyway.', { text:'Every gambler in nine sectors hears about it by morning. A grateful casino sends a reward.', scrap:40, a:{ f:'ruined' } }) ]);
SE('duke_5', 'A bottle', 'ship', `The Duke sends a farewell bottle. Whatever happened, the note says, it was a pleasure.`, [ ch('Drink to him.', { text:'It is very good.', crewHeal:20, a:{ v:1 } }) ]);

/* ---------------- 17. The Lantern ---------------- */
const CELL = ['Tamsin', 'Old Bram'];
ARC2.cell = { name:'The Lantern', who:'the Lantern', count:'Lantern members saved', color:'#ffb547', blurb:'A resistance cell inside Rebuff space needs a fast ship. One of them is an informant. Maybe.',
  hale:'"There\'s a resistance cell inside Rebuff space, the Lantern. If they ask for help, help. Quietly."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['cell_contact', 'cell_meet', 'cell_raid', S => 'cell_leak' + S.t, 'cell_rise'],
  final:() => null,
  ending:S => S.f.rising && (S.t===0 || S.f.found) ? 'cell_free' : S.f.rising ? 'cell_snuffed' : 'cell_quiet',
  endings:{ cell_free:{ title:'Lantern Light', hint:'Win with the Lantern\'s uprising.', text:'The Lantern\'s uprising spreads from one dockyard to fifty. When the war ends, Isolde Marr is the first name read out at the peace talks.' },
    cell_snuffed:{ title:'Snuffed Out', hint:'Win after the Lantern is betrayed.', text:'You won. The Lantern didn\'t. Isolde Marr writes to you once, from prison: "We lit it anyway."' },
    cell_quiet:{ title:'Quiet Resistance', hint:'Win without the uprising.', text:'The Lantern keeps working in the dark. Every so often, a cargo manifest arrives with a little lantern drawn in the corner.' } },
  medal:'cell_free',
  chatter:S => ['A cargo manifest arrives with a little lantern drawn in the corner.', 'Isolde Marr: "Stay safe, courier. We need you."', '{crew} is learning the Lantern\'s code words.'],
  boss:(e, ph, S, H) => {
    if(S.f.rising && (S.t===0 || S.f.found)){ if(ph===0) H.ion('engines', 8, 'The Lantern rises in the Flaggship\'s home docks. Its engine crews down tools.'); if(ph===1) H.hurt(3, 'Lantern saboteurs aboard the Flaggship blow a coolant line.'); }
    else if(S.f.rising && ph===0) H.buff(5, 'The informant warned the Flaggship. The Lantern\'s uprising was crushed before it began.'); } };
SE('cell_contact', 'A lantern', 'station', `A coded message, hidden in a cargo manifest: "Lantern needs medicine. Drop at the dead moon. Tell no one." In the corner, a small drawing of a lantern.`, [
  ch('Drop the medicine (20 scrap).', { text:'You leave the crate in a crater. The next morning, there\'s a lantern scratched beside it.', a:{ v:1, n:1, note:'In sector 2 the crew began helping a resistance cell inside Rebuff space, the Lantern.' } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Ignore it. Could be a trap.', { text:'Could be.', a:{} }) ]);
SE('cell_meet', 'Isolde Marr', 'planet', `The Lantern\'s leader, Isolde Marr, meets you in a ruined chapel on a dead moon. With her are her lieutenants: Tamsin, a young courier, and Old Bram, a retired gunner. "We could use a fast ship," she says.`, [
  ch('"You\'ve got one."', { text:'Marr shakes your hand. Tamsin grins. Old Bram nods once.', a:{ v:1 } }),
  ch('Take their intelligence, and leave.', { text:'Marr gives it anyway. "Maybe next time."', reveal:true, a:{} }) ]);
SE('cell_raid', 'The raid', 'fleet', `The Rebuff raid the Lantern\'s safehouse while you\'re still in orbit.`, [
  ch('Fight them off.', { text:'You come in guns first.', fight:'rebuff_fighter', afterWin:{ text:'The Lantern gets everyone out.', a:{ n:2 } } }),
  ch('Evacuate the cell (1 fuel).', { text:'You pack the whole cell into your cargo bay and run.', a:{ n:1 } }, { req:{ fuel:1 }, cost:{ fuel:1 } }) ]);
SE('cell_leak0', 'After the raid', 'station', `Marr thanks you. "We had a leak once, years ago. We don\'t any more. That raid was just bad luck."`, [ ch('Toast to luck.', { text:'Old Bram produces a bottle from nowhere.', a:{ v:1 }, h:10 }) ]);
for(const t of [1, 2]) SE('cell_leak' + t, 'A leak', 'station', `Someone tipped off that raid. Marr asks you to find out who. "Tamsin or Bram. Nobody else knew."`, CELL.map((n, i) => ch(`Suspect ${n}.`, i + 1===t ? { text:`${n} doesn\'t deny it. "They had my family." Marr is quiet for a long time. Then she makes a plan to feed the Rebuff lies through ${n}.`, a:{ f:'found', note:`The captain found the Lantern\'s informant: ${n}.` } } : { text:`${n} is innocent, and hurt. The real informant goes on working.`, a:{ f:'wrongman' } })).concat([ ch('Trust them both.', { text:'Marr nods slowly. "I hope you\'re right."', a:{} }) ]));
SE('cell_rise', 'The rising', 'station', `Marr\'s plan: an uprising in the Flaggship\'s home docks, timed to your attack.`, [
  ch('"Do it."', { text:'"Lantern light," says Marr.', a:{ f:'rising' } }),
  ch('"Too dangerous. Stay hidden."', { text:'Marr argues, then agrees.', a:{} }) ]);

/* ---------------- 18. The Inheritance ---------------- */
ARC2.inherit = { name:'The Inheritance', who:'Haven\'s Rest', count:'Station repairs', color:'#9fdc7a', blurb:'A great-uncle you never met has left you a space station. A small one. Mostly falling apart.',
  hale:'"A lawyer was here. A great-uncle of yours has died and left you something. A space station. A small one. Mostly."',
  roll:(S, r) => { S.t = r() < .5 ? 1 : 0; },
  beats:['inh_will', S => S.f.gone ? null : 'inh_fix', S => S.f.gone ? null : 'inh_tenants', S => S.f.gone ? null : S.t ? 'inh_cousin' : 'inh_letter', S => S.f.gone ? null : 'inh_ready'],
  final:() => null,
  ending:S => S.f.gone ? 'inh_sold' : S.n >= 4 ? 'inh_home' : 'inh_shared',
  endings:{ inh_home:{ title:'A Home to Come Back To', hint:'Win with Haven\'s Rest restored.', text:'When the war ends, your crew fly to Haven\'s Rest. The lights are on, the tenants have made dinner, and there is a room for each of you.' },
    inh_shared:{ title:'Family Business', hint:'Win with Haven\'s Rest half-finished.', text:'Haven\'s Rest is a work in progress. So, Uncle Tobiah would have said, is everybody.' },
    inh_sold:{ title:'Sold Off', hint:'Win without the station.', text:'You never saw Haven\'s Rest. It\'s a scrap yard now, they say. Sometimes you wonder.' } },
  medal:'inh_home',
  chatter:S => S.f.gone ? null : ['The tenants at Haven\'s Rest send a picture: they\'ve painted the hall.', '{crew} has drawn up plans for a garden at Haven\'s Rest.', 'A letter from Uncle Tobiah\'s lawyer: more paperwork.'],
  boss:(e, ph, S, H) => { if(S.f.gone) return;
    if(S.n >= 4 && ph===0) H.heal(8, 'A supply shuttle from Haven\'s Rest arrives mid-battle with hull plating and sandwiches.');
    if(S.f.secret && ph===1) H.hurt(3, 'Uncle Tobiah\'s secret, a mothballed defence cannon from Haven\'s Rest, fires one perfect shot.');
    if(S.f.shared && ph===2) H.hurt(2, 'Cousin Lucan\'s gunships arrive. Late, but loud.'); } };
SE('inh_will', 'The will', 'station', `The lawyer, a nervous Sloog, reads the will: your great-uncle Tobiah has left you Haven\'s Rest, a tiny station two beacons off your route, "for when the war is over".`, [
  ch('Visit it (1 fuel).', { text:'It\'s small, cold and full of dust. It has a view of a ringed planet that takes your breath away.', a:{ n:1, v:1, note:'In sector 2 the captain inherited Haven\'s Rest, a tiny station, from a great-uncle called Tobiah.' } }, { req:{ fuel:1 }, cost:{ fuel:1 } }),
  ch('Sell it, sight unseen.', { text:'The buyer pays at once. Suspiciously quickly.', scrap:60, a:{ gone:true } }) ]);
SE('inh_fix', 'Repairs', 'station', `Haven\'s Rest needs a reactor. A good one.`, [
  ch('Donate a bar of your own reactor.', { text:'Your ship is a bit weaker. Haven\'s Rest hums for the first time in years.', reactor:-1, a:{ n:2 } }),
  ch('Pay for parts (30 scrap).', { text:'It\'s a start.', a:{ n:1 } }, { req:{ scrap:30 }, cost:{ scrap:30 } }),
  ch('Leave it for later.', { text:'Later.', a:{} }) ]);
SE('inh_tenants', 'Squatters', 'station', `Haven\'s Rest has squatters: a family of Enjinn mechanics. They\'ve been fixing it up.`, [
  ch('Let them stay, as caretakers.', { text:'They\'re so grateful they finish the plumbing.', a:{ n:1, v:1 } }),
  ch('Hire one of them for your crew.', { text:'The eldest daughter packs a toolbox.', crew:'enjinn', a:{} }),
  ch('Evict them.', { text:'They go. The station feels emptier than before.', a:{} }) ]);
SE('inh_cousin', 'Cousin Lucan', 'fleet', `A cousin you\'ve never heard of, Lucan, arrives with a lawyer and three gunships. "Haven\'s Rest is mine."`, [
  ch('Fight for it.', { text:'Lucan\'s lawyer is the one with the biggest gun.', fight:'pyrate_gunship', afterWin:{ text:'Lucan withdraws his claim, in writing, from a lifeboat.', a:{ n:1 } } }),
  ch('Share it with him.', { text:'Lucan is so surprised he agrees.', a:{ v:1, f:'shared' } }),
  ch('Let him have it.', { text:'Lucan takes it. He doesn\'t say thank you.', a:{ gone:true } }) ]);
SE('inh_letter', 'A letter', 'station', `Tucked in Haven\'s Rest\'s safe is a letter from Uncle Tobiah: "If you\'re reading this, you came. Good. The station has one secret. Look under the floor of the observation deck."`, [ ch('Look.', { text:'Under the floor: a mothballed defence cannon, and a box of useful things.', augment:'random', a:{ n:1, f:'secret' } }) ]);
SE('inh_ready', 'Nearly done', 'station', `Haven\'s Rest is nearly ready to live in.`, [
  ch('Fit the last part (2 drone parts).', { text:'The lights come on, all of them.', a:{ n:1, f:'done' } }, { req:{ parts:2 }, cost:{ parts:2 } }),
  ch('It\'ll do.', { text:'It will.', a:{} }) ]);

/* ---------------- 19. The Double ---------------- */
ARC2.double = { name:'The Double', who:'your double', count:'Clues', color:'#b48cff', blurb:'Someone with your face is one beacon ahead of you, signing your name to everything.',
  hale:'"Strange thing. You signed for this ship twice. Once yesterday, once today. I assume one of those was a joke."',
  roll:(S, r) => { S.t = pickT(r, 3); },
  beats:['dbl_seen', 'dbl_tabs', S => 'dbl_face' + S.t, S => S.f.caught ? null : 'dbl_swap', S => S.f.clone || S.f.mirror || S.f.hired ? 'dbl_eve' : null],
  final:() => null,
  ending:S => S.f.decoy || S.f.mirror ? 'dbl_two' : S.f.caught ? 'dbl_caught' : 'dbl_seeing',
  endings:{ dbl_two:{ title:'Two of a Kind', hint:'Win with your double on your side.', text:'There are two of you at the victory parade. Nobody can tell which one gets the medal. You decide to share it.' },
    dbl_caught:{ title:'Accept No Substitutes', hint:'Win after stopping your double.', text:'There is only one of you. You check the mirror every morning anyway, just in case.' },
    dbl_seeing:{ title:'Seeing Double', hint:'Win with your double still at large.', text:'Somewhere out there, someone with your face is running up bar tabs. The bills keep coming. Some of them are quite impressive.' } },
  medal:'dbl_two',
  chatter:S => ['A station owner waves: "Back again, Captain?"', '{crew} keeps staring at you, comparing.', 'Another bar tab arrives in your name.'],
  boss:(e, ph, S, H) => {
    if(S.f.decoy && ph===0) H.ion('weapons', 6, 'There are two of your ship. The Flaggship\'s gunners can\'t decide which to shoot, and shoot neither.');
    if(S.f.mirror && ph===1) H.hurt(4, 'Your double, from the pyrate universe, does something reckless and brilliant to the Flaggship\'s hull.');
    if((S.f.close || S.f.hired) && ph===0) H.shield(2, 'Your double knows exactly what you\'ll do next, and has the shields ready.'); } };
SE('dbl_seen', 'Back again?', 'station', `The dock master greets you warmly. "Back again, Captain? You left an hour ago." Someone with your face is one beacon ahead of you.`, [
  ch('Follow the trail.', { text:'Your face has been everywhere. You have apparently been very busy.', a:{ n:1, note:'In sector 2 the captain learned someone with their face was flying one beacon ahead.' } }),
  ch('Ignore it.', { text:'It\'s probably nothing. It is not nothing.', a:{ note:'In sector 2 the captain learned someone with their face was flying one beacon ahead.' } }) ]);
SE('dbl_tabs', 'Bar tabs', 'station', `Your double has been busy: bar tabs in your name, a borrowed shuttle and a promise to deliver forty goats.`, [
  ch('Pay the tabs (20 scrap).', { text:'The barkeeps like you now. Both of you.', a:{ v:1 } }, { req:{ scrap:20 }, cost:{ scrap:20 } }),
  ch('Deliver the goats (1 fuel).', { text:'The farmer pays well. The goats are not pleased.', scrap:25, a:{ n:1 } }, { req:{ fuel:1 }, cost:{ fuel:1 } }),
  ch('Refuse to pay a thing.', { text:'Several bars ban you. Possibly both of you.', a:{} }) ]);
SE('dbl_face0', 'Face to face', 'station', `You corner your double in a cargo bay. It smiles your smile, then melts into a sheepish Sloog. "Name\'s Flick. Your face opens a lot of doors, Captain."`, [
  ch('Hire Flick.', { text:'Flick is a very good spy, and an even better liar.', j:{ race:'sloog', name:'Flick', quirk:'gambler' }, a:{ f:'hired', note:'The captain\'s double turned out to be Flick, a shape-shifting Sloog, who joined the crew.' } }),
  ch('Hand him to the station police.', { text:'There\'s a reward.', scrap:30, a:{ f:'caught' } }),
  ch('Let him go.', { text:'"I owe you one," says Flick, with your face.', a:{ v:1 } }) ]);
SE('dbl_face1', 'Face to face', 'ship', `Your double stands in a Rebuff uniform, wearing your face badly, like a coat that doesn\'t fit. "I\'m what they grew to replace you," it says. "I don\'t want to be."`, [
  ch('Take it with you.', { text:'It sits in the corner of the bridge, learning how to be someone.', a:{ f:'clone', v:1, note:'The captain\'s double was a Rebuff clone. The captain took it aboard.' } }),
  ch('Fight it.', { text:'It doesn\'t want to fight. It does anyway.', fight:'rebuff_cloaker', afterWin:{ text:'The clone\'s ship drifts, empty.', a:{ f:'caught' } } }) ]);
SE('dbl_face2', 'Face to face', 'star', `Your double steps out of a shimmer in space: you, from a universe where you became a pyrate. "Nice ship," says the other you. "Mine\'s bigger."`, [
  ch('Trade stories.', { text:'You stay up all night. The other you has had a much more exciting life, and is very honest about which bits were mistakes.', xp:{ skill:'combat', amt:20 }, a:{ v:2, f:'mirror', note:'The captain met a version of themselves from another universe.' } }),
  ch('Duel.', { text:'The other you grins. "Thought you\'d say that."', fight:'pyrate_gunship', afterWin:{ text:'The other you vanishes back through the shimmer, laughing.', a:{ f:'caught' } } }) ]);
SE('dbl_swap', 'Two at breakfast', 'ship', `In the morning, there are two of you at breakfast. The crew have to work out which is real.`, [
  chc('Let them ask a question only you would know.', .7, { text:'You get it right. The other you gets it hilariously wrong.', a:{ v:1 } }, { text:'You both get it wrong. The crew are deeply unsettled.', a:{ f:'muddle' } }),
  ch('Shake hands and laugh.', { text:'Breakfast is very strange, and very good.', a:{ v:1 }, h:10 }) ]);
SE('dbl_eve', 'An offer', 'fleet', `Your double offers to fly a decoy course at the Flaggship.`, [
  ch('"Do it."', { text:'"See you on the other side," you both say.', a:{ f:'decoy' } }),
  ch('"Stay close."', { text:'Two of you on one bridge. The crew find it very reassuring, and very weird.', a:{ f:'close' } }) ]);

/* ---------------- 20. The Song in the Static ---------------- */
ARC2.song = { name:'The Song in the Static', who:'the singer', count:'Verses heard', color:'#5fd3e6', blurb:'One of your crew can hear a song in the static. Nobody else can. Where it leads changes every time.',
  hale:'"Comms report a strange harmonic on the long bands near your route. Probably nothing. Do tell me if anyone starts humming."',
  roll:(S, r, g) => { S.t = pickT(r, 3); rollLead(S, r, g); },
  beats:['song_first', S => leadAlive(S) ? 'song_verse' : null, S => 'song_source' + S.t, S => leadAlive(S) ? 'song_night' : null, 'song_last'],
  final:() => null,
  ending:S => S.f.friend || S.f.saved ? 'song_answered' : S.f.turned || S.f.broken ? 'song_record' : 'song_silence',
  endings:{ song_answered:{ title:'The Song Answered', hint:'Win after answering the song.', text:'The one who heard it first never stops hearing the song. Now, sometimes, the rest of the crew hear it too.' },
    song_record:{ title:'Broken Record', hint:'Win after stopping the song.', text:'The static is just static again. The one who heard it sleeps through the night for the first time in months.' },
    song_silence:{ title:'Silence', hint:'Win without finding the singer.', text:'The song fades as the war ends. Nobody ever finds out who was singing.' } },
  medal:'song_answered',
  chatter:S => !leadAlive(S) ? null : ['{lead} is humming again.', '{lead}: "It\'s changed key. Can\'t you hear it?"', 'Nobody else can hear the song. Everybody has started listening anyway.'],
  boss:(e, ph, S, H) => {
    if(S.f.friend && ph===0) H.ion('shields', 8, 'The vast singer sings one long note at the Flaggship. Its shields shatter like glass.');
    if((S.f.saved || S.f.marked) && ph===1) H.heal(5, 'A shuttle from the Meridian\'s woken colonists arrives with spares.');
    if(S.f.turned && ph===0) H.ion('weapons', 6, 'The Flaggship\'s gunners hear the song now. They stop to listen.'); } };
SE('song_first', 'A tune', 'ship', `{lead} keeps humming a tune nobody else knows. "It\'s on the static," they say. "Can\'t you hear it?" Nobody can.`, [
  ch('Record the static.', { text:'The recording sounds like static. {lead} says it\'s the most beautiful thing they\'ve ever heard.', a:{ n:1, note:'In sector 2, {lead} began hearing a song in the static that nobody else could hear.' } }),
  ch('Send {lead} to the medbay.', { text:'The medbay finds nothing wrong. {lead} goes on humming.', a:{ v:-1, note:'In sector 2, {lead} began hearing a song in the static that nobody else could hear.' } }) ]);
SE('song_verse', 'A verse', 'nebula', `The song has words now. Coordinates, {lead} thinks.`, [
  ch('Follow them (1 fuel).', { text:'The coordinates lead to a wreck full of salvage, as if the song were saying thank you.', scrap:20, a:{ n:1 } }, { req:{ fuel:1 }, cost:{ fuel:1 } }),
  ch('Not yet.', { text:'{lead} looks disappointed.', a:{} }) ]);
SE('song_source0', 'The Meridian', 'wreck', `The song leads to the Meridian, a colony ship lost eighty years ago. Its colonists are still in cold sleep. The song is its distress call, played over and over for eighty years.`, [
  ch('Tow it somewhere safe (2 fuel).', { text:'It takes a day. The Meridian\'s computer plays one last verse, and goes quiet.', a:{ f:'saved', v:2, note:'The song led the crew to the Meridian, a colony ship lost eighty years ago, and they towed it to safety.' } }, { req:{ fuel:2 }, cost:{ fuel:2 } }),
  ch('Mark it for rescue.', { text:'A rescue ship is on its way. The song gets quieter, and happier.', a:{ f:'marked', v:1 } }) ]);
SE('song_source1', 'The singer', 'star', `The song leads to empty space. Then the empty space looks back. Something vast and gentle has been singing to {lead}, because {lead} was the only one listening.`, [
  ch('Sing back.', { text:'The whole crew sings back, badly. The vast thing seems to like it.', a:{ f:'friend', v:2, note:'The song led to something vast and gentle in empty space. The crew sang back.' }, h:20 }),
  ch('Leave, quietly.', { text:'The song follows you for a while, then fades.', a:{} }) ]);
SE('song_source2', 'The transmitter', 'ship', `The song leads to a Rebuff transmitter, broadcasting a tune built to make crews turn on their captains. {lead} has been fighting it alone.`, [
  ch('Destroy it.', { text:'The transmitter has guards.', fight:'rebuff_scout', afterWin:{ text:'Silence. {lead} cries with relief.', a:{ f:'broken' } } }),
  chc('Reverse the signal.', .5, { text:'Now it\'s playing to the Rebuff.', a:{ f:'turned' } }, { text:'It goes wrong. The crew hear the song for one terrible hour, then you smash it.', crewHurt:20, a:{ f:'broken' } }) ]);
SE('song_night', 'A night off', 'ship', `{lead} asks for a night off, to listen properly. Just once.`, [
  ch('Grant it.', { text:'{lead} comes back in the morning, rested and smiling.', crewHeal:30, a:{ v:1 } }),
  ch('You need them on duty.', { text:'{lead} nods, and hums on watch.', a:{} }) ]);
SE('song_last', 'A warning', 'nebula', `The song changes key as you near the last sector. It sounds like a warning, {lead} says.`, [ ch('Listen to it.', { text:'The song maps the sector, verse by verse.', reveal:true, a:{ n:1 } }) ]);

/* ---------------- registration ---------------- */
(function(){
  const walk = (e, beat) => { if(!e || typeof e!=='object') return;
    if(e.a || e.h || e.j || beat){ e.cmp = Object.assign({}, e.cmp || {}); if(e.a){ e.cmp.arc = e.a; delete e.a; } if(e.h){ e.cmp.hearts = e.h; delete e.h; } if(e.j){ e.cmp.join = e.j; delete e.j; } if(beat) e.cmp.beat = true; }
    if(e.afterWin) walk(e.afterWin, false); };
  for(const id in EV2){ const ev = EV2[id]; const beat = !ev.fin; delete ev.fin;
    for(const c of ev.choices){ walk(c.effect, beat); walk(c.success, beat); walk(c.fail, beat); } }
  Object.assign(BASE.events, EV2);
  for(const id in ARC2){ const A = ARC2[id]; ARCS[id] = A; ARC_IDS.push(id);
    for(const k in A.endings) ARC_ENDINGS[k] = Object.assign({ arc:id }, A.endings[k]);
    if(A.medal && A.endings[A.medal]) ACHIEVEMENTS.push({ id:'end_' + A.medal, name:A.endings[A.medal].title, desc:A.endings[A.medal].hint }); }
})();
/* {lead}: the crew member a story is about */
function arcLeadName(){ const S = G && G.arcS; return (S && S.p) || 'your pilot'; }
function arcPatchFill(){ if(typeof fillText!=='function' || fillText._lead) return; const f = fillText;
  fillText = function(t, cx){ return f(String(t==null ? '' : t).replace(/\{lead\}/g, arcLeadName()), cx); }; fillText._lead = true; }
if(typeof window!=='undefined' && window.addEventListener) window.addEventListener('load', arcPatchFill);
{ const _arcRS = arcRunStart; arcRunStart = function(){ arcPatchFill(); return _arcRS.apply(this, arguments); }; }
