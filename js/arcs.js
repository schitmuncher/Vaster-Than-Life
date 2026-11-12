'use strict';
/* =========================================================================
   Storylines. Every standard run follows one story through the sectors, and
   each has its own scenes, its own help (or harm) at the Dreadnought and its
   own endings. Pip, the data core, is the first; the others are picked so you
   see a new one each run (or pick one in the hangar).
     G.arc   which story this run follows ('pip', 'vance', 'flotilla', 'harte')
     G.arcS  its state: v (trust), n (a count), f (flags), beat, beats
   Pip's own scenes and state live in campaign.js; this file is the rest.
   ========================================================================= */
const ARCS = {
  pip:{ name:'The Data Core', who:'Pip', blurb:'The data core in your hold wakes up, and it is frightened.', color:'#5fd3e6' },
  vance:{ name:'The Defector', who:'Commander Vance', blurb:'A Mandate officer wants to change sides. She might even mean it.', color:'#ff8a8a',
    hale:'"One more thing. Mandate Intelligence has been losing officers lately. If one of them turns up asking for a lift, be careful. Some of them are real."',
    beats:['vance_pod', 'vance_hunt', S => S.f.gone ? 'vance_echo' : 'vance_bug', S => S.f.gone ? (S.f.echo ? null : 'vance_echo') : 'vance_home', 'vance_eve'],
    final:S => S.f.gone ? null : S.v >= 3 ? 'vance_ready_hi' : S.v >= 1 ? 'vance_ready_mid' : 'vance_turn',
    ending:S => S.f.gone ? 'vance_gone' : S.f.ready ? 'vance_loyal' : S.f.betray ? 'vance_traitor' : 'vance_half',
    chatter:S => S.f.gone ? null : S.v >= 2 ? ['Vance: "Your coffee is terrible. The Mandate\'s was worse."', 'Vance is teaching {crew} to play Mandate officer\'s chess. Nobody else understands the rules.', 'Vance: "That beacon is a Mandate listening post. Was. Probably."', 'Vance has started saying "we" when she means your crew.']
      : ['Vance is reading the ship\'s safety manual again.', 'Vance watches the scanner more than she watches anyone.', '{crew} keeps an eye on Vance. Vance keeps an eye on {crew}.'] },
  flotilla:{ name:'The Lost Flotilla', who:'Harrow Reach', blurb:'A colony fled the Mandate in forty shuttles. They are scattered all along your route.', color:'#ffd166',
    hale:'"Oh, and the colony at Harrow Reach fled ahead of the Mandate last month. Forty shuttles, scattered all over your route. If you see any of them, help if you can. I won\'t order you to."',
    beats:['fl_mayday', 'fl_ice', 'fl_fever', S => S.n >= 1 ? 'fl_split' : null, S => S.n >= 2 ? 'fl_tug' : null],
    final:S => S.n >= 3 && S.f.tug ? 'fl_muster' : S.n >= 1 ? 'fl_thanks' : null,
    ending:S => S.n >= 4 ? 'fl_reborn' : S.n >= 1 ? 'fl_few' : 'fl_empty',
    chatter:S => S.n >= 1 ? ['Mayor Prynn: "Still with you, courier. Mostly."', 'A Harrow shuttle sends over a drawing by one of its children. It is your ship, with too many guns.', 'The Harrow convoy is singing on an open channel again.', '{crew} is swapping recipes with a Harrow cook over the radio.'] : null },
  harte:{ name:'The Rival', who:'Captain Harte', blurb:'Another courier is flying the decoy run on your route, and she wants to beat you there.', color:'#ff8ad8',
    hale:'"Oh, and Captain Harte is flying the decoy run, on your route. She\'ll draw fire. She will also try to beat you there. Don\'t let her."',
    beats:['harte_race', 'harte_cache', 'harte_ambush', S => S.f.abandoned ? 'harte_taken' : 'harte_wager', S => S.f.escort ? 'harte_eve' : null],
    final:S => S.f.escort ? (S.v >= 4 ? 'harte_final_hi' : 'harte_final') : 'harte_news',
    ending:S => S.f.escort ? (S.v >= 4 ? 'harte_wing' : 'harte_rivals') : 'harte_alone',
    chatter:S => S.f.lost ? null : ['Harte: "Still behind me, courier?"', 'Harte has sent over a list of everything you have done wrong today. It is long and very funny.', 'Harte\'s ship does a barrel roll past your window, for no reason at all.', `Harte: "Score's ${S.n} to me, by the way." It isn't.`] }
};
const ARC_IDS = Object.keys(ARCS);
function arcId(){ return (G && G.arc) || 'pip'; }
function arcDef(){ return ARCS[arcId()] || ARCS.pip; }
function arcState(){ return (G.arcS = G.arcS || { v:0, n:0, f:{}, beat:0, beats:0 }); }
function arcPure(){ return arcId() !== 'pip'; }

