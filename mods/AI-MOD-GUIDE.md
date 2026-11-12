# Vaster Than Life: mod-making guide for AI assistants

Give this whole file to an AI chat (Claude, ChatGPT, Gemini or any other), then describe the mod you want. The AI replies with one JSON file you load into the game.

**Player instructions**
1. Paste this guide into a new AI chat, or attach it as a file. Then describe the mod. Be specific about what you want to feel different: *"A frozen sector of ice pirates. Three weapons that slow things down. A story about a lost icebreaker over three beacons. A crew race made of snow."*
2. Save the AI's reply (only the JSON part) as a file ending in `.json`, for example `ice-pirates.json`. Or copy it.
3. In the game, open **Mods** (title screen) and use **Choose mod files**, or **Paste mod JSON**. On a Quest, take the headset off for this step.
4. The game checks the mod straight away. If it shows errors or "Check these" warnings, paste them back to the AI word for word and ask it to fix them. Repeat until it adds cleanly.
5. Mods apply to new runs. Everything a mod adds also appears in the in-game Wiki.

---

## Instructions for the AI

You are writing a mod for **Vaster Than Life**, a browser game inspired by *FTL: Faster Than Light*. The player commands a small starship across sectors of beacons, fighting enemy ships, meeting events, upgrading systems, trading goods, looking after a crew with personalities, and running from the Rebuff Fleet towards a final battle with the Flaggship. Mods are plain JSON read by the game's data loader. Follow these rules exactly: the game cannot read anything that isn't described here.

### Work in this order
1. **Plan before writing.** Decide the mod's theme in one sentence, choose a 2-4 letter id prefix, and list every id you will create (weapons, enemies, events...) with a one-line purpose. Decide how the parts connect: which sector tags the events and enemies use, which event leads to which.
2. **Write the JSON**, using only the fields in this guide and ids that exist (yours, or the Reference lists).
3. **Check it** against the checklist near the end, especially: every referenced id exists, every `questOnly` event is reached, every choice with `cost` can be afforded, the numbers sit inside the balance ranges.
4. **Answer** with the JSON in one code block and at most two short sentences outside it (what the mod adds, and one tip for trying it).

