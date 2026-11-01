'use strict';
/* =========================================================================
   Spoken voices (optional, off by default): the browser's own text-to-speech
   reads the story aloud, with a different voice for each character.
     Settings → Audio → Spoken voices: Off · Dialogue · Full story
   Dialogue: only the lines people say ("..."), each in its speaker's voice.
   Full story: the narration too, in a narrator's voice. Crew chatter and
   enemy taunts are spoken too, in a voice that fits each crew member's race.
   Each character has a profile (which kind of system voice, pitch and pace);
   the speaker of a quote is the character named nearest to it in the text.
   ========================================================================= */
const CAST = [
  // the standard game
  ['Hale',        { g:'f', p:.9,  r:.95 }], ['Kross',      { g:'m', p:.75, r:.88 }], ['Pip',        { g:'f', p:1.7, r:1.1 }],
  ['Vance',       { g:'f', p:.95, r:.95 }], ['Harte',      { g:'f', p:1.1, r:1.15 }], ['Prynn',     { g:'f', p:.85, r:.95 }],
  ['Nell',        { g:'f', p:1.5, r:1.12 }], ['Salk',      { g:'m', p:1.05, r:1.1 }], ['Rook',      { g:'f', p:.8,  r:1.0 }],
  ['Lyle',        { g:'m', p:.65, r:.82 }], ['Wisp',       { g:'m', p:1.3, r:.9 }],  ['Ossery',     { g:'f', p:1.2, r:.9 }],
  ['Oracle',      { g:'f', p:.7,  r:.78 }], ['Sable',      { g:'f', p:.78, r:.95 }], ['Okoro',      { g:'f', p:1.0, r:1.0 }],
  ['Haldane',     { g:'m', p:1.1, r:1.08 }], ['Kade',      { g:'m', p:.7,  r:.95 }], ['Jory',       { g:'m', p:1.05, r:1.05 }],
  ['Strand',      { g:'m', p:.9,  r:1.0 }], ['Duke',       { g:'m', p:.85, r:.85 }], ['Marr',       { g:'f', p:.9,  r:.98 }],
  ['Tamsin',      { g:'f', p:1.25, r:1.1 }], ['Bram',      { g:'m', p:.7,  r:.85 }], ['Ezra',       { g:'m', p:.75, r:.8 }],
  ['Lucan',       { g:'m', p:1.0, r:1.05 }], ['Flick',     { g:'m', p:1.3, r:1.15 }], ['Grist',      { g:'m', p:.55, r:.85 }],
  ['Mags',        { g:'f', p:1.0, r:1.1 }],  ['Kestrel',   { g:'f', p:.9,  r:1.05 }], ['Oddly',      { g:'m', p:1.2, r:1.1 }],
  ['Orsk',        { g:'m', p:.8,  r:.9 }],   ['Vey',       { g:'m', p:1.25, r:1.1 }], ['Mott',       { g:'m', p:.85, r:.85 }],
  ['Vasque',      { g:'m', p:.9,  r:.9 }],   ['Petersen',  { g:'m', p:1.0, r:1.05 }],
  // Red Dwarf (fan campaign)
  ['Holly',       { g:'f', p:.92, r:.85 }], ['Lister',     { g:'m', p:.95, r:1.05 }], ['Rimmer',     { g:'m', p:1.18, r:1.12 }],
  ['Cat',         { g:'m', p:1.12, r:1.2 }], ['Kryten',    { g:'m', p:1.35, r:1.05 }], ['Kochanski', { g:'f', p:1.05, r:1.0 }],
  ['Ace',         { g:'m', p:.85, r:1.0 }],  ['Hogey',     { g:'m', p:1.1, r:1.25 }], ['toaster',    { g:'m', p:1.8, r:1.3 }],
  ['Simulant',    { g:'m', p:.5,  r:.8 }],   ['Inquisitor',{ g:'m', p:.45, r:.72 }], ['Camille',    { g:'f', p:1.1, r:.95 }],
  ['Hollister',   { g:'m', p:.8,  r:.95 }]
];
const NARRATOR = { g:'f', p:1.0, r:1.0 }, STRANGER = { g:'m', p:.95, r:1.0 };
const RACE_VOICE = { human:{ p:1, r:1 }, pebblekin:{ p:.55, r:.85 }, enjinn:{ p:1.35, r:1.15 }, voltan:{ p:1.6, r:.9 }, sloog:{ p:.8, r:.9 }, mantlis:{ p:.7, r:1.15 }, glassborn:{ p:1.5, r:.85 },
  rd_hologram:{ p:1.18, r:1.12 }, rd_felis:{ p:1.12, r:1.2 }, rd_mechanoid:{ p:1.35, r:1.05 }, rd_gelf:{ p:.6, r:.9 } };