/* which story a run follows: the one you picked, or the one you have seen least (Pip first, for a new captain) */
function pickArc(){
  if(SET.arc && ARCS[SET.arc] && typeof campaignPure==='function' && campaignPure()) return SET.arc;
  if(!(typeof campaignPure==='function' && campaignPure())) return ARC_IDS[hashStr(String(G.seed||'') + 'arc') % ARC_IDS.length];   // dailies and challenges: the seed decides, so everyone gets the same one
  const seen = PROFILE.arcs || {}; if(!(PROFILE.history||[]).some(e => !e.daily)) return 'pip';
  const least = Math.min(...ARC_IDS.map(k => seen[k]||0)); return pick(ARC_IDS.filter(k => (seen[k]||0) === least));
}
function arcRunStart(){
  if(!G || G.campaign) return; G.arc = pickArc(); G.arcS = { v:0, n:0, f:{}, beat:0, beats:0 };
  const A = ARCS[G.arc]; if(A && A.roll){ const r = srng(hashStr(String(G.seed||'') + '|twist|' + G.arc) || 7); A.roll(G.arcS, r, G); }   // the hidden twist: the same story can go a different way each run
  if(typeof campaignPure==='function' && campaignPure()){ PROFILE.arcs = PROFILE.arcs || {}; PROFILE.arcs[G.arc] = (PROFILE.arcs[G.arc]||0) + 1; saveProfile(); }
}
/* entering a sector: the next scene of a non-Pip story (campaignSector calls this) */
function arcSector(){
  const A = arcDef(), S = arcState(), sd = sectorDef();
  if(sd.final){ const id = A.final && A.final(S); if(id && DATA.events[id] && !G.seen[id]){ startEvent(id); G.thenMap = true; return true; } return false; }
  if(G.sector < 2 || sd.secret) return false;
  while(S.beat < A.beats.length){ const b = A.beats[S.beat++]; if(S.f.gone && typeof b!=='function') continue; const id = typeof b==='function' ? b(S) : b;   // after a story ends early, only scenes that ask about it still come
    if(!id || !DATA.events[id] || G.seen[id]) continue; startEvent(id); G.thenMap = true; return true; }
  return false;
}
function arcArrive(first){
  const A = arcDef(); if(!A.chatter || !first || G.enemy) return; const L = A.chatter(arcState()); if(!L || !L.length) return;
  if(Math.random() < .07) toast(fillText(pick(L), { crew:randomCrewName() }));
}
function arcEffect(a, L){
  const S = arcState();
  if(a.v){ S.v += a.v; const who = arcDef().who; L.push(a.v > 0 ? `${who} remembers that` : `${who} remembers that, too`); }
  if(a.n){ S.n += a.n; const cl = arcId()==='flotilla' ? 'Harrow shuttles saved' : arcDef().count; if(cl) L.push(`${cl}: ${S.n}`); }
  if(a.t != null) S.t = a.t;
  for(const f of [].concat(a.f || [])) S.f[f] = true;
  if(a.gone) S.f.gone = true;
  if(a.note && typeof sagaNote==='function') sagaNote(arcId(), fillText(a.note, G.evCtx || {}));
}
/* the Dreadnought fight: what your story's people do to help (or hurt). Returns the line for the comms panel. */
function arcBoss(e, ph){
  const id = arcId(), S = arcState(), F = S.f, out = [];
  const hurt = (k, why) => { const n = Math.min(k, e.hull - 1); if(n > 0){ e.hull -= n; out.push(`${why} -${n} hull.`); } };
  if(id==='vance'){
    if(F.ready && ph < 2){ ionizeAll(e, 'weapons', ph ? 5 : 8); out.push(ph ? 'Vance does it again. "They will patch it after this," she warns. The Dreadnought\'s guns go quiet for five seconds.' : 'Vance reads a long string of codes into the comm. The Dreadnought\'s gun crews are locked out of their own fire control for eight seconds.'); }
    else if(F.half && ph===0){ ionizeAll(e, 'shields', 5); e.shield = 0; out.push('Vance gets into the Dreadnought\'s shield relay. Its shields stutter and fall for five seconds.'); }
    else if(F.betray && ph===0){ e.hull += 6; e.maxHull += 6; ionizeAll(G.ship, 'shields', 4); out.push('The Dreadnought knows exactly where your shields are weakest. Somebody told it.'); }
  }
  if(id==='flotilla' && F.muster){ hurt(2 + Math.floor(S.n/2), ph===0 ? 'Old Marrow swings in under the Dreadnought and fires its rock-cutter.' : ph===1 ? 'Old Marrow comes round for another pass, the Harrow shuttles buzzing the Dreadnought\'s gunners.' : 'Old Marrow rams the Dreadnought, which nobody planned.'); }
  if(id==='harte' && F.escort){
    if(ph===0 || (ph===1 && S.v >= 4)){ ionizeAll(e, 'weapons', 4); out.push(ph ? 'Harte loops in front of the Dreadnought again, shouting rude things on every channel. It fires at her first. Again.' : 'Harte\'s ship screams in front of you, every light blazing. The Dreadnought\'s opening salvo goes after her instead of you.'); }
    if(F.behind || S.v >= 4) hurt(ph===2 ? 4 : 2, 'Harte empties her missile racks into the Dreadnought\'s hull.');
  }
  const A = arcDef(); if(A.boss){ const H = {
      hurt:(k, why) => hurt(k, why),
      ion:(sys, secs, why) => { ionizeAll(e, sys, secs); if(sys==='shields') e.shield = 0; out.push(why); },
      buff:(k, why) => { e.hull += k; e.maxHull += k; out.push(why); },
      mine:(sys, secs, why) => { ionizeAll(G.ship, sys, secs); out.push(why); },
      heal:(k, why) => { const s = G.ship, n = Math.min(k, s.maxHull - s.hull); s.hull += n; out.push(n > 0 ? `${why} +${n} hull.` : why); },
      shield:(k, why) => { G.ship.super = Math.max(G.ship.super||0, k); out.push(why); },
      crew:(why) => { for(const c of G.ship.crew) if(c.owner==='p') c.hp = c.maxHp; out.push(why); },
      say:(why) => out.push(why) };
    A.boss(e, ph, S, H); }
  return out.join(' ');
}
const ARC_ENDINGS = {
  vance_loyal:  { arc:'vance', title:'Honourable Discharge', hint:'Win with Vance trusting you.', text:'Commander Ilsa Vance testifies before the Commonwealth council for nine hours. The Mandate Directorate never trusts its own codes again. Years later she captains a ship of her own, and it flies your colours.' },
  vance_half:   { arc:'vance', title:'Half a Turncoat', hint:'Win with Vance aboard, still half a stranger.', text:'Vance gets a pardon, a desk and a guard who follows her everywhere. She doesn\'t seem to mind. Once a year your crew get a postcard from her, from a different world each time, never with a return address.' },
  vance_traitor:{ arc:'vance', title:'Divided Loyalties', hint:'Win after Vance sells you out.', text:'You win anyway. Vance is gone by the time the Fleet scatters, slipped away in a lifepod while everyone was cheering. Months later a coded message reaches you: her brother is safe. It ends with one word. "Sorry."' },
  vance_gone:   { arc:'vance', title:'Not Our Problem', hint:'Win without Vance.', text:'Whatever happened to the officer in the lifepod, the war ended without her. Your crew go quiet whenever anyone mentions defectors.' },
  fl_reborn:    { arc:'flotilla', title:'Harrow Reborn', hint:'Win having saved 4 or more Harrow shuttles.', text:'Harrow Reach is rebuilt on a quiet world near Commonwealth command. The main street is named after your ship. Mayor Prynn insists on a statue of your crew. It is not a good likeness. Your crew love it.' },
  fl_few:       { arc:'flotilla', title:'A Few Lights', hint:'Win having saved some of Harrow Reach.', text:'Some of Harrow Reach made it. Not all. Every year the survivors light a lantern for each shuttle that didn\'t, and one more, for the courier who stopped.' },
  fl_empty:     { arc:'flotilla', title:'Empty Sky', hint:'Win without saving anyone from Harrow Reach.', text:'The war ends. Harrow Reach never comes up in any report. Nobody asks about the signals you flew past, and you never bring them up.' },
  harte_wing:   { arc:'harte', title:'Wingmates', hint:'Win with Harte as your close friend.', text:'Harte buys the drinks at Commonwealth command, for everyone, for three days. She claims she let you win. She claims it every time you meet for the rest of your lives, and you meet a lot.' },
  harte_rivals: { arc:'harte', title:'Friendly Rivals', hint:'Win with Harte flying escort.', text:'After the parade, Harte sends you one line: "Rematch. Any route. Any time." Your crew pin it to the galley wall. It is still there.' },
  harte_alone:  { arc:'harte', title:'Solo Delivery', hint:'Win without Harte.', text:'The real core arrives. The decoy never does. At the debrief someone reads out Captain Harte\'s name, the room goes quiet, and nobody looks at you.' }
};
function arcEndingKey(){ const A = arcDef(); return A.ending ? A.ending(arcState()) : null; }
function endingDef(k){ return (typeof ENDINGS!=='undefined' && ENDINGS[k]) || ARC_ENDINGS[k] || null; }
function arcEndings(id){ return id==='pip' ? Object.keys(ENDINGS) : Object.keys(ARC_ENDINGS).filter(k => ARC_ENDINGS[k].arc===id); }

