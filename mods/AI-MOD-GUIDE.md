# Vaster Than Life: mod-making guide for AI assistants

Give this whole file to an AI chat (ChatGPT, Claude, Gemini or any other), then describe the mod you want. The AI should reply with one JSON file you can load into the game.

**Player instructions**
1. Paste this guide into a new AI chat, then write something like: *"Make me a mod with a space-pirate sector, three new weapons and a few events about treasure."*
2. Save the AI's reply (only the JSON part) as a file ending in `.json`, for example `my-mod.json`.
3. In the game, open **Mods** and use **Add mod files** (or paste the JSON into the mod panel). On a Quest, take the headset off for this step.
4. Mods apply to new runs. If the game lists warnings when you add the mod, paste them back to the AI and ask it to fix them.

---

## Instructions for the AI

You are writing a mod for **Vaster Than Life**, a browser game inspired by *FTL: Faster Than Light*. The player commands a small starship across sectors of beacons, fighting enemy ships, meeting events, upgrading systems and running from the Rebuff Fleet towards a final battle with the Flaggship. Mods are plain JSON. Follow these rules exactly.

### How to answer
- Reply with **one JSON object** inside a single ```json code block, plus at most two short sentences outside it. No comments inside the JSON (JSON does not allow them), no trailing commas, straight double quotes only.
- Give the mod a `"name"` (required), `"version"` and `"author"`.
- Start every new `id` with a short prefix unique to this mod, such as `"px_"`, so it never clashes with the game or other mods (`"px_cannon"`, `"px_harbour"`). Reusing a base id on purpose replaces that base item.
- Every id you reference (a weapon on a ship, an enemy in an event, a race in a requirement) must exist: either in this mod or in the reference lists below.
- All names and text must be original. Do not copy names, characters or text from FTL or any other game, book or film. Light humour and puns suit the game's tone (the enemies are the "Rebuff", the heroes the "Fedoration", pirates are "pyrates").
- Keep numbers inside the ranges in the balance section. A mod that makes the game trivially easy or impossibly hard is not fun.
- Text is shown in small panels: event text 1–4 sentences, choice text under 90 characters, descriptions under 120 characters.

### The file

```json
{
  "name": "My Mod",
  "version": "1.0",
  "author": "Your name",
  "rules": { },
  "races": [ ], "weapons": [ ], "drones": [ ], "augments": [ ], "traits": [ ],
  "ships": [ ], "enemies": [ ], "sectors": [ ], "events": [ ], "challenges": [ ],
  "remove": { "events": [ "id-to-remove" ] }
}
```

Every list holds objects that each have an `"id"`. Leave out any list you do not need.

## Kinds of content

### rules (optional object)
Changes the game's rules for the whole run. All fields optional.

| Field | Meaning | Base value | Sensible range |
| --- | --- | --- | --- |
| `sectors` | Number of sectors in a run (the last one is the Last Stand) | 8 | 4–12 |
| `startScrap` | Scrap at the start | 20 | 0–200 |
| `fleetSpeed` | How far the Rebuff Fleet advances per jump | 0.11 | 0.07–0.16 |
| `shieldRegen` | Seconds to recharge one shield layer | 2 | 1.4–4 |
| `repairRate` | Crew repair speed | 0.16 | 0.1–0.25 |
| `enemyPace` | Enemy weapon speed (higher is faster) | 0.7 | 0.5–1 |
| `bossId` | Enemy id of the final boss | "flaggship" | an enemy id with "boss" |
| `maxCrew` | Crew limit | 8 | 4–10 |
| `weaponSlots` | Weapon slots | 4 | 2–5 |
| `droneSlots` | Drone slots | 3 | 2–4 |
| `augmentSlots` | Augment slots | 3 | 2–5 |
| `baseHP` | Jumps Fedoration command survives the Flaggship | 4 | 2–8 |
| `startParts` | Drone parts at the start | 2 | 0–10 |

### races (crew species)
| Field | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | text | Required |
| `color` | "#rrggbb" | Colour of the crew sprite |
| `hp` | number | Health. Human is 100 (range 60–150) |
| `repair`, `combat`, `speed` | number | Multipliers, 1 = human (0.5–1.6) |
| `heal` | number | Health per second for everyone in the same room (0.5–2), or `true` for 1 |
| `armor` | number | Share of weapon damage taken, e.g. 0.7 = 30% less |
| `fireproof`, `noAir`, `telepathic`, `mindImmune` | true/false | Immune to fire / needs no oxygen / sees enemy crew / cannot be mind controlled |
| `power` | number | Free power to the system in the room they stand in (1) |
| `deathBurst` | number | Damage to enemies in the room when they die (10–30) |
| `learn` | number | Skill learning speed (1–2) |
| `desc` | text | One line shown in the crew card |

### weapons
| Field | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | text | Required |
| `type` | text | Required: one of `laser`, `missile`, `ion`, `beam`, `flak`, `bomb` |
| `damage` | number | Hull damage per shot (ion: ion damage; bombs usually 0) |
| `shots` | number | Shots per volley (not for beams) |
| `charge` | number | Required: seconds to charge (6–25) |
| `power` | number | Required: weapon power needed (1–4) |
| `cost` | number | Store price in scrap (20–120) |
| `tier` | number | 1–4, how late it appears in stores and on enemies |
| `fire`, `breach` | 0–1 | Chance per hit to start a fire / hull breach |
| `sysDamage` | number | Extra system damage per hit |
| `crewDamage` | number | Extra damage to crew in the room |
| `ion` | number | Extra ion damage on a non-ion weapon |
| `stun` | number | Seconds the crew in the room are stunned |
| `pierce` | number | Shield layers ignored |
| `rooms` | number | Beams: how many rooms the beam sweeps (1–4) |
| `radius` | number | Flak: spread (1–2) |
| `heal` | number | Bombs only: heals your own crew in the target room instead (20–60) |
| `desc` | text | One line |

Lasers, ion and flak are stopped by shield layers (each shot removes one layer). Missiles and bombs ignore shields but use one missile each. Beams lose 1 damage per shield layer.

### drones
| Field | Meaning |
| --- | --- |
| `id`, `name` | Required |
| `kind` | Required: `attack` (orbits the enemy and shoots), `defense` (shoots down incoming shots), `anti` (destroys enemy drones), `internal` (walks your ship), `boarding` (breaks into the enemy ship), `hull` (repairs hull out of combat) |
| `power` | Required: drone power (1–4) |
| `cost` | Store price (30–90) |
| `rate` | Seconds between actions (attack 3–7, defense 2–3) |
| `shot` | Attack drones: a weapon object, e.g. `{"type":"laser","damage":1}` |
| `targets` | Defense drones: list from `missile`, `hack`, `bdrone`, `laser`, `ion`, `flak`, `asteroid` |
| `role` | Internal drones: `repair` or `fight` |
| `heal` | Hull drones: hull repaired per drone part (3–6) |
| `desc` | One line |

### augments
| Field | Meaning |
| --- | --- |
| `id`, `name`, `cost` (30–100), `desc` | Required, the description must say what it does |
| `fx` | The effect. Any of: `charge`, `shield`, `repair`, `speed`, `dps`, `scrap`, `ionRes`, `sysRes`, `breachRes`, `ammo`, `evade`, `heal`, `superShield` |

`fx` values: `charge`, `shield`, `repair`, `speed`, `dps` and `scrap` are fractions (0.1 = 10% better, keep under 0.3). `ionRes`, `sysRes`, `breachRes` and `ammo` are chances from 0 to 1 (keep under 0.5). `evade` is extra evasion points (2–10). `heal` is health per second for your crew anywhere (0.2–1). `superShield` is super-shield points at the start of every fight (1–5). Several augments add up. Example: `{"id":"px_lens","name":"Gunner's Lens","cost":55,"desc":"Weapons charge 10% faster.","fx":{"charge":0.1}}`

### traits (every recruited crew member gets one at random)
`id`, `name`, `desc`, plus any of: `repair`, `dps`, `speed` (multipliers, 1.1–1.4), `charge` (weapon charge while manning weapons, 1.05–1.15), `shield` (shield recharge while manning shields, 1.1–1.25), `hp` (extra health, 10–40), `evade` (extra evasion while piloting, 3–8), `heal` (health per second for everyone in the same room, 1–2.5).

### ships (ships the player can fly)
| Field | Meaning |
| --- | --- |
| `id`, `name` | Required |
| `cls` | Class name. Two ships with the same `cls` appear as the A and B layouts of one class |
| `layout` | `"A"` or `"B"` |
| `desc` | One line |
| `hull` | Required: 20–35 |
| `reactor` | Reactor power, 6–10 |
| `color` | Hull tint "#rrggbb" |
| `systems` | Required: system id → level, e.g. `{"shields":2,"engines":2,"oxygen":1,"weapons":3,"medbay":1,"piloting":1,"sensors":1,"doors":1}` |
| `reserve` | Systems with an empty room ready to be bought later, e.g. `["drones","teleporter"]` |
| `weapons`, `drones`, `augments` | Starting gear (ids) |
| `crew` | Race ids, 2–4 of them |
| `fuel`, `missiles`, `parts` | Starting supplies (fuel 12–20, missiles 0–10, parts 0–8) |
| `pattern` | The layout as columns from tail to nose: `T` tail (1 room), `A` small + big + small (3 rooms), `B` two big rooms (2), `C` one big room (1), `D` two narrow rooms (2), `N` nose (1). Example `"TABAN"` = 8 rooms. It needs at least as many rooms as systems plus reserve |
| `unlock` | Optional: `{"sector":3}`, `{"win":"shipId"}`, `{"ach":"achievementId"}` or `{"kills":25}`. Leave out to make it available at once |

A good starting ship: 2 shield, 2 engine, 1 oxygen, 3 weapon power, 2 starting weapons worth about 4 power, 3 crew.

### enemies
| Field | Meaning |
| --- | --- |
| `id`, `name` | Required |
| `tags` | Faction tags (see reference) used to match sectors and hails |
| `onlyTagged` | true: only met in sectors whose `enemyTags` include one of its tags |
| `eventOnly` | true: never met at random, only through an event's `fight` |
| `hull` | Required: 8–20 (the game adds 1 per sector) |
| `systems` | Required, like ships. Enemies get extra levels in later sectors automatically |
| `weapons`, `drones` | Ids. The game adds a gun or two in later sectors |
| `crew` | Race ids (leave empty for automated ships) |
| `auto` | true: an automated ship with no crew |
| `sectors` | `[min, max]` sectors it can appear in, e.g. `[2, 8]` |

### sectors
| Field | Meaning |
| --- | --- |
| `id`, `name` | Required |
| `blurb` | One line shown on the route choice |
| `intro` | List of 1–3 arrival lines (one is picked) |
| `color` | Map colour |
| `mix` | Beacon weights: `{"event":45,"combat":45,"empty":10}` (also `store`) |
| `tags` | Event tags: events with one of these tags turn up here |
| `enemyTags` | Enemy tags favoured here |
| `hazards` | Chance per beacon: `{"asteroid":0.1,"sun":0.05,"ionstorm":0.05,"pulsar":0.05}` (keep the total under 0.5) |
| `nebula` | Chance a beacon is in a nebula (0–0.8) |
| `fleetMult` | Fleet speed here (0.6–1.2) |

### events (the heart of most mods)
An event is a scene with choices.

| Field | Meaning |
| --- | --- |
| `id` | Required |
| `text` | Required: what the player sees. Placeholders: `{crew}` a random crew member, `{who}` the crew member who meets a choice's race requirement, `{ship}` the ship's name, `{enemy}` the enemy ship, `{sector}` the sector |
| `choices` | Required: 1–4 choices |
| `weight` | How often it is picked (default 1; 0.3 rare, 2 common) |
| `minSector`, `maxSector` | Sector range |
| `tags` | Only in sectors with one of these tags. Add `""` to the list to allow it anywhere but favour those sectors. Leave out to allow it anywhere |
| `distress` | true: used for distress beacons |
| `nebula` | true: only at nebula beacons |
| `questOnly` | true: only reached through another event's `quest`, `event` or `later` |
| `once` | true: at most once per run |
| `flag` / `noFlag` | Only when a story flag is set / not set |
| `hail` | Makes it a hail shown before fights with ships carrying this tag (see below) |
| `art` | Picture: `nebula`, `star`, `distress`, `station`, `creature`, `market`, `fleet`, `wreck`, `planet`, `glass`, `ship`, `space`, `asteroid` |

**A choice** has `text` and either an `effect`, or `chance` (0–1) with `success` and `fail` effects.
- `req` hides or locks the choice unless the player has it: `race` (a race id), `system` with optional `level`, `weaponType`, `drone` (id or kind), `augment`, `scrap`, `fuel`, `missiles`, `parts`, `crewCount`. Race, system and gear requirements show as blue options, the best answers.
- `cost` takes `scrap`, `fuel`, `missiles` or `parts` when chosen (also add a matching `req` so it can be afforded).

**An effect** can include:
- `text`: the outcome, 1–3 sentences
- Resources (negative to take away): `scrap` (5–60, scales with the sector), `fuel` (1–5), `missiles` (1–6), `parts` (1–6), `hull` (repair 2–10 or damage -1 to -6)
- Crew: `crew` (race id or `"random"`; use sparingly, at most one choice in an event), `crewLoss` (number), `crewHeal` (10–60), `crewHurt` (5–30), `xp` (`{"skill":"pilot","amt":15}`)
- Gear: `weapon`, `drone`, `augment` (an id or `"random"`)
- Ship: `install` (system id or `"random"`), `upgrade` (system id or `"random"`), `damageSystem` (system id or `"random"`), `reactor` (number), `maxHull` (number), `fire` (true: starts a fire)
- Story: `fight` (enemy id or `"random"`), `afterWin` (an effect applied if you win that fight), `event` (go straight to another event), `quest` (marks a beacon in this sector; arriving there opens that event), `later` (`{"event":"id","jumps":3}` opens an event a few jumps later), `store` (true: opens a store), `reveal` (true: reveals the sector map), `fleetPush` (moves the fleet: -0.06 is a good escape, 0.05 is a delay)
- Dialogue: `choices` (a new list of choices: the conversation goes on, as deep as you like), `setFlag` / `clearFlag` (story flags read by `flag`/`noFlag` on events)

**Hails** are events shown when a fight starts against a ship with that tag. Give them `"hail":"pyrate"` (or any enemy tag, including your own), and in choices use `"begin":true` to start the fight, or `"dismiss":true` to end the encounter peacefully. `"primeWeapons":true` starts the fight with charged guns.

Good events offer a real decision: a safe small reward, a risky bigger one, and a blue option. Not every choice should reward the player. Free crew members should be rare.

### challenges (hand-made runs on the Challenges screen)
| Field | Meaning |
| --- | --- |
| `id`, `name`, `desc` | Required |
| `tier` | Difficulty stars, 1–3 |
| `ship` | Ship id |
| `difficulty` | `easy`, `normal` or `hard` |
| `rules` | Rule changes for this run only (see rules) |
| `start` | Starting changes: `hull`, `crew` (list of race ids, replaces the crew), `crewCount`, `weapons`, `drones`, `augments`, `systems` (id → level), `scrap`, `fuel`, `missiles`, `parts` |
| `scrapMult` | Scrap rewards multiplier, e.g. 0.6 |
| `goal` | `{"sector":5}` or `{"win":true}` |

### remove
`{"events":["id"], "weapons":["id"]}` removes base content by id.

### script (advanced, usually not needed)
A string of JavaScript run when the player allows mod scripts in Settings. It receives `VTL` with `on(event, fn)` (events: `runStart`, `arrive`, `event`, `combatStart`, `combatEnd`, `fire`, `tick`, `runEnd`), `toast(text)`, `applyEffect(effect)`, `startCombat(id)`, `giveWeapon(id)`, `addEvent(id, event)`, `rand`, `pick`, and live `G`, `DATA`, `UI`. Prefer data (events, augments with `fx`) over scripts.

## Reference: what already exists

**Systems**: `shields`, `engines`, `oxygen`, `weapons`, `drones`, `medbay`, `clonebay`, `teleporter`, `cloaking`, `hacking`, `mindcontrol`, `piloting`, `sensors`, `doors`, `battery`. Subsystems (no reactor power): `piloting`, `sensors`, `doors`, `battery`. Highest levels: shields 8, engines 8, oxygen 3, weapons 8, drones 8, medbay 3, clonebay 3, teleporter 3, cloaking 3, hacking 3, mindcontrol 3, piloting 3, sensors 3, doors 3, battery 2.

**Skills** (for `xp`): `pilot`, `engines`, `shields`, `weapons`, `repair`, `combat`.

**Races**: `human` (Human), `pebblekin` (Pebblekin), `enjinn` (Enjinn), `voltan` (Voltan), `sloog` (Sloog), `mantlis` (Mantlis).

**Faction tags** on enemies: `rebuff`, `pyrate`, `auto`, `enjinn`, `mantlis`, `voltan`, `pebblekin`, `sloog`, `glass`. Sector tags: `rebuff`, `pyrate`, `nebula`, `sloog`, `pebblekin`, `enjinn`, `voltan`, `mantlis`, `glass`.

**Sectors**: `civilian` (Civilian Sector), `rebuff` (Rebuff Stronghold), `pyrate` (Pyrate Haven), `nebula` (Uncharted Nebula), `sloog` (Sloog Nebula), `pebblekin` (Pebblekin Homeworlds), `enjinn` (Enjinn Controlled), `voltan` (Voltan Homeworlds), `mantlis` (Mantlis Hives), `laststand` (The Last Stand), `glass` (The Glasswork Expanse).

**Weapons**
| id | name | type | damage × shots | charge | power | cost | tier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `basic` | Basic Laser | laser | 1 × 1 | 10 | 1 | 20 | 1 |
| `bust1` | Bust Laser I | laser | 1 × 2 | 11 | 2 | 50 | 1 |
| `bust2` | Bust Laser II | laser | 1 × 3 | 12 | 2 | 80 | 2 |
| `bust3` | Bust Laser III | laser | 1 × 5 | 19 | 4 | 95 | 3 |
| `heavy1` | Heavy Laser I | laser | 2 × 1 | 9 | 1 | 55 | 1 |
| `heavy2` | Heavy Laser II | laser | 2 × 2 | 13 | 3 | 65 | 2 |
| `duel` | Duel Lasers | laser | 1 × 4 | 16 | 3 | 70 | 2 |
| `lego` | Lego Missile | missile | 1 × 1 | 9 | 1 | 30 | 1 |
| `arty` | Arty Missile | missile | 2 × 1 | 11 | 1 | 38 | 1 |
| `hermies` | Hermies Missile | missile | 3 × 1 | 14 | 3 | 45 | 2 |
| `breachm` | Breach Missile | missile | 4 × 1 | 22 | 3 | 65 | 3 |
| `pegasaurus` | Pegasaurus Missile | missile | 2 × 2 | 20 | 3 | 60 | 3 |
| `ion` | Ion Blast | ion | 1 × 1 | 8 | 1 | 30 | 1 |
| `ion2` | Heavy Ion | ion | 2 × 1 | 13 | 1 | 45 | 2 |
| `ionstun` | Ion Stunner | ion | 1 × 1 | 10 | 1 | 35 | 2 |
| `pike` | Pike Bream | beam | 1 × 1 | 16 | 2 | 50 | 1 |
| `halbird` | Hal-Bird Beam | beam | 2 × 1 | 17 | 3 | 65 | 2 |
| `glaive` | Glaive Bream | beam | 3 × 1 | 25 | 4 | 95 | 3 |
| `bonfire` | Bonfire Beam | beam | 0 × 1 | 20 | 2 | 50 | 2 |
| `biobeam` | Anti-Bio-Logical Beam | beam | 0 × 1 | 16 | 2 | 50 | 2 |
| `flak1` | Flak-o I | flak | 1 × 3 | 10 | 2 | 65 | 2 |
| `flak2` | Flak-o II | flak | 1 × 7 | 21 | 3 | 80 | 3 |
| `firebomb` | Fire Bomb | bomb | 0 × 1 | 15 | 2 | 50 | 2 |
| `breachbomb` | Breach Bomb | bomb | 0 × 1 | 17 | 1 | 50 | 2 |
| `smallbomb` | Small Bomb | bomb | 0 × 1 | 11 | 1 | 45 | 1 |
| `ionbomb` | Ion Bomb | bomb | 0 × 1 | 22 | 1 | 55 | 3 |
| `healbomb` | Heal-ium Burst | bomb | 0 × 1 | 15 | 1 | 40 | 2 |

**Drones**
| id | name | kind | power | cost |
| --- | --- | --- | --- | --- |
| `combat1` | Combat Drone I | attack | 2 | 50 |
| `combat2` | Combat Drone II | attack | 4 | 75 |
| `beamd` | Beam Drone I | attack | 2 | 50 |
| `iond` | Ion Drone | attack | 2 | 45 |
| `defense1` | Defense Drone I | defense | 2 | 50 |
| `defense2` | Defense Drone II | defense | 3 | 70 |
| `antidrone` | Anti-Drone Drone | anti | 2 | 40 |
| `repair` | System Repair Drone | internal | 1 | 30 |
| `antip` | Anti-Personnel Drone | internal | 2 | 40 |
| `boarding` | Boarding Drone | boarding | 3 | 55 |
| `hullrep` | Hull Repair Drone | hull | 1 | 40 |

**Augments**: `scrapArm` (Scrapture Arm), `reloader` (Auto-Reloader), `booster` (Shield Charge Booster), `preigniter` (Weapon Pre-Igniter), `scanners` (Long-Range Scanners), `replicator` (Explosive Replicator), `recovery` (Drone Recovery Arm), `voltanShield` (Voltan Super Shield), `stealth` (Stealth Plating), `casing` (Titanium System Casing), `dna` (Backup DNA Bank), `pheromones` (Mantlis Pheromones), `gel` (Sloog Repair Gel), `fireSup` (Fire Suppression), `rockPlating` (Rock Plating), `ionField` (Reverse Ion Field).

**Enemies**
| id | name | tags | sectors | hull |
| --- | --- | --- | --- | --- |
| `rebuff_scout` | Rebuff Scout | rebuff | 1–3 | 8 |
| `rebuff_fighter` | Rebuff Fighter | rebuff | 1–8 | 10 |
| `rebuff_cloaker` | Rebuff Shade | rebuff | 3–8 | 10 |
| `rebuff_elite` | Rebuff Enforcer | rebuff | 5–8 | 14 |
| `pyrate_gunship` | Pyrate Gunship | pyrate | 1–8 | 11 |
| `pyrate_bomber` | Pyrate Boom-barge | pyrate | 2–8 | 11 |
| `auto_scoundrel` | Auto-Scoundrel | auto, enjinn | 1–8 | 9 |
| `auto_assault` | Auto-Assaulter | auto, rebuff | 4–8 | 12 |
| `mantlis_raider` | Mantlis Raider | mantlis | 3–8 | 10 |
| `voltan_peace` | Voltan Peacemonger | voltan | 3–8 | 10 |
| `pebble_brute` | Pebblekin Brute | pebblekin | 2–8 | 14 |
| `sloog_hacker` | Sloog Interloper | sloog | 3–8 | 10 |
| `sloog_mind` | Sloog Puppeteer | sloog | 3–8 | 10 |
| `enjinn_carrier` | Enjinn Dronecarrier | enjinn | 3–8 | 11 |
| `glass_sentinel` | Glass Sentinel | glass | 1–9 | 12 |

**Ships**: `pestrel` (The Pestrel), `redtale` (The Red Tale), `taurus` (The Taurus), `bortex` (The Bortex), `stone` (The Rolling Stone), `rockbottom` (The Rock Bottom), `zap` (The Zapjudicator), `voltface` (The Volt Face), `slime` (The Slime of War), `gastropod` (The Gastropod), `mantlis` (The Preying Mantlis), `basilisk` (The Basil-isk), `peekaboo` (The Peekaboo), `nowyoudont` (The Now-You-Don't), `glasscannon` (The Glass Cannon), `paneneck` (The Pane in the Neck).

## Balance guide
- Sector 1–2 enemies: 8–12 hull, 1 shield layer (2 shield power), 2–4 weapon power. Sectors 5–8: 12–18 hull; the game scales them up for you.
- Weapons: a tier-1 gun deals about 2 damage per 10 seconds for 1–2 power. Strong late guns reach 4–6 damage per volley for 3–4 power and cost 80–120 scrap.
- Event scrap: 10–25 for small finds, 30–50 for big ones, 60–80 only for quest finales. Fuel 1–4. Missiles 2–5.
- Risky choices: about 40–60% `chance`, with a `fail` that hurts (a fight, -2 to -5 hull, crew hurt) but does not end the run.
- Augment `fx` values stay small: 10–20% for one effect, or two effects at 5–10%.
- Give each sector 3–6 events tagged for it, and 1–3 enemies with its tag.

## Checklist before you answer
1. The JSON parses: double quotes, no comments, no trailing commas.
2. `"name"` is set, and every object has a unique, prefixed `id`.
3. Every referenced id exists in this mod or the reference lists.
4. Weapons have `type`, `charge` and `power`. Drones have `kind` and `power`. Races have `hp`. Ships and enemies have `hull` and `systems`. Events have `text` and choices with `text` plus `effect` or `chance` with `success` and `fail`.
5. Choices with `cost` also have a matching `req`.
6. `questOnly` events are reached from somewhere (`quest`, `event` or `later`).
7. Text is original and short.

## A complete small example

```json
{
  "name": "Harbour Lights",
  "version": "1.0",
  "author": "Example",
  "weapons": [
    { "id": "hl_flare", "name": "Flare Gun", "type": "laser", "damage": 1, "shots": 2, "charge": 11, "power": 2, "cost": 55, "tier": 2, "fire": 0.25, "desc": "Two bright bolts that often start fires." }
  ],
  "augments": [
    { "id": "hl_lamp", "name": "Harbour Lamp", "cost": 45, "desc": "Crew move 10% faster and heal slowly anywhere.", "fx": { "speed": 0.1, "heal": 0.3 } }
  ],
  "enemies": [
    { "id": "hl_smuggler", "name": "Harbour Smuggler", "tags": ["harbour"], "onlyTagged": true, "hull": 10, "sectors": [1, 8], "systems": { "shields": 2, "engines": 2, "weapons": 3, "oxygen": 1, "piloting": 1, "doors": 1 }, "weapons": ["hl_flare"], "crew": ["human", "sloog"] }
  ],
  "sectors": [
    { "id": "hl_harbour", "name": "Lantern Harbour", "blurb": "A busy port where everyone is smuggling something.", "intro": ["A thousand lights on a thousand docks."], "color": "#ffd27a", "mix": { "event": 50, "combat": 40, "empty": 10 }, "tags": ["harbour"], "enemyTags": ["harbour"], "hazards": { "asteroid": 0.05 }, "nebula": 0.1 }
  ],
  "events": [
    { "id": "hl_hail", "hail": "harbour", "text": "\"Harbour patrol. Just kidding. Hand over your cargo.\"", "choices": [
      { "text": "Fight.", "effect": { "begin": true } },
      { "text": "Pay a bribe (15 scrap).", "req": { "scrap": 15 }, "cost": { "scrap": 15 }, "effect": { "text": "They take it and wave you on.", "dismiss": true } }
    ] },
    { "id": "hl_lighthouse", "tags": ["harbour"], "art": "station", "text": "An old lighthouse keeper offers to sell you a map of the safe lanes.", "choices": [
      { "text": "Buy the map (20 scrap).", "req": { "scrap": 20 }, "cost": { "scrap": 20 }, "effect": { "text": "Every safe lane, marked in pencil.", "reveal": true } },
      { "text": "Ask about the smugglers.", "effect": { "text": "\"They keep a stash on the north rock.\"", "quest": "hl_stash" } },
      { "text": "Let {who} read her mind.", "req": { "race": "sloog" }, "effect": { "text": "{who} learns she is hiding a lamp of real value. She gives it to you, amused.", "augment": "hl_lamp" } }
    ] },
    { "id": "hl_stash", "questOnly": true, "art": "asteroid", "text": "The north rock. A smuggler ship sits on the stash.", "choices": [
      { "text": "Take it.", "effect": { "text": "They will not give it up quietly.", "fight": "hl_smuggler", "afterWin": { "text": "The stash is yours.", "scrap": 45, "weapon": "hl_flare" } } },
      { "text": "Leave them to it.", "effect": { "text": "Not your stash, not your problem." } }
    ] }
  ]
}
```
