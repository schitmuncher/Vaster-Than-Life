# Vaster Than Life

A starship-command roguelike for WebXR, built for Meta Quest 2 and newer. It also plays in any desktop or phone browser.

You command a Fedoration courier carrying data that could end the war. Cross eight sectors, one jump at a time, while the Rebuff Fleet closes in behind you. Then chase down the Flaggship before it destroys Fedoration command.

It's a fan homage to *FTL: Faster Than Light*. The code, art, names and writing are all original, with plenty of puns.

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
| Press and hold | Show details about what's under your finger, without clicking it |
| Pinch, or double-tap empty space | Zoom in (up to 4×); double-tap again or tap **Reset zoom** to zoom out |
| Drag while zoomed | Look around |

**Screen shape** (Settings → Screen & touch): *Fill* stretches the game to the whole screen so no black bars show (the default on phones and tablets), *16:10* is the original shape, *16:9* and *21:9* are wide shapes, and *Crop* zooms in so nothing is left over; drag to see the edges.

Text is larger by default on touch screens (Normal / Large / Huge in Settings). The game pauses itself when you switch apps, keeps the screen awake while you play, and gives a short vibration on hits (switch off in Settings). Settings can also be opened from the pause screen mid-run.

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

## What's in the game

**Ships and crew**
- 16 ships: 8 cruiser classes, each with an A and a B layout, unlocked by playing. A Settings toggle unlocks them all.
- 7 crew races, each with its own perk: Human, Pebblekin, Enjinn, Voltan, Sloog, Mantlis and the secret Glassborn.
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
- Volley fire, autofire, shield layers, Voltan super shields, evasion and cloaking.
- Teleporter boarding: send crew over, recall them, and win by killing the whole enemy crew.
- Hacking drones with timed pulses, mind control, and enemies who board, hack and mind-control you back.
- Drones: combat, beam, ion, defense, anti-drone, system repair, anti-personnel, boarding and hull repair.
- Enemies that surrender or try to flee.

**Augments**
- 16 augments, such as Scrapture Arm, Weapon Pre-Igniter, Long-Range Scanners and Backup DNA Bank.

**The journey**
- 10 sector types, including Civilian, Rebuff Stronghold, Pyrate Haven, Nebula, the race homeworlds and the Last Stand.
- At each exit you choose between two next sectors.
- Beacon hazards: asteroid fields, solar flares, ion storms, pulsars and nebulae, where sensors go blind.
- About 185 events with race, system and equipment "blue options", distress beacons and quest chains. Events never repeat within a run until you've seen the rest, and whatever the last few beacons gave you (a free crew member, a weapon) turns up less for a while.
- Stores with tabs for weapons, drones, augments, new systems, supplies, crew and selling.
- The Rebuff Fleet advances every jump.
- The Flaggship fight has three phases (boarders; drones with a super shield; power surges). It moves toward Fedoration command, which can only hold out for a few jumps.

**Story and dialogue**
- About 185 events with multi-page branching conversations, race and system "blue options", and lines that name your actual crew.
- Ships hail you before most fights. Every faction has its own hails, and you can bluff, bribe, intimidate or sneak past.
- Ten multi-beacon quest lines:
  - The Glass Shard: unlocks a secret sector, the Glasswork Expanse, with a new race (the Glassborn) and two new ships.
  - The Defector: a Rebuff officer whose codes weaken the Flaggship.
  - The Pyrate King's treasure map, found in three pieces.
  - A loan shark who comes to collect.
  - The Ghost Ship.
  - The Voltan Prophecy.
  - The Enjinn genie lamp.
  - Mantlis honour duels.
  - The Weevil nest.
  - A medical escort mission.
- Named enemy ships, enemy taunts, surrender speeches, sector intros and store-keeper greetings.
- Crew chatter in speech bubbles (with lines for each race), and a captain's log of everything you did.

