'use strict';
/* =========================================================================
   A small MIDI player for campaign music. A campaign can ship a .mid file
   ("music": { "file": "my-theme.mid", "cues": {...} }) and the game plays it
   at different points of the run, each time arranged in a different style:
   a slow lounge version in the hangar, a rock version at the send-off, a
   music-box version on quiet beacons, an eerie one in strange sectors, a
   battle version in fights and a big one when you win. The notes come from
   the file; the arrangement (instruments, tempo, key, drums) from the style.
   ========================================================================= */
function parseMidi(buf){
  const d = new DataView(buf); let p = 0;
  const str = n => { let s = ''; for(let i = 0; i < n; i++) s += String.fromCharCode(d.getUint8(p++)); return s; };
  const u32 = () => { const v = d.getUint32(p); p += 4; return v; }, u16 = () => { const v = d.getUint16(p); p += 2; return v; };
  if(str(4) !== 'MThd') throw new Error('not a MIDI file'); const hl = u32(); u16(); const ntr = u16(), div = u16(); p = 8 + hl;
  const evs = [];
  for(let t = 0; t < ntr && p < d.byteLength; t++){
    if(str(4) !== 'MTrk'){ break; } const len = u32(), end = p + len; let tick = 0, run = 0;
    const vlq = () => { let v = 0, b; do { b = d.getUint8(p++); v = (v << 7) | (b & 0x7f); } while(b & 0x80); return v; };
    while(p < end){ tick += vlq(); let st = d.getUint8(p);
      if(st & 0x80){ p++; if(st < 0xf0) run = st; } else st = run;
      const hi = st & 0xf0, ch = st & 0x0f;
      if(st === 0xff){ const ty = d.getUint8(p++), l = vlq(); if(ty === 0x51 && l === 3) evs.push({ tick, tempo:(d.getUint8(p) << 16) | (d.getUint8(p+1) << 8) | d.getUint8(p+2) }); p += l; }
      else if(st === 0xf0 || st === 0xf7){ p += vlq(); }
      else if(hi === 0x90 || hi === 0x80){ const n = d.getUint8(p++), v = d.getUint8(p++); evs.push({ tick, on:hi === 0x90 && v > 0, n, v, ch }); }
      else if(hi === 0xa0 || hi === 0xb0 || hi === 0xe0){ p += 2; }
      else if(hi === 0xc0 || hi === 0xd0){ p += 1; }
      else { p = end; } }
    p = end; }
  evs.sort((a, b) => a.tick - b.tick || (a.tempo ? -1 : 0));
  // ticks to seconds through the tempo map, then pair note-ons with note-offs
  let us = 500000, lastTick = 0, sec = 0; const open = {}, notes = [];
  for(const e of evs){ sec += (e.tick - lastTick) * us / 1e6 / div; lastTick = e.tick;
    if(e.tempo){ us = e.tempo; continue; } const k = e.ch*128 + e.n;
    if(e.on){ (open[k] = open[k] || []).push({ t:sec, v:e.v }); }
    else if(open[k] && open[k].length){ const o = open[k].shift(); notes.push({ t:o.t, d:Math.max(.05, sec - o.t), n:e.n, v:o.v/127, ch:e.ch }); } }
  notes.sort((a, b) => a.t - b.t);
  const len = notes.length ? Math.max(...notes.map(n => n.t + n.d)) : 0;
  return { notes, len };
}
/* how each arrangement sounds */
const MIDI_STYLES = {
  lounge:  { tempo:.8,  tr:0,   lead:'triangle', bass:'sine',     pad:true,  drums:0,  cut:1800, vol:.7,  gap:4 },
  rock:    { tempo:1.0, tr:0,   lead:'sawtooth', bass:'square',   pad:false, drums:2,  cut:3200, vol:.8,  gap:2 },
  musicbox:{ tempo:.9,  tr:12,  lead:'sine',     bass:null,       pad:false, drums:0,  cut:5000, vol:.55, gap:8, sparse:.4 },
  eerie:   { tempo:.65, tr:-5,  lead:'sine',     bass:'sine',     pad:true,  drums:0,  cut:900,  vol:.6,  gap:6, detune:18, sparse:.3 },
  battle:  { tempo:1.18,tr:-12, lead:'square',   bass:'sawtooth', pad:false, drums:3,  cut:2600, vol:.75, gap:0 },
  boss:    { tempo:1.08,tr:-13, lead:'sawtooth', bass:'sawtooth', pad:true,  drums:3,  cut:1600, vol:.8,  gap:0, detune:10 },
  victory: { tempo:1.0, tr:2,   lead:'sawtooth', bass:'triangle', pad:true,  drums:1,  cut:4000, vol:.85, gap:3 },
  // plainer ones for tunes written to be played as they are
  blues:   { tempo:1.0, tr:0,   lead:'triangle', bass:'triangle', pad:false, drums:2,  cut:2400, vol:.75, gap:1 },
  funk:    { tempo:1.0, tr:0,   lead:'square',   bass:'sawtooth', pad:false, drums:2,  cut:2000, vol:.68, gap:0 },
  lullaby: { tempo:1.0, tr:0,   lead:'sine',     bass:'sine',     pad:true,  drums:0,  cut:1400, vol:.6,  gap:3, detune:8 },
  march:   { tempo:1.0, tr:0,   lead:'square',   bass:'sawtooth', pad:false, drums:3,  cut:2600, vol:.72, gap:0 },
  chirpy:  { tempo:1.0, tr:0,   lead:'triangle', bass:'square',   pad:false, drums:2,  cut:3600, vol:.62, gap:1 }
};
/* the game's own soundtrack (music/, written by tools/compose-ost.py): each part on its own channel gets its own
   instrument. w wave, v volume, a attack, lp filter, det second detuned voice, rev reverb, bell a ringing overtone */