const TTS = { voices:[], last:null, chat:0, ready:false };
function ttsOn(){ return typeof speechSynthesis!=='undefined' && SET.tts && SET.tts!=='off'; }
function ttsLoad(){ if(typeof speechSynthesis==='undefined') return; const v = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); if(v.length){ TTS.voices = v; TTS.ready = true; } }
if(typeof speechSynthesis!=='undefined'){ ttsLoad(); speechSynthesis.onvoiceschanged = ttsLoad; }
const FEMALE = /female|woman|zira|susan|hazel|libby|sonia|mia|maisie|aria|jenny|emma|ava|allison|samantha|victoria|karen|moira|tessa|serena|fiona|kate|amy|joanna|salli|kimberly|ivy|kendra|natasha|clara|catherine|google uk english female|google us english/i;
const MALE = /\bmale|man\b|david|mark|george|ryan|guy|davis|tony|james|daniel|alex|fred|oliver|arthur|rishi|aaron|tom|brian|matthew|justin|joey|eric|liam|thomas|william|google uk english male/i;
function pickVoice(prof, key){
  if(!TTS.ready) ttsLoad(); const V = TTS.voices; if(!V.length) return null;
  const fem = V.filter(v => FEMALE.test(v.name) && !/male/i.test(v.name.replace(/female/i, ''))), mal = V.filter(v => MALE.test(v.name) && !FEMALE.test(v.name));
  const pool = (prof.g==='f' ? fem : mal); const list = pool.length ? pool : V;
  return list[hashStr(key || 'x') % list.length];
}
function castFor(name){ if(!name) return null; const n = String(name).toLowerCase(); for(const [k, prof] of CAST) if(n.includes(k.toLowerCase())) return Object.assign({ key:k }, prof); return null; }
/* who says a quote: "...," says Kryten; else the character named closest before it */
const ATTRIB = /\b(says|said|asks|asked|adds|added|replies|replied|mutters|muttered|shouts|shouted|calls|called|whispers|whispered|snaps|snapped|sighs|sighed|beams|grins|laughs|tells|told|goes on|continues)\b/i;
function speakerOf(text, qStart, qEnd, title){
  const before = text.slice(Math.max(0, qStart - 140), qStart), after = text.slice(qEnd, qEnd + 60), quote = text.slice(qStart, qEnd); let best = null, bd = 1e9;
  const q = quote.replace(/^"/, ''), first = q.split(/[.,!?]/)[0].split(/\s+/).slice(0, 4).join(' ');   // "Commander Ilsa Vance. I want to..." or "I'm Nell" introduces the speaker
  for(const [k, prof] of CAST) if(new RegExp('\\b' + k + '\\b', 'i').test(first) || new RegExp("(I'm|I am|this is|name's|name is)[^.]{0,30}\\b" + k + '\\b', 'i').test(q)) return Object.assign({ key:k }, prof);
  const crew = typeof G!=='undefined' && G && G.ship ? G.ship.crew.filter(c => c.owner==='p' && !c.drone) : [];
  for(const c of crew){ const i = before.lastIndexOf(c.name); if(i >= 0 && before.length - i < bd){ bd = before.length - i; best = castFor(c.name) || Object.assign({ key:c.name, g:c.gender==='f' ? 'f' : 'm' }, RACE_VOICE[c.race] || {}); } }
  for(const [k, prof] of CAST){ const re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'); let m;
    while((m = re.exec(before))){ const d = before.length - m.index; if(d < bd){ bd = d; best = Object.assign({ key:k }, prof); } }
    re.lastIndex = 0; if((m = re.exec(after.slice(0, 45))) && ATTRIB.test(after.slice(0, m.index + k.length + 16))){ return Object.assign({ key:k }, prof); } }
  return best || castFor(title) || Object.assign({ key:'stranger' }, STRANGER);
}
/* break a scene into narration and quotes, each with its voice */
function ttsLines(text, title, full){
  const out = [], re = /"([^"]+)"/g; let m, last = 0; text = String(text || '');
  while((m = re.exec(text))){ if(full){ const nar = text.slice(last, m.index).trim(); if(nar.replace(/[.,;:!?\s]/g, '')) out.push({ t:nar, v:Object.assign({ key:'narrator' }, NARRATOR) }); }
    out.push({ t:m[1], v:speakerOf(text, m.index, m.index + m[0].length, title) }); last = m.index + m[0].length; }
  if(full){ const nar = text.slice(last).trim(); if(nar.replace(/[.,;:!?\s]/g, '')) out.push({ t:nar, v:Object.assign({ key:'narrator' }, NARRATOR) }); }
  return out; }
