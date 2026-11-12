'use strict';
/* =========================================================================
   The radio. Instead of the adaptive soundtrack (which follows the action),
   tune in to a station: it plays the game's tunes one after another, and
   between them a presenter talks rubbish. Links appear as a caption at the
   top of the screen, and can be read out in a British voice by the
   browser's speech engine (Settings → Audio → Presenter's voice).
     ost      Soundtrack (adaptive): the normal music, no presenter
     comm     Radio Commonwealth: everything, with Gerald on the late shift
     pyrate   Pyrate FM: the bangers, and DJ Scurvy Dave
     mandate  Mandate Broadcasting: calm, orderly, compulsory
   ========================================================================= */
const RADIO_STATIONS = {
  ost:{ name:'Soundtrack', short:'Soundtrack' },
  comm:{ name:'Radio Commonwealth', short:'R. Commonwealth', dj:'Gerald', pitch:1, rate:.95, col:'#ffb547',
    list:['title', 'explore1', 'store', 'explore4', 'combat2', 'explore2', 'hangar', 'strange1', 'explore5', 'win', 'explore3', 'combat1', 'start', 'over', 'combat3', 'strange2', 'combat4', 'boss'] },
  pyrate:{ name:'Pyrate FM', short:'Pyrate FM', dj:'Scurvy Dave', pitch:.8, rate:1.08, col:'#ff6a5a',
    list:['combat4', 'hangar', 'store', 'combat1', 'explore5', 'boss', 'combat3', 'win', 'combat2', 'title'] },
  mandate:{ name:'Mandate Broadcasting', short:'Mandate B.', dj:'The Announcer', pitch:.7, rate:.88, col:'#9fb6ff',
    list:['strange2', 'over', 'explore3', 'strange1', 'start', 'explore2', 'boss'] } };
