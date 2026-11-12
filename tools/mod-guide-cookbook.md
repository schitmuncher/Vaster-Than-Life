
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


### Recipe: a loose end (a story that comes back)

A loose end is picked up in one event and comes back at later beacons, a step at a time. Mark the events with these extra fields (they are never drawn at random; the game brings them up when it's their turn):

- `"starts": "parrot"` — this event can begin the loose end called `parrot`. One of its choices must pick it up with the effect `"thread": { "id": "parrot", "name": "A parrot that knows too much" }`.
- `"thread": "parrot", "step": 1` — the first beat after that; then `"step": 2`, and so on. Beats come in order, at least two jumps apart.
- End it in the last beat with the effect `"endThread": "parrot"`.
- `"threads": ["parrot", "cat"]` — a crossover, only possible while both are loose (`cat` is one of the game's own; others are `hat`, `debt`, `flu`, `crate`, `celeb`, `gnome`, `insp`, `weev`, `ghost`).
- `"aside": true, "thread": "parrot", "into": "pyrate"` — not a beacon: its single choice is added to other events while the loose end is active. `into` is `pay`, `fight`, `gamble`, `distress`, `pyrate`, `mandate` or `any`. Give it `"text": ""` and one choice.

```json
{ "name": "The Parrot", "events": [
  { "id": "par_0", "title": "A parrot", "starts": "parrot", "text": "A parrot lands on the console and says the launch codes. Then it says them again.",
    "choices": [ { "text": "Keep it.", "effect": { "text": "It settles on {crew}'s shoulder.", "thread": { "id": "parrot", "name": "A parrot that knows too much" } } } ] },
  { "id": "par_1", "title": "The parrot", "thread": "parrot", "step": 1, "text": "A Mandate officer wants the parrot. Badly.",
    "choices": [ { "text": "Hand it over.", "effect": { "text": "It bites him. He pays you to take it back.", "scrap": 30, "endThread": "parrot" } } ] },
  { "id": "par_a", "aside": true, "thread": "parrot", "into": "pay", "text": "",
    "choices": [ { "text": "Let the parrot haggle.", "effect": { "text": "It says something unrepeatable. You get a discount.", "scrap": 15 } } ] } ] }
```
