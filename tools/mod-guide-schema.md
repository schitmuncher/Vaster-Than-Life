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
