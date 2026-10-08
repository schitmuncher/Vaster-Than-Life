# Vaster Than Life

A starship-command roguelike for WebXR, built for Meta Quest 2 and newer. It also plays in any desktop or phone browser.

You command a Fedoration courier carrying data that could end the war. Cross eight sectors, one jump at a time, while the Rebuff Fleet closes in behind you. Then chase down the Flaggship before it destroys Fedoration command.

It's a fan homage to *FTL: Faster Than Light*. The code, art, names and writing are all original, with plenty of puns.

## Play

Host the repo with GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. On a Quest, open the Pages link in the Meta Quest Browser and press **Enter VR**, or **Enter mixed reality** for passthrough.

| Quest control | Action |
| --- | --- |
| Point at the console + trigger (or pinch) | Click |
| Point at the floor + trigger | Teleport there |
| Left stick | Walk around the bridge (with a comfort vignette) |
| Right stick left / right | Turn (snap 30°, 45° or smooth) |
| Right stick up / down | Move the console closer or further |
| Left stick click | Magnifier on / off (a zoomed loupe over whatever you point at) |
| Right stick click | Back to the captain's spot |
| A / X | Pause or resume |
| B / Y | Open or close the map |
| Grip | Bring the console in front of you |

**Play position.** Choose **Standing**, **Seated** or **Lying down** in Settings, or from the pause screen while in VR. Seated puts you in the captain's chair at chair height. Lying down tilts the whole bridge so that looking at the ceiling shows the console in front of you: lie back, look up, and click the right stick to re-aim if needed. The right stick click always resets your position for the chosen mode.

Look at either controller to see a label of what its buttons do. Turning style, teleport-only movement, the vignette, the magnifier, bigger VR text and the controller labels are all in **Settings → VR comfort & clarity**. Hovering over buttons gives a small haptic tick, the console texture is mipmapped so small text stays sharp, and small fonts are enlarged in VR.

In VR you stand on the bridge of your ship. A **holotable** under the console shows 3D models of both ships, with fires, damage, crew, drones and shots in flight, and the enemy ship is out there beyond the canopy. You can turn the holotable off in Settings.

**Phones and tablets.** Tap **Full screen** on the title screen (or pause and tap **⛶ Full screen**) to hide the browser bars and lock to landscape. On iPhone, which has no full-screen mode for web pages, the game shows how to add it to your Home Screen instead; it then opens full screen like an app. Held upright, a phone turns the game sideways for you (switch this off in **Settings → Screen & touch**).

| Touch | Action |
| --- | --- |
| Tap | Use anything. Taps that land just off a button still hit it |
| Press and hold | Show details about what's under your finger, without clicking it |
| Pinch, or double-tap empty space | Zoom in (up to 4×); double-tap again or tap **Reset zoom** to zoom out |
| Drag while zoomed | Look around |

Text is larger by default on touch screens (Normal / Large / Huge in Settings). The game pauses itself when you switch apps, keeps the screen awake while you play, and gives a short vibration on hits (switch off in Settings). Settings can also be opened from the pause screen mid-run.

| Keyboard | Action |
| --- | --- |
| Space | Pause |
| M | Map |
| 1–4 | Select a weapon to target |
| C | Cloak |
| V | Hold fire / fire volley |
| Esc | Close or cancel |

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
- About 40 events with race, system and equipment "blue options", distress beacons and quest chains.
- Stores with tabs for weapons, drones, augments, new systems, supplies, crew and selling.
- The Rebuff Fleet advances every jump.
- The Flaggship fight has three phases (boarders; drones with a super shield; power surges). It moves toward Fedoration command, which can only hold out for a few jumps.

**Story and dialogue**
- About 130 events with multi-page branching conversations, race and system "blue options", and lines that name your actual crew.
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

**VR console and holotable**
- Grip while pointing at the console to carry it anywhere at any angle; grip on its edges or corner brackets to stretch it; use both hands to move and scale at once. Grip at nothing brings it back in front of you.
- Grab the holotable to move and turn it, or scale it up with two hands. Point at a room on a 3D ship and pull the trigger to target it or move crew there, exactly like the console.

