'use strict';
/* =========================================================================
   Saga: the crew are people, and every run is a story worth retelling.
   In the spirit of the absurd trail games (a small crew you grow fond of,
   strange things on the road, deaths that get remembered):
   - Personalities: every crew member has a quirk (Gambler, Poet, Cook...)
     with their own chatter, last words, beacons where they take the lead,
     and [quirk] options in events.
   - Bonds: best friends, siblings, rivals and sweethearts. They banter
     between beacons, and grieve (or get even) when the other one dies.
   - Crew moments: short scenes starring one crew member, some of which
     come back later in the run (an egg, a debt, a cursed statue...).
   - A ship's pet you can adopt, name and lose.
   - A nemesis: an enemy captain who gets away comes back for you, angrier
     and better armed, until one of you is finished.
   - Remembering the fallen: last words, cause of death, a ghost or two.
   - The saga: at the end of a run, the whole story written out, kept in
     your record.
   Placeholders: {crew} the crew member the scene is about, {friend} their
   bonded crewmate, {fallen} a crew member who died this run, {pet} the
   ship's pet, {nemesis} your nemesis, plus the usual {ship}, {who}, {enemy}.
   ========================================================================= */

/* ---------------- personalities ---------------- */
BASE.quirks = {
  gambler:      { name:'Gambler',         desc:'Will bet on anything. Usually loses. Sometimes wins enormously.' },
  poet:         { name:'Poet',            desc:'Writes verse about every explosion. Some of it rhymes.' },
  cook:         { name:'Galley cook',     desc:'Can make a meal out of anything, and frequently does.' },
  superstitious:{ name:'Superstitious',   desc:'Knows every omen in the galaxy and believes all of them.' },
  daredevil:    { name:'Daredevil',       desc:'Has never once read a safety notice. Has been on fire several times.' },
  worrier:      { name:'Worrier',         desc:'Checks the oxygen seals before bed, after bed and during bed.' },
  tinkerer:     { name:'Tinkerer',        desc:'Cannot leave a machine alone. The machines are nervous.' },
  romantic:     { name:'Romantic',        desc:'Has a sweetheart at every third beacon and writes to all of them.' },
  conspiracy:   { name:'Conspiracy buff', desc:'Has a wall of red string about the Rebuff Fleet. It is getting crowded.' },
  sleepwalker:  { name:'Sleepwalker',     desc:'Wanders the ship at night. Has woken up in the airlock twice.' },
  collector:    { name:'Collector',       desc:'Keeps everything. The cargo hold is mostly their stuff now.' },
  expyrate:     { name:'Ex-pyrate',       desc:'Used to be a pyrate. Says they are "mostly retired".' },
  mystic:       { name:'Mystic',          desc:'Sees visions in nebula gas. A worrying number come true.' },
  optimist:     { name:'Optimist',        desc:'Believes everything will be fine, right up until the hull breach.' },
  grump:        { name:'Grump',           desc:'Hates everything. Secretly loves the crew. Would never say so.' },
  bookworm:     { name:'Bookworm',        desc:'Has read every manual on board, including the one for the toaster.' }
};
function quirkDef(k){ return k && ((DATA && DATA.quirks && DATA.quirks[k]) || BASE.quirks[k]) || null; }
function quirkName(c){ const q = quirkDef(c && c.quirk); return q ? q.name : ''; }
function rollQuirk(avoid){ const ks = Object.keys((DATA && DATA.quirks) || BASE.quirks), free = ks.filter(k => !(avoid||[]).includes(k)); return pick(free.length ? free : ks); }

/* what each personality says, by moment (the same triggers as crew chatter) */
const QUIRK_SAY = {
  gambler:{ idle:['Five scrap says the next beacon is empty.','Anyone for cards? Loser cleans the airlock.','I can feel it. Today is my lucky day. I said that yesterday too.'], jump:['Double or nothing on this jump!','I bet we land somewhere nice. Fifty-fifty.'], victory:['Called it! Pay up, everyone.','I had money on that.'], hit:['There goes my lucky streak.'], lowHull:['All in. We are all in.'] },
  poet:{ idle:['"O hull, my hull, thy rivets gleam..." no, wait.','What rhymes with "Rebuff"? Apart from "enough".','I am writing an ode to the oxygen scrubber.'], jump:['Into the dark, like a verse into silence!','Ah, hyperspace. Very blue. Very poignant.'], victory:['That shall be stanza nine!','Their ship falls, like a sonnet, in fourteen pieces.'], hit:['A tragic turn in the second act!'], fire:['Fire! The great metaphor!'] },
  cook:{ idle:['Who wants soup? It is mostly soup.','I found a jar of something. Dinner is going to be brave tonight.','Do not open the fridge. It is resting.'], jump:['Hold on to your plates!'], victory:['Victory stew tonight!','I will make them a cake. A memorial cake.'], hit:['My soufflé!'], fire:['That is not my cooking, I swear.'] },
  superstitious:{ idle:['Nobody whistle on the bridge. Ever.','I saw a black comet. We are doomed. Again.','Touch the hull for luck. Not that bit, it is hot.'], jump:['Left foot first, everyone! LEFT!','Did anyone salute the beacon? Someone salute the beacon.'], victory:['The lucky socks worked.'], hit:['Someone broke a mirror, didn\'t they.'], lowHull:['I knew it. I KNEW it. The comet.'] },
  daredevil:{ idle:['Let\'s fly closer to the sun next time.','I could totally jump between ships without a suit.','Boring. Can we find a pulsar?'], jump:['Woooo! Again!','Can we do that faster?'], victory:['Let\'s find a bigger one!'], hit:['Ha! Barely felt it!'], fire:['Ooh, fire!'], lowHull:['Now THIS is living!'] },
  worrier:{ idle:['Is that noise normal? That noise is not normal.','I checked the seals. I will check them again.','What if the fleet is already ahead of us?'], jump:['Is everyone strapped in? Are you sure?','What if we land in a sun?'], victory:['Oh thank goodness. Thank goodness.'], hit:['I said this would happen!'], lowHull:['I have prepared a list of everything going wrong. It is long.'] },
  tinkerer:{ idle:['I\'ve improved the toaster. It now has a reactor.','Nobody touch the blue wire. Or the red one. I moved them.','I could get one more percent out of the engines. Probably.'], jump:['Hear that hum? That\'s my modification.'], victory:['Can I have their parts? Please?'], repair:['Better than it was before!','Now with extra bolts.'] },
  romantic:{ idle:['I wonder if there\'s a letter for me at the next beacon.','Stars are just very distant candles, really.','Has anyone seen my locket?'], jump:['Somewhere out there, someone is thinking of me.'], victory:['I must write to everyone about this!'], hit:['Not my good side!'] },
  conspiracy:{ idle:['The stores are all owned by the same person. Think about it.','The Rebuff Fleet doesn\'t exist. Then who is chasing us? Exactly.','Why is it always THREE scrap for fuel? Coincidence?'], jump:['They want us to jump. Which is why we must. Or mustn\'t.'], victory:['That ship was a decoy. Mark my words.'], hit:['They knew we were coming.'] },
  sleepwalker:{ idle:['*yawn* Did I miss anything? Why am I in the airlock?','I had the strangest dream about a door.','Who moved my bunk to the engine room?'], jump:['Zzz... wha? Are we there?'], victory:['Did we win? I was asleep.'] },
  collector:{ idle:['I\'m keeping that bolt. It has character.','The hold is not full, it is curated.','Do you think the enemy captain would sell me their hat?'], victory:['Dibs on the wreckage!','I want the steering wheel.'], hit:['My collection!'] },
  expyrate:{ idle:['Back in my pyrate days we\'d have boarded them for fun.','I still know a fence two sectors over. Just saying.','Arr. Sorry. Old habit.'], jump:['Hoist the... sorry. Habit.'], victory:['Strip it to the frame, lads!','Proper pyrate work, that.'], boarders:['Amateurs. Let me handle this.'] },
  mystic:{ idle:['The nebula speaks to me. It mostly complains.','I see... a store. Or a black hole. It\'s blurry.','Beware the third beacon. Or the fourth. One of them.'], jump:['The stars align. Roughly.'], victory:['As I foresaw. Mostly.'], hit:['I did not foresee that.'] },
  optimist:{ idle:['Every jump is a new adventure!','The fleet is probably miles behind. Probably!','Look, a hull breach is just a window you didn\'t plan.'], jump:['Here we go! It will be lovely!'], victory:['See? Everything works out!'], hit:['Only a scratch!'], lowHull:['Still flying! That\'s a win!'], fire:['At least it\'s warm!'] },
  grump:{ idle:['Hmph.','This ship smells of feet.','Nobody talk to me until the next sector.'], jump:['Great. Another beacon. Wonderful.'], victory:['Fine. That was... fine.','Don\'t expect me to celebrate.'], hit:['Typical.'], repair:['Do I have to do everything?'] },
  bookworm:{ idle:['Page 412 of the manual says we\'re doing this wrong.','Did you know the reactor has a warranty? It expired.','Shh, I\'m at a good bit.'], jump:['According to chapter three, that was a textbook jump.'], victory:['Exactly as described in "Ship Combat for Beginners".'], hit:['That is NOT in the manual.'] }
};
const LAST_WORDS = {
  generic:['Tell my mother... actually, don\'t tell her anything.','Was that... the oxygen?','I left the kettle on.','Keep flying. Don\'t look back. Maybe look back a little.','At least I don\'t have to do the dishes.','I should have stayed a farmer.','Tell them I went out fighting. Or at least standing up.','Huh. So that\'s what that button does.'],
  gambler:['I\'d have won the next hand.','Bet you didn\'t see that coming.'],
  poet:['And so... the final stanza...','No... rhyme... for... this...'],
  cook:['The stew... stir the stew...','There\'s a pie in the oven. Don\'t let it burn.'],
  superstitious:['It was the comet. I told you about the comet.','Somebody whistled. I heard it.'],
  daredevil:['Worth it!','Watch this!'],
  worrier:['I knew it. I KNEW it.','Did I... check the seals?'],
  tinkerer:['Don\'t touch the blue wire.','Almost... fixed...'],
  romantic:['Give my letters to... all of them.','Tell them I loved them. All of them.'],
  conspiracy:['They got to me. Remember the red string.','It was... an inside job...'],
  sleepwalker:['Five more minutes...','Is this a dream?'],
  collector:['My collection... it\'s yours now.','Keep the bolt. The one with character.'],
  expyrate:['Arr...','Bury my scrap where nobody will find it.'],
  mystic:['I saw this coming. I should have said.','The nebula was right.'],
  optimist:['It\'s fine! Everything is... fine...','What a ride!'],
  grump:['Finally. Some peace and quiet.','Don\'t you dare make a speech.'],
  bookworm:['I never finished the last chapter.','This wasn\'t in the manual.']
};