**Graphics**
- Procedurally textured hulls with plating, fins, nacelles, cockpit glass and weapon hardpoints.
- Tiled deck floors and system icons.
- Hand-shaded, outlined crew sprites for every race, with idle, walking, repairing and fighting frames. Every crew member has a gender and a unique look (skin tone, hairstyle, hair colour, colour morph, accessories) that stays with them all run, plus portraits in the roster, crew screen and store.
- Each species has its own silhouette: uniformed humans, faceted Pebblekin, smoke-tailed Enjinn mechanics, glowing Voltans, eyestalked Sloogs, insectoid Mantlis, crystalline Glassborn, and repair, combat and boarding drones.
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
- **Fight fires yourself.** Take the extinguisher from the rack on the rear wall and spray it at fires anywhere on the ship.
- **Captain's sidearm.** Point at a boarder on your ship and pull the trigger to shoot it with your blaster (6 damage, short cooldown). Take one down for a medal.
- **Hits you can feel.** Sparks shower the bridge when the hull is hit.
- **Guided tour.** New captains get a short tour of the deck the first time they enter VR. Replay it from Settings > VR console.
- Grab the holotable to move and turn it, or scale it up with two hands. Point at a room on a 3D ship and pull the trigger to target it or move crew there, exactly like the main screen.

**Your whole ship, in 3D (VR)**
- The bridge is your cockpit. Walk through the door at the back, down the corridor and into the ship: every room, door, airlock and window is built from your real ship layout, with a working machine for each system (spinning shield rings, glowing engine coils, weapon racks with live charge bars, oxygen tanks and fans, medbay beds, a teleporter pad, a cloaking crystal and more) and a label showing its power, damage and air.
- Your crew walk the corridors as life-size people of every race: humans of every look, Pebblekin, Enjinn, Voltans, Sloogs, Mantlis, Glassborn and drones. They really do their jobs: manning stations, repairing with sparks flying, putting out fires with extinguishers, healing in the medbay, and brawling with boarders, who arrive in red. Nameplates show each one's name, job and health.
- Everything you see is the simulation: fires burn and smoke, breaches suck air out of the room, low oxygen hazes red, damaged machines spark and smoke, ion hits arc blue, lights flicker when a room is hit, doors slide open for crew and for you, airlocks vent, broken doors spark.
- You're the captain: you give orders, the crew do the work. Point at a crew member and pull the trigger to select them, point at a floor to send them there, point at a door to open or close it. Your datapad and pop-out windows go everywhere with you, and SCREEN HERE on the wrist menu brings the main screen over.
- In a fight, stand by your teleporter and press **Beam me over** to visit the enemy ship and watch your away team (or the enemy crew) up close; **Beam me back** returns you. You come home automatically if the fight ends.
- Settings > Gameplay > Ship experience switches between **Full 3D ship** and **Classic cockpit** (just the bridge, console and holotable).