**Your whole ship, in 3D (VR)**
- The bridge is your cockpit. Walk through the door at the back, down the corridor and into the ship: every room, door, airlock and window is built from your real ship layout, with a working machine for each system (spinning shield rings, glowing engine coils, weapon racks with live charge bars, oxygen tanks and fans, medbay beds, a teleporter pad, a cloaking crystal and more) and a label showing its power, damage and air.
- Your crew walk the corridors as life-size people of every race: humans of every look, Pebblekin, Enjinn, Voltans, Sloogs, Mantlis, Glassborn and drones. They really do their jobs: manning stations, repairing with sparks flying, putting out fires with extinguishers, healing in the medbay, and brawling with boarders, who arrive in red. Nameplates show each one's name, job and health.
- Everything you see is the simulation: fires burn and smoke, breaches suck air out of the room, low oxygen hazes red, damaged machines spark and smoke, ion hits arc blue, lights flicker when a room is hit, doors slide open for crew and for you, airlocks vent, broken doors spark.
- You're the captain: you give orders, the crew do the work. Point at a crew member and pull the trigger to select them, point at a floor to send them there, point at a door to open or close it. Grip brings the console to you anywhere on the ship.
- In a fight, stand by your teleporter and press **Beam me over** to visit the enemy ship and watch your away team (or the enemy crew) up close; **Beam me back** returns you. You come home automatically if the fight ends.
- Settings > Gameplay > Ship experience switches between **Full 3D ship** and **Classic cockpit** (just the bridge, console and holotable).

**A living sky**
- Shooting stars, a new planet at every beacon, purple nebula clouds, ion-storm lightning, a blazing nearby sun, pulsar pulses, an asteroid belt, and red alert tints in combat and at low hull.
- Jumps build a streaking hyperspace tunnel, white out, and drop you back into normal space through a shockwave (on flat screens too).
- Battles have bolt-shaped laser fire, muzzle flashes, smoking missiles, impact shockwaves, shield flares and multi-stage ship explosions.

**Settings** are organised into Audio, Graphics (effects quality, VR resolution and foveation, living sky, shooting stars, bridge, holotable, screen shake, reduce flashes), VR & comfort (play position, height adjustment, turning, walking, vignette, magnifier, text size, controller help, size resets), Gameplay and Profile.

**Captain's tips**
- Short, contextual tips appear the first time each mechanic matters: targeting shields, volley fire, missiles and beams, spare power, fire, breaches, boarders, low oxygen, mind control, the medbay, fleeing, upgrading, stores, fuel, the fleet, being outgunned, and a Flagship briefing before the last sector.
- Combat tips pause the game and highlight the part of the screen they talk about. Turn them off with "No more tips", or replay them from Settings.
- First-time captains start on Easy.

**Mechanics tuned to FTL reference numbers**
- Oxygen refills at 1.2 / 4.8 / 8.4 % per second by level and drains at 1.2 % per second when unpowered; breaches drain 8 % per second.
- Ion damage locks a system for 5 seconds per hit, stacking up to 25 seconds.
- Weapons use FTL's fire and breach chances, and a hit only rolls for a breach if it didn't start a fire.
- Enemies gain 1 hull per sector; hull repairs cost 2 / 3 / 4 scrap in sectors 1-3 / 4-6 / 7-8; the Flaggship has 22 hull per phase.
- Fighting fleet ships after they've caught you yields almost no salvage, and each extra fleet fight in a sector gets harder.

**Around the game**
- 20 achievements and three difficulties.
- Autosave between jumps.
- Procedural music, sound effects and controller haptics.

## Mods

Mods are JSON files. In the game, open **Mods**:

- **Mod library**: installs any mod listed in `mods/index.json`. This works inside VR on GitHub Pages.
- **Add mod files**: loads `.json` files from your device. On Quest, exit VR first so the file picker can open.

Mods are saved in the browser and apply when you start a new run. Turn them on or off from the Mods screen.

Example mods are in `mods/`: `space-pirates.json`, `party-laser.json` (which includes a script) and `ironman.json`.

### Format