### How to answer
- Reply with **one JSON object** inside a single ```json code block. No comments inside the JSON (JSON doesn't allow them), no trailing commas, straight double quotes only, no `...` placeholders.
- Give the mod a `"name"` (required, unique), `"version"` and `"author"`.
- Start every new `id` with the prefix, such as `"ip_"` (`"ip_frostgun"`, `"ip_glacier"`), so it never clashes with the game or other mods. Reusing a base id on purpose replaces that base item; you only need the fields you change.
- Every id you reference must exist: in this mod, or in the Reference section.
- All names and text must be original. Do not copy names, characters, dialogue or text from FTL or any other game, book, show or film. Parody-adjacent puns are the game's tone (the enemies are the "Rebuff", the heroes the "Fedoration", pirates are "pyrates", a weapon is the "Hermies Missile").
- Write British English, plain and warm, with dry humour. Short sentences. No emoji in game text.
- Keep text short, because it appears in small panels: event `text` 1-4 sentences, choice `text` under 90 characters, outcome `text` 1-3 sentences, `desc` under 120 characters.
- If the player's request is huge, make a smaller mod that is complete and polished rather than a big one with gaps, and say what you left out.

### What makes a good mod for this game
- **Real decisions.** Every event should make the player think. Typical shape: a safe small reward, a risky bigger one (`chance` with a `fail` that stings), a blue option that needs something specific (a race, a quirk, a system level, a weapon type), and often a way to walk away.
- **Distinct mechanics, not bigger numbers.** A new weapon should do something the base guns don't (drain, pin, ricochet, salvage, warm up), not just "Heavy Laser but 3 damage". One trick per item, two at most.
- **Connect to what's there.** The game already has factions that remember you (`rep`), heat from the Rebuff (`heat`, `heatDrop`), trade goods and a cargo hold (`goods`, `req.goodsKind`), crew personalities (`req.quirk`), pets, ship scars, anomalies, story flags and delayed events. A mod that uses these feels part of the game.
- **Consequences that last.** Use `setFlag` plus a later event with `flag`, `later` to bring something back a few jumps on, `quest` to send the player to a beacon, `scar` for lasting damage, `rep` for a faction remembering. A three-beacon story beats ten unconnected one-offs.
- **Variety on replay.** `twist` lets one event come out differently each run. Several versions of a hail keep fights fresh.
- **Fair difficulty.** Losses should hurt (hull, crew health, scrap, a fight) but an event alone should never end a run. Free crew members and free weapons are rare treats.

## The file

```json
{
  "name": "My Mod",
  "version": "1.0",
  "author": "Your name",
  "rules": { },
  "races": [ ], "weapons": [ ], "drones": [ ], "augments": [ ], "traits": [ ],
  "ships": [ ], "enemies": [ ], "sectors": [ ], "events": [ ], "challenges": [ ],
  "arms": [ ], "items": [ ], "goods": [ ], "quirks": [ ],
  "campaign": { },
  "remove": { "events": [ "id-to-remove" ] }
}
```

Every list holds objects that each have an `"id"`. Leave out any list you don't need. Lists can also be written as objects keyed by id (`"weapons": { "ip_gun": { ... } }`); lists are clearer.

## Kinds of content (the schema)

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
| `food` | number | How much they eat: 1 normal, 0.5 light eaters, 1.3 big eaters, 0 never eat. Without it, races that need no air don't eat |
| `power` | number | Free power to the system in the room they stand in (1) |
| `deathBurst` | number | Damage to enemies in the room when they die (10–30) |
| `learn` | number | Skill learning speed (1–2) |
| `projected` | true/false | A projection (hologram): weapons with `disrupt` hurt them badly |
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
| `warm` | 0–0.3 | Warms up: charges this much faster after each shot, up to 3 times |
| `homing` | true | Never misses |
| `pin` | seconds | A hit stops the target dodging for this long |
| `splash` | number | A hit also damages a neighbouring room this much |
| `bounce` | number | A hit ricochets into another random room for this much |
| `crit` | 0–1 | Chance of double damage |
| `wild` | number | Each shot does a random 0 to (damage + wild) |
| `salvage` | number | Scrap gained each time it hits |
| `gas` | true | The room hit loses all its air |
| `fear` | true | Crew in the room hit panic and run |
| `toast` | number | Every shot heals your own crew this much |
| `decoy` | number | Every shot adds this much super shield to your ship (max 3) |
| `drain` | number | A hit locks this many bars of the system it hits |
| `disrupt` | number | Crew of a `projected` race (holograms) in the room it hits take this much damage and flicker out for 3 seconds |
| `color` | "#rrggbb" | Colour of its shots |
| `desc` | text | One line |

Give a weapon one special trick, two at most, so it feels different from the base guns. Lasers, ion and flak are stopped by shield layers (each shot removes one layer). Missiles and bombs ignore shields but use one missile each. Beams lose 1 damage per shield layer.

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
| `stun`, `fear` | Boarding drones: on landing, stun everyone in the room for this many seconds / make them panic and run |
| `desc` | One line |

### augments
| Field | Meaning |
| --- | --- |
| `id`, `name`, `cost` (30–100), `desc` | Required, the description must say what it does |
| `fx` | The effect. Any of: `charge`, `shield`, `repair`, `speed`, `dps`, `scrap`, `ionRes`, `sysRes`, `breachRes`, `ammo`, `evade`, `heal`, `superShield`, `reactor` |

`fx` values: `charge`, `shield`, `repair`, `speed`, `dps` and `scrap` are fractions (0.1 = 10% better, keep under 0.3). `ionRes`, `sysRes`, `breachRes` and `ammo` are chances from 0 to 1 (keep under 0.5). `evade` is extra evasion points (2–10). `reactor` is extra reactor power. Negative values are weaknesses: a trade-off augment pairs a big strength with a real cost, e.g. `{ "evade": 12, "breachRes": -0.6 }` (much harder to hit, but hits breach far more often) or `{ "charge": 0.25, "sysRes": -0.3 }` (faster guns, systems break more easily). `heal` is health per second for your crew anywhere (0.2–1). `superShield` is super-shield points at the start of every fight (1–5). Several augments add up. Example: `{"id":"px_lens","name":"Gunner's Lens","cost":55,"desc":"Weapons charge 10% faster.","fx":{"charge":0.1}}`

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
| `style` | Optional look: `fed`, `rebuff`, `enjinn`, `pebble`, `voltan`, `sloog`, `mantlis`, `stealth`, `glass`, `pyrate`, `auto`, `flag`, `hive` or `bug`. Leave it out and the game guesses from the name and class. Enemies can have one too |
| `systems` | Required: system id → level, e.g. `{"shields":2,"engines":2,"oxygen":1,"weapons":3,"medbay":1,"piloting":1,"sensors":1,"doors":1}` |
| `reserve` | Systems with an empty room ready to be bought later, e.g. `["drones","teleporter"]` |
| `weapons`, `drones`, `augments` | Starting gear (ids) |
| `crew` | Race ids, 2–4 of them |
| `fuel`, `missiles`, `parts` | Starting supplies (fuel 12–20, missiles 0–10, parts 0–8) |
| `pattern` | The layout as columns from tail to nose: `T` tail (1 room), `A` small + big + small (3 rooms), `B` two big rooms (2), `C` one big room (1), `D` two narrow rooms (2), `N` nose (1). Example `"TABAN"` = 8 rooms. It needs at least as many rooms as systems plus reserve |
| `lvl` | Optional: the pilot level needed (1-50). Pilot level comes from renown: level = 1 + √(renown/4) |
| `ch` | Optional challenge, every part must be met: `{"win":"shipId"}`, `{"wins":3}`, `{"sector":5}`, `{"kills":40}`, `{"ach":"achievementId"}`, `{"shipSector":["shipId",5]}` (reach sector 5 flying it), `{"shipKills":["shipId",25]}` (destroy 25 ships flying it) |
| `unlock` | Older form, still read when `lvl`/`ch` are missing: `{"sector":3}`, `{"win":"shipId"}`, `{"ach":"achievementId"}` or `{"kills":25}`. With none of these the ship is free from the start |

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
| `relentless` | true: never gives up and jumps away, even when neither ship can land a hit |
| `mirror` | true: copies the player's own weapons at the start of the fight |
| `style` | Optional look (see ships) |

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
| `title` | Optional heading for the event window (otherwise "Beacon", "Quest beacon", "Distress beacon" or "Incoming hail") |
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
| `req` | Only offered when this is met (same fields as a choice's `req`, plus `pet: true`), e.g. `{"race":"rd_hologram","scrap":70}` |
| `triggered` | true: reached by the game or a script, not by another event (silences the "nothing leads to it" warning) |
| `twist` | A list of event ids: each run picks one of them (by seed) whenever this event comes up, so the same encounter can go a different way next time. Give the versions `questOnly: true` |
| `hail` | Makes it a hail shown before fights with ships carrying this tag (see below) |
| `art` | Picture: `nebula`, `star`, `distress`, `station`, `creature`, `market`, `fleet`, `wreck`, `planet`, `glass`, `ship`, `space`, `asteroid` |

**A choice** has `text` and either an `effect`, or `chance` (0–1) with `success` and `fail` effects.
- `req` hides or locks the choice unless the player has it: `race` (a race id), `quirk` (a crew personality id), `system` with optional `level`, `weaponType`, `drone` (id or kind), `augment`, `pet` (true: the ship has a pet), `goodsKind` (something of that kind in the hold: `crop`, `meal`, `fish`, `trade`, `curio`...), `flag` / `noFlag` (a story flag), `scrap`, `fuel`, `missiles`, `parts`, `crewCount`. Race, quirk, pet, system and gear requirements are **blue options**: hidden when not met, highlighted when met. Add `"hide": true` to hide any other requirement when it isn't met.
- `{who}` in a choice's text and outcome is the crew member who meets its `race` or `quirk` requirement.
- `cost` takes `scrap`, `fuel`, `missiles` or `parts` when chosen. A choice the player can't afford is locked automatically; adding the matching `req` too is still good practice.

**An effect** can include:
- `text`: the outcome, 1–3 sentences
- Resources (negative to take away): `scrap` (5–60, scales with the sector), `fuel` (1–5), `missiles` (1–6), `parts` (1–6), `hull` (repair 2–10 or damage -1 to -6)
- Crew: `crew` (race id or `"random"`; use sparingly, at most one choice in an event), `crewLoss` (number), `crewHeal` (10–60), `crewHurt` (5–30), `xp` (`{"skill":"pilot","amt":15}`)
- Gear: `weapon`, `drone`, `augment` (an id or `"random"`)
- Ship: `install` (system id or `"random"`), `upgrade` (system id or `"random"`), `damageSystem` (system id or `"random"`), `reactor` (number), `maxHull` (number), `fire` (true: starts a fire)
- Story: `fight` (enemy id or `"random"`), `afterWin` (an effect applied if you win that fight), `event` (go straight to another event), `quest` (marks a beacon in this sector; arriving there opens that event), `later` (`{"event":"id","jumps":3}` opens an event a few jumps later), `store` (true: opens a store), `reveal` (true: reveals the sector map), `fleetPush` (moves the fleet: -0.06 is a good escape, 0.05 is a delay)
- Dialogue: `choices` (a new list of choices: the conversation goes on, as deep as you like), `setFlag` / `clearFlag` (story flags read by `flag`/`noFlag` on events)
- Lasting damage (an event can't end the run, but it can leave a mark): `scar` (`"random"`, a kind, or `{"kind":"locked","sys":"medbay","why":"…","need":{"goodsKind":"meal"}}`; kinds: `leaky` a room loses air, `jammed` a system loses a bar, `sparky` hits there start fires, `locked` the system is offline; a store's dockyard patches them, or hands over the `need`), `unscar` (1, a kind, or `"all"`), `downgrade` (a system id or `"random"`: one level lost for good), `reactor` (negative: bars lost for good)
- Cargo and garden: `goods` (`{"space_wine":2}`, negative to take; or `"loot"` for the enemy faction's goods), `seeds` (`{"ion_berry":3}` or `"random"`), `gardenBoost` (jumps of growth for every planted crop, 1-3)
- Crew kit: `arm` (personal weapon id, `"random"`, or a list), `item` (tonic id, `"random"`, or a list)
- Pets: `pet` (`"random"`, a kind, or `{"name":"Biscuit","kind":"kitten"}`; only if the ship has none)
- Heat (how hard the Rebuff hunt you, 0-100): `heat` (raise it, 5-20), `heatDrop` (lower it, 10-40)
- Anomalies (multi-sector situations, see Reference): `anom` (`{"fungus":1}` starts one, `{"fungus":null}` ends it). Use sparingly: they change the whole run
- Frontier: `longLight` (true: a "Relay home" button for this sector), `openExit` (true: the sector exit opens after the outcome, e.g. after getting past a blockade)
- Captain's log: `saga` (one line written into the run's story log, e.g. `"{crew} kept the strange egg."`)
- Meta: `unlock` (a ship id the player keeps for good: a big reward, use at most once per mod), `achievement` (a medal id)
- Factions: `rep` (`{"mantlis":15}` or `{"enemy":-20}` for the ship you are facing; factions: `mantlis`, `sloog`, `voltan`, `pyrate`, `enjinn`, `pebblekin`)
- Crew and gear: `convert` (`{"race":"glassborn","n":1}` or `{"race":"…","all":true}`: crew turn into another people, keeping names and skills), `loseAugment` (an augment id), `petEvo` (`fixer`, `ballistic`, `armoured`, `gourmet`), `eatGoods` (a goods kind taken from the hold)

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

### arms (personal weapons and armour for crew)
```json
{ "id": "px_blade", "name": "Ion Sabre", "kind": "blade", "dmg": 1.5, "dur": 60, "cost": 50, "tier": 2, "bleed": 3, "desc": "One line." }
```
`kind`: blunt, blade, gun, weird or suit. `dmg` multiplies melee damage (1.0 = bare hands, 2.0 = very strong). `dur` is how many seconds of fighting before it breaks. Tricks (pick one or two): `stun` (0–1 chance per second), `bleed` (damage per second for 4s), `knock` (chance to throw the foe out of the room), `reach` (0–1, guns: share of damage dealt to foes in neighbouring rooms), `fear`, `laugh`, `leech` (share of damage that heals the wielder), `heal` (heals friends in the room per second), `repair` and `fire` (multipliers on repairs and firefighting). Suits: `armor` (0–0.5, share of melee damage stopped), `vac` (breathe without air), `medpack` (heals that much once). Events can give kit with `"arm": "id"` or `"random"`.

**Loadout weapons.** Give a weapon a `cls` and it joins the loadout system (primary/secondary slots, attachments, weapon levels): `ar`, `smg`, `lmg`, `shotgun`, `marksman`, `special` (primary) or `pistol`, `launcher`, `melee` (secondary). The class sets the slot; `slot` ("primary" or "secondary") overrides it. Extra loadout fields: `crit` (0–0.25, chance of a critical hit), `quick` (0–0.6, extra damage in the first 3 seconds of a fight), `splash` (launchers: damage to every foe in the target room, once a fight), `ignite` (0–0.1, chance per second to start a fire), `slow` (true: hits slow the foe), `spd` (-0.2–0.2, movement speed while it is in hand). Keep `dmg` near the class's usual range: rifles 1.4–1.6, SMGs 1.3–1.4, LMGs 1.6–1.8, shotguns 1.9–2.2, marksman 1.1–1.3, pistols 1.2–1.35.
```json
{ "id": "px_ar", "name": "Glacier Carbine", "kind": "gun", "cls": "ar", "dmg": 1.5, "reach": 0.5, "dur": 90, "cost": 60, "tier": 2, "slow": true, "desc": "Frost rounds that slow whoever they hit." }
```

### items (tonics and treats for one crew member)
```json
{ "id": "px_tonic", "name": "Star Tonic", "kind": "perm", "cost": 40, "tier": 1, "dmg": 0.06, "desc": "One line." }
```
`kind`: perm (permanent `hp`, `dmg`, `rep`, `spd`, capped per person), train (`skill` and `xp`), buff (`buff`: {dmg, spd, rep} for `fights` fights), heal (`heal`, `cure`), treat (`hearts`). Events can give them with `"item": "id"` or `"random"`.

### campaign (optional object: a whole new story)

A mod with a `campaign` object is a complete alternative campaign. It only loads when the player picks it with the **Campaign** arrows in the hangar, so it can freely rename the Flaggship, replace the last sector and so on without touching the normal game. Put its ships, races, enemies, sectors and events in the usual lists of the same file.

```json
"campaign": {
  "id": "px_story",
  "title": "Shown in the hangar",
  "blurb": "One or two sentences for the hangar tooltip.",
  "color": "#ff6a5a",
  "ships": ["px_ship"],
  "crew": [ { "name": "Ada", "quirk": "optimist", "skills": { "pilot": 1 } } ],
  "host": "Who sends you off",
  "intro": "The opening briefing (2-5 sentences).",
  "giftLine": "One line inviting the player to pick a send-off gift.",
  "gifts": true,
  "fleet": "the pursuing fleet",
  "foe": "Enemy faction word",
  "boss": "the final enemy",
  "command": "what the boss is attacking",
  "start": "px_first_sector",
  "sectors": ["px_a", "px_b", "px_c"],
  "noTravellers": true,
  "eventBias": 6,
  "beats": { "2": "px_scene2", "3": ["px_scene3a", "px_scene3b"], "final": "px_last" },
  "bossLines": ["Said at phase 1", "Phase 2", "Phase 3"],
  "chatter": ["Short lines that pop up now and then while travelling."],
  "gear": { "weapons": ["px_gun"], "drones": [], "augments": ["px_aug"] },
  "recruits": ["human", "px_people"],
  "music": { "file": "px-theme.mid", "strange": ["px_b"], "cues": { "hangar": "lounge", "start": "rock", "explore": "musicbox", "strange": "eerie", "combat": "battle", "boss": "boss", "win": "victory" } },
  "win": { "title": "WIN TITLE", "text": "The ending, 2-5 sentences." },
  "lose": "One or two sentences shown when the run is lost."
}
```

| Field | Meaning |
| --- | --- |
| `id` | Unique id |
| `ships` | Only these ships can be flown (ids from "ships") |
| `crew` | Names the starting crew in order; skills 1 = skilled, 2 = expert |
| `host` | Title of the opening scene |
| `gifts` | False: no gift choice, just the briefing |
| `fleet` | Replaces "the Rebuff Fleet" in game text |
| `foe` | Replaces "Rebuff" |
| `boss` | Replaces "the Flaggship" |
| `command` | Replaces "Fedoration command" |
| `start` | Sector id for sector 1 |
| `sectors` | The only sector types offered at exits (at least 2) |
| `noTravellers` | No Mags, Kestrel or Doctor Oddly |
| `eventBias` | How much more often events tagged for your sectors come up |
| `beats` | A story event on entering each sector (questOnly events); a list picks one per run |
| `gear` | Your own gear: stores always stock some, half of all loot comes from it |
| `recruits` | The only peoples stores and events offer as crew |
| `music` | Optional: a MIDI file in mods/ played in a different arrangement at each moment (styles: lounge, rock, musicbox, eerie, battle, boss, victory) |
An event in a campaign can add someone by name to the crew with `"cmp": { "join": { "race": "human", "name": "Ada", "quirk": "bookworm", "sk": { "pilot": 1 } } }` in its effect. Mark enemy-only peoples `"secret": true` so they are never offered as crew. A campaign only meets the original game's events and its own, never the built-in content packs. To rename the final boss or the last sector, add an entry with the game's own id (`"flaggship"` in enemies, `"laststand"` in sectors) holding only the fields you change, such as `{ "id": "flaggship", "name": "The Death Ship" }`. Give your sectors their own `tags` and `enemyTags`, and tag your events and enemies to match: a campaign meets its own enemies wherever it has them.

### goods (cargo the player can carry, sell and give)
```json
{ "id": "ip_icewine", "name": "Glacier wine", "base": 28, "kind": "trade", "from": ["ip_glacier"], "want": ["pyrate", "voltan"], "desc": "Fermented in a comet. Served very cold." }
```
`kind`: `trade`, `curio` (rare, valuable), `crop`, `meal`, `fish`. `base` is the price in scrap (4-150; most trade goods 8-30). `from`: sector ids where it is cheap and sold, `want`: sector ids that pay more. `illegal: true` for contraband (patrols may search for it). Hand it out with the `goods` effect, and use it in `req.goodsKind` choices.

### quirks (crew personalities)
`{ "id": "ip_stoic", "name": "Stoic", "desc": "Has never once complained about the cold." }`. New quirks are rolled for recruits and can be used in `req.quirk` choices; they have no built-in behaviour beyond that, so give them events.

### remove
`{"events":["id"], "weapons":["id"]}` removes base content by id.

### script (advanced, usually not needed)
A string of JavaScript run when the player allows mod scripts in Settings. It receives `VTL` with `on(event, fn)` (events: `runStart`, `arrive`, `event`, `combatStart`, `combatEnd`, `fire`, `tick`, `runEnd`), `toast(text)`, `applyEffect(effect)`, `startCombat(id)`, `giveWeapon(id)`, `addEvent(id, event)`, `rand`, `pick`, and live `G`, `DATA`, `UI`. Prefer data (events, augments with `fx`) over scripts.

## Patterns that work (copy and adapt)

These snippets are fragments of an `events` list unless said otherwise.

**1. The classic three-way choice**: safe, risky, blue.
```json
{ "id": "ip_derelict", "title": "Frozen derelict", "tags": ["ip_ice"], "art": "wreck", "text": "A freighter hangs in the dark, iced over from nose to tail. Something inside is still blinking.", "choices": [
  { "text": "Strip the hull plating and go.", "effect": { "text": "Cold work, but honest. The plating sells.", "scrap": 18 } },
  { "text": "Cut into the cargo hold.", "chance": 0.55,
    "success": { "text": "Crates of glacier wine, perfectly chilled.", "goods": { "ip_icewine": 3 }, "scrap": 10 },
    "fail": { "text": "The hold was holding back a lot of very cold air. {crew} gets frostbite.", "crewHurt": 20, "hull": -2 } },
  { "text": "Let {who} warm the airlock.", "req": { "race": "pebblekin" }, "effect": { "text": "{who} glows red and the ice slides off. Inside: a spare drone and a thank-you note.", "drone": "random", "parts": 2 } },
  { "text": "Leave it be.", "effect": { "text": "Some wrecks are better left frozen." } } ] }
```

**2. A quest across beacons**: `quest` marks a beacon on this sector's map; arriving there opens the event.
```json
{ "id": "ip_map", "tags": ["ip_ice"], "art": "station", "text": "An old ice miner sells you a chart with one beacon circled twice.", "choices": [
  { "text": "Buy it (15 scrap).", "req": { "scrap": 15 }, "cost": { "scrap": 15 }, "effect": { "text": "\"Don't wake the big one,\" he says.", "quest": "ip_cache" } },
  { "text": "No thanks.", "effect": { "text": "He shrugs and goes back to his soup." } } ] },
{ "id": "ip_cache", "questOnly": true, "art": "asteroid", "title": "The circled beacon", "text": "A cache in the ice, and an icebreaker drone parked on top of it.", "choices": [
  { "text": "Clear it out.", "effect": { "text": "The drone wakes up.", "fight": "ip_icebreaker", "afterWin": { "text": "The cache is yours.", "scrap": 40, "weapon": "ip_frostgun" } } },
  { "text": "Back away quietly.", "effect": { "text": "Not today." } } ] }
