'use strict';
/* =========================================================================
   The Archive: the galaxy's paperwork. Histories, leaflets, memos, adverts,
   letters and legends that unlock as you play (Record → Codex → Archive).
   Some open on their own (your first run, crewing with a people, crossing a
   sector, dying a lot); the rest are "found": fragments pulled from wrecks
   and quiet beacons. Also the radio: chatter overheard between jumps.
   Written for grown-ups with a British sense of humour; entries marked
   adult only appear with Settings → Grown-up humour on.
   Kept in PROFILE.lore { id: time } and PROFILE.loreRead { id: 1 }.
   ========================================================================= */
const LORE_CATS = [['basics', 'Start Here'], ['fed', 'The Fedoration'], ['reb', 'The Rebuff'], ['peoples', 'Peoples'], ['places', 'Places'], ['life', 'Everyday Life'], ['legends', 'Legends'], ['you', 'About You']];
/* u: when it opens. 'start' | 'found' (from wrecks) | { runs } { wins } { deaths } { reach } { race } { sector } { met } { kills } */
const LORE = [
/* ---------------- start here ---------------- */
{ id:'history', cat:'basics', u:'start', title:'A Short History of Everything (Abridged)', by:'From "The Galaxy for Beginners", 14th edition, with corrections',
  text:['In the beginning there was nothing, which a great many people found restful. Then there was a great deal of something, very quickly, and it has been noisy ever since.',
  'Life turned up on a number of worlds at once, as if it had heard there would be food. On most of them it crawled out of the sea, looked about, and immediately began arguing over who owned the beach.',
  'The humans of Old Earth were not the first to reach the stars, nor the cleverest, nor the best-looking. They were, however, the first to arrive at a meeting of other peoples carrying a flask of tea and a folding chair, and this made a strong impression. Within a century they had set up a committee. Within two, the committee had a committee. This is how the Fedoration began.',
  'For three hundred years the Fedoration kept the peace, mostly by making war so administratively complicated that nobody could be bothered. Then a group of officers decided they could be bothered, filled in no forms whatsoever, and left. They called themselves the Rebuff. Everyone agrees this was the most exciting thing to happen in centuries, and nearly everyone wishes it hadn\'t.',
  'That brings us more or less up to date. For the rest, see later editions, assuming there are any.'] },
{ id:'handbook', cat:'basics', u:'start', title:'The Courier\'s Handbook, Section 1: The Parcel', by:'Fedoration Courier Service, issued to all captains',
  text:['Congratulations on your appointment as a Courier of the Fedoration. You have been entrusted with The Parcel.',
  'You will not open The Parcel. You will not shake The Parcel. You will not hold The Parcel to your ear and guess. You will not sign for The Parcel on behalf of a neighbour. The Parcel must reach Fedoration Command, and it must reach it before the Rebuff Fleet does.',
  'What is in The Parcel? That is above your pay grade, which, frankly, is a very low grade, and which is in any case being reviewed.',
  'You will be pursued. The Rebuff Fleet advances one beacon behind you every time you jump, and it does not take bank holidays. Keep moving. Do not stop for sightseeing, souvenirs, or that nice little café on the moon of Brindle IV, however highly it is spoken of.',
  'Should you be destroyed in the course of your duties, the Courier Service will send a sympathy card to your next of kin. Please make sure your next of kin are up to date. We are not made of cards.'] },
{ id:'induction', cat:'basics', u:'start', title:'Welcome Aboard! A Leaflet for New Crew', by:'Pinned up beside the airlock on every Fedoration ship',
  text:['Welcome to your new ship! We hope you will be very happy here, or at the very least alive.',
  'THE AIRLOCK is the round door you are standing next to. It leads outside. Outside is not a room. Please do not treat it as one.',
  'THE MEDBAY will make you better if you stand in it. It will not make you taller, younger, or better at darts, whatever Gary from Engineering has told you.',
  'THE KITCHEN is wherever someone has put the kettle. The kettle is the most important system on the ship. The captain may claim it is the shields. The captain has not been here for the 2am watch.',
  'IN THE EVENT OF A FIRE, put it out. In the event of a hull breach, fix it. In the event of boarders, hit them, or ask a Mantlis to hit them, which is quicker. In the event of all three at once, make a cup of tea and accept that it is going to be one of those days.',
  'Rota for the washing-up is on the back of this leaflet. You are on it.'] },
/* ---------------- the Fedoration ---------------- */
{ id:'fed', cat:'fed', u:{ runs:1 }, title:'The Fedoration: What It Is, and Why It Has Forms', by:'Civic Studies for Schools, Year 9',
  text:['The Fedoration is a union of more than three hundred worlds who have agreed to disagree, in writing, in triplicate.',
  'It is run by the Assembly, which meets every Tuesday unless it is raining on the capital, in which case it meets on Wednesday and complains about Tuesday. The Assembly passes laws. The laws are then sent to the Department of Interpretation, which decides what they meant. Nobody has ever been able to find the Department of Interpretation, but its letters arrive on time.',
  'The Fedoration believes in fairness, decency, a good queue, and the right of every citizen to write a strongly worded letter. It has a navy, though the navy would prefer you didn\'t mention it, since most of it is currently being repaired, being repainted, or being argued about.',
  'Exam question (10 marks): The Fedoration has been described as "the slowest thing in the galaxy that has ever won a war." Discuss.'] },
{ id:'hale', cat:'fed', u:{ runs:2 }, title:'Admiral Hale: A Profile', by:'The Galactic Gazette, Sunday supplement',
  text:['Admiral Wilhelmina Hale has commanded the Fedoration\'s Courier Service for nineteen years, and has never once been seen to sit down. Junior officers believe she sleeps standing up, like a horse, or a particularly determined lamp post.',
  'Born on a mining moon to a family of nine, Hale joined the navy at sixteen "to get some peace and quiet." She was decorated for bravery at the Siege of Corvin Gate, where she held a relay station against a Rebuff squadron for six days with a skeleton crew, a broken reactor, and what the citation describes as "language."',
  'Asked about her couriers, she is unsentimental. "Most of them get blown up," she told us. "The rest get blown up later. But one of them gets through, and that\'s the one I remember." She then asked whether we\'d be much longer, as she had a war on.',
  'She takes her tea strong enough to stand a spoon in, and her biscuits plain. She has never, in nineteen years, offered anybody else a biscuit.'] },
{ id:'command', cat:'fed', u:{ reach:8 }, title:'Fedoration Command: Visitor Information', by:'Leaflet available at the main reception desk',
  text:['Welcome to Fedoration Command, the beating heart of the Fedoration and home to over forty thousand civil servants, six thousand naval staff, and a cat called Admiral Biscuits who outranks most of them.',
  'OPENING HOURS: 9 till 5, Monday to Friday. Closed for lunch. Closed for the Assembly\'s summer recess. Closed if the Rebuff Flaggship is attacking, in which case please come back later or, ideally, help.',
  'PARKING: Visiting ships may dock at Bays 1 to 400. Bays 401 to 900 are reserved for staff. Bay 901 is reserved for the Admiral\'s sister, who is not staff, and about whom questions have been asked.',
  'DELIVERIES: Couriers carrying The Parcel should report to Goods In. Please note Goods In is on the far side of the station, past the Rebuff fleet.'] },
{ id:'form27b', cat:'fed', u:'found', title:'Form FED-27b: Application to Be Rescued', by:'Recovered from an escape pod. Partly completed.',
  text:['Please complete in BLOCK CAPITALS using black ink. Applications in blood will not be accepted.',
  '1. Your name: "DESMOND ROE"',
  '2. Your current location: "IN AN ESCAPE POD"',
  '3. Please give further details of your location: "IT IS DARK AND I AM SPINNING"',
  '4. Reason for requesting rescue (tick one): [ ] Ship destroyed by enemy action  [ ] Ship destroyed by accident  [ ] Ship destroyed by other (please specify)  [x] "THE ENGI SAID IT WOULD BE FINE"',
  '5. Have you been rescued before in the last 12 months? If yes, please explain why it didn\'t take: "N/A"',
  '6. Please allow 28 working days for your application to be processed. Do you have 28 working days of air? "NO"',
  'For office use only: "Application received. Rescue approved. Pod not found. File closed."'] },
{ id:'kettle', cat:'fed', u:'found', title:'Memo: Re: The Kettle Situation', by:'Internal memo, Fedoration frigate Persistence. Pinned to a noticeboard, heavily annotated.',
  text:['To: All Crew. From: The Captain. Re: The Kettle.',
  'It has come to my attention that the kettle on Deck 2 has been boiled 46 times in a single watch, on one occasion while we were being fired upon. While I appreciate that a cup of tea is a comfort in times of stress, the kettle shares a power line with the forward shields.',
  'From today the kettle may be used only when shields are at full strength, and never during combat. [Underneath, in biro: "so never then"]',
  'I would also like to remind everyone that the milk in the small fridge is mine. [In different biro: "it was off"] [In a third biro: "it is a SPACESHIP Graham where would we get fresh milk"]',
  'Thank you for your cooperation. [Someone has drawn a small kettle crying.]'] },
{ id:'anthem', cat:'fed', u:{ wins:1 }, title:'"Stars of Home": the Fedoration Anthem, Second Verse', by:'Sung at the end of formal dinners. The second verse is usually skipped.',
  text:['First verse, as sung: "Stars of home, we bid thee shine / Over every world of thine / Brave and fair and free and true / Fedoration, we serve you."',
  'Second verse, as written: "When the rebels come to call / We shall meet them, one and all / In an orderly fashion, in the hall / Having first rung through to say."',
  'The second verse was written by a committee and does not scan. It was put to a vote in the Assembly, which decided to keep it out of respect for the committee, and to skip it out of respect for everyone else.',
  'There is a third verse. Nobody knows it. The committee are thought to have been working on it for eighty years.'] },
{ id:'medal', cat:'fed', u:{ wins:3 }, title:'A Letter from the Admiral', by:'Delivered by hand. On headed paper.',
  text:['Captain,',
  'This is the third time you have delivered The Parcel to Fedoration Command. I am informed by my staff that this is "a record," and that "something should be done." Something has been done. You have been awarded the Order of the Steady Hand, Second Class.',
  'There is no First Class. There used to be, but the last person to receive it let it go to their head, and was later seen in a cocktail bar on Vantis wearing it on a lanyard.',
  'I have been asked to add a personal note. Here it is: well done. Do not let it go to your head. Your next parcel is ready.',
  'W. Hale, Admiral'] },
/* ---------------- the Rebuff ---------------- */
{ id:'rebuff', cat:'reb', u:{ met:'rebuff' }, title:'Who Are the Rebuff?', by:'Fedoration Naval Intelligence. Briefing for new captains. Classification: Mildly Confidential.',
  text:['The Rebuff began as a reform movement within the Fedoration navy. Its founders believed the Fedoration had become slow, timid and buried in paperwork. They were right about all three, which is what made them so annoying.',
  'They left, taking a third of the fleet with them, and formed a state of their own based on efficiency, discipline and very clean floors. Rebuff ships are fast, well armed and identically painted. Rebuff crews are polite, well drilled and say "affirmative" instead of "yes," which you will find you can only bear for so long.',
  'What the Rebuff want is simple: everything to work properly, all the time, everywhere, whether or not anyone asked. They have rebranded twice since the war began. Their current slogan is "The Future, On Time."',
  'Do not engage Rebuff ships in conversation. They will try to recruit you. Worse, their arguments are quite good.'] },
{ id:'manifesto', cat:'reb', u:{ sector:'rebuff' }, title:'The Rebuff Manifesto (Pages 1 to 3 of 412)', by:'Found in a Rebuff officers\' mess, between a ration pack and a sudoku',
  text:['ONE. We believe that every citizen deserves a transport service that runs on time.',
  'TWO. We believe that forms should have no more than one page, and that the page should not ask the same question twice.',
  'THREE. We believe that a meeting which could have been a message is a crime against the citizen, and should be punished accordingly.',
  'FOUR. We believe that the Fedoration\'s Department of Interpretation does not exist, has never existed, and is a front for a man called Terry.',
  'FIVE. We believe that there is a right way to load a dishwasher, and that it is our way.',
  '[The remaining 407 pages expand on point five.]'] },
{ id:'flaggship', cat:'reb', u:{ reach:7 }, title:'The Flaggship', by:'Fedoration Naval Intelligence, Most Secret. Copy 4 of 6. Do not leave on the bus.',
  text:['The Rebuff Flaggship is the largest warship ever built, and the only one with a gift shop.',
  'It carries a main battery of heavy lasers and missiles, a drone bay, a boarding teleporter, a super shield of Voltan design and, according to one defector, "a really excellent canteen." It is commanded by Grand Marshal Ostrander, a man so punctual that the ship\'s clocks are set by his footsteps.',
  'The Flaggship has three ways of killing you. When it has lost all three it does not surrender. It reorganises. Captains are advised that destroying the Flaggship once is not the same as destroying it, and should keep shooting until it stops filling in reports.',
  'It must not reach Fedoration Command. If it does, the Rebuff will win the war, the trains will run on time, and nobody will ever be allowed to be late again.'] },
{ id:'poster', cat:'reb', u:'found', title:'Rebuff Recruitment Poster', by:'Peeled off a wall at a frontier fuel depot',
  text:['TIRED OF WAITING?', 'Tired of queues? Tired of forms? Tired of being put on hold for forty minutes by a department that does not exist?', 'JOIN THE REBUFF.', 'Three square meals a day. Uniforms that fit. A ship that was hoovered this morning. Promotion on merit, not on whose uncle you are.',
  'The Rebuff: The Future, On Time.', '[Someone has added, in marker: "but no biscuits." Someone else has crossed this out and written "they DO have biscuits, I\'ve seen them, they\'re just very regular."]'] },
{ id:'canteen', cat:'reb', u:'found', title:'Overheard in a Rebuff Canteen', by:'Transcript from a bugged salt cellar. Fedoration Naval Intelligence, unedited.',
  text:['FIRST VOICE: Did you see the courier got through the Ember Belt again?',
  'SECOND VOICE: Affirmative. Total shambles. Their ship was on fire for six jumps.',
  'FIRST VOICE: Six jumps! On fire!',
  'SECOND VOICE: I know. And they still beat our patrol. How does that even happen?',
  'FIRST VOICE: Morale, they reckon. They have a kettle.',
  'SECOND VOICE: We\'ve got kettles.',
  'FIRST VOICE: Not like theirs. Ours switch off when they boil. Theirs just keep going, like they\'ve got something to prove.',
  '[Pause. Sound of cutlery.]',
  'SECOND VOICE: Do you ever think we might be the baddies?',
  'FIRST VOICE: Not on a Tuesday. Pass the salt.',
  '[Transcript ends abruptly here.]'] },
{ id:'checkpoint', cat:'reb', u:{ sector:'rc_occupied' }, title:'Checkpoint Script for Rebuff Customs Officers', by:'Laminated card, Occupied Space. Officers must read it word for word.',
  text:['1. "Good morning/afternoon/evening, citizen. Welcome to Rebuff space. Your visit is important to us."',
  '2. "Please state the purpose of your visit. Acceptable answers are: business, family, compliance."',
  '3. "Do you have anything to declare? Please note that sarcasm must be declared."',
  '4. If the citizen is a Fedoration courier: "Please wait here. Someone will be with you shortly." Then shoot them.',
  '5. "Thank you for your cooperation. Please rate your checkpoint experience from one to five. Ratings below four will be investigated."'] },
/* ---------------- peoples ---------------- */
{ id:'p_human', cat:'peoples', u:{ race:'human' }, title:'Humans', by:'"Peoples of the Galaxy", a field guide',
  text:['Average height, average strength, average everything. Humans are the galaxy\'s control group, and they are oddly proud of it.',
  'What humans lack in special abilities they make up for in sheer adaptability, and in their ability to sit through a bad situation for a very long time while saying "mustn\'t grumble." They learn quickly. They complain constantly. They will happily spend six hours fixing a reactor and then refuse to fix a dripping tap because "it\'s not my job."',
  'Human cuisine is notable for being almost entirely beige. The national dish of Old Earth is a matter of fierce debate, but all the candidates are fried, served with chips, and best eaten in the rain.',
  'Humans apologise when you bump into them. Do not be fooled. They are keeping score.'] },
{ id:'p_pebblekin', cat:'peoples', u:{ race:'pebblekin' }, title:'Pebblekin', by:'"Peoples of the Galaxy", a field guide',
  text:['The Pebblekin are made of stone, live for about eight hundred years, and take most of them to finish a sentence.',
  'They are fireproof, very hard to hurt and excellent in a crisis, provided the crisis is willing to wait. A Pebblekin\'s idea of a quick decision is one made before the next ice age.',
  'Pebblekin courtship involves two Pebblekin sitting next to each other on a hillside until one of them is covered in moss. This is considered terribly romantic. Pebblekin weddings last several decades and the speeches are, by all accounts, very good, if you can stay for them.',
  'Never ask a Pebblekin how old they are. It is not rude. They just haven\'t finished counting.'] },
{ id:'p_enjinn', cat:'peoples', u:{ race:'enjinn' }, title:'Enjinn', by:'"Peoples of the Galaxy", a field guide',
  text:['Small, many-armed and deeply practical, the Enjinn can fix anything, given enough time and the right sort of biscuit.',
  'Enjinn legend says the first of them was built by a god who needed a shelf putting up. The god was so pleased with the shelf that the Enjinn have been putting up shelves ever since, along with reactors, shields and, on one famous occasion, an entire moon.',
  'They are useless in a fight. An Enjinn confronted by a boarder will usually offer to service its weapon. This sometimes works.',
  'An Enjinn who says "that\'ll be a quick job" has never once been right. An Enjinn who sucks air through its teeth means you are going to need a new one.'] },
{ id:'p_voltan', cat:'peoples', u:{ race:'voltan' }, title:'Voltan', by:'"Peoples of the Galaxy", a field guide',
  text:['The Voltan are beings of living energy. They glow, they hum, and they power whatever system they happen to be standing in, which makes them very popular on long voyages and impossible at parties.',
  'When a Voltan dies, it does so all at once, with a bang that damages anyone standing nearby. The Voltan do not see this as a tragedy. They see it as a final contribution. Voltan funerals are held outdoors, a very long way away from anything flammable.',
  'Voltan philosophy holds that the universe is one great circuit, and that every being is a component. They are calm, wise and serene, and they will drain your phone if you leave it near them.'] },
{ id:'p_sloog', cat:'peoples', u:{ race:'sloog' }, title:'Sloog', by:'"Peoples of the Galaxy", a field guide',
  text:['Telepathic, slow-moving and faintly damp, the Sloog know what you are thinking. They would like you to know that they know. And that they find it a bit disappointing.',
  'Sloog cannot be mind-controlled, because there is already a Sloog in charge of their mind and it does not take visitors. They make excellent negotiators, terrible poker partners, and the sort of dinner guest who says "I\'ll just have a little of yours" and then has all of it.',
  'The Sloog Nebula is warm, wet and smells of old drains. The Sloog say it smells of home. Everyone else says nothing, because the Sloog would hear them thinking it anyway.'] },
{ id:'p_mantlis', cat:'peoples', u:{ race:'mantlis' }, title:'Mantlis', by:'"Peoples of the Galaxy", a field guide',
  text:['Fast, green and built entirely out of elbows, the Mantlis are the galaxy\'s finest close-quarter fighters and its worst plumbers.',
  'Mantlis society is organised into hives, each led by a queen who communicates by scent. A Mantlis away from its hive often grows homesick, then irritable, then stabby. Crew rotas should be planned with this in mind.',
  'The Mantlis are famously bad with tools. A Mantlis asked to repair a broken door will usually take it off its hinges, which, it should be said, does solve the problem of the door being stuck.',
  'They are surprisingly good at cricket. Nobody is sure why. Nobody has ever been brave enough to ask a Mantlis to field at silly mid-on.'] },
{ id:'p_parrot', cat:'peoples', u:{ race:'parrot' }, title:'Squawklings', by:'"Peoples of the Galaxy", a field guide',
  text:['Bright, feathery and loud, the Squawklings repeat everything they hear. Everything. Including the thing the captain said under their breath about the Admiral, at the Admiral\'s birthday drinks.',
  'Squawklings make good crew: they are quick with a spanner and never mishear an order, since they say it straight back to you. They also make good spies, very bad secret-keepers, and the worst possible companions at a funeral.',
  'Never teach a Squawkling a rude word. It will not just learn it. It will improve it.'] },
{ id:'p_crystal', cat:'peoples', u:{ race:'crystalline' }, title:'Prismari', by:'"Peoples of the Galaxy", a field guide',
  text:['The Prismari are people of living crystal who refract their moods as colour. A happy Prismari glows gold; an angry one goes a sort of bruised purple; an embarrassed one goes pink and tries to stand behind a pillar.',
  'They are immune to mind control, since there is nowhere in a crystal to put a thought that isn\'t already one. They are brittle in a fight, and prone to cracking under sudden pressure, which they find very upsetting to have pointed out.',
  'Prismari music is played by tapping each other gently with spoons. It is very beautiful and not at all suitable for small ships.'] },
{ id:'p_hive', cat:'peoples', u:{ race:'hiveborn' }, title:'Hivelings', by:'"Peoples of the Galaxy", a field guide',
  text:['Small, quick and very keen, the Hivelings arrive in groups, learn fast and fall over a lot. They are the galaxy\'s apprentices: endlessly eager, constantly underfoot, and always asking if there is anything else they can do.',
  'There usually is. That is what makes them so tiring.'] },
{ id:'p_ember', cat:'peoples', u:{ race:'embermen' }, title:'Ember Kin', by:'"Peoples of the Galaxy", a field guide',
  text:['The Ember Kin live inside a band of burning stars, and walk through fire the way most people walk through a light drizzle: with mild irritation and no change of plans.',
  'They hate vacuum, cold, draughts, and anyone who leaves the airlock open. An Ember Kin on a cold ship will sulk, glow, and gradually set fire to the curtains. Ship captains are advised to keep the heating on and the curtains elsewhere.'] },
{ id:'p_mender', cat:'peoples', u:{ race:'mender' }, title:'Menders', by:'"Peoples of the Galaxy", a field guide',
  text:['Gentle, soft-spoken and very hard to hurry, Menders heal whoever is standing near them, simply by being there. They make wonderful crew, and the worst people in the galaxy to get stuck behind at a self-service till.',
  'A Mender will never tell you that you look awful. They will just stand a little closer than usual until you feel better.'] },
{ id:'p_glass', cat:'peoples', u:{ race:'glassborn' }, title:'The Glassborn', by:'"Peoples of the Galaxy", a field guide. Entry incomplete.',
  text:['Very little is known about the Glassborn, who live at the far end of a route that should not exist, among stars that ring like bells.',
  'They are made of living glass, and shrug off weapon fire that would kill a human three times over. They rarely leave home. When asked why, one replied: "Have you seen the rest of the galaxy? It\'s all corners."',
  'If you have met a Glassborn and lived to tell of it, the publishers of this guide would very much like to hear from you. Expenses paid.'] },
/* ---------------- places ---------------- */
{ id:'s_civilian', cat:'places', u:{ sector:'civilian' }, title:'The Civilian Sectors', by:'"The Rough Guide to Not Getting Shot", chapter one',
  text:['Traders, travellers and retirees, mostly. A good place to get your bearings, buy a sandwich and complain about the price of fuel.',
  'The civilian sectors are policed by the Fedoration in the sense that there is a Fedoration noticeboard at most stations reminding you that crime is illegal. Pyrates still pass through. They are generally polite about it, and some of them wave.',
  'Local delicacy: the Beacon Pasty, sold at every refuelling stop and identical at all of them, as if there is only one pasty, and it moves.'] },
{ id:'s_pyrate', cat:'places', u:{ sector:'pyrate' }, title:'Pyrate Havens', by:'"The Rough Guide to Not Getting Shot", chapter four',
  text:['Black markets, cheap fuel and deals that are too good to be true. They are always too good to be true. The trick is to work out which bit isn\'t.',
  'Pyrates are not evil, exactly. They are entrepreneurs who have cut out the paperwork. Most of them would describe themselves as "in logistics." A pyrate captain will rob you, apologise, and give you a business card.',
  'Pyrate law has three rules: no shooting in the bar, no cheating at cards, and no mentioning the King\'s hat. Breaking the first two will get you thrown out. Breaking the third will get you thrown out of an airlock.'] },
{ id:'s_nebula', cat:'places', u:{ sector:'nebula' }, title:'Nebulae, and Why You Shouldn\'t', by:'"The Rough Guide to Not Getting Shot", chapter six',
  text:['A nebula is a cloud of gas, dust and bad decisions. It hides you from the Rebuff Fleet. It also hides the Rebuff Fleet from you, along with rocks, pyrates, other ships, and the way out.',
  'Sensors don\'t work properly in a nebula. Neither do radios, compasses, or the part of the brain that says "perhaps we shouldn\'t." Captains entering a nebula are advised to slow down, keep calm, and assume that everything is behind them.'] },
{ id:'s_court', cat:'places', u:{ sector:'pk_court' }, title:'The Pyrate King\'s Court', by:'"The Rough Guide to Not Getting Shot", chapter nine. Not recommended.',
  text:['The Pyrate King rules from a throne made of the figureheads of a hundred captured ships, several of which are still complaining.',
  'Nobody knows the King\'s real name. Nobody knows how long the King has reigned. Everyone knows about the hat, which is enormous, decorated with the tail feathers of a Squawkling who still turns up to court on Thursdays to look at it.',
  'The King taxes every pyrate in the galaxy at a flat rate of twenty per cent, which makes the Pyrate King\'s Court, by a considerable margin, the most efficient tax office in known space. The Rebuff are said to be furious about this.'] },
{ id:'s_graveyard', cat:'places', u:{ sector:'gf_graveyard' }, title:'The Silent Graveyard', by:'Ship\'s log of the survey vessel Dandelion, final entries',
  text:['Day 1. Arrived at the battlefield. Hundreds of wrecks, Fedoration and Rebuff mixed together. Nobody knows who won. Possibly nobody did.',
  'Day 3. Some of the wrecks still have power. Their guns track us as we pass. We have stopped sending friendly greetings, as one of them sent back a missile.',
  'Day 6. Found a mess hall with the plates still on the tables. Somebody had left a crossword half done. 14 across: "Brief, to the point (5)." We have filled it in. It felt like the right thing to do.',
  'Day 9. Leaving. The guns did not fire as we went. I think, and I know this is daft, that they were letting us go.'] },
{ id:'s_vaults', cat:'places', u:{ sector:'pv_vaults' }, title:'The Precursor Vaults', by:'Notes of Professor Amelia Thwaite, Department of Very Old Things',
  text:['The Precursors were here before everybody. They built vaults across a dozen star systems, sealed them, and left. Nobody knows where they went, and the vaults aren\'t saying.',
  'What we do know: the vaults are guarded by machines that do not sleep, do not eat, and do not accept that a professor with a clipboard has any right to be there.',
  'Inside the one vault we have managed to open we found: a great deal of advanced technology, the remains of what may have been a meal, and a small sign which our translators render as "back in five minutes." The sign is believed to be about two million years old.'] },
{ id:'s_frost', cat:'places', u:{ sector:'wf_drift' }, title:'Frostlight Festival', by:'Tourist board leaflet, The Frostlight Drift',
  text:['Every year, when the comets come round, the whole Drift lights up for the Frostlight Festival. There are lanterns, carols, mulled engine coolant (not for drinking), mulled wine (for drinking), and a very long queue for the ice rink.',
  'Even the pyrates observe the Frostlight Truce. For twelve days nobody boards anybody, except to deliver a card. On the thirteenth day everyone goes back to robbing each other, slightly hungover.'] },
{ id:'s_furnace', cat:'places', u:{ sector:'hz_furnace' }, title:'The Furnace', by:'"The Rough Guide to Not Getting Shot", chapter twelve',
  text:['A cluster of angry blue stars, flaring all day long. Rich pickings for salvagers, because a great many people have burned here, and they left their things behind.',
  'The Furnace is the only place in the galaxy where the Ember Kin go on holiday. They lie on the hulls of their ships in the solar flares, like lizards on a wall, and come back looking ever so well.'] },
/* ---------------- everyday life ---------------- */
{ id:'forecast', cat:'life', u:'found', title:'The Space Weather Forecast', by:'Read out on Radio Fedoration at 00:48, after the news',
  text:['And now the Space Weather Forecast, issued by the Meteorological Office at Fedoration Command.',
  'Brindle, Corvin, Outer Hask: ion storms, moving slowly east. Six to gale eight, occasionally severe nine. Visibility poor, becoming very poor. Fedoration couriers in these areas are reminded that the storm cannot be outrun and should not be argued with.',
  'Sloog Nebula: damp. Continuing damp. Damp later.',
  'The Furnace: hot. Very hot. Bring a hat.',
  'Pyrate Haven: fair, becoming suspicious. Pickpocketing moderate to good.',
  'The Last Stand: Rebuff Flaggship, approaching from the west. Visibility excellent, unfortunately.',
  'And that is the end of the Space Weather Forecast. It\'s 00:52. This is Radio Fedoration. Goodnight, and keep your shields up.'] },
{ id:'pubguide', cat:'life', u:'found', title:'The Good Beacon Guide: Pubs', by:'Campaign for Real Ale In Space, annual listings',
  text:['THE CROWN & ANCHOR, Relay 9. A proper old spacers\' pub. Low ceilings, sticky carpet, quiz on a Wednesday. The landlord has been serving the same pint since before the war and is not about to stop now. Four stars.',
  'THE GRAVITY WELL, Brindle IV. Gastropub. The scallops are excellent and the bill will make your eyes water. No Mantlis after 9pm, following an incident. Three stars.',
  'THE DOG & DOCKING CLAMP, Outer Hask. Rough. The kind of place where a fight breaks out before you\'ve sat down, and another one breaks out to see who gets your seat. Real fire. Real fights. Two stars, mostly for the crisps.',
  'THE MOVING PINT, location varies. Reports conflict. Some say it is the finest pub in the galaxy; others say it does not exist. Everyone agrees the landlord remembers your name. Unrated, pending a visit.'] },
{ id:'classifieds', cat:'life', u:'found', title:'Classified Adverts', by:'The Galactic Gazette, back pages',
  text:['FOR SALE. One shield generator, good condition, one careful owner. Small scorch mark. Some screaming on startup, now fixed. 40 scrap ono.',
  'WANTED. Experienced pilot for long haul cargo run. Must have own oxygen. No time-wasters, no Sloog (they know why).',
  'LOST. Medium-sized Enjinn, answers to "Spanners." Last seen inside a reactor. If found, please do not turn off.',
  'FREE TO GOOD HOME. Small fluffy creature, very affectionate, multiplies when wet. Will also accept bad home. Will accept any home. Please, any home at all.',
  'SITUATION WANTED. Retired courier, one delivery, many jumps, available for weddings, funerals and after-dinner speaking. Can bring The Parcel (empty, alas).'] },
{ id:'horoscope', cat:'life', u:'found', title:'Your Stars This Week', by:'Mystic Moira, The Galactic Gazette',
  text:['THE KETTLE (born in the first quarter): A stranger will offer you a deal. It is a pyrate. Say no.',
  'THE SPANNER: You will take something apart this week that you cannot put back together. This is not a prediction. You have already done it.',
  'THE AIRLOCK: Something you thought was closed is open. Check the airlock.',
  'THE FLAGGSHIP: Things are moving in your direction. Things are getting bigger. Things are, in fact, the Rebuff Flaggship.',
  'THE PARCEL: You have something important to deliver. Do not open it. Moira knows.',
  'THE BISCUIT TIN: Someone will take the last one. You know who it is. Bide your time.'] },
{ id:'complaint', cat:'life', u:'found', title:'A Letter of Complaint', by:'Sent to the Fedoration Courier Service. Kept on file.',
  text:['Dear Sir or Madam,',
  'I write to complain in the strongest terms about the conduct of your courier ship, which this Tuesday at approximately 3pm passed through my asteroid without stopping.',
  'I do not mean near my asteroid. I mean through it. My asteroid is now two asteroids. My greenhouse is on the other one.',
  'When I attempted to raise this with the captain over the radio, I was told to "take it up with the Rebuff, they\'re right behind us," and indeed they were, and they also went through my asteroid, which is now four asteroids.',
  'I have lived in this sector for forty years and have never seen anything like it. I demand compensation, an apology, and the return of my tomato plants, which are now in orbit.',
  'Yours faithfully, Mrs D. Pembury (aged 81)'] },
{ id:'recipe', cat:'life', u:'found', title:'Recipe: Emergency Ration Crumble', by:'From "Cooking in Zero G" by Chef Bernard Osei',
  text:['Serves: whoever\'s left. Takes: forty minutes, or until the next hull breach.',
  'You will need: four emergency ration bars (any flavour; they are all the same flavour), one tin of the fruit nobody wants, some butter if you\'ve got it, and a small amount of hope.',
  'Crumble the ration bars. This is easy, as they are already crumbling. Put the fruit in a dish and the crumbs on top. Bake in the engine room for half an hour, keeping it well away from the Voltan.',
  'Serve with custard. If you have no custard, serve with a story about custard. It is surprisingly nearly as good.'] },
{ id:'cricket', cat:'life', u:'found', title:'Rules of Zero-G Cricket (Simplified)', by:'Pinned up in the rec room of the frigate Long Innings',
  text:['1. The ball is hit by the batter. The ball then goes wherever it likes, possibly forever.',
  '2. If the ball leaves the ship, the batter scores six. If it hits the ship on the way back round, the batter is out. If it hits the captain, play is suspended and nobody mentions it again.',
  '3. Tea is taken after forty overs, or after a hull breach, whichever comes first.',
  '4. The Mantlis may not field, bowl, bat, umpire, or come within three rooms of the pitch.',
  '5. A match ends when the ball is lost, which on average happens during the second over.'] },
{ id:'healthsafety', cat:'life', u:'found', title:'Health & Safety Notice 114', by:'Stuck to the inside of a reactor door',
  text:['DANGER. This reactor is dangerous. Do not touch it. Do not lick it. Do not "just have a quick look."',
  'Staff working in this area must wear protective goggles, protective gloves and a protective expression of mild concern.',
  'In the event of a meltdown, please leave the area calmly, in an orderly fashion, and at about four hundred miles an hour.',
  'This notice has been risk-assessed. The risk assessment has been risk-assessed. The person who did the risk assessment of the risk assessment has gone off sick with stress.'] },
{ id:'agony', cat:'life', u:'found', adult:true, title:'Ask Auntie Ffion', by:'The Galactic Gazette\'s agony column',
  text:['"Dear Auntie Ffion, I\'ve been on a long voyage with a crew of five, and I\'ve fallen for our Mantlis. She\'s fierce, fast, and frankly a bit of a hunk. But I\'m worried she sees me as lunch. What should I do? Smitten, Deck 3"',
  '"Dear Smitten, you are not the first to fall for a Mantlis and, if the hospital records are anything to go by, you won\'t be the last. Mantlis courtship is intense, brief and occasionally fatal. My advice: buy her flowers, let her win at arm wrestling, and for heaven\'s sake keep your arms inside the bunk. Auntie F."',
  '"Dear Auntie Ffion, my husband has started spending all his evenings in the airlock \'thinking\'. Should I be worried? Concerned, Relay 4"',
  '"Dear Concerned, yes, but mainly about who\'s got the controls. Auntie F."'] },
{ id:'dating', cat:'life', u:'found', adult:true, title:'Lonely Hearts', by:'The Galactic Gazette, personal ads',
  text:['VOLTAN, 340, GSOH, looking for someone to light up my life. Literally: I am a lamp. Must not mind the occasional explosion. Sloog need not apply.',
  'PEBBLEKIN, mid-sixties (centuries), enjoys long walks on the beach, very long walks, very very long walks. Seeking someone patient. Reply within the next fifty years.',
  'HUMAN COURIER, 30s, often away on business, seeks someone who doesn\'t mind me never being home, smelling slightly of burnt wiring, and leaving at 3am because "the Fleet is coming." It\'s not you, it\'s the Rebuff.',
  'SLOOG, seeks partner. I already know what you\'re thinking. Yes. Even that. Especially that.'] },
{ id:'payslip', cat:'life', u:'found', title:'A Courier\'s Payslip', by:'Found in the pocket of a jacket left on a store beacon',
  text:['Basic pay: 120 scrap.',
  'Danger money: 4 scrap. (Danger money is paid at the standard rate of 1 scrap per near-death experience, capped at 4 per month.)',
  'Overtime: 0 scrap. (Couriers are not entitled to overtime, as the Rebuff Fleet is not considered "time.")',
  'Deductions: uniform (12), kettle levy (2), contribution to colleague\'s leaving do (5), contribution to colleague\'s funeral (5), contribution to the same colleague\'s second leaving do, as it turned out they were cloned (5).',
  'Net pay: 95 scrap. Have a lovely month.'] },
/* ---------------- legends ---------------- */
{ id:'precursors', cat:'legends', u:{ runs:5 }, title:'Who Were the Precursors?', by:'Late-night phone-in, Radio Fedoration',
  text:['CALLER ONE: Ancient aliens, wasn\'t it? Built the beacons, built the lanes, then cleared off. Probably for tax reasons.',
  'CALLER TWO: My nan says they were us. From the future. Came back and built it all so we\'d have something to do.',
  'CALLER THREE: They\'re still here. In the vaults. Waiting. You can hear them if you put your ear to the hull of an old relay. They\'re humming.',
  'PRESENTER: And what are they humming, Derek?',
  'CALLER THREE: Hold music.',
  'PRESENTER: Right. We\'ll leave it there. After the break: is it acceptable to eat a Beacon Pasty cold? The lines are open.'] },
{ id:'ghostcourier', cat:'legends', u:{ deaths:10 }, title:'The Ghost Courier', by:'A story told on the late watch',
  text:['They say there was a courier, long ago, who never made it to Command. Shot down in the last sector, with the Flaggship\'s guns on them and Command\'s lights in sight.',
  'They say that courier never stopped flying. That on quiet nights, between the beacons, you can still see their ship: no lights, no engines, no crew you can see, flying steadily towards Command, and never arriving.',
  'They say that if the Ghost Courier passes you, you should flash your lights twice, for luck, and once more for them.',
  'Most captains say it\'s rubbish. Most captains flash their lights anyway.'] },
{ id:'haven', cat:'legends', u:{ runs:3 }, title:'Haven\'s Rest', by:'From your great-uncle\'s papers',
  text:['If you\'re reading this, you\'ve inherited the station. Sorry about that.',
  'Haven\'s Rest was a fine place once. Gardens on the outer ring, a bar on the inner one, and a view of the Drift that would make a Pebblekin weep. Then the war came, and the traders stopped coming, and I got old, and the gardens got older.',
  'Bring it back. Send home whatever you can, a crate at a time. It doesn\'t need to be what it was. It just needs to be somewhere people want to come back to.',
  'The key\'s under the mat. The mat\'s under the reactor. Mind the reactor.',
  'Love, your Great-Uncle Bertram.',
  'P.S. The cat is not mine. It came with the station. I believe it may in fact own the station. Feed it and do not argue.'] },
{ id:'queue', cat:'legends', u:{ runs:8 }, title:'The Man Who Queued at the Edge of a Black Hole', by:'A Fedoration folk tale',
  text:['There was once a man called Arthur Clegg who found a queue at the edge of a black hole. Being a man of the Fedoration, he joined it.',
  'The queue moved very slowly. That is the nature of black holes: time slows down near them, and so do queues. Arthur did not mind. He had a flask and a newspaper. He waited, and he waited, and the stars outside wheeled by and civilisations rose and fell, and Arthur turned another page.',
  'At last, after what was to him an afternoon, and to the rest of the galaxy about four thousand years, he reached the front. There was a little window with a little shutter, and on the shutter was a sign.',
  'It said: "Closed for lunch."',
  'Arthur sighed, said "typical," folded his newspaper, and joined the end of the queue again. And that, the Fedoration says, is what it means to be civilised.'] },
{ id:'parcel', cat:'legends', u:{ wins:5 }, title:'What\'s in the Parcel?', by:'Rumours collected by the Gazette\'s reader survey',
  text:['"The Fedoration\'s battle plans." (31%)',
  '"The launch codes for the Precursor super-weapon." (18%)',
  '"A really good recipe for crumble." (12%)',
  '"Admiral Hale\'s birthday present. Her birthday is very important to her." (9%)',
  '"Nothing. It\'s a test. The Fleet\'s chasing the test." (8%)',
  '"The Department of Interpretation." (7%)',
  '"Biscuits." (6%)',
  '"I opened it once. I\'m not allowed to say. But I\'ve never looked at a toaster the same way since." (1%)',
  'Don\'t know / declined to say / opened it and has since been "reassigned": 8%'] },
/* ---------------- about you ---------------- */
{ id:'firstloss', cat:'you', u:{ runs:1 }, title:'Condolences from the Courier Service', by:'Standard letter, sent to all captains after a failed delivery',
  text:['Dear Captain,',
  'We were sorry to hear about your recent loss: of your ship, your crew, and The Parcel, which was rather the point.',
  'We have opened a new file for you. We have also, in a spirit of optimism, issued you with a new ship, a new crew, and a new Parcel, all of which are waiting in the hangar.',
  'Please try to bring this one back.',
  'Yours sincerely, The Courier Service (Replacements Desk)'] },
{ id:'grief', cat:'you', u:{ deaths:25 }, title:'Coping with Loss: A Fedoration Leaflet', by:'Issued automatically after the twenty-fifth crew death on a captain\'s record',
  text:['Losing crew is hard. It is natural to feel sad, angry, guilty or nothing at all. It is also natural to feel that you should perhaps stop sending people into burning rooms with a fire extinguisher and a pat on the back.',
  'Here are some things that might help: talk to someone. Write the names down. Visit the memorial. Have a cup of tea. Have a stiff drink. Stop venting the oxygen as a fire-fighting tactic when there are still people in the room.',
  'Remember: every name on that wall chose to come with you. Most of them, anyway. We are still looking into Kevin.'] },
{ id:'licence', cat:'you', u:{ runs:10 }, title:'Your Courier Licence Renewal', by:'Fedoration Courier Service, Licensing Section',
  text:['Our records show that your licence has been in continuous use for ten voyages. Congratulations: this makes you one of our most experienced couriers, as most of the others have, for various reasons, stopped.',
  'To renew your licence, please send two recent photographs (no helmets), proof of address (a ship counts, a crater does not), and a fee of 30 scrap.',
  'Please also complete the enclosed form declaring any changes to your health, your crew, your ship, or the number of your limbs since your last renewal. Clones should tick box 7.'] },
{ id:'centurion', cat:'you', u:{ kills:100 }, title:'Report: Your Kill Tally', by:'Rebuff Fleet Command. Internal. Leaked.',
  text:['Subject: The Courier.',
  'This captain has now destroyed more than one hundred of our ships, plus a number of pyrates, plus one asteroid that may have been a ship. It is no longer possible to describe this as "luck."',
  'Recommendations: (1) More ships. (2) Bigger ships. (3) Find out what is in their kettle.'] }
];