/* ---------------- bonds ---------------- */
const BOND_KINDS = { friends:'best friends', siblings:'siblings', rivals:'rivals', sweethearts:'sweethearts' };
const BANTER = {
  friends:[['Remember that beacon with the singing asteroid?','Never speak of the singing asteroid.'],['Saved you a seat.','You always do.'],['If we make it out of this, drinks are on me.','You said that last sector.'],['You snore, you know.','I do not. You snore.']],
  siblings:[['Mum would be so proud of us.','Mum would be FURIOUS with us.'],['That\'s my spanner.','It was your spanner. Now it\'s mine.'],['Stop copying me.','Stop copying me.'],['Remember when we were small and wanted to fly?','We are flying. Into gunfire. Dreams come true.']],
  rivals:[['I fixed more systems than you today.','I fixed the ones that mattered.'],['Nice shot. For you.','Nice face. For you.'],['When this is over, you and me, outside.','We\'re in space. Everything is outside.'],['I\'m the best pilot on this ship.','You\'re the loudest pilot on this ship.']],
  sweethearts:[['Did you get my note?','The one in the fuel tank? Yes.'],['Look, a nebula. It\'s the colour of your eyes.','My eyes are brown.'],['Promise me we\'ll see the end of this together.','I promise. Now fix the shields.'],['I wrote you a poem.','Please don\'t read it over comms.']]
};
const GRIEF = {
  friends:['{fallen}! No! Not you!','I\'ll finish this for both of us, {fallen}.'],
  siblings:['{fallen}... I was supposed to look after you.','Who\'s going to steal my spanner now, {fallen}?'],
  rivals:['I always said I\'d outlast you, {fallen}. I didn\'t want to.','Get up, {fallen}! You don\'t get to win like that!'],
  sweethearts:['{fallen}! You promised!','I\'ll love you to the last beacon, {fallen}.']
};
function crewById(id){ if(!G || !G.ship) return null; return G.ship.crew.find(c => c.id===id) || (G.enemy && G.enemy.crew.find(c => c.id===id)) || null; }
function mineAlive(){ return G && G.ship ? G.ship.crew.filter(c => c.owner==='p' && !c.drone) : []; }
function bondOf(c){ if(!c || !c.bond) return null; const o = crewById(c.bond.id); return o ? { other:o, kind:c.bond.kind } : null; }
function makeBond(a, b, kind){ if(!a || !b || a===b) return;
  for(const x of [a, b]) if(x.bond && !x.bond.lost){ const o = crewById(x.bond.id); if(o && o.bond && o.bond.id===x.id) o.bond = null; }   // one bond each: an old one ends
  a.bond = { id:b.id, kind }; b.bond = { id:a.id, kind }; }
function rollBondKind(){ return wpick(['friends','siblings','rivals','sweethearts'], k => ({ friends:4, siblings:2, rivals:3, sweethearts:1.5 })[k]); }

/* ---------------- run life cycle (called from run.js and ship.js) ---------------- */
function sagaRunStart(loaded){
  if(!G || !G.ship) return; const crew = mineAlive();
  // personalities: one each, no two crew alike at the start
  const used = []; for(const c of crew){ if(!c.quirk || (!loaded && used.includes(c.quirk))) c.quirk = rollQuirk(used); used.push(c.quirk); }
  G.saga = G.saga || []; G.fallen = G.fallen || []; G.crewJoined = G.crewJoined || {};
  if(loaded) return;
  if(crew.length >= 2 && Math.random() < .8){ const a = pick(crew), b = pick(crew.filter(c => c!==a)); makeBond(a, b, rollBondKind()); }
  const names = crew.map(c => `${c.name} the ${quirkName(c).toLowerCase() || 'crew member'}`);
  sagaNote('start', `${shipThe(true)} set out from the Civilian Sector with ${listText(names)}.`);
  const pair = crew.find(c => c.bond); if(pair){ const o = crewById(pair.bond.id); if(o) sagaNote('bond', `${pair.name} and ${o.name} were ${BOND_KINDS[pair.bond.kind]}, which everyone heard about constantly.`); }
}
function sagaNote(k, t){ if(!G) return; (G.saga = G.saga || []).push({ s:G.sector || 1, j:G.stats ? G.stats.jumps : 0, k, t }); if(G.saga.length > 60) G.saga.splice(1, 1); }
/* "the Kestrel", but not "the The Pestrel" */
function shipThe(cap){ const n = (G && G.ship && G.ship.name) || 'ship'; return /^the /i.test(n) ? (cap ? n : n.replace(/^the /i, 'the ')) : (cap ? 'The ' : 'the ') + n; }
function listText(a){ return a.length <= 1 ? (a[0]||'') : a.slice(0,-1).join(', ') + ' and ' + a[a.length-1]; }
function sagaJoined(c, how){
  if(!G || !c || c.owner!=='p' || c.drone) return;
  if(!c.quirk) c.quirk = rollQuirk(mineAlive().filter(o => o!==c).map(o => o.quirk));
  (G.crewJoined = G.crewJoined || {})[c.id] = G.stats ? G.stats.jumps : 0;
  const lonely = mineAlive().filter(o => o!==c && !o.bond);
  if(!c.bond && lonely.length && Math.random() < .35){ const o = pick(lonely), k = wpick(['friends','rivals','sweethearts'], k => ({ friends:4, rivals:3, sweethearts:1 })[k]); makeBond(c, o, k);
    sagaNote('bond', `${c.name} and ${o.name} became ${BOND_KINDS[k]} almost at once.`); }
  const who = `${c.name}, a ${(DATA.races[c.race]||{}).name || ''} ${quirkName(c).toLowerCase()}`;
  sagaNote('join', pick([`In sector ${G.sector}, ${who}, joined the crew${how ? ' ' + how : ''}.`, `${who}, came aboard in sector ${G.sector}${how ? ' ' + how : ''}.`, `The crew grew by one in sector ${G.sector}: ${who}${how ? ', ' + how : ''}.`]));
}
function sagaSector(n, type){ if(!G || n <= 1) return; const sd = DATA.sectors[type]; if(!sd) return;
  const t = pick(['They crossed into sector {n}, {s}.','Sector {n} brought them to {s}.','On they went, into {s} (sector {n}).','By sector {n} they had reached {s}.']);
  sagaNote('sector', t.replace('{n}', n).replace('{s}', /^the /i.test(sd.name) ? sd.name : 'the ' + sd.name)); }

/* why someone died, worked out from where they were standing */
function deathCause(c, sh){
  if(!sh) return 'lost on an away mission';
  if(sh!==G.ship) return 'killed aboard the enemy ship';
  const r = sh.rooms[c.room] || {};
  if(sh.crew.some(o => o.owner!=='p' && !o.drone && o.room===c.room && o.mcT<=0)) return 'cut down by boarders';
  if(r.fire > 0) return 'lost in a fire';
  if(r.o2 != null && r.o2 < 15) return 'suffocated when the air ran out';
  if(c.mcT > 0) return 'killed while mind-controlled';
  return G.enemy ? 'killed by enemy fire' : 'killed in an accident';
}
function sagaDeath(c, sh, cause){
  if(!G || !c || c.owner!=='p' || c.drone) return;
  const words = pickFresh([].concat(LAST_WORDS[c.quirk] || [], LAST_WORDS.generic), G.fallen.map(f => f.words));
  const why = cause || deathCause(c, sh);
  const f = { name:c.name, race:c.race, quirk:c.quirk || null, why, words, s:G.sector, kills:c.kills||0, served:G.stats.jumps - ((G.crewJoined||{})[c.id] || 0) };
  (G.fallen = G.fallen || []).push(f); (G.fightDeaths = G.fightDeaths || []).push(f);
  G.wordsToast = `${c.name} has died. Last words: "${words}"`; UI.toast = { text:G.wordsToast, t:5 };
  const qn = quirkName(c).toLowerCase() || 'crew member';
  sagaNote('death', pick([`${c.name} the ${qn} was ${why} in sector ${G.sector}. Their last words: "${words}"`, `In sector ${G.sector}, ${c.name} the ${qn} was ${why}. The last thing they said was "${words}"`,
    `${c.name} the ${qn} did not make it past sector ${G.sector}: ${why}, with "${words}" as their last words.`, `Sector ${G.sector} took ${c.name} the ${qn}, ${why}. "${words}," they said, and that was all.`]));
  // their friend, sibling, sweetheart or rival takes it hard
  const b = bondOf(c); if(b && b.other.owner==='p'){ const o = b.other; o.bond = { id:c.id, kind:b.kind, lost:true };
    if(b.kind!=='rivals') o.vengeT = 40;   // furious for a while: hits harder (sim.js)
    const line = pick(GRIEF[b.kind] || GRIEF.friends).replace(/\{fallen\}/g, c.name);
    G.chat = (G.chat||[]).filter(x => x.t>0).slice(-2); G.chat.push({ text:line, id:o.id, t:3.4, d:1.2 });
    sagaNote('grief', b.kind==='rivals' ? `${o.name} never admitted it, but they missed their rival ${c.name} terribly.` : `${o.name} swore to finish the journey for ${c.name}.`); }
  // a dead pet's keeper, or a lonely crew: the ghost may visit later
  if(Math.random() < .5 && !G.later.some(l => l.event==='m_ghost')) G.later.push({ event:'m_ghost', jumps:ri(4,8) });
}
/* lines for the result screen after a fight */
function sagaFightLines(L){
  const d = G.fightDeaths || []; G.fightDeaths = [];
  for(const f of d) L.push(`Lost: ${f.name}. "${f.words}"`);
}