const RADIO_LINKS = {
  comm:{
    intro:['Radio Commonwealth. You\'re listening to the late shift with me, Gerald. Kettle\'s on. Let\'s have some music.', 'Good evening, wherever you are and whatever time it is there. This is Radio Commonwealth. Here\'s something to fly to.'],
    link:['That was "{prev}". Lovely. Coming up, "{next}", but first, a reminder that the Mandate Fleet is not a reason to stop recycling.',
      'Lovely stuff. That was "{prev}". Now, a listener writes in: "Gerald, is it true the Courier Service lost another parcel?" Yes. Yes it is. Here\'s "{next}".',
      '"{prev}", there. Bit of traffic news: the Brindle lanes are solid, there\'s a pyrate on the hard shoulder near Outer Hask, and the Mullock Nebula is, quote, "damp." Here\'s "{next}".',
      'That was "{prev}". If you\'ve just joined us: hello, the war\'s still on, and the time is roughly now. Here\'s "{next}".',
      'Ooh, I do like that one. "{prev}". Right, the phone lines are open for tonight\'s question: is a Beacon Pasty a meal, or a cry for help? Meanwhile, "{next}".',
      '"{prev}". A message for the courier on the Plucky: your mum says ring her. Here\'s "{next}".',
      'That was "{prev}". This programme is brought to you by Brisk Reloader: because your guns should be as impatient as you are. Here\'s "{next}".',
      '"{prev}", there, for Mrs Pembury, who asked us to say she\'s "still waiting for that tin back." Next up, "{next}".',
      'And that was "{prev}". Admiral Hale has asked us to remind couriers that The Parcel is not a footstool. Now: "{next}".',
      'Beautiful. "{prev}". If you\'re driving, keep your eyes on the void. If you\'re fighting, keep your shields up. If you\'re doing both, honestly, well done. "{next}".',
      'That was "{prev}". Now the Space Weather Forecast, in brief: ion storms in the east, flares in the Furnace, and a ninety per cent chance of Mandate. Here\'s "{next}".',
      'Lovely. "{prev}". Quick reminder that this Sunday the clocks go back an hour everywhere except near black holes, where frankly they do as they please. "{next}" next.'],
    ad:['Tired of your crew? Try Spare Crew Gene Vault. Same crew, again! Terms and conditions apply. Some damp.', 'Bilge\'s Galley: full English, all day, no robbing. Mostly. Tell Reg Gerald sent you.', 'Nosy Neighbour Array: see what everyone else is up to, from the comfort of your own ship. Legal in most sectors.'] },
  pyrate:{
    intro:['ARRR! This is Pyrate FM, the only station that steals its own music! I\'m Scurvy Dave and this is a banger!', 'Pyrate FM, coming at you from somewhere the Mandate can\'t find! Turn it up! Turn it UP!'],
    link:['That was "{prev}", and if you\'re a Mandate patrol listening in, it was ALSO a distraction! Here\'s "{next}"!',
      '"{prev}"! Absolute tune! This next one goes out to the lads on the Black Gull: you still owe me a fiver. "{next}"!',
      'ARRR! That was "{prev}". Shout out to Captain Reg Bilge, who\'s gone straight and opened a caff. Proud of you, Reg. Here\'s "{next}"!',
      'That was "{prev}"! Pyrate FM is sponsored by Two-For-One Printer: why buy one missile when you can nick two? "{next}"!',
      '"{prev}", there! The Pyrate King wants me to remind you all that tax is due Friday. And to compliment his hat. Do both. "{next}"!',
      'Love it! "{prev}"! Rules of the road: don\'t rob a Jabbit, don\'t trust a Mullock, and don\'t ever, EVER mention the King\'s hat. Here\'s "{next}"!',
      'That was "{prev}"! Weather: stormy. Morals: flexible. Mood: excellent. "{next}"!'],
    ad:['Lost your ship? Found a ship? No questions asked at Honest Ahmed\'s Salvage, Pyrate Haven, dock nine.', 'Feeling robbed? You probably were! Pyrate FM: we were there.'] },
  mandate:{
    intro:['This is Mandate Broadcasting. You are listening. Thank you for listening. Listening is appreciated.', 'Mandate Broadcasting. The following music has been approved.'],
    link:['That was "{prev}". It ran for exactly the expected time. Next: "{next}". It will also run for the expected time.',
      'Citizens are reminded that enjoyment of "{prev}" was optional, but was noticed. Next: "{next}".',
      '"{prev}" has concluded. A reminder that the Commonwealth courier currently fleeing the Fleet is late, and lateness is a choice. "{next}".',
      'That was "{prev}". The time is now. It will shortly be later, as scheduled. "{next}".',
      'Mandate Broadcasting thanks Patrol 7 for an excellent week. Patrol 12 has been spoken to. Next: "{next}".',
      '"{prev}". This message is brought to you by the Department of Smiling. Smiling is not compulsory. Here is "{next}".'],
    ad:['Join the Mandate. Uniforms that fit. Floors you could eat off. Not that you would. That would be unhygienic.', 'Defectors may return at any time. The paperwork has been pre-filled. It is waiting for you.'] } };
const RADIO = { st:null, i:0, until:0, cap:null, capT:0, said:'' };
function radioOn(){ return SET.radio && SET.radio!=='ost' && RADIO_STATIONS[SET.radio] && SET.musicSrc!=='synth'; }
function radioTitle(f){ return (typeof OST_TITLES!=='undefined' && OST_TITLES[f]) || f; }
function radioSay(text, quiet){ const S = RADIO_STATIONS[SET.radio]; RADIO.cap = { who:S.name, dj:S.dj, text, col:S.col }; RADIO.capT = performance.now();
  if(!quiet && typeof logEntry==='function' && G) logEntry(`On ${S.name}: ${text}`, 'note');   // station idents don't go in the log, only the links
  if(SET.radioVoice!==false && typeof speechSynthesis!=='undefined' && SET.music > 0){ try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/"/g, ''));
    const vs = speechSynthesis.getVoices(), v = vs.find(x => /en-GB/i.test(x.lang) && /male|daniel|george|arthur|oliver/i.test(x.name)) || vs.find(x => /en-GB/i.test(x.lang)) || vs.find(x => /^en/i.test(x.lang));
    if(v) u.voice = v; u.lang = 'en-GB'; u.pitch = S.pitch || 1; u.rate = S.rate || 1; u.volume = Math.min(1, (SET.master ?? 1) * Math.max(.4, SET.music*1.3)); speechSynthesis.speak(u); }catch(e){} } }
