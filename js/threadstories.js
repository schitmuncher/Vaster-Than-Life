'use strict';
/* The game's own loose ends: stories that carry on, cross over and interrupt. Built by tools/build-stories.py: edit that, not this. */
const THREAD_STORIES = {
 "th_cat_0": {
  "title": "Something in the hold",
  "text": "There's a noise in the cargo hold. {crew} goes down with a torch and a spanner and comes back with a large ginger cat under one arm. It has a collar. The collar says \"NOT YOURS.\"",
  "choices": [
   {
    "text": "Keep it. Every ship needs a cat.",
    "effect": {
     "text": "The cat inspects the bridge, sits in the captain's chair, and goes to sleep. You have been outranked.",
     "thread": {
      "id": "cat",
      "name": "A stowaway cat"
     }
    }
   },
   {
    "text": "Put it off at the next station.",
    "effect": {
     "text": "You try. The cat is back aboard before you are. Nobody saw how.",
     "thread": {
      "id": "cat",
      "name": "A stowaway cat"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "cat"
 },
 "th_cat_1": {
  "title": "The cat",
  "text": "The cat has left something outside your cabin door. It's a space weevil, mostly dead, and next to it, neatly arranged, are the drone parts the weevil had been eating.",
  "choices": [
   {
    "text": "Say thank you. Mean it.",
    "effect": {
     "text": "The cat accepts your thanks with the air of someone who expects to be paid in tuna.",
     "parts": 3
    }
   },
   {
    "text": "Give it the last of the tinned fish.",
    "effect": {
     "text": "A sound like a small engine starts up. The crew gather round to listen. Best meeting you've had all voyage.",
     "crewHeal": 12,
     "food": -1
    }
   }
  ],
  "art": "ship",
  "thread": "cat",
  "step": 1
 },
 "th_cat_2": {
  "title": "The cat",
  "text": "The cat is asleep on the navigation console. Specifically, on the jump controls. Specifically, on the big red one. {crew} reaches for it. The cat opens one eye.",
  "choices": [
   {
    "text": "Move the cat. Carefully.",
    "chance": 0.5,
    "success": {
     "text": "The cat allows itself to be moved, this once."
    },
    "fail": {
     "text": "The cat stretches. The ship jumps half a light-year sideways. On the bright side, the Mandate Fleet has no idea where you went either.",
     "fleetPush": -0.08,
     "fuel": -1
    }
   },
   {
    "text": "Leave it. Navigate round the cat.",
    "effect": {
     "text": "You plot the next jump using only the controls the cat isn't on. It takes a while. It's oddly restful.",
     "crewHeal": 6
    }
   }
  ],
  "art": "ship",
  "thread": "cat",
  "step": 2
 },
 "th_cat_3": {
  "title": "The cat",
  "text": "A freighter hails you. A small girl is on the screen, holding up a drawing of a large ginger cat. \"His name's Admiral Biscuits,\" she says. \"He got on the wrong ship.\" Behind you, the cat has gone very still.",
  "choices": [
   {
    "text": "Give him back.",
    "effect": {
     "text": "The handover takes an hour, because the cat insists on saying goodbye to every member of the crew, and the kettle. The girl's mum sends over a crate by way of thanks. The ship feels bigger without him. Worse, but bigger.",
     "scrap": 40,
     "augment": "random",
     "endThread": "cat"
    }
   },
   {
    "text": "\"Never seen him. Sorry.\"",
    "effect": {
     "text": "You close the channel. The cat looks at you for a long moment, then walks over and sits on your foot. You are going to hell, but you'll have company.",
     "crewHeal": 10,
     "endThread": "cat"
    }
   }
  ],
  "art": "ship",
  "thread": "cat",
  "step": 3
 },
 "th_cat_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "Hold the cat up to the camera.",
    "effect": {
     "text": "The pyrate captain goes quiet. \"Is that... is that a ginger one?\" It turns out pyrates are deeply superstitious about ginger cats. They let you through and ask for a photo.",
     "scrap": 10
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "cat",
  "into": "pyrate"
 },
 "th_cat_a2": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "Send the cat in first.",
    "effect": {
     "text": "The cat strolls in, looks about, and strolls out again carrying something valuable in its mouth. It will not say where it got it.",
     "scrap": 22
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "cat",
  "into": "gamble"
 },
 "th_hat_0": {
  "title": "A hat",
  "text": "A hat is floating in space. Not a helmet: a hat, a tall one with a buckle, turning slowly end over end. It has clearly been floating there for some time, and it is clearly waiting for someone.",
  "choices": [
   {
    "text": "Bring it aboard. It's a good hat.",
    "effect": {
     "text": "{crew} puts it on \"for a laugh\" and immediately says: \"This hat is mine, it fits me well / and something's wrong, I can't quite tell.\" It won't come off. Everything they say now rhymes.",
     "thread": {
      "id": "hat",
      "name": "A cursed hat"
     }
    }
   },
   {
    "text": "Leave the hat. Nothing good comes of space hats.",
    "effect": {
     "text": "You fly on. An hour later the hat is on the hat stand in the mess. You don't have a hat stand.",
     "thread": {
      "id": "hat",
      "name": "A cursed hat"
     }
    }
   }
  ],
  "art": "space",
  "starts": "hat"
 },
 "th_hat_1": {
  "title": "The hat",
  "text": "The hat has opinions. {crew}, who is still wearing it, relays them: \"The hat would like a seat up front / it says your flying's rather blunt.\" The hat wants to sit at the helm.",
  "choices": [
   {
    "text": "Let the hat have a go.",
    "effect": {
     "text": "The hat flies beautifully. It takes you the scenic route, through a field of salvage nobody else had spotted.",
     "scrap": 28
    }
   },
   {
    "text": "No. Hats don't fly ships.",
    "effect": {
     "text": "\"The hat is cross, the hat is vexed / it says that you'll be sorry next.\" The lights flicker. Something in engineering goes clunk.",
     "damageSystem": "random"
    }
   }
  ],
  "art": "ship",
  "thread": "hat",
  "step": 1
 },
 "th_hat_2": {
  "title": "The hat",
  "text": "\"A ship draws near, its guns are hot / the hat says shoot it. Quite a lot.\" {crew} points at an empty patch of sky. Three seconds later, a pyrate decloaks in it.",
  "choices": [
   {
    "text": "Trust the hat.",
    "effect": {
     "text": "Your guns were already charged. The hat has its uses.",
     "primeWeapons": true,
     "fight": "pyrate_gunship",
     "afterWin": {
      "text": "\"The foe is beaten, well done you / the hat would like its share. It's due.\" You give the hat a share. You're not sure how.",
      "scrap": 30
     }
    }
   },
   {
    "text": "Run for it.",
    "effect": {
     "text": "You're gone before the pyrate has finished decloaking. \"We could have won, the hat is sure / but running's fine. It's just a bore.\"",
     "fuel": -1
    }
   }
  ],
  "art": "ship",
  "thread": "hat",
  "step": 2
 },
 "th_hat_3": {
  "title": "The hat",
  "text": "A hermit on a tiny moon waves you down. He is staring at the hat. \"That's Old Barnaby's hat,\" he says. \"Barnaby rhymed himself to death in '42. The hat needs a rhyme for 'orange.' Give it one and it'll let go.\"",
  "choices": [
   {
    "text": "\"Door hinge.\"",
    "chance": 0.6,
    "success": {
     "text": "The hat thinks about it. \"...That'll do.\" It lifts off, bows, and floats away into the dark. {crew} says a whole sentence in prose and bursts into tears.",
     "crewHeal": 20,
     "scrap": 30,
     "endThread": "hat"
    },
    "fail": {
     "text": "\"That's a near rhyme at best,\" says the hat, in its own voice, which is worse. But it's bored now, and it leaves anyway, taking the mess-room cutlery with it.",
     "scrap": -10,
     "endThread": "hat"
    }
   },
   {
    "text": "Keep the hat. You've got used to it.",
    "effect": {
     "text": "The hermit shrugs. \"Your funeral. Well. Your poem.\" The hat settles in. From now on your logbook scans.",
     "augment": "random",
     "endThread": "hat"
    }
   }
  ],
  "art": "planet",
  "thread": "hat",
  "step": 3
 },
 "th_hat_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "Ask the hat what to do.",
    "effect": {
     "text": "\"The left one's rigged, the right one's fine / take both of them, and then they're mine.\" You follow the hat's advice. It works out suspiciously well.",
     "scrap": 26
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "hat",
  "into": "gamble"
 },
 "th_debt_0": {
  "title": "A friendly word",
  "text": "A very large man in a very small ship pulls alongside. \"Evening. Big Kev. I do the door at the casino. You left without settling up.\" You don't remember going to a casino. \"They never do,\" says Big Kev, kindly. \"Forty scrap. No rush. Well. Some rush.\"",
  "choices": [
   {
    "text": "Pay him now.",
    "effect": {
     "text": "\"Lovely. Pleasure doing business.\" He gives you a loyalty card with one stamp on it.",
     "scrap": 5
    },
    "cost": {
     "scrap": 40
    },
    "req": {
     "scrap": 40
    }
   },
   {
    "text": "\"I'll get it to you.\"",
    "effect": {
     "text": "\"Course you will.\" He writes your name in a little book. The book is nearly full. The names near the front are crossed out.",
     "thread": {
      "id": "debt",
      "name": "You owe Big Kev"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "debt",
  "minSector": 2
 },
 "th_debt_1": {
  "title": "Big Kev",
  "text": "Two of Big Kev's associates are waiting at the beacon. They are called Small Kev and Medium Kev. \"Big Kev says hello,\" says Small Kev. \"And he says it's fifty now. Interest.\"",
  "choices": [
   {
    "text": "Pay the fifty.",
    "effect": {
     "text": "Medium Kev counts it twice, moving his lips. \"All square. Big Kev says you're a gent.\"",
     "endThread": "debt"
    },
    "cost": {
     "scrap": 50
    },
    "req": {
     "scrap": 50
    }
   },
   {
    "text": "\"Tell Big Kev he'll have to wait.\"",
    "effect": {
     "text": "Small Kev sighs. \"He said you'd say that.\" They don't shoot. They just take your spare fuel, slowly, while maintaining eye contact.",
     "fuel": -3
    }
   },
   {
    "text": "Fight the Kevs.",
    "effect": {
     "text": "\"Oh, good,\" says Medium Kev. \"I get bored.\"",
     "fight": "pyrate_gunship",
     "afterWin": {
      "text": "The Kevs limp home. You get the feeling this isn't over. You also get their wallet.",
      "scrap": 30
     }
    }
   }
  ],
  "art": "ship",
  "thread": "debt",
  "step": 1
 },
 "th_debt_2": {
  "title": "Big Kev",
  "text": "A card arrives. It has a cartoon bear on it. \"It's my birthday,\" Big Kev has written inside. \"You're invited. Bring a present. The present is sixty scrap.\"",
  "choices": [
   {
    "text": "Go to the party. Bring the sixty.",
    "effect": {
     "text": "It's a lovely party. There's a bouncy castle. Big Kev cries during the speeches. Your debt is cleared and you win the raffle.",
     "weapon": "random",
     "crewHeal": 15,
     "endThread": "debt"
    },
    "cost": {
     "scrap": 60
    },
    "req": {
     "scrap": 60
    }
   },
   {
    "text": "Send a card instead.",
    "effect": {
     "text": "You send a card with a cartoon dog on it. A reply comes within the hour: \"Hurt. KEV.\"",
     "fleetPush": 0.03
    }
   }
  ],
  "art": "ship",
  "thread": "debt",
  "step": 2
 },
 "th_debt_3": {
  "title": "Big Kev",
  "text": "Big Kev is waiting for you in person. He fills the screen. \"Right,\" he says. \"I've been thinking. You're never going to pay me, are you? So I've got a job for you instead. Bit of escort work. Do that, and we're friends.\"",
  "choices": [
   {
    "text": "Take the job.",
    "effect": {
     "text": "You spend the afternoon escorting Big Kev's mum to bingo. She wins. She tips you. Big Kev tears your page out of the little book and eats it, as is traditional.",
     "scrap": 35,
     "endThread": "debt"
    }
   },
   {
    "text": "\"No. And I'm not paying either.\"",
    "effect": {
     "text": "A long silence. \"...Fair enough,\" says Big Kev. \"Nobody's ever just said no before.\" He seems lost. He leaves. You feel strangely bad about it.",
     "endThread": "debt"
    }
   }
  ],
  "art": "ship",
  "thread": "debt",
  "step": 3
 },
 "th_debt_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "\"Put it on Big Kev's tab.\"",
    "effect": {
     "text": "They go pale. \"You know Big Kev?\" They wave you through and give you something for the journey. Your debt, you suspect, has just got bigger.",
     "fuel": 2
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "debt",
  "into": "pay"
 },
 "th_flu_0": {
  "title": "A sneeze",
  "text": "{crew} sneezes on the bridge. Then again. Then eleven more times. \"I'm fine,\" they say, from behind a tissue. \"It's just a tickle.\" By teatime half the crew have the tickle.",
  "choices": [
   {
    "text": "Carry on. It's only a cold.",
    "effect": {
     "text": "It's not only a cold. It's the Brindle Lurgy, and it's going round.",
     "crewHurt": 12,
     "thread": {
      "id": "flu",
      "name": "The Brindle Lurgy"
     }
    }
   },
   {
    "text": "Everyone to bed with a hot lemon.",
    "effect": {
     "text": "You lose half a day. The Fleet gains a little. The crew are grateful and still disgusting.",
     "fleetPush": 0.04,
     "thread": {
      "id": "flu",
      "name": "The Brindle Lurgy"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "flu"
 },
 "th_flu_1": {
  "title": "The Lurgy",
  "text": "The Lurgy has reached the engine room. {crew} is trying to recalibrate the drive with a thermometer in their mouth. Everything is slightly damp. The ship smells of menthol.",
  "choices": [
   {
    "text": "Make a huge pot of soup.",
    "effect": {
     "text": "It uses most of the pantry, and it's worth it. Nobody is better, but everybody is happier.",
     "food": -2,
     "crewHeal": 18
    }
   },
   {
    "text": "Power through.",
    "effect": {
     "text": "Somebody sneezes into an open access panel. There's a bang.",
     "damageSystem": "random",
     "crewHurt": 8
    }
   }
  ],
  "art": "ship",
  "thread": "flu",
  "step": 1
 },
 "th_flu_2": {
  "title": "The Lurgy",
  "text": "A station refuses to let you dock. \"We can hear you coughing from here,\" says the harbourmaster. A hatch opens and a robot arm holds out a paper bag at full stretch. \"Chemist's on us. Please leave.\"",
  "choices": [
   {
    "text": "Take the bag and go.",
    "effect": {
     "text": "It's cough sweets, a hot water bottle and a leaflet. The leaflet says REST. You do. Within a day the Lurgy has gone, taking with it everyone's sense of taste.",
     "crewHeal": 25,
     "endThread": "flu"
    }
   },
   {
    "text": "Cough at them until they open the shop.",
    "effect": {
     "text": "It works. They serve you through a letterbox, wearing gloves.",
     "store": true,
     "endThread": "flu"
    }
   }
  ],
  "art": "station",
  "thread": "flu",
  "step": 2
 },
 "th_flu_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "Cough on the screen.",
    "effect": {
     "text": "\"Is that the Lurgy?\" They back away from their own camera. \"Take it. Take whatever you want. Just go.\"",
     "scrap": 18
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "flu",
  "into": "pyrate"
 },
 "th_crate_0": {
  "title": "A second parcel",
  "text": "A man in a Courier Service uniform that doesn't quite fit asks you to take a crate \"just as far as Command.\" It's the size of a washing machine. It's stamped DO NOT OPEN, DO NOT TILT, DO NOT MAKE EYE CONTACT. He pays in advance.",
  "choices": [
   {
    "text": "Take the crate.",
    "effect": {
     "text": "It goes in the hold next to The Parcel. That night {crew} swears they heard the two of them talking.",
     "scrap": 30,
     "thread": {
      "id": "crate",
      "name": "A crate that hums"
     }
    }
   },
   {
    "text": "\"What's in it?\"",
    "effect": {
     "text": "\"Nothing,\" he says, far too fast. He pays double. You take the crate.",
     "scrap": 45,
     "thread": {
      "id": "crate",
      "name": "A crate that hums"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "crate"
 },
 "th_crate_1": {
  "title": "The crate",
  "text": "The crate is humming. Not mechanically: a tune. {crew} has identified it as \"Blue Shift Blues\" by Gloria Pike. The crate is slightly flat on the high notes.",
  "choices": [
   {
    "text": "Hum along.",
    "effect": {
     "text": "The crate goes quiet. Then, cautiously, it comes in on the harmony. The whole crew joins in. It's the best evening anyone's had since launch.",
     "crewHeal": 15
    }
   },
   {
    "text": "Bang on the lid and tell it to stop.",
    "effect": {
     "text": "It stops. It starts again at 3am, louder, and it's doing the key change.",
     "crewHurt": 5
    }
   }
  ],
  "art": "ship",
  "thread": "crate",
  "step": 1
 },
 "th_crate_2": {
  "title": "The crate",
  "text": "The crate is bigger. Nobody saw it grow, but it used to fit between the bulkheads and now it doesn't. The crew have a sweepstake going on what's inside. The leading bets are \"a piano,\" \"another crate,\" and \"my ex.\"",
  "choices": [
   {
    "text": "Put ten scrap on \"another crate.\"",
    "effect": {
     "text": "You're in. The pot is getting quite big.",
     "setFlag": "crate_bet"
    },
    "cost": {
     "scrap": 10
    },
    "req": {
     "scrap": 10
    }
   },
   {
    "text": "Captains don't gamble on cargo.",
    "effect": {
     "text": "You say this with great dignity. Nobody believes you. You don't believe you.",
     "crewHeal": 3
    }
   }
  ],
  "art": "ship",
  "thread": "crate",
  "step": 2
 },
 "th_crate_3": {
  "title": "The crate",
  "text": "The crate has opened. Nobody opened it. The lid is simply off, lying on the floor, and the crew are standing round it in a circle, looking in.",
  "choices": [
   {
    "text": "Look inside.",
    "chance": 0.5,
    "success": {
     "text": "It's a piano. A very good one. There's a note: \"For the Admiral's birthday. Sorry about the humming, it does that.\" Underneath the piano, somebody has stashed something much less musical.",
     "weapon": "random",
     "scrap": 25,
     "endThread": "crate"
    },
    "fail": {
     "text": "It's another crate. It's stamped DO NOT OPEN. Whoever bet on that is going to be unbearable. Wedged beside it is a little something for your trouble.",
     "augment": "random",
     "endThread": "crate"
    }
   },
   {
    "text": "Put the lid back on. Nail it down. Never speak of it.",
    "effect": {
     "text": "You deliver it to Command still humming. A clerk signs for it without looking up. \"Oh, another one of those,\" she says.",
     "scrap": 50,
     "endThread": "crate"
    }
   }
  ],
  "art": "ship",
  "thread": "crate",
  "step": 3
 },
 "th_celeb_0": {
  "title": "A passenger",
  "text": "A woman in enormous sunglasses is waiting at the beacon with fourteen suitcases. \"Gloria Pike,\" she says, as if you might not know. You know. Everyone knows. \"My tour ship has broken down. You're going my way. I've decided.\"",
  "choices": [
   {
    "text": "Welcome aboard, Miss Pike.",
    "effect": {
     "text": "She takes the biggest cabin, which was yours. She pays up front, in full, and calls everyone \"darling,\" including the cat, if you have one.",
     "scrap": 35,
     "thread": {
      "id": "celeb",
      "name": "Gloria Pike is aboard"
     }
    }
   },
   {
    "text": "\"We're not a taxi.\"",
    "effect": {
     "text": "\"No,\" she agrees, looking round. \"Taxis are cleaner.\" She's aboard anyway. You're not sure how that happened.",
     "thread": {
      "id": "celeb",
      "name": "Gloria Pike is aboard"
     }
    }
   }
  ],
  "art": "station",
  "starts": "celeb",
  "minSector": 2
 },
 "th_celeb_1": {
  "title": "Gloria Pike",
  "text": "Gloria is rehearsing. The whole ship can hear. {crew} has stopped working and is standing in the corridor with their eyes shut. Even the engine seems to be keeping time.",
  "choices": [
   {
    "text": "Let the crew listen.",
    "effect": {
     "text": "An hour of the best singing in the galaxy, for free. Nothing gets done. Nobody minds.",
     "crewHeal": 22
    }
   },
   {
    "text": "Ask her to keep it down.",
    "effect": {
     "text": "\"Keep it DOWN?\" She keeps it down. She keeps it down so pointedly that you can hear it through three bulkheads.",
     "crewHurt": 4
    }
   }
  ],
  "art": "ship",
  "thread": "celeb",
  "step": 1
 },
 "th_celeb_2": {
  "title": "Gloria Pike",
  "text": "Fans. Hundreds of them, in little ships with banners, swarming round you like bees. They've heard Gloria's aboard. They want autographs, photographs, and in one case a lock of her hair.",
  "choices": [
   {
    "text": "Sell tickets to look through the window.",
    "effect": {
     "text": "Gloria is appalled, then impressed, then wants sixty per cent. You settle on forty.",
     "scrap": 45
    }
   },
   {
    "text": "Lose them in the asteroid field.",
    "effect": {
     "text": "Some fine flying. Gloria applauds, slowly. \"Not bad, darling. You should be on the stage. Sweeping it.\"",
     "fuel": -1,
     "xp": {
      "skill": "pilot",
      "amt": 15
     }
    }
   }
  ],
  "art": "ship",
  "thread": "celeb",
  "step": 2
 },
 "th_celeb_3": {
  "title": "Gloria Pike",
  "text": "You've reached Gloria's venue: a concert hall built into a comet. She stands at the airlock with her fourteen suitcases. \"You've been adequate,\" she says. From Gloria, this is a five-star review. \"Come to the show. I'll dedicate one to the ship.\"",
  "choices": [
   {
    "text": "Stay for the concert.",
    "effect": {
     "text": "She dedicates \"Blue Shift Blues\" to \"a horrid little ship and the darlings aboard it.\" There isn't a dry eye in the comet. Backstage, she presses something expensive into your hand.",
     "crewHeal": 30,
     "augment": "random",
     "fleetPush": 0.04,
     "endThread": "celeb"
    }
   },
   {
    "text": "Wave her off. The Fleet won't wait.",
    "effect": {
     "text": "She blows the ship a kiss and leaves a suitcase behind by mistake. It's the one with the money in.",
     "scrap": 60,
     "endThread": "celeb"
    }
   }
  ],
  "art": "station",
  "thread": "celeb",
  "step": 3
 },
 "th_celeb_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "\"Miss Pike, would you mind?\"",
    "effect": {
     "text": "Gloria leans into the camera and lowers her sunglasses. \"Darling. Be an angel and let us through.\" The pyrate captain is so starstruck he forgets to rob you, and pays for a signed photo.",
     "scrap": 20
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "celeb",
  "into": "pyrate"
 },
 "th_celeb_a2": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "Have Gloria sing them something.",
    "effect": {
     "text": "She does eight bars. Whatever was about to happen doesn't. People put down what they were holding. Someone gives you a discount out of sheer emotion.",
     "scrap": 15,
     "crewHeal": 8
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "celeb",
  "into": "pay"
 },
 "th_gnome_0": {
  "title": "A gnome",
  "text": "There is a garden gnome on the bridge. It has a red hat, a fishing rod and a painted smile. Nobody brought it aboard. {crew} moves it to the cargo hold. An hour later it's back on the bridge, and it's facing the other way.",
  "choices": [
   {
    "text": "Leave it where it is.",
    "effect": {
     "text": "You leave it. It seems to like the view.",
     "thread": {
      "id": "gnome",
      "name": "The gnome"
     }
    }
   },
   {
    "text": "Put it out of the airlock.",
    "effect": {
     "text": "You watch it tumble away into the dark. You go back to the bridge. You stop in the doorway. You go and have a lie down.",
     "thread": {
      "id": "gnome",
      "name": "The gnome"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "gnome"
 },
 "th_gnome_1": {
  "title": "The gnome",
  "text": "The gnome is in the engine room now. Its fishing rod is pointing at a coolant pipe. When {crew} checks the pipe, it's a hair's breadth from bursting.",
  "choices": [
   {
    "text": "Fix the pipe. Thank the gnome.",
    "effect": {
     "text": "You fix the pipe. You feel foolish thanking a gnome, so you do it quietly. The painted smile doesn't change. It never changes.",
     "hull": 3
    }
   },
   {
    "text": "Coincidence. Ignore it.",
    "effect": {
     "text": "The pipe bursts at 4am. The gnome is found nearby, dry, facing the wall, as if it can't bear to look.",
     "damageSystem": "engines"
    }
   }
  ],
  "art": "ship",
  "thread": "gnome",
  "step": 1
 },
 "th_gnome_2": {
  "title": "The gnome",
  "text": "There are two gnomes. The new one has a wheelbarrow. They're in the mess, at the table, facing each other. The crew are eating standing up in the corridor.",
  "choices": [
   {
    "text": "Lay two more places.",
    "effect": {
     "text": "It seems only polite. In the morning the plates are clean and there's a small pile of scrap in the wheelbarrow.",
     "food": -1,
     "scrap": 30
    }
   },
   {
    "text": "Separate them.",
    "effect": {
     "text": "You put one at each end of the ship. By morning they're together again, in your cabin, at the foot of your bunk.",
     "crewHurt": 3
    }
   }
  ],
  "art": "ship",
  "thread": "gnome",
  "step": 2
 },
 "th_gnome_3": {
  "title": "The gnome",
  "text": "A pyrate boarding party materialises on the bridge, cutlasses out. They stop. In front of them, in a neat row, are seven gnomes. Nobody moves. A pyrate whispers: \"...There were only two a minute ago.\"",
  "choices": [
   {
    "text": "Say nothing. Let the gnomes handle it.",
    "effect": {
     "text": "The pyrates back into their teleporter very slowly. They leave their loot bag. When you turn round there's one gnome, with a fishing rod, and a painted smile, and it might be slightly wider.",
     "scrap": 45,
     "missiles": 2,
     "endThread": "gnome"
    }
   },
   {
    "text": "\"They're with me.\"",
    "effect": {
     "text": "The pyrates flee. The gnomes are gone by morning, all of them. On the bridge is a tiny wheelbarrow, with something in it for you.",
     "augment": "random",
     "endThread": "gnome"
    }
   }
  ],
  "art": "ship",
  "thread": "gnome",
  "step": 3
 },
 "th_insp_0": {
  "title": "An inspection",
  "text": "A small grey shuttle docks without asking. A man with a clipboard steps aboard. \"Dennis Flaxby, Commonwealth Health and Safety. I'm here for your inspection. It's due.\" It is not due. It has never been due. \"It's due now,\" says Dennis.",
  "choices": [
   {
    "text": "Show him round.",
    "effect": {
     "text": "He writes something down in the first corridor. And the second. He writes something down when you offer him tea. He'll be with you \"for the duration.\"",
     "thread": {
      "id": "insp",
      "name": "Dennis from Health & Safety"
     }
    }
   },
   {
    "text": "Tell him there's a war on.",
    "effect": {
     "text": "\"That's no excuse for an untidy airlock.\" He's unpacking a sleeping bag. It has his name sewn in.",
     "thread": {
      "id": "insp",
      "name": "Dennis from Health & Safety"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "insp"
 },
 "th_insp_1": {
  "title": "Dennis",
  "text": "Dennis has found the missile rack. \"These are unsecured,\" he says. \"These are live missiles, and they're held in with bungee cord.\" They've always been held in with bungee cord. \"I'll have to impound two.\"",
  "choices": [
   {
    "text": "Let him impound them.",
    "effect": {
     "text": "He puts them in his shuttle and gives you a receipt. In fairness, he then fixes the rack properly, and several other things nobody had noticed were broken.",
     "missiles": -2,
     "hull": 6
    }
   },
   {
    "text": "Slip him twenty scrap.",
    "effect": {
     "text": "Dennis looks at the scrap. He looks at you. He writes \"ATTEMPTED BRIBE\" on his clipboard, underlines it, and takes the scrap as evidence."
    },
    "cost": {
     "scrap": 20
    },
    "req": {
     "scrap": 20
    }
   }
  ],
  "art": "ship",
  "thread": "insp",
  "step": 1
 },
 "th_insp_2": {
  "title": "Dennis",
  "text": "Dennis has laminated things. There are signs everywhere. THIS DOOR IS A DOOR. CAUTION: SPACE. The kettle has a risk assessment taped to it. But {crew} admits the ship has never run better.",
  "choices": [
   {
    "text": "Thank him. Through gritted teeth.",
    "effect": {
     "text": "\"Just doing my job,\" says Dennis, who has plainly never been thanked before and goes pink to the ears. He services the fire system on the house.",
     "hull": 5,
     "crewHeal": 8
    }
   },
   {
    "text": "Take the signs down.",
    "effect": {
     "text": "He puts them back up. You take them down. This goes on for some time. It's the most exercise anyone's had in weeks.",
     "xp": {
      "skill": "repair",
      "amt": 12
     }
    }
   }
  ],
  "art": "ship",
  "thread": "insp",
  "step": 2
 },
 "th_insp_3": {
  "title": "Dennis",
  "text": "Dennis stands at the airlock with his clipboard and his sleeping bag. \"Inspection complete. You've failed on forty-one counts.\" He hesitates. \"But I've passed you. Don't tell anyone. It's been...\" He searches for the word. \"...Non-compliant. In a good way.\"",
  "choices": [
   {
    "text": "Shake his hand.",
    "effect": {
     "text": "He shakes it for exactly the recommended length of time. He leaves you a certificate, a fire extinguisher, and, tucked behind the kettle, a laminated card that says GOOD LUCK.",
     "augment": "random",
     "hull": 4,
     "endThread": "insp"
    }
   },
   {
    "text": "Offer him a job.",
    "effect": {
     "text": "Dennis looks at the ship, the scorch marks, the bungee cords. \"...I've got three weeks' leave owing,\" he says slowly. He stays.",
     "crew": "human",
     "endThread": "insp"
    }
   }
  ],
  "art": "ship",
  "thread": "insp",
  "step": 3
 },
 "th_insp_a1": {
  "title": "",
  "text": "",
  "choices": [
   {
    "text": "\"Dennis? There's a ship here you should see.\"",
    "effect": {
     "text": "Dennis looks at their ship through the window for a long time. Then he gets his clipboard. They surrender rather than let him aboard, and pay you to take him away.",
     "scrap": 30
    }
   }
  ],
  "art": "ship",
  "aside": true,
  "thread": "insp",
  "into": "fight"
 },
 "th_weev_0": {
  "title": "A scratching",
  "text": "Something is scratching inside the walls. {crew} takes off a panel. Sixteen small black eyes look back. A space weevil chews, thoughtfully, on a length of cable. Then it burps.",
  "choices": [
   {
    "text": "Lay traps.",
    "effect": {
     "text": "You catch one. There are definitely more than one.",
     "thread": {
      "id": "weev",
      "name": "Weevils in the walls"
     }
    }
   },
   {
    "text": "Name it. Maybe it's friendly.",
    "effect": {
     "text": "You name it Colin. By morning there are a lot of Colins.",
     "thread": {
      "id": "weev",
      "name": "Weevils in the walls"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "weev"
 },
 "th_weev_1": {
  "title": "The weevils",
  "text": "The weevils have found the pantry. They've eaten the biscuits, the tea bags, and a tin of beans, including the tin.",
  "choices": [
   {
    "text": "Move the food into the airlock.",
    "effect": {
     "text": "It's cold, but it's safe. Dinner now involves a spacesuit.",
     "food": -2
    }
   },
   {
    "text": "Poison the lot of them.",
    "effect": {
     "text": "It works on about half. The other half seem to have enjoyed it.",
     "food": -1,
     "crewHurt": 5
    }
   }
  ],
  "art": "ship",
  "thread": "weev",
  "step": 1
 },
 "th_weev_2": {
  "title": "The weevils",
  "text": "The weevils have learned to open doors. {crew} watched one do it: it reached up, pressed the panel, and went through, and then, and this is the part that's worrying everyone, it closed the door behind it.",
  "choices": [
   {
    "text": "Lure them into the cargo hold and vent it.",
    "chance": 0.65,
    "success": {
     "text": "They go for the bait. You open the hold to space. A cloud of weevils drifts away behind you, still chewing.",
     "endThread": "weev",
     "scrap": 15
    },
    "fail": {
     "text": "They're wise to it. They've eaten the bait, the trap, and the airlock seal.",
     "hull": -3,
     "damageSystem": "doors"
    }
   },
   {
    "text": "Pay an exterminator at the next station.",
    "effect": {
     "text": "A man in overalls spends an hour aboard and comes out grey. \"Never seen anything like it. One of them offered me a cup of tea.\" But they're gone.",
     "endThread": "weev"
    },
    "cost": {
     "scrap": 30
    },
    "req": {
     "scrap": 30
    }
   }
  ],
  "art": "ship",
  "thread": "weev",
  "step": 2
 },
 "th_ghost_0": {
  "title": "Cold on the bridge",
  "text": "The bridge is cold. The captain's chair is turning slowly, by itself. A faint voice says: \"You've got the trim wrong.\" It's the ship's previous captain. The previous captain is, by all accounts, dead.",
  "choices": [
   {
    "text": "\"Who's there?\"",
    "effect": {
     "text": "\"Captain Ignatius Marr. This was my ship for thirty years. You're flying her like a shopping trolley.\" He's staying. He has notes.",
     "thread": {
      "id": "ghost",
      "name": "The last captain's ghost"
     }
    }
   },
   {
    "text": "Fix the trim.",
    "effect": {
     "text": "\"...Better,\" says the voice, grudgingly. The chair stops turning. You have a feeling you're being watched, and marked out of ten.",
     "thread": {
      "id": "ghost",
      "name": "The last captain's ghost"
     }
    }
   }
  ],
  "art": "ship",
  "starts": "ghost"
 },
 "th_ghost_1": {
  "title": "Captain Marr",
  "text": "\"In my day,\" says Captain Marr, from somewhere near the ceiling, \"we knew every beacon in this sector by heart.\" He starts listing them. It takes an hour. But he does know every beacon in this sector.",
  "choices": [
   {
    "text": "Write them down.",
    "effect": {
     "text": "The map fills in. \"And don't go to that one,\" he adds. \"The toilets are a disgrace.\"",
     "reveal": true
    }
   },
   {
    "text": "\"Yes, thank you, Captain.\"",
    "effect": {
     "text": "\"Don't you 'yes, thank you' me.\" He sulks. The heating goes off for an hour.",
     "crewHurt": 3
    }
   }
  ],
  "art": "ship",
  "thread": "ghost",
  "step": 1
 },
 "th_ghost_2": {
  "title": "Captain Marr",
  "text": "The crew have asked you to have a word. Captain Marr has been haunting the showers. \"I'm not haunting them,\" he says. \"I'm inspecting them. Standards have slipped.\"",
  "choices": [
   {
    "text": "Agree some boundaries.",
    "effect": {
     "text": "Not the showers, not the bunks, and not during meals. In return he gets the bridge on the night watch. The night watch has never been so well kept.",
     "crewHeal": 10,
     "xp": {
      "skill": "pilot",
      "amt": 12
     }
    }
   },
   {
    "text": "Call in a priest.",
    "effect": {
     "text": "The priest stays for tea, has a lovely chat with the Captain about the old days, and leaves without doing anything. \"He's no trouble,\" she says. \"He's just bored.\""
    },
    "cost": {
     "scrap": 10
    },
    "req": {
     "scrap": 10
    }
   }
  ],
  "art": "ship",
  "thread": "ghost",
  "step": 2
 },
 "th_ghost_3": {
  "title": "Captain Marr",
  "text": "A ship jumps in on your tail, guns hot. The lights dim. \"Oh, I know this one,\" says Captain Marr, and for the first time he sounds happy. \"I've been waiting forty years for this one. May I?\"",
  "choices": [
   {
    "text": "\"The bridge is yours, Captain.\"",
    "effect": {
     "text": "The ship moves like it's remembered something. Your guns fire before you touch them.",
     "primeWeapons": true,
     "fight": "pyrate_gunship",
     "afterWin": {
      "text": "\"That,\" says Captain Marr, \"is how it's done.\" The cold lifts. The chair turns once more, and stops. On the seat there's an old captain's badge, and the bridge is very quiet.",
      "scrap": 40,
      "augment": "random",
      "endThread": "ghost"
     }
    }
   },
   {
    "text": "\"My ship now. Watch and learn.\"",
    "effect": {
     "text": "\"Hmph.\" But he watches.",
     "fight": "pyrate_gunship",
     "afterWin": {
      "text": "A pause. \"...Seven out of ten,\" says the ceiling. Then, quieter: \"She's in good hands.\" He doesn't speak again.",
      "scrap": 30,
      "endThread": "ghost"
     }
    }
   }
  ],
  "art": "ship",
  "thread": "ghost",
  "step": 3
 },
 "th_x_cat_weev": {
  "title": "The cat and the weevils",
  "text": "The scratching in the walls has stopped. So has everything else in the walls. The cat is lying in the corridor, twice its usual width, with a leg sticking out of its mouth. It isn't the cat's leg.",
  "choices": [
   {
    "text": "Good cat.",
    "effect": {
     "text": "The best cat. There isn't a weevil left aboard. In their nests you find everything they'd been hoarding.",
     "parts": 4,
     "scrap": 20,
     "endThread": "weev"
    }
   }
  ],
  "art": "ship",
  "threads": [
   "cat",
   "weev"
  ]
 },
 "th_x_cat_gnome": {
  "title": "The cat and the gnome",
  "text": "The cat has found the gnome. It pats it. The gnome falls over. The cat pats it again. This has been going on for two hours. The gnome keeps getting back up. Nobody has seen it get back up.",
  "choices": [
   {
    "text": "Leave them to it.",
    "effect": {
     "text": "By evening they've reached an understanding. The cat is asleep. The gnome is next to it. The gnome's painted hand is on the cat's head.",
     "crewHeal": 10
    }
   },
   {
    "text": "Put the gnome on a high shelf.",
    "effect": {
     "text": "The cat looks at the shelf. The cat looks at you. In the morning the gnome is on the floor and so is everything else that was on the shelf.",
     "scrap": -5
    }
   }
  ],
  "art": "ship",
  "threads": [
   "cat",
   "gnome"
  ]
 },
 "th_x_cat_crate": {
  "title": "The cat and the crate",
  "text": "The cat is sitting on the crate. The crate has stopped humming and is, unmistakably, purring. The cat is not purring. It's the crate.",
  "choices": [
   {
    "text": "Don't ask.",
    "effect": {
     "text": "You don't ask. Some things on a ship are between a cat and a crate.",
     "crewHeal": 8
    }
   }
  ],
  "art": "ship",
  "threads": [
   "cat",
   "crate"
  ]
 },
 "th_x_cat_celeb": {
  "title": "The cat and Gloria",
  "text": "Gloria Pike is allergic to cats. She has announced this to the whole ship. The cat has responded by moving into her cabin, on to her pillow, on top of her spare wig.",
  "choices": [
   {
    "text": "Take Gloria's side.",
    "effect": {
     "text": "You remove the cat. Gloria is gracious about it. The cat is not. You find a weevil in your boot.",
     "scrap": 15
    }
   },
   {
    "text": "Take the cat's side.",
    "effect": {
     "text": "\"I see,\" says Gloria. By evening the cat is on her lap and she's feeding it smoked salmon from her own supply. \"It's not the cat I mind, darling. It's losing.\"",
     "crewHeal": 12
    }
   }
  ],
  "art": "ship",
  "threads": [
   "cat",
   "celeb"
  ]
 },
 "th_x_hat_celeb": {
  "title": "The hat and Gloria",
  "text": "Gloria Pike has seen the hat. \"Darling, where did you GET it?\" Before anyone can stop her, she's put it on. \"This hat's divine, I look a treat / it brings out my... oh. Oh, that's NEAT.\" She does a whole show in rhyme. The crew request an encore.",
  "choices": [
   {
    "text": "Record it.",
    "effect": {
     "text": "The recording gets out. \"Gloria Pike: The Hat Sessions\" goes to number one. She cuts you in.",
     "scrap": 50
    }
   },
   {
    "text": "Get the hat back before she keeps it.",
    "effect": {
     "text": "It takes three of you. The hat didn't want to leave either.",
     "crewHurt": 4,
     "crewHeal": 10
    }
   }
  ],
  "art": "ship",
  "threads": [
   "hat",
   "celeb"
  ]
 },
 "th_x_hat_insp": {
  "title": "The hat and Dennis",
  "text": "Dennis has confiscated the hat as a hazard. He's wearing it so he can carry his clipboard. \"Regulation four, sub-section B / all hats aboard must go through me. Oh no.\"",
  "choices": [
   {
    "text": "Help him get it off.",
    "effect": {
     "text": "It takes butter, a crowbar and an apology to the hat. Dennis is shaken. He doesn't write anything down for a whole day.",
     "crewHeal": 6
    }
   },
   {
    "text": "Leave it on him for a bit.",
    "effect": {
     "text": "A rhyming safety briefing turns out to be the only kind the crew have ever listened to. Nobody gets hurt for a week.",
     "hull": 4,
     "xp": {
      "skill": "repair",
      "amt": 10
     }
    }
   }
  ],
  "art": "ship",
  "threads": [
   "hat",
   "insp"
  ]
 },
 "th_x_debt_celeb": {
  "title": "Big Kev and Gloria",
  "text": "Big Kev's collectors have arrived. Then they see who's standing behind you. Medium Kev takes off his hat. \"Miss Pike. My mum's got all your records.\"",
  "choices": [
   {
    "text": "Let Gloria sort it out.",
    "effect": {
     "text": "Gloria records a birthday message for Big Kev's mum, there and then. Small Kev cries. Your debt is cancelled, and Big Kev sends flowers. To Gloria.",
     "endThread": "debt",
     "crewHeal": 8
    }
   }
  ],
  "art": "ship",
  "threads": [
   "debt",
   "celeb"
  ]
 },
 "th_x_debt_crate": {
  "title": "Big Kev and the crate",
  "text": "\"Tell you what,\" says Big Kev, eyeing the crate in your hold. \"Give me that and we'll call it quits.\" The crate stops humming. You have the strong impression that it's listening.",
  "choices": [
   {
    "text": "Hand over the crate.",
    "effect": {
     "text": "The Kevs carry it out between them. As it goes, it hums something reproachful. An hour later you get a message: \"IT WON'T STOP. TAKE IT BACK. WE'RE SQUARE. KEV.\"",
     "endThread": "debt",
     "scrap": 20
    }
   },
   {
    "text": "\"The crate stays.\"",
    "effect": {
     "text": "The crate hums a little fanfare. Big Kev narrows his eyes. \"Weird ship,\" he says, and adds ten to your tab.",
     "crewHeal": 5
    }
   }
  ],
  "art": "ship",
  "threads": [
   "debt",
   "crate"
  ]
 },
 "th_x_insp_weev": {
  "title": "Dennis and the weevils",
  "text": "Dennis has opened a wall panel to check the wiring. He's been standing there for a full minute, not moving, looking at what's looking back. His clipboard has slipped from his fingers.",
  "choices": [
   {
    "text": "Close the panel for him.",
    "effect": {
     "text": "\"Those are a category nine,\" he says, in a small voice. He spends the night writing. By morning there's a forty-page extermination plan, and it works.",
     "endThread": "weev",
     "hull": 3
    }
   },
   {
    "text": "\"They're called Colin.\"",
    "effect": {
     "text": "Dennis sits down on the floor. One of the weevils brings him a biscuit. It's one of your biscuits. He eats it.",
     "crewHeal": 6
    }
   }
  ],
  "art": "ship",
  "threads": [
   "insp",
   "weev"
  ]
 },
 "th_x_insp_flu": {
  "title": "Dennis and the Lurgy",
  "text": "Dennis has caught the Lurgy. He's filled in a form about it. The form requires him to quarantine himself from himself, and he's doing his best.",
  "choices": [
   {
    "text": "Bring him soup.",
    "effect": {
     "text": "He risk-assesses the soup, then eats it. \"You're a good crew,\" he says, thickly. \"Terrible ship. Good crew.\" He signs off your fire system on the spot.",
     "food": -1,
     "hull": 5
    }
   }
  ],
  "art": "ship",
  "threads": [
   "insp",
   "flu"
  ]
 },
 "th_x_flu_celeb": {
  "title": "Gloria and the Lurgy",
  "text": "Gloria has lost her voice. She's communicating by writing on a little pad. The pad says: \"WHO SNEEZED ON ME.\" Then: \"I HAVE A CONCERT.\" Then, underlined three times: \"NAMES.\"",
  "choices": [
   {
    "text": "Honey, lemon, and total silence.",
    "effect": {
     "text": "It takes two days of the whole crew whispering. Her voice comes back, deeper, with a bit of gravel in it. She loves it. \"I sound like I've LIVED, darling.\"",
     "food": -1,
     "scrap": 30
    }
   },
   {
    "text": "Suggest she cancels.",
    "effect": {
     "text": "The pad says: \"NEVER.\" Then a second page, just for you. You've been told off by professionals, and this is the best.",
     "crewHurt": 3
    }
   }
  ],
  "art": "ship",
  "threads": [
   "flu",
   "celeb"
  ]
 },
 "th_x_ghost_gnome": {
  "title": "The Captain and the gnome",
  "text": "\"That's not mine,\" says Captain Marr, quickly. The gnome is on the bridge, facing the chair. \"Never seen it before.\" The cold on the bridge has an edge of something new. If you didn't know better, you'd say the ghost was nervous.",
  "choices": [
   {
    "text": "\"Captain. What did you do?\"",
    "effect": {
     "text": "A long silence. \"...I ran over a garden once. On Brindle. Emergency landing. There were casualties.\" The gnome's smile doesn't change. Marr apologises to it, formally, on the record. In the morning there's scrap in a tiny wheelbarrow, and the two of them seem to have made their peace.",
     "scrap": 35,
     "crewHeal": 8
    }
   }
  ],
  "art": "ship",
  "threads": [
   "ghost",
   "gnome"
  ]
 },
 "th_x_ghost_hat": {
  "title": "The Captain and the hat",
  "text": "\"That's Barnaby's hat,\" says Captain Marr. \"I served with Barnaby. Insufferable man. Worse poet.\" The hat turns, slowly, to face the empty chair. \"Marr, you old goat, you're dead, I see / well so am I. Come sit with me.\"",
  "choices": [
   {
    "text": "Leave the two of them to catch up.",
    "effect": {
     "text": "They talk all night: one in verse, one in complaints. In the morning both seem lighter, and somebody has left you the benefit of eighty years' experience, written out in a shaky hand that rhymes.",
     "reveal": true,
     "xp": {
      "skill": "weapons",
      "amt": 15
     }
    }
   }
  ],
  "art": "ship",
  "threads": [
   "ghost",
   "hat"
  ]
 },
 "th_x_gnome_insp": {
  "title": "Dennis and the gnome",
  "text": "Dennis has tagged the gnome as an unsecured item. He's put it in a locker. He's opened the locker to check. He's closed the locker. He's standing with his back against the locker, breathing carefully.",
  "choices": [
   {
    "text": "\"It does that, Dennis.\"",
    "effect": {
     "text": "\"There's nothing in the regulations,\" he whispers. \"I've looked.\" He writes a new regulation. It's one line long. It says: LEAVE THE GNOME ALONE.",
     "crewHeal": 8,
     "hull": 2
    }
   }
  ],
  "art": "ship",
  "threads": [
   "gnome",
   "insp"
  ]
 }
};
Object.assign(BASE.events, THREAD_STORIES); if(typeof DATA!=='undefined' && DATA && DATA.events) Object.assign(DATA.events, JSON.parse(JSON.stringify(THREAD_STORIES)));
/* two ordinary events can leave a loose end behind them */
(function(){ try{ const c = BASE.events.casino, w = BASE.events.weevils; if(c && c.choices[0] && c.choices[0].fail) c.choices[0].fail.thread = { id:'debt', name:'You owe Big Kev' }; if(w && w.choices[0] && w.choices[0].success) w.choices[0].success.thread = { id:'weev', name:'Weevils in the walls' }; }catch(e){} })();