/* the radio: what you overhear between jumps. Short, one-off, and nobody's talking to you */
const RADIO = [
  'Radio Fedoration: "...and traffic on the Brindle lanes is backed up past the third beacon, so allow extra time..."',
  'Radio Fedoration: "...the time is half past. If you\'re just joining us, the war is still on..."',
  'Pyrate band, crackling: "...ARRR, and if you\'re hearing this, you\'ve got lovely engines. Shame if something happened to them..."',
  'Rebuff broadcast: "Citizen. Your patience is appreciated. The future will arrive at its scheduled time."',
  'A trader, on an open channel: "Anyone want forty crates of novelty mugs? Anyone? Half price. Quarter price. Please."',
  'Radio Fedoration phone-in: "...and I said to her, you can\'t park a cruiser there, that\'s a nebula..."',
  'Static, then a child\'s voice: "Mum says the man on the radio isn\'t real." Then more static.',
  'Fedoration traffic control: "Courier, you are not cleared for that lane. Courier? Courier. Oh, for God\'s sake."',
  'An Enjinn on a repair channel: "...no, no, the OTHER red wire..." Then silence.',
  'Radio Fedoration: "...the Admiralty would like to remind all couriers that The Parcel is not a seat..."',
  'A Sloog on an open channel: "I know you\'re listening. You\'re thinking about biscuits. Everyone is always thinking about biscuits."',
  'Rebuff broadcast: "This week\'s top-performing patrol: Patrol 7. Patrol 7, you make the Rebuff proud. Patrol 12, see me."',
  'Radio Fedoration: "...the cricket. And it\'s gone. Out of the ship. Out of the sector, possibly. A very fine shot..."',
  'A distress beacon, very old: "...if anyone gets this, the treasure is buried under the..." It cuts out. It always cuts out there.',
  'A pyrate, sounding tired: "Look, I\'ve had a long day. Just drop your cargo and we\'ll say no more about it."',
  'Radio Fedoration: "...and that was Gloria Pike with \'Blue Shift Blues.\' Coming up, the shipping forecast, and then the news, and then, God willing, my bed."',
  'A Mantlis on an open channel: "Who wants a fight. Anybody. Anybody at all. I\'m not fussy."',
  'Fedoration recorded message: "Your call is important to us. You are number four hundred and twelve in the queue."',
  'A Voltan, humming softly: "...ommmm. Sorry. Wrong channel. Ommmm."',
  'Radio Fedoration: "...and remember, this Sunday the clocks go back an hour, everywhere except near black holes, where they do what they like..."',
  'An engineer, very quietly: "Don\'t tell the captain, but I think it\'s held together with tape."',
  'Rebuff broadcast: "Defectors are welcome to return. All is forgiven. The paperwork has been pre-filled."',
  'A food van, broadcasting on loop: "Pasties, pies, hot drinks. Pasties, pies, hot drinks. Don\'t ask about the pies."',
  'Radio Fedoration: "...and Admiral Hale has asked us to say that she is \'not cross, just disappointed.\' We\'ll play some music now."',
  'Two Squawklings arguing: "You said it first." "You said it first." "YOU said it first." This goes on for some time.',
  'A Pebblekin, on a very long-range channel: "Hello. How are you. I am fine. Good." It was sent in the year of your great-grandmother\'s birth.',
  'Radio Fedoration: "...it\'s 3am, you\'re listening to Night Shift, and if you\'re still awake, honestly, same..."',
  'A wedding party, very drunk: "WE\'RE GETTING MARRIED IN A NEBULA! NOBODY CAN SEE US! WOOOO!"',
  'Rebuff broadcast: "Reminder. Smiling is not compulsory. But it is noticed."',
  'A lost tourist: "Is this the way to the gas giant with the rings? The nice one? Not the one with the pyrates. The OTHER one with the rings."'];
