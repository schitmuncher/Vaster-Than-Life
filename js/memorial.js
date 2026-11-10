'use strict';
/* =========================================================================
   Remembering the dead, properly.
   - Last words: hundreds of them, picked to fit the person and the moment:
     how they died (fire, vacuum, boarders, enemy fire, mind control, an
     away mission), their personality, their race, how long they'd served,
     and a grown-up set for adult crews (Settings → Gameplay → Grown-up humour).
   - Epitaphs: every death gets a line for the wall, written from what
     actually happened to them.
   - Funerals: after a fight that cost lives, you choose the send-off: full
     honours, a roast, a quick one, or the practical option.
   - The Memorial Wall (Record → Memorial): a plaque for everyone who never
     came home, with their stats, last words and epitaph, sortable, with
     totals, and a button to pay your respects.
   ========================================================================= */
function grownUp(){ return SET.grownUp !== false; }
const mcap = t => t ? String(t)[0].toUpperCase() + String(t).slice(1) : '';

/* ---------------- last words ---------------- */
LAST_WORDS.generic.push(
  "Tell my mother I died doing what I loved. Don't tell her what it was.",
  "I can see a light. Oh, no, it's a fire.",
  "Is it bad? Don't answer that. Your face answered that.",
  "Remember me as I was. Taller.",
  "I never did find out how the vending machine worked.",
  "Put me down as 'on leave'.",
  "My locker code is... no, you'll just eat my biscuits.",
  "I was three jumps from retirement. Three!",
  "Whoever took my good mug: I forgive you. No I don't.",
  "Can someone finish my crossword? Seven across is 'regret'.",
  "Did we win? Tell me we won. Lie if you have to.",
  "So this is what the safety briefing was about.",
  "I'd like to say something profound. Nope. Nothing.",
  "Bury me with my headphones on.",
  "Make sure the next one gets my bunk. Not Derek.",
  "Not like this. Well, maybe a bit like this.",
  "Every jump, I said: this one's fine. Statistically, I was due.",
  "Water my plant. The one I said was a cactus.",
  "Tell the medbay it can stop now.",
  "I just paid off the ship's loan.",
  "Space is very big and I am very small. Fair enough.",
  "Have I got time for a cup of tea? Ah. No.",
  "It's been an honour, captain. Mostly. Some of it.",
  "Don't let them put 'brave' on the plaque. Put 'handsome'.",
  "I owe the cook forty scrap. Don't tell him where I am.",
  "Look after the ship. She likes it when you talk to her.",
  "If there's an afterlife, I'm going to complain about the queue.",
  "I wanted to see the edge of the galaxy. This'll do.",
  "Write it down: I was right about the airlock.",
  "On the bright side, no more night shifts.",
  "I can't feel my legs. Oh, they're over there.",
  "Someone has to tell the Fleet I'm not coming back to work.",
  "Tell the others... actually, they're watching. Hi.",
  "Promise me you won't play the bagpipes at the funeral.",
  "I've got so many unread messages.",
  "Give my stuff to whoever cries hardest.",
  "I left a note. It mostly says 'told you so'.",
  "Ah well. I was never going to finish that novel.",
  "Next time, I'm taking the desk job.",
  "Last one to the escape pod... oh. It's me.",
  "Keep my name on the duty roster. Let them wonder.",
  "That was a lot of blood for one person.",
  "I regret nothing. Except the fish soup.",
  "Don't let them turn me into a motivational poster.",
  "Captain, my captain... what was the rest of it?",
  "Turns out the 'non-essential personnel' was me.",
  "Avenge me. Or don't. Have a nap, whatever.",
  "I should have stayed on the farm. There's no farm. I made it up.",
  "Tell the ship's cat I'm sorry about the time with the hoover.",
  "Is that... is that the Fleet? Oh, it's just Gary.");