/* ---------------- chatter hooks ---------------- */
function quirkLine(c, trigger){ const q = c && QUIRK_SAY[c.quirk]; const pool = q && q[trigger]; return pool && pool.length ? pool : null; }
/* between beacons: friends, siblings and rivals talk to each other; the pet gets up to things */
function sagaIdle(){
  if(!G || G.enemy) return false;
  if(G.pet && !G.pet.gone && Math.random() < .25){ toast(fillText(pick(PET_IDLE), { crew:randomCrewName() })); return true; }
  const pairs = mineAlive().filter(c => c.bond && !c.bond.lost && crewById(c.bond.id)); if(!pairs.length || Math.random() < .45) return false;
  const a = pick(pairs), b = crewById(a.bond.id), set = BANTER[a.bond.kind]; if(!b || !set) return false;
  const recent = (G.banterRecent = G.banterRecent || []), lines_ = pickFresh(set, recent); recent.push(lines_); if(recent.length > 3) recent.shift();
  G.chat = (G.chat||[]).filter(x => x.t>0).slice(-1); G.chat.push({ text:lines_[0], id:a.id, t:3.2 }, { text:lines_[1], id:b.id, t:3.2, d:2.2 }); G.lastSay = G.time;
  return true;
}

/* ---------------- the ship's pet ---------------- */
const PET_KINDS = { kitten:'void kitten', slug:'hull slug', moth:'star moth', goat:'space goat', cloud:'pocket nebula' };
const PET_NAMES = ['Mr Wobbles','Admiral Fluff','Noodle','Captain Socks','Gravy','Pickle','Sir Reginald','Comet','Bean','Waffles','Lord Crumpet','Toast','Muffin','Professor Paws'];
const PET_IDLE = ['{pet} is asleep on the warm reactor housing.','{pet} has been chasing a laser pointer across the bridge for an hour.','{pet} knocked a spanner into the engine room. Nobody is surprised.','{crew} is teaching {pet} to fetch. {pet} is teaching {crew} to sit.','{pet} is sitting in the captain\'s chair again.','{pet} ate something from the cargo hold. It seems fine. It is glowing slightly.','{pet} purrs at the shield generator. The shields seem to like it.'];

/* ---------------- the nemesis ---------------- */
const NEM_SURNAMES = ['Voss','Grint','Krell','Sable','Thrace','Quell','Rook','Drabble','Mordaunt','Vane-Smith','Kettleby','Grudgewell','Harrow','Blight'];
const NEM_TAUNTS = ['You again!','I have thought about this moment every night.','I had your ship\'s name tattooed. Spelt wrong, but still.','No running this time!','My crew have heard about you. They are not impressed.','I repaired every dent you gave me. Now I return the favour.'];
function nemTitle(n){ return !n ? '' : n.level >= 3 ? `${n.cap} the Unkillable` : n.level >= 2 ? `${n.cap} the Persistent` : n.cap; }
function sagaEnemyGotAway(e, how){
  if(!G || !e || e.boss || e.fleet || e.auto || !DATA.enemies[e.id]) return;
  const n = G.nemesis;
  if(n && !n.done && e.nemesis){ if(n.level >= 3){ n.done = true; n.escaped = true; sagaNote('nemesis', `${nemTitle(n)} escaped one last time and was never seen again. Some say they are still out there, sulking.`); return; }
    n.level++; n.met++; G.later.push({ event:'nem_return', jumps:ri(3,6) }); sagaNote('nemesis', `${n.cap} got away again ${how}. They would be back.`); return; }
  if(n || Math.random() < .35) return;   // one nemesis per run is plenty, and not every coward holds a grudge
  const cap = `Captain ${pick(NAMES)} ${pick(NEM_SURNAMES)}`;
  G.nemesis = { cap, def:e.id, ship:DATA.enemies[e.id].name, faction:e.faction, level:1, met:1, s:G.sector, done:false };
  G.later.push({ event:'nem_return', jumps:ri(3,6) });
  toast(`${cap} of the ${G.nemesis.ship} swears revenge over open comms.`);
  sagaNote('nemesis', `In sector ${G.sector}, ${cap} of the ${G.nemesis.ship} got away ${how}, swearing revenge.`);
}
function sagaCombatStart(e, o){
  if(!G || !G.nemNext || !G.nemesis) return; G.nemNext = false; const n = G.nemesis;
  e.nemesis = true; e.name = `${nemTitle(n)}'s ${n.ship}`; e.hull += 3*n.level; e.maxHull += 3*n.level;
  for(const k of ['weapons','shields','engines']) if(e.systems[k] && Math.random() < .5 + n.level*.15){ e.systems[k].max = Math.min(8, e.systems[k].max + 1); e.systems[k].power = e.systems[k].max; }
  o.title = `${nemTitle(n)} is back`; o.text = `"${pick(NEM_TAUNTS)}" ${n.cap}'s ship has been patched, upgraded and painted with a picture of your ship on fire. This one is personal.`;
}
function sagaFightWon(kind, e, L){
  sagaFightLines(L);
  if(e && e.nemesis && G.nemesis && !G.nemesis.done){ const n = G.nemesis; n.done = true; n.beaten = true;
    const v = 25 + n.level*15; G.scrap += v; G.stats.scrap += v; L.push(`+${v} scrap from ${n.cap}'s personal stash`);
    if(Math.random() < .5 + n.level*.15) L.push(giveWeapon('random'));
    L.unshift(kind==='surrender' ? `${n.cap} surrenders at last, and hands over everything.` : `${nemTitle(n)} is finished. Your crew cheer loud enough to rattle the hull.`);
    G.later = G.later.filter(l => l.event!=='nem_return');
    sagaNote('nemesis', kind==='surrender' ? `After ${n.met} meetings, ${n.cap} finally surrendered to ${shipThe()}.` : `After ${n.met} meetings, ${shipThe()} finally destroyed ${nemTitle(n)}.`);
    if(typeof grant==='function') grant('nemesis'); return; }
  if(e && e.elite) sagaNote('fight', `They beat a veteran crew aboard the ${e.name}.`);
}

/* ---------------- effects only saga events use (called from applyEffect) ---------------- */
function sagaEffect(e, L){
  if(!G) return; const cx = G.evCtx || {}, star = cx.starId ? crewById(cx.starId) : null;
  if(e.saga) sagaNote('moment', fillText(e.saga, cx));
  if(star){
    if(e.starHurt){ star.hp = Math.max(1, star.hp - e.starHurt); L.push(`${star.name} is hurt`); }
    if(e.starHeal){ star.hp = Math.min(star.maxHp, star.hp + e.starHeal); L.push(`${star.name} feels better`); }
    if(e.starXp){ gainXP(star, e.starXp.skill, e.starXp.amt); L.push(`${star.name} trained in ${SKILLN[e.starXp.skill] || e.starXp.skill}`); }
    if(e.starQuirk && quirkDef(e.starQuirk)){ star.quirk = e.starQuirk; L.push(`${star.name} is now a ${quirkDef(e.starQuirk).name.toLowerCase()}`); }
    if(e.starLeave && mineAlive().length > 1){ crewLeaves(star); L.push(`${star.name} leaves the crew`); sagaNote('leave', `${star.name} left the crew in sector ${G.sector}.`); }
    if(e.starDie && mineAlive().length > 1){ crewLeaves(star); G.lost.push(star.name); sagaDeath(star, null, e.starDie===true ? 'lost on a strange errand' : e.starDie); L.push(`${star.name} is gone`); }
    if(e.starClone){ const k = addCrew(G.ship, star.race, 'p', star.name + ' II'); k.quirk = star.quirk; k.look = star.look; k.gender = star.gender; L.push(`${k.name} joins the crew (somehow)`); sagaJoined(k, 'out of a slightly wrong jump'); }
    if(e.bondFix){ const fr = cx.friendId && crewById(cx.friendId); if(fr){ makeBond(star, fr, e.bondFix); L.push(`${star.name} and ${fr.name} are ${BOND_KINDS[e.bondFix]} now`); } }
  }
  if(e.pet && !G.pet){ const po = typeof e.pet==='object' ? e.pet : {}, kind = po.kind || (e.pet==='random' || !PET_KINDS[e.pet] ? pick(Object.keys(PET_KINDS)) : e.pet); G.pet = { name:po.name || pick(PET_NAMES), kind, since:G.stats.jumps, s:G.sector };
    L.push(`${G.pet.name} the ${PET_KINDS[kind]} is now the ship's pet`); grant('saga_pet'); sagaNote('pet', `In sector ${G.sector} the crew adopted ${G.pet.name}, a ${PET_KINDS[kind]}.`);
    G.later.push({ event:'m_pet_grows', jumps:ri(6,9) }); }
  if(e.petBig && G.pet && !G.pet.gone){ G.pet.big = true; G.ship.maxHull += 3; G.ship.hull += 3; L.push(`+3 max hull (${G.pet.name} sleeps on the hull now)`); }
  if(e.petGone && G.pet && !G.pet.gone && (!e.petIs || G.pet.name===e.petIs)){ G.pet.gone = e.petGone; sagaNote('pet', `${G.pet.name} ${e.petGone}.`); }
  if(e.nemFight){ G.nemNext = true; }
  if(e.nemEnd && G.nemesis && !G.nemesis.done){ G.nemesis.done = true; G.nemesis.peace = true; G.later = G.later.filter(l => l.event!=='nem_return'); sagaNote('nemesis', fillText(e.nemEnd, cx)); }
  if(e.nemAgain && G.nemesis && !G.nemesis.done){ G.later.push({ event:'nem_return', jumps:ri(3,5) }); }
}
/* who a saga event is about, picked when it starts */
function sagaCtx(ev){
  if(!ev || !G || !G.ship) return null; const crew = mineAlive(); if(!crew.length) return null;
  const cx = {};
  let star = null;
  if(ev.star && ev.star!=='any') star = pick(crew.filter(c => c.quirk===ev.star));
  else if(ev.bond){ const l = crew.filter(c => c.bond && !c.bond.lost && crewById(c.bond.id) && (!ev.bondKind || [].concat(ev.bondKind).includes(c.bond.kind))); star = l.length ? pick(l) : null; if(star) { const fr = crewById(star.bond.id); cx.friend = fr.name; cx.friendId = fr.id; } }
  else if(ev.star==='any' || ev.moment) star = pick(crew);
  if(!star && !ev.fallen && !ev.pet && !ev.nem) return null;
  if(star){ cx.crew = star.name; cx.starId = star.id; }
  else cx.crew = randomCrewName();
  if(ev.fallen && G.fallen && G.fallen.length) cx.fallen = pick(G.fallen).name;
  return cx;
}
function sagaFill(t, cx){
  return t.replace(/\{friend\}/g, cx.friend || 'their friend').replace(/\{fallen\}/g, cx.fallen || (G && G.fallen && G.fallen[0] ? G.fallen[0].name : 'an old friend'))
    .replace(/\{pet\}/g, G && G.pet ? G.pet.name : 'the pet').replace(/\{petkind\}/g, G && G.pet ? PET_KINDS[G.pet.kind] : 'creature')
    .replace(/\{nemesis\}/g, G && G.nemesis ? nemTitle(G.nemesis) : 'your nemesis').replace(/\{nemship\}/g, G && G.nemesis ? G.nemesis.ship : 'their ship')
    .replace(/\{nemsector\}/g, G && G.nemesis ? String(G.nemesis.s) : '1');
}
/* can this saga event happen right now? */
function momentOk(ev){
  if(!G) return false; const crew = mineAlive(); if(!crew.length) return false;
  if(ev.once !== false && G.seen[ev.id]) return false;
  if(ev.star && ev.star!=='any' && !crew.some(c => c.quirk===ev.star)) return false;
  if(ev.bond && !crew.some(c => c.bond && !c.bond.lost && crewById(c.bond.id) && (!ev.bondKind || [].concat(ev.bondKind).includes(c.bond.kind)))) return false;
  if(ev.fallen && !(G.fallen && G.fallen.length)) return false;
  if(ev.pet && !(G.pet && !G.pet.gone)) return false;
  if(ev.noPet && G.pet) return false;
  if(ev.minCrew && crew.length < ev.minCrew) return false;
  if((ev.minSector||1) > G.sector) return false;
  if(ev.flag && !G.flags[ev.flag]) return false;
  return true;
}
/* now and then a beacon is about your crew rather than the galaxy */
function pickMoment(node, chance){
  if(!G || G.challenge && /lone/.test(G.challenge)) return null;
  const since = (G.stats.jumps||0) - (G.lastMoment ?? -99); if(since < 3) return null;
  if(Math.random() >= (chance ?? .22)) return null;
  const list = Object.values(DATA.events).filter(ev => ev.moment && !ev.questOnly && momentOk(ev)); if(!list.length) return null;
  // personal ones first: a scene about someone's quirk beats a generic one
  const ev = wpick(list, ev => (ev.weight ?? 1) * (ev.star && ev.star!=='any' ? 2.2 : ev.bond || ev.fallen || ev.pet ? 1.8 : 1));
  G.lastMoment = G.stats.jumps; return ev.id;
}