const RADIO_ADULT = [
  'An engineer, swearing steadily at something: "...you absolute bastard of a valve..." The valve, it seems, wins.',
  'Pyrate band: "...this one goes out to the Rebuff patrol in sector four. You know what you did. Wankers."',
  'Radio Fedoration late-night phone-in: "...and is this a medical question, sir? Because it sounds like a Mantlis question."',
  'A very tired captain: "I\'ve been chased by the entire Rebuff fleet for nine sectors and I still haven\'t had a bloody cup of tea."',
  'Someone on an open channel, clearly not meaning to be: "...no, the mic\'s off. Anyway, so the Voltan says to me..."'];

/* ---------------- unlocking ---------------- */
function loreGrown(){ return typeof grownUp==='function' ? grownUp() : !(typeof SET!=='undefined' && SET.grownUp===false); }
function loreList(){ return LORE.filter(e => !e.adult || loreGrown()); }
function loreBook(){ PROFILE.lore = PROFILE.lore || {}; PROFILE.loreRead = PROFILE.loreRead || {}; return PROFILE.lore; }
function loreStats(){ const w = PROFILE.wins || {}, c = typeof codex==='function' ? codex() : {};
  return { runs:PROFILE.runs || 0, wins:typeof w==='number' ? w : Object.values(w).reduce((a, b) => a + (+b || 0), 0), deaths:(PROFILE.memorial || []).length, reach:PROFILE.maxSector || 0,
    kills:typeof PROFILE.kills==='number' ? PROFILE.kills : Object.values(PROFILE.kills || {}).reduce((a, b) => a + (+b || 0), 0), ra:c.ra || {}, se:c.se || {}, en:c.en || {} }; }