const LAST_WORDS_ADULT = [
  "Oh, bollocks.",
  "Well, that's me buggered.",
  "Clear my browser history. Twice.",
  "Tell my ex... actually, tell her new boyfriend. He'll enjoy it.",
  "I never found out who kept pissing in the hydroponics. It was me. Now you know.",
  "I'd like my ashes thrown at the Rebuff.",
  "Fucking typical.",
  "This is what I get for not reading the waiver.",
  "Shit. Shit, shit, shit. Okay. Shit.",
  "Don't you dare do a whip-round. I owe half of you money.",
  "Tell the medic she was right about the drinking. And the other thing.",
  "Last thing I'll ever smell is the engineer's boots. Fitting.",
  "I hid a bottle of Pyrate rum in the oxygen scrubber. Share it. Not with Kev.",
  "At least I'll never have to go to my sister's wedding.",
  "I always said I'd go out with a bang. Didn't mean this.",
  "Somebody delete the photos on my tablet. All the photos. Don't look at them first. Don't you dare look at them.",
  "Tell the Sloog at the last store their silk gave me a rash. Somewhere private.",
  "I want a Viking funeral. Light me up and push me at something expensive.",
  "My only regret is not punching the quartermaster.",
  "Mum always said I'd come to a bad end. Smug cow.",
  "Is this the bit where my life flashes past? Christ, skip the teenage years.",
  "Cancel my subscriptions. Especially the one you're thinking of.",
  "Every bastard on this ship owes me a drink. Drink them for me.",
  "Death or the Rebuff paperwork. Fine. Death.",
  "I've had worse Tuesdays. No I haven't.",
  "Put 'died of being right' on the plaque.",
  "Go on then, take my boots. You've been eyeing them up for weeks.",
  "If anyone asks, I was sober. Ish.",
  "Can't even die without a bloody queue.",
  "Who the hell put the air lock next to the toilet?",
  "My will's in my sock. The left one. Wash it first." ];
const LAST_WORDS_CAUSE = {
  fire:["Is it warm in here or is it just... yes. It's me. I'm on fire.","Stop, drop and roll, they said. Roll WHERE?","Tell the engineer the fire suppression is still 'on the list'.","At least I'm finally warm.","Smells like the cook's lasagne in here."],
  air:["Is it just me, or is it getting... thin... in here...","Who turned... off... the... air...","I'll just... hold my breath... for ever...","Note to self: breathing. Important.","Someone left the door open. I know who. Tell everyone."],
  boarders:["You're standing on my foot. And my lungs.","They came through the door like they owned the place.","Get your hands off my ship!","I had him. I definitely had him. He had me more.","Next time I'm bringing a bigger stick."],
  enemy:["Did anyone else hear a whistling noise?","That one had my name on it. Spelled wrong, too.","Shields! Where were the bloody shields?","I told you they were aiming at this room.","Direct hit. On me. Brilliant."],
  aboard:["Whose idea was it to come over here?","Tell them I took a few with me. Round up.","This ship smells worse than ours. Didn't think that was possible.","I'll just wait for the teleporter, shall I?","At least the view's different."],
  mind:["I didn't mean it! I was... not me...","Get out of my head! It's a mess in there, anyway.","Why do I suddenly want to hug a Rebuff officer?","Sorry about the stabbing. That wasn't me. Mostly."],
  away:["The away mission was not, as promised, 'routine'.","Tell the captain the planet was not 'probably fine'.","I'd like to file a complaint about the mission briefing."] };
const LAST_WORDS_RACE = {
  human:["We were the ones who invented tea. Remember that.","Tell Earth I said hello. Nobody's there. Say it anyway."],
  mantlis:["A good death. A noisy one. Excellent.","Eat my enemies. Not me. Them."],
  sloog:["The goo... returns to the goo...","Melt me down and make something nice. A rug."],
  voltan:["I go to join the great circuit.","Ground me gently."],
  enjinn:["Recycle the good parts. Not my opinions.","Error: unhandled... feelings..."],
  pebblekin:["Rocks don't die. We just... sit very still... for longer.","Put me in the garden. As a feature."],
  hiveborn:["The hive... will remember... someone like me.","Tell the queen I was her favourite. She'll know it's a lie."],
  crystalline:["I can see every colour at once. Oh, it's just the sparks.","Don't sweep me up. I'm a mosaic now."],
  glassborn:["Handle with care. Too late.","Mind the edges."] };