/* ---------------- the saga itself ---------------- */
const SAGA_SUBTITLES = ['or, {a} and the Very Long Week','or, How {a} Learned to Stop Worrying','or, Never Trust a Quiet Beacon','or, The Biscuit Incident','or, {a} Was Right All Along','or, Everything Is Fine','or, Several Explosions Later','or, The One Where {a} Had a Plan'];
const EPITAPHS = {
  gambler:'never paid back a single bet', poet:'left behind three unfinished epics', cook:'is still remembered for the stew', superstitious:'blamed the comet to the very end',
  daredevil:'did everything once, twice if it was on fire', worrier:'was right about almost everything', tinkerer:'left every machine slightly better and slightly scarier',
  romantic:'had a letter waiting at every beacon', conspiracy:'took the red string to the grave', sleepwalker:'slept through the most important parts',
  collector:'left a hold full of treasures nobody understands', expyrate:'stayed mostly retired', mystic:'saw it all coming, roughly', optimist:'kept smiling the whole way',
  grump:'hated every minute and would do it all again', bookworm:'read the manual so nobody else had to'
};
function buildSaga(win, reason){
  if(!G || !G.ship) return null; const P = []; const notes = G.saga || [], fallen = G.fallen || [], alive = mineAlive();
  const hero = alive[0] || (fallen[0] && { name:fallen[0].name }) || { name:'the captain' };
  const title = `The Saga of ${shipThe()}${win===null ? ' (so far)' : ''}`, sub = pick(SAGA_SUBTITLES).replace(/\{a\}/g, hero.name);
  const start = notes.find(n => n.k==='start'); P.push(start ? start.t : `${shipThe(true)} set out from the Civilian Sector.`);
  // the middle: every beat worth retelling, in order, a few to a paragraph
  const beats = notes.filter(n => n.k!=='start'); let cur = [];
  // a string of uneventful sectors reads better as one sentence
  const merged = []; for(const n of beats){ const last = merged[merged.length-1];
    if(n.k==='sector' && last && last.k==='sector'){ last.list = (last.list || [last.t]).concat(n.t); last.secs = (last.secs || [last.s]).concat(n.s); continue; }
    merged.push(Object.assign({}, n)); }
  for(const n of merged) if(n.list) n.t = `Sectors ${listText(n.secs.map(String))} went by in a blur of beacons and gunfire.`;
  for(const n of merged){ cur.push(n.t); if(cur.length >= 3 || n.k==='death' || n.k==='nemesis'){ P.push(cur.join(' ')); cur = []; } }
  if(cur.length) P.push(cur.join(' '));
  if(beats.length < 2 && G.stats.jumps > 0) P.push(`Along the way they made ${G.stats.jumps} jump${G.stats.jumps===1?'':'s'} and saw off ${G.stats.kills} ship${G.stats.kills===1?'':'s'}, which is more than most can say.`);
  // the ending (none yet if the run is still going)
  if(win===null) P.push(`And the story goes on: ${alive.length ? listText(alive.map(c => c.name)) + ' are' : 'the ship is'} still out there, in sector ${G.sector}, with the Rebuff Fleet not far behind.`);
  else if(win) P.push(`At Fedoration command they faced the Flaggship three times, and on the third it fell. ${alive.length ? listText(alive.map(c => c.name)) + (alive.length===1 ? ' lived' : ' lived') + ' to tell it, and told it often.' : 'Nobody aboard lived to tell it, so the stars tell it instead.'}`);
  else { const r = String(reason||''); P.push(`In sector ${G.sector} the journey ended. ` + (/hull gave out/i.test(r) ? 'The hull gave out, and the Rebuff Fleet collected the pieces.' : /last crew/i.test(r) ? 'The last of the crew was gone, and the ship drifted on, empty.' : /fedoration command/i.test(r) ? 'The Flaggship reached Fedoration command first.' : r)); }
  const ep = [...alive.map(c => ({ name:c.name, quirk:c.quirk, alive:true })), ...fallen.map(f => ({ name:f.name, quirk:f.quirk, alive:false }))].slice(0, 8)
    .map(p => `${p.name}${p.alive ? '' : ' (fallen)'}, who ${EPITAPHS[p.quirk] || 'did their best'}.`);
  if(ep.length) P.push('Remembered: ' + ep.join(' '));
  if(G.pet) P.push(G.pet.gone ? `And ${G.pet.name} the ${PET_KINDS[G.pet.kind]}, who ${G.pet.gone}.` : `And ${G.pet.name} the ${PET_KINDS[G.pet.kind]}, who outlived everyone's expectations${G.pet.big ? ' and grew to the size of a small moon' : ''}.`);
  return { title, sub, paras:P, win:!!win, live:win===null, ship:G.ship.name, sector:G.sector, t:Date.now() };
}
function sagaRunEnd(win, reason){
  const s = buildSaga(win, reason); if(!s) return; UI.saga = s; UI.sagaPage = 0;
  PROFILE.sagas = [s, ...(PROFILE.sagas||[])].slice(0, 12);
}

/* ---------------- the saga screen ---------------- */
function drawSaga(){
  const s = UI.saga; if(!s){ UI.screen = UI.sagaBack || 'title'; return; }
  const big = typeof phoneSized==='function' && phoneSized(), fs = big ? 34 : 21, lh = big ? 46 : 31;   // bigger type on a phone
  const x = W/2 - 600, w = 1200;
  panel(x - 40, 60, w + 80, 870, 14);
  label(s.live ? 'The story so far' : s.win ? 'A tale of victory' : 'A tale of the void', W/2, 112, s.win ? C.good : C.hostile, 'center', 16);
  T(s.title, W/2, 168, { s:46, f:FD, w:700, a:'center', c:C.amber, max:w });
  T(s.sub, W/2, 208, { s:20, a:'center', c:C.muted, max:w });
  // lay the paragraphs out into pages that fit
  const font = `400 ${fs}px ${FM}`, pages = [[]]; let hgt = 0; const maxH = 600;
  for(const p of s.paras){ const n = lines(p, w, font).length*lh + 18; if(hgt + n > maxH && pages[pages.length-1].length){ pages.push([]); hgt = 0; } pages[pages.length-1].push(p); hgt += n; }
  const pg = clamp(UI.sagaPage||0, 0, pages.length-1); UI.sagaPage = pg;
  let y = 262; for(const p of pages[pg]){ y += para(p, x, y, w, { s:fs, lh }) + 18; }
  if(pages.length > 1){ T(`Page ${pg+1} of ${pages.length}`, W/2, 880, { s:15, a:'center', c:C.muted });
    btn(x, 848, 200, 56, '‹ Back a page', () => { UI.sagaPage = pg-1; }, { s:17, disabled:pg<=0 });
    btn(x+w-200, 848, 200, 56, 'Next page ›', () => { UI.sagaPage = pg+1; }, { s:17, disabled:pg>=pages.length-1, fill:pg<pages.length-1 }); }
  btn(W/2-140, 942, 280, 50, 'Close', () => { UI.screen = UI.sagaBack || 'title'; UI.sagaList = false; }, { s:18 });
  if(UI.sagaList){ const L = PROFILE.sagas || [], i = UI.sagaIdx || 0;   // leafing through old sagas from the record
    btn(W/2-480, 942, 300, 50, '‹ Newer saga', () => { UI.sagaIdx = i-1; UI.saga = L[i-1]; UI.sagaPage = 0; }, { s:16, disabled:i<=0 });
    btn(W/2+180, 942, 300, 50, 'Older saga ›', () => { UI.sagaIdx = i+1; UI.saga = L[i+1]; UI.sagaPage = 0; }, { s:16, disabled:i>=L.length-1 });
    const d = new Date(s.t||0); T(`${d.getDate()} ${d.toLocaleString('en-GB',{ month:'short' })} · ${s.win ? 'won' : 'lost in sector ' + s.sector}`, W/2, 236, { s:14, a:'center', c:C.muted }); }
}
function openSaga(s, back){ if(!s) return; grant('saga_tale'); UI.sagaList = false; UI.saga = s; UI.sagaPage = 0; UI.sagaBack = back || UI.screen; UI.screen = 'saga'; }

