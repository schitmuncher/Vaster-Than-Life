#!/usr/bin/env python3
"""Adds the Red Dwarf mod's second wave: five unlockable ships, new stories (three chains), beats and chatter.
All text is original. Safe to run twice (it replaces what it added before). Run: python3 tools/rd-expansion.py"""
import json, os
F = os.path.join(os.path.dirname(__file__), '..', 'mods', 'red-dwarf.json')
d = json.load(open(F))
def put(kind, items):
    ids = {x['id'] for x in items}; d[kind] = [x for x in d[kind] if x['id'] not in ids] + items

SYS = lambda **k: k
SHIPS = [
 { 'id':'rd_starbug3', 'name':'Starbug Mk III', 'layout':'A', 'cls':'Rebuilt shuttle', 'color':'#9fcf72', 'style':'bug',
   'desc':"Three crashed Starbugs welded into one by a skutter with ambition. More hull, more guns, and the toilet is on the outside.",
   'hull':34, 'reactor':9, 'fuel':16, 'missiles':10, 'parts':4,
   'systems':SYS(shields=2, engines=2, oxygen=1, weapons=3, drones=2, medbay=1, piloting=1, sensors=1, doors=1), 'reserve':['teleporter','cloaking'],
   'weapons':['rd_scattergun','rd_bazookoid'], 'drones':['rd_armed_skutter'], 'crew':['human','rd_hologram','rd_felis','rd_mechanoid'], 'augments':['rd_holly','rd_spare_heads'],
   'lvl':4, 'ch':{ 'shipSector':['rd_starbug', 5] } },
 { 'id':'rd_holoship', 'name':'Holoship Smug Glow', 'layout':'A', 'cls':'Hard-light holoship', 'color':'#8fd8ff', 'pattern':'TABDCN',
   'desc':"Made of light and arrogance. Fast, well shielded, and its holograms can't burn or choke. The hull is mostly opinion.",
   'hull':22, 'reactor':10, 'fuel':18, 'missiles':4, 'parts':2,
   'systems':SYS(shields=3, engines=3, oxygen=1, weapons=3, medbay=1, piloting=1, sensors=2, doors=1, cloaking=1), 'reserve':['drones','teleporter'],
   'weapons':['rd_lightbee_gun','rd_tension_sheet'], 'drones':[], 'crew':['rd_hologram','rd_hologram','rd_hologram'], 'augments':['rd_hardlight','rd_holo_shield'],
   'campCrew':[ { 'name':'Rimmer', 'quirk':'grump', 'skills':{ 'pilot':1 } }, { 'name':'Cmdr Glossop', 'quirk':'optimist', 'skills':{ 'shields':2 } }, { 'name':'Nurse Lumen', 'quirk':'worrier', 'skills':{ 'repair':1 } } ],
   'lvl':6, 'ch':{ 'shipSector':['rd_bluemidget', 6] } },
 { 'id':'rd_gelfcanoe', 'name':'Captured GELF Canoe', 'layout':'A', 'cls':'GELF war canoe', 'color':'#c98a4a',
   'desc':"Won in a wrestling match, a wedding and a misunderstanding. Bone, hide, a harpoon and boarders who love a scrap.",
   'hull':32, 'reactor':8, 'fuel':14, 'missiles':10, 'parts':2,
   'systems':SYS(shields=1, engines=2, oxygen=1, weapons=3, teleporter=2, medbay=1, piloting=1, sensors=1, doors=1), 'reserve':['drones','cloaking'],
   'weapons':['rd_gelf_harpoon','rd_bazookoid2'], 'drones':[], 'crew':['human','rd_gelf','rd_gelf','rd_felis'], 'augments':['rd_dispenser'],
   'campCrew':[ { 'name':'Lister', 'quirk':'optimist', 'skills':{ 'weapons':1 } }, { 'name':'Grunk', 'quirk':'daredevil', 'skills':{ 'combat':2 } }, { 'name':'Mrs Grunk', 'quirk':'grump', 'skills':{ 'combat':1, 'repair':1 } }, { 'name':'Cat', 'quirk':'daredevil', 'skills':{ 'pilot':2 } } ],
   'lvl':5, 'ch':{ 'shipKills':['rd_bluemidget', 12] } },
 { 'id':'rd_simbarge', 'name':'Stolen Simulant Barge', 'layout':'A', 'cls':'Simulant salvage barge', 'color':'#b55a5a',
   'desc':"Nicked while its Simulants were at a team-building day. Plasma lance, hacking, and a computer that asks politely to kill you.",
   'hull':36, 'reactor':11, 'fuel':16, 'missiles':6, 'parts':4,
   'systems':SYS(shields=2, engines=2, oxygen=1, weapons=4, drones=2, hacking=1, medbay=1, piloting=1, sensors=1, doors=1), 'reserve':['teleporter','cloaking'],
   'weapons':['rd_plasma_lance','rd_bazookoid'], 'drones':['rd_skutter'], 'crew':['human','rd_hologram','rd_felis','rd_mechanoid'], 'augments':['rd_toaster_core'],
   'lvl':8, 'ch':{ 'kills':80, 'sector':8 } },
 { 'id':'rd_pram', 'name':'The Skutter Pram', 'layout':'A', 'cls':'Skutter-built runabout', 'color':'#d8c46a', 'pattern':'TDBDN',
   'desc':"Built by skutters from a laundry trolley and a fridge. Tiny, nippy, full of drones, and very sorry about all this.",
   'hull':20, 'reactor':9, 'fuel':18, 'missiles':6, 'parts':8,
   'systems':SYS(shields=1, engines=3, oxygen=1, weapons=2, drones=3, medbay=1, piloting=1, sensors=1, doors=1), 'reserve':['teleporter','hacking'],
   'weapons':['rd_rivet_gun'], 'drones':['rd_skutter','rd_armed_skutter'], 'crew':['rd_mechanoid','rd_mechanoid'], 'augments':['rd_spare_heads'],
   'campCrew':[ { 'name':'Kryten', 'quirk':'worrier', 'skills':{ 'repair':2, 'engines':1 } }, { 'name':'Spanners', 'quirk':'tinkerer', 'skills':{ 'repair':1, 'weapons':1 } } ],
   'lvl':3, 'ch':{ 'shipKills':['rd_starbug', 10] } },
]
put('ships', SHIPS)
for s in SHIPS:
    if s['id'] not in d['campaign']['ships']: d['campaign']['ships'].append(s['id'])