```

**3. A consequence that comes back**: `setFlag` now, `later` brings an event a few jumps on, `flag` checks what you did.
```json
{ "id": "ip_stowaway", "tags": ["ip_ice"], "text": "A shivering kid is hiding in your cargo bay.", "choices": [
  { "text": "Let her stay till the next port.", "effect": { "text": "She eats everything and fixes the toaster.", "setFlag": "ip_kid", "later": { "event": "ip_kid_back", "jumps": 4 } } },
  { "text": "Hand her to the port authority.", "effect": { "text": "She doesn't look back.", "rep": { "voltan": -5 } } } ] },
{ "id": "ip_kid_back", "questOnly": true, "flag": "ip_kid", "text": "A message from the kid: her family runs a shipyard, and they want to say thank you.", "choices": [
  { "text": "Accept, gratefully.", "effect": { "text": "They patch your hull and won't take a penny.", "hull": 8, "unscar": 1 } } ] }
```

**4. A conversation**: an effect's `choices` continues the scene without leaving it.
```json
{ "text": "Ask what she's running from.", "effect": { "text": "\"Debt collectors,\" she says. \"Big ones.\"", "choices": [
  { "text": "Offer to pay it off (40 scrap).", "req": { "scrap": 40 }, "cost": { "scrap": 40 }, "effect": { "text": "She cries a bit. So does {crew}.", "rep": { "pyrate": 10 } } },
  { "text": "Wish her luck.", "effect": { "text": "\"Luck,\" she snorts. \"Right.\"" } } ] } }
```

**5. A hail**: shown when a fight starts with a ship carrying that tag. `begin` starts the fight, `dismiss` ends it peacefully.
```json
{ "id": "ip_hail_toll", "hail": "ip_ice", "text": "\"Ice toll. Ten scrap or we cut your engines out.\"", "choices": [
  { "text": "Pay the toll (10 scrap).", "cost": { "scrap": 10 }, "effect": { "text": "They wave you through, grinning.", "dismiss": true } },
  { "text": "Have {who} explain the toll is illegal.", "req": { "quirk": "bookworm" }, "effect": { "text": "{who} quotes three regulations. They leave out of sheer boredom.", "dismiss": true } },
  { "text": "Open fire.", "effect": { "begin": true } } ] }
```
Write two or three hails per tag: the game rotates them so fights don't start the same way twice.

**6. A twist**: one encounter, a different truth each run. When the game picks the base event, it shows one of the `twist` versions instead (chosen by the run's seed). The base event still needs valid `text` and `choices` (they are a fallback). Give the versions `questOnly: true` and the same opening, so the player can't tell which one they've got.
```json
{ "id": "ip_signal", "tags": ["ip_ice"], "text": "A distress call from inside a comet.", "choices": [ { "text": "Investigate.", "effect": { "text": "Nothing but ice." } } ], "twist": ["ip_signal_real", "ip_signal_trap"] },
{ "id": "ip_signal_real", "questOnly": true, "text": "A distress call from inside a comet. A voice, faint: \"Please. We're nearly out of air.\"", "choices": [
  { "text": "Drill them out.", "effect": { "text": "Three miners tumble out, gasping and grateful.", "crew": "random", "fuel": -1 } },
  { "text": "Mark it for the authorities.", "effect": { "text": "You log the location and move on.", "rep": { "voltan": 5 } } } ] },
{ "id": "ip_signal_trap", "questOnly": true, "text": "A distress call from inside a comet. A voice, faint: \"Please. We're nearly out of air.\"", "choices": [
  { "text": "Drill them out.", "effect": { "text": "The comet splits open. It was a pirate hide all along.", "fight": "ip_frostjaw" } },
  { "text": "Mark it for the authorities.", "effect": { "text": "You log it. Later you hear the authorities found a pirate nest there.", "scrap": 15 } } ] }
