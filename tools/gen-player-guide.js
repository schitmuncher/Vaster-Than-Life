// Builds the "Player's guide" section of README.md from the live game data, so its tables never drift from the game.
// Run it inside the headless test harness (it needs BASE, DATA, LO_*, RANKS...), e.g. `node h.js tools/gen-player-guide.js`.
// It replaces everything between <!-- guide:start --> and <!-- guide:end --> in README.md.
const fs = require('fs'); const ROOT = '/home/claude/vaster-than-life/';
const md = s => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');
const pct = v => `${v >= 1 ? '+' : ''}${Math.round((v - 1)*100)}%`;
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.map(md).join(' | ')} |`)].join('\n');
const out = [];
const P = (...l) => { for(const x of l) out.push(x, ''); };   // blank lines between blocks so GitHub renders every table

P('## Player\'s guide',
  'A detailed reference for everything you do in a run. The tables in this section are generated from the game\'s own data (`tools/gen-player-guide.js`), so the numbers are the ones the game uses. The in-game **Wiki** (title screen) has the same material with links between pages.');

P('### Contents',
  '- [Controls](#controls) · [The screen in a run](#the-screen-in-a-run) · [Your first run](#your-first-run)',
  '- [Crew: the crew screen](#crew-the-crew-screen) · [Crew levels](#crew-levels) · [Classes](#classes) · [Perks](#perks) · [Abilities](#abilities) · [Grenades](#grenades) · [Attachments](#attachments) · [Crew weapons](#crew-weapons)',
  '- [Health and healing](#health-and-healing) · [Food and hunger](#food-and-hunger) · [Skills](#skills) · [Races](#races)',
  '- [Captain level, rank and renown](#captain-level-rank-and-renown) · [Ships](#ships) · [Haven\'s Rest](#havens-rest) · [Difficulty](#difficulty)',
  '- [Saves and your data](#saves-and-your-data) · [Red Dwarf campaign](#red-dwarf-campaign) · [Troubleshooting](#troubleshooting)');

// ---------------- controls ----------------
P('### Controls',
  '**Keyboard and mouse.** Click to do everything; hover anything for a tip.',
  table(['Key', 'What it does'], [
    ['Space', 'Pause or resume (you can give every order while paused)'], ['M', 'Open or close the map'], ['S', 'Open or close the Ship screen'], ['1–4', 'Pick a powered weapon to aim'],
    ['V', 'Hold fire (let every weapon charge) / fire at will'], ['F', 'Autofire on or off'], ['C', 'Cloak (if you have Cloaking)'], ['H', 'Send all crew back to their stations'],
    ['+ / −', 'Game speed up or down (50% to 125%)'], ['Esc', 'Close the window, or drop the current selection'], ['T or Enter', 'Quick chat (multiplayer)'], ['Arrow keys + Enter', 'Move between buttons and press them']]),
  '**Touch (phones and tablets).** Tap to act; taps are forgiving and land on the nearest button. Press and hold anything to read its tip. Pinch to zoom (over the ships it zooms the battle view, elsewhere the whole screen), drag to pan while zoomed, double-tap empty space to zoom in or out, and tap with two fingers to pause. The Android back gesture closes the open window.',
  '**Game controller (flat screen).**',
  table(['Button', 'What it does'], [['Left stick', 'Free cursor'], ['D-pad', 'Jump between buttons and rooms'], ['A', 'Select'], ['B', 'Back / close'], ['X', 'Hold fire / fire at will'], ['Y', 'Map'], ['LB / RB', 'Step through powered weapons and park the cursor on the enemy'], ['LT', 'Crew back to stations'], ['RT', 'Autofire on or off'], ['Back / View', 'Ship screen'], ['Start / Menu', 'Pause']]),
  '**Meta Quest, in VR.** Point and pull the trigger to press anything; one pull is one press. Grip while pointing at the console or holotable to move it (grip its edges or corners to resize, or use two hands). A or X pauses, B or Y opens the map. Click the left stick for the datapad (the whole game screen on a tablet in your hand); click the right stick to reset your position. You can also touch screens and buttons with the controller tip.',
  '**Meta Quest, flat browser (no headset session).** The laser pointer works like a mouse: a press counts the moment the trigger goes down, a shaky laser still lands on the nearest button, and a doubled press only counts once.');

P('### The screen in a run',
  table(['Where', 'What it shows'], [
    ['Top left', 'Hull (your ship\'s life), shields (layers up), evasion and average oxygen'],
    ['Top middle', 'Scrap (money), fuel (one per jump), missiles, drone parts and food (meals for the crew)'],
    ['Top centre-right', 'Sector and its type; in the last sector, the Flaggship\'s progress'],
    ['VTL drive', 'Charges during a fight while someone flies the ship; when it is full you can jump away'],
    ['Jump / Map', 'Opens the map (it says Jump when the drive is charged in a fight)'],
    ['Crew', 'The crew screen: everyone\'s level, health, food, class, weapons, perks and abilities'],
    ['Ship', 'Systems and upgrades, weapons and cargo, crew, armoury, factions, hold, garden, workshop, log'],
    ['Pause', 'Pause; every order still works while paused'],
    ['Your ship (left)', 'Rooms, systems, fires, breaches, oxygen and crew. Click a crew member, then a room, to move them'],
    ['The enemy (right)', 'Their ship. Pick a weapon, then a room, to aim'],
    ['Crew row', 'Everyone aboard: tap once to select, tap the selected person again for their crew screen. A coloured dot means they are hungry'],
    ['Power', 'Reactor bars per system: + and − under each one'],
    ['Weapons and drones', 'Each weapon\'s charge; power, aim, Hold fire, Autofire']]));

P('### Your first run',
  '1. **New run → pick a ship.** Easy is the gentle way in. The Admiral sends you off with a gift: take one.',
  '2. **Open the Map** and jump to a beacon joined to yours. Each jump costs 1 fuel, and the Rebuff Fleet follows you from the left; keep ahead of it.',
  '3. **Beacons** are events (?), fights, stores, quiet spots, distress calls and quests. Stores and exits are always marked.',
  '4. **In a fight**: power your weapons, pick one, then click an enemy room (shields first, then weapons). Pause whenever it gets busy.',
  '5. **Damage control**: send crew to fires, breaches and broken systems; hurt crew walk to the medbay.',
  '6. **Spend scrap** at stores and on upgrades (Ship → Systems). A second shield layer is the best early upgrade.',
  '7. **Feed the crew**: they eat between jumps from the Food count; buy more at stores (Supplies) before it runs low.',
  '8. **Reach the exit** of each sector, pick the next one, and in the last sector catch and beat the Flaggship three times.',
  'Every run earns captain xp and renown, win or lose. The **Tutorial** on the title screen (Guided practice) teaches all of this hands-on.');

// ---------------- crew ----------------
P('### Crew: the crew screen',
  'Tap **Crew** in the top bar, or tap someone in the crew row twice. One page shows everything about them:',
  '- **Level and xp**, with what the next level brings.',
  '- **Health, food, damage, repair and speed**, and where each comes from (weapon, attachments, perks, level, prestige, food).',
  '- **Skills**: six of them, untrained → skilled → expert.',
  '- **Class**: tap a class to give it to them, or **+ Save class** to keep their set-up as your own.',
  '- **Slots**: primary and secondary weapons (two attachments each), armour, lethal and tactical grenades, three perks plus a wildcard, and four abilities. Tap any slot to see every option, what it does and when it unlocks.',
  '- **Feed** someone now, **Save to roster** to keep them for later runs, or **Rename** them.');

const unlockAt = {}; for(const [k, v] of Object.entries(LO_UNLOCK)) (unlockAt[v] = unlockAt[v] || []).push({ lethal:'Lethal grenade slot', secondary:'Secondary weapon', perk1:'Perk slot 1', tactical:'Tactical grenade slot', perk2:'Perk slot 2', perk3:'Perk slot 3' }[k]);
for(const g of Object.values(LO_LETHAL)) if(g.lvl > LO_UNLOCK.lethal) (unlockAt[g.lvl] = unlockAt[g.lvl] || []).push(g.name);
for(const g of Object.values(LO_TACT)) if(g.lvl > LO_UNLOCK.tactical) (unlockAt[g.lvl] = unlockAt[g.lvl] || []).push(g.name);
LO_ABIL_L.forEach((l, i) => (unlockAt[l] = unlockAt[l] || []).push(`Ability slot ${i + 1}`)); (unlockAt[LO_MAXL] = unlockAt[LO_MAXL] || []).push('Prestige');
const lvRows = []; let tot = 0; for(let L = 1; L <= LO_MAXL; L++){ const c = { lvl:L, pres:0 }; const B = loBonus(c); if(L > 1) tot += loNeed(L - 1);
  if(L===1 || unlockAt[L] || L % 5===0) lvRows.push([L, L===1 ? '0' : fmtNum(tot), `+${B.hp} health, +${(B.dmg*100).toFixed(1)}% damage, +${Math.round(B.rep*100)}% repair`, (unlockAt[L] || []).join(', ') || '—']); }
P('### Crew levels',
  `Crew earn xp for what they do: kills (10 each), every fight they live through (15, or 5 if the enemy got away), repairs, firefighting, and time spent manning the helm, engines, shields and weapons. They level up to ${LO_MAXL}. Every level makes them a bit better at everything, and some levels open slots.`,
  table(['Level', 'Total xp', 'Bonus over level 1', 'Unlocks'], lvRows),
  `**Prestige** (at level ${LO_MAXL}, up to 10 times): back to level 1, losing the level bonus and the perk and grenade slots until they level again, but keeping their abilities. Each prestige adds +5 maximum health and +3% damage for good, and the first one opens a **wildcard perk slot** that takes any perk. Prestige shows as ★ next to their level.`);

P('### Classes',
  'A class is a set-up you can give to anyone in one tap: perks, grenades and abilities as far as their level allows, and the matching weapons from the locker (best tier and weapon level first) if you have them. Six come with the game; save up to eight of your own from the crew screen (**+ Save class**, then name it). Your classes are kept for every run.',
  table(['Class', 'Primary', 'Secondary', 'Perks', 'Grenades', 'Abilities', 'Good for'], LO_PRESETS.map(k => [k.name, (LO_CLASS[k.prim] || {}).name, (LO_CLASS[k.sec] || {}).name, k.perks.map(p => LO_PERKS[p].name).join(', '), `${LO_LETHAL[k.lethal].name}, ${LO_TACT[k.tactical].name}`, k.abil.map(a => LO_ABIL[a].name).join(', '), k.text])));

P('### Perks',
  `Three slots (open at levels ${LO_UNLOCK.perk1}, ${LO_UNLOCK.perk2} and ${LO_UNLOCK.perk3}), four perks each, plus a wildcard slot after the first prestige. Use a perk enough and its **Pro** version unlocks for everyone, for good.`,
  table(['Slot', 'Perk', 'Effect', 'Pro version', 'Pro unlocks after'], Object.values(LO_PERKS).map(p => [p.slot, p.name, p.text, p.pro.replace(/^Pro: /, ''), `${p.goal} ${p.stat==='heal' ? 'health healed' : p.stat==='fixes' ? 'repairs' : 'kills'} with it`])));

P('### Abilities',
  `One ability slot opens at each of levels ${LO_ABIL_L.join(', ')}. Abilities are kept through prestige, and no one can take the same ability twice.`,
  table(['Ability', 'Effect'], Object.values(LO_ABIL).map(a => [a.name, a.text])));

P('### Grenades',
  'Each crew member throws their lethal and tactical grenade once a fight, automatically, the first time they share a room with a foe. The Scavenger Pro perk gives an extra one of each.',
  table(['Kind', 'Grenade', 'Level', 'Effect'], [...Object.values(LO_LETHAL).map(g => ['Lethal', g.name, g.lvl, g.text]), ...Object.values(LO_TACT).map(g => ['Tactical', g.name, g.lvl, g.text])]));

P('### Attachments',
  'Crew weapons level up across all your runs (kills and time in fights with that weapon), up to level 10. Each weapon level opens attachments for its class; two can be fitted at once.',
  table(['Attachment', 'Weapon level', 'Fits', 'Effect'], Object.values(LO_ATT).sort((a, b) => a.lvl - b.lvl).map(a => [a.name, a.lvl, a.cls.map(c => (LO_CLASS[c] || {}).name || c).join(', '), a.text])));

const wRows = LO_WEAPONS.map(([id, name, cls, tier, cost]) => { const d = DATA.arms[id] || {}; return [name, (LO_CLASS[cls] || {}).name, LO_CLASS[cls].slot, tier, cost, `×${(d.dmg || 1).toFixed(2)}`, typeof armStatLine==='function' ? armStatLine(d) : '', d.desc]; });
P('### Crew weapons',
  'Primary weapons are what crew fight with; the secondary takes over when the primary breaks (from level 3). Weapons wear out with use: repair them in the Armoury with a drone part or at a store. Buy them at stores (Armoury tab) or take them from beaten boarders.',
  table(['Weapon', 'Class', 'Slot', 'Tier', 'Cost', 'Damage', 'Notes', 'Description'], wRows));

// ---------------- health, food, skills, races ----------------
P('### Health and healing',
  '- **The medbay** heals crew standing in it; more power heals faster. Hurt crew walk there on their own when it is safe. It heals up to their *current* maximum health.',
  '- **Maximum health** comes from their race, plus their level (+1 a level), prestige (+5 each), the Juggernaut ability (+30), a Hearty meal while it lasts, and minus any hunger penalty.',
  '- **Healing in a fight**: the Field Medic perk and Field Surgeon ability heal everyone in their room; the Stim Shot grenade heals the thrower 35; Second Wind gives 40 back once a fight; Last Stand stops a killing blow once.',
  '- **Between fights**: a clone bay (if you have one) heals 20 every jump; stores sell full medical care (Supplies); events that rest or treat the crew heal them and also fill them up.',
  '- **Health rewards and hunger**: because hunger takes maximum health away and the medbay cannot feed anyone, food and the healing events are what get a worn-out crew back to full.');

P('### Food and hunger',
  `Crew eat between jumps, by themselves, hungriest first. Fullness runs from 0 to 100. Every jump costs ${HUNGER_JUMP}; fighting hand to hand costs about ${(HUNGER_FIGHT*60).toFixed(1)} a minute; each repair costs ${HUNGER_REPAIR}; each kill ${HUNGER_KILL}. Anyone under ${EAT_BELOW} eats at the next jump.`,
  table(['Fullness', 'State', 'Effect'], HUNGER_TIERS.map((t, i) => [`${t.at}${i ? '–' + (HUNGER_TIERS[i - 1].at - 1) : '+'}`, t.name, t.text.replace(/^[^:]+: /, '')])),
  '**What they eat**, in this order: meals from the ship\'s Food store (top bar; each fills 35), then the cheapest food in the hold. Goods that Haven\'s Rest still needs are only eaten by the starving; cooked meals are kept for feasts unless someone is starving (then they fill 70).',
  table(['Food in the hold', 'Fills'], Object.entries(FOOD_VAL).map(([id, v]) => [(goodsDef(id) || {}).name || id, v]).concat([['Any cooked meal (only when starving)', 70]])),
  '**Getting food**: every run starts with about four meals per crew member; stores sell **Food ×5** under Supplies; half of all beaten ships leave 1–3 meals; events give food or heal-and-feed the crew. Tap **Feed** on the crew screen to feed someone straight away.',
  '**Appetite** depends on race (see Races below): 1 is normal, more means they get hungry faster, 0 means they never eat. Hunger can be turned off in **Settings → Gameplay → Crew hunger**. The tutorial never uses it.');

P('### Skills',
  'Crew improve at what they do. Each skill has two steps, skilled and expert.',
  table(['Skill', 'Practised by', 'Skilled at', 'Expert at', 'Untrained / skilled / expert'], SKILLS.map(k => [SKILLN[k], { pilot:'flying (manning the helm in fights)', engines:'manning engines in fights', shields:'manning shields as they recharge', weapons:'manning weapons as they fire', repair:'fixing systems, patching breaches', combat:'kills in hand-to-hand fights' }[k], SKILLT[k][0], SKILLT[k][1], SKILL_FX[k].join(' / ')])));

P('### Races',
  table(['Race', 'Health', 'Repair', 'Combat', 'Speed', 'Appetite', 'Traits'], Object.entries(BASE.races).filter(([id, r]) => r && !r.secret).map(([id, r]) => [r.name, r.hp || 100, pct(r.repair || 1), pct(r.combat || 1), pct(r.speed || 1), (() => { const a = appetite({ race:id, owner:'p' }); return a ? '×' + a : 'never eats'; })(), r.desc])));

// ---------------- career ----------------
const capRows = []; for(const L of [2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 55]) capRows.push([L, fmtNum(capXpFor(L))]);
P('### Captain level, rank and renown',
  `**Captain level** rises every run, win or lose, up to ${CAP_MAX}. Then you can prestige (Career screen) to start again at level 1 with a ★; up to 10 times. Levels clear new ships for the hangar, and prestiges count towards those, so nothing locks again. The title screen shows your level, the bar to the next one and what you earned last run.`,
  table(['You get xp for', 'Xp'], [['Each jump', 10], ['Each event choice', 12], ['Each ship beaten (escaped: 10)', '40 + 10 × sector'], ['Each new sector', 100], ['Each Flaggship phase beaten', 250], ['Winning the run', 1000], ['Losing a run', '50 + 25 per sector crossed'], ['Each boarder killed', 5], ['Each repair', 2], ['A crew member levelling up', 20], ['Each new medal', 50], ['Difficulty', 'Easy ×0.8, Hard ×1.25']]),
  table(['Captain level', 'Total xp'], capRows),
  '**Rank** (Cadet to Admiral) comes from **renown**, earned at the end of each run (sectors crossed, ships beaten, the Flaggship, a win, crew brought home, story scenes and new endings, more on harder difficulty and alert levels). Ranks bring better send-off gifts and requisition tokens. Renown can also be spent rebuilding Haven\'s Rest wings without lowering your rank.',
  table(['Rank', 'Renown', 'Reward'], RANKS.map(r => [r.name, fmtNum(r.at), r.reward || '—'])));

const ships = Object.values(DATA.ships).filter(d => d && !d.secret); const chT = c => { try{ return typeof chParts==='function' && c ? chParts(c).map(p => Array.isArray(p) ? p[2] : p.text || p.t || p).filter(x => typeof x==='string').join(', ') : ''; }catch(e){ return ''; } };
P('### Ships',
  `${ships.length} ships, grouped into classes (layouts A, B and C of each design). The hangar shows what each one needs: a captain level, sometimes a challenge, or a requisition token from a rank.`,
  table(['Ship', 'Class', 'Hull', 'Reactor', 'Crew', 'Captain level', 'Also needs'], ships.map(d => { const p = typeof shipProg==='function' ? shipProg(d) : {}; return [d.name, d.cls || '', d.hull, d.reactor, (d.crew || []).length, p.lvl || 1, chT(p.ch) || '—']; })));

if(typeof HAVEN_WINGS!=='undefined') P('### Haven\'s Rest',
  'Your great-uncle\'s old station, restored across runs. Collect each wing\'s goods in any run and send them home from any store (**Trade → Send home**: pick how many with − and +, then Send) or from the station itself. What you send is kept for good. Or rebuild a wing outright with renown.',
  table(['Wing', 'Needs', 'Or renown', 'Gives'], HAVEN_WINGS.map(w => [w.name, w.needs.map(([it, n]) => `${n} ${needName(it)}`).join(', '), w.renown, w.reward])));

P('### Difficulty',
  table(['Setting', 'Scrap', 'Start scrap', 'Enemy hull', 'Your evasion', 'Fleet', 'Other'], Object.values(DIFFICULTY).map(d => [d.name, '×' + d.scrap, (d.startScrap > 0 ? '+' : '') + (d.startScrap || 0), (d.enemyHull > 0 ? '+' : '') + (d.enemyHull || 0), (d.evade > 0 ? '+' : '') + (d.evade || 0) + '%', d.fleet ? '×' + d.fleet : 'normal', [d.patch ? `patch ${d.patch} hull after fights` : '', d.foeMelee ? `boarders ×${d.foeMelee}` : '', d.bossShields ? `Flaggship shields ${d.bossShields}` : ''].filter(Boolean).join(', ') || '—'])),
  'Rebuff alert levels (opened by winning at your highest level on Normal or Hard) make runs harder again for more renown.');

// ---------------- saves ----------------
P('### Saves and your data',
  `- **Save slots**: Settings → Profile, or the save button next to Career on the title screen. Up to ${SLOT_MAX} separate careers on one device, each with its own record, medals, unlocks, captain level, roster, classes and run in progress. Settings are shared.`,
  '- **Play this save** switches careers (the game reloads). **Rename** names a save. **Delete** removes another save; on the save you are playing it says **Clear this save** and starts it fresh. Both ask twice.',
  '- **Download all data** saves every save, your settings and your mods to one file. **Load data file** brings it back, on this device or another: the easy way to move from a phone to a Quest. Older single-career backup files (Record screen) still load into the save you are playing.',
  '- **Clear all data** deletes every save, setting and mod on this device (it asks twice).',
  '- The run saves itself between fights. Browsers can clear site data, so download your data now and then.');

// ---------------- Red Dwarf ----------------
try{ const rd = JSON.parse(fs.readFileSync(ROOT + 'mods/red-dwarf.json', 'utf8')); const C = rd.campaign;
  P('### Red Dwarf campaign',
    `${rd.name} is a campaign mod in the library (unofficial fan campaign; all text original). Turn it on in **Mods**, then pick it with the Campaign arrows at the top of the hangar. Fly ${C.ships.map(id => (rd.ships.find(s => s.id===id) || {}).name || id).join(' or ')} with ${C.crew.map(c => c.name).join(', ')}, after the Simulants who towed Red Dwarf away. Hunger applies to the crew who eat (holograms and mechanoids don't).`,
    table(['Sector', 'What it is like'], rd.sectors.filter(s => s.id!=='laststand').map(s => [s.name, s.blurb])),
    `It has ${rd.events.length} scenes (a story scene in every sector, picked from several each run, plus encounters), ${rd.enemies.length} enemy ships, ${rd.weapons.length} trick weapons, ${rd.drones.length} drones, ${rd.augments.length} augments and ${rd.arms.length} personal weapons. Along the way you may meet people who will join you: a hologram navigator and a Simulant who has changed sides.`); }catch(e){}