**VR ship overhaul: space, height, running and interaction**
- The interior is roomier and brighter: 2 m cells, 3.4 m ceilings, 1.5 m wide and 2.55 m tall doorways, a 1.8 m wide corridor, lighter paint, lit ceiling panels, wall light strips, large hull windows with a low sill, and skylights open to space. The bridge door is wider too.
- **Player height** slider in Settings > VR & comfort (-60 to +60 cm, with -/+ buttons) applies live, in the pause screen too. Seated and lying modes keep their own pose.
- **Walking and running**: push the left stick to walk (speed set in Settings, 0.8 to 2.4 m/s); push it fully forward to run (up to 5 m/s, Running can be set to Off). Speed eases in and out, footsteps sound and tick the controller, and the vignette tightens while you run. **Comfort presets** (Comfortable, Balanced, Free) set turning, vignette and speed in one go.
- **Wrist menu**: glance at your left wrist for pause, settings, height, comfort, datapad, screen-here and beam buttons you poke with the right ray.
- **Room consoles**: a small panel on the wall of each room shows power, damage, oxygen and crew, with buttons to add or remove power, send help and open or close doors.
- **Smart orders**: point at a burning, breached or damaged room with nobody selected and the nearest free crew member goes to deal with it.
- **Hands-on play** (Settings > Gameplay, on by default; everything can still be done from the console):
  - **Fix it yourself**: a burning, breached or damaged room shows a glowing marker. Hold a hand near it and the trigger to put out the fire, patch the breach or repair the machine, at the same speed as a crew member. The edge is being there at once (the wrist menu's ALERT button jumps you to the nearest emergency), not working faster.
  - **Captain's station**: rooms with piloting, engines, weapons, shields, sensors, doors, oxygen or medbay have a floor pad. Stand on it for a second to man that system when no crew member does. Step off to stand down.
  - **Sabotage**: when you beam over to an enemy ship, red markers appear at its power systems. Hold a hand near one with the trigger to lock that system down for 10 seconds. You can't be hurt aboard, so it is safe.
  - **Salvage**: destroy an enemy and a crate appears in a room of your ship. Hold the trigger near it for a little bonus scrap.
- **Quick travel and alerts**: the wrist menu has ALERT (jump to the nearest fire, breach or damaged system), TO BRIDGE and TO TELEPORT. You get a small buzz when a new emergency starts. Pointing at a crew member, floor spot or door shows a highlight.
- **Living crew**: idle crew turn to look at you and follow you with their heads, say hello, shout when they fight fires or boarders, and thank you when you fix something or cover a post, in speech bubbles.
- **Better metal**: panelled, weathered hull plating with vents, machines with panel seams, rivets and caution stripes, brushed trim, and enemy ships with a panel-and-rivet hull, a pointed nose and a faction look (spiked pirates, blade-winged rebels, crested aliens).
- **Medal wall**: the achievements you've earned light up on the bridge wall.
- **Weapons console**: the panel in the weapons room has a button per gun. Each press aims that gun at the next enemy system (shields, weapons, helm, engines, oxygen and so on) or clears it.
- **Wrist menu** extras: game speed, autofire and "crew back to stations".
- Planned next: door panels.

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
- The sector map is a star chart in the sector's colours. Beacons carry icons (store, hostile ship, distress call, quest, exit, Fedoration command), hazards show as small badges, and nebulas glow.
- Your route through the sector is traced in amber and your ship sits on the beacon you are at. Live routes flow outward from you and light up amber under the pointer.
- The Rebuff Fleet is a red front that sweeps across the chart; a dashed line shows where it will be after your next jump, and beacons it will reach next are ringed in red.
- The footer says how many jumps the exit is, how far behind the fleet is, and warns when fuel is short.
- At each exit beacon, the route cards show a short description of the sector, a danger rating, fights and events, who you will mostly meet and its hazards.

**Accessibility**
- The pause menu can be shrunk to a small tab (the ▴ button) so both ships stay in view; it remembers your choice.
- Settings > Accessibility: a red-green safe palette (green becomes blue and the reds deepen, for protanopia and deuteranopia), high contrast text, text size, fewer flashes, game speed and smart pause in one place.
- Play with a game controller or the keyboard alone: the d-pad or arrow keys jump between buttons and rooms with a clear focus ring, and A or Enter selects. See the tables above.

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
- Easy: enemies are one sector behind, the fleet is slower, scrap is up 40%, and the Flaggship has one shield layer fewer and fires slower. The Flaggship also fires slower on Normal.

**Mechanics tuned to FTL reference numbers**
- Oxygen refills at 1.2 / 4.8 / 8.4 % per second by level and drains at 1.2 % per second when unpowered; breaches drain 8 % per second.
- Ion damage locks a system for 5 seconds per hit, stacking up to 25 seconds.
- Weapons use FTL's fire and breach chances, and a hit only rolls for a breach if it didn't start a fire.
- Enemies gain 1 hull per sector; hull repairs cost 2 / 3 / 4 scrap in sectors 1-3 / 4-6 / 7-8; the Flaggship has 22 hull per phase (18 on Easy).
- Fighting fleet ships after they've caught you yields almost no salvage, and each extra fleet fight in a sector gets harder.

**Around the game**
- 45 achievements and three difficulties.

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

**Make mods with an AI.** The Mods screen has an **AI mod guide** button that downloads [`mods/AI-MOD-GUIDE.md`](mods/AI-MOD-GUIDE.md). Paste the guide into any AI chat, describe the mod you want ("a haunted sector with three ghost ships and a quest"), save the reply as a `.json` file and add it with **Add mod files**, or paste it straight into the mod panel. The guide lists every field, every effect, the ids of everything in the base game and a balance guide, so the AI's mods load first time.

42 mods come with the game in `mods/`, all installable from the Mod library (filter by Content, Ships, Trials, Rules or Scripts):

- **Weapons and gear**: Frontier Arsenal, Ion Arsenal, Heavy Ordnance, Beam Masters, Crystal Arsenal, Voltan Lightworks, Drone Hive and Engineering Corps (eleven augments that change how your ship works).
- **Ships**: Hangar Expansion, Frontier Classes, Exotic Hulls and Rebuff Defectors, plus flyable ships in Space Pirates Ahoy, Pyrate Kings, Boarding Party and Drone Hive.
- **Crew**: Strange Peoples and Rim Peoples (four races each), Galactic Zoo (two races and a ship's mascot), More Crew Traits (ten traits), and the Archon builder race in Precursor Vaults.
- **Sectors and stories**: Deep Space Tales, Bounty Hunters, The Ghost Fleet, Merchant Guild, Cosmic Wonders, Pyrate Kings, Rebuff Crackdown, Precursor Vaults, Nebula Runners, Boarding Party, Winterfest, Spooky Season, Hazard Zones (three hazard sectors), Derelict Salvage and Sloog Mysteries, each with its own events, enemies, hails or quests.
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
- `req` limits who can pick it: `race`, `system` + `level`, `weaponType`, `drone`, `augment`, `scrap`, `fuel`, `missiles`, `parts`, `crewCount`. Race, system and equipment requirements show as blue options.
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
- Text can use `{crew}`, `{who}` (the crew member who meets a race requirement), `{ship}`, `{enemy}` and `{sector}`.
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
| `js/gfx.js` | Procedural hulls, planets, nebulae, icons, particles, event art |
| `js/sprites.js` | Crew looks, sprites, poses and portraits for every race |
| `js/core.js` | Utilities, profile and unlocks, mod loading and scripts, audio and music |
| `js/ship.js` | Layout generator, doors and airlocks, pathfinding, crew |
| `js/sim.js` | Power, systems, damage, fire, oxygen, drones, crew AI, enemy AI, hazards |
| `js/run.js` | Run flow, map, events, stores, combat start and end, the Flaggship chase, saving |
| `js/ui.js` | All canvas drawing and input |
| `js/scene3d.js` | VR bridge, 3D ship models, holotable, battle outside the canopy |
| `js/audio.js` | Synthesised sound effects, ambience and adaptive music |
| `js/crewui.js` | Crew jobs, job icons and the crew detail card |
| `js/interior.js` | The walkable 3D ship: rooms, machines, doors, hazards, beaming, walking and pointing |
| `js/crew3d.js` | Life-size 3D crew for every race, animation and nameplates |
| `js/skyfx.js` | Living sky, hyperspace tunnel and battle effects in VR |
| `js/vrgrab.js` | Grab, move and resize the console and holotable; holotable picking |
| `js/challenges.js` | Challenge runs, their goals and screen, and the newer medals |
| `js/hints.js` | Contextual captain's tips and their triggers |
| `js/vrnav.js` | VR walking, teleport, snap turn, vignette, magnifier, controller labels |
| `js/vrui.js` | VR widgets: wrist menu and wall-mounted room consoles |
| `js/handson.js` | VR hands-on bonuses: fixing hazards, captain's station pads, enemy sabotage, salvage crates |
| `js/vrdeck.js` | VR command deck: datapad, pop-out windows, touch presses, bridge stations, aiming at the enemy ship, 3D star map, jump lever, extinguisher, sidearm, hit sparks, guided tour |
| `js/mobile.js` | Screen fitting, safe areas, sideways mode, full screen, touch taps, long press, pinch and double-tap zoom, wake lock |
| `js/pad.js` | Game controller and keyboard focus: d-pad and arrow-key navigation between buttons and rooms, cursor, button actions |
| `js/media.js` | FTL artwork and soundtrack: title wallpaper, gallery, crew avatars, streamed music |
| `js/xr.js` | WebXR session, console, controllers, haptics, dialogs, boot |


## Credits

Artwork (title wallpaper, concept-art gallery, crew avatars) and five soundtrack tracks come from **FTL: Faster Than Light**, © Subset Games, with music by **Ben Prunty**. They are used with the rights holders' permission and live in `assets/`. The wallpaper has had its logo painted out. In **Settings** you can switch crew portraits to *Drawn* and the music to *Generated* to play without them.
