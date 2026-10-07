# Vaster Than Life

A starship-command roguelike for WebXR, built for Meta Quest 2 and newer. It also plays on any desktop or phone browser.

You command a Fedoration courier carrying stolen data. Cross five sectors, one jump at a time, while the Rebuff Fleet closes in behind you. Power your systems, aim your weapons at enemy rooms, send crew to repair damage, and spend scrap on upgrades. At the end, the Flaggship is waiting.

It is a fan homage to *FTL: Faster Than Light*, with original code, art, names and writing, and plenty of puns.

## Play

Open `index.html` in a browser, or host it on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder).

On a Quest, open the Pages link in the Meta Quest Browser and press **Enter VR** (or **Enter mixed reality** for passthrough).

| Quest control | Action |
| --- | --- |
| Point + trigger (or pinch with hands) | Click |
| A / X | Pause / resume |
| B / Y | Open / close the map |
| Grip | Recenter the screen in front of you |
| Right stick up / down | Move the screen closer or further |

Keyboard: **Space** pause, **M** map, **1–4** select a weapon to target, **Esc** close.

## What is in it

- Reactor power management across Shields, Engines, Oxygen, Weapons and Medbay, with a crewed Helm
- Laser, missile, ion and beam weapons, targeted at individual enemy rooms
- Shield layers, evasion, system damage, ion lockout, oxygen, crew health, repairs and the medbay
- Five crew races: Human, Pebblekin, Enjinn, Voltan, Sloog (each with a perk)
- Three ships: The Pestrel, The Taurus, The Rolling Stone
- A branching sector map with stores, events, exit beacons and an advancing Rebuff Fleet
- Text events with race and system "blue options"
- Ship upgrades, weapon stores, crew hiring, cargo
- A final boss, the Flaggship
- Autosave between jumps (in your browser)

## Mods

Mods are JSON files. In the game, press **Mods**, then **Choose mod files**. On a Quest, exit VR first so the file picker can open. Mods are saved in the browser and apply when you start a new run. Toggle them on and off from the Mods screen, in VR or out.

See `mods/space-pirates.json` for a complete example. Top-level keys:

| Key | What it does |
| --- | --- |
| `name` | Required. The mod's name. |
| `version`, `author` | Optional labels. |
| `rules` | Overrides game rules, e.g. `startScrap`, `sectors`, `fleetSpeed`, `enemyPace`, `weaponSlots`, `maxCrew`, `bossId`, `beaconMix`. |
| `races` | `{ id, name, color, hp, repair, heal, power, desc }` |
| `weapons` | `{ id, name, type, damage, shots, charge, power, cost }`. `type` is `laser`, `missile`, `ion` or `beam`. |
| `ships` | Player ships: `{ id, name, desc, hull, reactor, color, systems, weapons, crew, fuel, missiles, rooms }` |
| `enemies` | `{ id, name, hull, systems, weapons, crew, sectors:[min,max], boss }` |
| `events` | `{ id, text, weight, minSector, maxSector, choices }` |
| `remove` | Delete base content, e.g. `{ "events": ["quiet"] }` |

`systems` uses `shields`, `engines`, `oxygen`, `weapons`, `medbay`, `piloting`, each with a level. `rooms` is optional; give a list of `{ "sys": "shields", "x": 0, "y": 0, "w": 2, "h": 2 }` grid cells, or leave it out for an automatic layout.

Event choices have either an `effect`, or a `chance` with `success` and `fail` effects. A choice can have `req` (`race`, `system` + `level`, `weaponType`, `scrap`, `fuel`, `missiles`) and `cost` (`scrap`, `fuel`, `missiles`). Effects can include `text`, `scrap`, `fuel`, `missiles`, `hull`, `crew` (race id or `"random"`), `crewLoss`, `weapon` (id or `"random"`), `fight` (enemy id or `"random"`), `event` (chain to another event id), `damageSystem`, `upgrade`, `reactor`.

Using an id that already exists replaces that item, so mods can rebalance base content too.

## Tech

One self-contained `index.html`. three.js r128 from cdnjs for WebXR. The whole interface is drawn on a 1600×1000 canvas, shown directly on flat screens and as a floating console texture in VR.
