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

Look at either controller to see a label of what its buttons do. Turning style, teleport-only movement, the vignette, the magnifier, bigger VR text and the controller labels are all in **Settings → VR comfort & clarity**. Hovering over buttons gives a small haptic tick, the console texture is mipmapped so small text stays sharp, and small fonts are enlarged in VR.

In VR you stand on the bridge of your ship. A **holotable** under the console shows 3D models of both ships, with fires, damage, crew, drones and shots in flight, and the enemy ship is out there beyond the canopy. You can turn the holotable off in Settings.

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

**Captain's tips**
- Short, contextual tips appear the first time each mechanic matters: targeting shields, volley fire, missiles and beams, spare power, fire, breaches, boarders, low oxygen, mind control, the medbay, fleeing, upgrading, stores, fuel, the fleet, being outgunned, and a Flagship briefing before the last sector.
- Combat tips pause the game and highlight the part of the screen they talk about. Turn them off with "No more tips", or replay them from Settings.
- First-time captains start on Easy.

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
| `js/hints.js` | Contextual captain's tips and their triggers |
| `js/vrnav.js` | VR walking, teleport, snap turn, vignette, magnifier, controller labels |
| `js/xr.js` | WebXR session, console, controllers, haptics, dialogs, boot |
