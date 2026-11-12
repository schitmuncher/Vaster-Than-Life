# Vaster Than Life

A starship-command roguelike for WebXR, built for Meta Quest 2 and newer. It also plays in any desktop or phone browser.

You command a Commonwealth courier carrying data that could end the war. Cross eight sectors, one jump at a time, while the Mandate Fleet closes in behind you. Then chase down the Dreadnought before it destroys Commonwealth command.

It's a fan homage to *FTL: Faster Than Light*. The code, art, names and writing are all original, with plenty of puns.

**In this README:** [Play](#play) · [Multiplayer](#multiplayer) · [Player's guide](#players-guide) (controls, the crew screen, levels, classes, perks, abilities, grenades, attachments, every crew weapon, health, food and hunger, skills, races, captain level and ranks, ships, Haven's Rest, difficulty, saves, the Red Dwarf campaign, troubleshooting) · [What's in the game](#whats-in-the-game) · [Mods](#mods) · [Tech](#tech) · [Credits](#credits)

## Play

Host the repo with GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. On a Quest, open the Pages link in the Meta Quest Browser and press **Enter VR**, or **Enter mixed reality** for passthrough.

| Quest control | Action |
| --- | --- |
| Point + trigger (or pinch) | Use whatever you point at: the main screen, your datapad, a pop-out window, a bridge station, the holotable or the enemy ship outside |
| Touch with the controller tip | Press buttons on screens and stations directly, like a touchscreen |
| Point at the floor + trigger | Teleport there |
| Left stick | Walk (push fully to run), with a comfort vignette |
| Right stick left / right | Turn (snap 30°, 45° or smooth) |
| Left stick click | Hold up your datapad: the whole game screen in your hand |
| Right stick click | Back to the captain's spot |
| A / X | Pause or resume |
| B / Y | Open or close the map (the holotable turns into a 3D star chart) |
| Grip | Carry the main screen, take the fire extinguisher off its rack, or pull the jump lever |
| Glance at your left wrist | Wrist menu |

**Play position.** Choose **Standing**, **Seated** or **Lying down** in Settings, or from the pause screen while in VR. Seated puts you in the captain's chair at chair height. Lying down tilts the whole bridge so that looking at the ceiling shows the console in front of you: lie back, look up, and click the right stick to re-aim if needed. The right stick click always resets your position for the chosen mode.

Look at either controller to see a label of what its buttons do. Turning style, teleport-only movement, the vignette, the magnifier, bigger VR text and the controller labels are in **Settings → VR movement** and **Settings → VR console**. Hovering over buttons gives a small haptic tick, the console texture is mipmapped so small text stays sharp, and small fonts are enlarged in VR.

In VR you stand on the bridge of your ship. A **holotable** under the console shows 3D models of both ships, with fires, damage, crew, drones and shots in flight, and the enemy ship is out there beyond the canopy. You can turn the holotable off in Settings.

**Phones and tablets.** Tap **Full screen** on the title screen (or pause and tap **⛶ Full screen**) to hide the browser bars and lock to landscape. On iPhone, which has no full-screen mode for web pages, the game shows how to add it to your Home Screen instead; it then opens full screen like an app. Held upright, a phone turns the game sideways for you (switch this off in **Settings → Screen & touch**).

| Touch | Action |
| --- | --- |
| Tap | Use anything. Taps that land just off a button still hit it |
| Tap a weapon or drone card | Power it (the game moves spare reactor power over if it needs to) and pick it for aiming |
| Press and hold | Show details about what's under your finger, without clicking it |
| Pinch or double-tap the ships | Zoom into the battle (up to 3×). Only the ships are magnified: the top bar, crew, power and weapon panels stay normal size and keep working, so you can aim, give orders and power systems while zoomed |
| Drag while zoomed | Look around the battle (or tap the small map under **Zoom out**) |
| Pinch or double-tap anywhere else | Zoom the whole screen (up to 4×); double-tap again or tap **Reset zoom** to zoom out |

On a computer, the mouse wheel over the ships zooms the battle the same way. Switch it off in **Settings → Display → Zoom into the ships**.

**Screen shape** (Settings → Screen & touch): *Fill* stretches the game to the whole screen so no black bars show (the default on phones and tablets), *16:10* is the original shape, *16:9* and *21:9* are wide shapes, and *Crop* zooms in so nothing is left over; drag to see the edges.

Text is larger by default on touch screens (Normal / Large / Huge in Settings). If you'd like events and messages to zoom in to fill a phone screen while they're open, switch on **Settings → Display → Zoom in to read** (off by default; tips never zoom). Tips are spaced out, so you don't get one straight after another. The game pauses itself when you switch apps, keeps the screen awake while you play, and gives a short vibration on hits (switch off in Settings). Settings can also be opened from the pause screen mid-run.

| Keyboard | Action |
| --- | --- |
| Space | Pause |
| M | Map |
| S | Ship screen |
| 1–4 | Select a weapon to target |
| V | Hold fire / fire volley |
| F | Autofire on / off |
| C | Cloak |
| H | Crew back to stations |
| + / − | Game speed |
| Arrow keys, Enter | Move between buttons and rooms, and select |
| Esc | Close or cancel |

| Game controller | Action |
| --- | --- |
| D-pad | Jump between buttons and rooms |
| Left stick | Move a free cursor |
| A / B | Select / back out |
| X / Y | Hold fire / map |
| LB / RB | Previous / next weapon (the cursor jumps to the enemy ship) |
| LT / RT | Crew back to stations / autofire |
| Start / View | Pause / ship screen |

## Multiplayer

Free, with no accounts and no game servers: players connect directly, browser to browser, so a Quest, a laptop and a phone can all play together. Open **Multiplayer** on the title screen, host a game and read out the five-letter room code, or join with a friend's code (typed on the on-screen keyboard, which works in VR, or opened from an invite link like `…/index.html#join=ABCDE`). You can also invite friends into the run you're already flying: pause and press **Invite friends into this run**.

| Mode | Players | What it is |
| --- | --- | --- |
| **Co-op crew** | 2–4 | One ship, everyone aboard. By default anyone can do anything; turn on **Stick to stations** to give each player a role (Captain, Helm, Tactical, Engineer). The map, ship screen and store are each player's own window, so two players can browse different things at once. Event choices can be anyone's, or the captain's only. |
| **Navigator** | 2 | A captain in VR flies and fights; a navigator on a laptop or phone plots the course, answers beacons and runs the shop. |
| **Away team** | 2–4 | Co-op with a boarding specialist, who is prompted to beam over with the teleporter crew. In VR they can walk the enemy ship, sabotage systems by hand and use the sidearm. |
| **Go live** | 1 + up to 7 viewers | Stream your run. Viewers watch from any device, can look at the map and ship screen, and send emoji that float up on everyone's screen. Games can be listed publicly, and any co-op game can take viewers too. |
| **Hunter and hunted** | 2 | The host flies the courier as usual. The guest is the Mandate fleet commander, earning 2 command points per courier jump and spending them on cards: ambushes and hazards placed on the map, fleet surges, jammed sensors, and in a fight overcharged guns, boarders and shield surges. The commander can also aim every enemy gun. Play the whole run, or a short hunt to sector 4. |
| **Duel arena** | 2 | Each player picks a hull and spends the same budget in an arena store that sells everything, then the two ships fight. Best of 1, 3 or 5. Each player's own game runs their own ship; shots, boarders, hacking pulses and mind control cross over, and whoever is hit works out the hit. |
| **Boarding brawl** | 2 | Pick up to four crew on a points budget. Both crews start at opposite ends of the same ship with the doors open; the medbay heals whoever stands in it. After two minutes, life support fails. |
| **Race to the Dreadnought** | 2–4 | Everyone flies the same seed at the same time. A strip under the top bar shows how far each rival has got; winning fights draws trouble cards to play on them (fleet surge, ambush, ion storm, sensor jam, fuel leak, pirate toll, or a jammer to block one). |
| **Wingmen** | 2–4 | Your own ships on the same sectors. Jump to the same beacon as a wingmate and you fight the same ship together: each of your shots is echoed into their fight as covering fire. Send each other scrap, fuel, missiles and drone parts. |

**No room needed.** **Seed duels** send any finished run as a link or code: your friend flies the same seed (same maps, events and shops) and sees whose score wins, and their answer comes back the same way. **Challenge codes**: design a challenge (ship, difficulty, goal, hull, crew, starting supplies, guns, fleet speed, sector count, salvage) and share it as a code; codes from friends are saved to the Challenges screen. The **weekly cup** is a run everyone flies all week (Normal, mods off); it and the **daily run** have public score boards.

**Talking.** Quick chat (**T**, or the Chat button) sends calls like *Fire!* or *Jump now?* and emoji. **Voice** is optional: it asks for your microphone and sends your voice straight to the other players. Everyone sees where the others are pointing, with their name. In co-op, VR players see each other on the bridge as a helmet, hands and a name tag, and flat-screen players see a marker in the room a VR player is standing in.

If the host's connection drops, guests in a shared game can **keep playing the run solo**, or rejoin with the same code. Leaving on purpose takes you back to the multiplayer menu. Players who join late are brought straight into the run in progress (or to the end screen, if the run just ended); in a race, late arrivals are asked to pick a ship if picking is still going on. Settings → Multiplayer has your name, which meeting servers to use, automatic score posting and an optional TURN relay server (only needed on networks that block direct connections).

<!-- guide:start -->
## Player's guide

A detailed reference for everything you do in a run. The tables in this section are generated from the game's own data (`tools/gen-player-guide.js`), so the numbers are the ones the game uses. The in-game **Wiki** (title screen) has the same material with links between pages.

### Contents

- [Controls](#controls) · [The screen in a run](#the-screen-in-a-run) · [Your first run](#your-first-run)

- [Crew: the crew screen](#crew-the-crew-screen) · [Crew levels](#crew-levels) · [Classes](#classes) · [Perks](#perks) · [Abilities](#abilities) · [Grenades](#grenades) · [Attachments](#attachments) · [Crew weapons](#crew-weapons)

- [Health and healing](#health-and-healing) · [Food and hunger](#food-and-hunger) · [Skills](#skills) · [Races](#races)

- [Captain level, rank and renown](#captain-level-rank-and-renown) · [Ships](#ships) · [Haven's Rest](#havens-rest) · [Difficulty](#difficulty)

- [Gentler rules](#gentler-rules) · [Voyages, memorial, logs](#longer-voyages-the-memorial-wall-logs-and-the-graveyard) · [Saves and your data](#saves-and-your-data) · [Red Dwarf campaign](#red-dwarf-campaign) · [Troubleshooting](#troubleshooting)

### Controls

**Keyboard and mouse.** Click to do everything; hover anything for a tip.

| Key | What it does |
| --- | --- |
| Space | Pause or resume (you can give every order while paused) |
| M | Open or close the map |
| S | Open or close the Ship screen |
| 1–4 | Pick a powered weapon to aim |
| V | Hold fire (let every weapon charge) / fire at will |
| F | Autofire on or off |
| C | Cloak (if you have Cloaking) |
| H | Send all crew back to their stations |
| + / − | Game speed up or down (50% to 125%) |
| Esc | Close the window, or drop the current selection |
| T or Enter | Quick chat (multiplayer) |
| Arrow keys + Enter | Move between buttons and press them |

**Touch (phones and tablets).** Tap to act; taps are forgiving and land on the nearest button. Press and hold anything to read its tip. Pinch to zoom (over the ships it zooms the battle view, elsewhere the whole screen), drag to pan while zoomed, double-tap empty space to zoom in or out, and tap with two fingers to pause. The Android back gesture closes the open window.

**Game controller (flat screen).**

| Button | What it does |
| --- | --- |
| Left stick | Free cursor |
| D-pad | Jump between buttons and rooms |
| A | Select |
| B | Back / close |
| X | Hold fire / fire at will |
| Y | Map |
| LB / RB | Step through powered weapons and park the cursor on the enemy |
| LT | Crew back to stations |
| RT | Autofire on or off |
| Back / View | Ship screen |
| Start / Menu | Pause |

**Meta Quest, in VR.** Point and pull the trigger to press anything; one pull is one press. Grip while pointing at the console or holotable to move it (grip its edges or corners to resize, or use two hands). A or X pauses, B or Y opens the map. Click the left stick for the datapad (the whole game screen on a tablet in your hand); click the right stick to reset your position. You can also touch screens and buttons with the controller tip.

**Meta Quest, flat browser (no headset session).** The laser pointer works like a mouse: a press counts the moment the trigger goes down, a shaky laser still lands on the nearest button, and a doubled press only counts once.

### The screen in a run

| Where | What it shows |
| --- | --- |
| Top left | Hull (your ship's life), shields (layers up), evasion and average oxygen |
| Top middle | Scrap (money), fuel (one per jump), missiles, drone parts and food (meals for the crew) |
| Top centre-right | Sector and its type; in the last sector, the Dreadnought's progress |
| VTL drive | Charges during a fight while someone flies the ship; when it is full you can jump away |
| Jump / Map | Opens the map (it says Jump when the drive is charged in a fight) |
| Crew | The crew screen: everyone's level, health, food, class, weapons, perks and abilities |
| Ship | Systems and upgrades, weapons and cargo, crew, armoury, factions, hold, garden, workshop, log |
| Pause | Pause; every order still works while paused |
| Your ship (left) | Rooms, systems, fires, breaches, oxygen and crew. Click a crew member, then a room, to move them |
| The enemy (right) | Their ship. Pick a weapon, then a room, to aim |
| Crew row | Everyone aboard: tap once to select, tap the selected person again for their crew screen. A coloured dot means they are hungry |
| Power | Reactor bars per system: + and − under each one |
| Weapons and drones | Each weapon's charge; power, aim, Hold fire, Autofire |

### Your first run

1. **New run → pick a ship.** Easy is the gentle way in. The Admiral sends you off with a gift: take one.

2. **Open the Map** and jump to a beacon joined to yours. Each jump costs 1 fuel, and the Mandate Fleet follows you from the left; keep ahead of it.

3. **Beacons** are events (?), fights, stores, quiet spots, distress calls and quests. Stores and exits are always marked.

4. **In a fight**: power your weapons, pick one, then click an enemy room (shields first, then weapons). Pause whenever it gets busy.

5. **Damage control**: send crew to fires, breaches and broken systems; hurt crew walk to the medbay.

6. **Spend scrap** at stores and on upgrades (Ship → Systems). A second shield layer is the best early upgrade.

7. **Feed the crew**: they eat between jumps from the Food count; buy more at stores (Supplies) before it runs low.

8. **Reach the exit** of each sector, pick the next one, and in the last sector catch and beat the Dreadnought three times.

Every run earns captain xp and renown, win or lose. The **Tutorial** on the title screen (Guided practice) teaches all of this hands-on.

### Crew: the crew screen

Tap **Crew** in the top bar, or tap someone in the crew row twice. One page shows everything about them:

- **Level and xp**, with what the next level brings.

- **Health, food, damage, repair and speed**, and where each comes from (weapon, attachments, perks, level, prestige, food).

- **Skills**: six of them, untrained → skilled → expert.

- **Class**: tap a class to give it to them, or **+ Save class** to keep their set-up as your own.

- **Slots**: primary and secondary weapons (two attachments each), armour, lethal and tactical grenades, three perks plus a wildcard, and four abilities. Tap any slot to see every option, what it does and when it unlocks.

- **Feed** someone now, **Save to roster** to keep them for later runs, or **Rename** them.

### Crew levels

Crew earn xp for what they do: kills (10 each), every fight they live through (15, or 5 if the enemy got away), repairs, firefighting, and time spent manning the helm, engines, shields and weapons. They level up to 30. Every level makes them a bit better at everything, and some levels open slots.

| Level | Total xp | Bonus over level 1 | Unlocks |
| --- | --- | --- | --- |
| 1 | 0 | +0 health, +0.0% damage, +0% repair | — |
| 2 | 37 | +1 health, +0.6% damage, +1% repair | Lethal grenade slot |
| 3 | 86 | +2 health, +1.2% damage, +2% repair | Secondary weapon |
| 4 | 147 | +3 health, +1.8% damage, +3% repair | Perk slot 1 |
| 5 | 220 | +4 health, +2.4% damage, +4% repair | Tactical grenade slot |
| 6 | 305 | +5 health, +3.0% damage, +5% repair | Sticky Grenade |
| 7 | 402 | +6 health, +3.6% damage, +6% repair | Perk slot 2 |
| 8 | 511 | +7 health, +4.2% damage, +7% repair | Stim Shot |
| 9 | 632 | +8 health, +4.8% damage, +8% repair | Perk slot 3 |
| 10 | 765 | +9 health, +5.4% damage, +9% repair | Ability slot 1 |
| 11 | 910 | +10 health, +6.0% damage, +10% repair | Incendiary Grenade |
| 12 | 1,067 | +11 health, +6.6% damage, +11% repair | Smoke Grenade |
| 15 | 1,610 | +14 health, +8.4% damage, +14% repair | Ability slot 2 |
| 16 | 1,815 | +15 health, +9.0% damage, +15% repair | Plasma Grenade |
| 17 | 2,032 | +16 health, +9.6% damage, +16% repair | Concussion |
| 20 | 2,755 | +19 health, +11.4% damage, +19% repair | Ability slot 3 |
| 21 | 3,020 | +20 health, +12.0% damage, +20% repair | Cluster Grenade |
| 22 | 3,297 | +21 health, +12.6% damage, +21% repair | EMP Grenade |
| 25 | 4,200 | +24 health, +14.4% damage, +24% repair | Ability slot 4 |
| 30 | 5,945 | +29 health, +17.4% damage, +29% repair | Prestige |

**Prestige** (at level 30, up to 10 times): back to level 1, losing the level bonus and the perk and grenade slots until they level again, but keeping their abilities. Each prestige adds +5 maximum health and +3% damage for good, and the first one opens a **wildcard perk slot** that takes any perk. Prestige shows as ★ next to their level.

### Classes

A class is a set-up you can give to anyone in one tap: perks, grenades and abilities as far as their level allows, and the matching weapons from the locker (best tier and weapon level first) if you have them. Six come with the game; save up to eight of your own from the crew screen (**+ Save class**, then name it). Your classes are kept for every run.

| Class | Primary | Secondary | Perks | Grenades | Abilities | Good for |
| --- | --- | --- | --- | --- | --- | --- |
| Assault | Assault rifle | Pistol | Scavenger, Stopping Power, Steady Aim | Frag Grenade, Flashbang | War Cry, Second Wind, Breacher, Juggernaut | A rifle, a pistol and more damage. Good at everything. |
| Medic | SMG | Pistol | Field Medic, Hardened, Tactical Mask | Frag Grenade, Stim Shot | Field Surgeon, Second Wind, Last Stand, Sprinter | Keeps everyone in the room alive. |
| Engineer | SMG | Melee | Engineer, Hardened, Dead Silence | Incendiary Grenade, Smoke Grenade | Quartermaster, Second Wind, Juggernaut, Last Stand | Fast repairs and firefighting, and hard to kill while doing it. |
| Breacher | Shotgun | Melee | Lightweight, Bloodlust, Dead Silence | Sticky Grenade, Concussion | Breacher, War Cry, Last Stand, Sprinter | Teleports over and clears rooms. |
| Marksman | Marksman | Pistol | Scavenger, Stopping Power, Steady Aim | Frag Grenade, Smoke Grenade | Second Wind, Quartermaster, War Cry, Juggernaut | Shoots into the next room before boarders reach them. |
| Tank | LMG | Launcher | Engineer, Hardened, Tactical Mask | Cluster Grenade, Smoke Grenade | Juggernaut, Last Stand, Second Wind, War Cry | Heavy guns and armour. Holds a door on their own. |

### Perks

Three slots (open at levels 4, 7 and 9), four perks each, plus a wildcard slot after the first prestige. Use a perk enough and its **Pro** version unlocks for everyone, for good.

| Slot | Perk | Effect | Pro version | Pro unlocks after |
| --- | --- | --- | --- | --- |
| 1 | Scavenger | Each kill mends their weapon a little. | an extra grenade of each kind every fight. | 20 kills with it |
| 1 | Lightweight | Move 10% faster. | move 20% faster. | 20 kills with it |
| 1 | Field Medic | Heals people in the same room 1 health a second. | 2 a second. | 400 health healed with it |
| 1 | Engineer | Repairs and fights fires 20% faster. | 35% faster. | 30 repairs with it |
| 2 | Stopping Power | +12% damage. | +20% damage. | 25 kills with it |
| 2 | Hardened | Take 12% less damage. | 20% less. | 25 kills with it |
| 2 | Flak Jacket | Grenades hurt them half as much. | grenades barely scratch them (a quarter). | 15 kills with it |
| 2 | Bloodlust | +8% damage for every kill this fight (up to 3). | up to 5 kills. | 25 kills with it |
| 3 | Steady Aim | Shots into the next room do 30% more. | 50% more, and 5% critical hits. | 20 kills with it |
| 3 | Tactical Mask | Flashbangs, smoke and concussion grenades don't affect them. | no weapon can stun them either. | 20 kills with it |
| 3 | Dead Silence | For the first 4 seconds of a fight, foes can't hurt them. | 7 seconds. | 20 kills with it |
| 3 | Sleight of Hand | Their secondary does 25% more. | 50% more, and it never wears out. | 20 kills with it |

### Abilities

One ability slot opens at each of levels 10, 15, 20, 25. Abilities are kept through prestige, and no one can take the same ability twice.

| Ability | Effect |
| --- | --- |
| Second Wind | Once a fight, when badly hurt, they get 40 health back. |
| Last Stand | Once a fight, a blow that would kill them leaves them on 1 health and untouchable for 2 seconds. |
| War Cry | When a fight starts in their room, everyone on their side there does 20% more for 8 seconds. |
| Field Surgeon | Everyone in their room heals 1.5 health a second. |
| Breacher | +30% damage aboard an enemy ship. |
| Quartermaster | All their kit wears out 30% slower. |
| Juggernaut | +30 maximum health. |
| Sprinter | Move 15% faster. |

### Grenades

Each crew member throws their lethal and tactical grenade once a fight, automatically, the first time they share a room with a foe. The Scavenger Pro perk gives an extra one of each.

| Kind | Grenade | Level | Effect |
| --- | --- | --- | --- |
| Lethal | Frag Grenade | 2 | 25 damage to every foe in the room. |
| Lethal | Sticky Grenade | 6 | 45 damage to one foe. |
| Lethal | Incendiary Grenade | 11 | 12 damage to every foe and sets the room on fire. |
| Lethal | Plasma Grenade | 16 | 30 damage to every foe, and their armour is wrecked. |
| Lethal | Cluster Grenade | 21 | 18 damage to every foe in the room and the rooms next to it. |
| Tactical | Flashbang | 5 | Stuns every foe in the room for 2.5 seconds. |
| Tactical | Stim Shot | 8 | Heals them 35 and they move faster for a while. |
| Tactical | Smoke Grenade | 12 | Foes in the room do half damage for 6 seconds. |
| Tactical | Concussion | 17 | Foes are slowed for 5 seconds and stunned for 1. |
| Tactical | EMP Grenade | 22 | Wrecks drones in the room and shuts down its system for 4 seconds. |

### Attachments

Crew weapons level up across all your runs (kills and time in fights with that weapon), up to level 10. Each weapon level opens attachments for its class; two can be fitted at once.

| Attachment | Weapon level | Fits | Effect |
| --- | --- | --- | --- |
| Red Dot Sight | 1 | Assault rifle, SMG, LMG, Shotgun, Pistol, Marksman, Special | +6% damage. |
| Light Stock | 2 | Assault rifle, SMG, Shotgun, Marksman | Move 6% faster. |
| Foregrip | 2 | Assault rifle, LMG, SMG, Shotgun | +8% damage. |
| Extended Mag | 3 | Assault rifle, SMG, LMG, Pistol, Marksman | Wears out 30% slower. |
| Suppressor | 3 | Assault rifle, SMG, Pistol, Marksman | +30% damage in the first seconds of a fight. |
| Monofilament Edge | 3 | Melee | Sharper. Much sharper. |
| Scope | 4 | Assault rifle, Marksman, LMG | Shoots further into the next room. |
| Laser Sight | 4 | Assault rifle, SMG, Pistol, Shotgun, LMG | 8% chance of a critical hit. |
| Big Warhead | 4 | Launcher | A bigger bang. |
| Bayonet | 5 | Assault rifle, Shotgun, Marksman | Close hits make foes bleed. |
| Hollow Points | 5 | Assault rifle, SMG, Pistol, LMG, Marksman | +12% damage, but wears faster. |
| Shock Wrap | 5 | Melee | A stun coil round the grip. |
| Drum Mag | 6 | LMG, SMG, Shotgun, Launcher | Wears out 45% slower. |
| Incendiary Rounds | 7 | Assault rifle, SMG, LMG, Shotgun, Pistol | Hits can start fires. |
| Weighted Head | 7 | Melee | Heavier swings, sometimes knocking foes back. |
| Stun Rounds | 8 | Assault rifle, SMG, Shotgun, Pistol, Marksman | Hits can stun. |

### Crew weapons

Primary weapons are what crew fight with; the secondary (from level 3) takes over when the primary is worn out and it is not. Weapons and armour wear out with use but never break: worn kit works at half its bonus and without its tricks (stuns, bleeding, fire, crits, attachments) until it is mended. Between jumps the crew mend one worn piece with a spare drone part (they keep two in reserve; Settings → Gameplay → Crew mend kit), or repair it yourself in the Armoury or at a store. Buy weapons at stores (Armoury tab) or take them from beaten boarders.

| Weapon | Class | Slot | Tier | Cost | Damage | Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Courier AR-7 | Assault rifle | primary | 1 | 45 | ×1.45 | +45% melee damage, shoots into neighbouring rooms. | A dependable rifle. Every courier crew has one, and every one jams on a Tuesday. |
| Vanguard Carbine | Assault rifle | primary | 1 | 50 | ×1.45 | +45% melee damage, shoots into neighbouring rooms. | Short and light. Good in narrow corridors. |
| Lancer Battle Rifle | Assault rifle | primary | 2 | 70 | ×1.55 | +55% melee damage, shoots into neighbouring rooms. | Heavier rounds, slower fire. Hits like a door slamming. |
| Fang Burst Rifle | Assault rifle | primary | 2 | 65 | ×1.45 | +45% melee damage, shoots into neighbouring rooms. | Three-round bursts. Now and then all three find the same spot. |
| Ionclad Rifle | Assault rifle | primary | 2 | 75 | ×1.45 | +45% melee damage, stuns, shoots into neighbouring rooms. | Fires ionised slugs that make muscles twitch. |
| Tempest AR | Assault rifle | primary | 3 | 95 | ×1.60 | +60% melee damage, shoots into neighbouring rooms. | Commonwealth special forces issue. Spare parts not included. |
| Harbinger Rifle | Assault rifle | primary | 3 | 100 | ×1.55 | +55% melee damage, cuts bleed 2/s, shoots into neighbouring rooms. | Serrated flechettes. Nasty. |
| Cobalt Pulse Rifle | Assault rifle | primary | 3 | 105 | ×1.50 | +50% melee damage, stuns, shoots into neighbouring rooms. | A pulse weapon from the Tinkari foundries. Hums politely. |
| Wasp SMG | SMG | primary | 1 | 40 | ×1.35 | +35% melee damage, shoots into neighbouring rooms. | Buzzes. Stings. Mostly hits the right person. |
| Ferret Machine Pistol | SMG | primary | 1 | 38 | ×1.30 | +30% melee damage, shoots into neighbouring rooms. | Tiny, fast and hard to keep still. |
| Hornet PDW | SMG | primary | 2 | 60 | ×1.42 | +42% melee damage, shoots into neighbouring rooms. | Personal defence weapon. Defends very personally. |
| Vortex SMG | SMG | primary | 2 | 62 | ×1.35 | +35% melee damage, shoots into neighbouring rooms. | A spinning magazine and a spinning reputation. |
| Scythe SMG | SMG | primary | 2 | 66 | ×1.35 | +35% melee damage, cuts bleed 1.5/s, shoots into neighbouring rooms. | Shreds armour and the people inside it. |
| Blitz Auto | SMG | primary | 3 | 85 | ×1.50 | +50% melee damage, shoots into neighbouring rooms. | For crews who prefer to arrive first. |
| Mirage Silenced SMG | SMG | primary | 3 | 88 | ×1.35 | +35% melee damage, shoots into neighbouring rooms. | Built-in suppressor. The first they hear of it is the last. |
| Bulwark LMG | LMG | primary | 1 | 55 | ×1.65 | +65% melee damage, shoots into neighbouring rooms. | A wall of noise and brass. |
| Ox Squad Gun | LMG | primary | 2 | 75 | ×1.72 | +72% melee damage, shoots into neighbouring rooms. | Needs two people to carry. One will do, grumbling. |
| Thresher Minigun | LMG | primary | 3 | 110 | ×1.85 | +85% melee damage, shoots into neighbouring rooms. | Spins up, then never stops. Neither does the ringing in your ears. |
| Warden Suppressor | LMG | primary | 2 | 72 | ×1.65 | +65% melee damage, stuns, shoots into neighbouring rooms. | Not so much aimed as poured. |
| Hailstorm LMG | LMG | primary | 3 | 105 | ×1.75 | +75% melee damage, shoots into neighbouring rooms. | Tracer rounds. Lots of them. Things catch fire. |
| Breacher Shotgun | Shotgun | primary | 1 | 45 | ×2.00 | +100% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | Opens doors. Opens people. Opens debates. |
| Mule Double-Barrel | Shotgun | primary | 1 | 40 | ×2.10 | +110% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | Two barrels, two chances, then a long reload. |
| Cyclone Auto-Shotgun | Shotgun | primary | 2 | 70 | ×1.90 | +90% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | Drum-fed. Do not stand in front of it. Or near it. |
| Dragon's Breath | Shotgun | primary | 2 | 72 | ×2.00 | +100% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | Incendiary shells. Bring an extinguisher. |
| Hammerhead Slug Gun | Shotgun | primary | 3 | 95 | ×2.20 | +120% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | One heavy slug. Throws people down corridors. |
| Tidal Riot Gun | Shotgun | primary | 3 | 90 | ×1.80 | +80% melee damage, stuns, shoots into neighbouring rooms, knocks foes out of the room. | Rubber slugs, mostly. Painfully mostly. |
| Needle Marksman | Marksman | primary | 1 | 50 | ×1.15 | +15% melee damage, shoots into neighbouring rooms. | Long, thin and very patient. |
| Longshot DMR | Marksman | primary | 2 | 75 | ×1.25 | +25% melee damage, shoots into neighbouring rooms. | Picks off boarders two rooms away. Well, one room. It feels like two. |
| Hawkeye Rifle | Marksman | primary | 2 | 78 | ×1.15 | +15% melee damage, shoots into neighbouring rooms. | An old hunting rifle with a very good scope. |
| Personal Railgun | Marksman | primary | 3 | 120 | ×1.30 | +30% melee damage, shoots into neighbouring rooms. | Goes through the target, the wall and the target's opinion of you. |
| Whisper Rifle | Marksman | primary | 3 | 100 | ×1.15 | +15% melee damage, shoots into neighbouring rooms. | Silent. Lethal. Smells faintly of lavender, for some reason. |
| Hab Flamer | Special | primary | 1 | 55 | ×1.40 | +40% melee damage, shoots into neighbouring rooms. | Meant for burning out fungus. Works on everything. |
| Arc Caster | Special | primary | 2 | 75 | ×1.30 | +30% melee damage, stuns, shoots into neighbouring rooms. | Throws lightning between people. Everyone dances. |
| Cryo Projector | Special | primary | 2 | 70 | ×1.30 | +30% melee damage, shoots into neighbouring rooms. | Freezes boarders in their tracks. Literally, a bit. |
| Grav Thrower | Special | primary | 3 | 95 | ×1.35 | +35% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | A little Gravity Hammer that works at range. |
| Plasma Caster | Special | primary | 3 | 110 | ×1.70 | +70% melee damage, shoots into neighbouring rooms. | Glowing, hissing, lovely. Dangerous to everyone. |
| Spore Projector | Special | primary | 2 | 65 | ×1.20 | +20% melee damage, cuts bleed 2.5/s, shoots into neighbouring rooms. | Grown, not built. Do not ask by whom. |
| Commonwealth Sidearm | Pistol | secondary | 1 | 25 | ×1.25 | +25% melee damage, shoots into neighbouring rooms. | Standard issue. Reliable, unremarkable, always there. |
| Viper Revolver | Pistol | secondary | 1 | 30 | ×1.40 | +40% melee damage, shoots into neighbouring rooms. | Six shots. Each one a sentence. |
| Dart Pistol | Pistol | secondary | 1 | 28 | ×1.25 | +25% melee damage, stuns, shoots into neighbouring rooms. | Tranquilliser darts. Very relaxing for the target. |
| Hand Cannon | Pistol | secondary | 2 | 50 | ×1.55 | +55% melee damage, shoots into neighbouring rooms, knocks foes out of the room. | Heavier than it looks. Kicks like a Jabbit. |
| Auto Pistol | Pistol | secondary | 2 | 45 | ×1.30 | +30% melee damage, shoots into neighbouring rooms. | A pistol that wishes it were an SMG. |
| Flare Pistol | Pistol | secondary | 2 | 35 | ×1.25 | +25% melee damage, shoots into neighbouring rooms. | For signalling. And for starting fires on purpose. |
| Ionic Repeater | Pistol | secondary | 3 | 70 | ×1.45 | +45% melee damage, stuns, shoots into neighbouring rooms. | A Thrumm design. Hums a little hymn when it fires. |
| Gilded Duelist | Pistol | secondary | 3 | 80 | ×1.50 | +50% melee damage, shoots into neighbouring rooms. | A pyrate captain's pride. Polished between shots. |
| Tube Launcher | Launcher | secondary | 2 | 60 | ×1.00 | +0% melee damage, shoots into neighbouring rooms. | One rocket, one room, one very surprised boarding party. |
| Grenade Launcher | Launcher | secondary | 2 | 65 | ×1.00 | +0% melee damage, shoots into neighbouring rooms. | Lobs grenades round corners. Mostly round corners. |
| Swarm Launcher | Launcher | secondary | 3 | 95 | ×1.00 | +0% melee damage, shoots into neighbouring rooms. | A volley of micro-missiles that chase heat. Including yours. Careful. |
| Foam Launcher | Launcher | secondary | 1 | 40 | ×1.00 | +0% melee damage, stuns, shoots into neighbouring rooms. | Sticky foam that sets in seconds. Non-lethal. Mostly. |
| Combat Knife | Melee | secondary | 1 | 15 | ×1.40 | +40% melee damage, cuts bleed 1.5/s. | Quick and quiet. |
| Boarding Hatchet | Melee | secondary | 1 | 22 | ×1.55 | +55% melee damage. | For doors, cables and anyone in the way. |
| Shock Baton | Melee | secondary | 1 | 20 | ×1.20 | +20% melee damage, stuns. | Security's favourite argument. |
| Pyrate Cutlass | Melee | secondary | 2 | 40 | ×1.60 | +60% melee damage, cuts bleed 2/s. | Swashbuckling, as advertised. |
| Glass Shard Blade | Melee | secondary | 3 | 70 | ×1.80 | +80% melee damage, cuts bleed 3/s. | Sharpened by the Glassborn. Hums when it's hungry. |
| Pebble Maul | Melee | secondary | 2 | 45 | ×1.70 | +70% melee damage, knocks foes out of the room. | A Pebblekin heirloom: a rock on a stick, but a very good rock. |
| Jabbit Claw Gloves | Melee | secondary | 2 | 50 | ×1.50 | +50% melee damage, cuts bleed 2.5/s. | For people who miss having claws. |
| Ceremonial Sabre | Melee | secondary | 3 | 75 | ×1.75 | +75% melee damage. | Commonwealth officers carry them to parades. You carry one to boarding actions. |

### Health and healing

- **The medbay** heals crew standing in it; more power heals faster. Hurt crew walk there on their own when it is safe. It heals up to their *current* maximum health.

- **Maximum health** comes from their race, plus their level (+1 a level), prestige (+5 each), the Juggernaut ability (+30), a Hearty meal while it lasts and being well fed (+10% on Relaxed), and minus any hunger penalty.

- **Healing in a fight**: the Field Medic perk and Field Surgeon ability heal everyone in their room; the Stim Shot grenade heals the thrower 35; Second Wind gives 40 back once a fight; Last Stand stops a killing blow once.

- **Between fights**: a clone bay (if you have one) heals 20 every jump; stores sell full medical care (Supplies); events that rest or treat the crew heal them and also fill them up.

- **Health rewards and hunger**: because hunger takes maximum health away and the medbay cannot feed anyone, food and the healing events are what get a worn-out crew back to full.

### Food and hunger

Crew eat between jumps, by themselves, hungriest first. Fullness runs from 0 to 100. Every jump costs 4; fighting hand to hand costs about 3.6 a minute; each repair costs 1.5; each kill 2. Anyone under 62 eats at the next jump.

There are three settings (**Settings → Gameplay → Crew hunger**). **Relaxed** is the default: you can ignore food entirely and only lose out if the crew go properly hungry, while a well-fed crew gets a real bonus. **Hardcore** is full survival: every bit of hunger costs maximum health. **Off**: nobody eats.

**Relaxed**

| Fullness | State | Effect |
| --- | --- | --- |
| 85+ | Well fed | 10% more maximum health, and 5% more damage and repair speed. |
| 60–84 | Fed | no effect. |
| 35–59 | Peckish | no effect yet. They'll eat at the next jump if there's food. |
| 15–34 | Hungry | maximum health 10% lower until they eat. |
| 0–14 | Starving | maximum health 20% lower until they eat. |

**Hardcore**

| Fullness | State | Effect |
| --- | --- | --- |
| 85+ | Well fed | 5% more damage and repair speed. |
| 60–84 | Fed | no effect. |
| 35–59 | Peckish | maximum health 10% lower until they eat. |
| 15–34 | Hungry | maximum health 25% lower until they eat. |
| 0–14 | Starving | maximum health 40% lower and 10% slower until they eat. |

**What they eat**, in this order: meals from the ship's Food store (top bar; each fills 35), then the cheapest food in the hold. Goods that Haven's Rest still needs are only eaten by the starving; cooked meals are kept for feasts unless someone is starving (then they fill 70).

| Food in the hold | Fills |
| --- | --- |
| Mandate rations | 40 |
| Star potato | 25 |
| Ion berries | 15 |
| Void pepper | 10 |
| Moon melon | 45 |
| Space fish | 30 |
| Deep eel | 50 |
| Starfruit | 40 |
| Frostfire root | 30 |
| Solar grapes | 20 |
| Any cooked meal (only when starving) | 70 |

**Getting food**: every run starts with about four meals per crew member; stores sell **Food ×5** under Supplies; half of all beaten ships leave 1–3 meals; events give food or heal-and-feed the crew. Tap **Feed** on the crew screen to feed someone straight away.

**Appetite** depends on race (see Races below): 1 is normal, more means they get hungry faster, 0 means they never eat. The tutorial never uses hunger.

### Skills

Crew improve at what they do. Each skill has two steps, skilled and expert.

| Skill | Practised by | Skilled at | Expert at | Untrained / skilled / expert |
| --- | --- | --- | --- | --- |
| Piloting | flying (manning the helm in fights) | 60 | 150 | +5% evasion at the helm / +7% evasion / +10% evasion |
| Engines | manning engines in fights | 60 | 150 | +5% evasion in Engines / +7% evasion / +10% evasion |
| Shields | manning shields as they recharge | 20 | 50 | Shields recharge 10% faster / 20% faster / 30% faster |
| Weapons | manning weapons as they fire | 25 | 60 | Weapons charge 10% faster / 15% faster / 20% faster |
| Repair | fixing systems, patching breaches | 15 | 40 | Normal repair speed / Repairs 10% faster / Repairs 20% faster |
| Combat | kills in hand-to-hand fights | 6 | 15 | Normal melee damage / 10% more melee damage / 20% more melee damage |

### Races

| Race | Health | Repair | Combat | Speed | Appetite | Traits |
| --- | --- | --- | --- | --- | --- | --- |
| Human | 100 | +0% | +0% | +0% | ×1 | Perfectly average. Learns skills a bit faster. Proud of it. |
| Pebblekin | 150 | -50% | +0% | -50% | ×1.3 | Huge health and fireproof. Slow on their feet and slower with a wrench. |
| Tinkari | 100 | +100% | -50% | +0% | ×1 | Wish-granting mechanics. Repair twice as fast, fight like a wet towel. |
| Thrumm | 70 | +0% | +0% | +0% | ×0.5 | Add 1 free power to the system they stand in. Explode when they die. |
| Mullock | 100 | +0% | +0% | +0% | ×1 | Telepathic: always see enemy crew. Immune to mind control. Smug. |
| Jabbit | 100 | -50% | +50% | +25% | ×1.2 | Born brawlers. Fast and deadly in a fight, hopeless with tools. |
| Squawkling | 90 | +50% | +0% | +20% | ×1 | Repeats every order. Repairs fairly fast. |
| Prismari | 80 | +0% | -20% | +0% | ×0.5 | Crystal people. Immune to mind control, brittle in a fight. |
| Hivelings | 60 | -20% | +0% | +50% | ×0.8 | Small, quick, learn fast. Fall over easily. |
| Ember Kin | 110 | -40% | +30% | +0% | ×1 | Walk through fire. Hate vacuum. |
| Menders | 90 | +20% | -50% | +0% | ×1 | Gentle healers who patch nearby crew. |
| Vesperi | 75 | +0% | -10% | +35% | ×1 | Small, quick winged folk who pick up any skill twice as fast as they put it down. |
| Ironclad | 120 | +10% | +10% | -25% | ×0.6 | Walking foundries. Shrug off 30% of weapon damage, move like it too. |
| Lumen | 85 | -10% | -40% | +0% | never eats | Beings of soft light who slowly heal everyone in the room with them. |
| Gloomkin | 95 | +0% | +20% | +10% | ×0.7 | Shadow-dwellers who need no air and no one inside their heads. |
| Archon | 140 | +40% | -50% | -35% | never eats | Builder-constructs left behind by the Precursors. Slow and gentle, but tough, fireproof, need no air and fix anything. |
| Wisp | 70 | +10% | -30% | +40% | never eats | Drifting will-o'-the-wisps. Fragile, quick, need no air and cannot burn. |
| Burrowkin | 110 | +30% | -10% | -10% | ×1 | Stocky diggers who fix things by instinct and learn quickly. |
| Flitter | 60 | -20% | -20% | +60% | ×0.8 | Tiny, fast and very nervous. Great for running errands across the ship. |

### Captain level, rank and renown

**Captain level** rises every run, win or lose, up to 55. Then you can prestige (Career screen) to start again at level 1 with a ★; up to 10 times. Levels clear new ships for the hangar, and prestiges count towards those, so nothing locks again. The title screen shows your level, the bar to the next one and what you earned last run.

| You get xp for | Xp |
| --- | --- |
| Each jump | 10 |
| Each event choice | 12 |
| Each ship beaten (escaped: 10) | 40 + 10 × sector |
| Each new sector | 100 |
| Each Dreadnought phase beaten | 250 |
| Winning the run | 1000 |
| Losing a run | 50 + 25 per sector crossed |
| Each boarder killed | 5 |
| Each repair | 2 |
| A crew member levelling up | 20 |
| Each new medal | 50 |
| Difficulty | Easy ×0.8, Hard ×1.25 |

| Captain level | Total xp |
| --- | --- |
| 2 | 125 |
| 3 | 300 |
| 5 | 800 |
| 10 | 2,925 |
| 15 | 6,300 |
| 20 | 10,925 |
| 25 | 16,800 |
| 30 | 23,925 |
| 40 | 41,925 |
| 50 | 64,925 |
| 55 | 78,300 |

**Rank** (Cadet to Admiral) comes from **renown**, earned at the end of each run (sectors crossed, ships beaten, the Dreadnought, a win, crew brought home, story scenes and new endings, more on harder difficulty and alert levels). Ranks bring better send-off gifts and requisition tokens. Renown can also be spent rebuilding Haven's Rest wings without lowering your rank.

| Rank | Renown | Reward |
| --- | --- | --- |
| Cadet | 0 | — |
| Ensign | 60 | Admiral Hale offers three send-off gifts, not two |
| Lieutenant | 160 | A requisition token: unlock any ship you choose |
| Lieutenant Commander | 320 | Better send-off gifts: weapons, crew, refits |
| Commander | 540 | A requisition token: unlock any ship you choose |
| Captain | 820 | Ask Hale for different gifts, once a run |
| Commodore | 1,160 | A requisition token: unlock any ship you choose |
| Rear Admiral | 1,560 | The best send-off gifts: augments, drones, reactor tuning |
| Vice Admiral | 2,040 | A requisition token: unlock any ship you choose |
| Admiral | 2,600 | Four send-off gifts to choose from, and Hale salutes you first |

### Ships

41 ships, grouped into classes (layouts A, B and C of each design). The hangar shows what each one needs: a captain level, sometimes a challenge, or a requisition token from a rank.

| Ship | Class | Hull | Reactor | Crew | Captain level | Also needs |
| --- | --- | --- | --- | --- | --- | --- |
| The Plucky | Commonwealth Cruiser | 30 | 8 | 3 | 1 | — |
| The Red Herring | Commonwealth Cruiser | 30 | 8 | 4 | 7 | Reach sector 6 flying The Plucky |
| The Spanner in the Works | Tinkari Cruiser | 30 | 8 | 3 | 4 | Defeat 15 ships in total |
| The Remote Control | Tinkari Cruiser | 30 | 9 | 3 | 10 | Destroy 25 ships flying The Spanner in the Works |
| The Rolling Stone | Pebblekin Cruiser | 30 | 8 | 3 | 5 | Reach sector 4 in any run |
| The Rock Bottom | Pebblekin Cruiser | 35 | 8 | 3 | 11 | Earn the medal "Fire Starter" |
| The Zapjudicator | Thrumm Cruiser | 28 | 8 | 3 | 8 | Reach sector 5 in any run |
| The Volt Face | Thrumm Cruiser | 26 | 7 | 3 | 13 | Earn the medal "Augmented Reality" |
| The Slime of War | Mullock Cruiser | 30 | 9 | 3 | 11 | Earn the medal "Hostile Takeover" |
| The Gastropod | Mullock Cruiser | 30 | 9 | 3 | 16 | Win a run flying The Slime of War |
| The Preying Jabbit | Jabbit Cruiser | 30 | 9 | 4 | 14 | Earn the medal "Mind Over Matter" |
| The Elbow Room | Jabbit Cruiser | 30 | 10 | 4 | 20 | Win a run flying The Preying Jabbit |
| The Peekaboo | Stealth Cruiser | 30 | 8 | 3 | 15 | Reach sector 7 in any run |
| The Now-You-Don't | Stealth Cruiser | 30 | 9 | 3 | 21 | Win a run flying The Peekaboo |
| The Glass Cannon | Glassborn Cruiser | 24 | 9 | 3 | 19 | Earn the medal "Through the Looking Glass" |
| The Pane in the Neck | Glassborn Cruiser | 30 | 8 | 3 | 23 | Win a run flying The Glass Cannon |
| The Jolly Rover | Pirate Galleon | 28 | 9 | 3 | 17 | Reach sector 5 flying The Black Gull |
| The Lantern | Scout Skiff | 24 | 7 | 2 | 3 | Reach sector 3 in any run |
| The Dimmer | Scout Skiff | 26 | 7 | 2 | 9 | Reach sector 5 flying The Lantern |
| The Anvil | Siege Hulk | 36 | 9 | 3 | 10 | Defeat 60 ships in total |
| The Hammer | Siege Hulk | 32 | 9 | 2 | 15 | Destroy 30 ships flying The Anvil |
| The Undertow | Ion Skirmisher | 28 | 8 | 2 | 9 | Destroy 15 ships flying The Spanner in the Works |
| The Riptide | Ion Skirmisher | 28 | 8 | 2 | 14 | Reach sector 6 flying The Undertow |
| The Beehive | Drone Carrier | 26 | 9 | 2 | 12 | Destroy 30 ships flying The Spanner in the Works |
| The Swarm Queen | Drone Carrier | 26 | 9 | 2 | 17 | Destroy 30 ships flying The Beehive |
| The Paper Kite | Frontier Courier | 22 | 7 | 2 | 2 | — |
| The Night Post | Frontier Courier | 24 | 7 | 2 | 8 | Reach sector 4 flying The Paper Kite |
| The Argument | Frontier Gunboat | 30 | 9 | 3 | 6 | Destroy 20 ships flying The Plucky |
| The Rebuttal | Frontier Gunboat | 30 | 9 | 3 | 12 | Destroy 30 ships flying The Argument |
| The Long Haul | Frontier Ark | 34 | 8 | 5 | 13 | Reach sector 6 in any run |
| The Second Chance | Frontier Ark | 32 | 8 | 4 | 18 | Reach sector 6 flying The Long Haul |
| The Long Lance | Beam Frigate | 26 | 9 | 3 | 7 | Defeat 40 ships in total |
| The Phantom | Infiltrator | 24 | 8 | 3 | 18 | Reach sector 6 flying The Peekaboo |
| The Juggernaut | Pebblekin Battleship | 40 | 8 | 3 | 26 | Defeat 250 ships in total |
| The Puppeteer's Glove | Mind Cutter | 26 | 9 | 3 | 22 | Destroy 30 ships flying The Preying Jabbit |
| The Black Gull | Pyrate Corsair | 28 | 8 | 3 | 16 | Defeat 120 ships in total |
| The Gilded Debt | Pyrate Corsair | 30 | 8 | 3 | 19 | Destroy 30 ships flying The Black Gull |
| The Crowbar | Boarding Cutter | 26 | 8 | 4 | 20 | Defeat 150 ships in total, Earn the medal "Hostile Takeover" |
| The Can Opener | Boarding Cutter | 26 | 8 | 3 | 21 | Destroy 25 ships flying The Crowbar |
| The Turncoat | Mandate Defector | 32 | 8 | 3 | 24 | Win 3 runs in any ships |
| The Whistleblower | Mandate Defector | 26 | 9 | 2 | 25 | Reach sector 7 flying The Turncoat |

### Haven's Rest

Your great-uncle's old station, restored across runs. Collect each wing's goods in any run and send them home from any store (**Trade → Send home**: pick how many with − and +, then Send) or from the station itself. What you send is kept for good. Or rebuild a wing outright with renown.

| Wing | Needs | Or renown | Gives |
| --- | --- | --- | --- |
| The Biodome | 5 Star potato, 5 Ion berries, 2 Moon melon | 900 | Grand Greenhouse: every run starts with a third planter and three seed packets, and crops grow faster. |
| Aquaculture Bay | 6 Space fish, 1 Deep eel | 700 | Every run starts with a fishing rod and two space fish. |
| The Promenade | 2 Space wine, 3 Mullock silk, 3 Star preserves, 1 Nebula crystal | 1200 | The Intergalactic Market: every store stocks one extra augment. |
| The Engineering Deck | 400 Scrap, 12 Drone parts | 1200 | The Automated Shipyard: room swaps cost half, and every run starts with +3 max hull. |
| The Communications Relay | 20 Fuel, 3 Thrumm cells, 2 Old books | 1000 | The Gate Network: every run starts with +4 fuel and the first sector's map revealed, and the relay can call you home from any beacon once a sector. |
| The Smuggler's Fence | 2 Contraband, 3 Pyrate rum, 6 Mandate rations | 1000 | The Black Market Fence: goods you sell fetch 10% more. |
| The Cellar | 2 Fruit wine, 1 Void vintage, 1 An epic poem | 1100 | The cellar sells well: every run starts with 60 extra scrap. |
| The Cantina | 2 Star stew, 2 Space wine, 2 Pyrate rum | 1000 | The Cantina reopens: hire visiting specialists when you call home, and every run starts with one extra trained crew member. |

### Difficulty

| Setting | Scrap | Start scrap | Enemy hull | Your evasion | Fleet | Other |
| --- | --- | --- | --- | --- | --- | --- |
| Easy | ×1.4 | +20 | -2 | +10% | ×0.85 | patch 3 hull after fights, boarders ×0.7, Dreadnought shields -2 |
| Normal | ×1.05 | +5 | -1 | 0% | normal | patch 1 hull after fights |
| Hard | ×0.8 | -10 | +2 | -5% | normal | — |

Mandate alert levels (opened by winning at your highest level on Normal or Hard) make runs harder again for more renown.

### Gentler rules

- **Grief**: when someone dies, their best friend, sibling or sweetheart is furious rather than broken: 25% more hand-to-hand damage and 8% slower repairs for three jumps, or until you win a fight.

- **Cabin fever**: after 11 jumps without a store or home, the crew slowly lose hearts. Nothing else: no damage, no slower work.

- **Fishing**: the worst a cast can do is lose the fish, tangle the line (no more fishing at that beacon) or snap the rod.

- **Pet diets**: when your pet gets hungry you can say Not yet; it asks again a couple of jumps later, until you have what you want to feed it.

- **The void fungus** no longer swallows the oxygen system: it keeps the air sweet itself, and letting it into the reactor costs two bars, not three.

### Longer voyages, the Memorial Wall, logs and the Graveyard

- **Voyage options** (hangar → Mode, below the four modes): Length Short/Standard/Long (3 fewer or 3 more sectors), Map Compact/Sprawling (3 more columns of beacons per sector), Fleet Relentless/Standard/Patient (25% faster or 30% slower). A sprawling map slows the Fleet to match. Dailies, the Cup, challenges, campaigns and multiplayer use the standard voyage. Record shows your average run time, jumps and sector over the last ten runs.

- **Last words**: 89 general lines plus sets for each way of dying (fire, air, boarders, enemy, aboard, mind, away), each race, each personality, rookies and veterans.

- **Funerals**: after a fight, choose full honours (+30 hearts each), a roast (+20, more for daredevils, pyrates and gamblers), a quick word, or the reclaimer (+2 drone parts, -60 hearts).

- **The Memorial Wall** (Record → Memorial): a plaque for everyone who died, with last words, cause, kills, level, ship, funeral and an epitaph. Sort by newest, kills, time served or level.

- **Captain's logs** (Record → Captain's logs, or Ship → Log in a run): every jump, choice, fight, death, recruit and level-up, for the last 15 voyages.

- **The Graveyard**: a 1.2% chance on each event beacon from sector 2, once a run, if you have dead from earlier runs. Dig up one of the best three: 70% they come back as they were (about 60% of their old level, a skill or two), 30% they come back wrong (new personality, 80% health, lower level). Or leave flowers, or rob the graves.

- **Pixel Studio** (title screen, hangar, Record, or 🎨 by any crew member): draw pixel-art crew on canvases from 16×24 up to 128×128 (32×48, 48×64, 64×96, 96×128, 128×128, 64×64, 32×32, 24×32, 16×24). Tools: pen, rubber, fill, pick, line, box, oval, dither, shade, brush sizes 1–8, mirror, outline, flip, undo; zoom and pan with a corner map; a colour mixer, shading ramps and up to 62 colours; scale up ×2 to add detail. Import a picture (colours, dithering, outline, background removal), trace over a picture, or copy an AI prompt and paste its reply back. Share codes let friends swap characters. Any crew member can wear a drawing; the hangar remembers who wore what.

- **Admiral's orders**: three goals per run (one fighting, one voyage, one life aboard), from a pool of 19. 25 scrap and 20 captain xp each, plus 40 scrap for all three. Not in dailies, the Cup, challenges or multiplayer.

- **The regulars**: Pip Tanner, Captain Reg Bilge and Mrs Pembury turn up across your voyages (five meetings each, at most one each per run) and remember how you treated them.

- **The radio** (Settings → Audio, or 📻 in the pause menu): the adaptive soundtrack, or Radio Commonwealth, Pyrate FM and Mandate Broadcasting, with presenters between tunes (captions, plus an optional British voice).

- **Report a problem** (Settings, top right) copies everything needed to fix a bug, or opens a GitHub issue. **Download all data** (Settings → Profile) backs up your progress.

- **The Archive** (Record → Codex → Archive): 56 lore entries (histories, memos, adverts, legends, letters), opened by playing or found in wrecks and on old relays, plus 30 snippets of radio chatter overheard between jumps.

- **The Codex** (Record → Codex): fills in as you meet ships (69), carry weapons (81), drones (31) and augments (67), crew with peoples and cross sectors. 40 captain xp at 25, 50 and 75% of a section, 120 at 100%.

- **The Commonwealth Gazette**: a newspaper front page for every finished voyage, written from its log. End screen → Read the paper, or Record → Captain's logs → Front page.

- **Grown-up humour** (Settings → Gameplay, on by default): adult stories, last words, funerals and captain's remarks. Off keeps everything family-friendly.

### Saves and your data

- **Save slots**: Settings → Profile, or the save button next to Career on the title screen. Up to 5 separate careers on one device, each with its own record, medals, unlocks, captain level, roster, classes and run in progress. Settings are shared.

- **Play this save** switches careers (the game reloads). **Rename** names a save. **Delete** removes another save; on the save you are playing it says **Clear this save** and starts it fresh. Both ask twice.

- **Download all data** saves every save, your settings and your mods to one file. **Load data file** brings it back, on this device or another: the easy way to move from a phone to a Quest. Older single-career backup files (Record screen) still load into the save you are playing.

- **Clear all data** deletes every save, setting and mod on this device (it asks twice).

- The run saves itself between fights. Browsers can clear site data, so download your data now and then.

### Red Dwarf campaign

Red Dwarf: Three Million Years Late is a campaign mod in the library (unofficial fan campaign; all text original). Turn it on in **Mods**, then pick it with the Campaign arrows at the top of the hangar. Start in Starbug 1 or Blue Midget with Lister, Rimmer, Cat, Kryten, after the Simulants who towed Red Dwarf away. Hunger applies to the crew who eat (holograms and mechanoids don't).

| Sector | What it is like |
| --- | --- |
| Deep Space | Three million years from Earth and nothing for light years in every direction. Except trouble. |
| GELF Territory | Genetically engineered lifeforms, all of them armed and most of them cross. |
| Psi-Moon Belt | Moons that read your mind and reshape themselves to match it. Bring a calm mind. Or any mind. |
| Simulant Hunting Grounds | The battle group's own backyard. Heavy patrols, heavy guns, and no sense of humour. |
| The Waxworks Drift | Abandoned theme-park planets, their wax droids still fighting a war nobody remembers starting. |
| The Backwards Reach | A region where time flows the wrong way. It ends well. Or begins well. Hard to say. |
| The Time Drift | Stasis leaks, white holes and echoes of things that haven't happened yet. Bring a watch. Bring two. |
| The Garbage Trail | Three million years of Red Dwarf's rubbish, still drifting in a line across space. Some of it is valuable. Some of it is alive. |
| The Mirror Sea | A stretch of space so still and polished that every ship sees itself coming. Some of the reflections fly better than you do. |

Ships to unlock (pilot level plus a challenge, or a requisition token, or renown):

| Ship | Kind | Hull | Crew | To unlock | What it is like |
| --- | --- | --- | --- | --- | --- |
| Starbug Mk III | Rebuilt shuttle | 34 | Lister, Rimmer, Cat, Kryten | pilot level 4, reach sector 5 in Starbug 1 | Three crashed Starbugs welded into one by a skutter with ambition. More hull, more guns, and the toilet is on the outside. |
| Holoship Smug Glow | Hard-light holoship | 22 | Rimmer, Cmdr Glossop, Nurse Lumen | pilot level 6, reach sector 6 in Blue Midget | Made of light and arrogance. Fast, well shielded, and its holograms can't burn or choke. The hull is mostly opinion. |
| Captured GELF Canoe | GELF war canoe | 32 | Lister, Grunk, Mrs Grunk, Cat | pilot level 5, destroy 12 ships in Blue Midget | Won in a wrestling match, a wedding and a misunderstanding. Bone, hide, a harpoon and boarders who love a scrap. |
| Stolen Simulant Barge | Simulant salvage barge | 36 | Lister, Rimmer, Cat, Kryten | pilot level 8, reach sector 8, 80 ships destroyed in total | Nicked while its Simulants were at a team-building day. Plasma lance, hacking, and a computer that asks politely to kill you. |
| The Skutter Pram | Skutter-built runabout | 24 | Kryten, Spanners | pilot level 3, destroy 10 ships in Starbug 1 | Built by skutters from a laundry trolley and a fridge. Tiny, nippy, full of drones, and very sorry about all this. |

Music: the theme plus five tunes written for the campaign (hangar, start, explore, strange, combat each have their own; exploring and fights take turns sector by sector).

It has 123 scenes (a story scene in every sector, picked from several each run, plus encounters), 19 enemy ships, 15 trick weapons, 3 drones, 11 augments and 6 personal weapons. Along the way you may meet people who will join you: a hologram navigator and a Simulant who has changed sides.

### Troubleshooting

- **Buttons need two presses in VR**: update to the latest version (tips no longer float in front of the screen and event text appears at once). If it still happens, tell us which screen.

- **Quest flat browser feels hit and miss**: the latest version reads a press the moment the trigger goes down and snaps to the nearest button. Make sure the page has reloaded after an update.

- **Text is too small**: Settings → Accessibility (text size), or Settings → VR console (text size and the magnifier) in VR.

- **My progress is gone**: check the save button on the title screen (you may be on another save). If the browser cleared its data, load your last **Download all data** file.

- **Not enough storage to switch saves**: download your data, then delete a save you no longer need.

- **Crew keep losing health between fights**: they are probably hungry (dot on their chip); buy Food at a store, or set Crew hunger to Relaxed or Off.

- **A weapon says (worn)**: it still works, just weaker. Keep three or more drone parts and the crew mend it between jumps, or repair it in the Armoury.

- **A mod broke something**: turn it off in Mods; Settings → Gameplay → Allow mod scripts stays off unless you trust a mod.

<!-- guide:end -->

## What's in the game

**Tutorial**
- **Flight school**, on the title screen. **Guided practice** is a real fight against a training target, one step at a time, with each control lit up as you need it: power, aiming, pausing, a fire, a hull breach, a boarder, the medbay, doors, crew autopilot, volleys, salvage, the map, a jump, a store and an upgrade. Your ship can't be lost, and it never touches your saved run.
- **Lessons**: 12 illustrated chapters, 58 short pages, covering everything: the mission and the map, your ship and power, weapons, staying alive, crew, damage control, drones and gadgets, events and stores, life aboard (garden, hearts, birthdays, pets, fishing), stories and career, other ways to play, and controls.

**Hand-to-hand combat**
- **Personal weapons and armour.** Every crew member has a weapon slot and an armour slot (Ship → **Armoury**). 22 kinds of kit: blunt (wrench, stun baton, gravity hammer that throws foes out of the room), blades (knife, cutlass, fire axe, plasma torch, monofilament sword: cuts bleed), guns (laser pistol, boarding shotgun, pulse rifle: they also shoot into neighbouring rooms) and weird ones (freeze ray, spore pistol, tentacle whip, life-leech glove, mender's staff, a rubber chicken that makes the whole room stop to laugh). Armour: flak vest, boarding plate, void suit (breathe without air), personal shield, auto-medpack.
- Kit **wears out** with use. Worn kit keeps working at half its bonus and without its tricks (stuns, bleeding, fire, crits, attachments) until it is mended: the crew do it between jumps with a spare drone part, or repair it in the Armoury, at any store's repair shop, or strip it for parts. Tools double up: the fire axe fights fires faster, the torch and wrench repair faster.
- **The crew screen.** Tap Crew in the top bar, or tap someone in the crew row twice: level and xp, health, food, damage, repair and speed, class, every weapon, attachment, grenade, perk and ability, each a card you tap to choose from. Six ready-made classes (Assault, Medic, Engineer, Breacher, Marksman, Tank) and up to eight of your own, applied to anyone in one tap. Every crew level adds health, damage and repair speed.
- **Hunger.** Crew eat between jumps; fighting and repairs make them hungrier, and hungry crew lose maximum health until they eat. Food is bought at stores, salvaged after fights and found in events. Can be turned off in Settings.
- **Captain level and save slots.** A captain level (to 55, then prestige) that rises every run, win or lose. Up to five separate saves per device, with download, load and clear for all data (Settings → Profile).
- **Loadouts (a Call of Duty-style class system).** On the crew screen. Each crew member has a primary (assault rifle, SMG, LMG, shotgun, marksman or special) and a secondary (pistol, launcher or melee) that takes over when the primary is worn out, each with two attachments; armour; a lethal grenade (frag, sticky, incendiary, plasma, cluster) and a tactical one (flashbang, stim, smoke, concussion, EMP), thrown once a fight; and three perk slots of four perks each, with Pro versions unlocked by using them. 57 new crew weapons. Weapons level up across runs (to 10), unlocking 16 attachments.
- **Crew levels and prestige.** Crew earn XP for everything they do and level up to 30, unlocking the secondary, grenades, perk slots and four abilities (Second Wind, Last Stand, War Cry, Field Surgeon, Breacher, Quartermaster, Juggernaut, Sprinter). At 30 they can prestige, up to 10 stars, each a little tougher and stronger for good. Enemy crews throw grenades from sector 4.
- **The crew roster.** Save crew to the roster and they come back in later runs (Hangar → Crew roster), updated after every run they survive. Export one or all as a file or a paste-able code and import them on another device.
- **Enemy crews carry kit too**, more and better as you go deeper, and beaten boarders often drop it. You can see who is armed: weapons show in their hands, armour as a ring.
- **Tonics and treats** (inspired by sim-management games where you raise a favourite hero): give one crew member a Muscle Tonic, Iron Biscuit, Nimble Gum or Tinker's Tea for a permanent boost (capped per person), a skill chip to train them fast, a Battle Stim or Berserker Brew for the next fights, a medkit mid-battle, or cookies for hearts. Crops and fish can be eaten raw for small permanent gains, so you can build a champion. Stores have Armoury and Tonics tabs, and events can give both.

**Twenty-four stories**
- Every run follows one story, a scene per sector, with its own help (or harm) at the Dreadnought and its own endings. Most stories roll a **hidden twist** at the start of the run, so the same story can go a different way next time (who the stowaway really is, who the saboteur is, what the ghost is, whether the prophecy is true...):
  - **The Data Core**: Pip, the frightened data core in your hold, and Director Kross who wants it back (four endings).
  - **The Defector**: Commander Ilsa Vance, a Mandate officer who wants to change sides, a tracker in her uniform, a brother on a Mandate colony, and a plan to lock the Dreadnought's gunners out of their own guns (four endings).
  - **The Lost Flotilla**: forty shuttles fleeing the Mandate, scattered along your route. Save them from pyrates, comets and fever, and Old Marrow, a retired mining tug, comes to the Dreadnought with you (three endings).
  - **The Rival**: Captain Juno Harte, flying the decoy run on your route. Races, a missile cache, an ambush, cards or a rescue, and someone to draw the Dreadnought's fire (three endings).
  - **The Stowaway**: a twelve-year-old in your cargo, who may be a runaway heir, a Mandate cadet or just a dockyard kid.
  - **The Cure**: collect samples so a doctor can cure the Mullock blight. Unless it's a bioweapon.
  - **The Heist**: help a pyrate rob the Mandate payroll barge. Someone double-crosses someone.
  - **The Haunting**: cold spots and coffee nobody made. A dead captain, a stowaway in the vents, or a Mandate worm.
  - **The Old Debt**: pay off your loan shark one sector at a time, or find out who she's really working for.
  - **The Prophecy**: an oracle says you are the Starbreaker. She might be right. She might be running a con.
  - **Wanted**: framed for murder, hunted by the Widow Sable, with three possible culprits.
  - **The Lost Expedition**: follow a fifty-year-old trail to the Cradle: a weapon, a garden, or the explorer herself.
  - **Mutiny**: a charismatic bosun, a grumbling crew and a secret in the cargo.
  - **The Wedding**: one of your own crew is getting married, rings, cake, in-laws and all (sometimes the in-laws are pyrates).
  - **The Star-Wyrm**: a baby dragon hatches in your hold and grows every sector.
  - **The Gunnery Cup**: a shooting tournament along your route, with a rival who may be cheating.
  - **Messages from Tomorrow**: warnings in your own voice from nine days ahead. Or a Mandate trick.
  - **The Saboteur**: three passengers, one saboteur, clues every sector, and a different culprit every time.
  - **The Long Lights**: relight a dying beacon network. Some lights were put out for a reason.
  - **The Duke of Dice**: cards with a gambler who owns four planets, for ever-higher stakes.
  - **The Lantern**: help a resistance cell inside Mandate space, and find their informant, if there is one.
  - **The Inheritance**: a great-uncle has left you a tiny, falling-apart space station.
  - **The Double**: someone with your face is one beacon ahead: a shape-shifter, a Mandate clone, or you from another universe.
  - **The Song in the Static**: one of your crew hears a song nobody else can. Where it leads changes every run.
- Pick one in the hangar, or leave it on **Surprise me** to get the one you've seen least. Endings (75 of them) are collected under Career, with a medal for each story's best ending and one for winning ten different stories.

**Built-in content packs**
- What used to be 32 optional content and ship mods is now part of the game: 41 ships, 76 weapons, dozens of drones and augments, 20 peoples, new enemies and sectors, and over 400 events. Rule sets, scripts, challenge packs and campaign mods stay optional in the Mods library. New hulls from the packs are unlocked by playing, like the rest.

**Your crew, remembered**
- The names and personalities you give your crew are remembered for the next run, and renaming someone mid-run updates them too. **Name your crew** is now a big button at the top of the hangar.

**Campaign mods**
- A mod can be a whole **campaign**: its own ships, named crew, opening briefing, sectors, enemies, a story scene for each sector, its own villain and a final ending. Turn one on in Mods, then pick it with the **Campaign** arrows in the hangar. It only loads while it's picked, so it never leaks into the normal game, dailies or challenges.
- **Example: Red Dwarf: Three Million Years Late** (unofficial fan campaign, in the mod library under Stories). Red Dwarf has been towed away by a Simulant battle group. Chase it in **Starbug 1** or **Blue Midget** with Lister, Rimmer (a hologram: fire and vacuum can't hurt him), the Cat (very fast, very vain) and Kryten (repairs anything, apologises for everything), with Holly on the backup line.
  - Its own gear, stocked in every store and in half of all loot: the Starbug Laser Cannon, Bazookoids, a JMC Mining Laser, a Simulant Plasma Lance, a GELF Harpoon, the Vindaloo Torpedo, the Toaster Ion Lobber, Rimmer's Scattergun; skutters (repair and armed) and a Light Bee interceptor; augments such as Holly (Backup), the Hard-Light Drive, Space Corps Directives, the Food Dispenser, Kryten's Spare Heads and a Hologrammatic Decoy.
  - Its own peoples: holograms, Felis sapiens, mechanoids and GELFs to recruit; Simulants, agonoids and waxdroids to fight.
  - Seven sectors (including the Time Drift), Simulant hunters and cruisers, GELF longboats, psirens, a Space Corps enforcement probe, the Inquisitor and the Death Ship at the end.
  - A story scene in every sector, and about 30 encounters: a total-immersion game, the Inquisitor, a heroic Rimmer from another dimension, a despair squid, a shape-shifting mechanoid, Legion, a holoship, Kochanski (who can join the crew), Bob the skutter, a white hole, a stasis leak, future echoes, an emohawk, a luck virus, a duelling dimension-hopper and more.
  - **Guns that play differently.** Every Red Dwarf weapon has its own trick: the Starbug Laser Cannon warms up and fires faster with every shot, Bazookoids home in and never miss, the JMC Mining Laser salvages scrap from every hit, the GELF Harpoon pins its target so it can't dodge, the Simulant Plasma Lance drains power, the Vindaloo Torpedo gasses the room, the Toaster Ion Lobber feeds your crew, Rimmer's Scattergun hits for anything from nothing to triple, the Light Bee Projector throws up a decoy shield, the Skutter Rivet Gun ricochets, the Polymorph Canister makes crew panic and flee, Ace's Wildfire Cannon crits, and the White Hole Lens pins time itself. Each card shows its trick at a glance, and the enemies use some of them too.
  - **Starbug has its own three-bulb layout**, and the story scene in each sector is picked from two, so runs differ. There's an eighth sector, the Garbage Trail (three million years of Red Dwarf's rubbish), a Simulant Dreadnought, and more encounters: a curry monster, the White Giant's wreck, a GELF market, red alert, a spare hologram, Lister's gig, the Tank, a feud between the toaster and the food dispenser, and others.
  - **Its theme music, arranged seven ways.** The campaign plays the Red Dwarf theme (a MIDI file) at different moments, each in its own arrangement: a slow lounge version in the hangar, a rock version as you set out, a music-box version on quiet beacons, an eerie, detuned version in the strange sectors (the psi-moon, the Time Drift, the backwards universe, Waxworld), a fast battle version in fights, a heavy one against bosses and a big victory version at the end.
  - **No more solved jokes.** The polymorph craves a different emotion each run (read what it has already eaten before you pick the bait: the famous answer is now a trap), the Inquisitor might be the real thing, a stricter judge, or a GELF con artist in a curtain, the white hole sometimes runs backwards, and the despair squid's ink sometimes makes everything seem to go brilliantly for three jumps. It wasn't real.
  - **Simulants fight back**: hard-light disruptors that scramble Rimmer, shock boarders, a Hard-Light Hunter and a Dreadnought that never retreats.
  - **Sitcom problems that stick**: side in the food war and the loser barricades the medbay until someone brings it a proper meal; break the skutters' strike and they glue a drone bay shut.
  - **New scenes**: Talkie Toaster wired into the reactor (faster guns, the odd vented room), Rimmer's ego, a reactor meltdown only someone who doesn't breathe can fix, and the Thermonuclear Vindaloo. Blue options now have risky ways through when the right character is dead.
  - Every Red Dwarf ship has its own look: Starbug and Blue Midget are three-bulbed mining shuttles, Simulant ships are hard-edged gunboats, GELF ships are insect-like, the psiren's is organic.
  - All the writing is original, and the characters use the game's ordinary sprites; Red Dwarf belongs to its creators.

**A galaxy that remembers**
- **Faction standing.** The Jabbit Hives, Mullock Consortium, Thrumm Temples, Pyrate Kings, Tinkari Collective and Pebblekin Quarries each keep score, and each values something different: the Jabbit respect kills and boarding victories, Thrumms want mercy, Mullocks love a customer (and a client in debt), Tinkari hate seeing machines scrapped. Standing runs from Despised to Revered: it changes their store prices (up to 40% more or 18% less), favoured factions' ships wave you through, despised ones come in hot, and in a revered faction's space their ships jump into your fights. A quarter of it carries into your next run. Ship → Factions shows where you stand; new scenes include a Thrumm temple, a Jabbit blood arena, a Mullock loan, a broken Tinkari drone, a Mandate payroll barge and a Pebblekin rockslide.
- **Room combos.** Ship → Layout draws your ship with glowing links between combo rooms; tap two rooms at a store or at home to swap them. Systems in rooms joined by a door work together: Iron Artery (engines + weapons: guns charge faster), War Room (helm + sensors), Clean-Air Ward (medbay + oxygen), Fortress (shields + doors), Hive Mind (drones + teleporter), Ghost Wing (cloak + helm), Gun Deck (weapons + shields) and Engine Bay (engines + oxygen). At any store the shipyard swaps two rooms' systems, so you can build combos. Ship → Layout.
- **The workshop.** Buy machines at stores and they work while you jump: a preserves jar, a fermentation keg, a zero-G cask that ages wine into a fortune (only on deep-space jumps), a seed maker, a recycler (junk and fish into drone parts) and a loom (ballistic cloth that mends all your crew's kit). Ship → Workshop.
- **Crossbreeding.** Harvest a crop next to a different one and you may get a hybrid seed: Frostfire root or Solar vine.
- **Crew off duty.** Between jumps the daredevil spars, the poet writes epic poems worth selling, the tinkerer scrounges scrap (and sometimes sets fire to things), the cook turns crops into stew, the collector finds junk and the bookworm reads the crew manuals. Rivals at the same station in a fight may come to blows; sweethearts together on the shields charge them faster; veterans slowly teach rookies who share their room. At 6 hearts a crew member asks a personal favour; at 10 they make the ship a keepsake.
- **Going home.** A run is no longer just A to B: every sector but the last has a **Haven's Rest relay** on its map (HOME) that jumps you to the station and back. At home:
  - **Bunks**: rest a night. Everyone healed, cabin fever cured, hearts up; the Fleet gains a little while you sleep.
  - **Drydock**: hull repairs at half store prices (free once restored), scars patched at half price, room swaps at half price, and a **weapon locker** that keeps guns between runs.
  - **Greenhouse**: beds that keep growing on every jump of every run, with half as much again at harvest, and starfruit, which only grows here.
  - **Cantina** (once restored): hire visiting specialists, already experts at something.
  - **Market** (once the Promenade is restored): rare augments, starfruit seeds, and 20% over the going rate for your goods.
  - **Freight**: send goods to finish the wings' bundles.
- **Heat.** The Mandate notice how loud you are. Destroying Mandate ships, beating fleet ships and boarding raise your heat; quiet beacons, nebulas, stores and going home cool it, and every new sector cools it a little. At 40 the Fleet moves faster, at 70 hunter-killers drop in on you, and at 90 the exit beacon is blockaded by a cruiser you have to fight through. Bribes, a code forger and a decoy freighter bring it down. A chip under your ship shows it.
- **Contracts.** Every store has a noticeboard (Trade → Contracts), and so does Haven's Rest: deliver cargo to a later sector, beat two ships of a faction, or survey quiet beacons. Up to three at a time, paid in scrap and faction standing; Ship → Log → Contracts tracks them.
- **Home between sectors.** At an exit beacon you can drop in at Haven's Rest before choosing where to go next.
- **Faction ships.** Become Revered by a faction and it gives you one of its ship designs for good.
- **Cabin fever.** Eleven jumps without a port and the crew slowly lose hearts. That's all: no damage and no slower work. Any store or a trip home cures it.
- **Madame Ossery** will lease the whole station: every wing restored at once, but she takes rent every run and a fee every time you dock, and no ally will move into a station she owns.
- **Random encounters.** Many beacons are built on the spot from 16 kinds of people and ships, 12 kinds of trouble and choices made from your ship, crew races and personalities, and cargo, with sector-scaled rewards, traps, surprises, thank-yous and grudges a few jumps later, and short quests. Settings → Gameplay → Story variety: Hand-made, Mixed or Wild. In the open galaxy your story plays up to two scenes a trip, and the chart warns you before you'd strike with scenes unplayed.
- **Game modes.** Hangar → Mode: Classic (Fleet chase, standard ship), Explorer (open galaxy), Admiral (Fleet chase in a two-deck capital ship) or Grand Voyage (both), or mix the two switches yourself.
- **Capital ships.** A lower deck of three rooms under the main deck, joined by ladders, drawn as a cutaway. Only missiles and bombs reach it (other shots hit the room above), so vital systems are safe down there at the cost of longer walks. Crew at the top of a ladder fire down on enemies below, and a Gravity Hammer can knock foes through the floor. Veterans, hunters, the Dreadnought and some later enemies are capitals too, with their oxygen and medbay below decks.
- **Convoys.** Faction freighters and Mandate payroll barges crawl across each sector towards a store, shown on the map with their route. Raid one (its faction is furious unless you run dark behind a cloak or stealth plating), escort it for pay and standing, or trade with it. A raided store pays 2.5 times as much for the cargo that never came; an escorted one is well stocked.
- **Expedition mode.** Pick it in the hangar. No Mandate Fleet: heat rises as you travel and the Mandate hunt you harder the hotter you run. Haven's Rest is the hub, and every exit opens a galaxy chart of Near, Far and Deep spokes (1, 2 and 4 fuel). Deep spokes hold Precursor keys; three open the final assault early, and each key held weakens the Dreadnought. Classic mode is unchanged.
- **Ship facilities.** Fit empty rooms (Ship → Layout, at a store or home) with a Hydroponics Bay, Crew Lounge, Galley, Armoury Rack or Vending Machine. Each helps between jumps (planters and growth, hearts and later cabin fever, extra meal portions, kit repairs), and six new room combos use them (The Oasis, Botanist's Delight, Triage Centre, The Galley Garden, Mess Hall, Snack Corner). A vending machine is a bridge: the rooms either side of it count as linked.
- **Grief.** When someone dies, their best friend, sibling or sweetheart is furious: 25% more hand-to-hand damage and slightly slower repairs, for three jumps or until you win a fight and they have their revenge. A quiet scene later lets you help (a shared meal works best).
- **The Long Lights.** Relight an old relay beacon, or restore the Communications Relay wing, and the map gets a "Relay home" button: once a sector, for 2 fuel, Haven's Rest pulls you home from any beacon.
- **Supply and demand.** Every sector has a shortage that stores pay double for, and selling lots of one good at one store floods its market.
- **The blockade.** At maximum heat you can fight through, bribe the commander, or risk an uncharted wormhole. The Jabbit think less of you each time you run from a fight, and peoples who dislike you won't sign on as crew.
- **Earning your ships.** Only the Plucky is free. Every other ship needs a pilot level (renown is experience: level = 1 + √(renown/4)) and usually a challenge, often done in another ship: win with the Plucky, destroy 25 ships flying the Spanner in the Works, reach sector 5 in the Lantern. B layouts are earned in their A ship. Requisition tokens (one at each requisition rank) unlock any ship at once; at the right level you can buy a ship with renown instead. The hangar shows progress bars for each locked ship, and the debrief lists level-ups and new ships. Mod ships can set `lvl` and `ch` ({ win, wins, sector, kills, ach, shipSector:[id,n], shipKills:[id,n] }).
- **The ship's wiki.** Title screen → Wiki (or Wiki in the pause menu): search every page, Guides for every system, and an Encyclopedia page for every weapon, drone, augment, race, ship, enemy, sector, good, crop, meal, machine, kit, Haven wing, faction, combo, scar, anomaly, pet, medal and challenge, built from the live data so mods appear too. Pages link to each other.
- **Restoring Haven's Rest, made clear.** Stores have a Trade → Send home tab listing every dark wing, what it still needs, what you're carrying and where to get the rest; the station has a Restore wings tab; docking with something a wing wants tells you so.
- **Haven's Rest.** Your great-uncle's old station, restored across runs, Stardew-style: send goods home from any store to complete each wing's bundle. Eight wings (the Biodome, Aquaculture Bay, the Promenade, the Engineering Deck, the Communications Relay, the Smuggler's Fence, the Cellar, the Cantina), each giving every future run a perk. Or let the Directorate's contractors rebuild a wing for renown. Win a story with its best ending and whoever you saved moves in, and flies with you against the Dreadnought in later runs. On the title screen.
- **The wreck of your last ship.** Lose a run, and next time you may find what's left of your old ship: salvage its guns, hold a service for its crew, or search the decks and meet what's still aboard.

**Runs that stop being polite**
- **Ship scars.** Some damage stays: a room that leaks air, a system jammed one bar short, wiring that sparks into fires, a system locked out until you deal with the cause. Events can't end your run, but they can scar it. A badge shows on the room, and any store's dockyard (Supplies) patches it; Tinkari workshops do it cheaper.
- **Anomalies** bend the rules for a few jumps, each with a climax:
  - **Void fungus** (nebulas): mends your hull every jump and keeps the air sweet, but glows so the Fleet sees you, nibbles a drone part and finally asks for the reactor (two bars of power, for a living shield). Merge with it, burn it out (a Pebblekin can pull it out bare-handed) or vent the ship.
  - **WARDEN-9**, a Tinkari escort carrier that opens fire on every enemy for you. Some runs it starts "correcting" your course into hazards and finally takes the helm; other runs it's genuinely loyal.
  - **Crystal song** (Glass space): super shields at the start of every fight, engines stuck at 2 power, and your crew slowly turning to glass. Join the choir, smash its heart, or sell it.
  - **The Black Mark**: take the Pyrate King's mark and the Mandate stop chasing you. Commonwealth enforcers hunt you instead, lawful stores shut their shutters, and at the end the King offers to help against the Dreadnought, for half your crew.
  - **Pilgrims of the Quiet**: Thrumm pilgrims lend you a huge shield as long as you kill nobody. Ion, board and accept surrenders. Destroy a crewed ship and they sabotage the reactor; win three fights peacefully and they bless you, and come back at the Dreadnought.
  - **A time fracture**: fly through and, for the next few jumps, if your ship is destroyed, time snaps back to the fracture. Once. The enemies remember.
- **Elite Mandate ships** that change the fight: the Suffocator gasses rooms and pins you so you can't dodge, the Leech Frigate drains your power, the Auto-Strangler does both, and the Pyrate Shock-Raider fires boarding drones that stun the whole room on landing. Elites never give up and jump away.
- **Trade-off augments**: Reckless Overdrive (fast guns and crew, fragile systems, more breaches), Caffeine Drip-Line, Glass-Fibre Plating (+12% evasion, far more breaches), Sympathetic Shields, the Blood Reactor (+3 power, the crew bleed every jump), the Scrap Furnace, the Berserker Loop and the Mirror Hull.
- **Friends and rivals at work.** Bonded crew in the same room work 15% better. Rivals fight 25% harder to show off, but repair 40% slower.
- **Pet diets.** When your pet gets hungry, what you feed it decides what it becomes: a fixer, a beast that spits at enemy ships, an armour-plated welder or a gourmet that heals the room.
- **The Saboteur** has a fourth twist: sometimes none of the passengers did it.

**Spoken voices (optional)**
- Settings → Audio → **Spoken voices** reads the story aloud with your device's own voices. **Dialogue** speaks only what characters say; **Full story** adds a narrator, crew chatter and enemy taunts. Off by default.
- Every story character has their own voice, pitch and pace (Pip is small and quick, Director Kross slow and low, the Oracle measured, Holly calm, Rimmer clipped, Kryten high and earnest, a Simulant deep and slow), and the game works out who is speaking each line. Your own crew speak in a voice that suits their people: Pebblekin rumble, Thrumms hum high, Tinkari chatter. A **Voice speed** slider sits under it. How good the voices sound depends on your device and browser.

**Ships with character**
- Every faction's ships now have their own silhouette, colours, engines and details: Commonwealth ships are sleek with swept fins, Mandate ships are angular gunboats with spikes, Tinkari ships are rounded with twin pods, Pebblekin ships are boulders with rocky plating, Thrumm ships are glowing lenses with a halo, Mullock ships are soft blobs with tendrils, Jabbit ships are insects with mandibles and wings, stealth ships are thin, dark and faceted, Glass ships are crystal shards, pyrate ships are patched-up junk with a flag, auto-ships are blocky with a single red eye, drone carriers have hangar bays, and the Dreadnought is a long armoured spearhead. A mod can pick a look for its ships with `"style"`.

**Better information**
- **The crew card** is now a slim strip under your ship, so it never covers the rooms. Tap ⓘ for the full card.
- **Weapons** are described in plain words everywhere (stores, weapon cards, the Ship screen): what they do, how shields affect them, and what they're good for.

**More on the road**
- **Gun refits.** Every store's Weapons tab has a workshop: refit a gun you own to Mk II and Mk III, each charging 15% faster. No need to throw away a gun you like.
- **Sector situations.** About half the routes at an exit come with a situation, shown on the card: a Mandate crackdown (more patrols, cheaper stores), a salvage boom (richer wrecks, faster Fleet), storm season (double hazards, slower Fleet), festival season (fewer fights, the Harvest Fair), refugee convoys (distress calls everywhere) or a comms blackout (stores hidden until you're next to them).
- **The Ghost Fleet.** A forty-year-old distress code leads, over three sectors, to Captain Ada Rourke in cold sleep and a hidden fleet. Wake it, and six old frigates join you at the Dreadnought. Or strip them for parts.
- **Lucky Vell's crate.** A smuggler pays you to carry a humming crate to a buyer in the next sector. Deliver it, open it, sell it to the Mandate, or keep what's inside.
- **New encounters**: a singing space whale, an auction drone, a quarantined hospital ship, a pyrate race, an old minefield, a vending machine in deep space, a library ship and a rival courier.

**A career, not just a run**
- **Admiralty ranks.** Every run earns renown, won or lost: sectors crossed, ships beaten, the Dreadnought and the story. Ten ranks from Cadet to Admiral, shown on the title screen and in **Career**. A debrief after each run counts it up.
- **Ship requisitions.** Lieutenant, Commander, Commodore and Vice Admiral each unlock the next locked ship, so every ship is reachable just by playing.
- **The send-off.** Admiral Hale sees you off with a choice of gifts (fuel, scrap, a weapon, a crew member, star charts...). Some come with a price. Higher ranks bring more and better choices, and a reroll. Hale remembers how your last run went.
- **Pip, the data core.** The core in your hold wakes up in sector 2. Talk to it, show it the stars, refuse Director Kross's offer to buy it (or don't), and decide what happens to it. How you treat Pip changes the Dreadnought fight and how a win ends: four endings to find.
- **Director Kross** of Mandate Intelligence wants the core back, and waits for you aboard the Dreadnought. He keeps a file on you.
- **Veteran beacons** are marked on the map from sector 2: harder ships that always carry a weapon or an augment.
- **Mandate alert.** Win on Normal or Hard to unlock alert levels 1 to 8, each adding a twist for more renown and score.
- **The killing blow** lands in slow motion with a banner.
- **Upgrade advice.** The Ship screen says what the next level of each system does, warns when your guns need more Weapons power or your systems want more reactor than you have, and the quartermaster suggests one upgrade.
- **Clearer fights.** Missile weapons say "No missiles" when you run dry (with a one-time warning), and when an enemy gives up because neither ship can land a blow, you're told why and what would help. A broke ship nets a little debris as they go.
- **Fairer events.** An event on its own can hurt you badly but never ends the run: it leaves at least 1 hull.
- **Less repetition.** Your nemesis changes what they say as the feud goes on, and outrunning them only works once. Mags Vetch visits a few times a run, not every sector.
- **Fairer power.** Weapons and Drones only hold the bars their powered weapons and drones use: turning one off hands its power back to the reactor, and + powers the next one in line.

**Ships and crew**
- 41 ships: the 8 cruiser classes plus the built-in packs' scouts, gunboats, carriers, corsairs and more, most with an A and a B layout, unlocked by playing. A Settings toggle unlocks them all.
- 7 crew races, each with its own perk: Human, Pebblekin, Tinkari, Thrumm, Mullock, Jabbit and the secret Glassborn.
- Crew skills in Piloting, Engines, Shields, Weapons, Repair and Combat, which improve as crew work.
- Renaming your ship and crew, and dismissing crew.

**Systems**
- Main systems: Shields, Engines, Oxygen, Weapons, Drones, Medbay, Clone Bay, Teleporter, Cloaking, Hacking and Mind Control.
- Subsystems: Helm (with autopilot), Sensors, Doors and Backup Battery.
- Reactor power management, plus upgrades for every system.

**Ship interiors**
- Room-by-room oxygen.
- Doors and airlocks you can open, close and vent.
- Fires that spread, and hull breaches.
- Crew who walk through corridors, repair, put out fires and fight boarders.

**Combat**
- Weapons: lasers, missiles, ion, beams, flak, and bombs (fire, breach, ion, small and healing).
- Volley fire, autofire, shield layers, Thrumm super shields, evasion and cloaking.
- Teleporter boarding: send crew over, recall them, and win by killing the whole enemy crew.
- Hacking drones with timed pulses, mind control, and enemies who board, hack and mind-control you back.
- Drones: combat, beam, ion, defense, anti-drone, system repair, anti-personnel, boarding and hull repair.
- Enemies that surrender (now and then with a crew member who wants to join you) or try to flee once they're badly hurt. If neither ship can land a blow for 45 seconds, the enemy gives up and jumps away, so a fight never drags on forever.
- Enemy ships of the same type don't always carry the same guns, and a survivor sometimes climbs out of a wreck and asks to join your crew.

**Augments**
- 16 augments, such as Scrapture Arm, Weapon Pre-Igniter, Long-Range Scanners and Backup DNA Bank.

**The journey**
- 10 sector types, including Civilian, Mandate Stronghold, Pyrate Haven, Nebula, the race homeworlds and the Last Stand.
- At each exit you choose between two next sectors.
- Beacon hazards: asteroid fields, solar flares, ion storms, pulsars and nebulae, where sensors go blind.
- About 210 events with race, system and equipment "blue options", distress beacons and quest chains. Events never repeat within a run until you've seen the rest, and whatever the last few beacons gave you (a free crew member, a weapon) turns up less for a while.
- Stores with tabs for weapons, drones, augments, new systems, supplies, crew and selling.
- The Mandate Fleet advances every jump.
- The Dreadnought fight has three phases (boarders; drones with a super shield; power surges). It moves toward Commonwealth command, which can only hold out for a few jumps.

**Your crew's story**

Inspired by the spirit of the absurd trail games: a small crew you grow fond of, strange things on the road, and deaths that get remembered.
- **Your crew, your names.** In the hangar, tap **Name crew** to name your starting crew and pick each one's personality before you launch.
- **Personalities.** Every crew member has a personality as well as a skill trait: Gambler, Poet, Galley cook, Superstitious, Daredevil, Worrier, Tinkerer, Romantic, Conspiracy buff, Sleepwalker, Collector, Ex-pyrate, Mystic, Optimist, Grump or Bookworm. Each has its own chatter, last words and scenes, and unlocks its own options in events and hails (an ex-pyrate can talk pyrates down in the old cant, a bookworm can quote regulations at the Mandate, a gambler has "a system" at the casino).
- **Bonds.** Crew can be best friends, siblings, rivals or sweethearts. They banter between beacons, and when one dies the other grieves, and hits 30% harder for a while. Bonds also form on the way: two crew keep ending up on the same night shift, or fall out over how the oxygen smells.
- **Veterans.** Crew who beat five enemies hand to hand become veterans, with extra health.
- **Crew moments.** Two or three times a run, a beacon is a short scene starring one of your crew, with their portrait: a snail race, an epic poem broadcast to the whole sector, a mystery stew, a black comet, a sleepwalker at the airlock button, a cursed statue, a double of someone after a bad jump. Some come back later in the run: a lost bet, a curse, a pyrate sweetheart, a statue that wakes up.
- **The ship's pet.** Hatch an egg, take in a stray or keep a lost Biscuit, and name it yourself. Pets get up to things between beacons, learn tricks, grow, fall ill, rescue the ship, and sometimes go home.
- **Pets have jobs.** You can see your pet walking from room to room, and tap it for a fuss (crew hearts, once a jump). A void kitten claws boarders, a hull slug seals breaches and patches hull after fights, a star moth beats out fires, a space goat headbutts boarders and eats junk for scrap, and a pocket nebula adds 3% evasion and soothes the wounded.
- **A nemesis.** An enemy captain who gets away (or whom you run from) may swear revenge and come back a few jumps later with a named, upgraded ship. They return angrier each time until you finish them, make peace, or they vanish for good. Beating one pays well. A nemesis who is still at large when your run ends may turn up in a later run, remembering your old ship.
- **More strange days:** your evil twins from a mirror universe, an alien baby called Squib left in the airlock, a crew band ("and the Hull Breaches") that gets a gig, a Mandate health inspection of your garden, a love triangle with a handsome Pebblekin insurance salesman, and an ex-pyrate's eleven-step casino heist.
- **The fallen.** Crew who die say their last words, are remembered in the fight report, and may appear as ghosts later in the run. In later runs a relative or friend of someone you lost may come looking for you, wanting to finish what they started. **Record → Memorial** lists everyone you've lost, across every voyage.
- **The saga.** At the end of every run, read the whole story written out: who set out, who joined, who died and how, the nemesis, the pet and the strange things in between, with an epitaph for each crew member. Pause and choose **Saga so far** to read it mid-run. Your last twelve sagas are kept in **Record → Sagas**.

**Stores and trade**
- **Every sector has its own kind of store**, with a named keeper in a mood: general stores, Mandate surplus depots, pyrate black markets, smugglers' dens, the Mullock emporium, the Pebblekin quarry exchange, Tinkari workshops, Thrumm bazaars, Jabbit arms, the Commonwealth quartermaster and the Glass gallery. Each has its own stock size, prices and tastes.
- **More to buy:** up to five weapons, four drones and four augments, a deal of the day at 30% off, mystery crates, seeds, trade goods, cargo racks, hydroponic planters and full medical care. Prices rise a little each sector and wobble from store to store.
- **Haggle** once per store (a gambler, or an ex-pyrate at a black market, helps), and the **merchant guild card** knocks 5%, 8% then 12% off as you spend.
- **Crew are worth what they are worth.** Hiring and selling prices depend on race, training, veterancy, health and the store: a trained veteran fetches several times a raw recruit, Jabbit arms pay extra for fighters, and black markets ask no questions. Two candidates per store. Selling someone's best friend or sibling will not be forgiven.
- **Sell almost anything:** gear in cargo, augments, spare fuel, missiles and drone parts, and every trade good, crop, fish and meal.
- **Request boards:** most stores want something (3 void peppers, 2 deep eels...) and pay far over the odds for it. Accept the order, grow, catch, cook or buy the goods, and deliver them at any store before the deadline. Deliveries count towards your guild card.
- **Mags Vetch,** a travelling merchant, finds most crews in sector 2 or 3 and keeps turning up: rare seeds and weapons, the best prices anywhere for relics and curios, and personal orders that pay extra. Have tea with her, tell her about the voyage, and she may decide you are her favourite customer.
- **Kestrel Jones,** bounty hunter, turns up in about half of runs with contracts: destroy two or three ships of one kind before the sector ends, and she wires you the money. Fill three and she offers you her old rifle, or to join your crew.
- **Doctor Ossian Oddly,** a travelling surgeon whose hospital ship is painted like a circus, fits crew with implants: reinforced bones, a reflex chip, a targeting eye, a hydraulic grip, med-nanites, a learning cortex (two per person). His cheap experimental treatment usually gives two free implants, sometimes a whole new personality, and occasionally a glow in the dark.
- **Trade goods:** 28 goods, each cheap where it is made and worth up to three times as much where it is wanted, carried in a 16-space cargo hold (racks add more). Smuggled goods pay best, but Mandate patrols may confiscate them.

**Home life aboard** (light touch, all optional)
- **A hydroponic garden** (with Harvest all and Plant all): plant seeds, watch crops grow each jump (faster under a sun, stunted by ion storms), and harvest them. A Green thumb crew member helps. Now and then a crop comes up as a bumper harvest.
- **The galley:** cook crops and fish into five meals. Meals don't heal (the medbay does that): each gives the crew a different edge for three fights. Spicy hash hits harder in a brawl, fish supper charges guns faster, star stew repairs faster (and +15 health), berry pie dodges better, and melon sorbet is a bit of everything. A cook makes two portions and makes the edge last a fight longer.
- **Crew wishes:** now and then someone starts dreaming about something they love ("Captain. Captain. Void pepper. Think about it."). Bring it to them for a big jump in hearts. A dot on the Ship button tells you when crops are ripe or a wish can be granted.
- **Friendship hearts:** give gifts (everyone loves and hates different things, and you learn what they love), eat together, survive together. 3 hearts: works 5% better; 6: 10%; 8: +10 health; 10: devoted, and will cheat death once. A gift they love also gives them a burst of practice at their job. The crew card shows what their hearts do.
- **Fishing** needs a rod (stores sell them in Supplies, and it's one of Hale's send-off gifts) and a fishing spot: 🐟 beacons on the map, nebulas and asteroid fields. Cast as often as you like, but every cast at the same spot risks a little trouble first, but only for your fishing: the fish gets away, the line tangles (no more fishing at that beacon), or the rod snaps. The deeper you fish, the rarer the catch. The reeling game is harder too: two tries, smaller zones.
- **The Harvest Fair** turns up from sector 2: enter your best crop in the show, run a food stall, or take the crew for a night out.
- **Birthdays** last two jumps. A present then counts three times over and makes them properly good at their job. Forget, and they sulk: 10% worse for three fights. The Ship button lights up when a birthday is on.
- **Home-life tips** explain the garden, trade goods and hearts the first time they matter.
- **The bar:** many stores have one. Buy a round, take shore leave, buy a navigator a drink for the sector map, or sit in on a card game. Nights out tend to carry on into the morning: a stolen hat, a tattoo of the captain's face, a surprise marriage to a Mullock, a ship renamed in a card game.
- **Personality perks:** every personality now does something: tinkerers repair faster, daredevils dodge more at the helm, ex-pyrates hit harder, collectors sell for more, mystics glimpse the sector ahead, and more.

**Story and dialogue**
- About 210 events with multi-page branching conversations, race and system "blue options", and lines that name your actual crew.
- Ships hail you before most fights. Every faction has several hails of its own, and you won't hear the same hail twice in a run until you've heard the rest. You can bluff, bribe, intimidate or sneak past.
- Ten multi-beacon quest lines:
  - The Glass Shard: unlocks a secret sector, the Glasswork Expanse, with a new race (the Glassborn) and two new ships.
  - The Defector: a Mandate officer whose codes weaken the Dreadnought.
  - The Pyrate King's treasure map, found in three pieces.
  - A loan shark who comes to collect.
  - The Ghost Ship.
  - The Thrumm Prophecy.
  - The Tinkari genie lamp.
  - Jabbit honour duels.
  - The Weevil nest.
  - A medical escort mission.
- Named enemy ships, enemy taunts, surrender speeches, sector intros and store-keeper greetings.
- Crew chatter in speech bubbles (with lines for each race), spaced out so the crew don't repeat themselves, and a captain's log of everything you did.
- Quiet beacons have a few dozen different descriptions, sometimes turn up a small find, and hazard beacons describe what you've jumped into. Going back to an empty beacon costs no taps.

**Graphics**
- Procedurally textured hulls with plating, fins, nacelles, cockpit glass and weapon hardpoints.
- Tiled deck floors and system icons.
- Hand-shaded, outlined crew sprites for every race, with idle, walking, repairing and fighting frames. Every crew member has a gender and a unique look (skin tone, hairstyle, hair colour, colour morph, accessories) that stays with them all run, plus portraits in the roster, crew screen and store.
- Each species has its own silhouette: uniformed humans, faceted Pebblekin, smoke-tailed Tinkari mechanics, glowing Thrumms, eyestalked Mullocks, insectoid Jabbit, crystalline Glassborn, and repair, combat and boarding drones.
- Particle effects: explosions, sparks, smoke, debris, fire embers, venting breaches and missile trails.
- Glowing lasers, ion bolts and beams; shield bubbles that ripple where they are hit.
- Nebula backgrounds with planets and hazards that change at every beacon.
- Illustrated event scenes and tooltips everywhere.
- In VR you stand on a starship bridge: a plated deck, canopy ribs open to space, a rear bulkhead with a door, side consoles with live hull, crew and power readouts, and alert lighting that turns amber in combat and flashes red when you're in trouble.
- The holotable shows extruded 3D models of both ships (metal hulls with your room layout on top, nacelles with engine glow, wings, canopy, turrets, fresnel shields) with tiny holographic crew walking about.
- The enemy ship flies outside the canopy. Shots streak between you, it flashes when hit, your own shield bubble ripples when it blocks a shot, and beaten ships explode into debris.
- Physically based materials with image-based lighting, tuned for Quest 2 (no shadows, low draw calls). Mixed-reality mode hides the bridge and keeps the console and holotable.

**Sound and music**
- Everything is synthesised live: distinct sounds for each weapon class, impacts, shields, doors, power, alarms, crew deaths, skill-ups, hails, stores, jumps and explosions, mixed through a compressor and a space reverb.
- Ship ambience: engine hum that follows engine power and the jump drive, crackling fires, hissing breaches, and a low-hull warning chirp.
- Adaptive music: a different theme per sector type, a combat layer that fades in during fights, a heavier boss arrangement, and victory/defeat stingers.

**Crew at a glance**
- Every crew member shows what they're doing: manning a station, repairing, firefighting, patching, healing, fighting, moving or standing by, with a job icon over their head and in the roster.
- Click a crew member for a detail card: portrait, health, current job, post, race traits, all six skills with progress and what each level does, and buttons to set their post, send them to the medbay or back to their post.

**VR command deck**
- **A main screen that stays put.** It no longer drifts or jumps towards you. Grip it to carry it (it glides and stays level), grip its edges or corner brackets to stretch it, or press SCREEN HERE on the wrist menu to call it over. You can hide it altogether (Settings > VR console > Main screen) and play from the datapad and stations.
- **Datapad.** Click the left stick to hold the whole game screen in your hand like a tablet. Point at it or tap it with your other hand. Pick the hand in Settings.
- **Pop-out windows.** Events, stores, hails and tips lift out of the main screen as a window in front of you, and follow you anywhere on the ship.
- **Touch.** Press buttons on the main screen, datapad, pop-outs and stations with the tip of your controller, with a click you can feel.
- **Bridge stations.** Two consoles stand within reach of the captain's spot. *Tactical*: a card per weapon with power and aim, autofire, volley, cloak, hacking, mind control, battery and drones. *Engineering*: the reactor, every system with − and + power, doors, venting, crew stations and auto crew.
- **Shoot at the real ship.** Point at the enemy ship outside the canopy and pull the trigger: every powered gun locks onto the room you pointed at, with numbered crosshairs on its hull. With a weapon or crew member selected, it aims that weapon or sends the crew, just like the main screen.
- **3D star map.** Open the map and the holotable becomes a star chart of the sector: beacons, routes, your trail, the fleet's front and the exit. Point at a beacon to read about it, and pull the trigger to jump.
- **Jump lever.** A lever by your right hand shows the drive's charge and glows when it's ready. Grip it and pull it back: the star map opens. Point at a beacon with your other hand and pull it again to jump.
- **Hits you can feel.** Sparks shower the bridge when the hull is hit.
- **Guided tour.** New captains get a short tour of the deck the first time they enter VR. Replay it from Settings > VR console.
- Grab the holotable to move and turn it, or scale it up with two hands. Point at a room on a 3D ship and pull the trigger to target it or move crew there, exactly like the main screen.

**VR and mixed reality**
- The walkable full-scale 3D ship has been retired for now, so work can focus on the flat-screen game. VR keeps the bridge, the holotable, the tactical and engineering stations, the datapad, the jump lever and pop-out windows. The old walkable ship is in the git history.
- **Mixed reality**: on a Quest with passthrough, the AR button floats the console and the holotable in your own room.
- **Player height**, seated and lying-down modes, snap or smooth turning, and a comfort vignette are in Settings > VR & comfort.
- **Wrist menu**: pause, settings, height, pose, running, screen-here, game speed, autofire and "crew back to stations".
- **Medal wall**: the achievements you've earned light up on the bridge wall.

**A living sky**
- Shooting stars, a new planet at every beacon, purple nebula clouds, ion-storm lightning, a blazing nearby sun, pulsar pulses, an asteroid belt, and red alert tints in combat and at low hull.
- Jumps build a streaking hyperspace tunnel, white out, and drop you back into normal space through a shockwave (on flat screens too).
- Battles have bolt-shaped laser fire, muzzle flashes, smoking missiles, impact shockwaves, shield flares and multi-stage ship explosions.

**Settings** are organised into Audio (master, music, effects, ambience, music source), Graphics (effects quality, VR resolution and foveation, living sky, shooting stars, bridge, holotable, screen shake, reduce flashes), Screen & touch, VR movement (play position, height, turning, walking, running, vignette, comfort presets), VR console (datapad hand, pop-out windows, bridge stations, main screen on or off, magnifier, text size, controller help, controller buzz, size resets, replay the VR tour), Gameplay (difficulty, game speed, ship experience, hands-on play, tips, smart pause, unlocks, mod scripts) and Profile.

**Runs, seeds and the daily challenge**
- Every run has a **seed**. The same seed gives the same sector maps, beacon events, enemies, stores, sector choices and loot, so you can replay a run or share it. Type one in the hangar (Enter seed), or leave it on Random.
- The **Daily run** is the same for everyone each day: a ship picked by the date, Normal difficulty, mods off. The title screen shows today's ship, your best score today and your streak.
- **Game speed** (Settings > Gameplay, the pause screen, the VR wrist menu, or + and − on the keyboard) runs fights and crew at 50%, 75%, 100% or 125%.
- **Captain's record** keeps your last 30 runs (ship, difficulty, result, score, seed, with a Replay button), your best per ship and your daily scores. The end of a run shows a score, the captain's log, the seed, and buttons to try again or replay the same seed.
- **Backups**: Record > Save backup file writes your record, medals, unlocks, settings, mods and the run in progress to one file. Load it on another device (phone, PC, Quest) to carry on there.

**Crew traits, veterans and voices**
- Every crew member you recruit has a trait: Quick hands, Tough, Ace pilot, Gunner, Brawler, Medic, Shield tech or Swift. It shows on the roster, the crew card, the Ship screen, the store's crew for hire and, in VR, on their nameplate.
- From sector 3, about one ship in eight has a veteran crew: more hull and faster engines and weapons, but half again the scrap and a guaranteed weapon or augment.
- Crew and enemy captains babble a few gibberish syllables when they talk, pitched for each race (Settings > Audio > Crew voices).
- When every bunk is full, a recruit from an event or a store can swap places with one of your crew, and stores take crew in trade for 20 scrap (Store > Sell).
- Five new medals: beat a veteran crew, finish a daily, three dailies in a row, fix 10 hazards by hand in VR, and sabotage 5 enemy systems in VR.

**Sector map and routes**
- The sector map is a star chart in the sector's colours. Beacons carry icons (store, hostile ship, distress call, quest, exit, Commonwealth command), hazards show as small badges, and nebulas glow.
- Your route through the sector is traced in amber and your ship sits on the beacon you are at. Live routes flow outward from you and light up amber under the pointer.
- The Mandate Fleet is a red front that sweeps across the chart; a dashed line shows where it will be after your next jump, and beacons it will reach next are ringed in red.
- The footer says how many jumps the exit is, how far behind the fleet is, and warns when fuel is short.
- At each exit beacon, the route cards show a short description of the sector, a danger rating, fights and events, who you will mostly meet and its hazards.

**Accessibility**
- The pause menu can be shrunk to a small tab (the ▴ button) so both ships stay in view; it remembers your choice.
- Settings > Accessibility: a red-green safe palette (green becomes blue and the reds deepen, for protanopia and deuteranopia), high contrast text, text size, fewer flashes, game speed and smart pause in one place.
- Play with a game controller or the keyboard alone: the d-pad or arrow keys jump between buttons and rooms with a clear focus ring, and A or Enter selects. See the tables above.
- Every text box (ship and crew names, your multiplayer name, seeds, room codes, challenge codes, the TURN server) uses one on-screen QWERTY keyboard drawn on the game screen, so typing works the same in VR, on a phone and with a mouse. A physical keyboard types straight into it, Ctrl+V pastes, Enter confirms and Esc cancels. Room codes show five boxes and grey out letters that never appear in a code; in VR the keyboard opens as a pop-out window in front of you.

**Interface helpers**
- The title screen shows today's daily challenge, your last run and your record at a glance.
- The field manual has four pages: basics, map and hazards, controls (mouse, keyboard, touch, Quest, VR ship) and tactics.
- Hover any room on either ship for its system, power, damage, air, fires, breaches and who is inside.
- Stores give advice: whether your volley can beat the shields carried by ships in this sector, and how each weapon fares against them. The Ship screen tells you when the next shield level adds a layer.
- Keyboard: Space pause, M map, S ship screen, 1-4 weapons, V hold fire, F autofire, C cloak, H crew back to stations, + and − game speed, arrows and Enter to move and select, Esc cancel.
- Phones: a quick two-finger tap pauses or resumes; on Android the back button closes windows, pauses, or steps back to the title.

**Captain's tips**
- Short, contextual tips appear the first time each mechanic matters: targeting shields, volley fire, missiles and beams, spare power, fire, breaches, boarders, low oxygen, mind control, the medbay, fleeing, upgrading, stores, fuel, the fleet, being outgunned, and a Flagship briefing before the last sector.
- Combat tips pause the game and highlight the part of the screen they talk about. Turn them off with "No more tips", or replay them from Settings.
- First-time captains start on Easy.

**Balance, tested by autoplay**
- An autoplay bot plays hundreds of whole runs, and an "arena" pits an expected ship for each sector against every enemy, to keep fights fair. On Normal, a ship with a sensible build loses about 1-2 hull per fight in sectors 1-3 and about 5 per fight in sectors 5-7.
- The crew autopilot fights boarders as a group: everyone who can fight goes in together when they can win, otherwise they rally in the Medbay and fight there while healing.
- Mind control lasts a set time and then has a cooldown, so enemy Puppeteers can't keep one of your crew forever.
- Enemy shields grow to 2 layers from sector 5 and 3 only in the last sector. Extra enemy guns come from the sector's weapon tier and must fit the ship's weapon power.
- Weapons and drones that lose power to damage, ion or a power shuffle switch back on (and re-aim) when the power returns.
- Easy: enemies are one sector behind, the fleet is slower, scrap is up 40%, and the Dreadnought has one shield layer fewer and fires slower. After each fight you win on Easy, the crew patches 2 hull; enemy boarders hit a quarter softer; and a repair tender patches 10 hull between Dreadnought phases. The Dreadnought also fires slower on Normal.

**Mechanics tuned to FTL reference numbers**
- Oxygen refills at 1.2 / 4.8 / 8.4 % per second by level and drains at 1.2 % per second when unpowered; breaches drain 8 % per second.
- Ion damage locks a system for 5 seconds per hit, stacking up to 25 seconds.
- Weapons use FTL's fire and breach chances, and a hit only rolls for a breach if it didn't start a fire.
- Enemies gain 1 hull per sector; hull repairs cost 2 / 3 / 4 scrap in sectors 1-3 / 4-6 / 7-8; the Dreadnought has 22 hull per phase (18 on Easy). Enemy shields reach two layers gradually: a few ships in sector 4, about half in sector 5, all from sector 6. A nemesis met early gets fewer upgrades.
- Fighting fleet ships after they've caught you yields almost no salvage, and each extra fleet fight in a sector gets harder.

**Around the game**
- 55 achievements (10 of them for multiplayer) and three difficulties.

**Challenges**
- 14 hand-made challenge runs on the title screen, from one to three stars: Lone Wolf (one crew member), Glass Jaw (12 hull), Shoestring Budget, Hot Pursuit, Drone Commander, Boarders Away (no guns), Short Fuse (four sectors), Paper Tiger, The Hard Way, Endurance (ten sectors) and more.
- Each sets the ship, difficulty, rules and loadout. Reach the goal (a sector, or victory) and it's complete, even if the run goes on. Your best sector and attempts are kept.
- Mods can add their own challenges (see the `challenges` fields below).
- 19 new medals: challenges, 100 kills, winning on Hard, without losing crew, in under 40 minutes or over 10 sectors, five flawless fights, a 20-second kill, reaching sector 4 without a kill, five races aboard, scrap hoards, a 7-day daily streak, Mod Squad, and VR medals for the jump lever, the 3D star map and five blaster takedowns.
- Autosave between jumps.
- Procedural music, sound effects and controller haptics.

## Mods

Mods are JSON files. In the game, open **Mods**:

- **Mod library**: installs any mod listed in `mods/index.json`. This works inside VR on GitHub Pages.
- **Add mod files**: loads `.json` files from your device. On Quest, exit VR first so the file picker can open.

Mods are saved in the browser and apply when you start a new run. Turn them on or off from the Mods screen.

**Make mods with an AI.** The guide covers every field, the effect and requirement keys, copyable patterns (quests, delayed consequences, twists, hails, cargo checks), balance numbers measured from the game, common mistakes, a checklist, full id tables generated from the live data, and two complete examples that load with no warnings. The game now also warns about broken references (a weapon id that doesn't exist, an unreachable quest event) and overpowered guns, so the AI can fix its own mistakes when you paste the warnings back. Mods can add trade goods and crew personalities too. The Mods screen has an **AI mod guide** button that downloads [`mods/AI-MOD-GUIDE.md`](mods/AI-MOD-GUIDE.md). Paste the guide into any AI chat, describe the mod you want ("a haunted sector with three ghost ships and a quest"), save the reply as a `.json` file and add it with **Add mod files**, or paste it straight into the mod panel. The guide lists every field, every effect, the ids of everything in the base game and a balance guide, so the AI's mods load first time.

The content and ship mods in `mods/` are now **built into the game** (`node tools/build-packs.js` turns them into `js/packs.js`; they also stay in `mods/` as examples for modders). The Mod library offers the rest: the Red Dwarf campaign, the challenge pack, rule sets and scripts. The packs are:

- **Weapons and gear**: Frontier Arsenal, Ion Arsenal, Heavy Ordnance, Beam Masters, Crystal Arsenal, Thrumm Lightworks, Drone Hive and Engineering Corps (eleven augments that change how your ship works).
- **Ships**: Hangar Expansion, Frontier Classes, Exotic Hulls and Mandate Defectors, plus flyable ships in Space Pirates Ahoy, Pyrate Kings, Boarding Party and Drone Hive.
- **Crew**: Strange Peoples and Rim Peoples (four races each), Galactic Zoo (two races and a ship's mascot), More Crew Traits (ten traits), and the Archon builder race in Precursor Vaults.
- **Sectors and stories**: Deep Space Tales, Bounty Hunters, The Ghost Fleet, Merchant Guild, Cosmic Wonders, Pyrate Kings, Mandate Crackdown, Precursor Vaults, Nebula Runners, Boarding Party, Winterfest, Spooky Season, Hazard Zones (three hazard sectors), Derelict Salvage and Mullock Mysteries, each with its own events, enemies, hails or quests.
- **Challenges**: Challenge Pack adds eight more challenge runs.
- **Rule sets**: Ironman, Gentle Skies (relaxed), Knife's Edge (more guns, faster enemies), Double Trouble, Scrap Rich, Sprint (5 sectors) and Marathon (10 sectors).
- **Scripts**: Party Laser and Combat Bonuses (bonus scrap for quick and flawless wins). Scripts only run when you allow them in Settings.

They are inspired by the kinds of content FTL mods add, but every name, number and line of text is new; nothing is copied from another mod. When you add a mod, the game warns about any field it doesn't use, so a typo like `"damge"` doesn't fail silently.

### Format

```json
{ "name": "My Mod", "version": "1.0", "author": "You",
  "rules": { "startScrap": 40 },
  "races": [], "weapons": [], "drones": [], "augments": [],
  "ships": [], "enemies": [], "sectors": [], "events": [], "traits": [], "challenges": [],
  "remove": { "events": ["quiet"] },
  "script": "VTL.on('arrive', function(node){ VTL.toast('Hello!'); });" }
```

Every list holds objects with an `id`. Reusing an existing id replaces that item, so mods can also rebalance base content.

| Kind | Fields |
| --- | --- |
| `rules` | `sectors`, `startScrap`, `fleetSpeed`, `shieldRegen`, `repairRate`, `enemyPace`, `bossId`, `maxCrew`, `weaponSlots`, `droneSlots`, `augmentSlots`, `baseHP`, `startParts` |
| `races` | `name`, `color`, `hp`, `repair`, `combat`, `speed`, `power` (free power to the room's system), `heal` (health per second for everyone in the same room, `true` = 1), `fireproof`, `noAir` (needs no oxygen), `armor` (share of weapon damage taken, e.g. `0.7`), `telepathic`, `mindImmune`, `deathBurst`, `learn`, `desc` |
| `weapons` | `name`, `type` (`laser`, `missile`, `ion`, `beam`, `flak`, `bomb`), `damage`, `shots`, `charge`, `power`, `cost`, `tier`, `fire`, `breach`, `sysDamage`, `crewDamage`, `ion`, `stun`, `pierce` (ignores that many shield layers), `rooms` (beams), `radius` (flak), `heal` (bombs), `desc` |
| `drones` | `name`, `kind` (`attack`, `defense`, `anti`, `internal`, `boarding`, `hull`), `power`, `cost`, `rate`, `shot` (a weapon object for attack drones), `targets` (defense), `role` (`repair` or `fight` for internal), `heal` (hull) |
| `augments` | `name`, `cost`, `desc`, `fx`. `fx` gives a new augment real effects, and several augments add up: `charge`, `shield`, `repair`, `speed`, `dps`, `scrap` (fractions, `0.1` = 10% more), `ionRes`, `sysRes`, `breachRes` (chance to shrug off ion, system damage, breaches), `ammo` (chance a missile or drone part isn't used), `evade` (extra evasion points), `heal` (health per second for your crew, anywhere), `superShield` (super shield points at the start of each fight). Reusing a base id keeps its built-in effect. |
| `ships` | `name`, `cls` (groups A/B layouts in the hangar), `layout`, `desc`, `hull`, `reactor`, `color`, `image` (a picture to use as the hull), `systems` (name → level), `reserve` (empty rooms for later systems), `weapons`, `drones`, `crew` (race ids), `augments`, `fuel`, `missiles`, `parts`, `pattern` or `rooms`, `unlock` (`{"sector":3}`, `{"win":"shipId"}`, `{"ach":"id"}`, `{"kills":25}`) |
| `enemies` | `name`, `tags`, `onlyTagged` (only met in sectors whose `enemyTags` include one of its tags), `eventOnly` (never met at random, only through an event's `fight`), `hull`, `systems`, `weapons`, `drones`, `crew`, `sectors: [min, max]`, `auto` (no crew), `super`, `boss`, `phases` |
| `sectors` | `name`, `blurb` (shown on the route cards), `intro` (a list of arrival lines), `color`, `mix` (beacon weights for `event`, `combat`, `store`, `empty`), `tags`, `enemyTags`, `hazards` (chance per hazard), `nebula`, `fleetMult` |
| `traits` | `name`, `desc`, and any of: `repair`, `dps`, `speed` (multipliers), `charge` (weapon charge while manning weapons), `shield` (shield recharge while manning shields), `hp` (extra health), `evade` (extra evasion while piloting), `heal` (health per second for everyone in the same room). Every recruit gets one trait at random. |
| `challenges` | `name`, `desc`, `tier` (1-3 stars), `ship`, `difficulty`, `rules` (rule changes for that run), `start` (`hull`, `crew` (race ids), `crewCount`, `weapons`, `drones`, `augments`, `systems`, `scrap`, `fuel`, `missiles`, `parts`), `scrapMult`, `goal` (`{"sector":5}` or `{"win":true}`) |
| `events` | `text`, `weight`, `minSector`, `maxSector`, `tags` (only in sectors with one of these tags; add `""` to allow it anywhere but favour those sectors), `nebula`, `distress`, `questOnly`, `once`, `flag`, `noFlag`, `hail` (a faction or enemy tag: shown before fights with ships that carry it), `art`, `choices` |

**Event choices**
- Each choice needs `text` plus either an `effect`, or a `chance` with `success` and `fail` effects.
- `req` limits who can pick it: `race`, `quirk` (a crew personality such as `"gambler"`), `pet` (`true`: needs the ship's pet), `system` + `level`, `weaponType`, `drone`, `augment`, `scrap`, `fuel`, `missiles`, `parts`, `crewCount`. Race, personality, pet, system and equipment requirements show as blue options.
- `cost` takes `scrap`, `fuel`, `missiles` or `parts`.

**Effects** can include:
- `text`
- Resources: `scrap`, `fuel`, `missiles`, `parts`, `hull`
- Crew: `crew` (a race id or `"random"`), `crewLoss`
- Gear: `weapon`, `drone`, `augment` (an id or `"random"`)
- Ship changes: `install` (a system or `"random"`), `upgrade`, `damageSystem` (a system or `"random"`), `reactor`, `fire`
- Story: `fight` (an enemy id or `"random"`), `afterWin` (an effect applied if you win that fight), `event` (chains to another event), `quest` (marks a quest beacon with that event), `later` (`{"event":"id","jumps":4}` fires an event after some jumps), `store`
- Dialogue: `choices` (continue the conversation on a new page), `setFlag` / `clearFlag` (story flags that choices and events can require), `begin` / `dismiss` (in hails: start the fight, or end the encounter)
- More: `crewHeal`, `crewHurt`, `maxHull`, `xp` (`{"skill":"pilot","amt":20}`), `reveal` (shows the sector map), `fleetPush`, `mapPiece`
- Text can use `{crew}`, `{who}` (the crew member who meets a race or personality requirement), `{ship}`, `{enemy}` and `{sector}`, and in crew moments `{friend}`, `{fallen}`, `{pet}` and `{nemesis}`.
- Crew moments: give an event `moment: true` and it is picked as a crew scene instead of a normal beacon. `star` (a personality, or `"any"`) chooses who it is about, `bond: true` (with an optional `bondKind`) needs a crew member with a friend, sibling, rival or sweetheart, `pair: true` picks two crew with no bond yet (`{crew}` and `{friend}`), `fallen: true` needs someone who died, `pet: true` needs the pet. Extra effects for these: `starHurt`, `starHeal`, `starXp`, `starQuirk`, `starLeave`, `starClone`, `bondFix`, `pet`, `petBig`, `petGone`, and `saga` (the line the run's saga tells about that choice).
- Progress: `unlock`, `achievement`

**Ship layouts**
- `pattern` builds the layout from columns: `T` tail, `A` small/big/small, `B` two big rooms, `C` one big room, `D` two narrow rooms, `N` nose. For example `"TABAN"`.
- Or give `rooms` yourself as `{"sys":"shields","x":0,"y":0,"w":2,"h":2}` grid cells. Doors and airlocks are added automatically.

### Scripts

Scripts only run when **Allow mod scripts** is turned on in Settings. Only turn it on for mods you trust.

A script receives a `VTL` object with:
- `on(event, fn)`. Events are `runStart`, `arrive`, `event`, `combatStart`, `combatEnd`, `fire`, `tick` and `runEnd`.
- `toast(text)`, `applyEffect(effect)`, `startCombat(id)`, `giveWeapon(id)`, `addEvent(id, event)`, `rand` and `pick`.
- Live access to `G` (the current run), `DATA` and `UI`.

### Mod library

List mods in `mods/index.json` so players can install them from the Mods screen, including in VR:

```json
{ "mods": [ { "file": "my-mod.json", "name": "My Mod", "desc": "One line about it." } ] }
```

## Tech

The game is plain HTML and JavaScript with no build step. It uses three.js r128 from cdnjs for WebXR.

The whole interface is drawn on a 1600×1000 canvas. On flat screens the canvas is shown directly; in VR it becomes the texture of a floating console, with the holotable rendered in 3D below it.

| File | Contents |
| --- | --- |
| `js/data.js` | Ships, races, weapons, drones, augments, enemies, sectors, events, achievements |
| `js/story.js` | Hails, quest chains, the secret sector, extra events, chatter, taunts, intros |
| `js/tales.js` | More events: distress calls, everyday oddities, short quest chains, follow-ups that remember your choices, beacons for each sector |
| `js/market.js` | Store kinds and keepers, prices, haggling, deals, mystery crates, the guild card, crew worth, trade goods and the cargo hold, the store screen |
| `js/homestead.js` | The garden, galley and meals, friendship hearts and gifts, personality perks, fishing, the bar |
| `js/expansion.js` | Gun refits, sector situations, the Ghost Fleet and Lucky Vell quests, new encounters, plain-language weapon descriptions, and the ship's pet (jobs and sprite) |
| `js/campaign.js` | Campaign mods, ranks and renown, Admiral Hale's send-off, Pip and Director Kross, endings, veteran beacons, Mandate alert, the debrief and Career screens |
| `js/arcs.js` | The other three stories (the Defector, the Lost Flotilla, the Rival): their scenes, Dreadnought help, endings and the hangar story picker |
| `js/arcs2.js` | Twenty more stories, each with a hidden twist rolled per run, their scenes, Dreadnought effects and endings |
| `js/tricks.js` | Weapon tricks any weapon or mod can use: warm-up, homing, pinning, splash, ricochet, crits, salvage, gas, panic, toast, decoys, power drain |
| `js/arms.js` | Personal weapons and armour: kit data, melee effects, wear and repair, enemy kit and drops, the Armoury tab and store |
| `js/items.js` | Tonics and treats: permanent per-crew boosts, skill chips, boosts, healing, eating raw crops, the Tonics view and store tab |
| `js/living.js` | Faction standing, room combos and the shipyard, the workshop, crew off duty, crossbreeding, Haven's Rest, the wreck of your last ship |
| `js/openworld.js` | Heat and Mandate hunters, exit blockades, contracts, home between sectors, faction ships, Pip's intel |
| `js/frontier.js` | Ship facilities and their combos, grief, the Long Lights relay, shortages and flooded markets, the blockade wormhole, faction recruit refusals |
| `js/economy.js` | Convoys on the map: raiding, escorting and trading, store shortages and surpluses |
| `js/expedition.js` | Expedition mode: no Fleet, Haven's Rest as the hub, near/far/deep spokes, Precursor keys |
| `js/decks.js` | Capital ships: lower decks, ladders, deck protection, firing down the hatch, falls |
| `js/hunger.js` | Crew hunger: food, appetite by race, eating between jumps, the max-health penalty |
| `js/crewcard.js` | The crew screen: level stat gains, classes (presets and your own), slot pickers |
| `js/career.js` | Captain level from xp every run, prestige, save slots, download / load / clear all data |
| `tools/gen-player-guide.js` | Rebuilds this README's Player's guide tables from the game data (run it in the headless test harness) |
| `js/loadout.js` | Loadouts: 57 crew weapons, classes, attachments and weapon levels, perks and Pro perks, grenades, crew levels, abilities and prestige |
| `js/roster.js` | The crew roster: saving crew between runs, picking them in the hangar, export and import (file or code) |
| `js/procgen.js` | Random encounters built from parts, the Story variety setting, and story pacing per game mode |
| `js/modes.js` | The game mode chooser (Classic, Explorer, Admiral, Grand Voyage) |
| `js/shipyard.js` | Earning ships: pilot levels, ship challenges, requisition tokens and buying ships with renown |
| `js/wiki.js` | The ship's wiki: hand-written guides plus an encyclopedia generated from DATA, with search, links and scrolling |
| `js/havenvisit.js` | Visiting Haven's Rest during a run: the relay beacon, bunks, drydock and weapon locker, greenhouse, cantina, market, cabin fever, Ossery's lease |
| `js/anomalies.js` | Ship scars, anomalies (fungus, escort AI, crystal, Black Mark, pilgrims, time fracture), trade-off augments, elite ships, bonds at work, pet diets, event twists |
| `js/hulls.js` | Ship looks per faction: hull outlines, engines, fins, decorations, plating and cockpits |
| `js/midi.js` | A small MIDI player that plays a campaign's theme in different arrangements at different moments |
| `js/voices.js` | Optional spoken voices: each character's voice, working out who says each line, the narrator |
| `js/packs.js` | The built-in content packs (generated from `mods/` by `tools/build-packs.js`) |
| `js/tutorial.js` | Flight school: the guided practice fight and the illustrated lessons |
| `js/travellers.js` | Kestrel Jones's bounties, Doctor Oddly's implants and clinic, devotion at ten hearts, and more strange days |
| `js/saga.js` | Crew personalities, bonds, crew moments and their chains, the ship's pet, the nemesis, last words and ghosts, and the written saga of each run |
| `js/variety.js` | Extra hails and enemy ships, larger pools of chatter, taunts, greetings and quiet-beacon text, and the helpers that keep them from repeating |
| `js/gfx.js` | Procedural hulls, planets, nebulae, icons, particles, event art |
| `js/sprites.js` | Crew looks, sprites, poses and portraits for every race |
| `js/core.js` | Utilities, profile and unlocks, mod loading and scripts, audio and music |
| `js/ship.js` | Layout generator, doors and airlocks, pathfinding, crew |
| `js/sim.js` | Power, systems, damage, fire, oxygen, drones, crew AI, enemy AI, hazards |
| `js/run.js` | Run flow, map, events, stores, combat start and end, the Dreadnought chase, saving |
| `js/ui.js` | All canvas drawing and input |
| `js/scene3d.js` | VR bridge, 3D ship models, holotable, battle outside the canopy |
| `js/audio.js` | Synthesised sound effects, ambience and adaptive music |
| `js/crewui.js` | Crew jobs, job icons and the crew detail card |
| `js/interior.js` | Stubs left by the retired walkable 3D ship (kept so the VR code still loads) |
| `js/crew3d.js` | Life-size 3D crew for every race, animation and nameplates |
| `js/skyfx.js` | Living sky, hyperspace tunnel and battle effects in VR |
| `js/vrgrab.js` | Grab, move and resize the console and holotable; holotable picking |
| `js/challenges.js` | Challenge runs, their goals and screen, and the newer medals |
| `js/hints.js` | Contextual captain's tips and their triggers |
| `js/vrnav.js` | VR walking, teleport, snap turn, vignette, magnifier, controller labels |
| `js/vrui.js` | VR widgets: wrist menu and wall-mounted room consoles |
| `js/handson.js` | The captain's crew slot and the medal wall (its walkable-ship bonuses are dormant) |
| `js/vrdeck.js` | VR command deck: datapad, pop-out windows, touch presses, bridge stations, aiming at the enemy ship, 3D star map, jump lever, extinguisher, sidearm, hit sparks, guided tour |
| `js/mobile.js` | Screen fitting, safe areas, sideways mode, full screen, touch taps, long press, pinch and double-tap zoom, wake lock |
| `js/keyboard.js` | The on-screen QWERTY keyboard every text box uses (VR, touch, mouse and physical keys) |
| `js/pad.js` | Game controller and keyboard focus: d-pad and arrow-key navigation between buttons and rooms, cursor, button actions |
| `js/media.js` | Painted title wallpaper and beacon vistas, the Gallery and its jukebox |
| `js/xr.js` | WebXR session, console, controllers, haptics, dialogs, boot |
| `js/netcrypto.js` | SHA-256, AES-GCM and BIP-340 Schnorr signatures (for Nostr), with no libraries |
| `js/net.js` | Rooms and codes, WebRTC connections, the three meeting points (PeerJS, Nostr, a local BroadcastChannel for testing), a small Nostr client, the public room list |
| `js/netsync.js` | Shared-ship replication: patches, the guest copy, capturing guest changes, shared pop-ups, sounds and effects relayed from the host |
| `js/mp.js` | The multiplayer menu, rooms, players and roles, the in-game strip, pointers, quick chat |
| `js/mphunt.js` | Hunter and hunted, what viewers may press, co-op medals |
| `js/mpcodes.js` | Seed duels, challenge codes and their builder, the weekly cup and daily boards |
| `js/mprun.js` | Race to the Dreadnought and Wingmen: progress, trouble cards, covering fire, supplies |
| `js/mpversus.js` | Duel arena and Boarding brawl |
| `js/mpvr.js` | VR avatars and voice chat |


### Multiplayer, under the hood

No servers of our own. Players find each other through free public meeting points (the PeerJS cloud server and a handful of Nostr relays, tried at the same time), swap connection details, then talk directly over WebRTC data channels: one reliable and ordered for game state, one fast and lossy for pointers and VR poses. Messages over 15 KB are chunked. The host is the hub: guests connect to the host, which passes on what the others need. On Nostr, connection details are sealed with AES-GCM using a key made from the room code, and posted as short-lived events tagged with a hash of it.

*Shared-ship modes* (co-op, navigator, away team, go live, hunter and hunted, brawl): the host runs the only real game. Ten times a second it works out what changed in the game state since the last send and sends a patch: arrays of crew, shots and drones are matched by id, everything else by key, numbers rounded. Each guest applies patches to its own copy and animates it in between (shots fly, crew walk, drones circle). A guest's own actions run on their copy at once, then a comparison with the copy as it was finds what changed (power, targets, doors, crew orders, upgrades, store buys, VR hands-on work) and sends it to the host: counts like scrap, hull, fire and repair progress as differences, crew paths as move orders, and teleporting, hacking, mind control and jumps as commands. Until the host confirms, the guest keeps showing its own change. Shared pop-ups (events, results, surrender offers) are run by the host: a guest's click is sent as "this button was pressed", so every player sees the same choice play out. Sounds, toasts, sparks and medals the host's game makes are sent along with each patch.

*Duels* split the work: each player's game runs their own ship and shows a copy of the opponent's, refreshed ten times a second; shots, boarders and mind control cross as messages. *Race and wingmen* games are fully separate games of the same seed, with the host's game data, exchanging progress, cards, covering fire and supplies.

Scoreboards and the public room list are Nostr events (kind 30078), signed with a key made on the device and kept in the browser's storage.

## Credits

Everything in the game is original. The paintings in `assets/art/` were made by `tools/paint-backgrounds.py` and the eighteen-tune soundtrack in `music/` by `tools/compose-ost.py`; both scripts are in this repo, so anyone can remake or change them. Crew art is drawn by the game, or by players in the Pixel Studio.

Fonts are from Google Fonts under the SIL Open Font License, and 3D uses three.js (MIT licence).

The **Red Dwarf** campaign in `mods/` is an unofficial, non-commercial fan tribute. Red Dwarf and its characters belong to their owners; the campaign's story text and its theme arrangement are written for this game. It is a separate mod: delete `mods/red-dwarf*` to share a build without it.

*Vaster Than Life* is inspired by *FTL: Faster Than Light*, but uses none of its art, music, names or text.