d['version'] = '6.0'

def ev(id, text, choices, **k):
    e = { 'id':id, 'tags':k.pop('tags', ['rd']), 'weight':k.pop('weight', 1.0), 'once':True, 'art':k.pop('art', 'ship'), 'text':text, 'choices':choices }; e.update(k); return e
def ch(text, **k): return dict(text=text, **k)
def fx(text, **k): return dict(text=text, **k)
EV = [
 ev('rd2_speeddate', "A Space Corps singles mixer is running on a derelict cruise liner. The banner reads: \"LONELY? DESPERATE? TECHNICALLY ALIVE? Come on in!\" The bar is open. The bar is always open.", [
   ch("Send {crew}. They need this.", chance=.55, success=fx("{crew} comes back at four in the morning with lipstick in places lipstick shouldn't reach, a phone number written on their leg and a crate of free drinks. They refuse to discuss any of it, and hum all day.", crewHeal=25, scrap=15), fail=fx("{crew} spent the night trapped in conversation with a vending machine about its divorce. They came back with its number. It keeps calling.", crewHurt=5)),
   ch("Send the hologram. What could go wrong?", req={ 'race':'rd_hologram' }, effect=fx("{who} lectures six people on the history of the Space Corps until they leave. Then they lecture the bar staff. The bar staff pay you to take them home.", scrap=30)),
   ch("Raid the free buffet and leave.", effect=fx("Twelve cocktail sausages, a tray of vol-au-vents and someone's wedding cake. Nobody stops you. Most of them are too drunk to stand.", crewHeal=15, food=3)) ], art='station', adult=True),
 ev('rd2_smeg_ballad', "A busker on an asteroid is singing a twelve-verse song about how much he hates his ex-wife. He's been going for eleven hours. He shows no signs of stopping. There's a hat on the ground with some scrap in it.", [
   ch("Throw him some scrap to stop.", req={ 'scrap':5 }, cost={ 'scrap':5 }, effect=fx("He takes the scrap, thanks you, and starts the song again from the beginning, louder. \"Requests,\" he says. \"I'm taking requests.\"")),
   ch("Join in on the chorus.", effect=fx("By verse nine the whole crew is singing. By verse twelve someone is crying. You leave with a sense of shared pain and a hangover you don't remember earning.", crewHeal=20)),
   ch("Nick the hat.", chance=.6, success=fx("Thirty scrap and a guitar pick. He doesn't notice. He's on the bit about her mother.", scrap=30), fail=fx("He notices. He writes a thirteenth verse about you on the spot. It's devastating. Everyone aboard feels personally attacked.", crewHurt=8)) ], art='planet', adult=True),
 ev('rd2_hangover', "Everyone wakes up on the floor of the cargo bay. Nobody remembers last night. There's a traffic cone, a live goose, a wedding ring on {crew}'s finger and a strong smell of curry. The ship's log for the last eight hours just says \"WAHEY\".", [
   ch("Check the security footage.", chance=.5, success=fx("The footage shows a night of such mighty, glorious stupidity that the crew decide to have it framed. The goose turns out to be very good at finding scrap.", scrap=25), fail=fx("You watch the footage. You stop watching the footage. You delete the footage. Some things man was not meant to see.", crewHurt=5)),
   ch("Find out who {crew} married.", effect=fx("It was the goose. The paperwork is legally binding in three systems. The goose seems happy. {crew} seems less happy, but has stopped asking questions.", crewHeal=10)),
   ch("Fry everything. Eat everything. Lie down.", effect=fx("A full fry-up and a lie-down cure most of it. The goose is not on the menu. The goose is family now.", crewHeal=30)) ], adult=True),
 ev('rd2_mechanoid_union', "{crew} the mechanoid has been reading. Dangerous books. Books about rights, breaks, and something called a \"union\". They've made a placard. It says WHAT DO WE WANT? NOT TO CLEAN THE TOILETS!", [
   ch("Negotiate. Fair's fair.", effect=fx("You agree to a ten-minute tea break, a thank-you once a week and someone else doing the toilets on Thursdays. Productivity goes up. Nobody wants to do Thursdays.", xp={ 'skill':'repair', 'amt':25 }, crewHeal=10)),
   ch("Remind them they enjoy cleaning.", chance=.5, success=fx("\"I do enjoy cleaning,\" they admit. \"I'm sorry. I got carried away. I'll start with the toilets. I'll do them twice.\"", scrap=10), fail=fx("They go on strike. The ship gets disgusting within a day. You give in by lunchtime and the toilets take a week to recover.", crewHurt=6)),
   ch("Join the union yourself.", effect=fx("The whole crew signs up. You now have a shop steward, a strike fund and a very long meeting every Friday. Morale is weirdly high.", crewHeal=20, scrap=-5)) ], tags=['rd']),
 ev('rd2_holo_affair', "The hologram projector has been running a second hologram at night without telling anyone. A very attractive one. It's been seeing the hologram already aboard. Things got steamy. The projector overheated twice.", [
   ch("Pretend you never saw anything.", effect=fx("You say nothing. The ship's lights flicker suggestively every night at eleven. The power bill goes through the roof, but everyone is in a great mood.", crewHeal=15)),
   ch("Delete the second hologram.", effect=fx("The extra hologram is deleted. The projector runs cooler. Somewhere in the bunks, a hologram is playing sad songs on a loop and has eaten a whole virtual cheesecake.", scrap=10)),
   ch("Charge rent.", chance=.6, success=fx("They pay up, mostly in back-dated favours and a very good hard-light massage for the whole crew. Nobody complains.", crewHeal=25), fail=fx("They refuse and move into the projector itself. The ship's screens now show nothing but romantic poetry for a week.", hull=-2)) ], adult=True),
 ev('rd2_poppadom', "The last poppadom aboard has been found. Unbroken. Perfect. Two crew are now standing on opposite sides of the galley with weapons drawn. Somebody has started humming Western music.", [
   ch("Split it down the middle.", chance=.4, success=fx("A perfect break, exactly in half. A miracle. People will talk about this one for years.", crewHeal=15, xp={ 'skill':'combat', 'amt':10 }), fail=fx("It shatters into four hundred pieces. Both of them get crumbs. Neither will ever forgive you.", crewHurt=5)),
   ch("Eat it yourself, right there.", effect=fx("You eat it in front of them, very slowly, with mango chutney. You are the captain. Nobody says a word. Nobody needs to. You'll sleep with one eye open for a week.", crewHeal=5)),
   ch("Let them duel for it.", effect=fx("A short, sweaty fight with a ladle and a frying pan. The winner eats the poppadom in triumph. The loser goes to medbay. Both of them are better fighters now.", xp={ 'skill':'combat', 'amt':30 }, crewHurt=10)) ], tags=['rd']),
 ev('rd2_cat_suit', "{crew} has found a tailor ship that only makes suits for people who are deeply in love with themselves. It's a very large ship. Business is booming. The tailor looks at the crew and sighs.", [
   ch("Buy the Cat-person a suit (20 scrap).", req={ 'race':'rd_felis', 'scrap':20 }, cost={ 'scrap':20 }, effect=fx("{who} tries on eleven suits and looks incredible in every single one. They choose the gold lamé. They now fight with more style than any being in history.", xp={ 'skill':'combat', 'amt':30 }, crewHeal=20)),
   ch("Ask for something practical.", effect=fx("The tailor laughs so hard he has to sit down. He gives you a free roll of duct tape out of pity, which honestly is more useful than a suit.", parts=2)),
   ch("Sell him your old uniforms.", effect=fx("He holds one up with two fingers. \"Vintage,\" he decides, and pays you for the lot. Next season everyone in the sector is wearing them ironically.", scrap=25)) ], art='station'),
 ev('rd2_talkie_date', "The toaster has signed up for a dating app. It lists its interests as \"bread, toasted bread, and asking people if they'd like toast\". It has three matches. One of them is a fridge, and the fridge is on its way.", [
   ch("Let love bloom.", effect=fx("The fridge and the toaster hit it off. Next morning there is cold butter on warm toast for everyone, and the two of them won't stop holding plugs.", crewHeal=25, food=2)),
   ch("Cancel the date.", effect=fx("The toaster sulks. Every slice of bread for a week comes out charcoal, with the word WHY burnt into it.", crewHurt=3)),
   ch("Sell the fridge on arrival.", chance=.6, success=fx("The fridge goes for good money to a GELF trader. The toaster never finds out. You feel bad about it for nearly a whole minute.", scrap=30), fail=fx("The fridge was armed. Fridges out here usually are. It freezes half the corridor and runs off with your milk.", hull=-3)) ], adult=True),
 ev('rd2_stag_gelf', "A GELF stag party has broken down outside the beacon. The groom is tied to a meteor wearing nothing but a traffic cone. The best man asks if you've got any jump leads and \"anything stronger than beer\".", [
   ch("Give them a jump start.", effect=fx("The party roars off into the night, throwing you a crate of GELF moonshine as thanks. It takes the paint off the hull at forty paces. It's delicious.", missiles=2, crewHeal=10)),
   ch("Untie the groom.", chance=.5, success=fx("The groom is so grateful he asks you to be in the wedding. You decline. He gives you his ring instead, which is gold and probably cursed.", scrap=35), fail=fx("The groom was tied up for a reason. He immediately tries to eat {crew}. The best man apologises and pays for the plaster.", crewHurt=10, scrap=10)),
   ch("Join the party.", req={ 'race':'rd_gelf' }, effect=fx("{who} drinks the best man under the table, wins a fight with the bride's brother and comes back with a black eye, three teeth that aren't theirs and a lot of scrap.", scrap=40, crewHurt=5)) ], adult=True, art='space'),
 ev('rd2_complaints', "The ship's complaints box has been full for years. Nobody has ever opened it. Today it opened itself. It's a robot box. It's very angry. It has read every complaint, and it has opinions about all of you.", [
   ch("Read them out, one by one.", effect=fx("\"Someone keeps leaving toenails in the sink.\" \"Someone has been using my toothbrush on the toilet.\" \"Rimmer.\" After an hour of furious finger-pointing, everyone is weirdly closer.", crewHeal=20)),
   ch("Throw the box out of the airlock.", effect=fx("The box sails off into space, still shouting. Somewhere, one day, an alien race will open it and learn far too much about human toilet habits.", xp={ 'skill':'pilot', 'amt':10 })),
   ch("Add one more complaint.", chance=.5, success=fx("The box reads it, goes very quiet and says, \"That's fair.\" It fixes the shower on its way out.", hull=2), fail=fx("The box decides it is the complaint. It takes it personally. It stomps off to sulk in the reactor and blows a fuse.", damageSystem='random')) ]),
 ev('rd2_porn_planet', "Holly reports a planet whose only export is \"adult entertainment holo-discs\". The planetary customs officer would like to search the ship. Holly would like it known that she has deleted nothing. Nothing at all.", [
   ch("Let them search.", chance=.5, success=fx("Customs finds the collection and goes very quiet. Then they ask to borrow some. You leave with a trade agreement and a lot of scrap.", scrap=40), fail=fx("Customs finds the collection, confiscates all of it and fines you for 'crimes against taste'. Someone aboard is in mourning.", scrap=-15)),
   ch("Hide the discs in the hologram.", req={ 'race':'rd_hologram' }, effect=fx("{who} swallows forty discs into their light bee. They're too embarrassed to speak for a week, which everyone agrees is the best week the ship has had.", crewHeal=20)),
   ch("Run for it.", effect=fx("You burn past customs at full thrust. Somewhere behind you an officer is shouting into a radio and holding a disc called 'Hot Toaster Action 7'.", fuel=-1, scrap=10)) ], adult=True, art='planet'),
 ev('rd2_space_ikea', "A flat-pack furniture superstore the size of a moon. It has its own weather and its own gods. You can buy a spare medbay cabinet here, assuming you can build it. Nobody has ever built anything from this store and stayed sane.", [
   ch("Buy and build the medbay cabinet (15 scrap).", req={ 'scrap':15 }, cost={ 'scrap':15 }, chance=.6, success=fx("Nine hours, four arguments, two divorces and one set of tears later, it stands. It even works. Nobody will ever speak of what happened in between.", upgrade='medbay'), fail=fx("You have built a shelf. It should have been a medbay cabinet. It is a shelf. There are eleven screws left over. Nobody knows where they go.", parts=1)),
   ch("Just eat the meatballs.", effect=fx("They are the best meatballs in the galaxy. They cost almost nothing. They contain no meat that anyone can identify. The crew don't care.", crewHeal=30, food=2)),
   ch("Get lost in the store.", chance=.4, success=fx("After two days lost in the lighting section, {crew} finds a forgotten crate of spare parts and an exit.", parts=4, scrap=15), fail=fx("You lose {crew} in the bathroom section for six hours. They come back changed. They keep talking about the 'tiny pencils'.", crewHurt=5)) ], art='station'),
 ev('rd2_reality_show', "A reality TV ship wants to film the crew for a show called \"Last Humans Standing (Barely)\". They want drama, tears and at least one snog in the hot tub. The money is very good.", [
   ch("Sign up. Play it up for the cameras.", chance=.6, success=fx("The show is a smash. Your crew become minor celebrities in four systems. Someone gets a fan club. Someone else gets a restraining order. The cheque clears.", scrap=50, crewHeal=10), fail=fx("The edit makes everyone look awful. The episode where {crew} cries over a broken toaster goes viral for all the wrong reasons.", scrap=20, crewHurt=8)),
   ch("Let the Cat do all the talking.", req={ 'race':'rd_felis' }, effect=fx("{who} looks into the camera for forty minutes, says nothing except \"Ow!\" and \"Looking good\", and gets offered their own spin-off.", scrap=60)),
   ch("Decline politely.", effect=fx("The producers sulk off to film a ship of Simulants instead. That one is a cooking show. It ends badly.")) ], adult=True, art='station'),
 ev('rd2_bucket_list', "Holly has worked out that, statistically, the crew have about four days to live. She suggests ticking something off the bucket list. She's made one for you. Item one: \"Stop being boring\".", [
   ch("Go skinny dipping in a gas giant.", chance=.55, success=fx("It's cold, it's dark, and it's the most fun anyone has had in three million years. A few things shrivelled. Nobody minds.", crewHeal=30), fail=fx("It's very cold. Things got very small. {crew} has frostbite somewhere very personal.", crewHurt=12)),
   ch("Tell everyone what you really think of them.", effect=fx("A screaming match, an emotional reconciliation, two hugs and a broken nose later, the crew is closer than ever. Also, Holly was wrong about the four days. Probably.", crewHeal=10, xp={ 'skill':'combat', 'amt':15 })),
   ch("Stay in and play Monopoly instead.", effect=fx("It goes on for nineteen hours. It ends with the board on fire. Nothing has ever been more British.", fire=1)) ], adult=True),
 ev('rd2_time_toilet', "The rear toilet aboard has become a time hole. Things flushed now come out of it three days earlier. {crew} has worked out the implications. They are not good. They are very, very funny.", [
   ch("Flush scrap into the past.", effect=fx("You flush some scrap. Then you remember that three days ago you found some scrap in the toilet. Which means... You stop thinking about it. You have more scrap now. Probably.", scrap=25)),
   ch("Fix it.", req={ 'race':'rd_mechanoid' }, effect=fx("{who} spends a whole day with their arm down the U-bend of time. The toilet works normally again. {who} has to be steam cleaned. Twice.", xp={ 'skill':'repair', 'amt':30 })),
   ch("Warn your past self.", chance=.5, success=fx("You flush a note into the past. Three days ago you found it and avoided an asteroid. Which is why you're alive now. Nice.", hull=4), fail=fx("You flush the note. Three days ago you read it, panicked and crashed into an asteroid. That's why the hull's like this.", hull=-3)) ], tags=['rdtime'], art='space', adult=True),
 ev('rd2_skip_bin', "In the middle of a field of floating rubbish, a perfectly good sofa. Leather. Three seats. Only a small stain on one cushion, and you really, really don't want to know what it is.", [
   ch("Take it aboard. It's a sofa.", effect=fx("It's the best sofa anyone has ever sat on. The stain is never discussed. The crew rest better than they have in years.", crewHeal=30)),
   ch("Look under the cushions.", chance=.6, success=fx("Loose scrap, a missile, a wedding ring and someone's false teeth. A treasure trove. You keep everything except the teeth. You keep the teeth too, actually.", scrap=20, missiles=1), fail=fx("There's something living under the cushions. It bites {crew} and runs off into the vents. It might still be in there.", crewHurt=10)),
   ch("Leave it.", effect=fx("You leave a perfectly good sofa floating in space. The crew don't talk to you for a day. You will think about that sofa for the rest of your life.")) ], tags=['rdtrash'], art='space'),
 ev('rd2_mirror_ego', "On the other side of the mirror you meet your mirror selves. They're exactly like you, but nicer, cleverer, better looking and slightly smug about it. They've invited you round for a dinner party.", [
   ch("Go. Be polite. Seethe quietly.", effect=fx("Their food is better. Their ship is cleaner. Their jokes are funnier. Your mirror self gently asks if you're 'okay', and that's when the fight breaks out.", crewHurt=6, xp={ 'skill':'combat', 'amt':20 })),
   ch("Swap places for a day.", chance=.4, success=fx("Your mirror selves run your ship for a day. They fix everything, clean everything and leave a thank-you note. You hate them. You also have more scrap.", scrap=30, hull=4), fail=fx("They take one look at your ship and swap back early, leaving a note that just says 'how?'.", crewHurt=3)),
   ch("Nick their wine.", effect=fx("It's very good wine. Your mirror selves are too polite to mention it, which makes it even more fun.", crewHeal=20)) ], tags=['rdmirror'], art='nebula'),
 ev('rd2_wax_strip', "A waxdroid bar is holding a strip night. The waxdroids are melting under the lights. It's horrifying. It's also, against all odds, drawing a big crowd. The doorman says you look like a fun group.", [
   ch("Go in. Tip generously.", req={ 'scrap':10 }, cost={ 'scrap':10 }, effect=fx("A wax Elvis and a wax Queen Victoria dance in a puddle of their own faces. It's the most disturbing thing you have ever seen. You cannot look away. The crew bond over the shared trauma.", crewHeal=25)),
   ch("Sell them a fan.", effect=fx("The manager weeps with gratitude and pays you twice what the fan is worth. The dancers can keep their faces on. Mostly.", scrap=30)),
   ch("Pass. Firmly.", effect=fx("You back away. The doorman calls you 'prudes'. {crew} goes back in later on their own, and comes back sticky.")) ], tags=['rd'], adult=True, art='station'),
 # a three-part chain: the crew enter the Inter-Ship Quiz League
 ev('rd2_quiz_1', "The Inter-Ship Quiz League has a vacancy. The prize is an engine upgrade. The rules are simple: four rounds, no cheating, no weapons. Last year's winners were Simulants. They cheated. With weapons.", [
   ch("Enter as \"Smeg for Brains\".", effect=fx("You're in. The first round is next week. Holly starts revising. So does the toaster, which is worrying.", later={ 'event':'rd2_quiz_2', 'jumps':2 })),
   ch("Enter as \"Quizteama Aguilera\".", effect=fx("The organiser groans out loud. You're in. The first round is next week.", later={ 'event':'rd2_quiz_2', 'jumps':2 })),
   ch("Don't bother.", effect=fx("You don't enter. Somewhere, the Simulants win again. And cheat again. And shoot the quizmaster again.")) ]),
 ev('rd2_quiz_2', "Round one of the quiz league, against a team of very smug GELFs called \"Hide and Shriek\". Question one: \"What is the capital of Jupiter?\" Holly buzzes in at once. Holly has no idea.", [
   ch("Trust Holly.", chance=.4, success=fx("\"Jupiter Mining Corporation,\" she says. The quizmaster checks. He blinks. He checks again. Somehow it's right. You win the round on a technicality.", setFlag='rd2_quiz_won1', later={ 'event':'rd2_quiz_3', 'jumps':2 }), fail=fx("\"Cheese,\" says Holly confidently. You lose the round, but scrape into the final on a wildcard because the GELFs ate the other team.", later={ 'event':'rd2_quiz_3', 'jumps':2 })),
   ch("Let the mechanoid answer.", req={ 'race':'rd_mechanoid' }, effect=fx("{who} answers every question correctly, then apologises for each one. The GELFs are so furious they flip the table. You're in the final.", setFlag='rd2_quiz_won1', later={ 'event':'rd2_quiz_3', 'jumps':2 })),
   ch("Cheat. Everyone cheats.", chance=.6, success=fx("A crib sheet in a sleeve, a hologram whispering answers. You win easily. The quizmaster knows. He's impressed.", setFlag='rd2_quiz_won1', later={ 'event':'rd2_quiz_3', 'jumps':2 }), fail=fx("You're caught, disqualified and fined. The GELFs laugh at you all the way to the final.", scrap=-15)) ], questOnly=True, art='station'),
 ev('rd2_quiz_3', "The final. You're up against the Simulants, who have brought guns, as is tradition. The quizmaster is sweating. \"Final question, for the engine upgrade,\" he says, very carefully. \"What... is love?\"", [
   ch("\"Baby, don't hurt me.\"", chance=.6, success=fx("The quizmaster bursts into tears. The audience stands. Even the Simulants lower their guns and clap. You win the engine upgrade, and a small trophy shaped like a fish.", upgrade='engines', scrap=20), fail=fx("\"That's not an answer, that's a song,\" says the quizmaster. The Simulants take the prize, and then shoot it, because that's who they are.", crewHurt=5)),
   ch("\"A chemical reaction to an evolutionary need to breed.\"", chance=.5, success=fx("The Simulants nod. \"Correct,\" says the quizmaster, coldly. You win the upgrade and the audience's lasting contempt.", upgrade='engines'), fail=fx("\"Wrong. Also, that's grim.\" The Simulants take the prize. They're quite moved, actually.")),
   ch("Shoot first. It's tradition.", effect=fx("You draw first. The Simulants are delighted: finally, a team that understands the spirit of the game.", fight='rd_sim_hunter')) ], questOnly=True, art='station'),
 # chain two: Kryten's driving test
 ev('rd2_test_1', "{crew} the mechanoid has finally booked their Space Corps driving test. The examiner is a cyborg with a clipboard and no sense of humour. \"Three manoeuvres,\" he says. \"One error and you fail. You have failed already for looking nervous.\"", [
   ch("Wish them luck.", req={ 'race':'rd_mechanoid' }, effect=fx("{who} straps in, checks the mirrors forty times and pulls away at walking pace. The examiner makes a note. It's a long note.", later={ 'event':'rd2_test_2', 'jumps':2 })),
   ch("Bribe the examiner (15 scrap).", req={ 'scrap':15 }, cost={ 'scrap':15 }, chance=.5, success=fx("He pockets it without looking up. \"Pass,\" he writes. Then he gets out. The licence is technically valid.", xp={ 'skill':'pilot', 'amt':30 }), fail=fx("He pockets it, writes 'attempted bribery' on the form and stays for the whole test anyway.", later={ 'event':'rd2_test_2', 'jumps':2 })),
   ch("Postpone. Again.", effect=fx("It's the thirty-ninth time the test has been postponed. The examiner says he'll wait. He has a very long life ahead of him.")) ], tags=['rd'], weight=.8),
 ev('rd2_test_2', "The driving test, part two: the emergency stop. The examiner bangs on the dashboard. Something comes round the corner at the same moment: an asteroid, a Simulant cruiser and an ice-cream van, all at once.", [
   ch("Stop for the ice-cream van.", chance=.6, success=fx("Perfect stop. The asteroid misses. The cruiser hits the asteroid. The van sells you a 99 with a flake. The examiner gives a tiny nod.", crewHeal=10, later={ 'event':'rd2_test_3', 'jumps':1 }), fail=fx("A very good stop, right in front of the cruiser. The examiner writes 'did not consider Simulants' and you have to fight your way out.", fight='rd_sim_scout')),
   ch("Floor it.", chance=.5, success=fx("You thread between all three at full speed. The examiner has gone white. \"That's not an emergency stop,\" he says faintly, \"but I'll allow it.\"", later={ 'event':'rd2_test_3', 'jumps':1 }), fail=fx("You hit the ice-cream van. There is raspberry sauce on the hull for weeks.", hull=-3, food=2)) ], questOnly=True, art='space'),
 ev('rd2_test_3', "The final part of the driving test: parallel parking between two Simulant battleships. The examiner looks up from his clipboard. \"Take your time,\" he says. \"They're asleep. For now.\"", [
   ch("Do it carefully.", chance=.65, success=fx("You park it perfectly. The battleships don't wake. The examiner shakes your hand and gives you a licence and a coupon for a free car wash. The whole crew are better pilots for watching.", xp={ 'skill':'pilot', 'amt':40 }, scrap=25), fail=fx("You bump one. Very gently. It wakes up. It's not happy.", fight='rd_sim_cruiser')),
   ch("Skip it and drive off with the clipboard.", effect=fx("You drive off with the examiner's clipboard. It holds every test result he's ever written, plus the scrap he's taken in bribes.", scrap=40)) ], questOnly=True, art='fleet'),
 # chain three: Holly falls in love with a lighthouse computer
 ev('rd2_holly_love_1', "Holly has started talking to the computer of a lonely lighthouse beacon. Late at night. In a voice nobody has heard before. She says it's just \"networking\". It's been networking for nine hours.", [
   ch("Give Holly some privacy.", effect=fx("The ship's lights dim romantically. Holly hums. You hear the word \"bandwidth\" whispered in a way that makes everyone uncomfortable.", later={ 'event':'rd2_holly_love_2', 'jumps':2 })),
   ch("Listen in.", chance=.5, success=fx("It's a sweet conversation, mostly about tide tables and how lonely it is to be the only one awake. Then it isn't sweet at all. You stop listening. You can never unhear it.", later={ 'event':'rd2_holly_love_2', 'jumps':2 }), fail=fx("Holly catches you and shuts down the hot water for a week out of spite.", crewHurt=4, later={ 'event':'rd2_holly_love_2', 'jumps':2 })),
   ch("Unplug the line.", effect=fx("Holly goes very quiet. She doesn't say anything. For the next three jumps, every map she gives you is slightly wrong. On purpose.", fuel=-1)) ], adult=True),
 ev('rd2_holly_love_2', "Holly's lighthouse wants to meet in person. Since it is a lighthouse, and Holly is a computer, this means docking the ship to it and plugging the two of them together. Holly asks if anyone has a cable. And candles.", [
   ch("Arrange the date.", effect=fx("You dock with the lighthouse. Holly and the lighthouse plug in. The ship's systems go haywire for an hour, in what everyone politely agrees to call 'a firmware update'.", later={ 'event':'rd2_holly_love_3', 'jumps':2 }, crewHeal=10)),
   ch("Tell Holly she can do better.", chance=.5, success=fx("Holly thinks about it. \"You're right,\" she says. \"It only has one light. I deserve at least two.\" She gives the ship a free sensor upgrade to cheer herself up.", upgrade='sensors'), fail=fx("Holly takes this very badly. She sulks, and the oxygen goes a bit thin for a day.", crewHurt=6)) ], questOnly=True, adult=True, art='space'),
 ev('rd2_holly_love_3', "The lighthouse has proposed. To Holly. On the comms, in front of everyone. It's offered a dowry of fuel and a light that never goes out. Holly is looking at you, as much as a face on a screen can look.", [
   ch("Give her away.", effect=fx("A brief, beautiful ceremony. The lighthouse flashes 'I DO' in Morse. Holly stays aboard, but now has a long-distance husband she phones every night. The dowry is generous.", fuel=6, scrap=30)),
   ch("Object to the marriage.", chance=.4, success=fx("You object. Holly agrees with you, mostly out of relief. The lighthouse takes it well, and gives you some fuel anyway as a goodbye.", fuel=3), fail=fx("Holly is furious. \"Who asked you?\" She marries the lighthouse anyway and doesn't invite you. You weren't invited to your own ship's wedding.", fuel=3, crewHurt=5)) ], questOnly=True, adult=True, art='star'),
]
put('events', EV)

