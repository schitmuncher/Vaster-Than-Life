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
  let t = M.tracks && M.tracks[cue]; if(Array.isArray(t)) t = t.length ? t[((typeof G!=='undefined' && G ? G.sector : 1) - 1) % t.length] : null;
  if(typeof t === 'string') t = { file:t }; return t && t.file ? t : { file:M.file };
}
/* which arrangement fits the moment (null: the normal soundtrack) */
function midiCue(){
  const C = UI.screen==='select' ? (typeof campHangarDef==='function' ? campHangarDef() : null) : (typeof campDef==='function' && typeof G!=='undefined' && G ? campDef() : null);
  const M = C && C.music; if(!M || !M.file) return null; const cues = Object.assign({ hangar:'lounge', start:'rock', explore:'musicbox', strange:'eerie', combat:'battle', boss:'boss', win:'victory' }, M.cues || {});
  const key = (() => {
    if(UI.screen==='select') return 'hangar'; if(UI.screen==='win') return 'win'; if(UI.screen!=='game' || !G) return null;
    if(G.enemy && !G.enemy.dead) return G.boss ? 'boss' : 'combat';
    if(G.sector <= 1 && (G.stats.jumps||0) < 2) return 'start';
    const sd = typeof sectorDef==='function' ? sectorDef() : {}; if((M.strange || []).includes(sd.id) || (M.strange || []).includes(G.sectorType)) return 'strange';
    return 'explore'; })();
  if(!key) return null;
  const tr = midiTrackFor(M, key); midiLoad('mods/' + tr.file);
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
  if(SET.music <= 0) return; const dur = Math.min(2.5, n.d*k), v = (.03 + .045*n.v) * S.vol, rev = S.pad ? .35 : .12;
  if(n.ch === 9){ if(!S.drums) return;   // drums: kick, snare, hats
    if(n.n <= 36) osc('sine', 120, t, .14, v*2.2, { to:42, slide:.12, dest:MUSG });
    else if(n.n <= 40) nz(t, .09, v*1.4, { hp:1400, dest:MUSG });
    else if(S.drums >= 2) nz(t, .03, v*.7, { hp:7000, dest:MUSG });
    return; }
  const f = 440 * Math.pow(2, (n.n + S.tr - 69)/12), bass = n.n + S.tr < 50;
  if(bass){ if(S.bass) mnote(f, t, dur, S.bass, v*.85, { a:.01, lp:S.cut*.5 }); return; }
  mnote(f, t, dur, S.lead, v, { a:S.pad ? Math.min(.2, dur*.3) : .01, lp:S.cut, detune:S.detune || 0, rev });
  if(S.pad) mnote(f/2, t, dur*1.2, 'triangle', v*.3, { a:Math.min(.35, dur*.4), lp:S.cut*.5, rev });
}
