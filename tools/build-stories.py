#!/usr/bin/env python3
"""Builds the "loose ends" stories (see js/threads.js for how they work).

  js/threadstories.js          the game's own loose ends
  mods/telly-night.json        parodies of British telly (a mod, off by default)
  mods/blockbuster-night.json  parodies of famous films and series (a mod, off by default)

The parodies use invented names and original jokes: they nod at well-known
shows without using anyone's characters, names or lines. Run from the repo
root:  python3 tools/build-stories.py
"""
import json, os

def C(text, result, **fx):
    """a choice with one outcome"""
    req = fx.pop('req', None); cost = fx.pop('cost', None)
    c = {"text": text, "effect": dict(text=result, **fx)}
    if req: c["req"] = req
    if cost: c["cost"] = cost; c.setdefault("req", {}).update({k: v for k, v in cost.items()})
    return c

def CH(text, chance, good, bad, **kw):
    """a gamble: good and bad are (text, {effects})"""
    c = {"text": text, "chance": chance, "success": dict(text=good[0], **good[1]), "fail": dict(text=bad[0], **bad[1])}
    c.update(kw); return c

def T(tid, name): return {"id": tid, "name": name}

EV = {}
def E(store, id, title, text, choices, **f):
    e = dict(title=title, text=text, choices=choices, art=f.pop('art', 'ship')); e.update(f); store[id] = e

# =====================================================================
# the game's own loose ends
# =====================================================================
B = {}
# ---- the cat ----
E(B, 'th_cat_0', 'Something in the hold', "There's a noise in the cargo hold. {crew} goes down with a torch and a spanner and comes back with a large ginger cat under one arm. It has a collar. The collar says \"NOT YOURS.\"", [
  C("Keep it. Every ship needs a cat.", "The cat inspects the bridge, sits in the captain's chair, and goes to sleep. You have been outranked.", thread=T('cat', 'A stowaway cat')),
  C("Put it off at the next station.", "You try. The cat is back aboard before you are. Nobody saw how.", thread=T('cat', 'A stowaway cat')),
], starts='cat', art='ship')
E(B, 'th_cat_1', 'The cat', "The cat has left something outside your cabin door. It's a space weevil, mostly dead, and next to it, neatly arranged, are the drone parts the weevil had been eating.", [
  C("Say thank you. Mean it.", "The cat accepts your thanks with the air of someone who expects to be paid in tuna.", parts=3),
  C("Give it the last of the tinned fish.", "A sound like a small engine starts up. The crew gather round to listen. Best meeting you've had all voyage.", crewHeal=12, food=-1),
], thread='cat', step=1)
E(B, 'th_cat_2', 'The cat', "The cat is asleep on the navigation console. Specifically, on the jump controls. Specifically, on the big red one. {crew} reaches for it. The cat opens one eye.", [
  CH("Move the cat. Carefully.", .5, ("The cat allows itself to be moved, this once.", {}), ("The cat stretches. The ship jumps half a light-year sideways. On the bright side, the Mandate Fleet has no idea where you went either.", {"fleetPush": -.08, "fuel": -1})),
  C("Leave it. Navigate round the cat.", "You plot the next jump using only the controls the cat isn't on. It takes a while. It's oddly restful.", crewHeal=6),
], thread='cat', step=2)
E(B, 'th_cat_3', 'The cat', "A freighter hails you. A small girl is on the screen, holding up a drawing of a large ginger cat. \"His name's Admiral Biscuits,\" she says. \"He got on the wrong ship.\" Behind you, the cat has gone very still.", [
  C("Give him back.", "The handover takes an hour, because the cat insists on saying goodbye to every member of the crew, and the kettle. The girl's mum sends over a crate by way of thanks. The ship feels bigger without him. Worse, but bigger.", scrap=40, augment='random', endThread='cat'),
  C("\"Never seen him. Sorry.\"", "You close the channel. The cat looks at you for a long moment, then walks over and sits on your foot. You are going to hell, but you'll have company.", crewHeal=10, endThread='cat'),
], thread='cat', step=3)
E(B, 'th_cat_a1', '', '', [C("Hold the cat up to the camera.", "The pyrate captain goes quiet. \"Is that... is that a ginger one?\" It turns out pyrates are deeply superstitious about ginger cats. They let you through and ask for a photo.", scrap=10)], aside=True, thread='cat', into='pyrate')
E(B, 'th_cat_a2', '', '', [C("Send the cat in first.", "The cat strolls in, looks about, and strolls out again carrying something valuable in its mouth. It will not say where it got it.", scrap=22)], aside=True, thread='cat', into='gamble')

# ---- the cursed hat ----
E(B, 'th_hat_0', 'A hat', "A hat is floating in space. Not a helmet: a hat, a tall one with a buckle, turning slowly end over end. It has clearly been floating there for some time, and it is clearly waiting for someone.", [
  C("Bring it aboard. It's a good hat.", "{crew} puts it on \"for a laugh\" and immediately says: \"This hat is mine, it fits me well / and something's wrong, I can't quite tell.\" It won't come off. Everything they say now rhymes.", thread=T('hat', 'A cursed hat')),
  C("Leave the hat. Nothing good comes of space hats.", "You fly on. An hour later the hat is on the hat stand in the mess. You don't have a hat stand.", thread=T('hat', 'A cursed hat')),
], starts='hat', art='space')
E(B, 'th_hat_1', 'The hat', "The hat has opinions. {crew}, who is still wearing it, relays them: \"The hat would like a seat up front / it says your flying's rather blunt.\" The hat wants to sit at the helm.", [
  C("Let the hat have a go.", "The hat flies beautifully. It takes you the scenic route, through a field of salvage nobody else had spotted.", scrap=28),
  C("No. Hats don't fly ships.", "\"The hat is cross, the hat is vexed / it says that you'll be sorry next.\" The lights flicker. Something in engineering goes clunk.", damageSystem='random'),
], thread='hat', step=1)
E(B, 'th_hat_2', 'The hat', "\"A ship draws near, its guns are hot / the hat says shoot it. Quite a lot.\" {crew} points at an empty patch of sky. Three seconds later, a pyrate decloaks in it.", [
  C("Trust the hat.", "Your guns were already charged. The hat has its uses.", primeWeapons=True, fight='pyrate_gunship', afterWin={"text": "\"The foe is beaten, well done you / the hat would like its share. It's due.\" You give the hat a share. You're not sure how.", "scrap": 30}),
  C("Run for it.", "You're gone before the pyrate has finished decloaking. \"We could have won, the hat is sure / but running's fine. It's just a bore.\"", fuel=-1),
], thread='hat', step=2)
E(B, 'th_hat_3', 'The hat', "A hermit on a tiny moon waves you down. He is staring at the hat. \"That's Old Barnaby's hat,\" he says. \"Barnaby rhymed himself to death in '42. The hat needs a rhyme for 'orange.' Give it one and it'll let go.\"", [
  CH("\"Door hinge.\"", .6, ("The hat thinks about it. \"...That'll do.\" It lifts off, bows, and floats away into the dark. {crew} says a whole sentence in prose and bursts into tears.", {"crewHeal": 20, "scrap": 30, "endThread": "hat"}), ("\"That's a near rhyme at best,\" says the hat, in its own voice, which is worse. But it's bored now, and it leaves anyway, taking the mess-room cutlery with it.", {"scrap": -10, "endThread": "hat"})),
  C("Keep the hat. You've got used to it.", "The hermit shrugs. \"Your funeral. Well. Your poem.\" The hat settles in. From now on your logbook scans.", augment='random', endThread='hat'),
], thread='hat', step=3, art='planet')
E(B, 'th_hat_a1', '', '', [C("Ask the hat what to do.", "\"The left one's rigged, the right one's fine / take both of them, and then they're mine.\" You follow the hat's advice. It works out suspiciously well.", scrap=26)], aside=True, thread='hat', into='gamble')

# ---- the debt ----
E(B, 'th_debt_0', 'A friendly word', "A very large man in a very small ship pulls alongside. \"Evening. Big Kev. I do the door at the casino. You left without settling up.\" You don't remember going to a casino. \"They never do,\" says Big Kev, kindly. \"Forty scrap. No rush. Well. Some rush.\"", [
  C("Pay him now.", "\"Lovely. Pleasure doing business.\" He gives you a loyalty card with one stamp on it.", cost={"scrap": 40}, scrap=5),
  C("\"I'll get it to you.\"", "\"Course you will.\" He writes your name in a little book. The book is nearly full. The names near the front are crossed out.", thread=T('debt', 'You owe Big Kev')),
], starts='debt', minSector=2)
E(B, 'th_debt_1', 'Big Kev', "Two of Big Kev's associates are waiting at the beacon. They are called Small Kev and Medium Kev. \"Big Kev says hello,\" says Small Kev. \"And he says it's fifty now. Interest.\"", [
  C("Pay the fifty.", "Medium Kev counts it twice, moving his lips. \"All square. Big Kev says you're a gent.\"", cost={"scrap": 50}, endThread='debt'),
  C("\"Tell Big Kev he'll have to wait.\"", "Small Kev sighs. \"He said you'd say that.\" They don't shoot. They just take your spare fuel, slowly, while maintaining eye contact.", fuel=-3),
  C("Fight the Kevs.", "\"Oh, good,\" says Medium Kev. \"I get bored.\"", fight='pyrate_gunship', afterWin={"text": "The Kevs limp home. You get the feeling this isn't over. You also get their wallet.", "scrap": 30}),
], thread='debt', step=1)
E(B, 'th_debt_2', 'Big Kev', "A card arrives. It has a cartoon bear on it. \"It's my birthday,\" Big Kev has written inside. \"You're invited. Bring a present. The present is sixty scrap.\"", [
  C("Go to the party. Bring the sixty.", "It's a lovely party. There's a bouncy castle. Big Kev cries during the speeches. Your debt is cleared and you win the raffle.", cost={"scrap": 60}, weapon='random', crewHeal=15, endThread='debt'),
  C("Send a card instead.", "You send a card with a cartoon dog on it. A reply comes within the hour: \"Hurt. KEV.\"", fleetPush=.03),
], thread='debt', step=2)
E(B, 'th_debt_3', 'Big Kev', "Big Kev is waiting for you in person. He fills the screen. \"Right,\" he says. \"I've been thinking. You're never going to pay me, are you? So I've got a job for you instead. Bit of escort work. Do that, and we're friends.\"", [
  C("Take the job.", "You spend the afternoon escorting Big Kev's mum to bingo. She wins. She tips you. Big Kev tears your page out of the little book and eats it, as is traditional.", scrap=35, endThread='debt'),
  C("\"No. And I'm not paying either.\"", "A long silence. \"...Fair enough,\" says Big Kev. \"Nobody's ever just said no before.\" He seems lost. He leaves. You feel strangely bad about it.", endThread='debt'),
], thread='debt', step=3)
E(B, 'th_debt_a1', '', '', [C("\"Put it on Big Kev's tab.\"", "They go pale. \"You know Big Kev?\" They wave you through and give you something for the journey. Your debt, you suspect, has just got bigger.", fuel=2)], aside=True, thread='debt', into='pay')

