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