function ttsSay(lines, interrupt){
  if(!ttsOn() || !lines.length) return; if(interrupt) speechSynthesis.cancel();
  const vol = clamp((SET.master ?? 1) * (SET.ttsVol ?? 1), 0, 1);
  for(const l of lines){ const u = new SpeechSynthesisUtterance(l.t.replace(/\s+/g, ' ').slice(0, 400)); const v = pickVoice(l.v, l.v.key); if(v) u.voice = v;
    u.pitch = clamp(l.v.p ?? 1, 0, 2); u.rate = clamp((l.v.r ?? 1) * (SET.ttsRate ?? 1), .5, 2); u.volume = vol; speechSynthesis.speak(u); }
}
function ttsStop(){ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }
/* watch for new scenes and lines to speak */
function ttsTick(){
  if(!ttsOn()){ if(TTS.last){ ttsStop(); TTS.last = null; } return; }
  const m = typeof G!=='undefined' && G && UI.screen==='game' ? G.modal : null;
  if(m && ['event','msg','result'].includes(m.type)){
    const raw = m.type==='event' ? (m.inline ? m.inline.text : DATA.events[m.id] && DATA.events[m.id].text) : m.text;
    const text = m.type==='event' ? fillText(raw || '', m.ctx || {}) : raw;
    const key = (m.id || m.type) + '|' + String(text).slice(0, 80);
    if(text && key !== TTS.last){ TTS.last = key; const title = m.title || (m.id && DATA.events[m.id] && DATA.events[m.id].title) || ''; ttsSay(ttsLines(text, title, SET.tts==='full'), true); }
    return; }
  if(!m && TTS.last){ TTS.last = null; }
  // crew chatter and enemy taunts, in full mode, when nothing else is being said
  if(SET.tts==='full' && G && G.chat && G.chat.length && !speechSynthesis.speaking){ const b = G.chat[G.chat.length-1]; if(b && b !== TTS.chat && b.t > 2){ TTS.chat = b;
    const c = b.id && G.ship.crew.find(x => x.id===b.id); const rv = c ? (castFor(c.name) || Object.assign({ key:c.name, g:c.gender==='f' ? 'f' : 'm' }, RACE_VOICE[c.race] || {})) : Object.assign({ key:'enemy', g:'m' }, { p:.7, r:1 });
    ttsSay([{ t:String(b.text).replace(/^"|"$/g, ''), v:rv }], false); } }
}
if(typeof navigator!=='undefined' && navigator.userAgent && typeof speechSynthesis!=='undefined') setInterval(() => { try{ ttsTick(); }catch(e){} }, 300);