# ---- space flu ----
E(B, 'th_flu_0', 'A sneeze', "{crew} sneezes on the bridge. Then again. Then eleven more times. \"I'm fine,\" they say, from behind a tissue. \"It's just a tickle.\" By teatime half the crew have the tickle.", [
  C("Carry on. It's only a cold.", "It's not only a cold. It's the Brindle Lurgy, and it's going round.", crewHurt=12, thread=T('flu', 'The Brindle Lurgy')),
  C("Everyone to bed with a hot lemon.", "You lose half a day. The Fleet gains a little. The crew are grateful and still disgusting.", fleetPush=.04, thread=T('flu', 'The Brindle Lurgy')),
], starts='flu')
E(B, 'th_flu_1', 'The Lurgy', "The Lurgy has reached the engine room. {crew} is trying to recalibrate the drive with a thermometer in their mouth. Everything is slightly damp. The ship smells of menthol.", [
  C("Make a huge pot of soup.", "It uses most of the pantry, and it's worth it. Nobody is better, but everybody is happier.", food=-2, crewHeal=18),
  C("Power through.", "Somebody sneezes into an open access panel. There's a bang.", damageSystem='random', crewHurt=8),
], thread='flu', step=1)
E(B, 'th_flu_2', 'The Lurgy', "A station refuses to let you dock. \"We can hear you coughing from here,\" says the harbourmaster. A hatch opens and a robot arm holds out a paper bag at full stretch. \"Chemist's on us. Please leave.\"", [
  C("Take the bag and go.", "It's cough sweets, a hot water bottle and a leaflet. The leaflet says REST. You do. Within a day the Lurgy has gone, taking with it everyone's sense of taste.", crewHeal=25, endThread='flu'),
  C("Cough at them until they open the shop.", "It works. They serve you through a letterbox, wearing gloves.", store=True, endThread='flu'),
], thread='flu', step=2, art='station')
E(B, 'th_flu_a1', '', '', [C("Cough on the screen.", "\"Is that the Lurgy?\" They back away from their own camera. \"Take it. Take whatever you want. Just go.\"", scrap=18)], aside=True, thread='flu', into='pyrate')

# ---- the crate ----
E(B, 'th_crate_0', 'A second parcel', "A man in a Courier Service uniform that doesn't quite fit asks you to take a crate \"just as far as Command.\" It's the size of a washing machine. It's stamped DO NOT OPEN, DO NOT TILT, DO NOT MAKE EYE CONTACT. He pays in advance.", [
  C("Take the crate.", "It goes in the hold next to The Parcel. That night {crew} swears they heard the two of them talking.", scrap=30, thread=T('crate', 'A crate that hums')),
  C("\"What's in it?\"", "\"Nothing,\" he says, far too fast. He pays double. You take the crate.", scrap=45, thread=T('crate', 'A crate that hums')),
], starts='crate')
E(B, 'th_crate_1', 'The crate', "The crate is humming. Not mechanically: a tune. {crew} has identified it as \"Blue Shift Blues\" by Gloria Pike. The crate is slightly flat on the high notes.", [
  C("Hum along.", "The crate goes quiet. Then, cautiously, it comes in on the harmony. The whole crew joins in. It's the best evening anyone's had since launch.", crewHeal=15),
  C("Bang on the lid and tell it to stop.", "It stops. It starts again at 3am, louder, and it's doing the key change.", crewHurt=5),
], thread='crate', step=1)
E(B, 'th_crate_2', 'The crate', "The crate is bigger. Nobody saw it grow, but it used to fit between the bulkheads and now it doesn't. The crew have a sweepstake going on what's inside. The leading bets are \"a piano,\" \"another crate,\" and \"my ex.\"", [
  C("Put ten scrap on \"another crate.\"", "You're in. The pot is getting quite big.", cost={"scrap": 10}, setFlag='crate_bet'),
  C("Captains don't gamble on cargo.", "You say this with great dignity. Nobody believes you. You don't believe you.", crewHeal=3),
], thread='crate', step=2)
E(B, 'th_crate_3', 'The crate', "The crate has opened. Nobody opened it. The lid is simply off, lying on the floor, and the crew are standing round it in a circle, looking in.", [
  CH("Look inside.", .5, ("It's a piano. A very good one. There's a note: \"For the Admiral's birthday. Sorry about the humming, it does that.\" Underneath the piano, somebody has stashed something much less musical.", {"weapon": "random", "scrap": 25, "endThread": "crate"}), ("It's another crate. It's stamped DO NOT OPEN. Whoever bet on that is going to be unbearable. Wedged beside it is a little something for your trouble.", {"augment": "random", "endThread": "crate"})),
  C("Put the lid back on. Nail it down. Never speak of it.", "You deliver it to Command still humming. A clerk signs for it without looking up. \"Oh, another one of those,\" she says.", scrap=50, endThread='crate'),
], thread='crate', step=3)

# ---- the celebrity ----
E(B, 'th_celeb_0', 'A passenger', "A woman in enormous sunglasses is waiting at the beacon with fourteen suitcases. \"Gloria Pike,\" she says, as if you might not know. You know. Everyone knows. \"My tour ship has broken down. You're going my way. I've decided.\"", [
  C("Welcome aboard, Miss Pike.", "She takes the biggest cabin, which was yours. She pays up front, in full, and calls everyone \"darling,\" including the cat, if you have one.", scrap=35, thread=T('celeb', 'Gloria Pike is aboard')),
  C("\"We're not a taxi.\"", "\"No,\" she agrees, looking round. \"Taxis are cleaner.\" She's aboard anyway. You're not sure how that happened.", thread=T('celeb', 'Gloria Pike is aboard')),
], starts='celeb', minSector=2, art='station')
E(B, 'th_celeb_1', 'Gloria Pike', "Gloria is rehearsing. The whole ship can hear. {crew} has stopped working and is standing in the corridor with their eyes shut. Even the engine seems to be keeping time.", [
  C("Let the crew listen.", "An hour of the best singing in the galaxy, for free. Nothing gets done. Nobody minds.", crewHeal=22),
  C("Ask her to keep it down.", "\"Keep it DOWN?\" She keeps it down. She keeps it down so pointedly that you can hear it through three bulkheads.", crewHurt=4),
], thread='celeb', step=1)
E(B, 'th_celeb_2', 'Gloria Pike', "Fans. Hundreds of them, in little ships with banners, swarming round you like bees. They've heard Gloria's aboard. They want autographs, photographs, and in one case a lock of her hair.", [
  C("Sell tickets to look through the window.", "Gloria is appalled, then impressed, then wants sixty per cent. You settle on forty.", scrap=45),
  C("Lose them in the asteroid field.", "Some fine flying. Gloria applauds, slowly. \"Not bad, darling. You should be on the stage. Sweeping it.\"", fuel=-1, xp={"skill": "pilot", "amt": 15}),
], thread='celeb', step=2)
E(B, 'th_celeb_3', 'Gloria Pike', "You've reached Gloria's venue: a concert hall built into a comet. She stands at the airlock with her fourteen suitcases. \"You've been adequate,\" she says. From Gloria, this is a five-star review. \"Come to the show. I'll dedicate one to the ship.\"", [
  C("Stay for the concert.", "She dedicates \"Blue Shift Blues\" to \"a horrid little ship and the darlings aboard it.\" There isn't a dry eye in the comet. Backstage, she presses something expensive into your hand.", crewHeal=30, augment='random', fleetPush=.04, endThread='celeb'),
  C("Wave her off. The Fleet won't wait.", "She blows the ship a kiss and leaves a suitcase behind by mistake. It's the one with the money in.", scrap=60, endThread='celeb'),
], thread='celeb', step=3, art='station')
E(B, 'th_celeb_a1', '', '', [C("\"Miss Pike, would you mind?\"", "Gloria leans into the camera and lowers her sunglasses. \"Darling. Be an angel and let us through.\" The pyrate captain is so starstruck he forgets to rob you, and pays for a signed photo.", scrap=20)], aside=True, thread='celeb', into='pyrate')
E(B, 'th_celeb_a2', '', '', [C("Have Gloria sing them something.", "She does eight bars. Whatever was about to happen doesn't. People put down what they were holding. Someone gives you a discount out of sheer emotion.", scrap=15, crewHeal=8)], aside=True, thread='celeb', into='pay')

# ---- the gnome ----
E(B, 'th_gnome_0', 'A gnome', "There is a garden gnome on the bridge. It has a red hat, a fishing rod and a painted smile. Nobody brought it aboard. {crew} moves it to the cargo hold. An hour later it's back on the bridge, and it's facing the other way.", [
  C("Leave it where it is.", "You leave it. It seems to like the view.", thread=T('gnome', 'The gnome')),
  C("Put it out of the airlock.", "You watch it tumble away into the dark. You go back to the bridge. You stop in the doorway. You go and have a lie down.", thread=T('gnome', 'The gnome')),
], starts='gnome')
E(B, 'th_gnome_1', 'The gnome', "The gnome is in the engine room now. Its fishing rod is pointing at a coolant pipe. When {crew} checks the pipe, it's a hair's breadth from bursting.", [
  C("Fix the pipe. Thank the gnome.", "You fix the pipe. You feel foolish thanking a gnome, so you do it quietly. The painted smile doesn't change. It never changes.", hull=3),
  C("Coincidence. Ignore it.", "The pipe bursts at 4am. The gnome is found nearby, dry, facing the wall, as if it can't bear to look.", damageSystem='engines'),
], thread='gnome', step=1)
E(B, 'th_gnome_2', 'The gnome', "There are two gnomes. The new one has a wheelbarrow. They're in the mess, at the table, facing each other. The crew are eating standing up in the corridor.", [
  C("Lay two more places.", "It seems only polite. In the morning the plates are clean and there's a small pile of scrap in the wheelbarrow.", food=-1, scrap=30),
  C("Separate them.", "You put one at each end of the ship. By morning they're together again, in your cabin, at the foot of your bunk.", crewHurt=3),
], thread='gnome', step=2)
E(B, 'th_gnome_3', 'The gnome', "A pyrate boarding party materialises on the bridge, cutlasses out. They stop. In front of them, in a neat row, are seven gnomes. Nobody moves. A pyrate whispers: \"...There were only two a minute ago.\"", [
  C("Say nothing. Let the gnomes handle it.", "The pyrates back into their teleporter very slowly. They leave their loot bag. When you turn round there's one gnome, with a fishing rod, and a painted smile, and it might be slightly wider.", scrap=45, missiles=2, endThread='gnome'),
  C("\"They're with me.\"", "The pyrates flee. The gnomes are gone by morning, all of them. On the bridge is a tiny wheelbarrow, with something in it for you.", augment='random', endThread='gnome'),
], thread='gnome', step=3)