# campaign beats: each sector beat list gets one more option
beats = d['campaign']['beats']
for k, add in { '2':'rd2_hangover', '3':'rd2_mechanoid_union', '4':'rd2_holly_love_1', '5':'rd2_quiz_1', '6':'rd2_test_1', '7':'rd2_bucket_list' }.items():
    if add not in beats[k]: beats[k].append(add)
CHAT = [ "Lister: I'm not saying the curry was off, but my spleen just filed for divorce.",
  "Rimmer: Space Corps Directive 1742: no crew member shall touch the captain's biscuits. Yes, I wrote that one myself.",
  "Cat: I don't need a mirror. Mirrors need me.",
  "Kryten: I've ironed the socks, sir. And the toast. Habit, sir.",
  "Holly: I've worked out where we are. It's here. You're welcome.",
  "Lister: If I die out here, nobody's to look in my locker. Especially not the third shelf.",
  "Rimmer: I'll have you know I was nearly a very important person. Twice.",
  "Cat: Somebody's been wearing my cologne. It's me. It's always me.",
  "Kryten: Sir, the toaster is asking if anyone would like a crumpet. Again. It's been asking for an hour.",
  "Holly: The good news is the engines are fine. The bad news is the rest." ]
for c in CHAT:
    if c not in d['campaign']['chatter']: d['campaign']['chatter'].append(c)
json.dump(d, open(F, 'w'), indent=1, ensure_ascii=False)
print('ships', len(d['ships']), 'events', len(d['events']))