/* the hangar's story picker: Surprise me, or a story by name */
function drawArcPicker(x, y){
  if(typeof campHangarDef==='function' && campHangarDef()) return; if(typeof NET!=='undefined' && NET.on) return;
  const list = [null, ...ARC_IDS], i = Math.max(0, list.indexOf(SET.arc && ARCS[SET.arc] ? SET.arc : null)), cur = list[i];
  label('Story', x, y+26, C.muted, 'left', 13);
  btn(x+64, y, 44, 42, '‹', () => { SET.arc = list[(i - 1 + list.length) % list.length]; saveProfile(); }, { s:18 });
  rr(x+116, y, 300, 42, 8); ctx.fillStyle = 'rgba(6,9,18,.7)'; ctx.fill();
  T(cur ? ARCS[cur].name : 'Surprise me', x+266, y+28, { s:17, f:FD, w:700, a:'center', c: cur ? ARCS[cur].color : C.ink, max:290 });
  btn(x+424, y, 44, 42, '›', () => { SET.arc = list[(i + 1) % list.length]; saveProfile(); }, { s:18 });
  const seen = PROFILE.arcs || {};
  tip(x+116, y, 300, 42, cur ? ARCS[cur].name : 'Surprise me', cur ? `${ARCS[cur].blurb} Endings found: ${arcEndings(cur).filter(k => (PROFILE.endings||{})[k]).length} of ${arcEndings(cur).length}.` : `Each run follows one story. "Surprise me" picks one you have seen least. Stories so far: ${ARC_IDS.map(k => `${ARCS[k].name} ×${seen[k]||0}`).join(', ')}.`);
}