# ---- the inspector ----
E(B, 'th_insp_0', 'An inspection', "A small grey shuttle docks without asking. A man with a clipboard steps aboard. \"Dennis Flaxby, Commonwealth Health and Safety. I'm here for your inspection. It's due.\" It is not due. It has never been due. \"It's due now,\" says Dennis.", [
  C("Show him round.", "He writes something down in the first corridor. And the second. He writes something down when you offer him tea. He'll be with you \"for the duration.\"", thread=T('insp', 'Dennis from Health & Safety')),
  C("Tell him there's a war on.", "\"That's no excuse for an untidy airlock.\" He's unpacking a sleeping bag. It has his name sewn in.", thread=T('insp', 'Dennis from Health & Safety')),
], starts='insp')
E(B, 'th_insp_1', 'Dennis', "Dennis has found the missile rack. \"These are unsecured,\" he says. \"These are live missiles, and they're held in with bungee cord.\" They've always been held in with bungee cord. \"I'll have to impound two.\"", [
  C("Let him impound them.", "He puts them in his shuttle and gives you a receipt. In fairness, he then fixes the rack properly, and several other things nobody had noticed were broken.", missiles=-2, hull=6),
  C("Slip him twenty scrap.", "Dennis looks at the scrap. He looks at you. He writes \"ATTEMPTED BRIBE\" on his clipboard, underlines it, and takes the scrap as evidence.", cost={"scrap": 20}),
], thread='insp', step=1)
E(B, 'th_insp_2', 'Dennis', "Dennis has laminated things. There are signs everywhere. THIS DOOR IS A DOOR. CAUTION: SPACE. The kettle has a risk assessment taped to it. But {crew} admits the ship has never run better.", [
  C("Thank him. Through gritted teeth.", "\"Just doing my job,\" says Dennis, who has plainly never been thanked before and goes pink to the ears. He services the fire system on the house.", hull=5, crewHeal=8),
  C("Take the signs down.", "He puts them back up. You take them down. This goes on for some time. It's the most exercise anyone's had in weeks.", xp={"skill": "repair", "amt": 12}),
], thread='insp', step=2)
E(B, 'th_insp_3', 'Dennis', "Dennis stands at the airlock with his clipboard and his sleeping bag. \"Inspection complete. You've failed on forty-one counts.\" He hesitates. \"But I've passed you. Don't tell anyone. It's been...\" He searches for the word. \"...Non-compliant. In a good way.\"", [
  C("Shake his hand.", "He shakes it for exactly the recommended length of time. He leaves you a certificate, a fire extinguisher, and, tucked behind the kettle, a laminated card that says GOOD LUCK.", augment='random', hull=4, endThread='insp'),
  C("Offer him a job.", "Dennis looks at the ship, the scorch marks, the bungee cords. \"...I've got three weeks' leave owing,\" he says slowly. He stays.", crew='human', endThread='insp'),
], thread='insp', step=3)
E(B, 'th_insp_a1', '', '', [C("\"Dennis? There's a ship here you should see.\"", "Dennis looks at their ship through the window for a long time. Then he gets his clipboard. They surrender rather than let him aboard, and pay you to take him away.", scrap=30)], aside=True, thread='insp', into='fight')

# ---- weevils ----
E(B, 'th_weev_0', 'A scratching', "Something is scratching inside the walls. {crew} takes off a panel. Sixteen small black eyes look back. A space weevil chews, thoughtfully, on a length of cable. Then it burps.", [
  C("Lay traps.", "You catch one. There are definitely more than one.", thread=T('weev', 'Weevils in the walls')),
  C("Name it. Maybe it's friendly.", "You name it Colin. By morning there are a lot of Colins.", thread=T('weev', 'Weevils in the walls')),
], starts='weev')
E(B, 'th_weev_1', 'The weevils', "The weevils have found the pantry. They've eaten the biscuits, the tea bags, and a tin of beans, including the tin.", [
  C("Move the food into the airlock.", "It's cold, but it's safe. Dinner now involves a spacesuit.", food=-2),
  C("Poison the lot of them.", "It works on about half. The other half seem to have enjoyed it.", food=-1, crewHurt=5),
], thread='weev', step=1)
E(B, 'th_weev_2', 'The weevils', "The weevils have learned to open doors. {crew} watched one do it: it reached up, pressed the panel, and went through, and then, and this is the part that's worrying everyone, it closed the door behind it.", [
  CH("Lure them into the cargo hold and vent it.", .65, ("They go for the bait. You open the hold to space. A cloud of weevils drifts away behind you, still chewing.", {"endThread": "weev", "scrap": 15}), ("They're wise to it. They've eaten the bait, the trap, and the airlock seal.", {"hull": -3, "damageSystem": "doors"})),
  C("Pay an exterminator at the next station.", "A man in overalls spends an hour aboard and comes out grey. \"Never seen anything like it. One of them offered me a cup of tea.\" But they're gone.", cost={"scrap": 30}, endThread='weev'),
], thread='weev', step=2)

# ---- the ghost ----
E(B, 'th_ghost_0', 'Cold on the bridge', "The bridge is cold. The captain's chair is turning slowly, by itself. A faint voice says: \"You've got the trim wrong.\" It's the ship's previous captain. The previous captain is, by all accounts, dead.", [
  C("\"Who's there?\"", "\"Captain Ignatius Marr. This was my ship for thirty years. You're flying her like a shopping trolley.\" He's staying. He has notes.", thread=T('ghost', 'The last captain\'s ghost')),
  C("Fix the trim.", "\"...Better,\" says the voice, grudgingly. The chair stops turning. You have a feeling you're being watched, and marked out of ten.", thread=T('ghost', 'The last captain\'s ghost')),
], starts='ghost')
E(B, 'th_ghost_1', 'Captain Marr', "\"In my day,\" says Captain Marr, from somewhere near the ceiling, \"we knew every beacon in this sector by heart.\" He starts listing them. It takes an hour. But he does know every beacon in this sector.", [
  C("Write them down.", "The map fills in. \"And don't go to that one,\" he adds. \"The toilets are a disgrace.\"", reveal=True),
  C("\"Yes, thank you, Captain.\"", "\"Don't you 'yes, thank you' me.\" He sulks. The heating goes off for an hour.", crewHurt=3),
], thread='ghost', step=1)
E(B, 'th_ghost_2', 'Captain Marr', "The crew have asked you to have a word. Captain Marr has been haunting the showers. \"I'm not haunting them,\" he says. \"I'm inspecting them. Standards have slipped.\"", [
  C("Agree some boundaries.", "Not the showers, not the bunks, and not during meals. In return he gets the bridge on the night watch. The night watch has never been so well kept.", crewHeal=10, xp={"skill": "pilot", "amt": 12}),
  C("Call in a priest.", "The priest stays for tea, has a lovely chat with the Captain about the old days, and leaves without doing anything. \"He's no trouble,\" she says. \"He's just bored.\"", cost={"scrap": 10}),
], thread='ghost', step=2)
E(B, 'th_ghost_3', 'Captain Marr', "A ship jumps in on your tail, guns hot. The lights dim. \"Oh, I know this one,\" says Captain Marr, and for the first time he sounds happy. \"I've been waiting forty years for this one. May I?\"", [
  C("\"The bridge is yours, Captain.\"", "The ship moves like it's remembered something. Your guns fire before you touch them.", primeWeapons=True, fight='pyrate_gunship', afterWin={"text": "\"That,\" says Captain Marr, \"is how it's done.\" The cold lifts. The chair turns once more, and stops. On the seat there's an old captain's badge, and the bridge is very quiet.", "scrap": 40, "augment": "random", "endThread": "ghost"}),
  C("\"My ship now. Watch and learn.\"", "\"Hmph.\" But he watches.", fight='pyrate_gunship', afterWin={"text": "A pause. \"...Seven out of ten,\" says the ceiling. Then, quieter: \"She's in good hands.\" He doesn't speak again.", "scrap": 30, "endThread": "ghost"}),
], thread='ghost', step=3)