const OST_INST = {
  bass:   { w:'sawtooth', v:.95, a:.006, lp:520 },   bassS:{ w:'square', v:.8, a:.006, lp:700 },   bassR:{ w:'triangle', v:1.15, a:.01, lp:900 },
  pad:    { w:'sawtooth', v:.32, a:.35, lp:1300, det:9, rev:.45 }, padS:{ w:'triangle', v:.42, a:.5, lp:1600, det:7, rev:.6 },
  stab:   { w:'square', v:.34, a:.004, lp:2200, rev:.2 },          keys:{ w:'triangle', v:.45, a:.008, lp:3000, rev:.3 },
  lead:   { w:'sawtooth', v:.62, a:.012, lp:2800, det:5, rev:.28 }, leadS:{ w:'square', v:.55, a:.01, lp:2400, rev:.25 },
  flute:  { w:'triangle', v:.75, a:.05, lp:3600, rev:.4 },          bellL:{ w:'sine', v:.7, a:.004, lp:6000, rev:.55, bell:true },
  arp:    { w:'square', v:.26, a:.003, lp:3200, rev:.25 },          arpS:{ w:'triangle', v:.36, a:.003, lp:4200, rev:.4 },
  bell:   { w:'sine', v:.42, a:.003, lp:7000, rev:.55, bell:true },  harm:{ w:'triangle', v:.4, a:.02, lp:2600, rev:.3 } };