/* ---------------- the scenes ---------------- */
Object.assign(BASE.events, {
  /* The Defector */
  vance_pod:{ title:'A lifepod', questOnly:true, noStar:true, once:true, art:'wreck', text:'A Mandate lifepod tumbles across your path, broadcasting a Commonwealth distress code it has no business knowing. Inside is one officer, still in uniform, hands raised before you even open the hatch. "Commander Ilsa Vance. I want to defect. I know what you are carrying, and I know what is chasing it."', choices:[
    { text:'Bring her aboard as a guest.', effect:{ text:'"Thank you." She says it like a word she hasn\'t used in a while. {crew} finds her a bunk and a mug of something hot. She doesn\'t drink it until {crew} drinks theirs first.', cmp:{ arc:{ v:1, note:'In sector 2 the crew pulled a Mandate officer, Commander Ilsa Vance, out of a lifepod. She said she wanted to defect.' }, beat:true } } },
    { text:'Bring her aboard, under guard.', effect:{ text:'"Sensible," she says, and holds out her wrists. She spends the jump in the brig, reading your ship\'s safety manual from cover to cover.', cmp:{ arc:{ f:'brig', note:'In sector 2 the crew took a Mandate defector, Commander Ilsa Vance, aboard under guard.' }, beat:true } } },
    { text:'Leave the pod where it is.', effect:{ text:'You fly on. The pod\'s beacon follows you for a while, then stops. {crew} doesn\'t speak to you for the rest of the shift.', cmp:{ arc:{ gone:true, f:'left' }, beat:true } } },
    { text:'Have {who} read her mind.', req:{ race:'mantlis' }, effect:{ text:'{who} touches her temple for a long moment. "She is afraid. She is lying about something small and telling the truth about something big." Vance looks almost relieved.', cmp:{ arc:{ v:2, f:'read', note:'In sector 2 the crew took a Mandate defector, Commander Ilsa Vance, aboard. {who} read her mind and vouched for her.' }, beat:true } } } ] },
  vance_hunt:{ title:'Mandate Enforcer', questOnly:true, noStar:true, once:true, art:'fleet', text:'A Mandate Enforcer drops out of a jump right on top of you. "Courier. You have a deserter aboard. Hand over Commander Vance and we will let you go about your business. For today." Vance, from the doorway: "They mean it. The \'today\' part."', choices:[
    { text:'"Not a chance."', effect:{ text:'Vance straps herself in beside your pilot without being asked.', fight:'rebuff_elite', afterWin:{ text:'Vance watches the Enforcer come apart on the scanner. "That was Captain Oduya," she says quietly. "He taught me to fly."', cmp:{ arc:{ v:1 } } }, cmp:{ beat:true } } },
    { text:'Hand her over.', effect:{ text:'Two marines take her across. She doesn\'t look back. The Enforcer keeps its word and leaves, and somewhere behind you the Fleet slows down, satisfied.', scrap:30, fleetPush:-.1, cmp:{ arc:{ gone:true, f:'handed', note:'In sector 3 the captain handed Commander Vance back to the Mandate.' }, beat:true } } },
    { text:'Let Vance talk to them.', chance:.6, success:{ text:'Vance reels off Mandate command codes in a flat, bored voice. The Enforcer\'s captain hesitates, then turns away, ordered elsewhere by an admiral who doesn\'t exist.', fleetPush:-.05, cmp:{ arc:{ v:1, f:'codes' }, beat:true } }, fail:{ text:'The codes are a week out of date. The Enforcer opens fire.', fight:'rebuff_elite', cmp:{ beat:true } } } ] },
  vance_bug:{ title:'A tracker', questOnly:true, noStar:true, once:true, art:'ship', text:'{crew} comes to the bridge holding a tiny blinking chip. "Found this stitched into the lining of Vance\'s uniform. It\'s a tracker. A good one."', choices:[
    { text:'Confront her.', effect:{ text:'Vance stares at the chip for a long time. "They sent me," she says at last. "Defect, get aboard, lead the Fleet to you. That was the job." She looks you in the eye. "I stopped wanting the job about two jumps ago. You can believe that or not."', cmp:{ arc:{ v:1, f:'confessed', note:'Commander Vance admitted she had been sent to lead the Fleet to the ship, and said she no longer wanted to.' }, beat:true } } },
    { text:'Crush it and say nothing.', effect:{ text:'The chip goes out of the airlock in very small pieces. Vance notices, eventually. She says nothing either, and it sits between you like a third person.', fleetPush:-.05, cmp:{ arc:{ f:'quiet' }, beat:true } } },
    { text:'Strap it to a cargo drone and send it the other way.', chance:.65, success:{ text:'Half the Mandate Fleet spends a day chasing a crate of tinned beans across the sector. Vance laughs out loud for the first time since she came aboard.', fleetPush:-.15, cmp:{ arc:{ v:1 }, beat:true } }, fail:{ text:'The drone\'s engine fails three klicks out. Now the Fleet knows exactly where you are, and that you think they are stupid.', fleetPush:.1, cmp:{ beat:true } } },
    { text:'Put her off at the next station.', effect:{ text:'You leave her on the dock with her bag and the chip, still blinking, in her hand. "Fair," she says. That is the last you see of her.', cmp:{ arc:{ gone:true, f:'dumped', note:'In sector 4 the captain found a tracker on Commander Vance and put her off the ship.' }, beat:true } } } ] },
  vance_home:{ title:'Vance', questOnly:true, noStar:true, once:true, art:'planet', text:'Vance asks to use the long-range comm. "My brother lives on a Mandate colony two beacons from here. If they know what I did, they will come for him." She doesn\'t ask for anything else. She clearly wants to.', choices:[
    { text:'Detour and get him out (2 fuel).', req:{ fuel:2 }, cost:{ fuel:2 }, effect:{ text:'The colony is quiet, the brother is younger than you expected, and he hugs Vance so hard her cap falls off. He is a decent mechanic, and he insists on earning his passage.', crew:'human', cmp:{ arc:{ v:2, f:'brother', note:'The ship detoured to rescue Commander Vance\'s brother from a Mandate colony. He joined the crew.' }, beat:true } } },
    { text:'Let her send a warning.', effect:{ text:'She sends three words and closes the channel. A minute later the reply comes: two words. She reads them, and something in her shoulders lets go.', cmp:{ arc:{ v:1 }, beat:true } } },
    { text:'No messages. It\'s too risky.', effect:{ text:'"Understood," says Vance. She doesn\'t speak again for the rest of the sector.', cmp:{ arc:{ v:-1 }, beat:true } } } ] },
  vance_eve:{ title:'The plan', questOnly:true, noStar:true, once:true, art:'fleet', text:'Vance spreads a hand-drawn diagram across the galley table: the Dreadnought, from the inside. "There\'s a maintenance relay under the bridge. If I can get a signal into it, I can lock its gun crews out of their own fire control. But I have to be on your bridge when we meet it, with my hands on your comm. You have to let me."', choices:[
    { text:'"Do it."', effect:{ text:'"Thank you," she says, and starts rehearsing the codes under her breath.', cmp:{ arc:{ v:1, f:'plan' }, beat:true } } },
    { text:'"You\'ll stay in the brig until it\'s over."', effect:{ text:'She nods as if she expected it. You lock the door. The diagram stays on the galley table, and {crew} studies it anyway.', cmp:{ arc:{ v:-1, f:'locked' }, beat:true } } },
    { text:'{who} checks her diagram against the ship registry.', req:{ quirk:'bookworm' }, effect:{ text:'{who} spends a night checking every pipe and bulkhead. "It\'s real," they report. "Every bolt of it. Either she\'s on our side, or she\'s the best liar in the galaxy." The crew decide she\'s on our side.', cmp:{ arc:{ v:2, f:'plan' }, beat:true, hearts:15 } } } ] },
  vance_echo:{ title:'Mandate Enforcer', questOnly:true, noStar:true, once:true, art:'fleet', text:'A Mandate Enforcer hails you. On its bridge, in a crisp new uniform, stands Commander Ilsa Vance. "Courier. They took me back, after I told them everything about your ship." She doesn\'t look happy about it. "I did ask nicely, once."', choices:[
    { text:'Battle stations.', effect:{ text:'Her guns come up.', fight:'rebuff_elite', afterWin:{ text:'Her escape pod streaks away from the wreck. It doesn\'t broadcast anything this time.', scrap:20 }, cmp:{ arc:{ f:'echo', note:'Commander Vance came back as a Mandate officer, and the crew had to fight her.' } } } },
    { text:'"Ilsa. Wait."', chance:.45, success:{ text:'She hesitates. Her guns go cold. "Not today," she says quietly, and jumps away. Your scanner shows her ship leading a patrol in the wrong direction.', fleetPush:-.08, cmp:{ arc:{ f:'echo' } } }, fail:{ text:'"No," she says, and fires.', fight:'rebuff_elite', cmp:{ arc:{ f:'echo' } } } } ] },
  vance_ready_hi:{ title:'Vance', questOnly:true, noStar:true, once:true, art:'fleet', text:'Vance is already at the comm when you enter the last sector, headset on, codes written up her arm in ink. "Whenever you like, Captain."', choices:[
    { text:'"When we see it."', effect:{ text:'She nods, and doesn\'t take her eyes off the scanner again.', cmp:{ arc:{ f:'ready' } } } } ] },
  vance_ready_mid:{ title:'Vance', questOnly:true, noStar:true, once:true, art:'fleet', text:'Vance looks pale. "I can get partway in. Their shields, maybe, for a moment. Not the guns." She hesitates. "I\'m sorry it isn\'t more."', choices:[
    { text:'"A moment is plenty."', effect:{ text:'"Then you will have one," she says.', cmp:{ arc:{ f:'half' } } } },
    { text:'"Tell me what you need."', effect:{ text:'She needs your codes, your trust and your best engineer for an hour. She gets all three. "Guns as well, then," she says at last. "Probably."', cmp:{ arc:{ v:1, f:'ready' } } } } ] },
  vance_turn:{ title:'Vance', questOnly:true, noStar:true, once:true, art:'fleet', text:'As you enter the last sector, your comm array lights up on its own. Vance is at the console, transmitting. She sees you, and doesn\'t stop. "They have my brother," she says. "I\'m sorry. I am so sorry."', choices:[
    { text:'Pull the plug and lock her up.', effect:{ text:'You reach the breaker a second too late. The Fleet has everything she sent.', fleetPush:.1, cmp:{ arc:{ f:'betray', note:'In the last sector Commander Vance sent the ship\'s position and weak points to the Mandate.' } } } },
    { text:'Talk her down.', chance:.45, success:{ text:'Her hand stops above the key. A long breath. She deletes the message and hands you the headset. "Tell me how to fix this."', cmp:{ arc:{ v:1, f:'half' } } }, fail:{ text:'"I can\'t," she says, and sends it.', cmp:{ arc:{ f:'betray', note:'In the last sector Commander Vance sent the ship\'s position and weak points to the Mandate.' } } } } ] },

  /* The Lost Flotilla */
  fl_mayday:{ title:'Mayday', questOnly:true, noStar:true, once:true, art:'ship', text:'A weak signal on a civilian band: "...this is Mayor Odessa Prynn of Harrow Reach. Four shuttles, one working engine between us. Pyrates have found us. Anyone. Anyone at all."', choices:[
    { text:'Drive the pyrates off.', effect:{ text:'You put yourself between the shuttles and the pyrates.', fight:'pyrate_gunship', afterWin:{ text:'The shuttles limp up alongside. Prynn salutes from her cockpit with a coffee mug. "We\'ll follow as far as we can, courier. We\'re faster than we look."', cmp:{ arc:{ n:2, note:'In sector 2 the crew fought off pyrates to save Mayor Prynn and the first Harrow Reach shuttles.' } } }, cmp:{ beat:true } } },
    { text:'Send them fuel and a safe route (3 fuel).', req:{ fuel:3 }, cost:{ fuel:3 }, effect:{ text:'You beam them a route and three cells of fuel. The pyrates find nothing but exhaust. Prynn\'s message trails after you: "We owe you. Harrow Reach pays its debts."', cmp:{ arc:{ n:1, note:'In sector 2 the crew gave fuel to the fleeing shuttles of Harrow Reach.' }, beat:true } } },
    { text:'You can\'t risk the core. Keep going.', effect:{ text:'The signal fades behind you, then stops. Nobody on the bridge says anything for a long time.', cmp:{ arc:{ f:'refused' }, beat:true } } } ] },
  fl_ice:{ title:'Frozen', questOnly:true, noStar:true, once:true, art:'asteroid', text:'A Harrow shuttle has drifted into a comet\'s tail and frozen solid, engines and all. Through the frost on the canopy, a family of five waves at you, very slowly, because it is very cold.', choices:[
    { text:'Tow them clear (2 fuel).', req:{ fuel:2 }, cost:{ fuel:2 }, effect:{ text:'It takes an hour and most of your patience. The family thaw out in your galley and insist on cooking for everyone. It is a lot of soup.', crewHeal:40, cmp:{ arc:{ n:1 }, beat:true, hearts:10 } } },
    { text:'Cut the ice away with your guns.', chance:.6, success:{ text:'Your gunner shaves the ice off a centimetre at a time. Not a scratch on the shuttle. The family name their youngest after your ship.', cmp:{ arc:{ n:1 }, beat:true } }, fail:{ text:'One shot goes a centimetre too deep. Everyone lives, but the shuttle is scrap, and the family ride the rest of the way in your cargo bay. Their eldest asks for a job.', crew:'human', cmp:{ arc:{ n:1 }, beat:true } } },
    { text:'{who} rigs a heater out of spare drone parts (2 parts).', req:{ quirk:'tinkerer', parts:2 }, cost:{ parts:2 }, effect:{ text:'{who} builds something that glows, hums and is definitely not regulation. The ice slides off the shuttle in one piece.', cmp:{ arc:{ n:1 }, beat:true, hearts:15 } } },
    { text:'Leave them. They\'ll thaw eventually.', effect:{ text:'Maybe they will. You don\'t stay to find out.', cmp:{ beat:true } } } ] },
  fl_fever:{ title:'Quarantine', questOnly:true, noStar:true, once:true, art:'nebula', text:'Three Harrow shuttles are huddled at this beacon, flying quarantine flags. Their medic hails you, exhausted. "Spacer\'s fever. It isn\'t deadly if it\'s treated. We have nothing to treat it with."', choices:[
    { text:'Send over medicine (20 scrap).', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Your medbay printer runs all night. By morning the fever has broken on all three shuttles.', cmp:{ arc:{ n:1 }, beat:true } } },
    { text:'Bring the sick aboard your medbay.', req:{ system:'medbay' }, effect:{ text:'Your medbay is full for a whole jump. Some of your own crew catch it, mildly, and complain about it loudly. Everybody recovers. The medic joins the convoy\'s side of the radio and won\'t stop thanking you.', crewHurt:25, cmp:{ arc:{ n:2 }, beat:true } } },
    { text:'Keep your distance.', effect:{ text:'You wish them luck on an open channel and keep well clear.', cmp:{ beat:true } } } ] },
  fl_split:{ title:'Mayor Prynn', questOnly:true, noStar:true, once:true, art:'station', text:'Prynn has gathered every Harrow shuttle you\'ve helped into a ragged convoy. "We can follow you," she says, "but we\'re slow, and the Fleet is fast. Or we can split off and hide in the nebula. Your call, courier. You\'ve earned it."', choices:[
    { text:'"Stay with us."', effect:{ text:'The convoy falls in behind you. It\'s slow and noisy on every channel, and your crew love it. On the way it picks up two more lost shuttles.', fleetPush:.1, cmp:{ arc:{ n:1, f:'convoy' }, beat:true, hearts:15 } } },
    { text:'"Hide in the nebula."', effect:{ text:'Prynn salutes. The convoy peels away into the gas. You\'re faster without them, and lonelier.', fleetPush:-.05, cmp:{ arc:{ f:'hidden' }, beat:true } } } ] },
  fl_tug:{ title:'Old Marrow', questOnly:true, noStar:true, once:true, art:'ship', text:'The convoy has found a friend: Old Marrow, Harrow Reach\'s ancient mining tug, crewed by six retirees and armed with a rock-cutting laser the size of a house. "Heard you\'re off to see the Dreadnought," says their captain. "Mind if we come?"', choices:[
    { text:'"The more the merrier."', effect:{ text:'Old Marrow falls in behind you, coughing smoke. Its captain sends over a list of rules for the convoy. Rule one is about biscuits.', cmp:{ arc:{ f:'tug', note:'Old Marrow, Harrow Reach\'s ancient mining tug, joined the ship for the last leg.' }, beat:true } } },
    { text:'"It\'s too dangerous. Go home."', effect:{ text:'They grumble, and go, and leave you a crate of cutting charges as a parting gift.', missiles:4, cmp:{ beat:true } } } ] },
  fl_muster:{ title:'Harrow Reach', questOnly:true, noStar:true, once:true, art:'fleet', text:'At the edge of the last sector, every Harrow shuttle you saved is waiting for you, lights blinking in a ragged line. Old Marrow sits at the front, its cutting laser glowing. Prynn\'s voice: "Harrow Reach pays its debts, courier. Point us at it."', choices:[
    { text:'"Follow me."', effect:{ text:'The shuttles fall in behind you, and the tug takes the front.', cmp:{ arc:{ f:'muster' } } } } ] },
  fl_thanks:{ title:'A message', questOnly:true, noStar:true, once:true, art:'station', text:'A message from Mayor Prynn, relayed through three stations: the shuttles you saved have reached Commonwealth space safely. Attached is a donation from people who have nothing, and a drawing of your ship.', choices:[
    { text:'Pin the drawing up on the bridge.', effect:{ text:'It stays there for the rest of the run.', scrap:30, cmp:{ hearts:10 } } } ] },

  /* The Rival */
  harte_race:{ title:'Captain Harte', questOnly:true, noStar:true, once:true, art:'ship', text:'A sleek courier drops in beside you, all engines and no manners. "Well, if it isn\'t the real delivery." Captain Juno Harte grins from your screen. "First to the exit beacon buys the drinks at command. Unless you\'re scared."', choices:[
    { text:'"You\'re on."', chance:.55, success:{ text:'You reach the exit a ship\'s length ahead. Harte\'s language on the open channel is extremely creative. "Best of three," she says.', cmp:{ arc:{ n:1, v:1, note:'In sector 2 the ship raced Captain Juno Harte, the decoy courier, and won.' }, beat:true } }, fail:{ text:'Harte is at the beacon first, doing slow loops when you arrive. "Drinks are on you, courier."', cmp:{ arc:{ v:1, note:'In sector 2 the ship raced Captain Juno Harte, the decoy courier, and lost.' }, beat:true } } },
    { text:'Push the engines past the red line.', req:{ system:'engines', level:4 }, effect:{ text:'Your engines scream, and so does Harte. You win by a mile. "Fine," she says. "Fine! Best of three."', cmp:{ arc:{ n:1, v:1, note:'In sector 2 the ship raced Captain Juno Harte, the decoy courier, and won by a mile.' }, beat:true } } },
    { text:'"Some of us have a job to do."', effect:{ text:'"Spoilsport." She peels away, laughing.', cmp:{ beat:true } } } ] },
  harte_cache:{ title:'Captain Harte', questOnly:true, noStar:true, once:true, art:'wreck', text:'Harte hails you from inside a derelict supply depot. "There\'s one crate of missiles in here and two of us. I could fight you for it." She looks at your guns. She looks at hers. "Or we split it."', choices:[
    { text:'Split it.', effect:{ text:'"Look at us. Sharing." She tosses you a lazy salute.', missiles:3, cmp:{ arc:{ v:1 }, beat:true } } },
    { text:'Let her have it.', effect:{ text:'"You\'re going soft, courier." She sounds pleased.', cmp:{ arc:{ v:2 }, beat:true } } },
    { text:'Grab the lot while she\'s talking.', chance:.6, success:{ text:'You\'re out of the depot before she finishes her sentence. "...that\'s just rude," she says, to an empty room.', missiles:6, cmp:{ arc:{ n:1, v:-1 }, beat:true } }, fail:{ text:'She was expecting that. Her tractor beam has the crate before you do, with a rude word painted on the side.', cmp:{ arc:{ v:-1 }, beat:true } } } ] },
  harte_ambush:{ title:'Mayday', questOnly:true, noStar:true, once:true, art:'fleet', text:'A mayday on a Commonwealth band: Harte\'s ship, boxed in by Mandate fighters. "Courier! I could use a hand. Or a very loud distraction."', choices:[
    { text:'Help her.', effect:{ text:'You come in shooting.', fight:'rebuff_fighter', afterWin:{ text:'Harte limps out of the wreckage beside you. "I\'ll never hear the end of this," she says. "Thank you."', cmp:{ arc:{ v:2, note:'In sector 4 the crew saved Captain Harte from a Mandate ambush.' } } }, cmp:{ beat:true } } },
    { text:'She\'s the decoy. Decoys get shot at.', effect:{ text:'You fly on. Her mayday stops after a while. You tell yourself it\'s because she got away.', cmp:{ arc:{ v:-2, f:'abandoned' }, beat:true } } },
    { text:'{who} flies straight through the Mandate formation.', req:{ quirk:'daredevil' }, effect:{ text:'{who} threads the needle between both fighters at full burn. They scatter in panic, and Harte whoops all the way to the next beacon.', cmp:{ arc:{ v:2, n:1, note:'In sector 4 {who} broke up a Mandate ambush on Captain Harte by flying straight through it.' }, beat:true } } } ] },
  harte_wager:{ title:'Cards', questOnly:true, noStar:true, once:true, art:'station', text:'Harte docks alongside for a night off, and the cards come out. "Stakes," she says. "If I win, I fly in front on the last leg and the Dreadnought shoots at me first. If you win, you get the honour." She deals.', choices:[
    { text:'Play to win.', chance:.5, success:{ text:'You win. "Fine," she says. "But I\'m still flying escort."', cmp:{ arc:{ n:1, v:1, f:'escort' }, beat:true } }, fail:{ text:'She wins. "Escort duty," she says, delighted. "I draw the fire, you shoot things. Everyone\'s happy."', cmp:{ arc:{ v:1, f:'escort' }, beat:true } } },
    { text:'{who} plays for you.', req:{ quirk:'gambler' }, effect:{ text:'{who} wins every hand, then her hat, then her lucky dice. Harte is so impressed she flies escort anyway.', scrap:25, cmp:{ arc:{ n:2, v:1, f:'escort' }, beat:true } } },
    { text:'Lose on purpose.', effect:{ text:'She knows. Of course she knows. "Idiot," she says, quite fondly, and pours you another.', cmp:{ arc:{ v:2, f:'escort' }, beat:true } } } ] },
  harte_taken:{ title:'Pyrate broadcast', questOnly:true, noStar:true, once:true, art:'ship', text:'A pyrate broadcast, gloating: they have caught a Commonwealth courier and her "very valuable cargo". On screen is Harte, tied to a chair, rolling her eyes. The cargo is the decoy. The pyrates have not worked this out yet.', choices:[
    { text:'Go and get her.', effect:{ text:'You turn round.', fight:'pyrate_gunship', afterWin:{ text:'Harte is waiting at the airlock with a bruise and a grin. "Took you long enough." A pause. "Thanks. I mean it."', cmp:{ arc:{ v:3, f:'escort', note:'In sector 5 the crew rescued Captain Harte from pyrates.' } } }, cmp:{ beat:true } } },
    { text:'Pay the ransom (40 scrap).', req:{ scrap:40 }, cost:{ scrap:40 }, effect:{ text:'The pyrates hand her over, and the decoy, and complain about the decoy. "You paid for me?" Harte says. "That\'s the most romantic thing anyone has ever done. Don\'t make it weird."', cmp:{ arc:{ v:2, f:'escort' }, beat:true } } },
    { text:'Leave her. She can talk her way out.', effect:{ text:'Maybe she can. You never find out.', cmp:{ arc:{ f:'lost', note:'In sector 5 the captain left Captain Harte to the pyrates.' }, beat:true } } } ] },
  harte_eve:{ title:'Captain Harte', questOnly:true, noStar:true, once:true, art:'station', text:'On the night before the last sector, Harte comes aboard with a bottle of something blue. "Tomorrow I fly in front," she says. "The Dreadnought sees two couriers, it shoots the noisy one. That\'s me. I\'m very noisy." She pours two glasses.', choices:[
    { text:'"To the noisy one."', effect:{ text:'The whole crew joins in. It is a long night, and a good one.', crewHeal:100, cmp:{ arc:{ v:1 }, beat:true, hearts:20 } } },
    { text:'"Fly behind me instead. Use your missiles."', effect:{ text:'"You can\'t order me about." She thinks about it. "But fine. Behind you. Close enough to make rude gestures."', cmp:{ arc:{ f:'behind' }, beat:true } } } ] },
  harte_final_hi:{ title:'Captain Harte', questOnly:true, noStar:true, once:true, art:'fleet', text:'Harte\'s ship drops in beside you at the edge of the last sector, freshly painted. Across the nose, in big letters, it says SHOOT ME FIRST. "Ready when you are, partner."', choices:[
    { text:'"Ready."', effect:{ text:'You fly in together.' } } ] },
  harte_final:{ title:'Captain Harte', questOnly:true, noStar:true, once:true, art:'fleet', text:'Harte forms up on your wing. "Escort duty, as agreed. Try to keep up, courier."', choices:[
    { text:'"Try to keep up yourself."', effect:{ text:'She laughs, and takes the lead.' } } ] },
  harte_news:{ title:'The news', questOnly:true, noStar:true, once:true, art:'station', text:'A Commonwealth bulletin, three days old: the decoy courier, Captain Juno Harte, is overdue and presumed lost. The bulletin is short. They always are.', choices:[
    { text:'Close it.', effect:{ text:'You do.' } } ] }
});

ACHIEVEMENTS.push(
  { id:'end_vance_loyal',   name:'Honourable Discharge', desc:'Win with Commander Vance on your side.' },
  { id:'end_vance_traitor', name:'Divided Loyalties',    desc:'Win after Vance sells you out.' },
  { id:'end_fl_reborn',     name:'Harrow Reborn',        desc:'Win having saved 4 or more Harrow shuttles.' },
  { id:'end_fl_few',        name:'A Few Lights',         desc:'Win having saved some of Harrow Reach.' },
  { id:'end_harte_wing',    name:'Wingmates',            desc:'Win with Captain Harte as your closest friend.' },
  { id:'end_harte_rivals',  name:'Friendly Rivals',      desc:'Win with Captain Harte flying escort.' },
  { id:'arcs_all',          name:'Every Story',          desc:'Win with ten different stories.' }
);