# ---- crossovers: two loose ends meet ----
E(B, 'th_x_cat_weev', 'The cat and the weevils', "The scratching in the walls has stopped. So has everything else in the walls. The cat is lying in the corridor, twice its usual width, with a leg sticking out of its mouth. It isn't the cat's leg.", [
  C("Good cat.", "The best cat. There isn't a weevil left aboard. In their nests you find everything they'd been hoarding.", parts=4, scrap=20, endThread='weev'),
], threads=['cat', 'weev'])
E(B, 'th_x_cat_gnome', 'The cat and the gnome', "The cat has found the gnome. It pats it. The gnome falls over. The cat pats it again. This has been going on for two hours. The gnome keeps getting back up. Nobody has seen it get back up.", [
  C("Leave them to it.", "By evening they've reached an understanding. The cat is asleep. The gnome is next to it. The gnome's painted hand is on the cat's head.", crewHeal=10),
  C("Put the gnome on a high shelf.", "The cat looks at the shelf. The cat looks at you. In the morning the gnome is on the floor and so is everything else that was on the shelf.", scrap=-5),
], threads=['cat', 'gnome'])
E(B, 'th_x_cat_crate', 'The cat and the crate', "The cat is sitting on the crate. The crate has stopped humming and is, unmistakably, purring. The cat is not purring. It's the crate.", [
  C("Don't ask.", "You don't ask. Some things on a ship are between a cat and a crate.", crewHeal=8),
], threads=['cat', 'crate'])
E(B, 'th_x_cat_celeb', 'The cat and Gloria', "Gloria Pike is allergic to cats. She has announced this to the whole ship. The cat has responded by moving into her cabin, on to her pillow, on top of her spare wig.", [
  C("Take Gloria's side.", "You remove the cat. Gloria is gracious about it. The cat is not. You find a weevil in your boot.", scrap=15),
  C("Take the cat's side.", "\"I see,\" says Gloria. By evening the cat is on her lap and she's feeding it smoked salmon from her own supply. \"It's not the cat I mind, darling. It's losing.\"", crewHeal=12),
], threads=['cat', 'celeb'])
E(B, 'th_x_hat_celeb', 'The hat and Gloria', "Gloria Pike has seen the hat. \"Darling, where did you GET it?\" Before anyone can stop her, she's put it on. \"This hat's divine, I look a treat / it brings out my... oh. Oh, that's NEAT.\" She does a whole show in rhyme. The crew request an encore.", [
  C("Record it.", "The recording gets out. \"Gloria Pike: The Hat Sessions\" goes to number one. She cuts you in.", scrap=50),
  C("Get the hat back before she keeps it.", "It takes three of you. The hat didn't want to leave either.", crewHurt=4, crewHeal=10),
], threads=['hat', 'celeb'])
E(B, 'th_x_hat_insp', 'The hat and Dennis', "Dennis has confiscated the hat as a hazard. He's wearing it so he can carry his clipboard. \"Regulation four, sub-section B / all hats aboard must go through me. Oh no.\"", [
  C("Help him get it off.", "It takes butter, a crowbar and an apology to the hat. Dennis is shaken. He doesn't write anything down for a whole day.", crewHeal=6),
  C("Leave it on him for a bit.", "A rhyming safety briefing turns out to be the only kind the crew have ever listened to. Nobody gets hurt for a week.", hull=4, xp={"skill": "repair", "amt": 10}),
], threads=['hat', 'insp'])
E(B, 'th_x_debt_celeb', 'Big Kev and Gloria', "Big Kev's collectors have arrived. Then they see who's standing behind you. Medium Kev takes off his hat. \"Miss Pike. My mum's got all your records.\"", [
  C("Let Gloria sort it out.", "Gloria records a birthday message for Big Kev's mum, there and then. Small Kev cries. Your debt is cancelled, and Big Kev sends flowers. To Gloria.", endThread='debt', crewHeal=8),
], threads=['debt', 'celeb'])
E(B, 'th_x_debt_crate', 'Big Kev and the crate', "\"Tell you what,\" says Big Kev, eyeing the crate in your hold. \"Give me that and we'll call it quits.\" The crate stops humming. You have the strong impression that it's listening.", [
  C("Hand over the crate.", "The Kevs carry it out between them. As it goes, it hums something reproachful. An hour later you get a message: \"IT WON'T STOP. TAKE IT BACK. WE'RE SQUARE. KEV.\"", endThread='debt', scrap=20),
  C("\"The crate stays.\"", "The crate hums a little fanfare. Big Kev narrows his eyes. \"Weird ship,\" he says, and adds ten to your tab.", crewHeal=5),
], threads=['debt', 'crate'])
E(B, 'th_x_insp_weev', 'Dennis and the weevils', "Dennis has opened a wall panel to check the wiring. He's been standing there for a full minute, not moving, looking at what's looking back. His clipboard has slipped from his fingers.", [
  C("Close the panel for him.", "\"Those are a category nine,\" he says, in a small voice. He spends the night writing. By morning there's a forty-page extermination plan, and it works.", endThread='weev', hull=3),
  C("\"They're called Colin.\"", "Dennis sits down on the floor. One of the weevils brings him a biscuit. It's one of your biscuits. He eats it.", crewHeal=6),
], threads=['insp', 'weev'])
E(B, 'th_x_insp_flu', 'Dennis and the Lurgy', "Dennis has caught the Lurgy. He's filled in a form about it. The form requires him to quarantine himself from himself, and he's doing his best.", [
  C("Bring him soup.", "He risk-assesses the soup, then eats it. \"You're a good crew,\" he says, thickly. \"Terrible ship. Good crew.\" He signs off your fire system on the spot.", food=-1, hull=5),
], threads=['insp', 'flu'])
E(B, 'th_x_flu_celeb', 'Gloria and the Lurgy', "Gloria has lost her voice. She's communicating by writing on a little pad. The pad says: \"WHO SNEEZED ON ME.\" Then: \"I HAVE A CONCERT.\" Then, underlined three times: \"NAMES.\"", [
  C("Honey, lemon, and total silence.", "It takes two days of the whole crew whispering. Her voice comes back, deeper, with a bit of gravel in it. She loves it. \"I sound like I've LIVED, darling.\"", food=-1, scrap=30),
  C("Suggest she cancels.", "The pad says: \"NEVER.\" Then a second page, just for you. You've been told off by professionals, and this is the best.", crewHurt=3),
], threads=['flu', 'celeb'])
E(B, 'th_x_ghost_gnome', 'The Captain and the gnome', "\"That's not mine,\" says Captain Marr, quickly. The gnome is on the bridge, facing the chair. \"Never seen it before.\" The cold on the bridge has an edge of something new. If you didn't know better, you'd say the ghost was nervous.", [
  C("\"Captain. What did you do?\"", "A long silence. \"...I ran over a garden once. On Brindle. Emergency landing. There were casualties.\" The gnome's smile doesn't change. Marr apologises to it, formally, on the record. In the morning there's scrap in a tiny wheelbarrow, and the two of them seem to have made their peace.", scrap=35, crewHeal=8),
], threads=['ghost', 'gnome'])
E(B, 'th_x_ghost_hat', 'The Captain and the hat', "\"That's Barnaby's hat,\" says Captain Marr. \"I served with Barnaby. Insufferable man. Worse poet.\" The hat turns, slowly, to face the empty chair. \"Marr, you old goat, you're dead, I see / well so am I. Come sit with me.\"", [
  C("Leave the two of them to catch up.", "They talk all night: one in verse, one in complaints. In the morning both seem lighter, and somebody has left you the benefit of eighty years' experience, written out in a shaky hand that rhymes.", reveal=True, xp={"skill": "weapons", "amt": 15}),
], threads=['ghost', 'hat'])
E(B, 'th_x_gnome_insp', 'Dennis and the gnome', "Dennis has tagged the gnome as an unsecured item. He's put it in a locker. He's opened the locker to check. He's closed the locker. He's standing with his back against the locker, breathing carefully.", [
  C("\"It does that, Dennis.\"", "\"There's nothing in the regulations,\" he whispers. \"I've looked.\" He writes a new regulation. It's one line long. It says: LEAVE THE GNOME ALONE.", crewHeal=8, hull=2),
], threads=['gnome', 'insp'])

