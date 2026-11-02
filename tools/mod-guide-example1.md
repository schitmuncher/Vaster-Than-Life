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