const LAST_WORDS_VET = ["I've survived worse than this. Statistically, this was coming.","Thirty jumps without a scratch. Thirty-one: bang.","Tell the new kids to stand behind cover. I never did.","I've done this so many times I forgot it could end.","Hand me my rifle. I want to look the part.","They'll put my name on a lounge somewhere. Make sure it's got a bar."];
const LAST_WORDS_ROOKIE = ["But I only just got my uniform.","Is it always like this? Oh.","Nobody said anything about this at the recruitment stall.","I haven't even unpacked.","Well, that was a short career."];
// a few more per personality
for(const [q, L] of Object.entries({
  gambler:["Double or nothing?","I'm all in. That's... the problem.","I had a system. The system had me."],
  poet:["Do not go gentle... ah, sod it.","Roses are red. So am I. Everywhere.","There's a sonnet in this. Someone else write it."],
  cook:["Season the soup. Season it properly. You never season it properly.","Who ate the last pudding? Tell me now. I won't be angry for long."],
  superstitious:["Thirteen jumps! I told you! THIRTEEN!","Someone broke a mirror. I KNOW someone broke a mirror."],
  daredevil:["Hold my drink.","That was AMAZING. Ow.","Did anyone get that on camera?"],
  worrier:["See? See? This is what I was worried about!","Is it my fault? It feels like my fault.","I should have worried more."],
  tinkerer:["Hand me the spanner. No, the other spanner. No. Ah.","I can fix this. I can fix... no I can't."],
  romantic:["Tell her... tell all of them... in alphabetical order.","Kiss me. Not you. Someone better looking."],
  conspiracy:["It was the Directorate. It's always the Directorate.","The fleet isn't real. Neither is this. Ow, this feels real."],
  sleepwalker:["Am I awake? I'd rather not be.","Wake me when we get there."],
  collector:["Don't sell my spoons. Each spoon has a story.","The rarest thing in my collection: one unbroken me. Oh."],
  expyrate:["Dead men tell no tales. I'll tell a few.","Raise the black flag. Or at least wave something."],
  mystic:["The stars said today. The stars are smug.","I saw this coming. I should have told someone. I should have told me."],
  optimist:["Look on the bright side: I don't have to clean the scrubbers any more!","Things can only get better. For you lot."],
  grump:["Typical. Absolutely typical.","Don't make a fuss. I hate a fuss.","Finally. Peace and bloody quiet."],
  bookworm:["Spoilers. I know how this ends.","Put a bookmark in me."] })) LAST_WORDS[q] = (LAST_WORDS[q] || []).concat(L);

function deathKey(why){ why = String(why || ''); return /enemy fire/.test(why) ? 'enemy' : /fire/.test(why) ? 'fire' : /air|suffocat/.test(why) ? 'air' : /boarder/.test(why) ? 'boarders' : /aboard the enemy/.test(why) ? 'aboard' : /mind/.test(why) ? 'mind' : /away/.test(why) ? 'away' : /enemy fire|killed by/.test(why) ? 'enemy' : null; }
/* choose from what fits: how they died, who they were, how long they lasted; then the grown-up or the everyday set */
function lastWordsPool(c, why){
  const k = deathKey(why), lv = typeof loLvl==='function' ? loLvl(c) : 1, served = G ? G.stats.jumps - ((G.crewJoined || {})[c.id] || 0) : 99;
  const special = [].concat(k ? LAST_WORDS_CAUSE[k] || [] : [], LAST_WORDS_RACE[c.race] || [], LAST_WORDS[c.quirk] || [], lv >= 15 || (c.pres || 0) > 0 ? LAST_WORDS_VET : [], served <= 2 ? LAST_WORDS_ROOKIE : []);
  const general = LAST_WORDS.generic.concat(grownUp() ? LAST_WORDS_ADULT : []);
  return special.length && Math.random() < .6 ? special : general; }
(function(){ const d0 = sagaDeath; sagaDeath = function(c, sh, cause){ if(!G || !c || c.owner!=='p' || c.drone) return d0(c, sh, cause);
  const why = cause || deathCause(c, sh), gen = LAST_WORDS.generic, q = c.quirk, qOld = LAST_WORDS[q];
  LAST_WORDS.generic = lastWordsPool(c, why); if(q) LAST_WORDS[q] = [];
  try{ d0(c, sh, cause || why); } finally { LAST_WORDS.generic = gen; if(q) LAST_WORDS[q] = qOld; }
  const f = G.fallen && G.fallen[G.fallen.length - 1]; if(f && f.name===c.name){ Object.assign(f, { lvl:typeof loLvl==='function' ? loLvl(c) : 1, pres:c.pres || 0, cls:c.cls || null, epitaph:epitaph(f, c), date:Date.now(), runId:G.seed || '', mode:typeof modeNow==='function' ? modeNow().name : '' });
    const m = PROFILE.memorial && PROFILE.memorial[0]; if(m && m.name===f.name && m.words===f.words) Object.assign(m, f, { ship:G.ship.name });
    PROFILE.memorial = (PROFILE.memorial || []).slice(0, 200);
    (G.funeralFor = G.funeralFor || []).push(f.name); if(typeof logDeath==='function') logDeath(f); } }; })();