# =====================================================================
# mod: Telly Night (British television, parodied)
# =====================================================================
TV = {}
E(TV, 'tv_locum_0', 'A blue box', "A tall blue box appears on your bridge with a noise like someone dragging a key down a piano. The sign on it says PORTABLE LAVATORY. A man in a long scarf and a worse jacket leans out. \"Hello! I'm the Locum. Is this 1963? No? Is it Cardiff?\"", [
  C("\"Who?\"", "\"No, the Locum. I'm filling in. The regular chap's on holiday.\" He's staying for a bit. The box is bigger on the inside. So, he warns you, is the queue.", thread=T('locum', 'The Locum and his blue box')),
  C("Ask him to move his toilet.", "\"It's not a toilet, it's a time machine. It's disguised as a toilet. The disguise is stuck.\" He's staying.", thread=T('locum', 'The Locum and his blue box')),
], starts='locum')
E(TV, 'tv_locum_1', 'The Locum', "The Locum is waving a small buzzing torch at your engines. \"I can fix this. I can fix anything with this. Except wood. And feelings.\" Everything he points it at either works much better or catches fire.", [
  CH("Let him carry on.", .6, ("The engines have never run better. He says he's reversed the polarity. He says that a lot.", {"upgrade": "engines"}), ("\"That wasn't supposed to happen. Run!\" Running doesn't help. It's your ship.", {"fire": True, "scrap": 15})),
  C("Take the torch off him.", "He sulks, then produces an identical torch from another pocket. He has lots of pockets.", crewHeal=5),
], thread='locum', step=1)
E(TV, 'tv_locum_2', 'The Locum', "Angry pepper pots. A whole fleet of them, gliding up to your hull, shouting in flat metal voices: \"EX-TER-MIN-ATE! EX-TER... oh. STAIRS.\" Your airlock has three steps up. The Locum is delighted. \"They've never cracked stairs!\"", [
  C("Shout encouragement.", "They mill about at the bottom for an hour, then leave, embarrassed. They drop something in their hurry.", weapon='random', endThread='locum'),
  C("Open fire while they're stuck.", "\"Bit unsporting,\" says the Locum, approvingly.", fight='auto_scoundrel', afterWin={"text": "\"Right! Must dash. I've left a kettle on in the Renaissance.\" The box fades away with its awful noise. He's left you a note: \"You were brilliant. All of you. Even the one who made that tea.\"", "scrap": 45, "endThread": "locum"}),
], thread='locum', step=2)
E(TV, 'tv_hotel_0', "Sybil's Rest", "A hotel, built on a windy asteroid. The sign says SYBIL'S REST and, underneath, in different paint, NO RIFF-RAFF. A tall, furious man in a moustache is hitting the docking clamp with a branch. \"Right! That's it! I've warned you before!\"", [
  C("Book a room.", "\"A ROOM? Oh, I see, you want a ROOM. In a HOTEL. How extraordinary.\" He gives you a key. It's for the wrong room. The right room has someone in it.", cost={"scrap": 10}, crewHeal=15, thread=T('hotel', 'A stay at Sybil\'s Rest')),
  C("Just the restaurant, thanks.", "The waiter is from the Barcelona Relay and is doing his best. \"Is not duck. Is... hamster?\" It's lovely, whatever it is.", food=2, thread=T('hotel', 'A stay at Sybil\'s Rest')),
], starts='hotel', art='station')
E(TV, 'tv_hotel_1', "Sybil's Rest", "There's a hotel inspector staying, and the owner has decided it's you. He is suddenly, terrifyingly nice. \"More wine? A bigger room? My wife's room? Ha ha! No, seriously, take it, I'll sleep in the kitchen.\"", [
  C("Play along.", "You get the best of everything, free. On the way out you pass the real inspector, who is trapped in a cupboard with a moose's head.", scrap=30, crewHeal=20, endThread='hotel'),
  C("Tell him the truth.", "He goes white, then red, then a colour there isn't a name for. \"...I KNEW that,\" he says, and charges you for the wine.", scrap=-15, endThread='hotel'),
], thread='hotel', step=1, art='station')
E(TV, 'tv_trot_0', 'A three-wheeled shuttle', "A filthy yellow shuttle with three engines, one of which is on fire, pulls up alongside. Painted on the side: TROTTING INDEPENDENT TRADERS. NEW YORK, PARIS, BRINDLE IV. A man in a sheepskin coat leans out. \"All right? Have I got a deal for you, my son.\"", [
  C("Hear him out.", "It's a consignment of hooky inflatable escape pods. \"They're top quality. Only one of them sings.\" You take some. This is a mistake you'll be making again.", cost={"scrap": 15}, parts=2, thread=T('trot', 'Business with the Trotting brothers')),
  C("\"Not today, thanks.\"", "\"No problem, no problem. Here, have my card. This time next sector, we'll be millionaires.\" The card is a beer mat.", thread=T('trot', 'Business with the Trotting brothers')),
], starts='trot')
E(TV, 'tv_trot_1', 'The Trottings', "The yellow shuttle again. The tall, gormless brother is at the window holding up a sign that says HELP. The one in the sheepskin grabs the radio. \"Ignore him. Listen: chandeliers. Stately space-home. Two hundred scrap, cash. I just need someone to hold the ladder.\"", [
  CH("Hold the ladder.", .5, ("Against every expectation, it goes perfectly. He's so shocked he pays you properly.", {"scrap": 45, "endThread": "trot"}), ("You hold the wrong ladder. The crash can be heard two sectors away. \"Don't tell Grandad,\" he says, and legs it.", {"hull": -2, "scrap": 10, "endThread": "trot"})),
  C("Buy the tall one a drink instead.", "He tells you about his diploma, his art, and how his brother once fell through a bar. Best night out all voyage.", cost={"scrap": 5}, crewHeal=18, endThread='trot'),
], thread='trot', step=1)
E(TV, 'tv_bake_0', 'A tent in space', "There is a marquee in orbit: bunting, pastel fridges, and twelve terrified people in aprons. A very polite man with very blue eyes hails you. \"Welcome to the Great Galactic Bake Off. We're a baker short. Can any of you make a sponge?\"", [
  C("Enter {crew}.", "{crew} has never baked anything. They're given an apron, a bench, and four hours to make a showstopper in the shape of a famous landmark.", thread=T('bake', 'In the Bake Off')),
  C("Just watch.", "You're roped in anyway, to carry things. Someone has put their custard in someone else's fridge. The atmosphere is murderous.", thread=T('bake', 'In the Bake Off')),
], starts='bake', art='station')
E(TV, 'tv_bake_1', 'The Bake Off', "Judging. {crew}'s showstopper is a scale model of Commonwealth Command in ginger biscuit. It's leaning. The blue-eyed judge presses it with one finger. There's a long, long silence.", [
  CH("Hope.", .5, ("He holds out his hand. A handshake. The tent gasps. {crew} will be telling this story for the rest of their life, and yours.", {"crewHeal": 30, "scrap": 40, "endThread": "bake"}), ("\"It's raw in the middle. And it's got a soggy bottom.\" {crew} takes it well, which is to say they cry in the airlock.", {"food": 3, "endThread": "bake"})),
  C("Distract the judges and swap the cakes.", "You're caught at once. You are escorted from the tent by a comedian. Still: you got the cake.", food=4, crewHeal=6, endThread='bake'),
], thread='bake', step=1, art='station')
E(TV, 'tv_ac_0', 'An interview', "An unmarked ship. Three officers in lanyards. \"Anti-Corruption Unit 13. We're investigating bent couriers. For the benefit of the tape, you are being shown item fourteen in your folder.\" Item fourteen is a photograph of you, eating a pasty.", [
  C("\"No comment.\"", "A very long beep. \"Mother of God,\" says the one in the waistcoat. They'll be watching you.", thread=T('ac', 'Under investigation by AC-13')),
  C("Explain about the pasty.", "They write for a long time. \"We're interested in one thing, and one thing only: catching bent couriers.\" They'll be watching you.", thread=T('ac', 'Under investigation by AC-13')),
], starts='ac', minSector=2)
E(TV, 'tv_ac_1', 'AC-13', "They're back. The waistcoat one leans in. \"We've had a tip-off about a senior officer in the Courier Service. Goes by a single letter. We think it's H.\" A pause. \"Or possibly the letter after G. We're not ruling it out.\"", [
  C("Help them with their enquiries.", "You spend a day going through files. The bent courier turns out to be a filing error. They buy you a pint and stamp your record CLEAN, which is more than the ship is.", scrap=35, reveal=True, endThread='ac'),
  C("\"Am I free to go?\"", "\"You are. For now.\" Beeeeeeeep. On your way out you pinch a box of their biscuits. Item fifteen.", food=2, endThread='ac'),
], thread='ac', step=1)
E(TV, 'tv_thrust_0', 'Three men and a camera', "Three middle-aged men in three ridiculous ships are blocking the lane and arguing. One is very tall and shouting. One is very small and has crashed. One is very slow and is explaining something about gearboxes. A camera drone swings to face you. \"Aha! A challenger!\"", [
  C("Accept the challenge.", "The challenge is to cross the sector in a ship bought for less than fifty scrap. Yours qualifies. They find this very funny.", thread=T('thrust', 'A challenge from Top Thrust')),
  C("Try to get past.", "\"He's getting away!\" \"He's not getting away, he's doing four knots.\" You're in the programme now, whether you like it or not.", thread=T('thrust', 'A challenge from Top Thrust')),
], starts='thrust')
E(TV, 'tv_thrust_1', 'Top Thrust', "The race. The tall one has fitted a much bigger engine and is on fire. The small one has crashed again. The slow one is winning, and nobody is more surprised than he is. Some say a silent pilot in a white helmet is watching from a nearby moon. All we know is, he's called the Stag.", [
  CH("Floor it.", .55, ("You win by a nose. \"And on that bombshell,\" says the tall one, and the camera cuts off. They send your prize by post.", {"scrap": 50, "xp": {"skill": "pilot", "amt": 20}, "endThread": "thrust"}), ("You come fourth out of four. The slow one pats your hull. \"Honestly, I thought you did very well.\"", {"fuel": -2, "crewHeal": 8, "endThread": "thrust"})),
  C("Cheat. Everyone else is.", "You take a short cut through a nebula. So do they. You all get lost together and end up in a pub.", crewHeal=20, fuel=-1, endThread='thrust'),
], thread='thrust', step=1)
E(TV, 'tv_task_0', 'A task', "A wax-sealed envelope floats in through the airlock. Inside, a card: \"Deliver this potato to the Taskmistress without it touching the floor. Fastest wins. Your time starts now.\" There's a potato. A small man with a tablet is standing in the corner. He was not there before.", [
  C("Start. Obviously.", "{crew} puts the potato in a sock and swings it. The small man makes a note. \"Interesting,\" he says, in a way that means it isn't.", thread=T('task', 'Tasks from the Taskmistress')),
  C("Ask the small man what's going on.", "\"All the information is on the task.\" He will say this, and only this, for as long as you know him.", thread=T('task', 'Tasks from the Taskmistress')),
], starts='task')
E(TV, 'tv_task_1', 'The Taskmistress', "The studio. A huge, magnificent woman on a throne regards your potato. It has been through a lot. \"You were told it mustn't touch the floor. You've brought it here in a SOCK. Is a sock a floor? Little Alan?\" The small man checks his tablet.", [
  CH("Argue that a sock is not a floor.", .5, ("\"...I'll allow it. Five points.\" The audience roars. You win the episode and a prize somebody else brought in: it's their dad's golf clubs, and something better.", {"augment": "random", "endThread": "task"}), ("\"A sock is a floor for a FOOT. One point.\" You're beaten by a man who ate his potato.", {"scrap": 10, "endThread": "task"})),
  C("Bribe Little Alan.", "He takes the money. \"All the information is on the task,\" he says, and gives you two points.", cost={"scrap": 10}, scrap=25, endThread='task'),
], thread='task', step=1, art='station')
E(TV, 'tv_peaky_0', 'Flat caps', "The bar goes quiet. Six men in long coats and flat caps walk in, slowly, to music only they can hear. The one in front has cheekbones you could cut cheese on. \"This beacon,\" he says, \"is under new management. By order of the Peaky Bonnets.\"", [
  C("Buy them a drink.", "He drinks it without blinking. He hasn't blinked since he came in. \"You're all right. For a courier. We may have work for you.\"", cost={"scrap": 10}, thread=T('peaky', 'Known to the Peaky Bonnets')),
  C("\"Under whose order?\"", "All six say it again, slowly, with a key change. There are razor blades sewn into their caps. One of them has cut himself putting his on.", thread=T('peaky', 'Known to the Peaky Bonnets')),
], starts='peaky', art='station')
E(TV, 'tv_peaky_1', 'The Peaky Bonnets', "A job. They want a crate of \"horse liniment\" moved past a Mandate checkpoint. The cheekbone one stares into the middle distance and says something about ambition and his mother. It takes four minutes. You've agreed before he finishes.", [
  CH("Run the checkpoint.", .6, ("Clean through. \"You've done us a service,\" he says, and walks away from you in slow motion, into smoke that wasn't there a moment ago.", {"scrap": 55, "endThread": "peaky"}), ("The Mandate open the crate. It really is horse liniment. Nobody knows what to do. You're fined for wasting everyone's time.", {"scrap": -15, "endThread": "peaky"})),
  C("Decline. Politely. Very politely.", "\"Nobody says no to the Peaky Bonnets.\" A pause. \"...But we respect it.\" They leave in slow motion, which takes ages.", endThread='peaky'),
], thread='peaky', step=1)
E(TV, 'tv_dads_0', "Don't panic", "A squad of very elderly men in ill-fitting uniforms have set up a roadblock made of deckchairs. A pompous one with a moustache holds up a hand. \"Halt! Walmington Asteroid Home Guard! We're the last line of defence against the Mandate!\" Behind him, an older one is running in circles shouting \"DON'T PANIC!\"", [
  C("Show them your papers.", "He reads them upside down. \"These seem to be in order. Carry on. Stupid boy,\" he adds, to someone else. They'd like to help with the war. They're quite insistent.", thread=T('dads', "The Home Guard is 'helping'")),
  C("Salute.", "They all salute back. One of them falls over. They've decided you're top brass, and they're coming with you.", thread=T('dads', "The Home Guard is 'helping'")),
], starts='dads')
E(TV, 'tv_dads_1', 'The Home Guard', "A Mandate scout has found you. The Home Guard have formed up on your hull in spacesuits with broom handles. The very old one would like to be excused. The gloomy Scottish one says you're all doomed. The scout's captain is watching this on his screen, completely baffled.", [
  C("Let them have their moment.", "\"They don't like it up 'em!\" The scout, unsure what it's looking at and unwilling to shoot pensioners, withdraws. The platoon is unbearable for a week. They give you their tea money.", scrap=30, crewHeal=15, fleetPush=-.05, endThread='dads'),
  C("Get them inside and fight properly.", "\"We were just getting started!\"", fight='rebuff_scout', afterWin={"text": "The platoon claims the victory. You let them. The captain gives a speech. The old one finally gets to be excused.", "scrap": 35, "endThread": "dads"}),
], thread='dads', step=1)
E(TV, 'tv_antiq_0', 'A queue', "A long queue of people holding vases, clocks and one stuffed owl winds across the station concourse towards a table with an umbrella over it. A woman in a scarf beams at you. \"Antiques Roadship! Have you brought something for our experts?\"", [
  C("Show them the kettle.", "The expert turns it over. \"Now, this is very interesting. Do you know what you have here?\" You hold your breath. \"It's a kettle.\" But he'd like a second look at something else aboard.", thread=T('antiq', 'A valuation pending')),
  C("Show them The Parcel.", "\"Ooh.\" He puts on white gloves. \"I'm not allowed to open this, am I? No. But the wrapping alone...\" He wants to consult a colleague.", thread=T('antiq', 'A valuation pending')),
], starts='antiq', art='station')
E(TV, 'tv_antiq_1', 'Antiques Roadship', "The valuation. A small crowd has gathered. The expert holds up the dented thing {crew} has been using as a doorstop. \"This is a Precursor navigational sphere. Have you any idea what it would fetch at auction?\"", [
  CH("\"No...?\"", .5, ("\"Between four and six hundred scrap.\" The crowd goes \"ooooh.\" {crew} says the thing everyone says: \"Oh, we'd never sell it.\" You sell it immediately.", {"scrap": 80, "endThread": "antiq"}), ("\"About a fiver. It's a reproduction. A bad one. But it's a lovely thing to have.\" The crowd goes \"aww.\"", {"scrap": 5, "crewHeal": 5, "endThread": "antiq"})),
  C("Keep it as a doorstop.", "\"Quite right,\" says the expert, visibly in pain. He gives you his card and a discount at the station shop.", store=True, endThread='antiq'),
], thread='antiq', step=1, art='station')
E(TV, 'tv_cunning_0', 'A cunning plan', "A sneering man in black hails you from a very small, very shabby warship. Beside him stands a filthy little man holding a turnip. \"Captain Edmund Blackrudder. I find myself, through no fault of my own, in need of a ship that works. My dogsbody has a plan.\" \"I have a cunning plan, sir,\" says the dogsbody.", [
  C("Hear the cunning plan.", "The plan involves the turnip, a false moustache, and you. \"It's so cunning,\" says the dogsbody, \"you could pin a tail on it and call it a weasel.\" Against your better judgement, you're in.", thread=T('cunning', 'Part of a cunning plan')),
  C("Decline with a withering remark.", "Blackrudder looks at you with new respect. \"That was almost good. You've the wit of a man with half a brain, which around here makes you a professor.\" You're in anyway.", thread=T('cunning', 'Part of a cunning plan')),
], starts='cunning')
E(TV, 'tv_cunning_1', 'The cunning plan', "The plan has gone wrong in every way a plan can. You're disguised as a nun. The turnip has been arrested. Blackrudder is describing the dogsbody's intelligence, at length, by comparing it to various farmyard objects.", [
  CH("Improvise.", .55, ("You talk your way out, with the turnip. Blackrudder pays up, bitterly. \"I'd thank you, but it would be like thanking a gnat for not being a wasp.\"", {"scrap": 50, "endThread": "cunning"}), ("You're all thrown out of an airlock, fortunately a ground-floor one. The dogsbody has another cunning plan. You leave before you can hear it.", {"hull": -2, "scrap": 15, "endThread": "cunning"})),
  C("Sell them both out.", "\"The first sensible thing anyone's done all day,\" says Blackrudder, being led away. The dogsbody gives you his turnip. It's the nicest thing anyone's ever given you.", scrap=30, food=1, endThread='cunning'),
], thread='cunning', step=1)
E(TV, 'tv_office_0', 'A paper asteroid', "A grey office block on a grey asteroid: Slough Relay Paper Merchants. The regional manager meets you at the airlock with a little dance. \"I'm a friend first, a boss second, and probably an entertainer third.\" Behind him, an employee looks straight at the security camera and sighs.", [
  C("Buy some paper.", "He does an impression. You don't know what it's of. Nor does he. Someone has put the stapler in jelly again.", cost={"scrap": 5}, thread=T('office', 'A visit to the paper merchants')),
  C("Ask for the toilets.", "\"There's good news and bad news,\" he says, and plays the guitar at you.", thread=T('office', 'A visit to the paper merchants')),
], starts='office', art='station')
E(TV, 'tv_office_1', 'The paper merchants', "It's the office quiz night and they're a team short. The manager has put himself in charge of yours. He's got every answer wrong so far and is blaming the questions. The one who keeps looking at the camera slides you the right answers on a sticky note.", [
  C("Use the sticky notes.", "You win. The manager gives a speech claiming the credit. The camera-looker gets a small smile, the first anyone's seen. The prize is a voucher and it's actually good.", scrap=40, crewHeal=10, endThread='office'),
  C("Trust the manager.", "You come last. \"I think we all learned something tonight,\" he says. Nobody has. But the buffet was free.", food=3, endThread='office'),
], thread='office', step=1, art='station')
# crossovers with the game's own loose ends
E(TV, 'tv_x_locum_cat', 'The Locum and the cat', "The cat has gone into the blue box. The Locum goes in after it. They're gone four seconds. When they come out the Locum has a beard and the cat is wearing a small ruff. \"We don't talk about the Tudors,\" says the Locum.", [
  C("Don't talk about the Tudors.", "The cat has a new, knowing look. And a medal.", scrap=30, crewHeal=8),
], threads=['locum', 'cat'])
E(TV, 'tv_x_bake_weev', 'The weevils and the Bake Off', "The weevils have got into the tent. Twelve showstoppers, gone in a minute. One weevil is sitting on the judges' table, looking hopeful. The blue-eyed judge regards it. Slowly, he holds out a finger. The weevil shakes it.", [
  C("Leave before anyone asks whose weevils they are.", "You leave. Behind you, a weevil is being interviewed in a meadow. They've stayed behind: you're shot of the lot.", endThread='weev', food=2),
], threads=['bake', 'weev'])
E(TV, 'tv_x_trot_crate', 'The Trottings and the crate', "\"That crate,\" says the man in the sheepskin, \"is exactly what I've been looking for. I've got a buyer. No questions asked.\" The crate hums something that sounds a lot like a warning.", [
  C("Let him try to sell it.", "He's back within the hour, white as a sheet. \"It hummed the theme from my own life at me. You can keep it. Here: for your silence.\"", scrap=35),
], threads=['trot', 'crate'])
E(TV, 'tv_x_ac_debt', 'AC-13 and Big Kev', "\"For the benefit of the tape,\" says the waistcoat one, \"the suspect is being shown a little book with his own name in it.\" Big Kev, across the table, folds his arms. \"No comment.\" Beeeeep. They both turn to look at you.", [
  C("\"I've never seen either of them before.\"", "A very long beep. Both of them nod, slowly. You've made two sets of friends, and one of them cancels a debt.", endThread='debt', scrap=10),
], threads=['ac', 'debt'])
E(TV, 'tv_x_dads_ghost', 'The Home Guard and the Captain', "\"Marr?\" says the old corporal, peering at the empty chair. \"Ignatius Marr? You owe me two shillings!\" \"I do not,\" says the ceiling. \"You do! Siege of Corvin Gate! You said, lend us two bob for a pasty!\"", [
  C("Pay the two shillings on the Captain's behalf.", "Honour is satisfied. The two of them reminisce until dawn. In the morning the corporal salutes the chair and the chair, very slightly, turns.", cost={"scrap": 2}, crewHeal=15, xp={"skill": "combat", "amt": 12}),
], threads=['dads', 'ghost'])