```json
{ "name": "My Mod", "version": "1.0", "author": "You",
  "rules": { "startScrap": 40 },
  "races": [], "weapons": [], "drones": [], "augments": [],
  "ships": [], "enemies": [], "sectors": [], "events": [],
  "remove": { "events": ["quiet"] },
  "script": "VTL.on('arrive', function(node){ VTL.toast('Hello!'); });" }
```

Every list holds objects with an `id`. Reusing an existing id replaces that item, so mods can also rebalance base content.

| Kind | Fields |
| --- | --- |
| `rules` | `sectors`, `startScrap`, `fleetSpeed`, `shieldRegen`, `repairRate`, `enemyPace`, `bossId`, `maxCrew`, `weaponSlots`, `droneSlots`, `augmentSlots`, `baseHP`, `startParts` |
| `races` | `name`, `color`, `hp`, `repair`, `combat`, `speed`, `power` (free power to the room's system), `heal`, `fireproof`, `telepathic`, `mindImmune`, `deathBurst`, `learn`, `desc` |
| `weapons` | `name`, `type` (`laser`, `missile`, `ion`, `beam`, `flak`, `bomb`), `damage`, `shots`, `charge`, `power`, `cost`, `tier`, `fire`, `breach`, `sysDamage`, `crewDamage`, `ion`, `stun`, `pierce`, `rooms` (beams), `radius` (flak), `heal` (bombs), `desc` |
| `drones` | `name`, `kind` (`attack`, `defense`, `anti`, `internal`, `boarding`, `hull`), `power`, `cost`, `rate`, `shot` (a weapon object for attack drones), `targets` (defense), `role` (`repair` or `fight` for internal), `heal` (hull) |
| `augments` | `name`, `cost`, `desc`. Built-in effects use the base ids. Custom augments can do things through scripts. |
| `ships` | `name`, `cls` (groups A/B layouts in the hangar), `layout`, `desc`, `hull`, `reactor`, `color`, `image` (a picture to use as the hull), `systems` (name → level), `reserve` (empty rooms for later systems), `weapons`, `drones`, `crew` (race ids), `augments`, `fuel`, `missiles`, `parts`, `pattern` or `rooms`, `unlock` (`{"sector":3}`, `{"win":"shipId"}`, `{"ach":"id"}`, `{"kills":25}`) |
| `enemies` | `name`, `tags`, `hull`, `systems`, `weapons`, `drones`, `crew`, `sectors: [min, max]`, `auto` (no crew), `super`, `boss`, `phases` |
| `sectors` | `name`, `color`, `mix` (beacon weights for `event`, `combat`, `store`, `empty`), `tags`, `enemyTags`, `hazards` (chance per hazard), `nebula`, `fleetMult` |
| `events` | `text`, `weight`, `minSector`, `maxSector`, `tags`, `nebula`, `distress`, `questOnly`, `once`, `flag`, `noFlag`, `hail` (a faction tag, used before fights), `art`, `choices` |

**Event choices**
- Each choice needs `text` plus either an `effect`, or a `chance` with `success` and `fail` effects.
- `req` limits who can pick it: `race`, `system` + `level`, `weaponType`, `drone`, `augment`, `scrap`, `fuel`, `missiles`, `parts`, `crewCount`. Race, system and equipment requirements show as blue options.
- `cost` takes `scrap`, `fuel`, `missiles` or `parts`.

**Effects** can include:
- `text`
- Resources: `scrap`, `fuel`, `missiles`, `parts`, `hull`
- Crew: `crew` (a race id or `"random"`), `crewLoss`
- Gear: `weapon`, `drone`, `augment` (an id or `"random"`)
- Ship changes: `install` (a system or `"random"`), `upgrade`, `damageSystem`, `reactor`, `fire`
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
| `js/hints.js` | Contextual captain's tips and their triggers |
| `js/vrnav.js` | VR walking, teleport, snap turn, vignette, magnifier, controller labels |
| `js/mobile.js` | Screen fitting, safe areas, sideways mode, full screen, touch taps, long press, pinch and double-tap zoom, wake lock |
| `js/xr.js` | WebXR session, console, controllers, haptics, dialogs, boot |