const ost = (bass, pad, lead, arp, harm, o) => Object.assign({ tempo:1, tr:0, vol:.85, gap:0, drums:3, kit:true, inst:{ 0:OST_INST[bass], 1:OST_INST[pad], 2:OST_INST[lead], 3:OST_INST[arp], 4:OST_INST[harm] } }, o || {});
Object.assign(MIDI_STYLES, {
  ost_anthem: ost('bass', 'pad', 'lead', 'arp', 'harm'),
  ost_funk:   ost('bassS', 'stab', 'leadS', 'arpS', 'keys', { vol:.8 }),
  ost_arp:    ost('bass', 'pad', 'lead', 'arp', 'harm'),
  ost_soft:   ost('bassR', 'padS', 'flute', 'arpS', 'bell', { vol:.8 }),
  ost_ambient:ost('bassR', 'padS', 'bellL', 'arpS', 'bell', { vol:.8, gap:2 }),
  ost_waltz:  ost('bassR', 'keys', 'bellL', 'arpS', 'flute', { vol:.8 }),
  ost_eerie:  ost('bassR', 'padS', 'flute', 'arpS', 'bell', { vol:.75, gap:2 }),
  ost_rock:   ost('bass', 'stab', 'lead', 'arp', 'harm', { vol:.9 }),
  ost_break:  ost('bassS', 'stab', 'leadS', 'arp', 'harm', { vol:.88 }),
  ost_bossa:  ost('bassR', 'keys', 'flute', 'arpS', 'bell', { vol:.8 }) });
const OST = { dir:'music/', cues:{}, tracks:{
  title:{ file:'title.mid', style:'ost_anthem' }, hangar:{ file:'hangar.mid', style:'ost_funk' }, start:{ file:'start.mid', style:'ost_arp' },
  explore:[{ file:'explore1.mid', style:'ost_soft' }, { file:'explore2.mid', style:'ost_arp' }, { file:'explore3.mid', style:'ost_ambient' }, { file:'explore4.mid', style:'ost_waltz' }, { file:'explore5.mid', style:'ost_funk' }],
  strange:[{ file:'strange1.mid', style:'ost_ambient' }, { file:'strange2.mid', style:'ost_eerie' }],
  combat:[{ file:'combat1.mid', style:'ost_rock' }, { file:'combat2.mid', style:'ost_rock' }, { file:'combat3.mid', style:'ost_arp' }, { file:'combat4.mid', style:'ost_break' }],
  boss:{ file:'boss.mid', style:'ost_rock' }, store:{ file:'store.mid', style:'ost_bossa' }, win:{ file:'win.mid', style:'ost_anthem' }, over:{ file:'over.mid', style:'ost_ambient' } },
  strange:['nebula', 'voltan', 'glass', 'prismfields', 'gf_graveyard', 'pv_vaults', 'nr_expanse', 'ss_hollow', 'hz_maze', 'hz_pulsarfield'] };
const OST_TITLES = { title:'Vaster Than Life', hangar:'Dry Dock', start:'Departure', explore1:'The Long Way Round', explore2:'Beacon Lights', explore3:'Drift', explore4:'Quiet Stars',
  explore5:'Engine Room', strange1:'Nebula Hymn', strange2:'Static', combat1:'Shields Up', combat2:'Boarding Party', combat3:'Red Alert', combat4:'Dogfight', boss:'Flaggship', store:'Haggle Bossa', win:'Homecoming', over:'Drifting On' };