# =====================================================================
# mod: Blockbuster Night (famous films and series, parodied)
# =====================================================================
FM = {}
E(FM, 'fm_farce_0', 'An old hermit', "A bearded old man in a dressing gown is waiting at the beacon, as if he knew you were coming. \"You must learn the ways of the Farce,\" he says. \"It surrounds us. It binds us. It is mostly paperwork.\" He waves a hand at a passing Mandate patrol. \"These aren't the couriers you're looking for.\"", [
  C("Take him aboard.", "\"These aren't the couriers we're looking for,\" agrees the patrol, and moves on. The old man looks as surprised as you are.", fleetPush=-.05, thread=T('farce', 'Learning the ways of the Farce')),
  C("\"That's just hypnosis.\"", "\"Search your feelings,\" he says. You search them. Mostly you're hungry. He comes aboard anyway and starts calling you \"young one.\"", thread=T('farce', 'Learning the ways of the Farce')),
], starts='farce')
E(FM, 'fm_farce_1', 'The Farce', "Training. {crew} is wearing a helmet with the visor down, swinging a glowing strip-light at a floating toaster. \"Stretch out with your feelings,\" says the old man. The toaster fires a slice of bread. {crew} blocks it. Everyone is astonished, the old man most of all.", [
  C("Keep training.", "By teatime {crew} can block three slices in a row and has stopped using the word \"impossible.\"", xp={"skill": "combat", "amt": 25}),
  C("Ask what the strip-light actually does.", "\"It is an elegant weapon,\" he says, \"for a more civilised age.\" It's a strip-light. But the batteries are worth having.", parts=3),
], thread='farce', step=1)
E(FM, 'fm_farce_2', 'The Farce', "A black warship, and on its bridge a very tall man in a black helmet, breathing like a broken accordion. \"I have you now,\" he says. Then, to the old man: \"We meet again. When I left you, I was but the learner.\" \"You left without paying for the lessons,\" says the old man.", [
  C("Fight.", "\"Use the Farce!\" shouts the old man, unhelpfully.", fight='rebuff_elite', afterWin={"text": "The black ship spins away into the dark. The tall man will be back; they always are. The old man has gone, leaving only his dressing gown, and under it, something he wanted you to have.", "augment": "random", "scrap": 40, "endThread": "farce"}),
  C("\"Is he your father?\"", "A terrible silence. \"...No,\" says the tall man. \"Why does everyone ask that?\" He's so put out he leaves. The old man refunds his lessons out of his own pocket, then yours.", scrap=20, endThread='farce'),
], thread='farce', step=2)
E(FM, 'fm_bold_0', 'A very clean starship', "A large, spotless ship glides alongside. Its captain appears on your screen in a tight jumper, lit from below. \"Captain... of the starship... Enterprising. We come... in peace.\" He pauses in places no sentence needs. Behind him, a man with pointed ears raises one eyebrow.", [
  C("Invite them aboard.", "Five of them beam over. Four are senior officers. The fifth is a nervous lad in a red jumper called Jenkins, who keeps saying it's his first mission.", thread=T('bold', 'An away team from the Enterprising')),
  C("Raise an eyebrow back.", "The pointed-eared one is impressed. \"Fascinating.\" They beam over anyway, with a lad in a red jumper who looks worried.", thread=T('bold', 'An away team from the Enterprising')),
], starts='bold')
E(FM, 'fm_bold_1', 'The away team', "There's a strange noise from the cargo hold. The captain in the tight jumper sends Jenkins to look. \"On my own, sir?\" \"On... your own.\" Everyone watches the lad in the red jumper walk down the corridor. The doctor shakes his head. \"He's a goner, Jim.\"", [
  C("Go with Jenkins.", "It's nothing: a loose crate. Jenkins is so relieved he hugs you. The captain is astonished. \"He came... back?\" It has never happened before. Jenkins asks if you're hiring.", crew='human', endThread='bold'),
  C("Let events take their course.", "A crash, a yelp. The doctor goes to look. \"He's fine. He tripped. I'm a doctor, not a... actually this is exactly my job.\" They leave you a gift for your trouble, and Jenkins, limping, leaves with them.", weapon='random', endThread='bold'),
], thread='bold', step=1)
E(FM, 'fm_lodger_0', 'Something in the vents', "A derelict mining ship. Its last log entry is one word: \"Vents.\" You take some salvage. Back aboard, {crew} mentions an odd stain on the ceiling, and that something has eaten through the mess-room table. From above. In a neat line.", [
  C("Check the vents.", "Nothing. Just a long, wet, banana-shaped hole where the grating used to be. You've got a lodger.", scrap=25, thread=T('lodger', 'Something in the vents')),
  C("Don't check the vents.", "Wise. But it knows you're not checking.", scrap=25, thread=T('lodger', 'Something in the vents')),
], starts='lodger', art='wreck')
E(FM, 'fm_lodger_1', 'The lodger', "The motion tracker is beeping. Seven metres. Six. {crew} is holding a flamethrower made from a hairdryer. Five metres. Four. \"That can't be right,\" says {crew}. \"That's inside the room.\" Everyone looks up.", [
  CH("Open the airlock and hold on to something.", .6, ("A long black shape goes past you, screeching, and out into the dark. You shut the door. Nobody speaks for an hour. Then somebody says, \"Did it have a little mouth inside its mouth?\"", {"endThread": "lodger", "crewHeal": 10, "scrap": 20}), ("It doesn't go. You do, nearly. It's made a nest in the reactor housing, and it's cross.", {"hull": -4, "crewHurt": 12})),
  C("Leave out a saucer of milk.", "The beeping stops. In the morning the saucer is clean, and has been melted. But there's been no trouble since, and no weevils either.", food=-1, endThread='lodger'),
], thread='lodger', step=1)
E(FM, 'fm_park_0', 'Cretaceous Gardens', "A jungle moon with a gate the size of a cathedral. A twinkly old man in white meets you with a cane topped with a lump of amber. \"Welcome to Cretaceous Gardens! We've spared no expense!\" A thin man in black leather mutters that life, er, finds a way.", [
  C("Take the tour.", "The tour cars stop by an enclosure. Nothing happens. Then the cup of tea on the dashboard starts to ripple. Then the power goes off.", thread=T('park', 'A day out at Cretaceous Gardens')),
  C("Ask about the fences.", "\"Ten thousand volts!\" says the old man. \"Run by a single underpaid programmer!\" The lights flicker. The programmer is seen leaving with a can of shaving foam.", thread=T('park', 'A day out at Cretaceous Gardens')),
], starts='park', art='planet')
E(FM, 'fm_park_1', 'Cretaceous Gardens', "It's out. It's enormous, it's got far too many teeth, and it's standing right in front of your landing party. \"Don't move,\" whispers the expert. \"Its vision is based on movement.\" {crew} needs a wee.", [
  CH("Nobody move.", .5, ("It sniffs you, loses interest, and eats a lawyer off a toilet. You walk, very calmly, back to the ship. The old man gives you a full refund and a bag of merchandise.", {"scrap": 45, "endThread": "park"}), ("{crew} sneezes. Everyone runs. Most of you make it, minus some dignity and a boot.", {"crewHurt": 15, "scrap": 20, "endThread": "park"})),
  C("Distract it with a flare and leg it.", "It follows the flare. You follow the exit signs. Behind you, the old man is saying they'll have this sorted by opening day.", missiles=-1, weapon='random', endThread='park'),
], thread='park', step=1, art='planet')
E(FM, 'fm_liner_0', 'The unsinkable', "The largest liner ever built slides past, lit like a birthday cake: the RSS Unsinkable, on her maiden voyage. A steward hails you. \"We've had a slight bump. Nothing to worry about. Have you any lifeboats? We only brought the twenty.\"", [
  C("Go and help.", "On the top deck a young man is holding a young woman at the very front of the ship, arms out. \"I'm flying!\" she says. \"You're in the way,\" says the lookout.", thread=T('liner', 'Helping the RSS Unsinkable')),
  C("Ask what they bumped.", "\"Ice comet. Whacking great one. Came out of nowhere, apart from the six warnings.\" The band has started playing. They say it's to keep spirits up.", thread=T('liner', 'Helping the RSS Unsinkable')),
], starts='liner')
E(FM, 'fm_liner_1', 'The Unsinkable', "You've taken off four hundred passengers. The last two are in the water, as it were: she's on a floating door and he's holding on to the side. \"There isn't room,\" she says. Everyone on your ship is looking at the door. There's room.", [
  C("\"There's room. Budge up.\"", "She budges up. They both live. It's much less romantic and everybody prefers it. The shipping line pays you a salvage fee and asks you not to mention the lifeboats.", scrap=70, crewHeal=10, endThread='liner'),
  C("Take them both aboard and keep the door.", "It's a very nice door. Solid oak. It's on your mess room now. The band, who never stopped, play you out.", scrap=40, hull=3, endThread='liner'),
], thread='liner', step=1)
E(FM, 'fm_agent_0', 'A man in a dinner jacket', "A sleek silver ship. Its pilot is wearing a dinner jacket, in space, and holding a cocktail. \"The name's Fond. James Fond. Agent 0.07, Commonwealth Secret Service: licence to mildly inconvenience.\" He needs a lift. His own ship has just been blown up. \"They usually are.\"", [
  C("Give him a lift.", "He orders a martini, \"shaken, not stirred.\" You have tea. \"Then a tea. Stirred. Not shaken.\" He's being followed by a man with metal teeth.", thread=T('agent', 'Agent 0.07 is aboard')),
  C("Ask to see some ID.", "He shows you a card. It says SECRET AGENT in gold letters. \"It's not a very secret service,\" he admits.", thread=T('agent', 'Agent 0.07 is aboard')),
], starts='agent')
E(FM, 'fm_agent_1', 'Agent 0.07', "Fond has brought gadgets. A pen that's a laser. A watch that's a saw. A car that's a submarine, which is no use to anyone out here. He's also had an elderly man called P fit your ship with \"a few modifications. Do try to bring it back in one piece.\"", [
  C("Press the red button.", "An ejector seat fires {crew} into the corridor ceiling. But the other button was better.", crewHurt=6, upgrade='random'),
  C("Don't press anything.", "\"Wise,\" says P. \"Nobody ever doesn't press anything.\" He leaves you the pen.", weapon='random'),
], thread='agent', step=1)
E(FM, 'fm_agent_2', 'Agent 0.07', "A hollowed-out volcano. A bald man in a grey suit strokes a white cat and swivels to face you. \"Ah, Mr Fond. I've been expecting you.\" He explains his entire plan. It takes twenty minutes and there are slides. Then he leaves you all to die slowly, unattended.", [
  C("Escape while he isn't watching.", "\"They never watch,\" says Fond, undoing his ropes with the watch. The volcano blows up behind you. He straightens his tie. \"Shocking.\"", scrap=60, augment='random', endThread='agent'),
  C("Ask for a copy of the slides.", "He's so pleased somebody was listening that he lets you go, and emails the deck. Fond is furious. The plan, it turns out, had some good ideas for your reactor.", upgrade='random', scrap=20, endThread='agent'),
], thread='agent', step=2, art='planet')
E(FM, 'fm_sim_0', 'A glitch', "The same black cat walks past the bridge door twice. A man in a long leather coat and tiny sunglasses is suddenly in your chair. \"What if I told you,\" he says, \"that none of this is real? The ship. The Fleet. The tea.\" He holds out two biscuits: one red, one blue.", [
  C("Take the red biscuit.", "It's a jammy one. For a moment everything turns to green numbers, falling. Then it's a ship again, but you can't unsee it. \"Welcome,\" he says, \"to the real world.\"", thread=T('sim', 'You have seen the green numbers')),
  C("Take the blue biscuit.", "It's a plain one. You wake up in your bunk, believing whatever you want to believe. But the cat walks past twice again.", thread=T('sim', 'You have seen the green numbers')),
], starts='sim')
E(FM, 'fm_sim_1', 'The green numbers', "A Mandate ship opens fire. Time slows. You can see the shots coming, one at a time, trailing ripples. The man in the coat is beside you. \"Don't think you can dodge them. Know you can.\" {crew} leans back at an angle no spine was built for.", [
  C("Dodge.", "You dodge. Every one. {crew} will need a chiropractor, but still.", fight='rebuff_fighter', afterWin={"text": "\"He's beginning to believe,\" says the man in the coat, and vanishes down a telephone. You find you know a great deal about your own engines that you didn't before.", "upgrade": "engines", "scrap": 30, "endThread": "sim"}),
  C("\"There is no ship.\"", "\"Then you'll see it is not the ship that bends,\" says a small bald child who wasn't there a moment ago, \"it is only yourself.\" The Mandate ship, confused by all this, leaves. So does the child, with your spoon.", fleetPush=-.06, endThread='sim'),
], thread='sim', step=1)
E(FM, 'fm_time_0', 'A silver ship', "A silver ship with doors that open upwards skids out of nowhere, covered in frost, trailing two lines of fire. A wild-haired old man in a lab coat leans out. \"Great Scott! What year is this? Never mind! I need one point two one jiggawatts, and I need them by ten-oh-four!\"", [
  C("Offer him your reactor.", "\"A reactor! Of course! In my day all we had was lightning!\" He plugs something in. Every clock on your ship now says a different time, and they're all right.", thread=T('time', 'Lending power to a time machine')),
  C("Ask what a jiggawatt is.", "\"It's like a gigawatt, but said wrong for forty years.\" A teenager in a red body-warmer climbs out. \"Doc, this is heavy.\"", thread=T('time', 'Lending power to a time machine')),
], starts='time')
E(FM, 'fm_time_1', 'The time machine', "The silver ship needs to hit exactly eighty-eight to get home, and it needs a run-up, and your ship is the tow. \"When this baby hits eighty-eight,\" says the old man, \"you're going to see some serious stuff.\"", [
  CH("Tow them up to eighty-eight.", .65, ("Two lines of fire, and they're gone. A moment later a courier in old-fashioned uniform knocks on your airlock with a letter that's been waiting for you for seventy years. It has money in.", {"scrap": 65, "endThread": "time"}), ("You hit eighty-seven. They go back, but only to last Tuesday, and they're cross about it. You've lost some fuel and gained a newspaper with next week's cricket scores.", {"fuel": -2, "scrap": 30, "endThread": "time"})),
  C("Ask to borrow it first.", "\"Absolutely not. The consequences could be disastrous.\" He thinks. \"...One go.\" You come back three seconds later with a tan, a parrot, and no memory of why.", crewHeal=20, augment='random', endThread='time'),
], thread='time', step=1)
E(FM, 'fm_wiz_0', 'An owl', "An owl flies in through the airlock, which shouldn't be possible, and drops a letter on your head. It's addressed in green ink to \"The Captain, The Bridge, The Ship.\" It says {crew} has been accepted at Hogwash Academy of Wizardry, term starts Monday, and to bring a cauldron.", [
  C("Let {crew} go for a term.", "A flying bus collects them. They're back by teatime, somehow a year older, wearing a pointy hat, and insisting on being called by a house name.", thread=T('wiz', 'A wizard on the crew')),
  C("Write back: \"We're in space.\"", "The reply comes by a bigger owl. \"So are we.\" Lessons will be by correspondence. The cauldron arrives separately.", thread=T('wiz', 'A wizard on the crew')),
], starts='wiz')
E(FM, 'fm_wiz_1', 'The wizard', "{crew} has been practising. They wave a stick at the broken reactor and shout something in bad Latin. It's leviosa, apparently, not leviosar.", [
  CH("Stand well back.", .6, ("The reactor mends itself, hums, and lifts six inches off the floor. \"Ten points,\" says {crew}, to nobody.", {"upgrade": "random", "endThread": "wiz"}), ("The reactor turns into a very large, very surprised toad. It turns back after an hour, but it's never been quite the same, and nor has the smell.", {"damageSystem": "random", "scrap": 25, "endThread": "wiz"})),
  C("Confiscate the stick.", "It bites you. But the Academy sends a sternly worded owl and a refund of the fees you never paid.", scrap=30, crewHurt=3, endThread='wiz'),
], thread='wiz', step=1)
E(FM, 'fm_ring_0', 'A lift to a volcano', "Nine travellers at the beacon, with packs. A very small one with very hairy feet steps forward, holding something on a chain as if it weighed a ton. \"We need to get to a volcano. It's a long way, it's guarded by an enormous flaming eye, and we'd been planning to walk.\"", [
  C("\"Hop in. Where's the volcano?\"", "A grey-bearded one with a staff looks stricken. \"We could have flown? The whole time?\" Nobody speaks to him for the rest of the trip. The small ones ask when second breakfast is.", food=-2, thread=T('ring', 'Nine passengers and a ring')),
  C("Ask to see the ring.", "\"No,\" say nine voices at once. The small one puts it away. A thin, pale thing in the luggage whispers that it's his precious. They're all coming aboard.", thread=T('ring', 'Nine passengers and a ring')),
], starts='ring')
E(FM, 'fm_ring_1', 'The ring', "The volcano. From orbit it takes about four minutes. The small one stands at the open airlock, holding the ring over the fire. He hesitates. \"It's mine,\" he says, in a new and nasty voice. Everyone groans. The pale thing from the luggage bites his finger.", [
  C("Give the pale thing a shove.", "Ring, finger and pale thing go into the volcano together. The enormous flaming eye goes out like a pilot light. The walk, they tell you, would have taken three books. They knight you.", scrap=70, augment='random', endThread='ring'),
  C("\"Shall I do it?\"", "You take the ring. It whispers that you could rule the galaxy. You think about the paperwork, and drop it in. The grey-bearded one says you have shown uncommon wisdom. You were mostly thinking about lunch.", scrap=50, crewHeal=20, endThread='ring'),
], thread='ring', step=1, art='planet')
E(FM, 'fm_shark_0', 'A fin', "Something is circling the beacon. All you can see is a fin, cutting through the dust, and all you can hear, somehow, is two low notes on a cello, over and over, getting faster. A harbourmaster in a nice blazer insists the beacon stays open. \"It's the bank holiday weekend.\"", [
  C("Go and have a look.", "You go and have a look. It surfaces beside you, and keeps surfacing. {crew} backs slowly away from the window. \"You're going to need a bigger ship.\"", thread=T('shark', 'Hunting the thing with the fin')),
  C("Close the beacon yourself.", "The harbourmaster is furious. The thing with the fin doesn't care about harbourmasters. It's following you now.", thread=T('shark', 'Hunting the thing with the fin')),
], starts='shark', art='creature')
E(FM, 'fm_shark_1', 'The fin', "You've hired a grizzled old space-fisherman who scrapes his nails down your hull to get attention and has a long story about a ship that went down. He sings sea shanties. The thing has eaten his boat, his barrels, and most of the story.", [
  C("Shove a fuel tank in its mouth and shoot the tank.", "\"Smile, you son of a...\" The explosion is visible from the next sector. It rains fish for an hour. The harbourmaster reopens the beacon and takes the credit.", cost={"fuel": 1, "missiles": 1}, scrap=60, food=4, endThread='shark'),
  C("Throw it your leftovers and leave.", "It likes the leftovers. It follows you for a while, like a dog, then peels off. The two cello notes fade. The fisherman calls you a coward and asks for a lift.", food=-2, crew='human', endThread='shark'),
], thread='shark', step=1, art='creature')
E(FM, 'fm_bust_0', 'Who you gonna hail', "A converted ambulance with a siren that goes WOOOWOOOP pulls up. Four people in boiler suits with vacuum cleaners on their backs climb out. \"We got a report of a free-floating, full-torso apparition on this ship. Has anyone aboard been slimed?\"", [
  C("\"...A bit.\"", "\"He slimed me,\" confirms {crew}. They unpack a small box with a pedal. \"Whatever you do,\" says the one with glasses, \"don't cross the beams.\"", thread=T('bust', 'Paranormal investigators aboard')),
  C("\"There's no ghost here.\"", "\"That's what they all say. Then the fridge starts talking.\" They set up in the mess. Their fee is a hundred scrap. You'll talk about that later.", thread=T('bust', 'Paranormal investigators aboard')),
], starts='bust')
E(FM, 'fm_bust_1', 'The investigators', "They've found it: a small, green, floating thing eating everything in your pantry. Four beams of light lash round the mess, knocking over the table, the chairs, and {crew}. \"I'm crossing the beams!\" \"DON'T cross the beams!\"", [
  CH("Duck.", .6, ("The green thing goes into the box with a noise like a sink emptying. \"We came, we saw, we kicked its ectoplasm.\" They waive the fee in exchange for the pantry, which they say is evidence.", {"food": -2, "scrap": 30, "endThread": "bust"}), ("They cross the beams. When the smoke clears there's no ghost, no table, and a hole. \"That's extra,\" says the tall one.", {"hull": -3, "scrap": -10, "endThread": "bust"})),
  C("Adopt the green thing.", "\"You want to KEEP it?\" It's already asleep in the bread bin. They leave, shaking their heads, and send you a T-shirt.", crewHeal=12, endThread='bust'),
], thread='bust', step=1)
E(FM, 'fm_throne_0', 'A very uncomfortable chair', "A cold little station with a chair in the middle of it made entirely of melted-down cutlasses. Seven families in furs are glaring at each other across it. A herald unrolls a scroll. \"You stand before the Chair of Blades. Winter is coming.\" \"It's been coming for nine years,\" mutters someone at the back.", [
  C("Sit in the chair, for a laugh.", "The room goes silent. Seven families draw swords. A small man with a glass of wine starts to laugh. \"Oh, I like this one. Don't kill them. Not till the wedding.\"", thread=T('throne', 'A claim to the Chair of Blades')),
  C("Back out slowly.", "\"A courier,\" says a woman with silver hair and three lizards. \"Couriers go everywhere. Couriers know things.\" You know nothing. A sad young man in black says he knows the feeling.", thread=T('throne', 'A claim to the Chair of Blades')),
], starts='throne', art='station')
E(FM, 'fm_throne_1', 'The Chair of Blades', "You've been invited to a wedding. Everyone has warned you not to go to the wedding. The band is playing something ominous and the doors have just been locked from the outside. The small man with the wine catches your eye and nods, very slightly, at a window.", [
  C("Leave by the window. Now.", "You drop into the moat as the screaming starts. The small man is already in a rowing boat. \"I drink and I know things,\" he says, and pays his fare in gold.", scrap=65, endThread='throne'),
  C("Stay for the cake.", "It's very good cake. You eat it under the table while the families settle their differences. When it goes quiet, you're the only one left, and technically that makes it your chair. You sell it for scrap.", scrap=45, food=2, crewHurt=8, endThread='throne'),
], thread='throne', step=1, art='station')
# crossovers
E(FM, 'fm_x_lodger_cat', 'The cat and the lodger', "The cat and the thing in the vents have met. There was a hiss, then a much worse hiss, then a silence. You find them at opposite ends of the corridor, staring. Neither blinks. The thing has a little mouth inside its mouth. The cat is unimpressed.", [
  C("Back the cat.", "It takes six hours. The thing in the vents breaks first, and leaves by the airlock under its own power, looking back once. The cat washes a paw. You've never been prouder of anything.", endThread='lodger', crewHeal=15, scrap=20),
], threads=['lodger', 'cat'])
E(FM, 'fm_x_bust_ghost', 'The investigators and the Captain', "\"We've got a class five full-roaming vapour on the bridge!\" The four of them burst in with their vacuum cleaners. The chair turns to face them. \"Get those things off my deck,\" says Captain Marr, \"and take your boots off.\" They take their boots off.", [
  C("Vouch for the Captain.", "\"He's crew.\" They put the box away. The one with glasses spends the night interviewing him and leaves with forty pages and a new respect for naval discipline. Marr says they're \"not bad, for civilians.\"", scrap=30, crewHeal=8),
], threads=['bust', 'ghost'])
E(FM, 'fm_x_agent_celeb', 'Fond and Gloria', "James Fond has met Gloria Pike. He raises an eyebrow. She raises hers higher. \"Fond. James Fond.\" \"I know who you are, darling. I sang the theme.\" She did. She sings it again, with the big note at the end. Somewhere, a title sequence starts.", [
  C("Let them have dinner.", "It goes on till four. Nobody will say what happened, but in the morning Fond is wearing her sunglasses and she has his watch. They both tip the ship.", scrap=50),
], threads=['agent', 'celeb'])
E(FM, 'fm_x_farce_hat', 'The Farce and the hat', "The old man in the dressing gown is staring at the hat. \"I sense a great disturbance. It rhymes.\" The hat turns to face him. \"A wizard, is it? Old and wise / with dressing gown and rheumy eyes.\" \"I'm not a wizard,\" says the old man. \"I'm more of a consultant.\"", [
  C("Let them have it out.", "They duel: one with hand-waving, one with couplets. It's a draw. They've agreed to write a musical. You get ten per cent.", scrap=35, crewHeal=8),
], threads=['farce', 'hat'])
E(FM, 'fm_x_ring_gnome', 'The ring and the gnome', "The small one with the hairy feet has found the gnome. \"He looks like my Uncle Dudo,\" he says, and sits down next to it. He tells it the whole story. It takes all night. In the morning the ring, which nobody could take off him, is hanging from the gnome's fishing rod.", [
  C("Say nothing. Let the gnome carry it.", "The gnome carries it all the way to the volcano without once being tempted, because it's a gnome. The grey-bearded one says it's the bravest thing he's ever seen. The gnome's smile doesn't change.", scrap=40, crewHeal=10),
], threads=['ring', 'gnome'])