function loreMet(e, S){ const u = e.u; if(u==='start') return true; if(u==='found' || !u) return false;
  if(u.runs != null && S.runs < u.runs) return false; if(u.wins != null && S.wins < u.wins) return false; if(u.deaths != null && S.deaths < u.deaths) return false;
  if(u.reach != null && S.reach < u.reach) return false; if(u.kills != null && S.kills < u.kills) return false;
  if(u.race && !S.ra[u.race]) return false; if(u.sector && !S.se[u.sector]) return false;
  if(u.met && !Object.keys(S.en).some(id => id.toLowerCase().includes(u.met) || String((DATA.enemies[id] || {}).name || '').toLowerCase().includes(u.met))) return false;
  return true; }
function loreUnlock(e, how){ const B = loreBook(); if(B[e.id]) return false; B[e.id] = Date.now(); UI.loreNew = (UI.loreNew || 0) + 1;
  if(typeof logEntry==='function' && G && how) logEntry(`${how} "${e.title}". It's in the Archive.`, 'level'); return true; }
function loreCheck(quiet){ if(typeof PROFILE==='undefined') return; const S = loreStats(), got = [];
  for(const e of loreList()) if(e.u!=='found' && !loreBook()[e.id] && loreMet(e, S) && loreUnlock(e)) got.push(e);
  if(got.length && !quiet && typeof toast==='function') toast(got.length===1 ? `📜 New in the Archive: "${got[0].title}" (Record → Codex → Archive)` : `📜 ${got.length} new entries in the Archive (Record → Codex → Archive)`);
  if(got.length && typeof saveProfile==='function') saveProfile(); return got; }