P('### Troubleshooting',
  '- **Buttons need two presses in VR**: update to the latest version (tips no longer float in front of the screen and event text appears at once). If it still happens, tell us which screen.',
  '- **Quest flat browser feels hit and miss**: the latest version reads a press the moment the trigger goes down and snaps to the nearest button. Make sure the page has reloaded after an update.',
  '- **Text is too small**: Settings → Accessibility (text size), or Settings → VR console (text size and the magnifier) in VR.',
  '- **My progress is gone**: check the save button on the title screen (you may be on another save). If the browser cleared its data, load your last **Download all data** file.',
  '- **Not enough storage to switch saves**: download your data, then delete a save you no longer need.',
  '- **Crew keep losing health between fights**: they are probably hungry (dot on their chip); buy Food at a store.',
  '- **A mod broke something**: turn it off in Mods; Settings → Gameplay → Allow mod scripts stays off unless you trust a mod.');

const text = out.join('\n'); const README = ROOT + 'README.md'; let r = fs.readFileSync(README, 'utf8');
const a = '<!-- guide:start -->', b = '<!-- guide:end -->';
if(r.includes(a)) r = r.slice(0, r.indexOf(a)) + a + '\n' + text + '\n' + r.slice(r.indexOf(b));
else r = r.replace('\n## What\'s in the game', `\n${a}\n${text}\n${b}\n\n## What's in the game`);
fs.writeFileSync(README, r); console.log('guide lines', out.length, 'chars', text.length);