```

**7. A cargo or crew check**: blue options for what's in the hold or who's aboard.
```json
{ "text": "Offer them something hot to eat.", "req": { "goodsKind": "meal" }, "effect": { "text": "They've never tasted stew. They'd follow you anywhere.", "eatGoods": "meal", "rep": { "sloog": 15 } } }
```

**8. A faction that remembers.** Use `rep` with `mantlis`, `sloog`, `voltan`, `pyrate`, `enjinn` or `pebblekin` (or `enemy` for the ship you're facing). Revered factions give discounts and allies, and despised ones come in hot. Good for choices about mercy, trade and loyalty.

**9. A sector with an identity**: its own tags, enemies that only appear there, 4-8 events tagged for it, and at least one hail.
```json
{ "id": "ip_glacier", "name": "The Glacier Belt", "blurb": "Frozen comets, frozen wrecks, and pirates who wear three coats.", "intro": ["Frost creeps across the viewport.", "Everything out here is cold, slow and patient."], "color": "#a8e6ff", "mix": { "event": 48, "combat": 38, "empty": 14 }, "tags": ["ip_ice"], "enemyTags": ["ip_ice"], "hazards": { "asteroid": 0.12 }, "nebula": 0.15, "fleetMult": 0.9 }
```

## Balance guide
- **Enemies.** Sectors 1-2: 8-12 hull, 1 shield layer (2 shield power), 2-4 weapon power. Sectors 5-8: 12-18 hull. The game adds hull, system levels and a gun or two in later sectors, so write the sector-1 version. Give each `sectors` range at least 3 sectors.
- **Weapons.** Look at the measured numbers in the Reference: tier 1 is about 1.2 damage per 10 s per power, tier 3 about 0.7 (bigger volleys, slower). A new gun should sit near its tier's line. Pay for tricks with less damage or a longer charge. Missiles and bombs cost ammo, so they can hit harder.
- **Drones.** Attack drones: 1-2 damage every 3-7 s for 2-4 power. Defence drones: rate 2-3 s.
- **Augments.** `fx` 10-20% for one effect, or two at 5-10%. Trade-offs can go bigger with a real cost.
- **Ships.** 20-35 hull, reactor 6-10, 3-4 crew, about 4-5 power of starting weapons. Unlocks: `lvl` 2-26 and a `ch` that fits the ship (a boarding ship: `shipKills`; a stealth ship: reach a late sector).
- **Event scrap.** Small finds 10-25, solid finds 25-45, big risky payoffs or quest finales 50-80. Fuel 1-4. Missiles 2-5. Parts 1-3. Hull repair 3-8.
- **Risk.** `chance` 0.4-0.65. A `fail` costs something real (hull -2 to -5, crewHurt 15-30, a fight, scrap) but never ends the run.
- **Rewards.** A free weapon, augment or crew member at most once or twice per mod, behind a risk, a cost or a fight. `"random"` gear is fine for treasure.
- **Sectors.** 3-8 events tagged for each new sector, 1-3 enemies with its tag, and hazards totalling under 0.5.

## Common mistakes (and the fix)
| Wrong | Right |
| --- | --- |
| `"damage": "2"` (a string) | `"damage": 2` |
| `"effect": { "scrap": 20 }` with no text | always include `"text"` in an effect so the player knows what happened |
| `"fight": "pirate_ship"` (made-up id) | use an id from the Reference or one defined in your mod |
| a `questOnly` event nothing points to | reach it with `quest`, `event`, `later`, `twist` or a campaign beat |
| `"chance": 0.5, "effect": {...}` | `chance` needs `success` and `fail`, not `effect` |
| `"req": { "race": "Human" }` | ids are lower case: `"human"` |
| `"tags": "ip_ice"` | lists stay lists: `"tags": ["ip_ice"]` |
| an enemy with `"crew": []` and no `"auto": true` | an empty crew needs `"auto": true` (an automated ship) |
| `"fx": { "damage": 0.2 }` | augment `fx` keys are listed in the augments section (`dps`, `charge`...) |
| a sector whose `tags` match no events | tag 3+ events with the sector's tag, or it will feel generic |
| a new weapon nobody can get | sell it (`tier`, `cost`), give it in an event, or put it on an enemy ship |
| comments, `...`, or two JSON objects | one JSON object, complete, no comments |

## Checklist before you answer
1. The JSON parses: double quotes, no comments, no trailing commas, no placeholders.
2. `"name"` is set, and every object has a unique, prefixed `id`.
3. Every referenced id exists in this mod or the Reference: weapons, drones, augments and crew on ships and enemies; `fight`, `weapon`, `drone`, `augment`, `arm`, `item`, `goods`, `event`, `quest`, `later.event`, `twist`, `req.race`, `req.quirk`, campaign `ships`, `start`, `sectors` and `beats`.
4. Required fields: weapons `type`, `charge`, `power`; drones `kind`, `power`; races `hp`; new ships and enemies `hull`, `systems`; events `text` plus choices with `text` and either `effect`, or `chance` with `success` and `fail`.
5. Every `questOnly` event is reached from somewhere (or marked `"triggered": true`).
6. Each new sector has events and enemies tagged for it; each new enemy tag has a hail or two.
7. Numbers sit inside the balance ranges.
8. Text is original, short, and in the game's voice.

When the player pastes back the game's warnings, fix exactly what each one says and return the whole corrected JSON.

### What the game's warnings mean
- *"X was not added"*: a required field is missing or the wrong type. The message names the item and field.
- *"the game doesn't use "Y""*: a misspelt or invented field. Rename it to a real one or remove it.
- *"unknown effect "Y""*: an effect key that doesn't exist. See the effect list.
- *"there is no weapon "Y""* (or enemy, event, race...): a broken reference. Define it or use an existing id.
- *"is questOnly, but nothing in this mod leads to it"*: an unreachable event.
- *"much stronger than any base gun"* or *"outside the usual"*: a balance warning. Bring the numbers back into range.


## Reference: what already exists

Use these ids freely. Items marked with a pack name come from a built-in content pack: they are in every normal run, but not inside campaign mods.

**Systems**: `shields`, `engines`, `oxygen`, `weapons`, `drones`, `medbay`, `clonebay`, `teleporter`, `cloaking`, `hacking`, `mindcontrol`, `piloting`, `sensors`, `doors`, `battery`. Subsystems (no reactor power): `piloting`, `sensors`, `doors`, `battery`. Highest levels: shields 8, engines 8, oxygen 3, weapons 8, drones 8, medbay 3, clonebay 3, teleporter 3, cloaking 3, hacking 3, mindcontrol 3, piloting 3, sensors 3, doors 3, battery 2.

**Skills** (for `xp`): `pilot`, `engines`, `shields`, `weapons`, `repair`, `combat`.

**Weapon types**: `laser`, `missile`, `ion`, `beam`, `flak`, `bomb`. **Drone kinds**: `attack`, `defense`, `anti`, `internal`, `boarding`, `hull`.

### Weapons

Damage × shots, charge in seconds. Items marked with a pack name come from a built-in content pack (always available outside campaigns).

| id | name | type | dmg × shots | charge | power | cost | tier | tricks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `pike` | Pike Bream | beam | 1 × 1 | 16 | 2 | 50 | 1 | rooms 2 |
| `bm_scalpel` | Scalpel Beam *(Beam Masters)* | beam | 1 × 1 | 9 | 1 | 40 | 1 | rooms 1 |
| `halbird` | Hal-Bird Beam | beam | 2 × 1 | 17 | 3 | 65 | 2 | rooms 2 |
| `bonfire` | Bonfire Beam | beam | 0 × 1 | 20 | 2 | 50 | 2 | fire 60%, rooms 3 |
| `biobeam` | Anti-Bio-Logical Beam | beam | 0 × 1 | 16 | 2 | 50 | 2 | crewDamage 45, rooms 3 |
| `leech_beam` | Leech Beam | beam | 1 × 1 | 16 | 3 | 65 | 2 | rooms 2, drain 2 |
| `hullcutter` | Hull Cutter *(Frontier Arsenal)* | beam | 2 × 1 | 15 | 2 | 85 | 2 | breach 30%, rooms 3 |
| `bm_twin` | Twin Pike Beam *(Beam Masters)* | beam | 1 × 1 | 14 | 3 | 70 | 2 | rooms 3 |
| `bm_inferno` | Inferno Beam *(Beam Masters)* | beam | 1 × 1 | 18 | 2 | 60 | 2 | fire 50%, rooms 2 |
| `bm_reaper` | Reaper Beam *(Beam Masters)* | beam | 0 × 1 | 18 | 2 | 60 | 2 | crewDamage 60, rooms 3 |
| `gf_wail` | Wailing Beam *(The Ghost Fleet)* | beam | 1 × 1 | 15 | 2 | 60 | 2 | crewDamage 15, rooms 2 |
| `ca_prismbeam` | Prism Beam *(Crystal Arsenal)* | beam | 1 × 1 | 14 | 2 | 75 | 2 | pierce 1, rooms 4 |
| `glaive` | Glaive Bream | beam | 3 × 1 | 25 | 4 | 95 | 3 | rooms 3 |
| `prism_lance` | Prism Lance | beam | 2 × 1 | 15 | 3 | 90 | 3 | rooms 3, crit 20% (event only) |
| `bm_lance` | Dawn Lance *(Beam Masters)* | beam | 2 × 1 | 20 | 3 | 80 | 3 | rooms 3 |
| `pv_phase` | Phase Beam *(Precursor Vaults)* | beam | 2 × 1 | 18 | 3 | 100 | 4 | pierce 1, rooms 3 |
| `smallbomb` | Small Bomb | bomb | 0 × 1 | 11 | 1 | 45 | 1 | sysDamage 1 |
| `pk_grapple` | Grapple Bomb *(Pyrate Kings)* | bomb | 0 × 1 | 11 | 1 | 40 | 1 | stun 3, crewDamage 12 |
| `firebomb` | Fire Bomb | bomb | 0 × 1 | 15 | 2 | 50 | 2 | fire 1, crewDamage 15 |
| `breachbomb` | Breach Bomb | bomb | 0 × 1 | 17 | 1 | 50 | 2 | breach 1, sysDamage 2 |
| `healbomb` | Heal-ium Burst | bomb | 0 × 1 | 15 | 1 | 40 | 2 | heal 40 |
| `choke_bomb` | Choke Bomb | bomb | 0 × 1 | 13 | 2 | 55 | 2 | crewDamage 10, pin 5, gas |
| `stunbomb` | Shock Bomb *(Frontier Arsenal)* | bomb | 0 × 1 | 17 | 2 | 80 | 2 | stun 6, crewDamage 10, sysDamage 1 |
| `mender` | Mender Burst *(Frontier Arsenal)* | bomb | 0 × 1 | 14 | 1 | 60 | 2 | heal 2 |
| `ia_static` | Static Bomb *(Ion Arsenal)* | bomb | 0 × 1 | 14 | 1 | 45 | 2 | ion 3 |
| `ho_thermite` | Thermite Bomb *(Heavy Ordnance)* | bomb | 0 × 1 | 14 | 2 | 55 | 2 | fire 1, crewDamage 20 |
| `bh_netbomb` | Net Bomb *(Bounty Hunters)* | bomb | 0 × 1 | 13 | 1 | 45 | 2 | stun 8, sysDamage 1 |
| `bp_stunbomb` | Stun Bomb *(Boarding Party)* | bomb | 0 × 1 | 12 | 1 | 45 | 2 | stun 6, crewDamage 10 |
| `bp_gasbomb` | Knockout Gas Bomb *(Boarding Party)* | bomb | 0 × 1 | 14 | 1 | 50 | 2 | crewDamage 30 |
| `ca_resonator` | Resonator Bomb *(Crystal Arsenal)* | bomb | 0 × 1 | 15 | 1 | 55 | 2 | stun 4, sysDamage 2 |
| `ionbomb` | Ion Bomb | bomb | 0 × 1 | 22 | 1 | 55 | 3 | ion 4, crewDamage 15, sysDamage 1 |
| `ho_cracker` | Hull Cracker Bomb *(Heavy Ordnance)* | bomb | 0 × 1 | 20 | 2 | 65 | 3 | breach 1, sysDamage 3 |
| `cannon` | Broadside Cannon *(Space Pirates Ahoy)* | flak | 1 × 4 | 15 | 2 | 70 | - | radius 1 |
| `flak1` | Flak-o I | flak | 1 × 3 | 10 | 2 | 65 | 2 | radius 1 |
| `scatterflak` | Scatter Flak *(Frontier Arsenal)* | flak | 1 × 5 | 15 | 2 | 75 | 2 | radius 1 |
| `flak2` | Flak-o II | flak | 1 × 7 | 21 | 3 | 80 | 3 | radius 2 |
| `ion` | Ion Blast | ion | 1 × 1 | 8 | 1 | 30 | 1 |  |
| `ia_dart` | Ion Dart *(Ion Arsenal)* | ion | 1 × 1 | 7 | 1 | 35 | 1 | stun 4 |
| `wf_snowball` | Snowball Launcher *(Winterfest)* | ion | 1 × 2 | 14 | 1 | 40 | 1 |  |
| `ss_wail` | Banshee Wail *(Spooky Season)* | ion | 1 × 1 | 9 | 1 | 35 | 1 | stun 3 |
| `ion2` | Heavy Ion | ion | 2 × 1 | 13 | 1 | 45 | 2 |  |
| `ionstun` | Ion Stunner | ion | 1 × 1 | 10 | 1 | 35 | 2 | stun 10 |
| `stormcoil` | Storm Coil *(Frontier Arsenal)* | ion | 1 × 2 | 12 | 2 | 70 | 2 | ion 2 |
| `ia_repeater` | Ion Repeater *(Ion Arsenal)* | ion | 1 × 2 | 11 | 2 | 55 | 2 |  |
| `rc_suppressor` | Suppressor Ion *(Rebuff Crackdown)* | ion | 1 × 2 | 12 | 2 | 55 | 2 |  |
| `nr_static` | Static Caster *(Nebula Runners)* | ion | 2 × 1 | 11 | 2 | 55 | 2 |  |
| `rd_patrolion` | Patrol Ion *(Rebuff Defectors)* | ion | 1 × 2 | 12 | 2 | 55 | 2 |  |
| `ia_lance` | Ion Lance *(Ion Arsenal)* | ion | 3 × 1 | 18 | 2 | 70 | 3 |  |
| `vl_arc` | Arc Thrower *(Voltan Lightworks)* | ion | 1 × 3 | 14 | 2 | 70 | 3 |  |
| `basic` | Basic Laser | laser | 1 × 1 | 10 | 1 | 20 | 1 |  |
| `bust1` | Bust Laser I | laser | 1 × 2 | 11 | 2 | 50 | 1 |  |
| `heavy1` | Heavy Laser I | laser | 2 × 1 | 9 | 1 | 55 | 1 | fire 30%, breach 21% |
| `bust2` | Bust Laser II | laser | 1 × 3 | 12 | 2 | 80 | 2 |  |
| `heavy2` | Heavy Laser II | laser | 2 × 2 | 13 | 3 | 65 | 2 | fire 20%, breach 20% |
| `duel` | Duel Lasers | laser | 1 × 4 | 16 | 3 | 70 | 2 |  |
| `spore_cannon` | Spore Cannon | laser | 1 × 2 | 11 | 2 | 60 | 2 | crewDamage 15, fear (event only) |
| `hardlight_disruptor` | Hard-Light Disruptor | laser | 1 × 1 | 10 | 1 | 40 | 2 | disrupt 35 |
| `bh_tagger` | Tagger Laser *(Bounty Hunters)* | laser | 1 × 2 | 9 | 2 | 60 | 2 |  |
| `rc_enforcer` | Enforcer Laser *(Rebuff Crackdown)* | laser | 2 × 1 | 10 | 2 | 60 | 2 | breach 15% |
| `nr_flare` | Flare Laser *(Nebula Runners)* | laser | 1 × 2 | 11 | 2 | 60 | 2 | fire 30% |
| `wf_icicle` | Icicle Lance *(Winterfest)* | laser | 2 × 1 | 13 | 2 | 65 | 2 | pierce 1 |
| `ca_shard` | Shard Lance *(Crystal Arsenal)* | laser | 1 × 2 | 12 | 2 | 70 | 2 | pierce 1 |
| `vl_glow` | Glow Laser *(Voltan Lightworks)* | laser | 1 × 3 | 13 | 3 | 70 | 2 | ion 1 |
| `bust3` | Bust Laser III | laser | 1 × 5 | 19 | 4 | 95 | 3 |  |
| `chainlaser` | Chain Laser *(Frontier Arsenal)* | laser | 1 × 4 | 14 | 3 | 95 | 3 |  |
| `lancer` | Plasma Lance *(Frontier Arsenal)* | laser | 3 × 1 | 17 | 3 | 110 | 3 | fire 25% |
| `pk_broadside` | Broadside Battery *(Pyrate Kings)* | laser | 1 × 4 | 15 | 3 | 75 | 3 | fire 10% |
| `ca_heavyshard` | Heavy Shard *(Crystal Arsenal)* | laser | 3 × 1 | 16 | 3 | 95 | 3 | breach 30%, pierce 1 |
| `pv_prism` | Prism Lance *(Precursor Vaults)* | laser | 1 × 3 | 13 | 3 | 95 | 4 | pierce 1 |
| `lego` | Lego Missile | missile | 1 × 1 | 9 | 1 | 30 | 1 | fire 10%, breach 9% |
| `arty` | Arty Missile | missile | 2 × 1 | 11 | 1 | 38 | 1 | fire 10%, breach 9% |
| `ho_dart` | Needle Missile *(Heavy Ordnance)* | missile | 1 × 1 | 7 | 1 | 25 | 1 |  |
| `hermies` | Hermies Missile | missile | 3 × 1 | 14 | 3 | 45 | 2 | fire 30%, breach 50% |
| `ho_cluster` | Cluster Missile *(Heavy Ordnance)* | missile | 1 × 3 | 15 | 2 | 60 | 2 | breach 10% |
| `ho_shock` | Concussion Missile *(Heavy Ordnance)* | missile | 2 × 1 | 14 | 2 | 55 | 2 | stun 5 |
| `pk_chainshot` | Chain Shot *(Pyrate Kings)* | missile | 2 × 1 | 12 | 1 | 55 | 2 | breach 50%, sysDamage 1 |
| `ss_pumpkin` | Pumpkin Mortar *(Spooky Season)* | missile | 2 × 1 | 12 | 1 | 45 | 2 | fire 50% |
| `breachm` | Breach Missile | missile | 4 × 1 | 22 | 3 | 65 | 3 | breach 90% |
| `pegasaurus` | Pegasaurus Missile | missile | 2 × 2 | 20 | 3 | 60 | 3 | breach 20% |
| `swarm` | Cluster Rockets *(Frontier Arsenal)* | missile | 1 × 3 | 13 | 2 | 90 | 3 | pierce 1 |
| `ho_torpedo` | Siege Torpedo *(Heavy Ordnance)* | missile | 4 × 1 | 23 | 3 | 75 | 3 | fire 20%, breach 60% |

### Drones

| id | name | kind | power | cost | notes |
| --- | --- | --- | --- | --- | --- |
| `combat1` | Combat Drone I | attack | 2 | 50 | laser 1 every 4s |
| `combat2` | Combat Drone II | attack | 4 | 75 | laser 1 every 2.3s |
| `beamd` | Beam Drone I | attack | 2 | 50 | beam 1 every 6.5s |
| `iond` | Ion Drone | attack | 2 | 45 | ion 1 every 5s |
| `defense1` | Defense Drone I | defense | 2 | 50 | stops missile/hack/bdrone |
| `defense2` | Defense Drone II | defense | 3 | 70 | stops missile/hack/bdrone/laser/ion/flak/asteroid |
| `antidrone` | Anti-Drone Drone | anti | 2 | 40 |  |
| `repair` | System Repair Drone | internal | 1 | 30 | repair |
| `antip` | Anti-Personnel Drone | internal | 2 | 40 | fight |
| `boarding` | Boarding Drone | boarding | 3 | 55 |  |
| `hullrep` | Hull Repair Drone | hull | 1 | 40 | heals 4 |
| `shock_boarder` | Shock Boarder | boarding | 3 | 70 | stun 4, fear |
| `parrotdrone` | Parrot Drone *(Space Pirates Ahoy)* | attack | 2 | 45 | laser 1 every 3.5s |
| `gnat` | Gnat Drone *(Frontier Arsenal)* | attack | 1 | 35 | laser 1 every 4.5s |
| `lancedrone` | Lance Drone *(Frontier Arsenal)* | attack | 3 | 70 | laser 2 every 6s |
| `shieldwall` | Wall Drone *(Frontier Arsenal)* | defense | 2 | 50 | stops missile |
| `fixbot` | Fixer Drone *(Frontier Arsenal)* | internal | 2 | 45 | repair |
| `ia_wasp` | Ion Wasp Drone *(Ion Arsenal)* | attack | 2 | 50 | ion 1 every 4.5s |
| `ia_screen` | Static Screen Drone *(Ion Arsenal)* | defense | 2 | 55 | stops ion/laser/bdrone |
| `bm_cutter` | Cutter Drone *(Beam Masters)* | attack | 2 | 55 | beam 1 every 6s |
| `dh_hornet` | Hornet Drone *(Drone Hive)* | attack | 3 | 60 | laser 1 every 3.2s |
| `dh_spark` | Spark Drone *(Drone Hive)* | attack | 2 | 45 | ion 1 every 4.4s |
| `dh_aegis` | Aegis Drone *(Drone Hive)* | defense | 3 | 65 | stops missile/laser/bdrone/hack |
| `dh_mender` | Mender Bot *(Drone Hive)* | internal | 1 | 35 | repair |
| `dh_bruiser` | Bruiser Bot *(Drone Hive)* | internal | 2 | 45 | fight |
| `dh_patcher` | Hull Patcher *(Drone Hive)* | hull | 2 | 55 | heals 6 |
| `dh_lancer` | Lancer Boarding Drone *(Drone Hive)* | boarding | 3 | 60 |  |
| `pv_sentinel` | Vault Sentinel *(Precursor Vaults)* | defense | 2 | 80 | stops missile/hack/bdrone |
| `bp_raider` | Raider Drone *(Boarding Party)* | boarding | 2 | 65 |  |
| `bp_bouncer` | Bouncer Drone *(Boarding Party)* | internal | 1 | 45 | fight |
| `ca_facet` | Facet Drone *(Crystal Arsenal)* | attack | 2 | 70 | laser 1 every 5s |

### Augments

| id | name | cost | what it does |
| --- | --- | --- | --- |
| `scrapArm` | Scrapture Arm | 50 | Collect 10% more scrap. |
| `reloader` | Brisk Reloader | 50 | Weapons charge 10% faster. |
| `booster` | Shield Kettle | 55 | Shield layers recharge 15% faster. |
| `preigniter` | Warm-Up Coils | 90 | Weapons start every fight fully charged. |
| `scanners` | Nosy Neighbour Array | 40 | See ships and hazards at every beacon on the map. |
| `replicator` | Two-For-One Printer | 55 | 33% chance a missile or drone part is not used up. |
| `recovery` | Drone Fetching Claw | 60 | Deploying drones costs no drone parts. |
| `voltanShield` | Voltan Super Shield | 85 | A 5-point super shield that blocks anything at the start of every fight. |
| `stealth` | Stealth Plating | 45 | +5% evasion. |
| `casing` | Bubble-Wrap Casing | 60 | 15% chance to shrug off system damage. |
| `dna` | Spare Crew Gene Vault | 50 | Keeps a fresh copy of everyone aboard. Crew killed in a fight are cloned back once it ends, slightly damp. |
| `pheromones` | Mantlis Pheromones | 40 | Crew move 25% faster. |
| `gel` | Sloog Repair Gel | 40 | Your crew slowly heal anywhere. |
| `fireSup` | Sprinkler Ceiling | 45 | Crew put out fires twice as fast. |
| `rockPlating` | Pebblekin Plating | 45 | Halves the chance of hull breaches. |
| `ionField` | Ion Brolly | 50 | 20% chance to ignore ion damage. |
| `reckless_drive` | Reckless Overdrive | 70 | Weapons charge 25% faster and crew move 25% faster. Systems break more easily and hits breach the hull 40% mo… |
| `caffeine_line` | Caffeine Drip-Line | 45 | Crew move 30% faster. Their hands shake: repairs are 20% slower. |
| `glass_plating` | Glass-Fibre Plating | 60 | +12% evasion. Every hit that lands is 60% more likely to breach. |
| `sympathetic_shields` | Sympathetic Shields | 55 | Crew slowly heal anywhere on the ship. The shield harmonics make you easier to hit: -6% evasion. |
| `blood_reactor` | Blood Reactor | 65 | +3 reactor power. It feeds on the crew: everyone loses 6 health every jump. |
| `scrap_furnace` | Scrap Furnace | 50 | 35% more scrap. It hogs the coolant: weapons charge 12% slower. |
| `berserker_loop` | Berserker Loop | 55 | Crew hit 50% harder hand to hand. They hate fiddly work: repairs 30% slower. |
| `mirror_hull` | Mirror Hull | 60 | Shields recharge 35% faster. A shiny ship is easy to see: -8% evasion. |
| `still_lattice` | Lattice of Stillness | - | Lent by Voltan pilgrims: 4 points of super shield at the start of every fight. They will take it back if you … (event only) |
| `singing_shard` | Singing Shard | 80 | A tame piece of the crystal: 2 points of super shield at the start of every fight. (event only) |
| `bloom_heart` | Heart of the Bloom | - | The fungus lives in your reactor: 4 points of super shield at the start of every fight. (event only) |
| `eyepatch` | Lucky Eyepatch *(Space Pirates Ahoy)* | 30 | Mostly cosmetic. A little lucky: +2% evasion. Arr. |
| `ia_grounding` | Ion Grounding Mesh *(Ion Arsenal)* | 45 | 35% chance to shrug off ion damage. |
| `ho_magazine` | Deep Magazine *(Heavy Ordnance)* | 50 | 30% chance a missile or drone part is not used up. |
| `bm_lens` | Beam Focusing Lens *(Beam Masters)* | 60 | Weapons charge 10% faster. |
| `dh_swarmlink` | Swarm Link *(Drone Hive)* | 50 | 25% chance a drone part or missile is not used up. |
| `ec_capacitors` | Overclocked Capacitors *(Engineering Corps)* | 70 | Weapons charge 15% faster. |
| `ec_harmonizer` | Shield Harmonizer *(Engineering Corps)* | 60 | Shield layers recharge 20% faster. |
| `ec_fins` | Vector Thruster Fins *(Engineering Corps)* | 55 | +6% evasion. |
| `ec_mist` | Med-Mist Vents *(Engineering Corps)* | 50 | Your crew heal slowly anywhere aboard. |
| `ec_dcbots` | Damage Control Bots *(Engineering Corps)* | 55 | Crew repair systems, fires and breaches 30% faster. |
| `ec_ablative` | Ablative Hull Layer *(Engineering Corps)* | 60 | 60% fewer hull breaches and a 10% chance to shrug off system damage. |
| `ec_faraday` | Faraday Lining *(Engineering Corps)* | 45 | 30% chance to shrug off ion damage. |
| `ec_recycler` | Ammo Recycler *(Engineering Corps)* | 50 | 25% chance a missile or drone part is not used up. |
| `ec_salvage` | Salvage Drones *(Engineering Corps)* | 60 | Collect 15% more scrap. |
| `ec_adrenal` | Adrenal Pumps *(Engineering Corps)* | 50 | Crew move 20% faster and hit 10% harder. |
| `ec_barrier` | Emergency Barrier *(Engineering Corps)* | 80 | Start every fight with a 3-point super shield. |
| `gf_lantern` | Spectral Lantern *(The Ghost Fleet)* | 55 | The fleet loses your trail: 6% evasion and 10% more scrap. |
| `mg_card` | Guild Membership Card *(Merchant Guild)* | 40 | Members get a better cut: 12% more scrap. |
| `mg_insurance` | Guild Hull Insurance *(Merchant Guild)* | 45 | Covers your hull: 40% fewer breaches. |
| `cw_starseed` | Starseed Crystal *(Cosmic Wonders)* | 65 | A seed of living starlight. Shields recharge 10% faster and your crew slowly heal anywhere. |
| `cw_chronoshard` | Chrono Shard *(Cosmic Wonders)* | 70 | A splinter of a broken time loop. Weapons charge 8% faster and crew move 10% faster. |
| `pk_jolly` | Jolly Roger Flag *(Pyrate Kings)* | 50 | Enemies hand over more loot: 15% more scrap, and your crew fight 5% harder. |
| `pv_core` | Precursor Core *(Precursor Vaults)* | 100 | A heart of ancient engineering. Shields recharge 15% faster, weapons charge 5% faster and repairs go 15% fast… |
| `nr_baffles` | Sensor Baffles *(Nebula Runners)* | 55 | Makes your ship hard to read: +4% evasion and a 20% chance to shrug off ion damage. |
| `bp_boots` | Grapnel Boots *(Boarding Party)* | 55 | Your crew move 15% faster and hit 10% harder. |
| `bp_trauma` | Trauma Kits *(Boarding Party)* | 45 | Your crew slowly heal anywhere aboard, even in a fight. |
| `wf_stocking` | Lucky Stocking *(Winterfest)* | 30 | Something nice turns up in every wreck: 10% more scrap. |
| `wf_cocoa` | Cocoa Dispenser *(Winterfest)* | 40 | Warm drinks for everyone: your crew slowly heal anywhere and move 5% faster. |
| `ss_charm` | Lucky Black Cat *(Spooky Season)* | 40 | Not unlucky at all, for you: +5% evasion. |
| `ss_candy` | Bottomless Candy Bowl *(Spooky Season)* | 35 | Sugar rush: crew move 15% faster. |
| `hz_heatsink` | Heat Sink Plating *(Hazard Zones)* | 45 | Built for solar flares: 50% fewer breaches and a 15% chance to shrug off system damage. |
| `hz_grounding` | Storm Grounding Rods *(Hazard Zones)* | 40 | A 35% chance to shrug off ion damage. |
| `ds_magnet` | Salvage Magnet *(Derelict Salvage)* | 55 | Pulls in loose debris after every fight: 20% more scrap. |
| `ds_cutters` | Plasma Cutters *(Derelict Salvage)* | 45 | Your crew strip and repair faster: repairs 20% quicker. |
| `ca_lattice` | Crystal Lattice Hull *(Crystal Arsenal)* | 70 | Living crystal laced through the hull: a 2-point super shield at the start of every fight. |
| `gz_mascot` | Ship's Mascot *(Galactic Zoo)* | 30 | Morale is everything: crew hit 8% harder and heal a little anywhere. |
| `vl_halo` | Voltan Halo *(Voltan Lightworks)* | 75 | A ring of living light around the hull: a 4-point super shield at the start of every fight. |
| `vl_battery` | Lightwell Cells *(Voltan Lightworks)* | 50 | Shield layers recharge 12% faster and weapons 5% faster. |
| `sm_eye` | Third Eye Lens *(Sloog Mysteries)* | 55 | See the shot before it lands: +7% evasion. |
| `keepsake` | Crew keepsake | - | Made by hand by a devoted crew member. Everyone works a little harder for it: +5% repairs and fighting, +2% e… (event only) |

### Races

`secret` races are enemy-only and never offered as crew.

| id | name | hp | repair | combat | speed | special |
| --- | --- | --- | --- | --- | --- | --- |
| `human` | Human | 100 | 1 | 1 | 1 | learn 1.1 |
| `pebblekin` | Pebblekin | 150 | 0.5 | 1 | 0.5 | fireproof |
| `enjinn` | Enjinn | 100 | 2 | 0.5 | 1 |  |
| `voltan` | Voltan | 70 | 1 | 1 | 1 | deathBurst 15 |
| `sloog` | Sloog | 100 | 1 | 1 | 1 | telepathic, mindImmune |
| `mantlis` | Mantlis | 100 | 0.5 | 1.5 | 1.25 |  |
| `glassborn` | Glassborn | 120 | 1 | 1.1 | 0.8 | secret, armor 0.6 |
| `parrot` | Squawkling *(Space Pirates Ahoy)* | 90 | 1.5 | 1 | 1.2 |  |
| `crystalline` | Prismari *(Strange Peoples)* | 80 | 1 | 0.8 | 1 | mindImmune |
| `hiveborn` | Hivelings *(Strange Peoples)* | 60 | 0.8 | 1 | 1.5 | learn 1.4 |
| `embermen` | Ember Kin *(Strange Peoples)* | 110 | 0.6 | 1.3 | 1 | fireproof |
| `mender` | Menders *(Strange Peoples)* | 90 | 1.2 | 0.5 | 1 | heal true |
| `rp_vesperi` | Vesperi *(Rim Peoples)* | 75 | 1 | 0.9 | 1.35 | learn 1.5 |
| `rp_ironclad` | Ironclad *(Rim Peoples)* | 120 | 1.1 | 1.1 | 0.75 | armor 0.7 |
| `rp_lumen` | Lumen *(Rim Peoples)* | 85 | 0.9 | 0.6 | 1 | heal 1.2 |
| `rp_gloomkin` | Gloomkin *(Rim Peoples)* | 95 | 1 | 1.2 | 1.1 | noAir, mindImmune |
| `pv_archon` | Archon *(Precursor Vaults)* | 140 | 1.4 | 0.5 | 0.65 | fireproof, noAir |
| `ss_wisp` | Wisp *(Spooky Season)* | 70 | 1.1 | 0.7 | 1.4 | fireproof, noAir |
| `gz_burrowkin` | Burrowkin *(Galactic Zoo)* | 110 | 1.3 | 0.9 | 0.9 | learn 1.2 |
| `gz_flitter` | Flitter *(Galactic Zoo)* | 60 | 0.8 | 0.8 | 1.6 |  |

### Traits (rolled for recruits)

`quick` Quick hands · `tough` Tough · `ace` Ace pilot · `gunner` Gunner · `brawler` Brawler · `medic` Medic · `shieldtech` Shield tech · `swift` Swift · `mt_lucky` Lucky · `mt_veteran` Veteran · `mt_mechanic` Mechanic · `mt_sprinter` Sprinter · `mt_sharpshooter` Sharpshooter · `mt_fieldmedic` Field Medic · `mt_stalwart` Stalwart · `mt_navigator` Navigator · `mt_bulwark` Bulwark · `mt_tinker` Tinker

### Personality quirks (`req.quirk`, `starQuirk`, campaign crew)

`gambler` Gambler · `poet` Poet · `cook` Galley cook · `superstitious` Superstitious · `daredevil` Daredevil · `worrier` Worrier · `tinkerer` Tinkerer · `romantic` Romantic · `conspiracy` Conspiracy buff · `sleepwalker` Sleepwalker · `collector` Collector · `expyrate` Ex-pyrate · `mystic` Mystic · `optimist` Optimist · `grump` Grump · `bookworm` Bookworm · `gardener` Green thumb

### Enemies

| id | name | tags | sectors | hull | notes |
| --- | --- | --- | --- | --- | --- |
| `rebuff_scout` | Rebuff Scout | rebuff | 1–3 | 8 |  |
| `rebuff_fighter` | Rebuff Fighter | rebuff | 1–8 | 10 |  |
| `pyrate_gunship` | Pyrate Gunship | pyrate | 1–8 | 11 |  |
| `auto_scoundrel` | Auto-Scoundrel | auto, enjinn | 1–8 | 9 | auto |
| `glass_sentinel` | Glass Sentinel | glass | 1–9 | 12 | onlyTagged |
| `rebuff_cutter` | Rebuff Patrol Cutter | rebuff | 1–4 | 9 |  |
| `pyrate_skiff` | Pyrate Skiff | pyrate | 1–4 | 8 |  |
| `pebble_hauler` | Pebblekin Ore Hauler | pebblekin | 1–5 | 13 |  |
| `auto_picket` | Auto-Picket | auto | 1–3 | 7 | auto |
| `enforcer_cutter` | Fedoration Enforcer | enforcer | 1–9 | 11 | eventOnly |
| `enforcer_frigate` | Fedoration Enforcer Frigate | enforcer | 1–9 | 15 | eventOnly, relentless |
| `rogue_warden` | WARDEN-9 (rogue) | auto | 1–9 | 16 | auto, eventOnly, relentless, mirror |
| `crystal_heart` | The Crystal Heart | auto | 1–9 | 14 | auto, eventOnly |
| `rp_vesper_skiff` | Vesperi Skimmer *(Rim Peoples)* | vesperi | 1–8 | 9 | onlyTagged |
| `rp_iron_hauler` | Ironclad Ore Hauler *(Rim Peoples)* | ironclad | 1–8 | 16 | onlyTagged |
| `bh_tracker` | Bounty Tracker *(Bounty Hunters)* | bounty | 1–8 | 11 | onlyTagged |
| `gf_hulk` | Ghost Hulk *(The Ghost Fleet)* | ghost | 1–8 | 12 | auto, onlyTagged |
| `gf_wraith` | Wraith Frigate *(The Ghost Fleet)* | ghost | 1–8 | 10 | auto, onlyTagged |
| `rc_interceptor` | Rebuff Interceptor *(Rebuff Crackdown)* | rebuff | 1–6 | 10 |  |
| `rc_barge` | Rebuff Prison Barge *(Rebuff Crackdown)* | rebuff | 1–8 | 15 | onlyTagged |
| `pv_guardian` | Vault Guardian *(Precursor Vaults)* | precursor | 1–8 | 11 | auto, onlyTagged |
| `pv_heartwarden` | The Heart Warden *(Precursor Vaults)* | precursor | 1–8 | 16 | auto, eventOnly, onlyTagged |
| `nr_lurker` | Fog Lurker *(Nebula Runners)* | nebula | 1–8 | 10 | onlyTagged |
| `ss_haunted` | Haunted Freighter *(Spooky Season)* | spooky | 1–8 | 11 | auto, onlyTagged |
| `revenant_wreck` | Revenant wreck | auto | 1–9 | 14 | eventOnly, revenant |
| `rb_hunter` | Rebuff Hunter-Killer | rebuff | 1–9 | 13 | eventOnly, relentless |
| `rb_blockade` | Rebuff Blockade Cruiser | rebuff | 1–9 | 18 | eventOnly, relentless |
| `ec_freighter` | Convoy Freighter | convoy | 1–9 | 9 | eventOnly |
| `ec_payroll` | Rebuff Payroll Barge | rebuff | 1–9 | 11 | eventOnly |
| `pyrate_bomber` | Pyrate Boom-barge | pyrate | 2–8 | 11 |  |
| `pebble_brute` | Pebblekin Brute | pebblekin | 2–8 | 14 |  |
| `mantlis_skirm` | Mantlis Skirmisher | mantlis | 2–5 | 9 |  |
| `voltan_runner` | Voltan Lightrunner | voltan | 2–6 | 9 |  |
| `kraken` | Space Kraken Hunter *(Space Pirates Ahoy)* | pyrate | 2–8 | 15 |  |
| `hive_swarm` | Hive Skiff *(Strange Peoples)* | hive | 2–6 | 10 |  |
| `bh_netter` | Bounty Netter *(Bounty Hunters)* | bounty | 2–8 | 12 | onlyTagged |
| `pk_brigantine` | Pyrate Brigantine *(Pyrate Kings)* | pyrate | 2–8 | 13 |  |
| `nr_veil` | Veil Drone Ship *(Nebula Runners)* | nebula | 2–8 | 12 | auto, onlyTagged |
| `bp_reaver` | Mantlis Reaver *(Boarding Party)* | mantlis | 2–8 | 12 |  |
| `ss_gourd` | Gourd Galleon *(Spooky Season)* | spooky | 2–8 | 13 | onlyTagged |
| `rebuff_cloaker` | Rebuff Shade | rebuff | 3–8 | 10 |  |
| `mantlis_raider` | Mantlis Raider | mantlis | 3–8 | 10 |  |
| `voltan_peace` | Voltan Peacemonger | voltan | 3–8 | 10 |  |
| `sloog_hacker` | Sloog Interloper | sloog | 3–8 | 10 |  |
| `sloog_mind` | Sloog Puppeteer | sloog | 3–8 | 10 |  |
| `enjinn_carrier` | Enjinn Dronecarrier | enjinn | 3–8 | 11 |  |
| `pyr_shock` | Pyrate Shock-Raider | pyrate | 3–8 | 11 |  |
| `prism_warden` | Prismari Warden *(Strange Peoples)* | prismari | 3–8 | 16 |  |
| `ember_raider` | Ember Raider *(Strange Peoples)* | ember | 3–8 | 18 |  |
| `ia_stormrider` | Stormrider Interceptor *(Ion Arsenal)* | rebuff, ion | 3–8 | 11 |  |
| `ho_bomber` | Rebuff Firebrand *(Heavy Ordnance)* | rebuff | 3–8 | 12 |  |
| `bm_cutterclass` | Voltan Cutter *(Beam Masters)* | voltan | 3–8 | 11 |  |
| `dh_swarmer` | Auto-Swarmer *(Drone Hive)* | auto | 3–8 | 10 | auto |
| `rp_gloom_raider` | Gloomkin Night Raider *(Rim Peoples)* | ironclad, vesperi | 3–8 | 12 | onlyTagged |
| `nr_stormcaller` | Stormcaller *(Nebula Runners)* | nebula | 3–8 | 14 | onlyTagged |
| `bp_brawlbarge` | Pebblekin Brawl Barge *(Boarding Party)* | pebblekin | 3–8 | 15 |  |
| `auto_assault` | Auto-Assaulter | auto, rebuff | 4–8 | 12 | auto |
| `rb_suffocator` | Rebuff Suffocator | rebuff | 4–8 | 13 | relentless |
| `rb_leech` | Rebuff Leech Frigate | rebuff | 4–8 | 12 | relentless |
| `bh_warden` | Hunter Warden *(Bounty Hunters)* | bounty | 4–8 | 15 | onlyTagged |
| `gf_banshee` | Banshee Dreadnought *(The Ghost Fleet)* | ghost | 4–8 | 16 | auto, onlyTagged |
| `pk_galleon` | Pyrate King's Galleon *(Pyrate Kings)* | pyrate | 4–8 | 20 | onlyTagged |
| `rc_warden` | Rebuff Warden *(Rebuff Crackdown)* | rebuff | 4–8 | 15 |  |
| `rebuff_elite` | Rebuff Enforcer | rebuff | 5–8 | 14 |  |
| `auto_strangler` | Auto-Strangler | auto | 5–8 | 12 | auto, relentless |
| `pv_keeper` | Vault Keeper *(Precursor Vaults)* | precursor | 5–8 | 13 | auto, onlyTagged |
| `ho_siegebarge` | Pyrate Siege Barge *(Heavy Ordnance)* | pyrate | 6–8 | 14 |  |
| `flaggship` | The Flaggship |  | 99–99 | 24 | boss |

### Player ships

| id | name | class | layout | hull | reactor |
| --- | --- | --- | --- | --- | --- |
| `pestrel` | The Pestrel | Fedoration Cruiser | A | 30 | 8 |
| `redtale` | The Red Tale | Fedoration Cruiser | B | 30 | 8 |
| `taurus` | The Taurus | Enjinn Cruiser | A | 30 | 8 |
| `bortex` | The Bortex | Enjinn Cruiser | B | 30 | 9 |
| `stone` | The Rolling Stone | Pebblekin Cruiser | A | 30 | 8 |
| `rockbottom` | The Rock Bottom | Pebblekin Cruiser | B | 35 | 8 |
| `zap` | The Zapjudicator | Voltan Cruiser | A | 28 | 8 |
| `voltface` | The Volt Face | Voltan Cruiser | B | 26 | 7 |
| `slime` | The Slime of War | Sloog Cruiser | A | 30 | 9 |
| `gastropod` | The Gastropod | Sloog Cruiser | B | 30 | 9 |
| `mantlis` | The Preying Mantlis | Mantlis Cruiser | A | 30 | 9 |
| `basilisk` | The Basil-isk | Mantlis Cruiser | B | 30 | 10 |
| `peekaboo` | The Peekaboo | Stealth Cruiser | A | 30 | 8 |
| `nowyoudont` | The Now-You-Don't | Stealth Cruiser | B | 30 | 9 |
| `glasscannon` | The Glass Cannon | Glassborn Cruiser | A | 24 | 9 |
| `paneneck` | The Pane in the Neck | Glassborn Cruiser | B | 30 | 8 |
| `jollyroger` | The Jolly Rover *(Space Pirates Ahoy)* | Pirate Galleon | A | 28 | 9 |
| `lanternship` | The Lantern *(Hangar Expansion)* | Scout Skiff | A | 24 | 7 |
| `lanternb` | The Dimmer *(Hangar Expansion)* | Scout Skiff | B | 26 | 7 |
| `anvil` | The Anvil *(Hangar Expansion)* | Siege Hulk | A | 36 | 9 |
| `anvilb` | The Hammer *(Hangar Expansion)* | Siege Hulk | B | 32 | 9 |
| `tideship` | The Undertow *(Hangar Expansion)* | Ion Skirmisher | A | 28 | 8 |
| `tideb` | The Riptide *(Hangar Expansion)* | Ion Skirmisher | B | 28 | 8 |
| `dh_beehive` | The Beehive *(Drone Hive)* | Drone Carrier | A | 26 | 9 |
| `dh_swarm` | The Swarm Queen *(Drone Hive)* | Drone Carrier | B | 26 | 9 |
| `fc_courier` | The Paper Kite *(Frontier Classes)* | Frontier Courier | A | 22 | 7 |
| `fc_courierb` | The Night Post *(Frontier Classes)* | Frontier Courier | B | 24 | 7 |
| `fc_gunboat` | The Argument *(Frontier Classes)* | Frontier Gunboat | A | 30 | 9 |
| `fc_gunboatb` | The Rebuttal *(Frontier Classes)* | Frontier Gunboat | B | 30 | 9 |
| `fc_ark` | The Long Haul *(Frontier Classes)* | Frontier Ark | A | 34 | 8 |
| `fc_arkb` | The Second Chance *(Frontier Classes)* | Frontier Ark | B | 32 | 8 |
| `xh_lance` | The Long Lance *(Exotic Hulls)* | Beam Frigate | A | 26 | 9 |
| `xh_phantom` | The Phantom *(Exotic Hulls)* | Infiltrator | A | 24 | 8 |
| `xh_juggernaut` | The Juggernaut *(Exotic Hulls)* | Rock Dreadnought | A | 40 | 8 |
| `xh_puppet` | The Puppeteer's Glove *(Exotic Hulls)* | Mind Cutter | A | 26 | 9 |
| `pk_corsair` | The Black Gull *(Pyrate Kings)* | Pyrate Corsair | A | 28 | 8 |
| `pk_corsairb` | The Gilded Debt *(Pyrate Kings)* | Pyrate Corsair | B | 30 | 8 |
| `bp_crowbar` | The Crowbar *(Boarding Party)* | Boarding Cutter | A | 26 | 8 |
| `bp_crowbarb` | The Can Opener *(Boarding Party)* | Boarding Cutter | B | 26 | 8 |
| `rd_turncoat` | The Turncoat *(Rebuff Defectors)* | Rebuff Defector | A | 32 | 8 |
| `rd_whistle` | The Whistleblower *(Rebuff Defectors)* | Rebuff Defector | B | 26 | 9 |

### Sectors

| id | name | tags | enemyTags |
| --- | --- | --- | --- |
| `civilian` | Civilian Sector |  |  |
| `rebuff` | Rebuff Stronghold | rebuff | rebuff |
| `pyrate` | Pyrate Haven | pyrate | pyrate |
| `nebula` | Uncharted Nebula | nebula |  |
| `sloog` | Sloog Nebula | sloog, nebula | sloog |
| `pebblekin` | Pebblekin Homeworlds | pebblekin | pebblekin |
| `enjinn` | Enjinn Controlled | enjinn | enjinn, auto |
| `voltan` | Voltan Homeworlds | voltan | voltan |
| `mantlis` | Mantlis Hives | mantlis | mantlis |
| `laststand` | The Last Stand | rebuff | rebuff |
| `glass` | The Glasswork Expanse | glass | glass |
| `prismfields` | Prismari Fields *(Strange Peoples)* | prismari | prismari |
| `hivereach` | The Hive Reach *(Strange Peoples)* | hive | hive |
| `emberbelt` | The Ember Belt *(Strange Peoples)* | ember | ember |
| `rp_wingsky` | The Wing Sky *(Rim Peoples)* | vesperi | vesperi |
| `rp_forgebelt` | The Forge Belt *(Rim Peoples)* | ironclad | ironclad |
| `bh_reach` | The Hunter's Reach *(Bounty Hunters)* | bounty | bounty |
| `gf_graveyard` | The Silent Graveyard *(The Ghost Fleet)* | ghost, nebula | ghost |
| `cw_reach` | The Wonder Reach *(Cosmic Wonders)* | wonder | auto |
| `pk_court` | The Pyrate King's Court *(Pyrate Kings)* | pyrate | pyrate |
| `rc_occupied` | Occupied Space *(Rebuff Crackdown)* | rebuff | rebuff |
| `pv_vaults` | The Precursor Vaults *(Precursor Vaults)* | precursor | precursor |
| `nr_expanse` | The Veil Expanse *(Nebula Runners)* | nebula | nebula |
| `wf_drift` | The Frostlight Drift *(Winterfest)* | winter | pyrate |
| `ss_hollow` | The Hollow Nebula *(Spooky Season)* | spooky, nebula | spooky |
| `hz_furnace` | The Furnace *(Hazard Zones)* | furnace | auto |
| `hz_maze` | The Shattered Belt *(Hazard Zones)* | belt | pyrate |
| `hz_pulsarfield` | The Pulsar Field *(Hazard Zones)* | pulsar | auto, rebuff |

### Goods (cargo: `goods` effect, `req.goodsKind`, gifts, trade)

| id | name | kind | base price | made in | wanted in |
| --- | --- | --- | --- | --- | --- |
| `star_potato` | Star potato | crop | 6 | civilian, pebblekin | mantlis, laststand |
| `ion_berry` | Ion berries | crop | 5 | voltan | sloog, civilian |
| `void_pepper` | Void pepper | crop | 11 | nebula | mantlis, pyrate |
| `nebula_bloom` | Nebula bloom | crop | 12 | nebula | sloog, glass, civilian |
| `moon_melon` | Moon melon | crop | 22 | civilian | rebuff, voltan |
| `glass_lily` | Glass lily | crop | 40 | glass | civilian, rebuff, sloog |
| `space_fish` | Space fish | fish | 7 | nebula | pebblekin, civilian |
| `deep_eel` | Deep eel | fish | 24 |  | mantlis, sloog, pyrate |
| `sloog_silk` | Sloog silk | trade | 18 | sloog | civilian, rebuff, voltan |
| `pebble_geode` | Pebblekin geode | trade | 15 | pebblekin | enjinn, glass, civilian |
| `voltan_cell` | Voltan cells | trade | 16 | voltan | enjinn, civilian, pyrate |
| `enjinn_spice` | Enjinn spice | trade | 14 | enjinn | sloog, mantlis, civilian |
| `mantlis_chitin` | Mantlis chitin | trade | 13 | mantlis | pebblekin, enjinn |
| `rations` | Rebuff rations | trade | 4 | rebuff, laststand | pyrate, nebula |
| `pyrate_rum` | Pyrate rum | trade | 10 | pyrate | rebuff, civilian, laststand |
| `space_wine` | Space wine | trade | 20 | civilian, voltan | pyrate, mantlis, laststand |
| `nebula_crystal` | Nebula crystal | trade | 26 | nebula | glass, voltan, enjinn |
| `old_books` | Old books | trade | 9 | rebuff, civilian | sloog, glass |
| `toy_robots` | Toy robots | trade | 8 | enjinn | civilian, laststand |
| `love_potion` | "Love potion" | trade | 22 | sloog, nebula | pyrate, civilian, mantlis |
| `contraband` | Contraband | trade | 30 | pyrate, nebula | laststand, rebuff |
| `relic` | Ancient relic | curio | 60 |  | glass, sloog, voltan |
| `junk` | Interesting junk | curio | 3 |  |  |
| `spicy_hash` | Spicy hash | meal | 24 |  | mantlis, pyrate |
| `star_stew` | Star stew | meal | 22 |  | pebblekin, laststand |
| `berry_pie` | Ion berry pie | meal | 20 |  | civilian, voltan |
| `melon_sorbet` | Moon melon sorbet | meal | 45 |  | rebuff, glass, sloog |
| `fish_supper` | Fish supper | meal | 18 |  | civilian, laststand |
| `preserves` | Star preserves | trade | 26 |  | civilian, laststand, mantlis, pebblekin |
| `fruit_wine` | Fruit wine | trade | 46 |  | pyrate, voltan, mantlis, civilian |
| `vintage_wine` | Void vintage | curio | 150 |  | glass, voltan, rebuff, sloog |
| `ballistic_cloth` | Ballistic cloth | trade | 38 |  | mantlis, pebblekin, rebuff |
| `frostfire_root` | Frostfire root | crop | 34 |  | mantlis, voltan, glass |
| `solar_grape` | Solar grapes | crop | 30 |  | voltan, pyrate, civilian |
| `epic_poem` | An epic poem | curio | 36 |  | glass, sloog, voltan |
| `starfruit` | Starfruit | crop | 85 |  | glass, voltan, sloog, rebuff |

Goods kinds: `crop`, `fish`, `trade`, `curio`, `meal`.

### Personal kit (`arm` effect) and tonics (`item` effect)

Kit: `wrench` Heavy Wrench (blunt) · `baton` Stun Baton (blunt) · `hammer` Gravity Hammer (blunt) · `knife` Combat Knife (blade) · `cutlass` Pyrate Cutlass (blade) · `axe` Fire Axe (blade) · `torch` Plasma Torch (blade) · `mono` Monofilament Sword (blade) · `pistol` Laser Pistol (gun) · `shotgun` Boarding Shotgun (gun) · `rifle` Pulse Rifle (gun) · `freeze` Freeze Ray (weird) · `spore` Spore Pistol (weird) · `whip` Tentacle Whip (weird) · `leech` Life-Leech Glove (weird) · `mender` Mender's Staff (weird) · `chicken` Rubber Chicken (weird) · `vest` Flak Vest (suit) · `plate` Boarding Plate (suit) · `voidsuit` Void Suit (suit) · `belt` Personal Shield (suit) · `medpack` Auto-Medpack (suit) · `ar_kestrel` Courier AR-7 (ar) · `ar_vanguard` Vanguard Carbine (ar) · `ar_lancer` Lancer Battle Rifle (ar) · `ar_fang` Fang Burst Rifle (ar) · `ar_ion` Ionclad Rifle (ar) · `ar_tempest` Tempest AR (ar) · `ar_harbinger` Harbinger Rifle (ar) · `ar_cobalt` Cobalt Pulse Rifle (ar) · `smg_wasp` Wasp SMG (smg) · `smg_ferret` Ferret Machine Pistol (smg) · `smg_hornet` Hornet PDW (smg) · `smg_vortex` Vortex SMG (smg) · `smg_scythe` Scythe SMG (smg) · `smg_blitz` Blitz Auto (smg) · `smg_mirage` Mirage Silenced SMG (smg) · `lmg_bulwark` Bulwark LMG (lmg) · `lmg_ox` Ox Squad Gun (lmg) · `lmg_thresher` Thresher Minigun (lmg) · `lmg_warden` Warden Suppressor (lmg) · `lmg_hailstorm` Hailstorm LMG (lmg) · `sg_breacher` Breacher Shotgun (shotgun) · `sg_mule` Mule Double-Barrel (shotgun) · `sg_cyclone` Cyclone Auto-Shotgun (shotgun) · `sg_dragon` Dragon's Breath (shotgun) · `sg_hammerhead` Hammerhead Slug Gun (shotgun) · `sg_tidal` Tidal Riot Gun (shotgun) · `mk_needle` Needle Marksman (marksman) · `mk_longshot` Longshot DMR (marksman) · `mk_hawk` Hawkeye Rifle (marksman) · `mk_railgun` Personal Railgun (marksman) · `mk_whisper` Whisper Rifle (marksman) · `sp_flamer` Hab Flamer (special) · `sp_arc` Arc Caster (special) · `sp_cryo` Cryo Projector (special) · `sp_grav` Grav Thrower (special) · `sp_plasma` Plasma Caster (special) · `sp_spore` Spore Projector (special) · `pi_sidearm` Fedoration Sidearm (pistol) · `pi_viper` Viper Revolver (pistol) · `pi_dart` Dart Pistol (pistol) · `pi_magnum` Hand Cannon (pistol) · `pi_machine` Auto Pistol (pistol) · `pi_flare` Flare Pistol (pistol) · `pi_ionic` Ionic Repeater (pistol) · `pi_gold` Gilded Duelist (pistol) · `ln_tube` Tube Launcher (launcher) · `ln_grenade` Grenade Launcher (launcher) · `ln_swarm` Swarm Launcher (launcher) · `ln_foam` Foam Launcher (launcher) · `me_knife` Combat Knife (melee) · `me_hatchet` Boarding Hatchet (melee) · `me_baton` Shock Baton (melee) · `me_cutlass` Pyrate Cutlass (melee) · `me_shard` Glass Shard Blade (melee) · `me_maul` Pebble Maul (melee) · `me_claws` Mantlis Claw Gloves (melee) · `me_sword` Ceremonial Sabre (melee)

Tonics: `muscle` Muscle Tonic (perm) · `biscuit` Iron Biscuit (perm) · `gum` Nimble Gum (perm) · `tea` Tinker's Tea (perm) · `elixir` Golden Elixir (perm) · `chip_pilot` Skill Chip: Piloting (train) · `chip_eng` Skill Chip: Engines (train) · `chip_shd` Skill Chip: Shields (train) · `chip_wpn` Skill Chip: Weapons (train) · `chip_rep` Skill Chip: Repair (train) · `chip_cbt` Skill Chip: Combat (train) · `stim` Battle Stim (buff) · `focus` Focus Drops (buff) · `rage` Berserker Brew (buff) · `medkit` Field Medkit (heal) · `salve` Nanite Salve (heal) · `cookies` Comfort Cookies (treat) · `feast` Birthday Cake (treat)

### Seeds (`seeds` effect)

`star_potato` Star potato · `ion_berry` Ion berry · `void_pepper` Void pepper · `nebula_bloom` Nebula bloom · `moon_melon` Moon melon · `glass_lily` Glass lily · `frostfire` Frostfire root · `solar_vine` Solar vine

### Medals (for `ch.ach` on ships and the `achievement` effect)

`first_jump` `sector3` `sector5` `laststand` `phase1` `win` `kills25` `boardkill` `fullcrew` `augs3` `mind` `firestarter` `missilecmd` `hullbreadth` `surrender` `shieldwall` `rebuffed` `veteran` `daily` `streak3` `handson` `saboteur` `sidearm` `glasswork` `treasure` `prophecy` `nemesis` `saga_pet` `saga_wed` `saga_tale` `market_courier` `market_mags` `home_harvest` `home_bestie` `market_mogul` `home_angler` `home_fair` `trav_bounty` `trav_kestrel` `trav_oddly` `end_trusted` `end_cold` `end_free` `end_sold` `end_sellout` `end_all` `rank_lt` `rank_cmdr` `rank_admiral` `alert1` `alert4` `alert8` `veteran3` `end_vance_loyal` `end_vance_traitor` `end_fl_reborn` `end_fl_few` `end_harte_wing` `end_harte_rivals` `arcs_all` `end_stow_home` `end_cure_saved` `end_heist_legend` `end_haunt_friend` `end_debt_paid` `end_pro_star` `end_bty_wing` `end_exp_found` `end_mut_united` `end_wed_happy` `end_wyrm_wild` `end_cup_champ` `end_echo_closed` `end_sab_solved` `end_kp_lit` `end_duke_escort` `end_cell_free` `end_inh_home` `end_dbl_two` `end_song_answered` `exp_refit` `exp_ghost` `exp_ghostwin` `exp_situ` `challenge1` `challenge5` `challengeall` `kills100` `hardwin` `noloss` `speedwin` `marathonwin` `flawless5` `quickdraw` `pacifist` `rainbow` `hoarder` `scrapbaron` `streak7` `modsquad` `lever` `starpilot` `blaster5` `haven_all` `haven_biodome` `haven_aqua` `haven_promenade` `haven_engineering` `haven_relay` `haven_fence` `haven_cellar` `haven_cantina` `jobs5` `first_prestige` `perk_pro` `wpn_max` `graduate` `mp_coop` `mp_live` `mp_courier` `mp_hunter` `duelwin` `brawlwin` `racewin` `mp_wing` `seedwin` `cuppost`

### Event lists

Event `tags` used by the game: `pyrate` `enjinn` `rebuff` `laststand` `pebblekin` `voltan` `sloog` `nebula` `mantlis` `glass` `vesperi` `ironclad` `bounty` `ghost` `wonder` `precursor` `winter` `spooky` `furnace` `belt` `pulsar`

Hails (`hail`): `rebuff` `pyrate` `mantlis` `voltan` `pebblekin` `sloog` `enjinn` `auto` `fleet` `generic` `glass` `enforcer` `bounty` `repfriend` `rephate` `hunter`. `generic` is used for any ship without its own; `repfriend`, `rephate`, `hunter`, `enforcer`, `bounty` and `fleet` are special and best left alone.

Pictures (`art`): `planet` `glass` `station` `ship` `creature` `wreck` `market` `asteroid` `star` `nebula` `fleet` `distress` `space`

Factions (`rep`): `mantlis` `sloog` `voltan` `pyrate` `enjinn` `pebblekin` (and `enemy` for the ship you are facing).

Anomalies (`anom`): `fungus` `escort` `crystal` `blackmark` `pacifist` `fracture`. Start one with e.g. `"anom":{"fungus":1}`, end it with `"anom":{"fungus":null}`.

Scar kinds (`scar`): `leaky` `jammed` `sparky` `locked`. Pets (`pet`): `kitten` `slug` `moth` `goat` `cloud`. Pet forms (`petEvo`): `fixer` `ballistic` `armoured` `gourmet`.

### Balance numbers measured from the base game

| weapon tier | guns | avg damage per volley | avg charge (s) | avg power | damage per 10s per power | avg cost |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | 1.4 | 10.6 | 1.3 | 1.23 | 39 |
| 2 | 12 | 2.0 | 13.9 | 2.2 | 0.79 | 56 |
| 3 | 5 | 4.6 | 21.4 | 3.4 | 0.67 | 79 |

Event scrap rewards across 412 outcomes: 25th percentile 20, median 30, 75th 40, 90th 60, highest 140. (The game adds a little per sector.)

Random enemies: hull 7–20 (median 12) before the game adds 1 per sector.

## Complete examples

### A small mod

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

### A medium mod using most features
A new sector with its own race, goods, quirk, kit, weapons, drone, trade-off augment, enemies, hails, an unlockable ship, a quest, a delayed consequence, a twist and a cargo check. This exact file loads with no warnings.

```json
{
  "name": "The Glacier Belt",
  "version": "1.0",
  "author": "Example",
  "races": [
    {"id": "ip_rimeling", "name": "Rimeling", "color": "#cdeeff", "hp": 90, "repair": 1.2, "combat": 0.8, "speed": 1, "fireproof": true, "desc": "Small, frosty and calm. Fires simply go out around them."}
  ],
  "weapons": [
    {"id": "ip_frostgun", "name": "Frost Repeater", "type": "laser", "damage": 1, "shots": 2, "charge": 11, "power": 2, "cost": 55, "tier": 2, "pin": 2, "color": "#a8e6ff", "desc": "Two icy bolts. A hit freezes the target's thrusters for a moment."},
    {"id": "ip_icicle", "name": "Icicle Launcher", "type": "missile", "damage": 2, "shots": 1, "charge": 12, "power": 1, "cost": 45, "tier": 1, "splash": 1, "desc": "A missile of solid ice that shatters into the next room."},
    {"id": "ip_chiller", "name": "Deep Chiller", "type": "ion", "damage": 1, "shots": 1, "charge": 10, "power": 1, "cost": 40, "tier": 2, "drain": 1, "desc": "Ion frost that leaves a system sluggish for a while."}
  ],
  "drones": [
    {"id": "ip_snowplough", "name": "Snowplough Drone", "kind": "defense", "power": 2, "cost": 50, "rate": 2.6, "targets": ["missile", "asteroid"], "desc": "Ploughs incoming missiles and loose rocks out of the way."}
  ],
  "augments": [
    {"id": "ip_coldsink", "name": "Cold Sink", "cost": 60, "desc": "Weapons charge 18% faster, but the cold makes crew repair 15% slower.", "fx": {"charge": 0.18, "repair": -0.15}}
  ],
  "goods": [
    {"id": "ip_icewine", "name": "Glacier wine", "base": 28, "kind": "trade", "from": ["ip_glacier"], "want": ["pyrate", "voltan", "civilian"], "desc": "Fermented inside a comet. Served very cold."}
  ],
  "quirks": [
    {"id": "ip_stoic", "name": "Stoic", "desc": "Has never once complained about the cold. Or anything."}
  ],
  "arms": [
    {"id": "ip_icepick", "name": "Ice Pick", "kind": "blade", "dmg": 1.35, "dur": 70, "cost": 35, "tier": 1, "bleed": 2, "desc": "A climber's pick. Surprisingly good in a corridor fight."}
  ],
  "enemies": [
    {"id": "ip_frostjaw", "name": "Frostjaw Raider", "tags": ["ip_ice", "pyrate"], "onlyTagged": true, "hull": 10, "sectors": [1, 8], "systems": {"shields": 2, "engines": 2, "oxygen": 1, "weapons": 3, "piloting": 1, "doors": 1}, "weapons": ["ip_frostgun", "basic"], "crew": ["human", "ip_rimeling"], "style": "pyrate"},
    {"id": "ip_icebreaker", "name": "Icebreaker Drone", "tags": ["ip_ice", "auto"], "eventOnly": true, "auto": true, "hull": 12, "sectors": [1, 8], "systems": {"shields": 2, "engines": 1, "weapons": 3, "piloting": 1}, "weapons": ["ip_icicle", "ip_chiller"], "crew": [], "style": "auto"}
  ],
  "ships": [
    {"id": "ip_sledge", "name": "The Sledge", "cls": "Ice Hauler", "layout": "A", "desc": "Slow, sturdy and very warm inside.", "hull": 32, "reactor": 8, "color": "#a8e6ff", "systems": {"shields": 2, "engines": 2, "oxygen": 1, "weapons": 3, "medbay": 1, "piloting": 1, "sensors": 1, "doors": 1}, "reserve": ["drones"], "weapons": ["ip_frostgun", "ip_icicle"], "crew": ["human", "ip_rimeling", "pebblekin"], "fuel": 16, "missiles": 6, "parts": 2, "pattern": "TABAN", "lvl": 6, "ch": {"shipSector": ["pestrel", 4]}}
  ],
  "sectors": [
    {"id": "ip_glacier", "name": "The Glacier Belt", "blurb": "Frozen comets, frozen wrecks, and pirates who wear three coats.", "intro": ["Frost creeps across the viewport.", "Everything out here is cold, slow and patient."], "color": "#a8e6ff", "mix": {"event": 48, "combat": 38, "empty": 14}, "tags": ["ip_ice"], "enemyTags": ["ip_ice"], "hazards": {"asteroid": 0.12}, "nebula": 0.15, "fleetMult": 0.9}
  ],
  "events": [
    {"id": "ip_hail_toll", "hail": "ip_ice", "text": "\"Ice toll. Ten scrap, or we cut your engines out and keep them as a souvenir.\"", "choices": [{"text": "Pay the toll (10 scrap).", "req": {"scrap": 10}, "cost": {"scrap": 10}, "effect": {"text": "They wave you through, grinning.", "dismiss": true}}, {"text": "Have {who} explain the toll is illegal.", "req": {"quirk": "bookworm"}, "effect": {"text": "{who} quotes three regulations. They leave out of sheer boredom.", "dismiss": true}}, {"text": "Open fire.", "effect": {"text": "So be it.", "begin": true}}]},
    {"id": "ip_hail_cold", "hail": "ip_ice", "text": "\"You're a long way from anywhere warm, little ship.\"", "choices": [{"text": "Fight.", "effect": {"text": "Weapons hot. Very hot.", "begin": true}}, {"text": "Offer a bottle of glacier wine.", "req": {"goodsKind": "trade"}, "effect": {"text": "They drink to your health and leave you alone.", "goods": {"ip_icewine": -1}, "dismiss": true}}]},
    {"id": "ip_derelict", "title": "Frozen derelict", "tags": ["ip_ice"], "art": "wreck", "text": "A freighter hangs in the dark, iced over from nose to tail. Something inside is still blinking.", "choices": [{"text": "Strip the hull plating and go.", "effect": {"text": "Cold work, but honest. The plating sells.", "scrap": 18}}, {"text": "Cut into the cargo hold.", "chance": 0.55, "success": {"text": "Crates of glacier wine, perfectly chilled.", "goods": {"ip_icewine": 3}, "scrap": 10}, "fail": {"text": "The hold was holding back a lot of very cold air. {crew} gets frostbite.", "crewHurt": 20, "hull": -2}}, {"text": "Let {who} warm the airlock.", "req": {"race": "pebblekin"}, "effect": {"text": "{who} glows red and the ice slides off. Inside: a spare drone and a thank-you note.", "drone": "ip_snowplough", "parts": 2}}, {"text": "Leave it be.", "effect": {"text": "Some wrecks are better left frozen."}}]},
    {"id": "ip_map", "tags": ["ip_ice"], "art": "station", "text": "An old ice miner sells you a chart with one beacon circled twice.", "choices": [{"text": "Buy it (15 scrap).", "req": {"scrap": 15}, "cost": {"scrap": 15}, "effect": {"text": "\"Don't wake the big one,\" he says.", "quest": "ip_cache"}}, {"text": "No thanks.", "effect": {"text": "He shrugs and goes back to his soup."}}]},
    {"id": "ip_cache", "questOnly": true, "art": "asteroid", "title": "The circled beacon", "text": "A cache in the ice, and an icebreaker drone parked on top of it.", "choices": [{"text": "Clear it out.", "effect": {"text": "The drone wakes up.", "fight": "ip_icebreaker", "afterWin": {"text": "The cache is yours.", "scrap": 40, "weapon": "ip_frostgun"}}}, {"text": "Back away quietly.", "effect": {"text": "Not today."}}]},
    {"id": "ip_stowaway", "tags": ["ip_ice"], "once": true, "art": "ship", "text": "A shivering kid is hiding in your cargo bay, wrapped in three of your blankets.", "choices": [{"text": "Let her stay till the next port.", "effect": {"text": "She eats everything and fixes the toaster.", "setFlag": "ip_kid", "later": {"event": "ip_kid_back", "jumps": 4}}}, {"text": "Hand her to the port authority.", "effect": {"text": "She doesn't look back.", "rep": {"voltan": -5}}}]},
    {"id": "ip_kid_back", "questOnly": true, "flag": "ip_kid", "title": "A message", "text": "A message from the kid: her family runs a shipyard, and they want to say thank you.", "choices": [{"text": "Accept, gratefully.", "effect": {"text": "They patch your hull and won't take a penny.", "hull": 8, "unscar": 1}}]},
    {"id": "ip_signal", "tags": ["ip_ice"], "art": "distress", "text": "A distress call from inside a comet.", "choices": [{"text": "Investigate.", "effect": {"text": "Nothing but ice."}}], "twist": ["ip_signal_real", "ip_signal_trap"]},
    {"id": "ip_signal_real", "questOnly": true, "art": "distress", "text": "A distress call from inside a comet. A voice, faint: \"Please. We're nearly out of air.\"", "choices": [{"text": "Drill them out (1 fuel).", "req": {"fuel": 2}, "cost": {"fuel": 1}, "effect": {"text": "A Rimeling miner tumbles out, gasping and grateful, and asks to join.", "crew": "ip_rimeling"}}, {"text": "Mark it for the authorities.", "effect": {"text": "You log the location and move on.", "rep": {"voltan": 5}}}]},
    {"id": "ip_signal_trap", "questOnly": true, "art": "distress", "text": "A distress call from inside a comet. A voice, faint: \"Please. We're nearly out of air.\"", "choices": [{"text": "Drill them out (1 fuel).", "req": {"fuel": 2}, "cost": {"fuel": 1}, "effect": {"text": "The comet splits open. It was a pirate hide all along.", "fight": "ip_frostjaw", "afterWin": {"text": "Their stash is full of picks and wine.", "arm": "ip_icepick", "goods": {"ip_icewine": 2}}}}, {"text": "Mark it for the authorities.", "effect": {"text": "Later you hear they found a pirate nest there. A small reward arrives.", "scrap": 15}}]},
    {"id": "ip_soup", "tags": ["ip_ice"], "art": "planet", "text": "A frozen outpost. The settlers haven't had a hot meal in a month.", "choices": [{"text": "Share a meal from the hold.", "req": {"goodsKind": "meal"}, "effect": {"text": "They've never tasted anything so good. They load you up with fuel.", "eatGoods": "meal", "fuel": 3, "rep": {"pebblekin": 8}}}, {"text": "Trade for their spare cells (20 scrap).", "req": {"scrap": 20}, "cost": {"scrap": 20}, "effect": {"text": "Fair trade. Cold hands, warm hearts.", "missiles": 3, "parts": 1}}, {"text": "Wish them luck.", "effect": {"text": "They wave until you're out of sight."}}]}
  ]
}
```