/* ---------------- epitaphs ---------------- */
function epitaph(f, c){
  const k = deathKey(f.why), q = f.quirk, kills = f.kills || 0, served = f.served || 0, name = f.name;
  const byCause = { fire:[`${name} went out in a blaze of glory. Mostly blaze.`, `Too hot to handle. Literally.`, `Fought the fire. The fire won on points.`],
    air:[`Took one last deep breath. There wasn't one.`, `Died as they lived: short of breath and arguing about the thermostat.`, `Here lies ${name}, who should have closed the door.`],
    boarders:[`Held the door. The door didn't hold.`, `Stood their ground. The ground was in the way.`, `Faced the boarders head-on. Their head came off worse.`],
    enemy:[`In the wrong room at the wrong time, with the wrong amount of armour.`, `The enemy gunner's best shot of the day.`, `Proof that shields matter.`],
    aboard:[`Went over to their ship and didn't come back. Left a mark, though.`, `Took the fight to the enemy. The enemy kept it.`],
    mind:[`Not themselves at the end. Nobody holds it against them. Much.`],
    away:[`The mission was routine. The ending wasn't.`] }[k] || [`Gone, but not forgotten. Well, a bit forgotten.`];
  const extra = [];
  if(kills >= 10) extra.push(`Took ${kills} of the bastards with them.`, `${kills} kills. Not a bad tally.`); else if(kills >= 3) extra.push(`Took ${kills} with them.`);
  if(served <= 1) extra.push(`Served one jump. Made it count. Sort of.`, `Barely had time to learn everyone's names.`); else if(served >= 30) extra.push(`${served} jumps of loyal service.`, `Out there for ${served} jumps. Earned the rest.`);
  const byQuirk = { gambler:'Bet on themselves. Lost.', poet:'Their final verse was short.', cook:'The galley will never smell the same. Thank God.', superstitious:'They saw it coming. Nobody listened.', daredevil:'Died doing something stupid. As promised.', worrier:'Finally, nothing left to worry about.', tinkerer:'Left one last thing unfinished.', romantic:'Loved by many. Specifically, by many.', conspiracy:'Knew too much. Or too little. The jury is out.', sleepwalker:'Finally got a lie-in.', collector:'Their collection lives on, in a box nobody wants.', expyrate:'Yo ho, no more.', mystic:'The stars were right, the smug bastards.', optimist:'Smiled to the end. It was unsettling.', grump:'Would have hated this plaque.', bookworm:'The last page turned.' };
  if(byQuirk[q] && (q!=='romantic' || grownUp())) extra.push(byQuirk[q]);
  return [pick(byCause), extra.length ? pick(extra) : ''].filter(Boolean).join(' ');
}

/* ---------------- funerals ---------------- */
const EULOGY_HONOURS = ['{dead} was the finest crew member this ship ever had. Present company included. Sorry.', 'We commit {dead} to the void, which is getting quite full of our friends.', '{dead} never once complained. Out loud. Where anyone could hear.', 'Some people make the ship work. {dead} made it worth working on.'];
const EULOGY_ROAST = ['{dead} owed every single one of us money, and frankly, this is the most convenient way out.', '{dead} was a terrible cook, a worse pilot and a magnificent liar. We will miss the lying.', 'Let\'s be honest: {dead} snored like a broken reactor and smelled like one too. Raise your glasses.', '{dead} once tried to fix the toilet with a grenade. It worked. We never asked how.', 'The last time {dead} was this quiet was the hangover after the Pyrate wedding.', '{dead} always said they wanted to be cremated. Well, the fire got there first.'];
function funeralOpen(){
  const names = (G.funeralFor || []).slice(0, 4); G.funeralFor = []; if(!names.length || !G || G.tut || G.daily || G.cup) return false;
  const fallen = (G.fallen || []).filter(f => names.includes(f.name)), who = names.length===1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  const words = fallen.map(f => `${f.name}: "${f.words}"`).join(' ');
  const choices = [
    { text:'Full honours. Speeches, the airlock, the lot.', effect:{ text:`Everyone stands in the airlock bay in their least dirty uniforms. ${pick(EULOGY_HONOURS).replace(/\{dead\}/g, who)} The coffin goes out into the dark, and the crew go back to work a bit closer than before.`, funeral:'honours', crewHeal:10 } },
    { text:'A roast. They\'d have wanted laughter.', effect:{ text:`${pick(grownUp() ? EULOGY_ROAST : EULOGY_ROAST.slice(1, 4)).replace(/\{dead\}/g, who)} The laughter goes on longer than it should, and then stops, and then someone starts it again.`, funeral:'roast' } },
    { text:'A quick word. There\'s no time.', effect:{ text:`"${who}. Good crew. Gone too soon." The airlock cycles. The ship moves on.`, funeral:'quick' } },
    { text:'The practical option: recycle what can be recycled.', effect:{ text:`Nobody says anything. The reclaimer hums. It gives you two drone parts and a feeling you can't wash off. ${grownUp() ? 'Somebody mutters "heartless bastard", and they don\'t mean the reclaimer.' : 'The crew won\'t look at you for a while.'}`, funeral:'recycle', parts:2 } } ];
  G.modal = { type:'event', id:'funeral', title:names.length===1 ? `Farewell, ${names[0]}` : 'Farewells', inline:{ text:`The fight is over and the ship is quiet. ${who} ${names.length===1 ? 'is' : 'are'} lying under a sheet in the cargo bay. Last words, for the record: ${words}`, choices, art:'ship' }, ctx:{ crew:randomCrewName() } };
  return true; }