/* ---------------- crew moments ----------------
   moment:true events are picked by pickMoment (about one beacon in four, and on some quiet
   beacons). star:'<quirk>' stars a crew member with that personality, star:'any' anyone;
   bond:true a crew member and their friend; fallen:true remembers someone who died; pet:true
   needs the ship's pet. saga:'...' is the line the run's saga will tell about that choice. */
const SAGA_EVENTS = {
  /* --- the egg, the pet --- */
  m_egg:{ moment:true, star:'any', noPet:true, art:'creature', text:'{crew} comes up from the cargo hold holding an egg the size of a helmet. It is warm. It is humming. It just moved.', choices:[
    { text:'Keep it warm by the reactor and see what hatches.', effect:{ text:'{crew} builds a nest out of spare uniforms. The egg hums contentedly. Everyone agrees not to think about what laid it.', later:{ event:'m_egg_hatch', jumps:3 }, saga:'{crew} found a humming egg in the hold and insisted on keeping it.' } },
    { text:'Cook it.', req:{ quirk:'cook' }, effect:{ text:'{who} makes an omelette that feeds the whole crew for two days. It tastes faintly of stars. Nobody regrets anything.', crewHeal:40, saga:'{who} turned a mysterious space egg into the best omelette anyone had ever eaten.' } },
    { text:'Sell it at the next store. Or now, to the first passing trader.', effect:{ text:'A passing collector pays a ridiculous amount for it and flies off very fast, which is worrying.', scrap:25 } },
    { text:'Put it out of the airlock. Gently.', effect:{ text:'The egg floats away, humming. {crew} waves until it is out of sight and is quiet for the rest of the day.' } } ] },
  m_egg_hatch:{ moment:true, questOnly:true, star:'any', noPet:true, art:'creature', text:'A crack, a squeak, and the egg hatches. Something small, soft and slightly glowing climbs into {crew}\'s lap and falls asleep immediately.', choices:[
    { text:'Name it and make it the ship\'s pet.', effect:{ text:'There is a long argument about the name. The winner is chosen by a vote that {crew} definitely rigged.', pet:'random' } },
    { text:'Take it to a nature reserve two beacons away.', effect:{ text:'The reserve keepers are thrilled: it is a very rare species. They pay a finder\'s fee and send you a photo of it every week.', scrap:35, fuel:1, saga:'The crew gave a very rare hatchling to a nature reserve and got postcards for the rest of the trip.' } } ] },
  m_stray:{ moment:true, star:'any', noPet:true, minSector:2, text:'Something small has been eating the ship\'s biscuits. {crew} finally catches it: a scruffy, wide-eyed creature that has clearly been living in the vents for weeks.', choices:[
    { text:'Let it stay. It\'s family now.', effect:{ text:'It moves into {crew}\'s bunk the same night.', pet:'random' } },
    { text:'Release it at the next station.', effect:{ text:'It looks back at you once from the station dock. Everyone pretends there is dust in the air.', crewHeal:10 } } ] },
  m_pet_grows:{ moment:true, questOnly:true, pet:true, text:'{pet} has grown. A lot. {pet} no longer fits through the doors and has started sleeping curled around the outside of the hull like a scarf.', choices:[
    { text:'Let {pet} sleep on the hull.', effect:{ text:'{pet} settles in. Micro-meteors bounce off it. It does not wake up.', petBig:true, saga:'{pet} grew to the size of a shuttle and took to sleeping on the outside of the hull.' } },
    { text:'Put {pet} on a diet.', effect:{ text:'{pet} is offended for three days, then forgives everyone. {crew} gets bitten, lovingly.', starHurt:10 } } ] },
  m_pet_vents:{ moment:true, pet:true, text:'{pet} has gone missing. Faint noises are coming from the air vents. Some of them sound like {pet}. Some of them do not.', choices:[
    { text:'Send {crew} into the vents after {pet}.', chance:.7, success:{ text:'{crew} comes out an hour later, covered in dust, holding {pet} and a stash of scrap that a previous crew hid in the ducts.', scrap:28, saga:'{crew} crawled through the vents to rescue {pet} and came out rich.' }, fail:{ text:'{crew} gets stuck. Getting them out takes the whole crew, a lot of grease and some damage to the oxygen system. {pet} walks out on its own afterwards, looking smug.', damageSystem:'oxygen', starHurt:15 } },
    { text:'Leave food out and wait.', effect:{ text:'{pet} turns up at dinner as if nothing happened, with something shiny in its mouth.', parts:2 } } ] },
  m_pet_hero:{ moment:true, pet:true, minSector:3, text:'A boarding party of tiny repair drones has latched on while you slept and started taking your ship apart for parts. {pet} has noticed them.', choices:[
    { text:'Let {pet} handle it.', chance:.75, success:{ text:'{pet} hunts down every drone and lines them up outside {crew}\'s door. The drones are salvageable.', parts:3, saga:'{pet} single-handedly saw off a swarm of salvage drones.' }, fail:{ text:'{pet} catches most of them. The rest take a chunk of your hull and {pet} gets hurt chasing them. {pet} is fine, but sulks for days.', hull:-3 } },
    { text:'Everybody grab a mop.', effect:{ text:'You knock them off one by one. {pet} watches, unimpressed, from on top of the reactor.', hull:-1, xp:{ skill:'repair', amt:4 } } } ] },
  m_pet_lost:{ moment:true, pet:true, minSector:4, weight:.5, text:'Docked at a trading post, {pet} slips off the ship. When you find it, it is sitting with a herd of its own kind, looking happier than it has ever looked.', choices:[
    { text:'Let {pet} go home.', effect:{ text:'{crew} says goodbye. {pet} looks back once. The ship is very quiet tonight.', petGone:'went home to its own kind, and was happy', crewHeal:20 } },
    { text:'Call {pet} back aboard.', chance:.5, success:{ text:'{pet} comes bounding back. It chose you.', crewHeal:30, saga:'Given the choice between its own kind and the crew, {pet} chose the crew.' }, fail:{ text:'{pet} hesitates, then turns away. The herd closes around it and it is gone.', petGone:'chose to stay with its own kind' } } ] },

  /* --- personalities --- */
  m_gamble:{ moment:true, star:'gambler', text:'{crew} has found a snail race at this beacon. Real Sloog racing snails, very fast, very slimy. {crew} has "a feeling" about snail number four.', choices:[
    { text:'Let them bet 20 scrap.', req:{ scrap:20 }, cost:{ scrap:20 }, chance:.45, success:{ text:'Number four wins by a slime trail! {crew} collects 70 scrap and will not stop talking about it.', scrap:70, saga:'{crew} bet the ship\'s scrap on a racing snail, and won.' }, fail:{ text:'Number four stops halfway to eat a leaf. {crew} says it was rigged.', later:{ event:'m_gamble_double', jumps:2 }, setFlag:'gambleLost' } },
    { text:'Bet the spare fuel.', req:{ fuel:4 }, cost:{ fuel:2 }, chance:.35, success:{ text:'Against all odds and two photo finishes, {crew} comes back with six fuel cells and a medal shaped like a snail.', fuel:6 }, fail:{ text:'The snail comes last. {crew} is very sorry. {crew} is not that sorry.', saga:'{crew} lost the ship\'s spare fuel on a snail race.' } },
    { text:'Forbid it. Absolutely not.', effect:{ text:'{crew} sulks for a whole sector, but secretly bets their own rations on the race. They win a sandwich.' } } ] },
  m_gamble_double:{ moment:true, questOnly:true, star:'gambler', flag:'gambleLost', text:'{crew} has been very quiet since the snail race. Now they are very loud: a pyrate card game is running in the next beacon and they "can win it all back".', choices:[
    { text:'Fine. One game. 15 scrap.', req:{ scrap:15 }, cost:{ scrap:15 }, chance:.5, success:{ text:'{crew} wins the pot, a pyrate hat and an alarming amount of respect. Everyone pretends the snail race never happened.', scrap:55, clearFlag:'gambleLost', saga:'{crew} won it all back at a pyrate card table.' }, fail:{ text:'{crew} loses, then bets the ship\'s weapons on one more hand. The pyrates try to collect.', clearFlag:'gambleLost', fight:'pyrate_skiff' } },
    { text:'No. Keep flying.', effect:{ text:'{crew} learns a valuable lesson about snails, for about a day.', clearFlag:'gambleLost' } } ] },
  m_poem:{ moment:true, star:'poet', text:'{crew} has finished an epic poem about the voyage, two hundred verses long, and wants to read it over the open comms "so the galaxy may know".', choices:[
    { text:'Broadcast it.', chance:.55, success:{ text:'A passing cruise liner hears it, weeps, and wires you money "for the arts". Somewhere, a fan club forms.', scrap:35, saga:'{crew}\'s epic poem was broadcast across the sector and earned the ship a fan club.' }, fail:{ text:'Pyrates hear it too. They are art critics, and they are coming to give a review.', fight:'pyrate_gunship' } },
    { text:'Read it to the crew over dinner.', effect:{ text:'It takes three hours. Verse 140, about the oxygen scrubber, makes the grump cry. Everyone feels closer.', crewHeal:25, starXp:{ skill:'pilot', amt:3 } } },
    { text:'Edit it down to one verse.', effect:{ text:'{crew} is devastated, then delighted: the one verse is beautiful. It gets painted on the hull.' } } ] },
  m_stew:{ moment:true, star:'cook', text:'{crew} has made a "salvage stew" using things found at the last three beacons. It is bubbling. It is a colour. One of the ingredients is still moving.', choices:[
    { text:'Everybody eat.', chance:.6, success:{ text:'It is incredible. Nobody knows why. Everyone feels ten years younger and slightly magnetic.', crewHeal:50, saga:'{crew} fed the crew a stew made of salvage, and it was somehow delicious.' }, fail:{ text:'The crew spends the night taking turns in the bathroom. {crew} insists it was the moving ingredient\'s fault.', crewHurt:15 } },
    { text:'Feed it to {pet} first.', req:{ pet:true }, effect:{ text:'{pet} eats the whole pot and glows for a day. {crew} takes it as a compliment.', saga:'{pet} ate an entire pot of {crew}\'s salvage stew and glowed for a day.' } },
    { text:'Pour it out of the airlock.', effect:{ text:'The stew eats a small hole in the airlock door on its way out. {crew} is proud of that.', hull:-1 } } ] },
  m_omen:{ moment:true, star:'superstitious', text:'{crew} wakes everyone up: a black comet crossed the ship\'s bow during the night. That means the ship is cursed, and the only cure is a ritual involving three candles and a missile.', choices:[
    { text:'Do the ritual. Sacrifice a missile.', req:{ missiles:2 }, cost:{ missiles:1 }, effect:{ text:'The missile is launched into the comet\'s path with a short speech. {crew} declares the curse lifted. Morale soars, mostly from relief.', crewHeal:30 } },
    { text:'Ignore it. Comets aren\'t curses.', effect:{ text:'{crew} says nothing. {crew} does not need to. {crew} is counting.', setFlag:'cursed', later:{ event:'m_curse', jumps:3 } } },
    { text:'Ask {who} if there is anything to it.', req:{ quirk:'mystic' }, effect:{ text:'{who} gazes into a cup of coffee for an hour and announces that the curse is real but small, "about the size of a sock". Everybody checks their socks. One is missing.', saga:'The crew lost a sock to a comet curse, and were glad it was only a sock.' } } ] },
  m_curse:{ moment:true, questOnly:true, star:'superstitious', flag:'cursed', text:'Things have been going wrong: the coffee machine exploded, the lights flicker, and someone\'s boots filled with gel. {crew} has not said "I told you so". Yet.', choices:[
    { text:'Fine. Do the ritual now.', effect:{ text:'The ritual takes all night. It is strangely moving. In the morning the coffee machine works again.', clearFlag:'cursed', crewHeal:20 } },
    { text:'Hold firm. It\'s coincidence.', chance:.5, success:{ text:'And then nothing else happens. {crew} is FURIOUS that nothing else happens.', clearFlag:'cursed' }, fail:{ text:'A pipe bursts in the engine room, right on cue.', damageSystem:'engines', clearFlag:'cursed', saga:'The comet curse burst a pipe in the engine room, exactly as {crew} predicted.' } } ] },
  m_hullsurf:{ moment:true, star:'daredevil', text:'{crew} wants to ride on the outside of the hull during the next jump. "Just to see what it\'s like." They have a rope. It is a short rope.', choices:[
    { text:'Absolutely not.', effect:{ text:'{crew} sulks, then spends the afternoon jumping off the cargo racks instead. Nobody can stop them.' } },
    { text:'Let them. Tie the rope twice.', chance:.55, success:{ text:'{crew} comes back in, eyebrows gone, grinning. "I saw colours that don\'t have names." They pilot like a demon for weeks.', starXp:{ skill:'pilot', amt:12 }, saga:'{crew} rode the outside of the hull through a jump and lived.' }, fail:{ text:'The rope holds. {crew} mostly does. It takes the medbay a while.', starHurt:45 } } ] },
  m_worry:{ moment:true, star:'worrier', text:'{crew} has not slept for two days. They are sure something is wrong with the ship. They have a list. It is six pages long.', choices:[
    { text:'Go through the list with them.', chance:.6, success:{ text:'Most of it is nothing. Item 47 is a real crack in a coolant line that would have blown at the worst moment. {crew} is unbearable for a week, and right.', hull:3, saga:'{crew}\'s list of worries found a crack that would have crippled the ship.' }, fail:{ text:'It is all nothing. Every item. {crew} finally sleeps, for eighteen hours.', starHeal:40 } },
    { text:'Order them to rest.', effect:{ text:'{crew} lies in their bunk with their eyes open, worrying about resting. Still, it helps.', starHeal:30 } } ] },
  m_tinker:{ moment:true, star:'tinkerer', text:'{crew} has "improved" the reactor. It now hums a different note, there is a new lever nobody asked for, and the coffee machine is wired into it.', choices:[
    { text:'Keep the improvements.', chance:.4, success:{ text:'Against everyone\'s expectations, it works: the reactor puts out a little more power, and the coffee is better too.', reactor:1, saga:'{crew} "improved" the reactor, and, to everyone\'s astonishment, it worked.' }, fail:{ text:'The new lever turns out to be the old shield lever. You find out the hard way.', damageSystem:'shields', parts:2 } },
    { text:'Put it all back the way it was.', effect:{ text:'{crew} does it, muttering. They keep a few spare parts "for next time".', parts:2 } },
    { text:'Ask {who} to check it against the manual.', req:{ quirk:'bookworm' }, effect:{ text:'{who} finds the modification in an appendix: it is legal, safe, and gives one more unit of power. The two of them argue about footnotes for a week.', reactor:1, saga:'{who} and {crew} improved the reactor together, with footnotes.' } } ] },
  m_letter:{ moment:true, star:'romantic', text:'There is a letter for {crew} at this beacon. Then another. Then eleven more, all from different senders, all very passionate. One of them includes a gift.', choices:[
    { text:'Open the gift.', chance:.6, success:{ text:'It is a box of finely made weapon parts and a note: "For your safety, my dearest." {crew} blushes for an hour.', scrap:30, missiles:2 }, fail:{ text:'It is from a jealous ex. It is full of angry bees. Space bees.', crewHurt:10 } },
    { text:'Have {crew} write back to all of them.', effect:{ text:'It takes all night. One of the letters is to someone on a pyrate ship. That might be useful later.', setFlag:'pyrateSweetheart', later:{ event:'m_rendezvous', jumps:4 } } } ] },
  m_rendezvous:{ moment:true, questOnly:true, star:'romantic', flag:'pyrateSweetheart', text:'A pyrate ship drops out of hyperspace right next to you, guns cold, all its lights blinking in a heart shape. "Is {crew} aboard? I got the letter."', choices:[
    { text:'Let them talk.', chance:.6, success:{ text:'It goes well. Very well. The pyrate captain leaves you a crate of supplies and promises their ships will leave yours alone in this sector.', scrap:30, fuel:3, clearFlag:'pyrateSweetheart', saga:'{crew}\'s pyrate sweetheart came to visit, and the ship got a crate of supplies out of it.' }, fail:{ text:'It goes badly. Very badly. "You wrote the SAME LETTER to eleven people?!" The guns warm up.', clearFlag:'pyrateSweetheart', fight:'pyrate_gunship' } },
    { text:'{crew} wants to go with them.', effect:{ text:'{crew} packs a bag and goes. The two ships flash their lights goodbye. It is the most romantic thing anyone aboard has ever seen.', starLeave:true, scrap:20, clearFlag:'pyrateSweetheart', saga:'{crew} left the ship to sail off with a pyrate sweetheart.' } } ] },
  m_strings:{ moment:true, star:'conspiracy', text:'{crew} has covered the entire mess hall in red string. It connects the Rebuff Fleet, every store you have visited, the price of fuel and the moon. "It all makes sense now. I know where they\'re going."', choices:[
    { text:'Hear them out.', chance:.4, success:{ text:'It is nonsense. Mostly. One piece of string leads to a real Rebuff patrol schedule, and you slip past it.', fleetPush:-.06, reveal:true, saga:'{crew}\'s wall of red string turned out to be right about the Rebuff Fleet. Partly.' }, fail:{ text:'It takes all day. At the end you know a great deal about the moon and nothing about the fleet, which got closer.', fleetPush:.03 } },
    { text:'Take the string down.', effect:{ text:'{crew} takes it down, slowly, without breaking eye contact.' } } ] },
  m_sleepwalk:{ moment:true, star:'sleepwalker', text:'Three in the morning. {crew} is in the airlock, fast asleep, with one hand resting on the big red button marked VENT.', choices:[
    { text:'Wake them very, very gently.', effect:{ text:'{crew} wakes up, sees where they are, screams, and does not touch the button. Close.' } },
    { text:'Let them be and watch what they do.', chance:.5, success:{ text:'{crew} sleepwalks to the engine room and, still asleep, fixes a fault nobody had found. They remember nothing.', hull:2, starXp:{ skill:'engines', amt:8 }, saga:'{crew} fixed the engines in their sleep.' }, fail:{ text:'{crew} presses the button. The airlock vents. {crew} is fine, the cargo is not.', missiles:-1, scrap:-10 } },
    { text:'Strap them into their bunk, every night.', effect:{ text:'They sleep like a log. Everyone else sleeps better too.', crewHeal:15 } } ] },
  m_statue:{ moment:true, star:'collector', text:'{crew} found a small statue in the last wreck: a grinning figure with too many arms. The label says "DO NOT KEEP". {crew} wants to keep it.', choices:[
    { text:'Let them keep it.', effect:{ text:'It goes on the shelf next to {crew}\'s other things. Sometimes it seems to have moved.', setFlag:'statue', later:{ event:'m_statue_wakes', jumps:4 } } },
    { text:'Sell it.', effect:{ text:'A trader pays well and leaves in a hurry.', scrap:30 } } ] },
  m_statue_wakes:{ moment:true, questOnly:true, star:'collector', flag:'statue', text:'The statue is gone from the shelf. Something with too many arms has been seen in the corridors. {crew} says it is "probably fine".', choices:[
    { text:'Hunt it down.', chance:.5, success:{ text:'You corner it in the cargo hold. It drops something shiny and climbs out through a vent into space, giggling.', augment:'random', clearFlag:'statue', saga:'{crew}\'s cursed statue came alive, and left an augment behind when it fled.' }, fail:{ text:'It fights back with all of its arms before escaping into space.', crewHurt:20, clearFlag:'statue' } },
    { text:'Leave it a snack and hope.', effect:{ text:'The snack is gone in the morning. So is the statue. In its place, a neat pile of scrap and a thank-you note.', scrap:25, clearFlag:'statue' } } ] },
  m_oldmates:{ moment:true, star:'expyrate', text:'A pyrate ship hails, and asks for {crew} by an old name. "We need one more for a job. Like old times. There\'s a cut for your captain."', choices:[
    { text:'Lend them {crew} for the job.', chance:.65, success:{ text:'{crew} comes back three hours later with a big sack and a bigger grin and will not say what happened.', scrap:55, saga:'{crew} pulled one last job with their old pyrate crew, and came back rich.' }, fail:{ text:'The job goes wrong. {crew} comes back hurt and very cross, and the pyrates want their "investment" back.', starHurt:35, fight:'pyrate_skiff' } },
    { text:'"{crew} is retired."', effect:{ text:'The pyrates laugh, but they respect it, and leave a bottle of something for "the old days". {crew} is touched.', crewHeal:20 } } ] },
  m_vision:{ moment:true, star:'mystic', text:'{crew} wakes screaming. They saw the whole sector in a dream: every beacon, every danger, and one beacon that glowed gold.', choices:[
    { text:'Draw the map from the dream.', chance:.7, success:{ text:'It is accurate. Uncomfortably accurate. Everyone is a bit quieter around {crew} after that.', reveal:true, saga:'{crew} dreamt the map of a whole sector, and it was right.' }, fail:{ text:'The map is very detailed and entirely wrong. One beacon is labelled "SOUP?".' } },
    { text:'Make them some tea and let them sleep.', effect:{ text:'They sleep for a full day. When they wake up, they say the dream "was about tea anyway".', starHeal:30 } } ] },
  m_talent:{ moment:true, star:'optimist', text:'{crew} has organised a talent show. Everyone has to do something. There is a sign-up sheet. There are costumes.', choices:[
    { text:'Everyone takes part.', effect:{ text:'There is juggling, a terrible magic act, a song about oxygen, and a standing ovation for whoever does the robot. Nobody has felt this good in weeks.', crewHeal:40, saga:'{crew} organised a talent show halfway across the galaxy. It was the best night of the journey.' } },
    { text:'Broadcast it for tips.', chance:.5, success:{ text:'The galaxy loves it. Tips pour in all night.', scrap:30 }, fail:{ text:'Nobody tips. One review says "one star, and only because of the robot".', crewHeal:15 } } ] },
  m_biscuit:{ moment:true, star:'grump', text:'Someone ate {crew}\'s last biscuit. {crew} has stopped speaking to everyone, and has put a sign on the shield room that says "CLOSED".', choices:[
    { text:'Find out who did it.', chance:.5, success:{ text:'It was {pet}. All is forgiven. {crew} and {pet} are inseparable after that, though {crew} would never admit it.', crewHeal:10 }, fail:{ text:'It was {crew}. They ate it in their sleep. The silence afterwards is magnificent.' } },
    { text:'Buy them a whole tin of biscuits at the next store. (5 scrap)', req:{ scrap:5 }, cost:{ scrap:5 }, effect:{ text:'{crew} accepts the tin without a word, then is caught smiling at it. The sign comes down.', starHeal:20, saga:'{crew} the grump was won over with a tin of biscuits, and denied it for the rest of the trip.' } } ] },
  m_manual:{ moment:true, star:'bookworm', text:'{crew} has found the full manual for your ship. It is nine hundred pages long and they have read it twice. "There are three features you have never used."', choices:[
    { text:'Run a training session for the whole crew.', effect:{ text:'It is long. It has a quiz. Afterwards, everybody really is better at their jobs.', xp:{ skill:'repair', amt:8 }, saga:'{crew} taught the whole crew from the ship\'s manual, quiz and all.' } },
    { text:'"What are the three features?"', chance:.5, success:{ text:'One is a hidden storage locker. It is full of supplies from the previous crew.', missiles:3, parts:2 }, fail:{ text:'One is a cup holder. One is a horn. One is a light that says "SERVICE DUE".' } } ] },

  /* --- bonds --- */
  m_contest:{ moment:true, bond:true, bondKind:'rivals', text:'{crew} and {friend} have been arguing for three sectors about who is the better pilot. It has to be settled.', choices:[
    { text:'Hold a flying contest through the asteroid field.', effect:{ text:'They fly the course one after the other. It ends in a tie that both of them are certain they won. Both are much better pilots now.', starXp:{ skill:'pilot', amt:10 }, xp:{ skill:'pilot', amt:2 }, saga:'{crew} and {friend} settled their rivalry with a flying contest, which both of them won.' } },
    { text:'Make them work a whole shift together.', chance:.5, success:{ text:'By the end of it they are laughing about the old arguments. Rivals no more.', bondFix:'friends', saga:'Rivals {crew} and {friend} became friends after one long shift together.' }, fail:{ text:'They work a whole shift in total silence. The silence is somehow very loud.' } } ] },
  m_pact:{ moment:true, bond:true, bondKind:['friends','siblings','sweethearts'], minSector:2, text:'Before the jump into the next sector, {crew} and {friend} make a pact: whatever happens out there, they will look after each other. They want the whole crew to witness it.', choices:[
    { text:'Witness it.', effect:{ text:'They shake on it, spit on it, and then {friend} cries a bit. The whole crew stands a little taller.', crewHeal:25, saga:'{crew} and {friend} swore a pact to look after each other, with the whole crew as witnesses.' } },
    { text:'Make it a toast for everyone.', req:{ scrap:5 }, cost:{ scrap:5 }, effect:{ text:'One pact turns into eleven. By the end of the night everyone has promised to look after everyone. It is very loud.', crewHeal:35, xp:{ skill:'combat', amt:3 } } } ] },
  m_sweethearts:{ moment:true, bond:true, bondKind:'sweethearts', minSector:3, text:'{crew} and {friend} ask for a moment on the bridge. They want to get married. Here. Now. At this beacon.', choices:[
    { text:'Perform the ceremony yourself.', effect:{ text:'You marry them under a nebula, with the whole crew watching and the ship\'s horn as the music. Everyone cries, even the grump.', crewHeal:50, saga:'{crew} and {friend} were married on the bridge, under a nebula, with the ship\'s horn for music.', achievement:'saga_wed' } },
    { text:'"After we stop the Flaggship."', effect:{ text:'They agree. They write "AFTER THE FLAGGSHIP" on the wall of their bunk. It is an extra reason to win.' } } ] },

  /* --- remembering the fallen --- */
  m_ghost:{ moment:true, questOnly:true, fallen:true, text:'The lights flicker. {crew} swears they saw {fallen} at the helm, just for a moment, looking out at the stars the way they used to.', choices:[
    { text:'Talk to them.', chance:.5, success:{ text:'The console lights up by itself and plots a course through the sector, around every trap. Then the lights steady and the bridge is just the bridge again.', reveal:true, fleetPush:-.03, saga:'The ghost of {fallen} appeared on the bridge and showed the crew the way.' }, fail:{ text:'Nothing answers. Only the hum of the engines, and the feeling of being watched kindly.', crewHeal:20 } },
    { text:'Hold a proper service for {fallen}.', effect:{ text:'Everyone says something. {crew} says the most. Afterwards the ship feels a little warmer.', crewHeal:30, xp:{ skill:'combat', amt:4 }, saga:'The crew held a service for {fallen}, and {crew} spoke longest.' } },
    { text:'"It\'s the wiring."', effect:{ text:'It is not the wiring. But you replace the wiring anyway, and find a few spare parts behind the panel.', parts:2 } } ] },
  m_letter_fallen:{ moment:true, fallen:true, minSector:2, text:'Clearing out the bunks, {crew} finds a letter {fallen} never sent. It is addressed to a farm, three sectors back.', choices:[
    { text:'Read it to the crew.', effect:{ text:'It is mostly about the food on board, and how much they liked everyone. Nobody says much for a while.', crewHeal:25, saga:'{crew} read out {fallen}\'s last letter home, which was mostly about the food.' } },
    { text:'Send it on at the next beacon.', effect:{ text:'You send it. Weeks later, a reply arrives: a crate of farm supplies and a thank-you from a family you will never meet.', scrap:20, fuel:2 } } ] },

  /* --- strange things on the road --- */
  m_double:{ moment:true, star:'any', minCrew:2, minSector:2, weight:.6, text:'The jump went slightly wrong. There are now two of {crew}. They are both very confused and both claim to be the real one.', choices:[
    { text:'Keep both.', chance:.6, success:{ text:'The copy is stable, and very good at the same things. The two of them get on surprisingly badly.', starClone:true, saga:'A faulty jump left the ship with two of {crew}. Both stayed.' }, fail:{ text:'The copy flickers and fades before morning, leaving a note: "It was nice to be someone for a while."' } },
    { text:'Run a diagnostic to sort it out.', effect:{ text:'The diagnostic says they are both real. Then it crashes. When it reboots, there is only one {crew}, who refuses to talk about it.', parts:1 } } ] },
  m_pizza:{ moment:true, star:'any', text:'Comms receive an order for "one large pizza, extra stars" to be delivered to this beacon, addressed to {ship}. Nobody aboard ordered it. The delivery drone is here anyway, and it wants paying.', choices:[
    { text:'Pay for it. (8 scrap)', req:{ scrap:8 }, cost:{ scrap:8 }, effect:{ text:'It is the best pizza in the galaxy. You find out later the order came from your own ship, two weeks in the future.', crewHeal:35, saga:'Someone ordered a pizza to the ship from two weeks in the future. It was excellent.' } },
    { text:'Refuse.', chance:.6, success:{ text:'The drone sighs, eats the pizza itself, and leaves.' }, fail:{ text:'The drone is not that kind of drone. It opens fire.', hull:-2 } } ] },
  m_timeloop:{ moment:true, star:'any', minSector:2, weight:.6, text:'You have been at this beacon before. Specifically, about four minutes ago. {crew} is sure of it: they remember this exact conversation. They also remember what goes wrong next.', choices:[
    { text:'Do the opposite of what {crew} remembers.', chance:.6, success:{ text:'It works: the loop breaks, and you come out of it with the supplies you found the first time AND the second time.', scrap:25, missiles:2, saga:'The ship got stuck in a time loop for four minutes, and came out of it richer.' }, fail:{ text:'You have been at this beacon before. Specifically, about four minutes ago. {crew} is sure of it...', fleetPush:.04 } },
    { text:'Jump away as fast as possible.', effect:{ text:'You leave before anything can happen. {crew} spends the next day checking clocks.' } } ] },

  m_flu:{ moment:true, star:'any', text:'{crew} has caught Space Flu. Symptoms: sneezing, a faint glow, and speaking only in rhyme. The medbay manual has a whole page on it, and the page just says "oh no".', choices:[
    { text:'Quarantine them in the medbay.', req:{ system:'medbay' }, effect:{ text:'Three days of soup and rhyming complaints later, {crew} is cured. Mostly. They still say "indeed, indeed" a lot.', starHeal:40 } },
    { text:'Let it run its course.', chance:.5, success:{ text:'It passes in a day. Afterwards, {crew} finds they cannot stop writing poetry. They are a poet now. This is permanent.', starQuirk:'poet', saga:'{crew} caught Space Flu and came out of it a poet.' }, fail:{ text:'Everybody catches it. For two days the whole ship speaks in rhyme. Repairs are very slow and very lyrical.', crewHurt:10 } } ] },
  m_tourists:{ moment:true, star:'any', text:'A family of alien tourists docks and asks, very politely, for a guided tour of "a real working warship". The smallest one is already touching buttons.', choices:[
    { text:'Give them the tour.', chance:.65, success:{ text:'{crew} gives a wonderful tour. The family tips generously and the smallest one gets a hat.', scrap:30, saga:'{crew} gave a family of alien tourists a guided tour of the ship, and got a very good tip.' }, fail:{ text:'The smallest one finds the fire suppression override. And then the fire.', scrap:15, fire:1 } },
    { text:'"We are very busy fighting a war."', effect:{ text:'They take a photo of your ship from outside instead, waving.' } } ] },
  m_salesman:{ moment:true, star:'any', minSector:2, text:'Somehow a door-to-door salesman has docked. He is selling an extended warranty for your ship. "I see your hull has been damaged. Have you considered: not that?"', choices:[
    { text:'Buy the warranty. (15 scrap)', req:{ scrap:15 }, cost:{ scrap:15 }, chance:.5, success:{ text:'To everyone\'s amazement, the warranty is real. A repair crew turns up at the next beacon and patches everything.', hull:8, saga:'The crew bought an extended warranty from a door-to-door space salesman, and it was real.' }, fail:{ text:'The warranty excludes "space, lasers, missiles, fire, and the colour blue". It is worthless. {crew} keeps it framed.' } },
    { text:'Close the airlock door on him.', effect:{ text:'He keeps talking through the glass for a while, then leaves a leaflet under the door. It is a coupon for 2 drone parts.', parts:2 } } ] },

  /* --- the nemesis --- */
  nem_return:{ moment:true, questOnly:true, nem:true, once:false, art:'fleet', text:'A ship drops out of hyperspace right on top of you: the {nemship}, patched up and painted with a picture of your ship on fire. On screen, {nemesis}. "Remember me? Sector {nemsector}. I remember you."', choices:[
    { text:'"Not really, no."', effect:{ text:'{nemesis} goes very red. The guns come out.', nemFight:true, saga:'{nemesis} came back for revenge, and the crew pretended not to remember them.' } },
    { text:'Fight it out. This ends now.', effect:{ text:'Both ships power their weapons at the same moment.', nemFight:true } },
    { text:'Offer to settle it with a drink instead.', chance:.25, success:{ text:'{nemesis} is so surprised that nobody has offered before that they agree. Several drinks later, it is all forgotten and they leave you a crate.', scrap:25, nemEnd:'{nemesis} and your crew settled their feud over drinks, and parted friends.' }, fail:{ text:'"A DRINK?!" {nemesis} throws the glass at the screen. Their guns warm up.', nemFight:true } },
    { text:'Outrun them again.', req:{ system:'engines', level:3 }, effect:{ text:'You burn hard and leave them in your wake. {nemesis} screams something about "next time". There will be a next time.', nemAgain:true, dismiss:true } } ] }
};
Object.assign(BASE.events, SAGA_EVENTS);