function radioPick(L){ return L[Math.floor(Math.random()*L.length)]; }
/* move on to the next tune, with a link from the presenter */
function radioNext(first){ const S = RADIO_STATIONS[SET.radio], L = RADIO_LINKS[SET.radio]; if(!S || !S.list) return;
  const prev = RADIO.st===SET.radio ? S.list[RADIO.i % S.list.length] : null;
  if(RADIO.st!==SET.radio){ RADIO.st = SET.radio; RADIO.i = Math.floor(Math.random()*S.list.length); } else RADIO.i = (RADIO.i + 1) % S.list.length;
  const next = S.list[RADIO.i]; RADIO.until = 0;
  let text = first || !prev ? radioPick(L.intro) : (Math.random() < .2 ? radioPick(L.ad) + ' ' : '') + radioPick(L.link);
  text = text.replace('{prev}', radioTitle(prev)).replace('{next}', radioTitle(next)); radioSay(text, first || !prev); }
(function(){
  if(typeof midiCue!=='function') return; const m0 = midiCue;
  midiCue = function(){
    if(!radioOn() || (UI.screen==='gallery' && UI.jukebox)){ if(RADIO.st && !radioOn()){ RADIO.st = null; try{ speechSynthesis.cancel(); }catch(e){} } return m0(); }
    if(RADIO.st!==SET.radio) radioNext(true);
    const S = RADIO_STATIONS[SET.radio], f = S.list[RADIO.i % S.list.length], tr = (typeof OST!=='undefined' && OST.tracks) ? Object.values(OST.tracks).flat().find(x => x && x.file===f + '.mid') : null, style = tr ? tr.style : 'ost_soft';
    midiLoad(OST.dir + f + '.mid'); MIDI.title = radioTitle(f);
    // one play-through, then the next tune
    if(MIDI.song && MIDI.url===OST.dir + f + '.mid'){ const ST = MIDI_STYLES[style] || {}, len = MIDI.song.len/(ST.tempo || 1) + (ST.gap || 0);
      if(!RADIO.until) RADIO.until = now() + Math.min(240, Math.max(60, len)); else if(now() > RADIO.until) radioNext(false); }
    return style; };
  // the caption
  if(typeof draw==='function'){ const d0 = draw; draw = function(...a){ const r = d0(...a); try{ drawRadioCaption(); }catch(e){} return r; }; }
})();
function drawRadioCaption(){ const R = RADIO.cap; if(!R) return; const age = (performance.now() - RADIO.capT)/1000, life = 6 + R.text.length/22; if(age > life){ RADIO.cap = null; return; }
  const a = Math.min(1, age*3, (life - age)*1.5), w = 900, x = (W - w)/2, y = 84, h = 40 + Math.min(3, lines(R.text, w - 40, `15px ${FM || 'sans-serif'}`).length)*20 + 12;
  ctx.save(); ctx.globalAlpha = a; rr(x, y, w, h, 10); ctx.fillStyle = 'rgba(6,9,18,.88)'; ctx.fill(); ctx.strokeStyle = hexA(R.col, .6); ctx.lineWidth = 1.5; ctx.stroke();
  T(`📻 ${R.who}${R.dj ? ' · ' + R.dj : ''}`, x + 20, y + 24, { s:12, c:R.col, f:FD, w:700 }); para(R.text, x + 20, y + 50, w - 40, { s:15, lh:20, c:C.ink, max:3 }); ctx.restore(); }
function radioCycle(){ const ks = Object.keys(RADIO_STATIONS), i = ks.indexOf(SET.radio || 'ost'); SET.radio = ks[(i + 1) % ks.length]; if(SET.musicSrc==='synth' && SET.radio!=='ost') SET.musicSrc = 'ost'; if(typeof saveProfile==='function') saveProfile();
  if(SET.radio==='ost'){ try{ speechSynthesis.cancel(); }catch(e){} if(typeof toast==='function') toast('Music: the adaptive soundtrack.'); } }