# =====================================================================
def write():
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    js = "'use strict';\n/* The game's own loose ends: stories that carry on, cross over and interrupt. Built by tools/build-stories.py: edit that, not this. */\nconst THREAD_STORIES = " + json.dumps(B, ensure_ascii=False, indent=1) + ";\nObject.assign(BASE.events, THREAD_STORIES); if(typeof DATA!=='undefined' && DATA && DATA.events) Object.assign(DATA.events, JSON.parse(JSON.stringify(THREAD_STORIES)));\n"
    js += "/* two ordinary events can leave a loose end behind them */\n(function(){ try{ const c = BASE.events.casino, w = BASE.events.weevils; if(c && c.choices[0] && c.choices[0].fail) c.choices[0].fail.thread = { id:'debt', name:'You owe Big Kev' }; if(w && w.choices[0] && w.choices[0].success) w.choices[0].success.thread = { id:'weev', name:'Weevils in the walls' }; }catch(e){} })();\n"
    open(os.path.join(root, 'js', 'threadstories.js'), 'w').write(js)
    mods = [('telly-night.json', 'Telly Night', 'Fourteen loose-end stories that are absolutely not based on anything you have seen on British television: a Locum in a blue box, a hotel run by a furious man, three-wheeled traders, a baking tent, bent couriers, and more. They cross over with the game\'s own loose ends.', TV),
            ('blockbuster-night.json', 'Blockbuster Night', 'Thirteen loose-end stories that owe nothing whatsoever to any famous film or series: the ways of the Farce, a very clean starship, something in the vents, Cretaceous Gardens, Agent 0.07, a ring and a volcano, and more.', FM)]
    for fn, name, desc, ev in mods:
        d = {"name": name, "version": "1.0", "author": "Vaster Than Life", "description": desc, "events": [dict(id=k, **v) for k, v in ev.items()]}
        open(os.path.join(root, 'mods', fn), 'w').write(json.dumps(d, ensure_ascii=False, indent=1))
    print('base', len(B), 'telly', len(TV), 'films', len(FM), 'words', sum(len((e['text'] + ' ' + ' '.join(json.dumps(c) for c in e['choices'])).split()) for s in (B, TV, FM) for e in s.values()))

if __name__ == '__main__': write()