/* ---------------- medals ---------------- */
ACHIEVEMENTS.push(
  { id:'nemesis',   name:'Unfinished Business', desc:'Defeat your nemesis: an enemy captain who got away and came back for you.' },
  { id:'saga_pet',  name:'Good Boy, Probably',  desc:'Adopt a ship\'s pet.' },
  { id:'saga_wed',  name:'Till Hull Breach Do Us Part', desc:'Marry two of your crew under a nebula.' },
  { id:'saga_tale', name:'Bard of the Void',    desc:'Read the saga of one of your runs.' }
);

/* ---------------- personalities in the wider galaxy ----------------
   [Quirk] options added to existing beacons and hails, so who you have aboard changes what you can do. */
const QUIRK_OPTIONS = {
  pyrateTalk:{ req:{ quirk:'expyrate' }, text:'Have {who} talk to them in the old pyrate cant.', chance:.7, success:{ text:'{who} trades insults, then stories, then recipes. The pyrates leave laughing and toss you a crate "for old times".', dismiss:true, scrap:15 }, fail:{ text:'It turns out {who} owes one of them money. A lot of money.', begin:true } },
  rebuffRules:{ req:{ quirk:'bookworm' }, text:'Have {who} quote the regulation that says they must let you pass.', chance:.6, success:{ text:'{who} cites Section 88, sub-paragraph 4, by heart. The Rebuff officer checks, sighs, and waves you through.', dismiss:true }, fail:{ text:'"That regulation was repealed last week." {who} is devastated. The guns roll out.', begin:true } },
  rebuffPlot:{ req:{ quirk:'conspiracy' }, text:'Let {who} tell them what the Rebuff Fleet is REALLY for.', chance:.4, success:{ text:'Twenty minutes in, the Rebuff crew are taking notes. They leave quietly, looking at each other strangely.', dismiss:true, fleetPush:-.02 }, fail:{ text:'They have heard this one before. They are not impressed.', begin:true } },
  autoTalk:{ req:{ quirk:'tinkerer' }, text:'{who} wants to try talking to it in machine code.', chance:.5, success:{ text:'{who} beeps at it for a while. It beeps back, uploads a patch to itself, and floats away, leaving some parts behind.', dismiss:true, parts:2 }, fail:{ text:'{who} accidentally tells it to "ENGAGE". It does.', begin:true } },
  mantlisDare:{ req:{ quirk:'daredevil' }, text:'Let {who} challenge them to a game of chicken.', chance:.5, success:{ text:'{who} flies straight at them and does not blink. The Mantlis, deeply impressed, salute and leave.', dismiss:true, scrap:10 }, fail:{ text:'The Mantlis do not blink either. Somebody has to fire first.', begin:true } },
  sloogVision:{ req:{ quirk:'mystic' }, text:'Let {who} out-weird their telepaths.', chance:.6, success:{ text:'{who} thinks about something so strange that the Sloog telepaths have to lie down. They leave.', dismiss:true }, fail:{ text:'The Sloog think {who}\'s thoughts are delightful, and want to keep them. By force.', begin:true } },
  casino:{ req:{ quirk:'gambler' }, text:'Let {who} play. They have "a system".', chance:.5, success:{ text:'The system works! {who} breaks the bank and is politely asked never to come back.', scrap:60 }, fail:{ text:'The system does not work. {who} loses their shirt, their boots, and 20 of the ship\'s scrap.', scrap:-20 } },
  raceDare:{ req:{ quirk:'daredevil' }, text:'{who} flies the race. No arguments.', chance:.6, success:{ text:'{who} takes a short cut through an asteroid nobody else would touch, and wins by a mile.', scrap:45 }, fail:{ text:'{who} takes a short cut through an asteroid. Into it, mostly.', hull:-4 } },
  plagueBroth:{ req:{ quirk:'cook' }, text:'{who} can make a healing broth from what you have aboard.', effect:{ text:'{who}\'s broth works wonders. The liner\'s captain promises to tell everyone what you did.', setFlag:'healer', scrap:25 } },
  whalePoem:{ req:{ quirk:'poet' }, text:'Let {who} recite a poem to the whale.', effect:{ text:'The whale listens to the whole thing. When it is over, it sings one long note back and leaves a cloud of rich ice in your path.', fuel:3, crewHeal:15 } },
  weddingSpeech:{ req:{ quirk:'romantic' }, text:'Let {who} give a speech.', effect:{ text:'{who}\'s speech about love among the stars makes the whole asteroid weep. The happy couple insist you take a gift.', crewHeal:30, scrap:15 } },
  archiveRead:{ req:{ quirk:'bookworm' }, text:'Let {who} loose in the stacks.', effect:{ text:'{who} reads for nine hours straight and comes back with charts of the whole sector and a lot of opinions.', reveal:true, xp:{ skill:'pilot', amt:4 } } },
  graveOffering:{ req:{ quirk:'superstitious' }, text:'{who} insists on leaving an offering before anyone touches anything.', effect:{ text:'{who} leaves a ration bar and a bow. Whether or not it helps, nothing goes wrong, and you salvage in peace.', scrap:20, crewHeal:10 } }
};
(function(){
  const add = (ids, key) => { for(const id of ids){ const ev = BASE.events[id]; if(ev && Array.isArray(ev.choices) && !ev.choices.some(c => c._q===key)) ev.choices.push(Object.assign({ _q:key }, QUIRK_OPTIONS[key])); } };
  const hails = tag => Object.keys(BASE.events).filter(k => BASE.events[k].hail===tag);
  add(hails('pyrate'), 'pyrateTalk'); add(hails('rebuff'), 'rebuffRules'); add(hails('rebuff').slice(0, 3), 'rebuffPlot'); add(hails('auto'), 'autoTalk');
  add(hails('mantlis'), 'mantlisDare'); add(hails('sloog'), 'sloogVision');
  add(['casino'], 'casino'); add(['race_track'], 'raceDare'); add(['d_plague'], 'plagueBroth'); add(['spacewhale'], 'whalePoem'); add(['wedding'], 'weddingSpeech'); add(['archives'], 'archiveRead'); add(['graveyard','ghostship'], 'graveOffering');
  // the stray called Biscuit can become the ship's pet, and its owner can take it home again
  const lp = BASE.events.t_lost_pet; if(lp) lp.choices[0].effect = Object.assign({}, lp.choices[0].effect, { pet:{ name:'Biscuit', kind:'kitten' } });
  const bh = BASE.events.t_biscuit_home; if(bh) bh.choices[0].effect = Object.assign({}, bh.choices[0].effect, { petGone:'went home to its worried owner', petIs:'Biscuit' });
})();