function funeralEffect(e, L){ if(!e || !e.funeral || !G) return; const crew = G.ship.crew.filter(c => c.owner==='p' && !c.drone), H = { honours:30, roast:20, quick:0, recycle:-60 }[e.funeral] || 0;
  if(H && typeof addHearts==='function') for(const c of crew) addHearts(c, H + (e.funeral==='roast' && /daredevil|expyrate|gambler/.test(c.quirk || '') ? 25 : 0));
  if(H) L.push(H > 0 ? 'The crew feel closer' : 'The crew are shaken by it');
  const label = { honours:'sent off with full honours', roast:'given a roast to remember', quick:'given a quick word', recycle:'recycled for parts' }[e.funeral];
  for(const f of (PROFILE.memorial || []).slice(0, 6)) if(!f.funeral && Date.now() - (f.date || f.t || 0) < 6e5) f.funeral = label;
  saveProfile(); }
(function(){
  const a0 = applyEffect; applyEffect = function(e, ...rest){ const L = a0(e, ...rest); if(e && e.funeral){ try{ funeralEffect(e, L || []); }catch(err){} } return L; };
  const c0 = closeResult; closeResult = function(m){ c0(m); if(G && !G.modal && !G.enemy && (G.funeralFor || []).length) funeralOpen(); };
})();

/* ---------------- the Memorial Wall ---------------- */
function openMemorial(back){ UI.memBack = back || UI.screen; UI.memPage = 0; UI.screen = 'memorial'; }
function memorialStats(M){ const cnt = f => { const o = {}; for(const m of M){ const k = f(m); if(k) o[k] = (o[k] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1])[0]; };
  const cause = cnt(m => ({ fire:'fire', air:'running out of air', boarders:'boarders', enemy:'enemy fire', aboard:'away on enemy ships', mind:'mind control', away:'away missions' })[deathKey(m.why)] || 'other things');
  const race = cnt(m => (DATA.races[m.race] || {}).name || m.race), ship = cnt(m => m.ship);
  const kills = M.reduce((t, m) => t + (m.kills || 0), 0), shortest = M.filter(m => m.served != null).sort((a, b) => a.served - b.served)[0], hero = M.slice().sort((a, b) => (b.kills || 0) - (a.kills || 0))[0];
  return { cause, race, ship, kills, shortest, hero }; }