const MIDI = { song:null, url:null, loading:false, style:null, next:0, idx:0, t0:0, loopAt:0 };
const MIDI_CACHE = {};   // parsed songs by url, so a campaign can switch tunes per cue without refetching
function midiLoad(url){
  if(MIDI.url === url && (MIDI.song || MIDI.loading)) return;
  if(MIDI_CACHE[url]){ MIDI.url = url; MIDI.song = MIDI_CACHE[url]; MIDI.loading = false; MIDI.idx = 0; MIDI.t0 = (typeof now==='function' ? now() : 0) + .4; return; }
  if(MIDI.loading && MIDI.url !== url && MIDI.pending === url) return;
  MIDI.url = url; MIDI.pending = url; MIDI.song = null; MIDI.loading = true;
  const done = b => { const s = parseMidi(b); MIDI_CACHE[url] = s; if(MIDI.url === url){ MIDI.song = s; MIDI.loading = false; MIDI.idx = 0; MIDI.t0 = (typeof now==='function' ? now() : 0) + .4; } },
        fail = () => { if(MIDI.url === url){ MIDI.loading = false; MIDI.song = null; } };
  // some hosts won't serve .mid files: then use the base64 copy beside it (my-theme.mid.json, { "base64": "..." })
  const viaJson = () => fetch(url + '.json').then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }).then(j => { const s = atob(j.base64), a = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); done(a.buffer); }).catch(fail);
  fetch(url).then(r => { if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => { try{ done(b); }catch(e){ viaJson(); } }).catch(viaJson);
}
/* which file plays for a cue: music.tracks { cue: 'file.mid' | { file, style } | [ several, taking turns by sector ] }, else music.file */
function midiTrackFor(M, cue){
  let t = M.tracks && M.tracks[cue]; if(Array.isArray(t)) t = t.length ? t[Math.abs((cue==='combat' ? (MIDI.fightN || 0) + ((typeof G!=='undefined' && G ? G.sector : 1)) : (typeof G!=='undefined' && G ? G.sector : 1) - 1)) % t.length] : null;
  if(typeof t === 'string') t = { file:t }; return t && t.file ? t : { file:M.file };
}
/* which arrangement fits the moment (null: the normal soundtrack) */
function midiCue(){
  const C = UI.screen==='select' ? (typeof campHangarDef==='function' ? campHangarDef() : null) : (typeof campDef==='function' && typeof G!=='undefined' && G && UI.screen==='game' ? campDef() : null);
  let M = C && C.music && C.music.file ? C.music : null;
  if(!M){ if(typeof SET!=='undefined' && SET.musicSrc==='synth') return null; M = OST; }
  const cues = Object.assign({ hangar:'lounge', start:'rock', explore:'musicbox', strange:'eerie', combat:'battle', boss:'boss', win:'victory' }, M.cues || {});
  const key = (() => {
    if(UI.screen==='select') return 'hangar'; if(UI.screen==='win') return 'win';
    if(UI.screen==='over') return M===OST ? 'over' : null;
    if(UI.screen!=='game' || !G) return M===OST ? 'title' : null;
    if(G.enemy && !G.enemy.dead) return G.boss ? 'boss' : 'combat';
    if(M===OST && G.modal && G.modal.type==='store') return 'store';
    if(G.sector <= 1 && (G.stats.jumps||0) < 2) return 'start';
    const sd = typeof sectorDef==='function' ? sectorDef() : {}; if((M.strange || []).includes(sd.id) || (M.strange || []).includes(G.sectorType) || (M===OST && G.nebula)) return 'strange';
    return 'explore'; })();
  if(!key) return null;
  if(key==='combat' && MIDI.lastKey!=='combat') MIDI.fightN = (MIDI.fightN || 0) + 1; MIDI.lastKey = key;
  const tr = midiTrackFor(M, key); if(!tr || !tr.file) return null; midiLoad((M.dir || 'mods/') + tr.file); MIDI.title = M===OST ? OST_TITLES[tr.file.replace(/\.mid$/, '')] : null;
  return tr.style && MIDI_STYLES[tr.style] ? tr.style : cues[key];
}
function midiActive(){ return !!(MIDI.style && MIDI.song && SET.music > 0); }
/* called from the music timer: schedule the next half second of notes */
function midiTick(){
  if(!AC) return; const want = SET.music > 0 ? midiCue() : null;
  if(want !== MIDI.style){ MIDI.style = want; MIDI.idx = 0; MIDI.t0 = now() + .4; }
  if(!want || !MIDI.song) return; const S = MIDI_STYLES[want] || MIDI_STYLES.lounge, song = MIDI.song, k = 1/S.tempo, ahead = now() + .5;
  let guard = 0;
  while(guard++ < 400){
    if(MIDI.idx >= song.notes.length){ MIDI.t0 += song.len*k + (S.gap||0); MIDI.idx = 0; }
    const n = song.notes[MIDI.idx], t = MIDI.t0 + n.t*k; if(t > ahead) break; MIDI.idx++;
    if(t < now() - .05) continue;
    if(S.sparse && ((n.n*7 + MIDI.idx) % 10)/10 < S.sparse && n.n >= 48) continue;   // thinner arrangements drop some notes (the same ones each time)
    midiNote(n, t, S, k);
  }
}
function midiNote(n, t, S, k){
  if(SET.music <= 0) return; const dur = Math.min(S.inst ? 6 : 2.5, n.d*k), v = (.03 + .045*n.v) * S.vol;
  if(n.ch === 9){ if(!S.drums) return; if(S.kit) return midiDrum(n.n, t, v);
    if(n.n <= 36) osc('sine', 120, t, .14, v*2.2, { to:42, slide:.12, dest:MUSG });
    else if(n.n <= 40) nz(t, .09, v*1.4, { hp:1400, dest:MUSG });
    else if(S.drums >= 2) nz(t, .03, v*.7, { hp:7000, dest:MUSG });
    return; }
  const f = 440 * Math.pow(2, (n.n + S.tr - 69)/12);
  if(S.inst){ const I = S.inst[n.ch] || S.inst[2]; if(!I) return; const a = Math.min(I.a, dur*.45), o = { a, lp:I.lp, rev:I.rev || 0 };
    mnote(f, t, dur, I.w, v*I.v, o); if(I.det) mnote(f, t, dur, I.w, v*I.v*.7, Object.assign({}, o, { detune:I.det }));
    if(I.bell) mnote(f*2.76, t, Math.min(dur, .7), 'sine', v*I.v*.22, { a:.002, rev:I.rev || 0 });
    return; }
  const bass = n.n + S.tr < 50, rev = S.pad ? .35 : .12;
  if(bass){ if(S.bass) mnote(f, t, dur, S.bass, v*.85, { a:.01, lp:S.cut*.5 }); return; }
  mnote(f, t, dur, S.lead, v, { a:S.pad ? Math.min(.2, dur*.3) : .01, lp:S.cut, detune:S.detune || 0, rev });
  if(S.pad) mnote(f/2, t, dur*1.2, 'triangle', v*.3, { a:Math.min(.35, dur*.4), lp:S.cut*.5, rev });
}
/* the soundtrack's drum kit */
function midiDrum(n, t, v){ const D = { dest:MUSG };
  switch(n){
    case 35: case 36: osc('sine', 150, t, .16, v*2.6, { to:44, slide:.11, dest:MUSG }); nz(t, .012, v*.6, { hp:2500, dest:MUSG }); break;
    case 38: case 40: nz(t, .15, v*1.5, { bp:1800, q:.7, dest:MUSG, rev:.12 }); osc('triangle', 190, t, .07, v*.9, { to:150, dest:MUSG }); break;
    case 39: for(const d of [0, .011, .024]) nz(t + d, d ? .02 : .12, v*1.2, { bp:1300, q:1.2, dest:MUSG, rev:.15 }); break;
    case 37: osc('square', 880, t, .025, v*.5, D); nz(t, .02, v*.5, { hp:3200, dest:MUSG }); break;
    case 42: case 44: nz(t, .035, v*.55, { hp:8000, dest:MUSG }); break;
    case 46: nz(t, .22, v*.45, { hp:7000, dest:MUSG }); break;
    case 49: case 57: nz(t, 1.4, v*.55, { hp:5200, dest:MUSG, rev:.3 }); break;
    case 51: case 59: nz(t, .25, v*.28, { bp:9000, q:2, dest:MUSG }); osc('triangle', 3200, t, .18, v*.12, D); break;
    case 41: case 43: case 45: case 47: case 48: case 50: { const f = { 41:90, 43:105, 45:120, 47:150, 48:175, 50:200 }[n]; osc('sine', f, t, .28, v*1.8, { to:f*.62, slide:.25, dest:MUSG, rev:.15 }); break; }
    case 69: case 70: nz(t, .05, v*.32, { hp:6500, dest:MUSG }); break;
    default: nz(t, .04, v*.4, { hp:5000, dest:MUSG });
  }
}