/* a fragment pulled from a wreck or a dead relay */
function loreFind(where){ const pool = loreList().filter(e => e.u==='found' && !loreBook()[e.id]); if(!pool.length) return null;
  const e = pool[Math.floor(Math.random()*pool.length)]; loreUnlock(e, where==='wreck' ? 'Pulled a data fragment from the wreck:' : 'Picked up an old transmission:');
  if(typeof toast==='function') toast(`📜 ${where==='wreck' ? 'Recovered from the wreck' : 'Picked up on an old relay'}: "${e.title}" (Record → Codex → Archive)`);
  if(typeof saveProfile==='function') saveProfile(); return e; }
function radioLine(){ const pool = RADIO.concat(loreGrown() ? RADIO_ADULT : []); return pool[Math.floor(Math.random()*pool.length)]; }
(function(){
  const okRun = () => G && !G.tut && !G.daily && !(typeof NET!=='undefined' && NET.on && !NET.host);
  if(typeof newRun==='function'){ const n0 = newRun; newRun = function(...a){ const r = n0(...a); try{ loreCheck(true); }catch(e){} return r; }; }
  if(typeof arrive==='function'){ const a0 = arrive; arrive = function(i){ const r = a0(i); try{ if(okRun()){ loreCheck();
      // quiet beacons: now and then something on the radio, or an old transmission worth keeping
      if(!G.modal && !G.enemy && UI.screen==='game'){ const roll = Math.random(); if(roll < .05) loreFind('relay'); else if(roll < .24 && typeof toast==='function'){ const line = radioLine(); toast('📻 ' + line); if(typeof logEntry==='function') logEntry('Overheard on the radio. ' + line, 'note'); } } } }catch(e){} return r; }; }
  if(typeof finishCombat==='function'){ const f0 = finishCombat; finishCombat = function(kind, offer){ const r = f0(kind, offer); try{ if(okRun() && (kind==='destroyed' || kind==='crew') && Math.random() < .2) loreFind('wreck'); loreCheck(); }catch(e){} return r; }; }
  if(typeof endRun==='function'){ const e0 = endRun; endRun = function(...a){ const r = e0(...a); try{ loreCheck(); }catch(e){} return r; }; }
})();