function drawMemorial(){
  const M0 = PROFILE.memorial || [], sort = UI.memSort || 'new';
  const M = M0.slice().sort((a, b) => sort==='kills' ? (b.kills || 0) - (a.kills || 0) : sort==='served' ? (b.served || 0) - (a.served || 0) : sort==='lvl' ? (b.lvl || 1) - (a.lvl || 1) : (b.t || b.date || 0) - (a.t || a.date || 0));
  label('Across all your voyages', 60, 64, C.muted, 'left', 15); T('The Memorial Wall', 60, 118, { s:46, f:FD, w:700, c:C.amber });
  btn(1400, 40, 160, 52, 'Close', () => { UI.screen = UI.memBack || 'record'; }, { s:17 });
  if(!M.length){ para('Nobody yet. Long may it last.', 60, 200, 900, { s:22, c:C.muted }); return; }
  const S = memorialStats(M);
  const stat = (x, k, v) => { T(k.toUpperCase(), x, 160, { s:12, f:FD, w:600, c:C.muted, ls:1 }); T(v, x, 188, { s:18, f:FD, w:700, c:C.ink, max:300 }); };
  stat(60, 'Fallen', String(M.length)); stat(220, 'Took with them', `${S.kills} foes`); stat(440, 'Biggest killer', S.cause ? `${S.cause[0]} (${S.cause[1]})` : '—'); stat(780, 'Most lost', S.race ? `${S.race[0]} (${S.race[1]})` : '—');
  stat(1060, 'Unluckiest ship', S.ship ? `${theName(S.ship[0])} (${S.ship[1]})` : '—');
  [['new', 'Newest'], ['kills', 'Most kills'], ['served', 'Longest served'], ['lvl', 'Highest level']].forEach(([k, n], i) => btn(60 + i*170, 212, 160, 40, n, () => { UI.memSort = k; UI.memPage = 0; }, { s:14, fill:sort===k }));
  if(S.hero && S.hero.kills) T(`Hero of the wall: ${S.hero.name}, ${S.hero.kills} kills. ${S.shortest && S.shortest.served <= 2 ? `Shortest career: ${S.shortest.name}, ${S.shortest.served} jump${S.shortest.served===1 ? '' : 's'}.` : ''}`, 760, 240, { s:14, c:C.muted, max:800 });
  const per = 6, pages = Math.ceil(M.length/per), pg = clamp(UI.memPage || 0, 0, pages - 1), cw = 728, ch = 196;
  M.slice(pg*per, pg*per + per).forEach((f, i) => { const x = 60 + (i % 2)*(cw + 24), y = 272 + Math.floor(i/2)*(ch + 14), race = DATA.races[f.race] || {}, qd = typeof quirkDef==='function' && quirkDef(f.quirk);
    rr(x, y, cw, ch, 12); ctx.fillStyle = 'rgba(14,16,24,.92)'; ctx.fill(); ctx.strokeStyle = hexA(C.amber, .35); ctx.lineWidth = 1.5; ctx.stroke();
    rr(x + 6, y + 6, cw - 12, ch - 12, 9); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.stroke();
    T(f.name, x + 24, y + 40, { s:26, f:FD, w:700, c:C.amber, max:380 });
    T(`${race.name || f.race}${qd ? ' · ' + qd.name : ''}${f.lvl ? ' · Lv ' + f.lvl : ''}${f.pres ? ' ★' + f.pres : ''}`, x + cw - 24, y + 38, { s:14, a:'right', c:race.color || C.muted, max:300 });
    const d = new Date(f.date || f.t || 0); T(`${theName(f.ship || 'the ship')} · sector ${f.s || '?'} · ${d.getDate()} ${d.toLocaleString('en-GB', { month:'short' })} ${d.getFullYear()}`, x + 24, y + 64, { s:13, c:C.muted, max:cw - 48 });
    T(`${mcap(f.why || 'lost')}. Served ${f.served != null ? f.served : '?'} jump${f.served===1 ? '' : 's'}, ${f.kills || 0} kill${f.kills===1 ? '' : 's'}.${f.funeral ? ' ' + mcap(f.funeral) + '.' : ''}${f.risen ? (f.risen.wrong ? ' Dug up again. Came back wrong.' : ' Dug up again, and came back.') : ''}`, x + 24, y + 88, { s:14, c:C.ink, max:cw - 48 });
    para(`"${f.words}"`, x + 24, y + 116, cw - 48, { s:16, lh:21, c:'#f3e3c0', max:2 });
    if(f.epitaph) para(f.epitaph, x + 24, y + 166, cw - 210, { s:13, lh:17, c:C.muted, max:2 });
    const r = f.respects || 0; btn(x + cw - 170, y + ch - 50, 150, 36, r ? `Respects · ${r}` : 'Pay respects', () => { f.respects = r + 1; saveProfile(); toast(pick([`You pay your respects to ${f.name}.`, `A moment of silence for ${f.name}.`, `${f.name} would have pretended not to care. They'd have cared.`, grownUp() ? `${f.name} would have told you to stop being soft and get back to work.` : `${f.name} would have told you to get back to work.`, `You straighten ${f.name}'s plaque. It was wonky. They'd have liked that.`])); }, { s:13, col:C.amber }); });
  if(pages > 1){ btn(60, 930, 200, 48, '‹ Newer', () => { UI.memPage = pg - 1; }, { s:15, disabled:pg <= 0 }); T(`Page ${pg + 1} of ${pages}`, 800, 962, { s:15, a:'center', c:C.muted }); btn(1340, 930, 200, 48, 'Older ›', () => { UI.memPage = pg + 1; }, { s:15, disabled:pg >= pages - 1 }); }
}