/* ---------------- reading it: Record → Codex → Archive ---------------- */
function drawArchive(){
  loreCheck(true); const B = loreBook(), R = PROFILE.loreRead, list = loreList(), have = list.filter(e => B[e.id]).length; UI.loreNew = 0;
  T(`${have} of ${list.length} entries found. Some open as you play; the rest turn up in wrecks and on old relays.`, 60, 228, { s:14, c:C.muted, max:900 });
  // the index
  const rows = []; for(const [k, n] of LORE_CATS){ const es = list.filter(e => e.cat===k); if(!es.length) continue; rows.push({ head:n, n:es.filter(e => B[e.id]).length, of:es.length }); for(const e of es) rows.push({ e }); }
  const per = 20, pages = Math.ceil(rows.length/per); UI.loreIdx = clamp(UI.loreIdx || 0, 0, Math.max(0, pages - 1));
  panel(60, 244, 470, 630, 10); let y = 268;
  for(const r of rows.slice(UI.loreIdx*per, UI.loreIdx*per + per)){
    if(r.head){ label(`${r.head} · ${r.n}/${r.of}`, 80, y + 14, C.cyan, 'left', 12); y += 26; continue; }
    const e = r.e, got = !!B[e.id], on = UI.loreOpen===e.id;
    if(on){ rr(70, y - 2, 450, 24, 5); ctx.fillStyle = hexA(C.amber, .18); ctx.fill(); }
    T(got ? e.title : (e.u==='found' ? '? ? ?  (found in wrecks and relays)' : '? ? ?  ' + loreHint(e)), 86, y + 15, { s:14, c:got ? (on ? C.amber : R[e.id] ? C.ink : '#fff') : C.muted, max:404, w:got && !R[e.id] ? 700 : 400 });
    if(got && !R[e.id]){ ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(78, y + 10, 3.5, 0, 7); ctx.fill(); }
    if(got) region(70, y - 2, 450, 24, () => { UI.loreOpen = e.id; UI.lorePage = 0; }, 'lore:' + e.id);
    y += 26; }
  if(pages > 1){ btn(80, 820, 90, 40, '‹', () => UI.loreIdx--, { disabled:UI.loreIdx <= 0, s:16 }); T(`${UI.loreIdx + 1} / ${pages}`, 295, 846, { s:13, a:'center', c:C.muted }); btn(420, 820, 90, 40, '›', () => UI.loreIdx++, { disabled:UI.loreIdx >= pages - 1, s:16 }); }
  // the page
  panel(548, 244, 972, 630, 10);
  const e = list.find(x => x.id===UI.loreOpen && B[x.id]) || null;
  if(!e){ T('The Archive', 1034, 470, { s:30, f:FD, w:700, a:'center', c:C.amber }); para('Pick an entry on the left. Histories, leaflets, memos, adverts, letters home and legends: the paperwork of a galaxy at war. Read them in any order. None of them will be on the test.', 700, 500, 668, { s:16, lh:23, c:C.muted }); return; }
  if(!R[e.id]){ R[e.id] = 1; if(typeof saveProfile==='function') saveProfile(); }
  label(LORE_CATS.find(c => c[0]===e.cat)[1], 584, 284, C.cyan, 'left', 12);
  const th = para(e.title, 584, 318, 900, { s:26, lh:32, f:FD, w:700, c:C.amber }); let ty = 318 + (th || 32) + 2;
  if(e.by){ const bh = para(e.by, 584, ty, 900, { s:14, lh:19, c:C.muted, f:FM }); ty += (bh || 19) + 14; }
  // split the paragraphs into pages that fit
  const top = ty, bottom = 820, lh = 24, pagesOf = []; let cur = [], hgt = 0;
  for(const p of e.text){ const n = Math.max(1, lines(p, 900, `16px ${FM || 'sans-serif'}`).length), ph = n*lh + 12; if(cur.length && hgt + ph > bottom - top){ pagesOf.push(cur); cur = []; hgt = 0; } cur.push(p); hgt += ph; }
  if(cur.length) pagesOf.push(cur); UI.lorePage = clamp(UI.lorePage || 0, 0, pagesOf.length - 1);
  let py = top; for(const p of pagesOf[UI.lorePage]){ const h = para(p, 584, py, 900, { s:16, lh }); py += (h || lh) + 12; }
  if(pagesOf.length > 1){ btn(1300, 826, 96, 38, '‹', () => UI.lorePage--, { disabled:UI.lorePage <= 0, s:15 }); btn(1404, 826, 96, 38, 'More ›', () => UI.lorePage++, { disabled:UI.lorePage >= pagesOf.length - 1, s:15, fill:UI.lorePage < pagesOf.length - 1 });
    T(`Page ${UI.lorePage + 1} of ${pagesOf.length}`, 1284, 851, { s:13, a:'right', c:C.muted }); }
}
function loreHint(e){ const u = e.u; if(u==='start') return ''; if(u.runs) return `(after ${u.runs} voyage${u.runs > 1 ? 's' : ''})`; if(u.wins) return `(after ${u.wins} win${u.wins > 1 ? 's' : ''})`;
  if(u.deaths) return `(after ${u.deaths} crew deaths)`; if(u.reach) return `(reach sector ${u.reach})`; if(u.kills) return `(destroy ${u.kills} ships)`;
  if(u.race){ const r = DATA.races[u.race]; return r && !r.secret ? `(crew with a ${r.name})` : '(crew with someone rare)'; }
  if(u.sector){ const s = DATA.sectors[u.sector]; return s ? `(cross ${s.name})` : '(cross somewhere new)'; } if(u.met) return `(meet a ${u.met} ship)`; return ''; }
